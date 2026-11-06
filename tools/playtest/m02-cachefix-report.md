# m02_ransomed_trust — ENTROPY Staging Cache flag-stranding fix

Real browser via `window.__test`, headless/fast, driven through
`.claude/skills/playtest-scenario/scripts/playtest-session.js` over a named pipe
(one command per line, results read after each). Session log:
`tools/playtest/m02-cachefix-session.jsonl` — it accumulates across sessions
(harness does not truncate between runs), so it holds two runs back to back:
game **1006** (lines 1–196, the bug, run against the unmodified scenario) and
game **1008** (lines 197–883, the fix, run against the fixed scenario). A
line-1–197 snapshot is also saved separately at
`tools/playtest/m02-cachefix-session-BEFORE-badorder-game1006.jsonl` in case the
combined file is ever regenerated.

## The defect

`entropy_staging_cache` (`scenarios/m02_ransomed_trust/scenario.json.erb`,
`server_room`) had `lockType: "flag"` with its own `requires:
"hospital_backup_server:flag_4"`. That is a **second, independent submission
point** for the same flag the drop-site (`flag_station_dropsite`) already owns
and uses to complete the `submit_ghost_log_flag` task. The two paths use
different server code:

- Drop-site submission → `POST /games/:id/flags` → `Game#submit_flag` →
  `Game#process_flag_task_completions!`, which matches the flag against a
  task's `targetFlags` leniently (station-qualified or legacy display form) and
  completes `submit_ghost_log_flag`.
- Cache submission → `POST /games/:id/unlock` (`method: 'flag'`) →
  `Game#validate_unlock` → `Game#submit_flag` (marks the flag "used", global to
  the game) → the object's own `completesTask` field (not set here) is the only
  way that path could complete an objectives task, and it wasn't.

Because `Game#submit_flag` records the flag as submitted **once, globally**
(`player_state['submitted_flags']`), whichever route sees it first wins. If the
player opens the cache before visiting the drop-site, the flag is consumed by
the cache, the drop-site subsequently returns `"Flag already submitted"`, and
`submit_ghost_log_flag` — which only the drop-site route can complete — never
completes. That task drives `flag_ghost_log_submitted` →
`backdoor_fully_exploited` → `insider_badge_id_found` → (with the post-log)
`insider_identified`, and the press terminal that ends the mission is gated on
`backdoor_fully_exploited`. So a cache-first player permanently stranded the
ending.

## Reproduction (game 1006, unmodified scenario)

Session log lines 1–196. Bootstrap at line 5 (`seq 3`), game id 1006.

Route: Bernie (sign-in) → Dr. Kim → Gary Whitlock (keycard + lanyard) → past
Val Okonkwo into the server room (all earned in-game, not injected) → in
`server_room`, interacted with `entropy_staging_cache` **before** visiting
`flag_station_dropsite`.

- The cache opened its own "Flag Submission Terminal" lock UI (log:
  `interact` on `entropy_staging_cache` → `opened: {"id":"flag-station"}`,
  title "Flag Submission Terminal" — this is reported by the bridge as
  `mismatch: true, reason: "wrong-target-opened"`, which is a **false
  positive**: the harness's naming heuristic compares the requested entity's
  name against the opened minigame's title and flags a mismatch whenever they
  differ, but this genuinely is the cache's own lock overlay, confirmed by its
  `getTestState()` text: `"ENCRYPTED — SUBMIT DECRYPTION KEY... UNLOCK"`. Not a
  scenario or engine bug — a harness false positive, noted here rather than
  silently worked around.)
- Submitted the real flag 4 there. It was accepted (`ok:true`), the cache
  opened as a container.
