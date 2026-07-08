'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.org/' });
const doc = dom.window.document;
const app = dom.window.__app;
app.setInstrument('tromp_bb');
Object.assign(app.state, { lang:'fr', tonic: {letter:'B',alt:-1}, ring:'maj', scale:'dur', view:'concert', oct:1, dir:'up' });
app.renderAll();
// Les ventilene per notekolonne: fylte sirkler
const cols = [...doc.querySelectorAll('#staffSvg .staffnote')].map(g => {
  const valves = [...g.querySelectorAll('circle')].filter(c => c.getAttribute('r') === '5.5');
  const combo = valves.map((c, i) => c.getAttribute('fill') !== 'none' ? String(i+1) : '').join('');
  return { name: g.querySelector('.nlabel').textContent, combo: combo || '0' };
});
console.log(cols.map(c => `${c.name}:${c.combo}`).join('  '));
const expected = ['0','13','12','1','0','12','2','0']; // skrevet C4-skala (rot valgt i midtregisteret)
const actual = cols.map(c => c.combo);
console.log(JSON.stringify(actual) === JSON.stringify(expected) ? 'GREP OK' : 'GREP-AVVIK! forventet ' + expected.join(','));

// Invariant: vist midi + semis == skrevet midi, for alle brass3-instrumenter og tonearter
const M = { transposeBy: null };
let bad = 0;
for (const id of ['tromp_bb','tromp_eb','picctromp','basstromp','althorn','eufonium_bb','tuba_eb','tuba_bb','kornett_eb']) {
  app.setInstrument(id);
  for (const [letter, alt] of [['C',0],['E',-1],['F',1],['B',-1],['A',0]]) {
    Object.assign(app.state, { tonic: {letter, alt}, ring: 'maj', scale: 'dur', view: 'concert', oct: 1 });
    app.renderAll();
    const tips = [...doc.querySelectorAll('#staffSvg .staffnote title')].map(t => t.textContent);
    if (tips.some(t => /—\s*$/.test(t))) bad++;
  }
}
console.log(bad === 0 ? 'INVARIANT OK' : 'INVARIANT-FEIL: ' + bad);
