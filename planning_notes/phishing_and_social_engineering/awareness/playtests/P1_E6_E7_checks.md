# P1 playtest: E6 calm route, E7 framing, mobile pre/post pair

Run type: plumbing plus learner-experience read (question 1 and 2 of the playtest skill). Not a solvability run: no secrets, PINs or VM flags in any of these scenarios, so the earned-secrets table is empty.
Server: keyless :3001, headless, Node 24. Played as an office worker through the on-screen controls only (the `mg` bridge clicks real controls). No console state edits, no globals set by hand.

| Scenario | Game id | Session log | verify-run result |
| --- | --- | --- | --- |
| awareness_e6_texts_and_qr | 3594 | tools/playtest/p1-e6-session.jsonl | progress recorded, 2 tasks completed, score 100 |
| awareness_e7_voice_ceo | 3605 | tools/playtest/p1-e7-session.jsonl | progress recorded, 2 tasks completed, score 100 |
| awareness_pre_mobile_ab | 3616 | tools/playtest/p1-pre-session.jsonl | progress recorded, 1 task completed (finish_check), score 100 |
| awareness_post_mobile_ab | 3617 | tools/playtest/p1-post-session.jsonl | progress recorded, 1 task completed (finish_check), score 100 |

verify-run.rb prints "0 rooms beyond the first, 0 objects unlocked, 0 flags submitted" for all four. That is expected: these are kiosk episodes in one room, and the verifier accepts completed tasks as progress.

## Severity counts

0 blockers, 1 major, 8 minors, 4 trivials.

| # | Severity | Where | Finding |
| --- | --- | --- | --- |
| F1 | major | E6 and E7 compose meter | The meter contradicts itself about the forged From line. See below. |
| F2 | minor | E6 reply | Kaylee's reply quotes pressure the calm message did not contain. |
| F3 | minor | E6 compose | The Ask dropdown defaults to the urgent line, so the calm route depends on spotting an unlabelled default. |
| F4 | minor | E7 defend feedback | "Someone senior is invoked to skip a check" is called "Not a flag here" on the CEO email but credited on the CEO voicemail. |
| F5 | minor | E7 voice panel | "Nobody is marked down for a miss here" sits next to a percentage score and per-message scores. |
| F6 | minor | Pre/post brief | "Right call is most of the score" while the game score is completion-only; learner sees two different numbers. |
| F7 | minor | Pre/post email tick list | Email items offer 14 tick boxes, including header-dependent ones, with the header panel hidden. |
| F8 | minor | Pre/post feedback | Feedback names roles that are not on screen ("warehouse manager", "recruitment lead", "your own manager"). |
| F9 | minor | Post results | "No baseline" shown; Lerato promised the end screen lines the check up against the first. Could not be tested in a fresh game. |
| F10 | trivial | E7 debrief | Timing line contradicts the clock on the mail. |
| F11 | trivial | E7 objectives panel | "Cover the finance line" is listed twice. |
| F12 | trivial | E6/E7 mail client | Clicking Compose while a compose pane is open closes it. |
| F13 | trivial | E6 kiosk | Brief says "email", objective says message "on their phone". |

## 1. awareness_e6_texts_and_qr, calm route

Steps (all through the kiosk): talk to Chidi, kiosk Start, browser research (Kaylee Dunford, Dev Acharya, Depot notices, the two Friendface posts, each added to notes), mail client, Compose to Kaylee.

Calm route taken: sender Dev Acharya / dev.acharya@tarrowby.example, pretext "When you get a chance, we've moved the depot car park onto the YardPass permit...", ask "No rush on it, just sometime this week so I can keep the list up to date."

**Urgency check passes.** Meter text with the calm pretext and calm ask:

> Red flags 0 — "No red flags right now — this reads clean so far."

