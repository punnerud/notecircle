#!/usr/bin/env python3
"""Sett sammen index.html fra deler + i18n-filer."""
import json, os, sys

parts_js = ['01_core.js', '02_i18n.js', '03_svg.js', '04_state.js', '05_content.js', '06_init.js']
langs = ['no', 'sv', 'da', 'de', 'fr', 'es', 'en']

i18n = {}
for code in langs:
    p = f'i18n_{code}.json'
    if os.path.exists(p):
        i18n[code] = json.load(open(p))
missing = [c for c in langs if c not in i18n]
if missing:
    print('ADVARSEL: mangler språk:', missing, '(faller tilbake til no)')

js = '\n'.join(open(p).read() for p in parts_js)
blob = json.dumps(i18n, ensure_ascii=False, separators=(',', ':'))
assert '/*__I18N__*/{}' in js
js = js.replace('/*__I18N__*/{}', blob, 1)

head = open('00_head.html').read()
body = open('07_body.html').read()
out = head + body + "<script>\n'use strict';\n" + js + "\n</script>\n</body>\n</html>\n"
open('index.html', 'w').write(out)
# Ekstraher JS for node-testing
open('app.js', 'w').write("'use strict';\n" + js)
print(f'index.html: {len(out)} tegn, språk: {sorted(i18n)}')
