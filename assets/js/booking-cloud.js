/* Lune Beauty — public booking → Staff Cloud (Google Apps Script)
   This script sends booking requests from index.html to the shared Staff database.
   It does not remove the existing WhatsApp/Formsubmit flow; it runs as a cloud copy. */
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

      // Apps Script iframe posts can be silent depending on the browser.
      setTimeout(resolve, 1600);
      setTimeout(() => {
        form.remove();
        iframe.remove();
      }, 6000);
    });
  }

  function submitBookingToCloud(event) {
    const form = event.target;
    if (!form || form.id !== "booking-form") return;
    if (!ready()) return;

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

    // The existing UI script can still open WhatsApp and send Formsubmit.
    hiddenPost(apiUrl(), payload).catch(() => {});
  }

  // Capture phase runs before the older ui.js submit listener, so values are still present.
  document.addEventListener("submit", submitBookingToCloud, true);
})();
