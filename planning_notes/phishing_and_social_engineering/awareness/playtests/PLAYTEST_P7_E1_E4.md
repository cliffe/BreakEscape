# Playtest P7 part A: E1, E2, E3 and E4, full and defend-only (confirmation round)

Date 2026-10-27. Main at 3a67e357d, then 2951963f6 (another agent's commit landed during the bridge runs; the data changes in it are E6 only). Keyless server :3001 only (:3000 untouched), headless Chromium, a fresh game per run, own game ids. No game files edited. Not a solvability run (no PINs or flags). Scratch and logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p7a/`.

## 1. Bridges (one at a time, scored with check-bridge.mjs)

| Bridge | Game | Head | Result |
| --- | --- | --- | --- |
| e1-full | 4571 | 3a67e357d | PASS, 13 of 13 evals |
| e2-full | 4572 | 3a67e357d | PASS, 14 of 14 |
| e3-full | 4573 | 2951963f6 | PASS, 22 of 22 (now includes the MFA decision) |
| e4-full | 4574 | 2951963f6 | PASS, 14 of 14 |

All four passed on the first try. Logs: `<bridge>.a1.log` and `.a1.check` in the scratch folder.

## 2. Runs

Driver time is wall-clock from game creation to the last command, and includes my gaps. `verify-run.rb` printed "progress recorded" for every game below (2 tasks for full runs, 1 for defend-only).

| Run | Game | Viewport | What I did |
| --- | --- | --- | --- |
| E4 full | 4576 | 1400x1000 | researched the staff page only, opened the composer, read the Stuck? pointer; then researched Events, sent the calm email (landed); defend with a manual Report plus the senior tick; reload at item 2 of the inbox; replay of the round; 93% |
| E1 full | 4581 | 1400x1000 | bridge route to the inbox; Report on the Ravinder wire with the "no good reason" tick |
| E2 full | 4583 | 1400x1000 | bridge route; Report on Liam's portfolio phish with the tick; Report on the macro CV with "attachment doesn't fit" |
| E3 full a | 4586 | 1280x720 | call landed; Esc and Close before choosing; working hours plus two or three; Esc after the outcome |
| E3 full b | 4588 | 1280x700 | call landed; early hours plus one after another; defend; debrief concept panel |
| E3 full c | 4590 | 1280x720 | no research, pushy lines, call refused (walked_away); defend; debrief |
| E1 defend-only | 4594 | 1280x720 | real choices on two items, **reload mid-round**, then the full round |
| E2 / E4 / E3 defend-only | 4596 / 4597 / 4601 | default | scripted careful round, Finish |

## 3. Confirmations

**PASS: E4 sender-address "Stuck?" pointer (M1).** With only "Our people" noted, the From template shows "sender's address: no evidence yet", the gate line, and a "Stuck? Show me where to look" disclosure. Opened, it reads: "Her own staff page lists only her normal work address. Look at the events and speaker pages for the address she uses while she's travelling." Names both pages, not the value. Shot: `P7_screenshots/p7a_e4_stuck_pointer.png`.

**PASS: C4-1 "Someone senior is invoked to skip a check" still caught.** E4 careful Report on the boarding-payment email with the sender, senior and secrecy ticks: "Caught: Someone senior is invoked to skip a check ('I'll sign it off when I land' leans on the managing partner's own authority...)". Pressure was the one "Missed" because I did not tick it. Score 90 of 100 for the message.

**PASS: E1 Ravinder "no good reason I'd get this".** Ticked on the CEO wire phish: "Not a flag here: There's no good reason I'd get this. A payments clerk does field payment requests, so getting one is nothing odd in itself. That is the cover; the tells are the sender's real address, the push to skip approval, and the hurry." The message still scored 100. Shot: `p7a_e1_no_good_reason_note.png`.

**PASS: E2 Liam "no good reason I'd get this".** On `e2_portfolio_lookalike` (Liam Baxter, "CV attached: warehouse supervisor"): "A recruitment inbox is exactly where CVs land, so a CV turning up is no surprise. The tells are the missing attachment and the link that wants your Tarrowby sign-in, not that a CV arrived." Score 100.

**PASS: E2 macro CV "The attachment doesn't fit".** On `e2_enable_content` (Jordan Kerr, "Job application"): "A Word document is a normal way to send a CV, so the file itself fits. What doesn't fit is being told to enable editing and content before it will show: a real CV never needs that." Shot: `p7a_e2_macro_attachment_note.png`.

**PASS: E3 MFA decision, all sub-points.**
- *Choice panel hides after Confirm.* The confirm button reads "Start sending prompts". After it, `.auth-choice` computed display is `none` (both 1280x720 and 1280x700).
- *Outcome on screen.* 1280x720 (working hours, two or three, 7.1 s to the outcome): outcome panel top 438, bottom 679 in a 720 viewport, all three lines inside. 1280x700 (early hours, one after another, 10.5 s, four cards plus "...and 26 more prompts in the same burst."): top 439, bottom 660 in a 700 viewport. No scrolling needed. Shots: `p7a_e3_outcome_1280x720.png`, `p7a_e3_outcome_1280x700.png`.
- *Labels readable.* The choice panel now has its own light surface; labels and legends compute to rgb(31,41,51) on it. Shot: `p7a_e3_choice_1280x720.png`. First radio takes focus on open.
- *Esc and Close before choosing.* Both leave the panel in place (focus stays on a radio, the stage is not marked done); with a radio focused a single Esc was enough. After the outcome, one Esc exits to the flip page, stage list shows Prompts done.
- *Refused call.* Run c: `walked_away`, strip shows "4 Prompts (skipped)", flip page reads "Nothing to replay this time: Your call didn't get what it was after this time, so there's nothing of yours to replay." Neutral. 
- *Defender note and concept panel.* The outcome panel's last line names two controls: number matching, and a prompt you didn't ask for being one to report, not approve. The debrief concept panel names three: "a prompt you didn't start is one to report rather than approve, number matching defeats a careless tap, and a rate limit chokes a flood". (The rate limit also appears in the flood's count note.)

**PASS: POV backgrounds.** Host chat on the full shells shows the right company sign and a room that fits: Adaeze at Brightwell Foods (`p7a_e1_host_chat_bg.png`), Fatima at Tarrowby Logistics (`p7a_e2_host_chat_bg.png`), Darren at Quayholt Insurance with the queue board and kiosk (`p7a_e3_host_chat_bg.png`, shot at 1280x720), Thandiwe at Merrin & Sallow (`p7a_e4_host_chat_bg.png`). Sign lettering is clean in all four; the dialogue text is readable over each. Nothing wrong beyond the trivial in section 5. I did not open the chats on the defend-only shells; the same `chatBackground` is in all 38 shells.

**PASS: reload during play.**
- E4 (full, game 4576), reload from the inbox-triage item 2: reload to the Resume overlay about 4.4 s; Resume to the Mission Brief about 7 s (title screen first, Enter); Esc and reopening the kiosk about 5 s. Total about 17 s of game time to a usable kiosk. The episode came back at the Defend stage with the sent email and intel intact; the inbox round restarted from the first message, as the brief says.
- E1 (defend-only, game 4594), reload after item 1: about 14 s to the title screen and Mission Brief, about 20 s to the kiosk, with my polling in that. Round restarted with six unread rows. The Mission Brief reappearing is intended.

## 4. Other observations

- Defend-only E3 shell: the stage button reads "Open the queue", not "Open the inbox", and `e3-full` bridge steps that wait for `episode_e3_helpdesk_reset_defend_done` timed out on that shell (my replay of a full-episode bridge on a defend-only shell, not a game fault). The round itself completed, 1 of 1 task, 100.
- The E3 debrief concept panel still reads "Why the call and the prompts worked ... An unrequested sign-in prompt is the same trick from another angle..." after run c, where the call was refused and no prompts were sent. That is P6 m-4/m-5, still open (carried, not new).
- The E3 debrief for a refused call lists the two Gordon calls under the same heading "Gordon McLeish, Claims (calling from a mobile)". P5-12 trivial, still open (carried).

## 5. New findings

Counts: **0 blockers, 0 majors, 0 minors, 2 trivials.**

- **trivial T7-1.** E1 host chat: Adaeze's portrait is a closed-eyes frame in the screenshot (`p7a_e1_host_chat_bg.png`), while the same character art is open-eyed in E2. May be a blink or a talk-frame; check the E1 portrait if the closed look is permanent.
- **trivial T7-2.** E3 choice panel: the intro line ("You have Gordon's password...") is mid-grey on the near-black overlay, noticeably lower contrast than the labels below it, and the disabled "Start sending prompts" label is pale on a pale button. Legible, but weaker than the rest of the panel.

## 6. Screenshots

`P7_screenshots/`: `p7a_e4_stuck_pointer.png`, `p7a_e1_no_good_reason_note.png`, `p7a_e2_macro_attachment_note.png`, `p7a_e3_choice_1280x720.png`, `p7a_e3_outcome_1280x720.png`, `p7a_e3_outcome_1280x700.png`, `p7a_e1_host_chat_bg.png`, `p7a_e2_host_chat_bg.png`, `p7a_e3_host_chat_bg.png`, `p7a_e4_host_chat_bg.png`.
