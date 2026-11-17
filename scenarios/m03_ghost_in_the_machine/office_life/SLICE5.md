# m03 office life slice 5: spoken lines wired in

Commit 5be9d83b2 on build/ol-m03 (on top of 7ae250186). Text exactly as approved in DIALOGUE_SAMPLE.md (D61). No audio generated.

## Where the clips went
- Zainab NPC `chatter`: coffee 1 to 4, cooler 5 to 8. Yusuf `chatter`: coffee 9 to 12, cooler 13 to 16.
- Zainab `exchanges` (with yusuf_demir): ex_open_door 17 to 20, ex_tailgate 21 to 24, ex_client_sites 25 to 27 (gated on reception_badge_cloned). Knots in `ink/m03_npc_zainab_hussain.ink`. Gates as in the sample.
- Zainab ink conversation: 28 to 37. Yusuf ink conversation: 38 to 47 (hub pattern, `wh_staff_upset` line, `#exit_conversation`).
- Bark 48: Yusuf mapping `npc_ko:ffion_rees` (day, clone_call_done not true, neither staffer KO, onceOnly). Bark 49: Zainab mapping `npc_caught_at_post:zainab_hussain` (cooldown 30000). Both appended last in eventMappings.

## Data changes beyond the lines (flag for review)
- `reception_coffee` affordance: added `capacity 2`, `chatter "coffee"`, `overhearRadius 360`. Without capacity 2 the coffee pool and exchanges can never play (the plan section 3 names these fields). `hallway_cooler`: added `overhearRadius 360`.
- Added `voice` to both NPCs (Achernar, Alnilam), `heard_ex_*` globals, and `chatterCooldownMin 2`.
- The laptop text in the scenario differs from the sample's variants; left untouched as instructed.
- dialoguelint warns not-x-but-y on clip 20 ("Not our clients. Not our business."); left as approved.

## Checks
- Ink 10 compiled, 0 failed. validate_scenario 0 errors, 11 warnings (was 12). validate_office_life clean. --office-summary diff: the two NPCs' chatter and exchange counts, plus coffee/cooler affordance own-fields.
- bin/test-js 730 passed, 0 failed. bin/rails test 3109 runs, 0 failures, 0 errors, 4 skips. Both on 5be9d83b2, BEFORE merging main.

## Live (port 3091, own games 6566 and 6578; server stopped)
- 6566: paired coffee trips played pool lines (Cardiff traffic; Strong, no sugar), ex_open_door and ex_tailgate once each (heard globals set), then picture chat; laptop stayed open on each paired coffee trip (about 26 s real, lock decided on the expected time). Cooler pair played pool lines. Caught bark fired at the laptop. Zainab and Yusuf conversations open with the new ink; re-entry lines "Still about?" and "Still here." show after a goodbye.
- 6578: debugKO of Ffion by day produced Yusuf's bark 48 and `wh_staff_upset`; both upset lines show and close.
- Not shown: ex_client_sites (needs reception_badge_cloned); bark 49 only seen once.

## Handover / open
- `git merge main` (62ec9ce00) CONFLICTS: add/add in `tools/playtest/npc-pose-live-proof.mjs`. Merge aborted, tree clean at 5be9d83b2. Needs the owner's decision; suites must be re-run after the merge.

## Spoken lines touched (for the voicing request)
Clips 1 to 49 as in DIALOGUE_SAMPLE.md.
