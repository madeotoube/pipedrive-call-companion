const DEFAULTS = {
  apiToken: "",
  autoOpenPanel: true,
  showNotes: true,
  showActivities: true,
  emailTemplatesByStage: ""
};

const refs = {
  apiToken: document.getElementById("apiToken"),
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
    refs.emailTemplatesByStage.value = result.emailTemplatesByStage || "";
    refs.autoOpenPanel.checked = Boolean(result.autoOpenPanel);
    refs.showNotes.checked = Boolean(result.showNotes);
    refs.showActivities.checked = Boolean(result.showActivities);
  });
}

function save() {
  const apiToken = String(refs.apiToken.value || "").trim();
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
