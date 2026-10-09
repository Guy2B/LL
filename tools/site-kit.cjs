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
  ["akne-behandlung-worms.html", "Aknebehandlung Worms"], ["hydro-boost-worms.html", "Hydro Boost Worms"],
  ["radiofrequenz-worms.html", "Radiofrequenz Worms"], ["led-therapie-worms.html", "LED-Therapie Worms"], ["manikuere-pedikuere-worms.html", "Maniküre &amp; Fußpflege Worms"],
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
  <link rel="stylesheet" href="${up}assets/css/lune-premium.css?v=3">
  <link rel="stylesheet" href="${up}assets/css/lune-pages.css?v=2">
  <link rel="stylesheet" href="${up}assets/css/lune-header.css?v=2">
  ${extra}
${ld.map(x => `  <script type="application/ld+json">\n${JSON.stringify(Object.assign({ "@context": "https://schema.org" }, x), null, 1)}\n  </script>`).join("\n")}
</head>
<body>`;
}

// Site header. Same markup on every page; lune-header.js marks the current page (aria-current).
// up: path prefix to the site root; home: true on index.html (anchors stay on the page);
// cart: shop cart button; theme: dark-mode toggle (only on pages with dark-mode styles).
const CARET = '<svg class="lx-caret" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const THEME_BTN = `<button type="button" class="lune-theme-toggle" id="luneThemeToggle" aria-label="Dunkelmodus aktivieren" aria-pressed="false" title="Hell-/Dunkelmodus">
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>
      </button>`;
const HEADER_ASSETS = up => ({
  css: `<link rel="stylesheet" href="${up}assets/css/lune-header.css?v=2">`,
  js: `<script src="${up}assets/js/lune-header.js?v=2" defer></script>`,
});

const MENU_TREAT = [
  ["Gesicht", [
    ["gesichtsbehandlung-worms.html", "Gesichtsbehandlung", "Individuelle Pflege &amp; Glow"],
    ["aquafacial-worms.html", "Aquafacial", "Hydra Glow Facial"],
    ["hydro-boost-worms.html", "Hydro Boost", "Intensive Feuchtigkeit"],
    ["anti-aging-worms.html", "Anti-Aging", "Lifting, Wirkstoffe &amp; LED"],
    ["akne-behandlung-worms.html", "Unreine Haut", "Kosmetische Aknebehandlung"],
  ]],
  ["Hände, Füße &amp; Augen", [
    ["manikuere-pedikuere-worms.html", "Maniküre &amp; Fußpflege", "Gepflegte Hände &amp; Füße"],
    ["augenpflege-worms.html", "Augenpflege", "Wimpern &amp; Brauen"],
  ]],
  ["Technologien", [
    ["radiofrequenz-worms.html", "Radiofrequenz", "Straffendes Hautgefühl"],
    ["led-therapie-worms.html", "LED-Therapie", "Lichtpflege für die Haut"],
  ]],
  ["Beratung", [
    ["skin-ai.html", "Lune Skin Check", "Kostenlose digitale Hautanalyse"],
  ]],
];
const MENU_STUDIO = [
  ["inhaberin.html", "Die Inhaberin", "Ihre Kosmetikerin"],
  ["studio.html", "Über das Studio", "Räume &amp; Atmosphäre"],
  ["kosmetik-ausbildung-worms.html", "Ausbildung", "Lune Beauty Academy"],
  ["index.html#instagram", "Inhalte", "Reels &amp; Pflege-Inspiration"],
  ["index.html#contact", "Kontakt &amp; Anfahrt", "Mittelstraße 1, Worms"],
];

function header({ up = "", home = false, cart = false, theme = false } = {}) {
  // on the home page, links to its own sections stay anchors (no reload)
  const href = h => home && h.startsWith("index.html#") ? h.slice(10) : up + h;
  const item = ([h, title, sub]) => `<a href="${href(h)}"><b>${title}</b><span>${sub}</span></a>`;
  const mItem = ([h, title]) => `<a href="${href(h)}">${title}</a>`;
  const groups = MENU_TREAT.map(([t, items]) => `<div class="lx-grp"><span class="lx-grp-t">${t}</span>${items.map(item).join("")}</div>`);
  const cartBtn = cart ? `<button class="nav-cart" type="button" data-cart-open aria-label="Warenkorb öffnen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><em data-cart-count></em></button>` : "";
  return `<header class="lx-header">
  <div class="lx-h-inner">
    <a class="lx-brand" href="${home ? "#hero" : up + "index.html"}" aria-label="Lune Beauty – Startseite">
      <img src="${up}assets/img/logo-header.png" alt="Lune Beauty" width="163" height="140" decoding="async">
    </a>
    <nav class="lx-menu" aria-label="Hauptnavigation">
      <ul>
        <li class="has-drop">
          <button class="lx-top" type="button" aria-expanded="false" aria-controls="lxDropTreat">Behandlungen ${CARET}</button>
          <div class="lx-drop wide" id="lxDropTreat">
            ${groups[0]}
            <div>${groups[1]}${groups[2]}${groups[3]}</div>
            <div class="lx-all"><a href="${href("index.html#services")}">Alle Behandlungen ansehen <span aria-hidden="true">→</span></a></div>
          </div>
        </li>
        <li><a class="lx-top" href="${up}preise.html">Preise</a></li>
        <li><a class="lx-top" href="${up}shop.html">Shop</a></li>
        <li class="has-drop">
          <button class="lx-top" type="button" aria-expanded="false" aria-controls="lxDropStudio">Studio ${CARET}</button>
          <div class="lx-drop" id="lxDropStudio">
            ${MENU_STUDIO.map(item).join("\n            ")}
          </div>
        </li>
      </ul>
    </nav>
    <div class="lx-actions">
      ${cartBtn}
      <a class="lx-cta" href="${href("index.html#booking")}">Termin anfragen</a>
      ${theme ? THEME_BTN : ""}
      <button class="lx-icon-btn lx-burger" type="button" aria-expanded="false" aria-controls="lxSheet" aria-label="Menü öffnen"><span></span><span></span><span></span></button>
    </div>
  </div>
  <div class="lx-sheet" id="lxSheet" aria-hidden="true">
    <div class="lx-sheet-scrim"></div>
    <nav class="lx-sheet-panel" aria-label="Mobile Navigation">
      <ul class="lx-m-list">
        <li><button class="lx-m-acc" type="button" aria-expanded="false">Behandlungen ${CARET}</button>
          <div class="lx-m-sub"><div>${MENU_TREAT.map(([t, items]) => `<span class="lx-m-t">${t}</span>${items.map(mItem).join("")}`).join("")}${mItem(["index.html#services", "Alle Behandlungen"])}</div></div></li>
        <li><a class="lx-m-link" href="${up}preise.html">Preise</a></li>
        <li><a class="lx-m-link" href="${up}shop.html">Shop</a></li>
        <li><button class="lx-m-acc" type="button" aria-expanded="false">Studio ${CARET}</button>
          <div class="lx-m-sub"><div>${MENU_STUDIO.map(mItem).join("")}</div></div></li>
      </ul>
      <a class="lx-m-cta" href="${href("index.html#booking")}">Termin anfragen</a>
      <div class="lx-m-contact"><a href="tel:+491791544002">0179 1544002</a><a href="https://wa.me/491791544002" target="_blank" rel="noopener">WhatsApp</a></div>
    </nav>
  </div>
</header>
<div class="lx-header-space" aria-hidden="true"></div>`;
}

// kept for the generators: nav({ up, cart, home, theme })
function nav(opts = {}) { return header(opts); }

function footer({ up = "", scripts = "" }) {
  const links = (arr, label, cls) => `<nav class="${cls}" aria-label="${label}">\n    ${arr.map(([h, l]) => `<a href="${up}${h}">${l}</a>`).join("\n    <span>·</span>\n    ")}\n  </nav>`;
  return `<footer class="footer">
  <p>© <span id="year"></span> Lune Beauty · Kosmetikstudio in Worms · Mittelstraße 1, 67547 Worms · <a href="tel:+491791544002" style="color:inherit">0179 1544002</a></p>
  ${links(LEGAL, "Rechtliches", "footer-links")}
  ${links(LOCAL, "Lokale Seiten", "footer-local-links")}
</footer>
<script src="${up}assets/js/lune-header.js?v=2" defer></script>
<script>document.getElementById("year").textContent = new Date().getFullYear();</script>
${scripts}
<script src="${up}assets/js/lune-stats.js" defer></script>
</body>
</html>
`;
}

module.exports = { SITE, BUSINESS, LOCAL, LEGAL, esc, head, nav, header, footer, HEADER_ASSETS };
