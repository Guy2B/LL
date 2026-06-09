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
