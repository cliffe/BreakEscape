# m05 "Insider Trading": pass 5 alignment round 1, browser check (13 October 2026)

Question this run answers: do the round-1 alignment fixes (commit 6ac8d95f) behave in the real game? It is a **targeted regression run**, not a blind one. The four VM flags were supplied by the harness ("flag supplied"; VM work is not possible in standalone), so nothing here proves the VM stage is solvable. Any claim about VM content: needs checking against SecGen by the user.

- Server: keyless :3001 only, headless (load average 14 at the start). No game file edited. :3000 not touched.
- Harness: only the checked-in `session-start.sh`, `cmd.sh`, `session-stop.sh`, `new-game.rb`, `verify-run.rb`. Combat helper code was run through the harness's own `eval` command (a page-side loop that sends the real `walk` key input and `clickAt` canvas clicks); no game state was written.
- Sessions stopped: 2234, 2240, 2243 ("session N stopped" each). The chromium processes still listed by `ps` (pid 14308 and children) are the user's own older browser, not mine.

| Game | Purpose | Session log (in repo) | Lines | Flags XML |
| --- | --- | --- | --- | --- |
| **2234** | Full route, early naming (before flag 3), real fight and win, post-fate sweep, reload before the call-in, full ending | `tools/playtest/m05-r1-game2234.jsonl` | 1253 | `tools/playtest/m05_insider_trading-flags-game2234.xml` |
| **2240** | Owen KO'd before suspicion (F6), wrong accusation of Halloran, 99 per cent scene, deliberate loss, Restart, second fight, lethal ending, call-in with envelope unread | `tools/playtest/m05-r1-game2240.jsonl` | 630 | `...-game2240.xml` |
| **2243** | Owen KO'd, then suspicion, office-card relay | `tools/playtest/m05-r1-game2243.jsonl` | 104 | `...-game2243.xml` |

