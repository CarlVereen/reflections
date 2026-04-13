# Agents

This directory holds the library of agent definitions. Each agent is a markdown file with YAML frontmatter.

## Anatomy of an Agent

Every agent has exactly four sections:

1. **Role** — who the agent is and what expertise it brings
2. **Input** — the structured data it receives (JSON schema)
3. **Process** — the rules and steps it must follow
4. **Output** — the strict JSON format it must return

## Files

- `_template.md` — Copy this to create new agents. Underscore prefix excludes it from team rosters.
- `translator.md` — Built-in agent that converts free-form task descriptions into structured briefs. Used automatically by the orchestrator when a task is passed as plain text.

## Creating a New Agent

1. Copy `_template.md` to `agents/<your_agent_id>.md`
2. Fill in the frontmatter (`id`, `role`, `description`)
3. Rewrite each section for your specific role
4. If the agent will manage subordinates, list allowed subordinate IDs in the team YAML under `manages` — NOT in the agent file itself. This keeps agents reusable across teams.

## Output Contract

Every agent must return JSON matching this schema (enforced by the orchestrator):

```json
{
  "status": "complete" | "needs_delegation",
  "result": { ... },
  "delegations": [ { "agent_id": "...", "task": { ... } } ],
  "notes": "..."
}
```

If `status` is `needs_delegation`, the orchestrator executes each delegation, collects results, and invokes the agent a second time for synthesis. Delegations are only allowed to agents listed under `manages` in the team YAML.
