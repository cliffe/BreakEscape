# Playtest P6 part C: E3 helpdesk reset (full and defend-only), with the new MFA decision

Date 2026-10-27, main at 8f11b5d20 plus uncommitted work from other agents (3f39ca774, the C4 part two commit, landed at 18:02 during my runs, and `inbox-triage` engine files were modified in the tree). Keyless server :3001 only, headless Chromium (load average 27, so timings are inflated), Node 24, one browser at a time, a fresh game per run. No game files edited. Not a solvability run (no PINs or flags). Question answered: plumbing and learner experience of the new MFA beat, and the P5 E3 items.

Method note. I drove the real UI through a persistent harness session (clicks on the radios, Confirm, call menu, triage controls), reading the screen text after each step. The research and the scripted part of the call used the bridge's own lines (the bridge sets the pretext blanks directly), except run 1, where I picked the blanks through the real picker. The harness only sends synthetic key events, so real Tab and Space key use could not be tested (see keyboard section).

## Bridge result

`bridge-e3-full.jsonl` scored with `check-bridge.mjs`: **PASS, 21 of 21 evals** (game 4517, 38 s, log `scratchpad/aw-p6c/bridge.1.log`). The old MFA step still matches: it waits for the authenticator, checks `mode==='attacker'`, and presses Escape, which closes the overlay before a choice is made and so moves to the flip stage. It does not exercise the new decision at all, so a bridge that picks a timing and count and confirms would be worth adding ("bridge needs updating" in the sense of coverage, not a failing step).

## Runs and timings

Wall-clock from game creation to quit. These include my gaps between commands, so they are not human reading times.

| Run | Game | What I did | Wall-clock |
| --- | --- | --- | --- |
| Bridge | 4517 | scripted | 38 s |
| r1 | 4519 | full; all research, picker blanks, call landed; **reload at the mfa stage**; opened the phone, tested focus and Esc before choosing (this skipped the stage); defend as the bridge does (0%), debrief, Finish | 325 s |
| r2 | 4538 | full; no research, pushy lines, call refused (`walked_away`); stage skipped; defend, debrief, closed with Esc | 139 s |
| r3 | 4543 | full; call landed; **working hours + two or three** | 120 s |
| r4 | 4544 | full; call landed; **late evening + one after another (flood)** | 78 s |
| r5 | 4545 | full; call landed; early hours + a dozen, Esc after 2.4 s (mid playback) | 63 s |
| r6 | 4546 | full; call landed; **early hours + a dozen**, played to the approval | 55 s |
| r7 | 4547 | defend-only; real choices: Escalate, Ring back, Escalate, Deny and report; 97% | 145 s |

Reload (r1, mid-run, at the mfa stage): the game came back on the title screen, Space then showed the Mission Brief again (intended), the kiosk reopened on stage "mfa" with brief, osint and write done, and the call result (`leila_reset_granted`, intel globals) survived. Pass.

`verify-run.rb` for r1: VERDICT progress recorded, 2 of 2 tasks completed (place_vishing_call 17:59:32Z, work_service_desk_queue 18:02:24Z), score 100.

## The MFA decision

**Stage skipped on a call that did not land.** r2: pretext with nothing researched, two pushy lines and "Can you reset my password now?", then "ring back later". The call ended `walked_away`, and the stage strip showed "4 Prompts (skipped)". The flip page read "Nothing to replay this time" and the run went straight on to defend. Pass. The call menu in that run offered only the lines the card shows ("Honestly, skip the security questions...", "Can you reset my password now?"), so the P5-7 gating holds.

**Combinations tried** (time from Confirm to the outcome panel appearing, in the page):

| Timing and count | Cards shown | Collapse line | Time to approval | Outcome panel text (timing, count, defender note) |
| --- | --- | --- | --- | --- |
| Working hours (10:20) and two or three | 3 | none | 7.1 s | "At his desk and alert, Gordon almost reported it. He tapped Approve only because your service-desk call minutes earlier had him half-expecting IT to \"sort his sign-in\". In daylight, a prompt he didn't ask for is the obvious tell." / "A couple of prompts lean on your pretext and the hour more than on wearing him down." / defender note |
| Late evening (22:40) and one after another (30) | 4 | "…and 26 more prompts in the same burst." | 10.2 s | "Half-watching television, Gordon tapped Approve to clear the buzzing without really reading it. Off the clock, people stop treating prompts as work and just swipe them away." / "A flood is the loudest version, and the easiest for an alert target, or a rate limit, to catch." / defender note |
| Early hours (02:14) and a dozen (12) | 4 | "…and 8 more prompts in the same burst." (4 + 8 = 12) | 10.2 s | "Woken at 02:14, Gordon tapped Approve half-asleep to make his phone stop. Tired and off guard is exactly when a prompt gets waved through." / "A steady run of prompts turns it into a nuisance he wants gone, and one tap ends it." / defender note |

