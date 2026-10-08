// Shared head / navigation / footer for the generated pages (build-pages.cjs, build-shop.cjs).
// `up` is the path prefix back to the site root: "" for root pages, "../" for /produkt/ pages.
const SITE = "https://www.lunebeauty.de/";

const BUSINESS = {
  "@type": "BeautySalon", "@id": SITE + "#salon", name: "Lune Beauty", url: SITE, telephone: "+49 179 1544002",
  image: SITE + "assets/img/og-cover.webp", priceRange: "€€",
  address: { "@type": "PostalAddress", streetAddress: "Mittelstraße 1", addressLocality: "Worms", postalCode: "67547", addressCountry: "DE" },
};

const LOCAL = [
  ["studio.html", "Kosmetikstudio Worms"], ["gesichtsbehandlung-worms.html", "Gesichtsbehandlung Worms"],
  ["aquafacial-worms.html", "Aquafacial Worms"], ["anti-aging-worms.html", "Anti-Aging Worms"],
  ["akne-behandlung-worms.html", "Aknebehandlung Worms"], ["manikuere-pedikuere-worms.html", "Maniküre &amp; Fußpflege Worms"],
  ["augenpflege-worms.html", "Augenpflege Worms"], ["preise.html", "Preise"], ["shop.html", "Braukmann Shop"],
  ["kosmetik-ausbildung-worms.html", "Kosmetik-Ausbildung Worms"],
];
const LEGAL = [["impressum.html", "Impressum"], ["agb.html", "AGB"], ["datenschutz.html", "Datenschutz"], ["versand-zahlung.html", "Versand &amp; Zahlung"], ["widerruf.html", "Widerruf"]];

const esc = s => String(s == null ? "" : s).replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function head({ title, desc, path, ogTitle, image, ld = [], up = "", noindex = false, extra = "" }) {
  const url = SITE + path;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  ${noindex ? '<meta name="robots" content="noindex, follow" />' : ""}
  <meta property="og:title" content="${esc(ogTitle || title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${image || SITE + "assets/img/og-cover.webp"}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="de_DE" />
  <link rel="icon" href="${up}favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" href="${up}apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${up}assets/css/lune-premium.css?v=2">
  <link rel="stylesheet" href="${up}assets/css/lune-pages.css?v=1">
  ${extra}
${ld.map(x => `  <script type="application/ld+json">\n${JSON.stringify(Object.assign({ "@context": "https://schema.org" }, x), null, 1)}\n  </script>`).join("\n")}
</head>
<body>`;
}

const CART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>';

function nav({ up = "", active = "", cart = false }) {
  const item = (href, label, key) => `<li><a href="${up}${href}"${active === key ? ' class="active" aria-current="page"' : ""}>${label}</a></li>`;
  return `<nav class="top-nav">
  <div class="nav-inner">
    <a href="${up}index.html#hero" aria-label="Lune Beauty Startseite">
      <img src="${up}assets/img/logo.png" class="brand-logo" alt="Lune Beauty" />
    </a>
    <ul class="nav-links">
      ${item("index.html#services", "Behandlungen", "services")}
      ${item("preise.html", "Preise", "preise")}
      ${item("shop.html", "Shop", "shop")}
      ${item("kosmetik-ausbildung-worms.html", "Ausbildung", "ausbildung")}
      ${item("skin-ai.html", "Skin Check", "skin")}
      ${item("studio.html", "Studio", "studio")}
      ${item("index.html#booking", "Termin anfragen", "booking")}
    </ul>
    ${cart ? `<button class="nav-cart" type="button" data-cart-open aria-label="Warenkorb öffnen">${CART_ICON}<em data-cart-count></em></button>` : ""}
    <button class="nav-toggle" aria-label="Navigation öffnen">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="nav-divider"></div>`;
}

function footer({ up = "", scripts = "" }) {
  const links = (arr, label, cls) => `<nav class="${cls}" aria-label="${label}">\n    ${arr.map(([h, l]) => `<a href="${up}${h}">${l}</a>`).join("\n    <span>·</span>\n    ")}\n  </nav>`;
  return `<footer class="footer">
  <p>© <span id="year"></span> Lune Beauty · Kosmetikstudio in Worms · Mittelstraße 1, 67547 Worms · <a href="tel:+491791544002" style="color:inherit">0179 1544002</a></p>
  ${links(LEGAL, "Rechtliches", "footer-links")}
  ${links(LOCAL, "Lokale Seiten", "footer-local-links")}
</footer>
<script src="${up}assets/js/header-scroll.js"></script>
<script src="${up}assets/js/nav-mobile.js"></script>
<script>document.getElementById("year").textContent = new Date().getFullYear();</script>
${scripts}
<script src="${up}assets/js/lune-stats.js" defer></script>
</body>
</html>
`;
}

module.exports = { SITE, BUSINESS, LOCAL, LEGAL, esc, head, nav, footer };
