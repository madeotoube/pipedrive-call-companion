# Pipedrive Automation Setup for LinkedIn Outreach Sequencer

## Required Custom Fields

### Person custom fields

1. `linkedin_profile_url` (Single line text)
2. `linkedin_dm_sequence_id` (Single line text)
3. `linkedin_dm_stage` (Numeric)
4. `linkedin_dm_last_sent_at` (Date + time)
5. `linkedin_dm_eligible` (Yes/No boolean)

Important:
- In Pipedrive API calls you must use each field's **API key** (hashed/custom key), not display labels.
- Save these keys in extension options.

### Activity custom field

Create multi-select field on Activity named `Call Disposition` with options:

1. Connected right person
2. Connected gatekeeper
3. No answer
4. No voicemail left
5. Voicemail left
6. LinkedIn Outreach next step

Trigger requirement:
- Use **option ID** for `LinkedIn Outreach next step` when possible.
- Labels can be renamed; IDs are stable and safer.

## Pipedrive Automation Rule

1. Go to Pipedrive Automations.
2. Create automation:
- Trigger: Activity updated/completed
- Activity type: Call
- Condition: `Call Disposition` contains option ID for `LinkedIn Outreach next step`
3. Action: Webhook (HTTP POST)
- URL: `https://<your-backend-host>/pipedrive/webhook`
- Header: `x-peak-access-secret: <WEBHOOK_SECRET>`
- Payload should include at least: `person_id`, activity info, selected call disposition values.

## Screenshots

- TODO: Add screenshot for custom field config.
- TODO: Add screenshot for automation trigger condition.
- TODO: Add screenshot for webhook action config.
