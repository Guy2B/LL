/* Lune Beauty — Staff Cloud Sync (Google Sheets + Apps Script)
   Beta gratuite: synchronise l'objet complet `db` entre mobile/ordinateur.
   - API URL + secret token sont stockés uniquement dans le navigateur staff.
   - Les visiteurs du site peuvent seulement créer une demande RDV via publicBooking.
*/
(() => {
  "use strict";

  const CONFIG_KEY = "lune_staff_cloud_config_v1";
  const PLACEHOLDER = "PASTE_GOOGLE_APPS_SCRIPT_STAFF_CLOUD_URL_HERE";
  const CLIENT_ID_KEY = "lune_staff_cloud_client_id_v1";
  const LAST_VERSION_KEY = "lune_staff_cloud_last_version_v1";
  const LAST_PULL_KEY = "lune_staff_cloud_last_pull_v1";
  const LAST_PUSH_KEY = "lune_staff_cloud_last_push_v1";
  const SEEN_SITE_BOOKINGS_KEY = "lune_staff_seen_site_bookings_v1";

  let uploadTimer = null;
  let pullTimer = null;
  let suppressAutoUpload = false;
  let lastKnownCloudVersion = localStorage.getItem(LAST_VERSION_KEY) || "";

  function byId(id) { return document.getElementById(id); }
  function nowIso() { return new Date().toISOString(); }
  function clientId() {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = "staff-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }
  function readConfig() {
    try {
      return Object.assign({ apiUrl: "", token: "", auto: true }, JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"));
    } catch (_) {
      return { apiUrl: "", token: "", auto: true };
    }
  }
  function writeConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(Object.assign(readConfig(), cfg || {})));
  }
  function apiReady() {
    const cfg = readConfig();
    return cfg.apiUrl && cfg.apiUrl !== PLACEHOLDER && cfg.token;
  }
  function setStatus(message, type = "info") {
    const el = byId("cloudSyncStatus");
    if (el) {
      el.textContent = message;
      el.dataset.type = type;
      el.style.color = type === "error" ? "#b83227" : (type === "ok" ? "#166534" : "#777");
    }
    const mini = byId("cloudMiniStatus");
    if (mini) {
      mini.className = type === "error" ? "error" : (apiReady() ? "ok" : "");
      mini.textContent = type === "error" ? "Cloud erreur" : (apiReady() ? "Cloud actif" : "Cloud à connecter");
    }
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  }

  function addCloudPanel() {
    if (byId("cloudSyncPanel")) return;
    const settings = byId("protectedSettings") || byId("settings") || document.querySelector("main");
    if (!settings) return;

    const cfg = readConfig();
    const panel = document.createElement("div");
    panel.id = "cloudSyncPanel";
    panel.className = "card setupGate";
    panel.innerHTML = `
      <h2>Cloud Staff</h2>
      <p class="small">Base centrale Google Sheets / Apps Script. L'utilisateur travaille normalement : le Cloud synchronise automatiquement.</p>
      <div class="row">
        <input id="cloudApiUrl" placeholder="URL Google Apps Script Web App" value="${esc(cfg.apiUrl || "")}">
        <input id="cloudToken" type="password" placeholder="Token secret Staff" value="${esc(cfg.token || "")}">
      </div>
      <div class="backupGrid noPrint" style="display:flex;flex-wrap:wrap;gap:8px;">
        <button class="gold" id="cloudSaveCfgBtn" type="button">Sauver connexion Cloud</button>
        <button class="secondary" id="cloudCheckBtn" type="button">Tester</button>
      </div>
      <p id="cloudSyncStatus" class="small">Cloud non configuré.</p>
      <details class="cloud-advanced">
        <summary>Migration / dépannage</summary>
        <p class="small">À utiliser seulement au démarrage ou en cas de support. En usage normal, ne pas toucher.</p>
        <label class="checkRow" style="display:flex;align-items:center;gap:10px;margin:8px 0;">
          <input id="cloudAuto" type="checkbox" style="width:auto" ${cfg.auto !== false ? "checked" : ""}>
          Synchronisation automatique sur cet appareil
        </label>
        <div class="backupGrid noPrint" style="display:flex;flex-wrap:wrap;gap:8px;">
          <button class="secondary" id="cloudPullBtn" type="button">Importer Cloud → cet appareil</button>
          <button class="secondary" id="cloudPushBtn" type="button">Envoyer cet appareil → Cloud</button>
        </div>
      </details>
    `;

    settings.insertBefore(panel, settings.firstChild);

    byId("cloudSaveCfgBtn")?.addEventListener("click", () => {
      writeConfig({
        apiUrl: String(byId("cloudApiUrl")?.value || "").trim(),
        token: String(byId("cloudToken")?.value || "").trim(),
        auto: byId("cloudAuto") ? !!byId("cloudAuto")?.checked : true
      });
      applyAutoSync();
      setStatus("Connexion Cloud sauvegardée. Synchronisation automatique active.", "ok");
      window.LuneMinimalStaffUi?.refresh?.();
    });
    byId("cloudAuto")?.addEventListener("change", () => {
      writeConfig({ auto: !!byId("cloudAuto")?.checked });
      applyAutoSync();
      window.LuneMinimalStaffUi?.refresh?.();
    });
    byId("cloudCheckBtn")?.addEventListener("click", testCloud);
    byId("cloudPullBtn")?.addEventListener("click", () => pullCloud(true));
    byId("cloudPushBtn")?.addEventListener("click", () => pushCloud(true));

    refreshStatusLine();
  }

  function refreshStatusLine() {
    if (!byId("cloudSyncStatus")) return;
    const lp = localStorage.getItem(LAST_PULL_KEY);
    const lu = localStorage.getItem(LAST_PUSH_KEY);
    if (!apiReady()) {
      setStatus("Cloud non configuré : collez l'URL Apps Script et le token secret.", "info");
      return;
    }
    setStatus(`Cloud configuré. Dernier import: ${lp || "—"}. Dernier envoi: ${lu || "—"}.`, "ok");
  }

  function jsonp(action, params = {}) {
    const cfg = readConfig();
    const url = cfg.apiUrl;
    return new Promise((resolve, reject) => {
      if (!apiReady()) return reject(new Error("Cloud non configuré"));
      const cb = "luneStaffCloudCb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const query = new URLSearchParams(Object.assign({}, params, {
        action,
        token: cfg.token,
        clientId: clientId(),
        callback: cb,
        _: Date.now()
      }));
      const script = document.createElement("script");
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout Cloud"));
      }, 15000);
      function cleanup() {
        clearTimeout(timer);
        delete window[cb];
        script.remove();
      }
      window[cb] = (data) => {
        cleanup();
        if (data && data.ok === false) reject(new Error(data.error || "Erreur Cloud"));
        else resolve(data || {});
      };
      script.onerror = () => { cleanup(); reject(new Error("Cloud non joignable")); };
      script.src = url + (url.includes("?") ? "&" : "?") + query.toString();
      document.head.appendChild(script);
    });
  }

  function hiddenPost(payload) {
    const cfg = readConfig();
    return new Promise((resolve) => {
      const iframeName = "luneStaffCloudPost_" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = cfg.apiUrl;
      form.target = iframeName;
      form.style.display = "none";

      Object.entries(Object.assign({}, payload, { token: cfg.token, clientId: clientId() })).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value ?? "");
        form.appendChild(input);
      });

      document.body.appendChild(form);
      iframe.addEventListener("load", () => setTimeout(resolve, 250), { once: true });
      form.submit();
      setTimeout(resolve, 1800);
      setTimeout(() => { form.remove(); iframe.remove(); }, 7000);
    });
  }

  async function testCloud() {
    try {
      if (!apiReady()) throw new Error("URL/token manquant");
      setStatus("Test Cloud en cours…", "info");
      const res = await jsonp("health");
      setStatus(`Cloud OK · version: ${res.version || "—"}`, "ok");
    } catch (err) {
      setStatus("Erreur Cloud: " + err.message, "error");
    }
  }

  function safeLocalBackup(label) {
    try {
      const key = (typeof KEY !== "undefined" ? KEY : "lune_staff") + "_before_cloud_" + label + "_" + new Date().toISOString().replace(/[:.]/g, "-");
      localStorage.setItem(key, JSON.stringify(typeof db !== "undefined" ? db : {}));
      return key;
    } catch (_) {
      return "";
    }
  }

  async function pullCloud(manual = false) {
    try {
      if (!apiReady()) throw new Error("URL/token manquant");
      setStatus("Import Cloud en cours…", "info");
      const res = await jsonp("state");
      if (!res.state) {
        setStatus("Cloud vide. Utilise d'abord “Envoyer cet appareil → Cloud”.", "info");
        return;
      }
      if (manual && !confirm("Importer le Cloud sur cet appareil ? Un backup local sera créé avant remplacement.")) return;
      safeLocalBackup("pull");

      suppressAutoUpload = true;
      db = (typeof normalizeDb === "function") ? normalizeDb(res.state) : res.state;
      if (typeof KEY !== "undefined") localStorage.setItem(KEY, JSON.stringify(db));
      if (typeof renderAll === "function") renderAll();
      if (typeof loadSettings === "function") loadSettings();
      suppressAutoUpload = false;

      lastKnownCloudVersion = String(res.version || "");
      localStorage.setItem(LAST_VERSION_KEY, lastKnownCloudVersion);
      localStorage.setItem(LAST_PULL_KEY, new Date().toLocaleString("fr-FR"));
      setStatus("Import Cloud terminé.", "ok");
      updateSiteBookingNotifications({ alertNew: true });
    } catch (err) {
      suppressAutoUpload = false;
      setStatus("Erreur import Cloud: " + err.message, "error");
    }
  }

  async function pushCloud(manual = false) {
    try {
      if (!apiReady()) throw new Error("URL/token manquant");
      if (typeof db === "undefined") throw new Error("Base Staff introuvable");
      if (manual && !confirm("Envoyer les données de cet appareil vers le Cloud ? Cela remplace le dernier état Cloud.")) return;
      setStatus("Envoi Cloud en cours…", "info");
      await hiddenPost({
        action: "saveState",
        baseVersion: lastKnownCloudVersion || "",
        state: JSON.stringify(db),
        updatedBy: clientId()
      });
      localStorage.setItem(LAST_PUSH_KEY, new Date().toLocaleString("fr-FR"));
      // Read back metadata so we know the new version.
      try {
        const res = await jsonp("health");
        lastKnownCloudVersion = String(res.version || lastKnownCloudVersion || "");
        localStorage.setItem(LAST_VERSION_KEY, lastKnownCloudVersion);
      } catch (_) {}
      setStatus("Envoi Cloud terminé.", "ok");
      updateSiteBookingNotifications({ alertNew: false });
    } catch (err) {
      setStatus("Erreur envoi Cloud: " + err.message, "error");
    }
  }

  async function pullIfNewer() {
    if (!apiReady() || suppressAutoUpload) return;
    try {
      const res = await jsonp("health");
      const v = String(res.version || "");
      if (v && v !== lastKnownCloudVersion) {
        await pullCloud(false);
      }
    } catch (_) {}
  }

  function queueUpload() {
    const cfg = readConfig();
    if (!cfg.auto || !apiReady() || suppressAutoUpload) return;
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(() => pushCloud(false), 1600);
  }

  function wrapPersist() {
    if (typeof persist !== "function" || persist.__cloudWrapped) return;
    const original = persist;
    const wrapped = function cloudPersistWrapper() {
      const result = original.apply(this, arguments);
      queueUpload();
      return result;
    };
    wrapped.__cloudWrapped = true;
    try { persist = wrapped; } catch (_) {}
  }

  function applyAutoSync() {
    clearInterval(pullTimer);
    const cfg = readConfig();
    if (cfg.auto && apiReady()) {
      pullTimer = setInterval(pullIfNewer, 30000);
      setTimeout(pullIfNewer, 2000);
    }
    refreshStatusLine();
  }




  function injectBookingNotifyCss() {
    if (document.getElementById("luneStaffBookingNotifyCss")) return;
    const css = document.createElement("style");
    css.id = "luneStaffBookingNotifyCss";
    css.textContent = `
      #siteBookingBadge{display:none;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:#b83227;color:#fff;font-size:12px;font-weight:900;line-height:22px;text-align:center;margin-left:6px;vertical-align:middle;box-shadow:0 6px 18px rgba(184,50,39,.22)}
      #cloudMiniStatus.has-new:after{content:' · nouveau RDV';color:#b83227;font-weight:800}
      .lune-staff-toast{position:fixed;right:22px;top:112px;z-index:99999;max-width:360px;background:#211815;color:#fff;border-radius:20px;padding:14px 16px;box-shadow:0 18px 45px rgba(0,0,0,.24);font-weight:700;line-height:1.35;animation:luneStaffToastIn .25s ease-out}
      .lune-staff-toast small{display:block;margin-top:4px;color:#eadbc6;font-weight:500}
      @keyframes luneStaffToastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
      @media(max-width:700px){.lune-staff-toast{left:14px;right:14px;top:auto;bottom:98px;max-width:none}}
    `;
    document.head.appendChild(css);
  }

  function pendingSiteBookings() {
    if (typeof db === "undefined" || !db || !Array.isArray(db.bookings)) return [];
    return db.bookings.filter(b => {
      const status = String(b.status || "").toLowerCase();
      const source = String(b.source || b.createdFrom || "").toLowerCase();
      return status === "angefragt" && (source.includes("website") || source.includes("web") || b.createdAt);
    });
  }

  function bookingNotifyId(b) {
    return String(b.id || [b.phone,b.service,b.date,b.time].join("|"));
  }

  function readSeenBookingIds() {
    try { return JSON.parse(localStorage.getItem(SEEN_SITE_BOOKINGS_KEY) || "[]"); } catch (_) { return []; }
  }

  function writeSeenBookingIds(ids) {
    localStorage.setItem(SEEN_SITE_BOOKINGS_KEY, JSON.stringify(Array.from(new Set(ids)).slice(-500)));
  }

  function showStaffToast(title, detail) {
    injectBookingNotifyCss();
    const old = document.querySelector(".lune-staff-toast");
    if (old) old.remove();
    const toast = document.createElement("div");
    toast.className = "lune-staff-toast";
    toast.innerHTML = `${esc(title)}${detail ? `<small>${esc(detail)}</small>` : ""}`;
    toast.addEventListener("click", () => { toast.remove(); if (typeof tab === "function") tab("agenda"); });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 9000);
  }

  function softBeep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.025;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => ctx.close(), 350);
    } catch (_) {}
  }

  function ensureSiteBookingBadge() {
    injectBookingNotifyCss();
    let badge = document.getElementById("siteBookingBadge");
    if (badge) return badge;
    const agendaBtn = document.querySelector('#mainNav button[data-tab="agenda"]') || document.querySelector('button[data-tab="agenda"]');
    if (!agendaBtn) return null;
    badge = document.createElement("span");
    badge.id = "siteBookingBadge";
    agendaBtn.appendChild(badge);
    return badge;
  }

  function updateSiteBookingNotifications({ alertNew = false } = {}) {
    const pending = pendingSiteBookings();
    const badge = ensureSiteBookingBadge();
    if (badge) {
      badge.textContent = String(pending.length);
      badge.style.display = pending.length ? "inline-block" : "none";
    }
    const mini = byId("cloudMiniStatus");
    if (mini) mini.classList.toggle("has-new", pending.length > 0);

    const ids = pending.map(bookingNotifyId);
    const seen = readSeenBookingIds();
    const newOnes = pending.filter(b => !seen.includes(bookingNotifyId(b)));

    if (alertNew && newOnes.length) {
      const first = newOnes[0];
      showStaffToast("Neue Terminanfrage eingegangen", `${first.name || "Kundin"} · ${first.service || "Behandlung"} · ${first.date || ""} ${first.time || ""}`.trim());
      softBeep();
      writeSeenBookingIds(seen.concat(newOnes.map(bookingNotifyId)));
    } else if (!seen.length && ids.length) {
      // First run: show badge, do not make noise for historical data.
      writeSeenBookingIds(ids);
    }
  }


  // API publique pour les boutons du Staff (ex: clôture de journée).
  window.LuneStaffCloudSync = {
    isReady: apiReady,
    push: () => pushCloud(false),
    pull: () => pullCloud(false),
    test: testCloud,
    refreshStatus: refreshStatusLine,
    config: readConfig,
    refreshBookingNotifications: () => updateSiteBookingNotifications({ alertNew: false })
  };

  function init() {
    addCloudPanel();
    wrapPersist();
    applyAutoSync();
    updateSiteBookingNotifications({ alertNew: false });
    setInterval(() => updateSiteBookingNotifications({ alertNew: false }), 5000);
    // Re-add panel after staff render cycles if needed.
    setInterval(() => {
      if (!byId("cloudSyncPanel")) addCloudPanel();
    }, 3000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
