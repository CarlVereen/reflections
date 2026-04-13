"""
Thin wrapper around the Anthropic Claude API.

Handles authentication, retries, and message construction for agent calls.

Usage:
    from claude_client import call_claude

    response_text = call_claude(
        system="You are a helpful assistant",
        user="What's 2+2?",
        model="claude-sonnet-4-6",
    )
"""

import os
import sys
import time

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

try:
    from anthropic import Anthropic, APIError
except ImportError:
    print("Error: anthropic package not installed. Run: pip install -r requirements.txt")
    sys.exit(1)

API_KEY = os.getenv("ANTHROPIC_API_KEY")
DEFAULT_MODEL = os.getenv("DEFAULT_CLAUDE_MODEL", "claude-sonnet-4-6")
DEFAULT_MAX_TOKENS = int(os.getenv("DEFAULT_MAX_TOKENS", "4096"))


def _client():
    if not API_KEY:
        print("Error: ANTHROPIC_API_KEY not set in .env")
        sys.exit(1)
    return Anthropic(api_key=API_KEY)


def call_claude(system, user, model=None, max_tokens=None, max_retries=3):
    """Call the Claude API and return the assistant's text response.

    Args:
        system: System prompt (the agent's role).
        user: User message (the task input).
        model: Model ID. Defaults to DEFAULT_CLAUDE_MODEL from env.
        max_tokens: Max tokens in response. Defaults to DEFAULT_MAX_TOKENS from env.
        max_retries: Number of retries on transient API errors.

    Returns:
        str: The assistant's text response.

    Raises:
        SystemExit: If the API call fails after all retries.
    """
    client = _client()
    model = model or DEFAULT_MODEL
    max_tokens = max_tokens or DEFAULT_MAX_TOKENS

    last_error = None
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return response.content[0].text
        except APIError as e:
            last_error = e
            # Exponential backoff for transient errors
            if attempt < max_retries - 1:
                wait = 2**attempt
                print(f"  API error (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                break

    print(f"Error: Claude API call failed after {max_retries} attempts: {last_error}")
    sys.exit(1)
