/* Lune Beauty Shop — cart, filters, live stock and PayPal checkout.
 * Order flow: cart → PayPal (login + delivery address) → review on our page → "Zahlungspflichtig bestellen" → capture.
 * Prices/stock are checked again on the server (crm: /api/shop). */
(function () {
  "use strict";
  var API = "https://lune-crm.pages.dev/api/shop";
  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var KEY = "lune_cart_v1";
  var WHATSAPP = "491791544002";
  var catalog = [], byId = {}, live = null, liveById = {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var eur = function (n) { return Number(n).toFixed(2).replace(".", ",") + " €"; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ---------- cart storage ---------- */
  function readCart() { try { var c = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(c) ? c : []; } catch (_) { return []; } }
  function writeCart(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) {} updateBadge(); }
  function cartLines() {
    return readCart().filter(function (l) { return byId[l.id]; }).map(function (l) {
      var p = byId[l.id], price = priceOf(p);
      return { id: l.id, qty: l.qty, p: p, price: price, total: Math.round(price * l.qty * 100) / 100 };
    });
  }
  function priceOf(p) { return liveById[p.id] ? liveById[p.id].price : p.price; }
  function stockOf(p) { return liveById[p.id] ? liveById[p.id].stock : null; }
  function addToCart(id, qty) {
    var c = readCart(), l = c.find(function (x) { return x.id === id; }), p = byId[id], s = p && stockOf(p);
    var want = (l ? l.qty : 0) + (qty || 1);
    if (s != null && want > s) { toast(s ? "Nur noch " + s + " Stück verfügbar" : "Leider ausverkauft"); want = s; }
    if (want < 1) return;
    if (l) l.qty = Math.min(10, want); else c.push({ id: id, qty: Math.min(10, want) });
    writeCart(c); toast("Im Warenkorb ✓"); renderCart();
  }
  function setQty(id, qty) {
    var c = readCart().map(function (l) { return l.id === id ? { id: id, qty: Math.max(0, Math.min(10, qty)) } : l; }).filter(function (l) { return l.qty > 0; });
    writeCart(c); renderCart();
  }
  function totals(lines) {
    var sub = lines.reduce(function (s, l) { return s + l.total; }, 0);
    var rules = (live && live.shipping) || { fee: 4.95, freeFrom: 50 };
    var ship = !lines.length ? 0 : sub >= rules.freeFrom ? 0 : rules.fee;
    return { sub: Math.round(sub * 100) / 100, ship: ship, total: Math.round((sub + ship) * 100) / 100, rules: rules };
  }
  function updateBadge() {
    var n = readCart().reduce(function (s, l) { return s + l.qty; }, 0);
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n ? String(n) : ""; });
  }

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, 1800);
  }

  /* ---------- drawer ---------- */
  var drawer, scrim, view = "cart", review = null;
  function buildDrawer() {
    scrim = document.createElement("div"); scrim.className = "cart-scrim";
    drawer = document.createElement("aside"); drawer.className = "cart"; drawer.setAttribute("aria-label", "Warenkorb");
    drawer.innerHTML = '<div class="cart-head"><h2>Warenkorb</h2><button class="cart-x" type="button" aria-label="Schließen">×</button></div><div class="cart-body"></div><div class="cart-foot"></div>';
    document.body.appendChild(scrim); document.body.appendChild(drawer);
    scrim.onclick = closeCart; $(".cart-x", drawer).onclick = closeCart;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });
  }
  function openCart() { view = view === "done" ? "cart" : view; renderCart(); scrim.classList.add("on"); drawer.classList.add("on"); }
  function closeCart() { scrim.classList.remove("on"); drawer.classList.remove("on"); if (view === "done") view = "cart"; }

  function legalNote() {
    return '<p class="cart-legal">Versand innerhalb Deutschlands mit DHL in 1–3 Werktagen. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Es gelten unsere <a href="' + ROOT + 'agb.html#shop" target="_blank">AGB</a>; Informationen zu <a href="' + ROOT + 'widerruf.html" target="_blank">Widerruf</a>, <a href="' + ROOT + 'versand-zahlung.html" target="_blank">Versand &amp; Zahlung</a> und <a href="' + ROOT + 'datenschutz.html#shop" target="_blank">Datenschutz</a>.</p>';
  }

  function renderCart() {
    if (!drawer) return;
    var body = $(".cart-body", drawer), foot = $(".cart-foot", drawer), title = $(".cart-head h2", drawer);
    var lines = cartLines(), t = totals(lines);
    if (view === "review" && review) return renderReview(body, foot, title);
    if (view === "done") return;
    title.textContent = "Warenkorb";
    if (!lines.length) {
      body.innerHTML = '<div class="cart-empty">Ihr Warenkorb ist leer.<br>Entdecken Sie die professionelle Pflege von Hildegard Braukmann.</div>';
      foot.innerHTML = '<a class="cart-btn" style="display:grid;place-items:center;text-decoration:none" href="' + ROOT + 'shop.html">Zum Shop</a>';
      return;
    }
    body.innerHTML = lines.map(function (l) {
      return '<div class="cart-line" data-id="' + esc(l.id) + '"><img src="' + ROOT + esc(l.p.images[0]) + '" alt=""><div><b>' + esc(l.p.title) + '</b><small>' + esc(l.p.size) + ' · ' + eur(l.price) + '</small><div class="qty"><button type="button" data-q="-1" aria-label="Weniger">−</button><span>' + l.qty + '</span><button type="button" data-q="1" aria-label="Mehr">+</button></div></div><div class="lp">' + eur(l.total) + '</div></div>';
    }).join("");
    $$(".cart-line", body).forEach(function (row) {
      $$("[data-q]", row).forEach(function (b) {
        b.onclick = function () {
          var id = row.getAttribute("data-id"), l = readCart().find(function (x) { return x.id === id; }), s = stockOf(byId[id]);
          var next = (l ? l.qty : 0) + Number(b.getAttribute("data-q"));
          if (s != null && next > s) { toast("Nur noch " + s + " Stück verfügbar"); return; }
          setQty(id, next);
        };
      });
    });
    var missing = Math.max(0, t.rules.freeFrom - t.sub);
    foot.innerHTML =
      (missing > 0 ? '<div class="cart-free">Noch <b>' + eur(missing) + '</b> bis zum kostenlosen Versand<i style="--p:' + Math.min(100, t.sub / t.rules.freeFrom * 100) + '%"></i></div>' : '<div class="cart-free">✓ Kostenloser Versand</div>') +
      '<div class="cart-row"><span>Zwischensumme</span><span>' + eur(t.sub) + '</span></div>' +
      '<div class="cart-row"><span>Versand (DHL)</span><span>' + (t.ship ? eur(t.ship) : "kostenlos") + '</span></div>' +
      '<div class="cart-row total"><span>Gesamt</span><span>' + eur(t.total) + '</span></div>' + legalNote() +
      '<div class="cart-checkout"></div>';
    renderCheckout($(".cart-checkout", foot), lines);
  }

  function renderCheckout(box, lines) {
    if (!live) { box.innerHTML = '<button class="cart-btn" disabled>Verfügbarkeit wird geprüft…</button>'; return; }
    if (!live.enabled) {
      var text = "Hallo Lune Beauty, ich möchte gern reservieren:\n" + lines.map(function (l) { return "• " + l.qty + " × " + l.p.title + " " + l.p.size; }).join("\n");
      box.innerHTML = '<p class="cart-legal" style="margin-top:0">Die Online-Bezahlung wird gerade eingerichtet. Reservieren Sie Ihre Produkte einfach per WhatsApp – Abholung im Studio oder Versand nach Absprache.</p>' +
        '<a class="cart-btn" style="display:grid;place-items:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text) + '">Per WhatsApp reservieren</a>';
      return;
    }
    box.innerHTML = '<p class="cart-legal" style="margin-top:0">Sie melden sich bei PayPal an und wählen Ihre Lieferadresse. <b>Danach prüfen Sie Ihre Bestellung hier noch einmal</b> – erst dann wird sie verbindlich.</p><div class="cart-pp" id="cartPayPal"></div>';
    loadPayPal(function (err) {
      if (err || !window.paypal) { box.innerHTML = '<div class="cart-alert">PayPal konnte nicht geladen werden. Bitte Seite neu laden oder Werbeblocker für diese Seite deaktivieren.</div>'; return; }
      window.paypal.Buttons({
        fundingSource: window.paypal.FUNDING.PAYPAL,
        style: { layout: "vertical", color: "black", shape: "pill", label: "paypal", height: 48, tagline: false },
        createOrder: function () {
          return post("/order", { items: readCart() }).then(function (r) {
            if (!r.ok) { if (r.stock) refreshLive(); throw new Error(r.error || "Bestellung konnte nicht angelegt werden."); }
            return r.paypalId;
          });
        },
        onApprove: function (data) { return loadReview(data.orderID); },
        onError: function (e) { showAlert(box, (e && e.message) || "PayPal meldet einen Fehler. Bitte erneut versuchen."); },
      }).render("#cartPayPal");
    });
  }

  function showAlert(box, msg) {
    var a = $(".cart-alert", box); if (!a) { a = document.createElement("div"); a.className = "cart-alert"; box.prepend(a); }
    a.textContent = msg;
  }

  function loadReview(paypalId) {
    return fetch(API + "/order/" + encodeURIComponent(paypalId), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (r) {
      if (!r.ok) throw new Error(r.error || "Bestellung nicht gefunden.");
      review = { paypalId: paypalId, data: r }; view = r.paid ? "done" : "review";
      if (r.paid) return showDone(r.order);
      renderCart();
    }).catch(function (e) { showAlert($(".cart-checkout", drawer) || $(".cart-foot", drawer), e.message); });
  }

  function renderReview(body, foot, title) {
    var r = review.data, o = r.order, a = o.address || {};
    title.textContent = "Bestellung prüfen";
    body.innerHTML = '<div class="cart-review"><h3>Ihre Bestellung</h3>' + o.items.map(function (i) {
      var p = byId[i.id] || { images: [""] };
      return '<div class="cart-line"><img src="' + ROOT + esc(p.images[0]) + '" alt=""><div><b>' + esc(i.title) + '</b><small>' + esc(i.size) + ' · ' + i.qty + ' × ' + eur(i.price) + '</small></div><div class="lp">' + eur(i.total) + '</div></div>';
    }).join("") + '<h3 style="margin-top:18px">Lieferadresse</h3><div class="addr">' + esc(o.name) + "<br>" + esc(a.line1) + (a.line2 ? "<br>" + esc(a.line2) : "") + "<br>" + esc(a.zip) + " " + esc(a.city) + '<br><small>' + esc(o.email) + '</small></div>' +
      '<p class="cart-legal">Zahlungsart: PayPal. Lieferung mit DHL in 1–3 Werktagen. Adresse ändern? Gehen Sie zurück und wählen Sie bei PayPal eine andere Adresse.</p></div>';
    foot.innerHTML = (r.shipsOk === false ? '<div class="cart-alert">Wir versenden derzeit nur innerhalb Deutschlands. Bitte gehen Sie zurück und wählen Sie bei PayPal eine deutsche Lieferadresse.</div>' : "") +
      '<div class="cart-row"><span>Zwischensumme</span><span>' + eur(o.subtotal) + '</span></div>' +
      '<div class="cart-row"><span>Versand (DHL)</span><span>' + (o.shipping ? eur(o.shipping) : "kostenlos") + '</span></div>' +
      '<div class="cart-row total"><span>Gesamt</span><span>' + eur(o.total) + '</span></div>' + legalNote() +
      '<button class="cart-btn" type="button" data-buy ' + (r.shipsOk === false ? "disabled" : "") + '>Zahlungspflichtig bestellen</button>' +
      '<button class="cart-btn light" type="button" data-back>Zurück zum Warenkorb</button>';
    $("[data-back]", foot).onclick = function () { view = "cart"; review = null; renderCart(); };
    var buy = $("[data-buy]", foot);
    buy.onclick = function () {
      buy.disabled = true; buy.textContent = "Zahlung wird abgeschlossen…";
      post("/capture", { paypalId: review.paypalId }).then(function (res) {
        if (res.ok) return showDone(res.order);
        buy.disabled = false; buy.textContent = "Zahlungspflichtig bestellen";
        showAlert(foot, res.error || "Die Zahlung konnte nicht abgeschlossen werden.");
        if (res.retry) { view = "cart"; review = null; setTimeout(renderCart, 2500); }
        refreshLive();
      }).catch(function () { buy.disabled = false; buy.textContent = "Zahlungspflichtig bestellen"; showAlert(foot, "Verbindung unterbrochen. Bitte erneut versuchen – es wird nichts doppelt abgebucht."); });
    };
  }

  function showDone(o) {
    view = "done"; writeCart([]); refreshLive();
    $(".cart-head h2", drawer).textContent = "Vielen Dank!";
    $(".cart-body", drawer).innerHTML = '<div class="cart-done"><div class="ok">✓</div><h3 style="font-family:\'Playfair Display\',serif;font-weight:600;font-size:1.5rem;margin:0 0 8px">Bestellung erhalten</h3><p style="color:#746653;line-height:1.7">Ihre Bestellnummer: <b>' + esc(o.number) + '</b><br>Gesamt: ' + eur(o.total) + ' (bezahlt mit PayPal)<br>Die Bestätigung haben wir an <b>' + esc(o.email) + '</b> gesendet.<br>Wir versenden innerhalb von 1–3 Werktagen mit DHL.</p></div>';
    $(".cart-foot", drawer).innerHTML = '<a class="cart-btn" style="display:grid;place-items:center;text-decoration:none" href="' + ROOT + 'shop.html">Weiter einkaufen</a>';
    try { window.dispatchEvent(new CustomEvent("lune:shop-order", { detail: { total: o.total } })); } catch (_) {}
  }

  /* ---------- network ---------- */
  function post(path, body) {
    return fetch(API + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  var ppLoading = null;
  function loadPayPal(cb) {
    if (window.paypal) return cb();
    if (!ppLoading) {
      ppLoading = new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(live.clientId) + "&currency=EUR&intent=capture&commit=false&locale=de_DE&components=buttons&disable-funding=card,sepa,paylater,venmo";
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    ppLoading.then(function () { cb(); }, function (e) { ppLoading = null; cb(e || new Error("load")); });
  }
  function refreshLive() {
    return fetch(API + "/catalog", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) return;
      live = d; liveById = {}; d.items.forEach(function (i) { liveById[i.id] = i; });
      applyLive(); renderCart();
    }).catch(function () {});
  }

  /* ---------- listing + product page ---------- */
  function applyLive() {
    $$("[data-product]").forEach(function (el) {
      var id = el.getAttribute("data-product"), l = liveById[id]; if (!l) return;
      $$("[data-price]", el).forEach(function (p) { p.textContent = eur(l.price); });
      var btns = $$("[data-add]", el), badge = $(".p-badge", el), stock = $("[data-stock]", el);
      btns.forEach(function (b) { b.disabled = l.stock < 1; });
      if (badge) { badge.hidden = l.stock > 2; badge.textContent = l.stock < 1 ? "Ausverkauft" : "Nur noch " + l.stock; badge.classList.toggle("out", l.stock < 1); }
      if (stock) { stock.textContent = l.stock < 1 ? "Derzeit ausverkauft – gern im Studio nachfragen" : l.stock <= 2 ? "Nur noch " + l.stock + " auf Lager · Versand in 1–3 Werktagen" : "Auf Lager · Versand in 1–3 Werktagen"; stock.classList.toggle("out", l.stock < 1); }
    });
    filter();
  }

  var state = { cat: "Alle", q: "", sort: "empfohlen", concern: "" };
  function filter() {
    var grid = $("#shopGrid"); if (!grid) return;
    var cards = $$(".p-card", grid), shown = 0;
    cards.forEach(function (c) {
      var p = byId[c.getAttribute("data-product")]; if (!p) return;
      var hay = (p.title + " " + p.category + " " + p.concerns.join(" ") + " " + p.skin.join(" ")).toLowerCase();
      var ok = (state.cat === "Alle" || p.category === state.cat) && (!state.concern || p.concerns.indexOf(state.concern) >= 0) && (!state.q || hay.indexOf(state.q) >= 0);
      c.hidden = !ok; if (ok) shown++;
    });
    var sorted = cards.slice().sort(function (a, b) {
      var pa = byId[a.getAttribute("data-product")], pb = byId[b.getAttribute("data-product")];
      if (state.sort === "preis-auf") return priceOf(pa) - priceOf(pb);
      if (state.sort === "preis-ab") return priceOf(pb) - priceOf(pa);
      if (state.sort === "name") return pa.title.localeCompare(pb.title, "de");
      return Number(a.getAttribute("data-order")) - Number(b.getAttribute("data-order"));
    });
    sorted.forEach(function (c) { grid.appendChild(c); });
    var cnt = $("#shopCount"); if (cnt) cnt.textContent = shown + (shown === 1 ? " Produkt" : " Produkte");
  }

  function wireListing() {
    $$("[data-cat]").forEach(function (b) {
      b.onclick = function () { state.cat = b.getAttribute("data-cat"); $$("[data-cat]").forEach(function (x) { x.classList.toggle("on", x === b); }); filter(); };
    });
    var q = $("#shopSearch"); if (q) q.oninput = function () { state.q = q.value.trim().toLowerCase(); filter(); };
    var s = $("#shopSort"); if (s) s.onchange = function () { state.sort = s.value; filter(); };
    var c = $("#shopConcern"); if (c) c.onchange = function () { state.concern = c.value; filter(); };
    var hash = decodeURIComponent((location.hash || "").slice(1));
    if (hash) { var btn = $('[data-cat="' + hash.replace(/"/g, "") + '"]'); if (btn) btn.click(); }
  }

  function wireProduct() {
    var pd = $(".pd[data-product]"); if (!pd) return;
    var qty = 1, out = $("[data-qty]", pd);
    $$("[data-q]", pd).forEach(function (b) { b.onclick = function () { qty = Math.max(1, Math.min(10, qty + Number(b.getAttribute("data-q")))); out.textContent = qty; }; });
    $$("[data-add]", pd).forEach(function (b) { b.onclick = function () { addToCart(pd.getAttribute("data-product"), qty); openCart(); }; });
    $$(".pd-thumbs button", pd).forEach(function (b) {
      b.onclick = function () { $(".pd-main img", pd).src = b.getAttribute("data-src"); $$(".pd-thumbs button", pd).forEach(function (x) { x.classList.toggle("on", x === b); }); };
    });
  }

  function init() {
    buildDrawer(); updateBadge();
    document.addEventListener("click", function (e) {
      var open = e.target.closest("[data-cart-open]"); if (open) { e.preventDefault(); openCart(); return; }
      var add = e.target.closest(".p-card [data-add]"); if (add) { e.preventDefault(); addToCart(add.closest("[data-product]").getAttribute("data-product"), 1); }
    });
    fetch(ROOT + "assets/shop/catalog.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
      catalog = d.items; catalog.forEach(function (p) { byId[p.id] = p; });
      wireListing(); wireProduct(); updateBadge(); renderCart(); refreshLive();
      if (/[?&]warenkorb=1/.test(location.search)) openCart();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
