# P2 playtest: E5, E6, E7 and the helpdesk check pair (confirming the P1 fixes)

Date: 2026-10-22. Server: keyless :3001 (no TTS), headless, Node 24, load average about 8 to 12. One browser at a time, each closed with `session-stop.sh`. :3000 untouched, :3001 left running.

**Which question this run answers:** plumbing, plus "are the P1 findings fixed" read as an ordinary office worker would meet them. Not a solvability run: no codes, PINs or VM flags exist in these scenarios, so the earned-secrets table is empty. No console state edits. The only non-click actions were `eval` reads of `document.body.innerText`, `screenshot`, and `mg select` on the compose dropdowns (a visible `<select>`).

## Sessions and evidence

Logs are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p2-checks/` (call it `$P2`).

| Game | Scenario | Purpose | Session log |
| ---- | -------- | ------- | ----------- |
| 3737 | awareness_e5_signin_pages | Full episode, weak send (newsletter pretext), timed | `$P2/e5.jsonl` |
| 3742 | awareness_e6_texts_and_qr | Full episode, calm route | `$P2/e6.jsonl` |
| 3747 | awareness_e7_voice_ceo | Full episode, first pretext | `$P2/e7.jsonl` |
| 3751 | awareness_e7_voice_ceo | Re-run only to capture the voice panel in full (the harness truncates long `getState` text in the log; an `eval` read does not) | `$P2/e7b.jsonl` |
| 3753 | awareness_pre_helpdesk_ab | Pre check, persisted score read at each step | `$P2/pre.jsonl` |
| 3754 | awareness_post_helpdesk_ab | Post check, persisted score read at each step | `$P2/post.jsonl` |

`verify-run.rb` output, tails as printed:

```
game 3737  awareness_e5_signin_pages
globals set     9: engine_tutorial_declined, episode_e5_signin_pages_defend_done, episode_e5_signin_pages_defend_pass, landing_sso_login_built, landing_sso_login_domain, se_intel_quayholt_it_desk, se_intel_quayholt_sso_migration, se_intel_quayholt_sso_portal, se_intel_quayholt_staff_claims
tasks           2 in objectivesState, 2 completed
  send_signin_phish                  "completed"  at 2026-10-22T22:37:15Z
  check_signin_pages                 "completed"  at 2026-10-22T22:38:30Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.

game 3742  awareness_e6_texts_and_qr
globals set     7: engine_tutorial_declined, episode_e6_texts_and_qr_defend_done, episode_e6_texts_and_qr_defend_pass, phish_mobile_staff_landed, se_intel_tarrowby_facilities_contact, se_intel_tarrowby_parking_scheme, se_intel_tarrowby_target_staff
tasks           2 in objectivesState, 2 completed
  check_work_phone                   "completed"  at 2026-10-22T22:43:57Z
  land_mobile_staff                  "completed"  at 2026-10-22T22:42:34Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.

game 3747  awareness_e7_voice_ceo
globals set     7: engine_tutorial_declined, episode_e7_voice_ceo_defend_done, episode_e7_voice_ceo_defend_pass, phish_ceo_voice_target_landed, se_intel_brightwell_ceo, se_intel_brightwell_open_payment, se_intel_brightwell_payments_clerk
tasks           2 in objectivesState, 2 completed
  check_finance_line                 "completed"  at 2026-10-22T22:46:10Z
  land_ceo_voice_target              "completed"  at 2026-10-22T22:45:12Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.

game 3753  awareness_pre_helpdesk_ab
globals set     3: engine_tutorial_declined, triage_pre_done, triage_pre_pass
tasks           1 in objectivesState, 1 completed
  finish_check                       "completed"  at 2026-10-22T22:50:22Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.

game 3754  awareness_post_helpdesk_ab
globals set     3: engine_tutorial_declined, triage_post_done, triage_post_pass
tasks           1 in objectivesState, 1 completed
  finish_check                       "completed"  at 2026-10-22T22:52:01Z
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

Game 3751 (the E7 re-run) also verified as progress recorded, 2 tasks completed.

The verifier prints "0 rooms beyond the first" for all of these: they are single-room kiosk episodes, and the verifier accepts completed tasks as progress.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| ------ | ---------- | -------------- | ----------- | ------- |
| (none) | n/a | These episodes carry no code, PIN or flag. Research facts (service desk address, Hana Novak, Dev Acharya, Ravinder Sandhu) were all found in the in-game browser before use. | research stage | yes |

