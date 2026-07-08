const LETTERS = ['C','D','E','F','G','A','B'];
const LETTER_SEMIS = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const LETTER_FIFTHS = { C:0, D:2, E:4, F:-1, G:1, A:3, B:5 };
const SHARP_ORDER = ['F','C','G','D','A','E','B'];
const FLAT_ORDER  = ['B','E','A','D','G','C','F'];
// Faste fortegn i G-nøkkel: diatonisk posisjon (oktav*7 + bokstavindeks)
const SHARP_SIG_DI = [38, 35, 39, 36, 33, 37, 34]; // F5 C5 G5 D5 A4 E5 B4
const FLAT_SIG_DI  = [34, 37, 33, 36, 32, 35, 31]; // B4 E5 A4 D5 G4 C5 F4

function noteMidi(n) { return 12 * (n.octave + 1) + LETTER_SEMIS[n.letter] + n.alt; }
function diaIndex(n) { return n.octave * 7 + LETTERS.indexOf(n.letter); }
function fifthsOf(t) { return LETTER_FIFTHS[t.letter] + 7 * t.alt; }
function pcOf(t) { return ((LETTER_SEMIS[t.letter] + t.alt) % 12 + 12) % 12; }

// Tonika fra kvintindeks: ...-7=Cess, 0=C, 7=Ciss
function tonicFromFifths(f) {
  const idx = (((f + 1) % 7) + 7) % 7;
  return { letter: 'FCGDAEB'[idx], alt: Math.floor((f + 1) / 7) };
}
// Faste fortegn for kvintindeks f: {bokstav: alterasjon}
function sigMap(f) {
  const m = { C:0, D:0, E:0, F:0, G:0, A:0, B:0 };
  if (f > 0) for (let i = 0; i < f; i++) m[SHARP_ORDER[i]] = 1;
  if (f < 0) for (let i = 0; i < -f; i++) m[FLAT_ORDER[i]] = -1;
  return m;
}
function sigList(f) {
  const out = [];
  if (f > 0) for (let i = 0; i < Math.min(f, 7); i++) out.push({ letter: SHARP_ORDER[i], alt: 1, di: SHARP_SIG_DI[i] });
  if (f < 0) for (let i = 0; i < Math.min(-f, 7); i++) out.push({ letter: FLAT_ORDER[i], alt: -1, di: FLAT_SIG_DI[i] });
  return out;
}
// Respell tonika om tonearten havner utenfor de 15 standardsignaturene.
// quality: 'dur' eller 'moll' — moll-signaturen ligger 3 kvinter under tonika.
function normalizeTonic(out, quality) {
  const off = quality === 'moll' ? 3 : 0;
  const sig = fifthsOf(out) - off;
  if (sig > 7) return tonicFromFifths(fifthsOf(out) - 12);
  if (sig < -7) return tonicFromFifths(fifthsOf(out) + 12);
  return out;
}
// Transponer en stavemåte opp en stor sekund (klingende -> skrevet for B♭)
function upMajorSecond(t, quality) {
  const i = LETTERS.indexOf(t.letter);
  const nl = LETTERS[(i + 1) % 7];
  const carry = (i + 1 > 6) ? 12 : 0;
  const out = { letter: nl, alt: LETTER_SEMIS[t.letter] + t.alt + 2 - (LETTER_SEMIS[nl] + carry) };
  return normalizeTonic(out, quality || 'dur');
}

/* ---------------- Kvintsirkelen ---------------- */
// 12 posisjoner med klokka fra C. maj/min: liste av stavemåter (enharmoniske varianter)
const CIRCLE = [
  { maj: [{letter:'C',alt:0}],                    min: [{letter:'A',alt:0}] },
  { maj: [{letter:'G',alt:0}],                    min: [{letter:'E',alt:0}] },
  { maj: [{letter:'D',alt:0}],                    min: [{letter:'B',alt:0}] },
  { maj: [{letter:'A',alt:0}],                    min: [{letter:'F',alt:1}] },
  { maj: [{letter:'E',alt:0}],                    min: [{letter:'C',alt:1}] },
  { maj: [{letter:'B',alt:0},{letter:'C',alt:-1}], min: [{letter:'G',alt:1},{letter:'A',alt:-1}] },
  { maj: [{letter:'F',alt:1},{letter:'G',alt:-1}], min: [{letter:'D',alt:1},{letter:'E',alt:-1}] },
  { maj: [{letter:'D',alt:-1},{letter:'C',alt:1}], min: [{letter:'B',alt:-1},{letter:'A',alt:1}] },
  { maj: [{letter:'A',alt:-1}],                   min: [{letter:'F',alt:0}] },
  { maj: [{letter:'E',alt:-1}],                   min: [{letter:'C',alt:0}] },
  { maj: [{letter:'B',alt:-1}],                   min: [{letter:'G',alt:0}] },
  { maj: [{letter:'F',alt:0}],                    min: [{letter:'D',alt:0}] },
];
function findSlot(pc, ring) {
  for (let s = 0; s < 12; s++) {
    const arr = CIRCLE[s][ring];
    for (let e = 0; e < arr.length; e++) if (pcOf(arr[e]) === pc) return { slot: s, enh: e };
  }
  return null;
}

