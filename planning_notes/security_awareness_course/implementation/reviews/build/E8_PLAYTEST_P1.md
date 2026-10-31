# E8 "After the click" playtest P1 (Pat persona)

Run date 2026-10-29. Server :3001 keyless, headless (load average about 3, so timings are representative). Harness fast speed, so timings are in-game action time, not reading time.

**Which questions this answers:** plumbing (full run and defend-only run), plus one unexpected-behaviour check (page reload after the send). Persona run, not blind: the tester knew the scenario shape but did not read ink or the scenario ERB, and played from what was on screen. No VMs, no flags, no PINs.

**Persona (Pat, claims administrator, 50s):** reads every word, careful, one deliberate mistake (Trust on "Your password was changed", an account-takeover sign), picks Verify on a genuine colleague message, Report when unsure.

## Evidence

| Run | Game id | Session log |
| --- | --- | --- |
| Full: awareness_e8_after_the_click | 4752 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e8/e8-full-session.jsonl (381 commands) |
| Defend-only: awareness_e8_after_the_click_defend | 4763 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e8/e8-defend-session.jsonl (123 commands) |

Screenshots: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e8/ (f01 to f51 full run, d01 to d06 defend-only).

### verify-run.rb, full run (game 4752)

```
game            4752  (mission 138)
created         2026-10-29 18:23:37 UTC
last write      2026-10-29 18:31:19 UTC
played for      461s of wall clock
current room    "training_room"
unlocked rooms  1: training_room
unlocked objs   0: 
inventory       1: Notepad
NPCs met        1: anjali_rao
flags submitted 0: 
globals set     8: engine_tutorial_declined, episode_e8_after_the_click_defend_done, episode_e8_after_the_click_defend_pass, phish_takeover_victim_landed, se_intel_quayholt_ayaan_busy, se_intel_quayholt_ayaan_claims, se_intel_quayholt_it_desk, se_intel_quayholt_sso_migration
tasks           2 in objectivesState, 2 completed
  sort_the_signs                     "completed"  at 2026-10-29T18:30:55Z
  send_takeover_phish                "completed"  at 2026-10-29T18:26:58Z
tasks_completed 2
score           100
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
Cross-check the specifics above against the report.
```

### verify-run.rb, defend-only (game 4763)

```
game            4763  (mission 133)
created         2026-10-29 18:31:37 UTC
last write      2026-10-29 18:32:55 UTC
played for      79s of wall clock
current room    "training_room"
unlocked rooms  1: training_room
unlocked objs   0: 
inventory       1: Notepad
NPCs met        1: anjali_rao
flags submitted 0: 
globals set     3: engine_tutorial_declined, episode_e8_after_the_click_defend_defend_done, episode_e8_after_the_click_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  sort_the_signs                     "completed"  at 2026-10-29T18:32:43Z
tasks_completed 1
score           100
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
Cross-check the specifics above against the report.
```

Both show progress (tasks completed; this scenario has no rooms, objects or flags to unlock). The server record says score 100 for both runs while the in-game round score was 68% (full) and 97% (defend-only). mission.json says scoring is "completion", so this is probably intended; flagged only so nobody reads the 100 as the triage score.

### Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| none | n/a | The scenario has no PIN, key, code or flag. The only "facts" are the research notes (Ayaan's address, the IT desk address, the SSO move), and all were noted from the browser before the email was written | n/a | n/a |

## Timings (wall-clock of in-game actions)

| Run | Scripted action time | Estimated for Pat reading every word | Target |
| --- | --- | --- | --- |
| Full | 445 s (7 min 25 s), including a reload and resume at about 3 min 30 s | about 13 to 15 min | 15 min |
| Defend-only | 70 s | about 6 to 8 min | 8 min |

Per-stage scripted marks, full run: brief+research+write about 181 s (to the Send), reload at 212 s, triage finished at 427 s, Finish at 445 s. The estimate counts roughly 250 words in the brief and research, 150 in the compose hints and flip, 6 messages with about 80 words of feedback each, and about 600 words of debrief. Both fit the target, the full run only just.

## Reload check (after the send, before the defend round)

Reloaded with the kiosk on the "The click" (flip) screen, immediately after the reply came in.