Screenshots (18, all looked at): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-r1-browser/`. Key ones: `phone1.png` (HaX avatar), `vault1.png` (reader and sign), `torres1.png`, `torres99.png`, `postfight.png`, `hax_after_fate.png`, `contacts.png`, `reload_after.png`, `player_ko.png`, `owen_ko_drop.png`, `brief_first.png`, `credits_end.png`. `verify-run.rb` outputs are saved beside them as `verify-2234.txt`, `verify-2240.txt`, `verify-2243.txt`.

## Summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Vault, two enrolled prints | **Pass** (Torres' print opens it; no Halloran print can be lifted, as designed) |
| 2 | Office card gated on suspicion; Owen's physical drop | **Pass** for the relay; **F6 confirmed still open** (minor) |
| 3 | Torres fight | Winnable (22.9 s, 40 HP lost). **Fail in part: first-encounter damage is 10, not 5** (finding N1, major) |
| 4 | Ending: sweep, no debrief, envelope and schedule, Recruiter, reload, call-in, credits | **Pass** |
| 5 | Early naming | **Pass** |
| 6 | Wrong accusation | **Pass** |
| 7 | Music per phase, after fights, after reloads | **Pass** in all phases (one fix to the harness reading, see below) |
| 8 | Small checks | **Pass** (a, b, c). One partial note on c |

Counts: 0 blockers, 1 major, 3 minors, 3 notes.

## 1. Vault (games 2234, 2240)

- Sign on the reader and the door name: "Key Vault — Fingerprint Access. Heisenberg Leads Only." (`room` output; log 2234 line ~716, screenshot `vault1.png`). Reader overlay: "Choose a lift to present to the reader", one lift listed: "David Torres, Quality 99%, Identified". Presenting it opened the door: log 2234 lines 724 to 728, then `vault_reader_seen=true`, door unlocked, `enter data_center` ok.
- Owen, with the badge-log leverage: "Past the server room is the key vault. Fingerprint reader. Two thumbs enrolled, Ruth Halloran's and David's, and nobody else's. Don't ask me how you'd get in there." Then "you can't change one either, once it's out".
- HaX relay (Owen KO'd, game 2240 line 59 onward): "Past the server room is the key vault. Fingerprint reader, two prints enrolled: Dr Halloran's and the cryptography lead's."
- Halloran's print: **no way to lift one**. The mug comparison offers only "Owen Gallagher" and "David Torres" (game 2234, compare step). By design (A3 decision, no Halloran print surface). So the vault opens on Torres' print only in practice. Not testable further.
- HaX's vault text "That's the vault reader. You've already lifted his print. Use it." arrived while the reader was open (before the unlock). OK.

## 2. Office card (games 2234, 2240, 2243)

- **Normal route (2234):** Patricia's phone naming with the front-door reason set `torres_suspected` and `patricia_authorised_office`; Owen then gave the card ("IT's spare. I hope you don't find anything."). No HaX "IT holds a spare" text appeared. Pass.
- **Owen KO'd before suspicion (2240 lines 40 to 80, 2243 lines 40 to 70):** HaX relayed the badge, password, badge log and the vault note, and **not** the office card. `office_card_obtained=false`, `torres_suspected=false`, aim `gather_evidence` ("Find Out Why") stayed `locked`. Pass.
- **Relay after suspicion (2243):** after the Patricia phone naming (`torres_suspected=true`), the next room entry (`reception_lobby`) set `owen_office_card_relayed=true` and `office_card_obtained=true`. HaX: "That's enough to look in Torres' office. Owen can't hand you the spare, so I've rebuilt it from the reader logs. It's in your kit." Inventory: "Spare Office Card (relayed copy)". Log 2243 lines 69 to 93. Pass. (Patricia's phone is only usable after meeting her in person; a first attempt before that gave "No messages yet / (Hang up.)", expected.)
- **F6 (Owen's physical drop before suspicion), still open (minor):** with Owen KO'd and no suspicion, the room holds `torres_office_keycard` ("IT Spare Office Card"), `server_door_log` and `server_password_note` on the floor next to him (`room` output, screenshot `owen_ko_drop.png`, log 2240 line 69). I picked the card up in 2240: `office_card_obtained=true`, `torres_suspected=false`, the aim stayed hidden, and the card opened Torres' office. So the whodunnit gate is bypassable by KOing Owen and looting him. The card's description doesn't name Torres. Known; round 2 to weigh.

## 3. Torres fight (games 2234, 2240)

Method: HUD toggled to JAB (`#hud-mode-toggle-button`, label read back as "JAB"), then a page-side loop: `__test.walk(direction)` to face him (real key input), `__test.clickAt` on his position to punch, HP sampled every second from `__test.getState().player.hp` and `npcHostileSystem.getState('david_torres')`. Interact mode was restored (two more clicks) afterwards; in jab mode `interact` on objects does nothing ("no-effect-confirmed").

| Attempt | Game | Result | Detail |
| --- | --- | --- | --- |
| 1 | 2234 (early-named, 88 per cent scene) | **Won.** Player 100 to 60 HP, Torres 100 to 0, KO at 22.9 s on the sampler clock (about 9.6 s of the loop after the dialogue closed) | Player hits at 10.0 s, 12.0 s, 14.0 s, 22 s: **10 HP each**, about 2 s apart. 30 clicks sent. Log 2234 lines 975 to 982 |
| 2 | 2240 (lose on purpose, interact mode, standing still) | **Lost.** Player 100 to 0 | First hit about 7 s after choosing the fight line (the dialogue still had to close); then 10 HP every 2 s: 90 at 55.0 s, 80 at 57, 70 at 59, 60 at 61, 50 at 63, 40 at 65, 30 at 67, 20 at 70, 10 at 72, 0 at 73.3 s. **About 25.8 s from the choice to the KNOCKED OUT screen, 18.3 s from the first hit.** Torres took no damage. Log 2240 lines 479 to 491 |
| 3 | 2240 (after Restart, jab mode) | **Won.** Player 80 to 45 HP, Torres 100 to 0 in 22 s | Here the hits were **5 HP each**, 2 s apart. The first 12 s were lost to my loop not connecting; Torres' health started dropping at 13 s. Log 2240 lines 524 onward |

