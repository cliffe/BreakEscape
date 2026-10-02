#!/usr/bin/env python3
"""
Verify a decompiled .ink recompiles to a runtime JSON semantically equivalent to
the original compiled .json.

We compare a normalized "trace": the ordered multiset of meaningful runtime
elements — output text, tags, VAR= assignment targets, external calls (x()),
choice texts, and named knots/stitches. Internal auto-generated labels and
exact container nesting are ignored (inklecate regenerates those).

Usage: verify_ink_roundtrip.py <original.json> <recompiled.json>
Exits 0 if traces match, 1 otherwise (prints a diff summary).
"""
import json, sys
from collections import Counter

def trace(root):
    texts = []
    tags = []
    varset = Counter()
    xcalls = Counter()
    names = set()

    def walk(x):
        if isinstance(x, list):
            i = 0
            while i < len(x):
                el = x[i]
                if el == "#":
                    j = i+1; buf=[]
                    while j < len(x) and x[j] != "/#":
                        if isinstance(x[j],str) and x[j].startswith("^"): buf.append(x[j][1:])
                        j+=1
                    tags.append("".join(buf)); i=j+1; continue
                walk(el); i+=1
        elif isinstance(x, dict):
            for k,v in x.items():
                if k == "VAR=": varset[v]+=1
                elif k == "x()": xcalls[v]+=1
                elif k in ("#n","#f","->","*","c","b","flg","re","VAR?","temp=","CNT?","#"): pass
                else:
                    if not k.startswith("#") and not k.startswith("/"):
                        names.add(k)
                walk(v)
        elif isinstance(x, str):
            if x.startswith("^"):
                t = x[1:]
                if t.strip(): texts.append(t)
    walk(root)
    # normalize text: strip, collapse spaces
    norm = Counter(" ".join(t.split()) for t in texts if t.strip())
    return norm, Counter(t.strip() for t in tags if t.strip()), varset, xcalls, names

def main():
    a = json.load(open(sys.argv[1]))["root"]
    b = json.load(open(sys.argv[2]))["root"]
    ta = trace(a); tb = trace(b)
    labels = ["text","tags","var-assign","ext-calls","knot/stitch names"]
    ok = True
    for lab, ca, cb in zip(labels, ta, tb):
        if isinstance(ca, set):
            miss = ca - cb; extra = cb - ca
        else:
            miss = ca - cb; extra = cb - ca
        if miss or extra:
            ok = False
            print(f"  [{lab}] MISMATCH")
            if miss: print(f"    missing in recompiled ({len(miss)}): {list(miss)[:6]}")
            if extra: print(f"    extra in recompiled ({len(extra)}): {list(extra)[:6]}")
    print("  ✅ trace match" if ok else "  ❌ trace differs")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
