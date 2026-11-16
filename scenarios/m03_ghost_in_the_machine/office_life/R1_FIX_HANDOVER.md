# m03 office life R1 fix: handover

Worktree .claude/worktrees/p-ol-m03-r1, branch fix/ol-m03-r1. Scratch dir: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/r1fix (lib.mjs; runT.mjs = Zainab trips with expectedAwayMs from events, args: game count; runH.mjs = mapped breaks, hide at clone, reloads; written, NOT yet run; val_base.txt = validator output at 0841f2789; lk_base.json = lock/key baseline).

## Done and committed (scenario.json.erb only)
- Blocker 1: types now coffee_station / water_cooler. Live (game 6561, two loads): one coffee at (262,189), one cooler at (192,-101), no duplicates.
- Major 3 hide: staff mappings are clone_rfid_card, mission_phase act2, clone_call_done (plain) plus onceOnly room_entered re-hides keyed on mission_phase. Not yet live-proved (runH steps C to F).
- Major 4 mapped breaks: Yusuf coffee on conversation_closed:ffion_rees, coupled Zainab on npc_use_started:reception_coffee; Zainab cooler on room_entered reception from main_hallway, coupled Yusuf on npc_use_started:hallway_cooler (delayMs 2000, plan conditions). Not yet live-proved (runH A, B).
- Minors: 6 onceOnly; 7 zainab_attacked, yusuf_attacked, wh_staff_attacked, wh_staff_witnessed declared and set, Ffion KO by day mapping, send-home patrolOverride mappings on both staff (unproved live); 8 coffee capacity 2; 9 credits "SOMEONE STRUCK IN RECEPTION BY DAY" plus a witnessed line; 10 observations aligned with the plan; 11 text now says the screen is dark, closed-lid art deferred (no art generated); 12 validator account still to write (new warning: npc_ko:ffion_rees onceOnly overlap, indices 6 and 59, disjoint by phase, expected).
- Major 5 placeholder ink: fixed by slice 5, untouched.
- Timings (game 6575: threshold 23, coffee use 19, cooler use 18, coffee capacity 2): coffee expectedAwayMs 21626, real 24.9 to 25.4 s, 5 of 5 open; cooler expectedAwayMs 26724, real 30.0 to 31.0 s (4 clean) and 51.3 s once when Yusuf joined, 5 of 5 locked. Margins were 1.4 s and 3.7 s, so retuned and committed: coffee use 16, cooler use 20, threshold 24. Game 6576 re-run started; first cooler trip real 33.5 s, locked; the rest not collected. Expected new figures (estimates, not measured): coffee about 18.6 s, cooler about 28.7 s.
- Coordinator extras: (1) the NPC reaches useFrom every trip; the player parks short of the spot (157,253 or 159,283) and reads work at about 26 px, so no change (south approach not re-proved). (2) the night variant outranks trouble by the plan's own order, both are dark-screen text: deliberate, no change.

## To do
1. runT.mjs on a fresh new-game (5 thirst, 5 caffeine): read exp and awayMs from runT-<game>.json, update the habit _comment with measured figures, then 3 coffee open and 3 cooler lock at threshold 24.
2. runH.mjs on a fresh game; fix failures.
3. Static: ink compile, validator warning list against val_base.txt, validate_office_life, door alignment, --office-summary diff, lock_key_diff (empty at ee9fedfce).
4. bin/test-js (timeout 600000), then the Rails suite, one after the other.
5. Fix log at the end of M03_SLICES3_4_REVIEW_R1.md; update SLICE3_4.md numbers; report. Remove the node_modules symlink at the end.

Gotchas: never pkill -f or kill via a ps|grep pipeline whose pattern is in the same command (it killed my shell twice); tools/playtest/*-flags-game*.xml: older ones are tracked, never rm the glob. Server on 3094 stopped.