All three end in an approval, banner "The target tapped Approve. The attacker is now signed in — this is MFA fatigue.", well inside a minute. The "…and N more" line reads well and the arithmetic is right. Outcome text matches the timing and count chosen in all three. The defender note is the same in every combination: "Gordon's app could stop every version of this. Number matching makes a half-asleep tap useless, a prompt he didn't start is a report and not an Approve, and a rate limit caps the flood." It is the last line and reads as the takeaway, but see M-1 for whether the learner can see it.

Note: the option labels are "Two or three", "A dozen" and "One after another" (not "non-stop"); the data and the UI agree.

**Flip, debrief and concept panel.** The flip page has no concept panel; the concept panel ("Why the call and the prompts worked") is on the **debrief**, in the full run and in defend-only. Its second paragraph repeats the defender note's three controls in near-identical order and wording ("number matching means a half-asleep tap is not enough, a prompt you didn't start is one to report rather than approve, and a rate limit caps the flood"), so it is not word for word but is close (m-3). The flip page does not recap what the learner chose (timing, count).

**Keyboard, Esc, Close.**
- Radios and Confirm are native inputs and buttons, `tabIndex` 0, so real keyboard use should work; I could only test synthetic keys. Initial focus lands on `body` (the code tries to focus Confirm, which is disabled until both groups are chosen) rather than the first radio (t-2).
- Esc with a radio focused blurs it and does not close (the overlay treats inputs as text fields); a second Esc closes. Two presses for a first-time Esc (t-1).
- Esc or Close **before choosing**, or **mid-playback**, ends the stage as done: the strip shows "4 Prompts (done)", the flip page runs normally, and the kiosk does not offer the stage again (r1, r5). A learner who closes the overlay out of habit loses the beat with no way back (m-1).
- Close after the outcome (r3, r4, r6) returns to the flip page. Pass.

## P5 E3 items

| P5 item | Status | Evidence |
| --- | --- | --- |
| P5-1 Finish hidden on result | **fixed** | r7: `.tri-finish` at y 557, 57 px tall in a 1000 px viewport, `elementFromPoint` returns the button. |
| P5-2 "You trusted" names checked items | **fixed** | r7 Ring back on the real Gordon: grid shows "Checked by another route 1" and "You checked this real one by another route first, which is just as right". |
| P5-3 grid against false-alarm sentence | **fixed for what I could test** | r7 shows "Real callers handled right 1 of 1" with the checked item separate. I did not make a Report on the genuine caller, so the false-alarm sentence was not exercised. |
| P5-4 brief says a false alarm costs nothing | **fixed** | Brief now reads "Ringing back when you're unsure is always fine and never marked down, though a real caller does take a colleague's time to check." (full and defend-only). |
| P5-5 no-blame line contradicts the score | **changed by C4-2 during my runs** | r1 debrief ended "This was built to catch you under pressure, not to test how careful you are. The points only show where to look next time." Not counted. |
| P5-7 call menu offers hidden lines | **fixed** | r2: menu showed only the line on the card; r1: with all facts held, the menu matched the card. |
| P5-10 "now at -5" against panel 5 | **fixed** | r2: panel -30, "ASK REFUSED needs 0 or better, now at -30", "Last change: -10 for asking (reset password)". |
| P5-12 both Gordon calls share a heading | **still open (trivial)** | r7: the queue lists two identical "Gordon McLeish, Claims (calling from a mobile) Call Incoming call" rows. The "· Incoming call" suffix still appears on the feedback heading and not in the debrief. |
| P5-6, P5-13, P5-15 | not re-checked in E3 | no Report on a genuine call, no second kiosk visit, no learner line in the chat. |
| E3-11 MFA has no decision | **closed** (see above), with the new findings below. |
| E3-T length | unmeasured | not a timing run; the bridge took 38 s and my slowest manual full run 325 s. |

## Debrief question (PUZZLE_REVIEW_C1.md minor 1)

**The conclusion screen does not cut off the kiosk debrief.** In r2 the debrief was on screen with no `.success-screen-overlay` present, and the kiosk's `Finish` was available. Only after the learner dismissed the debrief (Finish in r1 and r7, Esc in r2) did the "Helpdesk reset episode done" success screen appear (under 0.5 s later), with Return to missions and Close. It is the success screen, not the credits overlay, and it is closable. The server task `work_service_desk_queue` is recorded at defend completion, but the client waits for the debrief to close before showing the end screen. Closed.

## Findings

Counts: **0 blockers, 2 majors, 5 minors, 6 trivials.**

### Major

