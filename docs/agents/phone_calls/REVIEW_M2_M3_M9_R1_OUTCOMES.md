# Review R1 outcomes: M2, M3, M9 (and the m09 lab sheet)

Fixer, 2026-11-12. Review: `REVIEW_M2_M3_M9_R1.md`. Commits: BreakEscape 7da501f44 (fixes) and the follow-up that holds the proofs and route scripts; HacktivityLabSheets 08e2e7a.

## Findings

| Id | Outcome | What changed |
|---|---|---|
| M1 (major) | Fixed | `m09_phone_agent0x99.ink`: `flag1_read`, `ledger_read`, `afterwards` and `hour_read` start with a guard that diverts to `support_hub` if already heard (`flag1_read_heard`, `ledger_read_here or _heard`, `afterwards_here or _heard`, `hour_read_here or hour_read_started`). `read_text` in the ERB takes `skip:` and writes `skipIfGlobal` into `sendTimedMessage`; engine check: `npc-manager.js` `scheduleTimedMessage` keeps it, delivery drops a text whose global is set, and the toast's `stillValid` closes a queued toast. Skips: `flag1_read_heard` (new global, set by `#set_global` on the knot's first line, declared in `globalVariables`), `ledger_read_heard`, `afterwards_heard`, `hour_read_started`. |
| m1 (minor) | Fixed | Latches `flag1_texted`, `ledger_texted`, `afterwards_texted` (new globals, set when the mapping fires; `hour_read_texted` existed). One `game_loaded` `read_text` per read-out: event global, no latch, not heard. The reviewer said `hour_read_texted` already backed the hour read; there was in fact no `game_loaded` mapping for it, so one was added. Backstop message delays are staggered (5, 10, 15, 20 s) because the validator warns on texts from one event less than 4 s apart. |
| m2 | Fixed | "Her call first. I'll be on it with you." |
| m3 | Fixed | "Open this." dropped. Flag 1: "First box is in. It came with a list." Hour read: "The job on his box has a clock on it." (both mappings and the new backstop). |
| m6, m7 | Fixed | sis02 objective "Message Marcus Webb and Investigate"; sis03 task title "Message Robert Ngata (NCSC) ..." and also its description (it began "Call Robert Ngata", which a player reads in the objective panel). sis02 lab sheet line 656 quoted the old title: updated. No sis03 sheet quotes it. Task ids unchanged. |
| n8 | Fixed | lab_physical_pentest phone: "with Ruth a message away for a nudge when you're stuck." |
| m8, m9 | Fixed | m09 sheet: ledger Nudge now says to open HaX's text about the ledger before the ring; the hour-read step says "stay on while HaX takes the Architect's call"; the earlier sentence says "the Architect ringing HaX". |
| m5 | Fixed | Screenshots in `proofs/M2/`: `m09_sorensen_door_hax.png` and `m10_tesseract_hax.png` (see Proofs). |
| n1 | Fixed, with a change | Guard 1 now calls a function, but not `hax_scene_pending()`: that is the union of both guards, so guard 1 would also have caught the Recruiter's pending call and lost its different text. Split into `hax_voiced_scene_pending()` (guard 1) and `hax_scene_pending()` (that plus the Recruiter term). |
| n2 | Fixed | The comment now covers all three cases (forced voiced scene, hour read's silent re-ring, Recruiter's ring at the next room exit). |
| n3 | Rejected | The `[Afterwards.]` hub topic can show: the hub's own divert to `afterwards` is blocked while `hax_scene_pending()` holds, and the topic is the only way in then. The comment now says so. |
| n4 | Logged for A7 | dialoguelint's "[timed texts] texts=0" for m09 does not read `read_text` output. The new texts are unlinted. |
| n5 | Fixed | `flag1_read_heard` is now a real global, so the name is right; the ink VAR of the same name stays as the shadow and carries a comment. |
| n6 | Fixed | `agent_0x99:` prefix in `m09_sorensen_door`, `_hatch`, `m09_noor_haddad`, `m09_alpha_recording`, `m09_closing_debrief` (sed on `^ *Agent HaX:`, 40 lines; JSON recompiled). Key dump identical before and after. Live: the Sorensen door requests go out under `agent_0x99` (`proofs/M2/m09_sorensen_door_hax_tts.jsonl`). |
| n7 | Reviewer correct | `keys_baseline/` vs `keys_baseline_a1/` for `lab_physical_pentest`: -`e4838cbb...` +`9cb4d78a...`, which is Ruth's re-key. A1's baseline commit a7c55d436 came after M9 (a341c0978). The log is wrong on this; only m09 and m10 flag against `keys_baseline_a1/`. Log not edited. |

The "closing mid-knot" gap stays. With the guards it is slightly different: a reopen with changed globals that re-runs a read-out knot now lands on the hub, not at the read-out's remaining lines. The lines after the first choice (flag 1 names Tomb Beta there) are skipped for a player who closed at the first choice and had a global change meanwhile. Reopening with no change still resumes at the choices.

## Checks

