# Tesseract Trials engine probes: results

Probe scenario: `scenarios/test-tesseract-probes/`. Risk numbers follow `scenarios/lab_tesseract_trials/DESIGN.md` section 12. Run on 2026-10-06 on the keyless server (:3001), headless because the load average was 11 to 14.

Scratch folder (abbreviated `probes2/` below): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/probes2/`

| Game | Scenario state | Session log | Verifier |
|---|---|---|---|
| 1568 | as first written (pigeonholes without `locked:false`) | `probes2/session-1568.jsonl` | `probes2/verify-1568.txt`: 4 objects unlocked |
| 1569 | pigeonholes given `"locked": false` | `probes2/session-1569.jsonl` | `probes2/verify-1569.txt`: 3 objects unlocked |
| 1570 | plus the phone workaround (no `currentKnot` on Keyholder, no `targetKnot` on the pickup mapping, a `#set_global` in `start`) | `probes2/session-1570.jsonl` | `probes2/verify-1570.txt`: 2 objects unlocked |

An earlier, interrupted run (game 1567) is in `.../scratchpad/probes/session-1567.jsonl`.

Static checks: `scripts/compile-ink.sh test-tesseract-probes` compiled 2 of 2 files. `ruby scripts/validate_scenario.rb` passed the schema with no errors. It gave 22 suggestions (unread globals, no cutscene and so on, all expected for a probe) and, after the workaround, one "missing recommended `currentKnot`" for Keyholder. `probes2/ink-compile.txt` and `probes2/validate.txt` hold the output.

## Results

| Probe | Result | Evidence | Workaround |
|---|---|---|---|
| R1: NPC gives `workstation`, opens CyberChef from inventory | **PASS** | 1568: Tom's `#give_item:workstation:lab_laptop` put "Lab Laptop" (type workstation, `takeable:false`) in the inventory. Clicking it showed `#laptop-popup` with CyberChef v10.19.4 loaded (`#input-text` present). Screenshot `probes2/r1-cyberchef-open.png`. Repeating the give choice did not duplicate it | none needed |
| R2: terminal-themed phone in a password-locked container, take and talk | **PASS**, with a duplicate opening (fixed scenario-side) | 1568/1569: after the lockbox opened, `take("Keyholder Device")` fired `item_picked_up:phone` with `itemId: keyholder_device`, the mapping set `kh_picked` and opened phone-chat in the terminal theme (`probes2/r2-phone-chat.png`). Choices worked, and reopening from the inventory showed the contact list, then the thread at `hub`. **Defect:** the `start` lines appeared twice. Picking up a phone preloads its intro into the thread (`public/break_escape/js/systems/inventory.js:582`). The mapping then always passes a knot (`npc-manager.js:1033`, `config.targetKnot \|\| ... \|\| npc.currentKnot`), phone-chat treats it as an explicit start (`phone-chat-minigame.js:352-357`), and it appends the knot again (`:493-506`). This happens with or without the earlier video call. m02's `ghost_terminal_device` has the same shape (`targetKnot: "start"`, `currentKnot: "start"`), so m02 probably shows it too (not checked) | Leave out `currentKnot` on the phone NPC and `targetKnot` on the `item_picked_up` mapping (keep `conversationMode: "phone-chat"`). In 1570 the intro then showed once, the preloaded `#set_global:kh_greeted:true` was applied, and a reopen landed at `hub` |
| R3: call triggered by `global_variable_changed` | **PASS** | 1568: an `unlock_object` task's `onComplete.setGlobal` set `relay_opened`. Keyholder's `video-call` mapping opened `relay_call` within about 100 ms (`probes2/r3-video-call.png`), and `#set_global:call_seen:true` applied. It also fired with the device already opened (1569, 1570). It fired even when the player didn't hold the device (1568). The call pre-empts the relay PC's container auto-open, and interacting again opens the PC normally | Expect the player to reopen the container after the call, or say so in the call |
| R6: copy `text_file` into CyberChef | **PASS** | 1568: the Copy button passed the full 331-character text to `navigator.clipboard.writeText`. If that is refused, it falls back to `execCommand('copy')` (`text-file-minigame.js:209-245`). Pasting it into CyberChef's input gave the same 331 characters | none needed |
| R6: copy a `notes` item into CyberChef | **PASS** (selection driven by script) | 1568: `.notes-minigame-text` and every ancestor are `user-select: auto`, and mousedown and selectstart aren't prevented. Select-all plus copy gave `VGhpcyBpcyBhIG5vdGU=`. Pasted into CyberChef with From Base64 it gave "This is a note" (`probes2/r6-paste-note.png`). A real mouse drag was not possible from the harness | none needed. Short notes can stay as `notes` |
| R8: `alarm_panel` as fixed lamps | **PASS** | 1568: the Byte Wall showed BIT 7..0 = 0 1 0 0 1 1 0 1, with `panelTitle` and `footer` shown (`probes2/r8-byte-wall.png`). Single default `states` with `variables: []` work | none needed |
| R9: `pigeonholes1` as a container of `text_file`s | **FAIL as written, PASS with `"locked": false`** | 1567/1568: interaction did nothing ("no-effect-confirmed"). Console: `CONTAINER ITEM INTERACTION` → `KEY REQUIRED` → `NO KEYS OR LOCKPICK AVAILABLE`. Cause: `getLockRequirementsForItem` returns `locked: undefined` for an object with no `locked` field (`public/break_escape/js/systems/unlock-system.js:637-638`, default `lockType 'key'`), and `handleUnlock` treats anything but `false` as locked (`:93`). 1569: with `"locked": false` it opened as a container (`probes2/r9-pigeonholes.png`). Envelope A (text_file) and Envelope B (notes) both opened, and Copy on Envelope A worked | Put `"locked": false` on every unlocked container (pigeonholes, unlocked PCs, bins with contents). The lab PC already had it, which is why R15 worked |
| R15: unlocked `pc` holding `text_file`s | **PASS** | 1568: both files showed as desktop icons (`probes2/r15-lab-pc.png`). "Your lab account" opened, Copy worked, and `onRead.setVariable` set `pc_file_read` | keep `"locked": false` (see R9) |
| R16: NPC gives a `notes` item | **PASS** (person NPC) | 1568: Tom's `#give_item:notes:field_note` added "Field Note 1" to the notepad. A phone-NPC give was not probed | — |
| Password lock with a 32+ character answer | **PASS**, but there is a limit | 1568/1569: the 40-character hex `9f86d081...f4f1b` opened the lockbox, and `unlock_lockbox` completed. In 1569 the value came from Envelope A in the pigeonholes. **Limit:** the field has `maxlength="50"` (`public/break_escape/js/minigames/password/password-minigame.js:115`). A longer answer is truncated on paste and can't be entered. The value is also `trim()`med (`:426`) | Keep every typed answer at 50 characters or fewer. A 64-hex SHA-256 or a PEM won't fit, so ask for a short token decoded from it |
| PIN lock | **PASS** | 1568: 4821 on the keypad opened the safe, and `unlock_pin_safe` completed | — |
| Task completes when a `pc` is unlocked | **PASS** | 1568: `item_unlocked relay_pc` then `objective_task_completed:unlock_relay`, and its `onComplete.setGlobal` fired | — |
| CyberChef keeps its recipe after close/reopen | **FAIL** (known risk R10) | 1568: with recipe `From Base64` and input set, closing and reopening gave recipe `[]`. Cause: `public/break_escape/js/utils/crypto-workstation.js:19` sets `src` on every open, and `:40` clears it on close. From reading the code (not tested), the "open in new tab" button opens `cyberchefFrame.src` (`:53-54`), the bare CyberChef URL, so the new tab also starts empty, and it only works while the laptop is open | Scenario-side: tell the player to use the new-tab button *before* building a recipe and to keep working in that tab, and keep recipes short. A real fix needs an engine change (hide the iframe instead of clearing `src`). That is for the user to decide |

