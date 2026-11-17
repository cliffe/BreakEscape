# M5 review, round 2 (m05: Recruiter guard and game_loaded twin, HaX reword)

Reviewed 2026-11-12 at `4d9f56b6f` (the R1 fixes), against `REVIEW_M5_R1.md`, `REVIEW_M5_R1_OUTCOMES.md` and `proofs/M5_r1/`.

**Result for M5: 0 B, 0 M, 0 m, 3 n.** Nothing in M5 is above a nit. The guard and the twin hold in every reload order on the real path, with a real naming call and no explicit sync before the reload.

One thing outside M5 needs the orchestrator: the **uncommitted sweep item 8** in the shared tree (`ringConditionHolds`, `ringCondition` in `npc-manager.js` and `phone-ringer.js`) drops the Recruiter's first call in a normal run. See "Cross-track" at the end. It is a B against item 8 if it lands as it stands, not against M5.

## Live check (keyless :3024, headless, server stopped afterwards)

Scratch route (not committed): the real Patricia call through the Call button, naming Torres with [I think I know who it is] [David Torres] [Money] [The upload schedule]. `torres_identified` comes from her ink, not from a runtime set. Reloads are a bare `location.assign` with no `stateSync.sync()` first, so only the pagehide flush saves state, as when a player presses F5. Head starts: `patricia_phone_available`, `found_medical_bills`, `found_upload_schedule` only.

The worktree serves another agent's uncommitted item 8 code, so the four order cases ran with `npcManager.ringConditionHolds` stubbed to `true` after each load. That restores committed behaviour (item 8 is the only caller). Game 2161 and 2166 ran without the stub (Cross-track).

| Game | Order | What happened |
|---|---|---|
| 2169 | Reload in the 7.5 s window | Closed Patricia's call, reloaded 3 s later. `recruiter_texted=false` before the reload. After load: one ring on `first_call` (`queue=0`). Declined: one Missed row. 16 s later, no second ring. |
| 2181 | Reload before the close | Reloaded with the naming call still open, so no close event ever fired. After load the twin rang once. Answered: "Take your time…" then "Agent. Or whatever…", `recruiter_contacted_player=true`. A later HaX thread close did not ring again. Row: "Incoming call, 0:07". |
| 2172 | Reload while she rang | She rang 7 s after the close with the TalentStack caption. Reloaded mid-ring: a Missed row, `recruiter_texted=true` survived the flush, the twin did not fire. |
| 2178 | Reload after a decline | Declined, then reloaded: one Missed row, no ring in 16 s. |

**Double ring.** It can't happen in any order. `setGlobal` runs synchronously in `_handleEventMapping` before the ring offer (`npc-manager.js:1254`), and each delayed mapping re-runs `_mappingWouldFire` when its delay ends (`:806` and `:1177`). So whichever of the twin and the three closes fires first sets `recruiter_texted`, and the rest fail. `recruiter_texted` and the spent trigger are both in the pagehide flush (`state-sync.js:516`), so a reload after the offer can't re-arm the twin (game 2172, 2178).

**The twin's reading of `recruiter_contacted_player`.** Correct. The variable is set only in `first_call` (`m05_phone_recruiter.ink:66`, `:84`), which is the knot the ring and the Call back dial. Once she is answered the twin's condition fails, and so does `recruiter_texted !== true`, which went true earlier at the offer. The `!== true` form also holds when the variable is still the declared `false`.

**The guard can't block her first contact.** `mission_complete` is set in only two places: the last line of `extract_go` (`m05_phone_agent_0x99.ink:1015`) and the room-entry reload backstop, which requires it to be true already (`scenario.json.erb:1645`). The bring-in is offered only once `final_choice != ""` (`:185`). Torres is named before any fate, so in a normal run every one of her triggers comes before `mission_complete`.

## The proofs

`twin_reload` set `torres_identified` at runtime, emitted a synthetic `conversation_closed:agent_0x99_handler`, and its `reload()` helper (`m10_lib.sh`) calls `stateSync.sync()` before reloading. None of this hides a fault. In play the global comes from an ink tag inside the call, and the pagehide flush carries it. Game 2169 shows the same result with the real call and a bare reload. Game 2181 covers a case the proofs never reached: a reload with the naming call still open. `guard_only` and `bring_guard` are sound as isolation checks.

## Findings

### n1. "That TalentStack number's still open" reads slightly off aloud

`m05_phone_agent_0x99.ink:987`. It is right in every case where it plays (declined, rung out, missed on reload) and is hidden once she has been answered. "She's lost him" holds for every fate, `turn_double_agent` included, because the knot is reached only after `final_choice` is set. Spoken, "number's still open" is the weak part: a number isn't open, and "number's" can be heard as "numbers". Suggestion (no extra key cost, since there is no clip yet): **"TalentStack's line is still open. She's lost him. Ring her if you want to hear her lose."** Leaving it as it is would also be acceptable.

### n2. The silent twin repeats HaX's own text word for word

`:1162` "That TalentStack number's still there. Hear her out if you want. Just don't give her anything." The mapping text at `scenario.json.erb:1274` reads "That TalentStack number is the Recruiter. Hear her out if you want. Just don't give her anything." Both can land in the same thread. The repeat was already there before the reword. Optional: change the `:1162` second half, for example "She'll still try. Give her nothing."

### n3. The proof README doesn't mention the explicit sync

`proofs/M5_r1/README.md` gives `torres_identified` as the only head start. It doesn't say that `reload()` syncs before the reload or that the close was synthetic. Record only; game 2169 covers it.

## Cross-track: sweep item 8 drops self-latching rings (B for item 8, not for M5)

The uncommitted `ringConditionHolds` re-runs the mapping's whole `condition` while a ring is queued or ringing. The Recruiter's condition is entirely `globalVars.*` terms and includes `recruiter_texted !== true`. Her own `setGlobal` makes that term true just before the offer, so the ring is stale on its first tick and is dropped quietly: no ring, no row, no callback, while `recruiter_texted` is true and HaX's "That TalentStack number is the Recruiter…" text still lands.

- Game 2166 (working tree, no stub, normal run, no reload): `recruiter_texted` went true 7.5 s after the naming call closed, and she never rang. After a reload: no row.
- Game 2161 (same, reload in the window): the twin set `recruiter_texted` after load, and again no ring and no row.

All four Recruiter ring mappings are affected (the three `conversation_closed` mappings and the twin). So is m03's `game_loaded` revelation twin (`m03 scenario.json.erb:1039`, latch `revelation_ring_offered`). Its `global_variable_changed` sibling at `:1028` starts with `value === true`, so it is left holding. Possible fix in item 8: leave out any term that reads a variable the same mapping's `setGlobal` writes, or snapshot the condition's result before `setGlobal` and re-check only the other terms. Add a unit test with a self-latching mapping.
