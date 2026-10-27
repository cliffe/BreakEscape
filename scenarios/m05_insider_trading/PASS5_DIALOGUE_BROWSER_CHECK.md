# m05 "Insider Trading": pass 5 dialogue stage, browser check (13 to 14 October 2026)

Question this run answers: do the open items from Phase 4 dialogue cycles 1, 2 and 3 (`IMPROVEMENT_LOOP_LOG.md`) behave in the real game, on the re-dressed `room_qdc_*` maps? It is a targeted regression run, not a blind one. The four VM flags were supplied by the harness (`<flag:N>` from the flags XML); standalone has no VMs, so nothing here says anything about the VM stage. I did not open the SecGen XML or the four exploit guides, and I make no claim about VM content ("needs checking against SecGen by the user" stays with D12).

- Server: keyless :3001 only. :3000 not touched. Headless (load average 12 to 22 throughout, so timings are not representative). No mission file edited, nothing committed.
- Harness: only the checked-in `new-game.rb`, `session-start.sh --headless true`, `cmd.sh`, `session-stop.sh` and `verify-run.rb`. My shell wrappers (scratchpad `m05-dialogue-browser/lib.sh`, `lib2.sh`, `lib3.sh`, copied from the earlier m05 browser runs) only chain `cmd.sh` calls. Phone threads were read from the DOM (`.messages-container`, `.choice-button`) because `mg getState` truncates long threads.
- Sessions started and stopped (each printed "session N stopped"): 2383, 2389, 2396, 2397, 2404. Two other `playtest-session.js` processes (games 2402/2403, later 2409/2410) were running during my checks. They are not mine and I left them.
- Screenshots (all looked at where cited): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-dialogue-browser/`.

## Debug and assisted steps (exercised, not earned)

- `minigame.completeLockpick()` on Torres' briefcase in every game (the journal is now locked in the briefcase; the pick itself was not played). The journal and motive were then taken through the real container.
- Torres' fight (game 2397): real fight with `__test.walk` and `clickAt` in JAB mode, no `debugKO`. My first attempt lost because I had not toggled the HUD to JAB (my mistake, not a defect). Restart (via `dismiss` "Restart") put me back in the lobby with Torres hostile; the second fight won in 8.1 s at 85 HP.
- `debugKO` was not used.
- Flags 3 and 4 came from the harness flags XML.

## Games and session logs

| Game | Purpose | Final choice | Session log (repo) | Lines |
| --- | --- | --- | --- | --- |
| **2383** (A) | Reload with phone chat reopened, Patricia naming close/reopen, HaX flag choice, Recruiter hang-up and ring-back, Halloran post-fate choice, Lisa, non-lethal debrief, credits | `turn_double_agent` | `tools/playtest/m05-dialogue-game2383.jsonl` | 1510 |
| **2389** (B) | Abandoned at the Torres menu: I mis-picked into the turn route (my error). No evidence used from it | `turn_double_agent` | `tools/playtest/m05-dialogue-game2389.jsonl` | 828 |
| **2396** (C) | Arrest, no deal: Torres' last line, Lisa's side door, Patricia, Halloran, non-lethal debrief, credits | `arrest` | `tools/playtest/m05-dialogue-game2396.jsonl` | 1282 |
| **2397** (D) | Real fight, lethal ending: Patricia, Lisa, lethal debrief close, credits | `combat_lethal` | `tools/playtest/m05-dialogue-game2397.jsonl` | 1260 |
| **2404** (E) | Wrong accusation of Halloran then Torres, public exposure: D5C3-1, D5C3-4, D5C3-6, debrief, credits | `public_exposure` | `tools/playtest/m05-dialogue-game2404.jsonl` | 1264 |

Flags XML for each: `tools/playtest/m05_insider_trading-flags-game<id>.xml`. `verify-run.rb` output (all five printed "VERDICT: progress recorded"):

```
2383: 9 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
2389: 7 rooms beyond the first, 1 objects unlocked, 2 flags submitted.
2396: 9 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
2397: 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
2404: 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Full outputs are in the scratchpad folder (`verify-<id>.txt`; 2396 only the last lines were kept on screen, the file is complete).

## Summary

