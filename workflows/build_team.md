# Workflow: Build a New Team

## Objective

Design and register a new agentic team — a collection of agents with defined roles and hierarchy — that can be assigned tasks via the orchestrator.

## Required Inputs

- **Team purpose**: What does this team produce? (e.g., "Researches competitive landscapes", "Writes and edits long-form content")
- **Roles needed**: What distinct functions does the work require?
- **Delegation pattern**: Is it flat (one manager + specialists) or hierarchical (multiple layers)?

## Process

### Step 1: Map the Roles

For each distinct function the work requires, write down:
- A one-line role description
- The specific expertise or perspective they bring
- What input they need
- What output they must produce

Aim for 2-5 agents per team. If you have more, consider hierarchy (a Lead delegating to Workers).

### Step 2: Define Each Agent

For every role, create a markdown file in `agents/`:

```bash
cp agents/_template.md agents/<agent_id>.md
```

Fill in exactly four sections:

1. **Role**: Identity, expertise, and disposition (2-4 sentences)
2. **Input**: The JSON schema the agent receives
3. **Process**: Numbered steps and rules the agent must follow
4. **Output**: The strict JSON schema the agent must return

Keep each agent narrow. "Writer" is a good agent. "Writer-and-Editor-and-Publisher" is three agents.

### Step 3: Define the Team

Create a YAML file in `teams/`:

```bash
cp teams/_template.yaml teams/<team_id>.yaml
```

Set:
- `team`: snake_case ID (must match filename)
- `name`, `description`
- `entry_agent`: The agent that receives the task first
- `agents`: List every agent with its `file` path and `manages` list
- `use_translator: true` to auto-convert free-form briefs into structured ones

### Step 4: Validate

Run a dry test with a simple task:

```bash
python tools/run_team.py <team_id> "A simple test task"
```

Check the run directory under `.tmp/runs/<run_id>/` for:
- Each agent's pass1 JSON (valid schema?)
- Delegation artifacts (expected subordinates called?)
- Final output (matches your goal?)

### Step 5: Iterate

If an agent produced bad output:
1. Read its pass1 artifact
2. Identify whether the issue is with Role, Input handling, Process rules, or Output format
3. Refine the corresponding section of the agent markdown
4. Re-run the test

## Design Guidelines

- **One agent, one job**: Narrow scope beats wide scope. Delegation is cheap.
- **Deterministic outputs**: Always enforce a strict JSON schema. Free-form prose makes chaining fragile.
- **Explicit delegation rules**: Only list agents in `manages` that actually should be called. The orchestrator rejects illegal delegations.
- **Reuse agents**: An agent can appear on multiple teams with different `manages` lists. Good candidates: `fact_checker`, `editor`, `summarizer`.
- **Avoid deep hierarchies**: 2-3 levels is usually enough. Deeper trees amplify errors at each hop.

## Expected Output

- A new YAML file in `teams/`
- One or more new markdown files in `agents/`
- A successful test run with a final output that matches expectations

## Edge Cases

| Issue | Cause | Fix |
|-------|-------|-----|
| `Circular delegation detected` | Agent A manages B, B manages A | Remove the cycle in team YAML |
| `manages unknown agent 'X'` | Typo in `manages` list | Add `X` to agents list or fix the name |
| Agent returns invalid JSON | Weak Output section in agent markdown | Tighten the Output schema; add "return ONLY JSON" |
| Agent ignores delegation | Agent didn't emit `status: needs_delegation` | Clarify in Process when to delegate |
| Wrong agent synthesized output | `entry_agent` set incorrectly | Fix `entry_agent` in team YAML |
