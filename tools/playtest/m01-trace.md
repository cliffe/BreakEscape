# m01_first_contact — playtest trace (run 2)

Source: `scenarios/m01_first_contact/SOLUTION_GUIDE.md` (no `TESTING_WALKTHROUGH.md` exists for m01). This trace reaches the mission's end — confront Derek, abort the launch device, and the closing debrief conversation — the parts the previous trace never reached.

Re-run with:

```
bin/rails runner -e development tools/playtest/new-game.rb 32 tools/playtest/m01-flag-hints.xml
# prints GAME_ID=..., VALID_FLAGS=4, PREFLIGHT OK
node .claude/skills/playtest-scenario/scripts/playtest-session.js \
  --url http://127.0.0.1:3000/break_escape/games/<GAME_ID> --speed fast --headless
```

**Always verify the bootstrap landed on the right game** before trusting anything downstream: `openTasks` should be exactly `["check_in_reception","access_main_office"]` and inventory just `["Notepad","Your Phone"]`. If it shows more, `bootstrap` followed a "Load session #N" link to someone else's save — stop and report it, don't play on.

## Step 1 — briefing cutscene + overlays — PASS

```json
{"cmd":"bootstrap","tutorial":"decline","resume":"new"}
```

Assert: `settled: true`, room `reception_area`, tasks `check_in_reception` + `access_main_office` open, inventory `["Notepad","Your Phone"]` only.

## Step 2 — talk to Sarah, get badge + key — PASS

A direct `moveToNear("sarah_martinez")` + `interact` can land on the nearby "Visitor Sign-In Log" note instead — the bridge correctly reports `mismatch: true` rather than a false pass. Approach from due west of Sarah, clear of the note's radius, instead:

```json
{"cmd":"moveTo","x":118,"y":50}
{"cmd":"interact","id":"sarah_martinez"}
```

If it opens the wrong thing (`opened.id != "person-chat"`), close it and retry — do not treat `mismatch:true` as a pass:

```json
{"cmd":"mg","action":"close"}
{"cmd":"interact","id":"sarah_martinez"}
```

Drive the dialogue by regex, not index:

```json
{"cmd":"waitFor","kind":"minigame","id":"person-chat"}
{"cmd":"mg","action":"continue"}
{"cmd":"mg","action":"choose","args":["^Thanks. I'm here to audit"]}
{"cmd":"mg","action":"continue"}   // repeat, waiting for dialogue-ready each time,
                                     // until awaitingChoice with the hub menu
{"cmd":"mg","action":"choose","args":["^Thanks, I'll get started"]}
{"cmd":"mg","action":"continue"}
{"cmd":"waitFor","kind":"minigameClosed"}
```

Assert: task `check_in_reception` completed; inventory gains `Visitor Badge`, `Main Office Key`.

## Step 3 — unlock Main Office door (key-type lock) — PASS

```json
{"cmd":"moveToNear","id":"door:reception_area->main_office_area"}
{"cmd":"interact","id":"door:reception_area->main_office_area"}
{"cmd":"waitFor","kind":"condition","fn":"() => window.__test.minigame.getState().keyTarget !== null || window.__test.minigame.getState().keySelection !== null","timeoutMs":3000}
{"cmd":"mg","action":"getState"}   // keySelection: [{"x":100,"y":310,...,"label":"Main Office Key"}]
{"cmd":"mg","action":"clickCanvas","args":[154,320]}
{"cmd":"mg","action":"getState"}   // keyTarget now populated
{"cmd":"mg","action":"clickCanvas","args":[100,230]}
{"cmd":"waitFor","kind":"minigameClosed","timeoutMs":15000}
{"cmd":"moveTo","x":48,"y":10}
{"cmd":"waitFor","kind":"task","id":"access_main_office","timeoutMs":8000}
```

## Step 4 — Office Recycling Bin → Maintenance Checklist — PASS

