# E18 playtest P1 (Sam persona)

Run date 2026-10-29. Server :3001 keyless, headless (load average high, so harness timings are rough). Persona run, not blind: plumbing, the new attack-half console, the flip step, and one unexpected-behaviour check (page reload after the flip, before the defend set). Each run was driven through real clicks on visible controls (kiosk interact, browser links and lines, console buttons, verdict cards, chip checkbox, Confirm, Next); no globals set. No VMs, no flags, no PINs, so the earned-secrets table is empty. This report stays at template level: it names no credentials, tools or thresholds.

**Persona (Sam, operations clerk, non-technical, skims):** reads headings and the first line, clicks the obvious control, ticks few or no chips, takes a wrong answer on purpose in each defend set (Trust on a fake lockout notice in the full run, Trust on a fake sign-in alert in defend-only), Deletes one fake instead of reporting it, and Reports one genuine notice "just in case".

Not testable in this episode: "risky option in the sandbox". E18 has no sandbox; its attack half is the research browser and the guessing console, and Sam ran those straight through.

## Evidence

| Run | Game id | Started (UTC) | Session log | Screenshots |
| --- | --- | --- | --- | --- |
| E18 full | 4877 | 19:41:04 (kiosk open) | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e18/e18-full-session.jsonl (429 commands) | e18-01 to e18-32 |
| E18 defend-only | 4878 | 19:54:37 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e18/e18-defend-session.jsonl | e18d-01 to e18d-07 |

Screenshots are all in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e18/. verify-run output is saved beside them (verify-4877.txt, verify-4878.txt) and pasted below.

## Timings

Measured wall time is the harness clicking at speed with me reading the screen, so it is not what a learner takes. Estimate is reading about 250 words a minute while skimming, plus the clicks, from the amount of text each screen carries (about 2,200 words in the full run, about 1,700 in defend-only).

| Run | Measured | Estimated for Sam | Target |
| --- | --- | --- | --- |
| E18 full | 12 min 44 s wall, of which about 6 min 10 s was the reload recovery (bootstrap resume took about 100 s, then the resume overlay needed a manual Resume click); about 6 min 30 s of play | 12 to 13 min | 15 |
| E18 defend-only | 1 min 29 s | 7.5 to 8.5 min | 8 |

The full run fits. Defend-only sits on the 8-minute line: the debrief is the longest screen in the run (about 560 words over eight panels) and three screens of text come before the first message (F-E18-15).

## Reload check (after the flip, before the defend set)

| Reloaded at | Result |
| --- | --- |
| Defend card ("Open the inbox") after the flip Continue | PASS. Title screen, then the "Resume session?" overlay (expected, not a finding). After Resume the world returns, the kiosk reopens at step 5 Defend with steps 1 to 4 marked done; the research and the console are not replayed. Server state kept: the campaign task stayed complete (only handle_the_alerts was open) and the research notes and the "guess landed" global were still set. Screenshot e18-23-afterreload.png. |

Harness note, not a game finding: `bootstrap` with `resume:"resume"` ran for over 120 s and timed out on the cmd.sh wrapper; the overlay was still up and I clicked Resume by hand. The E19 round saw the same slow resume. Not tested: reload mid-inbox (the inbox brief says it restarts from message 1).

## Fonts and cut-off checks

- Sender and recipient addresses in the message headers (mail-from-address, mail-to), the message-row address, and the research browser's address bar and site URLs all compute to Source Sans 3 at 14 to 16px. Good.
- The page URL bar on the web-page message (`.tri-address`, "breach-check-now.example") computes to "GNF, monospace" at 18px, the pixel font. Same defect as F-E20-2, still open. See F-E18-1.
- Nothing under 13px except the step-number badge in the step strip (`.aw-step-num`, 12px). See F-E18-18.
- One address in the research browser is unreadable (dark on dark). See F-E18-3.
- Nothing cut off horizontally at 1400x1000. The guessing console opens scrolled down (F-E18-2).

## verify-run.rb output

Both show "progress recorded" and completed tasks. The game score of 100 is the completion score (mission.json says scoring is "completion"), not the 50% and 61% round scores. Both defend-set "pass" globals were set even though Sam scored 50% and 61%, so "pass" means "finished".

