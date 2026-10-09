// Generates shop.html and produkt/<slug>.html from assets/shop/catalog.json. Run from the site root:
//   node tools/build-shop.cjs
const fs = require("fs");
const path = require("path");
const { SITE, BUSINESS, esc, head, nav, footer } = require("./site-kit.cjs");

const { items } = JSON.parse(fs.readFileSync("assets/shop/catalog.json", "utf8"));
const CATS = ["Reinigung & Tonic", "Peelings & Masken", "Seren & Konzentrate", "Tagespflege", "Nachtpflege", "24h-Pflege", "Augen, Lippen & Hals", "Hände & Füße"];
const CONCERNS = ["Anti-Aging", "Sensible Haut", "Feuchtigkeit", "Unreine Haut & Glow"];
const eur = n => Number(n).toFixed(2).replace(".", ",") + " €";
const ADD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M12 11v5M9.5 13.5h5"/></svg>';
const SHIPPING = { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: "4.95", currency: "EUR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "DE" },
  deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" }, transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" } } };
const RETURNS = { "@type": "MerchantReturnPolicy", applicableCountry: "DE", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 14, returnMethod: "https://schema.org/ReturnByMail", returnFees: "https://schema.org/ReturnFeesCustomerResponsibility" };

const productUrl = p => `produkt/${p.slug}.html`;
const metaDesc = p => `${p.brand} ${p.title} ${p.size} online kaufen bei Lune Beauty Worms: ${(p.description || "").split(/(?<=\.)\s/)[0]} ${eur(p.price)}, Versand in 1–3 Werktagen.`.replace(/\s+/g, " ").slice(0, 158);

function card(p, i, up) {
  return `<article class="p-card" data-product="${p.id}" data-order="${i}">
      <span class="p-badge" hidden></span>
      <a class="p-img" href="${up}${productUrl(p)}"><img src="${up}${p.images[0]}" alt="${esc(p.brand + " " + p.title + " " + p.size)}" loading="lazy" width="800" height="800"></a>
      <div class="p-body">
        <span class="p-line">${esc(p.line)}</span>
        <h3 class="p-name"><a href="${up}${productUrl(p)}">${esc(p.name)}</a></h3>
        <span class="p-size">${esc(p.size)}</span>
        <div class="p-foot">
          <div class="p-price"><b data-price>${eur(p.price)}</b><small>${esc(p.unitPrice)}</small></div>
          <button class="p-add" type="button" data-add aria-label="${esc(p.title)} in den Warenkorb">${ADD_ICON}</button>
        </div>
      </div>
    </article>`;
}

