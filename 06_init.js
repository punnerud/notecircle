/* ================================================================
   Hovedrendring + oppstart
   ================================================================ */
const STEP_NAMES = { 1: '½', 2: '1', 3: '1½', 4: '2', 5: '2½' };
function refreshStatic() {
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = T(n.getAttribute('data-t')); });
  const ins = currentInstr();
  const vb = document.querySelectorAll('#segView button');
  vb[0].textContent = T('ui.viewConcert');
  vb[1].textContent = T('ui.viewWritten', { instr: instrName(ins.id) });
  const nb = document.querySelectorAll('#segNaming button');
  nb[0].textContent = T('ui.namingNative');
  nb[1].textContent = T('ui.namingIntl');
  document.getElementById('soundingLabel').textContent = T('ui.playSounding', { instr: instrName(ins.id) });
  document.getElementById('tempoVal').textContent = state.tempo + ' ' + T('ui.bpm');
  if (!isPlaying) document.getElementById('playBtn').innerHTML = '<span class="tri">&#9654;</span> ' + T('ui.play');
  const transposing = isTransposing();
  document.getElementById('footerRule').textContent = transposing
    ? T('footer.ruleTransposing', { instr: instrName(ins.id), interval: intervalName(ins.letters, ins.semis), direction: T(ins.semis > 0 ? 'theory.lower' : 'theory.higher') })
    : T('footer.ruleNon', { instr: instrName(ins.id) });
  document.getElementById('htmlRoot').setAttribute('lang', state.lang);
}
function rebuildSelectors() {
  // Skalavelger
  const sel = document.getElementById('scaleSel');
  sel.innerHTML = '';
  SCALE_GROUPS.forEach(g => {
    const og = document.createElement('optgroup');
    og.label = T('scaleGroups.' + g.key);
    g.ids.forEach(id => {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = scaleName(id);
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
  sel.value = state.scale;
  // Familievelger (kort liste) + variantvelger innenfor familien
  const fsel = document.getElementById('familySel');
  fsel.innerHTML = '';
  INSTR_GROUP_ORDER.forEach(gr => {
    const og = document.createElement('optgroup');
    og.label = T('instrumentGroups.' + gr);
    FAMILIES.filter(f => f.group === gr).forEach(f => {
      const o = document.createElement('option');
      o.value = f.id;
      o.textContent = T('families.' + f.id);
      og.appendChild(o);
    });
    fsel.appendChild(og);
  });
  const fam = FAMILY_BY_ID[currentInstr().family];
  fsel.value = fam.id;
  const vsel = document.getElementById('variantSel');
  vsel.innerHTML = '';
  fam.members.forEach(id => {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = instrName(id) + (id === fam.std ? ' (' + T('ui.standard') + ')' : '');
    vsel.appendChild(o);
  });
  vsel.value = state.instrId;
  document.getElementById('variantWrap').style.display = fam.members.length > 1 ? '' : 'none';
}
function renderAll() {
  stopPlayback();
  const ins = currentInstr();
  const q = quality();
  const transposing = isTransposing();
  if (!transposing && state.view !== 'concert') state.view = 'concert';
  // Instrumenter med lite omfang får ikke 2 oktaver
  const canTwoOct = (ins.hi - ins.lo) >= 24;
  if (!canTwoOct && state.oct === 2) state.oct = 1;

  // Skrevet skala (for grep og register); vist skala kan være klingende
  const wTonic = state.view === 'written' ? state.tonic : transposeBy(state.tonic, ins.letters, ins.semis, q);
  const wRoot = chooseWrittenRoot(pcOf(wTonic), ins, state.oct);
  const wBuilt = buildScale(wTonic, state.scale, wRoot, state.oct);
  let built, rootMidi, displayClef = ins.clef;
  if (state.view === 'written' || !transposing) { built = wBuilt; rootMidi = wRoot; }
  else {
    // Klingende visning: samme oktav som instrumentet faktisk klinger i
    rootMidi = wRoot - ins.semis;
    built = buildScale(state.tonic, state.scale, rootMidi, state.oct);
    // Velg nøkkel etter klingende register
    displayClef = (rootMidi + 6 * state.oct) < 58 ? 'bass' : 'treble';
  }

  refreshStatic();
  rebuildSelectors();

  const heading = scaleHeading(state.tonic, state.scale, q);
  renderCircle(state, built.sigF, heading);
  const refs = renderStaff(state, built, wBuilt, displayClef);
  currentNoteRefs = refs.map(r => ({ g: r.g, midi: noteMidi(built.notes[r.idx]) }));
  currentNoteRefs.forEach(c => {
    c.g.addEventListener('click', () => playOne(c.midi));
    c.g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playOne(c.midi); } });
  });
  renderKeyboard(state, built, rootMidi);
  renderKeyInfo(built);
  renderLevels();

  document.getElementById('staffTitle').innerHTML =
    `${heading} <span class="mode-tag">${state.view === 'written' ? T('ui.viewWritten', { instr: instrName(ins.id) }) : T('ui.viewConcert')}</span>`;
  document.getElementById('staffHint').textContent =
    ins.fing === 'brass3'
      ? (state.view === 'written' ? T('ui.staffHintWritten') : T('ui.staffHintConcert', { instr: instrName(ins.id) }))
      : T('ui.staffHintNoFing');

  const pl = document.getElementById('patternLine');
  if (state.scale === 'krom') {
    pl.innerHTML = `<b>${T('ui.stepsLabel')}:</b> ${T('ui.chromSteps')}`;
  } else {
    const midis = built.notes.map(noteMidi);
    const steps = [];
    for (let i = 1; i < midis.length && i <= SCALES[state.scale].semis.length; i++)
      steps.push(STEP_NAMES[midis[i] - midis[i-1]] || (midis[i] - midis[i-1]) + ' ht');
    pl.innerHTML = `<b>${T('ui.stepsLabel')}:</b> ${steps.join(' – ')} &nbsp;·&nbsp; ${T('ui.stepsLegend')}`;
  }

  let kbdHint;
  if (state.view === 'written' && transposing) {
    kbdHint = T(ins.semis > 0 ? 'ui.kbdWritten' : 'ui.kbdWrittenUp', { interval: intervalName(ins.letters, ins.semis) });
  } else {
    kbdHint = T('ui.kbdConcert');
  }
  document.getElementById('kbdHint').textContent = kbdHint + ' ' + T('ui.kbdRoot');

  const writtenSet = ins.fing === 'brass3' ? new Set(wBuilt.notes.map(noteMidi)) : null;
  renderTheory(writtenSet);

  const slotInfo = findSlot(pcOf(state.tonic), state.ring);
  document.getElementById('enhBtn').disabled = !(slotInfo && CIRCLE[slotInfo.slot][state.ring].length > 1);
  document.getElementById('viewWrap').style.display = transposing ? '' : 'none';
  const octBtns = document.querySelectorAll('#segOct button');
  octBtns[1].disabled = !canTwoOct;
  octBtns.forEach(b => b.setAttribute('aria-pressed', +b.dataset.o === state.oct ? 'true' : 'false'));
  document.getElementById('soundingWrap').style.display = (transposing && state.view === 'written') ? 'inline-flex' : 'none';
  document.getElementById('namingWrap').style.display = state.lang === 'en' ? 'none' : '';
  document.querySelectorAll('#segView button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.view ? 'true' : 'false'));
  document.querySelectorAll('#segNaming button').forEach(b => b.setAttribute('aria-pressed', b.dataset.n === state.naming ? 'true' : 'false'));
  saveSettings();
}

/* ---------------- Innstillinger ---------------- */
function saveSettings() {
  try {
    localStorage.setItem('notecircle', JSON.stringify({ lang: state.lang, instrId: state.instrId, naming: state.naming }));
  } catch (e) {}
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('notecircle') || '{}');
    if (s.lang && I18N[s.lang]) state.lang = s.lang;
    if (s.instrId && INSTR_BY_ID[s.instrId]) state.instrId = s.instrId;
    if (s.naming === 'intl') state.naming = 'intl';
  } catch (e) {}
  const p = new URLSearchParams(location.search);
  const lang = p.get('lang'), instr = p.get('instr');
  if (lang && I18N[lang]) state.lang = lang;
  if (instr && INSTR_BY_ID[instr]) state.instrId = instr;
}

