/* ================================================================
   SVG-renderere
   ================================================================ */
const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, str, attrs) {
  const t = el('text', Object.assign({ x, y }, attrs), parent);
  t.textContent = str;
  return t;
}
function cubicPts(p0, p1, p2, p3, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    pts.push([
      m*m*m*p0[0] + 3*m*m*t*p1[0] + 3*m*t*t*p2[0] + t*t*t*p3[0],
      m*m*m*p0[1] + 3*m*m*t*p1[1] + 3*m*t*t*p2[1] + t*t*t*p3[1],
    ]);
  }
  return pts;
}
function polyPath(pts) {
  return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
}
function strokeGroup(parent) {
  return el('g', { fill: 'none', stroke: 'var(--staff-ink)', 'stroke-linecap': 'round' }, parent);
}
// G-nøkkel. Origo = G4-linja.
function drawTrebleClef(parent, x, yAnchor, sp) {
  const S = p => p.map(q => [x + q[0]*sp, yAnchor + q[1]*sp]);
  const apex = [-0.05, -4.85];
  const spine = S([].concat(
    cubicPts(apex, [0.10,-3.2], [0.16,-1.0], [0.14,0.6], 22),
    cubicPts([0.14,0.6], [0.13,1.4], [0.14,1.9], [0.10,2.2], 8),
    cubicPts([0.10,2.2], [0.04,2.62], [-0.25,2.72], [-0.46,2.48], 8)));
  const loop = S([].concat(
    cubicPts(apex, [0.50,-4.55], [0.78,-3.75], [0.72,-2.95], 14),
    cubicPts([0.72,-2.95], [0.66,-2.15], [0.40,-1.62], [0.08,-1.28], 14)));
  const C = [0.0, 0.06], start = [0.08, -1.28];
  const a0 = Math.atan2(start[1]-C[1], start[0]-C[0]);
  const rIn = Math.hypot(start[0]-C[0], start[1]-C[1]);
  const total = 1.58 * 2 * Math.PI, rEnd = 0.30;
  const bowl = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90, a = a0 - total * t, r = rIn + (rEnd - rIn) * Math.pow(t, 0.8);
    bowl.push([x + (C[0] + 1.07*r*Math.cos(a))*sp, yAnchor + (C[1] + r*Math.sin(a))*sp]);
  }
  const g = strokeGroup(parent);
  el('path', { d: polyPath(spine), 'stroke-width': (0.185*sp).toFixed(1) }, g);
  el('path', { d: polyPath(loop),  'stroke-width': (0.24*sp).toFixed(1) }, g);
  el('path', { d: polyPath(bowl),  'stroke-width': (0.27*sp).toFixed(1) }, g);
  el('circle', { cx: (x-0.52*sp).toFixed(1), cy: (yAnchor+2.38*sp).toFixed(1), r: (0.29*sp).toFixed(1), fill: 'var(--staff-ink)', stroke: 'none' }, g);
}
// F-nøkkel. Origo = F3-linja.
function drawBassClef(parent, x, yAnchor, sp) {
  const S = p => p.map(q => [x + q[0]*sp, yAnchor + q[1]*sp]);
  const body = S([].concat(
    cubicPts([-0.85,-0.35], [-0.5,-1.15], [0.5,-1.25], [0.95,-0.55], 16),
    cubicPts([0.95,-0.55], [1.35,0.1], [1.05,1.2], [0.2,2.0], 18),
    cubicPts([0.2,2.0], [-0.2,2.35], [-0.6,2.55], [-1.0,2.6], 10)));
  const g = strokeGroup(parent);
  el('path', { d: polyPath(body), 'stroke-width': (0.30*sp).toFixed(1) }, g);
  el('circle', { cx: x-0.85*sp, cy: yAnchor, r: 0.40*sp, fill: 'var(--staff-ink)', stroke: 'none' }, g);
  el('circle', { cx: x+1.75*sp, cy: yAnchor-0.5*sp, r: 0.17*sp, fill: 'var(--staff-ink)', stroke: 'none' }, g);
  el('circle', { cx: x+1.75*sp, cy: yAnchor+0.5*sp, r: 0.17*sp, fill: 'var(--staff-ink)', stroke: 'none' }, g);
}
// C-nøkkel. Origo = midtlinja.
function drawAltoClef(parent, x, yAnchor, sp) {
  const S = p => p.map(q => [x + q[0]*sp, yAnchor + q[1]*sp]);
  const g = strokeGroup(parent);
  el('path', { d: polyPath(S([[-1.15,-2.0],[-1.15,2.0]])), 'stroke-width': (0.42*sp).toFixed(1) }, g);
  el('path', { d: polyPath(S([[-0.62,-2.0],[-0.62,2.0]])), 'stroke-width': (0.12*sp).toFixed(1) }, g);
  const up = [].concat(
    cubicPts([-0.55,-2.0], [0.3,-2.25], [0.95,-1.9], [0.95,-1.1], 14),
    cubicPts([0.95,-1.1], [0.95,-0.3], [0.25,-0.05], [-0.35,-0.08], 12));
  const dn = up.map(p => [p[0], -p[1]]).reverse();
  el('path', { d: polyPath(S(up)), 'stroke-width': (0.26*sp).toFixed(1) }, g);
  el('path', { d: polyPath(S(dn)), 'stroke-width': (0.26*sp).toFixed(1) }, g);
  el('circle', { cx: x+0.72*sp, cy: yAnchor-1.35*sp, r: 0.20*sp, fill: 'var(--staff-ink)', stroke: 'none' }, g);
  el('circle', { cx: x+0.72*sp, cy: yAnchor+1.35*sp, r: 0.20*sp, fill: 'var(--staff-ink)', stroke: 'none' }, g);
}
const CLEF_DRAW = { treble: drawTrebleClef, alto: drawAltoClef, bass: drawBassClef };

