// Static build: expands <!--@partial attr="…"--> directives in src/pages,
// renders the stone pages from src/stones.mjs, and copies assets + vendor libs to dist/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { head, loader, nav, footer, scripts, btn, arrow } from './src/partials.mjs';
import { stones } from './src/stones.mjs';
import { stonePage } from './src/stone-page.mjs';

const OUT = 'dist';

function stonecard(a) {
  return `<a class="stone-card" href="${a.href}" data-card data-family="${a.fam}" data-cursor="Open">
<div class="stone-card__media" style="background:${a.bg}">
<img src="assets/img/${a.img}" alt="${a.alt}" style="object-position:${a.pos}" data-parallax="6">
<span class="tag tag--${a.tag}">${a.n}</span>
<span class="stone-card__go stone-card__go--${a.tag}" aria-hidden="true">${arrow('currentColor', 13)}</span>
</div>
<div class="stone-card__info">
<div class="stone-card__row"><h2 class="stone-card__name">${a.name}</h2><span class="eyebrow mute">${a.origin}</span></div>
<p class="small mute">${a.text}</p>
</div>
</a>`;
}

const partials = {
  head, loader, nav, footer, btn, stonecard,
  scripts: () => scripts(),
  arrow: () => arrow(),
};

function expand(html) {
  return html.replace(/<!--@(\w+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (m, name, attrs) => {
    const fn = partials[name];
    if (!fn) throw new Error(`Unknown partial: ${name}`);
    const a = {};
    for (const [, k, v] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) a[k] = v;
    return fn(a);
  });
}

for (const f of (existsSync(OUT) ? readdirSync(OUT) : [])) rmSync(join(OUT, f), { recursive: true, force: true });
mkdirSync(join(OUT, 'vendor'), { recursive: true });

for (const f of readdirSync('src/pages')) {
  writeFileSync(join(OUT, f), expand(readFileSync(join('src/pages', f), 'utf8')));
}
for (const s of stones) writeFileSync(join(OUT, `${s.slug}.html`), stonePage(s));

cpSync('src/assets', join(OUT, 'assets'), { recursive: true });
cpSync('src/css', join(OUT, 'css'), { recursive: true });
cpSync('src/js', join(OUT, 'js'), { recursive: true });

const vendor = {
  'gsap.min.js': 'node_modules/gsap/dist/gsap.min.js',
  'ScrambleTextPlugin.min.js': 'node_modules/gsap/dist/ScrambleTextPlugin.min.js',
  'Flip.min.js': 'node_modules/gsap/dist/Flip.min.js',
  'ScrollMagic.min.js': 'node_modules/scrollmagic/scrollmagic/minified/ScrollMagic.min.js',
  'lenis.min.js': 'node_modules/lenis/dist/lenis.min.js',
};
for (const [name, src] of Object.entries(vendor)) cpSync(src, join(OUT, 'vendor', name));

console.log(`Built ${readdirSync(OUT).filter((f) => f.endsWith('.html')).length} pages → ${OUT}/`);
