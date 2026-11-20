/* CookItUp liquid sidebar: the animated 3D navigation bar.
   Drives (and is driven by) the app's own router: links carry data-page, and app.js
   announces page changes with a "cookitup:page" event. */

export const LSB_ICONS = {
  dashboard: '<path d="M3 3h8v8H3zm10 0h8v5h-8zM3 13h8v8H3zm10-3h8v11h-8z"/>',
  profile: '<circle cx="12" cy="7.5" r="4.2"/><path d="M3.5 21c0-4.6 3.8-8 8.5-8s8.5 3.4 8.5 8z"/>',
  household: '<circle cx="12" cy="7" r="3.3"/><circle cx="5.2" cy="9" r="2.6"/><circle cx="18.8" cy="9" r="2.6"/><path d="M12 11.4c-3.6 0-6.4 2.2-6.4 5v3.2h12.8v-3.2c0-2.8-2.8-5-6.4-5z"/><path d="M5.2 12c-2.2 0-4 1.4-4 3.2v2.6h3.4v-1.4c0-1.6.7-3 1.9-4a5 5 0 0 0-1.3-.4zM18.8 12c2.2 0 4 1.4 4 3.2v2.6h-3.4v-1.4c0-1.6-.7-3-1.9-4 .5-.3.9-.4 1.3-.4z"/>',
  inventory: '<path fill-rule="evenodd" d="M3 4h18a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v1h16V6zm2 4v9h12v-9zm3 2h6v2H9z"/>',
  recipes: '<path d="M6.2 2.5h1.6v6.3a1.4 1.4 0 0 0 1.4 1.4V2.5h1.6v7.7a1.4 1.4 0 0 0 1.4-1.4V2.5H13.800v6.9c0 1.900-1.300 3.400-3.100 3.700v8.400H9.200v-8.400C7.400 12.800 6.200 11.300 6.200 9.400zM17.500 2.500c1.700 0 3 2.600 3 6.100 0 1.800-.9 3-2.100 3.300v10.100h-1.600V2.500z"/>',
  settings: '<path fill-rule="evenodd" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM10.4 2h3.2l.5 2.4 1.7.7 2.1-1.3 2.300 2.300-1.300 2.100.7 1.700 2.400.5v3.200l-2.400.5-.7 1.700 1.300 2.100-2.300 2.300-2.100-1.300-1.700.7-.5 2.400h-3.200l-.5-2.400-1.700-.7-2.100 1.300-2.300-2.300 1.300-2.100-.7-1.700L2 13.600v-3.200l2.400-.5.7-1.700-1.300-2.100 2.300-2.300 2.100 1.300 1.700-.7z"/>'
};

