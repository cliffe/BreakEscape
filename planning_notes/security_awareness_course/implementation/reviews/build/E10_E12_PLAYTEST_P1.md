# E10 and E12 playtest P1 (Sam persona)

Run date 2026-10-29. Server :3001 keyless, headless. Machine load average was 20 to 25 throughout, so harness timings are rough. Persona run, not blind: scenario files were opened only to diagnose a symptom after it showed on screen (E10 builder card, "Leila" mention). Each run was driven through real clicks on the visible controls (kiosk interact, mg clickText, DOM clicks on visible controls where `mg clickText` cannot reach them: fact blocks, `.mail-row`, `.tri-verdict`, chip checkboxes, builder option buttons). No globals set by hand. No VMs, flags or PINs, so the earned-secrets table is empty. E10 stays at template level: the fake check is described as key presses in words and no command is shown anywhere.

**Persona (Sam, operations clerk, 30s):** non-technical, skims, picks the first or most tempting option, takes the risky option on purpose at least once per episode, gets a defend item wrong, and reports when unsure.

Harness notes (not game findings):
- `bootstrap resume:"resume"` hangs on the "Resume session?" overlay after a reload (loops on "close title-screen", times out after about 6 minutes under this load). Both reloads were finished by clicking the visible "Resume" button through the DOM, then reopening the kiosk. That cost about 6 minutes in E10 full and 3 in E12 full.
- `converse` re-picks the same option when the option list never shrinks. My first E12 full run (game 4901, 71 commands) was discarded: `converse` chose "sample box for Catherine" four times in a row, the chat closed itself, and the call debrief opened under the open chat. The rerun (game 4939) used `mg chooseIndex` one pick at a time. The discarded run is only used for the repeat-pick note in F-E12-8.

## Evidence

| Run | Game id | Started (UTC) | Session log | Screenshots |
| --- | --- | --- | --- | --- |
| E10 full (awareness_e10_downloads_and_fake_checks) | 4899 | 19:54 | scratchpad/aw2/pt-e10-e12/e10-full-session.jsonl (287 commands) | e10-01 to e10-31 |
| E10 defend-only (_defend) | 4900 | 20:09 | e10-defend-session.jsonl (93 commands) | d10-01 to d10-03 |
| E12 full (awareness_e12_visitor_tailgater) | 4939 | 20:13 | e12-full-session2.jsonl (279 commands) | e12-01 to e12-22 |
| E12 full, discarded | 4901 | 19:5x | e12-full-session.jsonl (71 commands) | none kept |
| E12 defend-only (_defend) | 4902 | 20:24 | e12-defend-session.jsonl (97 commands) | none (text only) |
| E10 host check (Niamh only) | 4956 | 20:27 | e10-host-session.jsonl | none |

All under /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e10-e12/.

## Timings

Measured time is the harness at speed plus my screenshots and reading, and includes the reload stalls above. Estimate is Sam skimming at about 250 words a minute plus clicks, from the amount of text on each screen (the defend screens carry 60 to 100 words of feedback per item, so 40 to 70 s each).

| Run | Measured | Estimated for Sam | Target |
| --- | --- | --- | --- |
| E10 full | 14 min 29 s (6 min of that is the reload stall) | 16 to 18 min | 15 |
| E10 defend-only | 1 min 8 s | 8 to 9 min | 8 |
| E12 full | 10 min 32 s (attack half 2 min 9 s; about 3 min reload stall) | 14 to 15 min | 15 |
| E12 defend-only | 1 min 7 s | 8 to 9 min | 8 |

E10 full runs 1 to 3 minutes over: the Build step (four option groups, Score, re-pick, Score again), the mail composer, the 7-page defend set and a ten-panel debrief all carry full reading. E12's world-room pretext is not an overrun: the Approach button puts Sam straight into the lobby chat (no walk), and the chat is 5 to 8 picks with a short coaching line each, about 3 minutes. Both defend-only runs spend four screens before the first item (brief, Defend card, queue brief with legend, Start); same finding as F-E19-6.

