/* Empfehlung: a friend's link (?ref=F-XXXXXX) from her Lune Mondkreis card.
 * - keeps the code for 60 days in this browser (localStorage "lune_ref");
 * - shows a small gift banner (first name of the friend, 30 % on the first treatment until the end of the offer);
 * - window.LuneRef.note() returns " [Empfehlung F-XXXXXX]" for the request notes (the CRM credits the friend after the first visit). */
(function(){
  'use strict';
  var KEY = 'lune_ref', API = 'https://karte.lunebeauty.de/api/ref?c=';
  function get(){ try { var x = JSON.parse(localStorage.getItem(KEY) || 'null'); return x && Date.now() - x.t < 60 * 86400000 ? x : null; } catch(_) { return null; } }
  function put(x){ try { localStorage.setItem(KEY, JSON.stringify(x)); } catch(_) {} }
  // counted on the ambassador's code: link opened (once per device) and Skin Check sent; nothing about the visitor
  function ping(c, e){
    var body = JSON.stringify({c: c, e: e});
    try { if(navigator.sendBeacon && navigator.sendBeacon('https://karte.lunebeauty.de/api/ref', new Blob([body], {type: 'text/plain'}))) return; } catch(_) {}
    fetch('https://karte.lunebeauty.de/api/ref', {method: 'POST', body: body, keepalive: true}).catch(function(){});
  }
  var q = new URLSearchParams(location.search).get('ref');
  var cur = get();
  if(q && /^F-[A-Z0-9]{6}$/i.test(q)){ q = q.toUpperCase(); if(!cur || cur.c !== q){ cur = {c: q, t: Date.now()}; ping(q, 'open'); } put(cur); }
  window.addEventListener('lune:skin-request-sent', function(){ var x = get(); if(x && active(x)) ping(x.c, 'skin'); });
  var active = function(x){ return x && x.until && new Date().toISOString().slice(0, 10) <= x.until; };
  window.LuneRef = {
    code: function(){ var x = get(); return x && active(x) ? x.c : ''; },
    note: function(){ var x = get(); return x && active(x) ? ' [Empfehlung ' + x.c + ']' : ''; },
    info: function(){ return get(); }
  };
  if(!cur) return;
  function banner(x){
    if(!active(x) || document.getElementById('luneRefBanner')) return;
    var until = new Date(x.until + 'T12:00:00').toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
    var b = document.createElement('div'); b.id = 'luneRefBanner';
    b.setAttribute('role', 'note');
    b.style.cssText = 'position:relative;z-index:50;margin:0;padding:12px 44px 12px 16px;background:linear-gradient(135deg,#1d1a16,#3a3026);color:#f6efe2;font:500 14px/1.45 Inter,system-ui,sans-serif;text-align:center';
    b.innerHTML = '🎁 <b style="color:#e8d5a3">Ein Geschenk von ' + (x.n ? x.n.replace(/[<>&"]/g, '') : 'Ihrer Freundin') + ':</b> ' + x.p + ' % auf Ihre erste Behandlung bei Lune Beauty (bis ' + until + '). '
      + (/skin-ai/.test(location.pathname) ? 'Starten Sie mit dem kostenlosen Skin Check, Ihr Vorteil wird automatisch übernommen.' : 'Ihr Vorteil wird bei Ihrer Terminanfrage automatisch übernommen.')
      + '<button type="button" aria-label="Schließen" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;color:#f6efe2;font-size:20px;cursor:pointer">×</button>';
    b.querySelector('button').onclick = function(){ b.remove(); };
    document.body.insertBefore(b, document.body.firstChild);
    // Skin Check page: the friend's 30 % replaces the usual 10 % Skin-Check advantage
    if(/skin-ai/.test(location.pathname)){
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, list = [];
      while((n = w.nextNode())) if(/10\s?%/.test(n.nodeValue) && !b.contains(n)) list.push(n);
      list.forEach(function(t){ t.nodeValue = t.nodeValue.replace(/10(\s?)%/g, x.p + '$1%'); });
    }
  }
  function load(){
    if(cur.n && cur.until && Date.now() - (cur.f || 0) < 86400000) return banner(cur);
    fetch(API + encodeURIComponent(cur.c), {cache: 'no-store'}).then(function(r){ return r.json(); }).then(function(d){
      if(!d || !d.ok){ try { localStorage.removeItem(KEY); } catch(_) {} return; }
      cur = {c: cur.c, t: cur.t, n: d.vorname, p: d.percent, until: d.until, f: Date.now()}; put(cur); banner(cur);
    }).catch(function(){});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
