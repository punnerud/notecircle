'use strict';
const M = require('./app.js');
let fails = 0, checks = 0;
function eq(a, b, msg) {
  checks++;
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) { fails++; console.log(`FAIL: ${msg}\n  got      ${sa}\n  expected ${sb}`); }
}
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('FAIL: ' + msg); } }

// ---- transposeBy: rundtur og pitch-класс for alle instrumenter ----
const TONICS = [];
for (const slot of M.CIRCLE) TONICS.push(...slot.maj);
for (const ins of M.INSTRUMENTS) {
  for (const t of TONICS) {
    const w = M.transposeBy(t, ins.letters, ins.semis, 'dur');
    eq(M.pcOf(w), ((M.pcOf(t) + ins.semis) % 12 + 12) % 12, `${ins.id} pc ${JSON.stringify(t)}`);
    const back = M.transposeBy(w, -ins.letters, -ins.semis, 'dur');
    eq(M.pcOf(back), M.pcOf(t), `${ins.id} rundtur ${JSON.stringify(t)}`);
    ok(Math.abs(M.fifthsOf(w)) <= 7, `${ins.id} skrevet toneart standard ${JSON.stringify(w)}`);
  }
}
// Stikkprøver
const N = t => M.nativeName(t.letter, t.alt, 'gss');
eq(N(M.transposeBy({letter:'C',alt:0}, 5, 9, 'dur')), 'A', 'altsax: klingende C -> skrevet A');
eq(N(M.transposeBy({letter:'E',alt:-1}, 5, 9, 'dur')), 'C', 'altsax: klingende Ess -> skrevet C');
eq(N(M.transposeBy({letter:'C',alt:0}, 4, 7, 'dur')), 'G', 'horn i F: klingende C -> skrevet G');
eq(N(M.transposeBy({letter:'F',alt:0}, 4, 7, 'dur')), 'C', 'horn i F: klingende F -> skrevet C');
eq(N(M.transposeBy({letter:'C',alt:0}, 8, 14, 'dur')), 'D', 'tenorsax: klingende C -> skrevet D');
eq(N(M.transposeBy({letter:'C',alt:0}, 12, 21, 'dur')), 'A', 'barisax: klingende C -> skrevet A');
eq(N(M.transposeBy({letter:'C',alt:0}, 15, 26, 'dur')), 'D', 'tuba BB: klingende C -> skrevet D');
eq(N(M.transposeBy({letter:'C',alt:0}, -6, -10, 'dur')), 'D', 'picc.trompet: klingende C -> skrevet D (m7 under)');
eq(N(M.transposeBy({letter:'C',alt:0}, 2, 3, 'dur')), 'Ess', 'klarinett i A: klingende C -> skrevet Ess');
eq(N(M.transposeBy({letter:'C',alt:0}, -2, -3, 'dur')), 'A', 'Ess-klarinett: klingende C -> skrevet A');
eq(N(M.transposeBy({letter:'C',alt:0}, 3, 5, 'dur')), 'F', 'altfløyte i G: klingende C -> skrevet F');
eq(N(M.transposeBy({letter:'C',alt:0}, -7, -12, 'dur')), 'C', 'pikkolo: samme navn, oktav opp');

// ---- intervalParts ----
eq(M.intervalParts(1, 2), {octs:0, num:1, qual:'maj'}, 'M2');
eq(M.intervalParts(4, 7), {octs:0, num:4, qual:'perf'}, 'P5');
eq(M.intervalParts(5, 9), {octs:0, num:5, qual:'maj'}, 'M6');
eq(M.intervalParts(8, 14), {octs:1, num:1, qual:'maj'}, 'M9 = oktav + M2');
eq(M.intervalParts(12, 21), {octs:1, num:5, qual:'maj'}, 'M13 = oktav + M6');
eq(M.intervalParts(7, 12), {octs:1, num:0, qual:'perf'}, 'oktav');
eq(M.intervalParts(15, 26), {octs:2, num:1, qual:'maj'}, '2 oktaver + M2');
eq(M.intervalParts(-6, -10), {octs:0, num:6, qual:'min'}, 'm7');
eq(M.intervalParts(2, 3), {octs:0, num:2, qual:'min'}, 'm3');

