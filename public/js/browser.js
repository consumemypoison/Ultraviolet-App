/**
 * browser.js — Core browser UI logic
 * Handles: tabs, URL bar, navigation, sidebar, dropdown menu,
 *          loading bar, SW check, clock, new tab page.
 */

// ── State ─────────────────────────────────────────────────────
const state = {
  tabs: [],
  activeTabId: null,
  zoom: 100,
  adBlock: true,
  vpnOn: false,
  vpnServer: "US – New York",
  swReady: false,
  panelOpen: null,   // 'history' | 'bookmarks' | 'downloads' | 'passwords' | 'vpn' | 'settings' | null
};

let tabIdCounter = 0;
function nextId() { return ++tabIdCounter; }

// ── DOM refs ──────────────────────────────────────────────────
const tabsContainer   = document.getElementById("tabs-container");
const urlInput        = document.getElementById("url-input");
const urlForm         = document.getElementById("url-form");
const urlBar          = document.getElementById("url-bar");
const urlLock         = document.getElementById("url-lock");
const urlClear        = document.getElementById("url-clear");
const loadBar         = document.getElementById("load-bar");
const loadProgress    = document.getElementById("load-progress");
const proxyFrameWrap  = document.getElementById("proxy-frame-wrap");
const proxyFrame      = document.getElementById("proxy-frame");
const newTabPage      = document.getElementById("new-tab-page");
const rightPanel      = document.getElementById("right-panel");
const panelContent    = document.getElementById("panel-content");
const dropdownMenu    = document.getElementById("dropdown-menu");
const ntClock         = document.getElementById("nt-clock");
const ntDate          = document.getElementById("nt-date");
const ntSearchInput   = document.getElementById("nt-search-input");
const ntSearchForm    = document.getElementById("nt-search-form");
const ntPreview       = document.getElementById("nt-preview");
const ntPreviewUrl    = document.getElementById("nt-preview-url");
const ntSwDot         = document.getElementById("nt-sw-dot");
const ntSwText        = document.getElementById("nt-sw-text");
const ntStatAdblock   = document.getElementById("nt-stat-adblock");
const ntStatVpn       = document.getElementById("nt-stat-vpn");
const swBanner        = document.getElementById("sw-banner");
const modalOverlay    = document.getElementById("modal-overlay");
const sidebarAdd      = document.getElementById("sidebar-add");
const sidebar         = document.getElementById("sidebar");

// ── Clock ─────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  ntClock.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  ntDate.textContent  = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
updateClock();
setInterval(updateClock, 10000);

// ── Service Worker ────────────────────────────────────────────
(async () => {
  // Try to register first (no-op if already registered or not deployed)
  await registerUVServiceWorker();
  state.swReady = await checkSWRegistered();

  if (state.swReady) {
    swBanner.classList.add("hidden");
    ntSwDot.classList.add("sw-active");
    ntSwText.textContent = "Ultraviolet proxy · service worker active";
  } else {
    swBanner.classList.remove("hidden");
    ntSwText.textContent = "Ultraviolet proxy · SW not registered — deploy with UV backend";
  }

  // Update settings panel if open
  if (state.panelOpen === "settings") renderPanel("settings");
})();

// ── Tabs ──────────────────────────────────────────────────────
function createTab(url = "") {
  const id = nextId();
  const tab = { id, url: "", displayUrl: "", title: "New Tab", proxied: false };
  state.tabs.push(tab);
  renderTabs();
  activateTab(id);
  if (url) navigate(url);
  return id;
}

function activateTab(id) {
  state.activeTabId = id;
  renderTabs();
  const tab = getActiveTab();
  urlInput.value = tab?.displayUrl || "";
  updateUrlBar(tab);
  showTabContent(tab);
}

function closeTab(id) {
  if (state.tabs.length === 1) return; // keep at least one
  const idx = state.tabs.findIndex(t => t.id === id);
  state.tabs = state.tabs.filter(t => t.id !== id);
  if (state.activeTabId === id) {
    const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
    activateTab(next.id);
  } else {
    renderTabs();
  }
}