- **Resumed correctly.** Resume overlay appeared, Resume then title screen, then the training room.
- Objectives: `send_takeover_phish` still complete, only `sort_the_signs` open. Globals kept (the four `se_intel_*` facts and `phish_takeover_victim_landed`).
- Reopening the kiosk went straight to stage "flip" with the sent email, the forged-From note and the sign-in prompt intact (`episode.stage:"flip"`, `done:["brief","osint","write"]`, `sentHeld:true`). Nothing lost, no second Send possible, no research repeated.
- Minor friction only: after a reload nothing reopens the kiosk or says "go back to the kiosk"; the player has to remember. The objective list ("Sort the signs that follow") is the only cue. See F9.
- Not tested: reload in the middle of the triage round. The triage brief itself warns "Closing or reloading before the end restarts this round from the first message", which is honest.

## Findings

Counts: **0 blockers, 4 majors, 14 minors.**

| # | Severity | Kind | What happened | Expected | Screenshot |
| --- | --- | --- | --- | --- | --- |
| F1 | major | content | Chose Trust on "Your password was changed". Feedback read "You chose Trust. Not this time. This one was a phish." Two lines later it says the address is really Quayholt's and it is a genuine confirmation. The result page says "One answer let an attacker straight in (trusting a phish email). That costs 15 points" and the debrief card is headed "built to look right". The message is a genuine system email triggered by the attacker, not a phish, and nothing says what the right call was (Report, or ring the service desk, which the message itself suggests). | Wording that matches the explanation: the email is real, the change is not yours, and that is the sign. Say the right action. Drop "phish" and "built to look right" for this item. | f40-msg2-trust.png, f48-review.png, f49-debrief.png |
| F2 | major | engine (mail composer sizing) | In the compose window the Ask dropdown and the whole "Red flags" meter sit below the visible area (panel scrolls 572 of 794 px inside a 1000 px viewport). Send is enabled before the meter or the Ask has been seen. "Your first Send is final" and the stage text says "The meter gives you hints before you send". Pat saw one clipped line of the meter and had to scroll the panel with a script to read the hints (the hint text there is good). | Meter and Ask visible without scrolling, or Send disabled until the meter has been in view, or the panel using the free viewport height. | f14-compose.png, f20-composed.png, f21-composed-scrolled.png |
| F3 | major | engine (triage layout) | In the triage reading pane the four verdict buttons are in a 2 by 2 grid cut off by the pane: Trust and Report show, Delete and Verify are below the fold (f34). After a verdict the feedback card ("Caught:", "Missed:", the IT Security reply, score) and the "Next message" button are also below the fold; the pane does not scroll to them. A player who does not scroll sees "Thanks for reporting" and no way forward except clicking the next list row. | Pane scrolls to the feedback and Next button after Confirm, and all four verdicts visible at once. | f34-msg1.png, f37-feedback1.png, f38-feedback1-bottom.png |
| F4 | major | engine plus content | The "What made you say that?" tick sheet lists 11 signs but shows 6 (scroll inside the dialog). On the takeover items the first six are the generic phishing tells (sender address, no name, no reason, attachment, hurry, link). The takeover-specific ones (Sent item you didn't send, Reset you didn't ask for, Ransom note, Asked to keep it secret) and "Nothing looks wrong" are the hidden five. On the sign-in prompt the list is short and relevant (5 items), so this only bites on the email items. A player who does not scroll ticks irrelevant generic tells and is told they missed the real sign. | Show the sign list for the item type (as the push item already does), or order the takeover signs first, or show all without scrolling. | f35-msg1-report.png, f44-verify-step.png |
| F5 | minor | engine | Result page: the five skill lines and the "Weakest skill" guidance are underneath the Finish footer, showing as ghost text. Not tested whether the area scrolls. | Skill breakdown readable above the button. | f48-review.png, d04-result.png |
| F6 | minor | content | The research page gives no cue that a block can be clicked to note it. The text "Add to notes" exists in the page but is not visible; only a dashed border hints. The stage text says "Open the browser and find out what you can" and "Close it when you have what you need". Pat found it by trying. Consequence of noting nothing untested (the compose hints and pretext options use the noted facts, so it may matter). | A visible "Click a card to note it" line, or the Add to notes control shown. Worth a blind run. | f04-browser.png, f05-block-click.png |
| F7 | minor | content | Jargon for a non-technical learner: "SSO" (in "Matches the SSO move he was told about"), "reply-to" ("unless you set a reply-to"), "MFA prompt" (a tick option and in feedback), "pretext", "tells", "flags" (the brief says "naming the flags is the rest"; the compose meter is also called "Red flags"). | Plain words or one-line glosses. | f22-sent.png, f42-msg3-fb.png |
| F8 | minor | content | Compose meter: nothing says what to aim for in the red-team seat. "Red flags 1" with a red X reads as a mistake count; at 0 the Send button looks fine. A player could send the urgent version with one flag and not know it mattered. Hints themselves are well written ("This pushes him to sign in quickly..."). | One line above the meter: "Fewer flags means harder to spot." | f21-composed-scrolled.png |
| F9 | minor | engine | After reload the kiosk does not reopen and nothing prompts a return to it. The objective list is the only cue. Also the resume overlay lists five "Load session" buttons from other games (existing engine behaviour, not E8 specific). | A short toast or Anjali line, or the kiosk reopening at its stage. | f26-after-reload.png |
| F10 | minor | content | The final screens do not restate the one lesson. Full: "You've seen both sides of a click: you took the red team's seat, then sat in the colleague's seat and sorted the signs ... so this episode is finished." Defend-only: "You've sorted the signs in the colleague's inbox and finished this episode." The lesson (report fast, change the password on the real site, leave the device as it is) is only in the debrief's "On Monday" box before it. Title "AFTER THE CLICK EPISODE DONE" reads like a label. | End card carries the one-sentence lesson. | f51-after-finish.png, d06-end.png |
| F11 | minor | content | Counter and totals call everything a phish: "Phish stopped for the team: 3" after reporting a ransom note and a genuine confirmation, and "kept 3 phish away from the rest of your team" in the debrief. Ransom note, forged sent item and the password confirmation are signs of takeover, not phish. | "Signs reported for the team". | f47-msg5-fb.png, f50-debrief-bottom.png |
| F12 | minor | content | A sender shown as the raw filename "readme_unlock (shared drive)" in the inbox list and "Web page Read README_UNLOCK.txt" as the subject. A bit odd for a non-technical reader and the chip "Web page" next to it sits in an inbox of emails. | Friendlier sender, e.g. "Shared drive". | f34-msg1.png |
| F13 | minor | engine (layout) | Brief, flip and debrief screens use a 570 px text column (brief) or full 1400 px lines (flip, debrief) with body text about 13 px. Brief leaves most of the screen empty; flip and debrief lines are very long and dense. The flip heading "Now it lands on you" renders in teal with a focus box, low contrast. Continue is below the fold on the flip page. | Narrower measure, larger body text, Continue visible. | f03-kiosk.png, f25-click-stage.png, f30-flip-bottom.png, d05-debrief.png |
| F14 | minor | engine (contrast) | Small grey text on blue: the verdict button sublabels ("This is real. I'd open it or act on it.") and the grey paragraph on the triage brief that explains Approve, Deny and Deny and report. That paragraph is the only place the push options are explained. | Larger, higher contrast. | f32-inbox.png, f34-msg1.png, f41-msg3-push.png |
| F15 | minor | content | Email addresses: in the compose picker and the flip email the address is in a sans UI font and readable. In the "Noted:" line under the research card the address is in the pixel font at small size and the dots run together ("ayaan.warsame@quayholt.example"). Same pixel font for the address in the triage brief. | Sans font for addresses throughout. | f05-block-click.png, f16-addr-picker.png |
| F16 | minor | content | Small contradictions in the red-team framing: the lead's email says "Nothing leaves this account", the kiosk brief says "Nothing you write leaves the game". All mail timestamps in the red-team half read 09:05 (brief, reply). The flip email says "just gone three" then times in the inbox run 08:05 to 15:08 in no obvious order (list order is by item, not by time). | One phrase for the scope; plausible times. | f13-brief-email.png, f24-reply.png |
| F17 | minor | content | Defend-only: Anjali says "You're covering a colleague's inbox" but does not say where; the objective "Sort the signs that follow" does not name the kiosk. It is obvious to someone who sees the kiosk but a "didn't know what to do" risk on a cold start. The inbox is then titled "Ayaan's inbox after the click" with no introduction to Ayaan. | Anjali or the objective points at the kiosk; name the colleague in the brief. | d01-start.png, d02-kiosk.png |
| F18 | minor | content | Debrief intro in defend-only says "Any you were caught out by are shown below" but the card shown is a correct Report with a partial score (80 of 100, secrecy not ticked), so it is a "look for" note, not a catch-out. Fine, just the wording. | "Anything you can take away is shown below." | d05-debrief.png |

