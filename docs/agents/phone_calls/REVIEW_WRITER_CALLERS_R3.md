# Phone calls: review of the caller writing, round 3

Reviewer: dialogue review (npc-dialog-review skill, 2i to 2k), 2026-11-12.
Under review: branch `build/phone-calls-writing`, fix commits 4ed621179 (m04), e1a63d819 (m05),
e57d6fb94 (m07), 6115c5548 (docs). Read against `REVIEW_WRITER_CALLERS_R2.md` and `_R2_OUTCOMES.md`.
HaX's files are out of scope except for clashes.

## Verdict: revise (one small major, 0 clips)

Every R2 finding is fixed as specified and nothing the fixes touched has broken. A full read of each
call, route by route, finds one new problem, and it comes from the M6 conversion itself: hanging up
on the Architect's first call before its last lines loses the teacher echo for the rest of the
mission (M1). The fix is four conditions. There is one minor ordering nitpick in a voicemail (m1).

## Checks run

- `bin/inklecate` on all eight caller inks (m04 Vance; m05 Recruiter, Patricia; m07 Architect; m09 Gary,
  Nightshade, Torres, Recruiter) in a scratch root made by `git archive` of this branch: all clean, no
  warnings, and every committed `.json` equals a fresh compile.
- `loopcheck.js` (p-phone-calls copy), no failure in any case:
  - m07: `start` (default; `architect_contact=true`; `grid_saved=true` with and without
    `architect_contact`, with `heard_t30=true`; `grid_saved heard_signoff`, clean end at step 0),
    `dormant` and `parked` with and without `grid_saved`, `dead_air grid_saved=true`; every call entry
    reaches a clean end: `taunt_t30`, `taunt_t20` (plain, and Trojan redirected), `taunt_t10` (T-20
    folded with fracture; window closed), `taunt_t5`, `taunt_t1` (with and without `countdown_expired`),
    `sign_off`, `seattle_call` and all six `*_vm` knots.
  - m05 Patricia `phone_call` (four states, including the full naming path) and `start`; Recruiter
    `first_call` (plain, callback), `return_contact` (deal not offered, offered, post-confrontation with
    and without an offer) and `start`.
  - m04 Vance `support_call` (5 of 6 strategies end; the sixth keeps picking hub topics, as a hub should)
    and `start`; m09 `call` and `start` for Gary, Nightshade and Torres, `start` for the m09 Recruiter.
