document.addEventListener("DOMContentLoaded", () => {

  // ✅ LOAD DATA
  let localTestimonials = JSON.parse(localStorage.getItem("testimonials")) || [
    { name: "Sofia", message: "Wundervolle Behandlung! Meine Haut war nie besser.", rating: 5 },
    { name: "Aylin", message: "Absolut professionell und sehr entspannend.", rating: 5 },
    { name: "Mia", message: "Bester Service, komme definitiv wieder!", rating: 5 }
  ];

  const track = document.getElementById("testimonialTrack");
  if (!track) return;

  // ✅ STAR RENDER
  function renderStars(rating = 5) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  // ✅ RENDER
  function render() {
    track.innerHTML = "";

    localTestimonials.forEach((t, i) => {
      track.innerHTML += `
        <div class="testimonial-card ${i === 0 ? 'featured' : ''}">
          <div class="stars">${renderStars(t.rating || 5)}</div>
          <p>"${t.message}"</p>
          <strong>— ${t.name}</strong>
        </div>
      `;
    });
  }

  render();

  let slides = document.querySelectorAll(".testimonial-card");
  let index = 0;

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;

    slides.forEach(s => s.classList.remove("active"));
    if (slides[index]) slides[index].classList.add("active");
  }

  update();

  // ✅ NAVIGATION
  const nextBtn = document.getElementById("nextTestimonial");
  const prevBtn = document.getElementById("prevTestimonial");

  nextBtn && (nextBtn.onclick = () => {
    index = (index + 1) % slides.length;
    update();
  });

  prevBtn && (prevBtn.onclick = () => {
    index = (index - 1 + slides.length) % slides.length;
    update();
  });

  // ✅ AUTO SLIDE
  setInterval(() => {
    if (slides.length > 1) {
      index = (index + 1) % slides.length;
      update();
    }
  }, 5000);

  // ✅ ⭐ RATING INPUT
let selectedRating = 5;

const stars = document.querySelectorAll("#ratingInput span");

if (stars.length) {

  stars.forEach((star, index) => {

    star.addEventListener("mouseover", () => {
      stars.forEach((s, i) => {
        s.style.color = i <= index ? "#c6a87a" : "#ddd";
      });
    });

    star.addEventListener("mouseout", () => {
      stars.forEach((s, i) => {
        s.style.color = i < selectedRating ? "#c6a87a" : "#ddd";
      });
    });

    star.addEventListener("click", () => {
      selectedRating = index + 1;

      stars.forEach((s, i) => {
        s.classList.toggle("active", i < selectedRating);
      });
    });

  });

  // ✅ default state
  stars.forEach((s, i) => {
    s.classList.toggle("active", i < selectedRating);
  });
}
  // ✅ FORM SUBMIT
  const form = document.getElementById("testimonialForm");

  form && form.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("tName").value.trim();
    const message = document.getElementById("tMessage").value.trim();

    if (!name || message.length < 5) return;

    // ✅ ADD NEW TESTIMONIAL (FIRST POSITION)
    localTestimonials.unshift({
      name,
      message,
      rating: selectedRating
    });

    // ✅ LIMIT STORAGE (PREMIUM CONTROL)
    localTestimonials = localTestimonials.slice(0, 50);

    // ✅ SAVE
    localStorage.setItem("testimonials", JSON.stringify(localTestimonials));

    // ✅ RE-RENDER
    render();
    slides = document.querySelectorAll(".testimonial-card");

    index = 0;
    update();

    e.target.reset();

    // ✅ reset stars
    selectedRating = 5;
    stars.forEach((s, i) => {
      s.classList.toggle("active", i < 5);
    });
  });

});
