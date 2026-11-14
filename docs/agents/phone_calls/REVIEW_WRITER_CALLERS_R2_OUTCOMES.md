# Phone calls: caller writing, review round 2 — outcomes

Actioned `REVIEW_WRITER_CALLERS_R2.md`, 2026-11-12. Caller writer (everyone except HaX).
Commits: m04 `4ed621179`, m05 `e1a63d819`, m07 `e57d6fb94`.
HaX's files (agent inks, `scenario.json.erb`, `WRITER_HAX_CALLS.md`) left untouched; checked
`git status --short` on each caller file first (all clean, no HaX changes in them).

## Majors

- **M1 — Recruiter orphan line.** Cut `m05_phone_recruiter.ink` "The only variable is what currency
  they'll take." The intro now opens on "Torres took debt relief and a standing consultancy retainer…",
  which follows all three choice replies. (−1 clip, −1 line on every first-call path.)
- **M2 — Patricia asks what she knows.** `m05_phone_patricia.ink` `torres_identified` opener
  "Morgan. Where is he?" → "Morgan. Have you got him?" "[He's in the data centre.]" now answers it and
  "I know. I'm watching his badge." follows. (0 clips.)
- **M3 — Seattle voicemail false line.** `m07_architect_comms.ink` `seattle_call_vm`
  "Three to go, and you're on the phone to me." → "Three to go, and you let it ring." The "Seattle first.
  Exactly as scheduled." line above it stays. (0 clips.)
- **M4 (orchestrator's `recruiter_line_dead`) — config, not ink.** Confirmed: the `~` assignments in the
  ink only sync back when the name is a global, and it is not declared in m05's `globalVariables`. No ink
  change. Added to the M5 "config each knot needs" list in `WRITER_CALLERS.md`: declare
  `"recruiter_line_dead": false` and keep the `when`. Did **not** edit `globalVariables` (config step).

## Minors and cuts

- **m1.** Recruiter `recruiter_confirms_casualties` `architect_discussed` branch: "get **you** the
  schedule" → "get **us** the schedule" (matches the else branch; schedule went to ENTROPY). (0 clips.)
- **m2.** Recruiter `recruiter_deal_refused`: cut "Good luck with Torres. He was cheap. The next one
  might cost me more…". The refusal now ends on "You won't reach all of them before I've closed on a few
  more." (−1.)
- **m3.** Patricia `phone_torres_why`/`phone_case_why` split: the `has_motive() and has_exfil()` openers
  now reuse the exact strings of the other branch ("Again? Fine. Convince me this time." / "David. Why?").
  Took the collapse (the "I'm writing this down" colour was optional). (−2 clips.)
- **m4.** Patricia `phone_significant_findings_choices` badge-log reply: the near-copy single line replaced
  with the two exact lines from `phone_case_why` ("...Every night. And Ruth's own badge never comes in
  after seven." / "I sign that log off every Monday. I never once read the front door."). (−1 new clip.)
- **m5.** Patricia `final_choice != ""` opener "Morgan. Is it over?" → "Morgan. I've been watching the
  vault log." (she no longer asks and then answers herself). (0 clips.)
- **m6.** m07 voicemails reuse the live calls' exact strings (same voice block, so the audio is reused):
  `taunt_t30_vm` "Let it hurt afterwards, not during. I expect you've been told that." (= live `:117`);
  `taunt_t10_vm` "Doors close. It's the one thing they reliably do." (= `:267`);
  `taunt_t1_vm` split into "Late. I did wonder." + "But the grid was never the point." (= `:366`, `:371`)
  and, on the else branch, "Closer than the file suggested. Not close enough to be comfortable." + "But the
  grid was never the point." (= `:368`, `:371`); "You'll work it out. Probably tonight. Probably in a room
  with a tablet in it." (= `:382`). HaX's "[He used your line. \"Let it hurt afterwards.\"]" still matches.
  (−5 clips.)
- **M7.** m07 `taunt_t10` `team_redirected` branch: dropped the spent "Ten minutes before your team is too
  committed to move." It stays on `projection_revised` and `else`. (0 clips.)
- **M8.** m07 `t5_close` inline alternative `{… | …}` rewritten as a `{ - cond: … - else: … }` block.
  (0 clips.)
- **m9.** Stale comments refreshed: m04 `m04_phone_robert_vance.ink` de-dup comment (no longer cites "the
  one thing they couldn't touch"); m07 "Every exit parks here" comment (the taunt/sign-off knots end
  `-> DONE`; only the router's [Hang up] rests at `parked`) — this was the R1 m10 "m07 header" item.

## Disagreements (reviewer accepted) — config follow-ups logged

- **Seattle wording vs the bark.** Accepted on condition the config step drops the m07 ERB `:1644`
  `sendTimedMessage` bark ("Seattle first. As scheduled."). Added that explicit requirement to the m07
  "config each knot needs" list in `WRITER_CALLERS.md`. No ink change.
- **Gary callback line (R1 m8).** Accepted as before; not actioned.

## Checks run

- `bin/inklecate` on the four edited inks (recruiter, patricia, architect_comms, robert_vance): all clean.
- `dialoguelint.mjs` on m04/m05/m07: no error in a caller file. Remaining caller hits are the documented
  allowed/intentional ones — recruiter `:102` non-verbal "You: …" (allowed), recruiter `:388` villain
  "not a defence" WARN, architect_comms `:115`/`:560` false "however" ("make it however you like"). All
  ERRORs are in HaX / `scenario.json.erb` / debrief files, not mine.
- `loopcheck.js` m07 (all taunt/vm/sign-off/seattle knots, with fold-state VARs) and m05 (recruiter
  `first_call`/`return_contact`, patricia `phone_call`/`start`): every call entry reaches a clean end;
  hubs loop as hubs should.
- A7a validator (`validate_scenario.rb`) from a scratch root: `git archive` of this branch's scenarios,
  my four edited files overlaid, p-phone-calls `scripts/` and `lib/` copied in, `public/` and `bin/`
  linked. m04/m05/m07 caller hits are all config-pending ("no call entry and no ring", "call VARs declared
  but no ring/call entry"), matching R1. No new error in a caller ink, no `call-in-text-thread` hit on a
  caller file, no Seattle duplicate warning.

## Clip savings

m05 Recruiter −2 (M1, m2); m05 Patricia −3 (m3 −2, m4 −1; M2/M5 0); m07 −5 (m6). m04, m09 unchanged.
