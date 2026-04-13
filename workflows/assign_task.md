# Workflow: Assign a Task to a Team

## Objective

Hand off a task to an existing agentic team and receive a structured output.

## Required Inputs

- **Team ID**: An existing team defined in `teams/<team_id>.yaml`
- **Task**: Either free-form text OR a structured brief

## Process

### Option A: Free-Form Task

```bash
python tools/run_team.py <team_id> "Your task description here"
```

If the team has `use_translator: true`, the orchestrator first invokes the `translator` agent to convert your text into a structured brief, then hands it to the entry agent.

### Option B: Structured Brief

Create a JSON file with your brief:

```json
{
  "objective": "Single-sentence description of the goal",
  "context": "Background, audience, situation",
  "constraints": ["Word count under 500", "Formal tone"],
  "deliverables": ["Headline", "Body copy", "CTA"]
}
```

Then run:

```bash
python tools/run_team.py <team_id> --brief path/to/brief.json
```

### Option C: List Available Teams

```bash
python tools/run_team.py --list
```

## Expected Output

- Console output shows each agent being invoked (with indentation for depth)
- Final result printed as JSON
- All artifacts saved to `.tmp/runs/<run_id>/`:
  - `brief.json` — The structured brief used as input
  - `<agent>_pass1.json` — Each agent's initial response
  - `<agent>_to_<sub>_delegation.json` — Each delegation that occurred
  - `<agent>_final.json` — Each agent's synthesized output
  - `final_output.json` — The team's deliverable

## Edge Cases

| Issue | Solution |
|-------|----------|
| `ANTHROPIC_API_KEY not set` | Add your key to `.env` (get one at console.anthropic.com) |
| `Team config not found` | Check the team ID — run `--list` to see available teams |
| `Agent returned invalid JSON` | Inspect the pass1 artifact; strengthen that agent's Output section |
| `Refusing illegal delegation` | The agent tried to delegate to a non-subordinate. Update team YAML `manages` list, or tighten the agent's Process section |
| Task output is low quality | Review the brief in `brief.json` — was the translator's interpretation accurate? Try Option B with a hand-written brief |
| Wrong subordinates called | Agents over-delegate when Process is vague. Specify when delegation IS and ISN'T appropriate |

## Recovering from a Failed Run

All artifacts persist in `.tmp/runs/<run_id>/` until you clean them up. You can:
1. Open `brief.json` to see what the team actually received
2. Open each `_pass1.json` to trace where the reasoning went wrong
3. Fix the agent markdown or team YAML
4. Re-run the task
