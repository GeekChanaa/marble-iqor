// Shared chrome for every page: <head>, loader, navigation, footer, scripts.

const arrow = (stroke = 'currentColor', size = 12) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 10 L10 2 M4 2 H10 V8" stroke="${stroke}" stroke-width="1.6"/></svg>`;

export { arrow };

// The black/marble pill button used across the site.
// tone "ink" = black button (Calacatta thumbnail), "paper" = light button (Nero thumbnail).
export function btn({ href, label, tone = 'ink', thumb, cls = '' }) {
  const t = thumb || (tone === 'ink' ? 'calacatta-oro.jpg' : 'nero-marquina.jpg');
  return `<a class="btn btn--${tone} ${cls}" href="${href}" data-magnetic>
<span class="btn__label"><span data-roll>${label}</span></span>
<span class="btn__thumb"><img src="assets/img/${t}" alt="" loading="lazy">${arrow()}</span>
</a>`;
}

export function head({ title, description = 'Vena supplies natural marble as full slabs, tiles and pieces cut to size.' }) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="icon" href="assets/img/logo-ink.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
<script>document.documentElement.classList.add('js');</script>`;
}

export function loader() {
  return `<div class="curtain" aria-hidden="true">
<div class="curtain__inner">
<div class="curtain__mark"><span>V</span><span>E</span><span>N</span><span>A</span></div>
<div class="curtain__bar"><i></i></div>
</div>
</div>
<div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>
<div class="progress" aria-hidden="true"><i></i></div>`;
}

const tickerItems = ['Natural stone, sold by the slab', 'No two slabs alike', 'Slabs — Tiles — Cut-to-size', 'Enquiries welcome'];

export function nav({ tone = 'ink', current = '' }) {
  const items = tickerItems.map((t) => `<span>${t}</span><i></i>`).join('');
  const link = (href, label, key) =>
    `<a href="${href}" class="nav__link${current === key ? ' is-current' : ''}"${current === key ? ' aria-current="page"' : ''}><span data-roll>${label}</span></a>`;
  return `<header class="site-header" data-tone="${tone}">
<div class="ticker" aria-label="Natural stone, sold by the slab. No two slabs alike. Slabs, tiles, cut-to-size. Enquiries welcome.">
<div class="ticker__track" aria-hidden="true"><div class="ticker__row">${items}</div><div class="ticker__row">${items}</div></div>
</div>
<nav class="nav wrap" aria-label="Main">
<a href="index.html" class="nav__brand" aria-label="Vena, home">
<img src="assets/img/${tone === 'paper' ? 'logo-paper' : 'logo-ink'}.webp" alt="" width="28" height="28">
<span>VENA</span>
</a>
<div class="nav__links">
${link('collection.html', 'Collection', 'collection')}
${link('index.html#finishes', 'Finishes', 'finishes')}
${link('index.html#house', 'The house', 'house')}
</div>
${btn({ href: 'contact.html', label: 'Contact us', tone: tone === 'paper' ? 'paper' : 'ink', cls: 'nav__cta' })}
</nav>
</header>`;
}

const footerStones = [
  ['calacatta-oro.html', 'Calacatta Oro'], ['collection.html', 'Portoro'],
  ['nero-marquina.html', 'Nero Marquina'], ['collection.html', 'Rosso Levanto'],
  ['verde-alpi.html', 'Verde Alpi'], ['collection.html', 'Emperador Dark'],
  ['collection.html', 'Bianco Carrara'], ['collection.html', 'Travertino Romano'],
];

export function footer() {
  const li = ([h, l]) => `<li><a href="${h}"><span data-roll>${l}</span></a></li>`;
  return `<footer class="site-footer t-dark" data-footer>
<div class="site-footer__seam"><img src="assets/img/portoro.jpg" alt="" data-parallax="-20"></div>
<div class="wrap site-footer__body">
<div class="site-footer__cols">
<div class="site-footer__intro" data-reveal="up">
<a href="index.html" class="nav__brand" aria-label="Vena, home"><img src="assets/img/logo-paper.webp" alt="" width="28" height="28"><span>VENA</span></a>
<p class="site-footer__claim" data-split="lines">Marble and natural stone, sold <span class="serif">slab by slab.</span></p>
</div>
<div class="site-footer__col site-footer__col--wide" data-reveal="up">
<div class="eyebrow mute">[ Stones ]</div>
<ul class="site-footer__grid">${footerStones.map(li).join('')}</ul>
</div>
<div class="site-footer__col" data-reveal="up">
<div class="eyebrow mute">[ House ]</div>
<ul>${[['collection.html', 'Collection'], ['index.html#finishes', 'Finishes'], ['index.html#order', 'How to order'], ['contact.html', 'Contact']].map(li).join('')}</ul>
</div>
<div class="site-footer__col" data-reveal="up">
<div class="eyebrow mute">[ Contact ]</div>
<ul class="site-footer__plain"><li>[YOUR PHONE]</li><li>[YOUR EMAIL]</li><li>[SHOWROOM ADDRESS]</li><li class="mute">[OPENING HOURS]</li></ul>
</div>
</div>
<div class="site-footer__legal eyebrow mute">
<span>© 2026 Vena</span><span>Marble · Travertine · Serpentine</span><span>Slabs · Tiles · Cut-to-size</span>
</div>
</div>
<div class="site-footer__word" aria-hidden="true" data-footer-word><span>V</span><span>E</span><span>N</span><span>A</span></div>
</footer>`;
}

export function scripts(extra = '') {
  return `<script src="vendor/gsap.min.js"></script>
<script src="vendor/ScrambleTextPlugin.min.js"></script>
<script src="vendor/Flip.min.js"></script>
<script src="vendor/ScrollMagic.min.js"></script>
<script src="vendor/lenis.min.js"></script>
<script src="js/main.js"></script>${extra}`;
}