## Screenshots (one per room, plus two evidence shots)

| Room | Used by | File |
| ---- | ------- | ---- |
| Quayholt Insurance training room | E5, helpdesk pair | `$P2/shots/room_quayholt_e5.png` (also `room_quayholt_pre_helpdesk.png`) |
| Tarrowby Logistics training room | E6 | `$P2/shots/room_tarrowby_e6.png` |
| Brightwell Foods training room | E7 | `$P2/shots/room_brightwell_e7.png` |
| E5 "Signing in" page | evidence | `$P2/shots/e5_signing_in.png` |
| E5 flip (contrast) | evidence | `$P2/shots/e5_flip.png` |

## Judgement of the new training rooms

| Question | Quayholt (E5, helpdesk) | Tarrowby (E6) | Brightwell (E7) |
| -------- | ----------------------- | ------------- | --------------- |
| Does the room look right? | Yes. Blue carpet, projector screen, calendar, meeting table, desk with PC and phone. Reads as an insurance office. | Yes. Grey speckled floor, hi-vis jacket and helmet on the wall, pinboard, coffee machine. Reads as a depot break room. | Yes. Blue carpet, rota board, bar-chart screen, water cooler and coffee station. Reads as a food-company office. |
| Is the sign readable? | Yes: "QUAYHOLT INSURANCE" on a purple plate. The second line is dimmer and smaller than the first. | Yes: "TARROWBY LOGISTICS" on a blue plate, both lines clear. | Yes: "BRIGHTWELL FOODS" on a green plate, both lines clear. |
| Can you reach the host and the kiosk? | Yes. `moveToNear` then `interact` reached Niamh Doherty (E5) and Anjali Rao (helpdesk) and the kiosk without a stall. | Yes (Chidi Okeke, kiosk). | Yes (Agnieszka Duda, kiosk). |
| Does the kiosk open with one tap? | Yes. One `interact` returned `mode: "direct"` and opened `episode-runner` ("Training kiosk") in all six games. In P1 the E5 kiosk went through the interaction menu because the player stood beside the host; I did not stand beside the host this time, so that case is untested. | Yes, direct. | Yes, direct. |

## Timings (estimated human minutes)

Method as P1: unique on-screen paragraphs of four or more words across the session log, at 200 words per minute, plus about 3 seconds per click and about 30 seconds per real decision. Wall-clock is not used (the machine was shared). The E6 count misses about 200 words of kiosk brief that I clicked through without a state read, so I added them.

| Episode | Unique words read | Reading | Clicks and decisions | Estimate | Target |
| ------- | ----------------- | ------- | -------------------- | -------- | ------ |
| E5 sign-in pages | about 2,070 | about 10.3 min | about 4 min | **about 14.3 min** | about 13 (P1: 16) |
| E6 texts and QR | about 2,520 | about 12.6 min | about 4 min | **about 16.6 min** | not stated |
| E7 voice CEO | about 2,460 | about 12.3 min | about 4 min | **about 16.3 min** | not stated |
| Pre helpdesk check | about 1,320 | about 6.6 min | about 5 min (10 items) | **about 11.6 min** | not stated |
| Post helpdesk check | about 1,090 | about 5.5 min | about 5 min (10 items) | **about 10.5 min** | not stated |

E5 is down from P1's 16 minutes (the debrief is now about 130 words instead of 559) but still over the 13-minute target by about 1.3 minutes.

## P1 findings: status

"Fixed" means I saw it on screen in this run. "Not reached" means no path I played exercised it. E3 findings were not replayed (E3 was not in this round).

### E5 (P1_E3_E5.md)

