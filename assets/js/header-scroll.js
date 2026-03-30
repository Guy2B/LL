window.addEventListener('scroll', () => {
  const nav = document.querySelector('.top-nav');
  if (window.scrollY > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});
``