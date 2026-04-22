/**
 * uv.js — Ultraviolet proxy URL encoding
 *
 * Matches the codec used by @titaniumnetwork/ultraviolet.
 * In a real deployment, /uv/sw.js must be registered as a
 * service worker and /uv/uv.config.js must set the prefix.
 *
 * UV_PREFIX must match uv.config.js → uv.prefix
 */

const UV_PREFIX = "/uv/service/";

/**
 * Encode a string to base64url (URL-safe base64, no padding).
 * Matches ultraviolet's xor + b64 codec when xor key is 0 (plain b64url).
 */
function uvEncode(str) {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (e) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
}

/**
 * Decode a base64url string back to a URL.
 */
function uvDecode(encoded) {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return encoded;
  }
}

/**
 * Normalise a raw user input (URL or search query) to a full URL string.
 */
function normaliseInput(raw) {
  raw = raw.trim();
  if (!raw) return "";

  // Already a full URL
  if (/^https?:\/\//i.test(raw)) return raw;

  // Looks like a domain (contains a dot, no spaces)
  if (/^[a-z0-9-]+(\.[a-z]{2,})+/i.test(raw) && !raw.includes(" ")) {
    return "https://" + raw;
  }

  // Treat as a Google search
  return "https://www.google.com/search?q=" + encodeURIComponent(raw);
}

/**
 * Build the full proxy URL for a given user input.
 * Returns an empty string if input is empty.
 */
function buildProxyUrl(raw) {
  const url = normaliseInput(raw);
  if (!url) return "";
  return UV_PREFIX + uvEncode(url);
}

/**
 * Decode a proxy URL back to the original URL (for display in the URL bar).
 */
function decodeProxyUrl(proxyUrl) {
  if (!proxyUrl.startsWith(UV_PREFIX)) return proxyUrl;
  return uvDecode(proxyUrl.slice(UV_PREFIX.length));
}

/**
 * Get display URL (what to show in the URL bar) from a proxy URL.
 */
function getDisplayUrl(proxyUrl) {
  if (!proxyUrl) return "";
  if (proxyUrl.startsWith(UV_PREFIX)) return decodeProxyUrl(proxyUrl);
  return proxyUrl;
}

/**
 * Extract a short page title from a URL (hostname without www).
 */
function urlToTitle(urlStr) {
  try {
    const u = new URL(urlStr.startsWith("http") ? urlStr : "https://" + urlStr);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return urlStr.slice(0, 28);
  }
}

/**
 * Check whether the Ultraviolet service worker is registered.
 * Resolves to true/false.
 */
async function checkSWRegistered() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.some(
      (r) => r.active && r.active.scriptURL.includes("/uv/sw")
    );
  } catch {
    return false;
  }
}

/**
 * Attempt to register the UV service worker.
 * Call this once on page load in a real UV deployment.
 */
async function registerUVServiceWorker() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.register("/uv/sw.js", {
      scope: UV_PREFIX,
    });
    return true;
  } catch (e) {
    console.warn("UV SW registration failed:", e);
    return false;
  }
}
