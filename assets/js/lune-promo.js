/* Lune Beauty — time-limited offer for new customers.
 * Shows a slim chip under the header on every page and a line above the booking form.
 * Requests sent while the offer runs carry "[Angebot −30 % Neukundin]" in their notes, so the studio sees it.
 * Switches itself off after END. Dismissing the chip hides it for this browser tab only (sessionStorage). */
(function(){
  'use strict';
  var END = '2026-11-30';
  var today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
  if (today > END) return;
  var TEXT = 'Neukundinnen: −30 % auf Ihre erste Behandlung', SUB = 'bei Terminanfrage bis 30.11.2026';
  var TAG = '[Angebot −30 % Neukundin]';

  var me = document.currentScript || document.querySelector('script[src*="lune-promo.js"]');
  var base = me && me.src ? me.src.replace(/assets\/js\/lune-promo\.js.*$/, '') : '/';
  var onHome = !!document.getElementById('booking-form');
  var href = onHome ? '#booking' : base + 'index.html#booking';

  function css(){
    var s = document.createElement('style');
    s.textContent =
      '#lunePromo{position:fixed;z-index:10040;left:50%;transform:translateX(-50%);top:calc(var(--lh-h,72px) + 10px);display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);padding:7px 8px 7px 16px;border-radius:999px;background:#1d1a16;color:#f6efe2;box-shadow:0 8px 24px rgba(30,24,16,.22);font:500 13px/1.3 Inter,Arial,sans-serif}' +
      '#lunePromo a.go{color:#1d1a16;background:#c9a95e;border-radius:999px;padding:6px 12px;font-weight:600;text-decoration:none;white-space:nowrap}' +
      '#lunePromo small{display:block;opacity:.7;font-size:11px}' +
      '#lunePromo button{background:none;border:0;color:#f6efe2;opacity:.6;font-size:16px;cursor:pointer;padding:2px 6px}' +
      '.lune-promo-line{margin:0 0 14px;padding:10px 14px;border-radius:14px;background:#fbf3e2;border:1px solid #e6cf9a;color:#5a4325;font:500 14px/1.4 Inter,Arial,sans-serif;text-align:center}' +
      '#lunePromo .s{display:none}' +
      '@media(max-width:560px){#lunePromo{width:calc(100% - 24px);justify-content:space-between;border-radius:16px;font-size:13px;padding:7px 6px 7px 14px;gap:8px}#lunePromo .l{display:none}#lunePromo .s{display:block;white-space:nowrap}#lunePromo small{font-size:11px}#lunePromo a.go{padding:7px 12px}}';
    document.head.appendChild(s);
  }

  function chip(){
    var closed = false; try { closed = sessionStorage.getItem('lune_promo_closed') === END; } catch(_) {}
    if (closed) return;
    var d = document.createElement('div'); d.id = 'lunePromo'; d.setAttribute('role', 'note');
    d.innerHTML = '<span class="l">' + TEXT + '<small>' + SUB + '</small></span><span class="s"><b>−30 %</b> für Neukundinnen<small>bis 30.11.2026</small></span><a class="go" href="' + href + '">Termin anfragen</a><button type="button" aria-label="Schließen">×</button>';
    d.querySelector('button').onclick = function(){ d.remove(); try { sessionStorage.setItem('lune_promo_closed', END); } catch(_) {} };
    document.body.appendChild(d);
  }

  function bookingLine(){
    var form = document.getElementById('booking-form'); if (!form) return;
    var p = document.createElement('p'); p.className = 'lune-promo-line';
    p.innerHTML = '<b>' + TEXT + '</b> · ' + SUB + '. Einmalig, nicht mit anderen Rabatten kombinierbar.';
    form.parentNode.insertBefore(p, form);
    // tag every request sent during the offer, whatever submit path the form uses
    var notes = form.querySelector('input[name="notes"]');
    var tag = function(){ if (notes && notes.value.indexOf(TAG) < 0) notes.value = (notes.value + ' ' + TAG).trim(); };
    form.addEventListener('submit', tag, true);
    tag();
  }

  function start(){ css(); chip(); bookingLine(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
