"""
Generate an infographic image using the Nano Banana API via Kie.ai.

Takes a topic and research context, builds a prompt, and generates
an infographic or illustration. Downloads the result to .tmp/.

Usage:
    python tools/generate_infographic.py "AI in Healthcare" "Summary of key trends..."

Requires:
    NANO_BANANA_API_KEY in .env
    NANO_BANANA_API_URL in .env (defaults to https://kie.ai/api/v1/generate)
"""

import json
import os
import sys
import time

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

API_KEY = os.getenv("NANO_BANANA_API_KEY")
API_URL = os.getenv("NANO_BANANA_API_URL", "https://kie.ai/api/v1/generate")

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".tmp")


def build_prompt(topic, context=""):
    """Build an image generation prompt from topic and research context.

    Args:
        topic: The newsletter topic.
        context: Additional context from research (key points, stats).

    Returns:
        str: A descriptive prompt for image generation.
    """
    base = (
        f"Create a clean, modern infographic about '{topic}'. "
        "Use a professional color palette with clear visual hierarchy. "
        "Include icons and minimal text labels. "
        "Style: flat design, suitable for an email newsletter header image. "
        "Aspect ratio: landscape (16:9). "
    )
    if context:
        base += f"The infographic should visually represent these themes: {context}"
    return base


def generate(topic, context=""):
    """Generate an infographic via the Nano Banana API.

    Args:
        topic: The newsletter topic.
        context: Additional context for the prompt.

    Returns:
        str: Local file path to the downloaded image.

    Raises:
        SystemExit: If API key is missing or generation fails.
    """
    if not API_KEY:
        print("Error: NANO_BANANA_API_KEY not set in .env")
        sys.exit(1)

    prompt = build_prompt(topic, context)

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "prompt": prompt,
        "selectedModel": "nano-banana",
    }

    print(f"Generating infographic for: {topic}")
    response = requests.post(API_URL, headers=headers, json=payload, timeout=120)

    if response.status_code != 200:
        print(f"Error: Nano Banana API returned {response.status_code}")
        print(response.text)
        sys.exit(1)

    data = response.json()

    if not data.get("success", False):
        print(f"Error: Generation failed - {data.get('error', 'Unknown error')}")
        sys.exit(1)

    image_urls = data.get("outputImageUrls", [])
    if not image_urls:
        print("Error: No images returned from API")
        sys.exit(1)

    # Download the first image
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    image_url = image_urls[0]
    timestamp = int(time.time())
    output_path = os.path.join(OUTPUT_DIR, f"infographic_{timestamp}.png")

    img_response = requests.get(image_url, timeout=60)
    if img_response.status_code != 200:
        print(f"Error: Could not download image from {image_url}")
        sys.exit(1)

    with open(output_path, "wb") as f:
        f.write(img_response.content)

    print(f"Infographic saved to {output_path}")
    return output_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/generate_infographic.py <topic> [context]")
        sys.exit(1)

    topic = sys.argv[1]
    context = sys.argv[2] if len(sys.argv) > 2 else ""

    output_path = generate(topic, context)

    # Save metadata for downstream tools
    metadata = {
        "topic": topic,
        "image_path": output_path,
        "timestamp": int(time.time()),
    }

    meta_path = os.path.join(OUTPUT_DIR, "infographic_meta.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Metadata saved to {meta_path}")


if __name__ == "__main__":
    main()
