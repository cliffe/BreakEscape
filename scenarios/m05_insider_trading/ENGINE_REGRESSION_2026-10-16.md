# m05 "Insider Trading": engine regression playtest, 16 October 2026

Which question this run answers: plumbing on today's engine (does the route still work after the 2026-10-16 engine changes), plus the m05-specific checks from the brief. It is a **regression run**, not blind. It does not answer solvability: the four VM flags were supplied.

- Step source: `TESTING_WALKTHROUGH.md`, with the engine-change list from the brief.
- Main run: game **2588** (mission 49), keyless server :3001, headless (machine load about 1 to 2, so timings are representative). About 45 minutes of wall clock, 2536 harness commands.
- Session log: `tools/playtest/m05-engine-regress-game2588.jsonl`. Flags XML: `tools/playtest/m05_insider_trading-flags-game2588.xml`.
- Second, short run: game **2600**, only to check that flag 3 alone doesn't make Torres suspected. Log: `tools/playtest/m05-engine-regress-flag3-game2600.jsonl` (559 lines).
- Screenshots (all looked at): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-regress-engine/` (`01-` to `46-`).
- Both sessions stopped with `session-stop.sh`. No mission or engine file edited, nothing committed.
- Credits reached: **yes**, in game 2588, ending "WALKED OUT BY SECURITY" (the player fought Torres, then rang HaX for Send Security).

## verify-run.rb output

Game 2588:

```
game            2588  (mission 49)
created         2026-10-16 19:22:17 UTC
last write      2026-10-16 20:07:55 UTC
played for      2738s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, research_lab, break_room, torres_office, server_room, data_center
unlocked objs   1: torres_briefcase
inventory       18: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Server Hallway Badge Log, IT Notice: Server Room Access, Server Password Sticky Note, Conference Lanyard, TalentStack Leaflet, IT Spare Office Card, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        12: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, lisa_park, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_f6b95a}, ..._2_3df2f7}, ..._3_57442a}, ..._4_72ef2c}
globals set     56: (includes data_center_entered, debrief_played, mission_complete, torres_called_in, torres_arrested, torres_identified, flag1_submitted..flag4_submitted)

VERDICT: progress recorded — 9 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

`debrief_played` and `mission_complete` are set, so the mission concluded server-side as well as on screen.

