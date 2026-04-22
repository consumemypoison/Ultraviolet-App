/**
 * panels.js — Right-side panel rendering
 * Handles: history, bookmarks, downloads, passwords, VPN, settings
 */

// ── Sample data ───────────────────────────────────────────────
const HISTORY_DATA = [
  { title: "Google",        url: "https://google.com",          time: "2m ago",   icon: "🔍" },
  { title: "GitHub",        url: "https://github.com",          time: "18m ago",  icon: "🐙" },
  { title: "YouTube",       url: "https://youtube.com",         time: "1h ago",   icon: "▶️" },
  { title: "Reddit",        url: "https://reddit.com",          time: "2h ago",   icon: "🤖" },
  { title: "Stack Overflow",url: "https://stackoverflow.com",   time: "3h ago",   icon: "📚" },
  { title: "Wikipedia",     url: "https://wikipedia.org",       time: "Yesterday",icon: "📖" },
  { title: "Amazon",        url: "https://amazon.com",          time: "2d ago",   icon: "📦" },
];

const DOWNLOADS_DATA = [
  { name: "document.pdf",   size: "2.4 MB",  time: "Today",     done: true },
  { name: "setup.exe",      size: "45.2 MB", time: "Today",     done: true },
  { name: "image.png",      size: "1.1 MB",  time: "Yesterday", done: true },
  { name: "video.mp4",      size: "234 MB",  time: "2d ago",    done: true },
];

const BOOKMARKS_DATA = [
  { folder: "Bookmarks Bar", items: [
    { title: "Google",  url: "https://google.com",  icon: "🔍" },
    { title: "GitHub",  url: "https://github.com",  icon: "🐙" },
    { title: "YouTube", url: "https://youtube.com", icon: "▶️" },
  ]},
  { folder: "Other", items: [
    { title: "Reddit",       url: "https://reddit.com",             icon: "🤖" },
    { title: "Hacker News",  url: "https://news.ycombinator.com",   icon: "📰" },
  ]},
];

const PASSWORDS_DATA = [
  { site: "google.com",  user: "user@gmail.com",      icon: "🔍" },
  { site: "github.com",  user: "devuser@email.com",   icon: "🐙" },
  { site: "amazon.com",  user: "shopper@email.com",   icon: "📦" },
];

const VPN_SERVERS = [
  "US – New York", "US – Los Angeles", "UK – London",
  "DE – Frankfurt", "JP – Tokyo", "CA – Toronto", "AU – Sydney",
];

// ── renderPanel dispatcher ────────────────────────────────────
function renderPanel(name) {
  panelContent.innerHTML = "";
  switch (name) {
    case "history":   renderHistory();   break;
    case "downloads": renderDownloads(); break;
    case "bookmarks": renderBookmarks(); break;
    case "passwords": renderPasswords(); break;
    case "vpn":       renderVPN();       break;
    case "settings":  renderSettings();  break;
  }
}

// ── Shared helpers ────────────────────────────────────────────
function makePanelHead(iconSvg, label, actionHtml = "") {
  const h = document.createElement("div");
  h.className = "panel-head";
  h.innerHTML = `
    <span class="panel-head-icon">${iconSvg}</span>
    <span class="panel-head-title">${label}</span>
    ${actionHtml ? `<button class="panel-head-action">${actionHtml}</button>` : ""}
  `;
  return h;
}

function makeRow({ left, main, sub, right, onClick }) {
  const row = document.createElement("div");
  row.className = "panel-row";
  if (onClick) row.addEventListener("click", onClick);

  row.innerHTML = `
    <span class="panel-row-left">${left}</span>
    <div class="panel-row-body">
      <div class="panel-row-main">${main}</div>
      ${sub ? `<div class="panel-row-sub">${sub}</div>` : ""}
    </div>
    ${right ? `<span class="panel-row-right">${right}</span>` : ""}
  `;
  return row;
}

function makeToggle(on, onChange) {
  const btn = document.createElement("button");
  btn.className = "toggle" + (on ? " on" : "");
  btn.addEventListener("click", () => {
    const newVal = !btn.classList.contains("on");
    btn.classList.toggle("on", newVal);
    onChange(newVal);
  });
  return btn;
}

// ── HISTORY ───────────────────────────────────────────────────
function renderHistory() {
  panelContent.appendChild(makePanelHead(
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-5.11"/></svg>`,
    "History",
    "Clear all"
  ));

  HISTORY_DATA.forEach(h => {
    panelContent.appendChild(makeRow({
      left: `<span style="font-size:16px">${h.icon}</span>`,
      main: h.title,
      sub:  h.url,
      right: `<span class="panel-row-time">${h.time}</span>`,
      onClick: () => navigate(h.url),
    }));
  });
}