function getActiveTab() {
  return state.tabs.find(t => t.id === state.activeTabId) || null;
}

function renderTabs() {
  tabsContainer.innerHTML = "";
  state.tabs.forEach(tab => {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === state.activeTabId ? " active" : "");
    el.dataset.id = tab.id;

    // favicon indicator
    const fav = document.createElement("span");
    fav.className = "tab-favicon" + (tab.proxied ? " proxied" : "");
    if (!tab.proxied) {
      fav.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
    }
    el.appendChild(fav);

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;
    el.appendChild(title);

    const close = document.createElement("button");
    close.className = "tab-close";
    close.textContent = "✕";
    close.addEventListener("click", e => { e.stopPropagation(); closeTab(tab.id); });
    el.appendChild(close);

    el.addEventListener("click", () => activateTab(tab.id));
    tabsContainer.appendChild(el);
  });
}

// ── Navigation ────────────────────────────────────────────────
function navigate(raw) {
  if (!raw || !raw.trim()) return;
  const tab = getActiveTab();
  if (!tab) return;

  const proxyUrl  = buildProxyUrl(raw.trim());
  const displayUrl = normaliseInput(raw.trim());
  const title     = urlToTitle(displayUrl);

  tab.url        = proxyUrl;
  tab.displayUrl = displayUrl;
  tab.title      = title;
  tab.proxied    = true;

  urlInput.value = displayUrl;
  updateUrlBar(tab);
  renderTabs();
  showTabContent(tab);
  startLoadBar();

  proxyFrame.src = proxyUrl;
}

function showTabContent(tab) {
  if (!tab || !tab.url) {
    // Show new tab page
    newTabPage.classList.remove("hidden");
    proxyFrameWrap.classList.add("hidden");
    urlInput.value = "";
  } else {
    newTabPage.classList.add("hidden");
    proxyFrameWrap.classList.remove("hidden");
    if (proxyFrame.src !== tab.url &&
        !proxyFrame.src.endsWith(tab.url)) {
      proxyFrame.src = tab.url;
    }
  }
  updateNewTabStats();
}

function goHome() {
  const tab = getActiveTab();
  if (!tab) return;
  tab.url = "";
  tab.displayUrl = "";
  tab.title = "New Tab";
  tab.proxied = false;
  urlInput.value = "";
  updateUrlBar(tab);
  renderTabs();
  showTabContent(tab);
}

function updateUrlBar(tab) {
  if (!tab || !tab.proxied) {
    urlBar.classList.remove("proxied");
    urlLock.className = "url-lock";
    urlLock.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
  } else {
    urlBar.classList.add("proxied");
    urlLock.className = "url-lock proxied-lock";
    urlLock.innerHTML = "";
  }
}

// ── Load Bar ──────────────────────────────────────────────────
let loadTimeout = null;
function startLoadBar() {
  loadBar.classList.remove("hidden");
  loadBar.classList.add("loading");
  clearTimeout(loadTimeout);
  loadTimeout = setTimeout(() => {
    loadBar.classList.remove("loading");
    loadBar.classList.add("hidden");
    loadProgress.style.width = "0%";
  }, 1500);
}

// ── URL Bar events ────────────────────────────────────────────
urlInput.addEventListener("input", () => {
  urlClear.classList.toggle("hidden", !urlInput.value);
});

urlForm.addEventListener("submit", e => {
  e.preventDefault();
  navigate(urlInput.value);
  urlInput.blur();
});

urlClear.addEventListener("click", () => {
  urlInput.value = "";
  urlClear.classList.add("hidden");
  urlInput.focus();
});

