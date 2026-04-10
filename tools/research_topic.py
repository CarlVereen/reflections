"""
Research a topic using the Perplexity API.

Sends a topic to Perplexity's sonar-pro model and returns a structured
research summary with key points and source citations.

Usage:
    python tools/research_topic.py "Artificial Intelligence in Healthcare 2026"

Requires:
    PERPLEXITY_API_KEY in .env
"""

import json
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

API_URL = "https://api.perplexity.ai/chat/completions"
API_KEY = os.getenv("PERPLEXITY_API_KEY")
MODEL = os.getenv("PERPLEXITY_MODEL", "sonar-pro")

SYSTEM_PROMPT = """You are a research assistant preparing content for a newsletter.
Given a topic, provide:
1. A concise summary (2-3 sentences) of the most important recent developments
2. Exactly 5 key points as bullet points, each 1-2 sentences
3. Notable statistics or data points if available

Format your response as JSON with these keys:
- "summary": string
- "key_points": list of strings (exactly 5)
- "stats": list of strings (0-3 notable stats, empty list if none)
- "topic_title": a clean, compelling title for this topic
"""


def research(topic):
    """Call Perplexity API to research a topic.

    Args:
        topic: The topic to research.

    Returns:
        dict: Parsed research data with summary, key_points, stats, topic_title,
              and citations.

    Raises:
        SystemExit: If API key is missing or API request fails.
    """
    if not API_KEY:
        print("Error: PERPLEXITY_API_KEY not set in .env")
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Research this topic for a newsletter: {topic}"},
        ],
        "max_tokens": 1500,
        "temperature": 0.3,
        "search_recency_filter": "week",
    }

    response = requests.post(API_URL, headers=headers, json=payload, timeout=60)

    if response.status_code != 200:
        print(f"Error: Perplexity API returned {response.status_code}")
        print(response.text)
        sys.exit(1)

    data = response.json()
    content = data["choices"][0]["message"]["content"]
    citations = data.get("citations", [])

    # Parse the JSON response from the model
    # Strip markdown code fences if present
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        result = {
            "summary": content,
            "key_points": [],
            "stats": [],
            "topic_title": topic,
        }

    result["citations"] = citations

    return result


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/research_topic.py <topic>")
        sys.exit(1)

    topic = " ".join(sys.argv[1:])
    print(f"Researching: {topic}")

    result = research(topic)

    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".tmp")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "research_output.json")

    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Research saved to {output_path}")
    print(f"\nTitle: {result.get('topic_title', topic)}")
    print(f"Summary: {result.get('summary', 'N/A')}")
    print(f"Key points: {len(result.get('key_points', []))}")
    print(f"Citations: {len(result.get('citations', []))}")


if __name__ == "__main__":
    main()
