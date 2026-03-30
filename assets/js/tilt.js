document.querySelectorAll('.service-card').forEach(card => {
  const strength = 8;

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;

    const rX = (y / r.height) * strength;
    const rY = -(x / r.width) * strength;

    card.style.transform =
      `perspective(900px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.03)`;

    card.classList.add('hovered');
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
    card.classList.remove('hovered');
  });
});