- Went to `flag_station_dropsite`, submitted the same flag 4:
  `"✗ Flag already submitted"`, `submittedFlags: []` (line 187 in the saved
  1006 snapshot / the combined file's earlier region).
- `brief` afterwards: `submit_ghost_log_flag` stayed in `openTasks` for the
  rest of the run. `sync` sent before quit.

**`verify-run.rb 1006`** (server-side, not just the harness):

```
game            1006  (mission 46)
unlocked rooms  12: ... server_room
unlocked objs   1: entropy_staging_cache
flags submitted 1: flag{m02_ransomed_trust_hospital_backup_server_4_310a23}
globals set     17: ... (no flag_ghost_log_submitted, no backdoor_fully_exploited, no insider_badge_id_found)
VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 1 flags submitted.
```

Confirmed: only 1 of 4 flags ever submitted at the intended station, no
downstream globals fired. The task is stranded — permanently, since the drop
site will never again accept that flag value once `submit_flag` has recorded
it.

## The fix

Two edits to `scenarios/m02_ransomed_trust/scenario.json.erb`, no engine code
touched:

1. **`entropy_staging_cache` no longer owns a validatable flag.** Removed its
   `"requires": "hospital_backup_server:flag_4"`. `lockType` stays `"flag"`
   (schema-valid, keeps the right icon and player-facing message), but with no
   `requires`, `Game#validate_unlock`'s `'flag'` branch
   (`resolve_flag_ref(object['requires'])` → `nil` → always `false`) means
   the cache's own lock UI can **never be defeated by typing a flag into it,
   real or not** — verified live in game 1008 (see below). This is what closes
   the stranding: there is no longer a second place that can consume the flag.
2. **The drop-site's flag-4 reward now unlocks the cache directly.** Changed
   `flag_station_dropsite`'s 4th `flagRewards` entry from a no-op `emit_event`
   (nothing in the scenario listened for `ghost_log_flag_submitted`) to
   `{"type": "unlock_object", "objectId": "entropy_staging_cache"}`. This is an
   **already-implemented, already-used engine action** — `apply-actions.js`
   (`case 'unlock_object'`) posts `/unlock` with `method: 'flag_reward'`, which
   `validate_unlock` trusts outright, and `Game#unlock_object!` persists it to
   `player_state['unlockedObjects']`. `public/break_escape/js/systems/interactions.js`
   already has a comment describing this exact pattern ("Listen for remote
   object unlocks (e.g., when archive decryption flag is submitted)"), so this
   is the established idiom for "flag opens a thing without a second lock UI,"
   not a new mechanism.

I considered (a) having the cache's own submission complete
`submit_ghost_log_flag` directly via its `completesTask` field, and (b) making
the object's `requires` line up with the task's `targetFlags` format. Both are
blocked by a real format incompatibility between the two completion paths:
`Game#process_flag_task_completions!` (drop-site) matches on the
station-qualified/legacy **display** form (`"hospital_backup_server-flag4"`),
while the `/unlock` `completesTask` path (`games_controller.rb` line ~789)
passes the object's raw `requires` string, which must be the **scenario
reference** form (`"hospital_backup_server:flag_4"`) for `validate_unlock` to
resolve it at all — and `Game#validate_flag_submission` requires an *exact*
match against `targetFlags`, with no support for "either form." Making one
route work would break the other. This is a real engine limitation (the two
paths were never unified), not fixable from the scenario alone; the reward-based
fix sidesteps it by removing the second submission point entirely, which also
better matches the object's own flavour text ("submit it at the drop-site to
open this" — the design intent was already a single submission point, the
implementation just didn't enforce it).

## Schema change

`scripts/scenario-schema.json`'s `flagReward.type` enum was missing
`"unlock_object"`, even though `app/controllers/break_escape/games_controller.rb`
(`process_flag_rewards`, the `'set_global', 'unlock_object', 'hint'` branch)
and `public/break_escape/js/systems/apply-actions.js` (`case 'unlock_object'`)
both already implement it correctly — it's used for objectives-task
`triggerOnInteract` elsewhere, just never previously as a `flagReward`. Added
`"unlock_object"` to the enum and documented the `objectId` property. This is
a validation-surface fix reflecting existing, working behaviour — no execution
logic changed, nothing under `app/` or `public/break_escape/js/` was touched.

## Verification (game 1008, fixed scenario, same bad order)

`BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m02_ransomed_trust tools/playtest/m02-cachefix-flags-manual.xml`
→ game 1008 (the auto-generated flag-hint XML underestimated the flag count
because my scenario edit removed one of the two `"vm:flag_N"`-shaped strings
the helper's regex counts on — a playtest-tooling heuristic quirk, not a
scenario defect; a hand-written 4-flag XML was used instead and
`VALID_FLAGS=4` confirmed before playing).

Same route as game 1006 (session log lines 197–883, bootstrap at line 199):
Bernie → Gary (keycard + lanyard, skipped Kim to save time — not required for
the ending; the mission-conclusion aim's `requiresCompleted` list does not
include `meet_dr_kim`) → past Val → server room.

**Bad order repeated:** interacted with `entropy_staging_cache` first (line
~within 300s region). Its lock UI still opens (lockType stays `"flag"`), typed
the real flag 4 into it: **`"✗ Validation failed. Try again."`** (log line 331,
`seq 135`) — the cache can no longer accept any flag, confirming the fix's
mechanism directly, not just its outcome.

Then went to `flag_station_dropsite` and submitted flags 1–4 in order via
`clickControl("SUBMIT")` (not Enter — see below). Flag 4 accepted (log line
382, `seq 186`): `"✓ Flag accepted!"`, `submittedFlags` holds all 4. `brief`
immediately after showed `submit_ghost_log_flag` gone from `openTasks` and
`flag_ghost_log_submitted`, `backdoor_fully_exploited`, `insider_badge_id_found`
in `recentGlobals`.

Re-approached `entropy_staging_cache`: its client-side `locked` flag was stale
(`true`) after the reward fired — see "Secondary finding" below — but
interacting with it and submitting *any* text unlocked it, because
`Game#validate_unlock` short-circuits to `true` when
`object_unlocked?(target_id)` is already true server-side (confirmed via
`unlocked objs 2` in `verify-run.rb`, including `entropy_staging_cache`, well
before I forced the interaction). The container opened with both intended
items (Ghost's Operational Manifesto, Affiliate Handling Note); both taken;
`lore_ghosts_manifesto_found` and `insider_method_confirmed` fired.

**`verify-run.rb 1008`** (mid-run, after the flag-4/cache sequence):

```
game            1008  (mission 46)
unlocked objs   2: entropy_staging_cache, emergency_storage_safe
flags submitted 4: flag{m02_cachefix_hospital_backup_server_1_aa11bb}, _2_cc22dd, _3_ee33ff, _4_gg44hh
globals set     33: ... backdoor_fully_exploited, flag_ghost_log_submitted, flag_ssh_submitted,
                 flag_proftpd_submitted, flag_database_submitted, insider_badge_id_found,
                 insider_method_confirmed, lore_ghosts_manifesto_found, insider_identified,
                 insider_confronted, insider_asset_arrested ...
```

Bad order → fix confirmed: the flag that used to be eaten by the cache is now
accepted at the drop-site regardless of what happened at the cache first, and
the full downstream chain (badge ID, insider identification, arrest) all
fired.

## Continued to the ending (same game 1008, same session)

Rather than start a third game, I carried 1008 through to completion —
offline keys from the PIN safe (`1987`, from the founding plaque, already
known from earlier work on this mission; not re-earned this run — logged here
plainly, not concealed), combined recovery at the Hospital Recovery Console,
Ghost's Act 3 call (declined the "no deal" branch), boardroom PIN `0417`
(likewise a known value, not re-earned this run), Night Security Post Log
(`insider_identified`), confronted and arrested Graham Reeves, transmitted
everything at the Hospital Communications Terminal, and drove the closing
debrief conversation with Agent HaX to its end.

`sync` sent, then `quit` (log lines 878–883, final `seq 686`/`687`).

**`verify-run.rb 1008`** (final):

```
game            1008  (mission 46)
created         2026-09-08 22:11:14 UTC
last write      2026-09-08 22:45:26 UTC
played for      2053s of wall clock
current room    "reception_lobby"
unlocked rooms  14: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, office_hall_east, it_department, security_office, server_room, emergency_equipment_storage, office_hall_west, conference_room
unlocked objs   2: entropy_staging_cache, emergency_storage_safe
inventory       9: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Server Room Keycard, Spare Contractor Lanyard, Ghost's Operational Manifesto, Affiliate Handling Note, Offline Backup Encryption Keys
NPCs met        16: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_cachefix_hospital_backup_server_1_aa11bb}, flag{m02_cachefix_hospital_backup_server_2_cc22dd}, flag{m02_cachefix_hospital_backup_server_3_ee33ff}, flag{m02_cachefix_hospital_backup_server_4_gg44hh}
globals set     35: backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, insider_asset_arrested, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_identified, insider_method_confirmed, inspected_asset_post, lockpicking_guide_offered, lore_ghosts_manifesto_found, mission_complete, offline_keys_recovered, patient_bed2_state, patient_bed4_state, player_name, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, staff_lanyard_obtained, ward_recovering

VERDICT: progress recorded — 13 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

Confirmed directly against the `BreakEscape::Game` record (not just the
verifier's summary):

```
status=completed
mission_concluded_at=2026-09-08 22:44:59 UTC
completed_at=2026-09-08 22:44:59 UTC
```

`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb`
— passes (schema OK; same two pre-existing "missing recommended field"
warnings as before my change, nothing new). `bin/rails test
test/models/break_escape/ test/controllers/break_escape/` — 211 runs, 497
assertions, 0 failures, 0 errors, both before and after the fix.

No `debugKO` used anywhere in either run — all NPC interactions (Bernie, Kim
in the pre-fix run, Gary, Val, Graham Reeves) went through real conversation,
no combat encountered on this route.

## Secondary finding: Enter-key flag submission (harness vs engine)

Investigated as requested. **This looks like a real engine defect in
`flag-station-minigame.js`, not a harness reporting gap — but I could not
reach a fully confident root cause, so treat this as "could not fully
determine," not a confirmed diagnosis.**

What I saw directly in this session (game 1008, drop-site, flag 1): calling
`mg type(0, "<flag:1>", {submit:true})` reported
`"submit":false,"submittedVia":null` — the `{submit:true}` flag in `type()`
did **not** cause an Enter-equivalent submission at all in this run (matching
`docs/test-bridge.md`'s documented gotcha, "Flag stations ignore Enter
entirely"). I then had to `clickControl("SUBMIT")` separately, which is what
actually worked. I never observed the specific failure mode described in the
task prompt (an Enter-key press reporting `submittedVia:"enter"`/`ok:true`
while the server silently rejects it) in my own two sessions — both my runs
show Enter doing nothing detectable, not Enter falsely claiming success.

That said, `tools/playtest/m02-dev-report.md` (game 1004, an earlier session
against this same scenario) documents exactly that failure mode directly:
submitting flag 4 via `{"submit": true}` reported `ok:true,
submittedVia:"enter"`, but a follow-up `getState` showed `submittedFlags`
still missing flag 4. That report also ruled out the three things
`playtest-scenario`'s own reporting rules ask to exclude before suspecting the
engine (range, false-success, wrong UI) and traced the claim to the literal
button-click code path in `flag-station-minigame.js`'s Enter handler. I did
not reproduce that specific claim myself this session — my own Enter attempts
just silently did nothing rather than falsely reporting success — so I can
only pass along game 1004's evidence, not add independent confirmation of the
"false success" variant. Both symptoms point at the same file
(`public/break_escape/js/minigames/flag-station/flag-station-minigame.js`),
which is engine code under `public/break_escape/js/` and therefore out of
scope for me to touch or fix under this task's constraints. I'm reporting it
with the evidence available rather than guessing further.

## Secondary finding: stale client-side lock display after `unlock_object` reward

Not requested, but found while proving the fix works, and worth flagging
because it looks like it could undermine the fix if misread. When the
drop-site's flag-4 reward fires `unlock_object`, the client's
`object_remotely_unlocked` handler (`public/break_escape/js/systems/
interactions.js`, `~line 28`) threw in the browser console during this run:

```
TypeError: (room.objects || []).forEach is not a function
    at .../interactions.js:31:38
    at Array.forEach (<anonymous>)
    at .../npc-events.js:26:35 (dispatcher.emit)
    at .../apply-actions.js:60:45 (applyActions, case 'unlock_object')
    at FlagStationMinigame.processRewardEvents (.../flag-station-minigame.js:777:9)
    at FlagStationMinigame.submitFlag (.../flag-station-minigame.js:700:26)
```

`Object.values(rooms).forEach(room => (room.objects || []).forEach(...))`
throws if `room.objects` is truthy but not an array for *any* loaded room —
one bad room aborts the whole unlock-sync loop, including for the room
actually being targeted. The **server-side unlock was not affected** —
confirmed by `verify-run.rb` showing `entropy_staging_cache` in `unlocked
objs` immediately after the reward fired, well before I next interacted with
it — and the object opened correctly and fully (with both real contents) on
the next interaction, because `Game#validate_unlock` trusts
`object_unlocked?` regardless of what the client displays. So this is **not
mission-blocking**: at worst a player sees the cache still drawn as locked for
one extra interaction after submitting flag 4, and it opens on the very next
click with any input (or none — see below). This is engine code
(`public/break_escape/js/systems/interactions.js`) and out of scope to fix
here; reporting it with evidence rather than touching it.

## Files changed

- `scenarios/m02_ransomed_trust/scenario.json.erb` — the fix (see above)
- `scripts/scenario-schema.json` — added `"unlock_object"` to the
  `flagReward.type` enum (documentation/validation only, no `app/` or
  `public/break_escape/js/` code touched)

Nothing under `scenarios/m01_first_contact/`, `app/`, or
`public/break_escape/js/` was modified. Changes are left uncommitted in the
working tree as requested.
