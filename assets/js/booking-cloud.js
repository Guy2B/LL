/* Lune Beauty — public booking → Staff Cloud
   V23.2: one confirmed cloud request, no duplicate submit listener. */
(() => {
  "use strict";

  const PLACEHOLDER = "PASTE_GOOGLE_APPS_SCRIPT_STAFF_CLOUD_URL_HERE";

  function apiUrl() {
    return String(window.LUNE_STAFF_CLOUD_API || "").trim();
  }

  function ready() {
    const url = apiUrl();
    return Boolean(
      url &&
      url !== PLACEHOLDER &&
      /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?|$)/i.test(url)
    );
  }

  function getField(form, name) {
    const el = form?.elements?.[name];
    return el ? String(el.value || "").trim() : "";
  }

  async function submit(form) {
    if (!ready()) throw new Error("Staff Cloud ist nicht konfiguriert.");

    const payload = new URLSearchParams({
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
    });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(apiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: payload.toString(),
        signal: controller.signal,
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error("Cloud-Antwort " + response.status);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error("Ungültige Cloud-Antwort.");
      }

      if (!data || data.ok !== true) {
        throw new Error(data?.error || "Die Anfrage wurde vom Cloud-System nicht bestätigt.");
      }

      return data;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.LuneBookingCloud = Object.freeze({ ready, submit });
})();
