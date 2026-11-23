// Generates the "Hautwissen" articles (skin care advice). Run from the site root:
//   node tools/build-ratgeber.cjs
const fs = require("fs");
const { SITE, BUSINESS, esc, head, header, footer } = require("./site-kit.cjs");

const bookHref = svc => `index.html?service=${encodeURIComponent(svc)}#booking`;
const product = (file, name, price, img, why) => `      <a class="hw-prod" href="produkt/${file}.html">
        <img src="assets/shop/img/${img}" alt="${esc(name)}" width="160" height="160" loading="lazy" decoding="async">
        <span><b>${name}</b><em>${why}</em><strong>${price}</strong></span>
      </a>`;

const A = {
  file: "hautpflege-winter-worms.html",
  title: "Hautpflege im Winter: Tipps Ihrer Kosmetikerin | Lune Beauty Worms",
  desc: "Warum die Haut im Winter spannt und wie Sie sie richtig pflegen: Winterroutine, häufige Fehler und Produkttipps von Lune Beauty, Kosmetikstudio in Worms.",
  h1: "Hautpflege im Winter: <em>Was Ihre Haut jetzt braucht</em>",
  lead: "Kälte draußen, Heizungsluft drinnen: Im Winter verliert die Haut schneller Feuchtigkeit. Hier erklären wir, was dabei passiert und wie Sie Ihre Pflege anpassen.",
  published: "2026-11-24",
};

const ld = [
  { "@type": "Article", headline: "Hautpflege im Winter: Was Ihre Haut jetzt braucht", description: A.desc, datePublished: A.published, dateModified: A.published,
    image: SITE + "assets/newsletter/winter.jpg", author: { "@type": "Organization", name: "Lune Beauty" }, publisher: BUSINESS, mainEntityOfPage: SITE + A.file },
  { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: "Hautwissen: Hautpflege im Winter", item: SITE + A.file }] },
  { "@type": "FAQPage", mainEntity: [
    ["Brauche ich im Winter Sonnenschutz?", "Ja. UV-A-Strahlen sind auch bei grauem Himmel da, und Schnee reflektiert das Licht zusätzlich. Eine Tagespflege mit Lichtschutz oder ein leichter Sonnenschutz am Morgen schützt vor vorzeitiger Hautalterung und Pigmentflecken."],
    ["Wie oft sollte ich im Winter ein Peeling machen?", "Lieber seltener und sanfter: höchstens einmal pro Woche, bei empfindlicher oder gereizter Haut auch seltener. Die Hautbarriere braucht im Winter Schonung."],
    ["Braucht auch fettige Haut im Winter mehr Pflege?", "Oft ja. Auch ölige Haut kann im Winter Feuchtigkeit verlieren und gleichzeitig glänzen. Dann hilft ein Feuchtigkeitsserum unter einer leichten Creme statt einer sehr reichhaltigen Pflege. Wir beraten Sie gern persönlich."],
  ].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
];

const css = `<style>
  .hw-prose{max-width:760px;margin:0 auto}
  .hw-prose p,.hw-prose li{font-size:1.04rem;line-height:1.8}
  .hw-prose h2{margin-top:0}
  .hw-signs{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:18px 0 0;padding:0;list-style:none}
  .hw-signs li{background:#fbf6ee;border:1px solid rgba(195,160,99,.3);border-radius:16px;padding:14px 16px;font-size:.98rem;line-height:1.5}
  .hw-signs b{display:block;margin-bottom:2px}
  .hw-dont{margin:14px 0 0;padding:0;list-style:none}
  .hw-dont li{padding:10px 0 10px 30px;border-bottom:1px solid rgba(195,160,99,.22);position:relative}
  .hw-dont li::before{content:"✕";position:absolute;left:4px;top:10px;color:#b83227;font-weight:700}
  .hw-prods{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:18px}
  .hw-prod{display:flex;gap:12px;align-items:center;padding:12px;border:1px solid rgba(195,160,99,.35);border-radius:18px;background:#fff;color:inherit;text-decoration:none}
  .hw-prod:hover{border-color:#c3a063}
  .hw-prod img{width:76px;height:76px;object-fit:contain;flex:none}
  .hw-prod b{display:block;font-size:.95rem;line-height:1.3}
  .hw-prod em{display:block;font-style:normal;font-size:.86rem;opacity:.75;margin:3px 0}
  .hw-prod strong{font-size:.95rem}
  .hw-note{font-size:.88rem;opacity:.7;margin-top:18px}
</style>`;

