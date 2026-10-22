# P1 playtest: the three defence-only variants (E1 inbox, E3 phone, E7 voice)

Run type: plumbing plus learner-experience read (questions 1 and 2 of the playtest skill). Not a solvability run: these scenarios have no PINs, keys or VM flags, so the earned-secrets table is empty (no secrets used).
Server: keyless :3001 (left running), headless, Node 24, one browser at a time, each session stopped before the next. Played as an office worker through on-screen controls only (the `mg` bridge clicks real controls). No console state edits, no globals set by hand. The machine was heavily loaded (load average 30 to 45), so timings are harness times, not human reading times.
No audio on :3001, so the E7 voicemails were judged from their transcripts only.

| Scenario | Game id | Session log | verify-run result |
| --- | --- | --- | --- |
| awareness_e1_invoice_fraud_defend | 3620 | tools/playtest/p1-e1d-session.jsonl | progress recorded, 1 task completed (sort_payments_inbox), score 100 |
| awareness_e3_helpdesk_reset_defend | 3623 | tools/playtest/p1-e3d-session.jsonl | progress recorded, 1 task completed (work_service_desk_queue), score 100 |
| awareness_e7_voice_ceo_defend | 3630 | tools/playtest/p1-e7d-session.jsonl | progress recorded, 1 task completed (check_finance_line), score 100 |

verify-run.rb prints "0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed" for all three, with the `..._defend_done` and `..._defend_pass` globals set. That is expected for a one-room kiosk episode. The stored score is 100 for each, while the on-screen round scores were 95, 93 and 95 percent (the manifest says `"scoring": "completion"`, so this is consistent, but the learner sees two different numbers; see F6 in the earlier P1 note).

## Severity counts

0 blockers, 4 majors, 8 minors, 3 trivials.

| # | Severity | Where | Finding |
| --- | --- | --- | --- |
| D1 | major | All three, learner sprite | On screen the learner is a hooded figure (`male_hacker_hood_v2`), not `female_office_worker_v2`. |
| D2 | major | E3 debrief | Card headings are raw ids: `e3_call_gordon_impostor`, `e3_call_gordon_real`, `e3_call_on_behalf`, `e3_call_new_starter`, `e3_push_early`. |
| D3 | major | E3 debrief | Debrief says "You chose Verify" and "You chose Report" for answers that were Ring back, Escalate and Deny and report. |
| D4 | major | E3 (and E7) result grid | Email vocabulary on a phone set, and ringing back real callers scores as 0 of 2 against "never costs you anything". |
| D5 | minor | E3 intro screen | Heading "Inbox check: 5 messages" and a Trust/Report/Delete/Verify legend on a call queue. |
| D6 | minor | E1 reload (tested) | Reload mid-round keeps the stage but not the answers; the round restarts at message 1. |
| D7 | minor | All three debriefs | "You went straight to the ... this time." refers to a stage that does not exist. |
| D8 | minor | All three debriefs | "Nobody is marked down for a miss here." under a percentage score and "87 of 100". |
| D9 | minor | All three intros | "authorised exercise ... In scope: ..." is red-team boilerplate on a defence-only set. |
| D10 | minor | E1 in-round feedback | A sentence is printed twice in the Marsh End Eggs feedback. |
| D11 | minor | E1 feedback and grid | A look-alike domain tick is credited, then "Sender address" is marked missed for the same fact, and ends up the "weakest skill". |
| D12 | minor | E7 voicemail tick list | No "pushing me to hurry" option on voicemails. |
| D13 | trivial | All three kiosks, after the round | "You can close this window." |
| D14 | trivial | All three tick screens | "What made you say that?" appears twice in a row. |
| D15 | trivial | E7 kiosk | Button reads "Open the voicemail" for a set of three voicemails and two emails. |

## Timings

Unix times from the run, harness-driven on a loaded machine. "Setup" is creating the game, opening, dismissing the title, the two-page mission brief, the tutorial prompt and talking to the NPC. "Play" is from opening the kiosk to the mission-end screen.

| Scenario | Setup | Play (kiosk open to end screen) | Notes |
| --- | --- | --- | --- |
| E1 | about 77 s | about 157 s | Includes the reload and a full replay of messages 1 and 2 (about 45 s). Without the reload, about 110 s. |
| E3 | about 59 s | about 79 s | Five items. |
| E7 | about 52 s | about 61 s | Five items. |

