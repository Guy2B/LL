(() => {
  "use strict";

  const API_URL = String(window.LUNE_TESTIMONIALS_API || "").trim();
  const PLACEHOLDER_API = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
  const DEFAULT_TESTIMONIALS = [
    {
      name: "Kundin aus Worms",
      rating: 5,
      message: "Sehr ruhige Atmosphäre und eine Behandlung, bei der man sofort abschalten kann."
    },
    {
      name: "Stammkundin",
      rating: 5,
      message: "Professionell, sanft und sehr aufmerksam. Meine Haut fühlt sich jedes Mal sichtbar gepflegter an."
    },
    {
      name: "Lune Beauty Kundin",
      rating: 5,
      message: "Ich habe mich sehr wohlgefühlt. Alles war sauber, stilvoll und persönlich."
    },
    {
      name: "Kundin",
      rating: 5,
      message: "Die Beratung war ehrlich und die Behandlung genau auf meine Haut abgestimmt."
    },
    {
      name: "Beauty Kundin",
      rating: 5,
      message: "Ein schönes Studio, angenehme Ruhe und ein Ergebnis, das man direkt sieht."
    }
  ];

  let selectedRating = 5;
  let testimonials = [];
  let currentIndex = 0;
  let autoplayId = null;

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

  const CONSENT_TEXT = "Ich bin einverstanden, dass meine Bewertung auf dieser Webseite veröffentlicht wird. Ich kann diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.";

  function normalizeItems(items) {
    return (Array.isArray(items) ? items : [])
      .map((item) => ({
        name: String(item.name || "Kundin").slice(0, 60),
        rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
        message: String(item.message || "").slice(0, 700),
        createdAt: item.createdAt || ""
      }))
      .filter((item) => item.message.trim().length > 0);
  }

  function visibleItems() {
    // Les avis publiés dans la Google Sheet passent en premier.
    // Tant qu'il y a moins de 5 avis réels, on garde les avis de départ
    // pour éviter une section vide ou trop pauvre au lancement du site.
    const real = normalizeItems(testimonials);
    if (real.length >= 5) return real;
    return real.concat(DEFAULT_TESTIMONIALS.slice(0, 5 - real.length));
  }

  function render() {
    const track = $("testimonialTrack");
    if (!track) return;

    const items = visibleItems().length ? visibleItems() : DEFAULT_TESTIMONIALS;
    currentIndex = Math.max(0, Math.min(currentIndex, items.length - 1));

    track.innerHTML = items.map((item, index) => `
      <article class="testimonial-card cloud-testimonial-card ${index === currentIndex ? "active" : ""}" aria-hidden="${index === currentIndex ? "false" : "true"}">
        <div class="testimonial-stars" aria-label="${esc(item.rating)} von 5 Sternen">${starsHtml(item.rating)}</div>
        <p>“${esc(item.message)}”</p>
        <strong>${esc(item.name)}</strong>
      </article>
    `).join("");

    // Fix: l'ancien CSS met .testimonial-card en opacity:0.
    // On donne donc explicitement la classe active + les styles minimums.
    track.style.display = "flex";
    track.style.width = "100%";
    track.style.transition = "transform .45s ease";
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    Array.from(track.children).forEach((card, index) => {
      const isActive = index === currentIndex;
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-hidden", isActive ? "false" : "true");
      card.style.flex = "0 0 100%";
      card.style.minWidth = "100%";
      card.style.maxWidth = "100%";
      card.style.opacity = isActive ? "1" : "0";
      card.style.visibility = "visible";
      card.style.transform = isActive ? "scale(1)" : "scale(.96)";
    });
  }

  function go(delta) {
    const count = Math.max(1, visibleItems().length);
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

      script.src = `${url}${sep}callback=${encodeURIComponent(cb)}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function loadTestimonials() {
    if (!API_URL || API_URL === PLACEHOLDER_API) {
      testimonials = DEFAULT_TESTIMONIALS;
      render();
      setStatus("", "info");
      return;
    }

    try {
      const data = await jsonp(API_URL);
      testimonials = normalizeItems(data.items || data.testimonials || data);
      render();
      setStatus("", "info");
    } catch (err) {
      testimonials = testimonials.length ? testimonials : DEFAULT_TESTIMONIALS;
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

      setStatus(`Kundenstimme wird als ${publishName} veröffentlicht…`, "info");

      await submitViaHiddenForm({
        name: publishName,
        rating: selectedRating,
        message,
        consent: consent && consent.checked ? "yes" : "no",
        consentAt,
        consentText: CONSENT_TEXT,
        source: location.hostname || "lunebeauty.de"
      });

      form.reset();
      selectedRating = 5;
      setupRating();
      setStatus(`Danke! Die Kundenstimme wurde gespeichert und erscheint gleich als ${publishName} auf der Webseite.`, "success");

      // Recharge depuis le serveur pour que la publication soit visible.
      setTimeout(loadTestimonials, 1200);
    });
  }

  function setupNavigation() {
    $("prevTestimonial")?.addEventListener("click", () => go(-1));
    $("nextTestimonial")?.addEventListener("click", () => go(1));

    clearInterval(autoplayId);
    autoplayId = setInterval(() => go(1), 8000);
  }

  function injectSmallStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .testimonial-consent{display:flex;gap:.55rem;align-items:flex-start;font-size:.9rem;line-height:1.35;margin:.85rem 0;color:inherit}
      .testimonial-consent input{width:auto;margin-top:.18rem;flex:0 0 auto}
      .testimonial-status{min-height:1.2rem;font-size:.9rem;margin:.6rem 0}.testimonial-status[data-type="success"]{color:#2f7d32}.testimonial-status[data-type="error"]{color:#a0352b}.testimonial-status[data-type="warn"]{color:#9a6a20}
      .testimonial-stars{letter-spacing:.12em;margin-bottom:.7rem;color:#d4af37}.rating-input span.active{color:#d4af37}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectSmallStyles();
    setupRating();
    setupForm();
    setupNavigation();

    // Affichage immédiat: les 5 Bewertungen de départ apparaissent tout de suite,
    // même si Google Apps Script est lent ou inaccessible.
    testimonials = DEFAULT_TESTIMONIALS;
    currentIndex = 0;
    render();

    loadTestimonials();
    // Actualisation douce: les visiteurs voient les nouveaux avis sans vider le cache.
    setInterval(loadTestimonials, 30000);
  });
})();
