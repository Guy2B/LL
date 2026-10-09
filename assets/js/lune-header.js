/* Lune Beauty — header behaviour: dropdowns (hover + click + keyboard), mobile accordion drawer, scrolled state.
 * The theme toggle (#luneThemeToggle) keeps its own script on the pages that support dark mode. */
(function () {
  "use strict";
  var header = document.querySelector(".lx-header");
  if (!header) return;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  var drops = Array.prototype.slice.call(header.querySelectorAll(".lx-menu li.has-drop"));

  /* ---------- current page ---------- */
  var norm = function (p) { p = p.replace(/\/+$/, "/"); return /\/$/.test(p) ? p + "index.html" : p; };
  var here = norm(location.pathname);
  Array.prototype.forEach.call(header.querySelectorAll("a[href]"), function (a) {
    var raw = a.getAttribute("href");
    if (raw.charAt(0) === "#" || raw.indexOf("#") > 0) return; // section anchors are not pages
    if (norm(a.pathname) !== here) return;
    a.setAttribute("aria-current", "page");
    var li = a.closest(".lx-menu li.has-drop");
    if (li) li.querySelector(".lx-top").classList.add("is-active");
  });
  if (/\/produkt\//.test(here)) { var s = header.querySelector('.lx-menu a.lx-top[href$="shop.html"]'); if (s) s.classList.add("is-active"); }

  /* ---------- desktop dropdowns ---------- */
  function setOpen(li, open) {
    li.classList.toggle("is-open", open);
    var btn = li.querySelector(".lx-top");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function closeAll(except) { drops.forEach(function (li) { if (li !== except) setOpen(li, false); }); }

  drops.forEach(function (li) {
    var btn = li.querySelector(".lx-top"), panel = li.querySelector(".lx-drop"), timer;
    var links = function () { return Array.prototype.slice.call(panel.querySelectorAll("a")); };

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = !li.classList.contains("is-open");
      closeAll(li); setOpen(li, open);
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); closeAll(li); setOpen(li, true); var l = links()[0]; if (l) l.focus(); }
    });
    panel.addEventListener("keydown", function (e) {
      var list = links(), i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0) btn.focus(); else list[i - 1].focus(); }
    });
    li.addEventListener("mouseenter", function () { if (!canHover.matches) return; clearTimeout(timer); closeAll(li); setOpen(li, true); });
    li.addEventListener("mouseleave", function () { if (!canHover.matches) return; timer = setTimeout(function () { setOpen(li, false); }, 160); });
    li.addEventListener("focusout", function (e) { if (!li.contains(e.relatedTarget)) setOpen(li, false); });
  });

  document.addEventListener("click", function (e) { if (!e.target.closest(".lx-menu")) closeAll(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = drops.filter(function (li) { return li.classList.contains("is-open"); })[0];
    if (open) { setOpen(open, false); open.querySelector(".lx-top").focus(); }
    if (header.classList.contains("is-menu")) { setMenu(false); burger && burger.focus(); }
  });

  /* ---------- mobile drawer ---------- */
  var burger = header.querySelector(".lx-burger"), sheet = header.querySelector(".lx-sheet");
  function setMenu(open) {
    header.classList.toggle("is-menu", open);
    document.body.classList.toggle("lx-lock", open);
    if (burger) { burger.setAttribute("aria-expanded", open ? "true" : "false"); burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen"); }
    if (sheet) sheet.setAttribute("aria-hidden", open ? "false" : "true");
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!header.classList.contains("is-menu")); });
  if (sheet) {
    sheet.querySelector(".lx-sheet-scrim").addEventListener("click", function () { setMenu(false); });
    Array.prototype.forEach.call(sheet.querySelectorAll(".lx-m-acc"), function (b) {
      b.addEventListener("click", function () { b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") === "true" ? "false" : "true"); });
    });
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  }
  var mq = window.matchMedia("(min-width: 1024px)");
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { if (mq.matches) setMenu(false); else closeAll(); });

  /* ---------- scrolled state ---------- */
  var ticking = false;
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 12); ticking = false; }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