| P1 id | Sev | Status | Evidence (on-screen text, word for word) |
| ----- | --- | ------ | ---------------------------------------- |
| E5-1 | blocker | **fixed** | The "Signing in" page shows both blocks as text with no click: "All Quayholt systems use single sign-on. Staff sign in once at the Quayholt SSO on quayholt.example." and "IT notices come from the service desk, it-servicedesk@quayholt.example." Screenshot `e5_signing_in.png`. `e5.jsonl`, first `getState` after "Signing in". Clicking each adds the note. |
| E5-2 | major | **fixed** | Write stage now offers "Open the mail client" and "Back to research" (E5 and E6 and E7 all show it). I used "Back to research" in the E7 re-run (game 3751) after a Compose with no contacts ("No contacts yet — find someone first."): it returned to the browser with Ravinder Sandhu's note kept. I did not click it in E5 itself. |
| E5-3 | major | **fixed** (one domain tested) | Flip address bar reads `https://quayholt-sso.example/`, not `d_word`. The email link chip reads `quayholt-sso.example`, matching the flag "Link destination doesn't match the real site (look-alike domain)". The digit-domain option `quayho1t.example` was not built, so that bar is not reached. |
| E5-4 | major | **partly fixed** | Message list, From, To, Time and body are now dark on white and readable (`e5_flip.png`). The link chip is dark blue text on a dark navy button and is close to unreadable. See N1. |
| E5-5 | major | **fixed** (contradiction), see N2 | A newsletter pretext with the look-alike address now prints "It did not land." with "She would open it / From the IT service desk she acts on / No change she can match this to, so no reason to sign in again. / The sign-in link looked like her own". Headline and advisory agree. No reply arrived. The flip afterwards still says she typed her password (N2). |
| E5-6 | minor | **not fixed** | Builder meter with all four facts noted still reads "You haven't found out what Hana would expect to see yet." The score list shows "✓ Page: a payslip notice is what the email promised." beside a "Session expired" page. |
| E5-7 | minor | **not fixed (part)** | The defend set now says "Real pages handled right" and "Five pages are open in your browser", but the result still ends "Look for it in the next messages you get at work, and if you are not sure, ask your IT or security team." |
| E5-8 | minor | **not fixed** | Flip email is stamped "23:37" (real clock) while the briefing mail says "09:05". |
| E5-10 | minor | **not fixed** | Every page still carries "Your password manager did not fill this in." or "Your password manager filled this in." |
| E5-11 | minor | not reached | Closing the mail client before sending was not tried. After Send, Close goes to the flip (as P1). |
| E5-12 | trivial | **not fixed** | Three "What is this?" buttons in the builder. |
| E5-13 | trivial | not reached | Did not reset a score. |
| E5-14 | trivial | not reached | I did not hear the host line between the two seats. The closing line is "That's both seats done, thanks. The trick is always the address: read the bar before you type a password. A padlock doesn't make a page ours." No praise. |
| E5-T | minor | **not fixed** | About 14.3 min against about 13 (P1: about 16). |
| Brief check | | **fixed** | Defend brief is "Five pages are open in your browser, each one reached from a link in your Quayholt inbox this morning." (page wording, not "Inbox check: 5 messages"). |

### E6 and E7 (P1_E6_E7_checks.md)

