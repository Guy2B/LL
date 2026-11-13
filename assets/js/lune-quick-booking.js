/* Lune Beauty: the homepage booking form, embedded on a treatment page so the visitor does not have to leave it.
 * Usage: <div data-lune-quick="Hydra Glow Facial (Aquafacial)"></div>  (that treatment is preselected)
 * Same fields, same rules and same destination as the form on index.html: treatment, day, exact time within
 * opening hours (Mo–Fr 9–18, Sa 9–14, end of treatment before closing), name, phone, e-mail, Mondkreis note.
 * Sends action publicBooking to the booking cloud, so the request lands in the CRM exactly like the others.
 * The treatment list mirrors the booking select on index.html (names, durations, prices). */
(function(){
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbw9ajjWLjDcnfr5HSUohETmArRk-k_gSzO7EBfWPoMMaDZYqvroQPrcOB7-u1q7LIEhhw/exec';
  var GROUPS = [["Gesicht", ["Basisbehandlung Gesicht", "Basisbehandlung Gesicht + Hals + Dekolleté", "Hydro Boost Gesicht", "Hydro Boost Gesicht & Dekolleté", "Relax & Glow Behandlung", "Hydra Glow Facial (Aquafacial)", "Aknebehandlung", "Anti-Aging Behandlung", "Sensi Treatment"]], ["Add-ons", ["LED Maske", "Radiofrequenz"]], ["Waxing", ["Oberlippe Waxing", "Kinn Waxing", "Gesichtswaxing komplett"]], ["Maniküre & Fußpflege", ["Klassische Maniküre", "Spa Maniküre", "Basis Fußpflege", "Spa Fußpflege"]], ["Extras", ["Farbe", "Farbe entfernen (Füße)", "Farbe entfernen (Hände)"]], ["Augenpflege", ["Wimpernfärben", "Augenbrauen färben", "Augenbrauenkorrektur", "Kombi Augenbehandlung"]]];
  var META = {"Basisbehandlung Gesicht": [60, 69], "Basisbehandlung Gesicht + Hals + Dekolleté": [75, 85], "Hydro Boost Gesicht": [75, 89], "Hydro Boost Gesicht & Dekolleté": [80, 99], "Relax & Glow Behandlung": [90, 110], "Hydra Glow Facial (Aquafacial)": [90, 130], "Aknebehandlung": [70, 89], "Anti-Aging Behandlung": [90, 120], "Sensi Treatment": [75, 89], "LED Maske": [10, 10], "Radiofrequenz": [10, 10], "Oberlippe Waxing": [10, 15], "Kinn Waxing": [10, 15], "Gesichtswaxing komplett": [20, 30], "Klassische Maniküre": [0, 33], "Spa Maniküre": [0, 52], "Basis Fußpflege": [0, 50], "Spa Fußpflege": [0, 65], "Farbe": [0, 10], "Farbe entfernen (Füße)": [0, 20], "Farbe entfernen (Hände)": [0, 10], "Wimpernfärben": [0, 20], "Augenbrauen färben": [0, 15], "Augenbrauenkorrektur": [0, 15], "Kombi Augenbehandlung": [0, 45]};   // name: [minutes, price €]
  var OPEN = 9 * 60, DEFAULT_DURATION = 60;
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var berlinToday = function(){ return new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Berlin'}).format(new Date()); };
  var mins = function(v){ var m = String(v || '').match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : NaN; };
  var hhmm = function(n){ return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); };
  function closeFor(date){ if (!date) return null; var p = date.split('-').map(Number), day = new Date(p[0], p[1] - 1, p[2]).getDay(); return day === 0 ? null : day === 6 ? 14 * 60 : 18 * 60; }

  function css(){
    if (document.getElementById('lqbCss')) return;
    var s = document.createElement('style'); s.id = 'lqbCss';
    s.textContent =
      '.lqb{max-width:520px;margin:26px auto 0;text-align:left;display:grid;gap:12px}' +
      '.lqb label{display:grid;gap:6px;font:600 .86rem/1.3 Inter,Arial,sans-serif;color:#5a4a36}' +
      '.lqb input,.lqb select{width:100%;box-sizing:border-box;min-height:50px;padding:12px 14px;border:1px solid rgba(195,160,99,.45);border-radius:14px;background:#fff;font:16px Inter,Arial,sans-serif;color:#2f2a24}' +
      '.lqb input:focus,.lqb select:focus{outline:2px solid #c3a063;outline-offset:1px}' +
      '.lqb .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
      '.lqb .svc{padding:10px 14px;border-radius:14px;background:#fbf3e2;border:1px solid #e6cf9a;color:#5a4325;font:500 .92rem/1.4 Inter,Arial,sans-serif}' +
      '.lqb .svc s{opacity:.6}' +
      '.lqb button{min-height:54px;border:0;border-radius:999px;background:linear-gradient(135deg,#2f261d,#6e5226);color:#fff;font:700 1rem Inter,Arial,sans-serif;cursor:pointer}' +
      '.lqb button[disabled]{opacity:.6}' +
      '.lqb .fine{font:13px/1.55 Inter,Arial,sans-serif;color:#7a6c58;margin:0}' +
      '.lqb .fine summary{cursor:pointer;list-style:none}' +
      '.lqb .cb{display:flex;gap:8px;align-items:flex-start;font-weight:400}.lqb .cb input{width:18px;height:18px;min-height:0;flex:none;margin:2px 0 0}' +
      '.lqb .ok{padding:16px;border-radius:16px;background:#eef6ea;border:1px solid #b9d7ad;color:#2f5b25;font:500 1rem/1.5 Inter,Arial,sans-serif}' +
      '.lqb .err{color:#b83227;font:500 .9rem/1.4 Inter,Arial,sans-serif}' +
      '@media(max-width:560px){.lqb .row{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function build(box){
    var pre = box.getAttribute('data-lune-quick') || '';
    var f = document.createElement('form'); f.className = 'lqb';
    f.innerHTML =
      '<label>Behandlung<select name="service" required><option value="">Behandlung wählen</option>' +
        GROUPS.map(function(g){ return '<optgroup label="' + esc(g[0]) + '">' + g[1].map(function(o){ return '<option' + (o === pre ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</optgroup>'; }).join('') +
      '</select></label>' +
      '<div class="svc" hidden></div>' +
      '<div class="row"><label>Wunschtag<input name="date" type="date" required></label>' +
      '<label>Wunschzeit<input name="time" type="time" step="900" min="09:00" required></label></div>' +
      '<label>Vor- und Nachname<input name="name" placeholder="Vor- und Nachname" autocomplete="name" required></label>' +
      '<label>Telefonnummer<input name="phone" type="tel" inputmode="tel" placeholder="+49 …" autocomplete="tel" required></label>' +
      '<label>E-Mail-Adresse<input name="email" type="email" inputmode="email" placeholder="name@beispiel.de" autocomplete="email" required></label>' +
      '<div class="fine"><details><summary>Mit Ihrer Anfrage werden Sie Mitglied im <b>Lune Mondkreis</b> und erhalten gelegentlich Neuigkeiten per E-Mail. <u>Mehr</u></summary><p style="margin:6px 0 0">Der Lune Mondkreis ist unser kostenloses Treueprogramm mit Lichtpunkten bei jedem Besuch. Per E-Mail informieren wir Sie gelegentlich über Neuigkeiten und Angebote von Lune Beauty. Dem können Sie jederzeit widersprechen: über den Link in jeder E-Mail oder an <a href="mailto:kontakt@lunebeauty.de">kontakt@lunebeauty.de</a>. Mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p></details>' +
      '<label class="cb"><input type="checkbox" name="noNewsletter" value="1"><span>Ich möchte keine E-Mails mit Neuigkeiten erhalten.</span></label></div>' +
      '<div class="err" hidden></div>' +
      '<button type="submit">Termin anfragen</button>';
    box.appendChild(f);

    var E = f.elements, info = f.querySelector('.svc'), err = f.querySelector('.err');
    E.date.min = berlinToday();
    var meta = function(){ return META[E.service.value] || [0, 0]; };
    var duration = function(){ return meta()[0] || DEFAULT_DURATION; };
    function promoFor(name){ var p = window.LunePromo; return p && p.active && new RegExp(p.match, 'i').test(name) ? p : null; }
    function showInfo(){
      var m = meta(), p = promoFor(E.service.value);
      if (!E.service.value) { info.hidden = true; return; }
      info.innerHTML = (m[0] ? m[0] + ' Minuten · ' : '') + (p ? '<s>' + m[1] + ' €</s> <b>' + p.price + ' €</b> für Neukundinnen, bis ' + p.untilText : (m[1] ? '<b>' + m[1] + ' €</b>' : ''));
      info.hidden = false;
    }
    // same rules as the homepage form (lune-booking-hours-v41)
    function limits(){ var c = closeFor(E.date.value); if (c === null) E.time.removeAttribute('max'); else E.time.max = hhmm(c - duration()); }
    function valid(show){
      var msg = '', c = closeFor(E.date.value), t = mins(E.time.value);
      if (E.date.value && E.date.value < berlinToday()) msg = 'Bitte wählen Sie einen Tag ab heute.';
      else if (E.date.value && c === null) msg = 'Sonntags sind keine Termine buchbar.';
      else if (E.date.value && E.time.value && t < OPEN) msg = 'Der früheste buchbare Termin ist 09:00 Uhr.';
      else if (E.date.value && E.time.value && t + duration() > c) msg = 'Dieser Termin endet nach Ladenschluss. Bitte wählen Sie eine frühere Uhrzeit.';
      E.time.setCustomValidity(msg);
      err.textContent = msg; err.hidden = !(msg && show);
      return !msg;
    }
    E.service.addEventListener('change', function(){ showInfo(); limits(); valid(false); });
    E.date.addEventListener('change', function(){ limits(); valid(true); });
    E.time.addEventListener('change', function(){ valid(true); });
    showInfo(); limits();

    f.addEventListener('submit', async function(ev){
      ev.preventDefault();
      limits();
      if (!valid(true) || !f.reportValidity()) return;
      var m = meta(), notes = '', p = promoFor(E.service.value);
      if (p) notes += ' ' + p.tag;
      if (E.noNewsletter.checked) notes += ' [Kein Newsletter]';
      if (window.LuneRef && window.LuneRef.note && window.LuneRef.note()) notes += window.LuneRef.note();
      var q = new URLSearchParams(location.search);
      if (q.get('utm_source') === 'google-ads' || q.get('gclid') || q.get('gbraid') || q.get('wbraid')) notes += ' [Quelle: Google Ads]';
      var body = new URLSearchParams({
        action: 'publicBooking', source: 'Website',
        service: E.service.value, date: E.date.value, time: E.time.value,
        name: E.name.value.trim(), phone: E.phone.value.trim(), email: E.email.value.trim(),
        durationMinutes: m[0] ? String(m[0]) : '', price: m[1] ? String(m[1]) : '', notes: notes.trim()
      });
      var btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
      try {
        var res = await fetch(API, {method: 'POST', body: body, redirect: 'follow'});
        var data = JSON.parse(await res.text());
        if (!data || data.ok === false) throw new Error((data && data.error) || 'Übertragung fehlgeschlagen');
        f.innerHTML = '<div class="ok">Vielen Dank. Ihre Anfrage wurde sicher übermittelt.<br>Der Termin ist erst nach unserer persönlichen Bestätigung verbindlich.</div>';
        box.scrollIntoView({behavior: 'smooth', block: 'center'});
        try { window.dispatchEvent(new Event('lune:booking-sent')); } catch(_) {}
      } catch (e) {
        // second path: the CRM keeps the request and mails the studio, so nothing is lost
        var saved = window.LuneBookingBackup ? await window.LuneBookingBackup({name: E.name.value, phone: E.phone.value, email: E.email.value, service: E.service.value, date: E.date.value, time: E.time.value, notes: notes}, e) : false;
        if (saved) {
          f.innerHTML = '<div class="ok">Vielen Dank. Ihre Anfrage ist bei uns eingegangen.<br>Der Termin ist erst nach unserer persönlichen Bestätigung verbindlich.</div>';
          box.scrollIntoView({behavior: 'smooth', block: 'center'});
          try { window.dispatchEvent(new Event('lune:booking-sent')); } catch(_) {}
          return;
        }
        btn.disabled = false; btn.textContent = 'Termin anfragen';
        err.innerHTML = 'Die Terminanfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns per <a href="https://wa.me/491791544002">WhatsApp</a> oder telefonisch: <a href="tel:+491791544002">0179 1544002</a>.';
        err.hidden = false;
      }
    });
  }

  function start(){ var boxes = document.querySelectorAll('[data-lune-quick]'); if (!boxes.length) return; css(); boxes.forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
