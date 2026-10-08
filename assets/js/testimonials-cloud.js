(() => {
  "use strict";

  const API_URL = String(window.LUNE_TESTIMONIALS_API || "").trim();
  const PLACEHOLDER_API = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
  const BACKUP_TESTIMONIALS = [
    {
      name: "Jess M.",
      rating: 5,
      message: "Es War ein schönes Moment. Vielen Dank @Lunebeauty"
    },
    {
      name: "Angela",
      rating: 5,
      message: "Ein sehr schönes, angenehmes und freundliches Ambiente. Man fühlt sich sofort wohl. Die Gastfreundschaft ist hervorragend und das Personal ist sehr herzlich. Ich kann diesen Ort nur weiterempfehlen!"
    },
    {
      name: "Klaudia",
      rating: 5,
      message: "Super! Sehr empfehlenswert. Es war super entspannt. Ich habe mich sehr wohl gefühlt. Mein Haut sieht jetzt so schön aus."
    },
    {
      name: "Batuhan",
      rating: 5,
      message: "Es war von Anfang bis Ende sehr angenehm und verlief reibungslos. Man wird herzlich empfangen. Die Behandlung war genauso gut, wie es versprochen wurde. Ambiente, Duft und Musik waren vollkommen im Einklang. Sehr empfehlenswert."
    },
    {
      name: "Sophie K.",
      rating: 5,
      message: "Ich habe mich vom ersten Moment an wohlgefühlt. Die Behandlung war professionell, entspannend und das Ergebnis hat meine Erwartungen übertroffen. Meine Haut fühlt sich viel frischer und gepflegter an. Ich komme definitiv wieder und kann Lune Beauty von Herzen weiterempfehlen!"
    }
  ];
  const BACKUP_NAMES = BACKUP_TESTIMONIALS.map((item) => item.name);
  const BACKUP_STORAGE_KEY = "lune_testimonials_real_backup_v4";

  let selectedRating = 5;
  let testimonials = [];
  let currentIndex = 0;
  let autoplayId = null;
  let renderedSignature = "";
  let googleInfo = null; // {reviewUrl, rating, count, mapsUrl} from the CRM

  function injectStyles() {
    if (document.getElementById("luneReviewExtras")) return;
    const s = document.createElement("style");
    s.id = "luneReviewExtras";
    s.textContent = `
      .tGoogle{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#4285f4;margin-left:8px;text-decoration:none;vertical-align:middle}
      .tGoogle i{width:16px;height:16px;border-radius:50%;display:inline-grid;place-items:center;font-style:normal;font-size:10px;font-weight:800;color:#fff;background:conic-gradient(from -45deg,#ea4335 0 25%,#fbbc05 0 50%,#34a853 0 75%,#4285f4 0)}
      .tGoogleSummary{display:flex;justify-content:center;align-items:center;gap:8px;margin:14px auto 0;font-size:14px;color:inherit;text-decoration:none;opacity:.85}
      .tGoogleSummary:hover{opacity:1}
      .tShare{margin-top:14px;padding:16px;border-radius:16px;border:1px solid rgba(199,167,91,.45);background:rgba(255,250,240,.9);text-align:center}
      .tShare p{margin:0 0 10px}
      .tShare button{margin:4px;cursor:pointer}
      .tShare .tShareGoogle{background:#1d1a16;color:#fff;border:0;border-radius:999px;padding:10px 18px;font-weight:600}
      .tShare .tShareNo{background:transparent;border:1px solid rgba(0,0,0,.15);border-radius:999px;padding:10px 16px}
    `;
    document.head.appendChild(s);
  }

  function renderGoogleSummary() {
    const track = $("testimonialTrack");
    if (!track || !googleInfo || !googleInfo.rating || !googleInfo.mapsUrl) return;
    let el = document.getElementById("tGoogleSummary");
    if (!el) {
      el = document.createElement("a");
      el.id = "tGoogleSummary";
      el.className = "tGoogleSummary";
      el.target = "_blank";
      el.rel = "noopener";
      const host = track.closest(".testimonial-slider, .testimonials-slider") || track.parentElement;
      host.parentElement.insertBefore(el, host.nextSibling);
    }
    el.href = googleInfo.mapsUrl;
    el.innerHTML = `<span class="tGoogle" style="margin:0"><i>G</i></span> <strong>${String(googleInfo.rating).replace(".", ",")} ★</strong> auf Google · ${googleInfo.count || 0} Bewertungen`;
  }

  // After a review on the website, offer to share the same text on Google (optional, for every rating).
  function offerGoogleShare(message) {
    const reviewUrl = googleInfo && googleInfo.reviewUrl;
    const form = $("testimonialForm");
    if (!reviewUrl || !form) return;
    document.getElementById("tShare")?.remove();
    const box = document.createElement("div");
    box.id = "tShare";
    box.className = "tShare";
    box.innerHTML = `<p><strong>Möchten Sie Ihre Bewertung auch auf Google teilen?</strong><br>
      Ihr Text wird kopiert – auf Google nur noch einfügen und Sterne wählen.</p>
      <button type="button" class="tShareGoogle">Text kopieren &amp; Google öffnen</button>
      <button type="button" class="tShareNo">Nein, danke</button>`;
    form.parentElement.insertBefore(box, form.nextSibling);
    box.querySelector(".tShareGoogle").onclick = async () => {
      try { await navigator.clipboard.writeText(message); } catch (_) {}
      window.open(reviewUrl, "_blank", "noopener");
      box.innerHTML = "<p>Danke! Text ist kopiert – auf Google einfach einfügen.</p>";
    };
    box.querySelector(".tShareNo").onclick = () => box.remove();
  }

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setStatus(message, type = "info") {
    const el = $("testimonialStatus");
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
  }

  function starsHtml(rating) {
    const n = Math.max(1, Math.min(5, Number(rating) || 5));
    return "★".repeat(n) + "☆".repeat(5 - n);
  }


  function publicName(rawName) {
    const cleaned = String(rawName || "")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "Kundin";

    const parts = cleaned.split(" ").filter(Boolean);
    const first = parts[0] || "Kundin";
    const second = parts.find((part, index) => index > 0 && part.replace(/[^A-Za-zÄÖÜäöüßÀ-ÿ]/g, "").length > 0);

    if (!second) return first.slice(0, 40);

    const initial = second.replace(/[^A-Za-zÄÖÜäöüßÀ-ÿ]/g, "").charAt(0).toUpperCase();
    return initial ? `${first} ${initial}.`.slice(0, 45) : first.slice(0, 40);
  }

  const CONSENT_TEXT = "Ich bin einverstanden, dass meine Bewertung mit meinem angegebenen Vornamen bzw. Vornamen + Initiale auf dieser Webseite veröffentlicht wird. Ich kann diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.";

  function normalizeItems(items) {
    return (Array.isArray(items) ? items : [])
      .map((item) => ({
        name: String(item.name || "Kundin").slice(0, 60),
        rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
        message: String(item.message || "").slice(0, 700),
        createdAt: item.createdAt || "",
        source: item.source === "google" ? "google" : "website",
        authorUrl: /^https:///.test(String(item.authorUrl || "")) ? String(item.authorUrl) : ""
      }))
      .filter((item) => item.message.trim().length > 0);
  }

  function normalizeReviewText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[“”„"'’`´]/g, "")
      .replace(/[^a-zA-Z0-9äöüÄÖÜß]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function testimonialKey(item) {
    return [
      normalizeReviewText(item.name),
      normalizeReviewText(item.message),
      String(Number(item.rating) || 5)
    ].join("|");
  }

  function messageTokens(value) {
    return new Set(
      normalizeReviewText(value)
        .split(" ")
        .filter((word) => word.length > 2)
    );
  }

  function similarity(a, b) {
    const setA = messageTokens(a);
    const setB = messageTokens(b);
    if (!setA.size || !setB.size) return 0;

    let common = 0;
    setA.forEach((word) => {
      if (setB.has(word)) common += 1;
    });

    return common / Math.max(setA.size, setB.size);
  }

  function sameReview(a, b) {
    const sameName =
      normalizeReviewText(a.name) === normalizeReviewText(b.name);
    const sameRating =
      Number(a.rating || 5) === Number(b.rating || 5);

    if (!sameName || !sameRating) return false;

    const sameMessage =
      normalizeReviewText(a.message) === normalizeReviewText(b.message);

    return sameMessage || similarity(a.message, b.message) >= 0.72;
  }

  function dedupeItems(items) {
    const unique = [];

    normalizeItems(items).forEach((item) => {
      if (!unique.some((existing) => sameReview(existing, item))) {
        unique.push(item);
      }
    });

    return unique;
  }

  function readBackupTestimonials() {
    const defaults = dedupeItems(BACKUP_TESTIMONIALS);

    try {
      const stored = dedupeItems(
        JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]")
      );

      // Toujours conserver les 5 vrais avis intégrés.
      // Un ancien cache contenant seulement Jess M. ne doit jamais remplacer les autres.
      return dedupeItems(stored.concat(defaults));
    } catch (_) {
      return defaults;
    }
  }

  function saveRealBackup(items) {
    const normalized = dedupeItems(items);
    const preferred = BACKUP_NAMES
      .map((wantedName) =>
        normalized.find(
          (item) =>
            String(item.name || "").trim().toLowerCase() ===
            wantedName.toLowerCase()
        )
      )
      .filter(Boolean);

    const backup = dedupeItems(
      preferred.length ? preferred : normalized.slice(0, 4)
    ).slice(0, 5);

    if (!backup.length) return;

    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backup));
    } catch (_) {}
  }

  function visibleItems() {
    const live = dedupeItems(testimonials);
    const backup = readBackupTestimonials();

    if (!live.length) return backup;

    const liveNames = new Set(
      live.map((item) => normalizeReviewText(item.name))
    );

    const missingBackups = backup.filter((item) => {
      return !liveNames.has(normalizeReviewText(item.name));
    });

    return dedupeItems(live.concat(missingBackups));
  }

  function render() {
    const track = $("testimonialTrack");
    if (!track) return;

    const items = visibleItems();
    if (!items.length) return;

    currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1));

    const signature = items.map(testimonialKey).join("||");

    // Ne reconstruire les cartes que lorsque les données changent.
    // Ainsi, le navigateur peut réellement animer le déplacement du track.
    if (signature !== renderedSignature) {
      track.innerHTML = items.map((item, index) => `
        <article class="testimonial-card cloud-testimonial-card ${index === currentIndex ? "active" : ""}" aria-hidden="${index === currentIndex ? "false" : "true"}">
          <div class="testimonial-stars" aria-label="${esc(item.rating)} von 5 Sternen">${starsHtml(item.rating)}</div>
          <p>“${esc(item.message)}”</p>
          <strong>${item.authorUrl ? `<a href="${esc(item.authorUrl)}" target="_blank" rel="noopener" style="color:inherit">${esc(item.name)}</a>` : esc(item.name)}${item.source === "google" ? `<a class="tGoogle" href="${esc(item.authorUrl || (googleInfo && googleInfo.mapsUrl) || "#")}" target="_blank" rel="noopener"><i>G</i>Google</a>` : ""}</strong>
        </article>
      `).join("");
      renderedSignature = signature;
    }

    track.style.setProperty("display", "flex", "important");
    track.style.setProperty("flex-wrap", "nowrap", "important");
    track.style.setProperty("width", "100%", "important");
    track.style.setProperty("transition", "transform .55s cubic-bezier(.22,.61,.36,1)", "important");
    track.style.setProperty("will-change", "transform", "important");

    Array.from(track.children).forEach((card, index) => {
      const isActive = index === currentIndex;
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-hidden", isActive ? "false" : "true");
      card.style.setProperty("flex", "0 0 100%", "important");
      card.style.setProperty("min-width", "100%", "important");
      card.style.setProperty("max-width", "100%", "important");
      card.style.setProperty("width", "100%", "important");
      card.style.setProperty("opacity", "1", "important");
      card.style.setProperty("visibility", "visible", "important");
      card.style.setProperty("position", "relative", "important");
      card.style.setProperty("inset", "auto", "important");
    });

    requestAnimationFrame(() => {
      track.style.setProperty(
        "transform",
        `translate3d(-${currentIndex * 100}%, 0, 0)`,
        "important"
      );
    });
  }

  function go(delta) {
    const count = visibleItems().length;
    if (!count) return;
    currentIndex = (currentIndex + delta + count) % count;
    render();
  }

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = "luneTestimonialsCb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const script = document.createElement("script");
      const sep = url.includes("?") ? "&" : "?";
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout API Kundenstimmen"));
      }, 12000);

      function cleanup() {
        clearTimeout(timer);
        delete window[cb];
        script.remove();
      }

      window[cb] = (data) => {
        cleanup();
        resolve(data || {});
      };

      script.onerror = () => {
        cleanup();
        reject(new Error("API Kundenstimmen non joignable"));
      };

      script.src = `${url}${sep}action=publicTestimonials&callback=${encodeURIComponent(cb)}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function loadTestimonials() {
    if (!API_URL || API_URL === PLACEHOLDER_API) {
      testimonials = readBackupTestimonials();
      render();
      setStatus("", "info");
      return;
    }

    try {
      const data = await jsonp(API_URL);
      googleInfo = data.google || (data.reviewUrl ? { reviewUrl: data.reviewUrl } : null);
      const liveItems = dedupeItems(data.items || data.testimonials || data);

      if (liveItems.length) {
        testimonials = liveItems;
        saveRealBackup(liveItems);
      } else {
        testimonials = readBackupTestimonials();
      }

      currentIndex = Math.min(currentIndex, Math.max(0, visibleItems().length - 1));
      render();
      renderGoogleSummary();
      setStatus("", "info");
    } catch (err) {
      testimonials = readBackupTestimonials();
      currentIndex = Math.min(currentIndex, Math.max(0, visibleItems().length - 1));
      render();
      setStatus("", "info");
    }
  }

  function submitViaHiddenForm(payload) {
    return new Promise((resolve) => {
      const iframeName = "luneTestimonialsPost_" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = API_URL;
      form.target = iframeName;
      form.style.display = "none";

      Object.entries(payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value || "");
        form.appendChild(input);
      });

      document.body.appendChild(form);
      iframe.addEventListener("load", () => setTimeout(resolve, 300), { once: true });
      form.submit();

      // Fallback: le chargement iframe peut être silencieux selon le navigateur.
      setTimeout(resolve, 1800);
      setTimeout(() => {
        form.remove();
        iframe.remove();
      }, 6000);
    });
  }

  function setupRating() {
    const ratingInput = $("ratingInput");
    if (!ratingInput) return;
    const stars = Array.from(ratingInput.querySelectorAll("span[data-value]"));

    function paint() {
      stars.forEach((star) => {
        const value = Number(star.dataset.value || 0);
        star.classList.toggle("active", value <= selectedRating);
        star.style.cursor = "pointer";
      });
    }

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        selectedRating = Number(star.dataset.value || 5) || 5;
        paint();
      });
    });

    paint();
  }

  function setupForm() {
    const form = $("testimonialForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!API_URL || API_URL === PLACEHOLDER_API) {
        setStatus("Cloud non connectée: collez d'abord l'URL Google Apps Script dans index.html.", "error");
        return;
      }

      const name = ($("tName")?.value || "").trim();
      const message = ($("tMessage")?.value || "").trim();
      const consent = $("tConsent");

      if (!name || !message) {
        setStatus("Bitte Name und Kommentar ausfüllen.", "error");
        return;
      }
      if (consent && !consent.checked) {
        setStatus("Bitte bestätigen, dass die Bewertung veröffentlicht werden darf.", "error");
        return;
      }

      const publishName = publicName(name);
      const consentAt = new Date().toISOString();

      setStatus("Kundenstimme wird gesendet…", "info");

      await submitViaHiddenForm({
        action: "publicTestimonial",
        name: publishName,
        rating: selectedRating,
        message,
        consent: consent && consent.checked ? "yes" : "no",
        consentAt,
        consentText: CONSENT_TEXT,
        source: location.hostname || "lunebeauty.de",
        website: "" // honeypot, must stay empty
      });

      offerGoogleShare(message);
      form.reset();
      selectedRating = 5;
      setupRating();
      setStatus(`Danke! Ihre Bewertung wurde gesendet und erscheint nach kurzer Prüfung als ${publishName} auf der Webseite.`, "success");

      // Recharge depuis le serveur pour que la publication soit visible.
      setTimeout(loadTestimonials, 1200);
    });
  }

  function restartAutoplay() {
    clearInterval(autoplayId);
    autoplayId = setInterval(() => go(1), 6500);
  }

  function setupNavigation() {
    const prev = $("prevTestimonial");
    const next = $("nextTestimonial");
    const track = $("testimonialTrack");

    prev?.addEventListener("click", (event) => {
      event.preventDefault();
      go(-1);
      restartAutoplay();
    });

    next?.addEventListener("click", (event) => {
      event.preventDefault();
      go(1);
      restartAutoplay();
    });

    // Navigation au clavier.
    prev?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        go(-1);
        restartAutoplay();
      }
    });

    next?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        go(1);
        restartAutoplay();
      }
    });

    // Swipe mobile.
    let startX = null;
    track?.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      track.setPointerCapture?.(event.pointerId);
    });

    track?.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) < 45) return;
      go(distance > 0 ? -1 : 1);
      restartAutoplay();
    });

    restartAutoplay();
  }

  function injectSmallStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .testimonial-consent{display:flex;gap:.55rem;align-items:flex-start;font-size:.9rem;line-height:1.35;margin:.85rem 0;color:inherit}
      .testimonial-consent input{width:auto;margin-top:.18rem;flex:0 0 auto}
      .testimonial-status{min-height:1.2rem;font-size:.9rem;margin:.6rem 0}.testimonial-status[data-type="success"]{color:#2f7d32}.testimonial-status[data-type="error"]{color:#a0352b}.testimonial-status[data-type="warn"]{color:#9a6a20}
      .testimonial-stars{letter-spacing:.12em;margin-bottom:.7rem;color:#d4af37}.rating-input span.active{color:#d4af37}
      .testimonials-slider,.testimonial-slider,.testimonial-viewport{overflow:hidden!important}
      #testimonialTrack{display:flex!important;flex-wrap:nowrap!important;transform:translate3d(0,0,0);will-change:transform}
      #testimonialTrack>.testimonial-card{flex:0 0 100%!important;width:100%!important;min-width:100%!important;max-width:100%!important;opacity:1!important;visibility:visible!important;position:relative!important}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectSmallStyles();
    setupRating();
    setupForm();
    setupNavigation();

    // Affichage immédiat des cinq vrais avis, sans message de chargement.
    testimonials = readBackupTestimonials();
    currentIndex = 0;
    render();

    loadTestimonials();
    // Actualisation douce: les visiteurs voient les nouveaux avis sans vider le cache.
    setInterval(loadTestimonials, 30000);
  });

  // ?bewertung=1 (link sent after a visit) opens the review form directly
  try {
    injectStyles();
    if (new URLSearchParams(location.search).get("bewertung") === "1") {
      setTimeout(() => {
        const formEl = $("testimonialForm");
        if (formEl) { formEl.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => $("tName")?.focus(), 600); }
      }, 700);
    }
  } catch (_) {}
})();
