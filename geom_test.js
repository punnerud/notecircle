'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.org/' });
const doc = dom.window.document;
const app = dom.window.__app;
let fails = 0, checks = 0;
function ok(c, m) { checks++; if (!c) { fails++; console.log('FAIL:', m); } }
function set(patch) { Object.assign(app.state, patch); app.renderAll(); }

// Hent notesystem-geometri: linje-y-er, note-cy-er, hjelpelinjer per note, fortegn-y-er
function staffGeom() {
  const svg = doc.getElementById('staffSvg');
  const lines = [...svg.children].filter(n => n.tagName === 'line').map(n => +n.getAttribute('y1'));
  const notes = [...svg.querySelectorAll('.staffnote')].map(g => {
    const head = g.querySelector('.notehead');
    const ledgers = [...g.querySelectorAll('line')].map(l => +l.getAttribute('y1'));
    return { cy: +head.getAttribute('cy'), ledgers };
  });
  return { lines: lines.sort((a,b)=>a-b), notes };
}
const SP = 12;

// --- Tuba, C-dur (C2..C3): bassnøkkel ---
app.setInstrument('tuba');
set({ tonic: {letter:'C',alt:0}, ring:'maj', scale:'dur', view:'concert', lang:'no', oct:1, dir:'up' });
let g = staffGeom();
ok(g.lines.length === 5, 'tuba: 5 linjer');
const bottom = g.lines[4];
// C2: di 14, bunnlinje G2 di 18 -> 2 steg под = 24px under bunnlinja, 2 hjelpelinjer (16, 14)
ok(Math.abs(g.notes[0].cy - (bottom + 24)) < 0.6, `tuba C2 cy: ${g.notes[0].cy} vs ${bottom + 24}`);
ok(g.notes[0].ledgers.length === 2, `tuba C2 hjelpelinjer: ${g.notes[0].ledgers.length} (forventet 2)`);
// D2 (di 15): 1.5 steg under, hjelpelinje bare på 16 (én)
ok(g.notes[1].ledgers.length === 1, `tuba D2 hjelpelinjer: ${g.notes[1].ledgers.length} (forventet 1)`);
// Toppen C3 (di 21): andre mellomrom: bottom - 18px
ok(Math.abs(g.notes[7].cy - (bottom - 18)) < 0.6, `tuba C3 cy: ${g.notes[7].cy} vs ${bottom - 18}`);

// --- Bratsj, D-dur: altnøkkel, 2 kryss (Fiss4 di31, Ciss4 di28) ---
app.setInstrument('viola');
set({ tonic: {letter:'D',alt:0}, ring:'maj', scale:'dur' });
g = staffGeom();
const vb = g.lines[4]; // bunnlinje F3 (di 24)
// D3 di 22: 12px under bunnlinja, med 1 hjelpelinje på egen posisjon
ok(Math.abs(g.notes[0].cy - (vb + 12)) < 0.6, `bratsj D3 cy: ${g.notes[0].cy} vs ${vb + 12}`);
ok(g.notes[0].ledgers.length === 1, `bratsj D3 hjelpelinjer: ${g.notes[0].ledgers.length}`);
// Fortegn: Fiss4 di 31 -> (31-24)*6 = 42px over bunnlinja; Ciss4 di 28 -> 24px (midtlinja)
const sigTexts = [...doc.getElementById('staffSvg').children].filter(n => n.tagName === 'text');
// første to tekstelementer på toppnivå er faste fortegn (resten ligger i .staffnote-grupper)
const sig1y = +sigTexts[0].getAttribute('y') - 20*0.34; // trekk fra dy-justeringen for kryss
const sig2y = +sigTexts[1].getAttribute('y') - 20*0.34;
ok(Math.abs(sig1y - (vb - 42)) < 8, `bratsj Fiss4-fortegn y: ${sig1y.toFixed(1)} vs ${vb - 42}`);
ok(Math.abs(sig2y - (vb - 24)) < 8, `bratsj Ciss4-fortegn y: ${sig2y.toFixed(1)} vs ${vb - 24}`);
// Toppen D4 di 29: (29-24)*6 = 30px over bunnlinja
ok(Math.abs(g.notes[7].cy - (vb - 30)) < 0.6, `bratsj D4 cy: ${g.notes[7].cy} vs ${vb - 30}`);

// --- Fiolin (G-nøkkel) regresjon: C-dur C4..C5, C4 med 1 hjelpelinje ---
app.setInstrument('violin');
set({ tonic: {letter:'C',alt:0}, ring:'maj', scale:'dur' });
g = staffGeom();
const fb = g.lines[4]; // E4 di 30
ok(Math.abs(g.notes[0].cy - (fb + 12)) < 0.6, `fiolin C4 cy: ${g.notes[0].cy} vs ${fb + 12}`);
ok(g.notes[0].ledgers.length === 1, `fiolin C4 hjelpelinje: ${g.notes[0].ledgers.length}`);

// --- Grep-paritet: altsax klingende Ess-dur = skrevet C-dur (ingen grep, men skrevet skala brukes) ---
app.setInstrument('tromp_bb');
set({ tonic: {letter:'E',alt:-1}, ring:'maj', scale:'dur', view:'concert' });
// klingende Ess -> skrevet F-dur; første grep = grep for skrevet F4 (65) = '1'
const tip = doc.querySelector('.staffnote title').textContent;
ok(/grep: 1(\s|\()/.test(tip) || /grep: 1$/.test(tip), `trompet Ess-dur klingende: første grep for skrevet F = 1: "${tip}"`);

console.log(`${checks} sjekker, ${fails} feil`);
process.exit(fails ? 1 : 0);
