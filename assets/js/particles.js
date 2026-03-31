document.querySelectorAll('.service-card').forEach(card => {
  const container = document.createElement('div');
  container.className = 'particles';

  for (let i = 0; i < 10; i++) {
    const p = document.createElement('span');
    p.style.left = Math.random() * 90 + '%';
    p.style.top = Math.random() * 90 + '%';
    p.style.animationDelay = (Math.random() * 3).to