function initSeg(id, attr, fn) {
  const seg = document.getElementById(id);
  seg.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      fn(b.dataset[attr]);
    });
  });
}
function setInstrument(id) {
  const oldIns = currentInstr();
  const q = quality();
  // Bevar klingende toneart på tvers av instrumentbytte (bufret staving om tilgjengelig)
  let concertTonic = state.view === 'written' ? transposeBy(state.tonic, -oldIns.letters, -oldIns.semis, q) : state.tonic;
  if (state.view === 'written' && state.concertTonic && pcOf(state.concertTonic) === pcOf(concertTonic)) concertTonic = state.concertTonic;
  state.instrId = id;
  const ins = currentInstr();
  if (!(ins.letters || ins.semis)) state.view = 'concert';
  if (state.view === 'written') {
    state.tonic = transposeBy(concertTonic, ins.letters, ins.semis, q);
    state.concertTonic = concertTonic;
  } else {
    state.tonic = concertTonic;
    state.concertTonic = null;
  }
  renderAll();
}
function init() {
  loadSettings();

  // Flaggrad
  const row = document.getElementById('flagRow');
  LANG_ORDER.forEach(code => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'flagbtn';
    b.dataset.lang = code;
    b.setAttribute('aria-label', (I18N[code] && I18N[code].meta && I18N[code].meta.name) || code);
    b.setAttribute('aria-pressed', code === state.lang ? 'true' : 'false');
    b.innerHTML = flagSvg(code);
    b.title = (I18N[code] && I18N[code].meta && I18N[code].meta.name) || code;
    b.addEventListener('click', () => {
      state.lang = code;
      if (state.lang === 'en') state.naming = 'native';
      row.querySelectorAll('.flagbtn').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      renderAll();
    });
    row.appendChild(b);
  });

  document.getElementById('familySel').addEventListener('change', e => setInstrument(FAMILY_BY_ID[e.target.value].std));
  document.getElementById('variantSel').addEventListener('change', e => setInstrument(e.target.value));
  document.getElementById('scaleSel').addEventListener('change', e => {
    state.scale = e.target.value;
    const ring = SCALES[state.scale].ring;
    if (ring !== state.ring) {
      const slot = findSlot(pcOf(state.tonic), ring);
      if (slot) {
        const arr = CIRCLE[slot.slot][ring];
        let pick = arr[slot.enh];
        for (const t of arr) if (t.letter === state.tonic.letter && t.alt === state.tonic.alt) pick = t;
        state.tonic = pick;
      }
      state.ring = ring;
      state.concertTonic = null;
    }
    renderAll();
  });

  initSeg('segView', 'v', v => {
    if (v === state.view) return;
    const ins = currentInstr();
    const q = quality();
    if (v === 'written') {
      state.concertTonic = state.tonic; // husk klingende staving for tapsfri rundtur
      state.tonic = transposeBy(state.tonic, ins.letters, ins.semis, q);
    } else {
      const back = transposeBy(state.tonic, -ins.letters, -ins.semis, q);
      state.tonic = (state.concertTonic && pcOf(state.concertTonic) === pcOf(back)) ? state.concertTonic : back;
      state.concertTonic = null;
    }
    state.view = v;
    renderAll();
  });
  initSeg('segNaming', 'n', n => { state.naming = n; renderAll(); });
  initSeg('segOct', 'o', o => { state.oct = +o; renderAll(); });
  initSeg('segDir', 'd', d => { state.dir = d; renderAll(); });

  const tempo = document.getElementById('tempo');
  tempo.addEventListener('input', () => {
    state.tempo = +tempo.value;
    document.getElementById('tempoVal').textContent = state.tempo + ' ' + T('ui.bpm');
  });
  document.getElementById('playBtn').addEventListener('click', playAll);
  document.getElementById('enhBtn').addEventListener('click', () => {
    const slotInfo = findSlot(pcOf(state.tonic), state.ring);
    if (!slotInfo) return;
    const arr = CIRCLE[slotInfo.slot][state.ring];
    if (arr.length < 2) return;
    const cur = arr.findIndex(x => x.letter === state.tonic.letter && x.alt === state.tonic.alt);
    state.tonic = arr[cur >= 0 ? 1 - cur : 0];
    state.concertTonic = null;
    renderAll();
  });

  renderAll();
}
if (typeof document !== 'undefined') {
  init();
  if (typeof window !== 'undefined') window.__app = { state, renderAll, setInstrument };
}
if (typeof module !== 'undefined' && typeof document === 'undefined') {
  module.exports = { LETTERS, LETTER_SEMIS, noteMidi, diaIndex, fifthsOf, pcOf, tonicFromFifths,
    sigMap, sigList, upMajorSecond, transposeBy, intervalParts, normalizeTonic,
    CIRCLE, findSlot, norName, intlName,
    SCALES, SCALE_GROUPS, spellPitch, buildScale, chooseRootMidi, FINGERINGS, FING_MIN, FING_MAX,
    INSTRUMENTS, INSTR_BY_ID, FAMILIES, FAMILY_BY_ID, CLEFS, I18N, NOTE_SYSTEMS,
    relativeOf, respellIfNeeded, shiftFifth, chooseWrittenRoot, chooseDisplayRoot,
    nativeName, state, LEVEL_KEYS };
}