| # | Item (source) | Result |
| --- | --- | --- |
| 1 | Debrief on a non-lethal ending, beats 1 to 5 (C1, C2 D5C2-1/-3/-7/-10/-13/-17) | **Pass** (games 2383, 2396, 2404) |
| 2 | Lethal debrief close, no stance or trust praise (D5C2-1) | **Pass** (game 2397) |
| 3 | Halloran's post-fate choice "[It was David. I'm sorry.]" (D5C2-6) | **Pass** (2383, 2396) |
| 4 | Lisa's side-door line (D5C2-5) | **Pass** (2396) |
| 5 | Patricia's admission reachable (D5-3, D5C2-22) | **Pass** (2383, 2404) |
| 6 | Credits "WHO TOLD SECURITY TO STOP — never asked" without the vetting file (D5C3-5, a3be6fab) | **Pass** (all four finished games) |
| 7 | Mid-mission page reload with a phone chat reopened | **Pass** (2383) |
| 8 | Patricia's naming: reaction beat, close, reopen on "...Damn." (C1) | **Pass** (2383, in person) |
| 9 | HaX's flag choice with two flags waiting (C1) | **Pass** (2383) |
| 10 | Recruiter hang-up and ring-back (C1, D5-5) | **Pass** (2383) |
| 11 | A fate reaction in a person-chat (C1 D5-8) | **Pass** (Lisa, Halloran, Patricia, Owen across 2396, 2397, 2404) |
| 12 | D5C3-1 Halloran/Owen exposure reactions agree | **Pass** (2404) |
| 13 | D5C3-2 Patricia's lethal line, no number | **Pass** (2397) |
| 14 | D5C3-3 Patricia's arrest line against Halloran's | **Pass** (2396) |
| 15 | D5C3-4 "Dr Halloran will want to hear you say it." | **Pass** (2404) |
| 16 | D5C3-6 HaX "You know his reasons now." | **Pass** (2404) |
| 17 | D5C2-20 Torres' one line without the deal | **Pass** (2396) |

Counts: 17 of 17 pass. New findings: **0 blockers, 0 majors, 1 minor, 5 notes** (table at the end).

## Item results

### 1. Debrief on a non-lethal ending: pass

Three non-lethal endings played to the end, with different picks each time.

- Game 2383 (turn), session log lines 1135 to 1473. Opens "Let's go through it." / "QDC's readiness review passed. Nobody asked who told Patricia to stop looking." (the no-vetting-file variant). Beat 1: "Nine per cent to spare. You bought that yourself." Beat 2 after "[Whose job was it to fix that?]": "Owen's, on paper. One sysadmin, after the budget cuts. The CEO wanted a clean audit more than a safe one." Then "You turned him. The riskiest thing you could have done, and the most useful." "Torres knows where his came from. That's a thread we can pull." Close after "[Did I get him right?]" (line 1473): "Ask me in a year." / "You went looking for the man underneath. That mattered, whatever you decided in the end." / "Go home. Take the rest of the day."
- Game 2396 (arrest, no deal). "[Then it worked.]": "It worked. This time." "[QDC won't like seeing that in my report.]": "The board won't. Owen might." Torres beat: "You held him and Patricia called the police. He hasn't said a word to them or to us." / "Elena's treatment is unfunded. She has months, maybe. Sofia and Miguel may watch that with their father on remand." After "[I did my job. The rest isn't my department.]": "That's what the review board will want to hear. I'm not sure I do." After "[Who signs off on a number like that?]": "Someone who never has to hear the ambulance not come." "[I'd do it the same way again.]": "I know. I read the report."
- Game 2404 (exposure, Halloran wrongly accused, 99 per cent): "The file's strong now. It went through an innocent woman on the way, and that's in it too." / "You said you'd be methodical. Most of the night, you were." / "One region's did. When Security moved on Dr Halloran, he brought the upload forward..." "[That one's on me.]": "Yes. Dr Halloran will want to hear you say it." (line 1083). Exposure beat: "You went public. The Initiative is front-page news, TalentStack's offices are empty, and the police picked Torres up the next morning." and "It already has. Your consultant cover is burnt, and Netherton wants you in his office at two."
- "Cut" lines checked absent: no "Without the rest, what they have is a very expensive paperweight" doubling, no "One last thing.", no "There was never a clean way to handle Torres."

### 2. Lethal debrief close: pass (game 2397)

Real fight, then "[Kill the upload and walk out. Leave him bleeding on the floor.]" (`final_choice="combat_lethal"`, `confront_stance="sympathetic"`, `handler_trust=35`). Debrief middle: "David Torres is dead." / "He hit his head on the rack when he went down. You killed the upload and walked out. Nobody found him until Patricia went looking, forty minutes later." / "The pathologist thinks twenty minutes would have been enough." Then, after "[Did I get him right?]" (log line 1219, screenshot `d_lethal_close_pre.png` before it):

