/* ================================================================
   Lyd (Web Audio)
   ================================================================ */
let AC = null, playTimers = [], isPlaying = false, playBus = null;
function ensureAC() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function midiFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function brassTone(ac, freq, t0, dur, dest) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.30, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.20, t0 + Math.min(0.18, dur * 0.5));
  g.gain.setValueAtTime(0.20, t0 + dur - 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(Math.min(Math.max(freq * 3.2, 300), 3800), t0);
  f.frequency.exponentialRampToValueAtTime(Math.min(Math.max(freq * 5.5, 400), 4800), t0 + 0.06);
  const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq; o1.detune.value = -4;
  const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 5;
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(dest || ac.destination);
  o1.start(t0); o2.start(t0);
  o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
}
// Klingende justering: skrevet tone klinger (skrevet - semis)
function soundingAdjust() {
  const ins = INSTR_BY_ID[state.instrId];
  if (state.view === 'written' && (ins.letters || ins.semis) && document.getElementById('soundingChk').checked) return -ins.semis;
  return 0;
}
function stopPlayback() {
  playTimers.forEach(clearTimeout); playTimers = [];
  if (playBus) { try { playBus.disconnect(); } catch (e) {} playBus = null; }
  isPlaying = false;
  document.querySelectorAll('.staffnote.playing').forEach(n => n.classList.remove('playing'));
  const b = document.getElementById('playBtn');
  b.innerHTML = '<span class="tri">&#9654;</span> ' + T('ui.play');
}
function playAll() {
  if (isPlaying) { stopPlayback(); return; }
  const ac = ensureAC();
  const adj = soundingAdjust();
  const beat = 60 / state.tempo;
  const dur = Math.min(beat * 0.95, 0.9);
  const t0 = ac.currentTime + 0.08;
  playBus = ac.createGain();
  playBus.connect(ac.destination);
  const bus = playBus;
  const cols = currentNoteRefs;
  cols.forEach((c, i) => {
    brassTone(ac, midiFreq(c.midi + adj), t0 + i * beat, dur, bus);
    playTimers.push(setTimeout(() => {
      document.querySelectorAll('.staffnote.playing').forEach(n => n.classList.remove('playing'));
      c.g.classList.add('playing');
    }, (t0 - ac.currentTime + i * beat) * 1000));
  });
  playTimers.push(setTimeout(stopPlayback, (t0 - ac.currentTime + cols.length * beat) * 1000 + 150));
  isPlaying = true;
  document.getElementById('playBtn').innerHTML = '<span class="tri">&#9632;</span> ' + T('ui.stop');
}
function playOne(midi) {
  const ac = ensureAC();
  brassTone(ac, midiFreq(midi + soundingAdjust()), ac.currentTime + 0.02, 0.65);
}

/* ================================================================
   Tilstand og navigasjon
   ================================================================ */
const state = {
  lang: 'no',
  instrId: 'tromp_bb',
  tonic: { letter: 'C', alt: 0 },
  ring: 'maj',
  scale: 'dur',
  view: 'concert',
  naming: 'native',
  oct: 1,
  dir: 'up',
  tempo: 96,
  level: 1,
};
let currentNoteRefs = [];
function currentInstr() { return INSTR_BY_ID[state.instrId]; }
function isTransposing() { const i = currentInstr(); return !!(i.letters || i.semis); }
function quality() { return state.ring === 'maj' ? 'dur' : 'moll'; }

function selectSlot(slot, ring) {
  const arr = CIRCLE[slot][ring];
  let pick = arr[0];
  for (const t of arr) if (t.letter === state.tonic.letter && t.alt === state.tonic.alt) pick = t;
  state.tonic = pick;
  if (SCALES[state.scale].ring !== ring) {
    state.scale = ring === 'maj' ? 'dur' : 'nmoll';
    document.getElementById('scaleSel').value = state.scale;
  }
  state.ring = ring;
  renderAll();
}
function setTonic(t, ring) {
  state.tonic = t;
  if (ring && SCALES[state.scale].ring !== ring) {
    state.scale = ring === 'maj' ? 'dur' : 'nmoll';
    document.getElementById('scaleSel').value = state.scale;
    state.ring = ring;
  }
  renderAll();
}
function relativeOf(t, ring) {
  const i = LETTERS.indexOf(t.letter);
  if (ring === 'maj') {
    const nl = LETTERS[(i + 5) % 7];
    const borrow = (i - 2 < 0) ? 12 : 0;
    return { letter: nl, alt: LETTER_SEMIS[t.letter] + t.alt - 3 - (LETTER_SEMIS[nl] - borrow) };
  }
  const nl = LETTERS[(i + 2) % 7];
  const carry = (i + 2 > 6) ? 12 : 0;
  return { letter: nl, alt: LETTER_SEMIS[t.letter] + t.alt + 3 - (LETTER_SEMIS[nl] + carry) };
}
function respellIfNeeded(t, quality) {
  const f = fifthsOf(t) - (quality === 'moll' ? 3 : 0);
  if (f > 7) return tonicFromFifths(fifthsOf(t) - 12);
  if (f < -7) return tonicFromFifths(fifthsOf(t) + 12);
  return t;
}
function shiftFifth(t, d, quality) {
  let f = fifthsOf(t) + d;
  const off = quality === 'moll' ? 3 : 0;
  if (f - off > 7) f -= 12;
  if (f - off < -7) f += 12;
  return tonicFromFifths(f);
}

