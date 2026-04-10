# Tools

Python scripts for deterministic execution within the WAT framework.

## Available Tools

| Tool | Purpose |
|------|---------|
| `google_auth.py` | Shared Google OAuth2 helper (Gmail + Sheets) |
| `research_topic.py` | Research a topic via Perplexity API |
| `generate_infographic.py` | Generate an infographic via Nano Banana API |
| `fetch_subscribers.py` | Fetch active subscribers from Google Sheets |
| `format_newsletter.py` | Format research + infographic into HTML email |
| `send_email.py` | Send the newsletter to subscribers via Gmail API |

## Conventions

- Store credentials and API keys in `.env` at the project root (never hardcode secrets)
- Use `os.makedirs('.tmp', exist_ok=True)` before writing intermediate files to `.tmp/`
- Each script should be independently runnable: `python tools/script_name.py`