> "You know the answer to that."
> "You went looking for the man underneath. Then you left him on the floor."
> "The job got done. I'm still deciding about the rest."
> "Go home. Take the rest of the day."

No "That mattered, whatever you decided", no "I trust your judgement", no "Cold, maybe", no stance or trust praise. The middle line is the sympathetic-stance variant the log calls optional; it is a condemnation, not praise. Credits: "MISSION COMPLETE — AT A COST", "DEAD — left injured on the data-centre floor", "Widowed — still fighting Stage 3 cancer, alone", "Father dead — and, without treatment, they may lose their mother too" (log line 1251).

Note for the reader of game 2404: the sentence "The job got done. I'm still deciding about the rest." also appears on non-lethal endings when `handler_trust < 50` (`m05_closing_debrief.ink:805`), and it did there. That is as written.

### 3. Halloran's "[It was David. I'm sorry.]": pass

- Game 2396 (arrest, line 985 onward, first meeting): hub opens on "The police have David. Nobody's told me anything else." with the choices "Tell me about your team.", "Your spare badge has been through the server hallway at night. Four times.", "The key vault takes your thumbprint. Could someone have lifted it?", "**It was David. I'm sorry.**", "That's all for now." Picking it: "I should have seen it. He was pulling away. Working late, alone. Avoiding my eye." / "I signed his overtime every week and never once asked what it was for."
- Game 2383 (turn, line 1135): same choice after "Patricia says I'm to treat David as normal on Monday. I don't know how I'll manage that." Same reaction. Screenshot `halloran_postfate_choice.png` (choices render in the menu; bust shown).
- Only one of "[It's David.]" and "[It was David. I'm sorry.]" shows at a time: before the fate the pre-fate text is used (not exercised here, covered by route r34/r38).

### 4. Lisa's side-door line: pass (game 2396, log line 879)

After the arrest (`final_choice="arrest"`), Lisa's first greeting is the intro; picking "[Sorry, I'm short on time]" closed the chat. On reopening the hub opened with: "**Someone's had the side door propped open for ten minutes. Nobody will say why.**" Choices include "[It's David. I'm sorry.]". Patricia in the same game (line 913): "The police are with him now. I gave them the side door. Nobody in this building needs to watch." The two agree.

Other Lisa fate lines seen: turn, "Someone said David's gone home early. Is that good?" (game 2383); lethal, "Has anyone seen David? His coat's still on his chair." (game 2397, line 961).

### 5. Patricia's admission reachable: pass

- Game 2383, line 319, through the reason menu "[His badge comes in the front door six minutes before her spare. Every night.]": "...Every night." then "I sign that log off every Monday. I never once read the front door."
- Game 2404, line 361, same route after Halloran had been accused: "I sign that log off every Monday. I never once read the front door." then "And Ruth's sitting in her lab, suspended on your word. That's on both of us now."
- The second wording (the `significant_close` late disclosure, D5C2-22) was not reachable here because the reason was given first. Covered by r14/r15 and the earlier round-4 browser run.

### 6. Credits "WHO TOLD SECURITY TO STOP — never asked": pass

Read from `#bv-cr-label` with a MutationObserver set before the last debrief line. All four finished games had `found_vetting_file=false` and `found_stand_down_email=false` (read back in 2383 and 2396):

- 2383 (log line 1499), 2396 (1273), 2397 (1251), 2404 (1257): "── QUANTUM DYNAMICS ──" then "**WHO TOLD SECURITY TO STOP — never asked**", then "── QUANTUM DYNAMICS STAFF ──", "Nobody on staff hurt". Screenshots `a_credits_end.png`, `d_credits.png`.
- The "WHO STOPPED THE INTERVIEW" variant (vetting file found) was not played; not requested.

Full credits for each ending are in the logs: turned ("TURNED — working for SAFETYNET inside ENTROPY's network"), arrest ("HANDED TO THE POLICE — said nothing"), lethal (above), exposure ("EXPOSED — named publicly as 'The Quantum Traitor'", "WRONG ACCUSATION — Dr Ruth Halloran suspended, then cleared", "ROTATION WINDOW LOST — the East of England re-keyed a month early").

### 7. Reload with a phone chat reopened: pass (game 2383, log line 758 onward)

