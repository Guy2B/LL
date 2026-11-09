/* Lune Beauty — time-limited offer for new customers.
 * Shows a slim chip under the header on every page and a line above the booking form.
 * Requests sent while the offer runs carry "[Angebot −30 % Neukundin]" in their notes, so the studio sees it.
 * Switches itself off after END. Dismissing the chip hides it for this browser tab only (sessionStorage). */
(function(){
  'use strict';
  var END = '2026-11-30';
  var today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  window.LunePromo = null;
  if (today > END) return;
  var SERVICE = 'Hydra Glow Facial (Aquafacial)';
  var TEXT = 'Neukundinnen: −30 % auf Ihr erstes Hydra Glow Facial', SUB = 'bei Terminanfrage bis 30.11.2026';
  var TAG = '[Angebot −30 % Hydra Glow Neukundin]';
  var REGULAR = 130, PRICE = 91;   // 130 € − 30 %
  // read by lune-quick-booking.js (short request form on treatment pages)
  window.LunePromo = { active: true, match: 'hydra glow', tag: TAG, price: PRICE, regular: REGULAR, until: END, untilText: '30.11.' };

  var me = document.currentScript || document.querySelector('script[src*="lune-promo.js"]');
  var base = me && me.src ? me.src.replace(/assets\/js\/lune-promo\.js.*$/, '') : '/';
  var onHome = !!document.getElementById('booking-form');
  var href = (onHome ? '' : base + 'index.html') + '?service=' + encodeURIComponent(SERVICE) + '#booking';

  function css(){
    var s = document.createElement('style');
    s.textContent =
      '#lunePromo{position:fixed;z-index:10040;left:50%;transform:translateX(-50%);top:calc(var(--lh-h,72px) + 10px);display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);padding:7px 8px 7px 16px;border-radius:999px;background:#1d1a16;color:#f6efe2;box-shadow:0 8px 24px rgba(30,24,16,.22);font:500 13px/1.3 Inter,Arial,sans-serif}' +
      '#lunePromo a.go{color:#1d1a16;background:#c9a95e;border-radius:999px;padding:6px 12px;font-weight:600;text-decoration:none;white-space:nowrap}' +
      '#lunePromo small{display:block;opacity:.7;font-size:11px}' +
      '#lunePromo button{background:none;border:0;color:#f6efe2;opacity:.6;font-size:16px;cursor:pointer;padding:2px 6px}' +
      '.lune-promo-line{margin:0 0 14px;padding:10px 14px;border-radius:14px;background:#fbf3e2;border:1px solid #e6cf9a;color:#5a4325;font:500 14px/1.4 Inter,Arial,sans-serif;text-align:center}' +
      '#lunePromo .s{display:none}' +
      '.lune-promo-note{display:block;font:600 11px/1.3 Inter,Arial,sans-serif;color:#8a6429;margin:2px 0 6px}' +
      '.lune-promo-hero{display:inline-block;margin:14px 0 0;padding:9px 14px;border-radius:12px;background:#1d1a16;color:#f6efe2;font:500 15px/1.4 Inter,Arial,sans-serif}.lune-promo-hero b{color:#e3c47e}' +
      '@media(max-width:560px){#lunePromo{width:calc(100% - 24px);justify-content:space-between;border-radius:16px;font-size:13px;padding:7px 6px 7px 14px;gap:8px}#lunePromo .l{display:none}#lunePromo .s{display:block;white-space:nowrap}#lunePromo a.go .s{display:inline}#lunePromo small{font-size:11px}#lunePromo a.go{padding:7px 12px}}';
    document.head.appendChild(s);
  }

  function chip(){
    var closed = false; try { closed = sessionStorage.getItem('lune_promo_closed') === END; } catch(_) {}
    if (closed) return;
    var d = document.createElement('div'); d.id = 'lunePromo'; d.setAttribute('role', 'note');
    d.innerHTML = '<span class="l">' + TEXT + '<small>' + SUB + '</small></span><span class="s"><b>−30 % Hydra Glow</b><small>für Neukundinnen · bis 30.11.</small></span><a class="go" href="' + href + '"><span class="l">Termin anfragen</span><span class="s">Anfragen</span></a><button type="button" aria-label="Schließen">×</button>';
    d.querySelector('button').onclick = function(){ d.remove(); try { sessionStorage.setItem('lune_promo_closed', END); } catch(_) {} };
    document.body.appendChild(d);
  }

  function bookingLine(){
    var form = document.getElementById('booking-form'); if (!form) return;
    var p = document.createElement('p'); p.className = 'lune-promo-line';
    p.innerHTML = '<b>' + TEXT + '</b> · ' + SUB + '. Einmalig, nur für das Hydra Glow Facial, nicht mit anderen Rabatten kombinierbar.';
    form.parentNode.insertBefore(p, form);
    // tag every request sent during the offer, whatever submit path the form uses
    var notes = form.querySelector('input[name="notes"]'), sel = form.querySelector('select[name="service"]');
    var tag = function(){
      if (!notes) return;
      var on = sel && /hydra glow/i.test(sel.value);
      notes.value = notes.value.replace(TAG, '').trim();
      if (on) notes.value = (notes.value + ' ' + TAG).trim();
    };
    form.addEventListener('submit', tag, true);
    if (sel) sel.addEventListener('change', tag);
    setTimeout(tag, 500);
  }

  // show the offer price wherever the Hydra Glow price appears (price lists, photo captions, homepage list)
  function prices(){
    var NEW = '<s style="opacity:.55;font-weight:400">' + REGULAR + ' €</s> ' + PRICE + ' €';
    document.querySelectorAll('.price-row').forEach(function(r){
      var n = r.querySelector('strong'), b = r.querySelector('.price-side b');
      if (!n || !b || !/hydra glow/i.test(n.textContent) || b.textContent.trim() !== REGULAR + ' €') return;
      b.innerHTML = NEW;
      var note = document.createElement('span'); note.className = 'lune-promo-note'; note.textContent = 'Neukundinnen, bis 30.11.';
      b.parentNode.insertBefore(note, b.nextSibling);
    });
    document.querySelectorAll('li').forEach(function(li){
      var link = li.querySelector('[data-service]'), pr = li.querySelector('.price');
      if (!link || !pr || !/hydra glow/i.test(link.getAttribute('data-service')) || pr.textContent.trim() !== REGULAR + ' €') return;
      pr.innerHTML = NEW;
    });
    document.querySelectorAll('figcaption').forEach(function(fc){
      if (/Hydra Glow Facial · 130 €/.test(fc.innerHTML)) fc.innerHTML = fc.innerHTML.replace('Hydra Glow Facial · 130 €', 'Hydra Glow Facial · ' + NEW);
    });
    // treatment page with the short request form: one clear offer line under the title
    var h1 = document.querySelector('.lx-hero h1');
    if (h1 && document.querySelector('[data-lune-quick*="Hydra Glow"]')) {
      var line = document.createElement('p'); line.className = 'lune-promo-hero';
      line.innerHTML = '<b>Neukundinnen: ' + PRICE + ' € statt ' + REGULAR + ' €</b> · bei Anfrage bis 30.11.';
      h1.parentNode.insertBefore(line, h1.nextSibling);
    }
  }

  function start(){ css(); chip(); bookingLine(); prices(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