```
--- 4877 (full)
game            4877  (mission 165)
played for      799s of wall clock
globals set     9: engine_tutorial_declined, episode_e18_credential_attacks_at_scale_defend_done, episode_e18_credential_attacks_at_scale_defend_pass, guess_e18_landed, se_intel_ms_email_pattern, se_intel_ms_motto, se_intel_ms_place, se_intel_ms_projects, se_intel_ms_team_roster
tasks           2 in objectivesState, 2 completed
  run_the_campaign                   "completed"  at 2026-10-29T19:44:57Z
  handle_the_alerts                  "completed"  at 2026-10-29T19:53:18Z
tasks_completed 2
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
--- 4878 (defend-only)
game            4878  (mission 166)
played for      935s of wall clock
globals set     3: engine_tutorial_declined, episode_e18_credential_attacks_at_scale_defend_defend_done, episode_e18_credential_attacks_at_scale_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  handle_the_alerts                  "completed"  at 2026-10-29T19:55:49Z
tasks_completed 1
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

The research globals recorded were exactly the practice's staff roster, address pattern, project names, motto and street. The social-profile page's one post was a decoy and set nothing, which is right.

## Severity counts

| Episode | Blocker | Major | Minor | Nit |
| --- | --- | --- | --- | --- |
| E18 (full and defend-only together) | 0 | 5 | 14 | 2 |

## Findings

| ID | Sev | What happened | Expected | Screenshot / file | Type |
| --- | --- | --- | --- | --- | --- |
| F-E18-1 | Major | The URL bar on the fake "breach checker" web page renders in GNF, the pixel font, at 18px. Computed font-family is "GNF, monospace" on `BUTTON.tri-address`. The address rule is Source Sans 3. Same defect as F-E20-2, not fixed. | Source Sans 3 so look-alike letters are readable. | e18-m5a.png. Triage CSS for `.tri-address` (another rule beats `var(--se-font-address)`). | engine |
| F-E18-2 | Major | The guessing console opens already scrolled to the bottom (focus lands on its first button). Sam's first view is the middle of a list of rows all marked "waiting", with no title, no intro line and no close button in sight; the heading, the "made-up" note and the staff rows are above the fold. Sam has to scroll up to learn what the screen is. | Open at the top. | e18-16-guesser.png. Console minigame container focus/scroll on open. | engine |
| F-E18-3 | Major | In the research browser, the confirmation line after noting the address pattern ("Noted: Staff email addresses are built as ...") shows the address in a dark box with dark text (computed text colour rgb(31,36,48) on rgb(16,20,31)). The address, the one fact the line exists to confirm, cannot be read. Font is correct (Source Sans 3, 15px). | Light text on the dark box, or no box. | e18-14-contact.png. `.ob-address` inside `.ob-feedback`, osint-browser CSS. | engine |
| F-E18-4 | Major | The tell "Asked to keep it secret or to skip the normal process" is scored on messages that never ask for secrecy: the fake lockout (its text is a deadline threat), the fake breach checker (its text asks for a typed password). Result in both runs: "Weakest skills: Look-alike domains and Secrecy", "The tells most often missed: Secrecy (caught 0 of 2)". Sam, reading honestly, would not tick a chip about secrecy. Same defect as F-E19-1. | A weakest-skill line that names something the message did. Map the chip to the real tell (a deadline, or a request for a password) or drop it from these items. | e18-29-review.png, e18d-05-result.png. Chip `secrecy_or_bypass` in the triage `tells` for the lockout and breach-checker items, `scenario.json.erb` (both scenarios). | content |
| F-E18-5 | Major | The research step never says that a line on a page is clickable or that clicking notes it. The card says only "Open the browser and find out what you can about the people involved. Close it when you have what you need." The "Add to notes" hint is screen-reader-only; sighted users get dashed boxes and nothing else. Sam hesitated about 15 s, then clicked a name by guesswork. There is also no sign of how much is "enough" before closing. | One visible line in the browser or on the card: "Click a line to add it to your notes." Optionally a count of notes made. | e18-03-browser.png (no visible hint), e18-02. Research card text in `scenario.json.erb`, `ob-sr` hint in osint-browser-minigame.js. | content and engine |
| F-E18-6 | Minor | The feedback card says the same thing three times: "Your verdict: Report. Locked in.", "Thanks for reporting. That warns everyone else.", "You chose Report. Right call: reported. A report warns everyone else." Then, on fakes, an "IT Security: Thanks..." line says it again in defend-only. Same as F-E19-3. | One confirmation line. | e18-m4b output in session log (game 4877) | content and engine |
| F-E18-7 | Minor | Feedback and debrief cite "(row 1)" and "(row 3)" ("The provider's notice (row 1) tells you...", "The real sign-in alert (row 3)..."). The list rows are not numbered, so Sam cannot find row 3. | Name the message ("the Fenlow notice"). | e18-30-after.png. Tell notes in `scenario.json.erb`. | content |
| F-E18-8 | Minor | The "It's pushing me to hurry" chip is marked "Not a flag here. It wasn't one of this message's tells" on the fake sign-in alert whose own text says "To keep your access, review this sign-in now" and whose subject ends "review it now". Sam ticked it and was told it was wrong. | Count urgency as a tell for this item. | session log, game 4877, fake sign-in feedback | content |
| F-E18-9 | Minor | The Verify card reads "I would check this by ringing a number I already hold." It sits under sign-in alerts and a web page, where there is no number to ring; the brief says "a route you already trust, not the link in the message". Sam picked Verify on the genuine sign-in alert and had no idea what it would mean in practice. Same family as F-E20-1. | A Verify card worded for what is on screen ("I'd go to the site myself"). | e18-26-msg1.png | content and engine |
| F-E18-10 | Minor | In the message list a wrongly Trusted fake shows a green tick and "Trusted", the same as a correct one, so the list reads as if the lockout went well while the card said "Not this time". Same as F-E19-7. | Tick only for correct calls, or a neutral mark. | e18-m5a.png (row 2) | engine |
| F-E18-11 | Minor | The flip step ("Your inbox", step 4) shows two small cards that carry only "Folder Inbox / Subject / Time" and a one-line italic gloss. The subtitle says "Here are the first two that reached you", but there is no sender and no body, so Sam cannot read them as alerts and has nothing to do except Continue. The very next step (Defend) then opens with "Open the inbox" and an almost identical line, so the strip has two steps that both mean "your inbox". The first paragraph uses "sweep" and "the other end", and the page heading takes the programmatic focus box. | Either show the two alerts as real messages or drop the cards; one inbox step, not two. | e18-20-after.png. Flip copy in `scenario.json.erb` (flipGuessIntro, intro at about line 430). | content |
| F-E18-12 | Minor | Jargon Sam did not know: "sweep" (heading "After the sweep: your alerts", flip text, feedback), "rig" ("Switch the rig off"), "guesser", "campaign", "spray". Sam read "the rig" as a machine in the room. | Plain words: "stop the test", "the password test", "the attack". | e18-18-ran.png, e18-24-triage-brief | content |
| F-E18-13 | Minor | Console status words are loose. Staff and word rows say "found" (Sam read it as "password cracked"); the passphrase row sits at "still being tried" forever instead of "not on any list" or "did not work"; the count row "3 of 5 accounts opened" is tagged "opens the account" in red, which reads as an instruction. Accounts are only a count and rows are masked, which is right, but the screen never says which kind of password opened and why until the flip paragraph. | Distinct words ("collected", "opened", "did not open"), and settle the last row. | e18-18-ran.png | content |
| F-E18-14 | Minor | Technique level. The console lists its made-up candidate passwords in the clear, and the section text says they are "built from the practice's own website words plus the season and the year"; the debrief repeats it ("a company word, a project name, a season and a year"). For a clerk that is the lesson and it is also standard awareness content, but together it is a one-line recipe on screen. No account list, rates or counts of attempts appear, and rows for reuse are masked. For the owner to judge, not a defect. | Keep as is, or say "predictable words and a year" without showing built strings. | e18-16-guesser.png | content (owner call) |
| F-E18-15 | Minor | Defend-only has three text screens before the first message: the episode brief (64 words), the Defend card (51 words) and the inbox brief (89 words, with the four verdict explainers). All three say "never type a password to unlock or check". The brief and the inbox brief also say "a campaign has swept the practice" and "the sweep" to a player who never saw a campaign; "spray" is first explained in the debrief. | Two screens at most; say "a password-guessing attack" once. | e18d-01-brief.png, e18d-02-defend.png, e18d-03-brief.png | content |
| F-E18-16 | Minor | The debrief is a stack of about eight panels (what happened, spraying, stuffing, the one habit, what the practice does, the habit to keep, the Monday box, how to report). "The one habit" and "The habit to keep" both sit in the stack, and the second is generic ("move money, grant access, sign in or read back a code"), not about passwords. The Monday box is about 65 words. | One headline habit, the rest folded. | e18-31-debrief-bottom.png | content |
| F-E18-17 | Minor | In the research browser, clicking a colleague's address line gives "Nothing here you can use." while the page's own Contact line gives the address pattern. The social-profile page offers a single post (a project mention) that also gives "Nothing here you can use." Sam read it as "I did it wrong" and clicked the same lines twice. | Let the first address line note the pattern, or word the dead-end gently ("not needed"). | e18-06-projects.png, e18-11.png | content |
| F-E18-18 | Minor | The step-number badge in the step strip (`.aw-step-num`) is 12px. Rule is nothing under 13px. | 13px or more. | e18-20-after.png | engine |
| F-E18-19 | Minor | "Caught:" and "Missed:" lines bury the reason in a bracketed sentence of 25 to 35 words ("The address is merrin-sallow.example, a hyphen added to the real merrinsallow.example. A real notice from the practice's provider does not come from a changed address."). Skimmers read the label and skip the bracket. Same as F-E19-4. | Short tell, then one plain sentence. | session log, game 4878 | content |
| F-E18-20 | Nit | The doubled defend-only done global (`..._defend_defend_done`) as in E8, E19, E20. Harmless. | n/a | verify-4878.txt | engine |
| F-E18-21 | Nit | The post-reload title screen lists "Load session #1 to #6" (other games) beside Resume. Expected engine behaviour; noting it as in earlier rounds. | n/a | e18-22b-resume.png | engine |

## Host lines over 30 words

Ama Owusu (the host) never speaks in the kiosk flow, and Sam did not talk to her, as in earlier rounds. Her ink in both scenarios has no line over 30 words. The on-screen text that runs long, counted from the scenario:

| Where | Words |
| --- | --- |
| Full episode brief | 98 |
| Inbox brief (both scenarios) | 89 |
| Defend-only episode brief | 64 |
| Defend-only Defend card | 51 |
| Flip defender line | 51 |
| Debrief "habit to keep" | 50 |
| Debrief "what the practice does" | 48 |
| Flip guess intro | 38 |

## Did Sam understand the console, and why it worked?

Mostly, and only at the end. The console is a stack of rows that go from "waiting" to a status. Sam understood "one password, tried once on every account" from the section line, and "3 of 5 accounts opened" from the count row. The rows about reuse landed well: two opened, and the wiki login "used nowhere else" did not work, which is the clearest single moment in the attack half. What the screen does not do is say why the three opened. That came from the flip paragraph ("One password off the website, tried once across everyone, opened the predictable accounts. No clever cracking, just reuse and words anyone could read") and the debrief. The console itself taught no working technique beyond the clear candidate strings (F-E18-14); there is no tool name, no list to copy, and no rate or count of attempts.

## "Didn't know what to do" moments

1. Research browser, first screen (about 15 s). No visible instruction that lines can be clicked, and no sign of when to stop (F-E18-5).
2. Console first view (about 10 s). The screen opened mid-list, with no heading (F-E18-2).
3. Flip step. Two cards with no readable content and one button (F-E18-11).
4. Verify on the genuine sign-in alert. Sam did not know what "ringing a number" meant here (F-E18-9).

The inbox brief, the four cards and the Confirm step were clear. Sam skipped the chip step with no ticks (allowed) and was told the tells missed, which worked as the place Sam actually learned the look-alike address.

## Five weakest lines

1. "Weakest skills: Look-alike domains and Secrecy (caught 0 of 2 each)." (secrecy was never in the messages)
2. "Open the browser and find out what you can about the people involved. Close it when you have what you need." (no instruction on how)
3. "Switch the rig off"
4. "Here are the first two that reached you." (the cards show only folder, subject and time)
5. "You chose Report. Right call: reported. A report warns everyone else." (third repeat; the same feedback also points to "(row 1)")

## Flip step and defend set

- Flip: the strip label "Your inbox" matches the heading "Now it's your inbox", but the subtitle promises messages and delivers two empty cards. The flip paragraph itself is the best summary in the episode and Sam could say it back (F-E18-11).
- Defend set: six messages, three genuine and three fake. Sam's wrong picks (Trust on the lockout fake in the full run, Trust on the sign-in fake in defend-only, Delete on the fake checker) each got a sentence on what would have happened ("hand your password straight to whoever...") and the score landed at 50% and 61% with "worth practising" and "getting there" labels that read as fair. The one-trust-penalty line ("One answer let an attacker straight in... costs 15 points") landed as a rule.
- Reporting a genuine notice got "Reported, and that's never wrong" and a note that a report on a real message costs a colleague a check. Sam found this balanced.
- Endings: "Credential attacks at scale episode done" and "Alerts handled" success screens both appeared, with Close and Return to missions.

## Lesson Sam left with

"If a message makes me sign in through its link, it's fake, and I shouldn't use a password that's a word off our own website or one I use elsewhere." That matches "the one habit" (a different password for every account, not a word off the website). The Monday box is clear. Sam does not recall the names "spraying" and "stuffing" but can describe both.

## Defend-only notes

- Same six messages and same feedback as the full run.
- The defend-only front matter is the heaviest part of the run (F-E18-15).
- The debrief still opens "What happened" and explains spraying and stuffing to a player who never saw them, which works, but the word "spray" appears in "The one habit" before it is defined for this player.

## Not tested

Mid-inbox reload, closing the browser or console without doing anything (whether the research or campaign task can be skipped or completes anyway), keyboard-only play, audio (keyless server), phone width, a talk with Ama.
