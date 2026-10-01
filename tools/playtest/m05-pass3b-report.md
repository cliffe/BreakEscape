# m05_insider_trading, pass 3b focused playtest

Question answered: unexpected behaviour (pass-3 changes: phone, Recruiter timing, CEO email, Patricia KO). Not a solvability run. Source of steps: `scenarios/m05_insider_trading/TESTING_WALKTHROUGH.md` plus the seven checks given.

Headless, three games, all driven through the `window.__test` bridge via `tools/playtest/cmd.sh`.

| Game | Ending (`final_choice`) | Session log | Verify output |
|---|---|---|---|
| 1243 | arrest (hold for police, no deal) | `tools/playtest/m05-pass3b-game1243-session.jsonl` | `tools/playtest/m05-pass3b-game1243-verify.txt` |
| 1247 | turn_double_agent | `tools/playtest/m05-pass3b-game1247-session.jsonl` | `tools/playtest/m05-pass3b-game1247-verify.txt` |
| 1248 | public_exposure | `tools/playtest/m05-pass3b-game1248-session.jsonl` | `tools/playtest/m05-pass3b-game1248-verify.txt` |

Flags XMLs: `tools/playtest/m05_insider_trading-flags-game{1243,1247,1248}.xml`.

## Results

| # | Check | Result |
|---|---|---|
| 1 | Phone before meeting Patricia; naming by phone; Recruiter text after call closes | PASS |
| 2 | Name Torres in person; text after conversation closes | PASS |
| 3 | Recruiter rung only after the confrontation | PASS (two variants) |
| 4 | Reload backstops (text re-sent; "You haven't given me an answer") | PASS (both) |
| 5 | Patricia's CEO email taken without reading, credited in debrief | **FAIL** (item never delivered) |
| 6 | Patricia KO'd after a phone call, phoning her | PASS, one observation (badge after ringing) |
| 7 | Two games to completed with different endings | PASS (three) |

### 1. Patricia's phone (game 1243)
- Phone opened before meeting Patricia: contact list shows `Patricia Morgan / No messages yet`, no badge (HaX had badge 2). Opening her chat: only `(Hang up.)`. Hang up closed the call.
- Met Patricia in person, conversation closed. About 2.5s later the phone listed `Patricia Morgan: "Patricia. This is my mobile. Ring me if ..."` badge 1, and `patricia_phone_available=true`.
- Evidence ready: flags 1-3 submitted, vetting file in hand. Phone, Patricia, `I know who it is.` Mid-call, globals: `torres_identified=true recruiter_texted=false` (checked at the choice screen and again 4s later). Chose `On my way.`: the call closed itself, `recruiter_texted=true` immediately, and the Recruiter's text (`TalentStack Executive Recruiting. We should talk...`) appeared in the contact list afterwards, badge 1. So it arrives after the call closes, not during.
- Appearance line: Patricia says "His badge just went through the hallway and the vault's logged him in. He's at the upload terminal." I was standing in `server_room`, next to the vault. David Torres was `visible` in `data_center` once I entered (480,-439), and his confrontation opened with "The vault logged me in twice tonight. One of them was you." That matches. I only tested from `server_room`; I did not test the line from other rooms.

### 2. In-person naming (game 1247)
Patricia's office, `I think I know who it is.` Mid-conversation: `torres_identified=true recruiter_texted=false`, `recruiter_contacted_player=false`. After the conversation closed: `recruiter_texted=true`, and the text was in the phone list 3s later. The Recruiter text also fired in games 1243 (phone) and 1248 (in person) with `recruiter_contacted_player=false`.

### 3. Recruiter after the confrontation
- Variant A (game 1248, no offer ever heard): confronted Torres (expose), `final_choice=public_exposure`, then opened her chat. Transcript: "Agent 0x00. Torres is dealt with, and we never did talk terms. Pity. ... There was an envelope under his keyboard I'd have liked back." No pitch, no choices, no deal. `recruiter_deal_offered` stayed false. (flag 4 held back so the debrief did not pre-empt the call.)
- Variant B (game 1247, offer heard and left unanswered before the confrontation): after `final_choice=turn_double_agent`, her chat reopened on the stale mid-mission menu (`I already told you. No deal.` / `I'm going to find every one of them.` / `I'm done talking`), none of which accepts the deal. After `I'm done talking` the list offered `Ring the TalentStack number back.`; that call played `deal_refused_response` ("you didn't take the trade"). No deal could be taken after the fate was set.
- Not tested: ringing her for the first time after the fate is set when no text was ever read and `recruiter_contacted_player` is false, with flag 4 held. Variant A is that case (I never opened her chat before).
- Observation (not a defect call): on reopening, the chat resumed at the saved pre-confrontation knot, so "Still deciding?" was on screen after the fate was set.

