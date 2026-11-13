# m08 lighting, cycle 6: confirmation review

Fresh read-only reviewer, 2026-10-14. Inputs: `git diff HEAD` of `scenario.json.erb`, `rooms.js` (`createSpriteFromMatch`, `createSpriteAtRandomPosition`, `registerSpriteVariantListeners`), `conditional-text.js` `resolveObjectField`, `lighting.js` emitter matching, `room_hq_interview.json` tileset, `lighting_c5/browser_recheck.md` and its six PNGs, `review_c5.md`, `lighting_c4/browser_check.md`, `LIGHTING_PLAN.md`, the new entries in `IMPROVEMENT_LOOP_LOG.md`, `DECISIONS_PENDING.md` (L1, E14) and `LIGHTING_LOG.md`. Validator re-run (`--skip-ink --no-graph`): schema pass, no errors, no warning about lighting or sprites.

## B1: confirmed fixed

- **Fallback is real.** `rooms.js:691`: `baseKey = scenarioObj.sprite || scenarioObj.type`, then `resolveObjectField(scenarioObj, 'sprite', baseKey)` returns `data.sprite ?? baseKey` when no variant holds. Before the fix that gave `smartscreen`. Now it gives `hq_evidence_wall1` / `hq_disposition1` (erb 2054, 2079).
- **Initial texture unchanged.** Both objects are placed with `position: as-type:...`, which takes priority over `sprite` in Tiled matching (`rooms.js:2196`), so the same map slot is used. `createSpriteFromMatch` (`rooms.js:520`) uses `scenarioObj.sprite || imageName`. `imageName` comes from the room tileset, whose images are `../objects/hq_evidence_wall1.png` and `hq_disposition1.png` (`room_hq_interview.json:5589, 5595`). The key is the same before and after the fix.
- **No lighting side effect.** `lighting.js` matches emitters on `obj.texture.key` (`:134`, `:489`), not on `scenarioObj.sprite`/`type`. The texture key at load is unchanged, so every lit state toured in c3 renders the same.
- **Re-check PNGs match the table.** 1: suite dark, three "?" cards, blank DISP. 2: case file "0X47 PENDING", DISP board unchanged, no blue screen glow (B1 closed in the failing order). 3: same faces after the reload, gameplay HUD. 4: lit, red RECORDING glow, "CONCLUSIVE", "AWAITING", Nightshade by the table, camera tally red. 5: same as 4 after the reload. 6: "RETAINED", lamp glow and tally off, ambient lighter, wall still CONCLUSIVE. The latent `evidence_display` order (`all_flags_submitted` without `mole_identified`) was not run in the browser. The code path above covers it.

## Records: m1-m6

m1 (note in `browser_check.md` F row), m3 (plan §3 and §5: "m03's colour", own radius), m4 ("1 left (m10)"), m5 (L1 names `"sprite": "hq_recording1"`) and the new `LIGHTING_LOG` lesson are all present and accurate. The plan's cycle 4 text now says E is eval-only and the named face was not reloaded there, which fixes m2 in the plan. m6 is recorded in the plan's cycle 5 table. The minors below are wording slips introduced or left behind by these edits.

## Scope

The erb diff is +99, 0 deletions: the scenario-level and room `lighting` blocks, two `spriteVariants`, their two base `sprite` fields and three ERB comments. `panels` and the `hq_*` keys are lighting fields. No ink, tag, NPC or dialogue field, and no lighting overreach.

## Fresh tour?

Not needed. The lighting blocks are unchanged since the c3 tours. The only erb change since then is the two base `sprite` fields, which leave the load-time texture (and so emitter matching) as it was. The one state they do change (live swap with no matching variant) is covered by the c5 re-check.

## Findings

| id | sev | evidence | finding | fix |
|---|---|---|---|---|
| r1 | minor | `LIGHTING_PLAN.md` intro ("only lighting blocks and `spriteVariants` on two lit screens changed"); §4 ("Wired as `spriteVariants`") | The scope statement does not mention the base `sprite` fields added for B1. `IMPROVEMENT_LOOP_LOG.md` does. | Add "and their base `sprite`" to both. |
| r2 | minor | `IMPROVEMENT_LOOP_LOG.md` new entry | The heading says "cycles 1-4" but the entry covers cycle 5. The cycle 4 sentence still lists the named face among faces that "hold across two reloads" in game 2508. c5 m2 asked for "named face not reloaded". It was reloaded later, in 2509. | Heading "cycles 1-5". Say "closed/awaiting held after reload 1 (eval), handover after reload 2 (PNG); named face reloaded in the c5 re-check (2509)". |
| r3 | minor | `LIGHTING_LOG.md` m08 entry, last sentence | "browser check with two reloads (game 2508)" leaves out the c5 re-check in the failing order (game 2509). | Append "; re-check in the failing order (game 2509)". |
| r4 | minor | `browser_recheck.md` notes; PNG 4-6 | "A white-coated NPC ... not investigated" is Nightshade (`nightshade_confrontation`, sprite `nightshade`), shown on the case-made mapping as the plan's §2 says. PNG 6 has him still at the table after the fate. That is c5 m6(b), which the plan routes to the orchestrator. | Name him and cross-refer to m6(b). Leave m6(b) itself as a play check for the orchestrator. |

## Counts

0 blockers, 0 majors, 4 minors (all record wording).

**Verdict: close.** B1 is fixed and verified in code and in the failing-order browser re-check. No fresh tour is needed. r1-r4 are record edits and need no further review cycle. Keep `db/seeds.rb` and `lib.sh` out of the lighting commit, as c5 said.
