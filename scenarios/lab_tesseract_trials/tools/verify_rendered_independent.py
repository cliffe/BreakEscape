#!/usr/bin/env python3
"""Independent check of the RENDERED scenario (python + openssl CLI; no CyberChef):
each lock's answer is derived from the in-world artefacts and compared with requires."""
import base64, json, os, re, subprocess, sys, tempfile, codecs
d = json.load(open(sys.argv[1])); objs = {}
def walk(o, room):
    if isinstance(o, list):
        for x in o: walk(x, room)
    elif isinstance(o, dict):
        if 'id' in o: objs[o['id']] = o
        for k in ('objects', 'contents', 'npcs', 'itemsHeld'):
            if k in o: walk(o[k], room)
for rid, r in d['rooms'].items(): walk(r, rid)
lock = lambda i: d['rooms'][i] if i in d['rooms'] else objs[i]
fails = 0
def check(name, got, lid):
    global fails
    ok = str(got) == str(lock(lid)['requires']); fails += 0 if ok else 1
    print(('PASS' if ok else 'FAIL'), name, repr(got))
def ossl(args, data=b''): return subprocess.run(['openssl'] + args, input=data, capture_output=True).stdout
check('L1', bytes(int(x) for x in objs['keyholder_leaflet']['text'].split()).decode(), 'cryptosecure_lockbox')
s = objs['trial_ii_card']['text']; check('L2', bytes(int(s[i:i+2]) for i in range(0, len(s), 2)).decode(), 'candidate_locker_4')
check('L3', bytes(int(b, 2) for b in objs['trial_iii_card']['text'].split()).decode(), 'keyholder_guest_terminal')
check('L4', bytes.fromhex(objs['trial_iv_hex']['text']).decode().split()[-1], 'corridor')
check('L5', re.search(r'\d{4}$', base64.b64decode(objs['trial_v_poster']['text']).decode()).group(0), 'library')
def unshift(t, n): return ''.join(chr((ord(c)-97-n) % 26+97) if c.islower() else chr((ord(c)-65-n) % 26+65) if c.isupper() else c for c in t)
check('L6', unshift(base64.b64decode(objs['returns_slip']['text']).decode(), 6).split()[-1], 'special_collections_safe')
key = re.search(r'Block 4, the last entry, holds the data "([a-z]+)"', objs['ledger_whiteboard']['observations']).group(1)
def vig_dec(t, k):
    kk = [ord(c)-97 for c in k]; i = 0; out = []
    for c in t:
        if c.isalpha():
            b = 97 if c.islower() else 65; out.append(chr((ord(c)-b-kk[i % len(kk)]) % 26+b)); i += 1
        else: out.append(c)
    return ''.join(out)
p7 = vig_dec(objs['trial_vii_txt']['text'], key)
check('L7', re.search(r'open with ([a-z]+-\d\d)$', p7).group(1), 'pigeonholes')
hole = ['zero','one','two','three','four','five','six'].index(re.search(r'pigeonhole number ([a-z]+)\.', p7).group(1)); iv = re.search(r'drop box is ([0-9a-f]{32})', p7).group(1)
with tempfile.TemporaryDirectory() as td:
    pk = os.path.join(td, 'p.pem'); open(pk, 'w').write(objs['private_key_pem']['text'])
    aeskey = ossl(['pkeyutl', '-decrypt', '-inkey', pk, '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha1'], base64.b64decode(objs[f'pigeonhole_{hole}']['text'])).decode()
    pw = ossl(['enc', '-d', '-aes-128-cbc', '-K', aeskey, '-iv', iv], bytes.fromhex(objs['drop_box_tag']['text'])).decode()
    check('L8', pw, 'cryptosecure_drop_box')
    check('L10', ossl(['dgst', '-sha256', '-r'], pw.encode()).decode().split()[0][:8], 'relay_terminal')
    rep = base64.b64decode(objs['report_b64']['text']).decode()
    check('scoreboard token', re.search(r'px/locate/([a-z]+-\d{4})/1x1\.png', rep).group(1), 'hacktivity_scoreboard')
    pub = os.path.join(td, 'g.pem'); open(pub, 'w').write(objs['keyholder_public_pem']['text'])
    sig = os.path.join(td, 's'); open(sig, 'wb').write(base64.b64decode(objs['report_sig']['text']))
    msg = os.path.join(td, 'm'); open(msg, 'w').write(objs['report_b64']['text'])
    r = subprocess.run(['openssl', 'dgst', '-sha256', '-verify', pub, '-signature', sig, msg], capture_output=True).stdout.decode().strip()
    ok = r == 'Verified OK'; fails += 0 if ok else 1; print('PASS' if ok else 'FAIL', 'signature', r)
bk = objs['brass_key']; ok = bk['opens_lock'] == d['rooms']['workshop']['requires'] and bk['keyPins'] == d['rooms']['workshop']['keyPins']; fails += 0 if ok else 1; print('PASS' if ok else 'FAIL', 'L9 key')
ok = codecs.decode(bytes.fromhex(objs['job_tape_hex']['text'].replace(' ', '')), 'cp037').startswith('MISKATONIC'); fails += 0 if ok else 1; print('PASS' if ok else 'FAIL', 'EBCDIC')
print('ALL PASS' if not fails else f'{fails} FAILED'); sys.exit(1 if fails else 0)
