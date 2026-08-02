// ======================================================
// GLOBAL UI SYSTEM
// ======================================================

(function () {

  // HEADER TRANSPARENCY + LOGO SHRINK
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".top-nav");
    if (!nav) return;

    if (window.scrollY > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  const bar = document.getElementById("scrollProgress");
  const lf = document.getElementById("lensflare");

  function setProgress() {
    const h = document.documentElement.scrollHeight - window.innerHeight;

    if (bar) bar.style.width = (window.scrollY / Math.max(1, h)) * 100 + "%";
    if (lf) lf.style.opacity = Math.min(1, window.scrollY / 600);
  }
  setProgress();
  window.addEventListener("scroll", setProgress, { passive: true });
  window.addEventListener("resize", setProgress);

  const reveals = document.querySelectorAll(".reveal-up");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("visible"));
  }

  document.querySelectorAll(".service-card[data-target]").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-target");
      const el = document.getElementById(id);
      if (!el) return;

      document.querySelectorAll("#pricing details").forEach(d => {
        if (d !== el) d.removeAttribute("open");
      });

      el.setAttribute("open", "");
      el.classList.add("highlight");

      setTimeout(() => el.classList.remove("highlight"), 1500);

      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

})();

// ======================================================
// WHATSAPP
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("whatsapp-box");
  const close = document.getElementById("wa-close");

  if (!box || !close) return;

  setTimeout(() => box.classList.add("active"), 3000);
  close.addEventListener("click", () => box.classList.remove("active"));
});

// ======================================================
// VIDEO SYSTEM (FINAL CLEAN STABLE)
// ======================================================

const wrappers = document.querySelectorAll(".video-wrapper");

wrappers.forEach(wrapper => {

  const video = wrapper.querySelector("video");
  const overlay = wrapper.querySelector(".video-overlay");
  const button = wrapper.querySelector(".play-btn");

  if (!video || !button) return;

  // CLICK
  button.addEventListener("click", () => {

    wrappers.forEach(w => {
      const v = w.querySelector("video");
      const o = w.querySelector(".video-overlay");

      if (!v) return;

      v.pause();
      v.currentTime = 0;
      v.controls = false;

      o?.classList.remove("hidden");
    });

    video.controls = true;
    video.muted = false;

    overlay?.classList.add("hidden");

    video.play().catch(() => {
      video.muted = true;
      video.play();
    });

  });

  // HOVER SAFE
  wrapper.addEventListener("mouseenter", () => {
    if (video.controls) return;

    video.muted = true;
    video.currentTime = 0;

    video.play().catch(() => {});
  });

  wrapper.addEventListener("mouseleave", () => {
    if (video.controls) return;

    video.pause();
    video.currentTime = 0;
  });

});
document.getElementById("booking-form")?.addEventListener("submit", async function(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const success = document.getElementById("booking-success");
  const errorBox = document.getElementById("booking-error");
  const submitBtn = form.querySelector('button[type="submit"]');
  const oldText = submitBtn ? submitBtn.textContent : "Termin anfragen";

  success?.classList.add("hidden");
  if (success) success.hidden = true;
  errorBox?.classList.add("hidden");
  if (errorBox) errorBox.hidden = true;

  if (!form.checkValidity()) {
    form.reportValidity();
    form.querySelector(":invalid")?.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gesendet…";
  }

  let sent = false;
  let lastError = null;

  try {
    if (window.LuneBookingCloud?.ready?.()) {
      await window.LuneBookingCloud.submit(form);
      sent = true;
    }
  } catch (error) {
    lastError = error;
  }

  if (!sent) {
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("Formularversand fehlgeschlagen (" + response.status + ")");
      sent = true;
    } catch (error) {
      lastError = error;
    }
  }

  if (sent) {
    errorBox?.classList.add("hidden");
    if (errorBox) errorBox.hidden = true;
    success?.classList.remove("hidden");
    if (success) success.hidden = false;

    document.getElementById("selected-service")?.classList.add("hidden");
    document.getElementById("selected-price")?.classList.add("hidden");
    document.getElementById("floating-summary")?.classList.add("hidden");

    document.querySelectorAll(".acc-list li")
      .forEach(li => li.classList.remove("active-service"));

    form.reset();
    success?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    window.setTimeout(() => {
      success?.classList.add("hidden");
      if (success) success.hidden = true;
        }, 7000);
  } else {
    success?.classList.add("hidden");
    if (success) success.hidden = true;
    errorBox?.classList.remove("hidden");
    if (errorBox) errorBox.hidden = false;
    console.error("Lune Beauty booking failed:", lastError);
    errorBox?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = oldText;
  }
});
const SERVICE_PRICES = {
  "Basisbehandlung Gesicht": "69 €",
  "Gesicht + Hals + Dekolleté": "85 €",
  "Hydro Boost Gesicht": "89 €",
  "Hydro Boost Gesicht & Dekolleté": "99 €",
  "Relax & Glow Behandlung": "110 €",
  "Hydra Glow Facial (Aquafacial)": "130 €",
  "Aknebehandlung": "89 €",
  "Anti-Aging Behandlung": "120 €",
  "Sensi Treatment": "89 €",
  "LED Maske": "10 €",
  "Radiofrequenz": "10 €",
  "Oberlippe Waxing": "15 €",
  "Kinn Waxing": "15 €",
  "Gesichtswaxing komplett": "30 €",
  "Klassische Maniküre": "33 €",
  "Spa Maniküre": "38 €",
  "Basis Fußpflege": "50 €",
  "Spa Fußpflege": "65 €",
  "Farbe": "10 €",
  "Farbe entfernen (Füße)": "20 €",
  "Farbe entfernen (Hände)": "10 €",
  "Wimpernfärben": "20 €",
  "Augenbrauen färben": "15 €",
  "Augenbrauenkorrektur": "15 €",
  "Kombi Augenbehandlung": "45 €"
};

