# Peak Access Chrome Extension (MV3)

Peak Access is a Manifest V3 Chrome extension for sales-call and follow-up workflows across Pipedrive and LinkedIn.

## Step 0: Repo Inventory (Before Upgrade)

### Existing extension shape

- `manifest.json`
  - MV3 service worker background
  - content script for `https://*.pipedrive.com/*`
  - permissions: storage, identity, tabs
  - Gmail compose OAuth scope configured
- `background.js`
  - Pipedrive context fetch for deals/persons
  - deterministic pre-call brief generation
  - Gmail draft creation via `chrome.identity.getAuthToken`
- `content.js`
  - Pipedrive URL detection (`/deal/{id}`, `/deals/{id}`, `/person/{id}`, `/persons/{id}`)
  - injected right-side panel
- `options.html` + `options.js`
  - token + UI toggles + no-answer template JSON

### Smallest new/edited set added in this upgrade

- New extension files:
  - `linkedin-content.js` (LinkedIn context + Shadow DOM widget + composer helpers)
  - `sidepanel.html`, `sidepanel.css`, `sidepanel.js` (LinkedIn Mode UI)
  - `src/config.js`
  - `src/lib/pipedrive.js`
  - `src/lib/pipedrive.ts` (requested module path)
- New backend:
  - `backend/app.js`
  - `backend/queue-store.js`
  - `backend/server.js`
  - `backend/package.json`
  - `backend/data/sequences.json`
  - `backend/data/dm-eligible-queue.json`
  - `backend/.env.example`
- New docs:
  - `PIPEDRIVE_AUTOMATION_SETUP.md`
  - `TEST_CHECKLIST.md`
- Edited:
  - `manifest.json`
  - `background.js`
  - `options.html`
  - `options.js`

## What This Upgrade Adds

1. LinkedIn Outreach Sequencer (human-in-the-loop)
- Trigger source: Pipedrive call activity disposition includes `LinkedIn Outreach next step`.
- Rep flow:
  - choose template
  - insert/copy into LinkedIn composer
  - edit manually
  - send manually on LinkedIn
  - click `Log & Advance` in extension

2. LinkedIn identity resolution against Pipedrive
- Match order:
  1. LinkedIn profile URL custom field (canonical)
  2. Email fallback
  3. Name fallback (top 5 + manual confirm)
- Manual confirm writes LinkedIn profile URL back to Pipedrive person.

3. Shared sequence/template backend
- Extension fetches centrally managed templates/sequences from backend.
- Backend webhook receives Pipedrive automation trigger and marks person DM-eligible in queue (and optionally writes to Pipedrive boolean field).

4. LinkedIn-safe injection
- LinkedIn page widget uses Shadow DOM to isolate CSS and reduce DOM/CSS collisions.

## Manifest/Runtime Changes

- Extension now runs on:
  - `https://*.pipedrive.com/*`
  - `https://*.linkedin.com/*`
- Side Panel enabled (`side_panel.default_path`).
- New permissions:
  - `activeTab`, `sidePanel`, `scripting`.
- Existing Gmail draft workflow retained.

## Required Pipedrive Custom Fields

### Person fields

- `linkedin_profile_url` (text)
- `linkedin_dm_sequence_id` (text)
- `linkedin_dm_stage` (number)
- `linkedin_dm_last_sent_at` (datetime)
- `linkedin_dm_eligible` (boolean)

### Activity field

- `Call Disposition` (multi-select) with options:
  1. Connected right person
  2. Connected gatekeeper
  3. No answer
  4. No voicemail left
  5. Voicemail left
  6. LinkedIn Outreach next step

Important:
- Trigger should key off the **option ID** for option 6 when possible, not just label.

## Extension Setup

1. Load extension unpacked (`chrome://extensions`).
2. Open extension options and configure:
- Pipedrive API token
- backend base URL (default `http://localhost:8787`)
- person custom field keys
- activity call disposition field key + trigger option ID
3. Save options.
4. Reload extension.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend endpoints:
- `GET /health`
- `GET /sequences`
- `GET /sequences/:id`
- `GET /templates?sequence_id=<id>&stage=<n>`
- `GET /eligible/:personId`
- `POST /pipedrive/webhook`

Webhook auth:
- Header `x-peak-access-secret` must match `WEBHOOK_SECRET` env var.

## Deploy Backend To Render (Route 2)

Use Render Web Service + Render PostgreSQL.

### 1. Create Render PostgreSQL

1. In Render dashboard, create a new PostgreSQL instance.
2. Copy its internal `DATABASE_URL`.

### 2. Create Render Web Service

1. Create a new Web Service from this repo.
2. Set root directory to `backend`.
3. Runtime: Node.
4. Build command: `npm install`.
5. Start command: `npm run start`.

### 3. Set Environment Variables (Render)

Required:

- `DATABASE_URL` (from Render Postgres)
- `WEBHOOK_SECRET`

Recommended:

- `CALL_DISPOSITION_TRIGGER_OPTION_ID=6`
- `CALL_DISPOSITION_TRIGGER_LABEL=LinkedIn Outreach next step`

Optional Pipedrive write-back:

- `PIPEDRIVE_BASE_URL`
- `PIPEDRIVE_API_TOKEN`
- `PERSON_DM_ELIGIBLE_FIELD_KEY`

After deploy, set extension option `backendBaseUrl` to your Render URL (for example `https://peak-access-backend.onrender.com`).

### 4. Verify

- `GET /health` returns `{ ok: true }`
- `GET /sequences` returns your sequence list
- Trigger webhook and confirm `GET /eligible/:personId` shows `eligible: true`

## Deploy Backend To Vercel (Basic Start)

This backend also supports a basic Vercel deployment.

### Vercel project settings

1. Import repo in Vercel.
2. Set project root directory to `backend`.
3. Framework preset: `Other`.
4. Build command: leave empty.
5. Output directory: leave empty.

### Required environment variables (Vercel)

- `WEBHOOK_SECRET`

Optional:

- `CALL_DISPOSITION_TRIGGER_OPTION_ID` (defaults to `6`)
- `CALL_DISPOSITION_TRIGGER_LABEL` (defaults to `LinkedIn Outreach next step`)
- `PIPEDRIVE_BASE_URL`
- `PIPEDRIVE_API_TOKEN`
- `PERSON_DM_ELIGIBLE_FIELD_KEY`
- `DATABASE_URL` (if you want durable eligibility storage)

### Notes for basic mode

- Endpoints remain the same (`/health`, `/sequences`, `/templates`, `/eligible/:personId`, `/pipedrive/webhook`).
- Without `DATABASE_URL`, eligibility queue falls back to `/tmp` on Vercel (ephemeral, good for quick testing only).

## Pipedrive Automation Setup

See: `PIPEDRIVE_AUTOMATION_SETUP.md`

## Test Checklist

See: `TEST_CHECKLIST.md`

## Security/Storage Notes

- No hardcoded secrets in source.
- Extension stores user config in `chrome.storage.sync`.
- Backend uses environment variables for webhook secret and optional Pipedrive write-back credentials.
- LinkedIn message sending is intentionally manual (human-in-the-loop).

## Known Limitations

- LinkedIn DOM selectors can change over time; composer insertion is best-effort with clipboard fallback.
- `src/lib/pipedrive.ts` is provided per requested path and mirrors runtime JS module exports.
- Queue storage uses PostgreSQL when `DATABASE_URL` is set; without it, backend falls back to local JSON file for development only.
