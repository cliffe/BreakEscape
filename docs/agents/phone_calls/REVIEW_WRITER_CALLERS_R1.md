# Phone calls: review of the caller writing, round 1

Reviewer: dialogue review (npc-dialog-review skill, 2j and 2k included), 2026-11-12.
Under review: branch `build/phone-calls-writing`, commits 0bed21506 (m09), eb90b1b36 (m04 Vance),
b7ef97a7f (m05 Recruiter, Patricia), 2ba59e261 (m07 Architect), notes bc9543517
(`docs/agents/phone_calls/WRITER_CALLERS.md`). HaX's own calls are out of scope; clashes with them are listed.

## Verdict: revise

The structure work is mostly right. Call knots end `#exit_conversation` then `-> DONE`, home knots never
route into a call, the fake ring-backs are gone, C6 is honoured and the `heard_*` folds are mirrored in
the voicemails. Two things block: the m07 home router now loops forever once the grid is saved
before the sign-off has run, and the m05 Recruiter's first call is a three-minute monologue. The rest is
call length, voicemails that read as excerpts rather than messages, and some smaller things.

## Checks run

- `bin/inklecate` on all seven changed inks: compile clean, and the committed `.json` matches a fresh
  compile byte for byte.
- `loopcheck.js` on every call entry knot and home knot: all pass except
  `m07_architect_comms.json @ start` with `grid_saved=true architect_contact=true heard_t30=true`, which
  runs away in all six strategies (RUNAWAY@0). The same check on the parent commit passes. With
  `grid_saved=true architect_contact=false` it hangs (`start` -> `dormant` -> `start`).
- `dialoguelint.mjs`: none of the seven files has an error. The only hits are two `transition: "however"`
  warnings in m07 (`:103`, `:520`), which are false positives ("make it however you like").
- A7a validator (`p-phone-calls/scripts/validate_scenario.rb`, run read-only): the expected "says call me
  but no call entry and no ring" warnings for m04 Vance (ERB `:1520`, ink `:279`) and the HaX texts in m04
  and m05. Beyond those, it gives `call-in-text-thread` on `m07_architect_comms.ink:107`, `:368` and `:370`,
  because `t30_close` and `t1_close` carry no `// lint: call-knot` (see m11). m09 gives one
  `call-in-text-thread` in `m09_phone_recruiter.ink:37`, which is HaX's and the Recruiter's m09 file, not this commit.

## Findings

### Blockers

**B1. m07 home router loops forever after the grid is saved and before the sign-off runs.**
`m07_architect_comms.ink:51-60` with `:445-447` and `:66-67`. `start` now goes to `after_win` only when
`grid_saved and (heard_signoff or architect_signoff_done)`. Otherwise it goes to `dead_air`, and
`dead_air_choices` sends `{grid_saved: -> start}` straight back, so `dead_air`'s narration prints in a loop.
`dormant` does the same through `{... or grid_saved: -> start}`. The old `start` caught this with
`{grid_saved: -> sign_off}`, which the plan rightly removed, but nothing replaced it. The thread can be
opened by hand in this window: while the forced sign-off rings (up to the auto-answer), while it is
queued behind another call (row 5), and after a reload with `architect_signoff_started` set but
`architect_signoff_done` not yet set.
Fix: give `start` a quiet resting branch for the gap, and stop the two back-edges from re-entering `start`:

```ink
=== start ===
{grid_saved and (heard_signoff or architect_signoff_done): -> after_win}
{grid_saved: -> dead_air}            // sign-off still to ring: rest on dead air, never loop
{not architect_contact and not architect_t20_played: -> dormant}
-> dead_air
```
In `dead_air_choices`, change `{grid_saved: -> start}` to `{grid_saved and (heard_signoff or architect_signoff_done): -> after_win}`.
In `dormant`, divert to `dead_air` rather than `start` when `grid_saved` is true. Re-run loopcheck with
`grid_saved=true` and both values of `architect_contact`.

**B2. m05 Recruiter first call is far too long for a call.** `m05_phone_recruiter.ink:51-257`. One path
through `first_call` runs 28 to 33 NPC lines: opening 4, intro 3, line item 4, target 3, casualties 3, deal 6,
terms 3, taken 2 or refused 4, plus the choice replies. That is around three minutes of one voice, against
about ten lines for a call and ~45 for both her calls in plan 7.2. It also says the same thing twice inside
the call: "Everyone has a price" opens `recruiter_introduction` (`:97`) and closes `recruiter_deal` (`:188`).
Cuts, with the choices kept as they are:
- `first_call` `:65-71`: keep "Agent. Or whatever they're calling you this week." Merge the next three lines
  into one: "I run TalentStack. You've spent tonight putting a name to one of my placements. David Torres."
  Cut "QD-001, if you prefer the file number" and "I thought I'd save you wondering who I am." (-2)
