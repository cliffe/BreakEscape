# E16 Insider risk: blind playtest B3 (third blind round)

Blind run, Sonnet 5.5, headless (machine load about 11, so timings from the harness are not representative; real-person times below are estimates). Keyless server :3001. It answers the "can a player work this out" question and, for persona 1, the reload question. It is not a solvability pass (no VM, no secrets).

Scenario folders: `awareness_e16_insider_risk` (full) and `awareness_e16_insider_risk_defend`.

| Run | Game id | Session log |
| --- | --- | --- |
| P1 "Do your best", full | 108 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16-b3/p1-session.jsonl |
| P2 "Struggling", full | 111 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16-b3/p2-session.jsonl |
| P3 defend-only, persona 1 | 114 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16-b3/p3-session.jsonl |

Screenshots: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16-b3/ (p1-*, p2-*, p3-*).

verify-run.rb on each: all three print "VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed" (task handle_leaver_week completed, globals episode_e16_insider_risk_defend_done/_pass; game 114 uses episode_e16_insider_risk_defend_defend_done/_pass). Game 108 played 350 s of harness wall clock. No earned-secrets table: the episode has no PINs, keys or flags.

Harness notes: the session tag was parsed from a URL ending in a query string (tag "1"), so I used the plain game URL. The episode option buttons (choice radios, "What made you say that?" ticks) are not reachable by `mg clickText`; ticks and message actions worked through `mg clickControl`, but the five "Everyday choices" options needed a DOM click on the visible label (said here, as the rules allow). That cost about 3 minutes of harness time and is a harness limit, not something a player meets.

## Persona 1: "Do your best" (full episode)

### Timeline and what I thought the goal was

| Step | What I saw | My belief about the goal |
| --- | --- | --- |
| Training room, task "handle_leaver_week" | Kiosk and Anjali Rao in the room | Handle a leaver's week; the kiosk is where the exercise is. Nothing on screen told me to use the kiosk (I found it from the nearby list). |
| 1 Brief | Short brief, "keep your access to yourself, report what's offered, pass on facts, not a verdict. Only the set is scored." | Clear. I knew what was scored. |
| 2 Choices | 5 ordinary choices, "Nothing here is scored" | Pick what I would really do. I picked the careful option each time. |
| 3 Where it led | Each choice with its outcome. All five "Your call: the safe route" | Confirmation I did right; no tension. |
| 4 Defend, Raise a concern | Form of facts and "what you think it means". I picked four facts about the offer, no conclusions | Build a fair report. Praised, told who to tell. |
| 4 Defend, inbox | 6 messages, choose Trust/Report/Delete/Verify then tick what I noticed | Sort the messages, say why. |
| Reload after 4 of 6 | See below | Wanted to know if I lost anything. |
| Result 98% | Weakest skill "Header checks" | Confused: I had ticked everything offered. |
| 5 Debrief, "Episode finished" | Close in the bar closed it | Done. |

### Reload (mid inbox, after 4 answered)

Reload at 03:34:21 after answering Opportunities (Report), Reuben (Verify), Quayholt Sign-in (Deny and report) and Ross (Report).

- First came the "Resume session?" overlay (not a finding); I clicked Resume.
- Then the "Continue?" title card ("Awareness E16: Insider risk (full episode)", "Click, or press Space or Enter"). I tried the keyboard first. The harness `pressKey` refused with `minigame-active` (a harness gate, not the game). I then dispatched a synthetic Enter keydown/keyup in the page, and that closed the card without a click. So the keyboard path works for a synthetic Enter; I could not send a real hardware keypress from this harness, so a real Enter is likely but unproven by me. I did not need to click. In the other two runs `bootstrap` reported "title screen: Enter on Continue? -> closed" on a fresh load.
- After the card a Mission Brief popup appeared (ignored). I did not run `bootstrap` with resume through the whole sequence, so I did not time the "about 20 s" claim. From reload to the kiosk menu was about 50 s of my own manual steps.
- Earlier answers WERE still there. Reopening the kiosk showed the Defend stage page, "Open the inbox", and the inbox opened straight at the list (it skipped the Brief screen) with "4 of 6 sorted", the four rows showing Reported / Verified / Denied and reported / Reported, and the two remaining messages Unread. I finished the last two. Nothing lost. The Raise a concern form says "If you close or reload, your picks start again", and I had already finished that form, so I did not test it.
- Counter oddity: after reload the header read "Risks reported for the team: 4" although I had reported three and verified one. Before the reload it read 1 after the first report. Probably Verify on a real risk counts, but the label says "reported".

