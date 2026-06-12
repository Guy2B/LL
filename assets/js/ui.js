// ======================================================
// GLOBAL UI SYSTEM
// ======================================================

(function () {

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
document.getElementById("booking-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const form = e.target;

  const name = form.elements["name"].value;
  const phone = form.elements["phone"].value;
  const service = form.elements["service"].value;
  const date = form.elements["date"].value;
  const time = form.elements["time"].value;

  const message =
    `🌿 Lune Beauty Terminanfrage\n\n` +
    `Name: ${name}\n` +
    `Telefon: ${phone}\n` +
    `Behandlung: ${service}\n` +
    `Datum: ${date}\n` +
    `Uhrzeit: ${time}`;

  // ✅ 1. SEND TO WHATSAPP
  window.open(
    `https://wa.me/491791544002?text=${encodeURIComponent(message)}`,
    "_blank"
  );

  // ✅ 2. SEND EMAIL BACKUP
  form.submit();

  // ✅ 3. SHOW SUCCESS MESSAGE
  const success = document.getElementById("booking-success");
  if (success) {
    success.classList.remove("hidden");
  }

  // ✅ 4. CLEAN UI (THIS IS YOUR GOAL)
  const badge = document.getElementById("selected-service");
  if (badge) badge.classList.add("hidden");

  const price = document.getElementById("selected-price");
  if (price) price.classList.add("hidden");

  const floating = document.getElementById("floating-summary");
  if (floating) floating.classList.add("hidden");

  document.querySelectorAll(".acc-list li")
    .forEach(li => li.classList.remove("active-service"));

  // ✅ 5. RESET FORM
  form.reset();

  // ✅ 6. OPTIONAL: HIDE SUCCESS AFTER 4s
  setTimeout(() => {
    success?.classList.add("hidden");
  }, 4000);


});
document.querySelectorAll(".book-link").forEach(link => {

  link.addEventListener("click", (e) => {
    e.preventDefault();

    const service = link.dataset.service;
    const select = document.querySelector("#booking-form select");
    const booking = document.getElementById("booking");

    // ✅ Set dropdown
    if (select) {
      const option = [...select.options].find(o => o.text.trim() === service.trim());
      if (option) select.value = option.value;
    }

    // ✅ Show selected service badge
    const badge = document.getElementById("selected-service");
    if (badge) {
      badge.classList.remove("hidden");
      badge.querySelector("span").textContent = service;
    }

    // ✅ Smooth scroll
    if (booking) {
      const yOffset = -110;
      const y = booking.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth"
      });
    }

    // ✅ Glow effect
    const card = document.querySelector(".booking-card");
    if (card) {
      card.classList.add("highlight");
      setTimeout(() => card.classList.remove("highlight"), 1400);
    }

    // ✅ Focus input
    const firstInput = document.querySelector("#booking-form input");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 500);
    }

    // ✅ Highlight clicked service
    document.querySelectorAll(".acc-list li").forEach(li => {
      li.classList.remove("active-service");
    });

    const parentLi = link.closest("li");
    if (parentLi) parentLi.classList.add("active-service");

  });

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

document.querySelectorAll(".book-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const service = link.dataset.service;
    const select = document.querySelector("#booking-form select");

    // ✅ Set dropdown
    if (select) {
      const option = [...select.options].find(o => o.text.trim() === service.trim());
      if (option) select.value = option.value;
    }

    // ✅ Badge
    const badge = document.getElementById("selected-service");
    if (badge) {
      badge.classList.remove("hidden");
      badge.querySelector("span").textContent = service;
    }

    // ✅ Price
    const priceBox = document.getElementById("selected-price");
    if (priceBox) {
      priceBox.classList.remove("hidden");
      priceBox.textContent = "Preis: " + (SERVICE_PRICES[service] || "");
    }

    // ✅ Floating summary
    const floating = document.getElementById("floating-summary");
    if (floating) {
      floating.classList.remove("hidden");
      floating.textContent = service + " · " + (SERVICE_PRICES[service] || "");
    }

    // ✅ Scroll
    const booking = document.getElementById("booking");
    if (booking) {
      const y = booking.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: "smooth" });
    }

    // ✅ Glow
    const card = document.querySelector(".booking-card");
    if (card) {
      card.classList.add("highlight");
      setTimeout(() => card.classList.remove("highlight"), 1200);
    }

    // ✅ Highlight service row
    document.querySelectorAll(".acc-list li").forEach(li => li.classList.remove("active-service"));
    link.closest("li")?.classList.add("active-service");

    // ✅ Focus input
    setTimeout(() => {
      document.querySelector("#booking-form input")?.focus();
    }, 500);
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