State before: named Torres, `flag1_discussed=true flag2_discussed=true`. HaX's thread was open with "About that flag." just answered. `location.reload()` (no `sync`), Enter on the title screen. After the reload: `torres_identified=true flag1_discussed=true flag2_discussed=true final_choice=""`. Reopened the phone and HaX: the thread was intact ("About that flag." / "You're on the box. Their home directory will tell you who's been living on it.") with the hub choices and the new line "That TalentStack number is the Recruiter. Hear her out if you want. Just don't give her anything." (screenshots `hax_before_reload.png`, `hax_after_reload.png`). "[Where do I stand?]" answered "You've got his print. He's at the upload terminal in the vault. Go and face him."

The player came back at the lobby start (160,144), not where I had been (known: see N2).

### 8. Patricia's naming, close and reopen on "...Damn.": pass (game 2383, line 669)

Named David with both halves. Patricia's reaction beats: "Slowly. I'm writing this down." / "His own journal. He knows what it costs, and he's doing it anyway." / "A staging manifest in the data centre. 'Staged by: D. Torres.'" / "The upload schedule names him as operator, on site. Tonight, half past eight." / "...Damn." with "[You knew him.]" and "[I'm sorry. He's one of yours.]". I closed with End Conversation on those choices and reopened: she resumed on "...Damn." with the same two choices (screenshot `damn_reopen.png`). In person only; the phone version was not run.

### 9. HaX's flag choice with two flags waiting: pass (game 2383, line 751)

With flags 1 and 2 submitted, "[About that flag.]" was on the hub. One click gave a single answer, "You're on the box. Their home directory will tell you who's been living on it.", and the option then disappeared (both flags marked discussed, as `m05_phone_agent_0x99.ink:354-370` intends).

### 10. Recruiter hang-up and ring-back: pass (game 2383, lines 823 to 833)

Walked her pitch through "[That number was known before Torres ever touched the data.]" to the deal, then "[I'm done talking. This call's over.]". Thread: "Time's short for both of us, then." The call closed itself. Reopening the thread offered only "[Ring the TalentStack number back.]" and "[Leave it.]". Ringing back: "Still deciding? The offer doesn't improve with age, agent." / "Forty-seven names. One call from you protects them, or leaves them where they are. In my pipeline." with "[No deal.]", "[Run the terms past me again.]", "[I'm done talking. This call's over.]". "[No deal.]" gave `recruiter_deal_decided=true recruiter_deal_accepted=false` and the credits line "OFFER REFUSED — but the TalentStack list was never recovered".

### 11. Fate reactions in person-chats: pass

Lisa (all three ending types), Halloran (arrest, turn, exposure), Patricia (arrest, lethal), Owen (exposure) all open on a line that matches the fate and agrees with the others: see items 3, 4, 12, 13, 14.

### 12. D5C3-1, exposure (game 2404): pass

Halloran (line 937): "David put his head round my door on his way out. He said thank you, and went." Owen (line 965): "David's badge just went out the front door. Thought you'd want to know." Both in the same game, no clash. Halloran's greeting before the fate line was the reinstatement one ("Patricia's given me my access back. I'll want an apology from you. Not tonight."), then the fate line followed on the hub.

### 13. D5C3-2, Patricia lethal (game 2397, line 869): pass

"Torres hasn't come up from the data centre. I'll go down myself once the CEO's off my phone." No number; the debrief's "forty minutes later" holds.

### 14. D5C3-3, Patricia arrest (game 2396, line 913): pass

"The police are with him now. I gave them the side door. Nobody in this building needs to watch." Halloran's line in the same game: "The police have David. Nobody's told me anything else." Visited Patricia first, then Halloran; no conflict.

### 15. D5C3-4 (game 2404, line 1083): pass

"Yes. Dr Halloran will want to hear you say it." then "Dr Halloran spent hours suspended because of a badge log read halfway. She was in Zurich. She's lodged a complaint, and she's right to." No repeat of an earlier line.

### 16. D5C3-6 (game 2404, line 695): pass

HaX, "[I need to talk about Torres.]" then "[What ENTROPY did to him. Help me think it through.]": "You know his reasons now. I won't tell you what he deserves." / "Ask me what you want to ask." (journal read via the briefcase; screenshot `hax_reasons.png`).

### 17. D5C2-20, Torres without the deal (game 2396, line 819): pass

