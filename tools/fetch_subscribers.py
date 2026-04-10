"""
Fetch active newsletter subscribers from a Google Sheet.

Reads the subscriber sheet, filters by status='active', and returns
a list of {name, email} dicts.

Usage:
    python tools/fetch_subscribers.py

Requires:
    GOOGLE_SHEET_ID in .env
    SUBSCRIBERS_SHEET_NAME in .env (defaults to "Sheet1")
    Google OAuth credentials (credentials.json / token.json)

Expected sheet columns (row 1 = headers):
    A: Date Subscribed
    B: Name
    C: Email
    D: Status (active / unsubscribed)
    E: Date Unsubscribed
"""

import json
import os
import sys

from dotenv import load_dotenv
from googleapiclient.discovery import build

# Add tools/ to path so we can import google_auth
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from google_auth import get_credentials

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SHEET_NAME = os.getenv("SUBSCRIBERS_SHEET_NAME", "Sheet1")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".tmp")


def fetch_subscribers():
    """Fetch active subscribers from the Google Sheet.

    Returns:
        list[dict]: List of subscribers with 'name' and 'email' keys.

    Raises:
        SystemExit: If GOOGLE_SHEET_ID is not set or sheet is empty.
    """
    if not SHEET_ID:
        print("Error: GOOGLE_SHEET_ID not set in .env")
        sys.exit(1)

    creds = get_credentials()
    service = build("sheets", "v4", credentials=creds)

    # Read all data (skip header row)
    range_name = f"{SHEET_NAME}!A2:E"
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=SHEET_ID, range=range_name)
        .execute()
    )

    rows = result.get("values", [])

    if not rows:
        print("Warning: No subscribers found in sheet")
        return []

    subscribers = []
    for row in rows:
        # Ensure row has enough columns
        if len(row) < 4:
            continue

        name = row[1].strip()
        email = row[2].strip()
        status = row[3].strip().lower()

        if status == "active" and email:
            subscribers.append({"name": name, "email": email})

    return subscribers


def main():
    print(f"Fetching subscribers from sheet: {SHEET_ID}")
    subscribers = fetch_subscribers()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, "subscribers.json")

    with open(output_path, "w") as f:
        json.dump(subscribers, f, indent=2)

    print(f"Found {len(subscribers)} active subscriber(s)")
    print(f"Saved to {output_path}")

    for sub in subscribers:
        print(f"  - {sub['name']} <{sub['email']}>")


if __name__ == "__main__":
    main()
