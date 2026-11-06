/* Lune Beauty — optional visit insights (Microsoft Clarity), only after consent.
 * Nothing is loaded and no banner is shown while CLARITY_ID is empty.
 * The visitor's choice is kept in localStorage (strictly necessary to remember it), asked again after 6 months.
 * Clarity is loaded only after "Gern"; "Nein, danke" loads nothing. Footer link "Datenschutz-Einstellungen" reopens it. */
(function(){
  'use strict';
  var CLARITY_ID = '';                       // project id from clarity.microsoft.com (10 characters)
  var KEY = 'lune_consent_v1', MAX_AGE = 182 * 864e5;
  if (!CLARITY_ID) return;
  if (/bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) return;

  function read(){ try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && Date.now() - v.at < MAX_AGE ? v : null; } catch(_) { return null; } }
  function save(ok){ try { localStorage.setItem(KEY, JSON.stringify({clarity: ok, at: Date.now()})); } catch(_) {} }

  var loaded = false;
  function loadClarity(){
    if (loaded) return; loaded = true;
    (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    try { window.clarity('consentv2', {ad_Storage: 'denied', analytics_Storage: 'granted'}); } catch(_) {}
  }

  var root = (document.querySelector('script[src*="lune-consent.js"]') || {}).src || '';
  var base = root ? root.replace(/assets\/js\/lune-consent\.js.*$/, '') : '/';

  var box;
  function css(){
    if (document.getElementById('luneConsentCss')) return;
    var s = document.createElement('style'); s.id = 'luneConsentCss';
    s.textContent =
      '#luneConsent{position:fixed;z-index:10000;left:16px;bottom:16px;max-width:340px;background:#fbf8f4;color:#2f2a24;border:1px solid #eadcc4;border-radius:16px;box-shadow:0 10px 30px rgba(30,24,16,.14);padding:12px 14px;font:14px/1.5 Inter,Arial,sans-serif;transform:translateY(20px);opacity:0;transition:all .35s ease}' +
      '#luneConsent.on{transform:none;opacity:1}' +
      '#luneConsent b{display:block;font:600 15px/1.3 "Playfair Display",Georgia,serif;margin:0 0 4px;color:#1d1a16}' +
      '#luneConsent p{margin:0 0 10px;color:#3b342b;font-size:13px}' +
      '#luneConsent a{color:#8a6429}' +
      '#luneConsent .lcB{display:flex;gap:8px}' +
      '#luneConsent button{flex:1;border-radius:999px;padding:7px 12px;font:600 13px Inter,Arial,sans-serif;cursor:pointer;border:1px solid #c9a95e}' +
      '#luneConsent .y{background:#c9a95e;color:#1d1a16}#luneConsent .n{background:transparent;color:#2f2a24}' +
      '@media(max-width:560px){#luneConsent{left:10px;right:10px;bottom:10px;max-width:none;padding:12px 14px}#luneConsent p{font-size:13px;margin-bottom:10px}}';
    document.head.appendChild(s);
  }
  function close(){ if (!box) return; box.classList.remove('on'); var b = box; box = null; setTimeout(function(){ b.remove(); }, 350); }
  function open(){
    if (box) return; css();
    box = document.createElement('div'); box.id = 'luneConsent'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Datenschutz-Einstellungen');
    box.innerHTML = '<p>Helfen Sie uns, die Webseite zu verbessern. <a href="' + base + 'datenschutz.html#clarity">Info</a></p>' +
      '<div class="lcB"><button type="button" class="n">Nein, danke</button><button type="button" class="y">Gern</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ box && box.classList.add('on'); }); });
    box.querySelector('.y').onclick = function(){ save(true); close(); loadClarity(); };
    box.querySelector('.n').onclick = function(){ var was = loaded; save(false); close(); if (was) location.reload(); };
  }

  function footerLink(){
    var f = document.querySelector('footer'); if (!f || f.querySelector('.lune-consent-link')) return;
    var a = document.createElement('a'); a.href = '#'; a.className = 'lune-consent-link'; a.textContent = 'Datenschutz-Einstellungen';
    a.style.cssText = 'display:inline-block;margin:10px 0 0;font-size:12px;opacity:.75;color:inherit';
    a.onclick = function(e){ e.preventDefault(); open(); };
    f.appendChild(a);
  }

  window.LuneConsent = { open: open };
  function start(){
    footerLink();
    var v = read();
    if (v) { if (v.clarity) loadClarity(); return; }
    // ask only once the visitor has looked around a little: after the first scroll or 8 seconds, never over the first impression
    var shown = false, show = function(){ if (shown) return; shown = true; window.removeEventListener('scroll', onScroll); open(); };
    var onScroll = function(){ if (window.scrollY > 250) show(); };
    window.addEventListener('scroll', onScroll, {passive: true});
    setTimeout(show, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