After "[I'm not a social worker, David.]": "No. Of course not." / "Then I've got nothing to say to you. I'll wait for them." Pulling the drive: "Elena will be dead before I get out." No repeated "How long will I get?" lines.

## Layout and interaction (not lighting)

Interaction walk in the re-dressed rooms, four full routes. No `stuck`, no `arrived-but-outside-plain-range`, no `did-not-cross`, no disambiguation menu, no page error in any of the five logs. Every `enter` between the ten rooms crossed on the first call. Objects used and all opened directly: Torres' briefcase (pick overlay then container), the Mug (dusting and lift), the vault reader and sign, the flag station, the incident log, the TalentStack envelope, upload schedule and manifest, the IT notice, the Server Hallway door (RFID), and each NPC chat. The only blemish is N3.

## New findings

| # | Sev. | Finding | Evidence | Suggested fix |
| --- | --- | --- | --- | --- |
| N1 | minor | A HaX phone chat parked on the "moral sounding board" choices before the confrontation resumes there after the fate and answers with pre-fight lines: "You don't have to, until you're in front of him. Call me again if it helps." (the other two answers, "Maybe it changes what's fair. It doesn't change the upload." and "Depends on what you do tonight.", read the same way). Reached by opening the phone, "[I need to talk about Torres.]", "[What ENTROPY did to him. Help me think it through.]", closing the phone with the three choices showing, then fighting or choosing the fate. | Game 2404, thread shown at log line 1033, screenshot `hax_stale_moral.png` (after public exposure, upload already dead). | Same guard the Recruiter uses (`m05_phone_recruiter.ink`, "never resume a pre-confrontation menu once the fate is set"): `{final_choice != "": -> support_hub}` at the head of `moral_sounding_board_choices` (`m05_phone_agent_0x99.ink` about line 776), or route the three answers through a fate check. Needs reopencheck afterwards. |
| N2 | note | After a page reload the player is placed at the lobby start (160,144), not where they were, and Restart after a KO does the same. Already seen in the round-1 and round-4 browser runs. | Games 2383 (after the reload) and 2397 (after Restart). | None for this stage. |
| N3 | note | The first `interact` on Owen from the corridor side reports `approached-then-interacted` with `no-effect-confirmed` at 32.1 px (his range is 32 px); a second `interact` from 21.5 px opens the chat. 4 of 4 games, the same three Owen visits each. Probably the harness approach stopping 0.1 px short, not a layout fault, but I could not rule out Owen's workstation making the closer approach awkward. | Game 2396 log lines 31 and 35 (first call, then the second from 21.5 px). | Check by walking up to Owen with real key input if it matters; a real player closes the last pixels. |
| N4 | note | Behind choice menus Patricia's bust is the player's own hooded portrait; her own bust shows on her first line only. Known as N-P in `PASS5_ALIGN_R4_BROWSER.md`, left for the character stage. | `damn_reopen.png` (Patricia), `halloran_postfate_choice.png` (Halloran's own bust shown correctly). | None for this stage. |
| N5 | note | Stance praise can follow cold picks: in game 2396 the player chose "[I'm not a social worker, David.]" and "[I did my job. The rest isn't my department.]" and HaX still closed with "You went looking for the man underneath. That mattered, whatever you decided in the end." (`confront_stance="sympathetic"`, set by the earlier "[They lied to you...]" pick). It reads as intended ("whatever you decided"), but it may feel off to a player who switched to cold at the end. | Game 2396 debrief close (`c_debrief.txt`). | Optional: weigh the last pick into the stance. Not needed to close the stage. |
| N6 | note | HaX's hub offers "[The Recruiter just called me.]" even after the player has already taken and ended her call (game 2383: deal refused). The condition is `recruiter_contacted_player and not recruiter_discussed` (`m05_phone_agent_0x99.ink:180`). Wording only. | Game 2383, hub choices read after the Recruiter chat had ended. | Optional label tweak ("About the Recruiter."). |

Not findings, for the record: the black chat backgrounds and flat lighting (POV backgrounds and lighting are later stages); the dark hooded portrait is N4; my own driver mistakes (journal read at the old desk position, mis-picked Torres menu in game 2389, JAB mode not toggled before the first fight in 2397).

## Driver note for the route scripts

The m05 browser helpers copied from the earlier runs read the journal at the desk. The journal is now inside the locked briefcase (`torres_briefcase`, pick overlay, then `mg take "Personal Journal"`). The pick needs `__test.minigame.completeLockpick` (assisted) unless someone plays it.