- `recruiter_introduction` `:97-101`: cut `:97`, since the deal says it. Keep "The only variable is what
  currency they'll take." and the Torres line. (-1)
- `recruiter_line_item` `:117-123`: keep `:117` and `:121`, cut `:119` and `:123`. (-2)
- `recruiter_reveals_target` `:130-134`: cut `:130` ("never going to a foreign buyer"); the next line says it. (-1)
- `recruiter_confirms_casualties` `:152-156`: see M1. Cut it to two lines either way. (-1)
- `recruiter_deal` `:178-188`: cut `:180` and fold "In return…" into the envelope line. Four lines. (-2)
- `recruiter_deal_terms` `:211-215`: cut `:215`. (-1)
- `recruiter_deal_refused` `:247-253`: cut `:249`. (-1)
- `recruiter_final_statement` `:357-365`: cut `:357` and `:361`, keeping the not-a-defence line and the forty-seven. (-2)
That puts the longest path at about 17 lines. Her character is in the lines that stay.

### Major

**M1. The m05 casualty projection is delivered twice, by two callers.** `m05_phone_recruiter.ink:152-156`
against HaX's `topic_architect` (`m05_phone_agent_0x99.ink:335-337`, the root-flag ring). Both calls tell the
player that the Architect signed off a casualty projection as an acceptable cost. If the root flag comes
first, the Recruiter repeats HaX. Fix: branch on `architect_discussed` (declare it in the Recruiter ink).
When it is set she says one line, "You've read the projection, then. I didn't file it. I just recruited
the man who could get you the schedule." Otherwise she keeps two lines (numbers, then "acceptable cost").

**M2. Patricia's call opens in silence.** `m05_phone_patricia.ink:94-98` and `:110-139`. The player rings her,
the call connects, and the first thing on screen is a menu. "Go on, then. Who?" is her reply to a choice,
not an answer to the phone, so the opening in the notes' variety table never plays first. Fix: one answer
line in `phone_call` (entered once per call, unlike `hub`), varied by state:
`{torres_identified and final_choice == "": Morgan. Where is he?|{final_choice != "": Morgan. Is it over?|Morgan.}}`.
Write these as three whole lines in a `{ - cond: … }` block, not inline. The `patricia_ko` and `not_yet`
guards stay above it. That adds 3 clips.

**M3. Patricia says "ring me back" and stays on the line, and her hub has no plain goodbye.**
`m05_phone_patricia.ink:161-163`: "So have I. Ring me back with evidence." then `-> hub`. End the call there
(`#exit_conversation`, `-> DONE`). `:128`: the hub's only exit is "[Just checking in.]", which is wrong
straight after asking her for the office card (`:119-122`, which returns to the hub). Add
`+ [That's all for now.]` with reply "Right." then `#exit_conversation`, `-> DONE`. Show "[Just checking in.]"
only when no topic was taken on this call (a local flag reset in `phone_call`).

**M4. m04 Vance's call ends by going back to the hub.** `m04_phone_robert_vance.ink:140-142` and `:277-287`.
`#exit_conversation` sits on the choice body before "Call me if you need it.", and `support_call_end` ends
`-> support_hub`. Loopcheck confirms the call never reaches an end. Plan 3.5 says a call ends with
`#exit_conversation` on its last line, then `-> DONE`. The reset happens to save it today, because
`support_hub` is in the call walk, but the rule is what the validator and the implementer will check. Fix:
drop `#exit_conversation` from `:141`, and end `support_call_end` with `#exit_conversation` then `-> DONE`
after its branch.

**M5. m04 Vance says the same thing in two topics.** `charge_control_systems_explanation` `:150-156` and
`safe_disabling_guidance` `:175-181` both say SCADA is theirs, they'll push any change back, and the
hardwired button is the answer. As text that was a skim. On a call it is six paid clips, heard twice.
Cut `charge_control` to `:150` plus "SCADA's theirs, so the only thing that works is the hardwired shutdown in
the plant room." (-2). In `safe_disabling`, cut `:177` and keep "One thing, and it isn't a keyboard." with `:181`. (-1)

**M6. m07 voicemails read as excerpts, and three of them say something false or have no referent.**
- `:519`: "voice: No caller ID. Don't look for the trace…". He speaks the words "No caller ID", which is the
  phone's label, not his. Cut to "voice: Don't look for the trace. It isn't there."
- `:547`: "Doors close." plays even while the redirect window is open. The live `t10_close` (`:246-250`)
  branches on it, so the voicemail can tell a player who could still redirect that they can't. Use the
  same branch: `{redirect_window_closed or team_assignment == "trojan_horse": …|…}`, as two whole lines.
