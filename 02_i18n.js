/* ================================================================
   Språk og notenavn
   ================================================================ */
const I18N = /*__I18N__*/{};
const LANG_ORDER = ['no', 'sv', 'da', 'de', 'fr', 'es', 'en'];
const NOTE_SYSTEMS = { no: 'gss', sv: 'gss', da: 'gs', de: 'gs', fr: 'sf_fr', es: 'sf_es', en: 'letters' };
const SCALE_NAME_LOWER = { no: 1, sv: 1, da: 1, fr: 1, es: 1 };

function T(path, tokens) {
  const dig = (lang) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), I18N[lang]);
  let v = dig(state.lang);
  if (v == null) v = dig('no');
  if (typeof v === 'string' && tokens) v = fmt(v, tokens);
  return v;
}
function fmt(s, tokens) {
  return s.replace(/\{(\w+)\}/g, (m, k) => (tokens && k in tokens) ? tokens[k] : m);
}

// Notenavn i språkets egen tradisjon
function nativeName(letter, alt, sys) {
  if (sys === 'letters') return intlName(letter, alt);
  if (sys === 'gss') return norName(letter, alt);
  if (sys === 'gs') { // tysk/dansk enkeltkonsonant
    if (letter === 'B') {
      if (alt === 0) return 'H';
      if (alt === 1) return 'His';
      if (alt === 2) return 'Hisis';
      if (alt === -1) return 'B';
      return 'Heses';
    }
    if (alt > 0) return letter + 'is'.repeat(alt);
    if (alt === 0) return letter;
    const single = { C: 'Ces', D: 'Des', E: 'Es', F: 'Fes', G: 'Ges', A: 'As' }[letter];
    if (alt === -1) return single;
    return { E: 'Eses', A: 'Asas' }[letter] || (single + 'es');
  }
  const base = sys === 'sf_fr' ? ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si']
                               : ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  return base[LETTERS.indexOf(letter)] + accSymbol(alt);
}
function dispNote(t, namingOverride) {
  const naming = namingOverride || state.naming;
  if (naming === 'intl') return intlName(t.letter, t.alt);
  return nativeName(t.letter, t.alt, NOTE_SYSTEMS[state.lang] || 'letters');
}
function lcFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
function keyLabel(t, quality) {
  const n = dispNote(t);
  if (quality === 'dur') return fmt(T('keys.majorPattern'), { note: n });
  const note = T('keys.minorLowercase') ? lcFirst(n) : n;
  return fmt(T('keys.minorPattern'), { note });
}
function scaleName(id) {
  const base = T('scales.' + id);
  return SCALES[id].arp ? base + ' ' + T('scales.arpSuffix') : base;
}
function scaleTonicName(t, scaleId) {
  const n = dispNote(t);
  return (T('keys.minorLowercase') && SCALES[scaleId].ring === 'min') ? lcFirst(n) : n;
}
function scaleHeading(t, scaleId, quality) {
  if (scaleId === 'dur' || scaleId === 'nmoll') return keyLabel(t, quality);
  let nm = scaleName(scaleId);
  if (SCALE_NAME_LOWER[state.lang]) nm = nm.toLowerCase();
  return scaleTonicName(t, scaleId) + ' ' + nm;
}
function fortegnText(f) {
  if (f === 0) return T('ui.noSig');
  const n = Math.abs(f);
  if (f > 0) return n + ' ' + T(n === 1 ? 'ui.sharpOne' : 'ui.sharpMany');
  return n + ' ' + T(n === 1 ? 'ui.flatOne' : 'ui.flatMany');
}
// «en stor sekund», «en oktav og en ren kvint», «to oktaver» ...
function intervalName(letters, semis) {
  const p = intervalParts(letters, semis);
  const iv = T('intervals');
  if (p.num === 0 && p.octs > 0) return p.octs === 1 ? iv.octaveOne : iv.octaveTwo;
  if (p.num === 0 && p.octs === 0 && iv.unison) return iv.unison;
  const core = fmt(iv.pattern, { qual: iv.qualities[p.qual], num: iv.numbers[p.num] });
  if (p.octs === 0) return core;
  const oct = p.octs === 1 ? iv.octaveOne : iv.octaveTwo;
  return fmt(iv.octavePlus, { oct, qual: iv.qualities[p.qual], num: iv.numbers[p.num] });
}
function instrName(id) { return T('instruments.' + id) || id; }

/* ---------------- Flagg (inline SVG, 24x16) ---------------- */
function flagSvg(code) {
  const r = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  let inner = '';
  if (code === 'no') inner = r(0,0,24,16,'#BA0C2F') + r(6,0,4,16,'#fff') + r(0,6,24,4,'#fff') + r(7,0,2,16,'#00205B') + r(0,7,24,2,'#00205B');
  if (code === 'sv') inner = r(0,0,24,16,'#006AA7') + r(7,0,3,16,'#FECC02') + r(0,6.5,24,3,'#FECC02');
  if (code === 'da') inner = r(0,0,24,16,'#C8102E') + r(7,0,3,16,'#fff') + r(0,6.5,24,3,'#fff');
  if (code === 'de') inner = r(0,0,24,5.33,'#000') + r(0,5.33,24,5.34,'#DD0000') + r(0,10.67,24,5.33,'#FFCE00');
  if (code === 'fr') inner = r(0,0,8,16,'#002395') + r(8,0,8,16,'#fff') + r(16,0,8,16,'#ED2939');
  if (code === 'es') inner = r(0,0,24,16,'#AA151B') + r(0,4,24,8,'#F1BF00');
  if (code === 'en') inner = r(0,0,24,16,'#012169')
    + `<path d="M0 0 L24 16 M24 0 L0 16" stroke="#fff" stroke-width="3.2"/>`
    + `<path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" stroke-width="1.4"/>`
    + r(10,0,4,16,'#fff') + r(0,6,24,4,'#fff') + r(11,0,2,16,'#C8102E') + r(0,7,24,2,'#C8102E');
  return `<svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">${inner}</svg>`;
}