const html = head({ title: A.title, desc: A.desc, path: A.file, ogTitle: "Hautpflege im Winter: Tipps Ihrer Kosmetikerin", image: SITE + "assets/newsletter/winter.jpg", imageAlt: "Winterpflege für Ihr Gesicht mit Hildegard Braukmann", ld, extra: css }) + `
${header({})}

<header class="lx-hero">
  <div class="lx-crumb"><a href="index.html">Home</a> · Hautwissen</div>
  <div class="lx-hero-inner">
    <div>
      <span class="lx-kicker">Hautwissen · Winter</span>
      <h1>${A.h1}</h1>
      <p class="lx-lead">${A.lead}</p>
      <div class="lx-actions">
        <a href="${bookHref("Hydro Boost Gesicht")}" class="service-btn primary">Winterbehandlung anfragen →</a>
        <a href="#routine" class="service-btn secondary">Zur Winterroutine</a>
      </div>
      <ul class="lx-trust"><li>Von Ihrer Kosmetikerin in Worms</li><li>Mit Hildegard Braukmann</li><li>5 Minuten Lesezeit</li></ul>
    </div>
    <figure class="lx-photo">
      <img src="assets/img/lune/hero-hydro-boost.webp" alt="Feuchtigkeitsbehandlung im Winter bei Lune Beauty in Worms" width="900" height="1125" fetchpriority="high">
      <figcaption><b>Im Studio</b>Hydro Boost für winterlich trockene Haut</figcaption>
    </figure>
  </div>
</header>

<main>
  <section class="section-smart">
    <div class="smart-grid single-col">
      <article class="smart-card hw-prose">
        <small>Was im Winter passiert</small>
        <h2>Ihre Haut hat eine Schutzmauer, und der Winter setzt ihr zu.</h2>
        <p>Die oberste Hautschicht funktioniert wie eine Mauer: Die Hautzellen sind die Ziegel, dazwischen liegt ein „Mörtel“ aus Lipiden, also hauteigenen Fetten wie Ceramiden. Diese Barriere hält Feuchtigkeit in der Haut und Reize draußen.</p>
        <p>Im Winter wird diese Mauer gleich von zwei Seiten belastet. Draußen ist die Luft kalt und trocken, und die Talgdrüsen arbeiten bei Kälte langsamer, die Haut bildet also weniger eigenes Fett. Drinnen trocknet die Heizungsluft die Haut zusätzlich aus. Der Mörtel wird dünner, die Haut verliert mehr Feuchtigkeit und reagiert empfindlicher.</p>
        <ul class="hw-signs">
          <li><b>Spannen</b>vor allem nach dem Waschen</li>
          <li><b>Schüppchen</b>an Wangen, Nase oder Stirn</li>
          <li><b>Rötungen</b>und schnellere Reizbarkeit</li>
          <li><b>Fahler Teint</b>die Haut wirkt müde</li>
          <li><b>Trockenheitsfältchen</b>feine Linien, die nach dem Eincremen weicher werden</li>
        </ul>
      </article>
    </div>
  </section>

  <section class="section-smart" id="routine">
    <div class="process-head">
      <h2>Ihre Winterroutine in vier Schritten</h2>
      <p>Wenig Aufwand, große Wirkung: Pflegen Sie die Barriere, statt sie zu strapazieren.</p>
    </div>
    <div class="process-grid">
      <article class="process-card">
        <small>01</small>
        <h3>Sanft reinigen</h3>
        <p>Lauwarmes statt heißes Wasser und eine milde Reinigungsmilch statt stark schäumender Produkte. Abends gründlich, morgens reicht oft Wasser oder ein mildes Tonic ohne Alkohol.</p>
      </article>
      <article class="process-card">
        <small>02</small>
        <h3>Feuchtigkeit schenken</h3>
        <p>Ein Serum mit Hyaluron oder Ceramiden auf die noch leicht feuchte Haut. So bindet es die Feuchtigkeit besser.</p>
      </article>
      <article class="process-card">
        <small>03</small>
        <h3>Schützen</h3>
        <p>Eine reichhaltigere Creme mit Lipiden legt sich wie ein Schutzfilm über die Haut. Morgens zusätzlich Lichtschutz, auch bei grauem Himmel.</p>
      </article>
      <article class="process-card">
        <small>04</small>
        <h3>Verwöhnen</h3>
        <p>Ein- bis zweimal pro Woche eine pflegende Creme-Maske. Und die oft vergessenen Stellen: Lippen, Augenpartie und Hände extra pflegen.</p>
      </article>
    </div>
  </section>

  <section class="section-smart">
    <div class="smart-grid single-col">
      <article class="smart-card hw-prose">
        <small>Besser vermeiden</small>
        <h2>Die häufigsten Winterfehler</h2>
        <ul class="hw-dont">
          <li><b>Heiß duschen und heiß waschen:</b> Heißes Wasser löst die Hautlipide zusätzlich.</li>
          <li><b>Zu viel peelen:</b> Im Winter höchstens einmal pro Woche und sanft, die Barriere braucht Schonung.</li>
          <li><b>Alkoholhaltige Gesichtswasser:</b> Sie trocknen aus und können brennen.</li>
          <li><b>Sonnenschutz vergessen:</b> UV-A-Strahlen sind auch im Winter da, Schnee verstärkt sie.</li>
          <li><b>Lippen befeuchten:</b> Ablecken trocknet sie noch mehr aus. Besser: ein Lippenbalsam, tagsüber mit Lichtschutz.</li>
        </ul>
        <p class="hw-note">Hinweis: Diese Tipps ersetzen keine ärztliche Beratung. Bei anhaltenden Rötungen, Juckreiz oder Ekzemen wenden Sie sich bitte an Ihre Hautärztin oder Ihren Hautarzt.</p>
      </article>
    </div>
  </section>

  <section class="section-smart">
    <div class="smart-grid single-col">
      <article class="smart-card hw-prose">
        <small>Unsere Empfehlungen</small>
        <h2>Winterpflege von Hildegard Braukmann</h2>
        <p>Diese Produkte verwenden wir auch im Studio. Welche zu Ihrer Haut passen, besprechen wir gern bei Ihrem nächsten Besuch.</p>
        <div class="hw-prods">
${product("braukmann-institute-reinigungs-milch-sanft-200-ml", "Institute Reinigungs Milch sanft", "21,00 €", "07710-1.webp", "Milde Reinigung, die nicht austrocknet")}
${product("braukmann-institute-high-multi-ceramid-serum-30-ml", "Institute High Multi Ceramid Serum", "51,00 €", "07728-1.webp", "Stärkt die Hautbarriere mit Ceramiden")}
${product("braukmann-institute-aktivierende-tages-creme-rich-50-ml", "Institute Aktivierende Tages Creme rich", "30,50 €", "07721-1.webp", "Reichhaltige Tagespflege für die kalten Monate")}
${product("braukmann-institute-rich-und-pure-creme-maske-50-ml", "Institute Rich &amp; Pure Creme Maske", "28,00 €", "07750-1.webp", "Pflegende Maske für ein- bis zweimal pro Woche")}
${product("braukmann-institute-pro-lift-lippen-pflege-spf-10-10-ml", "Institute Pro Lift Lippen Pflege SPF 10", "17,00 €", "07737-1.webp", "Lippenpflege mit Lichtschutz")}
        </div>
      </article>
    </div>
  </section>

  <section class="section-smart">
    <div class="faq-head">
      <h2>Häufige Fragen zur Winterpflege</h2>
    </div>
    <div class="faq-grid">
${ld[2].mainEntity.map(q => `      <details>
        <summary>${esc(q.name)}</summary>
        <p>${esc(q.acceptedAnswer.text)}</p>
      </details>`).join("\n")}
    </div>
  </section>

  <section class="section-smart">
    <div class="cta-box">
      <h2>Ihrer Haut eine Winterpause gönnen</h2>
      <p>Unsere Hydro-Boost-Behandlung gibt trockener Winterhaut spürbar Feuchtigkeit zurück, das Hydra Glow Facial reinigt und bringt den Teint zum Strahlen. Lune Beauty · Mittelstraße 1 · 67547 Worms.</p>
      <div class="service-actions">
        <a href="${bookHref("Hydro Boost Gesicht")}" class="service-btn primary">Termin anfragen →</a>
        <a href="skin-ai.html" class="service-btn secondary">Kostenloser Skin Check</a>
      </div>
      <div class="related-links"><a href="hydro-boost-worms.html">Hydro Boost</a><a href="aquafacial-worms.html">Hydra Glow Facial</a><a href="gesichtsbehandlung-worms.html">Alle Gesichtsbehandlungen</a><a href="shop.html">Braukmann Shop</a></div>
    </div>
  </section>
</main>

${footer({})}`;

fs.writeFileSync(A.file, html);
console.log("written", A.file, html.length);
