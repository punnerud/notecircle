/* ================================================================
   Nivåer (anbefalte tonearter angitt som SKREVET toneart)
   ================================================================ */
const LEVEL_KEYS = [
  [ { w: {letter:'C',alt:0}, ring:'maj', scale:'dur' },
    { w: {letter:'F',alt:0}, ring:'maj', scale:'dur' },
    { w: {letter:'G',alt:0}, ring:'maj', scale:'dur' },
    { w: {letter:'A',alt:0}, ring:'min', scale:'nmoll' } ],
  [ { w: {letter:'B',alt:-1}, ring:'maj', scale:'dur' },
    { w: {letter:'E',alt:-1}, ring:'maj', scale:'dur' },
    { w: {letter:'D',alt:0},  ring:'maj', scale:'dur' },
    { w: {letter:'G',alt:0},  ring:'min', scale:'hmoll' },
    { w: {letter:'D',alt:0},  ring:'min', scale:'mmoll' },
    { w: {letter:'C',alt:0},  ring:'maj', scale:'krom' } ],
  [ { w: {letter:'B',alt:0},  ring:'maj', scale:'dur' },
    { w: {letter:'F',alt:1},  ring:'maj', scale:'dur' },
    { w: {letter:'E',alt:-1}, ring:'min', scale:'mmoll' },
    { w: {letter:'G',alt:0},  ring:'maj', scale:'arpdom7' },
    { w: {letter:'C',alt:0},  ring:'min', scale:'arpdim7' },
    { w: {letter:'D',alt:0},  ring:'min', scale:'dorisk' } ],
  [ { w: {letter:'G',alt:0},  ring:'maj', scale:'alterert' },
    { w: {letter:'C',alt:0},  ring:'maj', scale:'dimhalv' },
    { w: {letter:'F',alt:0},  ring:'maj', scale:'heltone' },
    { w: {letter:'B',alt:-1}, ring:'maj', scale:'bebopdom' },
    { w: {letter:'E',alt:0},  ring:'maj', scale:'lyddom' } ],
];
function renderLevels() {
  const wrap = document.getElementById('levels');
  wrap.innerHTML = '';
  const ins = currentInstr();
  const brass = ins.fing === 'brass3';
  const levels = T('levels');
  levels.forEach((L, li) => {
    const d = document.createElement('div');
    d.className = 'level' + (state.level === li + 1 ? ' active' : '');
    let keysHtml = '';
    LEVEL_KEYS[li].forEach((k, ki) => {
      const q = k.ring === 'maj' ? 'dur' : 'moll';
      const t = state.view === 'written' ? k.w : transposeBy(k.w, -ins.letters, -ins.semis, q);
      const lbl = (k.scale === 'dur' || k.scale === 'nmoll' || k.scale === 'hmoll' || k.scale === 'mmoll')
        ? keyLabel(t, q) + (k.scale === 'hmoll' ? ' ' + T('ui.harm') : k.scale === 'mmoll' ? ' ' + T('ui.mel') : '')
        : scaleHeading(t, k.scale, q);
      keysHtml += `<button type="button" data-lvl="${li}" data-ki="${ki}">${lbl}</button>`;
    });
    const tips = brass ? L.brassTips : L.tips;
    d.innerHTML = `<button type="button" class="lvl-head"><span class="lvl-num">${li + 1}</span><h3>${L.name}</h3></button>
      <p><i>${L.sub}</i></p><p>${L.body}</p>
      <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="lvl-keys">${keysHtml}</div>`;
    d.querySelector('.lvl-head').addEventListener('click', () => { state.level = li + 1; renderLevels(); });
    wrap.appendChild(d);
  });
  wrap.querySelectorAll('.lvl-keys button').forEach(b => {
    b.addEventListener('click', () => {
      const k = LEVEL_KEYS[+b.dataset.lvl][+b.dataset.ki];
      const q = k.ring === 'maj' ? 'dur' : 'moll';
      state.level = +b.dataset.lvl + 1;
      state.scale = k.scale;
      state.ring = k.ring;
      state.tonic = state.view === 'written' ? k.w : transposeBy(k.w, -currentInstr().letters, -currentInstr().semis, q);
      document.getElementById('scaleSel').value = k.scale;
      renderAll();
    });
  });
}

