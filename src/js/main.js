/* ==========================================================================
   Vena — motion
   ScrollMagic owns every scroll trigger, pin and scrub; GSAP draws the tweens;
   Lenis smooths the native scroll that ScrollMagic listens to.
   ========================================================================== */
(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktop = matchMedia('(min-width: 1000px)');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const page = document.body.dataset.page;

  gsap.registerPlugin(ScrambleTextPlugin, Flip);
  gsap.defaults({ ease: 'expo.out', duration: 1.2 });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => (lenis ? lenis.scrollTo(target, { duration: 1.6, ...opts }) : (typeof target === 'number' ? window.scrollTo(0, target) : target.scrollIntoView()));

  const ctrl = new ScrollMagic.Controller({ refreshInterval: 80 });

  /* ---------- Ready gate: nothing plays until the curtain lifts ---------- */
  let isReady = false;
  const queue = [];
  const whenReady = (fn) => (isReady ? fn() : queue.push(fn));
  const release = () => { isReady = true; queue.splice(0).forEach((fn) => fn()); };

  /* ---------- ScrollMagic helpers ---------- */
  // Fire once when the trigger crosses the hook line (0 = top of viewport, 1 = bottom).
  function onEnter(trigger, fn, { hook = 0.86, offset = 0 } = {}) {
    let done = false;
    const scene = new ScrollMagic.Scene({ triggerElement: trigger, triggerHook: hook, offset }).addTo(ctrl);
    scene.on('enter', () => { if (done) return; done = true; whenReady(fn); });
    return scene;
  }
  // Play a paused timeline on enter.
  function playOn(trigger, tl, opts) { tl.pause(); onEnter(trigger, () => tl.play(), opts); return tl; }
  // Map the scene's progress onto a timeline, eased so it glides after the scroll.
  function scrub(trigger, tl, { hook = 1, duration = '100%', offset = 0, smooth = 0.5 } = {}) {
    tl.pause();
    const scene = new ScrollMagic.Scene({ triggerElement: trigger, triggerHook: hook, duration, offset }).addTo(ctrl);
    scene.on('progress', (e) => {
      if (smooth) gsap.to(tl, { progress: e.progress, duration: smooth, ease: 'power3.out', overwrite: true });
      else tl.progress(e.progress);
    });
    return scene;
  }
  // Pin a section once its bottom meets the viewport bottom, for `length` of scroll.
  // Desktop only; on narrow screens the timeline is left finished.
  function pinScrub(section, tl, { length = 1.4, onProgress } = {}) {
    tl.pause();
    const scene = new ScrollMagic.Scene({
      triggerElement: section, triggerHook: 1,
      offset: 0, duration: () => innerHeight * length,
    }).addTo(ctrl);
    const place = () => scene.offset(Math.max(section.offsetHeight, 0));
    const apply = () => {
      if (desktop.matches) { scene.setPin(section, { pushFollowers: true }); scene.enabled(true); place(); scene.refresh(); }
      else { scene.removePin(true); scene.enabled(false); tl.progress(1); onProgress && onProgress(1); }
    };
    scene.on('progress', (e) => {
      gsap.to(tl, { progress: e.progress, duration: 0.35, ease: 'power2.out', overwrite: true });
      onProgress && onProgress(e.progress);
    });
    apply();
    desktop.addEventListener('change', apply);
    addEventListener('resize', () => desktop.matches && place());
    return scene;
  }

  /* ---------- Text splitting (keeps nested spans like .serif intact) ---------- */
  function split(el, { chars = false, mask = true } = {}) {
    if (el._split) return el._split;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const words = [], letters = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 1) { n.setAttribute('aria-hidden', 'true'); walk(n); return; }
        if (n.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'split-word';
          w.style.display = 'inline-block';
          if (chars) {
            [...part].forEach((c) => {
              const s = document.createElement('span');
              s.className = 'split-char';
              s.style.display = 'inline-block';
              s.textContent = c;
              w.append(s); letters.push(s);
            });
          } else w.textContent = part;
          words.push(w);
          if (mask) {
            const m = document.createElement('span');
            m.className = 'split-mask';
            m.setAttribute('aria-hidden', 'true');
            m.append(w); frag.append(m);
          } else { w.setAttribute('aria-hidden', 'true'); frag.append(w); }
        });
        n.replaceWith(frag);
      });
    };
    walk(el);
    return (el._split = { words, chars: letters });
  }

  // Wrap hover-roll labels into two stacked copies.
  $$('[data-roll]').forEach((el) => {
    const t = el.textContent;
    el.classList.add('roll');
    el.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`;
  });

  /* ======================================================================
     Interactions that must work with or without motion
     ====================================================================== */
  initFilters();
  initFinishSwitcher();
  initEnquiry();
  initLinks();

  if (reduce) {
    $('.curtain')?.remove();
    isReady = true;
    return;
  }

  /* ======================================================================
     Global motion
     ====================================================================== */
  initCurtain();
  initHeader();
  initTicker();
  initProgress();
  if (finePointer) { initCursor(); initMagnetic(); initTilt(); }

  const heroQueue = []; // stone-hero title waits for the hero intro

  // Headings: words / chars rise out of their masks.
  $$('[data-split]').forEach((el) => {
    if (el.closest('[data-hero]')) return;
    const mode = el.dataset.split;
    const { words, chars } = split(el, { chars: mode === 'chars' });
    const targets = mode === 'chars' ? chars : words;
    const tl = gsap.timeline().from(targets, {
      yPercent: 115, rotate: mode === 'chars' ? 8 : 4, duration: 1.3,
      stagger: mode === 'chars' ? 0.03 : 0.055, transformOrigin: '0% 100%',
    });
    if (el.closest('[data-stone-hero]')) return heroQueue.push(tl.pause());
    playOn(el, tl);
  });

  // Paragraph headings that light up word by word as you scroll.
  $$('[data-highlight]').forEach((el) => {
    const { words } = split(el, { mask: false });
    const tl = gsap.timeline().fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, duration: 0.5, ease: 'none' });
    scrub(el, tl, { hook: 0.85, duration: () => Math.max(el.offsetHeight + innerHeight * 0.35, 200), smooth: 0.3 });
  });

  // Bracketed labels decode themselves.
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    gsap.set(el, { opacity: 0 });
    onEnter(el, () => gsap.to(el, {
      opacity: 1, duration: 1.1, ease: 'none',
      scrambleText: { text, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', revealDelay: 0.25, speed: 0.6 },
    }), { hook: 0.92 });
  });

  // Generic rise-in.
  $$('[data-reveal]').forEach((el) => {
    playOn(el, gsap.timeline().from(el, { y: 48, opacity: 0, duration: 1.4 }), { hook: 0.9 });
  });

  // Children cascade in.
  $$('[data-stagger]').forEach((el) => {
    if (el.closest('[data-hero]')) return;
    playOn(el, gsap.timeline().from(el.children, { y: 36, opacity: 0, stagger: 0.09, duration: 1.2 }), { hook: 0.9 });
  });

  // Image wipe: frame opens from the bottom while the photo settles.
  $$('[data-img-reveal]').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline()
      .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
      .from(img, { scale: 1.35, duration: 2, ease: 'expo.out' }, 0.1);
    playOn(el, tl, { hook: 0.9 });
  });

  // Parallax drift on oversized images.
  $$('[data-parallax]').forEach((img) => {
    const amt = parseFloat(img.dataset.parallax) || 10;
    const box = img.parentElement;
    scrub(box, gsap.timeline().fromTo(img, { yPercent: -amt }, { yPercent: amt, ease: 'none' }),
      { hook: 1, duration: () => innerHeight + box.offsetHeight, smooth: 0 });
  });

  // Rules draw themselves.
  $$('[data-line]').forEach((el) => {
    playOn(el, gsap.timeline().from(el, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.6, ease: 'expo.inOut' }), { hook: 0.92 });
  });

  // Numbers count up.
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count, pad = +el.dataset.pad || 0, o = { v: 0 };
    el.textContent = '0'.padStart(pad, '0');
    onEnter(el, () => gsap.to(o, {
      v: to, duration: 1.6, ease: 'power3.out',
      onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(pad, '0')),
    }), { hook: 0.92 });
  });

  // Polished spheres turn as they pass, and keep floating.
  $$('[data-sphere]').forEach((wrap) => {
    const img = wrap.querySelector('img');
    gsap.to(img, { y: -14, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    scrub(wrap, gsap.timeline()
      .fromTo(wrap, { rotate: -50, scale: 0.72, y: 120 }, { rotate: 30, scale: 1, y: -40, ease: 'none' }),
    { hook: 1, duration: () => innerHeight + wrap.offsetHeight, smooth: 0.6 });
  });

  initFooter();

  /* ---------- Page-specific ---------- */
  if (page === 'home') initHome();
  if (page === 'collection') initCollection();
  if (page === 'contact') initContact();
  if (page === 'stone') initStone();

  /* ======================================================================
     Loader / page transitions
     ====================================================================== */
  function initCurtain() {
    const curtain = $('.curtain');
    if (!curtain) return release();
    curtain.classList.add('is-managed');
    lenis && lenis.stop();
    const letters = $$('.curtain__mark span', curtain);
    const bar = $('.curtain__bar i', curtain);
    const first = !sessionStorage.getItem('vena-seen');
    sessionStorage.setItem('vena-seen', '1');

    const tl = gsap.timeline({ delay: 0.1 });
    if (first) {
      tl.from(letters, { yPercent: 110, duration: 1.1, stagger: 0.07, ease: 'expo.out' })
        .to(bar, { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 0.15)
        .to(letters, { backgroundPosition: '80% 44%', duration: 1.4, ease: 'power1.inOut' }, 0)
        .to(letters, { yPercent: -110, duration: 0.7, stagger: 0.04, ease: 'expo.in' }, '+=0.1')
        .to(bar.parentElement, { opacity: 0, duration: 0.3 }, '<');
    } else {
      gsap.set([letters, bar.parentElement], { opacity: 0 });
    }
    tl.to(curtain, { clipPath: 'inset(0% 0% 100% 0%)', duration: first ? 1.1 : 0.9, ease: 'expo.inOut' }, first ? '-=0.25' : 0)
      .add(() => { lenis && lenis.start(); release(); }, first ? '-=0.75' : '-=0.6')
      .set(curtain, { visibility: 'hidden' });

    // Coming back via the back button: never leave the curtain down.
    addEventListener('pageshow', (e) => {
      if (e.persisted) gsap.set(curtain, { clipPath: 'inset(0% 0% 100% 0%)', visibility: 'hidden' });
    });
  }

  function leaveTo(href) {
    const curtain = $('.curtain');
    if (!curtain || reduce) return (location.href = href);
    gsap.set(curtain, { visibility: 'visible', clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set($$('.curtain__mark span, .curtain__bar', curtain), { opacity: 0 });
    gsap.to(curtain, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut', onComplete: () => (location.href = href) });
  }

  function initLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const samePage = url.pathname === location.pathname && url.search === location.search;
      if (samePage && url.hash) {
        const t = document.getElementById(url.hash.slice(1));
        if (t) { e.preventDefault(); scrollTo(t); history.replaceState(null, '', url.hash); }
        return;
      }
      if (samePage) return;
      e.preventDefault();
      leaveTo(url.href);
    });
  }

  /* ======================================================================
     Chrome
     ====================================================================== */
  function initHeader() {
    const header = $('.site-header');
    if (!header) return;
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      const down = y > last;
      header.classList.toggle('is-hidden', down && y > header.offsetHeight * 2);
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    // Nav arrives with the page.
    gsap.set($$('.nav > *', header), { y: -30, opacity: 0 });
    whenReady(() => gsap.to($$('.nav > *', header), { y: 0, opacity: 1, stagger: 0.08, duration: 1.2, delay: 0.15 }));
  }

  function initTicker() {
    const track = $('.ticker__track');
    if (!track) return;
    const loop = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    // Scroll speed pushes the ribbon along, and scrolling up reverses it.
    let dir = 1, boost = 0;
    if (lenis) lenis.on('scroll', ({ velocity }) => {
      if (velocity) dir = Math.sign(velocity);
      boost = Math.max(boost, Math.min(Math.abs(velocity) * 0.35, 9));
    });
    gsap.ticker.add(() => { boost *= 0.93; loop.timeScale(dir * (1 + boost)); });
  }

  function initProgress() {
    const bar = $('.progress i');
    if (!bar) return;
    const set = gsap.quickSetter(bar, 'scaleX');
    const update = () => set(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    addEventListener('scroll', update, { passive: true });
    update();
  }

  function initCursor() {
    const c = $('.cursor');
    if (!c) return;
    document.documentElement.classList.add('has-cursor');
    const label = $('.cursor__label', c);
    const x = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
    const y = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
    gsap.set(c, { scale: 0 });
    addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); gsap.to(c, { scale: c._big ? c._big : 1, duration: 0.4, overwrite: 'auto' }); }, { passive: true });
    document.addEventListener('pointerleave', () => gsap.to(c, { scale: 0, duration: 0.3 }));
    const grow = (el) => {
      const text = el.dataset.cursor;
      if (text) { label.textContent = text; c._big = 1; gsap.to(c, { width: 78, height: 78, margin: '-39px 0 0 -39px', borderRadius: 2, duration: 0.5 }); gsap.to(label, { opacity: 1, duration: 0.3, delay: 0.1 }); }
      else { c._big = 3; gsap.to(c, { scale: 3, duration: 0.4 }); }
    };
    const shrink = () => { c._big = 0; gsap.to(c, { width: 12, height: 12, margin: '-6px 0 0 -6px', scale: 1, duration: 0.45 }); gsap.to(label, { opacity: 0, duration: 0.15 }); };
    document.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-cursor], a, button, label, select'); if (el && !el.contains(e.relatedTarget)) grow(el); });
    document.addEventListener('pointerout', (e) => { const el = e.target.closest('[data-cursor], a, button, label, select'); if (el && !el.contains(e.relatedTarget)) shrink(); });
  }

  function initMagnetic() {
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.28);
        y((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, .4)', overwrite: true }); });
    });
  }

  // Cards lean toward the pointer.
  function initTilt() {
    $$('.stone-card__media, .tile, .pair__img').forEach((el) => {
      gsap.set(el, { transformPerspective: 900 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 9);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 9);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  function initFooter() {
    const f = $('[data-footer]');
    if (!f) return;
    const word = $$('[data-footer-word] span', f);
    scrub(f, gsap.timeline()
      .fromTo(word, { yPercent: 105, rotate: 6 }, { yPercent: 0, rotate: 0, stagger: 0.08, ease: 'power2.out' })
      .fromTo(word, { backgroundPosition: '10% 44%' }, { backgroundPosition: '90% 44%', ease: 'none' }, 0),
    { hook: 1, duration: () => Math.min(f.offsetHeight, innerHeight), smooth: 0.5 });
    const legal = $('.site-footer__legal', f);
    playOn(legal, gsap.timeline().from(legal.children, { y: 20, opacity: 0, stagger: 0.1 }), { hook: 0.98 });
  }

  /* ======================================================================
     Home
     ====================================================================== */
  function initHome() {
    const hero = $('[data-hero]');
    const book = $('[data-book]', hero);
    const [pl, pr] = $$('.hero__page', hero);
    const word = $('[data-hero-word]', hero);
    const sub = $('[data-hero-sub]', hero);
    const { chars } = split(word, { chars: true });
    const subSplit = split(sub);
    const wires = $$('.hero__wires span', hero);
    const shadow = $('.hero__shadow', hero);
    const sides = $$('[data-hero-intro], .hero__index li, .hero__scroll', hero);

    // Intro: wires drop, the book opens, the word rises.
    const intro = gsap.timeline({ paused: true })
      .from(wires, { scaleY: 0, duration: 1, stagger: 0.1, ease: 'expo.inOut' })
      .from(pl, { rotationY: 92, duration: 1.8, ease: 'expo.out' }, 0.35)
      .from(pr, { rotationY: -92, duration: 1.8, ease: 'expo.out' }, 0.35)
      .from($$('img', book), { scale: 1.25, duration: 2.2 }, 0.35)
      .from(shadow, { opacity: 0, scaleX: 0.3, duration: 1.6 }, 0.6)
      .from(chars, { yPercent: 105, duration: 1.3, stagger: 0.06 }, 0.65)
      .from(subSplit.words, { yPercent: 115, rotate: 5, duration: 1.1, stagger: 0.06 }, 1)
      .from(sides, { y: 34, opacity: 0, duration: 1.2, stagger: 0.07 }, 0.8);
    whenReady(() => intro.play());

    gsap.fromTo('.hero__scroll-bar i', { xPercent: -100 }, { xPercent: 100, duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 0.3 });

    // Scrolling away: the book opens wider and drifts, the word spreads.
    scrub(hero, gsap.timeline()
      .to(book, { y: () => innerHeight * 0.18, ease: 'none' }, 0)
      .to(pl, { rotationY: -24, ease: 'none' }, 0)
      .to(pr, { rotationY: 24, ease: 'none' }, 0)
      .to($$('img', book), { yPercent: 6, ease: 'none' }, 0)
      .to(word, { letterSpacing: '0.06em', y: -60, ease: 'none' }, 0)
      .to(sub, { y: -30, opacity: 0, ease: 'none' }, 0)
      .to($$('.hero__side', hero), { y: -80, opacity: 0, ease: 'none' }, 0)
      .to(wires, { scaleY: 2.2, transformOrigin: '50% 0%', ease: 'none' }, 0),
    { hook: 0, duration: () => hero.offsetHeight, smooth: 0.4 });

    // The house: three cards swing in.
    const cards = $$('[data-cards] .card');
    playOn('[data-cards]', gsap.timeline()
      .from(cards, { x: 120, rotationY: -18, opacity: 0, duration: 1.4, stagger: 0.12, transformOrigin: '100% 50%', clearProps: 'transform,opacity' })
      .from($$('.card__thumb--tiles div'), { scale: 0, duration: 0.8, stagger: { each: 0.04, from: 'random' }, ease: 'back.out(2)' }, 0.4)
      .from($$('[data-cards] .card__thumb:not(.card__thumb--tiles)'), { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.inOut' }, 0.3),
    { hook: 0.8 });

    // The collection: tiles flip down like slabs being turned, in a scattered order.
    const checker = $('[data-checker]');
    const tiles = $$('.tile', checker), voids = $$('.void', checker);
    playOn(checker, gsap.timeline()
      .from(voids, { opacity: 0, duration: 1, stagger: { each: 0.04, from: 'random' }, ease: 'power2.out' })
      .from(tiles, { rotationX: -100, opacity: 0, transformOrigin: '50% 0%', duration: 1.5, stagger: { each: 0.09, from: 'random' }, ease: 'expo.out' }, 0)
      .from($$('.tag', checker), { xPercent: -120, opacity: 0, duration: 0.8, stagger: 0.03 }, 0.7),
    { hook: 0.75 });
    // Images drift inside their tiles.
    tiles.forEach((t, i) => {
      const img = $('img', t);
      gsap.set(img, { scale: 1.2 });
      scrub(checker, gsap.timeline().fromTo(img, { yPercent: i % 2 ? -8 : 8 }, { yPercent: i % 2 ? 8 : -8, ease: 'none' }),
        { hook: 1, duration: () => innerHeight + checker.offsetHeight, smooth: 0 });
    });
    // Pin the left column against the grid on desktop.
    const col = $('[data-pin-col]');
    const colScene = new ScrollMagic.Scene({ triggerElement: col, triggerHook: 0, offset: -40, duration: () => Math.max(0, checker.offsetHeight - col.offsetHeight) }).addTo(ctrl);
    const colApply = () => { if (desktop.matches) { colScene.setPin(col, { pushFollowers: false }); colScene.enabled(true); } else { colScene.removePin(true); colScene.enabled(false); } };
    colApply(); desktop.addEventListener('change', colApply);

    // Finishes: pinned; four surfaces are uncovered one after another.
    const fin = $('[data-finishes]');
    const figs = $$('[data-finish]', fin);
    const ftl = gsap.timeline();
    figs.forEach((f, i) => {
      const box = $('.finish__img', f), img = $('img', box), cap = $('figcaption', f);
      ftl.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.inOut' }, i * 0.55)
        .fromTo(img, { scale: 1.5, yPercent: 10 }, { scale: 1, yPercent: 0, duration: 1.3, ease: 'power2.out' }, i * 0.55)
        .fromTo(cap, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }, i * 0.55 + 0.4);
    });
    pinScrub(fin, ftl, { length: 1.3 });

    // Quarry: the window opens onto the mountain.
    const q = $('[data-quarry]');
    const frame = $('.quarry__frame', q), qimg = $('img', frame);
    scrub(q, gsap.timeline()
      .fromTo(frame, { clipPath: 'inset(14% 9% 14% 9%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
      .fromTo(qimg, { scale: 1.35 }, { scale: 1, ease: 'none' }, 0),
    { hook: 1, duration: () => q.offsetHeight, smooth: 0.3 });
    scrub(q, gsap.timeline().fromTo(qimg, { yPercent: -4 }, { yPercent: 6, ease: 'none' }),
      { hook: 1, duration: () => innerHeight + q.offsetHeight, smooth: 0 });
    const card = $('[data-quarry-card]', q);
    playOn(card, gsap.timeline().from(card, { y: 120, opacity: 0, duration: 1.5 }), { hook: 0.95 });

    // Steps.
    playOn('[data-steps]', gsap.timeline().from($$('[data-steps] .step > :not(.step__line)'), { y: 40, opacity: 0, stagger: 0.07, duration: 1.2 }, 0.3), { hook: 0.85 });
  }

  /* ======================================================================
     Collection
     ====================================================================== */
  function initCollection() {
    $$('[data-card]').forEach((card) => {
      const media = $('.stone-card__media', card);
      const img = $('img', media);
      const info = $('.stone-card__info', card);
      const tl = gsap.timeline()
        .fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
        .from($$('.tag, .stone-card__go', media), { scale: 0, duration: 0.9, stagger: 0.1, ease: 'back.out(2)' }, 0.9)
        .from(info.children, { y: 26, opacity: 0, stagger: 0.08, duration: 1.1 }, 0.6);
      if (img) tl.from(img, { scale: 1.4, duration: 2.2 }, 0.1);
      playOn(card, tl, { hook: 0.92 });
    });
  }

  function initFilters() {
    const group = $('[data-filters]');
    if (!group) return;
    const cards = $$('[data-card]');
    group.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      const fam = b.dataset.filter;
      $$('[data-filter]', group).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const state = reduce ? null : Flip.getState(cards);
      cards.forEach((c) => { c.hidden = !(fam === 'all' || c.dataset.family === fam || c.dataset.family === 'any'); });
      if (!state) return;
      Flip.from(state, {
        duration: 0.9, ease: 'expo.inOut', stagger: 0.04, absolute: true, nested: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, stagger: 0.05, delay: 0.25 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.5, ease: 'power2.in' }),
      });
    });
  }

  /* ======================================================================
     Contact
     ====================================================================== */
  function initContact() {
    const panel = $('[data-contact-panel]');
    const form = $('[data-enquiry]', panel);
    const tl = gsap.timeline()
      .fromTo(panel, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from($('.contact__bg', panel), { scale: 1.3, duration: 2.2 }, 0.2)
      .from(form.children, { y: 30, opacity: 0, stagger: 0.07, duration: 1.1 }, 0.7);
    tl.pause();
    whenReady(() => tl.play());
  }

  function initEnquiry() {
    const form = $('[data-enquiry]');
    if (!form) return;
    const sent = $('[data-sent]');
    const err = $('.enquiry__error', form);
    const pre = new URLSearchParams(location.search).get('stone');
    if (pre) { const opt = [...form.stone.options].find((o) => o.text === pre); if (opt) form.stone.value = opt.text; }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const req = ['name', 'email', 'project'].map((n) => form.elements[n]);
      const bad = req.filter((f) => !f.value.trim() || (f.type === 'email' && !f.checkValidity()));
      req.forEach((f) => { f.classList.toggle('is-invalid', bad.includes(f)); f.setAttribute('aria-invalid', String(bad.includes(f))); });
      if (bad.length) {
        err.hidden = false;
        bad[0].focus();
        if (!reduce) gsap.fromTo(bad.map((f) => f.closest('.field-wrap')), { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1.2, .3)' });
        return;
      }
      err.hidden = true;
      const title = $('[data-sent-title]', sent);
      if (reduce) { form.hidden = true; sent.hidden = false; sent.focus?.(); return; }
      gsap.timeline()
        .to(form.children, { y: -30, opacity: 0, stagger: 0.04, duration: 0.5, ease: 'power2.in' })
        .add(() => {
          form.hidden = true; sent.hidden = false;
          const { words } = split(title);
          gsap.timeline()
            .from(sent.children, { y: 30, opacity: 0, stagger: 0.1, duration: 1 })
            .from(words, { yPercent: 115, rotate: 5, stagger: 0.07, duration: 1.2 }, 0.1);
        });
    });
    $('[data-again]', sent).addEventListener('click', () => {
      form.reset();
      sent.hidden = true; form.hidden = false;
      gsap.fromTo(form.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 1 });
      form.elements.name.focus();
    });
  }

  /* ======================================================================
     Stone pages
     ====================================================================== */
  function initStone() {
    const hero = $('[data-stone-hero]');
    const media = $('.stone-hero__media', hero), img = $('img', media);
    const title = $('.stone-hero__title', hero);
    const intro = gsap.timeline({ paused: true })
      .fromTo(media, { clipPath: 'inset(10% 10% 10% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' })
      .from(img, { scale: 1.4, duration: 2.6, ease: 'expo.out' }, 0)
      .from($$('.crumb', hero), { y: -40, opacity: 0, stagger: 0.1, duration: 1.1 }, 0.9);
    heroQueue.forEach((t) => intro.add(t.paused(false), 0.8));
    whenReady(() => intro.play());

    scrub(hero, gsap.timeline()
      .to(img, { yPercent: 12, scale: 1.08, ease: 'none' }, 0)
      .to(title, { yPercent: -60, opacity: 0.1, ease: 'none' }, 0),
    { hook: 0, duration: () => hero.offsetHeight, smooth: 0.3 });

    // Facts table draws its rules row by row.
    const rows = $$('[data-row]');
    playOn('[data-facts]', gsap.timeline()
      .fromTo(rows, { '--line-x': 0 }, { '--line-x': 1, duration: 1.2, stagger: 0.08, ease: 'expo.inOut' })
      .from(rows.flatMap((r) => [...r.children]), { y: 16, opacity: 0, stagger: 0.04, duration: 0.9 }, 0.2),
    { hook: 0.88 });

    initRead();
    initMatches();

    // Rooms list.
    const rooms = $$('[data-rooms] .room');
    playOn('[data-rooms]', gsap.timeline().from(rooms, { y: 40, opacity: 0, stagger: 0.08, duration: 1.2 }), { hook: 0.85 });
  }

  // "Read the slab": pinned; the photo zooms to each numbered mark in turn.
  function initRead() {
    const sec = $('[data-read]');
    if (!sec) return;
    const pins = $$('[data-pin]', sec), items = $$('[data-read-item]', sec);
    const img = $('.read__img img', sec);
    playOn(sec, gsap.timeline()
      .from($('.read__img', sec), { clipPath: 'inset(0% 100% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from(img, { scale: 1.4, duration: 2 }, 0)
      .from(pins, { scale: 0, rotate: -90, duration: 0.9, stagger: 0.15, ease: 'back.out(2.2)' }, 0.9)
      .fromTo(items, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.1, duration: 1.1, clearProps: 'opacity,visibility' }, 0.6),
    { hook: 0.75 });

    let current = -2;
    const focus = (i) => {
      if (i === current) return;
      current = i;
      sec.classList.toggle('read--active', i >= 0);
      pins.forEach((p, k) => p.classList.toggle('is-active', k === i));
      items.forEach((p, k) => p.classList.toggle('is-active', k === i));
      if (i < 0) return gsap.to(img, { scale: 1, duration: 1.4, ease: 'expo.inOut', overwrite: 'auto' });
      const p = pins[i];
      gsap.to(img, { scale: 1.55, transformOrigin: `${p.style.left} ${p.style.top}`, duration: 1.4, ease: 'expo.inOut', overwrite: 'auto' });
      gsap.fromTo(p, { scale: 1.6 }, { scale: 1, duration: 0.8, ease: 'back.out(3)' });
    };
    // Pins sit on the photo, so they ride the zoom with it.
    const sync = () => {
      const s = gsap.getProperty(img, 'scale');
      const [ox, oy] = (img.style.transformOrigin || '50% 50%').split(' ').map(parseFloat);
      pins.forEach((p) => {
        const px = parseFloat(p.style.left), py = parseFloat(p.style.top);
        gsap.set(p, { xPercent: 0, x: ((px - ox) * (s - 1)) / 100 * img.offsetWidth, y: ((py - oy) * (s - 1)) / 100 * img.offsetHeight });
      });
    };
    gsap.ticker.add(sync);

    pinScrub(sec, gsap.timeline().to({}, { duration: 1 }), {
      length: 1.6,
      onProgress: (p) => focus(p < 0.06 || p > 0.97 ? -1 : Math.min(2, Math.floor(((p - 0.06) / 0.91) * 3))),
    });
    // Hovering a line in the list points at its mark too.
    items.forEach((it, i) => {
      it.addEventListener('pointerenter', () => !desktop.matches && focus(i));
      it.addEventListener('pointerleave', () => !desktop.matches && focus(-1));
    });
  }

  // "Laying it out": slabs slide, turn over like pages and close into a figure.
  function initMatches() {
    const wrap = $('[data-matches]');
    if (!wrap) return;
    const back = { backfaceVisibility: 'hidden' };
    $$('[data-m]', wrap).forEach((el) => gsap.set(el, back));
    const slip = $('[data-match="slip"] [data-m="slide"]', wrap);
    const book = $('[data-match="book"] [data-m="flipx"]', wrap);
    const q = $('[data-match="quad"]', wrap);
    const tl = gsap.timeline()
      .from($$('.match__grid', wrap), { opacity: 0, y: 60, stagger: 0.15, duration: 0.6, ease: 'power2.out' }, 0)
      .from(slip, { xPercent: -102, opacity: 0, duration: 1, ease: 'power3.inOut' }, 0.3)
      .from(book, { rotationY: -180, duration: 1.2, ease: 'power3.inOut' }, 0.45)
      .from($('[data-m="flipx"]', q), { rotationY: -180, duration: 1, ease: 'power3.inOut' }, 0.6)
      .from($('[data-m="flipy"]', q), { rotationX: 180, duration: 1, ease: 'power3.inOut' }, 0.95)
      .from($('[data-m="flipxy"]', q), { rotationX: 180, rotationY: -180, duration: 1, ease: 'power3.inOut' }, 1.3)
      .from($$('figcaption', wrap), { y: 30, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power2.out' }, 0.5);
    scrub(wrap, tl, { hook: 0.9, duration: () => wrap.offsetHeight + innerHeight * 0.25, smooth: 0.5 });
  }

  // Finish picker: the new surface wipes across the old.
  function initFinishSwitcher() {
    const stage = $('[data-finish-stage]');
    if (!stage) return;
    const btns = $$('[data-finish-btn]');
    let z = 2;
    btns.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const next = $(`[data-finish-img="${b.dataset.finishBtn}"]`, stage);
      const others = $$('[data-finish-img]', stage).filter((x) => x !== next);
      next.classList.add('is-on');
      next.style.zIndex = ++z;
      if (reduce) { others.forEach((o) => o.classList.remove('is-on')); return; }
      gsap.timeline({ onComplete: () => others.forEach((o) => o.classList.remove('is-on')) })
        .fromTo(next, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' })
        .fromTo($('img', next), { scale: 1.25, xPercent: -6 }, { scale: 1, xPercent: 0, duration: 1.6, ease: 'expo.out' }, 0)
        .fromTo($('.tag', next), { xPercent: -130 }, { xPercent: 0, duration: 0.9 }, 0.45);
    }));
  }
})();
