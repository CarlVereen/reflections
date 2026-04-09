# Tools

Python scripts for deterministic execution within the WAT framework.

Each tool handles a specific task: API calls, data transformations, file operations, database queries, etc.

## Conventions

- Store credentials and API keys in `.env` at the project root (never hardcode secrets)
- Use `os.makedirs('.tmp', exist_ok=True)` before writing intermediate files to `.tmp/`
- Each script should be independently runnable: `python tools/script_name.py`
