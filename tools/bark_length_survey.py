#!/usr/bin/env python3
"""List every spoken bubble line in scenarios/ca*/ and scenarios/_office_kit/ longer than a limit.

D254 M-C: a world speech bubble shows 3 wrapped lines (about 24 characters each) a page. Anything over
LIMIT characters runs to a second page, and used to be cut when its mapping's condition lapsed.
Scans the JSON keys "bark" (event-mapping barks), "chatter" and "lines" (needs chatter pools, string
lists), and the ink files in scenarios/_office_kit/ink/*.ink (text lines in knots whose name starts with
bark_ or chatter_). Prints chars, words, pages (at 72 chars a page) and the source, longest first.

    python3 tools/bark_length_survey.py [--limit 72] [--all-ink]
"""
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else 72
rows = []

def walk(node, path, src):
    if isinstance(node, dict):
        for k, v in node.items():
            if k in ('bark', 'chatter') and isinstance(v, str):
                rows.append((v, f'{src} {path}.{k}'))
            elif k in ('bark', 'chatter', 'lines') and isinstance(v, list) and all(isinstance(x, str) for x in v):
                for i, x in enumerate(v):
                    rows.append((x, f'{src} {path}.{k}[{i}]'))
            else:
                walk(v, f'{path}.{k}', src)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f'{path}[{i}]', src)

def scan_json(text):
    # the .erb shells are JSON apart from the odd <% %> tag; drop the tags
    return json.loads(re.sub(r'<%.*?%>', '0', text, flags=re.S))

for f in sorted(glob.glob(f'{ROOT}/scenarios/ca*/scenario.json.erb') + glob.glob(f'{ROOT}/scenarios/_office_kit/**/*.json', recursive=True)):
    if f.endswith('_ambient.json'):
        continue  # compiled ink, covered through the .ink files
    try:
        walk(scan_json(open(f).read()), '', os.path.relpath(f, ROOT))
    except Exception as e:
        print(f'skip {os.path.relpath(f, ROOT)}: {e}', file=sys.stderr)

for f in sorted(glob.glob(f'{ROOT}/scenarios/_office_kit/ink/*.ink')):
    knot = ''
    for n, line in enumerate(open(f), 1):
        m = re.match(r'===\s*(\w+)', line)
        if m:
            knot = m.group(1)
            continue
        if re.match(r'(bark|chatter)_', knot) and line.strip() and not re.match(r'\s*(->|~|VAR|//|\*|\+|\{|=)', line):
            rows.append((line.strip(), f'{os.path.relpath(f, ROOT)}:{n} knot {knot}'))

over = [(len(t), len(t.split()), t, w) for t, w in rows if len(t) > limit]
over.sort(reverse=True)
print(f'{len(rows)} bubble lines scanned, {len(over)} over {limit} characters')
for c, w, t, where in over:
    print(f'{c:4d} chars {w:3d} words {-(-c // 72)} pages  {where}\n      {t}')
