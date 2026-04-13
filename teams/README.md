# Teams

This directory holds team configurations. A team is a YAML file that describes a collection of agents and the hierarchy between them.

## Anatomy of a Team

```yaml
team: content_team              # Unique ID (snake_case)
name: Content Team              # Display name
description: Produces ...       # What this team delivers
entry_agent: editor_in_chief    # First agent invoked with the task
use_translator: true            # Auto-translate free-form briefs
default_model: claude-sonnet-4-6

agents:
  - id: editor_in_chief
    file: agents/editor_in_chief.md
    manages: [writer, fact_checker]  # Who this agent can delegate to
  - id: writer
    file: agents/writer.md
    manages: []
  - id: fact_checker
    file: agents/fact_checker.md
    manages: []
```

## Hierarchy Rules

- Each agent lists which other agents it `manages`. Delegation is bounded by this list.
- An agent with `manages: []` is a leaf (worker) — it cannot delegate.
- Teams can be **flat** (one manager + specialists) or **deeply hierarchical** (manager → leads → workers). The orchestrator walks whatever graph you define.
- Circular delegation is rejected at load time.

## Files

- `_template.yaml` — Copy to create a new team. Underscore prefix excludes from listings.

## Creating a New Team

1. Copy `_template.yaml` to `teams/<team_id>.yaml`
2. Define each agent's role markdown in `agents/`
3. List agents in the `agents:` array with their `manages` relationships
4. Set `entry_agent` to the top of your hierarchy
5. Assign a task: `python tools/run_team.py <team_id> "Your task"`

## Reusing Agents Across Teams

Agents are defined independently of teams. The same `writer.md` can appear on multiple teams with different `manages` relationships. This keeps agents reusable building blocks.