**Can you win?** Yes, twice, with synthetic input, at 60 and 45 HP. Standing still you last about 18 s after the first hit (first encounter) before the KO.

**Restart (2240 line 496, `player_ko.png`):** the KNOCKED OUT overlay offers Restart and Main Menu. Restart is a page reload: it shows the title screen ("Continue?"; I advanced it with `mg continue`), and puts you in `reception_lobby` at 160,144 with HP 100, inventory and globals intact, music `spy-action`. Torres stays hostile at 100 HP. `interact` on him then only produces `player_hp_changed`: **no dialogue and no talk endings** (D5, as decided). It is a 4-room walk back, then a second fight.

### N1 (major): the M7 damage fix does not apply on the first encounter

- `scenario.json.erb` sets Torres' `hostile.attackDamage` to 5 (`npcBehaviorManager.getBehavior('david_torres').config.hostile.attackDamage` reads 5).
- On the first encounter his live combat state has `attackDamage: 10` (the engine default): `npcHostileSystem.getState('david_torres')` read `{"isHostile":true,"currentHP":100,"maxHP":100,"isKO":false,"attackDamage":10,"attackRange":32,"attackCooldown":2000,...}` straight after the loss (log 2240 line 481), and both fights in games 2234 and 2240 lost 10 HP per hit.
- After Restart (reload, hostility restored), the state read `attackDamage: 10` before the room loaded and `5` after entering `data_center` (line 509), and the third fight lost 5 per hit.
- So the state is built with the default when the `#hostile:david_torres` tag turns him hostile, and only the restore path (`takeRestoredHostility`, `npc-hostile.js:100-107`) picks up the behaviour's value. The first-encounter creation path (`npc-hostile.js:121-123`, `npc-game-bridge.js:633`) misses it.
- Effect: the first fight costs 10 per hit, not 5. The design note says "twenty hits, about 40 s"; it is ten hits and about 20 s. Survivable, but twice as hard as designed, and a later reload makes it easier than the first try. This is an engine fix, so it needs the orchestrator's approval; I did not touch it.

## 4. Ending (game 2234 for the full route; game 2240 for a second ending)