// ── DOWNLOADS ─────────────────────────────────────────────────
function renderDownloads() {
  panelContent.appendChild(makePanelHead(
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    "Downloads"
  ));

  DOWNLOADS_DATA.forEach(d => {
    const check = d.done
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--vpn)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : "";
    panelContent.appendChild(makeRow({
      left: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>`,
      main: d.name,
      sub:  `${d.size} · ${d.time}`,
      right: check,
    }));
  });
}

// ── BOOKMARKS ─────────────────────────────────────────────────
function renderBookmarks() {
  panelContent.appendChild(makePanelHead(
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    "Bookmarks"
  ));

  BOOKMARKS_DATA.forEach(folder => {
    const label = document.createElement("div");
    label.className = "bm-folder-label";
    label.textContent = folder.folder;
    panelContent.appendChild(label);

    folder.items.forEach(bm => {
      panelContent.appendChild(makeRow({
        left: `<span style="font-size:15px">${bm.icon}</span>`,
        main: bm.title,
        sub:  bm.url,
        onClick: () => navigate(bm.url),
      }));
    });
  });
}

// ── PASSWORDS ─────────────────────────────────────────────────
function renderPasswords() {
  panelContent.appendChild(makePanelHead(
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    "Passwords & Autofill"
  ));

  // Search
  const searchWrap = document.createElement("div");
  searchWrap.className = "pw-search-wrap";
  searchWrap.innerHTML = `
    <div class="pw-search">
      <span class="pw-search-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <input type="text" placeholder="Search passwords…" />
    </div>
  `;
  panelContent.appendChild(searchWrap);

  const list = document.createElement("div");
  list.className = "pw-list";

  const revealState = {};

  PASSWORDS_DATA.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "pw-card";
    card.innerHTML = `
      <div class="pw-card-row">
        <span class="pw-card-icon">${p.icon}</span>
        <div class="pw-card-info">
          <div class="pw-card-site">${p.site}</div>
          <div class="pw-card-user">${p.user}</div>
        </div>
        <div class="pw-card-btns">
          <button class="pw-btn reveal-btn" title="Show/hide password">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="pw-btn pw-copy-btn" title="Copy password">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
    `;

    const revealDiv = document.createElement("div");
    revealDiv.className = "pw-reveal";
    revealDiv.textContent = "••••••••••••";
    revealDiv.style.display = "none";
    card.appendChild(revealDiv);

    card.querySelector(".reveal-btn").addEventListener("click", () => {
      revealState[i] = !revealState[i];
      revealDiv.style.display = revealState[i] ? "block" : "none";
    });

    list.appendChild(card);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "pw-add-btn";
  addBtn.textContent = "+ Add password";
  list.appendChild(addBtn);

  panelContent.appendChild(list);
}

// ── VPN ───────────────────────────────────────────────────────
function renderVPN() {
  const wrap = document.createElement("div");
  wrap.className = "vpn-wrap";

  // Card
  const card = document.createElement("div");
  card.className = "vpn-card";

  const orb = document.createElement("div");
  orb.className = "vpn-orb" + (state.vpnOn ? " on" : "");
  orb.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

  const statusLabel = document.createElement("div");
  statusLabel.className = "vpn-status-label" + (state.vpnOn ? " on" : "");
  statusLabel.textContent = state.vpnOn ? "Protected" : "Not Protected";

  const statusSub = document.createElement("div");
  statusSub.className = "vpn-status-sub";
  statusSub.textContent = state.vpnOn ? state.vpnServer : "VPN is off";

  function toggleVPN() {
    state.vpnOn = !state.vpnOn;
    orb.classList.toggle("on", state.vpnOn);
    statusLabel.className = "vpn-status-label" + (state.vpnOn ? " on" : "");
    statusLabel.textContent = state.vpnOn ? "Protected" : "Not Protected";
    statusSub.textContent = state.vpnOn ? state.vpnServer : "VPN is off";
    connectBtn.textContent = state.vpnOn ? "Disconnect" : "Connect";
    connectBtn.classList.toggle("on", state.vpnOn);
    // Update sidebar icon
    const sidebarVpnIcon = document.getElementById("sidebar-vpn-icon");
    sidebarVpnIcon.classList.toggle("on", state.vpnOn);
    // Update toolbar VPN button color
    document.getElementById("btn-vpn").style.color = state.vpnOn ? "var(--vpn)" : "";
    updateNewTabStats();
  }

  orb.addEventListener("click", toggleVPN);
  card.appendChild(orb);
  card.appendChild(statusLabel);
  card.appendChild(statusSub);

  const connectBtn = document.createElement("button");
  connectBtn.className = "vpn-connect-btn" + (state.vpnOn ? " on" : "");
  connectBtn.textContent = state.vpnOn ? "Disconnect" : "Connect";
  connectBtn.addEventListener("click", toggleVPN);

  // Server list
  const serverLabel = document.createElement("div");
  serverLabel.className = "vpn-server-label";
  serverLabel.textContent = "Server Location";

  const serverList = document.createElement("div");
  serverList.className = "vpn-server-list";

  VPN_SERVERS.forEach(server => {
    const item = document.createElement("div");
    item.className = "vpn-server-item" + (state.vpnServer === server && state.vpnOn ? " selected" : "");
    item.innerHTML = `
      <span>${server}</span>
      ${state.vpnServer === server && state.vpnOn ? '<span class="vpn-server-check">✓</span>' : ""}
    `;
    item.addEventListener("click", () => {
      state.vpnServer = server;
      state.vpnOn = true;
      renderPanel("vpn"); // re-render with updated state
    });
    serverList.appendChild(item);
  });

  wrap.appendChild(card);
  wrap.appendChild(connectBtn);
  wrap.appendChild(serverLabel);
  wrap.appendChild(serverList);
  panelContent.appendChild(wrap);
}

// ── SETTINGS ─────────────────────────────────────────────────
function renderSettings() {
  const wrap = document.createElement("div");
  wrap.className = "settings-wrap";

  // Adblock toggle card
  const abCard = document.createElement("div");
  abCard.className = "settings-card";
  abCard.innerHTML = `<div class="settings-card-info"><div class="settings-card-label">Ad Blocker</div><div class="settings-card-desc">Block ads and trackers</div></div>`;
  const abToggle = makeToggle(state.adBlock, val => {
    state.adBlock = val;
    document.getElementById("btn-adblock").dataset.active = val ? "true" : "false";
    document.getElementById("btn-adblock").style.color = val ? "var(--accent)" : "var(--muted)";
    updateNewTabStats();
  });
  abCard.appendChild(abToggle);
  wrap.appendChild(abCard);

  // VPN toggle card
  const vpnCard = document.createElement("div");
  vpnCard.className = "settings-card";
  vpnCard.innerHTML = `<div class="settings-card-info"><div class="settings-card-label">VPN</div><div class="settings-card-desc">Encrypted proxy connection</div></div>`;
  const vpnToggle = makeToggle(state.vpnOn, val => {
    state.vpnOn = val;
    document.getElementById("sidebar-vpn-icon").classList.toggle("on", val);
    document.getElementById("btn-vpn").style.color = val ? "var(--vpn)" : "";
    updateNewTabStats();
  });
  vpnCard.appendChild(vpnToggle);
  wrap.appendChild(vpnCard);

  // UV info card
  const uvCard = document.createElement("div");
  uvCard.className = "settings-card-full";
  uvCard.innerHTML = `
    <div class="settings-card-label">Proxy Engine</div>
    <div class="settings-card-desc" style="margin-bottom:10px">Ultraviolet · Prefix: <code style="color:var(--accent);font-family:var(--font-mono)">/uv/service/</code></div>
    <div class="uv-info-row">
      <div class="uv-info-box">
        <div class="uv-info-box-label">SW STATUS</div>
        <div class="uv-info-box-val ${state.swReady ? "sw-on" : "sw-off"}">${state.swReady ? "✓ Registered" : "✗ Not registered"}</div>
      </div>
      <div class="uv-info-box">
        <div class="uv-info-box-label">CODEC</div>
        <div class="uv-info-box-val">base64url</div>
      </div>
      <div class="uv-info-box">
        <div class="uv-info-box-label">ENGINE</div>
        <div class="uv-info-box-val" style="color:var(--accent)">UV</div>
      </div>
    </div>
  `;
  wrap.appendChild(uvCard);

  // Zoom card
  const zoomCard = document.createElement("div");
  zoomCard.className = "settings-card-full";
  zoomCard.innerHTML = `<div class="settings-card-label">Page Zoom</div>`;
  const zoomRow = document.createElement("div");
  zoomRow.className = "zoom-row";

  const zoomOut = document.createElement("button");
  zoomOut.className = "zoom-btn"; zoomOut.textContent = "−";
  zoomOut.addEventListener("click", () => { setZoom(state.zoom - 10); zoomDisplay.textContent = state.zoom + "%"; });

  const zoomDisplay = document.createElement("span");
  zoomDisplay.className = "zoom-val";
  zoomDisplay.textContent = state.zoom + "%";

  const zoomIn = document.createElement("button");
  zoomIn.className = "zoom-btn"; zoomIn.textContent = "+";
  zoomIn.addEventListener("click", () => { setZoom(state.zoom + 10); zoomDisplay.textContent = state.zoom + "%"; });

  const zoomReset = document.createElement("button");
  zoomReset.className = "zoom-reset"; zoomReset.textContent = "Reset";
  zoomReset.addEventListener("click", () => { setZoom(100); zoomDisplay.textContent = "100%"; });

  zoomRow.append(zoomOut, zoomDisplay, zoomIn, zoomReset);
  zoomCard.appendChild(zoomRow);
  wrap.appendChild(zoomCard);

  // Nav items
  ["Search Engine", "Privacy & Security", "Appearance", "Extensions", "About"].forEach(label => {
    const item = document.createElement("div");
    item.className = "settings-nav-item";
    item.innerHTML = `<span>${label}</span><span class="settings-nav-arrow">›</span>`;
    wrap.appendChild(item);
  });

  panelContent.appendChild(wrap);
}