### 4. Reload backstops
- 4a (game 1243): Recruiter text received, not rung. `sync`, `location.reload()`, bootstrap resume. After the reload `recruiter_texted=true` and the phone list again showed `The Recruiter: TalentStack Executive Recruiting...` badge 1, "Just now". (Patricia's chat history reads `No messages yet` after the reload; that is the known in-memory history.)
- 4b (game 1247): opened her chat, walked to the offer (`recruiter_deal_offered=true`), chose `I'm done talking. This call's over.` (the phone chat closed itself; I did not keep it open past that choice). `recruiter_deal_decided=false`. Reload. Phone list: `The Recruiter: You haven't given me an answer, agent. T...` badge 1; opened: "You haven't given me an answer, agent. The offer stands until it doesn't. - R." then "Still deciding? ...".

### 5. CEO email via Patricia: FAIL
Three reproductions:
- Game 1243: confession then `Show me the email.` Patricia says "I kept a copy." Item not delivered. `found_stand_down_email=false`. Patricia's `itemsHeld` still contains `ceo_stand_down_copy`.
- Game 1247: same, in a conversation separate from the vetting-file request. Same result. Debrief then said "QDC's readiness review passed. Nobody asked who cancelled Patricia's interview." and the credits use the `never asked` line.
- Game 1248: hub route `You mentioned an email that stopped you. Can I see it?` (reached via "Another time" at the confession). Same result, with a console/alert hook installed first. Captured, in order:
  - `WARN Server rejected inventory add: Container not unlocked: patricia_filing_cabinet`
  - `Container not unlocked: patricia_filing_cabinet | error | Invalid Action`
  - `ERR [NPCGameBridge] notes from patricia_morgan was not added (rejected) - leaving it with the NPC so it can be given again`
  - `Could not take Printed Email from the CEO's Office. Try asking again. | error | Item Not Received`
  - `ERR Error processing tag give_item: Cannot read properties of undefined (reading 'success')`

  Suspect cause (not confirmed): both Patricia's copy (`ceo_stand_down_copy`) and the filing-cabinet copy (`ceo_stand_down_email`) are named "Printed Email from the CEO's Office", and the server's inventory add resolved the NPC item to the locked cabinet by name. The vetting file (unique name) is delivered fine.
- Consequence for a player: the choice is spent (`gave_ceo_copy=true`, hub option gone), so "Try asking again" is not possible and Patricia's copy is unobtainable. In game 1243 I KO'd Patricia and `ceo_stand_down_copy` appeared as a floor object in her office; I did not try to take it.
- The other route works: game 1248 picked the cabinet (`completeLockpick`, assisted), `mg take` the email (the viewer opened, I closed it at once), `found_stand_down_email=true`. The debrief then read "Patricia's copy of the CEO's email went to the Home Office review with the rest of the file." That line says "Patricia's copy" although the copy came from the cabinet; fine as text, noted.
- So the debrief line is credited on the cabinet route and not on Patricia's. The check as written (Patricia's copy via confession/hub, without reading) could not be exercised past the delivery step.

### 6. Patricia KO'd after a phone call (game 1243)
Patricia had been phoned (the naming call) first. `debugKO patricia_morgan` (assisted; peaceful NPC converted, combat not played). Before ringing: phone list `Patricia Morgan / No messages yet`, no badge; her chat showed only `(Ring her.)`. Rang: line "Narrator: It rings out." then the phone closed. No answer. Observation: after the ring the contact row showed `Narrator: It rings out.` with unread badge 1. If "no unread badge" must hold after ringing too, that is a gap; before ringing it held. HaX's `on_patricia_ko_relay` also arrived ("I've printed you a contractor...", badge 2).

### 7. Completed games
All three: `status=completed`, `mission_concluded_at` set (server record, from `BreakEscape::Game`):
- 1243: 2026-10-01 12:14:06 UTC, `arrest`. Debrief "Justice has costs", credits showing (`missionEnd.creditsShowing`).
- 1247: 12:26:59 UTC, `turn_double_agent`. Debrief: "You turned him", Recruiter section "She rang you, she made you an offer, and you turned her down" and the "never found the list" line, "Torres is an asset now", Elena trial funded.
- 1248: 12:33:50 UTC, `public_exposure`. Debrief: "You went public", CEO email line credited, no Recruiter-offer lines (she never made one).
Credits text is drawn on a canvas, so I read the debrief dialogue rather than the credits roll. The credit lines in the scenario (`CEO'S STAND-DOWN` / `WHO STOPPED THE INTERVIEW — never asked`) depend on the same `found_stand_down_email` global, which was false in 1243/1247 and true in 1248; I did not read the rendered credits.

## verify-run.rb output