## Other observations

- **Closing a `text_file` opened from a container returns to the world, not the container.** A `notes` item does return (`notes-minigame.js:801-805` checks `pendingContainerReturn`). The text-file close handler just calls `complete(false)` (`text-file-minigame.js:142-144`). Seen on the lab PC (1568) and pigeonholes (1569). Minor: the player re-interacts. A multi-file PC is a little clunkier because of it.
- **The terminal theme adds its own `>` prompt**, so an ink line written as `> DEVICE ACTIVE` renders as `> > DEVICE ACTIVE` (`probes2/r2-phone-chat.png`). m02's Ghost ink does the same. Drop the leading `>` in Keyholder lines if one prompt is wanted.
- **Probe layout, not engine:** in this room the relay PC can only be reached from below (a desk row blocks y≈111 west of x≈150), and Short Note sits on the approach, so the harness opened it by accident twice. The real lab rooms need their own reachability check.
- The person-chat transcript names the player `demo_player`, not the scenario's `player.displayName`. That is a harness label and doesn't show in the UI.

## Scenario changes made during the run

1. `pigeonholes`: added `"locked": false` (R9 fix, from game 1569 on).
2. `keyholder`: removed `"currentKnot": "start"`. Removed `"targetKnot": "start"` from its `item_picked_up:phone` mapping. Added global `kh_greeted` and `#set_global:kh_greeted:true` in `start` to check that preloaded tags still apply (R2 workaround, game 1570).

## Round 2 probes (builder, game 1574, :3001 headless, load ~11)