```json
{"cmd":"moveToNear","id":"main_office_area_bin_3"}
{"cmd":"interact","id":"main_office_area_bin_3"}
{"cmd":"mg","action":"getState"}   // items: Maintenance Checklist, kind:"view"
{"cmd":"mg","action":"take","args":["Maintenance Checklist"]}
{"cmd":"mg","action":"getState"}   // NotesMinigame — points to reception phone voicemail, not the note itself
{"cmd":"mg","action":"close"}
{"cmd":"mg","action":"close"}
```

## Step 5 — Reception Desk Phone voicemail (IT PIN) — PASS

```json
{"cmd":"walk","direction":"left","ms":500}
{"cmd":"walk","direction":"up","ms":700}
{"cmd":"moveToNear","id":"door:main_office_area->it_room"}
```

(Navigation to the phone from the main office: cross back through the door corridor near x≈48, then walk east across `reception_area` to `reception_desk_phone`. See report for the two-room walk sequence used.)

```json
{"cmd":"interact","id":"reception_desk_phone"}
{"cmd":"mg","action":"clickSelector","args":[".contact-item"]}
{"cmd":"mg","action":"getState"}   // "IT ROOM PIN has been changed to 2468"
{"cmd":"mg","action":"close"}
```

## Step 6 — Enter IT Room (PIN 2468) — PASS

```json
{"cmd":"moveToNear","id":"door:main_office_area->it_room"}
{"cmd":"interact","id":"door:main_office_area->it_room"}
{"cmd":"mg","action":"getState"}   // PinMinigame, pinLength 4
{"cmd":"mg","action":"clickControl","args":[2]}   // digit 2 → index == digit (1-9), index10 == "0"
{"cmd":"mg","action":"clickControl","args":[4]}
{"cmd":"mg","action":"clickControl","args":[6]}
{"cmd":"mg","action":"clickControl","args":[8]}
{"cmd":"mg","action":"clickControl","args":[12]}  // ENTER
{"cmd":"waitFor","kind":"minigameClosed","timeoutMs":8000}
{"cmd":"moveTo","x":360,"y":-176}
```

**Once unlocked, the door drops out of `scan()` entirely** — walk straight through the former doorway, no further `interact` needed.

## Step 7 — Talk to Kevin — PASS

```json
{"cmd":"moveToNear","id":"kevin_park"}
{"cmd":"interact","id":"kevin_park"}
{"cmd":"waitFor","kind":"minigame","id":"person-chat"}
{"cmd":"mg","action":"continue"}
{"cmd":"mg","action":"choose","args":["^I'll need access to secure areas"]}
{"cmd":"mg","action":"continue"}   // repeat until hub menu
{"cmd":"mg","action":"choose","args":["^I'll take all of it"]}
{"cmd":"mg","action":"continue"}
{"cmd":"mg","action":"choose","args":["^I'll keep investigating"]}
{"cmd":"mg","action":"continue"}
{"cmd":"waitFor","kind":"minigameClosed"}
```

Assert: inventory gains **Lock Pick Kit**, **Server Room Keycard**.

## Step 8 — Pick Derek's Office door — PASS (assisted)

Route: it_room → main_office_area → `door:main_office_area->hallway_east` → hallway_east → `door:hallway_east->derek_office`.

```json
{"cmd":"moveToNear","id":"door:main_office_area->hallway_east"}
{"cmd":"interact","id":"door:main_office_area->hallway_east"}
{"cmd":"moveTo","x":272,"y":-260}
{"cmd":"moveToNear","id":"door:hallway_east->derek_office"}
{"cmd":"interact","id":"door:hallway_east->derek_office"}
{"cmd":"mg","action":"getState"}   // keyMode:true, no matching key
{"cmd":"mg","action":"clickControl","args":[1]}   // "Switch to Lockpicking"
{"cmd":"mg","action":"completeLockpick","args":[{"reason":"m01 playtest: assisted lockpick"}]}
{"cmd":"waitFor","kind":"minigameClosed","timeoutMs":8000}
{"cmd":"moveTo","x":432,"y":-413}
{"cmd":"waitFor","kind":"task","id":"access_derek_office","timeoutMs":8000}
```

