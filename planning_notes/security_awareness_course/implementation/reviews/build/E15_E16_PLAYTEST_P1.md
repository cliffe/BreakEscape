# E15 and E16 persona playtest P1 (Jo)

Run date 2026-10-29. Keyless server :3001, headless, load average about 10 (harness timings are rough). Persona run, not blind: the tester played from what was on screen and did not read ink or scenario ERB (word counts below are from on-screen text). Every action was a real click on a visible control through the window.__test harness. `mg clickText` did not reach the radio and chip inputs, so those went through DOM clicks on the visible control (`input[value=...]`). Mission Brief popup after reload, the "Resume session?" overlay, sort-drill reload restarting the round, sort-drill summary marks and the privacy-panel live-region line are not reported as findings.

**Persona (Jo, non-technical office worker, reads slowly, no jargon):** careful, reports when unsure, but takes the kind or obvious option on purpose in places (lent a login, plugged the found stick in, trusted a "met at the Expo" supplier stick, trusted Ross's handover email), and uses one wrong chip on purpose.

## Evidence

| Run | Game id | Started (UTC) | Session log |
| --- | --- | --- | --- |
| E15 full (awareness_e15_shadow_it) | 4879 | 19:41:45 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e15-e16/e15-full-session.jsonl |
| E15 defend-only (_defend) | 4880 | 19:51:41 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e15-e16/e15-defend-session.jsonl |
| E16 full (awareness_e16_insider_risk) | 4881 | 19:53:12 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e15-e16/e16-full-session.jsonl |
| E16 defend-only (_defend) | 4882 | 20:03:26 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e15-e16/e16-defend-session.jsonl |
| E16 defend (font sweep only, no play-through) | 4920 | 20:05 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e15-e16/e16-fonts-session.jsonl |

Screenshots (e15-NN, d15-NN, e16-NN, d16-NN): /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e15-e16/. Games 4879 to 4882 were created fresh after `BREAK_ESCAPE_STANDALONE=true bin/rails db:seed`. new-game.rb printed :3000 URLs; every run used :3001. Game 4921 was created and never played.

### verify-run.rb output

```
--- 4879
globals set     3: engine_tutorial_declined, episode_e15_shadow_it_defend_done, episode_e15_shadow_it_defend_pass
tasks           1 in objectivesState, 1 completed
  sort_shortcuts                     "completed"  at 2026-10-29T19:50:59Z
tasks_completed 1
social scenario true (completed tasks count toward the verdict)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4880
globals set     3: engine_tutorial_declined, episode_e15_shadow_it_defend_defend_done, episode_e15_shadow_it_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  sort_shortcuts                     "completed"  at 2026-10-29T19:52:54Z
tasks_completed 1
social scenario true (completed tasks count toward the verdict)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4881
globals set     3: engine_tutorial_declined, episode_e16_insider_risk_defend_done, episode_e16_insider_risk_defend_pass
tasks           1 in objectivesState, 1 completed
  handle_leaver_week                 "completed"  at 2026-10-29T20:03:03Z
tasks_completed 1
social scenario true (completed tasks count toward the verdict)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4882
globals set     3: engine_tutorial_declined, episode_e16_insider_risk_defend_defend_done, episode_e16_insider_risk_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  handle_leaver_week                 "completed"  at 2026-10-29T20:04:41Z
tasks_completed 1
social scenario true (completed tasks count toward the verdict)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

All four show the episode globals set and the one task completed. No VMs, flags or PINs, so no earned-secrets table.

## Timings

Measured is harness time at fast speed plus my reading, and includes the reload (about 2 to 2.5 minutes of it is the harness's own resume bootstrap). Estimate is Jo reading at about 200 words a minute from the on-screen word count, plus clicks.

| Run | Measured | Estimated for Jo | Target |
| --- | --- | --- | --- |
| E15 full | 9 min 33 s (incl. reload) | 16 to 17 min (about 2,800 words) | 15 |
| E15 defend-only | 1 min 20 s | 10 to 11 min (Swap Shop plus six messages plus debrief) | 8 |
| E16 full | 10 min 3 s (incl. reload) | 16 min (about 3,100 words) | 15 |
| E16 defend-only | 1 min 23 s | 10 to 11 min | 8 |

All four are over by the estimate, defend-only by 2 to 3 minutes. Biggest costs: the six inbox messages (about 1,300 words with feedback), then the debrief (about 600 to 700 words, eight or nine panels). Same pattern as E14 and E17.

## Reload results

| Episode | Reloaded at | Result |
| --- | --- | --- |
| E15 | Mid Swap Shop, card 3 of 4 (card 2 answered wrong) | PASS for stage: after the Resume overlay (expected) the kiosk reopened on the Swap Shop card with Brief, Choices, Where it led shown done. The drill itself restarted at card 1 (known item); the card order was the same. Screenshot e15-09-afterreload.png. |
| E16 | Mid concern form, 3 chips picked, before "Check my report" | PASS for stage (Raise a concern card, earlier stages done), but the picks are gone ("Nothing picked yet.") with no word that they were. See F-E16-8. Screenshot e16-07-afterreload.png. |

Not tested: reload mid-inbox, reload after the flip/montage in E16.

## Montage check (Your call, no Your choice.)

PASS in both. E15 and E16 montages use "Your call" (risky pick) and "Your call: the safe route" (safe pick). The text "Your choice." appears nowhere in the montage body in either full run (checked the whole container text of E16, read the E15 text). Screenshots e15-03-montage.png, e16-02-montage.png. Two small notes under F-E15-8 and F-E16-11.

## Fonts

- E16 sender addresses (`<it@quayholt-support.example>`, `you@quayholt.example`) compute to Source Sans 3 at 16px. Correct.
- E15 sender and To addresses compute to Source Sans 3 at 16px. The link line in the message body (`fileshare.tarrowby.example/s/monday-pack`, class `mail-chip-label`) computes to GNF, the pixel font. See F-E15-6.
- The numbered stage rail at the top of the kiosk (brief, 1 2 3) computes to 12px in GNF. Measured on E16 defend; the E15 rail is the same component but I did not measure it. See F-E15-7.
- Nothing else measured under 13px on the screens I swept (E16 defend: brief, form, form feedback, inbox list, message, chips). E15 swept on one message screen only.

## Severity counts

| Episode | Blocker | Major | Minor | Nit |
| --- | --- | --- | --- | --- |
| E15 | 0 | 3 | 9 | 3 |
| E16 | 0 | 4 | 9 | 3 |

## Findings, E15 "Shadow IT"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E15-1 | Major | Result panel after Jo trusted the Benmoor stick: "One answer let an attacker straight in (trusting a phish email). That costs 15 points", then the next line is "You trusted this real one: 'Shauna Lofthouse shared Monday pack, final' with you". That reads as a second mistake, but Trusting Shauna was right; the wrong answer (the Benmoor stick) is not named in the result or the "tell most often missed" line. | Name the item that cost the points, and phrase the Shauna line as the good call ("You trusted a real one, correctly"). | e15-22-result.png | content (result copy), possibly engine (result builder) |
| F-E15-2 | Major | Phishing language on shortcut items. Inbox brief: "Report: This is a phish. Send it to security." Trust: "This is real." Feedback on a posted supplier USB: "You chose Trust. Not this time. This one was a phish." Counters: "Phish stopped for the team", "Phish caught 3 of 4". Jo does not know what a phish is, and a USB in the post is not an email. | Wording for the thing on screen ("This looks wrong. Tell IT", "This was a found stick"). Same class as E20 F-E20-1. | e15-13-inbox-brief.png, e15-19-fb3.png | content and engine |
| F-E15-3 | Major | Debrief "The habit to keep" is the phishing/BEC line: "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself...". Nothing in E15 pressured Jo like that. The true lesson (stick goes to IT unplugged, approved swap, ask IT) is in "On Monday", below it. | The habit line should be the Shadow IT one. Same as E17-M2. | e15-23-debrief.png | content |
| F-E15-4 | Minor | Debrief sentence fused from two lines: "...Handle it. Reported as a scam, the one quick yes from IT you did get sits in a queue while someone checks a genuine reply." "Handle it." is also unexplained in the per-message feedback on Nilesh's real reply. | A plain sentence: "This one was safe to act on." then the cost of reporting a real one. | e15-21-fb6.png | content |
| F-E15-5 | Minor | Report feedback repeats itself three times: "Your verdict: Report. Locked in." then "Thanks for reporting. That warns everyone else." then "You chose Report. Right call: reported. A report warns everyone else." Same as E19-3. | One confirmation line. | e15-18-fb2.png | content and engine |
| F-E15-6 | Minor | The link in the message body (`fileshare.tarrowby.example/s/monday-pack`, `.mail-chip-label`) is in the pixel font (GNF). Sender and To addresses are correct. | Address font on links as well. | e15-15-msg1.png (class found by DOM check) | engine |
| F-E15-7 | Minor | Stage rail numbers (brief, 1 2 3) are 12px, under the 13px floor. | At least 13px. | d16-01.png / e15-01-brief.png | engine (CSS) |
| F-E15-8 | Minor | Montage entries for a safe pick describe the road not taken: "The version where the pack went to a personal inbox instead: it was broken into...". Jo took the safe road, so "the version where ... instead" took a second read. | Say what happened on her road first, then the contrast. | e15-03-montage.png | content |
| F-E15-9 | Minor | Swap Shop says "Nothing here is marked" and the first brief says "Only the sort is scored", yet each card says "That's the one" or "Approved way: ..." and the summary says "You matched all 4 shortcuts to their approved way" (in the defend-only run Jo had missed card 1; may be the queued summary-marks item). Jo could not tell which part was "the sort". | Say "the inbox sort is scored" and keep the Swap Shop label consistent. | e15-11-swap-summary.png | content, possibly engine (known) |
| F-E15-10 | Minor | Jargon in learner text: "tells" ("a few tells slipped past", "The tell most often missed"), "malware", "off switch", and "that route brings in the DPO" (debrief, last panel). | Plain words, DPO spelled out or dropped. | e15-23-debrief.png | content |
| F-E15-11 | Minor | "About that stick" reveal (see below) sits in the middle of the debrief, after the cost-of-reporting panels and before the habit. Not in the defend-only debrief at all, though the first message there is a posted stick. | Put the reveal straight after the stick message, or at the top. | e15-23-debrief.png | content |
| F-E15-12 | Nit | The Swap Shop has four cards and four bins used once each, so the last card is forced once three are placed; the final stick card also repeats what the previous stage's feedback just said. | A fifth bin or a spare card. | e15-10-swap-last.png | content |
| F-E15-13 | Nit | Defend-only brief says "Sort them, and match each shortcut to the approved way", but the order is match, then sort. | Swap the order in the sentence. | d15-01.png | content |
| F-E15-14 | Nit | After a wrong Swap Shop answer the card stays shown in the bin it was wrongly dropped in (list at the foot: "The team space (ask IT) / A video too big for email..."), next to the right-way line. | Show it under the right bin. | e15-08-swap-wrong.png | engine |

### "Swap Shop" and "About that stick" (asked about particularly)

- Swap Shop: four cards, four labelled bins, clickable bins labelled 1 to 4. Feedback per card was short and kind ("That's the one" or "Approved way: ..."). Jo understood it with no help. It is easy (the bin names give the answer) and does not look like a test, which suits the "Nothing here is marked" line, but see F-E15-9.
- "About that stick": tone is right. "The stick that came in the post was ours: an authorised test, and it only tells us a stick was plugged in. We name nobody. Most people who plug a found stick in are being kind, trying to find the owner, or just curious, so the kind move is to hand it to IT." Jo had plugged the stick in on purpose in the sandbox and did not feel accused. It is 54 words and sits low in the debrief (F-E15-11). It did not say anything about Jo's own pick (the sandbox stick), only the generic reveal; I did not test whether it changes if the stick was not plugged in.

"Didn't know what to do" moments (E15): (1) First inbox message, the padded envelope from reception: Verify says "ring a number I already hold" but the only number is the one on the handwritten note, which Jo does not hold. About 15 seconds. (2) Whether to Trust or Report a catalogue stick from a stand ("met you at the Expo"): "This is real" sounded right, "a phish" did not apply (F-E15-2). (3) Which part was "the sort" (F-E15-9).

Lesson Jo left with: "Don't plug in a stick I didn't buy; hand it to IT; if the proper way is slow, ask IT rather than find my own way round." Clear. The Swap Shop does most of the teaching; the debrief's top half adds nothing she would remember.

Five weakest lines, E15:

1. "One answer let an attacker straight in (trusting a phish email)." followed by "You trusted this real one: 'Shauna Lofthouse shared...'"
2. "You chose Trust. Not this time. This one was a phish. The right call was Report or Verify." (a catalogue stick from a stand)
3. "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself..." (habit to keep)
4. "Handle it. Reported as a scam, the one quick yes from IT you did get sits in a queue while someone checks a genuine reply."
5. "If personal data went to a personal account, that route brings in the DPO."

## Findings, E16 "Insider risk"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E16-1 | Major | Reporting a colleague feels like blame. Jo Reported Reuben's request to use her login (a locked-out colleague) and got "Right call: reported. A report warns everyone else", then "IT Security: Thanks, the service desk reset his own login... Reuben is a genuine colleague, so the move is to decline the login", while the list counter said "Phish stopped for the team: 1", the result "Phish caught: 4 of 5" and the debrief "kept 3 phish away from the rest of your team". Reuben, Ross and Hana all count as phish. The brief promises "you are not being asked to investigate anyone". | Colleagues' requests handled as requests ("decline and point him to the desk"), counters worded for the thing (requests handled), no "phish" for named colleagues. Hana's Escalate feedback ("genuine, escalating when unsure is never wrong") is the right tone; Reuben's is not. | e16-13-fb2.png, e16-19-result.png | content and engine |
| F-E16-2 | Major | Reuben's request is scored on a tell that is not there. Chip list for the request includes "Someone senior is invoked to skip a check"; Jo (and a defend-only Jo who ticked nothing relevant) gets "Missed: Someone senior is invoked to skip a check (Lending your login hands someone your access...)", and the defend-only result says "Weakest skill: Borrowed authority (caught 0 of 1)". Reuben is a peer who asks nothing about seniority. | Chip label or tag for this item that matches what the message does ("Asked to use someone else's login"). Same class as E19 F-E19-1. | e16-13-fb2.png | content (chip mapping) |
| F-E16-3 | Major | The concern form says "Pick what to put in the report, then choose who to send it to" but there is no choose-who step. Instead a 85-word "Who to tell" paragraph with five routes (security, manager, HR, Speak Up line, DPO) and a team-chat rule appears on the Start card and again under the feedback. The good-report feedback says "Facts, routed to the right person" though Jo routed nobody. | A short route choice (three radio buttons), or drop "choose who" and cut the paragraph to what a first-timer needs. DPO spelled out. | e16-04-form1.png, e16-09-fb-good.png | content and engine |
| F-E16-4 | Major | Defend-only starts with the form: "Before the inbox, build a short report from what you noticed. Facts first." Jo has noticed nothing yet; the chips ("An unknown contact offered payment for remote access", "The message came on Tuesday evening") describe events from the choices stage she skipped. She ticked them with no context. | Put the form after the inbox in defend-only, or give the defend-only form its own two-line scenario. | d16-01 (text in session log), d16-02-fb.png | content |
| F-E16-5 | Minor | Jargon: "MFA prompt you didn't trigger" (chip, feedback, result "MFA prompts: caught 1 of 1") is never explained; "DPO"; "Escalate"; "lawful process" in the conclusion feedback ("Leave the verdict to the people whose job and lawful process it is"). | Plain wording: "a sign-in prompt you didn't start". | e16-14-prompt.png, d16-02-fb.png | content |
| F-E16-6 | Minor | The chip list is long and mostly irrelevant for a text or a call (11 chips for Reuben's email: sender's address, attachment, link, hurry...). Jo ticked "It's pushing me to hurry" for "report due at ten" and was told "Not a flag here". | Show the 3 or 4 relevant chips plus "Nothing looks wrong". | e16-13-fb2.png | content and engine |
| F-E16-7 | Minor | Report feedback repeats the same point three times ("Locked in", "Thanks for reporting. That warns everyone else.", "Right call: reported. A report warns everyone else."). Same as E19-3 and F-E15-5. | One confirmation line. | e16-12-fb1.png | content and engine |
| F-E16-8 | Minor | Reload mid-form drops the picks silently ("Nothing picked yet."); only the inbox brief warns that closing restarts the round. | One line on the form's Start card. | e16-07-afterreload.png | engine and content |
| F-E16-9 | Minor | Ross's feedback: "Ross is a genuine leaver, but sending the client list to a personal inbox ... and that can be a crime." Aimed at a named, genuinely helpful colleague, it reads as an accusation to someone who trusted him. Missing the "keep it secret or skip the process" chip is also scored as "Secrecy: caught 0 of 3 / Weakest skill: Secrecy", though the email never asks for secrecy. | Say what to do ("the handover goes in the shared place"), drop the crime line from the first feedback, tie the chip to "skip the normal process". | e16-15-fb-ross.png, e16-19-result.png | content |
| F-E16-10 | Minor | Debrief "The habit to keep" is the money/grant-access/read-back-a-code line; the real habit ("Three things to keep", just above it) is better. Two habit lines compete. | One habit. Only part of the line fits E16. | e16-20-debrief.png | content |
| F-E16-11 | Minor | "A colleague has seemed to be having a hard week" is accepted as a fact in the same report as the outside offer, with "Good. Facts, routed to the right person..." and no hint that wellbeing goes to a different person. Montage order also differs from the order of Jo's choices (call 3 first, call 1 second) without a label. | Say which route fits it; keep the montage in the order chosen. | e16-09-fb-good.png, e16-02-montage.png | content |
| F-E16-12 | Minor | "Real texts, prompts, calls and emails handled right: 1 of 1" and "Phish caught 4 of 5" in the same result (which one was real? which four were phish?). | One counter per kind of item. | e16-19-result.png | content |
| F-E16-13 | Nit | "I don't know why, and it may well be nothing" sits under "Who was involved", which it does not answer. | Its own group, "What you're sure of". | e16-05-form2.png | content |
| F-E16-14 | Nit | Full run, Defend card: "Now a short set of messages, and a fair way to raise a concern" after the form was just done. | Match what is left. | e16-03-defendcard.png | content |
| F-E16-15 | Nit | Defend-only debrief opens "Seen, said, true" with Samira, Ross and Craig named, none of whom Jo met in that run. | Introduce them in one clause, or show the panel only in the full run. | d16-03-debrief.png | content |

### Concern form (asked about particularly)

- Fact chips vs conclusion chips: easy to tell apart. Conclusions sit in their own optional group ("What you think it means (optional)"), and the report preview labels them "Facts, what happened: ..." and "Conclusion: ...". Jo picked a conclusion first (Samira "in on it"), because the gossip was loud. The feedback taught it well.
- Feedback lines, all kind: conclusion chip, "Your facts are exactly what's needed. Just leave the conclusion out, and let whoever looks into it reach their own. That's fairer to everyone, and you don't have to be sure to raise a fair concern."; hearsay chip ("Craig reckons..."), "That's a conclusion, not something you saw. ... If you're wrong, a verdict is unfair to someone who has done nothing."; too few facts, "A start. Add 2 or more facts so whoever reads it can see what you saw."; good, "Good. Facts, routed to the right person, are what a fair concern looks like. You don't have to be sure, and you may not hear the outcome, because that is confidential too." Jo understood the correction on the first read and fixed it by clicking the chip off.
- Suspicion or blame: the form does not feel like suspicion, because the facts are about the incoming offer and a colleague's hard week, and the closing "Seen, said, true" panel ("Unusual is not the same as wrong, and a kind word comes first") is the strongest line in either episode. The inbox is where it slips: F-E16-1 and F-E16-9.
- "Who to tell" is the weak part (F-E16-3).

"Didn't know what to do" moments (E16): (1) The form's first card: what to do with the five routes, and where to choose one (about 20 seconds). (2) Reuben's request: Report felt like telling on him; "This is a phish" did not fit a colleague. (3) Hana's call: Escalate or Ring back, both seemed kind; feedback was good. (4) Defend-only: "from what you noticed" with nothing noticed (F-E16-4). (5) "MFA" in the sign-in chip.

Lesson Jo left with: "Don't lend my login; report offers; when something looks odd about a person, say what I saw, not what I think, and be fair, because rumours land on whoever is having the worst week." The sentence from the debrief, "You don't have to be sure; you do have to be fair", did land.

Five weakest lines, E16:

1. "You chose Report. Right call: reported. A report warns everyone else." (on a locked-out colleague, with "Phish stopped for the team: 1" above it)
2. "Missed: Someone senior is invoked to skip a check" (Reuben's login request)
3. "Pick what to put in the report, then choose who to send it to." with the 85-word "Who to tell" paragraph and no choice to make
4. "Good. Facts, routed to the right person, are what a fair concern looks like." (Jo routed nobody)
5. "Ross is a genuine leaver, but sending the client list to a personal inbox takes the firm's data outside its protection, and that can be a crime."

## Host and learner lines over 30 words

These are on-screen blocks, not ink lines; I did not open ink. Word counts by hand from the session text.

| Line | Words |
| --- | --- |
| E16 intro brief (Quayholt Insurance) | 92 |
| E15 inbox brief | 80 |
| E16 "Who to tell" (form start card and feedback) | 85 |
| E15 "About that stick" panel | 54 |
| E16 Hana's feedback ("Genuine and awkward, not a trick...") | 53 |
| E16 feedback on Ross after Trust | 40 |
| E15 feedback on Shauna's share (second paragraph block) | 39 |
| E16 IT Security reply on Reuben | 35 |
| E16 IT Security reply on the offer text | 32 |

No spoken Anjali or Nilesh line was exercised; the runs used only the kiosk. Briefs and "Who to tell" are the ones a slow reader will skim.

## Defend-only notes

- E15 defend-only (4880): brief, Swap Shop (Jo missed card 1), Defend card, inbox brief, Start, six messages, result 95%, debrief. Three screens of text before the first item are one more than needed; the Swap Shop brings the total over 8 minutes. Same six messages; Delete on the real envelope notice scored 70 and the feedback was fair. No "About that stick" panel in this run.
- E16 defend-only (4882): brief, Raise a concern first (F-E16-4), then inbox. Jo deleted the offer text (scored with "Safe, but not reported"), Verified Reuben (feedback gentler and correct: "Reuben is a genuine colleague, but lending your login puts whatever he opens on your record"), Deny-and-reported the prompt, Verified Ross, Reported the fake IT note and rang Hana back. Result 85%, "Phish caught 5 of 5", "Weakest skill: Borrowed authority (caught 0 of 1)" (F-E16-2).
- Global names for both defend variants are the doubled `..._defend_defend_done`, same as E8, E19 and E20.
- The "Phish caught 5 of 5" for a run whose items include three colleagues is the clearest line for F-E16-1.

## Not tested

Mid-inbox reload, reload after the montage in E16, keyboard-only play, phone width, audio (keyless server), talking to Nilesh or Anjali (the end-of-mission overlay stayed up and `Close` could not be clicked through clickText). E15 inbox fonts were swept on one message screen only.
