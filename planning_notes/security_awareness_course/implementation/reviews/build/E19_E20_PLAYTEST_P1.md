# E19 and E20 playtest P1 (Sam persona)

Run date 2026-10-29. Server :3001 keyless, headless (load average about 7, so harness timings are rough). Persona run, not blind: plumbing plus one unexpected-behaviour check (page reload mid-episode). Each run was driven through real clicks on the visible controls (kiosk interact, radio plus confirm button, row, verdict card, chip checkbox, Next); no globals set. No VMs, no flags, no PINs, so the earned-secrets table is empty.

**Persona (Sam, operations coordinator, 30s):** skims, picks fast, takes the risky option on purpose in at least two sandbox beats, and gets one defend item wrong on purpose.

**Fixer note:** a content fixer may have edited wording while these ran; all runs are between 18:55 and 19:08 UTC on 2026-10-29. Run times are in the table below.

## Evidence

| Run | Game id | Started (UTC) | Session log | Screenshots |
| --- | --- | --- | --- | --- |
| E19 full | 4778 | 18:55:49 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e19-e20/e19-full-session.jsonl (178 commands) | e19-01 to e19-20 |
| E19 defend-only | 4781 | 19:01:12 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e19-e20/e19-defend-session.jsonl | e19d-01 to e19d-03 |
| E20 full | 4779 | 19:02:31 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e19-e20/e20-full-session.jsonl | e20-01 to e20-23 |
| E20 defend-only | 4783 | 19:07:11 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e19-e20/e20-defend-session.jsonl | e20d-01 to e20d-06 |

Screenshots are all in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e19-e20/.

## Timings

Measured wall time is the harness clicking at speed with me reading the screen, so it is not what a learner takes. Estimate is reading about 250 words a minute while skimming, plus the clicks, from the amount of text each screen carries.

| Run | Measured | Estimated for Sam | Target |
| --- | --- | --- | --- |
| E19 full | 5 min 8 s (incl. reload) | 11 to 12 min | 15 |
| E19 defend-only | 1 min 11 s | 6 to 7 min | 8 |
| E20 full | 4 min 31 s (incl. reload) | 12 to 13 min | 15 |
| E20 defend-only | 1 min 8 s | 6 to 7 min | 8 |

All four fit. The defend-only runs spend four screens (episode brief, Defend card, inbox brief, Start) before the first item; see F-E19-6 and the defend-only notes.

## Reload check (after sandbox and montage, before the defend round)

| Episode | Reloaded at | Result |
| --- | --- | --- |
| E19 | Defend card ("Open the inbox") after the montage Continue | PASS. Title screen and resume overlay appear (expected), world returns, kiosk reopens at stage defend with done = brief, mistake, flip. Sandbox and montage are not replayed. Screenshot e19-09-afterreload.png. |
| E20 | Defend card ("Open the pages") after the montage Continue | PASS, same behaviour (e20-10-reload.png shows the resume overlay, e20-11-afterreload.png the resumed Defend card). |

Not tested: reload mid-inbox (the inbox brief itself says it restarts from message 1).

## Montage styling (new engine styling)

PASS in both. Sam's risky picks show an amber left bar and the label "Your call"; safe picks show a green bar and "Your call: the safe route". E19 risky entries also open with "Your choice." (e19-07-montage.png, e20-08-montage.png). Colour is not the only cue (the label differs). Weak spot: a risky pick has no word saying it was risky, only the absence of "the safe route".

## Fonts and cut-off checks

- Sender addresses in message headers (mail-from-address) and Wi-Fi network names (tri-wifi-ssid) compute to Source Sans 3: correct.
- The page URL bar (.tri-address) in the E20 sign-in page cards computes to GNF, the pixel font, not the address font. See F-E20-2.
- Nothing cut off at 1400x1000. No horizontal scroll. The debrief scrolls (long) and the lower panels are readable after scrolling.

## Verify-run output

Game 4778 (E19 full), game 4781 (E19 defend-only), game 4779 (E20 full), game 4783 (E20 defend-only). Each shows "progress recorded" and a completed task.