/* ---------------- Notenavn ---------------- */
function norName(letter, alt) {
  if (letter === 'B') {
    if (alt === 0) return 'H';
    if (alt === 1) return 'Hiss';
    if (alt === 2) return 'Hississ';
    if (alt === -1) return 'B';
    return 'Bess'; // H♭♭ (sjelden)
  }
  if (alt === 0) return letter;
  if (alt > 0) return letter + 'iss'.repeat(alt);
  let s = letter;
  for (let i = 0; i < -alt; i++) s += (i === 0 && (letter === 'E' || letter === 'A')) ? 'ss' : 'ess';
  return s;
}
function accSymbol(alt) {
  if (alt === 1) return '♯';
  if (alt === -1) return '♭';
  if (alt === 2) return '×';        // dobbeltkryss (×)
  if (alt === -2) return '♭♭'; // dobbelt-b
  return '';
}
function intlName(letter, alt) { return letter + accSymbol(alt); }
function dispNote(t, naming) { return naming === 'nor' ? norName(t.letter, t.alt) : intlName(t.letter, t.alt); }
// Tonikanavn i skalaoverskrifter: moll-baserte skalaer får liten forbokstav på norsk
function scaleTonicName(t, scaleId, naming) {
  const n = dispNote(t, naming);
  return (naming === 'nor' && SCALES[scaleId].ring === 'min') ? n.charAt(0).toLowerCase() + n.slice(1) : n;
}
function keyLabel(t, quality, naming) {
  const n = dispNote(t, naming);
  if (quality === 'dur') return n + '-dur';
  return (naming === 'nor' ? n.toLowerCase() : n) + '-moll';
}
function fortegnText(f) {
  if (f === 0) return 'ingen faste fortegn';
  const n = Math.abs(f);
  if (f > 0) return n + (n === 1 ? ' kryss' : ' kryss');
  return n + (n === 1 ? ' b' : ' b-er');
}

