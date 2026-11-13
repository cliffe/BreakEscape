# M5 review, round 5 (m05: Recruiter's first call, root-flag ring, after engine R2 fixes)

Reviewer: Opus 5.5, 2026-11-12. Light round. Code under test: committed `ba1300ab1`. No uncommitted engine or m05 change. Inputs: `REVIEW_M5_R4.md`. The Recruiter is an ENTROPY antagonist in authorised Cyber Security teaching content; her lines were read for clip quality only.

**Verdict: accept, slice closed. 0 B, 0 M, 0 m, 3 n.**

## Validators

- `scripts/validate_scenario.rb scenarios/m05_insider_trading/scenario.json.erb`: exit 0, schema passes. Warnings are the known onceOnly-overlap and timed-text ones. Dialogue lint (advisory) flags `m05_phone_agent_0x99.ink:1083` at 27 words, in the text-only progress knot.
- Phone-call check run on its own: **0 issues**.

## Live smoke (keyless :3023, headless, server stopped afterwards)

Route `proofs/PS_m05/route.sh` (`rec_decline`, `root_slow`) with `OUT=proofs/R5_m01_m03_m04_m05`. Output `m05_*.txt`, screenshots `rec_decline_*`, `root_slow_*`.

| Case | Game | Result |
|---|---|---|
| Recruiter's first call (naming call, decline, call back) | 2359 | Patricia's Call button connects on "Morgan."; the naming runs to "...Damn. His kids drew on the tablecloth at our Christmas party." and the call ends itself. The Recruiter rings 7 s after the phone closes: banner "The Recruiter \| TalentStack Executive Recruiting \| Incoming call". Decline sets `recruiter_texted`, nothing else rings in 12 s, and her thread shows one "Missed call" row, "Call back" and the TalentStack text. The callback's CALLING screen shows "TalentStack Executive Recruiting" from the first frame. Connects on "You rang back. Manners, or curiosity?" then "Agent. Or whatever they're calling you this week." with three choices; `recruiter_contacted_player` true, `as=0 callback`. |
| HaX's root-flag ring caption | 2365 | `flag4_submitted` rings HaX: banner "Agent HaX \| SAFETYNET secure line \| Incoming call", still ringing with the caption at 40 s (`untilAnswered`). Answered at `as=42`: "Finally. Sit down for this." then the authorisation lines and "It puts this above Torres." |

## Voiced lines re-read

HaX `topic_architect` (`ink/m05_phone_agent_0x99.ink:327-372`) and `extract_call` to `extract_go` (:963-1020); the Recruiter's `first_call` through `mid_mission_contact_choices` (`ink/m05_phone_recruiter.ink`); Patricia's `phone_call` and the naming path (`ink/m05_phone_patricia.ink`). No typos, printed variables or stage directions. Two checks that came out clean:

- The Recruiter's callback and slow-answer openers are separate `{...}` blocks, not an if/else, but a callback always connects with `answerSeconds` 0 (`phone-ringer.js:1022-1032`), so both can't play together. The live callback shows only the first.
- "His upload schedule's still on the desk." in `extract_call` names no one, but the bring-in choice needs `final_choice` set (:185), so Torres is known by then.

## Findings

### n1. Two `conversation_closed:patricia_phone` for the naming call
At 72.3 s and 73.4 s. The first is the call ending itself; the second is the route closing the phone on her thread straight afterwards. R4 logged the same pair. The Recruiter rang once. No action.

### n2. "You: ..." in the Recruiter's silent-choice branch
`[Say nothing. Let her fill the silence.]` is followed by `You: ...`. The speaker classifier (`phone-chat-speaker.js:25`) makes it a player line, so it is not voiced as her. Nothing to change; worth a glance when the audio count is taken, so it isn't counted as a Recruiter line.

### n3. Carried from R4
R4 n1 (a requeued ring keeps its elapsed ring time, by design), R4 n2 (`captions` route uses a text choice) and R4 n3 (R2 n2/n3). Unchanged.
