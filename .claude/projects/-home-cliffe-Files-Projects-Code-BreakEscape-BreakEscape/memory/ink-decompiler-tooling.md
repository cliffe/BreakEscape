---
name: ink-decompiler-tooling
description: Scripts to recover .ink source from compiled inkVersion-21 .json
metadata:
  type: reference
---

When a scenario's `.ink` source is missing but the compiled `.json` exists (e.g. only compiled ink was committed), recover editable source with:

- `scripts/decompile_ink.py <compiled.json>` — emits readable inkVersion-21 ink (knots, choices, conditionals, var ops, tags, external calls, diverts) to stdout.
- `scripts/verify_ink_roundtrip.py <original.json> <recompiled.json>` — recompile the decompiled `.ink` with `bin/inklecate` and confirm a normalized semantic trace (text, tags, VAR= targets, x() calls, knot names) matches the original. **Always verify before trusting** — the game runs from `.json`, so a divergent decompile could change behaviour on recompile.

Used to recover all of m03_ghost_in_the_machine's ink (8 files, all trace-matched). Recompile in-sync with `./scripts/compile-ink.sh <scenario>`. Gotcha found: inklecate rejects `not (x)` for a parenthesised bare identifier — emit `not x`.