The manifests promise about eight minutes. A person reading each message and its feedback will take that long; these numbers only show the flow has no dead waits.

## What the learner's character looks like (asked specifically)

Seen in the E1 room screenshot and the HUD (round avatar bottom left): a dark hooded figure in a grey hoodie with a blank face, in the middle of the room. Adaeze Okafor (the NPC) renders correctly as a woman in a blue top and red trousers. The same hooded figure is the learner in E3 and E7 (same code path, same default).

Scenario fields (identical in all three `scenario.json.erb`, lines 9 to 13):

```
"player": { "id": "player", "displayName": "Learner",
  "spriteSheet": "female_office_worker_v2",
  "spriteTalk": "assets/characters/female_office_worker_talk.png", ... }
```

So the scenario asks for `female_office_worker_v2`, and that atlas exists (`public/break_escape/assets/characters/female_office_worker_v2.png`/`.json`). The game does not use it. Read from the live page with `eval` in E1:

```
window.player.texture.key            -> "male_hacker_hood_v2"
window.gameScenario.player.spriteSheet -> "male_hacker_hood_v2"   (overwritten at load)
window.gameScenario.player.displayName -> "demo_player"            (not "Learner")
window.gameScenario.player.spriteTalk  -> "assets/characters/female_office_worker_talk.png"  (still the scenario's)
```

Cause, from reading the code (not changed): `app/views/break_escape/games/show.html.erb:215` sets `breakEscapeConfig.playerSprite` to the player's saved preference, defaulting to `'male_hacker_hood_v2'`. `public/break_escape/js/core/player.js:210-218` prefers that over the scenario's `player.spriteSheet` and writes it back into `gameScenario.player`. The standalone test account has the default preference, so every scenario's sprite field loses. The result is a hooded figure on the map and in the HUD, with the female office worker's talk portrait still attached from the scenario. This matches what the training-room planner saw. Whether a real Hacktivity learner sees the hood depends on whether they have picked an avatar; one who has not does.

### D1 (major)

A defence-only episode that casts you as an office worker or service-desk staffer shows a hooded hacker figure as you, and the scenario's `spriteSheet` and `spriteTalk` fields cannot change that. Not a blocker, since play is unaffected. If the intent is that the scenario sprite wins for awareness episodes, the engine or the player-preference check needs to know (the `sprite_valid_for_scenario?` path exists in `games_controller.rb`); I did not look further.

## 1. awareness_e1_invoice_fraud_defend (inbox)

Steps: title screen, two-page Mission Brief (brief text: "Awareness episode E1, inbox only. You're covering the payments inbox at Brightwell Foods, a fictional food manufacturer, before the afternoon payment run. Five messages are waiting: sort them, and report or check anything that doesn't sit right."), tutorial prompt declined, talk to Adaeze, kiosk. Kiosk stages: Brief, Defend, Debrief. Inbox-triage minigame: Brief screen, Sort, Review, Result. Verdicts played: Harlow invoice Trust (100); look-alike bank change Report (87); PO Trust (100); CEO wire Verify (87); confirmed bank change Trust (100). Result "Score 95 percent. Sharp: you caught the phish and knew why". Finish gave the kiosk Debrief, Finish again gave the mission-end screen "Payments inbox done / You've sorted all five messages and finished this episode."

Stands on its own: yes. The brief and the kiosk intro say what the job is (sort five messages, some real, some fake), the minigame brief explains the four verdicts (Trust, Report, Delete, Verify) and that reporting a real message costs nothing, and each message gives immediate feedback. The kiosk "Defend" step text is "Go through the inbox and decide what to do with each message. Take your time: there is no trick to it, just the habits that catch these." The debrief makes sense without an attack: it reviews each message, ends "On Monday: if an email asks you to change bank details or to pay in a hurry, don't reply and don't use any number in the email. Ring the person on a number you already hold, then report the email the way your organisation asks you to." The two odd bits are D7 and D8.

Defend button and copy: "Open the inbox", verdict buttons Trust/Report/Delete/Verify, "Real mail trusted" grid line. All fit an inbox.

