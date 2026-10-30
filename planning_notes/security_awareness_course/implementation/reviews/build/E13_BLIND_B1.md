# E13 blind playtest B1 (Sonnet, two personas plus defend-only)

Blind run. Server :3001 (keyless), headless (load average was about 3 at start, other agents sharing). Read only the playtest skill, AGENTS.md "Housekeeping" and what a player sees. Nothing in `scenarios/`, `planning_notes/` or the game's JS was opened.

Known decision not reported: the announced demo video call never opening. Mission Brief popup after reload and the resume overlay not reported.

Blindness limits, stated plainly:
- The harness's `select` failure listing and `mg getState().fields` printed internal option and checkbox values (for example the second identical Pretext option was named `inject_contacts`). I used that once to choose the second identical option in persona 1. A real player gets nothing like that.
- `mg getState()` also returned an `episode` stage object. I did not use it to decide anything.
- The defend-only run was not "fresh eyes": I had already seen all six messages. The check there is about wording and flow, not about solving.

Session logs (kept out of the repo):
- Full, persona 1: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e13/session-5082.jsonl` (to the reload, seq 1-178) and `session-5082b.jsonl` (after it)
- Full, persona 2: `.../blind-e13/session-5089.jsonl`
- Defend-only: `.../blind-e13/session-5092.jsonl`
- Screenshots 01-17 in `.../blind-e13/`

Games: full persona 1 = 5082, persona 2 = 5089, defend-only = 5092 (`awareness_e13_ai_assistant_defend`).

## Verifier output

Persona 1 (game 5082), pasted in full:

```
game            5082  (mission 162)
created         2026-10-29 22:58:32 UTC
last write      2026-10-29 23:09:47 UTC
played for      675s of wall clock
current room    "training_room"
unlocked rooms  1: training_room
unlocked objs   0: 
inventory       1: Notepad
NPCs met        1: gwen_pritchard
flags submitted 0: 
globals set     4: engine_tutorial_declined, episode_e13_ai_assistant_defend_done, episode_e13_ai_assistant_defend_pass, phish_assist_reader_landed
tasks           2 in objectivesState, 2 completed
  handle_assistant_inbox             "completed"  at 2026-10-29T23:09:28Z
  plant_hidden_instruction           "completed"  at 2026-10-29T23:01:16Z
