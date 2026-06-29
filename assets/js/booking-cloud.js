/* Lune Beauty — RDV public vers Staff Cloud
   Customer-friendly flow:
   - aucun WhatsApp ne s'ouvre automatiquement
   - aucune redirection Formsubmit
   - le RDV est enregistré dans Google Sheets / Staff Cloud
   - Apps Script envoie l'e-mail au staff
   - le client voit seulement une confirmation douce
*/
(() => {
  "use strict";

  const PLACEHOLDER = "PASTE_GOOGLE_APPS_SCRIPT_STAFF_CLOUD_URL_HERE";

  function apiUrl() {
    return String(window.LUNE_STAFF_CLOUD_API || "").trim();
  }

  function ready() {
    const url = apiUrl();
    return url && url !== PLACEHOLDER && /^https:\/\/script\.google\.com\//i.test(url);
  }

  function getField(form, name) {
    const el = form?.elements?.[name];
    return el ? String(el.value || "").trim() : "";
  }

  function byId(id) { return document.getElementById(id); }

  function setBookingMessage(message, type = "ok") {
    let box = byId("booking-success");
    if (!box) {
      const form = byId("booking-form");
      box = document.createElement("div");
      box.id = "booking-success";
      box.className = "booking-success";
      form?.insertBefore(box, form.firstChild);
    }
    box.classList.remove("hidden");
    box.dataset.type = type;
    box.textContent = message;
    box.style.display = "block";
    box.style.padding = "14px 16px";
    box.style.borderRadius = "16px";
    box.style.margin = "0 0 16px 0";
    box.style.textAlign = "center";
    box.style.fontWeight = "600";
    box.style.background = type === "error" ? "#fff4f2" : "#f6fbf7";
    box.style.color = type === "error" ? "#a94335" : "#386b4f";
    box.style.border = type === "error" ? "1px solid #edc3ba" : "1px solid #cfe2d4";
  }

  function jsonp(url, payload) {
    return new Promise((resolve, reject) => {
      const cb = "lunePublicBookingCb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const params = new URLSearchParams(Object.assign({}, payload, {
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

      script.onerror = () => {
        cleanup();
        reject(new Error("Cloud non joignable"));
      };

      script.src = url + (url.includes("?") ? "&" : "?") + params.toString();
      document.head.appendChild(script);
    });
  }

  async function submitBookingToCloud(event) {
    const form = event.target;
    if (!form || form.id !== "booking-form") return;

    // Stop the older ui.js handler so WhatsApp does not open and Formsubmit is not used.
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();

    const payload = {
      action: "publicBooking",
      source: "website",
      page: location.href,
      name: getField(form, "name"),
      phone: getField(form, "phone"),
      email: getField(form, "email"),
      service: getField(form, "service"),
      date: getField(form, "date"),
      time: getField(form, "time"),
      notes: getField(form, "notes")
    };

    if (!payload.name || !payload.phone || !payload.service || !payload.date || !payload.time) {
      setBookingMessage("Bitte füllen Sie alle Pflichtfelder aus.", "error");
      return;
    }

    if (!ready()) {
      setBookingMessage("Die Online-Anfrage ist momentan nicht verfügbar. Bitte kontaktieren Sie uns telefonisch oder per E-Mail.", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"], button:not([type])');
    const oldLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Anfrage wird gesendet…";
    }

    setBookingMessage("Ihre Anfrage wird bearbeitet…", "info");

    try {
      await jsonp(apiUrl(), payload);
      setBookingMessage("Vielen Dank. Ihre Anfrage wird bearbeitet. Wir melden uns in Kürze zur Bestätigung.", "ok");

      // Clean UI without opening WhatsApp.
      byId("selected-service")?.classList.add("hidden");
      byId("selected-price")?.classList.add("hidden");
      byId("floating-summary")?.classList.add("hidden");
      document.querySelectorAll(".acc-list li").forEach(li => li.classList.remove("active-service"));
      form.reset();
    } catch (err) {
      setBookingMessage("Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldLabel || "Termin anfragen";
      }
    }
  }

  // Capture phase runs before the older ui.js submit listener.
  document.addEventListener("submit", submitBookingToCloud, true);
})();
