'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.org/' });
const doc = dom.window.document;
const app = dom.window.__app;
const VARS = {'--bg':'#FBFAF7','--surface':'#FFFFFF','--surface2':'#F5F2EA','--ink':'#26221A','--muted':'#77705E','--line':'#E4DFD2','--line-strong':'#CFC8B5','--brass':'#A67C1B','--brass-strong':'#7E5E10','--brass-soft':'#F1E8CF','--slate':'#4A6076','--slate-strong':'#35485A','--slate-soft':'#E5EBF1','--on-brass':'#FFFDF5','--on-slate':'#FFFDF5','--staff-ink':'#343026','--play':'#B05A1F'};
function dump(id, out) {
  let s = doc.getElementById(id).outerHTML.replace(/var\((--[a-z0-9-]+)\)/g, (m,v)=>VARS[v]||'#F0F');
  s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" font-family="DejaVu Sans"');
  fs.writeFileSync(out, s);
  console.log('wrote', out);
}
function set(patch) { Object.assign(app.state, patch); app.renderAll(); }

// 1. Tuba (bassnøkkel), C-dur klingende
app.setInstrument('tuba');
set({ tonic: {letter:'C',alt:0}, ring:'maj', scale:'dur', view:'concert', lang:'no', oct:1 });
dump('staffSvg', 'q_tuba_c.svg');

// 2. Bratsj (altnøkkel), D-dur
app.setInstrument('viola');
set({ tonic: {letter:'D',alt:0}, ring:'maj', scale:'dur' });
dump('staffSvg', 'q_viola_d.svg');

// 3. Altsax, skrevet visning av klingende Ess-dur -> skrevet C-dur
app.setInstrument('altsax');
set({ tonic: {letter:'E',alt:-1}, ring:'maj', scale:'dur', view:'concert' });
doc.querySelectorAll('#segView button')[1].dispatchEvent(new dom.window.MouseEvent('click', {bubbles:true}));
dump('staffSvg', 'q_altsax_written.svg');

// 4. Trompet i B♭ regresjon, fransk språk, klingende B-dur
app.setInstrument('tromp_bb');
set({ lang:'fr', tonic: {letter:'B',alt:-1}, ring:'maj', scale:'dur', view:'concert' });
dump('staffSvg', 'q_tromp_fr.svg');

// 5. Tysk sirkel
set({ lang:'de', tonic: {letter:'E',alt:-1}, ring:'maj', scale:'dur' });
dump('circleSvg', 'q_circle_de.svg');

// 6. Barytonsax klingende Ess-dur -> skal få bassnøkkel (klinger dypt)
app.setInstrument('barisax');
set({ lang:'no', tonic: {letter:'E',alt:-1}, ring:'maj', scale:'dur', view:'concert', oct:1 });
dump('staffSvg', 'q_barisax_concert.svg');
