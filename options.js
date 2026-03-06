const DEFAULTS = {
  apiToken: "",
  autoOpenPanel: true,
  showNotes: true,
  showActivities: true,
  emailTemplatesByStage: "",
  backendBaseUrl: "http://localhost:8787",
  personLinkedinProfileUrlKey: "person.linkedin_profile_url",
  personLinkedinDmSequenceIdKey: "person.linkedin_dm_sequence_id",
  personLinkedinDmStageKey: "person.linkedin_dm_stage",
  personLinkedinDmLastSentAtKey: "person.linkedin_dm_last_sent_at",
  personLinkedinDmEligibleKey: "person.linkedin_dm_eligible",
  callDispositionFieldKey: "activity.call_disposition",
  callDispositionTriggerOptionId: "6",
  callDispositionTriggerOptionLabel: "LinkedIn Outreach next step"
};

const refs = {
  apiToken: document.getElementById("apiToken"),
  backendBaseUrl: document.getElementById("backendBaseUrl"),
  personLinkedinProfileUrlKey: document.getElementById("personLinkedinProfileUrlKey"),
  personLinkedinDmSequenceIdKey: document.getElementById("personLinkedinDmSequenceIdKey"),
  personLinkedinDmStageKey: document.getElementById("personLinkedinDmStageKey"),
  personLinkedinDmLastSentAtKey: document.getElementById("personLinkedinDmLastSentAtKey"),
  personLinkedinDmEligibleKey: document.getElementById("personLinkedinDmEligibleKey"),
  callDispositionFieldKey: document.getElementById("callDispositionFieldKey"),
  callDispositionTriggerOptionId: document.getElementById("callDispositionTriggerOptionId"),
  emailTemplatesByStage: document.getElementById("emailTemplatesByStage"),
  autoOpenPanel: document.getElementById("autoOpenPanel"),
  showNotes: document.getElementById("showNotes"),
  showActivities: document.getElementById("showActivities"),
  save: document.getElementById("save"),
  reset: document.getElementById("reset"),
  status: document.getElementById("status")
};

init();

function init() {
  restore();

  refs.save.addEventListener("click", save);
  refs.reset.addEventListener("click", resetDefaults);
}

function restore() {
  chrome.storage.sync.get(DEFAULTS, (result) => {
    refs.apiToken.value = result.apiToken || "";
    refs.backendBaseUrl.value = result.backendBaseUrl || "";
    refs.personLinkedinProfileUrlKey.value = result.personLinkedinProfileUrlKey || "";
    refs.personLinkedinDmSequenceIdKey.value = result.personLinkedinDmSequenceIdKey || "";
    refs.personLinkedinDmStageKey.value = result.personLinkedinDmStageKey || "";
    refs.personLinkedinDmLastSentAtKey.value = result.personLinkedinDmLastSentAtKey || "";
    refs.personLinkedinDmEligibleKey.value = result.personLinkedinDmEligibleKey || "";
    refs.callDispositionFieldKey.value = result.callDispositionFieldKey || "";
    refs.callDispositionTriggerOptionId.value = result.callDispositionTriggerOptionId || "";
    refs.emailTemplatesByStage.value = result.emailTemplatesByStage || "";
    refs.autoOpenPanel.checked = Boolean(result.autoOpenPanel);
    refs.showNotes.checked = Boolean(result.showNotes);
    refs.showActivities.checked = Boolean(result.showActivities);
  });
}

function save() {
  const apiToken = String(refs.apiToken.value || "").trim();
  const backendBaseUrl = String(refs.backendBaseUrl.value || "").trim();
  const personLinkedinProfileUrlKey = String(refs.personLinkedinProfileUrlKey.value || "").trim();
  const personLinkedinDmSequenceIdKey = String(refs.personLinkedinDmSequenceIdKey.value || "").trim();
  const personLinkedinDmStageKey = String(refs.personLinkedinDmStageKey.value || "").trim();
  const personLinkedinDmLastSentAtKey = String(refs.personLinkedinDmLastSentAtKey.value || "").trim();
  const personLinkedinDmEligibleKey = String(refs.personLinkedinDmEligibleKey.value || "").trim();
  const callDispositionFieldKey = String(refs.callDispositionFieldKey.value || "").trim();
  const callDispositionTriggerOptionId = String(refs.callDispositionTriggerOptionId.value || "").trim();
  const emailTemplatesByStage = String(refs.emailTemplatesByStage.value || "").trim();

  if (emailTemplatesByStage) {
    try {
      JSON.parse(emailTemplatesByStage);
    } catch (_error) {
      setStatus("Template JSON is invalid. Fix formatting before saving.", true);
      return;
    }
  }

  chrome.storage.sync.set(
    {
      apiToken,
      backendBaseUrl,
      personLinkedinProfileUrlKey,
      personLinkedinDmSequenceIdKey,
      personLinkedinDmStageKey,
      personLinkedinDmLastSentAtKey,
      personLinkedinDmEligibleKey,
      callDispositionFieldKey,
      callDispositionTriggerOptionId,
      emailTemplatesByStage,
      autoOpenPanel: refs.autoOpenPanel.checked,
      showNotes: refs.showNotes.checked,
      showActivities: refs.showActivities.checked
    },
    () => {
      if (chrome.runtime.lastError) {
        setStatus(`Failed to save: ${chrome.runtime.lastError.message}`, true);
        return;
      }

      setStatus("Settings saved.");
    }
  );
}

function resetDefaults() {
  chrome.storage.sync.set({ ...DEFAULTS }, () => {
    restore();
    setStatus("Defaults restored.");
  });
}

function setStatus(message, isError = false) {
  refs.status.textContent = message;
  refs.status.style.color = isError ? "#8b2424" : "#2f4841";
}
