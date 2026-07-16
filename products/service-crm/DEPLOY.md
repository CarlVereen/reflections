# 📲 Deploy the web app (one time, ~5 min)

The web app turns the CRM into a real app you open in any browser — including your
phone. It's backed by the same Google Sheet (the tabs are the database). You only
deploy once; after that you just open the URL.

## Files that must be in the Apps Script project
`Extensions ▸ Apps Script`, make sure all **four** exist:
- `Code.gs` — sheet setup, menu, automations
- `Api.gs` — the web-app server API + `doGet`
- `WebApp.html` — the app UI
- `Sidebar.html` — the desktop Quick Actions panel

## Steps
1. In the sheet, run **⚡ CRM ▸ Set up / rebuild CRM** once and approve the permissions
   (see the "Google hasn't verified this app" note — it's normal).
2. In the Apps Script editor, click **Deploy ▸ New deployment**.
3. Click the **gear ⚙️ ▸ Web app**.
4. Set:
   - **Description:** `CRM app` (anything)
   - **Execute as:** **Me**
   - **Who has access:** **Only myself** ← ⚠️ **security-critical.** This keeps your CRM
     private to you. Do **not** choose "Anyone" — that would let anyone with the link read
     your customer data and act as you. (See `SECURITY.md`.)
5. Click **Deploy**, then **Authorize access** and allow (same one-time approval).
6. Copy the **Web app URL** (ends in `/exec`). That's your app.

> Shortcut: after deploying, **⚡ CRM ▸ 📲 Open the app (get link)** shows the URL any time.

## Put it on your phone
Open the URL on your phone → browser menu → **Add to Home Screen**. Now it launches
like an app. (You'll need to be signed into the same Google account.)

## After you change the code later
`Deploy ▸ Manage deployments ▸` (pencil ✏️) `▸ Version: New version ▸ Deploy`. The URL
stays the same.

## Selling it / done-for-you
The deploy step is the most technical part of setup, which is exactly why the **$149
Done-For-You** tier is worth offering — you (the owner) deploy it for the buyer and hand
them a working URL. For DIY buyers, this guide + the in-sheet menu link cover it.

## ⚠️ Troubleshooting: "Sorry, unable to open the file at this time" (on a computer)

This Google Drive error means the app opened under the **wrong Google account** — you're
signed into more than one, and the app landed on an account that doesn't own the sheet.
(It's why it can work on your phone but not your computer.) Fixes, easiest first:

1. **Incognito window** (Ctrl/Cmd+Shift+N) → paste the app URL → sign in with **only** the
   account that owns the sheet. This always works and confirms the cause.
2. **Make the owner account your default:** sign out of all Google accounts, then sign in
   with the owner account **first** (first account = default).
3. **Force the account in the URL:** insert `/u/0/` after `script.google.com`, e.g.
   `https://script.google.com/u/0/macros/s/XXXX/exec` — try `/u/1/`, `/u/2/`… until it opens.
4. Make sure you're using the **`/exec`** URL from *Deploy ▸ Manage deployments*, not the
   **`/dev`** test URL (the `/dev` URL only works for the owner with editor access).

## Access model (plain English)
"Execute as Me / Only myself" means the app runs as **you** and **only you** can open it
(while signed into your Google account). Your data never leaves your account. If you ever
want to hand access to an employee, that's a bigger change — ask before doing it.