export function LiquidSidebar(root, items, opts = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  /* Colours come from CSS variables (see liquid-theme.css), so the theme switch restyles the bar live.
     Pass opts.theme only to override them for one instance. */
  const T = opts.theme || {};
  const setVar = (name, v) => { if (v) root.style.setProperty(name, v); };
  if (T.accent) { setVar('--lsb-accent-1', T.accent[0]); setVar('--lsb-accent-2', T.accent[1]); setVar('--lsb-accent-3', T.accent[2]); }
  if (T.barFront) { setVar('--lsb-front-a', T.barFront[0]); setVar('--lsb-front-b', T.barFront[1]); }
  if (T.barSide) { setVar('--lsb-side-a', T.barSide[0]); setVar('--lsb-side-b', T.barSide[1]); }
  setVar('--lsb-icon', T.icon); setVar('--lsb-bubble-icon', T.bubbleIcon);
  const hex = c => { c = c.replace('#', ''); if (c.length === 3) c = c.replace(/./g, m => m + m); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)); };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')'; };

  const GIF = opts.look !== 'flat';
  const K = GIF ? 1.5 : 1;
  const BX = GIF ? 50 : 34, BW = GIF ? 118 : 84, DEPTH = GIF ? 62 : 40;
  const PAD = GIF ? 520 : 56, R = GIF ? 34 : 30, N = GIF ? 24 : 14;
  /* Full-height mode: the bar spans the whole viewport (and bleeds a little past the top and bottom
     so its rounded ends are never visible); the icons are spread evenly between the logo and footer. */
  const FULL = !!opts.fullHeight, BLEED = FULL ? 60 : 0;
  let SP = opts.spacing || (GIF ? 138 : 86), PT = opts.padTop ?? PAD, PB = opts.padBottom ?? PAD, H;
  if (FULL) {
    H = (opts.viewportHeight || innerHeight) + BLEED * 2;
    const regionTop = BLEED + 76, regionBottom = H - BLEED - 128;     // between the logo and the footer controls
    const avail = regionBottom - regionTop;
    SP = opts.spacing || Math.max(60, Math.min(100, avail / items.length));
    PT = regionTop + Math.max(0, (avail - SP * items.length) / 2);
  } else H = items.length * SP + PT + PB;
  const PW = BX + BW + 90, X2 = BX + BW;
  const observers = []; let dead = false;
  const yOf = i => PT + SP / 2 + i * SP;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const uid = Math.random().toString(36).slice(2, 7), gid = 'lsbg' + uid, pid = 'lsbp' + uid;
  const IS = GIF ? 58 : 30, BI = GIF ? 50 : 30, BD = GIF ? 92 : 58;
  const iconRot = GIF ? (opts.iconRotate ?? 35) : 0;
  const hits = [];

  /* ---------- DOM ---------- */
  root.innerHTML = (GIF && opts.floor !== false ? '<div class="lsb-floor"></div>' : '') +
    '<div class="lsb-plane" style="width:' + PW + 'px;height:' + H + 'px">' +
    '<div class="lsb-bar3d"><svg class="lsb-layer" width="' + PW + '" height="' + H + '"></svg></div><div class="lsb-icons"></div>' +
    '<div class="lsb-bubble"><svg viewBox="0 0 24 24"></svg><svg viewBox="0 0 24 24"></svg></div></div>';
  const plane = root.querySelector('.lsb-plane'), bar3d = root.querySelector('.lsb-bar3d'), layerSvg = root.querySelector('.lsb-layer');

  /* Projection of a point on the flat bar to where the tilted bar draws it on screen. The bar is tilted
     around its left edge (rotateY) with perspective; everything that sits ON the bar is placed with this
     instead of being tilted itself, so icons, logo and buttons stay perfectly straight. */
  const TILT = opts.tilt ?? -14, PERSP = 900, th = TILT * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th);
  if (!GIF) { bar3d.style.transform = 'perspective(' + PERSP + 'px) rotateY(' + TILT + 'deg)'; bar3d.style.transformOrigin = '0 50%'; }
  const proj = (x, yy) => { if (GIF) return { x, y: yy, s: 1 }; const z = -x * st, k = PERSP / (PERSP - z); return { x: x * ct * k, y: H / 2 + (yy - H / 2) * k, s: k }; };
  const iconsEl = root.querySelector('.lsb-icons'), bubble = root.querySelector('.lsb-bubble');
  const [bA, bB] = bubble.querySelectorAll('svg');
  const svgOf = it => it.svg || LSB_ICONS[it.icon] || '';

  if (GIF) {
    root.classList.add('gif');
    const ox = BX + BW / 2 - 4, oy = yOf(1), a = opts.anchor || { x: 62, y: 193 };
    plane.style.left = (a.x - ox) + 'px'; plane.style.top = (a.y - oy) + 'px';
    plane.style.transformOrigin = ox + 'px ' + oy + 'px';
    plane.style.transform = opts.transform || 'rotateZ(-36deg) rotateX(21deg)';
  }
  bubble.style.width = bubble.style.height = BD + 'px'; bubble.style.margin = (-BD / 2) + 'px 0 0 ' + (-BD / 2) + 'px';
  [bA, bB].forEach(b => {
    b.style.cssText = 'position:absolute;left:50%;top:50%;width:' + BI + 'px;height:' + BI + 'px;margin:' + (-BI / 2) + 'px 0 0 ' + (-BI / 2) + 'px;transform:rotate(' + iconRot + 'deg)';
  });

  const icos = items.map((it, i) => {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'lsb-ico');
    s.innerHTML = svgOf(it);
    { const q = proj(BX + BW / 2 - 4, yOf(i)); s.style.left = q.x + 'px'; s.style.top = q.y + 'px'; }
    s.style.width = s.style.height = IS + 'px'; s.style.margin = (-IS / 2) + 'px 0 0 ' + (-IS / 2) + 'px';
    if (GIF) s.style.transform = 'rotate(' + iconRot + 'deg)';
    iconsEl.appendChild(s);
    let a;
    if (it.disabled) {                                   // placeholder item: visible but not clickable
      a = document.createElement('div');
      a.setAttribute('role', 'link'); a.setAttribute('aria-disabled', 'true');
      a.title = (it.label || '') + ' (coming soon)';
    } else {
      a = document.createElement('a');
      a.href = it.page ? '#' + it.page : (it.href || '#');
      if (it.page) a.dataset.page = it.page;             // the app's own click handler routes on data-page
      a.title = it.label || '';
      a.addEventListener('click', () => select(i, true));
    }
    a.className = 'lsb-hit'; a.setAttribute('aria-label', it.label || 'item');
    { const q = proj(BX + BW / 2 - 4, yOf(i)); a.style.left = q.x + 'px'; a.style.top = q.y + 'px'; }
    iconsEl.appendChild(a); hits.push(a);
    if (it.badge) {                                      // live count pill, text mirrored from another element
      const src = document.querySelector(it.badge), pill = document.createElement('span');
      pill.className = 'lsb-badge'; { const q = proj(BX + BW / 2 + 12, yOf(i) - 22); pill.style.left = q.x + 'px'; pill.style.top = q.y + 'px'; }
      const sync = () => { pill.textContent = src ? src.textContent : ''; pill.hidden = !pill.textContent.trim(); };
      sync(); if (src) { const mo = new MutationObserver(sync); mo.observe(src, { childList: true, characterData: true, subtree: true }); observers.push(mo); }
      iconsEl.appendChild(pill);
    }
    return s;
  });

  /* header (logo) and footer (theme toggle, profile) live inside the bar and tilt with it */
  const cx = BX + BW / 2 - 4;
  if (opts.header) {
    plane.appendChild(opts.header);
    const q = proj(cx, FULL ? BLEED + 44 : PT / 2);
    Object.assign(opts.header.style, { position: 'absolute', left: q.x + 'px', top: q.y + 'px', margin: '-21px 0 0 -21px' });
  }
  if (opts.footer) {
    plane.appendChild(opts.footer);
    const q = proj(cx, FULL ? H - BLEED - 120 : H - PB + 8);
    Object.assign(opts.footer.style, { position: 'absolute', left: q.x + 'px', top: q.y + 'px', transform: 'translateX(-50%)', margin: '0' });
  }

  /* one path, many <use> layers = lit front face + dark extruded side */
  let defs = '<defs><path id="' + pid + '"/><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#2c2f3a" style="stop-color:var(--lsb-front-a,#2c2f3a)"/><stop offset="1" stop-color="#3a3d4a" style="stop-color:var(--lsb-front-b,#3a3d4a)"/></linearGradient></defs>';
  for (let k = N; k >= 1; k--) {
    const t = k / N;
    defs += '<use href="#' + pid + '" x="' + (-t * DEPTH) + '" fill="' + mix('#22262e', '#0c0e12', t) + '" style="fill:color-mix(in srgb, var(--lsb-side-b,#0c0e12) ' + (t * 100).toFixed(1) + '%, var(--lsb-side-a,#22262e))"/>';
  }
  defs += '<use href="#' + pid + '" fill="url(#' + gid + ')"/>';
  layerSvg.innerHTML = defs;
  const barEl = layerSvg.querySelector('path');

  const INSET = opts.bubbleInset ?? (GIF ? 22 : 18);     // how far the bubble sits inside the bar edge
  const D0 = 38 * K + INSET * .9;                      // resting notch depth
  const NEXP = opts.notchRound ?? 2.1;                 // 2 = pure round bell; higher = flatter bottom
  const NW = opts.notchWidth ?? 46;                    // notch half-width
  function barPath(notches) {
    const y1 = 0, y2 = H;
    const edge = y => { let dip = 0; for (const n of notches) if (n.depth > .01) dip += n.depth * Math.exp(-Math.pow(Math.abs((y - n.y) / n.w), NEXP)); return X2 - (dip <= D0 ? dip : D0 + D0 * .12 * Math.tanh((dip - D0) / (D0 * .12))); };
    let d = 'M ' + (BX + R) + ' ' + y1 + ' L ' + (X2 - R) + ' ' + y1 + ' Q ' + X2 + ' ' + y1 + ' ' + edge(y1 + R) + ' ' + (y1 + R) + ' ';
    let y = y1 + R;
    while (y < y2 - R) {
      d += 'L ' + edge(y) + ' ' + y + ' ';
      let near = false;
      for (const n of notches) if (n.depth > .01 && Math.abs(y - n.y) < n.w * 2.3) { near = true; break; }
      y += near ? 4 : 56;
    }
    d += 'L ' + edge(y2 - R) + ' ' + (y2 - R) + ' Q ' + X2 + ' ' + y2 + ' ' + (X2 - R) + ' ' + y2 + ' L ' + (BX + R) + ' ' + y2 +
         ' Q ' + BX + ' ' + y2 + ' ' + BX + ' ' + (y2 - R) + ' L ' + BX + ' ' + (y1 + R) + ' Q ' + BX + ' ' + y1 + ' ' + (BX + R) + ' ' + y1 + ' Z';
    return d;
  }

  /* ---------- spring physics ---------- */
  const k1 = opts.stiffness || 170, z1 = opts.damping || 0.62;   // bubble: lively, slight overshoot
  const k2 = 95, z2 = 0.92;                                       // notch: softer, trails the bubble
  const c1 = 2 * z1 * Math.sqrt(k1), c2 = 2 * z2 * Math.sqrt(k2);
  let cur = opts.start || 0, y = yOf(cur), vy = 0, ty = y, ny = y, nvy = 0;
  let fromIdx = cur, toIdx = cur, fromY = y, running = false, last = 0, acc = 0, shownA = -1, shownB = -1;

  function select(i, fromUser) {
    if (i === toIdx && Math.abs(ty - yOf(i)) < .01 && !running) return;
    if (i === toIdx) return;
    const q = toIdx === fromIdx ? 0 : clamp((y - fromY) / (yOf(toIdx) - fromY));
    fromIdx = running ? (q < .5 ? fromIdx : toIdx) : cur;   // icon currently dominating the bubble
    fromY = y; toIdx = i; ty = yOf(i);
    hits.forEach((h, n) => n === i ? h.setAttribute('aria-current', 'page') : h.removeAttribute('aria-current'));
    if (fromUser && opts.onSelect) opts.onSelect(i, items[i]);
    root.dispatchEvent(new CustomEvent('lsb:change', { detail: { index: i, item: items[i] } }));
    if (reduce) { y = ny = ty; vy = nvy = 0; cur = fromIdx = toIdx; render(); return; }
    kick();
  }

  function render() {
    const sp = clamp(Math.abs(vy) / (SP * 8));            // 0 resting → 1 flying
    const gap = Math.abs(y - ny);
    const near = 1 - smooth(0, SP * .9, gap);             // how much the bubble still sits in its notch
    const notches = [
      { y: ny, depth: D0 * (1 - .3 * sp) * (.55 + .45 * near), w: (NW + 22 * sp) * K },   // trailing liquid dip
      { y: y,  depth: D0 * .95 * smooth(0, .5, sp) * (1 - .5 * near), w: (NW - 4 + 8 * sp) * K }   // dip around the bubble
    ];
    barEl.setAttribute('d', barPath(notches));

    const sy = 1 + .3 * sp, sx = 1 - .15 * sp, s = 1 - .1 * sp;
    const bp = proj(X2 - 4 - INSET + 3 * sp, y);
    bubble.style.transform = 'translate(' + bp.x + 'px,' + bp.y + 'px) scale(' + (sx * s * bp.s).toFixed(3) + ',' + (sy * s * bp.s).toFixed(3) + ')';

    const tot = yOf(toIdx) - fromY, q = Math.abs(tot) < 1 ? 1 : clamp((y - fromY) / tot);
    const ib = smooth(.3, .7, q), ia = running ? fromIdx : toIdx;
    if (shownA !== ia) { shownA = ia; bA.innerHTML = svgOf(items[ia]); }
    if (shownB !== toIdx) { shownB = toIdx; bB.innerHTML = svgOf(items[toIdx]); }
    bA.style.opacity = running ? 1 - ib : 0; bB.style.opacity = running ? ib : 1;

    for (let i = 0; i < icos.length; i++) icos[i].style.opacity = (clamp(Math.abs(yOf(i) - y) / (70 * K), 0, .92) * (items[i].disabled ? .45 : 1)).toFixed(3);
  }

  function tick(now) {
    if (dead) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; acc += dt;
    const h = 1 / 240;
    while (acc >= h) {
      const a1 = k1 * (ty - y) - c1 * vy; vy += a1 * h; y += vy * h;
      const a2 = k2 * (y - ny) - c2 * nvy; nvy += a2 * h; ny += nvy * h;
      acc -= h;
    }
    if (Math.abs(ty - y) < .03 && Math.abs(vy) < .4 && Math.abs(y - ny) < .03 && Math.abs(nvy) < .4) {
      y = ny = ty; vy = nvy = 0; cur = fromIdx = toIdx; running = false;
    }
    render();
    if (running) requestAnimationFrame(tick);
  }
  function kick() { if (running) return; running = true; last = performance.now(); acc = 0; requestAnimationFrame(tick); }
  render();

  hits[cur] && hits[cur].setAttribute('aria-current', 'page');
  return {
    select: i => { if (i >= 0 && i < items.length && !items[i].disabled) select(i, false); },
    height: H,
    destroy() { dead = true; running = false; observers.forEach(o => o.disconnect()); }
  };
}



