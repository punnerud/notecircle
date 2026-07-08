# Notecircle · Notesirkelen 🎺🎻🎷

Interactive circle of fifths for the whole orchestra — scales, key signatures, transposition and fingerings. **7 languages** (norsk, svenska, dansk, Deutsch, français, español, English) · **41 instruments** incl. the full trumpet family.

**Try it: [punnerud.github.io/notecircle](https://punnerud.github.io/notecircle/)**

Interaktiv kvintsirkel for hele orkesteret — skalaer, fortegn, transponering og grep. Norsk som standardspråk; bytt språk med flaggene øverst.

## Features / Funksjoner

- **Circle of fifths** — clickable major/minor rings, dominant/subdominant markers, enharmonic swap
- **Staff notation** in treble, bass and alto clef with correct key signatures, ledger lines and accidentals; clef follows the sounding register in concert view
- **41 instruments** — strings, woodwinds, brass (9 trumpet variants: B♭/C/D/E♭, piccolo, cornets, flugelhorn, bass trumpet), keyboard & percussion — each with its own transposition, clef and range
- **Concert ↔ written pitch** toggle, with valve fingerings wherever the standard 3-valve chart applies (trumpet family, althorn, brass-band euphonium & tubas)
- **26 scales** from beginner to professional: major, three minors, pentatonics, blues, chromatic, church modes, arpeggios, jazz & symmetric scales
- **Native note names per language** — H/B (no·sv·da·de), solfège (fr·es), letters (en) — with international toggle
- **Playback** (Web Audio), level cards from beginner to conservatory, theory reference with per-instrument transposition tables

## Technical

One self-contained `index.html` — no dependencies, no build step (assembled from the numbered source parts with `build.py`). Vanilla JS + SVG + Web Audio. Light/dark theme via `prefers-color-scheme`. Language/instrument selection persists in `localStorage` and can be shared via URL: `?lang=de&instr=horn_f`.

Made with [Claude Code](https://claude.com/claude-code).