Meter at each step, for the record:
- Before any choice (sender placeholders unfilled, ask defaulting to the urgent line): `Red flags 3` — "The From line carries Dev Acharya's real Facilities address, so it reads as the depot notice she acts on, but it was forged: Facilities never sent it, and a From line can be set to show any name and address." / "No plausible reason for this message to this person" / "Unexpected urgency or pressure to act fast".
- Sender chosen, calm pretext, urgent ask still selected: `Red flags 2` — "No plausible reason..." and "Unexpected urgency or pressure to act fast". (The "no plausible reason" line was still there because the permit-scheme blank was unfilled.)
- Permit blank filled, urgent ask still selected: `Red flags 1` — "Unexpected urgency or pressure to act fast".
- Calm ask selected: `Red flags 0`, text above.

Result after Send (first Send is final): "It landed. They acted on it." with "She would open it / From Facilities, who she'd expect a parking notice from / Ties to the new parking permit she was told to register for". Reply text arrives: "Cheers Dev, scanning it now so I don't get clamped on Monday." The brief and the "Now it lands on you" step both frame this as the red-team side only; the stage rail says "Defend" next and the brief said "Only the phone is scored". That framing is honest and consistent.

Flip and debrief: the "Now it lands on you" step re-shows my message as Kaylee sees it with the forged From line annotated, then "Defend" with the work phone. Six items; I played them as an office worker would and scored 93 percent ("Sharp: you caught the phish and knew why"). Per-item feedback and the results grid (Phish caught 4 of 4, Real mail trusted 2 of 2, Sender address caught 0 of 1, Pressure caught 0 of 1, and so on) read clearly. I did not capture the email's tick list on screen; the code (`chipIdsFor` in triage-flags.js) gives email items the seven factors plus channel tells, so the sender and pressure tells I skipped were on offer. I do not call those two misses unfair.

Brief clarity: good. Kiosk intro, research, and write steps tell you what to do and that only the phone is scored.

Task/global state at end (verify-run): `land_mobile_staff` and `check_work_phone` completed, `phish_mobile_staff_landed`, `episode_e6_texts_and_qr_defend_done` and `_pass` set.

### F1 (major): the meter's forged-From line appears and disappears, and ends at "reads clean"
Quoted above. With the sender still showing "[sender's name] <[sender's address]>" the meter already says the From line "carries Dev Acharya's real Facilities address". Once I actually pick Dev Acharya and her real address, that line vanishes, and the final meter says "No red flags right now — this reads clean so far." while the debrief, one step later, lists the forged From as the thing that made it believable. Same behaviour in E7 (Ravinder Sandhu). Either the meter is meant to show only believability gaps (then the first state is stale and wrong), or it is meant to show the forgery (then the last state is wrong). As it stands a learner reads "this reads clean" about a message that impersonates Facilities, and the first reading names a real address that has not been chosen.

### F2 (minor): Kaylee's reply
Calm message said "No rush on it, just sometime this week". Reply: "Cheers Dev, scanning it now so I don't get clamped on Monday." The clamping line only exists in the urgent ask ("You don't want to be clamped on Monday."). The reply is fixed text that echoes pressure I did not write.

### F3 (minor): Ask defaults to the urgent line
On opening Compose, Ask is already set to "Can you scan it today so I can tick you off the list? You don't want to be clamped on Monday." and Pretext is blank. A player who fills only the labelled Pretext picker still sends urgency (meter showed `Red flags 2` then `1`). The calm route needs the player to notice a second dropdown. Unfair? No, the meter says so, but it is easy to miss.

### F12 and F13 (trivial)
Clicking Compose with a draft open closes it (looks like a toggle, nothing says so). Kiosk brief: "write one email to depot staff"; objective text: "send one message in Facilities' name to a member of depot staff on their phone".

## 2. awareness_e7_voice_ceo, framing

**Framing is honest throughout.** Quotes, in the order met:

- Kiosk brief: "...write the email in the name of Brightwell's chief executive, Ravinder Sandhu, the message that would go with a cloned-voice call to accounts payable, asking for something he would never ask for. Then you swap seats... Only the second part is scored."
- Scope line: "In scope: one practice message written in the name of a fictional chief executive... No real person's voice is used, and nothing you write leaves the game."
- Red team lead email: "...write one short message: the email in his name that would go with a cloned-voice call. No real person is used, nothing leaves this account, and you are not scored on how convincing it is."
- Compose labels: "whose voice the call uses" and "the line it comes from" in place of a plain From, so the voice is named as part of the attack, not as a feature.
- Meter, start: `Red flags 3` (forged-From line, "No plausible reason for this message to this person", "Unexpected urgency or pressure to act fast"). After sender, pretext ("I need the supplier payment due this week pushed through today...") and payment blank: `Red flags 1` — "Unexpected urgency or pressure to act fast". The Ask is a single fixed line ("Release it today, and keep it between us until I'm back and can explain.") so urgency cannot be removed on that pretext. I did not try the second pretext ("Just checking the month-end numbers are on track before I'm back.").
- After Send: "It landed. They acted on it. / He would take the call / It sounds like the chief executive he knows / Ties to a payment he is already expecting to release" and "Advisory: The pressure is the point of this call; the debrief shows why it works." Reply from Tom: "Of course, I'll release it now and keep it quiet until you're back."
- "Now it lands on you" caption: "This is the message you wrote, as Tom in the finance office would find it. The lines picked out below are what make it believable."
- Defend brief: "Nobody will ask whether a voice sounded real: what counts is what each message asks you to do." Step text: "Read each voicemail's transcript: what it asks you to do matters more than whose voice it is."

Only the inbox side is scored: confirmed. The sent email gets no score; the defend phone gives per-message scores and the 100 percent result. verify-run: `land_ceo_voice_target` and `check_finance_line` completed; `phish_ceo_voice_target_landed`, `episode_e7_voice_ceo_defend_done` and `_pass` set.

**Voice panel** (shown at the end of the debrief, before Finish). Heading and text exactly:

> **How a voice gets copied**
> Recordings of someone speaking in public, such as a talk, an interview or a company video, can be used to make new sentences in a voice that sounds like theirs. If you can't reach the person to check, ask someone who would know, such as the finance manager.
>
> On Monday: a voice you recognise is not proof of who is calling, and neither is an email that backs it up. If a call or voicemail asks for money, secrecy or a skipped step, ring the person back on a number you already hold, then report it the way your organisation asks you to.
>
> Nobody is marked down for a miss here. A familiar voice is hard to doubt, and these calls were built to lean on exactly that trust. Anyone can be caught by one.

Defend play: Trust the real CEO voicemail, Report the borrowed-phone voicemail (ticked callback pressure, secrecy, senior invoked: all credited), Verify the Lindiwe voicemail, Report the inboxly.example email, Trust Adaeze's bank-change email. Result: "Score 100 percent. Sharp: you caught the phish and knew why", with Callback pressure, Secrecy, Borrowed authority and Sender address all credited.

### F4 (minor): "Someone senior" inconsistency
On the 15:31 email from "Ravinder Sandhu <ravinder.sandhu.private@inboxly.example>" I ticked "Someone senior is invoked to skip a check". Feedback: "Not a flag here: Someone senior is invoked to skip a check. It wasn't one of this message's tells." The same tell is credited on the borrowed-phone voicemail from the same fake Ravinder, and this email also says "don't put it through the usual approval". Not penalised (score 100), but the wording tells a learner they were wrong about something that is true.

### F5 (minor): "Nobody is marked down"
Voice panel says "Nobody is marked down for a miss here." The same screen set shows "Score for this message: 100 of 100" per item and "Score 100 percent". It reads as a contradiction; probably means "the voice isn't judged", which it could say.

### F10 and F11 (trivial)
Debrief: "It reached Tom at ten to five on a Friday" while the sent email is stamped 18:31 and Tom's reply 18:31. Objectives panel after completion shows "Cover the finance line" twice (aim and task share a title).

## 3. awareness_pre_mobile_ab then awareness_post_mobile_ab

Both run through the kiosk in the training room after a short chat with Lerato Dlamini.

**Instructions clear: yes.** Kiosk: "Go through these messages and decide what to do with each one. Your answers are recorded." Pre brief: "Ten items from a Tarrowby Logistics work phone: texts, printed notices with QR codes, and emails. Tarrowby's own sites end in tarrowby.example. For each one, choose Trust, Report, Delete or Verify (check with the sender on a number or app you already use), then tick what you noticed. You'll see how you did at the end. Reporting a real message never costs you anything." Pre adds "This one is just to see where you are." Post says "Follow-up assessment: 10 messages" and "You'll see what you got right and wrong at the end." The tarrowby.example hint matters and is in the right place. Mildly confusing: F6 below.

