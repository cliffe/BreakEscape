# m03 Ghost in the Machine, pass 2 playtest

**Questions answered:** plumbing (does the reworked route work), unexpected behaviour (reload, KO, out-of-order), and a partial solvability check. Not a full solvability pass: no VMs in standalone, so flags were handed over, not earned.

**Walkthrough source:** `scenarios/m03_ghost_in_the_machine/TESTING_WALKTHROUGH.md` plus `PASS2_IMPROVEMENTS.md`.
**Browser:** headless Chromium. Headed launch failed twice (`window.__test never appeared` after 45 s; logs `m03-pass2-session-failedstart*.jsonl`). Headless loaded in 8 s, so this is environment, not the game.

## Games and logs

| Game | Purpose | Session log | Verifier output |
|---|---|---|---|
| 1155 | Main route, full ending, reload check | `tools/playtest/m03-pass2-session.jsonl` (3222 lines) | `m03-pass2-verify-main.txt` |
| 1156 | Day checks (Danny hidden, guard afternoon), KO receptionist, KO Victoria before cloning, no-reload PC unlock | `m03-pass2-session-ko.jsonl` | `m03-pass2-verify-ko-game1156.txt` |
| 1157 | Clone Victoria, KO her by day, finish flags, debrief sequencing | `m03-pass2-session-dayko.jsonl` | `m03-pass2-verify-dayko-game1157.txt` |

Flag XMLs: `tools/playtest/m03_ghost_in_the_machine-flags-game115{5,6,7}.xml`. Screenshots: `tools/playtest/m03-pass2-shot-*.png`.

### verify-run.rb, game 1155 (main route), pasted in full

```
game            1155  (mission 47)
created         2026-09-30 14:52:28 UTC
last write      2026-09-30 15:35:15 UTC
played for      2567s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, james_office, executive_office
unlocked objs   3: victoria_computer, executive_office_suitcase_2, wall_safe_server
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, CyberChef Workstation, Zero Day Transaction Log
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard, danny_foster
flags submitted 4: flag{...ghost_in_machine_vm_network_1_f7e98a}, ..._2_63348a}, ..._3_7a7c99}, ..._4_20d925}
globals set     17: briefing_played, danny_evidence_seen, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, james_fate, lockpicking_guide_offered, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, time_of_day, victoria_arrested, victoria_choice_made, victoria_fate, whiteboard_seen

VERDICT: progress recorded — 6 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```
Server record: `status=completed  mission_concluded_at=2026-09-30 15:34:40 UTC` (game 1155) and `status=completed  concluded_at=15:52:01 UTC` (game 1157). Games 1156 and 1157 verifier outputs are in the files above.

## Earned-secrets table (game 1155 unless stated)

| Secret | Value used | In-game source | Obtained at (log line) | Earned? |
|---|---|---|---|---|
| Reception badge clone | cloner read of receptionist | Receptionist hub "Lean across the desk" | 319-330 | yes |
| Conference door | cloned Staff Access Badge | as above, emulated at reader | ~380 | yes |
| Server room door | Victoria's card (custom keys, EM4100 after read) | Victoria whiteboard conversation, then read/save/emulate | ~1700-1850 | yes |
| Founding year 2010 | (knowledge) | Company Founding Plaque, reception | ~30 | yes |
| Executive PC password | `Sterling2010` | Post-it "VS / founding year" in the password dialog, plaque, Victoria's surname. First guess `VS2010` was rejected | 2744-2751 | yes |
| Whiteboard clue | ROT13 text, decoded by hand (CyberChef opened but I did not paste into it) | Server Room Whiteboard, `whiteboard_seen`, `decode_whiteboard` completed | 1884-1890 | yes |
| Wall-safe PIN | `5829` | Sterling's unsent draft on the executive PC. **The draft is unreachable** (defect D1), so I never obtained it | never | **no** |
| Wall-safe decoy | `2010` | Tried first as a real player would; rejected, 3-attempt lockout (line 2934) | | n/a |
| Flags 1-4 | `<flag:1>`..`<flag:4>` | Drop-Site Terminal accepts them; VM work not possible in standalone. The VM terminal opens the "start your VM" instructions only | 2874-2890 | **no** (handed over, `session` policy) |
| Executive keycard (KO route) | physical card | Victoria's `itemsHeld`; **never dropped** (D3) | never | no |