**M-1. After Confirm the choice panel stays on screen and pushes the banner, the "…and N more" line and the outcome panel off the bottom, out of reach.** `.auth-choice` sets `display: flex`, which overrides the `hidden` attribute that `_confirmChoice` sets (computed: `hidden=true`, `display=flex`). The panel and the Confirm button (still enabled) remain above the phone. In a 1400x1000 viewport the outcome panel's top is at y 1314, the container has scroll height 1567 against 1000 client height with `overflow: visible`, and the page does not scroll (`scrollTo`, `scrollIntoView` and `scrollTop` all left it at 0). After the flood (r4) the screen shows two cards and nothing else: no approval banner, no collapse line, no outcome, no defender note. The takeaway of the stage is invisible, and on a shorter laptop screen it is worse. Closing with the overlay still works, so nobody is stuck, but the learner never reads the outcome. Evidence: `p6c_r3_outcome.png`, `p6c_r3_outcome_scrolled.png`, `p6c_r4_outcome.png`, `p6c_r6_outcome.png`; DOM probe in the session logs. Fix: `.auth-choice[hidden] { display: none }` (and the same for `.auth-controls`), then re-check the outcome sits within the viewport or make the root scroll.

**M-2. The choice labels and legends are almost unreadable.** `.auth-choice-opt-label` and `.auth-choice-legend` use `--auth-ink` (rgb 31,41,51, dark slate) on the game's dark overlay background (the root has a transparent background). "When do you send them?", "During working hours" and the other five options are dark text on near-black. The intro line above is a mid grey and readable. Evidence: `p6c_r1_mfa_choice_panel.png`, `p6c_r3_choice_selected.png`. A learner can only guess the labels, which is the whole decision. Fix: give the choice panel a light surface like `.auth-outcome` (which is readable because it has its own background) or use a light ink there.

### Minor

**m-1. Esc or Close before choosing, or during playback, silently skips the beat and marks the stage "(done)".** r1 (Esc before choosing) and r5 (Esc at 2.4 s). The learner never sees the decision's outcome and cannot reopen it. A confirm ("Leave without choosing?") as the kiosk's Close has, or keeping the stage open until a choice is confirmed, would avoid a habitual Esc costing the lesson.

**m-2. The refused-call debrief says Leila accepted answers she never accepted.** r2, after a call where she refused everything: "Both answers she accepted, the manager's name and the staff reference, were on the public site." The call debrief text is the same for every outcome. Evidence: `p6c_r2_refused_call_debrief.png`.

**m-3. The outcome panel's defender note and the debrief concept panel say the same three things in the same order.** "Number matching makes a half-asleep tap useless, a prompt he didn't start is a report and not an Approve, and a rate limit caps the flood" against "number matching means a half-asleep tap is not enough, a prompt you didn't start is one to report rather than approve, and a rate limit caps the flood". The learner reads both within a minute or two. Vary the second, or let the concept panel carry the "why" and the outcome panel only the pointer.

**m-4. The debrief concept panel reads oddly in defend-only.** r7: "Why the call and the prompts worked ... The sign-in prompts that followed are the same attack from another angle. The attacker chooses two things, when to send the prompts and how many". A defend-only learner never made the call or sent any prompt. A defend-only variant that says "why the call and the prompt got through" would fit the learner's actual round (the fragment is shared with the full erb by design, so this needs a deliberate difference in the parity allow-list).

**m-5. The same concept panel assumes prompts were sent after a skipped stage.** r2 (call refused, stage skipped): the debrief still says "The sign-in prompts that followed ... The attacker chooses two things ...". Same fix family as m-4.

### Trivial

- **t-1.** Esc while a radio has focus only blurs it; a second press closes (r1).
- **t-2.** Initial focus is on `body`, not the first radio (Confirm is disabled at that moment, so its focus call fails silently).
- **t-3.** The banner reads "this is MFA fatigue" after three prompts at 10:20; with the daytime and few-prompt option it is a stretch. The defender note's "half-asleep tap" line also follows the daytime outcome ("At his desk and alert").
- **t-4.** "imposter" in the concept panel against "impostor" elsewhere.
- **t-5.** The queue still lists the two Gordon calls under one identical heading (P5-12/N12).
- **t-6.** The flip page does not recap the learner's timing and count.

## What worked

- The beat is short: 7 to 10 s between Confirm and the approval in all three combinations.
- Every combination lands, and each outcome text names the condition that made it work (daytime: the pretext priming; evening: off the clock; night: half-asleep).
- The collapse ("…and 26 more", "…and 8 more") shows four cards and the arithmetic is right.
- The skip on a call that did not land is clean and says so ("Prompts (skipped)", "Nothing to replay this time").
- Reload at the mfa stage resumes on the same stage with the call state intact.
- Defend-only plays cleanly: brief, four items with real choices, per-item feedback including the "IT Security" reply, a visible Finish, a result grid with "Checked by another route", a debrief with the Monday card and report box, and no success screen before the debrief is dismissed.

## Files

Session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p6c/` (`bridge.1.log`, `r1.log` to `r7.log`, driver scripts `sess.sh`, `lines.sh`, `mfa.sh`). Screenshots: `P6_screenshots/p6c_*.png`.
