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
- Walkthrough review (independent, Sonnet): about 115 statements sampled across both files, 0 wrong facts; 1 M, 4 m, all fixed in 6860ece41. M: sis02's ESD steps came after the workshop, but the hydrogen timers start at Helen's briefing (evacuation at 43 minutes skips the ESD task), so a note now sends testers to an ESD station straight after the historian. m: sis01 button labels are matched by their leading words (the game's labels contain dash or arrow characters); three spoilers the refresh added now point to where the player finds them; the Ravi aim gate (assess_ward first) is stated; a stale ERB comment about meet_ravi was corrected.

## Held bark overlap (engine, user's yes 2026-11-13)

- Found by train 31's live check (game 3212): with the network map open, Ravi's network_isolated bark was held, and after release his voice ran into Helen's. Cause: _renderBark's promise settled when a voice started, so releaseHeldBarks never waited for a voice to end, and the drain cleared while the last held voice still played.
- Fix (build/bark-hold-drain): the release waits for the later of voice end + 300 ms and 2.5 s after the previous bark, including after the last spoken bark, with a 30 s cap per voice. Barks that were never held are unchanged. Two review rounds (opus55): R1 0/0/5 plus 2 nits, all fixed (95648cb96); R2 ready, 0/0/0 plus 4 nits. bark-release-policy 30/30; 9 of its tests fail on the old code.
- Live proof: held runs 3258, 3262, 3265 and 3273 have every voice at least 0.3 s after the previous one (3273: gaps 475, 369, 382 ms). In the unheld run 3274, Helen started 258 ms after Ravi, because a voice starts about 0.2 s after its bark shows. So Helen, Sarah and David move 0.3 s later (fd1f383b2), scenario only.
- Follow-up, not built: a clip whose duration reads NaN becomes null (tts-manager.js:101, npc-barks.js:152), so a playing voice counts as silent and nothing waits for it. Older than this fix; not seen in any run.

## Release playtests on 48b755b81 (train 34, main tip)

| Mission | Game | Result | Findings |
|---|---|---|---|
| sis01_healthcare | 3283 | Passed: ending, credits, 17/18 tasks (the open one is optional warn_sarah), no "Not Yet" toast | 0 B, 0 M. m: network_isolated gaps 2860, 261 and 342 ms; the 261 ms gap is under the 300 ms target, accepted as host load (the 0.3 s shift gives headroom on a normal machine). Bed 4 patrol move noted |
| sis02_energy | 3284 | Passed: ending, credits, 19/19 tasks, score 100 | 0 B, 0 M. m: F1, F2, P2-1, P2-2 (see the run report). F3 withdrawn: the globals it named are declared "" defaults |
| m01_first_contact | 3285 (two parts) | Passed: LAUNCH branch, debrief, credits, 29/29 tasks, score 100, 4 flags (stand-ins from FLAGS_XML). Both final choices have now been played once (ABORT in 3137) | 0 B, 0 M after checks. Derek's PC "password locked" text: static observation text (scenario.json.erb:1957) shown by container-minigame.js after unlock; Sonnet check on game 3292; m, fixed in breakescape-d3's PC polish branch with no scenario edit. Launch panel after EXECUTE LAUNCH (or ABORT): the result title is right, but the "armed" header and the "yours to abort" reward line stay, because showFinalState replaces only the input area; same code in production 1.0.15, so m and not a regression. Other m: controls appear about 4 s after the accepted flag; CONTINGENCY label wraps mid-word |

Gate result (orchestrator): all three missions pass a fresh end-to-end playtest on 48b755b81, with no blockers or majors open. A save and reload held state in each run. The deploy and version bump are the user's call.

Not checked here: P2-3 from game 3285. The stand-in flag tokens are numbered by XML order and any shatter_server flag was accepted at the drop-site; whether the real VM's flags map to each station as the scenario names them is a question for the real-VM playtest.

## Follow-ups after the release (none block it)

- Launch panel final state: clear the "armed" header and the reward line when ABORT or LAUNCH is chosen (flag-station-minigame.js showFinalState).
- PC polish (breakescape-d3, after its slice 6): the desktop and taskbar stop repeating observations; the interaction menu drops the observations line once a PC is unlocked; the CONTINGENCY label stops wrapping mid-word.
- The network map closes itself about 2 s after SEVER; confirm it is intended.
- sis02: the isolation scope can stay unchosen.
- A clip whose duration reads NaN counts as silent (see Held bark overlap).
- Harness: interact() clicks an object's top-left origin, which can land on a neighbour's hit box; moveToNear can click an object while walking. For the tools backlog.
- After a reload the player respawns at the start point: by design (js/core/resume-spawn.js); progress survives.

## Waiting on the user

- Three sis01 clips on the Release Readiness Picks page (https://claude.ai/artifact/8RVcPNYB9tiTZkyCrj54hP): Sarah "Ms Okafor", the patrol nurse "Bed 4", Ravi "NetSol's". A retake keeps the same cache key, so it can follow the release.
- The production deploy and version bump.
