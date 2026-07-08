'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const errors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.org/',
  beforeParse(w) { w.addEventListener('error', e => errors.push('window: ' + e.message)); }
});
const doc = dom.window.document;
const app = dom.window.__app;
let steps = 0;
function step(desc, fn) { steps++; try { fn(); } catch (e) { errors.push(`${desc}: ${e.message}`); } }
function click(el) { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }

step('app finnes', () => { if (!app) throw new Error('__app mangler'); });

// Alle språk x alle instrumenter (grunnrendring)
const langs = ['no','sv','da','de','fr','es','en'];
for (const lang of langs) {
  step('språk ' + lang, () => { doc.querySelector(`.flagbtn[data-lang="${lang}"]`).dispatchEvent(new dom.window.MouseEvent('click', {bubbles:true})); });
}
const instrIds = [...doc.querySelectorAll('#instrSel option')].map(o => o.value);
if (instrIds.length !== 41) errors.push('forventet 41 instrumenter, fikk ' + instrIds.length);
for (const id of instrIds) {
  step('instrument ' + id, () => app.setInstrument(id));
}

// Kombinasjoner: hvert instrument x view-toggle x et par skalaer/tonearter
for (const id of ['tromp_bb','picctromp','barisax','horn_f','tuba','viola','dbass','klokkespill','pauker','tuba_bb','basstromp','klar_eb']) {
  step('sett ' + id, () => app.setInstrument(id));
  const vb = doc.querySelectorAll('#segView button');
  step(id + ' written', () => { if (doc.getElementById('viewWrap').style.display !== 'none') click(vb[1]); });
  step(id + ' skala hmoll', () => { const s = doc.getElementById('scaleSel'); s.value='hmoll'; s.dispatchEvent(new dom.window.Event('change',{bubbles:true})); });
  step(id + ' 2 okt', () => { const b = doc.querySelectorAll('#segOct button')[1]; if (!b.disabled) click(b); });
  doc.querySelectorAll('#circleSvg .segpath').forEach((p, i) => { if (i % 5 === 0) step(`${id} segment ${i}`, () => click(p)); });
  step(id + ' concert', () => { if (doc.getElementById('viewWrap').style.display !== 'none') click(vb[0]); });
  step(id + ' 1 okt', () => click(doc.querySelectorAll('#segOct button')[0]));
  step(id + ' skala dur', () => { const s = doc.getElementById('scaleSel'); s.value='dur'; s.dispatchEvent(new dom.window.Event('change',{bubbles:true})); });
}

// Faktakort + nivåknapper + enharmonisk i tysk modus
step('tysk', () => click(doc.querySelector('.flagbtn[data-lang="de"]')));
for (const id of ['factRel','factVar','factDom','factSub']) {
  const n = doc.getElementById(id);
  if (n) step('fakta ' + id, () => click(n));
}
doc.querySelectorAll('.lvl-keys button').forEach((b, i) => { if (i % 3 === 0) step('nivåknapp ' + i, () => click(b)); });
step('enh', () => { const b = doc.getElementById('enhBtn'); if (!b.disabled) click(b); });

// Tilstands-invariant
step('invariant tonic', () => {
  if (Math.abs(app.state.tonic.alt) > 1) throw new Error('dobbeltfortegn-tonika: ' + JSON.stringify(app.state.tonic));
});
console.log(`${steps} steg, ${errors.length} feil`);
errors.slice(0, 25).forEach(e => console.log('FEIL:', e));
process.exit(errors.length ? 1 : 0);