// ── Nav buttons ───────────────────────────────────────────────
document.getElementById("btn-new-tab").addEventListener("click", () => createTab());
document.getElementById("btn-home").addEventListener("click", goHome);
document.getElementById("btn-refresh").addEventListener("click", () => {
  const tab = getActiveTab();
  if (tab && tab.url) {
    startLoadBar();
    proxyFrame.src = proxyFrame.src; // reload
  }
});
document.getElementById("btn-back").addEventListener("click", () => {
  try { proxyFrame.contentWindow.history.back(); } catch {}
});
document.getElementById("btn-fwd").addEventListener("click", () => {
  try { proxyFrame.contentWindow.history.forward(); } catch {}
});

// ── Adblock toggle ────────────────────────────────────────────
const btnAdblock = document.getElementById("btn-adblock");
btnAdblock.addEventListener("click", () => {
  state.adBlock = !state.adBlock;
  btnAdblock.dataset.active = state.adBlock ? "true" : "false";
  btnAdblock.style.color = state.adBlock
    ? "var(--accent)"
    : "var(--muted)";
  updateNewTabStats();
});

// ── VPN toggle (toolbar) ──────────────────────────────────────
const btnVpn = document.getElementById("btn-vpn");
btnVpn.addEventListener("click", () => openPanel("vpn"));

// ── Sidebar ───────────────────────────────────────────────────
document.querySelectorAll(".sidebar-app[data-url]").forEach(el => {
  el.addEventListener("click", () => navigate(el.dataset.url));
});

document.getElementById("sidebar-vpn").addEventListener("click", () => openPanel("vpn"));

sidebarAdd.addEventListener("click", () => {
  modalOverlay.classList.remove("hidden");
  document.getElementById("modal-label").focus();
});

// Custom shortcut modal
document.getElementById("modal-cancel").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
document.getElementById("modal-confirm").addEventListener("click", () => {
  const label = document.getElementById("modal-label").value.trim();
  const url   = document.getElementById("modal-url").value.trim();
  if (!url) return;
  addCustomShortcut(label || url, url);
  closeModal();
});

function closeModal() {
  modalOverlay.classList.add("hidden");
  document.getElementById("modal-label").value = "";
  document.getElementById("modal-url").value = "";
}

function addCustomShortcut(label, url) {
  const el = document.createElement("div");
  el.className = "sidebar-custom";
  el.title = label;
  el.textContent = "🌐";
  el.addEventListener("click", () => navigate(url));
  el.addEventListener("mouseenter", () => el.style.transform = "scale(1.1)");
  el.addEventListener("mouseleave", () => el.style.transform = "scale(1)");
  // Insert before the spacer / add button
  const spacer = sidebar.querySelector(".sidebar-spacer");
  sidebar.insertBefore(el, spacer);
}

// ── New Tab Page ──────────────────────────────────────────────
ntSearchForm.addEventListener("submit", e => {
  e.preventDefault();
  const val = ntSearchInput.value.trim();
  if (!val) return;
  navigate(val);
  ntSearchInput.value = "";
  ntPreview.classList.remove("visible");
});

ntSearchInput.addEventListener("input", () => {
  const val = ntSearchInput.value.trim();
  if (val) {
    const encoded = buildProxyUrl(val);
    ntPreviewUrl.textContent = encoded;
    ntPreview.classList.add("visible");
  } else {
    ntPreview.classList.remove("visible");
  }
});

document.querySelectorAll(".quick-item[data-url]").forEach(el => {
  el.addEventListener("click", () => navigate(el.dataset.url));
});

function updateNewTabStats() {
  // Adblock stat
  const abDot  = ntStatAdblock.querySelector(".stat-dot");
  ntStatAdblock.lastChild.textContent = state.adBlock ? " Ad Block ON" : " Ad Block OFF";
  abDot.className = "stat-dot" + (state.adBlock ? " green" : "");

  // VPN stat
  const vpnDot = ntStatVpn.querySelector(".stat-dot");
  ntStatVpn.lastChild.textContent = state.vpnOn
    ? ` VPN: ${state.vpnServer}`
    : " VPN OFF";
  vpnDot.className = "stat-dot" + (state.vpnOn ? " green" : " off");
}

