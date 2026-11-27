# HANDOVER — P-H2 (ca06–ca11), hit the 200k context stop mid-package

Branch `feat/ca-living-office-w2`, worktree `.claude/worktrees/b-ca-lo-w2`. Brief v4 (208b39748). Shared index: commit only with `git commit -m ... -- <explicit paths>`; for a new file `git add -- <path>` first.

## Commit
- `6244385f1` — layers 0/1 (erb conceptPanel) + host blocks (host ink + recompiled .json) for all six shells, plus `W2_LINES_H2.md`. 19 files, all P-H2-owned. JSON parses; all 6 host inks compile clean.

## DONE
- **keyMessage ids** chosen and verified present in both the full shell's and the twin fragment's first triage set (with an outcome): ca06 `e6_parking_permit`, ca07 `e7_ceo_wire`, ca08 `e8_push_abroad`, ca09 `e9_fake_it_number`, ca10 `e10_fake_check`, ca11 `e11_wrong_sam_breach`. Table + alternatives in `W2_LINES_H2.md`.
- **Host blocks** in all six host inks: VARs (`kit_defend_done`, `kit_caught`, `kit_key_caught`, `kit_ca0N_host_said`) added; block inserted as the first branch of the hub `- else`, gated `{ kit_defend_done && not kit_ca0N_host_said: ... ~ kit_ca0N_host_said = true - else: <existing> }`, CATCH/PARTIAL/MISS on `kit_key_caught`/`kit_caught`. Two lines/shell (D4: one attacker-side, one human-side), 5 clips each, ≤30 words. Pattern mirrors ca01 adaeze_okafor.ink. host=12 lines, on budget.
- **Layer 0 + layer 1** in each erb `strings.conceptPanel.text` (layer0 `\n\n` layer1). ca06/ca07 conceptPanel newly created (object); ca11 object text replaced; ca08/ca09/ca10 appended as the LAST entry of the existing conceptPanel array. Every layer-1 ends "have a word with <host first name>." (Chidi/Agnieszka/Anjali/Nilesh/Niamh/Tomasz). Layer 0 opens "To a real attacker".
- **D225/O1 hold**: ca08 and ca11 layer 1 use recommended option-A duty wording (accurate plain UK GDPR) as placeholder; marked `// D225 pending` in `W2_LINES_H2.md` (not in the shell). ca06/07/09/10 carry no duty claim.

## DONE (second P-H2 session, commit `7b490d269`)
- **Fragment layer 1 written** into `e6..e11/defend.json` exactly per the plan: e6/e7 added a `conceptPanel` object after `defendOnly`; e8/e9/e10 appended one layer-1 entry as the LAST conceptPanel array element; e11 replaced the object `text` (heading kept). No "To a real attacker", no "have a word with", no "you". JSON parses on all six. Committed with explicit paths; `git diff HEAD` empty.
- **All checks green.** inklecate: 6 host inks compile exit 0 (no byte change vs committed). validator `--strict-social --no-graph`: 0 errors each (only the expected pre-splice `kit_defend_done/kit_caught/kit_key_caught` VAR warnings). dialoguelint `--json`: 0 findings, 0 error tokens, exit 0 each. `node --test social-*/validator-social-*/office-kit-quiet-and-stub`: 2885/2886 subtests pass; the one "fail" is an async-teardown uncaughtException in `social-mail-ink-runner.test.mjs` that is 23/23 clean when run alone (cross-test race, not content). `python3 -m unittest test_office_kit`: 74 OK. **proof5 (committed): 26 diffs, all expected** — 17 baseline (ca00 `anjali_rao.ink` + 16 twin host inks from P-GEN step 5); 3 twin erbs (ca03/04/05_defend `scenario.json.erb`) from P-H1's commit `68ee75f9d` fragment conceptPanels (not P-H2); 6 twin erbs (ca06–ca11_defend `scenario.json.erb`) = my fragment conceptPanels flowing into the generated twins (gen has them, HEAD twin erb not yet re-spliced by step I). Each of the 6 twin erb diffs is exactly the conceptPanel I wrote, nothing else.
- No P-H2 file needed fixing; the drafted text passed every check unchanged.