1. **After the fate the debrief did not open.** After "stay with him" (`final_choice=combat_nonlethal`): `activeMinigame: null`, `mission_complete=false`, `debrief_played=false`, music `end` (log 2234 around line 1000). The objectives list shows "Sweep the vault, then call HaX to bring you in" and "Report back to Agent HaX".
2. **HaX sweep text arrived:** "The upload's dead. Good. Finish that research server before I pull you out: all four flags in the drop-site. Then sweep the vault and call me." (`hax_after_fate.png`). In 2240 (lethal): "Upload's dead. If you're leaving him there, take what's on that desk and go. Call me."
3. **Call-in with flags missing (flags 3 and 4 out):** "I'm done here. Bring me in." gave "Not yet. The research server isn't finished: all four flags in the drop-site, then I'll pull you out." `mission_complete` stayed false (log 2234 lines 1058 to 1060). Pass.
4. **Last flag after the fate:** "That's the last flag. Sweep the vault if you haven't, then call me and I'll bring you in." arrived (line 1110). Pass (F5).
5. **All flags in, envelope and schedule unread:** the offer named them: "Once you're out, QDC's own people go through that vault before ours do. Whatever you haven't read could walk. There's an envelope under the terminal keyboard nobody's opened. His upload schedule's still on the desk." plus "That TalentStack text never got an answer. She's lost him." "Not yet. I'm still looking." gave "Take your time. The vault isn't going anywhere." (lines 1128 to 1132). Pass.
6. **Envelope and schedule picked up and read** (`found_pipeline_list`, `found_upload_schedule` true). **Recruiter:** her chat read "Agent. Torres is dealt with, and we never did talk terms. Pity. There was an envelope under his keyboard I'd have liked back..."; I rang her back and the call ended with no offer (`never_talked_terms`, F4 kept by decision).
7. **Reload before the call-in:** `sync`, reload, "Continue?" advanced with `mg continue`, then the "RESUME SESSION?" overlay (screenshot `reload_after.png`; I clicked Resume by exact text through the DOM). State intact: `final_choice` set, `mission_complete=false`, music `end`. Then HaX hub "I'm done here. Bring me in." offered only the generic line this time (nothing unread), "Bring me in." gave "Car's at the front entrance. Two minutes.", "On my way." opened the debrief (log 2234 line 1230).
8. **Debrief and credits:** debrief played (HaX, 30-odd lines, with the Task Force Null line "The authorisation goes up on Task Force Null's wall..."). Credits read from `#bv-cr-label` with a MutationObserver, music `victory` / "Cipher Tide" (lines 1240 to 1244). Game 2234 credits: MISSION COMPLETE; THE CASE: NAMED ON THE EVIDENCE — before the server confirmed it; BORROWED BADGE; DAVID TORRES: DETAINED AFTER A FIGHT — handed to the police; ELENA: treatment unfunded; THE RECRUITER: SHE NEVER MADE HER PITCH — the TalentStack list went to SAFETYNET; QUANTUM DYNAMICS: WHO STOPPED THE INTERVIEW — never asked; STAFF: Nobody on staff hurt; "The Architect remains at large...". They match what was played.
9. **Game 2240 credits (lethal ending, Halloran accused, envelope unread, Owen KO'd):** MISSION COMPLETE — AT A COST; ROTATION WINDOW LOST — the East of England re-keyed a month early; WRONG ACCUSATION — Dr Ruth Halloran suspended, then cleared; DEAD — left injured on the data-centre floor; Widowed; TALENTSTACK LIST — left unread under the terminal keyboard; OWEN GALLAGHER: concussion, on your account. Debrief said "stopped at ninety-nine per cent", "the Home Office is re-keying the East of England a month early", "Dr Halloran ... She was in Zurich".

## 5. Early naming (game 2234)

Torres was named by Patricia on the phone with flags 1 and 2 in, flag 3 out: `named_before_portal=true` (log 2234 near line 740). Scene opened "The transfer bar reads 88 per cent. Twenty-eight minutes to the window." (`torres1.png`), ticked to "89 per cent", post-KO "The terminal reads 91 per cent", "kill the transfer at 91 per cent". Debrief: "You had him before the server did. The research portal only confirmed a name you'd already given us." and "The final upload stopped at ninety-one per cent". Credit "NAMED ON THE EVIDENCE — before the server confirmed it" (line 1242). Pass. I did not run a late-naming control game for comparison; the bar ("94 per cent, sixteen minutes") is untested here.

## 6. Wrong accusation (game 2240)

Patricia's phone, "Dr Ruth Halloran." with no alibi found: `halloran_accused=true`, Patricia: "I'll suspend her access ... If you're wrong, that's her career. And whoever it really is has just watched Security move." HaX nudge arrived: "Halloran's suspended on your word, and the research share started pushing faster. Someone saw Security move..." (line 119). Torres' scene: "The transfer bar reads 99 per cent. He brought the window forward." (`torres99.png`, line 271), "You had Ruth suspended. I watched Security walk her back to the lab, and I brought the upload forward. One region's schedule went an hour ago." "The transfer bar holds at 99 per cent." Credits: "ROTATION WINDOW LOST" (line 623) and "AT A COST". Pass.

## 7. Music

Read from `window.MusicController.getState()` (playlist and track). The reading is the playlist key the controller holds; I did not listen.

| Moment | Game | Playlist | Expected | Result |
| --- | --- | --- | --- | --- |
| Opening and investigating | 2234, 2240 | noir | noir | Pass |
| Reload, investigating (after Patricia, before Owen) | 2240 | noir | noir | Pass |
| Owen KO'd before naming (`all_hostiles_ko`) | 2240, 2243 | noir | noir | Pass (end state; the hostile "threat" blip not sampled) |
| Torres named, before fate | 2234, 2240 | spy-action | spy-action | Pass |
| Reload, named | 2234 | spy-action | spy-action | Pass |
| Torres hostile | 2234, 2240 | threat | threat | Pass |
| After the fight, before the fate (all hostiles KO) | 2234, 2240 | spy-action | spy-action | Pass |
| After the fate | 2234, 2240 | end | end | Pass |
| Reload, after the fate | 2234 | end | end | Pass |
| Player KO, then Restart (named phase) | 2240 | threat at the KO screen, spy-action after Restart | spy-action | Pass |
| Credits | 2234, 2240 | victory / Cipher Tide | victory | Pass |

## 8. Small checks

- **a. HaX phone avatar:** the phone's contact list and chat use `assets/characters/agent_hax_headshot.png` (DOM `img` read in the phone modal; `phone1.png`). The Recruiter's contact uses the interim `helen_carver_headshot.png` (`contacts.png`). Pass.
- **b. Mission Brief once:** game 2240 opened the Mission Brief note once after the briefing (log line 7, `brief_first.png`). Reloads in 2240 (line 32), in 2234 (lines 783, 1189) and after the Restart did not reopen it (`activeMinigame: null` each time). The brief is also kept as page 2 of the Notepad. Pass. (Game 2234 closed the tutorial prompt first and the brief never showed on screen; same outcome.)
- **c. Stale HaX texts:** with the office card in hand (2234 via Owen, 2243 via the relay) no "IT holds a spare ... Owen won't part with it" text appeared in HaX's transcript (checked after entering the office). Pass. For the vault, the skip is keyed on `data_center_entered` (set on entering the vault room), so the "That's the vault reader. You've already lifted his print" text still lands if a player lifts the print and presents it within 1.5 s of the reader opening. I could not test that window: `interact` on the door takes about 3.8 s, so the text had always arrived first. In practice the text is read while the reader is open, which is when it is useful. Not a finding.

## Severity table

| # | Sev. | Class | Finding | Repro |
| --- | --- | --- | --- | --- |
| N1 | **major** | engine/mission | Torres' `attackDamage` 5 is not applied on the first encounter: the combat state is created with the default 10, so the first fight is ten hits (about 20 s), not twenty. After a Restart, hostility is restored with 5. | Fresh game, name Torres, choose "Drop the philosophy", read `window.npcHostileSystem.getState('david_torres').attackDamage` (10) while `window.npcBehaviorManager.getBehavior('david_torres').config.hostile.attackDamage` is 5. Player HP drops 10 per hit, 2 s apart (log 2234 lines 975 to 982; 2240 lines 479 to 491, 509). Fix lives in `npc-hostile.js:121-123` / `npc-game-bridge.js:633`; needs the orchestrator's approval |
| F6 | minor | mission (known) | Owen's KO drop leaves the office card on the floor before any suspicion; it opens Torres' office and sets `office_card_obtained` without opening the "Find Out Why" aim | Fresh game, `debugKO owen_gallagher`, pick up `torres_office_keycard`, walk to Torres' office door (log 2240 lines 69 to 90) |
| N2 | minor | mission | The first HaX call's choices ("I'll get to work." etc.) are never answered if the player ignores the phone; the hub (including "I'm done here. Bring me in.") then stays hidden until they answer. In 2234 the player had to pick "I'll get to work." at the very end. After a late `start` the ink goes straight to the hub, but a chat already sitting on `first_call_choices` stays there | Open HaX's chat once at the start, close it without answering, play to the fate, open HaX again: the choices are the old ones. Log 2234 lines 1020 to 1050 |
| N3 | minor | harness/engine | After Restart the player always lands in `reception_lobby` (a 4-room walk to Torres) and Torres is still hostile at 100 HP with no talk endings (D5, decided). Restart is a page reload; the harness needs `dismiss "Restart"` (a DOM `button` click found nothing) and then `mg continue` on the title screen | Lose the fight; log 2240 line 496 |
| N4 | note | harness | `interact` on objects fails silently in JAB or CROSS mode ("no-effect-confirmed"). Reset the HUD to interact mode (click the toggle until the label reads INTERACT) after a fight | log 2234 near line 1050 |
| N5 | note | content | HaX's pre-suspicion vault line says "two prints enrolled: Dr Halloran's and the cryptography lead's". A player who has met Torres' title (the phone naming menu calls him "the cryptography lead") can read it as pointing at him. Intended by A3; flagged for the dialogue stage | log 2240 line 59 |
| N6 | note | harness | Session-start suppresses the resume overlay on the first load, but it appeared after the reload before the call-in (`reload_after.png`); `bootstrap` would loop on it. I clicked "Resume" through the DOM | log 2234 line 1197 |

Not exercised: a late-naming control (the 94 per cent, sixteen minutes variant), the Patricia-KO path, the standing-still survival time at damage 5, and the "turn", "hold" and "expose" endings. Rows in the earned-secrets sense: the four flags were supplied; the briefcase pick was assisted (`completeLockpick`); the mug classification used the harness's pattern hint (the loop was identified by `debug.pattern`, and the compare step lists only Owen and Torres); Owen was KO'd with `debugKO` in games 2240 and 2243 (assisted, combat not played); the Torres fights were played with synthetic input.

## verify-run.rb output

Game 2234 (`verify-2234.txt`):

```
game            2234  (mission 49)
created         2026-10-13 15:31:19 UTC
last write      2026-10-13 15:51:39 UTC
played for      1221s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, research_lab, torres_office, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       16: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, IT Spare Office Card, Personal Journal, Medical Bills, Data Package Manifest, Sealed TalentStack Envelope, Upload Schedule
NPCs met        11: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_4f8eae}, ..._2_a143e6}, ..._3_df2109}, ..._4_24829d}
globals set     50: (includes final_choice, mission_complete, debrief_played, named_before_portal, torres_ko, data_center_entered, flags_nag_sent)

VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2240 (`verify-2240.txt`):

```
game            2240  (mission 49)
last write      2026-10-13 16:04:08 UTC
played for      644s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, torres_office, server_hallway, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Staff Badge (relayed copy), Server-Room Password (from IT's ticket queue), Badge-Reader Log (from IT's archive), IT Spare Office Card, Personal Journal, Medical Bills, Data Package Manifest
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_2a788a}, ..._2_c06e79}, ..._3_ecc569}, ..._4_6b65a2}
globals set     43: (includes final_choice, debrief_played, halloran_accused, owen_ko, torres_ko, flag1..4_submitted)

VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2243 (`verify-2243.txt`):

```
game            2243  (mission 49)
played for      147s of wall clock
current room    "reception_lobby"
unlocked rooms  5: reception_lobby, main_corridor, open_office_area, patricia_office, torres_office
inventory       10: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Staff Badge (relayed copy), Server-Room Password (from IT's ticket queue), Badge-Reader Log (from IT's archive), Visitor Badge, Spare Office Card (relayed copy)
flags submitted 0
globals set     20: (includes owen_ko, owen_office_card_relayed, office_card_obtained, torres_suspected, patricia_authorised_office, door_log_reasoned)

VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

The full outputs are in `verify-2234.txt`, `verify-2240.txt` and `verify-2243.txt` in the scratchpad folder above.
