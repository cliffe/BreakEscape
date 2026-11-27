#!/usr/bin/env python3
"""Proof 5: regenerating every awareness shell from scratch reproduces HEAD.

    python3 proof5.py [--keep] [--full] <work_dir>

* exports HEAD (git archive) into <work_dir>/head, and a working copy of it into <work_dir>/root;
* runs the six generators with `--repo <root> <work_dir>/gen/<generator>` (scratch only), then lays
  their shells over <root>/scenarios;
* runs `apply_training_room.py --repo <root> --kit <work_dir>/kit` (every tiered row; the tool skips
  fixtures) and lays its output over <root>/scenarios;
* compares every generated file and every kit-spliced scenario.json.erb with HEAD. The three twins in
  JSON_COMPARED (HEAD holds hand-compacted one-line `verdict` objects) are compared as parsed JSON,
  everything else byte for byte.

Exit 0 only when nothing differs. Each failing path is printed. Nothing is ever written into the
checkout this script sits in: the generators run against the export.

The export holds only planning_notes/phishing_and_social_engineering and scenarios (what the generators
and the splice tool read); --full exports all of HEAD (about 2 GB, 13 s more).
--keep leaves <work_dir> in place; otherwise the folders this script made in it are removed on a pass
(a failing run always keeps them, with the generators' logs).
"""
import filecmp
import json
import os
import shutil
import subprocess
import sys
import tarfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
CHECKOUT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
AW_REL = 'planning_notes/phishing_and_social_engineering/awareness'
EXPORT_PATHS = ['planning_notes/phishing_and_social_engineering', 'scenarios']

GENERATORS = ['gen_core00_shell', 'gen_e1_shells', 'gen_e2_e4_shells',
              'gen_e3_e5_shells', 'gen_e6_e7_shells', 'gen_e8_e17_shells']

# Known drift: HEAD holds hand-compacted one-line `verdict` objects in these shells' JSON files (and, for
# ca12, a one-line `kind` object that a test reads: commit 610efa306), which a generator cannot write.
# The four shells in JSON_COMPARED (ca12, ca14, ca16 and ca18 defend) are compared as parsed JSON for every
# .erb and .json file, not byte for byte. Parsed comparison still checks every value and list order (so a
# mapping index shift fails); it ignores whitespace and dict key order (so a key reorder, for example in
# messageCaughtVerdicts, would pass). Review R1 m4 and R2 m4 accepted this: narrowing it is not worth a
# per-line whitelist.
JSON_COMPARED = {'ca12_visitor_tailgater_defend', 'ca14_social_media_defend', 'ca16_insider_risk_defend',
                 'ca18_credential_attacks_at_scale_defend'}

OWNED = ('head', 'root', 'gen', 'kit', 'logs')


def run(cmd, log, cwd):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    with open(log, 'w') as f:
        f.write(f'$ {" ".join(cmd)}\n{r.stdout}{r.stderr}')
    return r


def export_head(dest, full):
    os.makedirs(dest)
    cmd = ['git', '-C', CHECKOUT, 'archive', 'HEAD'] + ([] if full else EXPORT_PATHS)
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    with tarfile.open(fileobj=p.stdout, mode='r|') as tar:
        tar.extractall(dest, filter='tar') if hasattr(tarfile, 'data_filter') else tar.extractall(dest)
    if p.wait() != 0:
        sys.exit('git archive HEAD failed')


def same(path_a, path_b, as_json):
    """True when two files match: parsed JSON for the listed twins' JSON files, else byte for byte."""
    if not os.path.isfile(path_a) or not os.path.isfile(path_b):
        return False
    if as_json and path_a.endswith(('.erb', '.json')):
        try:
            with open(path_a) as a, open(path_b) as b:
                return json.load(a) == json.load(b)
        except ValueError:
            return False
    return filecmp.cmp(path_a, path_b, shallow=False)


def walk_files(base):
    for dp, _, names in os.walk(base):
        for n in names:
            yield os.path.relpath(os.path.join(dp, n), base)