/* ---------------- Skalaer ---------------- */
// sig: 'major' = tonika som dur | 'minor' = parallell dur (moll-fortegn) |
//      offsetF (tall) = tonikas kvintindeks minus offset | 'none' = løse fortegn
const SCALES = {
  dur:        { name: 'Dur (jonisk)',            lvl: 1, ring: 'maj', sigOff: 0,      semis: [0,2,4,5,7,9,11], lets: [0,1,2,3,4,5,6] },
  nmoll:      { name: 'Naturlig moll (eolisk)',  lvl: 1, ring: 'min', sigOff: 3,      semis: [0,2,3,5,7,8,10], lets: [0,1,2,3,4,5,6] },
  durpent:    { name: 'Durpentaton',             lvl: 1, ring: 'maj', sigOff: 0,      semis: [0,2,4,7,9],      lets: [0,1,2,4,5] },
  hmoll:      { name: 'Harmonisk moll',          lvl: 2, ring: 'min', sigOff: 3,      semis: [0,2,3,5,7,8,11], lets: [0,1,2,3,4,5,6] },
  mmoll:      { name: 'Melodisk moll (oppover)', lvl: 2, ring: 'min', sigOff: 3,      semis: [0,2,3,5,7,9,11], lets: [0,1,2,3,4,5,6] },
  mollpent:   { name: 'Mollpentaton',            lvl: 2, ring: 'min', sigOff: 3,      semis: [0,3,5,7,10],     lets: [0,2,3,4,6] },
  blues:      { name: 'Blues',                   lvl: 2, ring: 'min', sigOff: 3,      semis: [0,3,5,6,7,10],   lets: [0,2,3,4,4,6] },
  krom:       { name: 'Kromatisk',               lvl: 2, ring: 'maj', sigOff: 'none', semis: null, lets: null },
  dorisk:     { name: 'Dorisk',                  lvl: 3, ring: 'min', sigOff: 2,      semis: [0,2,3,5,7,9,10], lets: [0,1,2,3,4,5,6] },
  frygisk:    { name: 'Frygisk',                 lvl: 3, ring: 'min', sigOff: 4,      semis: [0,1,3,5,7,8,10], lets: [0,1,2,3,4,5,6] },
  lydisk:     { name: 'Lydisk',                  lvl: 3, ring: 'maj', sigOff: -1,     semis: [0,2,4,6,7,9,11], lets: [0,1,2,3,4,5,6] },
  mikso:      { name: 'Miksolydisk',             lvl: 3, ring: 'maj', sigOff: 1,      semis: [0,2,4,5,7,9,10], lets: [0,1,2,3,4,5,6] },
  lokrisk:    { name: 'Lokrisk',                 lvl: 3, ring: 'min', sigOff: 5,      semis: [0,1,3,5,6,8,10], lets: [0,1,2,3,4,5,6] },
  heltone:    { name: 'Heltoneskala',            lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,2,4,6,8,10],   lets: [0,1,2,3,4,5] },
  dimhh:      { name: 'Dim (hel–halv)',     lvl: 4, ring: 'min', sigOff: 'none', semis: [0,2,3,5,6,8,9,11], lets: [0,1,2,3,4,5,5,6] },
  dimhalv:    { name: 'Dim (halv–hel)',     lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,1,3,4,6,7,9,10], lets: [0,1,2,2,3,4,5,6] },
  alterert:   { name: 'Alterert (superlokrisk)', lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,1,3,4,6,8,10], lets: [0,1,2,3,4,5,6] },
  lyddom:     { name: 'Lydisk dominant',         lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,2,4,6,7,9,10], lets: [0,1,2,3,4,5,6] },
  frygdom:    { name: 'Frygisk dominant',        lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,1,4,5,7,8,10], lets: [0,1,2,3,4,5,6] },
  bebopdom:   { name: 'Bebop-dominant',          lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,2,4,5,7,9,10,11], lets: [0,1,2,3,4,5,6,6] },
  bebopdur:   { name: 'Bebop-dur',               lvl: 4, ring: 'maj', sigOff: 'none', semis: [0,2,4,5,7,8,9,11], lets: [0,1,2,3,4,5,5,6] },
  arpdur:     { name: 'Dur-treklang',            lvl: 3, ring: 'maj', sigOff: 0,      semis: [0,4,7],    lets: [0,2,4], arp: true },
  arpmoll:    { name: 'Moll-treklang',           lvl: 3, ring: 'min', sigOff: 3,      semis: [0,3,7],    lets: [0,2,4], arp: true },
  arpdom7:    { name: 'Dominantseptim',          lvl: 3, ring: 'maj', sigOff: 1,      semis: [0,4,7,10], lets: [0,2,4,6], arp: true },
  arpmaj7:    { name: 'Maj7',                    lvl: 4, ring: 'maj', sigOff: 0,      semis: [0,4,7,11], lets: [0,2,4,6], arp: true },
  arpm7:      { name: 'Moll7',                   lvl: 4, ring: 'min', sigOff: 3,      semis: [0,3,7,10], lets: [0,2,4,6], arp: true },
  arpdim7:    { name: 'Dim7',                    lvl: 4, ring: 'min', sigOff: 'none', semis: [0,3,6,9],  lets: [0,2,4,6], arp: true },
};
const SCALE_GROUPS = [
  { key: 'g1', ids: ['dur','nmoll','durpent'] },
  { key: 'g2', ids: ['hmoll','mmoll','mollpent','blues','krom'] },
  { key: 'g3', ids: ['dorisk','frygisk','lydisk','mikso','lokrisk'] },
  { key: 'g4', ids: ['arpdur','arpmoll','arpdom7','arpmaj7','arpm7','arpdim7'] },
  { key: 'g5', ids: ['heltone','dimhh','dimhalv','alterert','lyddom','frygdom','bebopdom','bebopdur'] },
];