// ---- chooseWrittenRoot: innafor register for alle instrumenter ----
for (const ins of M.INSTRUMENTS) {
  for (let pc = 0; pc < 12; pc++) {
    for (const oct of [1, 2]) {
      if (oct === 2 && ins.hi - ins.lo < 24) continue; // UI tilbyr ikke 2 oktaver
      const r = M.chooseWrittenRoot(pc, ins, oct);
      const lo = ins.fing === 'brass3' ? Math.max(ins.lo, M.FING_MIN) : ins.lo;
      const hi = ins.fing === 'brass3' ? Math.min(ins.hi, M.FING_MAX) : ins.hi;
      ok(r >= lo, `${ins.id} rot >= lo: pc=${pc} oct=${oct} -> ${r} (lo=${lo})`);
      if (hi - lo >= 12 * oct + 11) {
        ok(r + 12 * oct <= hi, `${ins.id} topp innafor: pc=${pc} oct=${oct} -> ${r + 12*oct} (hi=${hi})`);
      } else {
        ok(r + 12 * oct <= hi + 11, `${ins.id} maks 11 semitoner overskyting: pc=${pc} oct=${oct} -> ${r + 12*oct} (hi=${hi})`);
      }
    }
  }
}
// brass3: grep finnes for hele skalaen
for (const ins of M.INSTRUMENTS.filter(x => x.fing === 'brass3')) {
  for (const t of TONICS) {
    for (const oct of [1, 2]) {
      const w = M.transposeBy(t, ins.letters, ins.semis, 'dur');
      const r = M.chooseWrittenRoot(M.pcOf(w), ins, oct);
      const b = M.buildScale(w, 'dur', r, oct);
      for (const n of b.notes) {
        const m = M.noteMidi(n);
        ok(M.FINGERINGS[m], `${ins.id} grep for ${m} (${JSON.stringify(t)} oct=${oct})`);
      }
    }
  }
}

// ---- Notenavn per språksystem ----
eq(M.nativeName('E', -1, 'gs'), 'Es', 'tysk/dansk Es');
eq(M.nativeName('F', 1, 'gs'), 'Fis', 'Fis');
eq(M.nativeName('B', 0, 'gs'), 'H', 'H');
eq(M.nativeName('B', -1, 'gs'), 'B', 'B');
eq(M.nativeName('B', -2, 'gs'), 'Heses', 'Heses');
eq(M.nativeName('A', -2, 'gs'), 'Asas', 'Asas');
eq(M.nativeName('E', -2, 'gs'), 'Eses', 'Eses');
eq(M.nativeName('B', 1, 'gs'), 'His', 'His');
eq(M.nativeName('F', 1, 'sf_fr'), 'Fa♯', 'Fa dièse-symbol');
eq(M.nativeName('B', -1, 'sf_fr'), 'Si♭', 'Si bémol');
eq(M.nativeName('E', 0, 'sf_es'), 'Mi', 'Mi');
eq(M.nativeName('B', 0, 'letters'), 'B', 'engelsk B');

// ---- I18N-oppslag per språk (via state) ----
const app = M;
for (const lang of ['no','sv','da','de','fr','es','en']) {
  ok(M.I18N[lang], 'språk finnes: ' + lang);
  ok(M.I18N[lang].ui.play, 'play-streng: ' + lang);
  ok(M.I18N[lang].levels.length === 4, '4 nivåer: ' + lang);
  ok(Object.keys(M.I18N[lang].instruments).length === M.INSTRUMENTS.length, 'alle instrumentnavn: ' + lang);
}
// tysk nøkkelmønster
M.state.lang = 'de';
ok(M.I18N.de.keys.majorPattern.indexOf('Dur') > 0, 'tysk Dur-mønster: ' + M.I18N.de.keys.majorPattern);
M.state.lang = 'en';
ok(/major/.test(M.I18N.en.keys.majorPattern), 'engelsk major-mønster');
ok(M.I18N.en.keys.minorLowercase === false, 'engelsk beholder stor bokstav i moll');
M.state.lang = 'no';

console.log(`\n${checks} sjekker, ${fails} feil`);
process.exit(fails ? 1 : 0);
