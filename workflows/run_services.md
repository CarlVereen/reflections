# Workflow: Running the Income Services

Objective: Deliver paid services using the tools in `tools/`. Agent (Claude)
orchestrates; tools do the deterministic work.

## Service A — Lead List Cleanup
1. Get the client's file (CSV, or export their Excel/Sheet to CSV).
2. Run: `python tools/clean_lead_list.py <input.csv> .tmp/clean.csv`
3. Read the printed report. Tell the client what was fixed and flag invalid emails.
4. Deliver `.tmp/clean.csv`. (Optional: upload to their Google Drive via the
   connected Drive tools.)

## Service B — Meeting Notes
1. Get the transcript as a .txt file. (If they send audio, they transcribe first,
   or paste the text.)
2. Run: `python tools/transcript_to_actions.py <transcript.txt> .tmp/notes.md`
3. AGENT POST-EDIT: fix any mis-detected owners, tighten the summary, add due
   dates. This is where the agent adds the value over raw heuristics.
4. Deliver `.tmp/notes.md`, or post directly into the client's Notion via the
   connected Notion tools.

## Service C — Outreach Pack
1. Get the prospect CSV (needs a header row) + agree on the message angle.
2. Build/confirm a template file with {placeholders} matching CSV columns.
3. Run: `python tools/outreach_drafter.py <prospects.csv> <template.txt> .tmp/drafts/`
4. AGENT POST-EDIT each draft for tone. Deliver the folder, or load into Gmail
   drafts via the connected Gmail tools for the client to review and send.

## Edge cases & lessons
- Excel files: ask the client to "File > Download > CSV" first. The tools read CSV.
- Weird encodings: tools already handle UTF-8 BOM (utf-8-sig). If a file still
  fails, open and re-save as UTF-8.
- Always keep raw inputs in `.tmp/` only; never commit client data to git.