Boundary of what this run proves: the four flag tasks, the drop-site reward, revelation call, night confrontation and ending are tested with handed-over flags. Nothing about the VM challenges is proven. 5829 was used deliberately unearned at line 2946 (note at 2942), which proves the safe accepts it and nothing about the clue chain, because the last link of that chain cannot be reached.

## Priority results

| # | Priority | Result |
|---|---|---|
| 1 | Critical path to ending | **PASS.** Game 1155: all four flag tasks `completed`, `moral_choices` reached, Victoria arrest ending, `status=completed`, `mission_concluded_at` set. Game 1157 also concluded via the KO route. VM flags not earned, see table. |
| 2 | NPC placement | **PASS with notes.** Receptionist (96,65) visible in reception, Victoria (-160,65) in conference room, Danny (480,193) in his office, guard patrols the executive hall x 428-498. All talkable. Notes D8. |
| 3 | Earn 5829 | **FAIL.** Whiteboard pointer and PC password work in game. The draft cannot be read, so 5829 cannot be earned. See D1. |
| 4 | Danny appearance / reload | **PASS with notes.** Hidden by day (game 1156 line 95). Appears on entering his office after act 2 (game 1155). Second talk in the same session shows only `System: (End of conversation - press ESC to exit)`, never a replay. After a page reload he is still visible on re-entry and shows `after_choice` ("I've made the call...", line 2673), `james_fate` stays `protected`. Notes D5, D9. |
| 5 | Day-KO sequencing | **PARTIAL.** Clone Victoria, KO her by day, submit flags (game 1157): flag 4 opens the HaX revelation call only, drop-site closes, Zero Day Transaction Log arrives, 6 s later a HaX message points back to the conference room, entering the room fires the debrief once. No pile-up. Debrief loses the Victoria outcome (D2). KO before cloning soft-locks (D3). Victoria arrest branch (game 1155) plays debrief and credits in one flow. |
| 6 | Unexpected | See defects D1-D12. |

## Defects

I have not classified these as engine or scenario faults beyond "suspect"; the evidence is what I saw and the code I read.

