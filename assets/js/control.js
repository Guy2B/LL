// =============================
// PREMIUM DOT CONTROL HANDLING
// =============================

function enableDots(trackSelector, dotSelector) {
    const track = document.querySelector(trackSelector);
    const dots = document.querySelectorAll(dotSelector);

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            dots.forEach(d => d.classList.remove("active"));
            dot.classList.add("active");

            const slide = Number(dot.dataset.slide);
            track.style.transition = "transform .6s ease";
            track.style.transform = `translateX(-${(slide - 1) * 33.33}%)`;
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    enableDots(".testimonial-track", ".testimonial-controls .dot");
    enableDots(".social-track", ".social-controls .dot");
});