// Fortegn-glyf (manuelt optisk justert)
function drawAcc(parent, x, y, alt, fontSize, fill) {
  const attrs = { 'text-anchor': 'middle', 'font-size': fontSize, fill: fill || 'var(--staff-ink)', 'font-family': 'system-ui, sans-serif' };
  if (alt === 2) { const t = txt(parent, x, y + fontSize*0.34, '×', attrs); t.setAttribute('font-weight', '700'); return t; }
  const sym = alt === 1 ? '♯' : alt === -1 ? '♭' : alt === -2 ? '♭♭' : '♮';
  const dy = (alt === -1 || alt === -2) ? fontSize*0.22 : fontSize*0.34;
  return txt(parent, x, y + dy, sym, attrs);
}
// Ventilgrep: tre sirkler, trykket = fylt
function drawValves(parent, cx, cy, combo, r, gap) {
  r = r || 6; gap = gap || 17;
  const g = el('g', {}, parent);
  for (let v = 1; v <= 3; v++) {
    const pressed = combo !== '0' && combo.indexOf(String(v)) >= 0;
    const x = cx + (v - 2) * gap;
    el('circle', { cx: x, cy, r, fill: pressed ? 'var(--brass)' : 'none', stroke: pressed ? 'var(--brass)' : 'var(--line-strong)', 'stroke-width': 1.6 }, g);
    txt(g, x, cy + r + 11, String(v), { 'text-anchor': 'middle', 'font-size': 9, fill: 'var(--muted)', 'font-family': 'system-ui, sans-serif' });
  }
  return g;
}
function comboText(combo) { return combo === '0' ? T('ui.openValve') : combo.split('').join('·'); }

