# Pipedrive Call Companion (Chrome Extension MV3)

A Manifest V3 Chrome extension that injects a fast right-side panel on Pipedrive Deal/Person pages to support live-call workflows.

## Features

- Detects Pipedrive page context for:
  - `/deal/{id}`, `/deals/{id}`
  - `/person/{id}`, `/persons/{id}`
- Pulls context from Pipedrive API using API token (MVP)
- Deterministic pre-call brief (no LLM key needed)
- Talking-point cards and risk flags
- `No Answer` flow with 3 email options and Gmail draft creation
- LinkedIn lookup button (direct profile if available, otherwise targeted lookup query; no scraping)
- Paste-email flow to save missing person email to Pipedrive
- Local quick notes for `Answered` calls
- Customizable no-answer email templates by deal stage
- Stage-aware talking points driven by deal stage, recent notes/activities, and detected custom-field signals

## File Structure

- `/manifest.json`
- `/background.js`
- `/content.js`
- `/ui.css`
- `/options.html`
- `/options.js`
- `/lib/email.js`

## Load Unpacked Extension

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `pipedrive-extension`.

## Configure Pipedrive Token

1. Open extension options from `chrome://extensions` -> **Details** -> **Extension options**.
2. Paste your Pipedrive API token.
3. Save options.

You can also add stage-based email templates in options under **No Answer email templates by stage (JSON)**.

If token is missing or invalid, panel requests will fail with an actionable error message.

## Gmail OAuth Setup (Draft Creation)

This extension uses `chrome.identity.getAuthToken({ interactive: true })` and the Gmail scope:

- `https://www.googleapis.com/auth/gmail.compose`

### Required Google Cloud setup

1. Create or select a Google Cloud project.
2. Enable **Gmail API**.
3. Configure **OAuth consent screen** (External or Internal as needed).
4. Add test users if app is in testing mode.
5. Create an OAuth client suitable for Chrome extension identity flow.
6. Replace `oauth2.client_id` in `/manifest.json`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/gmail.compose"]
}
```

7. Reload the extension in `chrome://extensions`.

When you click **Create Gmail Draft**, Chrome prompts for consent (first run), then the extension creates a draft via:

- `POST https://gmail.googleapis.com/gmail/v1/users/me/drafts`

The UI shows the created draft id.

## Message Contract

### Content -> Background

- `GET_CONTEXT_AND_BRIEF` with `{ type: "deal"|"person", id: number }`
- `CREATE_GMAIL_DRAFT` with `{ to, subject, body }`
- `SAVE_EMAIL_TO_PIPEDRIVE_PERSON` with `{ personId, email }`

### Background -> Content

- Success: `{ ok: true, data: ... }`
- Error: `{ ok: false, error: "..." }`

## Deterministic Output Schema

The brief generator returns this exact schema:

```json
{
  "preCall": {
    "oneLiner": "string",
    "keyFacts": ["string", "string", "string"],
    "riskFlags": ["string"]
  },
  "cards": [
    { "title": "string", "bullets": ["string", "string"] }
  ],
  "noAnswer": {
    "emailDrafts": [
      { "label": "string", "subject": "string", "body": "string" }
    ]
  }
}
```

## Notes on Compliance

- No LinkedIn scraping is implemented.
- LinkedIn button only opens a profile/search URL in a new tab.
- Email enrichment is user-assisted (manual paste) for MVP.

## Customize Email Drafts by Stage

In extension options, set **No Answer email templates by stage (JSON)**.

Example:

```json
{
  "default": [
    { "label": "Email #1", "subject": "Quick follow-up on {{dealTitle}}", "body": "Hi {{personFirstName}},\\n\\n..." },
    { "label": "Email #2", "subject": "Idea for {{orgName}}", "body": "Hi {{personFirstName}},\\n\\n..." },
    { "label": "Email #3", "subject": "Reschedule this week?", "body": "Hi {{personFirstName}},\\n\\n..." }
  ],
  "stage:3": [
    { "label": "Email #1", "subject": "Decision check for {{dealTitle}}", "body": "Hi {{personFirstName}},\\n\\n..." },
    { "label": "Email #2", "subject": "Blockers on {{dealTitle}}?", "body": "Hi {{personFirstName}},\\n\\n..." },
    { "label": "Email #3", "subject": "Should we keep this active?", "body": "Hi {{personFirstName}},\\n\\n..." }
  ]
}
```

Supported tokens:

- `{{personFirstName}}`
- `{{personName}}`
- `{{orgName}}`
- `{{dealTitle}}`
- `{{dealValue}}`
- `{{dealStage}}`
- `{{jobTitle}}`

## Talking-Point Personalization Logic

Talking cards are now generated from:

- Deal stage bucket (early/mid/late)
- Recent note/activity keyword signals (timeline, budget, legal/procurement, stall risk, competitor pressure)
- Custom fields detected from `dealFields` and `personFields` definitions when labels indicate budget/timeline/competitor/stakeholder/use-case context
- Account context such as number of open deals for the contact

## Troubleshooting

### 1) `Pipedrive API token missing`

- Save token in options page and retry refresh in panel.

### 2) Pipedrive 401 errors

- Token is invalid/expired.
- Confirm token from your Pipedrive account settings.

### 3) Pipedrive 404 errors

- The current deal/person id may no longer exist.
- Confirm page URL and entity availability.

### 4) Gmail OAuth errors / 401 / 403

- Verify `oauth2.client_id` in manifest.
- Ensure Gmail API enabled in your Google Cloud project.
- Ensure OAuth consent screen is configured and user is allowed (test mode).
- Reload extension after any manifest changes.

### 5) Panel does not update on in-app navigation

- Pipedrive is SPA-based. This extension includes URL polling for route changes.
- If needed, refresh tab once after install.

## Development Notes

- Vanilla JS and minimal CSS only.
- No external frameworks.
- Background service worker is module-based.
- Quick notes are stored in `chrome.storage.local` keyed by context (`deal:{id}` / `person:{id}`).