Fixture extended for R17-R25: a password-locked `pigeonholes1` (`pigeonholes_locked`), a second-device timed text, a player phone with a phone NPC (`hax_probe`) that gives a note, a story-gated aim (`side_aim`, `unlockCondition.globalVariable: file_read`), a readable note whose observation is edited with the pencil, and a mapping on `conversation_closed:keyholder`. Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/builder/session-1574.jsonl`. Screenshot of the call: `.../scratchpad/builder/probe-r3-call.png`.

| Probe | Result | Evidence | Consequence for the build |
|---|---|---|---|
| R17 password-locked `pigeonholes1` | **PASS** | Password minigame opened; `porter-12` unlocked it and the container listed "Pigeonhole 4". | none |
| R18 `sendTimedMessage` on the second device | **PASS** | After `unlock_pin_safe`, the Keyholder thread held "PROBE R18: timed text on the second device." | none |
| R19 phone NPC gives a `notes` item | **PASS** | Choosing "Send me the probe note." put "HaX Probe Note" in the notepad, and its `onPickup.setVariable` set `hax_note_had` | `comms_had` can come from each note's `onPickup` (R3 note 9) |
| R21 story-gated aim | **PARTIAL** | Before: `side_aim` locked and story-gated. After reading the note (`file_read` true): still `status: locked` (no longer gated, but not unlocked). The objectives manager does not unlock a `globalVariable`-gated aim by itself; m05 calls `unlockAim` from a mapping. | Add a HaX mapping `global_variable_changed:megan_file_read` → `unlockAim: loose_threads` |
| R23 pencil notes survive a reload | **PASS** | Edited "Assessment Note"'s observation to "Key: aabbccdd IV: 11223344 R23", synced, reloaded, resumed: the note text still ends "Observation: Key: aabbccdd IV: 11223344 R23". | none |
| R25 `conversation_closed:<phone npc>` after a video call | **PASS** | After the video call's exit, the `hax_probe` mapping on `conversation_closed:keyholder` (condition `globalVars.call_seen === true`) set `closed_after_call`. | FN10 fallback trigger works as designed |
| R3-1 call rewrites `currentKnot` | **confirmed** | After the call `npcManager.getNPC('keyholder').currentKnot === 'relay_call'` | design's `the_offer` first-line route is needed |
| Unlocked containers under the D2 working-tree code | **PASS** | `lab_pc` (`locked: false`, no `lockType`) and `pigeonholes` opened after reload | rule 4 holds |
| Click targeting | finding | A real click on `pigeonholes_locked` (pinned at 7,7 beside a chair) and on `relay_pc` gave `no-effect-confirmed` from in range; calling the game's own `handleObjectInteraction` on the same sprite opened them. The click landed on the neighbouring chair. | Pin scenario objects clear of furniture; probe each in the build smoke run |

## Build smoke run (builder, real scenario `lab_tesseract_trials`, games 1576 and 1577, :3001 headless)

These close the remaining design risks against the real build rather than the fixture. Evidence: `scenarios/lab_tesseract_trials/build_evidence/` (screenshots, `verify-1577.txt`).

| Risk | Result | Evidence / action |
|---|---|---|
| R20 doubled decor | **Avoided by design change** | Tom's board is a pinned `whiteboard2` and Cliffe's build an `info_screen1`, not the template's own `chalkboard2`/`smartscreen` sprites, so nothing doubles (screenshots smoke-3/8). |
| R22 reach and paths | **FOUND and fixed** | Game 1576: pinned exhibits at the foyer's west edge (Byte Wall at 1.2,3.2) walled the player into the strip between the reception desk and the wall after entering from the lab. Same pattern found by inspection in the corridor (directory under the workshop door), Sidhu's office (Sidhu beside the door) and the workshop (scoreboard and workbench across the only path from the south door). All moved; game 1577 walked foyer, lab, corridor and workshop without getting stuck. The common room, library and Sidhu's office were not walked in this run. |
| N2 Comms note on line one | **PASS** | 1577: after the first briefing line the notepad already held "Comms Discipline" and `comms_had` was true. |
| R1 laptop from Tom | **PASS** | 1577: "Lab Laptop (CyberChef)" in inventory plus FN1-FN3 in the notepad. |
| L1 decoded in the in-game CyberChef | **PASS** | Leaflet text (from the notepad) set as CyberChef's Input with From Decimal in the bundled v10.19.4 frame: Output "fennel" (smoke-4); the lockbox accepted it server-side and `open_lockbox` completed. |
| E1 workaround (device intro once) | **PASS** | smoke-6: the intro appears once. |
| R3 call on `relay_opened`, `on_call` lines | **PASS** | The relay terminal's password opened the video call (smoke-9); the call-only Narrator line "Behind you, Dr Schreuders keeps soldering" showed; `ghost_greeted` variant used. |
| K5 live | **PASS** | After "I'll think about it", reopening the device landed on `the_offer_again` with the refuse choice (smoke-10). |
| R25 | **PASS** | `fn10_offered` was set after the call closed. |
| R12 Magic | not run | Still to record in the walkthrough. |
| Text stacking | observation | Moving quickly from the drop box into the workshop stacked four toasts (drop box, Ghost, FN7 offer, workshop). Each pair on one event is spaced; the pile-up is cross-event and only at speed. Left for the first timed playtest. |

Locks after L1 in game 1577 were opened with answers read from the server (`exercised, not earned`): corridor, drop box, workshop door (brass key), relay terminal. Their recipes are proven by `tools/verify_rendered_*` instead.