### Game 1243
```
game            1243  (mission 49)
created         2026-10-01 11:57:51 UTC
last write      2026-10-01 12:14:22 UTC
played for      990s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, torres_office, data_center
unlocked objs   0:
inventory       16: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Vetting Aftercare File: D. Torres, Torres Office Keycard, IT Notice: Server Room Access, Server Password Sticky Note, Contractor Pass, Personal Journal, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: ...1_10b37a, ...2_55e309, ...3_de9440, ...4_36e1cb
globals set     40: ... debrief_played, final_choice, patricia_ko, recruiter_texted, torres_arrested, torres_identified ...

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
### Game 1247
```
game            1247  (mission 49)
created         2026-10-01 12:15:15 UTC
last write      2026-10-01 12:27:04 UTC
played for      710s of wall clock
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, torres_office, data_center
unlocked objs   0:
inventory       11: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Vetting Aftercare File: D. Torres, Server Password Sticky Note, Torres Office Keycard, Personal Journal
flags submitted 4: ...1_503974, ...3_03c5f8, ...4_c3bf30, ...2_1e1faf
globals set     33: ... debrief_played, elena_treatment_funded, final_choice, flag1..4_submitted ...

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
### Game 1248
```
game            1248  (mission 49)
created         2026-10-01 12:27:16 UTC
last write      2026-10-01 12:33:55 UTC
played for      399s of wall clock
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, torres_office, data_center
unlocked objs   1: patricia_filing_cabinet
inventory       12: ... Printed Email from the CEO's Office ...
flags submitted 4
globals set     34: ... debrief_played, entropy_program_exposed, final_choice, found_stand_down_email ...

VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
Full outputs are in the three `m05-pass3b-game*-verify.txt` files.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Server-room password | `quantum2024` | Owen's sticky note, after the log line "Patricia's log has a crypto badge..." (log read first) | all games, before the door | yes |
| Server hallway access | cloned O. Gallagher EM4100 | RFID clone from Owen | all games | yes |
| Torres office keycard | item | Patricia authorisation then Owen | 1243, 1247, 1248 | yes |
| Torres' print | fingerprint sample | mug, dusting minigame | all three | yes in place, but dusted by driving only the print cells read from the DOM (`data-has-fingerprint`): **assisted** |
| Vault door | print | opened by interaction | all three | yes |
| Filing cabinet (pins 40/55/30/50) | lock | `completeLockpick` | 1248 | **assisted** |
| `<flag:1>`..`<flag:4>` | session-supplied | VM challenge (Bludit); no VM in standalone | n/a | **no, not earned.** The Bludit terminal was opened in 1243 only (VM launcher window, no VM). Everything after the flag submits was exercised, not tested. |

Assisted actions: `debugKO patricia_morgan` (1243), `completeLockpick` on the cabinet (1248), the dusting sweep above. Everything else was driven by input.

The flag values appear in the session logs (they are session stand-ins). Flag 2 in 1247 was first sent via Enter and did not register (the harness's `type ... submit:true` result said `submittedVia: enter`); resubmitting with the SUBMIT button worked. Not a game finding.

## Defects and observations

1. **Patricia's CEO email copy is never delivered (checks 5).** Repro: any game, get to the confession (`How far did your own investigation get?` after the vetting request lifts her influence) or the hub route, choose the email option. Evidence above: server rejects with `Container not unlocked: patricia_filing_cabinet`. Suspect: shared item name between `ceo_stand_down_copy` and the cabinet's `ceo_stand_down_email`. Result: `found_stand_down_email` stays false, the debrief gets the "Nobody asked who cancelled Patricia's interview" branch, and the offer is not repeatable. Rename one item to confirm.
2. **Patricia's mobile after KO: unread badge after ringing.** Contact row shows `Narrator: It rings out.` with a `1` badge. Ringing produces the unread message. Before ringing there is no badge. Decide whether that is intended.
3. **Reopened Recruiter chat after the fate is set resumes at the old mid-mission knot** ("Still deciding?"). The player has to leave it and ring again to reach the post-confrontation line. No deal is offered either way.
4. **After a reload the player is back in `reception_lobby`** (160,144) with doors from earlier still unlocked; Patricia's phone chat shows `No messages yet`. Expected from the memory file, recorded for completeness.
5. **Debrief timing (walkthrough step 23 confirmed).** With all four flags in, the Torres conversation closing starts the debrief immediately, so a Recruiter call-back after the confrontation is only possible if a flag is still outstanding. For checks 3 I submitted flag 4 last. That is a harness constraint on this test, but a player who has all four flags cannot ring her after the confrontation at all. Worth a line in the walkthrough.
6. Torres appears in `data_center` (behind the vault), so the "upload terminal" he stands at is reachable only after the print opens the vault. Not a fault, noted for the walkthrough.

## Not covered
- Check 1 appearance line was only tested from `server_room`.
- Torres KO path, HaX naming route, Lisa, Halloran, medical bills briefcase, fight ending.
- Rendered credits text (canvas); read debrief dialogue instead.
- Torres confrontation choices other than arrest, turn and expose.