/* ---------- shop.html ---------- */
const FAQ = [
  ["Sind das Originalprodukte von Hildegard Braukmann?", "Ja. Wir beziehen alle Produkte direkt vom Hersteller Hildegard Braukmann und arbeiten auch in unseren Behandlungen im Studio in Worms mit dieser Pflege."],
  ["Wie schnell wird geliefert und was kostet der Versand?", "Wir versenden innerhalb Deutschlands mit DHL in 1–3 Werktagen. Der Versand kostet 4,95 €, ab einem Bestellwert von 50 € ist er kostenlos."],
  ["Wie kann ich bezahlen?", "Die Zahlung erfolgt ausschließlich und sicher über PayPal. Sie wählen Ihre Lieferadresse bei PayPal und prüfen Ihre Bestellung anschließend noch einmal bei uns, bevor sie verbindlich wird."],
  ["Welches Produkt passt zu meiner Haut?", "Wir beraten Sie gern persönlich im Studio oder starten Sie mit dem kostenlosen Lune Skin Check. Nach jeder Gesichtsbehandlung erhalten Sie außerdem eine Pflegeempfehlung."],
  ["Kann ich Produkte auch im Studio abholen?", "Ja – schreiben Sie uns kurz per WhatsApp (0179 1544002), wir legen Ihre Produkte zurück. Sie bezahlen dann bei Abholung in der Mittelstraße 1."],
];
const hero = items.filter(p => ["07738", "07930", "07939", "07710"].includes(p.sku));
const shopLd = [
  { "@type": "CollectionPage", "@id": SITE + "shop.html#page", name: "Hildegard Braukmann Shop – Lune Beauty Worms", url: SITE + "shop.html", isPartOf: { "@id": SITE + "#website" }, about: { "@type": "Brand", name: "Hildegard Braukmann" },
    mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + productUrl(p), name: `${p.brand} ${p.title}` })) } },
  { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: "Shop", item: SITE + "shop.html" }] },
  { "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
];
const shopHtml = head({
  title: "Hildegard Braukmann online kaufen | Lune Beauty Shop Worms",
  desc: `Hildegard Braukmann Institutspflege online kaufen: ${items.length} Originalprodukte – Pro Lift, Couperose Relax, Hyaluron, Reinigung & Masken. Versand in 1–3 Werktagen, ab 50 € versandkostenfrei.`,
  path: "shop.html", ogTitle: "Hildegard Braukmann Shop – Lune Beauty Worms", ld: shopLd,
}).replace("<html lang=\"de\">", "<html lang=\"de\" data-root=\"\">") + `
${nav({ active: "shop", cart: true })}

<header class="lx-hero">
  <div class="lx-crumb"><a href="index.html">Home</a> · Shop</div>
  <div class="lx-hero-inner">
    <div>
      <span class="lx-kicker">Lune Beauty Shop · Hildegard Braukmann</span>
      <h1>Professionelle Pflege – <em>ausgewählt</em> von Ihrer Kosmetikerin.</h1>
      <p class="lx-lead">Die Institutspflege von Hildegard Braukmann, mit der wir auch in unseren Behandlungen arbeiten – jetzt für Ihre Routine zu Hause. Originalware, sorgfältig verpackt aus unserem Studio in Worms.</p>
      <div class="lx-actions">
        <a href="#sortiment" class="service-btn primary">Sortiment entdecken →</a>
        <a href="skin-ai.html" class="service-btn secondary">Welche Pflege passt zu mir?</a>
      </div>
      <ul class="lx-trust"><li>Original Braukmann</li><li>DHL 1–3 Werktage</li><li>Ab 50 € versandkostenfrei</li><li>Sicher mit PayPal</li></ul>
    </div>
    <div class="lx-collage" aria-hidden="true">
      ${hero.map((p, i) => `<a href="${productUrl(p)}" class="c${i}" tabindex="-1"><img src="${p.images[0]}" alt="" width="800" height="800"${i ? ' loading="lazy"' : ""}></a>`).join("\n      ")}
    </div>
  </div>
</header>

<main class="shop-wrap" id="sortiment">
  <div class="shop-bar">
    <div class="shop-chips" role="tablist" aria-label="Kategorien">
      <button class="shop-chip on" data-cat="Alle">Alle</button>
      ${CATS.filter(c => items.some(p => p.category === c)).map(c => `<button class="shop-chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("\n      ")}
    </div>
    <div class="shop-tools">
      <select id="shopConcern" aria-label="Hautbedürfnis"><option value="">Hautbedürfnis</option>${CONCERNS.map(c => `<option>${c}</option>`).join("")}</select>
      <select id="shopSort" aria-label="Sortierung"><option value="empfohlen">Empfohlen</option><option value="preis-auf">Preis aufsteigend</option><option value="preis-ab">Preis absteigend</option><option value="name">Name A–Z</option></select>
      <input id="shopSearch" type="search" placeholder="Suchen…" aria-label="Produkte suchen">
    </div>
  </div>
  <p class="shop-count" id="shopCount">${items.length} Produkte</p>
  <div class="shop-grid" id="shopGrid">
    ${items.map((p, i) => card(p, i, "")).join("\n    ")}
  </div>
  <p class="shop-note">Alle Preise in Euro. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Zzgl. <a class="lx-link" href="versand-zahlung.html">Versandkosten</a> (4,95 €, ab 50 € kostenlos).</p>

  <div class="trust-row">
    <div class="trust-item"><b>Originalware</b><span>Direkt vom Hersteller Hildegard Braukmann</span></div>
    <div class="trust-item"><b>Schneller Versand</b><span>Mit DHL in 1–3 Werktagen</span></div>
    <div class="trust-item"><b>Ab 50 € gratis</b><span>Sonst 4,95 € Versand</span></div>
    <div class="trust-item"><b>PayPal</b><span>Sicher bezahlen, Bestellung vorab prüfen</span></div>
  </div>

  <section class="section-smart" style="width:100%">
    <div class="cta-box">
      <h2>Unsicher, was Ihre Haut braucht?</h2>
      <p>Lassen Sie sich persönlich beraten – im Studio, nach Ihrer Behandlung oder mit dem kostenlosen Lune Skin Check als erste Orientierung.</p>
      <div class="service-actions">
        <a href="skin-ai.html" class="service-btn primary">Skin Check starten →</a>
        <a href="index.html#booking" class="service-btn secondary">Beratungstermin anfragen</a>
      </div>
    </div>
  </section>

  <section class="section-smart" style="width:100%">
    <div class="faq-head"><h2>Häufige Fragen zum Shop</h2></div>
    <div class="faq-grid">