- `:559`: "you will name the other two eventually" is wrong when `team_assignment == ""`. Branch it as `t5_close` does.
- `:573`: "I have written every one of them down." has nothing for "them" to refer to (in the live call it
  answers "Eight point four million people"). Rewrite: "Eight point four million people. I have written
  every one of them down."
- `:531` and `:571` pick inline alternatives inside a `voice:` line. Write them as whole-line branches
  (plan 3.6, fixed strings only). `:531`'s "Washington covered; San Francisco and the vendors left on your
  clock" reads like notes, not speech: "You covered Washington. San Francisco and the vendors are on your clock."
- None of them sounds like a message left for someone who didn't pick up. Give two of them, not all, an
  opener in his voice that replaces a line rather than adding one: T-30 "You let it ring. Sensible. Don't
  look for the trace." and T-20 "Busy. Of course. You've sent your team."
- `taunt_t10_vm` `:538-541` sets `t20_folded` but leaves out the folded line, so a player who missed both
  never hears which two operations were left. Add the live call's fold line (`:224-229`) as a whole-line branch.

**M7. Dropping the m07 bark texts loses clock information the taunt lines rely on.** ERB `:1597` "Ten
minutes before your team is too committed to move, Agent 0x00." The ink comment at `:216` (D7-14) says the
bark carries "ten minutes" so that the line doesn't have to. With `sendTimedMessage` gone (7.2), the
deadline is never stated. The notes don't list this. Fix: in `taunt_t10`, put "Ten minutes before your team
is too committed to move." as the first spoken line on the open-window branches (`team_redirected`, the
`else` and `projection_revised` branches; not `cascade_armed` or `redirect_window_closed`). That is one new
clip. T-5 and T-1 ("Five minutes", "One minute") matter less because the wall clock shows them; leave those.

**M8. m07 `seattle_call` reads as the end of the mission, and it lands on HaX.** `:480-504`. "It's done, then",
"You'll be wanted in a room with a tablet, and they'll want you to have slept" and "For you it's barely
started" tell the player it's over. In fact steps two to four haven't run, and HaX's text five seconds
later (ERB `:1074-1080`) says "Get root, put it through the relay, then the abort at the console. Go." The
old bark was pressure only (ERB `:1640` comment). Rewrite as two lines that keep the pressure and leave the
next step to HaX: "Seattle first. As scheduled." / "Three to go, and you're on the phone to me." Cut `:488`,
which also repeats T-1's "room with a tablet" a minute later. Keep the choices, and reply to "[This isn't
over.]" with "No. That's rather why I rang." The voicemail becomes the same two lines (cut "Sleep if you can.").

**M9. m09 home stubs reach `-> DONE` on every open.** `m09_phone_gary.ink:15-18`, `m09_phone_nightshade.ink:12-15`,
`m09_phone_torres.ink:18-21`. Lesson 21: an ended story shows "(End of conversation)" every time the thread
opens, which sits badly next to a missed call's "Call back" button. The call knots' own `-> DONE` is fine,
since the reset moves the story home, but the home knot must not end. Use the m04/m05 form:
`+ [(Close.)]`, `#exit_conversation`, `-> start`.

**M10. Nightshade's co-speaker line uses the shared display name.** `m09_phone_nightshade.ink:28`
`Agent HaX: He's right. I hate that he's right.` m09 has two "Agent HaX" records (`agent_0x99` ERB `:868`,
`hax_voice` `:1044`), so scenario order picks the voice. Plan 3.5 and 2.10: write `agent_0x99:`. The line is
a new clip either way, so no key moves.

### Minor

- **m1.** m07 `taunt_t10` else-opener `:202`, "Your screen wakes on its own." contradicts a call that rang
  and was answered. Rewrite: "Again, no number. Nothing else on your screen moves." `taunt_t20`'s `:127`
  ("The handset cuts across the facility alarm") reads well as the ring itself: keep it. `taunt_t5` `:277`
  and `taunt_t1` `:340` are already fine. Narration costs no audio.
- **m2.** m07 close narration talks about the call log four times (`:107`, `:175`, `:430`, `:501`), and the
  engine adds its own "Call: No caller ID" row (2.6). Keep it at T-30 (`:107`) and the sign-off (`:430`, the
  payoff). Make T-20's `:175` "Dead air, then the ordinary hiss of the line." and Seattle's
  "The line goes quiet." The validator's "The line drops" and "hangs up" hits go away with m11.
- **m3.** m05 Recruiter, `recruiter_deal` `:178` "Here's why I actually called." is reached from
  `return_contact` (`:276-277`), when the player rang her. Set a local `player_rang = true` in
  `return_contact` and branch the line: "Since you've rung, here's what I wanted."
