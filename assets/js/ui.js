
(function(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  const bar=document.getElementById('scrollProgress');
  const lf=document.getElementById('lensflare');
  function setProgress(){
    const h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.width=(window.scrollY/Math.max(1,h))*100+'%';
    if(lf) lf.style.opacity=Math.min(1, window.scrollY/600);
  }
  setProgress();
  window.addEventListener('scroll',setProgress,{passive:true});
  window.addEventListener('resize',setProgress);

  const reveals=document.querySelectorAll('.reveal-up');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target);} });
    },{threshold:0.2});
    reveals.forEach(el=>io.observe(el));
  } else { reveals.forEach(el=>el.classList.add('visible')); }

  document.querySelectorAll('.service-card[data-target]').forEach(card=>{
    card.addEventListener('click',()=>{
      const id=card.getAttribute('data-target');
      const el=document.getElementById(id);
      if(!el) return;
      document.querySelectorAll('#pricing details').forEach(d=>{ if(d!==el) d.removeAttribute('open'); });
      el.setAttribute('open','');
      el.classList.add('highlight');
      setTimeout(()=>el.classList.remove('highlight'),1500);
      el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
})();

// ✅ Premium video system

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("whatsapp-box");
  const close = document.getElementById("wa-close");

  // ✅ show after 3 seconds
  setTimeout(() => {
    box.classList.add("active");
  }, 3000);

  // ✅ close
  close.addEventListener("click", () => {
    box.classList.remove("active");
  });
});
// ✅ Hover autoplay (SAFE VERSION)

document.querySelectorAll(".video-wrapper").forEach(wrapper => {
  const video = wrapper.querySelector("video");
  const overlay = wrapper.querySelector(".video-overlay");
  const button = wrapper.querySelector(".play-btn");
  if (!video) return;


  // ▶ CLICK PLAY
 if (button) {
  button.addEventListener("click", () => {

    // Reset ALL videos
    document.querySelectorAll(".video-wrapper").forEach(w => {
      const v = w.querySelector("video");
      const o = w.querySelector(".video-overlay");

      if (!v) return;

      v.pause();
      v.currentTime = 0;
      v.controls = false;

      v.classList.remove("user-playing");

      v.style.transform = "scale(1)";
      v.style.filter = "";
      v.style.opacity = "";

      o?.classList.remove("hidden");
    });

    // Activate current
    video.classList.add("user-playing");

    video.style.transform = "scale(1)";
    video.controls = true;
    video.muted = false;

    video.play().catch(() => {
      video.muted = true;
      video.play();
    });

    overlay.classList.add("hidden");

    if (window.innerWidth < 768 && video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
    }
  });
} // ✅ CLOSE IT HERE

  // ▶ HOVER IN
  wrapper.addEventListener("mouseenter", () => {
    if (!video || video.classList.contains("user-playing")) return;

    video.muted = true;
    video.controls = false;

    video.currentTime = 0;
    video.play().catch(() => {
  video.muted = true;
  video.play();
});

    // force zoom animation
    video.style.transform = "scale(1)";
    requestAnimationFrame(() => {
      video.style.transform = "scale(1.08)";
    });
  });

  // ▶ HOVER OUT
  wrapper.addEventListener("mouseleave", () => {
    if (!video || video.classList.contains("user-playing")) return;

    video.pause();
    video.currentTime = 0;

    video.style.transform = "scale(1)";
    overlay?.classList.remove("hidden");
  });

  // ▶ RESET WHEN STOPPED
  video.addEventListener("pause", () => {
    if (video.currentTime === 0) {
      overlay.classList.remove("hidden");
      video.classList.remove("user-playing");
    }
  });

});
