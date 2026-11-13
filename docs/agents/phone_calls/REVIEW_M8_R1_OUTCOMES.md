# M8 round 1 outcomes (m01 first ring and bring-in)

Fixer: Sonnet, 2026-11-12. Proofs in `proofs/M8_r1/`, route `tools/phone_calls/routes/m08r1_live.sh` (tutorial) plus `m08_live.sh` (openings).

| Finding | Outcome |
|---|---|
| M1 opener repeats the text | Fixed with the reviewer's preferred option. The 1.5 s "You're in. ..." text is removed. Its tour sentence ("Now get a feel for the place. ...") is sent after the call: on `conversation_closed:agent_0x99` once `first_ring` has set `m01_first_ring_done`, or 5 s after a decline or miss (so it follows "Texting from here, then."). `m01_tour_sent` stops a second copy (a callback after a decline). No voiced line changed: the three openers and all keys are as before (texts are not voiced). |
| M2 banner covers the tutorial | Fixed in the engine. `ringBlocked()` also holds while the tutorial manager is `active` or its prompt is open. A ringing call is requeued and rings once the tutorial ends or is skipped; a forced call does not auto-answer behind it. 5 tests in `test/js/phone-ring-tutorial.test.mjs`; no new static import. bin/test-js 562 files, 0 failed. |
| m1 callLabel repeats the name | m01 now "SAFETYNET secure line". m04 has the same (`m04_critical_failure/scenario.json.erb:911`): not edited, under review. |
| m2 lab sheet "call Agent HaX" | `m01_first_contact.md:387` now says to open the phone and message Agent HaX, who rings back. HacktivityLabSheets `b912564`. |
| m3 last line capture | Left to the audio pass. |
| m4 log wording | Corrected in `PHONE_CALLS_LOG.md`. |
| n1 to n4 | Not changed ("So: quiet, deniable." stays: it would re-key a line, n1 is optional). |

## Live proof (keyless :3027, headless, server stopped)
- Tutorial accepted (`tut_accept_*`): tutorial active with SKIP TUTORIAL showing; 15 s after entering the office no banner and the ringer queued, not ringing. After `complete()` the banner shows at once; Answer, "You're in.", Texts it is, the tour text arrives after the call.
- Tutorial skipped (`tut_skip_*`): same, via `skip()`.
- Three openings (`ring_now_*`, `ring_slow_*`, `ring_decline_*`): "You're in." / "Took your time. Fine, nothing's on fire yet." / "You rang back. Good habit.", all `/tts` requests as before. No room-tour text before the call. Answered paths get the tour after the call; the decline path gets "Texting from here, then." then the tour once, and none again after the callback.
- Lab SE (`se_dev/`): `sha256_noseed` Dev `ffe4c083...`, Ruth `52c50b7a...` after the call and after reload; the same four Dev `/tts` lines; `social-lab-*` and `validator-social-lab` tests pass.
- Also: m01 validator no errors, `tts_phone_text_variables_test` and `tts_mission_lines_test` 8 runs 0 failures.