**D1 (blocks item pickup, priority 3): every container in m03 is empty.** Objects of type `pc`, `safe` and `suitcase` (Danny's Workstation, Executive Computer, Desk Drawer, filing cabinets, wall safe) hold items under `itemsHeld`, but the client and `games_controller.rb:789` serve only `contents`.
- Repro: unlock `victoria_computer` with `Sterling2010`, or click the Desk Drawer or Danny's Workstation. No container opens, only the hover text shows. Evidence: log lines 2266-2272 (Danny PC, `no-effect-confirmed`), 2762-2770 (drawer), `m03-pass2-shot-empty-drawer.png`. In-page object data for `victoria_computer`: `keys=id,name,type,locked,lockType,takeable,itemsHeld,...`, no `contents`.
- Consequences: the Base64 draft (5829), Client Roster, hidden USB, Danny's recon folder and notes, the safe and cabinet lore are unobtainable. `unlock_object` tasks never tick (`access_victoria_computer`, `lore_fragment_1`, `lore_fragment_2`) because `item_unlocked` is only emitted when the object has `contents` (`unlock-system.js:719-735`). The validator also reports "no container with contents". The wall safe itself unlocks with 5829 (`locked:false`, line 2946) but `lore_fragment_2` stays `active`.
- Fix direction (mine, unverified): rename `itemsHeld` to `contents` on non-NPC objects, as m01 does.

**D2 (KO handlers dead): KO globals never emit `global_variable_changed`.** `npc-hostile.js:159-166` writes `globalVariables[globalVarOnKO] = true` and calls `broadcastGlobalVariableChange`, which only syncs ink stories. Nothing emits `global_variable_changed:victoria_ko`, so every scenario mapping keyed on it never fires.
- Repro: `debugKO victoria_sterling` (game 1156 line 482). `victoria_ko` becomes true; `meet_victoria` and `clone_rfid_card` stay open, `victoria_fate` stays `""`. Same for `james_ko`. Receptionist `taskOnKO` works because it uses `task_completed_by_npc`.
- Effect in game 1157: debrief ran with `victoria_fate=""` and skipped the whole Victoria outcome line ("Victoria Sterling is in custody" or a KO equivalent). It also said "You never found the consultant" (correct there).
- Suspect engine, but m03 should key on `npc_ko:victoria_sterling` instead.

**D3 (soft-lock): a KO'd NPC outside the start room has no sprite reference, so no death animation and no item drop.** `getNPC(id)._sprite` is `undefined` for Victoria and the guard (true for the receptionist in the start room). `dropNPCItems` returns early.
- Repro: game 1156, KO Victoria before meeting her (line 482). She stays standing (`m03-pass2-shot-victoria-ko.png`), no Executive Keycard drops, `meet_victoria`/`clone_rfid_card` open. After reload she is invisible and the card is still gone. The server room needs `victoria_keycard_clone`, so the mission cannot proceed. The walkthrough's "KO fallback: Victoria drops a physical Executive Keycard" does not work.
- The guard KO shows the same missing sprite reference.

**D4 (stuck input): an empty `.minigame-container` remains and input stays disabled.** Reproduced twice.
- Repro (game 1157, line ~466): at the server room door open the flipper, Saved, Executive Keycard, Emulate. It starts a Read; click Save on the EM4100 screen. The minigame reports gone (`no-active-minigame`) but an empty `.minigame-container` covers the canvas, `MinigameFramework.gameInputDisabled` stays true, `currentMinigame` is null. Escape does nothing. Game 1155 line 1452, `m03-pass2-shot-stuck.png`, first hit the same way.
- I recovered by removing the DOM node and re-enabling scene input by hand (noted in both logs, 1854 and 466). A player would need a reload, which loses saved cards (D5).
- Suspect engine (`minigame-manager.js` `endMinigame`, `onComplete` then `currentMinigame = null`).

**D5 (reload): reload loses state.** Game 1155 after reload (log 1466 onwards, 2630 onwards):
- Cloner saved cards are gone (`No saved cards`); they live only in client `scenarioData.saved_cards`.
- Aim statuses revert: `act2_breach_server_room`, `search_executive_office`, `collect_lore`, `perfect_stealth`, `moral_choices` show `locked` while their tasks are `active`, `openTasks` empty in `brief`. Flag tasks still completed afterwards and `moral_choices` went `active` after flag 4.
- Player is back at the lobby start point. Victoria's conversation restarts from her intro.
- Mission-blocking if the player reloads before cloning: they must redo the clone (the cloning dialogue does replay).

**D6 (sequencing): the HaX timed message interrupts Victoria's cloning conversation.** The phone chat opens over it mid-conversation; the remaining lines ("The cloner buzzes...") and the RFID read screen return only after the player closes the flipper at the server door (game 1157 lines ~440-460). Cloning still succeeds, but the order is confusing and the Save prompt appears in the hallway.

**D7 (receptionist not hidden): she stays after `clone_rfid_card`.** The mapping `objective_task_completed:clone_rfid_card` → `setVisible:false` (`scenario.json.erb:505-510`) did not hide her (visible in `room` and screenshot `m03-pass2-shot-recep-after-clone.png`, before and after reload). Only checked in the lobby after leaving and returning; not diagnosed.

**D8 (placement / movement):**
- The receptionist stands at the exit door. Clicking the door raises the interaction menu or opens her chat (log ~640-700); only keyboard movement or the menu got me through. `moveToNear` to the hallway door failed for the same reason.
- `moveToNear victoria_sterling` on entering the conference room did not move the player (arrived at the doorway); keyboard walking worked.
- The guard's patrol reaches the west doorway of the executive hall (x≈362) and I stood against him at x=361 for about 12 s unable to walk west. A world click on the doorway (`clickAt 316,-48`, line 2852) worked. Not diagnosed further.
- The server-room terminal path: click-pathing from the door ended amid the server racks (172,-227) and stopped 127 px short; keyboard walking around the racks worked.

**D9 (dialogue / copy):**
- Victoria's line "You step back from the whiteboard, creating distance naturally." is a narration line spoken as Victoria.
- Danny: `*nods slowly* "` has a stray opening quote.
- Same-session second talk with Danny shows only `System: (End of conversation - press ESC to exit)` (line 2563); the `after_choice` text only appears after a reload (line 2673).
- `*stage direction*` text remains inside spoken lines (Receptionist, Victoria, Danny, guard), against the pass-2 note that these were folded.
- HaX says "Twenty-five thousand dollars" (US spelling of the currency word in a UK-English piece).
- After a receptionist choice, the harness regex `^2010` failed on the choice "2010. Victoria must be proud..." (harness normalisation, not the game).

**D10 (wrong password feedback):** the executive PC's wrong guess `VS2010` shows "Network error. Please try again." and the attempt counter stays 0/3 (line 2747), instead of "incorrect". Possible engine.

**D11 (guard line of sight not tested):** both lockpick attempts (game 1155 line ~2500, game 1156) were `PASS (assisted)` with the guard 95 to 139 px away and `guard_detection_count` stayed 0. The KO'd-guard interrupt check is unverified. The debrief still reports "the guard never logged you once" after I had spoken to him (count 0 is correct).

**D12 (global mismatch, minor):** `time_of_day` stays `daytime` while `mission_phase` is `act2_infiltration` (guard and Danny key on `mission_phase`, so behaviour is right; the extra global is misleading).

## Step results by aim (game 1155)

| Step | Result | Log |
|---|---|---|
| 1 Briefing plays once, `briefing_played` | PASS | 2-3 |
| 2 Plaque shows 2010 | PASS | ~20 |
| 3 Sign in, Visitor Badge | PASS | 59-200 |
| 4 Clone reception badge, `clone_reception_badge` | PASS | 319-330 |
| 5 Conference door by emulating clone | PASS | ~380 |
| 6 Victoria, `meet_victoria` on first talk | PASS | ~430 |
| 7 Whiteboard clone, `clone_rfid_card`, phase `act2_infiltration` | PASS with D6 | ~1700 |
| 8 Server room door with cloned card | PASS (assisted by DOM recovery after D4 once) | ~1850 |
| 9 Four flags, tasks, revelation call, log reward | PASS with handed-over flags | 2874-2895 |
| 10 Whiteboard, `decode_whiteboard`; CyberChef laptop | PASS (CyberChef loads, `Crypto Workstation`) | 1884-1900 |
| 11 Executive door lockpick | PASS (assisted) | ~2730 |
| 12 Executive PC `Sterling2010` | PASS to unlock; **contents unreachable** | 2744-2751 |
| 13-16 Roster, filing cabinet, wall safe, USB | **BLOCKED** by D1 (safe opened with 5829, unearned, line 2946) | |
| 17 `zero_detection` | not exercised (D11); count stayed 0 | |
| 18 Danny confrontation | PASS (protected, `james_choice_made`) | 2393-2530 |
| 19 Victoria night confrontation | PASS (arrest; cold-recruit and escape not run) | 3100-3185 |
| 20 Debrief and credits, `#mission_complete` | PASS; credits overlay first closable during the debrief, then terminal | 3185+ |

Not run: Danny expose/leave choices, Victoria recruit/escape fates, KO Danny, field guides, server filing cabinet, guard bribe / SAFETYNET reveal branches.

## Suggested order for a fix pass (mine)

1. D1 (`itemsHeld` to `contents`): unblocks priority 3 and all lore.
2. D3 and D2: KO route soft-lock and dead handlers.
3. D4, D5: engine, worth a ruling before touching m03.
