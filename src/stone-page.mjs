// Renders one stone detail page from its entry in stones.mjs.
import { head, loader, nav, footer, scripts, btn, arrow } from './partials.mjs';

export function stonePage(s) {
  const light = s.theme === 'light';
  const tone = light ? 'ink' : 'paper';
  const inv = light ? 't-dark' : 't-light'; // the contrasting sections
  const btnTone = light ? 'paper' : 'ink'; // button on the contrasting sections

  const facts = s.facts.map(([k, v]) => `<div class="facts__row" data-row><dt class="eyebrow mute">${k}</dt><dd>${v}</dd></div>`).join('');
  const pins = s.pins.map(([x, y], i) => `<span class="pin" style="left:${x}%;top:${y}%" data-pin>${String(i + 1).padStart(2, '0')}</span>`).join('');
  const read = s.read.map(([t, d], i) => `<li class="read__item" data-read-item><span class="pin pin--static">${String(i + 1).padStart(2, '0')}</span><div class="stack-xs"><h3 class="h4">${t}</h3><p class="small mute">${d}</p></div></li>`).join('');
  const finBtns = s.finishes.map(([id, name, d], i) => `<button type="button" class="finish-btn" data-finish-btn="${id}" aria-pressed="${i === 0}"><span class="eyebrow">${String(i + 1).padStart(2, '0')}</span><span class="stack-xs"><span class="finish-btn__name">${name}</span><span class="finish-btn__sub">${d}</span></span></button>`).join('');
  const finImgs = s.finishes.map(([id, name], i) => `<div class="finish-view__img${i === 0 ? ' is-on' : ''}" data-finish-img="${id}"><img src="assets/img/${s.slug.split('-')[0]}-${id}.jpg" alt="${s.name} with a ${name.toLowerCase()} finish"><span class="tag tag--fixed">${name}</span></div>`).join('');
  const rooms = s.rooms.map(([t, d], i) => `<li class="room"><span class="eyebrow mute">${String(i + 1).padStart(2, '0')}</span><div class="stack-xs"><h3 class="h4">${t}</h3><p class="small mute">${d}</p></div></li>`).join('');
  const pairs = s.pairs.map(([h, img, n, name, d]) => `<a class="pair" href="${h}" data-cursor="Open"><div class="pair__img" data-img-reveal><img src="assets/img/${img}" alt=""><span class="tag tag--light">${n}</span></div><div class="stack-xs"><h3 class="pair__name">${name}</h3><p class="small mute">${d}</p></div></a>`).join('');
  const L = `assets/img/${s.layout}`;

  return `<!doctype html>
<html lang="en">
<head>
${head({ title: `${s.name} — Vena`, description: `${s.name}: ${s.lead.join(' ')}` })}
</head>
<body class="t-${s.theme}" data-page="stone">
${loader()}
${nav({ tone, current: 'collection' })}
<main>

<section class="stone-hero" aria-label="${s.name}" data-stone-hero>
<div class="stone-hero__media"><img src="assets/img/${s.hero}" alt="${s.heroAlt}"></div>
<div class="wrap stone-hero__top eyebrow">
<nav aria-label="Breadcrumb" class="crumb"><a href="collection.html">Collection</a><span aria-hidden="true">/</span><span>${s.name}</span></nav>
<div class="crumb crumb--n">N° ${s.n} / 08</div>
</div>
<div class="wrap stone-hero__bottom">
<h1 class="stone-hero__title${light ? '' : ' stone-hero__title--glow'}" data-split="chars">${s.h1[0]} <span class="serif">${s.h1[1]}</span></h1>
</div>
</section>

<section class="section" aria-label="Character">
<div class="wrap two-col">
<div class="two-col__a stack-l">
<div class="eyebrow mute" data-scramble>[ 01 ] — Character</div>
<p class="h2-sm" data-highlight>${s.lead[0]} <span class="serif">${s.lead[1]}</span></p>
<p class="body mute" data-reveal="up">${s.body}</p>
</div>
<div class="two-col__b stack-l">
<dl class="facts" data-facts>${facts}</dl>
<div class="interest ${inv}" data-reveal="up">
<p class="interest__text">Interested in ${s.name}? <span class="serif">Contact us</span> — tell us about your project and we will take it from there.</p>
${btn({ href: `contact.html?stone=${encodeURIComponent(s.name)}`, label: 'Contact us', tone: btnTone })}
</div>
</div>
</div>
</section>

<section class="section read bt" aria-label="Read the slab" data-read>
<div class="wrap read__grid">
<div class="read__media" data-read-media>
<div class="read__img"><img src="assets/img/${s.detail}" alt="${s.detailAlt}"></div>
${pins}
</div>
<div class="read__text">
<div class="stack-m">
<div class="eyebrow mute" data-scramble>[ 02 ] — Read the slab</div>
<h2 class="h2-lg" data-split="words">What you are <span class="serif">looking at.</span></h2>
</div>
<ol class="read__list">${read}</ol>
</div>
</div>
</section>

<section class="section panel" aria-label="Finishes">
<div class="wrap finish-view">
<div class="finish-view__text">
<div class="stack-m">
<div class="eyebrow mute" data-scramble>[ 03 ] — Finishes</div>
<h2 class="h2-lg" data-split="words">Four <span class="serif">surfaces.</span></h2>
</div>
<div class="finish-btns" role="group" aria-label="Choose a finish" data-stagger>${finBtns}</div>
</div>
<div class="finish-view__stage" data-finish-stage data-img-reveal>${finImgs}</div>
</div>
</section>

<section class="section ${inv}" aria-label="Laying it out">
<div class="wrap stack-xl">
<div class="split-head">
<div class="stack-m">
<div class="eyebrow mute" data-scramble>[ 04 ] — Laying it out</div>
<h2 class="h1" data-split="words">Open the block <span class="serif nowrap">like a book.</span></h2>
</div>
<p class="body mute" data-reveal="up">Slabs sawn one after another from the same block carry the same vein. How they are laid decides the drawing on the wall.</p>
</div>
<div class="matches" data-matches>
<figure class="match" data-match="slip">
<div class="match__grid match__grid--2" style="--lay:url(${L})">
<div class="match__slab"><img src="${L}" alt="Two ${s.name} slabs laid facing the same way"></div>
<div class="match__slab" data-m="slide"><img src="${L}" alt=""></div>
</div>
<figcaption class="stack-xs"><div class="match__name"><span class="eyebrow mute">A</span><span>Slip-matched</span></div><p class="small mute">Slabs side by side, all facing the same way. The vein repeats, like a pattern.</p></figcaption>
</figure>
<figure class="match" data-match="book">
<div class="match__grid match__grid--2">
<div class="match__slab"><img src="${L}" alt="Two ${s.name} slabs mirrored across a seam"></div>
<div class="match__slab match__slab--hinge" data-m="flipx"><img src="${L}" alt="" class="mirror-x"></div>
</div>
<figcaption class="stack-xs"><div class="match__name"><span class="eyebrow mute">B</span><span>Book-matched</span></div><p class="small mute">Every other slab is turned over, like a page. The vein mirrors itself across the seam.</p></figcaption>
</figure>
<figure class="match" data-match="quad">
<div class="match__grid match__grid--4">
<div class="match__slab"><img src="${L}" alt="Four ${s.name} slabs mirrored around one point" style="object-position:${s.quadPos}"></div>
<div class="match__slab match__slab--hinge" data-m="flipx"><img src="${L}" alt="" class="mirror-x" style="object-position:${s.quadPos}"></div>
<div class="match__slab match__slab--hinge-top" data-m="flipy"><img src="${L}" alt="" class="mirror-y" style="object-position:${s.quadPos}"></div>
<div class="match__slab match__slab--hinge-corner" data-m="flipxy"><img src="${L}" alt="" class="mirror-xy" style="object-position:${s.quadPos}"></div>
</div>
<figcaption class="stack-xs"><div class="match__name"><span class="eyebrow mute">C</span><span>Quad-matched</span></div><p class="small mute">Four slabs mirrored around one point. The vein closes into a single figure.</p></figcaption>
</figure>
</div>
</div>
</section>

<section class="section" aria-label="Where it works">
<div class="wrap two-col">
<div class="two-col__narrow stack-m">
<div class="eyebrow mute" data-scramble>[ 05 ] — Where it works</div>
<h2 class="h2-lg" data-split="words">Rooms it was <span class="serif">made for.</span></h2>
</div>
<ul class="rooms" data-rooms>${rooms}</ul>
</div>
</section>

<section class="section bt" aria-label="Pairs with">
<div class="wrap stack-l">
<div class="pairs__head eyebrow"><span data-scramble>[ 06 ] — Pairs with</span><a href="collection.html" class="link-arrow"><span data-roll>All eight stones</span> ${arrow('currentColor', 11)}</a></div>
<div class="pairs" data-stagger>${pairs}</div>
</div>
</section>

<section class="cta ${inv}" aria-label="Contact us">
<div class="wrap cta__grid">
<div class="cta__text">
<div class="eyebrow mute" data-scramble>[ Contact ]</div>
<h2 class="h1 cta__title" data-split="words">Like ${s.name}? <span class="serif nowrap">Contact us.</span></h2>
<p class="body mute" data-reveal="up">Tell us where it is going and roughly how much you need. We will tell you what we have, and show you the slabs.</p>
<div class="cta__row" data-reveal="up">
${btn({ href: `contact.html?stone=${encodeURIComponent(s.name)}`, label: 'Contact us', tone: btnTone })}
<span class="small mute">[YOUR PHONE] · [YOUR EMAIL]</span>
</div>
</div>
<div class="cta__sphere" data-sphere><img src="assets/img/${s.sphere}" alt="A polished sphere of ${s.name} marble"></div>
</div>
</section>

</main>
${footer()}
${scripts()}
</body>
</html>
`;
}
