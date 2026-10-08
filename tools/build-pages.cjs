// Generates the service landing pages, the course page and the shop legal pages. Run from the site root:
//   node tools/build-pages.cjs
const fs = require("fs");
const { SITE, BUSINESS, esc, head, nav, footer } = require("./site-kit.cjs");
const API = "https://lune-crm.pages.dev";

const bookHref = svc => `index.html?service=${encodeURIComponent(svc)}#booking`;
const priceRow = r => `      <article class="price-row">
        <div>
          ${r.tag ? `<small>${esc(r.tag)}</small>` : ""}
          <strong>${esc(r.name)}</strong>
          <span>${esc(r.text)}${r.min ? ` <em>· ${r.min}</em>` : ""}</span>
        </div>
        <div class="price-side"><b>${r.price} €</b>${r.book === false ? "" : `<a class="price-book" href="${bookHref(r.svc || r.name)}" aria-label="Termin anfragen für ${esc(r.name)}">Termin anfragen</a>`}</div>
      </article>`;

function hero(p) {
  return `<header class="lx-hero">
  <div class="lx-crumb"><a href="index.html">Home</a> · ${p.crumb}</div>
  <div class="lx-hero-inner">
    <div>
      <span class="lx-kicker">${p.kicker}</span>
      <h1>${p.h1}</h1>
      <p class="lx-lead">${p.lead}</p>
      <div class="lx-actions">
        <a href="${p.ctaHref || (p.cta ? bookHref(p.cta) : "index.html#booking")}" class="service-btn primary">${p.ctaLabel || "Termin anfragen"} →</a>
        <a href="${p.secondaryHref || "preise.html"}" class="service-btn secondary">${p.secondaryLabel || "Alle Preise ansehen"}</a>
      </div>
      <ul class="lx-trust">${(p.trust || ["Mittelstraße 1, Worms", "Persönliche Beratung", "5,0 ★ auf Google"]).map(t => `<li>${t}</li>`).join("")}</ul>
    </div>
    <figure class="lx-photo">
      <img src="assets/img/${p.heroImg}"${p.heroPos ? ` style="object-position:${p.heroPos}"` : ""} alt="${esc(p.heroAlt || p.photoAlt || p.serviceName)}" width="900" height="1125" fetchpriority="high">
      ${p.heroNote ? `<figcaption><b>${p.heroNote[0]}</b>${p.heroNote[1]}</figcaption>` : ""}
    </figure>
  </div>
</header>`;
}