// Kromatisk staving uten dobbeltfortegn
const SHARP_SPELL = [['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
const FLAT_SPELL  = [['C',0],['D',-1],['D',0],['E',-1],['E',0],['F',0],['G',-1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
function spellPitch(midi, useFlats) {
  const pc = ((midi % 12) + 12) % 12;
  const [letter, alt] = (useFlats ? FLAT_SPELL : SHARP_SPELL)[pc];
  return { letter, alt, octave: Math.floor(midi / 12) - 1 };
}

// Bygg skalaen fra en tonika-stavemåte. Returnerer {notes, sigF, degrees}
function buildScale(tonic, typeId, rootMidi, octaves) {
  const def = SCALES[typeId];
  // Faste fortegn
  let sigF;
  if (def.sigOff === 'none') sigF = 0;
  else {
    sigF = fifthsOf(tonic) - def.sigOff;
    if (sigF > 7 || sigF < -7) sigF = 0; // utenfor standard -> løse fortegn i stedet
  }
  const notes = [];
  const degrees = [];
  if (typeId === 'krom') {
    const useFlats = fifthsOf(tonic) < 0;
    const span = 12 * octaves;
    for (let i = 0; i <= span; i++) {
      notes.push(spellPitch(rootMidi + i, useFlats));
      degrees.push(i % 12 === 0 ? '1' : '');
    }
    return { notes, sigF: 0, degrees };
  }
  const Li = LETTERS.indexOf(tonic.letter);
  const baseOct = Math.round((rootMidi - LETTER_SEMIS[tonic.letter] - tonic.alt) / 12) - 1;
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  const oneOct = def.semis.map((s, i) => ({ s, lo: def.lets[i] }));
  const seq = [];
  for (let o = 0; o < octaves; o++) oneOct.forEach(x => seq.push({ s: x.s + 12 * o, lo: x.lo + 7 * o }));
  seq.push({ s: 12 * octaves, lo: 7 * octaves }); // toppen: tonika
  for (const { s, lo } of seq) {
    const letter = LETTERS[(Li + lo) % 7];
    const octave = baseOct + Math.floor((Li + lo) / 7);
    const target = rootMidi + s;
    notes.push({ letter, alt: target - (12 * (octave + 1) + LETTER_SEMIS[letter]), octave });
    const dNum = (lo % 7) + 1;
    const diff = ((s % 12) - MAJ[lo % 7] + 24) % 12;
    const dAcc = diff === 0 ? '' : diff === 11 ? '♭' : diff === 1 ? '♯' : diff === 10 ? '♭♭' : '';
    degrees.push((s % 12 === 0 && dNum === 1) ? '1' : dAcc + dNum);
  }
  return { notes, sigF, degrees };
}

// Velg rot-oktav slik at alt ligger godt på G-nøkkelsystemet og innenfor trompetregisteret
function chooseRootMidi(tonic, view, octaves) {
  const pc = pcOf(tonic);
  let lo;
  if (octaves === 2) lo = (view === 'written') ? 54 : 52;
  else lo = 57;
  let m = lo + ((pc - lo) % 12 + 12) % 12;
  return m;
}

/* ---------------- Grep for B♭-trompet (skrevet tonehøyde) ---------------- */
// f = hovedgrep, a = vanlige alternativgrep, i = intonasjonsmerknad
const FINGERINGS = {
  54: { f: '123', i: 'i123' },
  55: { f: '13',  i: 'i13' },
  56: { f: '23' },
  57: { f: '12', a: ['3'] },
  58: { f: '1' },
  59: { f: '2' },
  60: { f: '0' },
  61: { f: '123', i: 'i123' },
  62: { f: '13',  i: 'i13' },
  63: { f: '23' },
  64: { f: '12', a: ['3'] },
  65: { f: '1' },
  66: { f: '2' },
  67: { f: '0' },
  68: { f: '23' },
  69: { f: '12', a: ['3'] },
  70: { f: '1' },
  71: { f: '2' },
  72: { f: '0' },
  73: { f: '12', a: ['3', '123'] },
  74: { f: '1',  a: ['13'] },
  75: { f: '2',  a: ['23'] },
  76: { f: '0',  a: ['12'], i: 'i5th' },
  77: { f: '1' },
  78: { f: '2' },
  79: { f: '0',  a: ['13'] },
  80: { f: '23' },
  81: { f: '12', a: ['3'] },
  82: { f: '1' },
  83: { f: '2' },
  84: { f: '0' },
  85: { f: '12', i: 'ihigh12' },
  86: { f: '1',  i: 'ihigh' },
  87: { f: '2',  i: 'ihigh' },
  88: { f: '0',  i: 'ihigh' },
  89: { f: '1',  i: 'ihigh' },
  90: { f: '2',  i: 'ihigh' },
  91: { f: '0',  i: 'ihigh' },
};
const FING_MIN = 54, FING_MAX = 91;
function fingeringFor(writtenMidi) { return FINGERINGS[writtenMidi] || null; }

/* ---------------- Generell transponering ---------------- */
// written = concert + (letters, semis). quality styrer respelling-grensen.
function transposeBy(t, letters, semis, quality) {
  if (!letters && !semis) return { letter: t.letter, alt: t.alt };
  const i = LETTERS.indexOf(t.letter);
  const li = i + letters;
  const nl = LETTERS[((li % 7) + 7) % 7];
  const octShift = Math.floor(li / 7);
  const base = LETTER_SEMIS[t.letter] + t.alt;
  const naturalRel = LETTER_SEMIS[nl] + 12 * octShift;
  return normalizeTonic({ letter: nl, alt: base + semis - naturalRel }, quality || 'dur');
}
// Intervallnavn-komponenter fra (letters, semis), absoluttverdier
function intervalParts(letters, semis) {
  const L = Math.abs(letters), S = Math.abs(semis);
  const octs = Math.floor(L / 7);
  const rem = L % 7, remS = S - 12 * octs;
  const PERF = { 0: 0, 3: 5, 4: 7 };
  let qual = 'maj';
  if (rem in PERF) qual = 'perf';
  else { const MAJ = { 1: 2, 2: 4, 5: 9, 6: 11 }; qual = (remS === MAJ[rem]) ? 'maj' : 'min'; }
  return { octs, num: rem, qual };
}

/* ---------------- Nøkler (clefs) ---------------- */
const CLEFS = {
  treble: { bottomDi: 30, sigShift: 0,  anchorLine: 1, centerMidi: 71 }, // G4-linja, midt = H4
  alto:   { bottomDi: 24, sigShift: 7,  anchorLine: 2, centerMidi: 60 }, // C4-linja
  bass:   { bottomDi: 18, sigShift: 14, anchorLine: 3, centerMidi: 50 }, // F3-linja, midt = D3
};

/* ---------------- Instrumenter ----------------
   interval: skrevet = klingende + (letters, semis). fing: 'brass3' = trompetgrepstabellen gjelder.
   range: skrevet register [lav, høy] i midi. */
const INSTRUMENTS = [
  { id: 'violin',      group: 'strings',  clef: 'treble', letters: 0,   semis: 0,   fing: null,     lo: 55, hi: 91 },
  { id: 'viola',       group: 'strings',  clef: 'alto',   letters: 0,   semis: 0,   fing: null,     lo: 48, hi: 81 },
  { id: 'cello',       group: 'strings',  clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 36, hi: 67 },
  { id: 'dbass',       group: 'strings',  clef: 'bass',   letters: 7,   semis: 12,  fing: null,     lo: 40, hi: 67 },
  { id: 'piccolo',     group: 'woodwind', clef: 'treble', letters: -7,  semis: -12, fing: null,     lo: 62, hi: 93 },
  { id: 'flute',       group: 'woodwind', clef: 'treble', letters: 0,   semis: 0,   fing: null,     lo: 60, hi: 93 },
  { id: 'altflute',    group: 'woodwind', clef: 'treble', letters: 3,   semis: 5,   fing: null,     lo: 60, hi: 89 },
  { id: 'oboe',        group: 'woodwind', clef: 'treble', letters: 0,   semis: 0,   fing: null,     lo: 58, hi: 86 },
  { id: 'englhorn',    group: 'woodwind', clef: 'treble', letters: 4,   semis: 7,   fing: null,     lo: 59, hi: 86 },
  { id: 'klar_bb',     group: 'woodwind', clef: 'treble', letters: 1,   semis: 2,   fing: null,     lo: 52, hi: 91 },
  { id: 'klar_a',      group: 'woodwind', clef: 'treble', letters: 2,   semis: 3,   fing: null,     lo: 52, hi: 91 },
  { id: 'klar_eb',     group: 'woodwind', clef: 'treble', letters: -2,  semis: -3,  fing: null,     lo: 52, hi: 88 },
  { id: 'bassklar',    group: 'woodwind', clef: 'treble', letters: 8,   semis: 14,  fing: null,     lo: 51, hi: 84 },
  { id: 'fagott',      group: 'woodwind', clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 34, hi: 64 },
  { id: 'kontrafag',   group: 'woodwind', clef: 'bass',   letters: 7,   semis: 12,  fing: null,     lo: 34, hi: 60 },
  { id: 'sopransax',   group: 'woodwind', clef: 'treble', letters: 1,   semis: 2,   fing: null,     lo: 58, hi: 88 },
  { id: 'altsax',      group: 'woodwind', clef: 'treble', letters: 5,   semis: 9,   fing: null,     lo: 58, hi: 88 },
  { id: 'tenorsax',    group: 'woodwind', clef: 'treble', letters: 8,   semis: 14,  fing: null,     lo: 58, hi: 88 },
  { id: 'barisax',     group: 'woodwind', clef: 'treble', letters: 12,  semis: 21,  fing: null,     lo: 57, hi: 88 },
  { id: 'tromp_bb',    group: 'brass',    clef: 'treble', letters: 1,   semis: 2,   fing: 'brass3', lo: 54, hi: 91 },
  { id: 'tromp_c',     group: 'brass',    clef: 'treble', letters: 0,   semis: 0,   fing: 'brass3', lo: 54, hi: 91 },
  { id: 'tromp_d',     group: 'brass',    clef: 'treble', letters: -1,  semis: -2,  fing: 'brass3', lo: 54, hi: 89 },
  { id: 'tromp_eb',    group: 'brass',    clef: 'treble', letters: -2,  semis: -3,  fing: 'brass3', lo: 54, hi: 89 },
  { id: 'picctromp',   group: 'brass',    clef: 'treble', letters: -6,  semis: -10, fing: 'brass3', lo: 54, hi: 86, fourValve: true },
  { id: 'kornett_bb',  group: 'brass',    clef: 'treble', letters: 1,   semis: 2,   fing: 'brass3', lo: 54, hi: 89 },
  { id: 'kornett_eb',  group: 'brass',    clef: 'treble', letters: -2,  semis: -3,  fing: 'brass3', lo: 54, hi: 88 },
  { id: 'flygelhorn',  group: 'brass',    clef: 'treble', letters: 1,   semis: 2,   fing: 'brass3', lo: 54, hi: 86 },
  { id: 'basstromp',   group: 'brass',    clef: 'treble', letters: 8,   semis: 14,  fing: 'brass3', lo: 54, hi: 84 },
  { id: 'horn_f',      group: 'brass',    clef: 'treble', letters: 4,   semis: 7,   fing: null,     lo: 46, hi: 81 },
  { id: 'althorn',     group: 'brass',    clef: 'treble', letters: 5,   semis: 9,   fing: 'brass3', lo: 54, hi: 84 },
  { id: 'trombone',    group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 40, hi: 70 },
  { id: 'basstrombone',group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 34, hi: 67 },
  { id: 'eufonium_c',  group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 34, hi: 70 },
  { id: 'eufonium_bb', group: 'brass',    clef: 'treble', letters: 8,   semis: 14,  fing: 'brass3', lo: 54, hi: 84 },
  { id: 'tuba',        group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 28, hi: 58 },
  { id: 'tuba_eb',     group: 'brass',    clef: 'treble', letters: 12,  semis: 21,  fing: 'brass3', lo: 54, hi: 82 },
  { id: 'tuba_bb',     group: 'brass',    clef: 'treble', letters: 15,  semis: 26,  fing: 'brass3', lo: 54, hi: 80 },
  { id: 'piano',       group: 'other',    clef: 'treble', letters: 0,   semis: 0,   fing: null,     lo: 48, hi: 88 },
  { id: 'klokkespill', group: 'other',    clef: 'treble', letters: -14, semis: -24, fing: null,     lo: 55, hi: 84 },
  { id: 'xylofon',     group: 'other',    clef: 'treble', letters: -7,  semis: -12, fing: null,     lo: 60, hi: 89 },
  { id: 'pauker',      group: 'other',    clef: 'bass',   letters: 0,   semis: 0,   fing: null,     lo: 40, hi: 55 },
];
const INSTR_BY_ID = {};
INSTRUMENTS.forEach(x => { INSTR_BY_ID[x.id] = x; });
const INSTR_GROUP_ORDER = ['brass', 'woodwind', 'strings', 'other'];
