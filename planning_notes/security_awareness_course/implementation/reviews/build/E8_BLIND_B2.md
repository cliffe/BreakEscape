# E8 "After the click": blind playtest B2 (second blind run)

Type: blind run, fresh tester, no prior reports read. Keyless server :3001, headless (load average about 3, so timings are fair, but see the note on times).
Episode: `awareness_e8_after_the_click` (full, twice) and `awareness_e8_after_the_click_defend` (once).

Session logs (kept outside the repo, scratchpad `aw2/blind-e8-b2/`):
- Persona 1, full, game 5122: `p1-session.jsonl`
- Persona 2, full, game 5130: `p2-session.jsonl`
- Defend-only, game 5139: `p3-session.jsonl`
- Screenshots `p1-01.png` to `p1-10.png`, `p2-01.png` to `p2-03.png` in the same folder.

Verifier (`verify-run.rb`), summarised per game. All three print `VERDICT: progress recorded`.
- 5122: tasks `send_takeover_phish` and `sort_the_signs` completed, score 100, 0 flags, 1 NPC met.
- 5130: same two tasks completed, score 100 (the verifier's episode score, not the on-screen round score of 0%).
- 5139: `sort_the_signs` completed, score 100.

Harness notes (rule compliance). Nothing under `scenarios/`, `planning_notes/`, bridge files, game JS, other reports or game globals was opened. Two things I did through the DOM, both on visible controls: clicking the "Resume" button on the Resume-session overlay after the reload, and clicking the visible "Stuck? Show me where to look" links (the harness does not list them as controls). The harness's `mg getState` output includes an `episode` object with stage fields; I did not use it to decide anything. Source of steps: none, this was blind.

## What I thought the game was

A kiosk in an insurance training room. Anjali, a trainer, says "everyone clicks something eventually, so today is about the ten minutes after". You write one phishing email as the red team, then sit in the victim's chair and sort the mess that follows. Only the second half is scored.

## Persona 1: "Do your best" (full episode, game 5122)

Timeline (harness clock, 23:49 to 23:54; a real reader would take about 13 to 15 minutes, see Times).

| Step | What I did | What I thought the goal was |
|---|---|---|
| Opening | Spawned in a training room with two open objectives: "Send the takeover email" and "Sort the signs that follow". Talked to Anjali (one reply, "Thanks, Anjali."). | Go to the kiosk. Anjali says write the email first, then take "the other seat". |
| Brief | Kiosk opened an episode runner with a six-step bar (Brief, Research, Write, The click, Defend, Debrief). Brief says I am on an authorised exercise at Quayholt, a fictional firm. | Learn about one colleague, write one email dressed as IT. |
| Research | Opened the browser. Three tabs: company site (Our people, Signing in, Company news), a social site (Friendface). Clicked facts to add them to notes: Ayaan's role and address, the service-desk address, the single sign-on migration, his "flat out clearing the backlog" post. | Collect a believable reason and a sender. |
| Write | Mail client, Compose. To Ayaan; From name and address chosen from found facts; pretext "we are moving single sign-on to a new provider this month, so you may be asked to sign in again"; ask "no rush". Red-flag meter fell from 1 to 0 as I chose. Sent. | Make the email as hard to spot as possible (the meter is the score). |
| The click | Shown my email "as Ayaan met it", then a Sent-folder message Ayaan did not write, and an "Are you trying to sign in?" prompt from outside the UK. | Now I am the victim. |
| Defend | Opened the inbox, started a six-message round. Report on the forged settlement email, Report on the password-changed notice, Deny and report on the sign-in prompt, Trust on Reuben's "wrong client" email, Report on the ransom page, Trust on the planned-maintenance notice. | Work out which are takeover signs and which are ordinary. |
| Debrief | 100%, "Sharp". Five-questions-a-report box, recovery steps, "habit to keep", "How to report here". Finish gives a success screen. | Done. |

Reload test (mid-main-task). After the email was sent and one inbox message had been shown, I reloaded. I had to click Resume and press through the title screen. The email stage stayed done ("send_takeover_phish" kept), and the kiosk reopened at the Defend stage. The sorting round restarted from message 1, which the brief had warned ("Closing or reloading before the end restarts this round from the first message"). Lost: only the 1 to 2 messages I had sorted. Lost nothing else. Fair and as announced.

### "Didn't know what to do" moments (persona 1)

None longer than a few seconds. Details:
- First 20 seconds: after Anjali's line, nothing on screen says the kiosk is the object to click; I found it from her words and the white kiosk sprite. Anjali's closing line "take the other seat" turned out to mean "press Continue", not walk to the second desk (there is a second desk with a PC at bottom right of the room that does nothing). Brief confusion, about 10 seconds. Unstuck by clicking Open the inbox on the same kiosk. Finding: minor, content.
- The three "which sign-on system" picker options appear only once evidence is noted; I found them quickly because the blank says "choose".
- Nothing else.

### Decisions (persona 1)

| Decision | Answer given away? |
|---|---|
| Which facts to note | No. Mild nudge: the news item and the service-desk address stand out as the useful ones, because the pretext blanks are phrased around them. Fair. |
| Sender name and address (only one choice for each) | Not a decision. Both pickers contain exactly one option once found; only one address could be chosen. Feels like a menu with the answer pre-filtered. |
| Pretext and ask | Strongly steered by the live "Red flags" meter ("Fewer flags means harder to spot"). The calm pretext plus "no rush" gives 0 flags. The meter tells you the answer; it is a teaching device, but it removes the decision. |
| Report / Trust / Delete / Verify on the six items | Mostly arguable. The settlement email and the ransom page were clear. Reuben's email and the maintenance notice were the genuinely arguable ones (see below). The scoring text says Trust, Verify or Report all score full on the real ones, which is reassuring. |
| Tick-box flags | The same eleven checkboxes appear on every email message, so no colour or wording gives the answer. Good. The sign-in prompt has a different, shorter list (five), which gives a mild hint that it is a different sort of item. |

## Persona 2: struggling player (full, game 5130)

Rushed, skipped Anjali, took the quickest-looking option, trusted what looked official, ticked "Nothing looks wrong" everywhere.

Timeline: 23:55 to 23:57. Estimated reading-pace time for a rushed player about 7 to 9 minutes.

- Tried to skip research: opened and closed the browser at once, then Compose. The To field read "Nobody to write to yet — find who to send it to first." I had to go back to research and open one profile. Fine and clear.
- The From blanks showed "no evidence yet" with "Stuck? Show me where to look". I clicked the hint (via the DOM, see above). It said "Open the research browser; the 'Signing in' page says who Quayholt's IT notices come from." Clear, kind, tells you where to look but not the value.
- I chose the urgent pretext ("your session has ended... sign in today") and the "before the end of the day" ask, and the blank "the staff portal". The meter went from 1 to 2 flags and explained "This pushes him to sign in quickly, before he stops to check that the service desk never asks this by email." Sent.
- The click step then said only: "Nothing to replay this time. The defence is the same either way: next, you're the one whose account is being used." No explanation of why my email had not landed, no "your email was flagged", and no sign of the Sent-folder or sign-in-prompt preview that persona 1 got. See finding 1.
- Sorted: Trust the forged settlement email, Trust the password-changed notice, Approve the sign-in prompt, Delete Reuben's email, Delete the ransom page, Trust the maintenance notice. Each time ticked "Nothing looks wrong".

Debrief fairness. Good:
- Each card says what the right call was, what the sign was, and what would have happened ("If you leave it, the client pays a criminal's account").
- The end text says "These messages are built to fool careful people, so a miss here says more about the attack than about you. The points only show where to look next time." No blame.
- Teaching text is the same as for persona 1, the same five-questions box.
Rough:
- The round score showed "Score 0 percent. Worth practising" after three items scored 100, 70 and 30 out of 100 (the 100 was the maintenance notice). 0% is harsh next to those numbers, and the page says "3 answers let a problem go unreported... costs 15 points off the round each", which explains it only if you read to the bottom. A rushed reader sees "0%" and a stack of non-zero item scores.
- After Confirm with nothing ticked, the card says "Tick what made you decide, or choose Nothing looks wrong. Then press Confirm again." even though I had ticked "Nothing looks wrong" (on the first, yes; on the Approve and the later ones I ticked nothing). The text stays after a Next-message button is already offered, so it is unclear whether I must confirm again. I did not, and the game moved on.
- Debrief item for Reuben: "You chose Delete... The right call was Trust or Verify" then the explanation says "reporting it yourself also scores full". The two statements disagree about whether Report was acceptable.
- The final screen header says "You didn't tick anything you noticed, so there's nothing to grade skill by skill." That was true here (ticked "Nothing looks wrong") but reads as scolding for a player who did tick the "Nothing looks wrong" box. Minor.
- The end card says "You've sat in both seats: the red team's, writing the email, then the colleague's". That is accurate for both personas (even though persona 2's email did not land).

## Defend-only (persona 1, game 5139)

23:58 to 23:59 on the harness clock; real reading estimate about 5 to 6 minutes.

Understandable to someone who never saw the full episode? Yes, mostly. Anjali says "He clicked a convincing email, so someone else is in his account. Some signs are real, some ordinary. Report anything odd." The brief text states the same. Same six messages, same order, same feedback. I used Verify on Reuben and Report on maintenance to exercise those paths: both are accepted, with kind wording ("Reported, and that's never wrong"). No dead ends, no mention of the red-team half that confuses.

Gaps for a newcomer:
- The first message (the forged settlement email from Ayaan) is only recognisable as a sign because of its "Sent" folder tag and the secrecy line; a newcomer who does not look at the folder label may read it as an ordinary email from Ayaan. The feedback explains it afterwards, which is the point, but it is the hardest first message.
- "Verify: ring a number I already hold" has no step where you ring anyone; it is just a label. Fine for training.
- Success screen title "Signs sorted" is clear.

## What I learned (own words)

- A takeover shows up as things you did not do: a sent item you did not write, a password change you did not make, a sign-in prompt you did not start. Check Sent, check for confirmations you did not ask for.
- A real address on a message does not make it real; the service desk "never sends sign-in requests by email", whatever address they use.
- Report when unsure, and report even real-looking confirmations. Deny and report a prompt you did not start.
- Do not delete or switch off a locked machine or note; leave it as it is and report it.
- Real things exist too: a colleague's honest slip and a planned maintenance notice are fine to trust, check or report.
- Writing the email, I learned how little is needed: a real-looking address, a believable reason (the migration), and a calm ask.

Lab-sheet questions answered by play: none available to me (blind).

## Five best lines

1. "Everyone clicks something eventually, so today is about the ten minutes after, and how one quick report changes the ending." (Anjali)
2. "That was not carelessness: it was built to pass for the notice he acts on." (Ayaan's reading of the email, in "Now it lands on you")
3. "Reporting when you're unsure is always fine and never marked down."
4. "You caught it from the Sent folder, which is exactly the sign." (IT Security reply)
5. "These messages are built to fool careful people, so a miss here says more about the attack than about you."

## Five worst lines

1. "Nothing to replay this time. The defence is the same either way..." (persona 2): explains nothing about why the email did not land.
2. "Tick what made you decide, or choose Nothing looks wrong. Then press Confirm again." (appears after Confirm, with Next message already offered)
3. "You chose Delete... The right call was Trust or Verify" next to "reporting it yourself also scores full" (Reuben, contradictory).
4. "Score 0 percent. Worth practising: here's where to look first" next to item scores of 100, 70 and 30.
5. "Start at the kiosk: write the email first, then take the other seat and sort what turns up." ("the other seat" suggests walking to the second desk; it is just Continue.)

## Scores (1 to 5)

| Area | Score | Note |
|---|---|---|
| Fun | 4 | The red-team half is a real novelty; writing the phish and then living with it works. Sorting six items is a bit list-like. |
| Pacing | 4 | Research and write take longest; the sort round is brisk. The reload loses the round, which is announced. |
| Clarity of goals | 4 | Always clear what the current step is. "Other seat" line and the "nothing to replay" step are the soft spots. |
| Openness of decisions | 3 | Email writing is steered by the live meter and one-option pickers. Sorting is open; the same checkbox list on every message avoids giveaways. |
| Teaching | 5 | The after-click signs, report-early habit and what to do on the device land clearly. Feedback is specific and kind. |

## Times (estimates at a real person's reading pace; the harness clock is faster)

- Full, persona 1: about 14 minutes (harness 5 min 54 s of wall clock to the final verifier). Target 15, so on target.
- Full, persona 2 (rushed): about 8 minutes.
- Defend-only: about 6 minutes (target 8, so under).

## Severity table

| # | Severity | Tag | Finding |
|---|---|---|---|
| 1 | Major | content | A weak email (urgent pretext, wrong "staff portal" fact, 2 flags) yields "Nothing to replay this time" with no explanation. The brief says "The colleague clicked", so the player is told the click happened and then shown it did not. A rushed or low-scoring writer gets no feedback on their email at all (the red-team half is unscored by design, but a one-line "Ayaan was not fooled by this one because..." is missing). The two branches also differ in what follows (persona 1 sees the Sent folder and the sign-in prompt, persona 2 sees nothing), which makes the jump to "Defend" feel unexplained. |
| 2 | Minor | content | Round score of 0% shown beside item scores of 100, 70 and 30; the penalty arithmetic is only explained further down. |
| 3 | Minor | content | Reuben card contradicts itself: "The right call was Trust or Verify" vs "reporting it yourself also scores full". |
| 4 | Minor | engine | "Tick what made you decide... Then press Confirm again" stays visible after Confirm with Next message already offered. |
| 5 | Minor | content | Anjali's "take the other seat" implies moving to the second desk (which has a PC and does nothing). |
| 6 | Minor | content | Email-writing is nearly decision-free: sender name and address each have one option, and the red-flag meter reveals the "best" combination (0 flags). |
| 7 | Nit | content | Mission-end card for the full episode is titled "After the click episode done" (lowercase, awkward). |
| 8 | Nit | content | In defend-only the first message depends on noticing the Sent label; the hardest item comes first. |
| 9 | Nit | engine | Reload lands on the title screen plus a Resume overlay; needs a Resume click and Enter. (Expected; not counted as a finding beyond this note.) |

Counts: 0 blocker, 1 major, 5 minor, 3 nit (9 rows, the last one is informational only).

No blockers. No moment where I was stuck for more than a few seconds. The reload point (after the email, mid-sort) behaved as documented: email progress kept, sorting round restarted.
