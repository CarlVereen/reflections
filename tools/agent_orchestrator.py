"""
Agent orchestrator for hierarchical teams.

Loads a team YAML, runs the entry agent with a task, executes any
delegations recursively, and returns the final output.

Artifact layout per run:
    .tmp/runs/<run_id>/
        brief.json                     # Structured brief used as input
        <agent_id>_pass1.json          # First call (plan + delegations)
        <agent_id>_<sub>_delegation.json  # Subordinate result
        <agent_id>_final.json          # Final synthesized output
        final_output.json              # Top-level team output

Usage:
    from agent_orchestrator import run_team
    result = run_team("content_team", "Write a blog post about X")
"""

import json
import os
import re
import sys
import time
import uuid

import yaml

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from claude_client import call_claude

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAMS_DIR = os.path.join(PROJECT_ROOT, "teams")
RUNS_DIR = os.path.join(PROJECT_ROOT, ".tmp", "runs")


# ────────────────────────────────────────────────────────────────
# Loading
# ────────────────────────────────────────────────────────────────

def load_team(team_id):
    """Load a team YAML config by ID."""
    path = os.path.join(TEAMS_DIR, f"{team_id}.yaml")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Team config not found: {path}")

    with open(path) as f:
        team = yaml.safe_load(f)

    # Index agents by id for quick lookup
    team["_agents_by_id"] = {a["id"]: a for a in team["agents"]}

    _validate_team(team)
    return team


def _validate_team(team):
    """Check for missing references and circular delegation."""
    agent_ids = set(team["_agents_by_id"].keys())

    if team["entry_agent"] not in agent_ids:
        raise ValueError(f"entry_agent '{team['entry_agent']}' not in agents list")

    for agent in team["agents"]:
        for sub in agent.get("manages", []):
            if sub not in agent_ids:
                raise ValueError(f"Agent '{agent['id']}' manages unknown agent '{sub}'")

    # Detect cycles via DFS
    def has_cycle(node, visiting, visited):
        if node in visiting:
            return True
        if node in visited:
            return False
        visiting.add(node)
        for sub in team["_agents_by_id"][node].get("manages", []):
            if has_cycle(sub, visiting, visited):
                return True
        visiting.remove(node)
        visited.add(node)
        return False

    for agent_id in agent_ids:
        if has_cycle(agent_id, set(), set()):
            raise ValueError(f"Circular delegation detected involving '{agent_id}'")


def load_agent_spec(agent_file):
    """Parse an agent markdown file. Returns {frontmatter, body}."""
    path = os.path.join(PROJECT_ROOT, agent_file)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Agent file not found: {path}")

    with open(path) as f:
        content = f.read()

    # Parse YAML frontmatter
    fm_match = re.match(r"^---\n(.*?)\n---\n(.*)$", content, re.DOTALL)
    if fm_match:
        frontmatter = yaml.safe_load(fm_match.group(1))
        body = fm_match.group(2).strip()
    else:
        frontmatter = {}
        body = content.strip()

    return {"frontmatter": frontmatter, "body": body}


# ────────────────────────────────────────────────────────────────
# Prompt construction
# ────────────────────────────────────────────────────────────────

def build_system_prompt(agent_spec, team, manages_list):
    """Build the system prompt for an agent from its spec."""
    body = agent_spec["body"]

    team_context = (
        f"\n\n---\n"
        f"TEAM CONTEXT:\n"
        f"You are on the '{team['name']}' team: {team['description']}\n"
    )

    if manages_list:
        team_context += f"You may delegate to these subordinates: {', '.join(manages_list)}\n"
    else:
        team_context += "You have no subordinates. You must complete the task yourself.\n"

    team_context += (
        "\nCRITICAL: Your response MUST be valid JSON matching the Output schema in your role definition. "
        "No markdown, no code fences, no commentary outside the JSON object."
    )

    return body + team_context


def build_user_message(input_data):
    """Serialize the input data as a JSON user message."""
    return f"INPUT:\n```json\n{json.dumps(input_data, indent=2)}\n```"


def build_synthesis_message(original_input, delegation_results):
    """Build the user message for the synthesis pass after delegations run."""
    return (
        "INPUT (original):\n"
        f"```json\n{json.dumps(original_input, indent=2)}\n```\n\n"
        "DELEGATION RESULTS (from your subordinates):\n"
        f"```json\n{json.dumps(delegation_results, indent=2)}\n```\n\n"
        "Synthesize the subordinate outputs into your final deliverable. "
        "Return JSON with status='complete' and the synthesized work in 'result'. "
        "Do not delegate again."
    )


# ────────────────────────────────────────────────────────────────
# Parsing
# ────────────────────────────────────────────────────────────────