- **m4.** m05 Recruiter: plan 3.6 offers her the call VARs ("can enjoy being kept waiting"), and her first
  call has `onMissed: "callback"`, so a callback is a real path. Declare both VARs. Before `:65`, add
  `call_is_callback`: "You rang back. Manners, or curiosity?" and `call_answer_seconds > 10`: "Take your
  time. Patience is most of my job." (+2 clips. Not in HaX's lines; grep before using.)
- **m5.** Inline alternatives in voiced lines: Recruiter `:184` `{found_pipeline_list: You've already opened
  it, I expect.} Leave it…` and Patricia `:254` `{found_upload_schedule:upload schedule|staging manifest}`.
  Split each into whole lines (plan 3.6).
- **m6.** Patricia `phone_significant_findings` `:325-348` runs seven lines in a row. Cut `:338` ("Stop him
  first. Then finish whatever you were doing on that research server…"): it is HaX's job, and HaX's texts say
  it. Her two sign-offs, "Whatever you decide in front of him, ring me when it's done." (`:348`) and "Ring me
  when it's done." (`:365`), come one call apart. Make `:365` "I'll be on the vault log."
- **m7.** Clash with a HaX text: ERB `:1256-1259` sends "That TalentStack number is the Recruiter. Hear her
  out if you want…" 12 s after `recruiter_texted`, while her call may still be ringing or under way.
  `skipIfGlobal: recruiter_contacted_player` is set only after four lines of her call. That's HaX config:
  tie it to `phone_call_declined`/`phone_call_missed`, or to `conversation_closed:recruiter`.
- **m8.** m09 Gary `:27` "HaX says you're stood at a keypad…" is stale on a callback made after the player
  has walked off. Optional `call_is_callback` line: "Gary. You rang. That keypad still giving you bother?"
- **m9.** Vance and Patricia can both be rung while the player stands next to them in person (Vance at the
  ops desk, Patricia in her office). Not a writing fix. It's for the implementer: a `when` term on the
  player's room, or leave it.
- **m10.** Stale header comments that now contradict the code: Recruiter `:27-29` ("never reaches DONE …
  sticky choices let the player ring her back"), Patricia `:17`, m07 `:454-458` ("Every exit parks here"),
  and m09 headers `:3` ("unvoiced").
- **m11.** Mark every knot a call reaches with `// lint: call-knot`, not just the entry knots: m07
  `taunt_*_choices`, `t*_close`, `signoff_close`, `sign_off_choices`, `seattle_call_choices`, `seattle_close`;
  m04 `crew_offer_choices`; and the Recruiter's and Patricia's inner knots. The validator hits at m07
  `:107`, `:368` and `:370` come from these.
- **m12.** Process: the notes say the six m05 rewords sit uncommitted in the HaX writer's files in this worktree
  (`WRITER_CALLERS.md:157-173`). Check they land in the HaX commit before this branch merges.

## What's fine

- C6: every first-contact opener now rings and connects, the sign-off "rings anyway", and the terminal look is kept.
- T-30 to T-1 timing is untouched in the ink. It lives in the mappings, which keep their events, conditions
  and delays. `architect_signoff_done` is still set at the top of `sign_off` (`:384`), and the debrief gate is unchanged.
- The voicemails set the same `heard_*` and fold VARs as the live taunts, so a later taunt never opens as
  first contact after a voicemail. `taunt_t30_vm` keeps `architect_echo_heard`, and HaX's
  `[He used your line. "Let it hurt afterwards."]` (`m07_phone_agent_0x99.ink:281`) still matches what the voicemail says.
- The Recruiter's playtest history is kept: the `final_choice` guard, `recruiter_deal_offered` routing
  (D2), the `start_choices` re-navigation guards (3b), and the `torres_identified` guard (B2, now in `start`;
  the ring mapping's condition covers `first_call`). Nothing those comments warn about comes back.
- Openings vary across callers and from HaX: Vance "Vance.", the Recruiter "Agent. Or whatever…", the
  Architect's seven different openings, and the three m09 callers. No line repeats a HaX opening.
- The m09 call lines were already speech and need no change apart from M10.

## Voiced lines per mission after these cuts

| Mission | Caller | Writer's count | After this review |
|---|---|---|---|
| m09 | Nightshade, Torres, Gary | ~22 | ~22 (+1 if m8) |
| m04 | Vance | 51-65 | ~47 |
| m05 | Recruiter | ~60 | ~47 (longest call path ~17) |
| m05 | Patricia | ~50 | ~52 |
| m07 | Architect live calls | ~60 | ~59 |
| m07 | Architect voicemails | ~14 | ~15 |

Totals: m09 ~22, m04 ~47, m05 ~99 (from ~110), m07 ~74.