Game 2600: `VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 3 flags submitted.`

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Security Incident Log | (note) | Patricia's desk, read before asking Owen | before the clone | yes |
| Owen's staff badge | cloned EM4100 | Owen, "(Lean over his log screen...)", RFID read, Save | before the hallway door | yes |
| Server Hallway Badge Log | (note) | Owen, "Patricia's log has a crypto badge in the server hallway at 23:47. Whose?" (needs the incident log) | after the clone | yes |
| Server room password | `quantum2024` | Owen's sticky note (read in the Notepad), after the door was tried and he refused once | before the server-room door | yes |
| Torres' office card | (item) | Patricia's phone authorisation (naming with the front-door reason), then Owen | before the office door | yes |
| Naming reason: front-door times | menu choice | Badge log main-entrance lines | before the first naming call | yes |
| Naming reason: "portal manifest, badge 4471 staged it" | menu choice | HaX's flag-3 text | after flag 3 | **flag supplied (no)** |
| Torres' print | lift from the mug | Mug in torres_office (find, black granular, dust, lift, compare) | before the vault | yes for the minigame; **assisted**: the print position and loop pattern were read from the harness `debug` block |
| Briefcase (pins 35/60/45/30) | pick | `mg completeLockpick` | before the journal and bills | **PASS (assisted)**, dexterity not drivable |
| `qdc_research_server:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | Drop-site terminal. In-game prerequisites reached: the password, HaX's guide offers (`recon_guide_offered`, `bludit_guide_offered`, `privesc_guide_offered`) | before the vault | **no: flag supplied, VM work not possible in standalone** |

Rows marked "no" are the boundary of what the run proves. The flag submissions and everything that reads the flags (HaX's flag texts, `case_exfil`) were exercised, not earned. Anything about VM content: needs checking against SecGen by the user.

## Severity table

I haven't classed anything as an engine or mission bug; "suspect" means a human should rule.

| # | Severity | Finding | Repro (log is game 2588 unless stated) |
| --- | --- | --- | --- |
| E1 | minor | HaX barks arrive after the player has already done the thing, and read wrong. "Staff prox reader. Your cloner will take a card off anyone who carries one. Owen's lanyard is the nearest. I've a cloning guide if you want it." stamped 16:47, after Owen's badge was cloned and the hallway door opened. "That's the vault reader. You've already lifted his print. Use it." shows as a toast over the data centre after the vault reader had already opened (screenshot 36). Same pair as pass 5 M4, so not fixed. | Clone Owen's badge, enter the server hallway; lift the print, open the vault. Screenshots 13, 36. |
| E2 | minor | Phone choice buttons carry no numbers. Number keys 1-9 do work (key `2` picked "What should I know going in?"; keys 3, 4, 2 walked the Patricia naming menu) and the "▼ more choices" cue shows when the list overflows, but nothing on screen tells the player the keys exist. Suspect intended, but worth a ruling. | Open the phone, any chat with choices. Screenshots 04, 22, 23. |
| E3 | minor | The first three HaX texts are stamped 15:30, an hour before the 16:30 start, then the fourth reads 16:33 ("Four hours to the final upload window" sits above "Find them before half past eight tonight"). Looks like the seeded messages use the pre-start rate. | HaX chat right after the briefing. Screenshot 03. |
| E4 | minor | Credits say "Nobody on staff hurt" in a run where the player punched Torres twice (he was at 40 of 60 HP when Security was sent). | Fight Torres, punch, then HaX "I can't take him. Send Security." Credits line captured below. |
| E5 | minor | The HaX hub still offers "The Recruiter just called me." after the Recruiter's offer was heard and refused (`recruiter_deal_decided` set). | Ring the Recruiter, refuse, then open HaX at the Send Security prompt (log `2588`, HaX hub of 9 choices). |
| E6 | minor | A reload mid-fight heals the player to 100 while Torres keeps his damage (40 of 60 over a reload). So a reload is a free full heal. Probably accepted, but it is a way round the fight. | Punch Torres twice, `sync`, reload, Resume, re-enter the data centre: player hp 100, Torres 40/60. |
| E7 | minor | In fists (jab) mode, 2 of 5 click-to-walk attempts did not move the player (targets beside the desk and rack, Torres in contact). The other 3 walked. Not isolated, so inconclusive. | Switch with Q during the fight, `moveTo` three points; log around the fight. |
| E8 | minor | Known and unchanged: the "Task Complete" toast sits over the close button of conversations (Patricia, Owen, Halloran, Lisa; screenshots 05, 09, 19, 21). The resume-session overlay appears on the second reload but not the first (screenshots 30, 43). | First meeting with each NPC; reload twice. |
| E9 | minor | HaX's flag-3 text says the portal manifest is "Staged by badge 4471, no name on it", while the printed "Data Package Manifest" in the vault reads "Staged by: D. Torres". These are different documents, so it may be intended, but a player may read it as a contradiction. Needs a ruling. | Submit flag 3, then read the manifest in the data centre. |

Counts: **0 blockers, 0 majors, 9 minors.** Nothing found that is new since the engine changes except E2, E6 and E7, which are observations on new behaviour.

## Engine changes: what passed

| Change | Result |
| --- | --- |
| Per-NPC maxHP and attackCooldown | Pass. Read only after he turned hostile (the gotcha): Torres maxHP 60, attackCooldown 3000, attackDamage 3. Player HP dropped 3 about every 3.0 s (100, 97, 94, 91; later 91, 88, 85, 82, 79 at 2.4, 5.6, 8.7, 11.9, 14.4 s). A punch took 10 off his 60 (50, 40, 30). |
| Hostile attacks pause while the phone is open | Pass. Phone opened mid-fight at 52 HP: HP stayed 52 for 10 s, and the first hit came 2.3 s after closing it. |
| He's past talking | Pass. `interact` on hostile Torres shows the toast "He's past talking." (screenshot 39) and opens no conversation. |
| chaseRange leash | Pass. After walking out of the data centre into the server room, Torres did not follow: HP held at 79 for 11 s, no Torres in the server room's NPC list. |
| NPC HP saved with hostility over a reload | Pass. Torres at 40/60 before `sync` + reload; after Resume and re-entering the data centre he was hostile (`torres_hostile` true again), 40/60, damage 3, cooldown 3000. |
| Restart after a knockout resets non-KO'd hostiles calm at their posts, and clears hostility records | Pass. After a real knockout (HP 0, "KNOCKED OUT", Restart): `torres_hostile` false, Torres at his post (480,-447) and stationary, no attack for 8 s. His intro replays, as expected. A second Restart-style check on the mapping: `torres_ko` false throughout. |
| Player starts at the start room after Restart or reload | Pass (reception_lobby, per the 2026-10-16 resolved decision). |
| No out-of-combat regeneration | Pass. HP stayed 79 for 11 s outside combat. |
| Password keypad: title names the lock and "case-sensitive" on a near miss | Pass. Title "Enter password: Server Room — Password Access. Contact IT."; `Quantum2024` gave "Incorrect password. Passwords are case-sensitive. 2 attempts remaining." (screenshot 17). |
| Dusting and lock headers show text variants | Pass. The mug header shows "Fingerprint kit / Mug" plus its description and surface line; the briefcase lock shows its title and description (screenshots 26, 29). |
| Mug not consumed | Pass. `office-misc-cup` with `takeable: false` stayed on the desk after dusting. m05 has no consumables in its scenario data, so healing was not exercised. |
| Phone choices on number keys and "more choices" cue | Pass (see E2 for the missing numbers). |
| Long HUD captions wrap | Pass. HaX toasts wrap in a narrow column (screenshots 01, 13, 28); readable. |
| Story-rate gameClock | Pass. Phone times start at 16:33 and run at about 2.5 game minutes per minute (16:37, 16:39, 17:03, 17:32, 17:39). Naming with the data centre already entered jumped the clock to 20:14, matching Torres' scene ("20:14. The data centre."); the Recruiter's call reads 20:15 to 20:21; the Send Security texts read 20:43. The 19:50, 20:02 and Thu 09:00 anchors were not reached (a different naming order is needed for 19:50 and 20:02). |
| Flag 3 shows badge #4471 and doesn't by itself make Torres suspected | Pass. HaX: "Manifest flag verified. Staged by badge 4471, no name on it. Find who carries that spare." In game 2600 (flags only, no naming, no evidence) after flags 1 to 3: `torres_suspected` false, `case_exfil` false, `case_motive` false, no "both halves" text. In game 2588 (journal read, front-door reason given) flag 3 then produced "That's both halves... Call her." |
| Send Security | Pass. Offered as the first HaX choice while Torres was hostile and unbeaten ("I can't take him. Send Security."). Result: "Power's off down there. The upload got to ninety-nine per cent first. They're walking him out." Tasks moved to the sweep and the debrief; debrief and credits both match ("You backed off and I called it in", "WALKED OUT BY SECURITY"). |
| Rolling trolleys and chairs | Pass. Server-hall tool trolley pushed 155 px through frames `tool-trolley-rotate2` to `rotate6`. Lab instrument trolley pushed 25 px left, stopped against the bench, frames 4, 6, 8. Positions reset on reload (expected). |
| Lab wall-mounted shower and first-aid cabinet | Pass. Both visible on the lab walls in the map view and in Halloran's conversation background (screenshots 18, 19). |
| Rack LEDs | Seen: server room and server hallway racks show lit LEDs (screenshots 31, 36). Not isolated from the older glow. |
| Ten conversation backgrounds | Pass for every conversation held: Patricia (office, noticeboard, screenshot 05), Owen (open-plan, 09), Halloran (lab with shower and first-aid cabinet, 19), Lisa (break-room kitchen, 21), Torres (data centre, two-person rule sign, 38). Briefing and debrief use the SAFETYNET office. Patricia's and Lisa's "left views" render without visible faults. |
| HaX's new bust on the phone | Pass (pass 5 M1 is fixed): contact list and chat show the new HaX portrait (screenshots 02, 03, 44). The Recruiter's avatar was not checked. |
| Mid-mission reload | Pass. Reloaded with the print lifted and the vault shut: inventory, globals, tasks and `torres_print_collected` survived, the vault opened later, and the Mission Brief note no longer reopens. |
| RFID card and keycard doors | Pass. Cloned badge opened the hallway door (Flipper > Saved > Staff Badge > Emulate); the IT Spare Office Card opened Torres' door with "Access Granted / Door opened with IT Spare Office Card". |

## Not exercised

- Consumable healing (no consumables in m05's data).
- RFID reader with an empty cloner (the cloned card was used).
- Vision cones on hidden or KO'd NPCs (Torres was never KO'd).
- Punch cone ±40 degrees: the cone is in `player-combat.js` (`punchConeHalfAngle`), but I did not measure it in play. Punches landed at melee distance each time.
- Fighting Torres to a knockout and the post-KO choice (the earlier run covered it with `debugKO`); the other endings (talk, hold, expose).
- The 19:50, 20:02 and Thu 09:00 clock anchors; fire effect, above glows and delayMs mappings (no m05 content for them that I could see).
- The Patricia-KO and Owen-KO fallbacks, wrong accusation of Halloran, stand-down email, accepted tutorial.

## Timeline

| Step | What happened |
| --- | --- |
| Opening | Briefing driven by hand (not bootstrap), "Methodically". Mission Brief note closed, tutorial declined. HaX's first texts at 15:30 (E3). |
| Aim 1 | Patricia met, badge and incident log read. |
| Aim 2 | Owen: clone, badge log, hallway door by emulation, IT notice, password door (case-sensitive near miss), refusal, then password with the incident-log leverage. Lisa and the TalentStack leaflet. Halloran: lanyard, spare-badge ask, alibi. |
| Naming 1 | Patricia by phone, "I know who it is", David Torres, reason "His badge comes in the front door six minutes before her spare." Accepted, office authorised, card from Owen. |
| Aim 3 | Torres' office: mug dusted (find, powder, dust, lift, compare), print lifted ("Print Lifted: Lifted David Torres's print (Fair, 74%)"), briefcase picked (assisted), journal and bills. |
| Reload 1 | `sync`, reload, "Continue?", back in reception. Everything persisted. |
| Aim 4 | Server room by password, VM launcher placeholder, four flags submitted, vault opened with the lift ("Biometric Unlock Successful"), upload schedule, manifest and TalentStack envelope read. |
| Naming 2 | Patricia by phone again with both halves ("His own journal" then the badge 4471 manifest). Recruiter's text arrived afterwards; rang her, heard the long pitch, "Not interested. That list is going to SAFETYNET." |
| Fight | Confronted Torres, chose "Drop the philosophy". Measured damage and cooldown, phone pause, past-talking toast. Knocked out at 0 HP, Restart (reset checked). Second fight: punched him to 40/60, reload, HP persisted, leash checked by leaving the room. |
| Ending | HaX "I can't take him. Send Security." then "I'm done here. Bring me in." Debrief (about 40 lines, hub of five questions) and credits to the last line. |

## Credits, as read (20 lines, via a MutationObserver on `#bv-cr-label`)