${FAQ.map(([q, a]) => `      <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
    </div>
  </section>
</main>

${footer({ scripts: '<script src="assets/shop/shop.js?v=1" defer></script>' })}`;
fs.writeFileSync("shop.html", shopHtml);

/* ---------- produkt/<slug>.html ---------- */
fs.mkdirSync("produkt", { recursive: true });
for (const f of fs.readdirSync("produkt")) if (f.endsWith(".html")) fs.unlinkSync(path.join("produkt", f));
for (const p of items) {
  const url = SITE + productUrl(p);
  const related = items.filter(x => x.id !== p.id && (x.category === p.category || x.concerns.some(c => p.concerns.includes(c)))).slice(0, 4);
  const ld = [
    { "@type": "Product", "@id": url + "#product", name: `${p.brand} ${p.title} ${p.size}`, image: p.images.map(i => SITE + i), description: p.description, sku: p.sku, gtin13: p.ean || undefined,
      brand: { "@type": "Brand", name: p.brand }, category: p.category,
      offers: { "@type": "Offer", url, price: p.price.toFixed(2), priceCurrency: "EUR", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition",
        seller: BUSINESS, shippingDetails: SHIPPING, hasMerchantReturnPolicy: RETURNS } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: "Shop", item: SITE + "shop.html" }, { "@type": "ListItem", position: 3, name: p.category, item: SITE + "shop.html#" + encodeURIComponent(p.category) }, { "@type": "ListItem", position: 4, name: p.title, item: url }] },
  ];
  const html = head({
    title: `Braukmann ${p.title} ${p.size} | Lune Beauty`,
    desc: metaDesc(p), path: productUrl(p), ogTitle: `${p.brand} ${p.title}`, image: SITE + p.images[0], ld, up: "../",
  }).replace("<html lang=\"de\">", "<html lang=\"de\" data-root=\"../\">") + `
${nav({ up: "../", active: "shop", cart: true })}

<main>
  <div class="pd" data-product="${p.id}">
    <div class="pd-gallery">
      <div class="pd-main"><img src="../${p.images[0]}" alt="${esc(p.brand + " " + p.title + " " + p.size)}" width="800" height="800"></div>
      ${p.images.length > 1 ? `<div class="pd-thumbs">${p.images.map((im, i) => `<button type="button" data-src="../${im}" class="${i ? "" : "on"}" aria-label="Bild ${i + 1}"><img src="../${im}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="pd-info">
      <div class="lx-crumb" style="width:auto;margin:0 0 10px"><a href="../index.html">Home</a> · <a href="../shop.html">Shop</a> · <a href="../shop.html#${encodeURIComponent(p.category)}">${esc(p.category)}</a></div>
      <span class="p-line">${esc(p.brand)} · ${esc(p.line)}</span>
      <h1>${esc(p.name)}</h1>
      <span class="pd-size">${esc(p.size)}${p.ean ? ` · EAN ${p.ean}` : ""}</span>
      <div class="pd-price"><span data-price>${eur(p.price)}</span><small>${esc(p.unitPrice)} · gemäß § 19 UStG ohne USt. · zzgl. <a class="lx-link" href="../versand-zahlung.html">Versand</a></small></div>
      <span class="pd-stock" data-stock>Auf Lager · Versand in 1–3 Werktagen</span>
      <div class="pd-buy">
        <div class="qty"><button type="button" data-q="-1" aria-label="Weniger">−</button><span data-qty>1</span><button type="button" data-q="1" aria-label="Mehr">+</button></div>
        <button class="service-btn primary" type="button" data-add>In den Warenkorb</button>
      </div>
      <div class="pd-points">
        <span>✓ Originalware von Hildegard Braukmann – auch in unseren Behandlungen verwendet</span>
        <span>✓ Versand mit DHL in 1–3 Werktagen · ab 50 € versandkostenfrei</span>
        <span>✓ Sicher bezahlen mit PayPal</span>
      </div>
      ${p.description ? `<div class="pd-sec"><h2>Beschreibung</h2><p>${esc(p.description)}</p></div>` : ""}
      ${p.application ? `<div class="pd-sec"><h2>Anwendung</h2><p>${esc(p.application)}</p></div>` : ""}
      ${p.skin.length ? `<div class="pd-sec"><h2>Geeignet für</h2><div class="pd-skin">${p.skin.map(s => `<span>${esc(s)}</span>`).join("")}</div></div>` : ""}
      <div class="pd-advice"><b style="font-family:'Playfair Display',serif;font-size:1.15rem">Persönliche Pflegeberatung in Worms</b>
        <p>Sie möchten wissen, ob ${esc(p.name)} zu Ihrer Haut passt? Wir beraten Sie gern im Studio oder nach Ihrer Gesichtsbehandlung.</p>
        <a href="../skin-ai.html">Kostenloser Skin Check →</a> &nbsp; <a href="../index.html#booking">Termin anfragen →</a></div>
    </div>
  </div>

  ${related.length ? `<section class="section-smart">
    <div class="process-head"><h2>Passt gut dazu</h2></div>
    <div class="shop-grid">
    ${related.map((r, i) => card(r, i, "../")).join("\n    ")}
    </div>
  </section>` : ""}
</main>

${footer({ up: "../", scripts: '<script src="../assets/shop/shop.js?v=1" defer></script>' })}`;
  fs.writeFileSync(productUrl(p), html);
}
console.log("shop.html +", items.length, "product pages");
