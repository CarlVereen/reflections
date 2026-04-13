"""
Send the formatted HTML newsletter via Gmail API.

Reads the newsletter HTML, attaches the infographic inline,
and sends to all active subscribers.

Usage:
    python tools/send_email.py

Reads:
    .tmp/newsletter.html         (from format_newsletter.py)
    .tmp/subscribers.json        (from fetch_subscribers.py)
    .tmp/infographic_meta.json   (from generate_infographic.py, optional)

Requires:
    SENDER_NAME in .env
    SENDER_EMAIL in .env
    Google OAuth credentials (credentials.json / token.json)
"""

import base64
import json
import os
import sys
import time
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from google_auth import get_credentials

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP_DIR = os.path.join(PROJECT_ROOT, ".tmp")

SENDER_NAME = os.getenv("SENDER_NAME", "Newsletter")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")


def _build_message(to_email, to_name, subject, html_content, image_path=None):
    """Build a MIME message with HTML content and optional inline image.

    Args:
        to_email: Recipient email address.
        to_name: Recipient name for personalization.
        subject: Email subject line.
        html_content: The HTML body of the newsletter.
        image_path: Optional path to an infographic image to embed inline.

    Returns:
        MIMEMultipart: The constructed email message.
    """
    # Personalize greeting if name is available
    if to_name:
        html_content = html_content.replace(
            "You're receiving this",
            f"Hi {to_name} — you're receiving this",
        )

    message = MIMEMultipart("related")
    message["Subject"] = subject
    message["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    message["To"] = f"{to_name} <{to_email}>" if to_name else to_email

    html_part = MIMEText(html_content, "html")
    message.attach(html_part)

    # Attach infographic inline if available
    if image_path and os.path.exists(image_path):
        with open(image_path, "rb") as img_file:
            img = MIMEImage(img_file.read())
            img.add_header("Content-ID", "<newsletter_infographic>")
            img.add_header("Content-Disposition", "inline", filename="infographic.png")
            message.attach(img)

    return message


def send_email(service, message):
    """Send a single email via Gmail API.

    Args:
        service: Authenticated Gmail API service instance.
        message: MIMEMultipart message to send.

    Returns:
        dict: Gmail API response with message ID.

    Raises:
        HttpError: If the Gmail API request fails.
    """
    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {"raw": encoded}
    return service.users().messages().send(userId="me", body=body).execute()


def main():
    if not SENDER_EMAIL:
        print("Error: SENDER_EMAIL not set in .env")
        sys.exit(1)

    # Load newsletter HTML
    html_path = os.path.join(TMP_DIR, "newsletter.html")
    if not os.path.exists(html_path):
        print(f"Error: {html_path} not found. Run format_newsletter.py first.")
        sys.exit(1)

    with open(html_path) as f:
        html_content = f.read()

    # Load subscribers
    subs_path = os.path.join(TMP_DIR, "subscribers.json")
    if not os.path.exists(subs_path):
        print(f"Error: {subs_path} not found. Run fetch_subscribers.py first.")
        sys.exit(1)

    with open(subs_path) as f:
        subscribers = json.load(f)

    if not subscribers:
        print("No subscribers to send to.")
        sys.exit(0)

    # Load infographic path if available
    image_path = None
    meta_path = os.path.join(TMP_DIR, "infographic_meta.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
            image_path = meta.get("image_path")

    # Load research data for subject line
    research_path = os.path.join(TMP_DIR, "research_output.json")
    subject = "Your Newsletter"
    if os.path.exists(research_path):
        with open(research_path) as f:
            research = json.load(f)
            subject = research.get("topic_title", subject)

    # Authenticate and send
    creds = get_credentials()
    service = build("gmail", "v1", credentials=creds)

    print(f"Sending newsletter: \"{subject}\"")
    print(f"From: {SENDER_NAME} <{SENDER_EMAIL}>")
    print(f"Recipients: {len(subscribers)}")
    print("-" * 40)

    sent = 0
    failed = 0

    for sub in subscribers:
        email = sub["email"]
        name = sub.get("name", "")

        try:
            msg = _build_message(email, name, subject, html_content, image_path)
            result = send_email(service, msg)
            print(f"  Sent to {name} <{email}> (ID: {result['id']})")
            sent += 1
            # Brief pause between sends to avoid rate limits
            time.sleep(0.5)
        except HttpError as e:
            print(f"  FAILED: {name} <{email}> - {e}")
            failed += 1

    print("-" * 40)
    print(f"Done. Sent: {sent}, Failed: {failed}")


if __name__ == "__main__":
    main()