/* ================================================================
   Teori og oppslag
   ================================================================ */
function nn(letter, alt) { return dispNote({ letter, alt }); }
function theoryContent() {
  const boxes = [];
  const ins = currentInstr();
  const transposing = isTransposing();
  const brass = ins.fing === 'brass3';
  const sharpNames = SHARP_ORDER.map(l => nn(l, 1)).join(' – ');
  const flatNames = FLAT_ORDER.map(l => nn(l, -1)).join(' – ');

  boxes.push({ id: 'tKvint', title: T('theory.tKvintTitle'), html: T('theory.tKvint', {
    exMajor: keyLabel({ letter: 'C', alt: 0 }, 'dur'),
    exMinor: keyLabel({ letter: 'A', alt: 0 }, 'moll'),
  }) });

  let rows = '';
  for (let f = -7; f <= 7; f++) {
    const majT = tonicFromFifths(f);
    const minT = relativeOf(majT, 'maj');
    const accs = sigList(f).map(a => nn(a.letter, a.alt)).join(', ') || '—';
    const cur = (state.ring === 'maj' ? fifthsOf(state.tonic) : fifthsOf(state.tonic) - 3) === f;
    rows += `<tr${cur ? ' class="rowhl"' : ''}><td>${fortegnText(f)}</td><td class="notecell">${keyLabel(majT, 'dur')}</td><td class="notecell">${keyLabel(minT, 'moll')}</td><td>${accs}</td></tr>`;
  }
  boxes.push({ id: 'tFortegn', title: T('theory.tFortegnTitle'), html:
    T('theory.tFortegn', { sharpOrder: sharpNames, flatOrder: flatNames }) +
    `<div class="scroll-x"><table class="ref"><tr><th>${T('theory.thSig')}</th><th>${T('theory.thDur')}</th><th>${T('theory.thMoll')}</th><th>${T('theory.thAccs')}</th></tr>${rows}</table></div>` });

  const q = quality();
  const rel = respellIfNeeded(relativeOf(state.tonic, state.ring), q === 'dur' ? 'moll' : 'dur');
  boxes.push({ id: 'tParallell', title: T('theory.tParallellTitle'), html: T('theory.tParallell', {
    exKey: keyLabel(state.tonic, q),
    exRel: keyLabel(rel, q === 'dur' ? 'moll' : 'dur'),
    exVar1: keyLabel(state.tonic, 'dur'),
    exVar2: keyLabel(respellIfNeeded(state.tonic, 'moll'), 'moll'),
  }) });

  // Transponering
  let thtml;
  if (transposing) {
    thtml = T('theory.tTranspTransposing', {
      instr: instrName(ins.id),
      soundsNote: dispNote(transposeBy({ letter: 'C', alt: 0 }, -ins.letters, -ins.semis, 'dur')),
      interval: intervalName(ins.letters, ins.semis),
      direction: T(ins.semis > 0 ? 'theory.lower' : 'theory.higher'),
      oppositeDirection: T(ins.semis > 0 ? 'theory.higher' : 'theory.lower'),
    });
    let trows = '';
    for (let f = -5; f <= 6; f++) {
      const c = tonicFromFifths(f);
      const w = transposeBy(c, ins.letters, ins.semis, 'dur');
      const cur = state.ring === 'maj' && pcOf(c) === pcOf(state.view === 'written' ? transposeBy(state.tonic, -ins.letters, -ins.semis, 'dur') : state.tonic);
      trows += `<tr${cur ? ' class="rowhl"' : ''}><td class="notecell">${keyLabel(c, 'dur')}</td><td class="notecell">${keyLabel(w, 'dur')}</td><td>${fortegnText(fifthsOf(w))}</td></tr>`;
    }
    thtml += `<div class="scroll-x"><table class="ref"><tr><th>${T('theory.thConcert')}</th><th>${T('theory.thWritten', { instr: instrName(ins.id) })}</th><th>${T('theory.thWrittenSig')}</th></tr>${trows}</table></div>`;
  } else {
    thtml = T('theory.tTranspNon', { instr: instrName(ins.id) });
  }
  thtml += T('theory.tTranspTable');
  boxes.push({ id: 'tTransp', title: T('theory.tTranspTitle', { instr: instrName(ins.id) }), html: thtml });

  if (brass) {
    boxes.push({ id: 'tIntonasjon', title: T('theory.tIntonasjonTitle'), html: T('theory.tIntonasjon', {
      noteD4: nn('D', 0) + '4', noteCiss4: nn('C', 1) + '4', noteE5: nn('E', 0) + '5', noteB5: nn('B', -1) + '5',
      alt3list: [nn('A',0)+'3', nn('E',0)+'4', nn('A',0)+'4', nn('C',1)+'5', nn('A',0)+'5'].join(', '),
    }) });
    let ghtml = T('theory.tGrep', { instr: instrName(ins.id), low: nn('F', 1) + '3', high: nn('G', 0) + '6' });
    if (ins.fourValve) ghtml += T('theory.tGrepPiccoloNote');
    ghtml += '<div class="chartgrid" id="chartGrid"></div>';
    boxes.push({ id: 'tGrep', title: T('theory.tGrepTitle', { low: nn('F', 1) + '3', high: nn('G', 0) + '6' }), html: ghtml });
  }
  return boxes;
}
function renderTheory(writtenSet) {
  const wrap = document.getElementById('theoryBoxes');
  const openSet = {};
  wrap.querySelectorAll('details').forEach(d => { openSet[d.dataset.id] = d.open; });
  wrap.innerHTML = '';
  theoryContent().forEach(b => {
    const d = document.createElement('details');
    d.className = 'tbox';
    d.dataset.id = b.id;
    if (openSet[b.id]) d.open = true;
    d.innerHTML = `<summary>${b.title}</summary><div class="tbody">${b.html}</div>`;
    wrap.appendChild(d);
  });
  renderChart(writtenSet);
}
function renderChart(writtenSet) {
  const grid = document.getElementById('chartGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const useFlats = fifthsOf(state.tonic) < 0;
  for (let m = FING_MIN; m <= FING_MAX; m++) {
    const fing = FINGERINGS[m];
    const sp = spellPitch(m, useFlats);
    const spAlt = spellPitch(m, !useFlats);
    let label = dispNote(sp);
    if (sp.letter !== spAlt.letter || sp.alt !== spAlt.alt) label += ' / ' + dispNote(spAlt);
    const cell = document.createElement('div');
    cell.className = 'chartcell' + (writtenSet && writtenSet.has(m) ? ' inscale' : '');
    cell.innerHTML = `<div class="cname">${label}</div><div class="coct">${T('ui.octaveWord')} ${sp.octave}</div>`;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 30');
    svg.setAttribute('width', '64'); svg.setAttribute('height', '30');
    drawValves(svg, 32, 10, fing.f, 5, 16);
    cell.appendChild(svg);
    const alt = document.createElement('div');
    alt.className = 'calt';
    alt.textContent = fing.a ? T('ui.alt') + ': ' + fing.a.map(comboText).join(', ') : comboText(fing.f);
    cell.appendChild(alt);
    cell.title = label + ' — ' + T('ui.fingering') + ': ' + comboText(fing.f)
      + (fing.a ? ' (' + T('ui.alt') + '.: ' + fing.a.map(comboText).join(', ') + ')' : '')
      + (fing.i ? '. ' + T('intonation.' + fing.i) : '');
    grid.appendChild(cell);
  }
}