function page(p) {
  const url = SITE + p.file;
  const ld = [{ "@type": "Service", "@id": url + "#service", name: p.serviceName, description: p.desc,
      provider: BUSINESS, areaServed: { "@type": "City", name: "Worms" }, serviceType: p.serviceName,
      offers: p.rows.filter(r => typeof r.price === "number").map(r => ({ "@type": "Offer", name: r.name, price: String(r.price), priceCurrency: "EUR" })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: p.crumb, item: url }] }];
  if (p.faq) ld.push({ "@type": "FAQPage", mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  const prices = p.groups
    ? p.groups.map(g => `      <h3 class="price-group">${esc(g.title)}</h3>\n${g.rows.map(priceRow).join("\n")}`).join("\n")
    : p.rows.map(priceRow).join("\n");
  return head({ title: p.title, desc: p.desc, path: p.file, ogTitle: p.ogTitle, image: SITE + "assets/img/" + p.heroImg, ld }) + `
${nav({ active: p.navActive || "" })}

${hero(p)}

<main>
${p.intro ? `  <section class="section-smart">
    <div class="smart-grid${p.photo ? "" : " single-col"}">
      <article class="smart-card">
        <small>${p.intro.eyebrow}</small>
        <h2>${p.intro.h2}</h2>
        ${p.intro.paras.map(t => `<p>${t}</p>`).join("\n        ")}
        ${p.photo ? `<figure class="smart-service-photo">
          <img src="assets/img/${p.photo}" alt="${p.photoAlt}" loading="lazy" />
          <figcaption>${p.photoCaption}</figcaption>
        </figure>` : ""}
        ${p.intro.highlight ? `<div class="smart-highlight"><strong>Ideal, wenn:</strong> ${p.intro.highlight}</div>` : ""}
      </article>

      <aside class="smart-card">
        <small>Behandlungen &amp; Preise</small>
        <div class="price-list">
${prices}
        </div>
        <p class="mini-note">${p.note || "Nicht sicher? Der kostenlose <a href=\"skin-ai.html\">Lune Skin Check</a> hilft bei der ersten kosmetischen Orientierung."}</p>
      </aside>
    </div>
  </section>` : `  <section class="section-smart">
    <div class="smart-card">
      <div class="price-list">
${prices}
      </div>
      <p class="mini-note">${p.note}</p>
    </div>
  </section>`}
${p.steps ? `
  <section class="section-smart">
    <div class="process-head">
      <h2>${p.stepsTitle}</h2>
      <p>${p.stepsLead}</p>
    </div>
    <div class="process-grid">
${p.steps.map(([h, t], i) => `      <article class="process-card">
        <small>0${i + 1}</small>
        <h3>${h}</h3>
        <p>${t}</p>
      </article>`).join("\n")}
    </div>
  </section>` : ""}
${p.faq ? `
  <section class="section-smart">
    <div class="faq-head">
      <h2>Häufige Fragen</h2>
    </div>
    <div class="faq-grid">
${p.faq.map(([q, a]) => `      <details>
        <summary>${q}</summary>
        <p>${a}</p>
      </details>`).join("\n")}
    </div>
  </section>` : ""}

  <section class="section-smart">
    <div class="cta-box">
      <h2>${p.ctaTitle}</h2>
      <p>${p.ctaText}</p>
      <div class="service-actions">
        <a href="${p.cta ? bookHref(p.cta) : "index.html#booking"}" class="service-btn primary">Termin anfragen →</a>
        <a href="skin-ai.html" class="service-btn secondary">Kostenloser Skin Check</a>
      </div>
      <div class="related-links">${(p.related || []).map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</div>
    </div>
  </section>
</main>

${footer({})}`;
}

const ADDONS = [
  { tag: "Add-on", name: "LED Maske", text: "Upgrade für Hautregeneration und mehr Ausstrahlung.", min: "10 Min.", price: 10 },
  { tag: "Add-on", name: "Radiofrequenz", text: "Gezielte Tiefenwirkung für ein strafferes, festeres Hautgefühl.", min: "10 Min.", price: 10 },
];

const pages = [
  {
    file: "aquafacial-worms.html", heroImg: "lune/hero-aquafacial.webp", heroPos: "center 78%", heroNote: ["90 Minuten", "Hydra Glow Facial · 130 €"],
    title: "Aquafacial in Worms | Hydra Glow Facial – Lune Beauty",
    ogTitle: "Aquafacial in Worms – Hydra Glow Facial bei Lune Beauty",
    desc: "Aquafacial in Worms: Hydra Glow Facial bei Lune Beauty mit Hydradermabrasion, Ausreinigung, Ultraschall und LED. 90 Minuten, 130 €. Mittelstraße 1, 67547 Worms.",
    serviceName: "Aquafacial (Hydra Glow Facial) in Worms", crumb: "Aquafacial Worms",
    kicker: "Aquafacial · Worms", h1: "Aquafacial in Worms – sichtbar klar, frisch und voller Glow.",
    lead: "Das Hydra Glow Facial ist unsere High-Tech-Gesichtsbehandlung: tief reinigend, intensiv durchfeuchtend und zugleich eine echte Auszeit.",
    cta: "Hydra Glow Facial (Aquafacial)", ctaLabel: "Aquafacial anfragen",
    photo: "lune/card-aquafacial.webp", photoAlt: "Aquafacial (Hydra Glow Facial) bei Lune Beauty in Worms", photoCaption: "Hydra Glow Facial · Lune Beauty Worms",
    intro: { eyebrow: "Hydra Glow Facial", h2: "Was ein Aquafacial für Ihre Haut tut.",
      paras: ["Beim Aquafacial – auch Hydrafacial oder Hydradermabrasion genannt – wird die Haut mit Wasser und sanftem Vakuum gereinigt, verfeinert und mit Wirkstoffen versorgt. Abgestorbene Hautschüppchen und Verunreinigungen lösen sich, ohne die Haut zu strapazieren.",
        "Bei Lune Beauty kombinieren wir die Hydradermabrasion mit Ausreinigung, Ultraschall, einem passenden Serum, LED-Licht und einer entspannenden Massage. Das Ergebnis: ein verfeinert wirkendes Hautbild und spürbare Frische – direkt nach der Behandlung."],
      highlight: "Ihre Haut fahl, müde oder großporig wirkt, Sie vor einem besonderen Anlass strahlen möchten oder sich einfach eine wirkungsvolle Auszeit wünschen." },
    rows: [
      { tag: "High-Tech Facial", name: "Hydra Glow Facial (Aquafacial)", svc: "Hydra Glow Facial (Aquafacial)", text: "Hydradermabrasion · Ausreinigung · Ultraschall · Massage · Serum · LED-Therapie", min: "90 Min.", price: 130 },
      { tag: "Feuchtigkeit", name: "Hydro Boost Gesicht", text: "Intensive Feuchtigkeit für glattere, prallere Haut.", min: "75 Min.", price: 89 },
      { tag: "Auszeit", name: "Relax & Glow Behandlung", text: "Luxuspflege · LED-Therapie · entspannende Massage", min: "90 Min.", price: 110 },
      ...ADDONS,
    ],
    stepsTitle: "So läuft Ihr Aquafacial ab", stepsLead: "90 Minuten, ruhig und präzise – jeder Schritt ist auf Ihre Haut abgestimmt.",
    steps: [["Hautanalyse & Reinigung", "Wir betrachten Ihr Hautbild, besprechen Ihr Ziel und reinigen die Haut gründlich vor."],
      ["Hydradermabrasion & Ultraschall", "Sanftes Peeling mit Wasser und Vakuum, Ausreinigung der Poren und Ultraschall für die Wirkstoff-Aufnahme."],
      ["Serum, LED & Massage", "Ein passendes Serum, LED-Licht und eine entspannende Massage runden das Facial ab – Sie gehen mit Glow."]],
    faq: [
      ["Was ist ein Aquafacial?", "Ein Aquafacial (Hydra Glow Facial) ist eine kosmetische Gesichtsbehandlung, bei der die Haut mit Wasser und sanftem Vakuum gereinigt, gepeelt und anschließend mit Wirkstoffen versorgt wird."],
      ["Für welche Haut ist das Aquafacial geeignet?", "Für fast alle Hauttypen – besonders bei fahler, müder, trockener oder großporiger Haut. Bei sehr empfindlicher Haut empfehlen wir vorab eine kurze Beratung oder unser Sensi Treatment."],
      ["Sieht man danach Rötungen?", "Meist ist die Haut direkt danach frisch und rosig. Leichte Rötungen klingen in der Regel nach kurzer Zeit ab – Sie sind sofort wieder gesellschaftsfähig."],
      ["Wie oft sollte man ein Aquafacial machen?", "Für ein gleichmäßig gepflegtes Hautbild empfehlen wir eine Behandlung alle 4 bis 6 Wochen. Vor besonderen Anlässen idealerweise einige Tage vorher."],
      ["Was kostet ein Aquafacial in Worms?", "Das Hydra Glow Facial (Aquafacial) kostet bei Lune Beauty 130 € für 90 Minuten. LED-Maske oder Radiofrequenz können für je 10 € ergänzt werden."],
    ],
    ctaTitle: "Ihr Aquafacial in Worms anfragen", ctaText: "Lune Beauty · Mittelstraße 1 · 67547 Worms. Senden Sie Ihren Wunschtermin – wir melden uns persönlich zurück.",
    related: [["gesichtsbehandlung-worms.html", "Alle Gesichtsbehandlungen"], ["anti-aging-worms.html", "Anti-Aging"], ["akne-behandlung-worms.html", "Unreine Haut"], ["preise.html", "Preisliste"]],
  },
  {
    file: "anti-aging-worms.html", heroImg: "lune/hero-anti-aging.webp", heroNote: ["Ohne Nadeln", "Lifting · Wirkstoffe · LED"],
    title: "Anti-Aging Behandlung in Worms | Lune Beauty Kosmetikstudio",
    ogTitle: "Anti-Aging Gesichtsbehandlung in Worms – Lune Beauty",
    desc: "Anti-Aging Behandlung in Worms bei Lune Beauty: Lifting-Pflege, Anti-Aging Serum, LED-Therapie und Radiofrequenz für ein sichtbar strafferes Hautbild. Ab 120 €.",
    serviceName: "Anti-Aging Gesichtsbehandlung in Worms", crumb: "Anti-Aging Worms",
    kicker: "Anti-Aging · Worms", h1: "Anti-Aging in Worms – für Spannkraft, die man sieht und fühlt.",
    lead: "Kosmetische Anti-Aging-Pflege mit Lifting, Wirkstoffen und LED-Licht – individuell, ruhig und ohne Nadeln.",
    cta: "Anti-Aging Behandlung", ctaLabel: "Anti-Aging anfragen",
    photo: "lune/card-anti-aging.webp", photoAlt: "Anti-Aging Gesichtsbehandlung bei Lune Beauty in Worms", photoCaption: "Anti-Aging Pflege · Lune Beauty Worms",
    intro: { eyebrow: "Anti-Aging Pflege", h2: "Mehr Spannkraft. Mehr Ausstrahlung.",
      paras: ["Mit den Jahren verliert die Haut an Feuchtigkeit und Elastizität, feine Linien werden sichtbarer. Unsere Anti-Aging Behandlung setzt genau hier an: mit einer Lifting-Massage, hochkonzentriertem Anti-Aging Serum und LED-Therapie.",
        "Für einen zusätzlichen Straffungseffekt lässt sich die Behandlung mit Radiofrequenz ergänzen. Das Ergebnis: ein sichtbar geglättetes, frischeres und revitalisiertes Hautbild – rein kosmetisch und ohne Ausfallzeit."],
      highlight: "Sie erste Fältchen bemerken, Ihre Haut an Spannkraft verliert oder müde wirkt und Sie eine wirksame, aber sanfte Pflege suchen." },
    rows: [
      { tag: "Anti-Aging", name: "Anti-Aging Behandlung", text: "Lifting · Anti-Aging Serum · LED-Therapie · Pflege", min: "90 Min.", price: 120 },
      { tag: "Glow", name: "Hydra Glow Facial (Aquafacial)", svc: "Hydra Glow Facial (Aquafacial)", text: "Verfeinert und durchfeuchtet – ideal als Ergänzung.", min: "90 Min.", price: 130 },
      { tag: "Ganzheitlich", name: "Gesicht + Hals + Dekolleté", text: "Pflege von Gesicht bis Dekolleté mit Ampulle und Maske.", min: "75 Min.", price: 85 },
      ...ADDONS,
    ],
    stepsTitle: "So läuft Ihre Anti-Aging Behandlung ab", stepsLead: "Wirksam und entspannend zugleich – mit klarer Empfehlung für die Pflege zu Hause.",
    steps: [["Beratung & Hautbild", "Wir besprechen Ihre Wünsche und wählen Wirkstoffe und Add-ons passend zu Ihrer Haut."],
      ["Lifting & Wirkstoffe", "Reinigung, Lifting-Massage und ein hochkonzentriertes Anti-Aging Serum – optional mit Radiofrequenz."],
      ["LED & Pflegeempfehlung", "LED-Licht und Abschlusspflege. Sie erhalten eine Empfehlung für Ihre tägliche Routine."]],
    faq: [
      ["Ab welchem Alter ist eine Anti-Aging Behandlung sinnvoll?", "Sobald Sie es sich wünschen – viele beginnen ab Ende 20 mit vorbeugender Pflege. Entscheidend ist das Hautbild, nicht das Alter."],
      ["Ist die Behandlung mit Nadeln oder Injektionen?", "Nein. Unsere Anti-Aging Behandlung ist rein kosmetisch: Massage, Wirkstoffe, LED-Licht und optional Radiofrequenz – ohne Nadeln und ohne Ausfallzeit."],
      ["Was bringt Radiofrequenz?", "Radiofrequenz erwärmt die tieferen Hautschichten sanft und unterstützt so ein strafferes, festeres Hautgefühl. Sie kann jeder Gesichtsbehandlung für 10 € hinzugefügt werden."],
      ["Wie oft sollte ich kommen?", "Für ein sichtbares, anhaltendes Ergebnis empfehlen wir eine Kur von mehreren Behandlungen im Abstand von 3 bis 4 Wochen, danach regelmäßige Pflege."],
    ],
    ctaTitle: "Ihre Anti-Aging Behandlung in Worms anfragen", ctaText: "Lune Beauty · Mittelstraße 1 · 67547 Worms. Wir beraten Sie gerne persönlich zur passenden Pflege.",
    related: [["gesichtsbehandlung-worms.html", "Alle Gesichtsbehandlungen"], ["aquafacial-worms.html", "Aquafacial"], ["preise.html", "Preisliste"]],
  },
  {
    file: "akne-behandlung-worms.html", heroImg: "lune/hero-akne.webp", heroNote: ["70 Minuten", "Aknebehandlung · 89 €"],
    title: "Aknebehandlung in Worms | Pflege bei unreiner Haut – Lune Beauty",
    ogTitle: "Kosmetische Aknebehandlung in Worms – Lune Beauty",
    desc: "Kosmetische Aknebehandlung in Worms: Tiefenreinigung, Fruchtsäure und professionelle Ausreinigung bei unreiner Haut. 70 Minuten, 89 €. Lune Beauty, Mittelstraße 1.",
    serviceName: "Kosmetische Aknebehandlung in Worms", crumb: "Aknebehandlung Worms",
    kicker: "Unreine Haut · Worms", h1: "Aknebehandlung in Worms – für ein klareres, ruhigeres Hautbild.",
    lead: "Professionelle kosmetische Pflege bei unreiner Haut, Mitessern und Pickeln – gründlich, schonend und ohne zu bewerten.",
    cta: "Aknebehandlung", ctaLabel: "Aknebehandlung anfragen",
    photo: "lune/card-akne.webp", photoAlt: "Kosmetische Aknebehandlung bei Lune Beauty in Worms", photoCaption: "Pflege bei unreiner Haut · Lune Beauty Worms",
    intro: { eyebrow: "Unreine Haut", h2: "Gründlich klären. Sanft beruhigen.",
      paras: ["Unreine Haut ist kein Makel, sondern braucht die richtige Pflege. In unserer Aknebehandlung reinigen wir die Haut in der Tiefe, lösen Verhornungen mit Fruchtsäure und reinigen Mitesser und Unreinheiten professionell und hygienisch aus.",
        "Eine klärende Maske und eine abgestimmte Pflege beruhigen die Haut im Anschluss. Gemeinsam besprechen wir, welche Pflege zu Hause Ihr Hautbild langfristig unterstützt."],
      highlight: "Sie zu Mitessern, Pickeln oder vergrößerten Poren neigen, Ihre Haut ölig oder unruhig ist – in der Pubertät ebenso wie im Erwachsenenalter." },
    rows: [
      { tag: "Unreine Haut", name: "Aknebehandlung", text: "Tiefenreinigung · Fruchtsäure · Ausreinigung · Maske · Pflege", min: "70 Min.", price: 89 },
      { tag: "Klassisch", name: "Basisbehandlung Gesicht", text: "Reinigung · Peeling · Bedampfen · Ausreinigung · Maske", min: "60 Min.", price: 69 },
      { tag: "Glow", name: "Hydra Glow Facial (Aquafacial)", svc: "Hydra Glow Facial (Aquafacial)", text: "Hydradermabrasion für verfeinerte Poren und Frische.", min: "90 Min.", price: 130 },
      { tag: "Sensible Haut", name: "Sensi Treatment", text: "Sanft und beruhigend für empfindliche, gereizte Haut.", min: "75 Min.", price: 89 },
    ],
    stepsTitle: "So läuft Ihre Aknebehandlung ab", stepsLead: "Hygienisch, gründlich und mit viel Ruhe – damit sich die Haut danach gut anfühlt.",
    steps: [["Hautbild & Reinigung", "Wir betrachten Ihre Haut und reinigen sie gründlich in der Tiefe."],
      ["Fruchtsäure & Ausreinigung", "Fruchtsäure löst Verhornungen, danach reinigen wir Mitesser und Unreinheiten professionell aus."],
      ["Maske & Pflegeplan", "Eine klärende Maske beruhigt. Sie erhalten Tipps für Ihre Pflege zu Hause."]],
    faq: [
      ["Ist die Aknebehandlung eine medizinische Behandlung?", "Nein. Wir bieten eine kosmetische Pflege bei unreiner Haut an. Bei stark entzündlicher Akne empfehlen wir zusätzlich die Abklärung bei einer Hautärztin oder einem Hautarzt – unsere Pflege kann eine ärztliche Therapie gut begleiten."],
      ["Wie oft sollte ich zur Aknebehandlung kommen?", "Zu Beginn sind 3 bis 4 Wochen Abstand ideal – das entspricht etwa dem Erneuerungszyklus der Haut. Danach reichen meist regelmäßige Pflegetermine."],
      ["Ist die Ausreinigung schmerzhaft?", "Die Ausreinigung kann kurz unangenehm sein. Wir arbeiten vorsichtig und machen gerne Pausen – die Haut wird vorher mit Dampf vorbereitet."],
      ["Ist die Behandlung auch für Jugendliche geeignet?", "Ja, die Aknebehandlung ist auch für Jugendliche geeignet. Bei Minderjährigen bitten wir um die Zustimmung eines Elternteils."],
    ],
    ctaTitle: "Ihre Aknebehandlung in Worms anfragen", ctaText: "Lune Beauty · Mittelstraße 1 · 67547 Worms. Senden Sie Ihren Terminwunsch – diskret und persönlich.",
    related: [["gesichtsbehandlung-worms.html", "Alle Gesichtsbehandlungen"], ["aquafacial-worms.html", "Aquafacial"], ["preise.html", "Preisliste"]],
  },
  {
    file: "preise.html", heroImg: "lune/hero-preise.webp", heroNote: ["Mittelstraße 1", "Ihr Studio in Worms"],
    title: "Preise Kosmetik Worms | Preisliste Lune Beauty Kosmetikstudio",
    ogTitle: "Preise – Lune Beauty Kosmetikstudio Worms",
    desc: "Alle Preise von Lune Beauty in Worms: Gesichtsbehandlung ab 69 €, Aquafacial 130 €, Anti-Aging 120 €, Maniküre ab 33 €, Fußpflege ab 50 €, Wimpern & Brauen ab 15 €.",
    serviceName: "Kosmetikbehandlungen in Worms", crumb: "Preise",
    kicker: "Preisliste · Worms", h1: "Preise – klar, transparent, ohne Überraschungen.",
    lead: "Alle Behandlungen von Lune Beauty in Worms auf einen Blick. Inklusive persönlicher Beratung.",
    secondaryHref: "skin-ai.html", secondaryLabel: "Kostenloser Skin Check",
    groups: [
      { title: "Gesichtsbehandlungen", rows: [
        { name: "Basisbehandlung Gesicht", text: "Reinigung · Peeling · Bedampfen · Ausreinigung · Maske · Abschlusspflege", min: "60 Min.", price: 69 },
        { name: "Gesicht + Hals + Dekolleté", text: "Inklusive Ampulle und pflegender Maske", min: "75 Min.", price: 85 },
        { name: "Hydro Boost Gesicht", text: "Intensive Feuchtigkeit für glattere, prallere Haut", min: "75 Min.", price: 89 },
        { name: "Hydro Boost Gesicht & Dekolleté", text: "Feuchtigkeitsritual für Gesicht und Dekolleté", min: "80 Min.", price: 99 },
        { name: "Aknebehandlung", text: "Tiefenreinigung · Fruchtsäure · Ausreinigung · Maske", min: "70 Min.", price: 89 },
        { name: "Sensi Treatment", text: "Sanft und beruhigend für empfindliche Haut", min: "75 Min.", price: 89 },
        { name: "Relax & Glow Behandlung", text: "Luxuspflege · LED-Therapie · entspannende Massage", min: "90 Min.", price: 110 },
        { name: "Anti-Aging Behandlung", text: "Lifting · Anti-Aging Serum · LED-Therapie", min: "90 Min.", price: 120 },
        { name: "Hydra Glow Facial (Aquafacial)", svc: "Hydra Glow Facial (Aquafacial)", text: "Hydradermabrasion · Ultraschall · Serum · LED · Massage", min: "90 Min.", price: 130 },
      ] },
      { title: "Add-ons", rows: ADDONS.map(a => ({ ...a, tag: "", book: false })) },
      { title: "Gesichtswaxing", rows: [
        { name: "Oberlippe Waxing", text: "Sanfte, präzise Haarentfernung", min: "10 Min.", price: 15 },
        { name: "Kinn Waxing", text: "Glatte, harmonische Haut im Kinnbereich", min: "10 Min.", price: 15 },
        { name: "Gesichtswaxing komplett", text: "Oberlippe, Kinn und Wangen", min: "20–25 Min.", price: 30 },
      ] },
      { title: "Maniküre & Fußpflege", rows: [
        { name: "Klassische Maniküre", text: "Feilen · Polieren", price: 33 },
        { name: "Spa Maniküre", text: "Handbad · Nagelhautpflege · Handmaske · Handmassage", price: 52 },
        { name: "Basis Fußpflege", text: "Fußbad · Schneiden · Feilen · Nagelhaut · Hornhaut · Pflege", price: 50 },
        { name: "Spa Fußpflege", text: "Fußbad · Peeling · Packung · Massage · Pflege", price: 65 },
        { name: "Farbe", text: "Lack für einen gepflegten Look", price: 10, book: false },
        { name: "Farbe entfernen (Hände / Füße)", text: "Schonende Entfernung alter Lacke", price: "10 / 20", book: false },
      ] },
      { title: "Augenpflege", rows: [
        { name: "Wimpernfärben", text: "Betonte Wimpern – ganz ohne Mascara", price: 20 },
        { name: "Augenbrauen färben", text: "Natürlich definierte Brauen", price: 15 },
        { name: "Augenbrauenkorrektur", text: "Harmonisch geformte Brauen", price: 15 },
        { name: "Kombi Augenbehandlung", text: "Korrektur · Brauen färben · Wimpernfärben", price: 45 },
      ] },
    ],
    note: "Alle Preise inklusive persönlicher Beratung. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Bitte sagen Sie Termine mindestens 24 Stunden vorher ab – siehe <a href=\"agb.html\">AGB</a>.",
    ctaTitle: "Ihren Termin in Worms anfragen", ctaText: "Lune Beauty · Mittelstraße 1 · 67547 Worms · 0179 1544002. Unsicher, welche Behandlung passt? Der Skin Check hilft.",
    related: [["gesichtsbehandlung-worms.html", "Gesichtsbehandlung"], ["aquafacial-worms.html", "Aquafacial"], ["anti-aging-worms.html", "Anti-Aging"], ["akne-behandlung-worms.html", "Unreine Haut"], ["manikuere-pedikuere-worms.html", "Maniküre & Fußpflege"], ["augenpflege-worms.html", "Augenpflege"]],
  },
];

pages.find(p => p.file === "preise.html").navActive = "preise";
for (const p of pages) {
  if (p.groups) p.rows = p.groups.flatMap(g => g.rows).filter(r => typeof r.price === "number");
  fs.writeFileSync(p.file, page(p));
}

/* ---------- Kosmetik-Ausbildung ---------- */
{
  const file = "kosmetik-ausbildung-worms.html", url = SITE + file;
  const MODULES = [
    ["Haut verstehen", "Aufbau und Funktion der Haut, Hauttypen und Hautzustände, professionelle Hautanalyse."],
    ["Hygiene & Sicherheit", "Hygieneplan, Desinfektion, Arbeitsschutz und der sichere Umgang mit Kundinnen."],
    ["Die Grundbehandlung", "Reinigung, Tonisieren, Peelings, Bedampfen, Ausreinigung, Maske und Abschlusspflege."],
    ["Massage & Entspannung", "Gesichts-, Hals- und Dekolletémassage, Grifftechniken und Behandlungsrhythmus."],
    ["Augen & Brauen", "Augenbrauenkorrektur mit Wachs und Pinzette, Färben von Wimpern und Brauen."],
    ["Apparative Kosmetik", "Arbeiten mit Ultraschall, Hydradermabrasion (Aquafacial), LED und Radiofrequenz."],
    ["Produktkunde & Beratung", "Wirkstoffe verstehen, Pflege empfehlen und eine Heimpflege-Routine aufbauen."],
    ["Selbstständig arbeiten", "Preise kalkulieren, Termine organisieren, Kundinnen binden, Social Media und Bewertungen."],
  ];
  const FAQ = [
    ["Brauche ich Vorkenntnisse?", "Nein. Die Ausbildung beginnt mit den Grundlagen und führt Sie Schritt für Schritt bis zur vollständigen Gesichtsbehandlung. Voraussetzung ist ein Mindestalter von 18 Jahren."],
    ["Welchen Abschluss erhalte ich?", "Sie schließen mit einer schriftlichen und praktischen Prüfung ab und erhalten ein Lune-Beauty-Zertifikat über die absolvierten Inhalte. Es handelt sich um einen privaten Zertifikatslehrgang, nicht um die staatlich geregelte dreijährige Berufsausbildung."],
    ["Wie viel praktische Übung ist dabei?", "Sehr viel: Sie üben zuerst gegenseitig und behandeln danach echte Modelle – im laufenden Studio, mit professionellen Geräten und Produkten."],
    ["Was kostet die Ausbildung?", "Die Preise richten sich nach Kursformat und Termin. Senden Sie uns eine unverbindliche Anfrage – Sie erhalten innerhalb von 48 Stunden alle Termine, Preise und Details."],
    ["Kann ich mich danach selbstständig machen?", "Ja, viele Absolventinnen starten nebenberuflich oder mit eigenem Studio. Im Modul „Selbstständig arbeiten“ besprechen wir Preise, Organisation und Kundengewinnung; zur Gewerbeanmeldung und den Hygienevorschriften Ihrer Stadt geben wir Ihnen eine Checkliste mit."],
  ];
  const ld = [
    { "@type": "Course", "@id": url + "#course", name: "Kosmetik-Ausbildung in Worms (Zertifikatslehrgang)", description: "Praxisnahe Kosmetik-Ausbildung bei Lune Beauty in Worms – als 4-Wochen-Intensivkurs oder an 4 Wochenenden, mit Zertifikat.",
      provider: BUSINESS, inLanguage: "de", educationalCredentialAwarded: "Lune-Beauty-Zertifikat",
      hasCourseInstance: [
        { "@type": "CourseInstance", name: "4 Wochen Intensivkurs", courseMode: "Onsite", courseWorkload: "P4W", location: BUSINESS },
        { "@type": "CourseInstance", name: "4 Wochenenden", courseMode: "Onsite", courseSchedule: { "@type": "Schedule", repeatFrequency: "P1W", repeatCount: 4, byDay: ["https://schema.org/Saturday", "https://schema.org/Sunday"] }, location: BUSINESS },
      ] },
    { "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE }, { "@type": "ListItem", position: 2, name: "Kosmetik-Ausbildung Worms", item: url }] },
  ];
  const html = head({ title: "Kosmetik-Ausbildung in Worms | 4 Wochen oder 4 Wochenenden – Lune Beauty", ogTitle: "Kosmetik-Ausbildung in Worms – Lune Beauty Academy",
    desc: "Kosmetik-Ausbildung in Worms bei einer staatlich anerkannten Kosmetikerin: 4-Wochen-Intensivkurs oder 4 Wochenenden, viel Praxis an Modellen, Geräte-Kosmetik und Zertifikat.",
    path: file, image: SITE + "assets/img/lune/hero-ausbildung.webp", ld }) + `
${nav({ active: "ausbildung" })}

${hero({ crumb: "Kosmetik-Ausbildung Worms", kicker: "Lune Beauty Academy · Worms",
    h1: "Kosmetik-Ausbildung in Worms – <em>Handwerk</em>, das bleibt.",
    lead: "Lernen Sie direkt im laufenden Studio bei einer staatlich anerkannten Kosmetikerin: persönlich betreut, mit echten Modellen, professionellen Geräten und allem, was Sie für Ihre ersten eigenen Kundinnen brauchen.",
    ctaHref: "#anfrage", ctaLabel: "Unverbindlich anfragen", secondaryHref: "#inhalte", secondaryLabel: "Inhalte ansehen",
    trust: ["4 Wochen oder 4 Wochenenden", "Viel Praxis an Modellen", "Mit Zertifikat"],
    heroImg: "lune/hero-ausbildung.webp", heroAlt: "Praxis in der Kosmetik-Ausbildung bei Lune Beauty in Worms", heroNote: ["Im echten Studio", "Lernen, wo täglich behandelt wird"] })}

<main>
  <section class="section-smart">
    <div class="process-head">
      <h2>Zwei Wege zum Zertifikat</h2>
      <p>Gleiche Inhalte, gleiche Prüfung – wählen Sie das Tempo, das zu Ihrem Leben passt.</p>
    </div>
    <div class="lx-plans">
      <article class="lx-plan featured"><span class="tag">Am schnellsten</span>
        <small>Intensivkurs</small><h3>4 Wochen</h3><p class="when">Montag bis Freitag, tagsüber</p>
        <ul><li>Kompakt in vier Wochen zur vollständigen Gesichtsbehandlung</li><li>Täglich Praxis – zuerst gegenseitig, dann an Modellen</li><li>Apparative Kosmetik inklusive</li><li>Prüfung &amp; Lune-Beauty-Zertifikat</li></ul>
        <a class="service-btn primary" href="#anfrage" data-course="4 Wochen Intensivkurs">Termine anfragen →</a></article>
      <article class="lx-plan">
        <small>Berufsbegleitend</small><h3>4 Wochenenden</h3><p class="when">Samstag &amp; Sonntag, über einen Monat</p>
        <ul><li>Ideal neben Job oder Familie</li><li>Zeit zum Üben zwischen den Wochenenden</li><li>Gleiche Inhalte wie der Intensivkurs</li><li>Prüfung &amp; Lune-Beauty-Zertifikat</li></ul>
        <a class="service-btn primary" href="#anfrage" data-course="4 Wochenenden">Termine anfragen →</a></article>
      <article class="lx-plan">
        <small>Noch unsicher?</small><h3>Infogespräch</h3><p class="when">Kostenlos &amp; unverbindlich</p>
        <ul><li>Lernen Sie das Studio und Ihre Ausbilderin kennen</li><li>Wir klären Ihre Ziele und das passende Format</li><li>Preise, Termine und Zahlungsmöglichkeiten</li></ul>
        <a class="service-btn primary" href="#anfrage" data-course="Noch unsicher">Gespräch vereinbaren →</a></article>
    </div>
    <p class="mini-note">Preise und nächste Termine auf Anfrage – Sie erhalten innerhalb von 48 Stunden ein persönliches Angebot.</p>
  </section>

  <section class="section-smart" id="inhalte">
    <div class="process-head">
      <h2>Was Sie lernen</h2>
      <p>Acht Module, die aufeinander aufbauen – von der Hautanalyse bis zur eigenen Kundin.</p>
    </div>
    <div class="lx-modules">
${MODULES.map(([t, d], i) => `      <div class="lx-module"><small style="color:#c3a063;font-weight:900;letter-spacing:.14em">0${i + 1}</small><b>${t}</b><span>${d}</span></div>`).join("\n")}
    </div>
  </section>

  <section class="section-smart">
    <div class="smart-grid">
      <article class="smart-card">
        <small>Warum bei Lune Beauty</small>
        <h2>Lernen, wo täglich behandelt wird.</h2>
        <p>Ihre Ausbilderin ist staatlich anerkannte Kosmetikerin und hat in renommierten Kosmetikstudios in Deutschland und Frankreich gearbeitet. Sie lernen nicht in einem Schulungsraum, sondern im echten Studio – mit denselben Geräten, Produkten und Abläufen, mit denen wir unsere Kundinnen jeden Tag behandeln.</p>
        <figure class="smart-service-photo">
          <img src="assets/img/lune/card-ausbildung.webp" alt="Kosmetik-Ausbildung: Behandlung am Modell bei Lune Beauty Worms" loading="lazy" />
          <figcaption>Praxis am Modell · Lune Beauty Worms</figcaption>
        </figure>
      </article>
      <aside class="smart-card">
        <small>So läuft die Ausbildung ab</small>
        <div class="price-list">
          <article class="price-row"><div><small>Abschnitt 1</small><strong>Grundlagen &amp; Grundbehandlung</strong><span>Hautlehre, Hygiene und die komplette Grundbehandlung – Sie üben gegenseitig, bis jeder Handgriff sitzt.</span></div></article>
          <article class="price-row"><div><small>Abschnitt 2</small><strong>Vertiefung am Modell</strong><span>Hauttypgerechte Behandlungen, Massage, Augenbrauen und Wimpern an echten Modellen.</span></div></article>
          <article class="price-row"><div><small>Abschnitt 3</small><strong>Spezial- &amp; Gerätebehandlungen</strong><span>Aquafacial, Ultraschall, LED und Radiofrequenz, Anti-Aging und unreine Haut.</span></div></article>
          <article class="price-row"><div><small>Abschnitt 4</small><strong>Prüfung &amp; Zertifikat</strong><span>Schriftliche Prüfung und eine komplette Behandlung in Eigenregie – danach überreichen wir Ihr Zertifikat.</span></div></article>
        </div>
      </aside>
    </div>
  </section>

  <section class="section-smart" id="anfrage">
    <div class="smart-grid">
      <article class="smart-card">
        <small>Unverbindliche Anfrage</small>
        <h2>Ihr Platz in der nächsten Ausbildung.</h2>
        <p>Senden Sie uns Ihre Anfrage – wir melden uns innerhalb von 48 Stunden mit den nächsten Terminen, Preisen und allen Details. Lieber direkt sprechen? Rufen Sie an oder schreiben Sie per WhatsApp: <a class="lx-link" href="https://wa.me/491791544002">0179 1544002</a>.</p>
        <div class="smart-highlight"><strong>Gut zu wissen:</strong> Der Abschluss ist ein privates Lune-Beauty-Zertifikat. Die staatlich geregelte dreijährige Berufsausbildung zur Kosmetikerin ersetzt er nicht.</div>
      </article>
      <aside class="smart-card">
        <form class="lx-form" id="courseForm" novalidate>
          <label>Kursformat
            <select name="course"><option>4 Wochen Intensivkurs</option><option>4 Wochenenden</option><option>Noch unsicher</option></select></label>
          <label>Name<input name="name" autocomplete="name" required></label>
          <div class="row2">
            <label>E-Mail<input name="email" type="email" autocomplete="email"></label>
            <label>Telefon<input name="phone" type="tel" autocomplete="tel"></label>
          </div>
          <label>Ihre Nachricht (optional)<textarea name="message" rows="4" placeholder="Wunschzeitraum, Vorkenntnisse, Fragen …"></textarea></label>
          <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
          <label class="check"><input type="checkbox" name="consent" required> <span>Ich bin einverstanden, dass Lune Beauty meine Angaben zur Bearbeitung der Anfrage speichert und mich kontaktiert. Hinweise in der <a class="lx-link" href="datenschutz.html#anfragen">Datenschutzerklärung</a>.</span></label>
          <button class="service-btn primary" type="submit">Anfrage senden →</button>
          <div class="lx-msg" hidden></div>
        </form>
      </aside>
    </div>
  </section>

  <section class="section-smart">
    <div class="faq-head"><h2>Häufige Fragen zur Ausbildung</h2></div>
    <div class="faq-grid">
${FAQ.map(([q, a]) => `      <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
    </div>
  </section>
</main>

${footer({ scripts: `<script>
(function(){
  var f=document.getElementById("courseForm"), msg=f.querySelector(".lx-msg");
  document.querySelectorAll("[data-course]").forEach(function(a){a.addEventListener("click",function(){f.course.value=a.getAttribute("data-course");});});
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var show=function(t,ok){msg.hidden=false;msg.className="lx-msg "+(ok?"ok":"bad");msg.textContent=t;};
    if(f.name.value.trim().length<2)return show("Bitte geben Sie Ihren Namen an.");
    if(!f.email.value.trim()&&f.phone.value.replace(/\\D/g,"").length<6)return show("Bitte E-Mail oder Telefonnummer angeben.");
    if(!f.consent.checked)return show("Bitte stimmen Sie der Verarbeitung Ihrer Anfrage zu.");
    var b=f.querySelector("button[type=submit]");b.disabled=true;b.textContent="Wird gesendet …";
    fetch("${API}/api/inquiry",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({course:f.course.value,name:f.name.value,email:f.email.value,phone:f.phone.value,message:f.message.value,website:f.website.value,consent:f.consent.checked})})
      .then(function(r){return r.json();}).then(function(d){
        if(!d.ok)throw new Error(d.error||"Fehler");
        f.reset();show("Vielen Dank! Ihre Anfrage ist bei uns eingegangen – wir melden uns innerhalb von 48 Stunden.",true);
        try{window.dispatchEvent(new Event("lune:course-inquiry"));}catch(_){}
      }).catch(function(err){show((err&&err.message)||"Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an: 0179 1544002.");})
      .finally(function(){b.disabled=false;b.textContent="Anfrage senden →";});
  });
})();
</script>` })}`;
  fs.writeFileSync(file, html);
}

/* ---------- Widerruf (incl. electronic withdrawal function) ---------- */
const WIDERRUF = `
      <h2 id="belehrung">Widerrufsbelehrung</h2>
      <h3>Widerrufsrecht</h3>
      <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.</p>
      <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Lune Beauty, Mittelstraße 1, 67547 Worms, Telefon 0179 1544002, E-Mail lunebeauty.kontakt@gmail.com) mittels einer eindeutigen Erklärung (z.&nbsp;B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular oder die Widerrufsfunktion auf dieser Seite verwenden, was jedoch nicht vorgeschrieben ist. Nutzen Sie die Widerrufsfunktion, übermitteln wir Ihnen unverzüglich eine Bestätigung über den Eingang des Widerrufs per E-Mail.</p>
      <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
      <h3>Folgen des Widerrufs</h3>
      <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>
      <p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an Lune Beauty, Mittelstraße 1, 67547 Worms zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.</p>
      <p>Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>
      <h3>Ausschluss bzw. vorzeitiges Erlöschen des Widerrufsrechts</h3>
      <p>Das Widerrufsrecht erlischt vorzeitig bei Verträgen zur Lieferung versiegelter Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn ihre Versiegelung nach der Lieferung entfernt wurde.</p>
      <p><em>Ende der Widerrufsbelehrung</em></p>
      <h2 id="formular" style="margin-top:34px">Muster-Widerrufsformular</h2>
      <p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>
      <ul>
        <li>An Lune Beauty, Mittelstraße 1, 67547 Worms, E-Mail: lunebeauty.kontakt@gmail.com</li>
        <li>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)</li>
        <li>Bestellt am (*)/erhalten am (*)</li>
        <li>Name des/der Verbraucher(s)</li>
        <li>Anschrift des/der Verbraucher(s)</li>
        <li>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</li>
        <li>Datum</li>
      </ul>
      <p>(*) Unzutreffendes streichen.</p>`;

function legalPage({ file, title, desc, h1, kicker, lead, body, scripts = "", noindex = false }) {
  return head({ title, desc, path: file, noindex }) + `
${nav({})}
<header class="lx-hero" style="padding-bottom:10px">
  <div class="lx-crumb"><a href="index.html">Home</a> · ${h1}</div>
  <div class="lx-hero-inner" style="grid-template-columns:1fr">
    <div><span class="lx-kicker">${kicker}</span><h1>${h1}</h1>${lead ? `<p class="lx-lead">${lead}</p>` : ""}</div>
  </div>
</header>
<main>
${body}
</main>
${footer({ scripts })}`;
}

fs.writeFileSync("widerruf.html", legalPage({
  file: "widerruf.html", title: "Widerruf & Widerrufsbelehrung | Lune Beauty Shop", h1: "Widerruf", kicker: "Online-Shop · Ihre Rechte",
  desc: "Widerrufsbelehrung, Muster-Widerrufsformular und Widerrufsfunktion für Bestellungen im Lune Beauty Online-Shop.",
  lead: "Sie können Ihren Kauf innerhalb von 14 Tagen widerrufen – am einfachsten direkt hier über die Widerrufsfunktion.",
  body: `  <section class="section-smart" id="widerrufen">
    <div class="smart-grid">
      <article class="smart-card">
        <small>Widerrufsfunktion</small>
        <h2>Vertrag widerrufen</h2>
        <p>Füllen Sie die Felder aus und klicken Sie auf „Widerruf bestätigen“. Sie erhalten sofort eine Eingangsbestätigung mit Datum und Uhrzeit per E-Mail.</p>
        <div class="smart-highlight"><strong>Rücksendeadresse:</strong> Lune Beauty, Mittelstraße 1, 67547 Worms</div>
      </article>
      <aside class="smart-card">
        <form class="lx-form" id="withdrawForm" novalidate>
          <label>Name<input name="name" autocomplete="name" required></label>
          <label>E-Mail-Adresse (für die Eingangsbestätigung)<input name="email" type="email" autocomplete="email" required></label>
          <label>Bestellnummer (z.&nbsp;B. LB-20261008-AB12)<input name="number"></label>
          <label>Welche Waren möchten Sie zurückgeben? (optional)<textarea name="message" rows="3"></textarea></label>
          <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
          <button class="service-btn primary" type="submit">Widerruf bestätigen</button>
          <div class="lx-msg" hidden></div>
        </form>
      </aside>
    </div>
  </section>
  <section class="section-smart">
    <div class="smart-card text-card">${WIDERRUF}
    </div>
  </section>`,
  scripts: `<script>
(function(){
  var f=document.getElementById("withdrawForm"), msg=f.querySelector(".lx-msg");
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var show=function(t,ok){msg.hidden=false;msg.className="lx-msg "+(ok?"ok":"bad");msg.textContent=t;};
    if(f.name.value.trim().length<2||!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(f.email.value.trim()))return show("Bitte Name und gültige E-Mail-Adresse angeben.");
    var b=f.querySelector("button[type=submit]");b.disabled=true;b.textContent="Wird übermittelt …";
    fetch("${API}/api/shop/withdraw",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:f.name.value,email:f.email.value,number:f.number.value,message:f.message.value,website:f.website.value})})
      .then(function(r){return r.json();}).then(function(d){
        if(!d.ok)throw new Error(d.error||"Fehler");
        var at=new Date(d.receivedAt).toLocaleString("de-DE");
        f.reset();show("Ihr Widerruf ist am "+at+" bei uns eingegangen."+(d.mailed?" Die Eingangsbestätigung wurde an Ihre E-Mail-Adresse gesendet.":" Bitte bewahren Sie diese Bestätigung auf (z. B. Screenshot)."),true);
      }).catch(function(err){show((err&&err.message)||"Übermittlung fehlgeschlagen. Bitte widerrufen Sie per E-Mail an lunebeauty.kontakt@gmail.com.");})
      .finally(function(){b.disabled=false;b.textContent="Widerruf bestätigen";});
  });
})();
</script>`,
}));

fs.writeFileSync("versand-zahlung.html", legalPage({
  file: "versand-zahlung.html", title: "Versand & Zahlung | Lune Beauty Shop", h1: "Versand &amp; Zahlung", kicker: "Online-Shop · Informationen",
  desc: "Versand mit DHL in 1–3 Werktagen, 4,95 € Versandkosten, ab 50 € versandkostenfrei. Bezahlung sicher mit PayPal.",
  body: `  <section class="section-smart">
    <div class="smart-card text-card">
      <h2>Versand</h2>
      <ul>
        <li>Wir liefern innerhalb Deutschlands mit DHL.</li>
        <li>Lieferzeit: 1–3 Werktage nach Zahlungseingang.</li>
        <li>Versandkosten: 4,95 € pro Bestellung – ab einem Bestellwert von 50 € liefern wir versandkostenfrei.</li>
        <li>Nach dem Versand erhalten Sie eine E-Mail mit Ihrer DHL-Sendungsnummer.</li>
        <li>Ein Versand ins Ausland ist derzeit nicht möglich.</li>
      </ul>
      <h2 style="margin-top:28px">Zahlung</h2>
      <p>Die Bezahlung erfolgt ausschließlich über <b>PayPal</b>. Sie melden sich bei PayPal an, wählen Ihre Lieferadresse und Zahlungsquelle und prüfen anschließend Ihre Bestellung auf unserer Seite. Erst mit dem Klick auf „Zahlungspflichtig bestellen“ wird die Bestellung verbindlich und der Betrag abgebucht.</p>
      <h2 style="margin-top:28px">Preise</h2>
      <p>Alle Preise sind Endpreise in Euro. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung). Bei Kosmetikprodukten ist zusätzlich der Grundpreis pro Liter bzw. Kilogramm angegeben.</p>
      <h2 style="margin-top:28px">Abholung im Studio</h2>
      <p>Sie möchten Ihre Produkte lieber abholen? Schreiben Sie uns per WhatsApp an <a class="lx-link" href="https://wa.me/491791544002">0179 1544002</a> – wir legen sie für Sie in der Mittelstraße 1, 67547 Worms zurück.</p>
      <h2 style="margin-top:28px">Widerruf</h2>
      <p>Informationen zu Ihrem Widerrufsrecht und die Widerrufsfunktion finden Sie <a class="lx-link" href="widerruf.html">hier</a>.</p>
    </div>
  </section>`,
}));
console.log("pages written");
