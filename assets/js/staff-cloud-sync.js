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
      return Object.assign({ apiUrl: "", token: "", auto: false }, JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"));
    } catch (_) {
      return { apiUrl: "", token: "", auto: false };
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
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
    el.style.color = type === "error" ? "#b83227" : (type === "ok" ? "#166534" : "#777");
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  }

  function addCloudPanel() {
    if (byId("cloudSyncPanel")) return;
    const settings = byId("settings") || byId("dashboard") || document.querySelector("main");
    if (!settings) return;

    const cfg = readConfig();
    const panel = document.createElement("div");
    panel.id = "cloudSyncPanel";
    panel.className = "card setupGate";
    panel.innerHTML = `
      <h2>Cloud Sync gratuit</h2>
      <p class="small">Synchronisation Google Sheets / Apps Script pour RDV, clients, factures, paiements, stock et paramètres Staff.</p>
      <div class="row">
        <input id="cloudApiUrl" placeholder="URL Google Apps Script Web App" value="${esc(cfg.apiUrl || "")}">
        <input id="cloudToken" type="password" placeholder="Token secret Staff" value="${esc(cfg.token || "")}">
      </div>
      <label class="checkRow" style="display:flex;align-items:center;gap:10px;margin:8px 0;">
        <input id="cloudAuto" type="checkbox" style="width:auto" ${cfg.auto ? "checked" : ""}>
        Synchronisation automatique sur cet appareil
      </label>
      <div class="backupGrid noPrint" style="display:flex;flex-wrap:wrap;gap:8px;">
        <button class="gold" id="cloudSaveCfgBtn" type="button">Sauver connexion</button>
        <button class="secondary" id="cloudPullBtn" type="button">Importer Cloud → cet appareil</button>
        <button class="secondary" id="cloudPushBtn" type="button">Envoyer cet appareil → Cloud</button>
        <button class="secondary" id="cloudCheckBtn" type="button">Tester connexion</button>
      </div>
      <p id="cloudSyncStatus" class="small">Cloud non configuré.</p>
      <p class="small"><b>Important :</b> avant la première importation Cloud, un backup local automatique est sauvegardé dans ce navigateur.</p>
    `;

    settings.insertBefore(panel, settings.firstChild);

    byId("cloudSaveCfgBtn")?.addEventListener("click", () => {
      writeConfig({
        apiUrl: String(byId("cloudApiUrl")?.value || "").trim(),
        token: String(byId("cloudToken")?.value || "").trim(),
        auto: !!byId("cloudAuto")?.checked
      });
      applyAutoSync();
      setStatus("Connexion Cloud sauvegardée sur cet appareil.", "ok");
    });
    byId("cloudAuto")?.addEventListener("change", () => {
      writeConfig({ auto: !!byId("cloudAuto")?.checked });
      applyAutoSync();
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
      try { window.dispatchEvent(new CustomEvent('lune:cloud-db-updated', { detail: { source: 'pull', version: String(res.version || '') } })); } catch (_) {}
      suppressAutoUpload = false;

      lastKnownCloudVersion = String(res.version || "");
      localStorage.setItem(LAST_VERSION_KEY, lastKnownCloudVersion);
      localStorage.setItem(LAST_PULL_KEY, new Date().toLocaleString("fr-FR"));
      setStatus("Import Cloud terminé.", "ok");
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
      try { window.dispatchEvent(new CustomEvent('lune:cloud-db-updated', { detail: { source: 'push', version: lastKnownCloudVersion || '' } })); } catch (_) {}
      setStatus("Envoi Cloud terminé.", "ok");
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

  function init() {
    try { window.LuneStaffCloudSync = {
      isReady: apiReady,
      pull: () => pullCloud(false),
      push: () => pushCloud(false),
      test: testCloud,
      refreshStatus: refreshStatusLine,
      config: readConfig
    }; } catch (_) {}
    addCloudPanel();
    wrapPersist();
    applyAutoSync();
    // Re-add panel after staff render cycles if needed.
    setInterval(() => {
      if (!byId("cloudSyncPanel")) addCloudPanel();
    }, 3000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
