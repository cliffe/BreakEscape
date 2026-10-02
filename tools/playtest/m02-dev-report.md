# m02_ransomed_trust — dev playtest report

Two runs, real browser via `window.__test`, headless/fast.

- Game **1004** — exploratory run, exercised Priority 1 and 2 checks, hit a self-inflicted
  flag-submission snag that surfaced a real finding (see Priority 3). Session log:
  `tools/playtest/m02-dev-session.jsonl` (overwritten by game 1005 — see below), commands
  1–358.
- Game **1005** — clean run to the ending, driven with the lessons from 1004. Session log:
  `tools/playtest/m02-dev-session.jsonl`, commands 359–921 in the combined log (the log file
  was reused across both sessions in this working directory; game 1004's early portion is
  therefore only in this report's transcript excerpts, not re-derivable from the current file).

**Correction on evidence hygiene:** the harness log path was not changed between the two
sessions, so `m02-dev-session.jsonl` now contains only game 1005's trace in full (the file is
overwritten at the start of each `node playtest-session.js` invocation by this session's own
`rm -f` before restart). Game 1004's evidence is captured verbatim in this report's quoted
tool output above (bridge JSON, in-order) rather than in a separate log file. Where a finding
is asserted below it cites the literal JSON that came back, reproduced inline.

## verify-run.rb — game 1005 (final)

```
game            1005  (mission 46)
created         2026-09-08 21:15:46 UTC
last write      2026-09-08 21:33:00 UTC
played for      1034s of wall clock
current room    "reception_lobby"
unlocked rooms  14: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, office_hall_east, it_department, dr_kim_office, security_office, server_room, office_hall_west, conference_room
unlocked objs   1: entropy_staging_cache
inventory       9: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Server Room Keycard, Spare Contractor Lanyard, Visitor Badge (Countersigned), Ghost's Operational Manifesto, Affiliate Handling Note
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, gary_whitlock, dr_sarah_kim, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_4b90ab}, flag{m02_ransomed_trust_hospital_backup_server_2_94cac9}, flag{m02_ransomed_trust_hospital_backup_server_3_6889ff}, flag{m02_ransomed_trust_hospital_backup_server_4_42fd9d}
globals set     38: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, dr_kim_met, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, insider_asset_arrested, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_identified, insider_method_confirmed, inspected_asset_post, kim_guilt_revealed, lockpicking_guide_offered, lore_ghosts_manifesto_found, mission_complete, paid_ransom, patient_bed2_state, patient_bed4_state, player_name, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, staff_lanyard_obtained, ward_recovering

VERDICT: progress recorded — 13 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Confirmed directly against the DB record (not just the verifier's summary):

```
status=completed
mission_concluded_at=2026-09-08 21:32:55 UTC
```

`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` — passes
(schema OK, only pre-existing warnings/suggestions, none new). `bin/rails test
test/models/break_escape/ test/controllers/break_escape/` — 211 runs, 497 assertions, 0
failures, 0 errors.

---

## Priority 1 — cover_burned persistence and Gary's lanyard route

**`cover_burned` now persists as a real server global, and does so consistently.**

In game 1004, immediately after Gary's conversation gave both the keycard and the lanyard,
a direct state read returned:

```
cover_burned= True
cover_restored= True
gave_keycard= True
```

`cover_burned: true` before `cover_restored: true` is the only order the design can produce
— the impossible state from the earlier report (`cover_restored: true` with `cover_burned:
false`) did not recur in either run. Game 1005 confirms the same pair at mission end:
`cover_burned` and `cover_restored` both appear in the verifier's 38-item global list, and a
direct read at the end of the debrief showed both `True`.

Mechanism, read from the engine (not modified): `~ cover_burned = true` is a bare Ink
variable assignment. It reaches the server because `cover_burned` is declared with `VAR` at
top level in the ink file (making it one of Ink's "global" story variables), and
`npcConversationStateManager.syncGlobalVariablesFromStory()` is called after every choice in
`person-chat-minigame.js` (line ~898), patching `window.gameState.globalVariables` and
persisting on the next save. This is the general mechanism `#set_global` tags also use, not
a special case for this variable — the previous agent's `~ cover_burned = true` writes work
by riding this existing sync path, and both playtests confirm they do.