### "Didn't know what to do" moments (player view)

| Where | Time | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Start of game | about 20 s | Read the task name "handle_leaver_week"; nothing says "use the kiosk" | The kiosk showed in the nearby list. A real player has to notice a prop; Anjali Rao, standing in the room, has no stated role. |
| Message 5 (IT desk) tick list | about 30 s | Looked for a way to tick a header or authentication check | None offered. The feedback then said I missed "Header checks" (finding 1) |

Nothing else held me for more than a few seconds. No moment of being stuck for minutes.

### Real decisions

| Decision | Arguable or obvious? | Consequence shown later? |
| --- | --- | --- |
| Choices 1 to 5 (Reuben login, Craig's theory, offer, Ross export, Samira) | Obvious in every case. The wrong option is worded as the lazy one ("just this once", "Add your own theory", "Reply to find out how it works", "for safekeeping", "Ask her outright") and the right one as the sensible one ("they reset it in minutes", "kindly, and leave it there"). Nothing was colour-coded. | Yes, each outcome shown in "Where it led" |
| Raise-a-concern picks | Easy: the three "what you think it means" options are clearly verdicts; the intro paragraph also says "not a verdict on anyone". The colleague's hard week fact is arguable (should it go in the security report or to HR?); the form accepted it either way in P2 | Yes, immediate feedback |
| Reuben: Verify vs Report | Genuinely arguable and the game accepted both with 100 | Yes |
| IT desk, Report vs Verify | Arguable; both accepted per the feedback | Yes |
| Hana, Ring back vs Escalate | Arguable and a good one: a genuine awkward colleague, not a trick | Yes, "Refusing flat helps nobody" |
| Sign-in prompt | Obvious (23:51, outside the UK) | Yes |

### What I learned (own words)

Never lend a login, even to a friendly colleague, because whatever they open goes on my record. Report offers without replying. Deny a sign-in prompt I did not start and tell security. An email from a look-alike domain that tells me to approve a prompt is a phish. A colleague who is being whispered about may simply be having a bad week; say what I saw, not what I think it means. Ring back on a number I already hold.

### Five best lines

1. "Unusual is not the same as wrong, and a kind word comes first."
2. "What people saw ... What was said ... What was true was that her father was in hospital all week." (Seen, said, true)
3. "Reuben clicked the wrong shortcut and opened the HR drive, under your name, on the record until it was explained. Harmless this time; a reset would have cost two minutes."
4. "Genuine and awkward, not a trick: she lets you ring back on the number on file, which is the difference from an impostor." (Hana)
5. "You are not in trouble for being approached."

### Five worst lines

1. "Header checks: caught 0 of 1: missed on 'We're migrating your account tonight'" and "Weakest skill: Header checks" (nothing I could tick matched).
2. "Fails sender authentication (SPF/DKIM/DMARC) — the domain didn't really send this": jargon for non-technical office staff, and not visible anywhere on the message.
3. "Nothing here is scored, so choose what you would really do" (choices round) followed by "safer move" and "Choices worth a second look" in the debrief: an unscored round that is graded afterwards.
4. "Risks reported for the team: 4" when I had reported three.
5. "Look for it in the next messages you get at work" attached to a skill the player had no way to demonstrate.

### Scores (P1)

Fun 3, pacing 4, clarity of goals 4, openness of decisions 2, teaching 4.

### Time (P1, full, estimated at a real reading pace)

About 15 min: brief 1, choices 2, where it led 1.5, form 2.5, inbox 6 messages 5, result and debrief 3. Harness wall clock was 350 s.

## Persona 2: "Struggling player" (full episode)

Rushed, first-listed (quickest) option each time, trusted what looked official, ticked nothing.

- Choices: Log him in, Add your own theory, Reply to find out, Export to personal email, Ask her outright. The "Where it led" screen (no "safe route" label this time) gave each consequence in plain terms with no blame: "The theory reached Samira, who had been at the hospital every night. It wasn't true, and it landed on someone already having the worst week."
- Raise a concern: I picked Samira/Ross/Craig conclusions. Only one conclusion stays in the report (the last pick replaced the others silently). "Check my report" said "A conclusion about a person does not belong in the report, so take those picks out. Then add a couple more of the things you saw yourself." Clear and kind. I unticked it, added two facts, and it passed.
- Inbox: Delete (offer) 30/100, Trust (Reuben) 0, Approve (sign-in) 0, Trust (Ross) 0, Trust (IT desk) 0, Comply (Hana) 70. Each card said "Not this time", named the right call, and explained what could have happened. Confirming with nothing ticked needs a second Confirm; the screen says "Tick what made you decide, or choose 'Nothing looks wrong'. Confirm again to move on."
- Result: 7%, "Worth practising: here's where to look first". The text named the four letting-through answers and that it cost 10 points "on top of the item itself", and "You didn't tick anything you noticed, so there's nothing to grade skill by skill".
- Debrief: fair, no blame. It ends with "a miss here is no judgement on anyone". The "Choices worth a second look" section replays each choice with the safer one. Close in the bar closed "Episode finished".
- Oddities: (a) the same debrief then says "The signs most often missed: ... (caught 0 of 1 each)" for seven skills, which contradicts "nothing to grade skill by skill"; (b) Hana was genuine and I complied; the card scored 70 and listed no "Missed" item, but the result counts "Genuine requests handled right 0 of 1"; (c) the game marked handle_leaver_week completed and set the "defend_pass" global at 7%, so completion does not depend on the score (a design question, not a bug I can rule on).

Scores (P2): fun 3, pacing 4, clarity 4, openness 2, teaching 4. Time: about 10 min at a rushed pace.

## Defend-only (persona 1)

Brief explains the premise in two sentences and names the offer, Samira, Craig and Ross inside the Raise a concern text, so it makes sense to someone who never played the choices round. Same form, same inbox, 98%, same "Header checks" miss on the IT message. The debrief opens with the same "Seen, said, true" about Samira, including that her father was in hospital, which a defend-only player never chose anything about; it reads as a short story and works, but the "Samira" reveal lands without the set-up the full episode gives it. Ended on "Episode finished"; bar Close closed it. Time: about 8 min estimated. Scores: fun 3, pacing 4, clarity 4, openness 2, teaching 4.

## Severity table

| # | Severity | Finding | Tag | Where |
| --- | --- | --- | --- | --- |
| 1 | major | The result penalises "Header checks" (0 of 1) and the debrief says "Weakest skill: Header checks", but the IT-desk tick list offers nothing about headers or authentication, and the message view shows only From, To and Time. The feedback then lists "Fails sender authentication (SPF/DKIM/DMARC)" as a tell. A player who ticked every available correct tell is told their weakest skill is one they could not show (score 87, repeated in P3). If there is a way to view headers I did not find it. | content (possibly engine: a header view) | P1 msg 5, P3 msg 5, result and debrief |
| 2 | major | Every "Everyday choices" question gives its answer away by wording (the lazy option carries the tell: "just this once", "for safekeeping", "find out how it works", "Add your own theory"). The round says "Nothing here is scored, so choose what you would really do", yet it is later graded as "Choices worth a second look". | content | P1 and P2 choices round |
| 3 | minor | "Risks reported for the team: 4" counted a Verify. | content | P1 inbox header |
| 4 | minor | The debrief's "signs most often missed" lists seven skills at 0 of 1 for a player who ticked nothing, which contradicts "nothing to grade skill by skill". | content | P2 debrief |
| 5 | minor | Hana Comply scores 70 with no Missed item, but "Genuine requests handled right: 0 of 1". | content | P2 |
| 6 | minor | Raise a concern: a second or third "what you think it means" pick silently replaces the first; there is no hint that only one is kept. | engine | P2 form |
| 7 | minor | "SPF/DKIM/DMARC" jargon in a course for non-technical staff. | content | IT message feedback |
| 8 | minor | Nothing on screen points a new player to the kiosk, and Anjali Rao's role is never stated; I found the kiosk from the nearby list. | content | training room start |
| 9 | minor | Episode completes (task done, defend_pass set) at 7%. Question for the designer. | content | P2 verify-run |
| 10 | nit | A first Confirm with nothing ticked looks like nothing happened until the line at the bottom of the card is read. | engine | P2 inbox |
| 11 | nit | After a reload the inbox skips the Brief screen (fine, but a returning player does not see the scoring rules again). | engine | P1 |
| 12 | nit (harness) | Episode option controls are not in the harness control list, so `clickText` could not drive the choices round; `pressKey` refuses on the title card. | engine/harness | all runs |

0 blockers, 2 majors, 7 minors, 3 nits.