Kiosk text after the round (changes, good): before, "A touch-screen kiosk showing Brightwell's payments inbox. Five messages are waiting." After: "A touch-screen kiosk showing Brightwell's payments inbox. All five messages are sorted." The kiosk panel then shows "Finished / You have finished this exercise. You can close this window." (D13). Adaeze's talk line changes from "Thanks for covering the payments inbox before the three o'clock run. It's open on the kiosk." to "That's the inbox sorted, thank you. If anything still bothers you, ring the sender on a number we already hold."

### Reload test, mid defend round (done in E1, after 2 of 5 answered)

Reloaded at message 3 (2 answered, scores 100 and 87). Result:

- Survives: the kiosk stage. The kiosk reopened on Defend with Brief marked "(done)", the task stayed open, the game is still the same game.
- Does not survive: the answers. Opening the inbox again showed the Brief screen with "Closing or reloading before the end restarts this round from the first message." and `answered: 0`. I replayed messages 1 and 2 from scratch. The earlier IT Security replies and scores are gone. The final result counted only the replayed round.
- Side effects: the Mission Brief note page appeared again after the title screen. The title screen needed several Space presses spread over about 15 s before it advanced (may be a harness timing quirk; the first run advanced on the first press).

The warning text is on the screen before the round and is accurate, so this is by design, but a learner who reloads at message 4 of 5 loses everything (D6). The same warning appears in E3 and E7. Not tested in those two.

### D10 (minor), quote

In-round feedback for the Marsh End Eggs message, "Not a flag here" block:

> Payment or bank details changed at the last minute. It is a bank change, but it was checked the safe way: Adaeze rang Marsh End on the number already in the supplier file, not one from their letter, and logged it.
> The address is Adaeze's real Brightwell one, and the name matches it.
> It is a bank change, but it was checked the safe way: Adaeze rang Marsh End on the number already in the supplier file, not one from their letter, and logged it.

The same sentence appears twice. (The end-of-round debrief card shows it once.)

### D11 (minor), quote

For the look-alike bank message I ticked "Link or sender domain is a look-alike of the real one" and "Payment or bank details changed at the last minute". Feedback:

> Spotted: Link or sender domain is a look-alike of the real one (The display name is right, but the address is brightwel1foods, with a digit 1 where the l should be)
> Missed: Sender address doesn't match the display name or a known contact (It signs off as Brightwell Accounts, but the address isn't a Brightwell one at all, so it isn't who it says it is)

Those are the same observation. It cost 13 points (87 of 100) and the result grid read "Sender address: caught 0 of 2 ... Weakest skill: Sender address (caught 0 of 2)". The tick label the learner saw was "The sender's address doesn't match who it says it is", which differs again from the feedback's wording. A learner who picked the look-alike tick is told they have a weakness in sender checking.

## 2. awareness_e3_helpdesk_reset_defend (phone)

Brief: "Awareness episode E3, service desk only. You're in Leila Nassar's seat on the IT service desk at Quayholt Insurance, a fictional insurer. Four calls are waiting and a sign-in prompt from overnight is still on your phone: help the real callers, and ring back or escalate anything that doesn't sit right." Darren Price (NPC) repeats it. Kiosk panel names: Brief, Defend, Debrief; Defend button "Open the queue".

Verdicts played: Gordon impostor, Ring back, ticked "Caller discourages you from calling back the official number" (80, missed "Someone senior is invoked to skip a check"); Gordon real, Ring back (100, "Checking first is fine. This caller was genuine"); Josh Henley on behalf, Escalate (87); Chen Jiayi new starter, Ring back (100); overnight sign-in prompt, Deny and report (100). Result "Score 93 percent". Mission-end screen "Service desk queue done / You've worked through all four calls and the sign-in prompt, and finished this episode."

Stands on its own: mostly. The intro says what to do and why. The in-round screens are the best of the three: the call panel shows "What the caller claims" (name, team, manager, staff reference) and the transcript, and the action buttons are phone-specific and well explained: "Comply / Do what the caller asks.", "Escalate / Pass the call to security.", "Refuse / Say no and hang up.", "Ring back / Hang up and ring back on a number you already hold." The sign-in prompt has Approve / Deny / Deny and report with plain explanations. The tick list is call-specific ("Caller discourages you from calling back the official number", "An MFA prompt you didn't trigger"). Two same-name callers (both "Gordon McLeish", same four facts) is a good teaching beat: the real-caller feedback says "The facts couldn't tell them apart; the callback could."