```
--- 4778
game            4778  (mission 140)
played for      401s of wall clock
globals set     3: engine_tutorial_declined, episode_e19_malware_and_updates_defend_done, episode_e19_malware_and_updates_defend_pass
tasks           1 in objectivesState, 1 completed
  lock_the_doors                     "completed"  at 2026-10-29T19:00:20Z
tasks_completed 1
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4781
game            4781  (mission 141)
played for      484s of wall clock
globals set     3: engine_tutorial_declined, episode_e19_malware_and_updates_defend_defend_done, episode_e19_malware_and_updates_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  lock_the_doors                     "completed"  at 2026-10-29T19:02:07Z
tasks_completed 1
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4779
game            4779  (mission 151)
played for      765s of wall clock
globals set     3: engine_tutorial_declined, episode_e20_remote_and_mobile_working_defend_done, episode_e20_remote_and_mobile_working_defend_pass
tasks           1 in objectivesState, 1 completed
  tell_them_apart                    "completed"  at 2026-10-29T19:06:40Z
tasks_completed 1
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4783
game            4783  (mission 152)
played for      838s of wall clock
globals set     3: engine_tutorial_declined, episode_e20_remote_and_mobile_working_defend_defend_done, episode_e20_remote_and_mobile_working_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  tell_them_apart                    "completed"  at 2026-10-29T19:08:07Z
tasks_completed 1
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

## Severity counts

| Episode | Blocker | Major | Minor | Nit |
| --- | --- | --- | --- | --- |
| E19 | 0 | 2 | 7 | 2 |
| E20 | 0 | 2 | 9 | 2 |

## Findings, E19 "Malware and updates"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E19-1 | Major | The tell "Secrecy" (chip text: "Asked to keep it secret or to skip the normal process") is scored on the Fernside credit note and the IT "allow the update" message, neither of which asks for secrecy. Sam's result: "Secrecy: caught 0 of 2", and "Weakest skill: Secrecy". Sam also gets it as "The tell most often missed" in the debrief. | A weakest-skill line that names something the messages actually did. The chip wording is "keep it secret", so a learner reading honestly would not tick it. | e19-16-review.png, e19-15-wrong.png | content (chip label or mapping) |
| F-E19-2 | Major | Fernside credit note feedback contradicts itself. It says "Not a flag here: The sender's address doesn't match who it says it is. It wasn't one of this message's tells", then the IT Security line says "the address is a look-alike of the supplier's" (sender is accounts@fernside-invoices.example). | One answer. If the address is a look-alike, the chip is a tell and "Not a flag" should not appear. | none (text from session log line for the Fernside verdict, game 4778; the moment passed before I took a shot) | content |
| F-E19-3 | Minor | Feedback card says the same thing three times in a row: "Your verdict: Report. Locked in.", "Thanks for reporting. That warns everyone else.", "You chose Report. Right call: reported. A report warns everyone else." | One confirmation line. | e19-14-fb1.png | content and engine |
| F-E19-4 | Minor | "Caught:" and "Look for:" lines bury the reason in a long bracketed sentence. The Leo line runs to about 50 words in brackets. | Short tell, then one plain sentence. Skimmers read the label and skip the bracket. | e19-14-fb1.png | content |
| F-E19-5 | Minor | Debrief panel "Updates close known holes" ends "never genuine (E10)". "E10" means nothing to a learner. | A plain pointer ("see the downloads episode") or nothing. | e19-19-debrief-bottom.png | content |
| F-E19-6 | Minor | Defend-only has four screens of text before the first message (episode brief, Defend card, inbox brief with legend, Start). The first two both say "report anything that doesn't sit right". | Two screens at most for an 8-minute run. | e19d-01.png, e19d-02.png | content and engine |
| F-E19-7 | Minor | In the message list a wrong Trust shows a green tick and "Trusted" (same as a right Trust), so the list reads as if message 5 went well while the card says "Not this time". | Tick only for correct calls, or a neutral mark. | e19-15-wrong.png | engine |
| F-E19-8 | Minor | In the sandbox the safe option is the longer, more careful sentence every time ("Save your work and restart now, or schedule it for tonight and leave the laptop on" against "Remind me tomorrow"). Sam picked risky by reading the length, not the content. | Options of similar length so the choice is a real one. | e19-03-sbx1.png | content |
| F-E19-9 | Minor | The debrief covers the inbox only. Sam's own risky sandbox picks (postponed the restart, clicked Enable content) are not mentioned again, so the "where it led" lesson is not tied to the final summary. | One line tying the debrief to the picks, or to the one lesson ("it runs with your access"). | e19-18-debrief.png | content |
| F-E19-10 | Nit | After a reload the title screen and a "Resume session?" overlay come first; the overlay also lists "Load session #1 to #6" (other games). Easy to click the wrong one. | Expected engine behaviour; noting it. | e20-10-reload.png | engine |
| F-E19-11 | Nit | A programmatic focus ring (yellow or dark box) sits round the section heading on Montage, Result and Debrief ("Later that afternoon", "What happened", "Getting there"). It looks like a stray box. | No ring on non-interactive headings. | e19-07-montage.png | engine |

"Didn't know what to do" moments (E19): none longer than a glance. The inbox brief and the four cards were clear. The chip step ("What made you say that?") took a moment: Sam skipped it with "Nothing looks wrong", which is accepted. The only real hesitation: Leo's message, where Report and Verify both felt right (feedback said Report).

Lesson Sam left with: "If I didn't start it, don't open it, and it runs as me." That matches the panel "It runs with your access". The Monday box is sensible. Clear.

Five weakest lines, E19:

1. "Weakest skill: Secrecy (caught 0 of 2)." (secrecy was never in the messages)
2. "Not a flag here: The sender's address doesn't match who it says it is. It wasn't one of this message's tells." (contradicted two lines below)
3. "You chose Report. Right call: reported. A report warns everyone else." (third repeat of the same point)
4. "...a web page offering you an update is a different thing, and never genuine (E10)."
5. "If you didn't start it, don't open it, and tell me." (defend card; "tell me" is Anjali, not stated)

## Findings, E20 "Remote and mobile working"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E20-1 | Major | The inbox round reuses email wording on Wi-Fi networks and pages: inbox brief headed "Inbox check: 6 messages", cards "Trust: This is real. I'd open it or act on it" and "Report: This is a phish. Send it to security", feedback "This one was a phish" on the Haverbridge Wi-Fi list, and the result line "(trusting a phish email)". For a Wi-Fi list holding one real and one look-alike network, Sam did not know what Trust meant (the network name? the whole list?). Report on a network is unclear too. | Verdict cards and feedback worded for the thing on screen ("I'd join this network", "this is a fake, tell IT"). | e20-12-sort-brief.png, e20-13-list.png, e20-15-fb1.png | content and engine |
| F-E20-2 | Major | The URL bar on the sign-in page cards (.tri-address, shown as "http://tarrowby-wifi.example/login" and "https://thebeanandbarrow.example/wifi") renders in GNF, the pixel font. Computed font-family is "GNF, monospace". Address-font rule is Source Sans 3. | Source Sans 3 so look-alike letters are readable. CSS says var(--se-font-address) but another rule wins. | e20-17-msg3.png, e20-19-msg4.png | engine |
| F-E20-3 | Minor | The long URL wraps mid-word in the bar ("thebeanandbarro / w.example/wifi"). | Wrap at a dot or shrink, never mid-label. | e20-19-msg4.png | engine |
| F-E20-4 | Minor | Message list and results name the first Wi-Fi item "Web page" (sender slot). The row reads "Web page / [Web page] / At The Bean and Barrow..." and the result says "You trusted the real ones: 'Web page', 'thebeanandbarrow.example'...". | The venue name as sender, once. | e20-13-list.png, e20-21-result.png | content |
| F-E20-5 | Minor | The brief says the two days include "a train, a café, a hotel, a morning at home". The five choices cover train, café call, café laptop, café Wi-Fi and the lost tablet. No hotel or home beat in the choices. | Brief matches the beats, or a beat is added. | e20-01-brief.png, e20-03-sbx1.png | content |
| F-E20-6 | Minor | Montage heading is "Through their eyes." Whose? It sits on Sam's own picks. | A heading like "Later that day" as in E19. | e20-08-montage.png | content |
| F-E20-7 | Minor | Defend card recap says "a screen someone read on the train, a code someone heard in the queue, a bag left for a minute, and one password typed into a network", then "Now it's the kiosk: tell the safe networks...". Sam took the safe route on the bag, and "the kiosk" is not a thing Sam has seen. | Recap that matches what happened, and no "kiosk". | e20-09-defendintro (text in session log) | content |
| F-E20-8 | Minor | "Your password manager did not fill this in." (after "Try your password manager" on the fake sign-in) is not explained: a non-technical learner does not get that this is the clue. | One more clause ("a real page it knows would be filled in"). | e20-18-autofill.png | content |
| F-E20-9 | Minor | The terms box on the café page ("I accept the terms", "Tick to accept the terms and connect") shows as a wide empty text box, not a tick box. | A recognisable checkbox. | e20-19-msg4.png | engine |
| F-E20-10 | Minor | Debrief has about seven panels (Public Wi-Fi in proportion, look-alike, out of sight, lost device, what Tarrowby has set up, Monday, report route, reassurance). The brief promised one lesson. | One headline lesson, the rest folded. | e20-22-debrief.png | content |
| F-E20-11 | Minor | Jargon in learner text: "(see E5)" in the Wi-Fi page feedback. | Plain pointer or nothing. | session log line, game 4779 | content |
| F-E20-12 | Nit | Café-call beat: "a client rings and asks you to read out the building's alarm code and the room list" is an odd ask for a haulier and does not read as remote working. | A client asking for a delivery drop code or a pass number. | e20-04 (text) | content |
| F-E20-13 | Nit | Same as E19-8: safe option is again the longer sentence. | n/a | e20-03-sbx1.png | content |

"Didn't know what to do" moments (E20): the first Wi-Fi list (F-E20-1), about 10 seconds. Sam took Trust on the café list, not sure whether it meant the network or the list. The right call and feedback explained it afterwards. The "Verify" card says "ring a number I already hold", but the brief says "ask the venue", so Verify on a Wi-Fi list also felt mixed.

Lesson Sam left with: "Never type the work password into a Wi-Fi page; ask the venue for the network name." The look-alike network and the page asking for a password both land. The lost-device lure has its own tail ("ring the desk"), so there are three or four lessons, not one.

Five weakest lines, E20:

1. "Through their eyes." (montage heading)
2. "Inbox check: 6 messages" over a list of Wi-Fi networks and pages.
3. "You chose Trust. Not this time. This one was a phish." (on a hotel Wi-Fi list)
4. "Now it's the kiosk: tell the safe networks and pages from the look-alikes."
5. "Your password manager did not fill this in."

## Defend-only notes

- E19 defend-only (game 4781): brief, Defend card, inbox brief, Start, six messages, result, debrief. Same six messages as the full run. Sam got TidyDocs wrong on purpose (Trust) and Deleted the credit note, so the result showed 53%. The "Delete" feedback ("Safe, but not reported") was fair.
- E20 defend-only (game 4783): same shape. Sam trusted the lost-device lure on purpose (62%), Verified the look-alike Wi-Fi (partial credit 60, "Checked by another route 1"), and Reported the real café page (fine, "never wrong").
- Both defend-only briefs state the answer ("never type your work password into a Wi-Fi page", "if you didn't start it, don't open it") twice or three times before the first item.
- Global name for defend-only on the "_defend" scenario is "..._defend_defend_done" (doubled). Same pattern as E8; harmless but worth knowing for any check that reads the global.

## Not tested

Mid-inbox reload, closing the runner mid-sandbox, keyboard-only play, audio (keyless server), phone width.
