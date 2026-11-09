/* Lune Beauty: short booking request directly on a treatment page.
 * Usage: <div data-lune-quick="Hydra Glow Facial (Aquafacial)" data-duration="90" data-price="130"></div>
 * Four fields (name, phone, day, time window) plus optional e-mail. Sends to the same booking cloud as the
 * homepage form (action publicBooking), so the request lands in the CRM like any other. The exact time is
 * agreed personally: the time window is sent as a representative time and spelled out in the notes. */
(function(){
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbw9ajjWLjDcnfr5HSUohETmArRk-k_gSzO7EBfWPoMMaDZYqvroQPrcOB7-u1q7LIEhhw/exec';
  var SLOTS = [
    {id: 'vormittags', label: 'Vormittags (9 bis 12 Uhr)', time: '10:00', sat: true},
    {id: 'mittags', label: 'Mittags (12 bis 14 Uhr)', time: '12:30', sat: true},
    {id: 'nachmittags', label: 'Nachmittags (14 bis 18 Uhr)', time: '15:30', sat: false}
  ];
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var berlinToday = function(){ return new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Berlin'}).format(new Date()); };

  function css(){
    if (document.getElementById('lqbCss')) return;
    var s = document.createElement('style'); s.id = 'lqbCss';
    s.textContent =
      '.lqb{max-width:520px;margin:26px auto 0;text-align:left;display:grid;gap:12px}' +
      '.lqb label{display:grid;gap:6px;font:600 .86rem/1.3 Inter,Arial,sans-serif;color:#5a4a36}' +
      '.lqb label i{font-style:normal;font-weight:400;color:#8a7a64}' +
      '.lqb input,.lqb select{width:100%;box-sizing:border-box;min-height:50px;padding:12px 14px;border:1px solid rgba(195,160,99,.45);border-radius:14px;background:#fff;font:16px Inter,Arial,sans-serif;color:#2f2a24}' +
      '.lqb input:focus,.lqb select:focus{outline:2px solid #c3a063;outline-offset:1px}' +
      '.lqb .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
      '.lqb .svc{padding:12px 14px;border-radius:14px;background:#fbf3e2;border:1px solid #e6cf9a;color:#5a4325;font:500 .95rem/1.4 Inter,Arial,sans-serif}' +
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
    var service = box.getAttribute('data-lune-quick');
    var price = Number(box.getAttribute('data-price') || 0), duration = Number(box.getAttribute('data-duration') || 0);
    var promo = window.LunePromo && window.LunePromo.active && new RegExp(window.LunePromo.match, 'i').test(service) ? window.LunePromo : null;
    var priceText = promo ? '<s>' + price + ' €</s> <b>' + promo.price + ' €</b> für Neukundinnen, bis ' + promo.untilText : '<b>' + price + ' €</b>';
    var f = document.createElement('form'); f.className = 'lqb'; f.noValidate = false;
    f.innerHTML =
      '<div class="svc">' + esc(service) + (duration ? ' · ' + duration + ' Min.' : '') + ' · ' + priceText + '</div>' +
      '<label>Vor- und Nachname<input name="name" autocomplete="name" required></label>' +
      '<label>Telefon oder WhatsApp<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0170 …" required></label>' +
      '<div class="row"><label>Wunschtag<input name="date" type="date" required></label>' +
      '<label>Uhrzeit<select name="slot" required><option value="">Bitte wählen</option>' + SLOTS.map(function(s){ return '<option value="' + s.id + '">' + s.label + '</option>'; }).join('') + '</select></label></div>' +
      '<label>E-Mail <i>(optional, für Ihre Terminbestätigung)</i><input name="email" type="email" inputmode="email" autocomplete="email"></label>' +
      '<div class="fine"><details><summary>Mit Ihrer Anfrage werden Sie Mitglied im <b>Lune Mondkreis</b> und erhalten gelegentlich Neuigkeiten per E-Mail. <u>Mehr</u></summary><p style="margin:6px 0 0">Der Lune Mondkreis ist unser kostenloses Treueprogramm mit Lichtpunkten bei jedem Besuch. Per E-Mail informieren wir Sie gelegentlich über Neuigkeiten und Angebote von Lune Beauty. Dem können Sie jederzeit widersprechen: über den Link in jeder E-Mail oder an <a href="mailto:kontakt@lunebeauty.de">kontakt@lunebeauty.de</a>. Mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p></details>' +
      '<label class="cb"><input type="checkbox" name="noNewsletter" value="1"><span>Ich möchte keine E-Mails mit Neuigkeiten erhalten.</span></label></div>' +
      '<div class="err" hidden></div>' +
      '<button type="submit">Unverbindlich anfragen</button>' +
      '<p class="fine">Wir melden uns persönlich per WhatsApp oder Telefon und bestätigen die genaue Uhrzeit. Erst dann ist der Termin verbindlich.</p>';
    box.appendChild(f);

    var dateIn = f.elements.date, slotIn = f.elements.slot, err = f.querySelector('.err');
    dateIn.min = berlinToday();
    function check(){
      err.hidden = true; err.textContent = '';
      var d = dateIn.value; if (!d) return true;
      var wd = new Date(d + 'T12:00:00').getDay();
      var msg = '';
      if (wd === 0) msg = 'Sonntags ist das Studio geschlossen. Bitte wählen Sie einen anderen Tag.';
      else if (wd === 6 && slotIn.value === 'nachmittags') msg = 'Samstags sind wir bis 14 Uhr für Sie da. Bitte wählen Sie vormittags oder mittags.';
      if (msg) { err.textContent = msg; err.hidden = false; return false; }
      return true;
    }
    dateIn.addEventListener('change', check); slotIn.addEventListener('change', check);

    f.addEventListener('submit', async function(ev){
      ev.preventDefault();
      if (!f.reportValidity() || !check()) return;
      var slot = SLOTS.filter(function(s){ return s.id === slotIn.value; })[0];
      var notes = 'Zeitfenster: ' + slot.label + ', genaue Uhrzeit bitte abstimmen. [Kurzanfrage ' + (document.title.split('|')[0].trim() || 'Seite') + ']';
      var p = window.LunePromo;
      if (p && p.active && new RegExp(p.match, 'i').test(service)) notes += ' ' + p.tag;
      if (f.elements.noNewsletter.checked) notes += ' [Kein Newsletter]';
      if (window.LuneRef && window.LuneRef.note && window.LuneRef.note()) notes += window.LuneRef.note();
      var q = new URLSearchParams(location.search);
      if (q.get('utm_source') === 'google-ads' || q.get('gclid') || q.get('gbraid') || q.get('wbraid')) notes += ' [Quelle: Google Ads]';
      var body = new URLSearchParams({
        action: 'publicBooking', source: 'Website',
        service: service, date: dateIn.value, time: slot.time,
        name: f.elements.name.value.trim(), phone: f.elements.phone.value.trim(), email: f.elements.email.value.trim(),
        durationMinutes: duration ? String(duration) : '', price: price ? String(price) : '', notes: notes.trim()
      });
      var btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
      try {
        var res = await fetch(API, {method: 'POST', body: body, redirect: 'follow'});
        var data = JSON.parse(await res.text());
        if (!data || data.ok === false) throw new Error((data && data.error) || 'Übertragung fehlgeschlagen');
        f.innerHTML = '<div class="ok"><b>Vielen Dank, ' + esc(body.get('name').split(' ')[0]) + '!</b><br>Ihre Anfrage ist bei uns. Wir melden uns persönlich, um die Uhrzeit zu bestätigen.</div>';
        box.scrollIntoView({behavior: 'smooth', block: 'center'});
        try { window.dispatchEvent(new Event('lune:booking-sent')); } catch(_) {}
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Unverbindlich anfragen';
        err.innerHTML = 'Das hat leider nicht geklappt. Bitte schreiben Sie uns per <a href="https://wa.me/491791544002">WhatsApp</a> oder rufen Sie an: <a href="tel:+491791544002">0179 1544002</a>.';
        err.hidden = false;
      }
    });
  }

  function start(){
    var boxes = document.querySelectorAll('[data-lune-quick]'); if (!boxes.length) return;
    css(); boxes.forEach(build);
  }
  // wait briefly for the promo script (loaded by lune-stats.js) so the offer price can show in the form
  function go(){ if (window.LunePromo !== undefined) start(); else setTimeout(start, 700); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