## Step 9 — Derek's Filing Cabinet (PIN 0419) — PASS

Confirms the earlier "GAME BUG" correction still holds: opens cleanly with `moveToNear` + `interact`, no special-casing needed.

```json
{"cmd":"interact","id":"derek_cabinet"}
{"cmd":"mg","action":"getState"}   // PinMinigame
{"cmd":"mg","action":"clickControl","args":[10]}  // 0
{"cmd":"mg","action":"clickControl","args":[4]}
{"cmd":"mg","action":"clickControl","args":[1]}
{"cmd":"mg","action":"clickControl","args":[9]}
{"cmd":"mg","action":"clickControl","args":[12]}  // ENTER
{"cmd":"mg","action":"take","args":["Operation Shatter Casualty Projections"]}
{"cmd":"mg","action":"close"}
{"cmd":"mg","action":"take","args":["Social Fabric Manifesto"]}
{"cmd":"mg","action":"close"}
{"cmd":"mg","action":"take","args":["Campaign Materials"]}
{"cmd":"mg","action":"close"}
```

Skip Derek's Personal Safe — not required for the priority path this run targeted; its PIN is not 0419 (tried once, rejected) and was not pursued further.

## Step 10 — Server Room (RFID keycard) — PASS

```json
{"cmd":"walk","direction":"down","ms":500}   // back to hallway_east
{"cmd":"walk","direction":"down","ms":600}   // toward it_room
{"cmd":"moveToNear","id":"door:it_room->server_room"}
{"cmd":"interact","id":"door:it_room->server_room"}   // moveToNear falls short here;
                                                          // interact's own approach fallback closes it
{"cmd":"moveTo","x":368,"y":80}
{"cmd":"waitFor","kind":"task","id":"access_server_room","timeoutMs":8000}
```

## Step 11 — VM Access Terminal — PASS (as far as the bridge can go)

```json
{"cmd":"moveToNear","id":"vm_launcher_intro_linux"}
{"cmd":"interact","id":"vm_launcher_intro_linux"}
{"cmd":"mg","action":"close"}
```

## Step 12 — Submit VM flags at SAFETYNET Drop-Site Terminal — PASS

`moveToNear` alone cannot close the last ~30px (collider). Approach from south of the object, then nudge up:

```json
{"cmd":"moveTo","x":582,"y":220}
{"cmd":"walk","direction":"up","ms":300}
{"cmd":"interact","id":"flag_station_dropsite"}
{"cmd":"mg","action":"getState"}   // expectedFlagCount: 2 — this station owns flags 2 & 4 (ssh, sudo)
{"cmd":"mg","action":"type","args":[0,"test:flag:1",{"submit":true}]}
{"cmd":"mg","action":"clickControl","args":[1]}   // SUBMIT
{"cmd":"mg","action":"type","args":[0,"test:flag:2",{"submit":true}]}
{"cmd":"mg","action":"clickControl","args":[1]}
{"cmd":"mg","action":"close"}
```

Assert: globals `linux_flag_submitted`, `sudo_flag_submitted` set.

## Step 13 — ENTROPY Encrypted Archive (submit_ssh_flag) — PASS

The step blocked in the previous run. Same collider, same approach fix:

```json
{"cmd":"moveTo","x":330,"y":260}
{"cmd":"walk","direction":"left","ms":300}
{"cmd":"walk","direction":"up","ms":200}
{"cmd":"walk","direction":"left","ms":200}
{"cmd":"interact","id":"entropy_encrypted_archive"}
```

`test:flag:1` returns `Validation failed` here — this object is a `lockType:"flag"` safe, not a `flag-station`/`launch-device`, so the alias resolver's station lookup can't find its flag list. Use the **real literal value** instead:

```json
{"cmd":"mg","action":"type","args":[0,"flag{...decrypt key from your flag-hints XML...}",{"submit":true}]}
{"cmd":"mg","action":"clickControl","args":[1]}   // UNLOCK
{"cmd":"mg","action":"take","args":["Operation Shatter: Architect's Authorization"]}
{"cmd":"mg","action":"close"}
{"cmd":"mg","action":"take","args":["ENTROPY Network Architecture"]}
{"cmd":"mg","action":"close"}
```

Assert: global `entropy_reveal_read`; task `submit_ssh_flag` completed; aims `decrypt_entropy_intel`/`disrupt_the_cell`/`deactivate_the_launch` unlock.

## Step 14 — Confront Derek Lawson (Break Room) — PASS

```json
{"cmd":"moveToNear","id":"derek_lawson"}
{"cmd":"interact","id":"derek_lawson"}
{"cmd":"mg","action":"continue"}   // repeat to hub menu
{"cmd":"mg","action":"choose","args":["^I have everything"]}
{"cmd":"mg","action":"continue"}   // repeat through the launch-device reveal
{"cmd":"mg","action":"choose","args":["^I'm calling in SAFETYNET"]}
{"cmd":"mg","action":"continue"}   // repeat to conversation end
{"cmd":"waitFor","kind":"minigameClosed"}
```

Assert: inventory gains **ENTROPY Launch Device**; task `confront_derek` completed (this can be true even while `disrupt_the_cell`'s aim status still reads `"locked"` — check the task, not the aim, if timing matters).

## Step 15 — ENTROPY Launch Device: abort — PASS

Requires the bridge's inventory-item support and the `window.confirm()` fix (see report — a session started before these harness fixes were loaded will silently no-op the abort/launch buttons).

```json
{"cmd":"eval","fn":"() => window.__test.interactInventory(\"ENTROPY Launch Device\")"}
{"cmd":"mg","action":"type","args":[0,"flag{...launch code from your flag-hints XML...}",{"submit":true}]}
{"cmd":"mg","action":"clickControl","args":[1]}   // SUBMIT — reveals ABORT OPERATION / EXECUTE LAUNCH
{"cmd":"mg","action":"clickControl","args":[1]}   // ABORT OPERATION
{"cmd":"mg","action":"getState"}   // "OPERATION ABORTED"
{"cmd":"mg","action":"close"}
```

Assert: globals `player_aborted_attack`, `ready_for_debrief` set; tasks `deactivate_launch`, `use_launch_device` completed; aims `deactivate_the_launch`, `close_the_case` completed.

## Step 16 — SAFETYNET debrief (phone) — PASS to the closing cutscene

```json
{"cmd":"eval","fn":"() => window.__test.interactInventory(\"phone\")"}
{"cmd":"mg","action":"clickSelector","args":[".contact-item"]}
{"cmd":"mg","action":"choose","args":["^Operation Shatter resolved"]}
{"cmd":"mg","action":"choose","args":["^On my way"]}
```

Opens a `person-chat` debrief conversation (`closing_debrief_person` / Agent HaX). Drive with `continue`/`choose` as usual — several beats and two or three binary choices, ending in what reads as final narration, then hands off to a full-screen visualiser overlay (`#bv-vis-canvas`) with a real `✕ CLOSE` button (`#bv-close-btn`). **Not confirmed past this point in this run** — the environment ran out of memory before the fixed `detectBlockingUi()` could be re-verified live. The fix adds an ancestor-widening fallback so this button should now surface in `blockingUi.buttons`; dismiss it the normal way:

```json
{"cmd":"brief"}   // blockingUi should list a "✕ CLOSE" button once detected
{"cmd":"dismiss","label":"CLOSE"}
```

## Known incomplete: `inform_safetynet_operation_shatter`

Never completes in this run — see report for the full mechanism. The phone menu option that leads to it ("I discovered what ENTROPY is planning...") was already gone (global `operation_shatter_reported` already `true`) before this run ever drove that choice through the bridge; cause not fully isolated (possible cross-run game-state contamination vs. a genuine no-return conversation state if the branch is entered but not finished in one go).
