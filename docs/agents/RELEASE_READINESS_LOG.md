# Release readiness log

Stream owner: session breakescape-10 (from 2026-11-13). Integrator: breakescape-35.

The gate (user, 2026-11-13): no production deploy until the ongoing access, networking and UX work settles and m01_first_contact, sis01_healthcare and sis02_energy each pass a fresh end-to-end playtest. Real-VM playtests happen in another environment; here the VM half is stood in by seeding flags from new-game.rb's FLAGS_XML (user, 2026-11-13).

## Baseline playtests on main 2f5471209 (train 28)

| Mission | Game | Result | Open findings |
|---|---|---|---|
| sis01_healthcare | 3134 | Ending reached, 18/18 tasks, every secret earned | F1 M ending race ("Not Yet" toast at the start of the debrief), fixing on build/rel-fixes. F2 withdrawn (harness: moveToNear Ravi clicked inside the trolley PC's click zone; a real click on Ravi opens only the chat; game 3155). F6 withdrawn (Ward 7 rule opens its panel; earlier clicks missed after the map shifts about 12 px on the first rule click). Two minors noted from the check: the "NO SEGMENTATION" caption is unwired text, and the map re-flows on first click. F3 to F5 m: respawn at start after reload, walkthrough drift |
| sis02_energy | 3133 | Ending reached (second tester), 18/18 tasks, score 93, mission concluded | F1 withdrawn: the E key opens HMI-OPS-01 from three sides; the harness's interact() clicks the object's top-left origin, which overlaps the status board. A mouse click always raises a labelled menu (m, engine backlog). F6 down to m: FLAG SESSION is intended but nothing said so; the task title now says it (c203e4697). Minors: ESD labels blank, rack read reported no-effect then arrived late (host load), respawn at start after reload, TESTING_WALKTHROUGH.md stale (password lock, no flag step) |
| m01_first_contact | 3137 | Ending reached (two testers), 29/29 tasks, score 100, 4 flags (all seeded from FLAGS_XML), every in-game secret earned. First completed abort/launch choice (ABORT; LAUNCH not exercised) | 0 B/M. Minors: confront-Derek objective names no location (left: m01 is stable and deployed); inventory tray shows 7 of 39 items, asked breakescape-d3 whether an overflow view exists (major if not); harness-side safe approach and lock ok:false; respawn at start after reload |

## Decisions (orchestrator, overrule as needed)

- 2026-11-13: sis01 bed 2 death barks voiced (5 clips, build/sis01-tts-bed2 6943093e9). Measured lengths showed Mrs Kowalski overlapping David by 0.29 s, so David moves to 8.6 s and Helen to 14.9 s (861555e75); every gap is now at least 0.3 s.
- 2026-11-13: sis01 ending gate (eedf0f27d): the real cause was that npc_sharma.ink completed attend_debrief when the debrief opened, before debrief_complete, so the server warned at the start of every debrief. The task tag moves to debrief_end (straight after debrief_complete) and concludeRequires becomes {} (sis02's pattern; no VM or flags, so nothing for the server to hold). tagdiff: one tag moved, no prose changed, so no audio cost. Live proof: game 3156 before (toast at the first debrief choice), game 3157 after (no toast, credits, mission concluded). Engine follow-up passed to breakescape-35: the same race can hit any task that completes on a gate global's change (about 69 ca* awareness scenarios gate on globals; ca01 has the shape; untested live).
- 2026-11-13: q94 field names agreed with breakescape-d3: `host` reused, `desktopUser { name, character? }`, shown only on the unlocked desktop. VM-linked objects untouched.
- 2026-11-13: q94 review R1 (0 B, 1 M, 6 m): remove hosts from three VM stand-ins (m07, m09, m10); keep Kevin signed in on both m01 PCs (the user's q94 answer named him, and it isn't a spoiler); fix the rest.

## Review rounds

- build/rel-fixes R1 (opus55): 0 B, 0 M, 4 m. Fixed in 07e8a28bf: log row corrected; the debrief task re-fires in both debrief NPCs' start (recovers a lost final POST; completing a done task is a no-op on server and client); stale knot names; a sis01 reopencheck entry.
- build/rel-fixes R2 (opus55): ready, 0 B, 0 M, 2 m, both fixed by the orchestrator: sis02's in-session reopen resumes at debrief_over (saved story state), so the re-fire also sits at the top of debrief_over (an ink runtime probe shows the tag fires there in both branches); the sis01 missions.json entry was removed, because reopencheck drives only phone NPCs and all sis01 NPCs are person NPCs, so it added 159 lines to a shared file for no coverage.
- build/q94-pc-fields R1 (opus55): 0 B, 1 M, 6 m, fixed in 0d78d91e9. R2: ready, 0 B, 0 M, 2 m (validator sign-in warning scope, duplicate unknown-key message), fixing.

## Audio and walkthroughs (2026-11-13)

- sis01 audio (build/sis01-tts-bed2, train 31): all 31 uncached barks voiced and David's bed 2 clip retaken (user's yes). Same-event barks spaced to a gap of at least 0.3 s from measured clip lengths. network_isolated now plays Ravi, Helen, Sarah, David in both the authorised and unauthorised paths: keeping the old order left 14.6 s of silence before anyone spoke. An independent audit passed integrity, cache match (0 uncached, 0 orphans) and voices. Three clips have a name or number the transcript heard differently (Sarah "Ms Okafor", patrol nurse "Bed 4", Ravi "NetSol's"); they wait on the user's listen.
- Walkthroughs (build/rel-walkthroughs 98e12b41a): sis01 and sis02 TESTING_WALKTHROUGH.md rechecked against the scenario at da5f53f34 (about 55 and 70 corrections). From that pass: sis02's architecture diagram called HMI-OPS-01 password-protected though it is unlocked, so the claim was removed (text only, not voiced). Withdrawn: the drug library minigame's "speak to David" text is only a JS fallback; sis01 supplies its own source messages, which point to the binder. Left as intended: sis02's Confirm SIS Tamper is not gated on the certification document (only Compare is).

## To do before the release playtests

- The release m01 run takes LAUNCH at the final choice, so both branches have been played once.
- Refresh TESTING_WALKTHROUGH.md for sis01 (monitoring display buttons, pump modal wording, network map toggles) and sis02 (HMI-OPS-01 not locked, the FLAG SESSION step), so the release testers don't report drift.
- Harness: interact() clicks an object's top-left origin, which can land on a neighbour's hit box (sis02 HMI-OPS-01 vs the status board); moveToNear can click an object while walking (sis01 trolley PC). For the tools backlog.
- Shared minor across all three missions: after a reload the player respawns at the start point. Ask the UI session whether it is known.

## Waiting on the user

On the Release Readiness Picks page (https://claude.ai/artifact/8RVcPNYB9tiTZkyCrj54hP):
- sis01-david-clip: does David's bed 2 clip say "library"?
- sis01-barks-tts: voice the other 26 uncached sis01 barks (under $1)?

On breakescape-35's picks page: the Hacktivity test-fixtures edit.