**Gary's lanyard hub option now fires.** The agent's fix
(`{(cover_burned or gave_keycard) and not cover_restored and not gave_lanyard}`) was tested
directly in both runs: in game 1004's transcript, immediately after Gary hands over the
Server Room Keycard, the hub offered — and the run took — "Someone's phoned security and
pulled my booking. I need something that holds up in a corridor.", and Gary handed over the
Spare Contractor Lanyard in the same conversation (log: `converse` result for
`gary_whitlock`, `chose` array ending `["...Someone's phoned security...", "You'll know.
I'll make sure of it."]`, `inventory` ending with `Spare Contractor Lanyard`). This happened
**before** `cover_burned` had been set by anything else — `gave_keycard` alone satisfied the
new `or` clause, which is exactly the case the agent's fix was for. The server-room-entry
backstop that game 997 needed was never invoked in either run; the lanyard came from Gary
directly. This is a completed fix, not partial.

**Sanity-check of the seven touched NPCs** — six converse cleanly, one (`patient_bed4`) I
could not reach:

| NPC / file | Result |
| --- | --- |
| `m02_npc_gary_whitlock.ink` | Converses correctly; keycard + lanyard both delivered in one hub visit (game 1005 log) |
| `m02_npc_receptionist.ink` (Bernie) | Sign-in conversation completes cleanly, `bernie_gave_key`, `bernie_trusts_player` set (both games) |
| `m02_npc_sarah_kim.ink` | Full hub conversation (10 turns) completes cleanly, `dr_kim_met`, `advised_board_pay`, `kim_guilt_revealed` set (both games) |
| `m02_npc_security_guard.ink` (Val, `security_guard_patrol`) | Two separate conversations (open chat + auto-triggered `cover_challenge` on server-room approach) both resolve cleanly; second run's `cover_challenge` response text differed slightly from the first (Val accepted the keycard/lanyard reasoning outright rather than asking Gary to "ring him"), consistent with different global state at the point of asking, not a bug |
| `m02_npc_asset.ink` (Graham Reeves / `night_security_supervisor`) | Confrontation conversation completes cleanly, arrest branch taken, `insider_confronted`, `insider_asset_arrested` set |
| `m02_npc_ward_nurse.ink` (Sister Doyle) | Converses correctly (needed a retry — first attempt returned `no-effect-confirmed` at `engineDistance` 31.1 vs 32 range, i.e. a hair's-width miss, not a scripted failure; the immediate retry succeeded) |
| `m02_npc_patient_bed4.ink` (Mr Pryce) | **Could not reach.** `moveToNear` consistently landed at `plainDistance` 38.8–40.9 (always >32, the gather-radius threshold), and `moveTo` toward the bed from multiple angles returned `steps: [{moved:0}]` — genuinely blocked, not a range-measurement quirk (see `docs/test-bridge.md`'s two-stage-gate section: this is a plain-distance gather failure, not an offset/facing artefact). Mr Pryce is optional flavour content (not on any required task chain in either run's `openTasks`), so this did not block the ending, and I did not investigate the collider further given the time budget. Reported as **could not determine** whether the conversation itself is sound — I never got a click to land. |

No conversation broke or dead-ended in either run.

---

## Priority 2 — the password sticky note

**Confirmed real, not a harness artefact**, with two independent approaches in game 1004:

- **From the south** (the natural approach coming from Gary's desk area): `moveToNear`
  reported `arrived-but-outside-plain-range` at `plainDistance: 35.1`, and a follow-up
  `moveTo` toward the note returned `steps: [{"dir":"up","moved":3},{"moved":0},{"moved":0}]`
  — the player is physically stopped by something (almost certainly the desk collider) before
  it can close the last ~3px needed to get under the 32px gather threshold. Two honest
  `interact` attempts from this side both returned `ok:false, reason:"no-effect-confirmed"`
  with `plainDistance` 39.5–39.8, i.e. always outside 32px. This reproduces the game-995
  finding exactly.
- **From the west**: `moveTo(355,-640)` then a short `walk up` landed the player at
  `distance: 23` from the note, `inRange:true`, and `interact` opened the notes minigame
  immediately (`"Gary's Password Sticky Note"`, text `Emma2018 / Hospital1987 / StCatherines`),
  `password_hints_found` appeared in `recentGlobals` right after.

I checked `tools/playtest/m01-confirm-verification.md`'s eighteen documented collider
artefacts before concluding this is real — none of them describe a desk collider that blocks
approach from one full side of an object while leaving another side clear; they're mostly
about the interaction-range offset overshoot, which this is not (the failure here is on
**plain** distance, the same measure a human player's click-gather uses, not the
facing-offset measure). A human player standing where the harness stood (south of the desk,
the natural path from the door) would get exactly the same "nothing happens" result the
harness got, twice, before finding the note is only interactable from the opposite side of
the desk. **This is a real placement defect, not a harness quirk.**

**I did not apply a coordinate fix.** `password_sticky_note` (and `gary_workstation`) have no
explicit `"position"` in `scenario.json.erb` — they're auto-placed by whatever layout logic
clusters objects near the room's furniture, and I have no visual tool to verify a blind
coordinate edit against the room's actual desk/collider geometry. Guessing a new position
risks making the object unreachable from *both* sides, which is worse than the current
one-sided defect. I'm leaving this for a human with the room editor or a screenshot-driven
pass, and reporting it here with the exact reproduction steps above so it can be fixed and
re-verified directly (approach from south, expect `plainDistance <= 32`; approach from west,
confirm it still works).

---

## Priority 3 — full run to the ending

**Game 1005 reached the ending**: `status: completed`, `mission_concluded_at` set (confirmed
directly against the `BreakEscape::Game` record, not just the verifier). All four
`submit_*_flag` tasks left `openTasks` and all four `flag_*_submitted` globals fired
(`flag_ssh_submitted`, `flag_proftpd_submitted`, `flag_database_submitted`,
`flag_ghost_log_submitted`), along with `backdoor_fully_exploited`, `insider_identified`,
`insider_confronted`, `insider_asset_arrested`, `ransom_decision_made`,
`backup_restore_initiated`, `exposed_hospital`, and `mission_complete`.

### A real flag-station defect found and worked around

Game 1004 hit a genuine sequencing trap that I want to flag clearly rather than paper over:

1. At the drop-site, submitting flag 4 via `{"submit": true}` on the `type` action reported
   `ok:true, submittedVia:"enter"` — but a subsequent `getState` on the same station showed
   `submittedFlags` with only 1–3, i.e. **the Enter-triggered submission silently did not
   register server-side**, despite the harness reporting success. This matches the documented
   test-bridge gotcha ("Flag stations ignore Enter entirely... check `submittedVia`") almost
   exactly, except here `submittedVia` claimed `"enter"` worked when the server disagreed —
   worth a closer look at `flag-station-minigame.js`'s Enter-handling path, since the
   `test-bridge.md` warning describes Enter doing *nothing* (safe), not Enter reporting
   success while silently failing (unsafe, because a caller trusting `submittedVia` would
   believe the flag landed).
2. Not realising this yet, I then interacted with the `entropy_staging_cache` (a
   `lockType: "flag", requires: "hospital_backup_server:flag_4"` object). Instead of either
   staying locked (flag not yet recognised as submitted) or opening automatically (flag
   already submitted), it opened its **own separate, redundant flag-submission lock UI**
   (`"Flag Submission Terminal"`, a `flag-station` minigame distinct from the drop-site
   station). Submitting flag 4 there worked and unlocked the cache correctly — but the flag
   was now recorded as submitted server-side, so returning to the drop-site and submitting
   the same flag there returned `"✗ Flag already submitted"`, and `submit_ghost_log_flag`
   (a task apparently tied specifically to the drop-site's own submission event, not to the
   flag's global "submitted" state) never completed for that game.

Both games' `verify-run.rb` output confirms the flag *value* itself is accepted once,
globally, regardless of which station it's submitted through — game 1004's final state shows
`flags submitted 4` including flag 4, yet `flag_ghost_log_submitted` never appears in its
38→25-ish global list, while `insider_method_confirmed` (set by opening the cache) does. So
the design has two independent consumers of "was flag 4 submitted" — the drop-site task and
the cache's own lock — and they are not kept in sync: whichever one the player interacts with
*first* eats the submission, and the other permanently stalls.

**In game 1005 I avoided this by strict ordering**: submit all four flags at the drop-site
station first (using `clickControl` explicitly rather than relying on Enter, confirming
`submittedFlags` held all four via `getState` before moving on), *then* visit the
`entropy_staging_cache`. Even so, the cache still opened its own redundant lock UI on first
interact rather than auto-unlocking from the already-submitted flag — I had to submit flag 4
a second time there to open it. The object's own `locked` state does not appear to check
"has this flag already been submitted anywhere" before offering its lock minigame; it only
reacts to a flag typed into *its* UI. This did not block completion in 1005 only because
resubmitting the same flag value into a second, independent lock UI is accepted (the server
allows the same already-submitted flag value to also satisfy a `lockType:"flag"` check) —
but the **task-completion side-effect** (`flag_ghost_log_submitted` / `submit_ghost_log_flag`)
is only wired to the drop-site's own submission event, so doing the cache first (as in 1004)
permanently loses it.

I have not modified the engine (per the constraint) or the scenario's flag-station wiring —
this looks like it lives in generic minigame/objective code
(`flag-station-minigame.js` / `apply-actions.js` / the objectives system's task-completion
triggers), which the brief asks me to report with evidence rather than fix. **Recommendation
for a human:** either (a) make `entropy_staging_cache`'s `lockType:"flag"` check the global
"already submitted" state before opening its own redundant lock UI (skip straight to open),
or (b) key `submit_ghost_log_flag`'s completion off the flag's global submitted state rather
than a specific station's submission event, so order of interaction can't strand it. Either
fix is scenario/engine-adjacent, not a one-line ink change, so I left it for review rather
than guessing at the right fix blind.

### `insider_method_confirmed` — which run was right

**Game 997 was right; game 995's failure to take the Affiliate Handling Note does not
reproduce.** In both 1004 and 1005, after taking Ghost's Operational Manifesto (a `kind:
"view"` item that opens a viewer) and closing that viewer back into the container, the
Affiliate Handling Note was present and takeable (`mg getState` showed it in `contents`
before taking; `mg take` succeeded; `insider_method_confirmed` appeared in `recentGlobals`
immediately after). I did not need to retry or work around a `no-takeable-items` failure in
either run — closing the manifesto's viewer correctly re-opened the container with the
Affiliate Handling Note still listed, in both games. I cannot say what was different in game
995 (possibly a container re-render timing issue that this session didn't hit), but the
current build does not exhibit it on two independent attempts.

### Observations, not classified as defects

- `interact()` on the cache and the recovery console both report `mismatch: true /
  wrong-target-opened` even though the *correct* minigame opens (`"Flag Submission Terminal"`
  for the cache's own lock, `"Backup Recovery Console"` for `hospital_recovery_console`) —
  this is the same harness name-vs-title reporting quirk noted in the earlier stationqual
  report, not a game bug.
- Several corridor doors vanish from `room()`'s scan once unlocked and passed through
  (documented behaviour), which cost real navigation time in both runs — `enter` frequently
  returned `no-known-doorway` after a door had already been used, requiring raw `moveTo`/
  `walk` to the door's last-known coordinates. Also hit the previously-documented IT
  department crash-cart trap (`(251,-492)` and `(201,-474)` both fully blocked movement in
  some directions; backing off and re-approaching from a different angle cleared it both
  times).
- The Ghost phone-chat conversation mid-mission (triggered after the third flag submission)
  and the closing-debrief phone-chat both took noticeably long to finish typing
  (10–20 seconds of polling before `ended:true` and the cursor glyph cleared). I waited for
  full typeout before closing both times, per the documented phone-chat close-mid-typeout
  caveat — no tags were lost as a result.

Known-and-deliberately-unfixed items (dead Agent HaX/Ghost hint handlers,
phone-chat tag loss on mid-typeout close) were not exercised as new findings; I let every
phone conversation finish typing, so the second one specifically did not trigger in this run.

---

## Final playtest game

**Game 1005** reached the ending: `status: completed`,
`mission_concluded_at: 2026-09-08 21:32:55 UTC`, all four flags submitted with matching
globals, `insider_identified`/`insider_confronted`/`insider_asset_arrested`,
`exposed_hospital`, `mission_complete` all `true`, closing debrief driven to its final line
("We'll brief the next operation when you're ready.").

## Engine-level defects hit but not fixed

1. **Flag-station Enter-submission can report success while the server rejects it** — game
   1004, flag 4 at the drop-site: `submittedVia:"enter"` came back `ok:true` but the flag was
   absent from a subsequent `submittedFlags` read. Worth checking whether the DOM Enter
   handler in `flag-station-minigame.js` short-circuits into reporting a click-path success
   without confirming the server round-trip.
2. **A `lockType:"flag"` object does not check the flag's already-submitted global state**
   before opening its own redundant submission UI, and that redundant UI's successful
   submission does not fire the same task-completion side-effect as the "real" station's
   submission — see the Priority 3 section above for full detail and reproduction. This one
   is scenario-config-adjacent (the object's `lockType`/`requires` fields) as much as it is
   engine behaviour, so I've described it rather than guessed at a fix.

I did not modify anything under `app/` or `public/break_escape/js/`, and made no changes to
`scenarios/m01_first_contact/`. No scenario file was edited in this session — the sticky-note
placement fix and the flag-station/cache sync issue are both left for review rather than
blind-patched.