| P1 id | Sev | Status | Evidence |
| ----- | --- | ------ | -------- |
| F1 | major | **fixed** | E6 meter before a sender: "Red flags 1 / No plausible reason for this message to this person" with no forged-From line. After choosing Dev Acharya's address the forged-From text appears as advice: "The From line carries Dev Acharya's real Facilities address, so it reads as the depot notice she acts on, but it was forged: Facilities never sent it, and a From line can be set to show any name and address." With the pretext blank filled it reads "Red flags 0" and that advice stays under it. It never says "reads clean". Same in E7 (Ravinder Sandhu: "Red flags 2" at start, "Red flags 1" and the forged-From advice after the sender and payment are set). |
| F2 | minor | **not fixed** | Calm message ("No rush on it, just sometime this week so I can keep the list up to date.") gets the reply "Cheers Dev, scanning it now so I don't get clamped on Monday." |
| F3 | minor | **fixed** | E6 Ask opens on "No rush on it, just sometime this week so I can keep the list up to date." (value `ask_scan_calm`). E5 also opens on "There's no rush: sign in through the link when it next suits you." (`e5_ask_calm`). |
| F4 | minor | **not fixed** | Review of the helpdesk email from Helen Achterberg and the E7 15:31 email still print "Not a flag here: Someone senior is invoked to skip a check. It wasn't one of this message's tells." while the same fake sender's voicemail is credited for it. |
| F5 | minor | **not fixed** | E7 voice panel still says "Nobody is marked down for a miss here." on the screen that shows "Score 92 percent" and "Score for this message: 87 of 100". |
| F6 | minor | **not fixed** | See check-pair row below. |
| F7 | minor | **not fixed** | Email items offer 14 tick boxes including "The header checks failed or don't line up" and "The reply-to address differs from the From address" with the header panel closed. |
| F8 | minor | not reached | Mobile pair not replayed. In the helpdesk pair the role comes from the address (`.ceo@`, `.coo@`) and the feedback names "The chief executive's name" and "The chief operating officer's name". |
| F9 | minor | not reached | Post result for a fresh game: "No baseline. There's no first check to compare with, so this round's result stands on its own." Each scenario is its own game, so the comparison is not reachable in standalone. Anjali's line "If you did the first check, the end screen shows how they compare." is what raises the expectation. |
| F10 | trivial | **not fixed** | E7 debrief: "It reached Tom at ten to five on a Friday" while the mail is stamped 23:45. |
| F11 | trivial | **not fixed** | Objectives panel shows the aim and the task both titled "Cover the finance line" (E7) and "Check the sign-in pages" (E5), see the room screenshots. |
| F12 | trivial | not reached | |
| F13 | trivial | not reached | I did not read the E6 brief text. The objective now reads "Send the parking message in Facilities' name / Send your message to depot staff". |
| E7 voice panel | check | **honest** | In full: "How a voice gets copied. Recordings of someone speaking in public, such as a talk, an interview or a company video, can be used to make new sentences in a voice that sounds like theirs. If you can't reach the person to check, ask someone who would know, such as the finance manager. On Monday: a voice you recognise is not proof of who is calling, and neither is an email that backs it up. If a call or voicemail asks for money, secrecy or a skipped step, ring the person back on a number you already hold, then report it the way your organisation asks you to. Nobody is marked down for a miss here. A familiar voice is hard to doubt, and these calls were built to lean on exactly that trust. Anyone can be caught by one." Only the "marked down" sentence is open to F5. |
| E7 framing | check | **honest** | Kiosk brief: "write the email in the name of Brightwell's chief executive, Ravinder Sandhu, the message that would go with a cloned-voice call to accounts payable, asking for something he would never ask for. Then you swap seats: you're covering the finance office's phone and inbox, with three voicemails and two emails waiting. Only the second part is scored." Scope: "No real person's voice is used, and nothing you write leaves the game." Red team lead mail: "you are not scored on how convincing it is." Compose labels "whose voice the call uses" and "the line it comes from". Defend brief: "Nobody will ask whether a voice sounded real: what counts is what each message asks you to do." After Send: "Advisory: The pressure is the point of this call; the debrief shows why it works." |

### Check pair: awareness_pre_helpdesk_ab and awareness_post_helpdesk_ab

| Check | Result |
| ----- | ------ |
| Different order from P1 (phish not in the same slots in pre and post) | **Mostly fixed.** Pre order, phish marked: 1 Helen Achterberg email (phish), 2 Sofia Marchetti call, 3 Owen Treharne call (phish), 4 IT Security email (phish), 5 Quayholt IT email, 6 Ticket SD-44817 email, 7 Hana Novak voicemail, 8 Ayaan Warsame call, 9 Quayholt Sign-in prompt 02:14 (phish), 10 Darren Price email. Post order: 1 Quayholt IT email, 2 Sign-in prompt (phish), 3 Patrick Kerrigan email (phish), 4 Darren Price call, 5 Pauline Hendry call (phish), 6 Niamh Doherty call, 7 Quayholt HR email, 8 Reuben Ofori voicemail, 9 Anjali Rao email, 10 Security Review email (phish). Phish slots: pre {1,3,4,9}, post {2,3,5,10}. Slot 3 is a phish in both (a call in pre, an email in post). I cannot compare with P1's slots: P1 tested the mobile pair and did not record its order. See N7. |
| Every scored tell visible without the header panel | **Yes for all 20 items I opened** (header panel never opened). Sender and look-alike tells are in the From line (`helen.achterberg.ceo@lintbox.example`, `it-security@quayholt-corp.example`, `patrick.kerrigan.coo@hastypost.example`, `reviews@quayholt-team.example`). Secrecy, urgency and senior-authority tells are in the body or the call transcript. The MFA tell is in the prompt (location "Unknown location, outside the UK", time). The review's "Header note" about automatic checks is extra and optional. |
| Brief no longer claims "Right call is most of the score" | **Not fixed.** Pre and post briefs both still read "Right call is most of the score; naming the flags is the rest." (E5, E6 and E7 defend briefs carry it too). Source: `public/break_escape/js/minigames/inbox-triage/inbox-triage-minigame.js` line 354, unconditional. |
| Score is 0 until finish, then 100 | **0 until the result, then 100.** Pre (3753): persisted score 0 at the start and 0 on the review screen with all 10 sorted, 100 after "See result" (before pressing Finish), 100 after Finish. Post (3754): 0 on the review screen, 100 after "See result" and after Finish. The completion task `finish_check` is recorded at "See result", so "0 until Finish" is not literally true. The on-screen percentages were 99 percent (pre) and 97 percent (post). |
| Result screens | Pre: "Score 99 percent. Sharp: you caught the phish and knew why", "Come back for the follow-up after your training." Post: "Score 97 percent. Sharp: you caught the phish and knew why", "No baseline / There's no first check to compare with, so this round's result stands on its own." |