def proof(work, full=False):
    """Run the proof in <work>. Returns (list of failure strings, list of notes)."""
    for d in OWNED:
        shutil.rmtree(os.path.join(work, d), ignore_errors=True)
    os.makedirs(os.path.join(work, 'logs'))
    head, root = os.path.join(work, 'head'), os.path.join(work, 'root')
    fails, notes = [], []

    export_head(head, full)
    shutil.copytree(head, root, symlinks=True)
    aw = os.path.join(root, AW_REL)

    generated = []       # (shell, [relative files])
    for g in GENERATORS:
        out = os.path.join(work, 'gen', g)
        os.makedirs(out)
        r = run([sys.executable, os.path.join(aw, g + '.py'), '--repo', root, out], os.path.join(work, 'logs', g + '.log'), work)
        if r.returncode != 0:
            fails.append(f'{g}: exited {r.returncode} (see {work}/logs/{g}.log): {(r.stderr or r.stdout).strip().splitlines()[-1:]}')
            continue
        for shell in sorted(os.listdir(out)):
            files = sorted(walk_files(os.path.join(out, shell)))
            generated.append((shell, files))
            shutil.copytree(os.path.join(out, shell), os.path.join(root, 'scenarios', shell), dirs_exist_ok=True)
    seen = {}
    for shell, _ in generated:
        seen[shell] = seen.get(shell, 0) + 1
    for shell, n in seen.items():
        if n > 1:
            fails.append(f'{shell}: written by {n} generators')

    kit_out = os.path.join(work, 'kit')
    os.makedirs(kit_out)
    r = run([sys.executable, os.path.join(aw, 'apply_training_room.py'), '--repo', root, '--kit', kit_out],
            os.path.join(work, 'logs', 'apply_training_room_kit.log'), work)
    kit_shells = []
    if r.returncode != 0:
        fails.append(f'apply_training_room.py --kit: exited {r.returncode} (see {work}/logs/apply_training_room_kit.log): '
                     f'{(r.stderr or r.stdout).strip().splitlines()[-1:]}')
    else:
        for shell in sorted(os.listdir(kit_out)):
            kit_shells.append(shell)
            shutil.copytree(os.path.join(kit_out, shell), os.path.join(root, 'scenarios', shell), dirs_exist_ok=True)

    checks = {}          # (shell, relative file) -> True, ordered
    for shell, files in generated:
        for f in files:
            checks[(shell, f)] = True
    for shell in kit_shells:
        checks[(shell, 'scenario.json.erb')] = True

    for shell, f in checks:
        got = os.path.join(root, 'scenarios', shell, f)
        want = os.path.join(head, 'scenarios', shell, f)
        if not os.path.isfile(want):
            fails.append(f'scenarios/{shell}/{f}: not in HEAD')
        elif not same(got, want, shell in JSON_COMPARED):
            fails.append(f'scenarios/{shell}/{f}: differs from HEAD' + (' (as JSON)' if shell in JSON_COMPARED else ' (bytes)'))

    # Second pass: a shell whose row is tiered, generated and not hand-authored is built with its kit by the
    # generator itself (tier argument), so its raw generator output (no --kit step) must equal the
    # kit-spliced result in root. A generator that writes the kit differently from the splice fails here.
    with open(os.path.join(root, AW_REL, 'office_kits', 'episodes.json')) as f:
        rows = {r['id']: r for r in json.load(f)['episodes']}
    tiered = {sh for sh, r in rows.items()
              if r.get('tier', 'none') != 'none' and not r.get('handAuthored') and not r.get('fixture')}
    n_nokit = 0
    for shell, files in generated:
        if shell not in tiered:
            continue
        for g in GENERATORS:
            raw = os.path.join(work, 'gen', g, shell)
            if not os.path.isdir(raw):
                continue
            for f in files:
                n_nokit += 1
                if not same(os.path.join(raw, f), os.path.join(root, 'scenarios', shell, f), shell in JSON_COMPARED):
                    fails.append(f'scenarios/{shell}/{f}: generator output without --kit differs from the kit splice')
    notes.append(f'no-kit pass: {len(tiered)} tiered generated rows, {n_nokit} files compared')

    # HEAD files in a generated shell that no generator writes: reported, not failed (hand-added ink, say)
    for shell, files in generated:
        base = os.path.join(head, 'scenarios', shell)
        if os.path.isdir(base):
            # dungeon_graph.* and compiled ink .json are build products, not generator output
            extra = sorted(f for f in set(walk_files(base)) - set(files)
                           if not f.startswith('dungeon_graph.') and not f.endswith('.json'))
            if extra and shell not in kit_shells:
                notes.append(f'{shell}: in HEAD but not generated: {", ".join(extra)}')
    notes.append(f'{len(generated)} generated shells, {len(kit_shells)} kit-spliced, {len(checks)} files compared')
    return fails, notes


def main(argv):
    keep = '--keep' in argv
    full = '--full' in argv
    args = [a for a in argv if not a.startswith('--')]
    if len(args) != 1:
        sys.exit(__doc__.split('\n\n')[0] + '\n\nusage: proof5.py [--keep] [--full] <work_dir>')
    work = os.path.abspath(args[0])
    if os.path.commonpath([work, CHECKOUT]) == CHECKOUT and not os.path.relpath(work, CHECKOUT).startswith(('tmp' + os.sep, '.claude')):
        sys.exit('work_dir inside the checkout must be under tmp/ (gitignored)')
    os.makedirs(work, exist_ok=True)
    t0 = time.time()
    fails, notes = proof(work, full)
    for n in notes:
        print('note:', n)
    for f in fails:
        print('FAIL:', f)
    print(f'proof5: {len(fails)} difference(s) from HEAD in {time.time() - t0:.0f}s')
    if not keep and not fails:     # a failing run keeps its logs and outputs for inspection
        for d in OWNED:
            shutil.rmtree(os.path.join(work, d), ignore_errors=True)
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