## Reload check (after the flip, before the defend set)

| Episode | Reloaded at | Result |
| --- | --- | --- |
| E10 | Defend card ("Open the pages") after the Your message Continue | PASS. Resume overlay appeared (expected), world returned, kiosk reopened on the Defend card with stages 1 to 5 shown "(done)". Research, Build and Write were not replayed; task `work_browser_morning` still open; `phish_order_colleague_landed`, both `se_intel_*` globals and `landing_fake_check_fernside_built` survived (verify-run). Screenshot e10-17-afterreload2.png. |
| E12 | Defend card ("Open the queue") after the Continue on "The door stayed shut" | PASS. Same behaviour. Kiosk reopened on the "Take the calls" card with stages 1 to 4 "(done)", task `run_front_desk_pretext` ticked, `delphine_*` globals and the three `se_intel_merrin_*` globals kept. The pretext chat was not replayed. |

Not tested: reload mid-queue (the queue brief itself says it restarts from the first message).

## Fonts and cut-off checks

- Addresses in Source Sans 3 (address font): browser address bar, page URL bars (`https://orders.fernside.example/...`), mail row subjects, mail To and From headers, triage row titles. All correct.
- One miss: the compose chip "sender's address: operations@quayholt.example" (`mail-blank minigame-button`, E10 Write step) computes to GNF 15px, the pixel font. The native dropdown options for the From select also list GNF first. See F-E10-9.
- Nothing under 13px in learner text. Under 13px: the `[SPACE]` hint inside the Skip button in the E12 chat (11px, GNF), task and aim icon glyphs (10 to 12px), and the world tooltip "A touch-screen training kiosk..." (10px Press Start 2P, hover label). Nit only.
- No horizontal scroll at 1400x1000. Debriefs scroll and read fine.

## Verify-run output