- Ink: the six changed files compiled with inklecate, no errors.
- Key dump (`dump_tts_keys.rb`): the post-M3 dump and the post-n6 dump are identical (`diff -r`); the m09 delta against `keys_baseline_a1/` is the -58/+58 of M2, m10 -18/+22, nothing else. These are silent lines.
- Validator: m09 0 errors, 26 warnings (one fewer than before; only indices shifted, plus the guard fix for the mapping count); sis02 and sis03 report the same errors and warnings as HEAD (pre-existing: schema fields on `hmi_eng_02`, word caps in sis03); lab_physical_pentest 0 errors, same warnings. A first version of the backstops added a "game_loaded can send timed texts less than 4 s apart" warning; the staggered delays remove it.
- dialoguelint: no finding on any changed line; the three existing m09 findings only moved (the not-x-but-y at `agent0x99.ink` 563 to 572, the Derek handwriting line, now with the `agent_0x99:` prefix).
- `tts_mission_lines_test.rb` under `flock /tmp/be-test-suite.lock`: 5 runs, 44 assertions, 0 failures.

## Proofs (`proofs/M3R1/`, tooling `tools/phone_calls/routes/`)

All on :3023, keyless, from a fresh game. The server is stopped.

1. **Thread opened before the text** (`m09_m3_early_open.sh`, `early_*`): flag 1 emitted, thread opened at about 4 s (the text would land at about 7.5 s), read-out played, phone closed, waited 14 s. Result: no toast, no "First box is in" in the thread, `flag1_texted=true` (the mapping did fire), `flag1_read_heard=true`, one "Catalogue: salvage cage" note. Then a stale toast for `flag1_read` was forced and tapped: the thread shows the hub, still one note (`early_4_stale_tap.png`, `early_open_output.txt`).
2. **Toast tapped** (`m09_m3_readouts.sh tap`, `tap_*`): flag 1, ledger, afterwards and hour read each arrive as a toast with the phone closed, play once when tapped and show the hub on reopen. New wording visible in `tap_flag1_1_toast.png`. The hour read ends in the forced voiced `tesseract_call` as before.
3. **Reload** (`m09_m3_reload.sh early|pending|delivered`, `reload_*`): ledger text count 1 in all three. `early` is the new case: reload 1 s after the event, before the mapping's 2.5 s delay, so the latch is unset; the `game_loaded` backstop sends the text once (`reload_early_thread.png`: text, then the read-out, one copy). `pending` and `delivered` still give one copy.
   - Test-setup note: with an empty HaX history the engine preloads the pending read-out silently when the phone loads, with no tags run, so the text can land after the read-out lines. The script now gives HaX her real history (the dock opening) first. A player always has it.
4. **Lab SE Dev** (`se/`): `sha256_noseed` identical to `proofs/A0` for both dumps (`ffe4c083...` Dev, `52c50b7a...` Ruth), and the four Dev `/tts` lines are the same.
5. **M2 gap** (`proofs/M2/`):
   - `m09_sorensen_door_hax.png`: Sorensen's door scene, HaX's portrait, name "Agent HaX". Reached without `--start-room`: `--set flag1_submitted=true --set maintenance_code_used=true --set old_coyote_ko=true` (the first two unlock the doors on load, the last stops Old Coyote's talk), `cage_opened` set after load, then walked through four rooms with the bridge's `enter`. The `/tts` requests go out as `agent_0x99` (200 for the cached first line).
   - `m10_tesseract_hax.png`: the Tesseract core scene (`double_cross_open`, import `m09_recruiter_offer=double_crossed`), HaX's portrait, request id `agent_0x99`. This one uses `--start-room core`, because the core is the end of a long run. The artefact only moves which record voices a line with no id prefix; these lines are prefixed since M2, so it does not apply. The same game shows one 403 on `kowalczyk_core_waiting` ("Adrian."), the unprefixed record the artefact does hit; not HaX.

## Files

BreakEscape: `scenarios/m09_digital_archaeology/scenario.json.erb`, `ink/m09_phone_agent0x99.ink` (and the five prefixed ink files, each with its recompiled `.json`); `scenarios/sis02_energy/scenario.json.erb`, `scenarios/sis03_cyber_insurance/scenario.json.erb`, `scenarios/lab_physical_pentest/scenario.json.erb`; `tools/phone_calls/routes/m09_m3_readouts.sh`, `m09_m3_reload.sh`, `m09_m3_early_open.sh`, `m2_hax_scene.sh`; `proofs/M3R1/`, `proofs/M2/` additions. HacktivityLabSheets: `_labs/safetynet/m09_digital_archaeology.md`, `_labs/security_informed_safety/sis02_energy.md`.

## For the orchestrator

- Audio: no new keys. The 40 re-prefixed lines moved no key, the changed texts are silent.
- A7: dialoguelint does not read `read_text` texts (n4).
- Log line to correct: the A1 R2 entry's claim that M9 flags `lab_physical_pentest` against `keys_baseline_a1/` (n7).
- m10 Tesseract proof uses `--start-room core`; flag it if the orchestrator wants a pure-globals route for the closing run.
