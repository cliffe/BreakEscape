# m01_first_contact — conclude gate verification

**Purpose of this run:** confirm m01 (the calibration scenario) still plays after
the engine-wide change to how missions end, and verify the new server-side
`concludeRequires` gate on the `close_the_case` aim actually gates — refusing
before the three flag tasks are done, allowing after. This is a plumbing +
gate-verification run, not a full solvability pass: the run did not reach the
Derek confrontation / launch-device ending, and standalone has no VMs, so the
three flags are session-seeded stand-ins, not earned technical work.

- **Game:** id 1034, mission 32 (m01_first_contact)
- **Session log:** `tools/playtest/m01_first_contact-session.jsonl` (1170 lines,
  built across ~30 short driver invocations against the same game id, each
  ending in `{"cmd":"sync"}` + `{"cmd":"quit"}` — see "How this run was driven" below)
- **Flags XML:** `tools/playtest/m01_first_contact-flags-game1034.xml` (from
  `new-game.rb m01_first_contact`, `FLAGS_EXPECTED=shatter_server:4`, `VALID_FLAGS=4`, `PREFLIGHT OK`)
- **Driver:** a small Node harness (`driver.js`, not part of the repo) that
  spawns `playtest-session.js --headless` and feeds it a JSON command array,
  because the headed default failed to install the test bridge in this
  environment inside the 45s timeout (see Defects below). All commands and
  results below are drawn verbatim from that log.

## How this run was driven

Each phase re-ran `bootstrap` with `resume:"resume"` against the same game id,
then walked back to wherever progress had left off (the engine resets the
player's on-screen position on resume, though task/inventory state persists —
this is a re-confirmed instance of the documented "resume can rewind position"
behaviour). Every phase ended with `{"cmd":"sync"}` before `{"cmd":"quit"}`.

## verify-run.rb output (verbatim)

```
game            1034  (mission 32)
created         2026-09-12 14:25:53 UTC
last write      2026-09-12 15:03:44 UTC
played for      2271s of wall clock
current room    "reception_area"
unlocked rooms  6: reception_area, main_office_area, hallway_west, break_room, it_room, server_room
unlocked objs   3: break_room_bin_2, main_office_area_bin_3, entropy_encrypted_archive
inventory       9: Your Phone, Notepad, Visitor Badge, Main Office Key, Building Directory, Office Gossip, Lock Pick Kit, Server Room Keycard, Lock Pick Instructions
NPCs met        6: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, derek_lawson, kevin_park
flags submitted 3: flag{m01_first_contact_shatter_server_2_cb0712}, flag{m01_first_contact_shatter_server_4_a25621}, flag{m01_first_contact_shatter_server_1_7c980a}
globals set     13: briefing_played, confrontation_approach, current_task, final_choice, has_lockpick, kevin_choice, lockpicking_guide_offered, maya_identity_protected, player_name, security_audit_completed, server_room_entered, sudo_flag_submitted, talked_to_kevin

VERDICT: progress recorded — 5 rooms beyond the first, 3 objects unlocked, 3 flags submitted.
Cross-check the specifics above against the report.
```

Note: `confrontation_approach`, `final_choice`, `kevin_choice`, `current_task`,
`player_name` appear in the globals list despite this run never reaching the
Derek confrontation or the closing choice screens — these look like they are
seeded/defaulted during the opening cutscene/bootstrap trace (which auto-clicks
through several cutscene choices), not evidence of an actual playthrough of the
ending. Flagging this so it isn't misread as proof the ending was played.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Visitor Badge + Main Office Key | (items) | Sarah O'Brien, reception — `converse` | step: Sarah conversation | yes |
| IT Room PIN | `2468` | Reception Desk Phone → Kevin Park voicemail transcript ("The IT room PIN has been changed to 2468") | read via phone before using it on the door | **yes** |
| Lock Pick Kit + Server Room Keycard | (items) | Kevin Park, IT room — `converse` | after IT room entry | yes |
| shatter_server:flag_2 (`<flag:2>`) → `submit_linux_flag` | `<flag:2>` | SAFETYNET Drop-Site Terminal (server room) accepts `shatter_server:flag_2`/`flag_4` | server room, dropsite | **no — session-seeded stand-in, not earned via VM work** |
| shatter_server:flag_4 (`<flag:4>`) → `submit_sudo_flag` | `<flag:4>` | same dropsite terminal | server room, dropsite | **no** |
| shatter_server:flag_1 (`<flag:1>`) → `submit_ssh_flag` | `<flag:1>` | ENTROPY Encrypted Archive's own decryption-key lock (`lockType: "flag"`, `requires: "shatter_server:flag_1"`) | server room, archive lock | **no** |
| Derek's Office Key / Patricia's safe PIN 0419 | — | not attempted this run | — | **no — route not exercised** |
| Derek's Filing Cabinet PIN / whiteboard decode | — | not attempted this run | — | **no — route not exercised** |
| ENTROPY archive contents (notes5) | — | archive was unlocked (flag_1 accepted) but contents not opened/read this run | — | **no — not verified this run** |