## New findings

| # | Severity | Episode | Finding | Evidence |
| - | -------- | ------- | ------- | -------- |
| N1 | major | E5 flip | The link chip, the one piece of evidence the flag refers to, is dark-blue text on a dark navy button and is nearly unreadable. The rest of the panel is fixed. | `shots/e5_flip.png`, game 3737 |
| N2 | major | E5 flip | After "It did not land." the flip still tells the player Hana acted: "Hana Novak, the claims handler you sent it to, opened the link between two claims. The page wore the Quayholt look and showed a padlock, so she began typing her password. That isn't carelessness: the page was built to pass for the real sign-in, and only the address in the bar gave it away." The page heading is also "Now it lands on you" for a message that did not land. | `e5.jsonl`, game 3737, flip step |
| N3 | minor | E5 send result | Under "It did not land." it says "A reply may land in your inbox in a moment." No reply arrived. | `e5.jsonl`, game 3737 |
| N4 | trivial | All triage feedback | Every feedback screen opens "Your verdict: Trust. It is locked." The review uses "Verdict locked: Trust." The first reads as if the page is locked. | all six games |
| N5 | minor | E6 defend result | Ticking "Link or sender domain is a look-alike of the real one" on the `tarrowbey.example` email is credited ("Spotted: ... The sender is tarrowbey.example, with an extra e"), but the same feedback lists "Look for: Sender address doesn't match the display name ..." and the result grid says "Sender address: caught 0 of 1". One fact, scored twice, once as missed. | `e6.jsonl`, game 3742 |
| N6 | minor | Pre/post, E6, E7 | Call and prompt items offer email-only ticks ("The reply-to address differs from the From address", "Link or sender domain is a look-alike of the real one") that cannot apply. | `pre.jsonl`, game 3753 |
| N7 | minor | Pre/post | Slot 3 is a phish in both pre and post (different kind). | section above |
| N8 | minor | Pre/post calls | The caller transcripts include the player's own line announcing the answer before the player chooses: "I'll hang up and ring you back on the number we've got on file" (Owen, Pauline) and "I'll ring you straight back on the mobile we hold for you" (Niamh). It gives away "Ring back" on every call. Same as P1 E3-7. | `pre.jsonl`, `post.jsonl` |
| N9 | trivial | Post | Sign-in prompt is stamped with the real clock ("Sign-in request at 23:52") while other items have fixed times. Same family as E5-8. | `post.jsonl` |
| N10 | minor | E6, E7 | Length: about 16.6 and 16.3 minutes. No budget was given for these two; flagging in case it is 13 each. | timings |

**Counts, new findings: 0 blockers, 2 majors, 6 minors, 2 trivials.**

**Counts, P1 findings (27 rows with a status; E3 not replayed):** 6 fixed (E5-1, E5-2, E5-3, E5-5, F1, F3), 1 partly fixed (E5-4, residual raised as N1), 13 not fixed, 7 not reached (E5-11, E5-13, E5-14, F8, F9, F12, F13).

Outstanding P1 items by severity: 0 blockers, 0 majors, 10 minors (E5-6, E5-7, E5-8, E5-10, E5-T, F2, F4, F5, F6, F7), 3 trivials (E5-12, F10, F11).

## Harness notes (not game findings)

- A first E6 start used the wrong port in the URL and hung; it was stopped with `session-stop.sh` and restarted. No game 3742 state was affected.
- `mg getState` text in the session log is truncated for long screens (the E7 voice panel cut off at "a company v"). `eval` of `document.body.innerText` returns it in full, so I re-ran E7 once (game 3751) to quote it.
- `converse` returns each NPC's opening line twice in the transcript. Same as P1.
- I did not hear the host's "middle" line between the two seats in E5, E6 or E7, because the harness closes the kiosk from the mail client straight into the flip. The line after the episode (E5) is quoted above.
