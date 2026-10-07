/* Lune Beauty — cookieless visit counter.
 * Sends page views, treatment clicks and contact actions as anonymous counts to the
 * Lune Beauty CRM (Cloudflare, EU). No cookies, no local storage, no IP stored. */
(function(){
  'use strict';
  var ENDPOINT = 'https://lune-crm.pages.dev/api/track';
  if (navigator.doNotTrack === '1' || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) return;

  function send(payload){
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], {type:'text/plain'}))) return;
      fetch(ENDPOINT, {method:'POST', body:body, keepalive:true, mode:'cors', headers:{'content-type':'text/plain'}}).catch(function(){});
    } catch (_) {}
  }

  var params = new URLSearchParams(location.search);
  send({
    t: 'page',
    p: location.pathname.replace(/^\/LL(?=\/)/, '') || '/',
    r: document.referrer || '',
    u: params.get('utm_source') || '',
    l: (document.documentElement.lang || '').slice(0, 2),
  });

  var lastItem = '', lastAt = 0;
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (!el) return;
    var service = el.getAttribute('data-service');
    if (service) {
      var now = Date.now();
      if (service === lastItem && now - lastAt < 3000) return;
      lastItem = service; lastAt = now;
      send({t:'item', k: service});
      return;
    }
    var href = el.getAttribute('href') || '';
    if (/wa\.me|whatsapp/i.test(href)) send({t:'event', k:'whatsapp'});
    else if (/^tel:/i.test(href)) send({t:'event', k:'phone'});
    else if (/instagram\.com/i.test(href)) send({t:'event', k:'instagram'});
    else if (/#booking$/.test(href)) send({t:'event', k:'booking_open'});
  }, true);

  // Booking and skin-check requests: the site dispatches these events after a successful send.
  window.addEventListener('lune:booking-sent', function(){ send({t:'event', k:'booking_submit'}); });
  window.addEventListener('lune:skin-request-sent', function(){ send({t:'event', k:'skin_request'}); });
})();