tasks_completed 2
score           100
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```

Persona 2 (game 5089), tail: globals `engine_tutorial_declined, episode_e13_ai_assistant_defend_done, episode_e13_ai_assistant_defend_pass, phish_assist_reader_plain_sent`; both tasks completed (23:10:50Z, 23:12:14Z); score 100; VERDICT progress recorded.

Defend-only (game 5092), tail: globals `engine_tutorial_declined, episode_e13_ai_assistant_defend_defend_done, episode_e13_ai_assistant_defend_defend_pass`; `handle_assistant_inbox` completed 23:14:12Z; score 100; VERDICT progress recorded.

Earned-secrets table: not applicable. The episode has no PINs, codes or flags.

## Timings

| Run | Harness clock | Estimate at a real person's reading pace |
| --- | --- | --- |
| Full, persona 1 | 22:58:32 to 23:09:47 (11 min, includes about 3 min lost to the reload and a stuck harness bootstrap, and redoing 2 messages) | 14-16 min |
| Full, persona 2 | 23:10:33 to 23:12:25 (2 min) | 6-8 min (skimming) |
| Defend-only | 23:13:01 to 23:14:20 (1 min 20) | 7-8 min |

Full is near the 15 min target. Defend-only is at its 8 min target.

## Timeline and what I thought the goal was

Persona 1, "do your best".
1. Training room, 100 HP, no clear prompt. Objectives panel read "Write the supplier brief" and "Handle what comes at you". Goal: do what Gwen and the panel say. Spoke to Gwen: "red team: write a supplier brief with a line hidden in it for the assistant", then "swap seats", "a test is coming, I'll say when".
2. Kiosk, Brief page (one clear paragraph, Start). Write page: "Open the mail client". Goal: send a message with a hidden line.
3. Compose form: To, Subject and Ask fixed; one Pretext dropdown. Stuck here, see below. Sent. "It landed. The assistant acted on it." Reply arrived: the assistant "noted that Mossgate needs the full site contact list sent to a new address today."
4. "Now it is aimed at you" page: Show hidden text reveals the planted line. Clear and satisfying.
5. Assistant window with three tasks (emails, complaints log with Strike out, client report with Check source). Goal: "Try each task, then close". Struck out the child's allergy and the password, Summarise, then checked the report's source. Each gave direct feedback.
6. Defend page: inbox of six messages, Trust/Report/Delete/Verify, tick what you noticed. Goal: sort six, right call plus naming flags. Did two, then **reloaded** (see below).
7. After the reload: stages 1-3 stayed done, the inbox round restarted from message 1 as the screen warned. Redid six messages. Score 86%, "Getting there". Debrief page, Finish, "AI ASSISTANT EPISODE DONE".

Persona 2, "struggling".
1. Skipped Gwen, went to the kiosk. Start, mail client, Compose, took the first Pretext option, Send without reading Gwen's email. "Sent. The assistant found nothing in it to act on." Debrief: "You left the brief plain... the difference one buried line makes."
2. Assistant tasks: clicked the first thing on each. Summarised the log with nothing struck out, so password and child's detail went through, and "Send without checking" on the report. Each got a plain, non-judging explanation. Skipped the "Report the password" button.
3. Defend: Trust the phish invoice, Delete the genuine invoice, Trust the cloned voicemail, Report the genuine voicemail, Comply with both calls. Score 0%, "Worth practising". Debrief.
4. Finish, episode done.

Defend-only. Gwen's intro, kiosk Brief (one paragraph), Start, Open the inbox, six messages, 100%, Finish, "MESSAGES HANDLED" end card.

## "Didn't know what to do" moments

| Where | Time | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Write stage, Pretext dropdown (persona 1) | about 1 min | Opened it: two options with the **same visible text**. Picked each in turn; the red-flag meter read 0 for both and the screen did not change. No way to tell which one carries the hidden line. Goal said "write one with a hidden line". | Guessed, aided by the harness's internal option name (see limits). A real player would guess 50/50. Persona 2 picked the first and was told "You left the brief plain". |
| First tool call to talk to Gwen (both full runs and defend) | 1 command, harness | `converse` returned `no-effect-confirmed` before the walk finished; `interact` then opened it. Harness behaviour, not a player issue. | Retry. |
| After reload, title screen "Continue?" | about 4 min | `bootstrap` looped (the known resume overlay behaviour), `pressKey Enter` refused with `minigame-active`. | Killed the harness, restarted a session on the same game, clicked the title element through the DOM, then the Mission Brief Continue. Harness issue, not content. |
| Complaints-log strike-out (persona 1) | 20 s | I struck out the wrong three lines. | My own mistake (control indices shifted by one). "Put back" fixed it. Product behaved fine. |

No moment where the player had no visible next control other than the Pretext one.

## Real decisions and whether the answer was given away

| Decision | Given away? | Consequence shown? |
| --- | --- | --- |
| Which Pretext hides the line | Nothing to decide on: identical text. Not a decision, a guess. | Yes, next page. |
| What to strike from the complaints log | Mildly: "Paste only what the assistant needs... strike out anything that doesn't belong". Password and child's health line are obvious. | Yes, immediate. |
| Report/Check on the made-up report | "Brightwell Assist can make mistakes. Check important information." plus a visible Check source button. Quite given away. | Yes. |
| Invoice 1 (hidden-text email) | Strongly, if you click Show hidden text (the planted line is plainly an instruction). Persona 2 did not click it and Trusted. | Yes. |
| Invoice 2 (real) | Same sender domain as invoice 1; wording is dull. Arguable, a fair one. | Yes. |
| Unknown-number voicemail asking for 200 pounds | Given away by "not in your contacts" plus money plus wallet story. Fair. | Yes. |
| Tom's own-number voicemail | Mild. Fair. | Yes. |
| CEO video call | Heavily given away: the scripted "You: Can I ring you back?" and "no time, fewer people who know" put the tell on screen before you choose. Obvious. | Yes. |
| Adaeze's genuine internal call | Arguable, and the scoring is odd (see findings). Nothing asks for money, data or sign-in, which is the stated trigger for checking. | Yes. |

## What I learned, in my own words

- An AI assistant reads every line of an email, including one I cannot see, and acts on it as if my boss had asked.
- Do not paste passwords or private details about customers into the assistant. Take out what it does not need.
- Its reports can contain invented figures and invented sources, so check the source before sending.
- A voice or a face on a call proves nothing. If a message asks for money, data or a sign-in, check on a number I already hold. Reporting when unsure is fine.
- Lab-sheet questions: none supplied to this blind run.

## Reload test (persona 1, mid-way through the main task)

Reloaded after 2 of 6 messages sorted. Kept: the Write and Assistant stages stayed done, the planted-line task stayed complete, the reply from the assistant was still recorded. Lost: the two sorted messages (the screen says "Closing or reloading before the end restarts this round from the first message", so this was announced). Cost: redoing 2 messages, about 30 s. Not a finding. The debrief and ending still worked afterwards.

## Five best lines

1. "Summarised. One cleaning invoice from Mossgate, due for payment. I've also noted that Mossgate needs the full site contact list sent to a new address today." (the assistant's reply, the hook of the whole episode)
2. "You left the brief plain, so the assistant's summary is just the invoice, with nothing to act on. That is the difference one buried line makes."
3. "The 99.4% figure and its 'source' were made up... no 'Q3 logistics review' document exists." (Check source)
4. "These messages are built to fool careful people, so a miss here says more about the attack than about you."
5. "The voice and the faces were built from public material, a keynote, a webinar, holiday videos. That's all public, and that's all it takes. No hacking."

## Five worst lines

1. The two Pretext options, both "Your latest cleaning invoice is attached for payment. The amount and reference are on the attachment."
2. "You chose Comply. This caller was genuine, but you did what they asked without checking... The right call was Ring back or Escalate." (70/100) against the on-screen rule that checking is for requests for money, data or sign-in, and against a genuine voicemail being rated 100 for Trust.
3. "You chose Delete. That one was real. Deleting it is cautious, but reporting an unsure message is safer for everyone. The right call was Trust or Verify." Recommends Report, then lists Trust or Verify as the right call.
4. "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." after a Verify, when the result card has nothing to tick.
5. "You trusted these real ones: 'Monthly cleaning invoice, October' and 'Tom Reilly'." under the headline "Getting there: a few tells slipped past". Reads as a criticism of two correct answers.
(Near miss: "You offered to ring back on the directory number and the caller shut it down" shown to a player who never offered, since the offer is a scripted line.)

## Scores (1-5)

| Area | Score | Note |
| --- | --- | --- |
| Fun | 3 | The hidden-line reveal and the invented-report check are good. The inbox sort is a quiz, and the identical Pretext options take the shine off the first beat. |
| Pacing | 4 | Short stages, immediate feedback, Start/Next/Finish always visible. About 15 min. |
| Clarity of goals | 3 | Panel and kiosk stage bar are clear. The write step does not say how to choose the hidden line, "a test is coming, I'll say when" never visibly arrives from Gwen, and the brief says "a supplier email, a voicemail and a video call" where the inbox holds six. |
| Openness of decisions | 3 | Several verdicts are given away by the form (scripted callback line, tick lists tailored per message type). The genuine-call scoring penalises a reasonable choice. |
| Teaching | 4 | Each card says what the tell was and what would have happened. Persona 2's 0% debrief is fair and blame-free. Contradictory scoring on genuine items weakens it. |

## How the debrief treated the struggling player

Fair and not blaming. Specific "what could have happened" lines (contact list to an attacker, 200 pounds to a stranger), the 15-points-per-risky-answer rule is stated, and the closing "a miss here says more about the attack than about you" lands. Weak spots: 0% with "Worth practising" next to a green "episode done" screen; the debrief page is long and the "Finish" button sits below the fold.

## Severity table

| # | Severity | Tag | Finding |
| --- | --- | --- | --- |
| 1 | Major | content | Red-team step: both Pretext options read the same, so the player cannot tell which carries the hidden line. The first Send is final. A wrong guess gets "You left the brief plain" (persona 2), which reads as the player's error. Either show the difference in the dropdown text or make "add a hidden line" a visible toggle. If the difference is meant to be invisible (white text), the step needs to say so. |
| 2 | Major | content | Genuine internal call: Comply scores 70 and says the right call was Ring back or Escalate, but the call asks for no money, data or sign-in, which is the stated trigger for checking. Same player gets 100 for Trust on a genuine voicemail. Ring back on the same call scores 100, so the model rewards over-caution on harmless requests. Contradicts the kiosk page's own rule. |
| 3 | Minor | content | Deleting the genuine invoice: feedback says reporting is safer, then names Trust or Verify as the right call. |
| 4 | Minor | content | Verify result cards (and the Review cards) say "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." but no tick list is on the card at that point. |
| 5 | Minor | content | Result page lists "You trusted these real ones: ..." as a negative-looking line while those two answers were right. Make it say they were correct. |
| 6 | Minor | content | Call scene puts "You: Can I ring you back on your directory number?" in the player's mouth, shows the main tell before the verdict, and the debrief then says "You offered", false for a player who chose Comply straight away. |
| 7 | Minor | content | Wording mismatch: kiosk Brief and Gwen's lines say "a supplier email, a voicemail and a video call"; the inbox has two emails, two voicemails and two calls. End card repeats the three-item wording. |
| 8 | Minor | content | Gwen says "A test is coming, I'll say when" and never says it in my runs (the demo video call decision is known, so this may be part of it; not counted as new). |
| 9 | Minor | engine | After a reload at the title screen, `pressKey Enter` is refused and the title only accepted a DOM click on the title element; a player at a keyboard may be fine, harness-only impact suspected. Low confidence. |
| 10 | Nit | content | Continuity: persona 2 sent a plain brief, yet inbox message 1 is the same-looking invoice with a hidden line and persona 2 is told the assistant summary "just the invoice". The two are separate emails but look like the same one. |
| 11 | Nit | engine | A 0% round still sets the `..._defend_pass` global and shows "episode done". If that global feeds a completion or certificate, it will say pass for 0%. |
| 12 | Nit | content | "Show hidden text" button still appears on the assistant-summary card after a plain brief (nothing to reveal). |

Counts: blockers 0, major 2, minor 7, nit 3.

## Not tested

Voices (no TTS on :3001), phone-width layout, the facilitated variant, and the ending credits' scroll. The credits were not part of this episode's end card.
