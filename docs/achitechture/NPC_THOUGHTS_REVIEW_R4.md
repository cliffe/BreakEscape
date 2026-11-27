# NPC thoughts flag, round 4 delta review (ee03e77ec..166f53ab9)

Counts: B 0, M 0, m 3. Verdict: clean to merge; the minors are optional. Paths are relative to the worktree p-npc-thoughts.

Tests after the main merge (7c3e1fc32): bin/test-js 750 passed, 0 failed, 750 total. Validator (scripts/validate_scenario.rb): m01_first_contact 0 errors (19 warnings), m02_ransomed_trust 0 errors (33), sis01_healthcare 0 errors (17), test_npc_thoughts_off 0 errors (2).

## Checked and fine

- Proof script syntax: `node --check` passes. `import('playwright')` resolves from tools/playtest/ (node_modules above the worktree), and 9 other scripts in tools/playtest import it the same way.
- Output paths: the only writes are `fs.mkdirSync(out)` (line 10) and screenshots (lines 89, 97), all under `out`, which defaults to `tmp/npc-thoughts-proof/` (line 9, gitignored). `OUT_DIR` is still an unchecked env override (R3 m-c, accepted as opt-in).
- Menu closing (lines 19-28): no Escape. It uses `__test.minigame.close()` (test-bridge/minigames.js:486) and `__test.dismissBlockingUi('Resume')` (test-bridge/index.js:1554), the real bridge calls, with fallbacks to an unlabelled and a 'No' dismissal. Loop is capped at 6.
- Room hopping (line 80): `__test.enterRoom` per hop, the real door path, one door at a time. A failed hop is logged with its result, not hidden.
- Need re-forcing (lines 70, 86): `__test.needs.set` (test-bridge/index.js:2220), documented as "same path as an eventMapping needs set". It is the stated stimulus, not a count. Re-forcing every 10 s is a stronger stimulus than a natural game gives, which the doc does not say outright.
- verify-run.rb:226: the label is right. The `npc_mutter` event carries `picture` (npc-needs.js:2256, 2260), so `picture` present gives "(picture)", both null gives "(silent)". Existing callers are unaffected: lines with a `line` are unchanged, and a picture mutter keeps its old text.
- Test title (npc-thoughts-pictures.test.mjs:63): now claims only what it asserts (`_talking` returns null). Fixes R3 m-b.

## Minors

- m1: the script teleports the player. Line 47 calls `player.setPosition(sp.x + 40, sp.y + 30)` every 100 ms while any NPC is saying a picture, and `park` (line 74) does the same for `near`. This is direct state injection and it is what puts a picture bubble in view, so "pictures seen" measures "bubble rendered when the player is beside it", not "a player would see it in normal play". The doc admits it (R3 doc line 74, "the player is walked beside any NPC that is saying a picture"), and the counts of NPC turns themselves (`turns`) are not affected. Suggest the doc table says so in its heading, and that `pictureTurnTicks` and `picDebug` (lines 40, 46) are printed in the table, since they are the evidence that picture turns happened.
- m2: the "variance" conclusion is fair as far as it goes but the table does not prove its cause. Both commits show both outcomes (aa417656b: idle 0/2/0 in 7113, 7115, 7117, active in 7064, 7066, 7114, 7118 to 7120; faff59b48: idle 7076, active 7078), so aa417656b did not introduce the idle result. n for the old commit is 2. The sentence at R3 doc line 68, "idle runs started at y 129 to 135, the active ones at y 201 to 243", has no column in the table behind it. Run 7117 stayed idle despite the 10 s re-forcing, which weakens the script comment at line 86 ("one push at phase start left some runs with NPCs that never acted") as the whole explanation. Add the start y and the `turns` list per run, or word it as a likely cause.
- m3: R3 doc line 75 says count a flip run as valid only when `turns` lists a talking turn, but the table has no turns column, so a reader cannot apply that rule to rows 7113, 7115, 7117 (which would be invalid runs by that rule, yet they are tabulated as results). Mark them "idle, not counted" or add the column.

## Proof section claims against its numbers

- "Same two outcomes on both commits": supported (see m2).
- "Control never shows a picture in either commit": supported (four control rows, 4 / 1 / 0).
- "m02 off: 0 / 0 / 0, 6 spoken bubbles": a single run, row 7084, and it is the flag-off case only. Fine as stated, no flag-on m02 count exists (the R2 Outcomes already admit that).
- "Not a regression": supported on the evidence; "caused by start position": not shown (m2).