def parse_agent_output(text):
    """Parse agent JSON output, stripping any stray fences or prose."""
    cleaned = text.strip()

    # Strip markdown code fences if present
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()

    # Try direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fallback: extract first {...} block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Agent returned invalid JSON:\n{text[:500]}")


# ────────────────────────────────────────────────────────────────
# Execution
# ────────────────────────────────────────────────────────────────

def _save_artifact(run_dir, name, data):
    os.makedirs(run_dir, exist_ok=True)
    path = os.path.join(run_dir, f"{name}.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def run_agent(agent_id, input_data, team, run_dir, depth=0):
    """Run a single agent, recursively executing any delegations.

    Args:
        agent_id: The agent's ID in the team roster.
        input_data: JSON-serializable input (usually a brief or sub-task).
        team: Loaded team dict.
        run_dir: Directory to save artifacts into.
        depth: Recursion depth (for logging indentation).

    Returns:
        dict: The agent's final output (parsed JSON).
    """
    indent = "  " * depth
    agent_entry = team["_agents_by_id"][agent_id]
    agent_spec = load_agent_spec(agent_entry["file"])
    model = agent_entry.get("model", team.get("default_model", "claude-sonnet-4-6"))
    manages = agent_entry.get("manages", [])

    print(f"{indent}▶ {agent_id} ({agent_spec['frontmatter'].get('role', '?')})")

    system = build_system_prompt(agent_spec, team, manages)
    user = build_user_message(input_data)

    # Pass 1: Plan + optional delegations
    response = call_claude(system, user, model=model)
    parsed = parse_agent_output(response)
    _save_artifact(run_dir, f"{agent_id}_pass1", parsed)

    status = parsed.get("status", "complete")
    delegations = parsed.get("delegations", []) if status == "needs_delegation" else []

    if not delegations:
        _save_artifact(run_dir, f"{agent_id}_final", parsed)
        return parsed

    # Execute delegations
    delegation_results = []
    for delegation in delegations:
        sub_id = delegation.get("agent_id")
        sub_task = delegation.get("task", {})

        if sub_id not in manages:
            print(f"{indent}  ✗ Refusing illegal delegation from {agent_id} → {sub_id}")
            delegation_results.append({
                "from_agent": sub_id,
                "error": f"Agent '{agent_id}' is not permitted to delegate to '{sub_id}'",
            })
            continue

        sub_result = run_agent(sub_id, sub_task, team, run_dir, depth + 1)
        _save_artifact(run_dir, f"{agent_id}_to_{sub_id}_delegation", {
            "task": sub_task,
            "result": sub_result,
        })
        delegation_results.append({
            "from_agent": sub_id,
            "result": sub_result.get("result", sub_result),
        })

    # Pass 2: Synthesize
    print(f"{indent}  ↺ {agent_id} synthesizing {len(delegation_results)} result(s)")
    synthesis_user = build_synthesis_message(input_data, delegation_results)
    response2 = call_claude(system, synthesis_user, model=model)
    final = parse_agent_output(response2)
    _save_artifact(run_dir, f"{agent_id}_final", final)
    return final


def run_team(team_id, task, run_id=None):
    """Run a team on a task.

    Args:
        team_id: Team YAML filename without extension (e.g., "content_team").
        task: Either a free-form string (will be translated if use_translator=true)
              or a dict matching the structured brief schema.
        run_id: Optional unique run identifier. Auto-generated if not provided.

    Returns:
        dict: The entry agent's final output.
    """
    team = load_team(team_id)
    run_id = run_id or f"{team_id}_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    run_dir = os.path.join(RUNS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)

    print(f"═══ Team: {team['name']} ═══")
    print(f"Run: {run_id}")
    print(f"Artifacts: {run_dir}\n")

    # Translate free-form input if needed
    if isinstance(task, str) and team.get("use_translator", False):
        print("▶ translator (Brief Translator)")
        translator_spec = load_agent_spec("agents/translator.md")
        trans_input = {
            "raw_brief": task,
            "team_description": team.get("description", ""),
        }
        system = build_system_prompt(translator_spec, team, [])
        user = build_user_message(trans_input)
        response = call_claude(system, user, model=team.get("default_model"))
        translated = parse_agent_output(response)
        _save_artifact(run_dir, "translator_final", translated)
        brief = translated["result"]
        print(f"  Objective: {brief.get('objective', '')}\n")
    elif isinstance(task, str):
        brief = {"objective": task, "context": "", "constraints": [], "deliverables": []}
    else:
        brief = task

    _save_artifact(run_dir, "brief", brief)

    # Run the entry agent
    entry_input = {"brief": brief, "context_artifacts": []}
    final = run_agent(team["entry_agent"], entry_input, team, run_dir)

    _save_artifact(run_dir, "final_output", final)
    print(f"\n═══ Complete ═══")
    print(f"Final output saved to: {os.path.join(run_dir, 'final_output.json')}")
    return final
