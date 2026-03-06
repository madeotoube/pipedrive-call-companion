function sanitizeHeaderValue(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function normalizeBody(body) {
  const text = String(body || "");
  return text.replace(/\r?\n/g, "\r\n");
}

export function buildRfc2822Message({ to, subject, body }) {
  const headers = [
    `To: ${sanitizeHeaderValue(to)}`,
    `Subject: ${sanitizeHeaderValue(subject)}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "",
    normalizeBody(body)
  ];

  return headers.join("\r\n");
}

export function base64UrlEncode(input) {
  const bytes = new TextEncoder().encode(input);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