## "Didn't know what to do" moments

| Where | How long (estimated for Pat) | What was tried | What unstuck |
| --- | --- | --- | --- |
| Research browser | 10 to 20 s | Read "find out what you can", looked for a Notes button; the dashed card looked clickable | Clicked the card (F6) |
| Compose, before Send | up to a minute | Choose from, subject, pretext; could not tell the meter existed (below the fold) | Scrolling the panel; a player who does not will send without hints (F2) |
| Triage, first message | 15 to 30 s | Only Trust and Report visible, a third button cut off | Scrolled the pane (F3) |
| Triage, after each verdict | 10 to 20 s | "Thanks for reporting" with no obvious next step | Scrolled to "Next message" (F3) |
| Tick sheet | 15 s | Six generic phishing signs; looked for a takeover one | Scrolled the list (F4) |
| After reload | 10 s | Back in the room, nothing prompting | Remembered the kiosk (F9) |
| Defend-only start | 10 s | Objective only | Saw the kiosk, tried it (F17) |

No stuck-for-minutes moment, no softlock. Every stage showed a clear next control once seen.

## Hard-to-read text

- Triage brief paragraph on sign-in prompts, and all verdict button sublabels: small grey on blue.
- Debrief and flip body text: about 13 px pixel font on 1400 px wide lines.
- "Noted:" line addresses in the pixel font.
- Flip heading in teal with a black focus box.
- Result page footer overlapping the skill lines.
- Wrong font for an address: only the "Noted:" and triage brief cases (F15). The From lines in compose, flip and the triage reading pane use a sans font and are fine.

