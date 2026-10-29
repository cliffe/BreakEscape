# E19 Malware, ransomware and updates: blind playtest B1

Question answered: plumbing plus "can a player work this out" (blind run). Standalone, keyless server :3001, headless (machine load about 40, so timings below are estimated at a real reading pace, not measured).
Source of truth: what a player sees on screen. Nothing in scenarios/, planning_notes/ or JS was read. Where the harness could not drive a visible control (the choice radios in the kiosk), I clicked it through the DOM; one visible-control click, no hidden mechanics inspected. The kiosk's controls were only reachable that way for radios; checkboxes and buttons worked through the harness.

| Run | Game | Session log |
| --- | --- | --- |
| 1 Do your best, full | 4954 | tools/playtest/e19-blind-p1-session.jsonl (to reload), e19-blind-p1b-session.jsonl (after) |
| 2 Struggling, full | 4964 | tools/playtest/e19-blind-p2-session.jsonl |
| 3 Defend-only, persona 1 | 4967 (awareness_e19_malware_and_updates_defend) | tools/playtest/e19-blind-p3-session.jsonl |

verify-run.rb (all three): "VERDICT: progress recorded, 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed" (score 100 in all three, including the run that scored 0% in the round; see N-4). Run 1 globals: episode_e19_malware_and_updates_defend_done, episode_e19_malware_and_updates_defend_pass.

Earned-secrets table: no PINs, keys or flags in this episode. Nothing to earn.

## Timeline (what I thought the goal was)

Run 1, full:
1. Start in a training room. Anjali Rao greets me: "Work the desk the way you would on any Thursday. If anything makes you stop, tell me." Goal as I understood it: go and use the kiosk, call someone if something looks wrong.
2. Kiosk: Brief screen (fictional insurer, ordinary Thursday, four everyday calls, then "where each led", then the scored inbox). Clear. Goal: get through the stages in the left-hand list (Brief, Choices, Where it led, Defend, Debrief).
3. Choices, 4 unscored items (restart prompt, enable-content document, security pop-up, file to save). I picked the careful option each time.
4. "Where it led": four short paragraphs, each says "the version where you ..." and describes the other branch. Clear, no blame.
5. Defend: "If you didn't start it, don't open it, and tell me." Inbox of 6 messages, verdict (Trust/Report/Delete/Verify) then tick what you noticed.
6. Reloaded after 2 of 6 messages. Kiosk was waiting at the Defend stage; the round restarted from message 1 (the intro said it would). Re-did all six.
7. Results card 100%, then Debrief (what happened, four short lessons, habit to keep), then the "Episode done" screen.

Run 2, full: rushed, skipped Anjali, took the first-looking option in the choices, Trust on every inbox item, ticked nothing. Same flow, 0% round.

