const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  toggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});