// ── Panels ────────────────────────────────────────────────────
function openPanel(name) {
  if (state.panelOpen === name) {
    closePanel();
    return;
  }
  state.panelOpen = name;
  rightPanel.classList.remove("hidden");
  renderPanel(name);

  // Mark toolbar button active
  syncToolbarActive();
}

function closePanel() {
  state.panelOpen = null;
  rightPanel.classList.add("hidden");
  syncToolbarActive();
}

function syncToolbarActive() {
  const map = {
    downloads: "btn-downloads",
    bookmarks: "btn-bookmarks",
    history:   "btn-history",
    vpn:       "btn-vpn",
  };
  Object.values(map).forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });
  if (state.panelOpen && map[state.panelOpen]) {
    document.getElementById(map[state.panelOpen])?.classList.add("active");
  }
}

document.getElementById("panel-close").addEventListener("click", closePanel);

// Toolbar panel buttons
document.getElementById("btn-downloads").addEventListener("click", () => openPanel("downloads"));
document.getElementById("btn-bookmarks").addEventListener("click", () => openPanel("bookmarks"));
document.getElementById("btn-history").addEventListener("click",   () => openPanel("history"));

// ── Dropdown Menu ─────────────────────────────────────────────
const btnMenu = document.getElementById("btn-menu");

btnMenu.addEventListener("click", e => {
  e.stopPropagation();
  dropdownMenu.classList.toggle("hidden");
});
document.addEventListener("click", () => dropdownMenu.classList.add("hidden"));
dropdownMenu.addEventListener("click", e => e.stopPropagation());

document.getElementById("dm-new-tab").addEventListener("click",  () => { createTab(); dropdownMenu.classList.add("hidden"); });
document.getElementById("dm-history").addEventListener("click",  () => { openPanel("history"); dropdownMenu.classList.add("hidden"); });
document.getElementById("dm-bookmarks").addEventListener("click",() => { openPanel("bookmarks"); dropdownMenu.classList.add("hidden"); });
document.getElementById("dm-downloads").addEventListener("click",() => { openPanel("downloads"); dropdownMenu.classList.add("hidden"); });
document.getElementById("dm-settings").addEventListener("click", () => { openPanel("settings"); dropdownMenu.classList.add("hidden"); });

// Zoom controls in dropdown
const zoomVal = document.getElementById("zoom-val");
function setZoom(z) {
  state.zoom = Math.max(50, Math.min(200, z));
  zoomVal.textContent = state.zoom + "%";
  proxyFrame.style.transform = `scale(${state.zoom / 100})`;
  proxyFrame.style.transformOrigin = "top left";
  if (state.zoom !== 100) {
    proxyFrame.style.width  = (10000 / state.zoom) + "%";
    proxyFrame.style.height = (10000 / state.zoom) + "%";
  } else {
    proxyFrame.style.width  = "100%";
    proxyFrame.style.height = "100%";
  }
}
document.getElementById("zoom-out").addEventListener("click",   () => setZoom(state.zoom - 10));
document.getElementById("zoom-in").addEventListener("click",    () => setZoom(state.zoom + 10));
document.getElementById("zoom-reset").addEventListener("click", () => setZoom(100));

// SW Banner dismiss
document.getElementById("sw-dismiss").addEventListener("click", () => {
  swBanner.classList.add("hidden");
});

// ── Keyboard shortcuts ─────────────────────────────────────────
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "t") {
    e.preventDefault();
    createTab();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "l") {
    e.preventDefault();
    urlInput.focus();
    urlInput.select();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "w") {
    e.preventDefault();
    if (state.activeTabId) closeTab(state.activeTabId);
  }
  if (e.key === "Escape") {
    closePanel();
    dropdownMenu.classList.add("hidden");
    modalOverlay.classList.add("hidden");
  }
});

// ── Boot ──────────────────────────────────────────────────────
createTab(); // open first tab