function selectBookingService(service, options = {}) {
  const value = String(service || "").trim();
  if (!value) return false;

  const form = document.getElementById("booking-form");
  const select = form?.querySelector('select[name="service"]');
  if (!select) return false;

  const option = [...select.options].find(item =>
    item.text.trim().toLowerCase() === value.toLowerCase() ||
    String(item.value || "").trim().toLowerCase() === value.toLowerCase()
  );
  if (!option) return false;

  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));

  const badge = document.getElementById("selected-service");
  if (badge) {
    badge.classList.remove("hidden");
    const label = badge.querySelector("span");
    if (label) label.textContent = option.text.trim();
  }

  const price = SERVICE_PRICES[option.text.trim()] || "";
  const priceBox = document.getElementById("selected-price");
  if (priceBox) {
    priceBox.classList.toggle("hidden", !price);
    priceBox.textContent = price ? "Preis: " + price : "";
  }

  const floating = document.getElementById("floating-summary");
  if (floating) {
    floating.classList.remove("hidden");
    floating.textContent = option.text.trim() + (price ? " · " + price : "");
  }

  if (options.scroll !== false) {
    const booking = document.getElementById("booking");
    if (booking) {
      const top = booking.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }
  }

  document.querySelectorAll(".acc-list li").forEach(item => item.classList.remove("active-service"));
  options.sourceElement?.closest("li")?.classList.add("active-service");

  const card = document.querySelector(".booking-card");
  if (card) {
    card.classList.add("highlight");
    window.setTimeout(() => card.classList.remove("highlight"), 1000);
  }

  if (options.focus !== false) {
    window.setTimeout(() => {
      const target = window.innerWidth <= 760
        ? form.querySelector('input[name="date"]')
        : form.querySelector('input[name="name"]');
      target?.focus({ preventScroll: true });
    }, 420);
  }

  return true;
}

document.querySelectorAll(".book-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    selectBookingService(link.dataset.service, {
      sourceElement: link,
      scroll: true,
      focus: true
    });
  });
});

// ✅ Sticky button appear
const sticky = document.getElementById("sticky-book");

window.addEventListener("scroll", () => {
  if (window.scrollY > 600) {
    sticky?.classList.remove("hidden");
  } else {
    sticky?.classList.add("hidden");
  }
});
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(section => {
    const top = section.offsetTop - 120;
    if (window.scrollY >= top) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach(a => {
    a.classList.remove("active");
    if (a.getAttribute("href") === "#" + current) {
      a.classList.add("active");
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-links");

  if (!toggle || !menu) return;

  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    toggle.classList.toggle("active");
    menu.classList.toggle("open");

    const isOpen = menu.classList.contains("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("active");
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      toggle.classList.remove("active");
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});
// ======================================================
// PREISE ANSEHEN — PREMIUM SCROLL + REVEAL
// ======================================================

document.querySelectorAll(
  '.service-card-actions a[href^="#acc-"]'
).forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const selector = link.getAttribute("href");
    const target = document.querySelector(selector);

    if (!target) return;

    // Fermer proprement les autres catégories.
    document.querySelectorAll("#pricing details.acc").forEach((details) => {
      if (details !== target) {
        details.removeAttribute("open");
        details.classList.remove("premium-opening");
      }
    });

    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      118;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth"
    });

    // Laisse le scroll commencer, puis révèle la catégorie.
    window.setTimeout(() => {
      target.classList.add("premium-opening");
      target.setAttribute("open", "");

      // Repositionnement très doux après expansion.
      window.setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 220);

      window.setTimeout(() => {
        target.classList.remove("premium-opening");
      }, 1700);
    }, 520);
  });
});

// Lune Beauty V23 — Pflicht-E-Mail im Terminformular
(function(){
  const form=document.getElementById("booking-form");
  if(!form)return;
  const email=form.querySelector('input[name="email"]');
  if(email){
    email.required=true;
    email.setAttribute("aria-required","true");
    email.setAttribute("autocomplete","email");
    email.addEventListener("invalid",function(){
      email.setCustomValidity(email.value.trim()?"Bitte geben Sie eine gültige E-Mail-Adresse ein.":"Bitte geben Sie Ihre E-Mail-Adresse ein.");
    });
    email.addEventListener("input",function(){email.setCustomValidity("");});
  }
  form.addEventListener("submit",function(event){
    if(!form.checkValidity()){
      event.preventDefault();
      event.stopImmediatePropagation();
      form.reportValidity();
      form.querySelector(":invalid")?.focus({preventScroll:false});
    }
  },true);
})();