Standalone has no VMs, so the three `shatter_server` flag values cannot be
earned by any route in this environment — this was expected and stated up
front. The run reached and used their in-game submission points (the dropsite
terminal and the archive's own lock) correctly, but the technical work behind
each flag (SSH brute force, filesystem navigation, sudo privilege escalation)
is unproven. Everything from Derek's office onward (Patricia's safe, the
whiteboard decode, the filing cabinet, and the entire close-the-case/Derek
confrontation/launch-device sequence) was **not attempted** this run — time
was spent principally on the conclude-gate verification, which was the primary
ask. Those steps are neither passed nor failed; they are simply untested here.

## What was actually played (plumbing check)

Confirmed working, in order, all cited to the session log:

1. Bootstrap / opening cutscene / tutorial decline — clean.
2. Sarah O'Brien conversation (reception) — full branching conversation played
   to `exhaustedBranches`, granted Visitor Badge + Main Office Key.
3. Reception Desk Phone → Kevin's voicemail → read the actual PIN transcript.
4. Main Office door unlocked with the Main Office Key (`lock` command, key
   selection + insert).
5. Break Room reached (after some navigation friction — see Defects), notes
   read (Office Gossip, Break Room Calendar), Derek Lawson NPC visible but not
   engaged.
6. Main office IT Department door unlocked with PIN 2468 (earned above).
7. Kevin Park conversation in the IT room — full conversation, granted Lock
   Pick Kit + Server Room Keycard. `hitTurnLimit: true` was reported on this
   conversation (60 turns) — noting it as a minor observation; the transcript
   read as a complete, sensible exchange, not a stuck loop, so this looks like
   a long-but-legitimate hub conversation rather than a fault, but a human
   should glance at the raw transcript in the log to confirm.
8. Server Room accessed via RFID keycard.
9. VM Access Terminal opened (shows the expected "launch your own VM" standalone
   instructions — correct, since standalone has no VM).
10. SAFETYNET Drop-Site Terminal: submitted `shatter_server:flag_2` →
    `submit_linux_flag` completed; submitted `shatter_server:flag_4` →
    `submit_sudo_flag` completed (confirmed via the `sudo_flag_submitted`
    global and the task list dropping to `["submit_ssh_flag"]`).
11. ENTROPY Encrypted Archive: submitted `shatter_server:flag_1` into the
    archive's own decryption-key lock → `submit_ssh_flag` completed, archive
    unlocked (`locked: false` in a subsequent `room` scan).

No regression from the engine change was observed anywhere in this path. All
three flag-completion events, and the resulting task-list changes, matched the
scenario's task definitions in `scenario.json.erb` exactly (dropsite accepts
`flag_2`/`flag_4`; the archive lock accepts `flag_1`; there is no single
"submit 3 flags in a row at one station" UI — the two systems are genuinely
separate objects in the server room, and a player who only checks the dropsite
would reasonably miss that the archive itself is a lock, not just a reward
container).

## Defects / anomalies observed (reported as observations, not diagnosed as bugs)

Per the skill's rules, these are reported with evidence; I have not classified
any of them as confirmed engine or scenario bugs.

1. **Headed browser did not install the test bridge within the 45s timeout in
   this environment.** `playtest-session.js` (default headed) reported
   `window.__test never appeared` on repeated attempts; the identical URL
   loaded and installed the bridge reliably under `--headless`. I switched to
   `--headless` for the whole run as a result. This is an environment/harness
   observation, not a scenario finding, but it means this run was not
   "watchable" as the skill prefers.