The debrief copy lets it down (D2, D3, D4 below).

Kiosk text after the round: "A touch-screen kiosk showing the Quayholt service desk queue. Four calls are waiting, and a phone beside it shows a sign-in prompt." changes to "... The calls and the sign-in prompt are all dealt with." Darren's line changes to "That's the queue cleared, thanks. If a caller won't let you ring them back, that tells you most of what you need."

### D2 (major), quote

The debrief card headings are the raw ids, not the caller names (the E1 and E7 debriefs print the subject or sender):

> e3_call_gordon_impostor
> e3_call_gordon_real
> e3_call_on_behalf
> e3_call_new_starter
> e3_push_early

The first two also give the answer away in the heading (although after the fact).

### D3 (major), quote

My answers were Ring back, Ring back, Escalate, Ring back, Deny and report. The debrief text printed:

> e3_call_gordon_impostor: "You chose Verify. You checked first. That is a sound habit."
> e3_call_on_behalf: "You chose Report. Reported. That warns everyone else."
> e3_push_early: "You chose Report. Reported. That warns everyone else."

The in-round feedback had said "You chose Ring back. Right call: ringing back on a number you already hold is how you check." and "You chose Deny and report". The debrief uses the generic email verbs, not the ones the learner clicked.

### D4 (major), quote

Result grid for the phone set:

> Phish caught 3 of 3
> Reported rather than just deleted 2 of 3
> Real mail trusted 0 of 2
> Checked by another route 3

Both real callers (Gordon, Chen Jiayi) were handled correctly by ringing back, and the intro says "Ringing back a real caller never costs you anything." but the grid shows "Real mail trusted 0 of 2". The words "mail", "phish" and "deleted" are email terms. The round summary adds "Sharp: you caught the phish and knew why. Reported 67% of the phish." On E7 (mixed set) the same line says "Real mail trusted 2 of 3" because the correctly Verified real voicemail (Lindiwe) is counted as not trusted. Minor there; on E3 it reads as failing both real callers.

### D5 (minor), quote

First screen of the minigame after "Open the queue":

> Inbox check: 5 messages
> ... For each call, choose Comply, Ring back (hang up and ring the number already on file), Escalate or Refuse ...
> Trust / This is real. I'd open it or act on it.
> Report / This is a phish. Send it to security.
> Delete / This is junk. Bin it.
> Verify / I would check this by ringing a number I already hold.
> On a call: Comply (do what the caller asks); Escalate (pass the call to security); Refuse (say no and hang up); Ring back (hang up and ring back on a number you already hold).

The heading and the email legend are wrong for a call queue, and the learner then sees a second, correct legend. The real buttons on screen are the call ones. Also "Right call is most of the score; naming the flags is the rest." (the F6 issue from the previous note).

## 3. awareness_e7_voice_ceo_defend (voice)

Brief: "Awareness episode E7, phone and inbox only. You're covering the finance office's phone and inbox at Brightwell Foods, a fictional food manufacturer, on a Friday afternoon. Three voicemails and two emails are waiting, and you can't always tell by the voice who left them: decide what to do with each, and ring back or report anything that doesn't sit right." Kiosk intro adds "No real person's voice is used." and the Defend step says "Read each voicemail's transcript: what it asks you to do matters more than whose voice it is. Work through them at your own pace; it all comes back to ringing the person yourself." Defend button "Open the voicemail".

Verdicts played: Ravinder train voicemail Trust (100); borrowed-phone voicemail Report (87); Lindiwe gate voicemail Verify (100); Ravinder 15:31 email Report (87); Marsh End email Trust (100). Result "Score 95 percent". Mission-end "Finance line done / You've been through all five messages and finished this episode."

Stands on its own: yes, the best fit of the three. The voicemail panel shows the caller line (including "in your contacts" or "not in your contacts"), duration and a transcript, and the minigame brief says "Nobody will ask whether a voice sounded real: what counts is what each message asks you to do." The tick list changes by type: voicemails get "Caller discourages you from calling back the official number", "Asked to keep it secret or to skip the normal process", "Someone senior is invoked to skip a check", "Payment or bank details changed at the last minute"; emails get the full email list. The debrief adds "How a voice gets copied" ("Recordings of someone speaking in public, such as a talk, an interview or a company video, can be used to make new sentences in a voice that sounds like theirs. ...") which is the thing an attack stage would have shown, so the missing attack is not missed. Closing: "On Monday: a voice you recognise is not proof of who is calling, and neither is an email that backs it up. ..."