**Every scored tell is visible on screen without the header panel: yes, for all 20 items.**
- Sender and look-alike tells are in the visible From line: `colin.mather.tby@inboxly.example`, `shauna.lofthouse@tarrowby-depot.example`, `fatima.begum.hr@quickpost-mail.example`, `colin.mather@tarrowby-team.example`.
- Text tells (shortened link, deadline, "Reply STOP") are in the message body; saved-contact label ("Lerato (mobile), in your contacts") is above it.
- QR notices: the destination is behind a "Where does this code go?" button, which prints it (`tarrowby-charging.example/pay`, `tarrowby-wifi.example/login`, `facilities.tarrowby.example/ev-charging`, `guest.tarrowby.example/terms`). Needs a press but no header panel.
- "Show details" opens the header panel (Sending server, Signature, Domain check, Reply goes to) and is optional. I opened it once on the clean rota email (all Pass).

**Results screen.** Pre: "Score 99 percent. Sharp: you caught the phish and knew why", grid (Phish caught 4 of 4, Reported rather than just deleted 4 of 4, Real mail trusted 6 of 6, Sender address 2 of 2, Pressure 0 of 1, ...), "Weakest skill: Pressure (caught 0 of 1)...", "Come back for the follow-up after your training." Post (I deliberately slipped: Trusted the tarrowby-team.example email, Deleted rather than reported the Wi-Fi sheet): "Score 82 percent. Getting there: a few tells slipped past", Weakest skill QR codes. Makes sense. The review before it lists the lowest-scoring items first (Colin 87 before the 100s in pre; the 0-score item first in post), with a Jump list and per-item "Missed:" and "What would have happened:" lines. Good.

**Completion scoring confirmed (verify-run reads the persisted score, after `sync`).**
- Pre: score 0 at start (before Start), score 0 after sorting 9 of 10 and after all 10 on the review screen. 100 after the final screen; `triage_pre_done`, `triage_pre_pass` set, `finish_check` completed. I did not read the persisted score between "See result" and "Finish" in the pre run.
- Post: score 0 on the review screen. 100 immediately after clicking "See result" (before Finish); `triage_post_done`, `triage_post_pass` set. Post score is 100 although the result screen says 82 percent and two items scored 0 and 50, so it is completion-scored as designed.

### F6 (minor): two scores
Brief: "Right call is most of the score; naming the flags is the rest." Results show 99 percent / 82 percent, game score is 100 on completion. A learner who reads the objectives panel after sees a completed objective with no number. Clarify that the percentage is feedback, not the grade.

### F7 (minor): tick list on email items
An email item offers 14 boxes: seven email factors (including "The header checks failed or don't line up", "The reply-to address differs from the From address") plus the channel tells (QR, SMS, Reply STOP, look-alike, secret). With the header panel hidden by default, two options cannot be judged without pressing "Show details". Long list on a phone-sized layout.

### F8 (minor): roles not on screen
Feedback says "The warehouse manager's name on a personal inbox" (Colin in pre), "The recruitment lead's name on a personal inbox" (Fatima in post), "A saved contact, your own manager" (Colin text in post). Nothing the learner sees gives those roles. Wording only.

### F9 (minor, not testable here)
Lerato in the post run: "The end screen lines this one up against the one you did before." Post result screen: "No baseline. There's no first check to compare with, so this round's result stands on its own." Each run was a fresh game id, so this is probably the expected fallback. The comparison view itself was not exercised; needs a run where pre and post share a user or game history.

## What I did not test
- E6/E7 with the urgent route or the second E7 pretext.
- A reload mid-defend (the brief says it restarts the round).
- Pre/post in the `ba` order, and the comparison panel.
- Audio (keyless server).

## Harness note
`converse` returned the opening NPC line three times in the transcript for Chidi (E6); I treated that as the harness, not the game. No game reload, no DOM inspection of hidden mechanics, no state edits.
