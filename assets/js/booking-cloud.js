/* Lune Beauty — Official booking workflow
   Client form → Staff Cloud → staff email via Apps Script → customer-friendly confirmation.
   No automatic WhatsApp window. */
(() => {
  "use strict";

  const PLACEHOLDER = "PASTE_GOOGLE_APPS_SCRIPT_STAFF_CLOUD_URL_HERE";
  const SUCCESS_TEXT = "✅ Vielen Dank. Ihre Anfrage wird bearbeitet. Wir melden uns in Kürze zur Bestätigung.";
  const FALLBACK_TEXT = "✅ Vielen Dank. Ihre Anfrage wurde gesendet. Wir melden uns in Kürze zur Bestätigung.";

  window.LuneBookingCloud = window.LuneBookingCloud || {};
  window.LuneBookingCloud.handlesSubmit = true;

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

  function setSuccess(text) {
    const success = document.getElementById("booking-success");
    if (!success) return;
    success.textContent = text || SUCCESS_TEXT;
    success.classList.remove("hidden");
    success.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => success.classList.add("hidden"), 9000);
  }

  function cleanUi(form) {
    document.getElementById("selected-service")?.classList.add("hidden");
    document.getElementById("selected-price")?.classList.add("hidden");
    document.getElementById("floating-summary")?.classList.add("hidden");
    document.querySelectorAll(".acc-list li").forEach(li => li.classList.remove("active-service"));
    form.reset();
  }

  function hiddenPost(url, payload) {
    return new Promise((resolve) => {
      const iframeName = "luneStaffCloudBooking_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;
      form.target = iframeName;
      form.style.display = "none";

      Object.entries(payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value ?? "");
        form.appendChild(input);
      });

      document.body.appendChild(form);
      iframe.addEventListener("load", () => setTimeout(resolve, 250), { once: true });
      form.submit();
      setTimeout(resolve, 1600);
      setTimeout(() => { form.remove(); iframe.remove(); }, 6500);
    });
  }

  async function fallbackFormsubmit(form) {
    if (!form.action) return;
    try {
      await fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } });
    } catch (_) {}
  }

  async function submitBookingToCloud(event) {
    const form = event.target;
    if (!form || form.id !== "booking-form") return;

    // Stop older ui.js from opening WhatsApp.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Anfrage wird gesendet…"; }

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

    try {
      if (ready()) {
        await hiddenPost(apiUrl(), payload);
        setSuccess(SUCCESS_TEXT);
      } else {
        // Safety fallback: still send an email via Formsubmit if the Cloud URL is not configured.
        await fallbackFormsubmit(form);
        setSuccess(FALLBACK_TEXT);
      }
      cleanUi(form);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = oldText || "Termin anfragen"; }
    }
  }

  document.addEventListener("submit", submitBookingToCloud, true);
})();
