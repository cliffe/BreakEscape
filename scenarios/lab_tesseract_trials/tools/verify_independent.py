#!/usr/bin/env python3
"""Independent check of generate.rb output: plain Python for the encodings and
classical ciphers, the openssl CLI for RSA-OAEP, AES-128-CBC, SHA-256 and the
RSA signature. Nothing here shares code with the Ruby generator or CyberChef."""
import base64, codecs, json, os, subprocess, sys, tempfile

d = json.load(open(sys.argv[1])); a = d["artefacts"]; ans = d["answers"]
fails = 0
def check(name, ok, got):
    global fails
    fails += 0 if ok else 1
    print(("PASS" if ok else "FAIL"), name, "->", repr(got)[:80])

def ossl(args, data=b""):
    return subprocess.run(["openssl"] + args, input=data, capture_output=True).stdout

check("L1 leaflet text is codes only", bytes(int(x) for x in a["leaflet_text"].split()).decode() == ans["l1"], a["leaflet_text"])
check("L1 decimal", bytes(int(x) for x in a["l1_leaflet_decimal"].split()).decode() == ans["l1"], ans["l1"])
s = a["l2_card_rundecimal"]
pin = bytes(int(s[i:i+2]) for i in range(0, len(s), 2)).decode()
check("L2 pairs", pin == ans["l2"], pin)
check("L3 binary", bytes(int(b, 2) for b in a["l3_binary"].split()).decode() == ans["l3"], ans["l3"])
check("L4 hex", ans["l4"] in bytes.fromhex(a["l4_hex"]).decode(), bytes.fromhex(a["l4_hex"]).decode())
check("L5 base64", ans["l5"] in base64.b64decode(a["l5_base64"]).decode(), ans["l5"])
def unshift(t, n):
    out = []
    for c in t:
        if c.islower(): out.append(chr((ord(c) - 97 - n) % 26 + 97))
        elif c.isupper(): out.append(chr((ord(c) - 65 - n) % 26 + 65))
        else: out.append(c)
    return "".join(out)
l6 = unshift(base64.b64decode(a["l6_base64_caesar"]).decode(), 6)
check("L6 base64+caesar6", ans["l6"] in l6, l6)
def vig_dec(t, key):
    k = [ord(c) - 97 for c in key.lower()]; i = 0; out = []
    for c in t:
        if c.isalpha():
            base = 97 if c.islower() else 65
            out.append(chr((ord(c) - base - k[i % len(k)]) % 26 + base)); i += 1
        else: out.append(c)
    return "".join(out)
v = vig_dec(a["l7_vigenere"], a["l7_vig_key"])
check("L7 vigenere", v == ans["l7_plain"], v)
import re
iv = re.search(r"letter: ([0-9a-f]{32})", v).group(1)
pw = re.search(r"open with ([a-z]+-\d\d)", v).group(1)
check("L7 IV and pigeonhole password", iv == ans["l8_aes_iv_hex"] and pw == ans["l7_pigeon_pw"], (iv, pw))

with tempfile.TemporaryDirectory() as td:
    priv = os.path.join(td, "priv.pem"); open(priv, "w").write(a["player_private_pem"])
    key_hex = ossl(["pkeyutl", "-decrypt", "-inkey", priv, "-pkeyopt", "rsa_padding_mode:oaep",
                    "-pkeyopt", "rsa_oaep_md:sha1"], base64.b64decode(a["l8_envelope_b64"])).decode()
    check("L8a openssl RSA-OAEP decrypt", key_hex == ans["l8_aes_key_hex"], key_hex)
    pt = ossl(["enc", "-d", "-aes-128-cbc", "-K", key_hex, "-iv", iv],
              bytes.fromhex(a["l8_aes_ct_hex"])).decode()
    check("L8b openssl AES-128-CBC", pt == ans["l8"], pt)
    h = ossl(["dgst", "-sha256", "-r"], ans["l8"].encode()).decode().split()[0]
    check("L10 openssl sha256[0:8]", h[:8] == ans["l10"], h[:8])
    rep = base64.b64decode(a["report_b64"]).decode()
    check("Report base64 has token in a locate pixel URL", ("/px/locate/" + ans["token"] + ".png") in rep, ans["token"])
    h2 = ossl(["dgst", "-sha256", "-r"], a["report_b64"].encode()).decode().split()[0]
    check("Report sha256", h2 == a["report_sha256"], h2)
    pub = os.path.join(td, "ghost.pem"); open(pub, "w").write(a["ghost_public_pem"])
    sig = os.path.join(td, "sig"); open(sig, "wb").write(base64.b64decode(a["report_sig_b64"]))
    msg = os.path.join(td, "msg"); open(msg, "w").write(a["report_b64"])
    r = subprocess.run(["openssl", "dgst", "-sha256", "-verify", pub, "-signature", sig, msg], capture_output=True).stdout.decode().strip()
    check("Report openssl signature", r == "Verified OK", r)

fp = ossl(["dgst", "-sha256", "-r"], a["ghost_public_pem"].encode()).decode().split()[0][:16]
check("Leaflet fingerprint", fp == a["ghost_key_fingerprint"], fp)
e = codecs.decode(bytes.fromhex(a["ebcdic_hex"].replace(" ", "")), "cp037")
check("EBCDIC cp037", e == ans["ebcdic_plain"], e)
check("Poster example Hi! -> SGkh", base64.b64encode(b"Hi!").decode() == "SGkh", "SGkh")
answers = [ans[k] for k in ("l1","l2","l3","l4","l5","l6","l7_pigeon_pw","l8","l10","token")]
check("all typed answers <= 50 chars and lower case", all(len(x) <= 50 and x == x.lower() for x in answers), answers)
print("ALL PASS" if not fails else f"{fails} FAILED")
sys.exit(1 if fails else 0)
