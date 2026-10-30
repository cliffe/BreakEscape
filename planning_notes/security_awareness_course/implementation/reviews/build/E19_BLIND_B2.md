# E19 blind playtest B2 (second blind run)

Blind run, Sonnet 5.5 tester. Read only the playtest skill, AGENTS.md Housekeeping and what the screen shows. Headless, keyless server :3001, load average 7 to 12 during the run (timings from the harness are not representative; reading-pace times below are estimates).

Evidence: session logs and screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e19-b2/` (p1.jsonl and p1b.jsonl persona 1, p2.jsonl persona 2, p3.jsonl defend-only). Games 4973 (persona 1), 4976 (persona 2), 4979 (defend-only). Harness notes: `{"cmd":"pressKey"}` is refused while a minigame is open, so the title "Continue?" was cleared with a synthetic Enter keydown via eval (the screen says "press Space or Enter"); the choice radios were clicked by DOM click on the visible radio (harness `clickText` could not reach them). The first persona-1 session wedged on `bootstrap resume:"resume"` after the reload (known resume-overlay loop), so I killed it by PID and reopened the same game in a new session (log p1b).

Verifier output (tail of each run):

- 4973: played 519 s wall clock, 1 NPC met, globals `episode_e19_malware_and_updates_defend_done`, `..._defend_pass`; task `lock_the_doors` completed; "VERDICT: progress recorded - 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed."
- 4976: same verdict, task completed 20:50:05Z, score 100 (inbox round was 0%).
- 4979 (defend-only): same verdict, task completed 20:51:41Z.

## Persona 1: "Do your best" (full episode, game 4973)

| Step | What I saw | What I thought the goal was |
| --- | --- | --- |
| Start | Training room, Objectives panel "Sort the desk inbox", Anjali Rao, a kiosk. | Sort an inbox somewhere; talk to Anjali first. |
| Anjali | Two short lines: "work the desk like any Thursday; if anything makes you stop, tell me". One reply option "Thanks, Anjali." | Fine, go to the kiosk. |
| Kiosk, brief | Fictional-company/authorised-exercise framing, "only the inbox is scored", five stage tabs (Brief, Choices, Where it led, Defend, Debrief). | Clear: four warm-up choices, then the scored inbox. |
| Choices 1-4 | Restart prompt, enable-content document, security pop-up, spreadsheet on the desktop. Picked the sensible option each time. | Pick what I'd really do. |
| Where it led | Each choice with "Your call: the safe route" and what the unsafe version would have caused. | Learned consequences of each. |
| Defend intro | "If you didn't start it, don't open it, and tell me." | Now the real task: sort six messages. |
| Inbox, 3 of 6 done | Reloaded the page here. | |
| After reload | Title screen "Continue?", then (ignored per brief) the Mission Brief popup. Kiosk reopened at the Defend stage. Inbox restarted at "0 of 6 sorted". Choices and "where it led" were not repeated. | Lost the three sorted messages (about 2 minutes of work), kept the earlier stages. The Brief screen had said this would happen ("Closing or reloading before the end restarts this round"), so it was fair and warned. |
| Inbox 1-6 | TidyDocs: Report. Quayholt Apps: Trust. Leo: Report. Fernside: Report. IT Support: Report. Device management: Trust. Ticked the matching tells. 100 of 100 on all six. | |
| Result and Debrief | 100%, "Sharp: you caught the phish and knew why", four teaching cards, "The habit to keep". | Finished; clear. |
| End | Success overlay "Malware and updates episode done" with Return to missions / Close. | Done. |

Lost progress on reload: stage position kept, choices kept, inbox round lost (3 messages), as the screen warned.

## Persona 2: "Struggling player" (full, game 4976)

Rushed, no Anjali, first-looking option in the warm-up (Remind me tomorrow, Enable content, Allow, leave on desktop). Inbox: trusted TidyDocs, Quayholt Apps, Leo, Fernside, IT Support; deleted the device-management update; ticked nothing.

- "Where it led" was non-blaming and specific ("At a quarter to four, ransomware swept the floor, and the machines that had never restarted were the ones it locked"; "Quayholt Protect caught this one, but it doesn't catch every one"). It did not use "your fault" language. Good.
- Per-message feedback: "Not this time. This one was a phish. The right call was Report or Verify", with "Missed" tells and "What would have happened".
- Result 0%, "Worth practising: here's where to look first". It said "4 answers let an attacker straight in ... 15 points off the round each, on top of the item itself". The numbers explain the score; the tone is calm.
- Confirm with no flags ticked was accepted, and the result said "Next time, tick what looks off." Fair.
- The episode ended on the same success overlay as persona 1 and the verifier shows the task completed at score 100 even at 0% inbox. Whether completion without a pass is intended is a design call (see findings).

## Persona 1 on the defend-only episode (game 4979)

Make sense to someone who never saw the full episode: yes, mostly. Anjali's line and the kiosk intro explain the job. The inbox is the same six messages, so the real/phish split is the same, but the standing preamble ("A program, a file or an app that wants to run...") is enough to play without the warm-up. I used Verify on the first message, which was graded as right ("Checking first is a sound habit"), then 97% (I skipped the sender flag on Fernside). The result screen named a weakest skill and a next step.

## Didn't-know-what-to-do moments

| Where | Duration | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Reload, persona 1 | About 2 min of harness time, 0 from a player view | The harness wedged on the resume overlay (known bootstrap loop). A real player would just see Continue? and press Enter. | Restarted the session; harness issue, not content. |
| Title "Continue?" after reload | Seconds | Harness key press refused. | Synthetic Enter. Harness only. |
| Objectives panel vs task list | Noticed at start | The panel says "Sort the desk inbox", the harness task list says `lock_the_doors`. | Player-facing label is right; internal id is stale (nit, engine/content). |

No moment where a player would stay stuck for more than a few seconds. The kiosk is obvious and every screen has one primary button.

## Real decisions

| Decision | Arguable? | Given away by wording/colour? | Consequence later? |
| --- | --- | --- | --- |
| Restart now vs remind tomorrow | Obvious | Option 2 is longer and starts "Save your work", the safe option is plain from the wording. | Shown in "Where it led". |
| Enable content on the credit note | Obvious | "Leave it, and report it" is the first, worded option; the unsafe one is the bare action. | Shown. |
| Allow vs leave protection on | Obvious | "tell the service desk what it found" is the attractive, long phrase. | Shown. |
| Desktop vs team drive | Obvious | "Move it to the team drive" is the more specific. | Shown. |
| Every "Where it led" card for a safe pick is headed "Your call: the safe route" | n/a | Yes, it names the right answer on the picks. Confirms I was right; for a wrong pick it reads "Your call" with no label, which is a gentle asymmetry. | |
| Inbox 1 TidyDocs | Arguable on first read | Mildly: unknown app asks for mail and files. | Debrief card. |
| Inbox 2 Quayholt Apps | Arguable, good | The line "you started setting up... a moment ago" gives it away; a player who did not start anything has no way to know. | Debrief explains who started it is the tell. |
| Inbox 3 Leo | Arguable | The defend intro says "one is a colleague whose screen has just locked" and "If a screen has locked, get it to the security team straight away" (defend-only). | Debrief gives the 4444 extension. |
| Inbox 4 Fernside, 5 IT Support | Fairly obvious | Extra words in the sender domain plus the enable-content and "click Allow" asks. | Tells named after. |
| Inbox 6 Device management | Arguable | Same domain, but consistent with the update in the warm-up. | Debrief explains. |

## What I learned (own words)

A program, macro or app you connect runs with your access, so a file or app you did not start is worth stopping for. Do not click Allow on what security software blocked, and real IT never asks for that. Restart for updates the same day. If files lock and a payment is demanded, do not pay or fix it yourself: tell security, and unplug the network if asked but leave the machine on. Keep work on the team drive. A box appearing is not the tell; whether you or IT started it is.

## Five best lines

1. "The tell isn't that a box appeared; it's whether you, or IT, started it." (Quayholt Apps result)
2. "Reporting when you're unsure is always fine and never marked down." (brief and inbox intro)
3. "At a quarter to four, ransomware swept the floor, and the machines that had never restarted were the ones it locked." (Where it led)
4. "Leaving it shut and reporting it left nothing to clean up." (IT Security reply to Fernside)
5. "Both halves matter: catching a phish stops the attack, and trusting the real ones keeps work moving..." (Result)

## Five worst lines

1. "Right call is most of the score; naming the flags is the rest." (inbox intro; "flags" is jargon and clashes with the flags tick list)
2. "4 answers let an attacker straight in (trusting a phish email, or a colleague's locked screen going unreported)." The colleague's locked screen is not a phish email; reads as blame-adjacent and the "15 points ... on top of the item itself" arithmetic is hard to follow.
3. "You trusted this real one: 'Finish setting up Quayholt Files'." (0% result) Odd to praise on a 0% screen without saying that was the one right call.
4. "Phish stopped for the team: 0" counter while on the Leo message, which is not a phish but a report-this item.
5. "Your call: the safe route" on every safe pick: reads as a label, not a consequence.

## Scores (1-5)

| Area | Score | Note |
| --- | --- | --- |
| Fun | 3 | Short, tidy, but a form to fill in. The warm-up choices and the "Where it led" reveal are the best parts. |
| Pacing | 4 | Four choices, a reveal, six messages, a debrief. No dead time. |
| Clarity of goals | 5 | One button per screen, the brief and tab strip say what comes next. |
| Openness of decisions | 3 | Warm-up options and the "safe route" label make the answer clear; the inbox has real doubt on 2 of 6. |
| Teaching | 4 | Specific tells with the reason after each message; the update and ransomware lessons land. |

## Times (estimated at a real reading pace; the machine was loaded, so harness times are not used)

| Run | Estimate |
| --- | --- |
| Persona 1 full | About 13 min including the reload and replaying 3 messages (about 11 without). |
| Persona 2 full | About 6 min. |
| Defend-only | About 6 to 7 min. |

## Severity table

| # | Finding | Severity | Tag |
| --- | --- | --- | --- |
| 1 | Defend-only intro and host text say "one is a colleague whose screen has just locked" and "If a screen has locked, get it to the security team straight away", handing over Leo's message and its answer before the inbox opens. | minor | content |
| 2 | A 0% inbox round still completes the episode, sets `defend_pass` and shows "episode done" with a score of 100 on the task. Fine if completion is the intent; a pass flag at 0% reads oddly. | minor | content (design call) |
| 3 | Reload mid-inbox returns to the Defend stage with "0 of 6 sorted". Warned on the Brief screen, so fair, but a 6-message round lost on a reload is a cost. | minor | engine |
| 4 | "Phish stopped for the team" counter on the inbox header counts reports including Leo's ransom message, which is not a phish. | nit | content |
| 5 | "naming the flags is the rest": "flags" in the inbox intro clashes with the "Tick anything you noticed" list, and the word also means CTF flags in the rest of the product. | nit | content |
| 6 | "Your call: the safe route" label on right picks in Where it led (names the answer; absent on wrong picks). | nit | content |
| 7 | 0% result screen praises "You trusted this real one" without framing; the 15-point arithmetic is hard to read. | nit | content |
| 8 | Objectives panel says "Sort the desk inbox" but the task id is `lock_the_doors`, and the defend-only run's global is `..._defend_defend_done` (doubled). Only visible via the harness. | nit | content |
| 9 | After a reload the harness `bootstrap resume:"resume"` loops (known); `pressKey` refused on the title screen. | nit | engine (harness) |

Blockers 0, majors 0, minors 3, nits 6 (counting 4 to 9).

## Worth keeping from B1 fixes (observed only)

Per-message feedback and the senderTrust tell on messages 4 and 5 both fired correctly (sender address caught 2 of 2 on persona 1). The Leo message in the full episode is not given away by the host intro (only in defend-only, finding 1).