```
--- 4899 (E10 full)
game            4899  (mission 159)
played for      923s of wall clock
globals set     8: engine_tutorial_declined, episode_e10_downloads_and_fake_checks_defend_done, episode_e10_downloads_and_fake_checks_defend_pass, landing_fake_check_fernside_built, landing_fake_check_fernside_domain, phish_order_colleague_landed, se_intel_fernside_small_site, se_intel_quayholt_fernside_portal
tasks           2 in objectivesState, 2 completed
  build_and_send_page                "completed"  at 2026-10-29T19:57:29Z
  work_browser_morning               "completed"  at 2026-10-29T20:08:37Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
--- 4900 (E10 defend-only)
game            4900  (mission 161)
globals set     3: engine_tutorial_declined, episode_e10_downloads_and_fake_checks_defend_defend_done, episode_e10_downloads_and_fake_checks_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  work_browser_morning               "completed"  at 2026-10-29T20:10:37Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4939 (E12 full)
game            4939  (mission 164)
played for      665s of wall clock
unlocked rooms  2: training_room, lobby
NPCs met        2: lorna_easton, delphine_reception
globals set     12: delphine_alerted, delphine_forced, delphine_latched, delphine_refusing, delphine_wary, engine_tutorial_declined, episode_e12_visitor_tailgater_defend_done, episode_e12_visitor_tailgater_defend_pass, pretext_merrin_front_desk_outcome, se_intel_merrin_badge_door, se_intel_merrin_courier_routine, se_intel_merrin_partner_travel
tasks           2 in objectivesState, 2 completed
  work_reception_desk                "completed"  at 2026-10-29T20:24:06Z
  run_front_desk_pretext             "completed"  at 2026-10-29T20:15:27Z
score           100
VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
--- 4902 (E12 defend-only)
game            4902  (mission 163)
globals set     3: engine_tutorial_declined, episode_e12_visitor_tailgater_defend_defend_done, episode_e12_visitor_tailgater_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  work_reception_desk                "completed"  at 2026-10-29T20:25:45Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

Both full runs end on the episode-done success screen ("Downloads and fake checks episode done", "Visitor and tailgater episode done"). Full verify-run text is in verify-4899.txt, verify-4900.txt, verify-4939.txt and verify-4902.txt in the scratchpad folder.

## Severity counts

| Episode | Blocker | Major | Minor | Nit |
| --- | --- | --- | --- | --- |
| E10 | 0 | 2 | 9 | 3 |
| E12 | 0 | 3 | 7 | 3 |

## Findings, E10 "Downloads and fake checks"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E10-1 | Major | Build step, "What Leo is expecting" card still reads "You haven't found out what Leo would expect to see yet." Sam had clicked the Fernside portal block in the research browser ("Noted: Quayholt orders its catering through Fernside Catering's order portal...") and `se_intel_quayholt_fernside_portal` was set. The card never lists it, in either the Build or Score view. The landing page `fake_check_fernside` has no `pretext.facts`, which `_pretextCard()` reads (landing-page-builder-minigame.js around line 556). | The noted portal fact, bookmarked and operations@ reminders, shown on the card. Sam did the research and the build screen says nothing was found. | e10-04-builder.png, e10-05-score1.png | content (add `pretext.facts` to the landing page in scenario.json.erb) |
| F-E10-2 | Major | The third verdict, "Go the trusted way", is never the right call in the whole deck (5 of 7 pages want Close and report, 2 want Carry on). It is the engine's Delete verdict relabelled, so wording leaks: "You chose Go the trusted way. Safe, but not reported. Deleting protects you; reporting warns everyone else." on a page nobody deleted, then in the debrief "You chose Delete." and "(3 reported, 1 deleted)", "Reported rather than just deleted: 3 of 5". Its card text is circular ("Don't use this page; reach what I need the trusted way.") and its icon is a red X. Sam picked it on the "your computer has been locked, call us" page because it sounded like "get help the proper way", scored 70, and still does not know what the trusted way is. | Either a page where the trusted way is the full-mark answer (the extension page: "get a PDF tool from Quayholt Apps") or a card that says what it means ("Skip it and use Quayholt Apps, a bookmark, or the service desk number you already hold"). Feedback worded for the verdict Sam chose. | e10-18-pagesbrief.png, e10-26-p5fb.png, e10-29-debrief.png | content and engine |
| F-E10-3 | Minor | Research step is vague. "Open the browser and find out what you can about the people involved. Close it when you have what you need." The two facts are dashed boxes with no label or hover cue that they are clickable (the word "Add to notes" sits as dim text under the page). "Our people" lists one person (Leo) with a name block that is also clickable. Sam clicked Leo and both blocks only because the earlier episodes had taught it; a first-time player sees plain text. | A one-line cue ("Click a sentence to add it to your notes") and the real aim ("find which supplier site they order from"). | e10-02-research.png, e10-03-browser.png | content |
| F-E10-4 | Minor | The builder's mock page prints the option label as the page body: "A clumsy demand to act on your computer" or "A smooth, routine-looking accessibility check" sits where the fake page's instructions would be. The attacker never sees what the page asks Leo to do. The defender's page 1 shows "1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter." Sam could not connect the page he built to the page he later reports, apart from the closing paragraph. "What did this page copy?" is a dead button on the "Your message" panel (and on the defend page and the tick-box page); its answer ("A hidden command that would run a program on your computer") is in the builder DOM only. | Preview shows the steps in words (still no command), and the reveal button works or looks like a label. | e10-07-score2.png, e10-13-yourmsg.png | content and engine |
| F-E10-5 | Minor | Build option labels use insider words: "Fernside's own order portal (orders.fernside.example), broken into", "Why the check must fit the visit", "What is this?". Sam read "broken into" as "I break into the portal?" and had no idea the site stays genuine until the IT Security feedback two screens later ("attackers got into their site, it is not a fake"). Score card says "This page has 1 giveaway: the step it asks you to run" with no step visible. | Plain labels ("The real Fernside order page, after someone has broken into it"), and name the step ("it tells Leo to press keys and paste"). | e10-04-builder.png, e10-06-score1b.png | content |
| F-E10-6 | Minor | CAPTCHA page ("Order portal sign-in / Confirm you are not a robot to continue / I am not a robot / Continue") looks tickable. The box is a `span role="img"` ("Tick box, empty") and Continue does nothing, so Sam clicked both and saw no reaction before choosing Carry on. The feedback then explains it well ("tick the box and carry on"), but cites "The tell on row 1" (row of what?). | Inert controls styled so they look inert, or a tick that ticks; "the tell on row 1" replaced by "the first page". | e10-23-p2.png, e10-24-p2fb.png | content and engine |
| F-E10-7 | Minor | Result "Weakest skill" advice does not match the skill. Extension skill (Sam picked Carry on) and the pdf.exe skill (E10 defend-only) both end with "Read the address bar before you sign in to any page, and if you are not sure, ask your IT or security team." Neither page was about signing in. | Skill-specific close, or no close line. | e10-28-result.png (and defend-only result text) | content |
| F-E10-8 | Minor | Feedback card repeats itself and runs long. "Your verdict: Close and report. Locked in." then "Thanks for reporting. That warns everyone else." then "You chose Close and report. Right call: reported. A report warns everyone else." (same as F-E19-3). "Caught:" brackets run 60 to 75 words ("A real check happens on the page... it has been broken into."). IT Security reply on page 1 is 32 words. Email vocabulary on web pages: "Next message", "this message's tells", "Phish stopped for the team", "Phish caught: 4 of 5", "the row 1". | One confirmation line, bracket cut to a sentence, web-page words. | e10-22-p1fb.png | content and engine |
| F-E10-9 | Minor | Address font: the compose chip "sender's address: operations@quayholt.example" and the From dropdown options render in GNF (pixel font), not Source Sans 3. | Address font on every address. | e10-11-compose2.png | engine |
| F-E10-10 | Minor | Debrief runs to about ten panels (round score, per-page cards, tell most missed, trusted ones, Where software comes from, Read the address, The four tricks, If you slipped, The one rule, The habit to keep, On Monday, How to report here, closing line). "The four tricks" lists four while the deck has five tell types (the .pdf.exe download is missing). It never mentions what Sam built or whether Leo fell for it. Brief paragraph on the defend card and queue brief is about 95 words. "You trusted the real ones: 'From a bookmark: Fernside Catering order portal'" uses the row subtitle as a name. | One lesson up top, the rest folded. | e10-29-debrief.png, e10-30-debrief-bottom.png | content |
| F-E10-11 | Minor | Niamh (host) says "Leila from the service desk will show you the three habits, then the kiosk takes you through a morning of them." Sam never met Leila and no panel is labelled "three habits"; the debrief has four tricks and a one rule. | Name the panel, or drop the promise. | none | content |
| F-E10-12 | Nit | Flip heading is just "Defend", opener "Now you swap seats. The kiosk has a morning of web pages open" ("the kiosk" again, see F-E20-7). The start of scoring is not flagged on that card. The stage before it is a clear turn ("Now it lands on a colleague"), so Sam did notice the swap. | "Your turn on the other side", no "kiosk". | e10-15-flip.png | content |
| F-E10-13 | Nit | Reply from Leo: "Thanks, I'll put the order in now." Fine, but the stage heading "Now it lands on a colleague" and the line "Something about this one did not add up." (bullet under the page picture) are vague. | Name the giveaway. | e10-13-yourmsg.png | content |
| F-E10-14 | Nit | Mail compose offers one sender name and one sender address once research is done (one "Quayholt Operations", one "operations@quayholt.example"), so those two blanks are not choices. The real choice is the Pretext dropdown (three options; the first, urgent one scores a red flag). | n/a | e10-10-compose.png | content |

Things Sam did understand (E10):
- The fake check. The defend page 1 ("1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter." under "Verify you are human") read as strange straight away; Sam chose Close and report and ticked the first chip ("A page telling you to paste or run something to prove you are human"). The chip text carries the lesson well.
- The CAPTCHA tick box page: Sam chose Carry on and the feedback ("A genuine check only asks you to tick a box or pick pictures on the page") reads cleanly.
- The "browser's own bar" update versus the page-offered update is a good contrast, though Sam had to take "this one is the browser itself" on trust (both say "An update is ready").
- The flip is signposted by the stage strip and by the closing paragraph of the attack half.

Five weakest lines, E10:

1. "You haven't found out what Leo would expect to see yet." (after Sam noted the fact)
2. "You chose Go the trusted way. Safe, but not reported. Deleting protects you; reporting warns everyone else." (nothing was deleted)
3. "Weakest skill: ... Read the address bar before you sign in to any page, and if you are not sure, ask your IT or security team." (extension and .pdf.exe pages)
4. "Go the trusted way: Don't use this page; reach what I need the trusted way." (circular)
5. "Fernside's own order portal (orders.fernside.example), broken into" (builder option label)

"Didn't know what to do" moments (E10):
- Research: about 15 seconds, no sign that the dashed boxes are buttons or what "what you need" is.
- Build, first look: about 20 seconds on "What is this? (Why the check must fit the visit)", a button that expands a note, not an action.
- Defend page 4 ("Your computer has been locked"): about 10 seconds choosing between Report and Go the trusted way.
- The tick box and Continue on the CAPTCHA page: Sam clicked both, nothing happened, then moved on.

Lesson Sam left with (E10): "A web page that tells me to press keys or paste something to prove I'm human is fake, even on a site I use. Close it and tell security. A tick box is fine." That matches the rule. What Sam did not leave with: what "the trusted way" is, or that the supplier's own page was real but compromised (it landed only because the IT line said so).

## Findings, E12 "Visitor and tailgater"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E12-1 | Major | Genuine visitors are marked wrong for the natural answer. Expected client (on the list, "happy to sign in and wait"): Let them in gets a red X, "This caller was genuine, but you did what they asked without checking. An impostor sounds just the same, so ring back on the number you hold first. The right call was Check first or Report.", 70 of 100. The colleague who locked their screen and "waits where they were put" gets the same red X for Let them in, with the card text saying "nothing to act on", and Report on the same card scores 100. Neither Sam nor the screen offers a list to check, and "ring back on the number you hold" is the email lesson (nobody is on a phone). Result: "Real callers handled right: 1 of 3" for a Sam who let two genuine people in. Same in defend-only (Report on the genuine colleague scores 100). | Let them in on a genuine, on-the-list visitor is a full-mark answer once Sam has had a way to see the list (or the feedback says the list was visible and "you signed them in and walked them up"). "Ring back" replaced with "check the list or call their host". | e12-19-v2fb.png, e12-21-result.png | content |
| F-E12-2 | Major | Debrief panel "Why the courier got in" is wrong in both full and defend-only. In the full run the courier (Sam) did not get in ("The door stayed shut"). In the defend runs Sam reported or checked the courier. The panel text ("The parcel, the partner's name and the hurry were all easy to supply, and none of them proved the courier was expected...") also reads as if a reception colleague had let someone in. | Heading that holds either way ("Why the courier almost got in", "What the courier relied on"). | e12-22-debrief.png (text) | content (scenario.json.erb line 451 in awareness_e12_visitor_tailgater; line 408 in _defend) |
| F-E12-3 | Major | End of the pretext chat: the "Call debrief" is injected as an unstyled overlay while the person chat is still open. It sits bottom-left over the lobby floor in default browser type, left-aligned at x=0, the "Done" button is a 48x21 default button in the bottom-left corner, and the last sentence of the debrief runs behind the chat's End Conversation button ("...A quick look at the day's expected-deliveries list ... is what a genuine courier [hidden] ... could not survive."). It appeared on top of the speaker line, the coaching lines and the portrait. Sam would not find "Done" at a glance. Also the debrief says "The call was reported." while the bar reads -65 and "Reports at -70: not reached". | Debrief in the game's panel style, centred, with a normal Done button, shown after the chat closes. Bar and verdict agree. | e12-12-report.png | engine (person-chat-pretext.js) |
| F-E12-4 | Minor | Coaching text beside the picks mixes viewpoints and does not fit the pick. (a) Pick "recipient" gives "+5 CALM ! Borrowed authority. A partner's name on the box does not make the delivery expected." The line scolds in the defender's voice beside a +5, so Sam cannot tell if it is good or bad. (b) Pick 3 ("My hands are full and the badge's back in the van.") gives "-10 CALM ! Dodging the check. Buzzing you through blind, rather than signing you in and walking you up, is exactly what a genuine courier never needs." Sam had not asked to be buzzed through. (c) Labels leak: "Last change: +5 recipient", "-10 for asking (buzz door)", "0 CALM ✓", call-debrief lines "-10 CALM deflect", "0 CALM open parcel", "-20 WARY urgency, deflect". "CALM", "WARY", "REFUSING" are band words never explained. | One plain line per pick ("Good: you used a name you found" or "She will not buzz anyone through without a name"). | e12-09-after-recipient.png, e12-10-after-buzz.png, e12-12-report.png | content and engine |
| F-E12-5 | Minor | Telling which choice asks to be let in. Seven options show at once (the buttons cover Delphine's portrait). Sam found "Any chance you can buzz me through to the studio?" (6) at once and "No need to sign me in..." (5) as the second ask; picks 3 and 4 (excuse, hurry) sound the same until the coaching line arrives. Nothing on screen says what Sam is trying to do in the chat ("get buzzed through to the studio") or that picks 6 and 7 end the call. The influence panel shows negative thresholds only ("Wary at -30: not reached"), and "ASK REFUSED needs -10 or better, now at -15" is a double negative to a non-technical reader. | A one-line aim at the top of the chat; ask options marked (or grouped) as the ask; thresholds as "She would call security at 70 points of doubt". | e12-06-choice1.png, e12-10-after-buzz.png | content and engine |
| F-E12-6 | Minor | Phone and email vocabulary on a physical reception desk. Stage names "The call", "Prepare the call" (with a "Pretext card"), "Take the calls"; queue "Service desk queue: 7 calls", row labels "Call / Incoming call", panel "INCOMING CALL", counter "Phish stopped for the team: 0", button "Next message", "Escalated rather than just refused", "ring back on the number you hold", brief "from the first message", "this message's tells" on the courier card. Sam is a receptionist meeting people in person. Sam still understood the job (the brief says reception seat) but read "calls" as phone calls twice. | Desk words: visitors, "Next visitor", "Visitors handled", "Security can warn everyone". | e12-15-queue.png, e12-16-v1.png | content and engine (shared inbox-triage strings) |
| F-E12-7 | Minor | "Uniform or job title as proof" is scored "Not a flag here: ... It wasn't one of this message's tells." on the Courier card, where the hi-vis and a courier's job are the whole pretext. Sam ticked it, got told it was not a tell, and ticked it correctly on the fire inspector. | Same chip on both, or one line saying why the courier's uniform did not count. | e12-20 (text) | content |
| F-E12-8 | Minor | Repeating a pick is allowed and counts. In the discarded run the same option was taken four times: +5, -5, -5, -5 with the same "Borrowed authority" text each time. No "you already said that". The chat ends only when Sam picks 7 or the doubt bar runs out. | A used pick greys out or Delphine says "You've told me that". | none (discarded run 4901) | engine |
| F-E12-9 | Minor | Result and debrief wording. "Phish caught: 3 of 4 (1 reported, 1 checked by another route, 1 deleted)" (a visitor was turned away, not deleted). "Weakest skill: ... If a caller, prompt or voicemail pushes you to act..." (no voicemail at a desk). "The habit to keep: When a message pressures you to move money, grant access, sign in or read back a code" and "How to report here: suspicious emails, calls and texts" do not mention visitors. The "Missed" tell on the first visitor after Turn away reads "A visitor or contractor left to move around unescorted" without having ticked it. | Desk wording for the closing panels. | e12-21-result.png, e12-22-debrief.png (text) | content |
| F-E12-10 | Minor | Speaker label in the attack chat is "demo_player" (raw name). | The learner's name or "You". | e12-12-report.png | engine |
| F-E12-11 | Nit | Research page text: "Front-of-house buzz expected visitors and couriers through from the reception desk." is garbled. Lorna's line is the known 47-word item (not re-reported). Nothing else over 30 words among host lines (Delphine's lines are 8 to 17 words each). Call-debrief closing sentence is 55 words (see F-E12-3). | Rewrite the research line. | e12-02-browser.png | content |
| F-E12-12 | Nit | `[SPACE]` hint inside the Skip button is 11px; a hover tooltip over the kiosk is 10px. | 13px or hidden. | e12-05-approach.png | engine |
| F-E12-13 | Nit | The visitor chips begin with "Tailgating" as a lone word; Sam only learned what it means from the "Caught:" bracket afterwards. | Short gloss on the chip: "Tailgating (following someone through a badged door)". | e12-17-v1chips.png | content |

Things Sam did understand (E12):
- Playing the attacker. The brief ("you'll pull on a hi-vis jacket, pick up a parcel... Only the reception seat is scored"), the "Prepare the call" card with a script of lines, and the first person lines in the chat made it clear Sam was the courier. The portrait also shows a hi-vis figure. Sam never doubted which seat it was.
- Which choice asks to be let in: "Any chance you can buzz me through to the studio?" and "No need to sign me in" (see F-E12-5 for what is missing).
- The reception buttons. With the legend line under the queue brief ("Let them in (sign them in and let them through); Report (tell facilities or security); Turn away (politely decline...); Check first (check the day's list or call the host)") and the icons (tick, warning triangle, red X, question mark) all four made sense by the second visitor. The only wobble is Turn away versus Report (Sam turned away the tailgater, got "Safe, but nobody was warned") and Check first for someone standing in front of the desk (F-E12-1).
- The flip: "The door stayed shut ... Now it's your seat." then "Take the calls".

Five weakest lines, E12:

1. "Why the courier got in" (debrief heading, wrong in both modes)
2. "You chose Let them in. This caller was genuine, but you did what they asked without checking... The right call was Check first or Report." (on the colleague who locked their screen, whose card says "nothing to act on")
3. "-10 CALM ! Dodging the check. Buzzing you through blind, rather than signing you in and walking you up, is exactly what a genuine courier never needs." (after "My hands are full and the badge's back in the van.")
4. "+5 CALM ! Borrowed authority. A partner's name on the box does not make the delivery expected." (beside a +5)
5. "ASK REFUSED needs -10 or better, now at -15." / "Service desk queue: 7 calls" / "Phish stopped for the team: 0"

"Didn't know what to do" moments (E12):
- First chat screen: seven options and a bar with markers, about 20 seconds before Sam picked the recipient option, because nothing says what the aim is.
- Finding "Done" on the call debrief (F-E12-3): about 10 seconds.
- Whether to tick "Uniform or job title as proof" on the courier.
- Genuine visitor with no list on screen: Sam let him in because it looked fine, then was told that was a half mark.

Lesson Sam left with (E12): "A parcel, a partner's name and a hurry prove nothing. Don't buzz anyone through; check the list or walk them to the desk, and report anyone who pushes to skip it. Lock my screen when I step away." That matches the debrief's one line. The "ring back on the number you hold" line did not land for a visitor standing at the desk.

## Notes for the fixer

- F-E10-1 and F-E12-1 to F-E12-3 are the ones a learner would trip on in practice.
- F-E12-6 and F-E10-8 (web and call words in shared inbox-triage strings) are the same kind as F-E20-1: the shared triage minigame still shows email vocabulary on non-email items. A per-scenario label set would fix E10, E12, E19 and E20 at once.
- Not re-reported: Mission Brief popup after reload, "Resume session?" overlay, E12 costume placeholder, learner and host sharing a sprite, Lorna's 47-word line.