MISSION COMPLETE; INSIDER TRADING; OPERATION SCHRÖDINGER: STOPPED; CIVILIAN LIVES SAVED: 30-45 (estimated, first rollout wave); THE CASE: MOTIVE, MEANS AND AUTHORISATION, all on file; BORROWED BADGE, Halloran's spare traced back to Torres; DAVID TORRES: WALKED OUT BY SECURITY, you backed off; nobody talked to him; ELENA TORRES: Still fighting Stage 3 cancer, treatment unfunded; SOFIA (11) AND MIGUEL (8) TORRES: Father facing trial, mother untreated; THE RECRUITER: OFFER REFUSED, the TalentStack list went to SAFETYNET; QUANTUM DYNAMICS: WHO TOLD SECURITY TO STOP, never asked; QUANTUM DYNAMICS STAFF: Nobody on staff hurt (E4); The Architect remains at large...

## Harness notes (not findings)

- `interact` by inventory id fails (`unknown-entity`); `window.__test.interactInventory("phone")` through `eval` opens the phone.
- `pressKey` is refused while the phone is open, so number keys on the phone went through a DOM `keydown` dispatched on `document`.
- `mg clickText "The Recruiter"` matched HaX's transcript again; use the contact's preview text ("We sho").
- A long `drag` on the dusting canvas (many points) blocked the command pipe for about two minutes and made a second command return the first one's reply. Keep drags short.
- Dusting needed wide strokes (about ±30 px around `printCentre`) to pass 40 per cent coverage; narrow strokes plateau at 37 per cent.
- Notes read in the world (incident log, badge log, notices, password note) show in the Notepad, not the harness inventory list, though `verify-run.rb` lists them as inventory.
- Another playtest-session.js process was running on the machine when I finished; both of mine were stopped.