- `dialoguelint.mjs` on m04, m05, m07, m09: no error in a caller file. Remaining hits are the known
  ones: m07 `:115`, `:560` false "however"; Recruiter `:102` allowed "You: ..."; the Recruiter's
  deliberate `:388` villain "not a defence" (shown in the validator's lint pass).
- A7a validator (p-phone-calls `scripts/` copied over the archive, run there). Caller hits are all
  config-pending, as in R2: Vance "Call me" with no call entry (ERB intro, ink `:274`); Patricia
  "Ring me" (ERB intro, ink `:150`, `:188`, `:385`); Recruiter call VARs declared but no ring or call
  entry (`:28`, `:29`). No `call-in-text-thread` hit on a caller file and no Seattle duplicate
  warning. The `#place_call` errors (m05 `m05_phone_agent_0x99.ink:220`, m07
  `m07_phone_agent_0x99.ink:229`) are HaX's and also config-pending.
- T-30 to T-1 timing: no caller commit touches `m07_architects_gambit/scenario.json.erb`. The only ERB
  change since R2 is HaX's `:869` text. Timers (`:639-734`), globals and delays are unchanged, and
  `#set_global:architect_signoff_done:true` is still the first line of `sign_off` (`:411`).

## R2 findings: status

| R2 | Status |
|---|---|
| M1 Recruiter orphan line | Fixed. All three replies lead into "Torres took debt relief…" (`:110`), and "[You're talking about him like a receipt.]" now answers "if you're keeping score" |
| M2 Patricia "Where is he?" | Fixed (`:107`). "[He's in the data centre.]" answers "Have you got him?" and "I know. I'm watching his badge." follows |
| M3 Seattle voicemail | Fixed (`:661`) |
| M4 `recruiter_line_dead` | Logged for config in `WRITER_CALLERS.md` (declare it, keep the `when`); no ink change needed. The validator now has the `when` check (b82742b1f) |
| m1 "get us the schedule" | Fixed (`:163`) |
| m2 Torres cut | Fixed; refusal ends on `:272` |
| m3 Patricia openers | Fixed (`:217-230`) |
| m4 badge-log reply | Fixed (`:393-394` = `:274-275`, exact strings) |
| m5 Patricia final opener | Fixed (`:109`), and it picks up her own "I'll be on the vault log." (`:405`) |
| m6 voicemail reuse | Fixed: `:561` = `:117`, `:602` = `:266`, `:644`/`:645` = `:369`/`:374`, `:647`/`:648` = `:371`/`:374`, `:650` = `:385` |
| m7 spent "ten minutes" | Fixed (`:223-224`) |
| m8 `t5_close` inline pick | Fixed (`:333-337`) |
| m9 stale comments | Fixed (m04 `:172-174`, m07 `:487-490`) |

## Findings

### Major

**M1. Hanging up on the first Architect call loses the teacher echo for good.**
`m07_architect_comms.ink:114` (`t30_close`) and the four catch-up conditions at `:184`, `:271`, `:338`,
`:390`. The echo line ("Let it hurt afterwards, not during. I expect you've been told that.") and its
`#set_global:architect_echo_heard:true` sit in `t30_close`, after the T-30 choice. Under the call
rules, End stops the call where it is and resets the story to the home knot (plan 2.3 row 25), so the
rest of the knot never runs. A player who answers T-30 and hangs up on "Don't look for the trace…"
(a natural thing to do to a villain) never hears the echo. The catch-up in the later closes only fires
on `late_first_contact`, which is false because `taunt_t30` set `heard_t30` at its top. So
`architect_echo_heard` stays false all night and HaX's `[He used your line. "Let it hurt
afterwards."]` (`m07_phone_agent_0x99.ink:281`, the P6 teacher thread) never appears. In the text
version a close at the choice resumed on the choice, so this is new with the calls.
Rewrite: in `t20_close`, `t10_close`, `t5_close` and `t1_close`, change
`{late_first_contact and not architect_echo_heard:` to `{not architect_echo_heard:`.
`architect_echo_heard` is set by every path that says the line (live T-30 close, `taunt_t30_vm`,
each catch-up), so it alone answers "has he said it yet?". That covers the late-first-contact case
as before, and the early hang-up too: the line moves to the end of the next call he finishes. Leave
`late_first_contact` where it is (it does no harm). 0 clips: the four catch-up lines already exist
and are the same string as `:117`.

### Minor

- **m1.** `m07_architect_comms.ink:607-613` (`taunt_t10_vm`): the folded T-20 line ("Washington,
  then. San Francisco and the vendors are on your clock.") comes last, after "…I'd hurry, but that's
  your business.", where "then" has nothing to follow. In the live call it follows his opener. Move
  the `{t20_folded …}` block up to sit between `:597` ("Stop this…") and the door block, so the
  message ends on the door, as `t10_close` does. 0 clips.

### Noted, no change

- Recruiter: if a pre-deal first call is closed by something other than End (a knockout, row 32),
  calling back replays `first_call` from the top with "You rang back. Manners, or curiosity?", and the
  `*` choices already taken are gone from the menus. The callback line covers the repeat and the path
  is rare. Not worth a round.
- Recruiter: "We have an arrangement. Don't ring this number again." (`:303`) doesn't set
  `recruiter_line_dead`, so she answers again if rung. That is correct: the post-confrontation call
  still has to reach `deal_accepted_response`.

## Read as the player hears it

- **m05 Recruiter, answered:** opener (plain / slow-answer "Take your time…" / callback "You rang
  back…"; callbacks get `call_answer_seconds` 0, so the two never stack), one of three replies, then
  Torres's price, the target, casualties (de-duped on `architect_discussed`), the deal. 14 to 21
  lines by path. **Declined then called back:** same call with the callback line (the follow-up text is
  config). **Hung up mid-call, rung again:** `return_contact` goes to the deal if none was offered
  ("Since you've rung, here's what I wanted…"), else "Still deciding?" or a remembered answer. No
  orphan lines left.
- **m05 Patricia (placed call):** three openers by state, each followed by a choice that fits. The
  naming call runs about 13 lines and reads cleanly on the motive-first and proof-first routes. A
  hang-up and redial restarts at `phone_call`; topics she has already given are gated off.
- **m04 Vance (placed call):** unchanged since R2 apart from a comment. Openers by state; call ends on
  "Call me if you need it." plus a state line.
- **m07 Architect (withheld):** each taunt opens on "No caller ID…" narration for first contact and a
  different line for later calls; 2 to 5 spoken lines a call; voicemails are short recorded messages
  that keep each taunt's point, open in his voice ("You let it ring. Sensible." / "Busy. Of course."),
  and only replace the live call they stand in for (answer XOR voicemail), so reused strings are never
  heard twice. The Seattle call and its voicemail agree with HaX's text that follows. Apart from M1
  and m1, nothing a player would notice.
- **m09:** unchanged; Nightshade's "since before you picked up" and Torres' and Gary's calls still read
  as incoming calls.

## Clashes with HaX's lines

None. HaX's commits since R2 (m02, m04, m05 hub "Call when…" → "Message me…", the m08 ERB `:874` text,
m07 ERB `:869`) don't touch a caller beat. m07 `:869` ("Message me where they go. Let it hurt
afterwards, not during.") is the line the Architect echoes, which is the intent; M1 keeps that echo
reachable.

## Voiced lines per mission (unique spoken strings in call knots, after this round)

| Mission | Caller | Count |
|---|---|---|
| m09 | Nightshade, Torres, Gary | ~21 (6 + 8 + 7) |
| m04 | Vance | ~48 |
| m05 | Recruiter | ~48 |
| m05 | Patricia | ~49 |
| m07 | Architect, live and voicemail | ~70 |

Totals: m09 ~21, m04 ~48, m05 ~97, m07 ~70. M1 and m1 change no counts.
