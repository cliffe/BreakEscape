# M5 review round 1 — fixer outcomes

Fixer, 2026-11-12 (Opus 4.8). Scope: m05 only. Source of findings: `REVIEW_M5_R1.md` (0 B, 2 M, 2 m, 4 n).

## M1 — Recruiter's ring has no `mission_complete` guard; a reload in her 7.5 s window could move her first call to the debrief. FIXED.

- Added `&& globalVars.mission_complete !== true` to the shared condition on all three ERB-loop
  `conversation_closed` mappings (`scenario.json.erb:1546`, the loop line), so none of the three closes —
  including the bring-in's — rings her into or after the debrief.
- Added the recommended `game_loaded` twin (same ring, `onceOnly`, `setGlobal recruiter_texted`,
  `callLabel`, `targetKnot first_call`, `delayMs 7500`) with condition
  `torres_identified === true && recruiter_contacted_player !== true && recruiter_texted !== true && mission_complete !== true`.
  A reload now re-arms her on load instead of waiting for the next thread close. On a fresh start
  `torres_identified` is false, so it cannot fire early; `recruiter_texted` (set at the offer) and the
  re-check at the delay's end stop the twin and the three closes from ringing twice.
- Live (keyless :3024, `proofs/M5_r1/`): `twin_reload` — armed in the window (`recruiter_texted=false`),
  reloaded, the twin rings her once on load (`queue=0`), decline leaves one Missed row, no second ring.
  `bring_guard` — the real bring-in sets `mission_complete`; `conversation_closed:agent_0x99_handler`
  then fires with no ring (`ringer=null`, `queue=0`) into or during the debrief. `guard_only` — isolates
  the `mission_complete` term: with it set and `recruiter_texted=false`, the close does not ring her.

## M2 — HaX's voiced bring-in line (and its silent twin) still called the Recruiter's first contact a text. FIXED.

Reworded both to hold whether the player answered, declined, missed or never got the call, in HaX's voice,
no printed variables, no inline stage directions:

- `m05_phone_agent_0x99.ink:987` (voiced, `extract_call`):
  - before: "That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose."
  - after:  "That TalentStack number's still open. She's lost him. Ring her if you want to hear her lose."
- `m05_phone_agent_0x99.ink:1162` (silent twin, `report_progress`):
  - before: "That TalentStack text is still unanswered. Hear her out if you want. Just don't give her anything."
  - after:  "That TalentStack number's still there. Hear her out if you want. Just don't give her anything."

Also updated the stale `_comment` at `scenario.json.erb:1270` ("the Recruiter's text lands" -> her call
rings, `recruiter_texted` goes true at the offer). The HaX text mapping at `:1274` already read right.

Live: `tts_reword` — the new line returns 503 from `/tts` (recognised as HaX's voiced line, no cache yet);
the old wording returns 403 "Text not found". The new line also plays in the `bring_guard` call subtitles.

## m1, m2 — proof README overstated what a 503 shows / understated head starts. ADDRESSED.

`proofs/M5_r1/README.md` states that a 503 shows the client classed the line as voiced, that
`TtsLineResolver` accepted it, and that there is no cached clip (not that the batch extractor will
generate it — the key diff shows that), and lists `torres_identified` (and flags in `bring_guard`) as the
only head starts. The new proofs run the real reload, the real bring-in call, and the `/tts` request
through the page rather than emitting synthetic events for the triggers. (The original `proofs/M5/`
runs are left in place; these supersede them for the fixed items.)

## n1-n4 — no change.

- n1 (`bring_end` probe) and n2 ("Don't ring this number again" repeat), n3 (callback to `first_call`),
  n4 (root decline mapping has no knot condition): the review marks each defensible or cosmetic and
  recommends no change beyond the record. Left as the review left them; not cheap wins that touch only
  m05 behaviour the player sees.

## Checks

- Ink recompiled (`scripts/compile-ink.sh m05_insider_trading`): only `m05_phone_agent_0x99.json` moved.
- `validate_scenario.rb` exit 0, schema passed, no phone-call warnings; the only ERRORs are the two
  pre-existing word caps (`m05_closing_debrief.ink:353`, `m05_phone_agent_0x99.ink:1083`) and the
  documented villain WARN (`m05_phone_recruiter.ink:388`) — the review's baseline. No new objective-wiring
  warning from the twin (it is the Recruiter's only `game_loaded` mapping). `dialoguelint.mjs` exit 0,
  same findings. `validator-phone-calls.test.mjs` 0 fail. `tts_mission_lines_test.rb` 5 runs 0 failures,
  three times.
- Key diff (`dump_tts_keys.rb` with labels): the reword swaps one voiced HaX key — removed
  `0c899809eb934fd3c30766a3b5afe820`, added `d6574db9955f788c9c8b4dde58be173c`. Total stays +118 vs
  `keys_baseline/m05_insider_trading.txt`. The silent twin (`:1162`) is not voiced, so no key change.
- Lab sheet (`_labs/safetynet/m05_insider_trading.md`): no change. It names the TalentStack leaflet and
  envelope props, not HaX's bark or the Recruiter's reload behaviour; the guard and twin do not change a
  described player step. VM companion not opened.