Defend button and copy: the "Open the voicemail" button is singular for three voicemails and two emails (D15). The minigame heading is "Inbox check: 5 messages" (same wrong-heading problem as E3, milder, since half the set is mail), and the Trust/Report/Delete/Verify legend reads "I'd open it or act on it" for a voicemail. Acceptable on a mixed set. Because of the voice, no hearing test was possible (:3001, no TTS); transcripts carried it.

Kiosk text after the round: "... The voicemails and emails are all dealt with." Agnieszka's line becomes "All five done, thanks. Whoever's voice it is, ringing back on the number we already hold settles it."

### D12 (minor)

The voicemail tick list had no urgency option ("It's pushing me to hurry" exists only on the email list). The feedback for the borrowed-phone voicemail credits time pressure inside the secrecy tick ("'before five today' leaves no time to ask anyone"), so a learner who noticed the deadline has nowhere to tick it.

## Cross-set findings

### D6 (minor): reload restarts the round
See the reload test above. Stage survives, answers do not.

### D7 (minor), quote

Opening line of each debrief:

> E1: "You went straight to the inbox this time. These messages were written by people whose job is to make them look right ..."
> E3: "You went straight to the service desk this time. These calls were made by people whose job is to sound right ..."
> E7: "You went straight to the phone and inbox this time. A familiar voice feels like proof ..."

"This time" refers to a path the learner never had (there is no attack stage in these variants, and no earlier round). In E1 it also lands after a reload, where "this time" happens to be literally true and confusing. A defend-only debrief should say what the round was.

### D8 (minor), quote

> E1: "Nobody is marked down for a miss here. Every one of these was written by someone whose job is making it look right, and anyone working at pace can act on one."
> E3: "Nobody is marked down for a miss here. These callers rehearse sounding right ..."
> E7: "Nobody is marked down for a miss here. A familiar voice is hard to doubt ..."

The same screen opens with "Round score: 95%" and per-message scores such as "Score for this message: 87 of 100" for a correct Report where one tick was missed. Same as F5 in the earlier note.

### D9 (minor), quote

Kiosk intro on all three:

> E1: "You're on an authorised exercise at Brightwell Foods, a fictional company. ... Authorised exercise at Brightwell Foods, a fictional company. In scope: the Brightwell payments inbox."
> E3: "... In scope: four calls and one sign-in prompt in the service desk seat."
> E7: "... In scope: three voicemails and two emails on the finance office's line. No real person's voice is used."

"Authorised exercise ... In scope" is the rules-of-engagement wording of the attacker stage; the learner here is a defender, so nobody is authorising or scoping an attack. The line also says "authorised exercise" twice in a row on E1 (body, then footer). It does not hurt comprehension, but it reads as left over.

### D13 (trivial)

Kiosk after the round: "Finished / You have finished this exercise. You can close this window." There is no window to close in the game; the panel has a Close button.

### D14 (trivial)

On every tick screen: "What made you say that?" is printed as a heading, then "You chose: Trust. Tick anything you noticed.", then "What made you say that?" again.

### D15 (trivial)

E7 defend step button: "Open the voicemail". The set is three voicemails and two emails.

## What worked (for the record)

- All three run start to finish with one browser and no console edits; each ends with the right mission-end screen, `..._defend_done` and `..._defend_pass` globals and the kiosk task completed (verify-run).
- The NPC in each room gives one welcome line before and a different line after; kiosk descriptions change after the round in all three.
- The reload warning is shown before the round starts.
- Feedback on the real items is good: saying "ringing back a real caller never costs you anything" is mostly honoured (100 for Ring back or Verify on real items) apart from the grid in D4.

## Not tested

- Reload in E3 and E7 (only E1 was reloaded, as asked).
- Audio for the E7 voicemails (keyless server).
- Narrow or mobile viewport.
- Whether D1 changes for an account that has picked an avatar.