/* ---------------- Notesystemet ---------------- */
const SP = 12;
function renderStaff(state, built, writtenBuilt, clefName) {
  const svg = document.getElementById('staffSvg');
  svg.innerHTML = '';
  const ins = INSTR_BY_ID[state.instrId];
  clefName = clefName || ins.clef;
  const clef = CLEFS[clefName];
  const bottomDi = clef.bottomDi;
  const notes = built.notes, sigF = built.sigF, degrees = built.degrees;
  const sig = sigList(sigF).map(a => ({ letter: a.letter, alt: a.alt, di: a.di - clef.sigShift }));
  const seq = playbackOrder(state, notes.length);
  const shown = seq.map(i => ({ n: notes[i], deg: degrees[i], idx: i }));
  const hasFing = ins.fing === 'brass3';

  const NW = 56;
  const x0 = 18;
  const clefX = x0 + (clefName === 'treble' ? 18 : 22);
  const sigX = x0 + 48;
  const notesX = sigX + sig.length * 13 + 34;
  const width = notesX + shown.length * NW + 10;

  let minDi = 99, maxDi = -99;
  for (const s of shown) { const d = diaIndex(s.n); if (d < minDi) minDi = d; if (d > maxDi) maxDi = d; }
  const clefTopSp = clefName === 'treble' ? 4.85 : (clefName === 'bass' ? 1.4 : 2.1);
  const clefBotSp = clefName === 'treble' ? 2.72 : (clefName === 'bass' ? 2.7 : 2.1);
  const anchorSp = clef.anchorLine; // ankerlinje regnet fra nederste linje
  // staffBottom (nederste linje) velges så høyeste note, faste fortegn og nøkkel får plass
  const sigTopDi = sigF ? Math.max(...sig.map(a => a.di)) : bottomDi + 8;
  const staffBottom = Math.ceil(Math.max(
    14 + (maxDi - bottomDi) * SP/2,
    16 + (sigTopDi - bottomDi) * SP/2,
    12 + (anchorSp + clefTopSp) * SP,
    4 * SP + 14
  ));
  const yTop = staffBottom - 4*SP;
  const yAnchor = staffBottom - anchorSp*SP;
  const lowest = Math.max(
    staffBottom,
    staffBottom + (bottomDi - minDi) * SP/2,
    yAnchor + clefBotSp*SP
  );
  const nameY = lowest + 24;
  const degY = nameY + 17;
  const valveY = degY + 22;
  const height = (hasFing ? valveY + 26 : degY + 14);

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  for (let s = 0; s <= 4; s++)
    el('line', { x1: x0 - 6, y1: yTop + s*SP, x2: width - 8, y2: yTop + s*SP, stroke: 'var(--staff-ink)', 'stroke-width': 1.1, opacity: 0.85 }, svg);

  CLEF_DRAW[clefName](svg, clefX, yAnchor, SP);

  sig.forEach((a, i) => {
    const y = staffBottom - (a.di - bottomDi) * SP/2;
    drawAcc(svg, sigX + i * 13, y, a.alt, 21);
  });

  const sigM = sigMap(sigF);
  const seen = {};
  const noteRefs = [];
  const ledgerLo = bottomDi - 2, ledgerHi = bottomDi + 10;
  shown.forEach((s, i) => {
    const n = s.n;
    const x = notesX + i * NW;
    const di = diaIndex(n);
    const y = staffBottom - (di - bottomDi) * SP/2;
    const key = n.letter + n.octave;
    const expected = (key in seen) ? seen[key] : sigM[n.letter];
    const needAcc = n.alt !== expected;
    if (needAcc) seen[key] = n.alt;

    const g = el('g', { class: 'staffnote', 'data-i': i, tabindex: '0', role: 'button' }, svg);
    const title = el('title', {}, g);

    if (di <= ledgerLo) for (let L = ledgerLo; L >= (di % 2 === ledgerLo % 2 ? di : di + 1); L -= 2)
      el('line', { x1: x - 13, y1: staffBottom - (L - bottomDi) * SP/2, x2: x + 13, y2: staffBottom - (L - bottomDi) * SP/2, stroke: 'var(--staff-ink)', 'stroke-width': 1.1 }, g);
    if (di >= ledgerHi) for (let L = ledgerHi; L <= (di % 2 === ledgerHi % 2 ? di : di - 1); L += 2)
      el('line', { x1: x - 13, y1: staffBottom - (L - bottomDi) * SP/2, x2: x + 13, y2: staffBottom - (L - bottomDi) * SP/2, stroke: 'var(--staff-ink)', 'stroke-width': 1.1 }, g);

    if (needAcc) drawAcc(g, x - 17, y, n.alt, 20);

    el('ellipse', { cx: x, cy: y, rx: 8.3, ry: 5.6, fill: 'var(--staff-ink)', transform: `rotate(-14 ${x} ${y})`, class: 'notehead' }, g);
    el('ellipse', { cx: x, cy: y, rx: 4.4, ry: 2.7, fill: 'var(--surface)', transform: `rotate(-58 ${x} ${y})` }, g);

    const nm = dispNote(n);
    txt(g, x, nameY, nm, { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: 'var(--ink)', 'font-family': 'system-ui, sans-serif', class: 'nlabel' });
    if (s.deg) txt(g, x, degY, s.deg, { 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)', 'font-family': 'system-ui, sans-serif' });

    let tip = nm;
    if (hasFing && writtenBuilt) {
      const wn = writtenBuilt.notes[s.idx];
      const wm = noteMidi(wn);
      const fing = fingeringFor(wm);
      if (fing) {
        drawValves(g, x, valveY, fing.f, 5.5, 15);
        tip += ' — ' + T('ui.fingering') + ': ' + comboText(fing.f);
        if (fing.a) tip += ' (' + T('ui.alt') + '.: ' + fing.a.map(comboText).join(', ') + ')';
        if (fing.i) tip += '. ' + T('intonation.' + fing.i);
        if (state.view === 'concert') tip += ' [' + T('ui.forWritten', { note: dispNote(wn) }) + ']';
      } else {
        txt(g, x, valveY + 4, '—', { 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' });
        tip += ' — ' + T('ui.outOfRange');
      }
    }
    title.textContent = tip;
    noteRefs.push({ g, idx: s.idx });
  });
  return noteRefs;
}
function playbackOrder(state, len) {
  const up = Array.from({ length: len }, (_, i) => i);
  if (state.dir === 'updown') return up.concat(up.slice(0, -1).reverse());
  return up;
}

/* ---------------- Kvintsirkelen ---------------- */
function sectorPath(cx, cy, r1, r2, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(r2, a0), [x1, y1] = p(r2, a1), [x2, y2] = p(r1, a1), [x3, y3] = p(r1, a0);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r2} ${r2} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} A${r1} ${r1} 0 0 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`;
}
const SLOT_COUNTS = ['0', '1♯', '2♯', '3♯', '4♯', '5♯/7♭', '6♯/6♭', '5♭/7♯', '4♭', '3♭', '2♭', '1♭'];
function renderCircle(state, sigF, heading) {
  const svg = document.getElementById('circleSvg');
  svg.innerHTML = '';
  const cx = 280, cy = 280;
  const ins = INSTR_BY_ID[state.instrId];
  const transposing = !!(ins.letters || ins.semis);
  const selPc = pcOf(state.tonic);
  const selSlot = findSlot(selPc, state.ring === 'maj' ? 'maj' : 'min');
  for (let i = 0; i < 12; i++) {
    const a0 = (-105 + i * 30) * Math.PI / 180;
    const a1 = a0 + 30 * Math.PI / 180;
    const mid = (a0 + a1) / 2;
    const isSelSlot = selSlot && selSlot.slot === i;
    const neigh = selSlot && (i === (selSlot.slot + 1) % 12 || i === (selSlot.slot + 11) % 12);

    const majSel = isSelSlot && state.ring === 'maj';
    const majFill = majSel ? 'var(--brass)' : (neigh && state.ring === 'maj') ? 'var(--brass-soft)' : 'var(--surface)';
    const pMaj = el('path', { d: sectorPath(cx, cy, 204, 272, a0, a1), fill: majFill, stroke: 'var(--line-strong)', 'stroke-width': 1, class: 'segpath' }, svg);
    pMaj.addEventListener('click', () => selectSlot(i, 'maj'));

    const minSel = isSelSlot && state.ring === 'min';
    const minFill = minSel ? 'var(--slate)' : (neigh && state.ring === 'min') ? 'var(--slate-soft)' : 'var(--surface2)';
    const pMin = el('path', { d: sectorPath(cx, cy, 146, 204, a0, a1), fill: minFill, stroke: 'var(--line-strong)', 'stroke-width': 1, class: 'segpath' }, svg);
    pMin.addEventListener('click', () => selectSlot(i, 'min'));

    const put = (r, arr, ring, sel) => {
      const tx = cx + r * Math.cos(mid), ty = cy + r * Math.sin(mid);
      const fill = sel ? (ring === 'maj' ? 'var(--on-brass)' : 'var(--on-slate)') : (ring === 'maj' ? 'var(--ink)' : 'var(--slate-strong)');
      const fs = ring === 'maj' ? (arr.length > 1 ? 16 : 21) : (arr.length > 1 ? 12.5 : 15);
      const names = arr.map(t => ring === 'maj' ? dispNote(t) : (T('keys.minorLowercase') ? lcFirst(dispNote(t)) : dispNote(t)));
      const t = txt(svg, tx, ty, '', { 'text-anchor': 'middle', 'font-size': fs, fill, 'font-weight': ring === 'maj' ? 600 : 500 });
      if (ring === 'maj') t.setAttribute('class', 'serif');
      if (names.length === 1) { t.textContent = names[0]; t.setAttribute('y', ty + fs*0.34); }
      else {
        const s1 = el('tspan', { x: tx, y: ty - 2 }, t); s1.textContent = names[0];
        const s2 = el('tspan', { x: tx, y: ty + fs + 1 }, t); s2.textContent = names[1];
      }
    };
    put(238, CIRCLE[i].maj, 'maj', majSel);
    put(175, CIRCLE[i].min, 'min', minSel);
    txt(svg, cx + 130 * Math.cos(mid), cy + 130 * Math.sin(mid) + 4, SLOT_COUNTS[i], { 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--muted)' });

    if (selSlot && state.ring) {
      const rMark = state.ring === 'maj' ? 212 : 154;
      if (i === (selSlot.slot + 1) % 12) txt(svg, cx + rMark * Math.cos(mid), cy + rMark * Math.sin(mid) + 3, 'D', { 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--brass-strong)', 'font-weight': 700 });
      if (i === (selSlot.slot + 11) % 12) txt(svg, cx + rMark * Math.cos(mid), cy + rMark * Math.sin(mid) + 3, 'S', { 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--brass-strong)', 'font-weight': 700 });
    }
  }
  el('circle', { cx, cy, r: 118, fill: 'var(--surface)', stroke: 'var(--line-strong)' }, svg);
  const kl = heading || keyLabel(state.tonic, state.ring === 'maj' ? 'dur' : 'moll');
  const fs = kl.length > 16 ? 17 : kl.length > 11 ? 21 : 27;
  txt(svg, cx, cy - 12, kl, { 'text-anchor': 'middle', 'font-size': fs, fill: 'var(--ink)', 'font-weight': 600, class: 'serif' });
  if (sigF === undefined) sigF = fifthsOf(state.tonic) - (state.ring === 'maj' ? 0 : 3);
  txt(svg, cx, cy + 16, fortegnText(sigF) + (SCALES[state.scale].sigOff === 'none' && state.scale !== 'krom' ? ' ' + T('ui.looseAccs') : ''), { 'text-anchor': 'middle', 'font-size': 14, fill: 'var(--muted)' });
  if (transposing) {
    const q = state.ring === 'maj' ? 'dur' : 'moll';
    const other = state.view === 'written'
      ? T('ui.hubSounds', { key: keyLabel(transposeBy(state.tonic, -ins.letters, -ins.semis, q), q) })
      : T('ui.hubOn', { instr: instrName(ins.id), key: keyLabel(transposeBy(state.tonic, ins.letters, ins.semis, q), q) });
    txt(svg, cx, cy + 42, other, { 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--brass-strong)', 'font-weight': 600 });
  }
}

/* ---------------- Klaviatur ---------------- */
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
function renderKeyboard(state, built, rootMidi) {
  const svg = document.getElementById('kbdSvg');
  svg.innerHTML = '';
  const octaves = Math.max(2, state.oct + 1);
  const startC = 12 * (Math.floor(rootMidi / 12));
  const nWhite = octaves * 7 + 1;
  const W = 700, kw = W / nWhite, H = 128, wh = 122, bh = 76, bw = kw * 0.62;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const inScale = new Map();
  built.notes.forEach((n, i) => { inScale.set(noteMidi(n), { root: i === 0 || pcOf(n) === pcOf(built.notes[0]), name: dispNote(n) }); });
  const whites = [];
  for (let i = 0; i < nWhite; i++) {
    const oct = Math.floor(i / 7), pc = WHITE_PCS[i % 7];
    whites.push({ x: i * kw, midi: startC + oct * 12 + pc });
  }
  for (const k of whites) {
    const m = inScale.get(k.midi);
    el('rect', { x: k.x, y: 2, width: kw - 1, height: wh, rx: 3, fill: m ? (m.root ? 'var(--brass)' : 'var(--brass-soft)') : 'var(--surface)', stroke: 'var(--line-strong)' }, svg);
    if (m) txt(svg, k.x + kw/2, wh - 8, m.name, { 'text-anchor': 'middle', 'font-size': 10.5, fill: m.root ? 'var(--on-brass)' : 'var(--ink)', 'font-weight': 600 });
  }
  for (const k of whites.slice(0, -1)) {
    const pc = ((k.midi % 12) + 12) % 12;
    if ([0, 2, 5, 7, 9].indexOf(pc) < 0) continue;
    const m = inScale.get(k.midi + 1);
    el('rect', { x: k.x + kw - bw/2, y: 2, width: bw, height: bh, rx: 2.5, fill: m ? (m.root ? 'var(--brass)' : 'var(--brass-strong)') : 'var(--ink)', stroke: 'var(--line-strong)' }, svg);
    if (m) txt(svg, k.x + kw, bh - 8, m.name, { 'text-anchor': 'middle', 'font-size': 9, fill: 'var(--on-brass)', 'font-weight': 600 });
  }
}