/* ---------------- Registervalg ---------------- */
// Rot i skrevet register: sikter mot nøkkelens midtlinje, begrenset til instrumentets omfang
function chooseWrittenRoot(pc, ins, oct) {
  let lo = ins.lo, hi = ins.hi;
  if (ins.fing === 'brass3') { lo = Math.max(lo, FING_MIN); hi = Math.min(hi, FING_MAX); }
  const span = 12 * oct;
  let hiRoot = hi - span;
  if (hiRoot < lo) hiRoot = lo;
  const target = Math.min(Math.max(CLEFS[ins.clef].centerMidi - 6 * oct, lo), hiRoot);
  let r = lo + ((pc - lo) % 12 + 12) % 12; // minste kandidat >= lo
  let best = r;
  while (r <= hiRoot) {
    if (Math.abs(r - target) < Math.abs(best - target)) best = r;
    r += 12;
  }
  return best;
}
// Rot for klingende visning: sentrér på notesystemet
function chooseDisplayRoot(pc, ins, oct) {
  const target = CLEFS[ins.clef].centerMidi - 6 * oct;
  return pc + 12 * Math.round((target - pc) / 12);
}

/* ================================================================
   Infopanel for tonearten
   ================================================================ */
function factHtml(label, value, big, clickable, id) {
  return `<div class="fact${clickable ? ' clickable' : ''}"${id ? ` id="${id}" role="button" tabindex="0"` : ''}><b>${label}</b><span${big ? ' class="big"' : ''}>${value}</span></div>`;
}
function renderKeyInfo(built) {
  const q = quality();
  const t = state.tonic;
  const ins = currentInstr();
  const sigF = built.sigF;
  const sig = sigList(sigF);
  const sigNames = sig.length ? sig.map(a => dispNote({ letter: a.letter, alt: a.alt })).join(', ') : '—';

  const rel = respellIfNeeded(relativeOf(t, state.ring), q === 'dur' ? 'moll' : 'dur');
  const relQ = q === 'dur' ? 'moll' : 'dur';
  const varT = respellIfNeeded(t, q === 'dur' ? 'moll' : 'dur');
  const dom = shiftFifth(t, 1, q), sub = shiftFifth(t, -1, q);

  const slotInfo = findSlot(pcOf(t), state.ring);
  const enhArr = slotInfo ? CIRCLE[slotInfo.slot][state.ring] : [];
  const curIdx = enhArr.findIndex(x => x.letter === t.letter && x.alt === t.alt);
  const enhSafe = (enhArr.length > 1 && curIdx >= 0) ? enhArr[1 - curIdx] : null;

  const el2 = document.getElementById('keyInfo');
  const heading = scaleHeading(t, state.scale, q);

  let html = `<div class="keyname">${heading}</div>
  <div class="keysub">${state.view === 'written' ? T('ui.writtenKeyFor', { instr: instrName(ins.id) }) : T('ui.concertKey')} · ${scaleName(state.scale)}</div>
  <div class="factgrid">`;
  html += factHtml(T('ui.factSig'), `${fortegnText(sigF)}${sig.length ? ' · ' + sigNames : ''}`, false);
  html += factHtml(T('ui.factRel'), keyLabel(rel, relQ), false, true, 'factRel');
  html += factHtml(T('ui.factVar'), keyLabel(varT, q === 'dur' ? 'moll' : 'dur'), false, true, 'factVar');
  html += factHtml(T('ui.factDom'), keyLabel(dom, q), false, true, 'factDom');
  html += factHtml(T('ui.factSub'), keyLabel(sub, q), false, true, 'factSub');
  html += factHtml(T('ui.factEnh'), enhSafe ? keyLabel(enhSafe, q) : '—', false, !!enhSafe, enhSafe ? 'factEnh' : null);
  html += '</div>';

  const transposing = isTransposing();
  let mapped;
  if (!transposing) {
    mapped = T('ui.nonTransposing', { instr: instrName(ins.id) });
  } else if (state.view === 'written') {
    mapped = T('ui.soundsAs', {
      key: keyLabel(transposeBy(t, -ins.letters, -ins.semis, q), q),
      interval: intervalName(ins.letters, ins.semis),
      dir: T(ins.semis > 0 ? 'theory.lower' : 'theory.higher'),
    });
  } else {
    mapped = T('ui.writtenAs', {
      instr: instrName(ins.id),
      key: keyLabel(transposeBy(t, ins.letters, ins.semis, q), q),
      interval: intervalName(ins.letters, ins.semis),
      dir: T(ins.semis > 0 ? 'theory.higher' : 'theory.lower'),
    });
    if (ins.fing === 'brass3') mapped += T('ui.fingClause');
  }
  html += `<div class="trumpetline">${ins.group === 'brass' ? '🎺' : '🎼'} ${mapped}</div>`;
  el2.innerHTML = html;

  const bind = (id, fn) => {
    const n = document.getElementById(id);
    if (!n) return;
    n.addEventListener('click', fn);
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  };
  bind('factRel', () => { state.ring = relQ === 'dur' ? 'maj' : 'min'; setTonic(rel, state.ring); });
  bind('factVar', () => { state.ring = q === 'dur' ? 'min' : 'maj'; setTonic(varT, state.ring); });
  bind('factDom', () => setTonic(dom, state.ring));
  bind('factSub', () => setTonic(sub, state.ring));
  if (enhSafe) bind('factEnh', () => setTonic(enhSafe, state.ring));
}
