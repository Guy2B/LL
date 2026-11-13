/* Second path for booking requests: when the booking cloud (Apps Script) fails,
 * the request goes to the CRM (/api/booking-backup), which stores it and mails the studio.
 * window.LuneBookingBackup({name, phone, email, service, date, time, notes}, error) → Promise<boolean> */
(function(){
  'use strict';
  var URL = 'https://lune-crm.pages.dev/api/booking-backup';
  window.LuneBookingBackup = async function(d, err){
    try {
      var res = await fetch(URL, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({
        name: String(d.name || '').trim(), phone: String(d.phone || '').trim(), email: String(d.email || '').trim(),
        service: d.service || '', date: d.date || '', time: d.time || '', notes: String(d.notes || '').trim(),
        cause: String((err && err.message) || err || '').slice(0, 280)
      })});
      var j = await res.json();
      return !!(j && j.ok);
    } catch (_) { return false; }
  };
})();
