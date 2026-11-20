# m05 "Insider Trading", pass 5, struggling-player run A

Run type: struggling first-time player, playtest stage. Questions answered: (2) unexpected behaviour (wrong suspects, a lost fight, KO and Restart, a mid-mission reload) and (1) plumbing on the route I took. Not a solvability pass (see the earned-secrets table).

- Game id 2411, keyless server :3001, headless (load average was 12.5, so headless was chosen on the skill's rule). Speed `fast`.
- Session log: `tools/playtest/m05-pass5-struggA-session.jsonl` (2789 lines, 2793 commands). Flags XML: `tools/playtest/m05_insider_trading-flags-game2411.xml`.
- Wall clock 1433 s (about 24 minutes) to the last debrief line; about 1515 s with the credits. Credits reached and read to the last line.
- I read only the brief, the skill and the m06 report. No scenario file, ink, design doc or guide.
- Session stopped (`session-stop.sh 2411`).

Not plain player actions (all marked in the text):

- **converse**: used for Patricia, Owen, Halloran and Lisa on first meeting. It takes every branch, so it asked Halloran about her spare badge and Owen about the lanyard for me. A struggler would not have been that thorough. I redid the choices that mattered by hand.
- **Lockpicking** (Patricia's filing cabinet, Torres' briefcase): `completeLockpick` (PASS, assisted). I did not try the pick minigame.
- **Dusting**: I used the debug `printCentre` to find the print after one miss. Everything after that (powder, dusting, lift, wrong whorl, wrong suspect Owen, right match) was played by buttons and drags.
- **DOM clicks**: inventory icons (phone, notepad; the harness has no command), the RFID flipper menu items, the Restart button (via `dismiss`).
- **Flags**: supplied by the harness, **exercised, not earned**.
- No `debugKO`. I won the Torres fight by hand on the third try.

## verify-run.rb output (full)

```
game            2411  (mission 49)
created         2026-10-13 23:50:27 UTC
last write      2026-10-14 00:14:20 UTC
played for      1433s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, patricia_office, main_corridor, open_office_area, research_lab, break_room, server_hallway, server_room, torres_office, data_center
unlocked objs   3: patricia_filing_cabinet, torres_briefcase, data_center_pc_0
inventory       25: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Building Directory, Visitor Badge, Security Incident Log, Noticeboard Flyer, Server Hallway Badge Log, Conference Lanyard, TalentStack Leaflet, IT Notice: Server Room Access, Vetting Aftercare File: D. Torres, Vetting Aftercare File: R. Halloran, Printed Email from the CEO's Office, Server Password Sticky Note, SAFETYNET Field Guide: Reconnaissance and Network Mapping, SAFETYNET Field Guide: Bludit CMS Exploitation, IT Spare Office Card, Personal Journal, Medical Bills, Upload Schedule, Data Package Manifest, Sealed TalentStack Envelope
NPCs met        12: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, lisa_park, david_torres
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_f13694}, ..._2_0eab8b}, ..._3_d7566b}, ..._4_7b008b}
globals set     58: (includes debrief_played, mission_complete, final_choice, torres_fight_offered, torres_ko, confront_stance, player_approach, confrontation_advice_given, case_motive, case_exfil, found_*, flag1..4_submitted)

VERDICT: progress recorded — 9 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

(Globals list shortened here; the full list is in the verify output.) `debrief_played` and `mission_complete` are set, so conclusion is recorded. The credits were read through a `#bv-cr-label` poller.

## Earned-secrets table

| Secret | Value used | In-game source | Earned? |
| --- | --- | --- | --- |
| Visitor badge | item | Patricia | yes |
| Server hallway reader | cloned Owen's staff badge (EM4100 28CC48EF47) | HaX text ("Owen's lanyard is the nearest") then RFID cloner in a talk with Owen | yes |
| Server room password | `quantum2024` | Owen, after "Security's signed it off" (needs Patricia's sign-off first); lands as a sticky note item | yes. Three guesses first (`password`, `temporary`, `heisenberg`) were wrong |
| Torres' office | IT Spare Office Card | Owen ("Fine. That's IT's spare") | yes |
| Torres' thumbprint | lift from the mug | fingerprint kit, mug in his office | yes (print location assisted, see above) |
| Key vault reader | present the lift | the lift itself | yes |
| Filing cabinet, briefcase | lock picks | picks | **assisted** (`completeLockpick`) |
| Flags 1 to 4 | tokens | VM | **no, flag supplied. Exercised, not earned.** The VM itself was never launched (standalone). Guides were taken from HaX (recon, Bludit) |
| Torres' name | David Torres | door log, vetting file, leaflet, Lisa's gossip | yes, but see D3: the game narrows it for you |

Rows marked "no" are the edge of what this run proves. Everything between flag 1 and the vault is played, but flag 3 opened the "Find Out Why" objectives and the Torres route in this build, so the back half was reached on supplied flags.

## Timeline (what I thought the goal was)

Times are wall clock from the start.

- 0:00 Briefing by hand. Took "Bought with what?", "How much time?", "Understood", "And the third?", "What's my cover?", "Who else?", "I'm ready", then **Fast and direct** (a rusher's pick), "Any last advice?". Goal in my head: meet Patricia Morgan, find a bad employee out of eight.
- 3:00 Declined the tutorial ("NO, I'LL FIGURE IT OUT"). Read the building directory. 8 crypto staff named. Goal: Patricia.
- 3:40 Patricia: got the visitor badge, the incident log (her pencilled note: "Owen keeps the reader logs. Ask him whose badge.").
- 4:00 Corridor flyer (Lisa's collection tin). Owen: the harness took many branches. Owen named "Halloran's spare" as the 23:47 badge. Lean-over option cloned his lanyard. Goal: **Halloran is the insider** (my wrong first theory).
- 5:00 Research lab: lab rules notice (visitor spare #4471, "signed out through me"), Zürich lanyard, Halloran. Break room: TalentStack leaflet, Lisa's gossip about Torres. Goal: still Halloran vs Torres, confused.
- 7:00 Server hallway: Owen's cloned badge worked. Server room door asked for a password. Three wrong guesses (`password`, `temporary`, `heisenberg`). Locked out at 3/3. Closing and reopening reset it, no cost.
- 8:00 Owen: "After-hours server access gets logged with IT." Picked "Fair enough. I'll be back." (no reason in hand). Opened the phone: HaX had 7 unread texts. "Where do I stand?" told me to take the pattern to Patricia and ask for the vetting files. Goal: get Patricia's sign-off.
- 8:30 Patricia: "I need your help" then the server room, then the vetting files (the files just appear in the notepad). **Accused Ben Ashworth** (wrong): "Thursday at eight? The transfers run two till four, and he logged it with Owen. Try again." **Accused Halloran** (wrong): "Halloran was in Zurich the night that badge first went in. You've seen that. Try again." No penalty. Picked the filing cabinet lock (assisted): CEO stand-down email.
- 9:30 Owen again: "Security's signed it off" gave `quantum2024`, plus a talk about the thumb-reader vault ("Two thumbs enrolled, Ruth Halloran's and David's").
- 10:00 Server room. VM terminal: "launch your VM" (not possible standalone). Drop-site terminal. **Mid-mission page reload** here (see M1). The player was put back in reception, doors and items had persisted.
- 12:00 HaX phone: asked for the network and Bludit guides. Submitted flags 1 to 4 (harness). The objectives panel then showed "Find Out Why" and "Get IT's spare card for his office". Goal: Torres' office.
- 14:00 Owen gave the spare card. Torres' office: mug (read "Use normally" first, then dusted), briefcase (journal, bills).
- 14:30 Vault reader accepted Torres' lift. Data centre: upload schedule, manifest, TalentStack envelope, transfer log.
- 15:15 Back to Patricia: "I think I know who it is", "David Torres." The case was assembled for me ("Slowly. I'm writing this down. Money... his own journal... the staging manifest... TalentStack"). Patricia said where he was.
- 17:00 Data centre. Torres confrontation. Picked "You're no different from ENTROPY's other true believers", then **"Drop the philosophy. Step away, or I make you."** He attacked.
- 17:00 to 22:00 **The fight** (stuck moment 1). KO at 18:00, Restart (reception), walk back, KO at about 20:00, Restart, walk back, win at about 22:00 using a loop that closed the distance and faced him.
- 22:15 Aftermath choice: "Kill the upload and walk out. Leave him bleeding on the floor." (the callous one).
- 22:30 HaX: "Where do I stand?", "I'm done here. Bring me in." (it warned: "whatever you haven't read could walk"), debrief, credits.

## Stuck moments

1. **The Torres fight, about 5 minutes, two KOs and two Restarts.** Where: data centre, after "Drop the philosophy. Step away, or I make you." What I tried: pressing `e` and Space while he hit me (HP 100 to 0 in under a minute; nothing I did showed any hit). I had declined the tutorial, so nothing told me the game was in "interact" mode (punches do nothing in it) and that `Q` (or the HUD hand) switches to jab. I found `Q` by checking the combat object, which a first-time player could stumble into but not deduce. Third attempt: `Q`, then closing in and facing him; KO at 50 HP left. Unstuck by knowledge of the key, not by in-game information. Not stuck for 10 minutes, so no help beyond the key (marked). Restart returns to reception, five rooms away, with Torres still hostile and the choice not offered again. HaX had an "I'm going in. Soft or hard?" option in the phone that I only saw after the first KO; asking "Which do you recommend?" got "I'm not going to answer that."
2. **Server room password, about 2 minutes.** Three wrong guesses. The IT notice says "contact O. Gallagher" and Owen asks for a reason; HaX's phone text said what to do. Fair.
3. **Not knowing who the insider was**, about 3 minutes. Owen's door log named "Halloran's spare" and I took it at face value, as a struggler would. The Zürich lanyard in her lab was the way out. Fair, and I would have missed it had I not wandered in.

## Real decisions

| Decision | Arguable or obvious | Consequence later |
| --- | --- | --- |
| "Fast and direct" in the briefing | Arguable | Debrief: "You said fast and direct. Fast, and the file still holds." Credits do not mention it. |
| Accusing Ben, then Halloran, at Patricia | Looks arguable, is free | None. Patricia rebuts in one line and the menu comes back. Debrief and credits do not mention either (see D3). |
| "You're no different from ENTROPY's other true believers" | Arguable | Torres' speech continues with no change I could see. |
| "Drop the philosophy. Step away, or I make you." | Arguable | A fight. Unwinnable without the combat mode. After the KO: "Torres went down hard against the rack." |
| "Kill the upload and walk out. Leave him bleeding on the floor." | Obvious in tone, the harsh one is placed second | Strong and fair. Debrief: "David Torres is dead. He hit his head on the rack when he went down. You killed the upload and walked out... The pathologist thinks twenty minutes would have been enough." Credits: "DEAD — left injured on the data-centre floor", Elena widowed, children without a father. Sharp cause and effect. |
| Not asking HaX to repeat advice before the confrontation | Obvious | HaX's "Soft or hard?" option exists but needs me to ask. |

## What the debrief and credits reflected of my choices

Reflected: the "fast and direct" approach; the 97% stop of the upload (I stopped it at 97); Halloran's spare in the door log; borrowed trust (colleague's badge, password, thumbprint); the stand-down email going to the Home Office; the dispatch of Torres' death and its consequences, down to Elena, Sofia (11) and Miguel (8); the TalentStack list; "The Architect remains at large". The recruiter's text going unanswered.

Not reflected: my two wrong accusations; two KOs and Restarts; the cloned-badge approach beyond the general line; the fight itself (HaX says "He hit his head on the rack when he went down", which is correct but never mentions I chose to fight). The debrief does not say anything about the VM flags beyond the generic hole in the research portal ("Old software with a known flaw nobody had patched, and an admin login sitting in a handover note"; "one account was allowed to run far more than its job needed"). HaX reacts to each flag in the phone as it comes in (login flag, foothold, manifest, root) so the flags are woven in. The CTF guides arrive when asked for; nothing forces taking them.

## What I learned (in my own words)

- Insiders use other people's badges, passwords and prints, so the log looks like an insider and nobody notices.
- A door-log entry for a spare badge says whose badge it was, not who carried it. Check alibis (Zürich) and timings.
- The research box was breached through old software, a leaked admin login and one over-privileged account.
- A person in debt and a desperate family is exactly who a recruiter looks for.
- If you hurt someone and leave, they can die. The twenty minutes mattered.

## Five best lines

1. Patricia: "Angry, skint and distracted aren't evidence. I've been wrong about people before."
2. Owen: "It's on my monitor. It's been on my monitor for a year. Take it, and please don't put that in your report."
3. HaX (debrief): "Every locked door in that building, you opened on someone else's trust."
4. HaX: "The pathologist thinks twenty minutes would have been enough."
5. Torres: "Three months ago I was trying to save my wife. Now I'm sixteen minutes from getting people killed."

## Five worst lines

1. Credits: "Nobody on staff hurt" straight after "DAVID TORRES — DEAD" (contradiction).
2. HaX: "I'm not going to answer that. You've seen what he's carrying. It's your call." at the one point I wanted advice about the fight.
3. Patricia: "Thursday at eight? The transfers run two till four, and he logged it with Owen." (cites a fact I never saw about Ben).
4. Patricia: "Quickly, now. The CEO's prowling." (a hub-return line that repeats on every return with nothing prowling).
5. Narrator: "The cloner didn't get a clean read." (this was the harness closing the cloner; the real player sees a different thing. Ignore as a game finding.)

## Scores (1 to 5)

| | Score | Note |
| --- | --- | --- |
| Fun | 4 | The documents, the thumbprint and the aftermath choice are good. The fight is the weak spot. |
| Pacing | 4 | Even for 24 minutes. A long walk (five rooms) after each Restart. No clock pressure at all in play. |
| Clarity of goals | 3 | The panel is clear, almost too clear (D2). The fight and its controls were unclear. |
| Openness of decisions | 4 | Both final choices land hard; the early accusations land nowhere. |
| Teaching | 3 | The fingerprint minigame and the "borrowed trust" line teach well. Combat mode and jab/interact is untaught for a tutorial decliner. |

## Severity table

I classify only what I observed. Nothing here is called a game bug; items marked "suspect" are for a human ruling.

| # | Severity | Finding | Repro |
| --- | --- | --- | --- |
| D1 | major | Torres fight: a first-time player who declined the tutorial is not told that the default mode is "interact" (punches do nothing) or that `Q` / the HUD switches to jab. `e` and Space did nothing for me while he took me from 100 to 0 HP in under a minute; nothing showed my hits. Restart returned me to reception (five rooms from the data centre), Torres stayed hostile, and the dialogue choice was not offered again. HaX's "Soft or hard?" option only helps if the player thinks to ask before choosing; "Which do you recommend?" gets a refusal. I won on the third try only by knowing the key. | Game 2411. Option 3 ("Drop the philosophy. Step away, or I make you."). Log: first KO around the `pressKey e` run after the "KNOCKED OUT" overlay; second KO later; the third attempt used `pressKey q` |
| D2 | major (suspect) | The objectives panel hands the answer over before the player has named anyone: after flag 3, "Find Out Why" shows "Get IT's spare card for his office*" and "Get into his office*", and the dialogue option at Owen reads "I need into David Torres' office." Earlier ticks ("Find out who on the team is under pressure", "Work out who has been recruiting in the building") fill in as I read documents. Also "Decide What Happens to Him": the suspect is a man with an office before I accused anyone. | Game 2411, panel after flag 3 |
| D3 | major (suspect) | Accusation costs nothing and tests nothing: Patricia's menu offers only Halloran, Ben, Torres or "a feeling"; wrong picks get a one-line rebuttal and the menu returns with no consequence in the debrief or credits. Picking Torres assembles "the why and the proof" (money, journal, manifest, TalentStack) from globals, so the player is never asked to cite anything. Patricia's "bring me the why and the proof. Both." is then done for you. | Game 2411, Patricia, "I think I know who it is" (three times) |
| M1 | minor | Reload and Restart both place the player in `reception_lobby`. After my planned mid-mission reload (in the server room) I had to walk back through three rooms; after each KO, five. State persisted (doors, items, tasks). | Game 2411, after `location.reload()` and after Restart |
| M2 | minor | Credits: "DAVID TORRES — DEAD" followed by "Nobody on staff hurt" in the QUANTUM DYNAMICS STAFF block. | Game 2411, credits label poll |
| M3 | minor | Patricia's rebuttal of Ben cites a Thursday-at-eight log entry I never saw (I did see "Thu 24 Sep 20:05 B. ASHWORTH" on the door log, only if I had read it). A player who accuses before reading it gets facts out of nowhere. | Game 2411, Patricia accusation |
| M4 | minor | The dusting compare screen keeps the old message "Not a whorl..." when the loop is correctly picked and the candidate list appears. Cosmetic but misleading. | Dusting minigame, mug |
| M5 | minor | Pressing interact on a hostile Torres in interact mode opens nothing and he hits you. No feedback of any kind. | Game 2411 |
| M6 | minor | There is no clock in play. The briefing says four hours and Torres says "Sixteen minutes to the window", but nothing moves while a struggler wanders for twenty minutes; the transfer bar only changes in narration. HaX's phone times (11:50 to 1:12) do not match "half past four". | Phone thread, briefing |
| M7 | minor | HaX's refusal "I'm not going to answer that" when asked "Which do you recommend?" about soft or hard. It reads as the game withholding the help the struggler asked for. | Phone, after first KO |

Counts: 0 blockers, 3 majors, 7 minors.

## Top three issues

1. D1: the Torres fight. A struggler who chose the hard line has no in-game route to the combat controls, and a Restart costs five rooms.
2. D2/D3: the deduction is nearly done for the player by the objectives panel and Patricia's auto-assembled case; wrong guesses cost nothing.
3. M2: credits contradict themselves on Torres.

## Notes for the fixer, outside the severity table

- What worked and should not be touched: the door log (each name and time), the Zürich lanyard as an alibi, the vetting files, Owen's "on my authority", the fingerprint minigame, the two aftermath choices and the debrief/credits that follow.
- Flags submitted in any order were accepted with no VM; HaX reacted to each. Flag 3 opened the Torres objectives. I did not test whether a player who skips the VM can proceed (the harness supplied the flags).
- Harness only (not game faults): `converse` closes the RFID minigame and takes every branch; `completeLockpick` and the dusting `printCentre` stood in for dexterity; `mg close` on the phone sometimes needed a second call.
- Needs checking against SecGen by the user: nothing; I read no VM content.
