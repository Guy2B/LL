document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("whatsapp-box");
  const closeBtn = document.getElementById("wa-close");
  const triggerSection = document.getElementById("erlebnis");

  if (!box || !triggerSection) return;

  // Show when Erlebnis is reached
  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        box.removeAttribute("hidden");
        observer.disconnect(); // show once only
      }
    },
    { threshold: 0.4 }
  );

  observer.observe(triggerSection);

  // Close behavior
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      box.style.display = "none";
    });
  }
});
``