/* ---------- wire it into CookItUp ---------- */
const ITEMS = [
  { label: 'Dashboard', page: 'dashboard', icon: 'dashboard' },
  { label: 'Profile',   disabled: true,     icon: 'profile' },
  { label: 'Household', disabled: true,     icon: 'household' },
  { label: 'Inventory', page: 'inventory', icon: 'inventory', badge: '#nav-count' },
  { label: 'Recipes',   page: 'recipes',   icon: 'recipes' },
  { label: 'Settings',  page: 'settings',  icon: 'settings' }
];
// Pages that are children of a nav item light that item up.
const PAGE_TO_ITEM = { preferences: 'settings' };
const indexOfPage = page => ITEMS.findIndex(it => it.page === (PAGE_TO_ITEM[page] || page));

const root = document.getElementById('primary-navigation');
if (root) {
  const aside = root.closest('.sidebar');
  const header = aside && aside.querySelector('.sidebar-logo');     // logo, lives at the top of the bar
  const footer = aside && aside.querySelector('.sidebar-bottom');   // theme toggle + profile, bottom of the bar
  let current = Math.max(0, indexOfPage(location.hash.slice(1)));
  let sidebar = null, lastH = 0, lastNarrow = null;

  function mount() {
    const narrow = innerWidth < 761, scale = narrow ? .78 : 1;
    lastH = innerHeight; lastNarrow = narrow;
    if (aside) aside.append(header, footer);                         // rescue them before the old bar is replaced
    if (sidebar) sidebar.destroy();
    sidebar = LiquidSidebar(root, ITEMS, {
      look: 'flat', start: current, fullHeight: true,
      viewportHeight: innerHeight / scale,                           // after scaling the bar still covers the screen
      header, footer
    });
    root.style.transform = scale === 1 ? '' : 'scale(' + scale + ')';
    document.documentElement.style.setProperty('--lsb-w', Math.ceil(138 * scale) + 'px');
  }
  mount();

  window.addEventListener('cookitup:page', e => {
    const i = indexOfPage(e.detail.page);
    if (i >= 0) { current = i; sidebar.select(i); }
  });

  let timer;
  addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (Math.abs(innerHeight - lastH) > 24 || (innerWidth < 761) !== lastNarrow) mount(); }, 180);
  });
}
