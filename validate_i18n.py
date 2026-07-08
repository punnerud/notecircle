#!/usr/bin/env python3
import json, re, sys

master = json.load(open('i18n_no.json'))
langs = ['sv', 'da', 'de', 'fr', 'es', 'en']

def leafs(obj, prefix=''):
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.update(leafs(v, f'{prefix}.{k}' if prefix else k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out.update(leafs(v, f'{prefix}[{i}]'))
    else:
        out[prefix] = obj
    return out

mleafs = leafs(master)
tok = lambda s: sorted(re.findall(r'\{(\w+)\}', s)) if isinstance(s, str) else []

problems = {}
for code in langs:
    try:
        d = json.load(open(f'i18n_{code}.json'))
    except Exception as e:
        problems[code] = [f'JSON-FEIL: {e}']
        continue
    lf = leafs(d)
    probs = []
    for k, v in mleafs.items():
        if k in ('meta.lang', 'meta.name'):
            continue
        if k not in lf:
            probs.append(f'MANGLER: {k}')
        elif tok(mleafs[k]) != tok(lf[k]):
            probs.append(f'TOKENS: {k}: master={tok(mleafs[k])} vs {tok(lf[k])}')
    extra = [k for k in lf if k not in mleafs and k != 'intervals.unison']
    for k in extra:
        probs.append(f'EKSTRA: {k}')
    if probs:
        problems[code] = probs

for code, probs in problems.items():
    print(f'--- {code}: {len(probs)} problemer')
    for p in probs[:20]:
        print('   ', p)
if not problems:
    print('ALLE SPRÅK OK')