2. **Recurring `no-effect-confirmed` on several stationary interactables that
   were in range.** Seen on: `main_office_area_bin_3` (Office Recycling Bin,
   contains the Maintenance Checklist), `main_office_area_chalkboard_1`,
   `main_office_area_chalkboard_2`, `it_room_notes2_1` (IT Security Concerns),
   and — repeatedly, needing 3-4 retries — `entropy_encrypted_archive` and
   `flag_station_dropsite`. In every case `engineDistance` was reported below
   `range` (i.e. `inRange: true`) yet `interact` returned `no-effect-confirmed`
   on the first attempt(s), succeeding only on a retry (sometimes the 2nd,
   once the 4th). I ruled out the three causes the skill lists before treating
   this as worth reporting: engineDistance was within range each time; the
   harness's own event log (`drain`) showed no minigame/event fired on the
   failing attempts, so it was not a harness false-positive; and I used the
   standard `interact`/`moveToNear` commands correctly. This matches the
   shape of the already-documented open finding ("a collider short-stops
   `moveToNear` on three server-room objects, up to 59.7px") but appears to
   extend beyond those three named objects and beyond the server room (it hit
   objects in the main office and IT room too). I am not asserting a new
   engine bug — only that the pattern recurred on ~6 distinct objects across 3
   rooms in this run, more broadly than the previously-documented note
   suggests, and a human should decide whether this is the same root cause.

3. **`main_office_area_bin_3` (Office Recycling Bin) never actually surfaced
   its contents.** `interact` on it fired the event `item_unlocked` (confirmed
   via `drain`), but no notes/container minigame ever opened and the
   Maintenance Checklist item was never added to inventory in this run,
   confirmed by checking `brief().inventory` immediately after. This is the
   *optional* clue path to the IT PIN (`puzzle_graph_optional: true` in
   `scenario.json.erb`); the mission was not blocked because the PIN was
   earned via the phone voicemail instead, and a `Maintenance Log (Backup)`
   note with the same PIN also exists unlocked in the storage closet. I am
   reporting the bin's non-opening as an observation — I retried it three
   times with `interact` from confirmed in-range positions and it never
   produced a viewer or an inventory change — but have not independently
   confirmed whether this is scenario data, container-type handling, or a
   driving mistake I haven't spotted.

4. **`interact` on `entropy_encrypted_archive` reported `mismatch: true,
   reason: "wrong-target-opened"` (`opened.title: "Flag Submission Terminal"`)
   even though the minigame that opened was, in fact, the archive's own
   decryption-key lock** (confirmed by its text: "ENCRYPTED — SUBMIT DECRYPTION
   KEY... enter the correct flag to unlock this item"). This looks like a
   label mismatch in the harness's own mismatch check (a generic flag-lock
   minigame doesn't carry the specific entity's name in `opened.title`) rather
   than a real wrong-target click, since submitting the flag there did
   complete `submit_ssh_flag` and unlock the archive as expected. Flagging for
   whoever maintains the harness, not as a scenario defect.

None of the above blocked completion of the observed critical path — every
step that needed a retry eventually succeeded, and the flag/task mapping
behaved exactly as `scenario.json.erb` specifies.

## Conclude gate — the negative/positive test (the primary ask)

Run via `bin/rails runner` directly against game 1034, per the skill's
"cleanest way" recommendation, both before and after the three flag-completion
tasks were done through normal play (steps 10–11 above).

**Before (flags not yet in — run before step 10/11 above):**

```ruby
g = BreakEscape::Game.find(1034)
g.conclude_mission!
# => {:concluded=>false, :already=>false, :missing=>["task:submit_ssh_flag", "task:submit_linux_flag", "task:submit_sudo_flag"]}
g.status                 # => "in_progress"
g.mission_concluded_at   # => nil
```

**Mid-run check (after `submit_linux_flag` alone, before `submit_ssh_flag`/`submit_sudo_flag`):**

```ruby
g.conclude_mission!
# => {:concluded=>false, :already=>false, :missing=>["task:submit_ssh_flag", "task:submit_sudo_flag"]}
g.status                 # => "in_progress"
```

This confirms the gate is checking each named task individually, not just
"any flag submitted" — it correctly still refused with two of three tasks
outstanding.

**After (all three flag tasks completed via steps 10–11, in the actual UI, not
by setting globals directly):**

```ruby
g = BreakEscape::Game.find(1034)
g.conclude_mission!
# => {:concluded=>true, :already=>false, :missing=>[]}
g.reload
g.status                 # => "completed"
g.mission_concluded_at   # => Sat, 12 Sep 2026 15:03:43.961210000 UTC +00:00
```

**Result: the gate works as specified.** It refuses with the exact missing
`task:submit_*_flag` entries when incomplete (both with zero and with one of
three done), and concludes — flipping `status` to `"completed"` and stamping
`mission_concluded_at` — only once all three named tasks
(`submit_ssh_flag`, `submit_linux_flag`, `submit_sudo_flag`) are actually
completed through play. `requiresCompleted` (on `deactivate_launch`, which was
never touched this run) played no role in the conclusion decision, consistent
with the stated engine change.

This section above answers the server-model half. The client half — whether
the browser actually calls `POST /conclude`, whether it survives the round
trip, and whether the player is told anything when refused — is a different
question, addressed below on a second, fresh game (id 1036), because it turned
up a live defect.

---

## Addendum — the in-browser client path (game 1036, second run)

The coordinator asked for the one gap the first run left open: whether the
credits path in `public/break_escape/js/music/scenario-music-events.js`
actually calls `POST /break_escape/games/:id/conclude` correctly in a real
browser — CSRF token, fetch, response handling — since a bug there is
invisible to the server-side gate check above (the gate only proves the model
method is correct, not that the client ever reaches it, or handles what comes
back).

**Session log:** `tools/playtest/m01_first_contact-ending-session.jsonl`
(appended across ~35 short driver phases against game id 1036, same driver
harness as the main run, `--headless` for the same test-bridge-installation
reason noted above). Flags XML: `tools/playtest/m01_first_contact-flags-game1036.xml`.

### What was actually played first (earned, same as before)

On game 1036 I re-walked the same earned path as game 1034 before touching the
ending: Sarah conversation → Kevin's voicemail → IT PIN `2468` → Kevin
conversation → server room → all three flags submitted through their correct,
distinct in-game mechanisms (`shatter_server:flag_2`/`flag_4` at the SAFETYNET
Drop-Site Terminal for `submit_linux_flag`/`submit_sudo_flag`, `shatter_server:flag_1`
into the ENTROPY archive's own decryption-key lock for `submit_ssh_flag`) →
opened the archive → took "ENTROPY Network Architecture" (sets
`entropy_reveal_read`, confirmed via globals).

### A genuine blocker: the launch device could not be obtained

The `deactivate_launch`/`use_launch_device` tasks complete only on picking up
Derek's `entropy_launch_device` (an `itemsHeld` item on the `derek_lawson`
NPC). Real combat is not played by this harness, so per the skill's documented
shortcut I used `{"cmd":"debugKO","id":"derek_lawson"}`. This set
`derek_confronted` and completed `confront_derek` correctly. But the item
itself was never obtainable afterward:

- Reading `public/break_escape/js/systems/npc-hostile.js` (`dropNPCItems`)
  shows items are meant to scatter onto the floor near the NPC on defeat — but
  no such dropped sprite ever appeared (`window.__test.scan()` and a direct
  Phaser scene-children query both came back empty for anything
  launch/entropy-related).
- Approaching Derek's KO'd body and calling `interact`/`interactNearest`
  repeatedly, from every compass direction, with `moveTo` targeting his exact
  coordinates, consistently reported `still-out-of-range` at distances of
  17–26px even though the door's own range is 32px ("the target may be behind
  a collider" per the harness's own hint) — and the one `interactNearest` call
  that returned `ok:true` produced no event in `drain()` at all, i.e. a
  false-positive-looking success with no actual effect.
- I ruled out the three causes the skill lists before calling this a
  suspected defect: engineDistance was inspected, not just plain distance;
  `drain()` showed no event fired on the "successful" `interactNearest`; and I
  tried the standard commands from multiple angles and via direct coordinates.

**Working theory, not confirmed as root cause:** `dropNPCItems` looks like it
is wired to the real combat/fight-KO code path, not to the `debugKO` shortcut,
so a hostile NPC's held items may never be dropped when KO'd via the test
bridge specifically. This is a boundary of the harness for this NPC type, not
a claim about the scenario or the launch-device mechanic itself, which I did
not otherwise exercise.

### Isolating the client conclude call directly

Given that blocker, the narrative route to `start_debrief_cutscene` (via
calling Agent 0x99 and choosing the debrief option, gated on
`entropy_reveal_read && (player_aborted_attack || player_launched_attack)`)
was also unreachable this run. To still answer the coordinator's actual
question — does the client's fetch/CSRF/response code work — I fired the
same event the ink's `#set_global:start_debrief_cutscene:true` fires, using
the exact mechanism the game's own code uses elsewhere (`window.gameState.globalVariables.start_debrief_cutscene = true`
followed by `window.eventDispatcher.emit('global_variable_changed:start_debrief_cutscene', {...})`
— confirmed identical in shape to `apply-actions.js` and `npc-manager.js`'s own
calls). This is disclosed here as a deliberate substitution for the
unreachable narrative trigger, not a claim that the launch-device sequence was
completed. It is not a claim that this proves the launch-device step works —
only that it opens the same `closing_debrief_person` conversation the real
route would.

