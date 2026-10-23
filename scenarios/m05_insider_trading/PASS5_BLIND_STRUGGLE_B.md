# m05 insider trading: pass 5 blind struggling-player playtest (run B)

Persona: struggling first-time player. Rushed, takes the quickest-looking option, skips side questions, guesses before reading, leans on HaX, picks the fight, walks away from the injured man. Declined the engine tutorial. Blind: read only AGENTS.md "Standing user rules" and "Verifying work", the M05 brief "Rules" and "Environment", and the playtest skill. Nothing under scenarios/m05_insider_trading/, no route driver, no SecGen XML or the four exploit guides.

- Game id: **2428** (mission 49), keyless server :3001, headless (machine load about 12), speed fast.
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m05-blind-struggle-b/session.jsonl` (2,749 lines, 2,748 commands). Flags XML: `tools/playtest/m05_insider_trading-flags-game2428.xml`.
- Wall clock 02:41 to 03:15 (about 34 min including the credits). Credits **reached**; `mission_complete` and `debrief_played` are set in the game record.
- Run type: blind, struggling persona. Mid-mission reload done at 02:55 (details below).
- Slip to declare: while looking for the task list I dumped the full `state` objectives once (02:49). It showed locked-aim task titles including "Interview ... Torres", "Get IT's spare card for the suspect's office" and "identify_torres". I did not use the name; I accused Halloran and Ben first on purpose, and reached Torres from the in-game door log. Treat the "who" deduction as slightly contaminated for timing, not for the clue-chain observations.

## Severity table

| # | Sev | Finding | Where |
|---|-----|---------|-------|
| 1 | major | The objective "Work Out Who Has Been in the Servers" ticks complete as soon as Owen hands over the server password (02:49), with no suspect identified. The open-task list then shows only VM tasks, and the next aim ("Find Out Why") is locked and invisible. Without calling HaX the player thinks "who" is solved and only the VM remains. | Objectives panel after `server_password_obtained` |
| 2 | major | A player who rushes the fight nearly dies. Torres chased me round the room while I punched; HP went 100 to 4 in about 10 s of mashing, and one more hit would have killed me. The only guidance is HaX's toast ("Keep pressing Q ... Can't take him? Step out of his reach, then call me and I'll send Security"). The dialogue option ("Drop the philosophy. Step away, or I make you.") gives no warning that it starts a fight. | data_center, 03:04 |
| 3 | minor | After the fight the cursor stays in fist mode. Clicking the drop-site terminal gave no feedback (`no-effect-confirmed`); it took two Q presses to get the open hand back. The toast that said so had been cleared long before. A "back to open hand" reminder after the KO would help. | server_room, 03:11 |
| 4 | minor | Owen's first answer to "The server room wants a password" is "Give me a reason I can write in the log", with the only reply "Fair enough. I'll be back." There is no way to find a reason from that point. About 2 min stuck; HaX "Where do I stand?" unstuck me (incident log, or ask Patricia). Works, but the dead end is visible. | open_office_area, 02:46 |
| 5 | minor | Patricia "Take it" (the incident log) is easy to miss. I left without it and had to return (1 min). It is also not clear that reading it counts as taking it; the log was later in the Notepad. | patricia_office, 02:44 |
| 6 | minor | Items arrive silently: the server password went straight into the Notepad ("Server room temp password ... quantum2024"); the vetting files for Torres and Halloran ended up in the inventory (verify-run lists them) although Patricia's line on the request was only "That's what vetting will let me give you." I never noticed the vetting files arrive, and did not read them. | Owen 02:48, Patricia 02:52 |
| 7 | minor | Cloning Owen's badge succeeds on the quickest-looking option, with no cost beyond a reaction line. `server_badge_obtained` is set at once, but the task "Get through the server-hallway reader" only completes when the door is used. Fine, but the "Better me than them" / "Sorry. Habit." beat has no later consequence I could see (debrief mentions "a colleague's badge" only). | open_office_area, 02:45 |
| 8 | minor | Fingerprint "Find" step is unreadable without ticking High contrast and pressing Hint (the sheen is not visible in the default render). The "Compare" step offers two candidate cards, so elimination wins without looking. Teaching value is low for a player who picks wrong first (Owen) and then Torres. | torres_office, 02:58 |
| 9 | minor | Mission Brief notes popup opens over the tutorial prompt after the briefing; the first `dismiss` for the tutorial failed because the brief was on top. A player has to close two layers. | reception_lobby, 02:43 |
| 10 | minor | The briefing conversation ends on "(Conversation ended - press ESC to close)"; Continue does nothing. A player may think it hung. | reception_lobby, 02:43 |
| 11 | minor (harness, not game) | `phone-chat` `mg getState.text` lags the DOM by one message (showed "Wher" mid-typing); `enter` into server_room from the hallway failed three times (`did-not-cross`) until a long manual walk; `moveToNear` on a station in another room drags the player to that x; pointer-drag minigames (dusting) are not drivable except by dispatching pointer events through `eval`. | harness |
| 12 | note | `nearby` listed `vm_launcher_bludit` while I stood in open_office_area, and `dr_halloran` while I stood in the break room. Probably stacked room coordinates in the harness scan, not a visible bug. Not confirmed on screen. | brief |

Counts: blocker 0, major 2, minor 9 (one is harness), note 1.

## Timeline

Times are wall clock, 2026-10-14. "Goal" is what I thought I was doing.

| Time | Event | Goal at that point |
|------|-------|--------------------|
| 02:41 | Game 2428 created, session up headless. | Start the mission. |
| 02:41-02:43 | Briefing. Took "Then we find out who sold", skipped damage and timing questions, asked for cover and kit, took "Fast and direct". Tutorial declined. | Find whoever is stealing the keys within four hours. |
| 02:43 | Read the Building Directory (8 cryptography names). | Eight suspects. |
| 02:44 | Patricia: "Skip the pleasantries", got Visitor Badge, chose "I'll find my own way". Left the incident log behind. | Get into restricted areas. |
| 02:44-02:45 | Server hallway reader refused the visitor badge ("No saved cards"). | Need a staff card. |
| 02:45 | Owen: chose the cloner option, read and saved his badge. | Got a badge. |
| 02:46 | Used it at the hallway door (flipper Saved, Emulate), got in. Read the IT notice. Guessed "password" at the server room door (wrong, 2 attempts left). | Need the server room password. |
| 02:46-02:47 | Asked Owen: "Give me a reason". Dead end (finding 4). | Stuck, first time. |
| 02:47 | Phone: HaX "Where do I stand?" gave the incident log. Went back to Patricia's office, read the log. | Find a reason. |
| 02:48 | Owen with the door-log question gave Halloran's spare on the hallway at 23:47. Password given. Unlocked server room. | Server room open. |
| 02:49 | Tried a made-up flag at the drop-site ("Invalid flag"). Requested the recon guide from HaX. Dumped objectives once (see slip). | VM next? |
| 02:50 | Halloran. Chose the blunt reply ("They made a choice."); she ended the conversation, returned friendly on the second approach. Asked about the spare: Zurich alibi. | Is she the insider? |
| 02:51 | Flyer, TalentStack leaflet ("R. CALLED AGAIN"), Lisa's chat: Torres crying, wife ill, $380k. | Torres looks bad, "R." might be Ruth. |
| 02:53 | Patricia accusation menu: Halloran (rejected, alibi), Ben (rejected, wrong hours), Torres with a weak reason (rejected), a false reason ("his own badge is on the hallway", rejected: "his badge never touches the hallway"), then the front-door-before-spare pattern (accepted). | I have a pattern. |
| 02:55 | Owen gave IT's spare card. **Reload** (location.reload, Enter on title). Came back in reception_lobby, inventory intact, Torres door still open. | Search Torres's office. |
| 02:56 | Torres's briefcase (lockpick, assisted `completeLockpick`): journal and medical bills. | Motive found. |
| 02:57-02:59 | Mug: dusted print (High contrast + Hint, wrong powder first, then black), lifted, picked Loop, Owen then Torres. | Print for the vault. |
| 03:00 | Vault reader accepted the lift. Upload schedule, manifest, TalentStack envelope, transfer log. | Means found. |
| 03:00-03:02 | HaX: "both halves of the case, give Patricia the name". Phone to Patricia: weak reason ("distracted") rejected; strong reasons accepted. | Report Torres. |
| 03:03 | Confronted Torres. Chose bluntly twice ("It's over", "You're no different"), then "Step away, or I make you". Fight. | Stop him. |
| 03:04-03:05 | Punched until KO. HP 4 of 100. Chose "Kill the upload and walk out." | Stop the upload, get out. |
| 03:06 | HaX: "the research server isn't finished: all four flags, then call me". "I'm done here" refused. | Need the VM. |
| 03:11-03:12 | Back in server_room (fist-mode confusion). All four flags submitted from the harness XML (flag 4 accepted with no prior ordering). | Flags done. |
| 03:12 | HaX call: Bring me in. | Go home. |
| 03:13-03:15 | Debrief, then credits. | End. |

## Confusion points

Each with time stuck and what unstuck me.

1. Server hallway reader, 02:44 (about 1 min). The visitor badge did nothing and the flipper showed "No saved cards". Unstuck: Owen's "(Lean over his log screen ...)" option; HaX's 02:43 message also named Owen's lanyard.
2. Owen's "reason for the log", 02:46 (about 2 min, finding 4). Unstuck by HaX "Where do I stand?".
3. The incident log, 02:47 (about 1 min round trip, finding 5).
4. After the password at 02:49 the objectives showed "Work out who" ticked and only VM tasks open (finding 1). Unstuck: HaX "Where do I stand?" ("Take it to Patricia, or ask her for the vetting files").
5. HaX said "You've got a pattern on that sheet." Which sheet? I had read three documents. The door-log is in the notes by then, but I did not recall picking it up; it was a good call for HaX to hint at it, but "that sheet" does not say which.
6. Patricia's reply to the vetting request was unclear (finding 6).
7. "R." on the leaflet: I first read it as Ruth. The envelope later (compliments slip signed "R.", "Last job, then you're clear") explains it as the Recruiter. That ambiguity is good, I fell for it for about 2 min.
8. Dusting "Find" step (finding 8): about 3 min to discover High contrast and Hint.
9. After the fight, the drop-site terminal would not open (finding 3): about 2 min.
10. Nothing in the game stopped me finishing the VM aim from outside the VM: flags are plain text boxes. That is the standalone harness, not a finding about the real game.

I was never stuck for 10 minutes. No debug helpers used for progress. Assisted: `completeLockpick` (dexterity), pointer events dispatched via `eval` for the dusting minigame, flag text from the XML.

## Decisions, and whether they showed later

| Decision | Felt arguable or obvious | Shown later |
|----------|-------------------------|-------------|
| Briefing: "Fast and direct" | Obvious, no weight at the time | Debrief: "You said fast and direct. Fast, and the file still holds." Good. |
| Halloran: "A reason doesn't make it right." | Arguable, harsher option | She ended the chat, then re-opened; no lasting cost seen. Debrief only mentions her Zurich recruiter. |
| Cloning Owen's badge | Obvious, quickest | Debrief: "Every locked door ... you opened on someone else's trust." |
| Wrong accusations (Halloran, Ben, weak reasons) | Arguable | Debrief "It took a couple of goes" and credits "FALSE START — a wrong name or reason before the right one". Fair, no penalty to score or lives. |
| "Drop the philosophy ... or I make you." | Obvious from wording once seen, but a fight is a surprise | Torres dead in debrief and credits. |
| "Kill the upload and walk out. Leave him bleeding." | Clearly the cold option, labelled | Debrief: Torres "hit his head on the rack", "The pathologist thinks twenty minutes would have been enough", "A man died in it", plus Elena, Sofia (11) and Miguel (8). Credits: "DEAD — left injured on the data-centre floor". Strong and fair; the consequence is both seen and explained. |
| Debrief reply "I'd do it the same way again." | Obvious | HaX: "I know. I read the report. The job got done. I'm still deciding about the rest." |

## What the debrief and credits reflected

Debrief: the 91 per cent upload stop; "fast and direct"; the number of attempts ("a couple of goes"); borrowed badge, password and thumbprint; the portal's weak login and over-privileged account; the training-file list (money, hours, approach, a boss); Torres's death and its cause; the family; the Architect and Task Force Null. It did not mention the fight itself beyond "a gap".

Credits (read from `#bv-cr-label` through a MutationObserver): MISSION COMPLETE — AT A COST; OPERATION SCHRÖDINGER: STOPPED; CIVILIAN LIVES SAVED: 30-45; THE CASE: MOTIVE, MEANS AND AUTHORISATION; BORROWED BADGE; FALSE START; DAVID TORRES: DEAD — left injured on the data-centre floor; ELENA TORRES: Widowed; SOFIA (11) AND MIGUEL (8): Father dead; THE RECRUITER: SHE NEVER MADE HER PITCH (I never rang her); QUANTUM DYNAMICS: WHO STOPPED THE INTERVIEW — never asked; STAFF: Nobody else on staff hurt; The Architect remains at large. The credits reflected the false starts, the walk-away and the unanswered Recruiter text. They did not reflect the fight or the fact that flags came from outside.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|--------|-----------|----------------|-------------|---------|
| Owen's staff badge | clone (item in flipper) | Owen's dialogue option, then flipper Read/Save | 02:45 | yes |
| Server room password | `quantum2024` | Owen, after the "23:47 unlogged" reason; auto-added to Notepad | 02:48 | yes (prerequisite: incident log from Patricia's desk) |
| IT spare office card | (item) | Owen, after Patricia's authorisation | 02:55 | yes |
| Torres's lift for the vault | lift quality 61 | Mug in Torres's office | 02:59 | yes |
| `qdc_research_server:flag_1..4` | `<flag:1>` to `<flag:4>` | none, VM not possible in standalone | 03:11 | **no: exercised, not earned**. The Bludit and recon guides were requested from HaX and are in the inventory, but no VM work happened; the debrief lines on the portal were therefore unearned by me. Everything downstream of the flags (the "Bring me in" call, debrief, credits) is proven reachable only given flags. |

## Scores (1 to 5)

| Area | Score | Note |
|------|-------|------|
| Fun | 4 | The accusation menu with graded feedback, the fingerprint chain and the confrontation are the best parts. |
| Pacing | 4 | About 30 minutes with no dead stretches; the wait to get past Owen and the post-fight state are the lulls. |
| Clarity of goals | 3 | HaX "Where do I stand?" is excellent and carried me three times, but the objectives panel misled at 02:49 (finding 1) and "that sheet" and the vetting-file exchange were vague. |
| Openness of decisions | 4 | Wrong accusations are tolerated and commented on; the fight and the walk-away are real choices. Few choices change the middle of the mission. |
| Teaching | 3 | Cloning, door-log reasoning and print lifting teach well. The Compare step is trivial with two candidates, and I learned nothing of the VM side blind. |

## Top findings

1. The "who" aim completes too early (02:49) and hides the next step.
2. The fight can take a button-masher to 4 HP; no warning in the choice text; the open-hand reminder after it is missing.
3. HaX "Where do I stand?" works well as a progress ladder (graded hints at 02:47, 02:49, 02:52, 03:00).
4. The wrong-accusation feedback from Patricia (alibi, hours, "never touches the hallway") teaches the deduction and costs nothing.
5. The debrief and credits clearly reflect the walk-away and false starts.

## Five best and five worst lines

Best:
- Patricia: "Read it again. His badge never touches the server hallway. Hers does."
- Patricia: "I sign that log off every Monday. I never once read the front door."
- Owen: "It's been on my monitor for a year. Take it, and please don't put that in your report."
- Torres: "Is thirty to forty-five families. Like mine."
- HaX debrief: "The pathologist thinks twenty minutes would have been enough."

Worst:
- Patricia: "That's what vetting will let me give you." (does not say what happens next)
- HaX: "You've got a pattern on that sheet." (which sheet?)
- Owen's "Give me a reason I can write in the log" with no available reason on the first visit.
- The briefing ending on "(Conversation ended - press ESC to close)".
- "Unlogged." in the choice "Patricia's log has a crypto badge in the server hallway at 23:47. Unlogged." (reads as a fragment).

## Verifier output (game 2428)

```
game            2428  (mission 49)
created         2026-10-14 01:41:21 UTC
last write      2026-10-14 02:15:16 UTC
played for      2035s of wall clock
current room    "reception_lobby"
unlocked rooms  10: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, research_lab, break_room, torres_office, data_center
unlocked objs   2: torres_briefcase, data_center_pc_0
inventory       24 items (includes both vetting aftercare files, journal, medical bills, upload schedule, manifest, envelope, two field guides)
NPCs met        12 (opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, dr_halloran, lisa_park, david_torres)
flags submitted 4: flag{m05_insider_trading_qdc_research_server_1_5f0fb9}, ..._2_8d1e89, ..._3_f4350a, ..._4_ffe123
globals set     59 (includes torres_ko, torres_hostile, final_choice, confront_stance, debrief_played, mission_complete, case_exfil, case_motive)
VERDICT: progress recorded — 9 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

Session stopped (`session-stop.sh 2428`, 2,748 commands, 7 flag-token uses logged). The keyless :3001 server was already running and was left alone. No other files touched, nothing committed.
