document.addEventListener("DOMContentLoaded", () => {

  /* ✅ Lokale Testimonials */
  let localTestimonials = [
    { name: "Sofia", message: "Wundervolle Behandlung! Meine Haut war nie besser." },
    { name: "Aylin", message: "Absolut professionell und sehr entspannend." },
    { name: "Mia", message: "Bester Service – komme definitiv wieder!" },
    { name: "Hannah", message: "Sehr schönes Studio, tolle Atmosphäre." },
    { name: "Leonie", message: "Mega Ergebnis – vielen Dank!" }
  ];

  if (localStorage.getItem("testimonials")) {
    localTestimonials = JSON.parse(localStorage.getItem("testimonials"));
  }

  /* ✅ Instagram Widget */
  const IG_WIDGET = `
    <div class="ig-block">
      <script src="https://cdn.lightwidget.com/widgets/lightwidget.js"></script>
      <iframe src="https://cdn.lightwidget.com/widgets/DEIN_WIDGET_ID.html"
      scrolling="no" allowtransparency="true" class="ig-widget"></iframe>
    </div>
  `;

  const track = document.getElementById("testimonialTrack");

  function render() {
    track.innerHTML = "";

    /* ✅ Lokale Testimonials einfügen */
    localTestimonials.forEach(t => {
      track.innerHTML += `
        <div class="testimonial-card">
          <p>"${t.message}"</p>
          <strong>— ${t.name}</strong>
        </div>
      `;
    });

    /* ✅ Instagram Review Slide */
    track.innerHTML += `
      <div class="testimonial-card">
        ${IG_WIDGET}
      </div>
    `;
  }

  render();

  let slides = document.querySelectorAll(".testimonial-card");
  let index = 0;

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach(s => s.classList.remove("active"));
    slides[index].classList.add("active");
  }

  update();

  document.getElementById("nextTestimonial").onclick = () => {
    index = (index + 1) % slides.length;
    update();
  };

  document.getElementById("prevTestimonial").onclick = () => {
    index = (index - 1 + slides.length) % slides.length;
    update();
  };

  setInterval(() => {
    index = (index + 1) % slides.length;
    update();
  }, 4000);

  /* ✅ Neues lokales Testimonial */
  document.getElementById("testimonialForm").addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("tName").value.trim();
    const message = document.getElementById("tMessage").value.trim();

    localTestimonials.push({ name, message });
    localStorage.setItem("testimonials", JSON.stringify(localTestimonials));

    render();
    slides = document.querySelectorAll(".testimonial-card");
    update();

    e.target.reset();
  });

});