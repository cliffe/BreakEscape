# Phone calls: review of the caller writing, round 2

Reviewer: dialogue review (npc-dialog-review skill, 2i to 2k), 2026-11-12.
Under review: branch `build/phone-calls-writing`, fix commits 7666e9494 (m09), a5bc7eb32 (m04 Vance),
09df82fcc (m05 Recruiter, Patricia), acc063b4c (m07 Architect), c6883e2ac (outcomes, notes).
Read against `REVIEW_WRITER_CALLERS_R1.md` and `_R1_OUTCOMES.md`. HaX's own files are out of scope.

## Verdict: revise

Every R1 blocker and major is fixed, and the m07 router no longer loops. Round 2 finds three small
majors, all one-line fixes: two were caused by the R1 fixes themselves (an orphaned Recruiter line after
a B2 cut, and Patricia's new answer line contradicting her next reply), and one is a voicemail that says
something false. The orchestrator's `recruiter_line_dead` question is a real config bug (M4). Then
there are clip savings, mostly voicemail lines that can reuse the live calls' exact strings.

## Checks run

- `bin/inklecate` on all eight caller inks (m04 Vance; m05 Recruiter, Patricia; m07 Architect; m09 Gary,
  Nightshade, Torres, Recruiter), compiled in scratch copies: all clean, and the committed `.json` matches
  a fresh compile.
- `loopcheck.js` on m07, all six strategies, every case passes:
  `start` with `grid_saved=true architect_contact=true heard_t30=true` (R1's RUNAWAY), `start grid_saved=true
  architect_contact=false` (R1's hang), `start` default, `start grid_saved=true heard_signoff=true` and
  `architect_signoff_done=true` (clean end at step 0), `dormant` with and without `grid_saved`, `parked`
  with and without `grid_saved`, `dead_air grid_saved=true`, `start architect_contact=true`. Every call
  entry passes with a clean end: `taunt_t30` to `taunt_t1`, `sign_off`, `seattle_call` and all six `*_vm`
  knots. The other callers pass too: Patricia `phone_call` and `start`; Recruiter `first_call`,
  `return_contact` and `start`; Vance `support_call` (5 of 6 strategies end, the sixth keeps choosing hub
  topics, which is expected) and `start`; m09 `call` and `start` for Gary, Nightshade and Torres, plus `start`
  for the m09 Recruiter.
- `dialoguelint.mjs` on the four scenario copies: no error in a caller file. The remaining hits are
  the two false "however" warnings in m07 (`:115`, `:556`), the Recruiter's deliberate `:392` villain line
  and her allowed `:102` "You: ...".
- A7a validator (`p-phone-calls/scripts/validate_scenario.rb`). Note for the next reviewer: the validator
  resolves `storyPath` against its own repo root, so run from `p-phone-calls` it checks the ink in
  `p-phone-calls`, not this branch (R1's line numbers for Patricia match the old file). I re-ran it from
  a scratch root with this branch's scenarios and the validator's `scripts/`, `lib/` and `public/`
  linked in. On this branch's ink, the caller hits are all config still to come (per the merge rule, ink
  lands with its config): "call me / no call entry" for Vance (ERB `:1520`, ink `:273`) and Patricia
  (ERB intro, ink `:150`, `:188`, `:385`), and "call VARs declared but no ring and no call entry" for the
  Recruiter (`:28`, `:29`). There are no `call-in-text-thread` hits on caller files and no Seattle
  duplicate warning. The `#place_call ... not one of the contact's call entries` errors and m07
  `m07_phone_agent_0x99.ink:800` belong to HaX and are also config-pending.
- T-30 to T-1 timing: no writing commit touches `m07_architects_gambit/scenario.json.erb`. The taunt timers
  (`:639-723`), their globals and delays are as before. `#set_global:architect_signoff_done:true` is still
  the first thing in `sign_off` (`:408`).

## R1 findings: status

| R1 | Status |
|---|---|
| B1 m07 router loop | Fixed (`start :57`, `dormant :73`, `dead_air_choices :474`); loopcheck above |
| B2 Recruiter first call | Fixed, but one cut left an orphan line (M1 below). Longest path is now 22 lines, typical 14 to 18, not 17 |
| M1 casualty de-dup | Fixed; `architect_discussed` is a declared m05 global (ERB `:751`). Wording slip in the line R1 supplied (m1) |
| M2 Patricia opens in silence | Fixed, but one branch clashes with her next reply (M2 below) |
| M3 Patricia ring-me-back, goodbye | Fixed (`:187-190`, `:148-163`) |
| M4 Vance call end | Fixed (`:271-285`) |
| M5 Vance repeats | Fixed (`:151`, `:170-174`). Stale comment, m9 |
| M6 m07 voicemails | Fixed; openers on T-30 and T-20 only, referents and branches right. Seattle voicemail is new and false (M3) |
| M7 ten minutes | Fixed (`:224`, `:236`, `:239`); see m7 |
| M8 Seattle | Fixed (`:509-531`); see "Disagreements" |
| M9 m09 stubs | Fixed (all three, plus the m09 Recruiter's fake ring-back) |
| M10 Nightshade co-speaker | Fixed (`m09_phone_nightshade.ink`, `agent_0x99:`) |
| m1 to m6, m10, m11 | Fixed. m10 only half done (m07 header, m9 below) |
| m7 HaX text during her ring | Resolved in effect: `recruiter_contacted_player` is now set at the first choice (`:84`), so ERB `:1259` is skipped if she is answered within 12 s, and a toast sent while it still rings reads as advice to answer |
| m8 Gary callback | Not added; accepted (see "Disagreements") |
| m9 ringing someone in the same room | Implementer's call, unchanged |

## Findings

### Major

**M1. The Recruiter's introduction opens on a line with no antecedent.** `m05_phone_recruiter.ink:110`
"The only variable is what currency they'll take." B2 cut "Everyone has a price…", the line this one
answered. It now follows "You're describing the outcome as though I invented the cancer." (`:94`), the
forty-seven line (`:98`) or the silence reply (`:103`), and "the only variable" has nothing to refer to.
Cut `:110`. `:112` ("Torres took debt relief and a standing consultancy retainer. Cheaper than most, if
you're keeping score.") follows all three replies well. (-1 clip, -1 line on every first-call path.)

**M2. Patricia asks "Where is he?" and then says "I know."** `m05_phone_patricia.ink:107` with `:134` and
`:403`. When Torres is named and not yet confronted, she answers "Morgan. Where is he?", the player picks
"[He's in the data centre.]", and she replies "I know. I'm watching his badge. He hasn't moved." She asked
something she already knew. Rewrite `:107` as "Morgan. Have you got him?" Then "[He's in the data centre.]"
answers it (not yet), and "I know…" follows naturally. "[Just checking in.]" → "You know where he is. Go."
still works. (0 clips.)

**M3. The Seattle voicemail says the player is on the phone.** `m07_architect_comms.ink:655`
`voice: Three to go, and you're on the phone to me.` A voicemail means they let it ring. Rewrite as
`voice: Three to go, and you let it ring.` (`:654` stays, same clip as the live line.) It's 0 clips
either way: the old string was already a different line from the live `:520`, so it was a clip of its own.

**M4 (orchestrator's question). `recruiter_line_dead` is not a global, so the planned `when` always holds.**
Plan 7.2 row 20 gives the Recruiter `call: { knot: "return_contact", when: "!globalVars.recruiter_line_dead",
unavailable: "no_answer" }`. m05's `globalVariables` (ERB `:715-760`) declare `recruiter_texted`,
`_deal_decided`, `_contacted_player`, `_deal_offered`, `_deal_accepted`, `_deal_confessed` and
`_discussed`, but not `recruiter_line_dead`. The ink sets it with a plain `~` (`:396`, `:408`), and the
engine writes an ink VAR back only when the name is already a global (`npc-conversation-state.js:522`,
`if (!(name in window.gameState.globalVariables)) return;`). So `globalVars.recruiter_line_dead` is
always undefined, the `when` is always true, and after her final statement every press of Call
reaches `return_contact`, which replays `deal_*_response` and `recruiter_final_statement`, or
`never_talked_terms`, as a voiced call. Nothing in `return_contact` reads the ink-local copy.
Fix: **declare it**, `"recruiter_line_dead": false`, in m05 `globalVariables` next to the other
`recruiter_*` globals, and keep the condition. Then `unavailable: "no_answer"` rings out once she has
said her last word, as the ink comments (`:23-25`, `:431-433`) intend. Don't drop the condition: without
it the replay above happens every time. No ink change is needed: once the name is a global, the `~`
assignments sync it. This goes in the M5 config step and the 7.2 row should say so. There's no
call entry in the ERB yet, so nothing is broken today.
**Validator:** yes, it should catch this. It already warns on undeclared `globalVars.x` in action
conditions (`validate_scenario.rb:5981-5984`) and chatBackground conditions (`:4369`), but not in a `call`
entry's `when`, and the search for `'when'` turns up no check. Add the same WARNING for each
`call` entry's `when` (one entry or a list), worded "…which is not in globalVariables, so the call is
always available". The other caller `when`s are declared: Patricia (`patricia_phone_available`,
`patricia_ko`) and Vance (`vance_is_ally`, `robert_vance_ko`, m04 ERB `:2954`, `:2994`).

### Minor

- **m1.** `m05_phone_recruiter.ink:165` "I just recruited the man who could get **you** the schedule." That
  was R1's wording, and it's wrong: the schedule went to ENTROPY, not to the player. Make it "get us the
  schedule", as in the else branch (`:168`). (0 clips.)
- **m2.** `m05_phone_recruiter.ink:276` "Good luck with Torres. He was cheap. The next one might cost me
  more…" repeats `:112` ("Cheaper than most") and `never_talked_terms` `:407` ("the next one will cost me
  more"). Cut it. The refusal ends on `:274`, "You won't reach all of them before I've closed on a few
  more.", which is the stronger last line. (-1.)
- **m3.** `m05_phone_patricia.ink:219-229`: four openers for "why him", split on `has_motive() and
  has_exfil()`, a difference the player can't see. Use two lines for both cases: "Again? Fine. Convince
  me this time." / "David. Why?" (-2. Optional: "I'm writing this down" adds some colour.)
- **m4.** `m05_phone_patricia.ink:393` "...Every night. I sign that log off every Monday, and I never once
  read the front door." is a near-copy of `:274-275`, so it costs a new clip. Use the two exact lines
  `:274` and `:275` instead. (-1 clip; 0 new.)
- **m5.** `m05_phone_patricia.ink:109` "Morgan. Is it over?" followed by "[Just checking in.]" and "It's
  done, then." means she asks, gets no answer, then answers herself. Make it "Morgan. I've been watching
  the vault log." (0 clips.)
- **m6.** m07 voicemail lines that are a few words off the live calls' lines, so each is a new clip. The
  voicemail extractor speaks them in the same voice block (plan 4.2), so exact strings reuse the audio:
  - `:557` → `voice: Let it hurt afterwards, not during. I expect you've been told that.` (= `:117`) (-1)
  - `:598` → `voice: Doors close. It's the one thing they reliably do.` (= `:267`) (-1)
  - `:640` → two lines, `voice: Late. I did wonder.` and `voice: But the grid was never the point.` (= `:366`, `:371`) (-1)
  - `:642` → `voice: Closer than the file suggested. Not close enough to be comfortable.` and `voice: But the grid was never the point.` (= `:368`, `:371`) (-1)
  - `:644` → `voice: You'll work it out. Probably tonight. Probably in a room with a tablet in it.` (= `:382`) (-1)
  HaX's "[He used your line. \"Let it hurt afterwards.\"]" still matches `:557` after the change.
- **m7.** `m07_architect_comms.ink:224`: "Ten minutes before your team is too committed to move." on the
  `team_redirected` branch is spent information, since the team has already moved. Drop it from that
  branch only. It stays on `projection_revised` and `else`. (0 clips.)
- **m8.** `m07_architect_comms.ink:334` `t5_close` still picks between two voiced lines inline. It's
  pre-existing, but M6 split every other one. Write it as a `{ - cond: … - else: … }` block. (0 clips.)
- **m9.** Stale comments: m04 `m04_phone_robert_vance.ink:172-173` (says "the one thing they couldn't
  touch" is in `charge_control`, which no longer says it); m07 `:483-487` ("Every exit parks here": the
  call knots end `-> DONE` now). R1 m10 listed the m07 header; it wasn't done.

## Clashes with HaX's lines in the same mission

- m07: none. `seattle_call` ("Three to go") agrees with HaX's text five seconds later (ERB `:1074`, `:1080`,
  "Steps two to four haven't"), and leaves the next step to her.
- m05: the M1 de-dup works one way only. If the Recruiter rings first, HaX's root-flag call
  (`m05_phone_agent_0x99.ink:327-345`) still lays out the projection in full. That's acceptable, because
  HaX brings the signed document and the Recruiter only talked about it, but HaX's writer could open on
  it with `recruiter_deal_offered`. HaX's file, so it's only noted here.

## The writer's two disagreements

- **Gary callback line (R1 m8): accept.** It was optional, and the stale "HaX says you're stood at a
  keypad" on a callback is a small blemish. If anyone revisits it, the cheap form is one
  `{call_is_callback: …}` line before the hint. That needs only the VAR, not a restructure, and the hint
  still plays. Not worth a round.
- **"Seattle first. Exactly as scheduled." vs the bark: accept.** By the merge rule the m07 ink lands
  together with its config, which drops the bark's `sendTimedMessage`, so either wording is fine at
  runtime. The writer's version also avoids a validator warning on this branch until then. The only
  condition is that the config step really drops that bark (ERB `:1644`). If the bark stayed, either
  wording would tell the player the same thing twice in a row.

## Size: is every line earning its clip?

**Patricia (52 clips): yes, nearly all, and her call is a phone call's length.** Any one call is short:
an answer and a topic come to 2 to 4 lines, and the naming call, her longest, comes to about 13 or 14
(answer, "Who?", "Why?", the reason reply, the proof reply, then `phone_significant_findings`). That
is the whodunnit's climax done by phone, not padding. The count is high because of branching: about 20
of her clips are one-line replies to a wrong name or a wrong reason, each the consequence of a choice
the player made, and the case needs them. The cuts available are m3 and m4 (-3).

**Recruiter (50): mostly.** Her first call runs 14 to 22 lines by path (22 only with callback, receipt,
dispatch question and terms all taken), which is long for one voice but in budget for the mission's
villain call (plan 7.2: ~45 for the first call). Cuts: M1 and m2 (-2). Nothing else repeats.

**m07 (~75): the live calls are lean (2 to 5 lines a taunt). The savings are in the voicemails (m6, -5).**

Line-by-line cuts, with counts after:

| File:line | Action | Clips |
|---|---|---|
| `m05_phone_recruiter.ink:110` | cut (M1) | -1 |
| `m05_phone_recruiter.ink:276` | cut (m2) | -1 |
| `m05_phone_patricia.ink:219`, `:221` | replace with `:227`, `:229` strings (m3, optional) | -2 |
| `m05_phone_patricia.ink:393` | replace with `:274` + `:275` (m4) | -1 |
| `m07_architect_comms.ink:557`, `:598`, `:640`, `:642`, `:644` | reuse live strings (m6) | -5 |

## Voiced lines per mission after these cuts

| Mission | Caller | Writer's count | After this review |
|---|---|---|---|
| m09 | Nightshade, Torres, Gary | ~22 | ~22 |
| m04 | Vance | ~47 | ~47 |
| m05 | Recruiter | ~49 (I count 50) | ~48 |
| m05 | Patricia | ~53 (I count 52) | ~49 (51 without the optional m3) |
| m07 | Architect, live and voicemail | ~75 | ~70 |

Totals: m09 ~22, m04 ~47, m05 ~97 (from ~102), m07 ~70.
