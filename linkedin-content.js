const HOST_ID = "peak-access-linkedin-host";
const SHADOW_WRAPPER_CLASS = "pa-linkedin-wrapper";
const STATE = {
  mounted: false
};

initLinkedInBridge();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));

  return true;
});

async function handleMessage(message) {
  const type = message?.type;

  if (type === "LINKEDIN_DETECT_CONTEXT") {
    return detectLinkedInContext();
  }

  if (type === "LINKEDIN_SET_COMPOSER_TEXT") {
    const text = String(message?.payload?.text || "");
    const inserted = await setComposerText(text);

    if (!inserted) {
      const copied = await fallbackCopyToClipboard(text);
      return { inserted: false, copied };
    }

    return { inserted: true, copied: false };
  }

  if (type === "LINKEDIN_GET_COMPOSER_TEXT") {
    return { text: getComposerText() };
  }

  if (type === "LINKEDIN_COPY_TEXT") {
    const copied = await fallbackCopyToClipboard(String(message?.payload?.text || ""));
    return { copied };
  }

  throw new Error("Unsupported LinkedIn content message.");
}

function initLinkedInBridge() {
  if (STATE.mounted) return;
  STATE.mounted = true;

  injectShadowWidget();
  watchUrlChanges();
}

function injectShadowWidget() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    document.documentElement.appendChild(host);
  }

  const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
  shadow.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = SHADOW_WRAPPER_CLASS;

  const style = document.createElement("style");
  style.textContent = `
    .${SHADOW_WRAPPER_CLASS} {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 2147483000;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(12, 18, 16, 0.88);
      color: #e8f7f1;
      border: 1px solid rgba(86, 151, 126, 0.7);
      border-radius: 999px;
      padding: 6px 10px;
      box-shadow: 0 10px 18px rgba(0, 0, 0, 0.22);
    }

    .${SHADOW_WRAPPER_CLASS} button {
      border: 0;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      color: #fff;
      background: #1f6f57;
    }

    .${SHADOW_WRAPPER_CLASS} .meta {
      font-size: 11px;
      opacity: 0.9;
      white-space: nowrap;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "LinkedIn Mode";
  button.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_LINKEDIN_SIDE_PANEL" });
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = buildMetaText();

  wrapper.appendChild(button);
  wrapper.appendChild(meta);
  shadow.appendChild(style);
  shadow.appendChild(wrapper);
}

function buildMetaText() {
  const context = detectLinkedInContext();

  if (context.isMessaging) {
    return `Messaging: ${context.profileName || "thread"}`;
  }

  if (context.profileUrl) {
    return `Profile: ${context.profileName || context.profileUrl}`;
  }

  return "Open a LinkedIn profile or messaging thread";
}

function watchUrlChanges() {
  let currentUrl = location.href;

  setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      injectShadowWidget();
    }
  }, 1000);
}

function detectLinkedInContext() {
  return {
    profileUrl: getLinkedInProfileUrl(),
    profileName: getProfileName(),
    profileHeadline: getProfileHeadline(),
    isMessaging: /^\/messaging\/?/i.test(location.pathname),
    threadTitle: getMessagingThreadTitle(),
    composerText: getComposerText(),
    emailHint: getEmailHintFromPage()
  };
}

function getLinkedInProfileUrl() {
  const href = location.href;

  if (/linkedin\.com\/in\//i.test(href)) {
    return canonicalizeProfileUrl(href);
  }

  const anchors = Array.from(document.querySelectorAll('a[href*="linkedin.com/in/"]'));
  for (const anchor of anchors) {
    if (anchor.href) {
      return canonicalizeProfileUrl(anchor.href);
    }
  }

  return "";
}

function canonicalizeProfileUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${parsed.pathname}`;
  } catch (_error) {
    return url;
  }
}

function getProfileName() {
  const candidates = [
    "h1.text-heading-xlarge",
    "h1",
    ".pv-text-details__left-panel h1"
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) return text;
  }

  return "";
}

function getProfileHeadline() {
  const candidates = [
    ".text-body-medium.break-words",
    ".pv-text-details__left-panel .text-body-medium"
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) return text;
  }

  return "";
}

function getMessagingThreadTitle() {
  const candidates = [
    ".msg-thread__link-to-profile .t-14.t-bold",
    ".msg-conversation-listitem__participant-names",
    ".msg-thread__subject"
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) return text;
  }

  return "";
}

function getComposerEditable() {
  const candidates = [
    "div.msg-form__contenteditable[contenteditable='true']",
    "div[role='textbox'][contenteditable='true']",
    ".msg-form__contenteditable"
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    if (el && isVisible(el)) return el;
  }

  return null;
}

function isVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function ensureMessageComposerOpen() {
  const existing = getComposerEditable();
  if (existing) return existing;

  const openComposerButtons = Array.from(document.querySelectorAll("button, a"));
  const target = openComposerButtons.find((element) => {
    const text = String(element.textContent || "").trim().toLowerCase();
    return text.includes("message") || text.includes("new message") || text.includes("send message");
  });

  if (target) {
    target.click();
  }

  return getComposerEditable();
}

async function setComposerText(text) {
  const composer = ensureMessageComposerOpen();
  if (!composer) return false;

  composer.focus();
  clearContentEditable(composer);

  const lines = String(text || "").split(/\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) {
      document.execCommand("insertLineBreak");
    }
    document.execCommand("insertText", false, lines[i]);
  }

  composer.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
  return true;
}

function clearContentEditable(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("delete", false);
}

function getComposerText() {
  const composer = getComposerEditable();
  if (!composer) return "";
  return String(composer.innerText || composer.textContent || "").trim();
}

async function fallbackCopyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    return true;
  } catch (_error) {
    return false;
  }
}

function getEmailHintFromPage() {
  const mailto = document.querySelector('a[href^="mailto:"]');
  if (mailto?.getAttribute("href")) {
    return mailto.getAttribute("href").replace(/^mailto:/i, "").trim();
  }

  return "";
}
