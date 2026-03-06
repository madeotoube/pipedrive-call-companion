# LinkedIn Outreach Sequencer Test Checklist

## Prerequisites

- Extension loaded and reloaded after latest changes.
- Pipedrive token saved in extension options.
- Pipedrive custom field keys configured in options.
- Backend running (`backend/server.js`) and reachable from extension.
- Sequences loaded in backend (`backend/data/sequences.json`).

## 1) Trigger pipeline eligibility

1. In Pipedrive, open or complete a call activity.
2. Select multi-select `Call Disposition` values including:
- `LinkedIn Outreach next step`
- and at least one additional option (to validate multi-select coexistence).
3. Save activity.
4. Confirm backend receives webhook.
5. Confirm backend marks person eligible:
- either queue (`/eligible/:personId`) is true
- or person custom field `linkedin_dm_eligible` is true.

## 2) LinkedIn context + matching

1. Open the target LinkedIn profile or messaging thread.
2. Open extension side panel (LinkedIn Mode).
3. Verify profile URL/name/thread context detected.
4. Verify matching order:
- linkedIn URL custom field exact match first
- email fallback second
- name candidates third with manual confirm
5. If name fallback used, confirm candidate and ensure LinkedIn URL writes back to Pipedrive person field.

## 3) Template workflow

1. Load sequence list from backend.
2. Stage defaults to current `linkedin_dm_stage`.
3. Select template.
4. Click `Insert Template`:
- best case: inserted into LinkedIn composer
- fallback: copied to clipboard
5. Edit message manually in LinkedIn (human-in-the-loop).
6. Send manually on LinkedIn.

## 4) Log & Advance

1. Click `Log & Advance` in side panel.
2. Verify Pipedrive note created with:
- DM content
- LinkedIn URL
- stage
- template ID
- timestamp
3. Verify person fields updated:
- `linkedin_dm_stage` incremented
- `linkedin_dm_last_sent_at` updated
- `linkedin_dm_sequence_id` set
- `linkedin_dm_eligible` cleared/false

## 5) Regression checks

- Existing Pipedrive pre-call panel still loads on deal/person pages.
- Existing Gmail draft flow still works.
- LinkedIn shadow widget does not break page layout.
