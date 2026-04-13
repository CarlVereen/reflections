# Workflow: Send Newsletter

## Objective

Research a topic, generate a newsletter with infographic, and send it to active subscribers via Gmail.

## Required Inputs

- **Topic**: A short description of what the newsletter should cover (e.g., "AI in Healthcare 2026")

## Pipeline

Run each step in order. If a step fails, fix the issue before continuing.

### Step 1: Research the Topic

```bash
python tools/research_topic.py "YOUR TOPIC HERE"
```

- Calls the Perplexity API (sonar-pro model)
- Returns a structured summary, 5 key points, and relevant stats
- **Output**: `.tmp/research_output.json`

### Step 2: Generate Infographic

```bash
python tools/generate_infographic.py "YOUR TOPIC HERE" "key themes from research"
```

- Calls the Nano Banana API to generate a topic-relevant visual
- Pass key themes from the research as the second argument to improve relevance
- **Output**: `.tmp/infographic_<timestamp>.png`, `.tmp/infographic_meta.json`

### Step 3: Fetch Subscribers

```bash
python tools/fetch_subscribers.py
```

- Reads the Google Sheet specified by `GOOGLE_SHEET_ID`
- Filters to only `status = active` rows
- **Output**: `.tmp/subscribers.json`

### Step 4: Format the Newsletter

```bash
python tools/format_newsletter.py
```

- Reads research output and infographic metadata
- Generates a styled HTML email with inline infographic
- **Output**: `.tmp/newsletter.html`
- **Review**: Open the HTML file in a browser to preview before sending

### Step 5: Send the Newsletter

```bash
python tools/send_email.py
```

- Sends the HTML email to all active subscribers via Gmail API
- Embeds the infographic inline using Content-ID
- Adds a brief 0.5s delay between sends to avoid rate limits

## Expected Outputs

- Each active subscriber receives the HTML newsletter in their inbox
- Console output shows sent/failed counts

## Edge Cases & Troubleshooting

| Issue | Solution |
|-------|----------|
| `PERPLEXITY_API_KEY not set` | Add your key to `.env` |
| `NANO_BANANA_API_KEY not set` | Add your key to `.env` |
| `credentials.json not found` | Download from Google Cloud Console (see Setup below) |
| `No subscribers found` | Check your Google Sheet ID and that at least one row has status "active" |
| Perplexity returns non-JSON | The tool falls back to raw text — check the model's response |
| Gmail rate limit (429) | Increase the delay in `send_email.py` or wait and retry |
| Newsletter clipped in Gmail | Gmail clips emails > 102KB — reduce content or image size |

## First-Time Setup

### 1. API Keys

Add these to your `.env` file (copy from `.env.example`):

```
PERPLEXITY_API_KEY=pplx-xxxxx
NANO_BANANA_API_KEY=your_key_here
NANO_BANANA_API_URL=https://kie.ai/api/v1/generate
GOOGLE_SHEET_ID=your_sheet_id_here
SENDER_NAME=Your Name
SENDER_EMAIL=you@gmail.com
NEWSLETTER_NAME=The Weekly Brief
```

**Where to get keys:**
- **Perplexity**: https://www.perplexity.ai/account/api → Generate API key
- **Nano Banana (Kie.ai)**: Sign up at https://kie.ai → API settings → Generate key
- **Google Sheet ID**: The long string in your Google Sheet URL between `/d/` and `/edit`

### 2. Google OAuth

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Desktop application)
3. Download as `credentials.json` and place in project root
4. Enable the **Gmail API** and **Google Sheets API** in your project
5. Run any tool once — it will open a browser for you to authorize, then save `token.json`

### 3. Google Sheet Format

Set up your subscriber sheet with these columns (row 1 = headers):

| A: Date Subscribed | B: Name | C: Email | D: Status | E: Date Unsubscribed |
|---|---|---|---|---|
| 2026-01-15 | Jane Doe | jane@example.com | active | |
| 2026-02-01 | John Smith | john@example.com | unsubscribed | 2026-03-10 |

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

## Learned Constraints

_Update this section as you discover rate limits, timing quirks, or API changes._