## STILL OPEN (unchanged, outside this session's brief)
3. **npc-dialog-review (opus48)** formal verdict/commit on the batch — still owed.
4. **D9 timing trims** (ca06–ca10 appended-passage net growth) — deferred to the post-wave-2 human timing pass, per the lines file.

## OPEN (original notes — items 1 and 2 now done above)
1. **Fragment layer 1 — NOT YET WRITTEN.** `AW/e6/defend.json` … `AW/e11/defend.json`, key `awarenessEpisode.strings.conceptPanel`. Exact text is in `W2_LINES_H2.md` under each shell's "Fragment layer 1". Rules: layer-1 only, NO "To a real attacker", NO "have a word with", NO "you"; must share an 8+ word run with the erb layer 1 (checked phrasing already overlaps). State:
   - e6, e7: conceptPanel is ABSENT (last strings key is `defendOnly`); ADD an object `{heading,text}` after `defendOnly`.
   - e8, e9, e10: conceptPanel is an ARRAY of the shell's teaching panels (already present); APPEND one `{heading,text}` layer-1 entry as the last element.
   - e11: conceptPanel is an OBJECT "Behind every row is a person"; REPLACE its `text` with the fragment layer-1 text (keep heading).
   - ca08, ca11 fragment layer 1 carry the option-A duty clause too — mark `// D225 pending` in the lines file.
   - Headings to use match the erb headings per shell (see lines file).
   - After editing, these are owned by P-H2 → commit `AW/e6..e11/defend.json` with explicit paths.
2. **Checks not yet run** (do after fragments): `ruby scripts/validate_scenario.rb scenarios/<shell>/scenario.json.erb --strict-social --no-graph` (0 `^ +ERROR`; brief 2.7 also allows `--skip-ink`; kit warnings are expected pre-splice); `node scripts/ink_runtime_check/dialoguelint.mjs --json scenarios/<shell>` (no `error`); `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`; `python3 AW/proof5.py tmp/w2_p5` from `AW/` (expect: no ca06–ca11 rows exist yet, so only conceptPanel/host text in these shells differ from HEAD — confirm proof5 still passes on everything else; the H erbs are not generator output so proof5 should not touch them until I's splice). Generators write only to scratch.
3. **npc-dialog-review (opus48)** on this batch (host lines + layer text) before any voicing question — self-check notes in the lines file; formal verdict/commit still owed.
4. **Replaced-sentence / D9 timing**: only ca11 is a true in-place replacement. For ca06–ca10 the layer passage is APPENDED, so net sentence growth exceeds +1 until the recommended trim (named per shell in `W2_LINES_H2.md`) is applied. I deferred the actual trims to the post-wave-2 human timing pass (D9 makes those runs the gate). Flag to I/owner: either apply the named trims or accept the deferral.

## GOTCHAS
- `scenario.json.erb` files are plain JSON (no erb tags) — parse/edit as JSON. Triage items live at `social.triageSets[0].messages[]`, phish flag at `message.truth.isPhish`.
- Host ink wrap added exactly one extra `}` before the hub-closing `}` (mirrors ca01). Recompiled the `.json` in place so the committed pair matches.
- ca11 host display name uses non-ASCII "Tomasz Wiśniewski" in the speaker prefix (matches the existing ink and its id `tomasz_wisniewski`).
- Do NOT touch generators, twin files, or `episodes.json` (owned by P-GEN/P-TW/I). Fragments `AW/e6..e11/defend.json` ARE P-H2's to edit.
- P-TEST's new parity case will read: erb panel ends with the pointer; fragment panel has neither marker; twin panel == fragment; 8+ word shared run. The appended-array shape (ca08/09/10) means the layer passage is the last conceptPanel entry — keep it last.
