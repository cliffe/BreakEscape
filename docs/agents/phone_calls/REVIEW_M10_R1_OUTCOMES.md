# M10 review round 1: outcomes

Fixer: Sonnet, 2026-11-12. Review: `REVIEW_M10_R1.md` (accept; m1 to m4).

- **m1 done.** The m06 ERB comment (near `call_in_after_sweep`) and the ink comment above the call-in section now say the task completes on the `[Bring me in.]` reply, before the ending question, not in `extract_go`.
- **m2 done.** m08 `scenario.json.erb` hostile text (:877) now says "Call me when you've got both.", matching the KO text. `agent_0x99` has a `call` entry (`hax_read_1`), so "Call me" is true for both beats.
- **m3 done.** The fund-call paragraph moved out of the executive-wing Nudge into the "Satoshi Nakamoto II" Nudge in `m06_follow_the_money.md`, reworded to "She can set out what freezing the wallet would cost against watching it" so it holds for both branches. HacktivityLabSheets `10c4c44`. No VM companion opened.
- **m4 done.** Voiced (handler_recommendation, a call knot) and unconditional, so it can read as news.
  - Before: "Watching still works with him detained. The payout's pre-signed; we keep it quiet until it's gone."
  - After: "Watching still works if we detain him. The payout's pre-signed; we keep it quiet until it's gone."
  - Re-keys one clip (m06 added keys stay 23, the old key was never generated).

Checks: ink recompiled (`scripts/compile-ink.sh m06_follow_the_money`, 9 files, 0 failed). `validate_scenario.rb --no-graph --skip-ink` exit 0 on m06 and m08. `validate_phone_calls.rb` clean on both. dialoguelint: 7 errors, the same pre-existing word-cap set (m06 2 ERB + ink, m08 3 ERB + ink). `tts_mission_lines_test.rb`: 4 of 5 pass; the fifth fails on m01 `m01_phone_agent0x99.json` lines that print a variable ("Agent Zero" lines). m01 is not touched here. Run needed `RBENV_VERSION=2.7.0 BUNDLE_GEMFILE=<main checkout>/Gemfile` because the worktree's bundle lacks gems.
