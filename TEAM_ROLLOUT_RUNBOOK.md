# Peak Access Call Companion - Team Rollout Runbook

This runbook is for deploying and operating the Peak Access Chrome extension + backend for internal team use.

## 1) Ownership and access

### Required owners
- Product owner (Peak Access)
- Technical admin (extension + backend)
- Google Workspace admin (Chrome policy rollout)
- Pipedrive admin (automation + fields)

### Required systems
- GitHub repo access
- Vercel project access (backend)
- Google Cloud project access (OAuth)
- Pipedrive admin access
- Google Workspace admin access (if managed install)

---

## 2) Production configuration inventory

### Backend
- Base URL: `https://backend-gray-theta-93.vercel.app`
- Endpoints:
  - `/health`
  - `/sequences`
  - `/sequences/:id`
  - `/templates?sequence_id=<id>&stage=<n>`
  - `/eligible/:personId`
  - `/pipedrive/webhook`

### Vercel environment variables
Required:
- `WEBHOOK_SECRET`

Recommended:
- `DATABASE_URL`

Optional:
- `PIPEDRIVE_BASE_URL`
- `PIPEDRIVE_API_TOKEN`
- `PERSON_DM_ELIGIBLE_FIELD_KEY`
- `CALL_DISPOSITION_TRIGGER_OPTION_ID` (default `6`)
- `CALL_DISPOSITION_TRIGGER_LABEL`

### Extension options (per user)
Required:
- `Pipedrive API token`
- `backendBaseUrl`
- `personLinkedinProfileUrlKey`
- `personLinkedinDmSequenceIdKey`
- `personLinkedinDmStageKey`
- `personLinkedinDmLastSentAtKey`
- `personLinkedinDmEligibleKey`

Optional:
- `callDispositionFieldKey`
- `callDispositionTriggerOptionId`
- custom no-answer template JSON

---

## 3) Google OAuth (Gmail draft) setup

## Objective
Enable Gmail draft creation with scope `gmail.compose`.

### Steps
1. In Google Cloud project (Peak Access-owned), enable **Gmail API**.
2. In Google Auth Platform:
   - Configure Branding
   - Configure Audience (Internal or External test mode)
3. In **Data Access**, add scope:
   - `https://www.googleapis.com/auth/gmail.compose`
4. In **Clients**, create OAuth client:
   - Type: `Chrome Extension`
   - Item ID: extension ID (32-char lowercase)
5. Put OAuth client ID into `manifest.json` -> `oauth2.client_id`.
6. Reload extension and test `Create Gmail Draft`.

### Validation
- OAuth prompt appears
- Draft is created in Gmail Drafts

---

## 4) Pipedrive setup

## Person custom fields
Create and capture keys for:
- LinkedIn profile URL (text)
- LinkedIn DM sequence id (text)
- LinkedIn DM stage (number)
- LinkedIn DM last sent at (datetime)
- LinkedIn DM eligible (boolean)

## Activity trigger model
Depending on your Pipedrive plan/UI:
- Preferred: activity disposition contains LinkedIn trigger option
- Fallback: trigger on call completion/update and let backend mark eligibility

## Webhook configuration
Use webhook endpoint:

`https://backend-gray-theta-93.vercel.app/pipedrive/webhook?secret=<WEBHOOK_SECRET>`

If custom headers are supported, you can alternatively use header auth:
- `x-peak-access-secret: <WEBHOOK_SECRET>`

### Minimum webhook payload
```json
{
  "person_id": "<activity contact person id>"
}
```

### Validation
- Complete/update a call activity linked to a person
- Open:
  - `https://backend-gray-theta-93.vercel.app/eligible/<personId>`
- Expect `eligible: true`

---

## 5) Extension distribution options

## Option A (recommended): Google Workspace managed install
Best for team rollout and updates.

### Admin steps
1. In Google Admin Console:
   - Devices -> Chrome -> Apps & extensions -> Users & browsers
2. Add extension by ID/update URL (or private Web Store item)
3. Set policy: Force install (or allow install)
4. Target org unit/group

### Benefits
- Centralized install/update control
- No manual user install
- Policy-based permission governance

## Option B: Unpacked install (pilot/testing)
1. User opens `chrome://extensions`
2. Enables Developer mode
3. Clicks `Load unpacked`
4. Selects extension source folder

## Option C: CRX packaging (manual internal)
Use script:
```bash
./scripts/pack-extension.sh
```
Outputs:
- `dist/pipedrive-extension.crx`
- `dist/pipedrive-extension.pem`

Important:
- Chrome often blocks direct CRX drag install for unmanaged users (`CRX_REQUIRED_PROOF_MISSING`)
- `.pem` must be stored securely and reused for updates

---

## 6) Go-live checklist

## Backend
- [ ] `/health` returns ok
- [ ] `/sequences` returns sequence list
- [ ] env vars set correctly
- [ ] deploy logs clean

## Webhook
- [ ] Pipedrive webhook active
- [ ] secret configured
- [ ] test event marks person eligible

## Extension
- [ ] loads on Pipedrive and LinkedIn
- [ ] panel opens/closes correctly
- [ ] templates load in LinkedIn mode
- [ ] log and advance updates Pipedrive
- [ ] Gmail draft creation works

## UX
- [ ] launcher tabs movable and unobtrusive
- [ ] right-side panes slide in/out smoothly

---

## 7) Support playbook (common issues)

### Service worker shows "Inactive"
- This is normal in MV3; wakes on events.

### LinkedIn templates empty
- Verify `backendBaseUrl` in options
- Test backend `/sequences`
- Reload extension after options update

### Webhook returns unauthorized
- Secret mismatch
- Verify query `?secret=` or header value

### No person match in LinkedIn
- Verify person LinkedIn URL field key
- Use Search -> Confirm Match + Save URL

### Insert Template fails
- Open LinkedIn composer first
- Use Copy fallback

---

## 8) Security and key management

- Never commit API tokens or secrets
- Keep Vercel env vars managed in project settings
- Keep CRX `.pem` private and backed up securely
- Restrict admin access to OAuth, Vercel, Pipedrive automations

---

## 9) Change management and release process

1. Develop/test on branch
2. Merge to `main`
3. Deploy backend
4. Smoke test endpoints
5. Validate extension flows on test users
6. Roll out via Workspace policy
7. Monitor first-week logs and user feedback

---

## 10) Operational handoff data (fill and store securely)

- GitHub repo:
- Vercel project URL:
- Google Cloud project:
- OAuth client ID:
- Extension ID:
- Pipedrive company URL:
- Person field keys:
- Webhook secret location:
- On-call/support owner:
