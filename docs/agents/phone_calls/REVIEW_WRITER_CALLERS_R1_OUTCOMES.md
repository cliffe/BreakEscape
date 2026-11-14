# Phone calls: caller writing, review round 1 outcomes

Writer (callers, everyone except HaX), fix round 1, 2026-11-12. Branch `build/phone-calls-writing`.
Review actioned: `REVIEW_WRITER_CALLERS_R1.md`. Every B, M and m finding below, with file:line and
before/after wording. Commits: m09 `7666e9494`, m04 `a5bc7eb32`, m05 `09df82fcc`, m07 `acc063b4c`.

All files compiled clean (`bin/inklecate`); `dialoguelint.mjs` and the A7a validator
(`p-phone-calls/scripts/validate_scenario.rb`) run read-only after each mission; `loopcheck.js` for B1.

## Blockers

**B1 — m07 home router ran away after grid saved, before sign-off.** `m07_architect_comms.ink`.
Three edits, as the review suggested:
- `start`: added `{grid_saved: -> dead_air}` between the `after_win` guard and the `dormant` guard, so the
  grid-saved gap rests on dead air.
- `dead_air_choices`: `{grid_saved: -> start}` → `{grid_saved and (heard_signoff or architect_signoff_done): -> after_win}`.
- `dormant`: the combined `{architect_contact or architect_t20_played or grid_saved: -> start}` split so
  `{grid_saved: -> dead_air}` comes first, then `{architect_contact or architect_t20_played: -> start}`.
Proof (`loopcheck.js m07_architect_comms.json`), all six strategies pass:
- `start grid_saved=true architect_contact=true heard_t30=true` (was RUNAWAY@0) → ✅
- `start grid_saved=true architect_contact=false` (was hang start↔dormant) → ✅
- `start` default, `start grid_saved=true heard_signoff=true` (clean end 0), `dormant`, `parked grid_saved=true`,
  `dead_air grid_saved=true` → all ✅.

**B2 — m05 Recruiter first call cut to ~17 NPC lines; "Everyone has a price" once.** `m05_phone_recruiter.ink`.
- `first_call` opening: "I run TalentStack. Executive search, mostly technical roles. / You've spent the last
  few hours putting a name to one of my placements. I thought I'd save you wondering who I am. / David Torres.
  QD-001, if you prefer the file number." → one line: "I run TalentStack. You've spent tonight putting a name
  to one of my placements. David Torres." (−2)
- `recruiter_introduction`: cut "Everyone has a price. I call that an operating philosophy, and it has never
  once failed me." (−1); it now appears only in `recruiter_deal` ("Everyone has a price, agent. I'm asking what
  yours is."), so it is said once.
- `recruiter_line_item`: cut "I don't say that to be cruel…" and "And it won't help the others…" (−2).
- `recruiter_reveals_target`: cut "Project Heisenberg was never going to a foreign buyer…" (−1).
- `recruiter_confirms_casualties`: see M1, cut to two lines in the else branch (−1).
- `recruiter_deal`: cut "But I'd rather you didn't spend the next six months…"; folded "nothing in this
  operation points at you" into the courier line. Four lines (−2).
- `recruiter_deal_terms`: cut "Most agents take that trade without needing it spelled out." (−1).
- `recruiter_deal_refused`: cut "Understand what you're choosing, though. Forty-seven is a number that changes
  weekly." (−1).
- `recruiter_final_statement`: cut "Here's what I'd like you to sit with…" and "He signed anyway. Everyone I
  recruit signs anyway." (−2).
Longest answered path now ≈17–18 NPC lines.

## Major

**M1 — m05 casualty projection said twice.** `m05_phone_recruiter.ink` `recruiter_confirms_casualties`.
Branched on the existing synced global `architect_discussed` (set by HaX's `topic_architect_choices`, so no
HaX change needed; declared `VAR architect_discussed = false` in the Recruiter ink). When set: one line,
"You've read the projection, then. I didn't file it. I just recruited the man who could get you the schedule."
Else: two lines (numbers/deaths, then "signed it off as an acceptable cost… I recruited the man…").

**M2 — m05 Patricia opened in silence.** `m05_phone_patricia.ink` `phone_call`. Added a state-varied answer
line (three whole lines in a `{ - cond: }` block) before `-> hub`: "Morgan. Where is he?" /
"Morgan. Is it over?" / "Morgan." (+3 clips)

**M3 — m05 Patricia "ring me back" stayed on the line; hub had no plain goodbye.** `m05_phone_patricia.ink`.
- `phone_who` "[I've got a feeling…]" reply "So have I. Ring me back with evidence." now ends the call
  (`#exit_conversation`, `-> DONE`), not `-> hub`.
- `hub`: `+ [Just checking in.]` is now `+ {not topic_taken} [Just checking in.]`; added
  `+ {topic_taken} [That's all for now.]` → "Right." `#exit_conversation` `-> DONE`. New local
  `VAR topic_taken`, reset in `phone_call`, set true in the office-card topic, the server-password topic and
  `phone_partial_naming` (the hub-return topics).

**M4 — m04 Vance call ended by going back to the hub.** `m04_phone_robert_vance.ink`. Dropped
`#exit_conversation` from the `support_hub` choice "[That's everything for now.]"; `support_call_end` now ends
`#exit_conversation` then `-> DONE` after its branch (was `-> support_hub`).

**M5 — m04 Vance said the same thing in two topics.** `m04_phone_robert_vance.ink`.
- `charge_control_systems_explanation`: 4 lines → 2 — kept line 1, replaced the rest with "SCADA's theirs, so
  the only thing that works is the hardwired shutdown in the plant room."
- `safe_disabling_guidance`: cut "Every control path runs through SCADA, and SCADA is theirs…"; kept "One thing,
  and it isn't a keyboard." with the hardwired-button line.

**M6 — m07 voicemails read as excerpts; three said something false or had no referent.**
`m07_architect_comms.ink`.
- `taunt_t30_vm`: "No caller ID. Don't look for the trace…" → opener in his voice, "You let it ring. Sensible.
  Don't look for the trace." (drops the phone's "No caller ID").
- `taunt_t20_vm`: opener → "Busy. Of course. You've sent your team."; the inline `{…|…}` which-two-are-left
  alternative split into whole-line branches reading as speech ("You covered Washington. San Francisco and the
  vendors are on your clock." etc.).
- `taunt_t10_vm`: "Doors close." now branches `{redirect_window_closed or team_assignment == "trojan_horse": …
  | You still have a door open…}`, so it never tells a player who can still redirect that they can't; added the
  T-20 fold line (which two are left) under `{t20_folded and not team_redirected and team_assignment != "trojan_horse"}`.
- `taunt_t5_vm`: "you will name the other two eventually" now branches on `team_assignment == ""`
  ("You covered nothing tonight. You'll name all three eventually…").
- `taunt_t1_vm`: `{countdown_expired:…|…}` inline alternative split into whole-line branches; "I have written
  every one of them down." → "Eight point four million people. I have written every one of them down."
Two voicemails (T-30, T-20) carry an opener; the rest do not, per the review.

**M7 — dropped m07 T-10 bark lost the "ten minutes" clock.** `m07_architect_comms.ink` `taunt_t10`. Added
"Ten minutes before your team is too committed to move." as the first spoken line on the open-window branches
(`team_redirected`, `projection_revised`, `else`), one clip. Ink comment at the old `:216` rewritten (the bark
is dropped in config; the line now carries the deadline).

**M8 — m07 `seattle_call` read as the mission's end and clashed with HaX.** `m07_architect_comms.ink`. Read
HaX's text 5 s later (ERB `:1074`, "Seattle's dark. Step one ran. Steps two to four haven't. Get root…").
Rewrote `seattle_call` to two lines: "Seattle first. Exactly as scheduled." / "Three to go, and you're on the
phone to me." Cut "I won't keep you long. You'll be wanted in a room with a tablet…". "[This isn't over.]"
reply → "No. That's rather why I rang." `seattle_call_vm` becomes the same two lines (cut "Sleep if you can.").
No HaX-side change needed. Note: the opener is "Exactly as scheduled." not the review's verbatim "As scheduled."
because the bark "Seattle first. As scheduled." is still in the ERB on this writing branch (config drops it
later); the verbatim line would re-raise the validator's duplicate-line warning. Flagged for round 2.

**M9 — m09 home stubs reached `-> DONE` on every open.** `m09_phone_gary.ink`, `m09_phone_nightshade.ink`,
`m09_phone_torres.ink`. Each `start` is now `+ [(Close.)]` / `#exit_conversation` / `-> start` (the m04/m05
form), so no "(End of conversation)" shows next to a missed call's Call back button.

**M10 — m09 Nightshade co-speaker line used the shared display name.** `m09_phone_nightshade.ink`.
`Agent HaX: He's right. I hate that he's right.` → `agent_0x99: He's right. I hate that he's right.`

## Minor

- **m1** — m07 `taunt_t10` else opener "Your screen wakes on its own. Nothing else on it moves." → "Again, no
  number. Nothing else on your screen moves." `taunt_t20` ("cuts across the facility alarm") kept.
- **m2** — m07 call-log narration trimmed to two mentions: `t20_close` "Dead air, then the ordinary hiss of
  the line." (dropped "The log shows a call from no number."); `seattle_close` "The line goes quiet." (dropped
  same). Kept at T-30 (`t30_close`) and the sign-off (`signoff_close`).
- **m3** — m05 Recruiter `recruiter_deal` opener branches on a new local `player_rang` (set in `return_contact`):
  "Since you've rung, here's what I wanted. …" when rung back, else "Here's why I actually called. …".
- **m4** — m05 Recruiter declares `call_answer_seconds`/`call_is_callback`; `first_call` opens with a callback
  line ("You rang back. Manners, or curiosity?") and a slow-answer line (`call_answer_seconds > 10`,
  "Take your time. Patience is most of my job."). Distinct from HaX's lines (own voice block anyway).
- **m5** — inline alternatives in voiced lines split into whole lines: Recruiter `recruiter_deal`
  `{found_pipeline_list:…}` courier line; Patricia `phone_log_reason_right` `{found_upload_schedule:upload
  schedule|staging manifest}`.
- **m6** — m05 Patricia `phone_significant_findings`: cut "Stop him first. Then finish whatever you were doing
  on that research server…" (HaX's job). `phone_hold_him` sign-off "Ring me when it's done." → "I'll be on the
  vault log." (and the line above reworded off "on the vault log" to avoid the repeat).
- **m7 (minor m1 in review's list = m07 narration)** — covered under m1 above.
- **m10** — stale header comments refreshed: Recruiter `:27-29`, Patricia `:17` (both "never reaches DONE"
  rules replaced with the new call-end rule).
- **m11** — `// lint: call-knot` added to every knot a call reaches, not just entry knots: m04
  `crew_offer_choices`; all Recruiter inner knots; all Patricia inner call knots; m07 `taunt_*_choices`,
  `t*_close`, `sign_off_choices`, `signoff_close`, `seattle_call_choices`, `seattle_close`. The A7a
  `call-in-text-thread` hits at m07 `:107`, `:368`, `:370` and m09 `m09_phone_recruiter.ink:37` are gone.

## Orchestrator's extra

- **m09 Recruiter fake ring-back.** `m09_phone_recruiter.ink` `start`: `+ [Ring back.]` → "Narrator: The number
  rings out." replaced with `+ [(Close.)]` / `#exit_conversation` / `-> start` (forced re-ring contact; the
  engine delivers the ring). The validator's `call-in-text-thread` hit at `:37` is cleared.

## Findings disagreed with / left

- **m8 (review, optional)** — m09 Gary's stale "HaX says you're stood at a keypad…" on a callback. The reviewer
  marked it "Optional". Left unimplemented: adding it needs a `call_is_callback` VAR and a branch, and the
  callback branch would have to re-deliver the Vigenère hint (the player who rang back still needs it), which
  the one-line suggested opener drops. Low value for the restructure risk. m09 count stays ~22.
- **M8 wording** — used "Exactly as scheduled." not verbatim "As scheduled." (see M8 above); content matches the
  decision (not mission-end, leaves steps 2–4 to HaX).

## HaX side

- No HaX change is required. M1 reuses `architect_discussed`, already set by HaX's `topic_architect_choices`.
- One remaining A7a `call-in-text-thread` hit and a crowded-hub CHECK are in HaX's `m07_phone_agent_0x99.ink`
  (`:800` "A long pause on the line.", `:228` hub 14 choices) — the HaX writer's, not touched.

## Checks (per mission)

- m09: inklecate OK; dialoguelint no caller errors; validator "✓ Validation complete!", no caller
  call-in-text.
- m04: inklecate OK; dialoguelint no Vance errors (L1129 ERB word-cap is pre-existing, non-Vance); validator
  complete, the two "call me / no call entry yet" warnings expected (config pending).
- m05: inklecate OK; dialoguelint no Recruiter/Patricia errors (the `:392` "not a defence" WARN is the
  documented intentional villain line); validator complete (the two word-cap ERRORs are in
  `m05_closing_debrief`/`m05_phone_agent_0x99`, not caller files).
- m07: inklecate OK; loopcheck 6/6 on all B1 cases; dialoguelint only the two false-positive "however" WARNs
  ("make it however you like"); validator "✓ Validation complete!", no caller call-in-text, no Seattle
  duplicate warning.
