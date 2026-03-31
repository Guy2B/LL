// =============================
// UNIVERSAL SWIPE / DRAG SUPPORT
// =============================

function enableSwipe(element, track) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const start = (x) => {
        startX = x;
        isDragging = true;
        track.style.transition = "none";
    };

    const move = (x) => {
        if (!isDragging) return;
        currentX = x - startX;
        track.style.transform = `translateX(calc(-33.33% + ${currentX}px))`;
    };

    const end = () => {
        if (!isDragging) return;
        isDragging = false;

        if (Math.abs(currentX) > 50) {
            // Swipe left/right detection
            track.style.transition = "transform .4s ease";
            track.style.transform = "translateX(-66.66%)";
        } else {
            track.style.transition = "transform .4s ease";
            track.style.transform = "translateX(-33.33%)";
        }

        currentX = 0;
    };

    // Mouse
    element.addEventListener("mousedown", e => start(e.clientX));
    element.addEventListener("mousemove", e => move(e.clientX));
    element.addEventListener("mouseup", end);
    element.addEventListener("mouseleave", end);

    // Touch
    element.addEventListener("touchstart", e => start(e.touches[0].clientX));
    element.addEventListener("touchmove", e => move(e.touches[0].clientX));
    element.addEventListener("touchend", end);
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    const tSlider = document.querySelector(".testimonial-slider");
    const tTrack = document.querySelector(".testimonial-track");

    const sSlider = document.querySelector(".social-slider");
    const sTrack = document.querySelector(".social-track");

    if (tSlider && tTrack) enableSwipe(tSlider, tTrack);
    if (sSlider && sTrack) enableSwipe(sSlider, sTrack);
});