## Five weakest lines

1. "You chose Trust. Not this time. This one was a phish." (a genuine system email)
2. "One answer let an attacker straight in (trusting a phish email). That costs 15 points off the round, on top of the item itself." (same item, punitive and wrong word)
3. "Their reply is on its way. This step ticks off when it arrives, in a moment." plus "unless you set a reply-to" (waiting text and jargon in the middle of the red-team win)
4. "You've seen both sides of a click: you took the red team's seat, then sat in the colleague's seat ... so this episode is finished." (end card says nothing the player will act on Monday)
5. "Right call is most of the score; naming the flags is the rest." (triage brief: "flags" is the compose meter's word and means something else here)

## What worked

- One clear lesson lands in the debrief: "On Monday: if you think you have clicked, signed in or spotted something odd ... report it straight away, change your password on the real site, and leave the device as it is." Larger type and a box.
- Feedback is fair on the genuine items: Reuben's message (Verify) and the maintenance notice (Trust) both say reporting or verifying is fine and score full. The line "after a run of real signs it is tempting to report everything" is a good touch.
- The IT Security replies after each correct report ("Leaving it as it was is exactly what helps") teach the device rule in context.
- Defend-only is short and self-contained: brief, one click to the inbox, six messages, debrief.
- The first Send being final, and a sent mail not being resendable after reload, held.
- Reload resumed at the right stage with nothing lost (see above).

## Teaching check (Pat, in her own words)

"Someone can be using your account after you click. The signs are things you didn't do: an email in your Sent folder, a password change, a sign-in prompt, a ransom note. Tell someone straight away, change the password on the real site, don't touch the device. If I'm unsure, reporting is fine." The red-team half gave her the "why it worked" (a forged real address plus a matching story), which landed. She would not have noticed that the password-changed email was genuine from the feedback alone (F1).

## Scores (1 to 5)

Fun 3, pacing 4, clarity of goals 3 (down because of the below-the-fold controls), openness of decisions 3 (verdicts are clear, red-team choices are nearly single-answer: one sender name, one address, one system), teaching 4.

## P1 outcomes (content fixer, 2026-10-29)

Scope: the content findings only. Engine findings F2 to F5 and readability were handled in the engine UX batch on main; the three new keys that batch added (`truth.kindLine`, `truth.missLabel`, the tick sheet listing the set's own tells first) are used below. Changes went into both the fragment (`awareness/e8/{attack,defend}.json`) and the full erb (`scenarios/awareness_e8_after_the_click/scenario.json.erb`), and the defend-only shell was regenerated with `gen_e8_e17_shells.py`. Checks rerun clean for E8: parity, rule-of-thumb, `--strict-social --no-graph --skip-ink` on both shells, dialoguelint, and `e8-full` on the keyless :3001 bridge (13/13). Ink structure unchanged (tagdiff), and no spoken host line was changed.

| # | Outcome | Detail |
| --- | --- | --- |
| F1 | **Fixed (content)** | `truth.kindLine` and `truth.missLabel` added to `e8_reset_confirm` and `e8_sent_invoice`; `kindLine` added to `e8_locked_files` (ransom note). On `e8_reset_confirm` the verdict line now reads "Not this time. This confirmation is genuine, but you did not change your password, so someone else did. Report it, or ring the service desk." (drops "This one was a phish"); the debrief card drops "built to look right" for the same line. With the single miss labelled, the result line now reads "One answer missed something that needed reporting (ignoring a password change you didn't make)" instead of "let an attacker straight in (trusting a phish email)". `e8_locked_files` has no `missLabel`: a `page` is not a critical-miss kind, so a label there would never render. |
| F2 | Engine | Compose window sizing. Engine UX batch (main). |
| F3 | Engine | Triage pane scroll / verdict grid. Engine UX batch (main). |
| F4 | Engine (content part resolved) | Tick sheet now lists the set's own tells first (engine UX batch). The set already declares the takeover tells in `channelTells`/`flagChips`/`skillNames`, so no content change was needed. |
| F5 | Engine | Result-page skill lines under the footer. Engine UX batch (main). |
| F6 | Engine | "Click a card to note it" affordance and the "find out what you can" stage text are osint-browser / episode-runner engine strings, not episode content. |
| F7 | **Partly fixed (content)** | "SSO" → "single sign-on" in the `pretextRelevant` pass line (the only jargon in episode-owned copy). "reply-to", "MFA prompt", "pretext", "tells", "flags" and the "Red flags" meter label are engine / shared-library strings (`mail-bridge.js`, `phish-rules.js`, `triage-flags.js`, `inbox-triage-minigame.js`); left as engine. |
| F8 | Engine | "Fewer flags means harder to spot" guidance above the compose meter is meter UI copy. |
| F9 | Engine | Kiosk not reopening after reload. |
| F10 | **Fixed (full) / generator (defend-only)** | Full end card now carries the lesson: "...If it ever happens to you, report it straight away, change your password on the real site, and leave the device as it is." The defend-only end card body is generator-held (`EPISODES['e8']['defend']['conclusion']` in `gen_e8_e17_shells.py`); not edited, because the content rules say do not touch generators. Recommend the orchestrator fold the same lesson sentence into that tuple. |
| F11 | Engine | "Phish stopped for the team" counter and "kept N phish away" debrief line are engine strings (`inbox-triage-minigame.js`, team-line helper). |
| F12 | **Fixed (content)** | `e8_locked_files`: sender url "README_UNLOCK (shared drive)" → "Shared drive" (shows lower-cased in the address font as the list-row sender), subject "Read README_UNLOCK.txt" → "Your files are locked". The "Web page" chip is the engine kind label; left. |
| F13 | Engine | Measure / body size / flip heading contrast / Continue below the fold. |
| F14 | Engine | Grey-on-blue sublabels and the push-options paragraph. |
| F15 | Engine | Address font selection for the "Noted:" and triage-brief addresses is engine rendering. |
| F16 | **Fixed (content)** | Takeover-sign times clustered after the ~15:00 click so the "after the click" framing holds: push 11:48 → 15:02, reset 11:52 → 15:05, ransom 14:30 → 15:40 (sent stays 15:08, matching the flip); the genuine colleague slip (09:21) and Saturday maintenance notice (08:05) are unrelated and unchanged. Scope phrasing aligned: the red-team lead email now says "Nothing you write leaves this exercise." (was "Nothing leaves this account"), echoing the scope note. Inbox list order is by item, not time (engine); left. |
| F17 | **Partly fixed (content)** | Defend-only kiosk brief now names the colleague and the kiosk: "A colleague, Ayaan, clicked... now his account is being used. You're covering his inbox at the kiosk." The top-level `scenario_brief` popup and the host's one welcome line are generator-held (`gen_e8_e17_shells.py`); left. The objective description already names the kiosk. |
| F18 | **Fixed (content)** | Defend-only debrief intro "Any you were caught out by are shown below" → "Anything worth another look is shown below" (the card can be a correct report). |

Five weakest lines: #1 (verdict "This one was a phish") and #2 (result "trusting a phish email") fixed by F1; #4 (full end card) fixed by F10; #3 ("their reply is on its way... unless you set a reply-to", `mail-bridge.js`) and #5 ("Right call is most of the score; naming the flags is the rest", `inbox-triage-minigame.js`) are engine strings and left. Nothing withdrawn.