Run 3, defend-only: Anjali (told me a colleague's screen has locked), kiosk, brief, inbox, results, debrief, done screen.

## "Didn't know what to do" moments

| Where | Duration | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Choices stage, radios in the harness | about 3 min of harness fiddling (not a player problem) | clickText and clickControl did not reach the radios; clicks via DOM at first appeared not to enable "Next choice" (my earlier re-render had reset it) | A single DOM click on the visible radio, then Next choice enabled. A player with a mouse would not hit this. Harness only. |
| After reload, run 1 | about 1 min | Title screen needed Enter, then the Mission Brief notebook, then I had to walk back to the kiosk (player starts back at the room entrance) | Walking to the kiosk. Not a content issue. |
| Inbox, message order after verdict | seconds | "Next message" jumps to the next unanswered one, so the order is not always top to bottom | Read the list marks (Reported/Trusted). Fine. |

No stuck moments of more than a few seconds from the player's side. No hint or help was used.

## Decisions: arguable or given away?

Choices stage (unscored): each question has a plainly safe and a plainly unsafe option. The wording gives it away ("Allow so it stops" vs "Leave protection on and tell the service desk"; "Remind me tomorrow" vs "Save your work and restart now"). Position moves between questions (safe option second, first, second, first), which is good, but the wording does the work, not the player's judgement. It is a warm-up and says so, so this is only a note.

Inbox (scored):

| Message | Real answer | Given away? |
| --- | --- | --- |
| TidyDocs asks to read mail and files | Report | Moderately arguable: the second message (Quayholt Files) asks the same thing and is real. The difference is whether you started it, and message 2 says outright "you started setting up ... a moment ago". Good pair. |
| Quayholt Files finish setup | Trust (or Verify) | Arguable; the text carries the clue. |
| Leo: screen locked, ransom note | Report | Not a phish at all, a real colleague. Obvious from wording. In run 3 Anjali's intro says "one colleague's screen has locked", which gives it away before the inbox. |
| Fernside credit note, "click Enable content" | Report | Obvious to anyone who did the Choices stage 10 minutes earlier. |
| IT Support, "click Allow when Quayholt Protect warns you" | Report | Obvious for the same reason; also the sender domain quayholt-it-support.example is a lookalike (see M-1). |
| Device management, update installed, restart within a day | Trust | Obvious, but it is the only "boring" one, which is the lesson. |

Consequences did show up later: the "Where it led" stage and the debrief ("Missed:" with what would have happened) tie back to what I chose. The struggling run saw the exact outcome per item ("At a quarter to four, ransomware swept the floor...").

## What I learned (own words)

An app, a macro document or a "please allow" that I didn't start can act as me, so the test is "did I or IT start it", not "does it look official". A screen locked with a payment demand is reported straight away, not fixed, paid or switched off. Updates matter and should be restarted same day, but a web page offering an update is never genuine. Security software blocks are not mine to allow, even if IT's email says to.

## Five best lines

1. "The tell isn't that a box appeared; it's whether you, or IT, started it." (message 2 feedback)
2. "Reporting when you're unsure is always fine and never marked down." (inbox intro)
3. "I would rather you called me about nothing than not called about something." (Anjali)
4. "Genuine IT never asks you to allow or turn off what the security software blocked." (message 5 feedback)
5. "If the team asks, disconnect from the network and leave the device switched on." (ransomware lesson)

## Five worst lines

1. "Report: This is a phish. Send it to security." used for Leo's genuine ransom message and for a real incident. The button label does not fit.
2. Results card "Phish caught 4 of 4 / Reported rather than just deleted 4 of 4" counts Leo, a colleague, as a phish.
3. "Any of these can catch a careful person on a busy afternoon. The ones you were caught out by are shown below..." heading the debrief of a 100% round (both runs 1 and 3). Reads as pasted.
4. "You read every one of these the right way. Nothing to pick over here." directly under "The ones you were caught out by are shown below".
5. Debrief "The habit to keep": "When a message pressures you to move money, grant access, sign in or read back a code..." is a generic phishing line; "move money" and "read back a code" have nothing to do with this episode.

## Scores (1 to 5)

Fun 3. Pacing 4. Clarity of goals 4. Openness of decisions 3. Teaching 4.

## Times at a real reading pace (estimated)

Run 1 full: about 16 min (14 without the reload re-do). Run 2 full: about 8 min (rushed, as intended). Run 3 defend-only: about 8 min. Target 15 and 8: both on target.

## Reload test (run 1)

Reloaded after 2 of 6 inbox messages. Lost: those two answers (the round restarts, and the intro text says so). Kept: the stage list (Brief, Choices, Where it led all stayed "done", kiosk reopened on Defend), and the episode finished normally afterwards. No progress lost beyond the stated rule. Not reported: the Mission Brief reappearing and the resume overlay.

## Findings

| # | Severity | Tag | Finding |
| --- | --- | --- | --- |
| M-1 | major | content | Message 5 (IT Support) is from support@quayholt-it-support.example, a lookalike of the company domain quayholt.example. A careful player ticks "The sender's address doesn't match who it says it is" and is told "Not a flag here. It wasn't one of this message's tells." That is wrong on its face and teaches players to ignore a real tell. Same in message 4 (Fernside, accounts@fernside-invoices.example) where my sender flag was also called "Not a flag here". Either make the domains genuine-looking and consistent, or let the sender flag count where the domain really is off. |
| m-1 | minor | content | "Report" button reads "This is a phish. Send it to security." but Leo's message is a real colleague with a real incident. Counted as "Phish caught" on the results card. Suggest "Report" label "Send it to security" and results "Reported 4 of 4". |
| m-2 | minor | content | Debrief opening line ("The ones you were caught out by are shown below") and "Nothing to pick over here" contradict each other on a 100% round (runs 1 and 3). |
| m-3 | minor | content | Run 3: Anjali's intro tells the player "one colleague's screen has locked" before the inbox, so the Leo item is no decision. |
| m-4 | minor | content | "Habit to keep" is the generic phishing line (move money, read back a code), not this episode. |
| m-5 | minor | content | Verify on a real message with a ticked flag still shows "Not a flag here: There's no good reason I'd get this" followed by the explanation of why the message was fine. The explanation and the flag note run together in one paragraph. |
| n-1 | nit | content | Title screen says "Awareness E19: Malware, ransomware and updates (full episode)": internal naming on a player screen. |
| n-2 | nit | content | The Choices stage always puts the safe option behind clearly safer wording; fine as a warm-up. |
| n-3 | nit | engine | After reload the player is back at the room entrance and has to walk to the kiosk again. Expected, noting it. |
| n-4 | nit | engine | A 0% round still ends with the mission complete and score 100 in the game record (verify-run), and the "Episode done" screen says "you've ... sorted the desk inbox yourself, so this episode is finished". Probably intended for training; confirm. |
| n-5 | nit | engine | The harness cannot drive the kiosk's radio buttons through mg (only checkboxes and buttons); I used a DOM click on the visible radio. |

Counts: 0 blockers, 1 major, 5 minors, 5 nits.

Unclaimed: I could not see audio (keyless server, no TTS), and the debrief state text was truncated by the harness on run 2, so I did not read its last part.
