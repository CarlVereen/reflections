"""
Google OAuth2 authentication helper.

Handles credential loading, token refresh, and initial OAuth flow
for Gmail API and Google Sheets API access.

Usage:
    from google_auth import get_credentials
    creds = get_credentials()
"""

import os
import sys
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
]

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_FILE = os.path.join(PROJECT_ROOT, "credentials.json")
TOKEN_FILE = os.path.join(PROJECT_ROOT, "token.json")


def get_credentials():
    """Load or create Google OAuth2 credentials.

    Returns:
        google.oauth2.credentials.Credentials: Valid credentials for API access.

    Raises:
        FileNotFoundError: If credentials.json is missing.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Error: {CREDENTIALS_FILE} not found.")
        print("Download it from Google Cloud Console → APIs & Services → Credentials.")
        sys.exit(1)

    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return creds