I confirmed via injected console-log capture that this correctly triggered the
NPC manager's real listener (`🎯 Event triggered:
global_variable_changed:start_debrief_cutscene for NPC: closing_debrief_person`,
condition evaluated true, `👤 Starting new person-chat conversation`), and the
`person-chat` minigame opened. I drove it to completion with `mg continue` /
`mg choose` / `mg clickText`, picking whichever option was available each time
(this is a mechanism probe, not a scored narrative walkthrough, so choices
were not curated for story quality).

### The finding: `POST /conclude` returns HTTP 500, not 200

Once the debrief conversation reached its end, `window.__test`'s own state
reported the terminal credits overlay open:

```
"missionEnd": { "creditsShowing": true, "closable": false,
  "note": "End-of-mission credits, and the scenario disabled closing. Nothing
  will dismiss this and no event is coming. The run is over." }
```

But the fetch monkey-patch I installed before triggering the event (wrapping
`window.fetch`, recording every request whose URL contains `/conclude`)
captured this, verbatim:

```json
{
  "url": ".../break_escape/games/1036/conclude",
  "method": "POST",
  "hadCsrfHeader": true,
  "status": 500,
  "ok": false,
  "body": "<!DOCTYPE html>... <h1>\n    Pundit::NotDefinedError\n      in BreakEscape::GamesController#conclude_mission\n  </h1> ... <div class=\"message\">unable to find policy `NilClassPolicy` for `nil`</div> ..."
}
```

**The request fired correctly and carried a CSRF token** (`hadCsrfHeader:
true`, and the server's own env dump inside the error page shows
`HTTP_X_CSRF_TOKEN` populated and non-empty) — CSRF is not the problem. The
problem is server-side: `POST /break_escape/games/:id/conclude` raises
`Pundit::NotDefinedError: unable to find policy 'NilClassPolicy' for 'nil'`
inside `BreakEscape::GamesController#conclude_mission`, i.e. `authorize @game`
is being called with `@game == nil`.

**Root cause, read directly from the controller source
(`app/controllers/break_escape/games_controller.rb`):**

```ruby
before_action :set_game, only: [:show, :scenario, :scenario_map, :ink, :room,
  :container, :sync_state, :update_room, :unlock, :inventory, :objectives,
  :complete_task, :update_task_progress, :submit_flag, :tts, :reset,
  :new_session, :vm_panel, :vm_set_panel]
```

`:conclude_mission` is not in that list. `@game` is therefore `nil` when
`conclude_mission` runs, so `authorize @game if defined?(Pundit)` (line ~982)
raises before `@game.conclude_mission!` is ever reached. **The mission
conclusion logic verified in the section above has never actually run over
HTTP in this environment** — every real browser call to this endpoint 500s
before it gets there.

**Confirmed against the server record.** After the credits overlay opened
client-side (`MISSION COMPLETE` implied — `player_launched_attack` was never
set true this run), the actual game record was checked directly:

```ruby
g = BreakEscape::Game.find(1036)
g.status                # => "in_progress"
g.mission_concluded_at  # => nil
```

**This is exactly the failure mode the coordinator was worried about, and it
is real.** The client's `concludeMission()` catch block is written to fail
open on a network error ("A network failure resolves as concluded:true. The
player has reached the end of the story and a dropped request must not cost
them the ending" — see the comment above the function) — and a 500 with an
HTML error body hits exactly that path, because `response.json()` throws on
the non-JSON body. So the player sees `MISSION COMPLETE` credits while the
server has never concluded the mission at all — `status` stays
`"in_progress"` indefinitely, and nothing about this is visible from the
credits screen. The intent of the recent engine change (credits should only
show once the server agrees) is currently defeated by an unrelated routing
bug, in the least detectable way possible: silently, and only on the success
path.

### The refusal path — not verified, and currently unreachable either way

I could not test the "Not Yet" refusal alert (`window.gameAlert('Not finished
yet — there is outstanding work...', 'warning', 'Not Yet', 4000)` in
`scenario-music-events.js`) because the endpoint 500s unconditionally,
regardless of whether the scenario's `concludeRequires` would actually be
satisfied — the crash happens in a `before_action`/authorization step that
runs before `@game.conclude_mission!` is ever called, so there is currently no
way to reach the `success:false` JSON branch through the browser at all. Once
`:conclude_mission` is added to the `set_game` before_action list, this path
should become reachable and is worth a follow-up run specifically to confirm
the alert text reaches the player and names the outstanding tasks.

### Addendum verdict

- **Credits opened:** yes, client-side (`missionEnd.creditsShowing: true`,
  terminal/undismissable as designed).
- **`POST /conclude` HTTP status:** **500**, not 200 — `Pundit::NotDefinedError:
  unable to find policy 'NilClassPolicy' for 'nil'`, because `:conclude_mission`
  is missing from the controller's `set_game` before_action list.
- **Console/network errors:** the fetch itself succeeded as a network
  operation (no CORS/connection failure) and carried a CSRF token
  correctly; the failure is the server's 500 response, which the client's
  intentional fail-open error handling converts into "show credits anyway."
- **Server record after credits shown:** `status = "in_progress"`,
  `mission_concluded_at = nil` — contradicting the credits the player just
  saw.
- **Refusal path ("Not Yet" alert):** not verified; currently unreachable,
  because the endpoint fails before it can ever return a refusal.
- **Not verified this run:** whether the launch-device pickup and abort/launch
  sequence work as designed (blocked by the debugKO/item-drop issue above,
  which is a harness-side finding, not a scenario one) — the debrief here was
  reached by directly firing the same global-variable-changed event the ink's
  `#set_global` would fire, not by completing that sequence in play.

## What this run did NOT verify

Stated plainly, per the skill's rules on honesty about incomplete testing:

- **The client-side credits path was not exercised.** I did not drive the
  browser through the `deactivate_launch` task, the Derek confrontation, or
  the launch-device abort/launch choice, and so never triggered the client's
  own `POST /break_escape/games/:id/conclude` call from
  `scenario-music-events.js` or watched the BondVisualiser credits overlay
  open. The server-side gate was verified directly via `conclude_mission!`
  through `bin/rails runner`, which is what the skill and the task
  instructions call for, but the full click-path from "story reaches its end"
  to "credits open" was not walked end-to-end in-browser this run.
- Derek's office, Patricia's safe, the whiteboard/filing-cabinet puzzle chain,
  Maya's office, and the ENTROPY archive's own note contents were not visited
  or read this run.
- The mid-run `main_office_area_bin_3` and `it_room_notes2_1` anomalies were
  not root-caused.

## Verdict

1. **Does m01 still play normally?** Yes, on the path actually walked (reception
   through server-room flag/task completion) — no regression traceable to the
   conclude-gate engine change. A few pre-existing-looking interact/collider
   flakes needed retries (see Defects #2–4); none were new blockers.
2. **Credits + server record.** Credits screen not reached/tested this run (see
   above). The server record was checked directly and is unambiguous:
   `status` went from `"in_progress"` to `"completed"` and `mission_concluded_at`
   was stamped to `2026-09-12 15:03:43.961210000 UTC`, exactly when and only
   when all three flag tasks were actually completed.
3. **Flags are session stand-ins, not earned.** All three `shatter_server`
   flags used this run were the `--flags` XML stand-in values, substituted for
   `<flag:1>`/`<flag:2>`/`<flag:4>` tokens. The earned-secrets table above
   marks all three flag rows, plus the Derek's-office branch, "no" —
   downstream of them is exercised (task/gate wiring proven correct) but not a
   genuine solvability pass.
4. **Negative test: confirmed.** `conclude_mission!` refused twice (zero flags,
   then one of three) with the exact missing `task:submit_*_flag` list, and
   succeeded only once all three were done — verbatim results above.

---

## Addendum 2 — post-fix re-verification (games 1037/1038/1039, third run)

**Purpose of this run:** confirm the two fixes made in response to the game
1036 finding above — `:conclude_mission` added to the controller's `set_game`
filter, and `conclude_mission?` added to `BreakEscape::GamePolicy` — actually
close the gap between a real browser and the endpoint. This is a plumbing
recheck only, narrower than either run above: no attempt was made to earn the
three `shatter_server` flags or reach the launch-device ending honestly.

### HTTP status: 200 (not 500)

**The 500 is gone.** Every call captured across three fresh games returned
HTTP 200 with a well-formed JSON body, e.g. (game 1039):

```json
{
  "success": false,
  "alreadyConcluded": false,
  "missing": ["task:submit_ssh_flag", "task:submit_linux_flag", "task:submit_sudo_flag"],
  "missionConcludedAt": null,
  "status": "in_progress",
  "score": 0
}
```

CSRF header (`X-CSRF-Token`) was present on every call (`hadCsrf: true`).

### How this run reached the trigger (disclosed shortcut, same as game 1036)

The launch-device pickup remains unreachable to this harness for the reason
game 1036 already diagnosed (`debugKO` does not drop the hostile NPC's held
items). Per the task's own instruction to reuse that technique rather than
re-litigate it, I fired the same event the ink's `#set_global` fires, directly,
with **no** prior play:

```js
window.eventDispatcher.emit('global_variable_changed:start_debrief_cutscene',
  { name: 'start_debrief_cutscene', value: true, oldValue: false });
```

This is a further shortcut than game 1036 took: that run had genuinely earned
`entropy_reveal_read` and completed all three flag tasks first. This run did
not — zero flags were submitted, no rooms beyond `reception_area` were
unlocked. `verify-run.rb 1039` confirms it plainly:

```
current room    "reception_area"
unlocked rooms  1: reception_area
flags submitted 0:
VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

This was a deliberate choice to isolate the one question asked — does the
endpoint 200 and does the CSRF/fetch path work — cheaply. It also, usefully,
exercises the refusal path for free (see below), since firing the event this
way skips every task the scenario requires. It does **not** prove the
success/`concluded:true` path over HTTP in a real browser; that half was
already proven via `bin/rails runner g.conclude_mission!` directly against the
model in Addendum 1 (game 1034: `status` → `"completed"`,
`mission_concluded_at` stamped) and was not re-attempted here to keep this run
short. Nothing in the two controller/policy fixes touches the model method
itself, so there is no reason to expect that result to have changed, but it
was not re-confirmed over HTTP this run.

The event fires the NPC listener correctly regardless of any of these
preconditions — confirmed by reading `scenario.json.erb`, the
`closing_debrief_person` `eventMappings` entry conditions on `value === true`
only, nothing else — so the shortcut is mechanically sound, just further from
an earned playthrough than game 1036's.

### Driving the conversation

The `person-chat` minigame opened correctly (`Agent HaX` debrief). Rather than
hand-drive ~44 turns of `mg` calls, I drove it via one `eval` that loops
`window.__test.minigame.clickControl` on whichever control is enabled
(continue/skip) until the minigame reports `isActive: false` — a mechanical
equivalent of repeated `mg continue`, not a different code path. It closed
cleanly at turn 44, firing `conversation_closed:closing_debrief_person`.

### Credits overlay: opened, but not the way the code intends

`window.__test.getState().missionEnd` reported `creditsShowing: true` on all
three games, including the two refusal runs. **Console instrumentation shows
why, and it is a real, separate defect from the one already fixed:**

```
log: [ScenarioMusic] Trigger 'conversation_closed:closing_debrief_person' → track 'Ghost in the Wire' in 'victory' (fade=true)
...
warn: [ScenarioMusic] Conclusion refused; missing: ["task:submit_ssh_flag","task:submit_linux_flag","task:submit_sudo_flag"]
```

The `concludeMission().then(...)` gate in `scenario-music-events.js` (line
~134) correctly took the refusal branch — `openCredits()` was never called
from there, confirmed by the "Conclusion refused" warning firing with no
preceding `openCredits`/credits-scroll log. But `bond-visualiser.js` has its
**own, separate, ungated listener**:

```js
// bond-visualiser.js:1590-1595
window.addEventListener('musiccontroller:playlistchange', e => {
    if (e.detail?.playlist === 'victory') {
        BondVisualiser.open();
    }
});
```

`MusicController.playTrack(entry.track, entry.playlist, fade)` for the
`conversation_closed:closing_debrief_person` trigger switches to the
`'victory'` playlist **synchronously**, before `concludeMission()` has even
been called, let alone resolved. That playlist switch alone opens the
fullscreen `.bv-stage` overlay via this second listener, with no argument
object — so `disableClose` is not set and the overlay opens *closable*, unlike
the scripted "MISSION COMPLETE" credits scroll (which passes
`disableClose: true` and specific credit lines). What actually appeared was
the plain audio visualiser (`SIGNAL ANALYSIS`, `COMMS INTEL`, `ATTACK: X → Y`
lines, `OPERATIVE DATA`) — not the scripted mission-summary text from
`scenario.json.erb`'s `credits` array, which never appeared because
`openCredits()` was never called on the refusal path.

I have not classified this as confirmed root cause beyond what the console
log and source both show directly — no inference was needed, the two log
lines and the two listener definitions are unambiguous — but flagging per the
skill's convention that a human should be the one to rule on whether this is
in scope for this fix.

**Practical effect on the refusal path:** the player sees *two* things at
once, not the clean single alert the code intends:

1. The correct "Not Yet" toast — confirmed via DOM query, not inference:
   ```json
   {"classes":"notification warning show","title":"Not Yet",
    "message":"Not finished yet -- there is outstanding work on their network before this is over.",
    "visible":true}
   ```
2. A fullscreen, closable audio-visualiser overlay behind/around it, opened by
   the playlist-change listener above, with generic visualiser content (not
   the scripted defeat/victory credits). Screenshot:
   `tools/playtest/m01-conclude-refusal-screenshot.png`.

This is not the 500 regression — the endpoint itself behaved correctly, CSRF
worked, and the "Not Yet" alert did reach the player with the right text. But
a player refused conclusion is shown a fullscreen visualiser screen anyway,
which reads as "something ended" even though the toast says otherwise.

### Server record after the refusal (games 1037, 1038, 1039 — all identical)

```ruby
g = BreakEscape::Game.find(1039)
g.status                # => "in_progress"
g.mission_concluded_at  # => nil
g.score                 # => 0
```

Matches the response body's `missing`/`status`/`missionConcludedAt` exactly —
no discrepancy between what the client was told and what the server holds.

### Session logs

- `tools/playtest/m01-conclude-gate-verify-session-2.jsonl` (game 1037)
- `tools/playtest/m01-conclude-gate-verify-session-refusal.jsonl` (game 1038, console-capture run)
- `tools/playtest/m01-conclude-gate-verify-session-refusal2.jsonl` (game 1039, DOM-notification + screenshot run)

All three were driven the same way: a short-lived Node driver
(`driver.js`, not part of the repo) spawning `playtest-session.js --headless`
against a small fixed command array per phase, for the same reason Addendum 1
used it — reliable test-bridge installation in this environment.

### Verdict (this run's one question, answered plainly)

1. **HTTP status of `/conclude`: 200.** Confirmed on three separate fresh
   games, real headless-browser fetch, real CSRF token attached
   (`hadCsrf: true` every time). The 500/`Pundit::NotDefinedError` from game
   1036 is gone.
2. **Response body:** well-formed JSON every time —
   `{"success":false,"alreadyConcluded":false,"missing":[...3 tasks...],"missionConcludedAt":null,"status":"in_progress","score":0}`
   — matching the server record read directly afterward.
3. **Credits overlay opened:** yes, but see the defect above — it opened via
   an unrelated, ungated listener reacting to the music-playlist switch, not
   via the intended `concludeMission()`-gated path, and displayed generic
   visualiser content rather than the scripted credits.
4. **Server-side conclusion:** correctly did **not** occur — `status`
   stayed `"in_progress"`, `mission_concluded_at` stayed `nil`, `score` stayed
   `0`, consistent with three flag tasks genuinely outstanding (this run
   submitted none).
5. **Refusal path:** reachable now (it was not, in game 1036, because the
   endpoint 500'd unconditionally). The player is shown the correct "Not Yet"
   warning toast naming no specific tasks in its text (the alert text is
   static; the outstanding task list only appears in the JSON/console, not in
   the UI copy) — alongside the unintended fullscreen visualiser overlay
   described above.
6. **Not re-verified this run:** the success/`concluded:true` path over HTTP
   (proven only via direct model call in Addendum 1); the honest
   launch-device/flag-earning route (still blocked for the reason game 1036
   found, `debugKO` not dropping held items).
