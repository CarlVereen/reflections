"""
Format newsletter content into an HTML email.

Takes research data (JSON) and an optional infographic image path,
and produces a styled HTML email ready for sending.

Usage:
    python tools/format_newsletter.py

Reads:
    .tmp/research_output.json  (from research_topic.py)
    .tmp/infographic_meta.json (from generate_infographic.py, optional)

Outputs:
    .tmp/newsletter.html
"""

import json
import os
import sys
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP_DIR = os.path.join(PROJECT_ROOT, ".tmp")

NEWSLETTER_NAME = os.environ.get("NEWSLETTER_NAME", "The Weekly Brief")

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Main container -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:32px 40px;text-align:center;">
      <h1 style="color:#e94560;font-size:28px;margin:0 0 4px 0;letter-spacing:1px;">{newsletter_name}</h1>
      <p style="color:#a8a8b3;font-size:13px;margin:0;">{date}</p>
    </td>
  </tr>

  <!-- Title -->
  <tr>
    <td style="padding:32px 40px 16px 40px;">
      <h2 style="color:#1a1a2e;font-size:22px;margin:0;line-height:1.3;">{title}</h2>
    </td>
  </tr>

  <!-- Summary -->
  <tr>
    <td style="padding:0 40px 24px 40px;">
      <p style="color:#4a4a68;font-size:15px;line-height:1.6;margin:0;">{summary}</p>
    </td>
  </tr>

  <!-- Infographic -->
  {infographic_block}

  <!-- Key Points -->
  <tr>
    <td style="padding:8px 40px 8px 40px;">
      <h3 style="color:#1a1a2e;font-size:16px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e94560;padding-bottom:8px;">Key Takeaways</h3>
    </td>
  </tr>
  {key_points_block}

  <!-- Stats -->
  {stats_block}

  <!-- Sources -->
  {citations_block}

  <!-- Footer -->
  <tr>
    <td style="background-color:#f8f8fa;padding:24px 40px;text-align:center;border-top:1px solid #e8e8ed;">
      <p style="color:#a8a8b3;font-size:12px;margin:0 0 8px 0;">You're receiving this because you subscribed to {newsletter_name}.</p>
      <p style="color:#a8a8b3;font-size:12px;margin:0;">To unsubscribe, reply to this email with "unsubscribe".</p>
    </td>
  </tr>

</table>

</td></tr>
</table>

</body>
</html>"""


def _key_point_row(point):
    return f"""  <tr>
    <td style="padding:4px 40px 4px 56px;">
      <p style="color:#4a4a68;font-size:14px;line-height:1.5;margin:0 0 8px 0;position:relative;">
        <span style="color:#e94560;font-weight:bold;position:absolute;left:-20px;">&#8226;</span>
        {point}
      </p>
    </td>
  </tr>"""


def _stats_block(stats):
    if not stats:
        return ""

    cells = ""
    for stat in stats[:3]:
        cells += f"""<td style="padding:12px;text-align:center;width:33%;">
        <p style="color:#e94560;font-size:13px;font-weight:bold;margin:0;line-height:1.4;">{stat}</p>
      </td>"""

    return f"""  <tr>
    <td style="padding:16px 40px 8px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8fa;border-radius:6px;">
        <tr>{cells}</tr>
      </table>
    </td>
  </tr>"""


def _citations_block(citations):
    if not citations:
        return ""

    links = ""
    for i, url in enumerate(citations[:5], 1):
        links += f'<a href="{url}" style="color:#0f3460;font-size:12px;text-decoration:underline;">[{i}]</a> '

    return f"""  <tr>
    <td style="padding:16px 40px 24px 40px;">
      <p style="color:#a8a8b3;font-size:12px;margin:0 0 4px 0;">Sources:</p>
      <p style="margin:0;">{links.strip()}</p>
    </td>
  </tr>"""


def _infographic_block(image_cid):
    if not image_cid:
        return ""

    return f"""  <tr>
    <td style="padding:0 40px 24px 40px;">
      <img src="cid:{image_cid}" alt="Infographic" style="width:100%;height:auto;border-radius:6px;display:block;" />
    </td>
  </tr>"""


def format_newsletter(research_data, image_cid=None):
    """Build HTML newsletter from research data.

    Args:
        research_data: Dict with summary, key_points, stats, topic_title, citations.
        image_cid: Content-ID for the inline infographic image (without angle brackets).

    Returns:
        str: Complete HTML email string.
    """
    title = research_data.get("topic_title", "Newsletter")
    summary = research_data.get("summary", "")
    key_points = research_data.get("key_points", [])
    stats = research_data.get("stats", [])
    citations = research_data.get("citations", [])
    date = datetime.now().strftime("%B %d, %Y")

    key_points_html = "\n".join(_key_point_row(p) for p in key_points)
    stats_html = _stats_block(stats)
    citations_html = _citations_block(citations)
    infographic_html = _infographic_block(image_cid)

    html = HTML_TEMPLATE.format(
        title=title,
        newsletter_name=NEWSLETTER_NAME,
        date=date,
        summary=summary,
        key_points_block=key_points_html,
        stats_block=stats_html,
        citations_block=citations_html,
        infographic_block=infographic_html,
    )

    return html


def main():
    research_path = os.path.join(TMP_DIR, "research_output.json")
    if not os.path.exists(research_path):
        print(f"Error: {research_path} not found. Run research_topic.py first.")
        sys.exit(1)

    with open(research_path) as f:
        research_data = json.load(f)

    # Check for infographic
    image_cid = None
    meta_path = os.path.join(TMP_DIR, "infographic_meta.json")
    if os.path.exists(meta_path):
        image_cid = "newsletter_infographic"

    html = format_newsletter(research_data, image_cid)

    os.makedirs(TMP_DIR, exist_ok=True)
    output_path = os.path.join(TMP_DIR, "newsletter.html")
    with open(output_path, "w") as f:
        f.write(html)

    print(f"Newsletter HTML saved to {output_path}")
    print(f"Title: {research_data.get('topic_title', 'N/A')}")
    print(f"Size: {len(html)} bytes")


if __name__ == "__main__":
    main()
