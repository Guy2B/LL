document.addEventListener("DOMContentLoaded", () => {

  // ✅ 5 feste Testimonials
  let testimonials = [
    { name: "Sofia", message: "Wundervolle Behandlung! Meine Haut war nie besser." },
    { name: "Aylin", message: "Absolut professionell und sehr entspannend." },
    { name: "Mia", message: "Bester Service – komme definitiv wieder!" },
    { name: "Hannah", message: "Sehr schönes Studio, tolle Atmosphäre." },
    { name: "Leonie", message: "Mega Ergebnis, vielen Dank für die tolle Behandlung!" }
  ];

  // ✅ User Testimonials laden
  if (localStorage.getItem("testimonials")) {
    testimonials = JSON.parse(localStorage.getItem("testimonials"));
  }

  const track = document.getElementById("testimonialTrack");

  // ✅ Karten rendern
  function render() {
    track.innerHTML = "";
    testimonials.forEach((t, i) => {
      track.innerHTML += `
        <div class="testimonial-card" data-i="${i}">
          <p>"${t.message}"</p>
          <strong>— ${t.name}</strong>
        </div>
      `;
    });
  }

  render();

  let cards = document.querySelectorAll(".testimonial-card");
  let index = 0;

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    cards.forEach(c => c.classList.remove("active"));
    cards[index].classList.add("active");
  }

  update();

  // ✅ Navigation
  document.getElementById("nextTestimonial").onclick = () => {
    index = (index + 1) % cards.length;
    update();
  };

  document.getElementById("prevTestimonial").onclick = () => {
    index = (index - 1 + cards.length) % cards.length;
    update();
  };

  // ✅ Auto Slide
  setInterval(() => {
    index = (index + 1) % cards.length;
    update();
  }, 3500);

  // ✅ Hinzufügen neuer Testimonials
  document.getElementById("testimonialForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("tName").value.trim();
    const message = document.getElementById("tMessage").value.trim();

    testimonials.push({ name, message });
    localStorage.setItem("testimonials", JSON.stringify(testimonials));

    render();
    cards = document.querySelectorAll(".testimonial-card");
    update();

    e.target.reset();
  });

});
