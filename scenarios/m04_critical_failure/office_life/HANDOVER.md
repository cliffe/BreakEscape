# m04 office life: build-phase handover

Branch `build/ol-m04`, worktree `.claude/worktrees/p-ol-m04`. The plan-phase handover is in git history (3de62e5ab). The user answered D117: all seven plan recommendations accepted (Q5 (a): the dialogue sample needs its own yes before any voicing; voicing is a separate yes after that).

Keyless server still running on :3097, puma PID 2162290 (started from this worktree, log `tmp/server-3097.log`). Stop it by that PID when the live work is done.

## Done

- Slice A (data, ink, static checks), exchange lines cut to the validator's 40-character cap, slice B (measured posts, cooler cell, doors, needs clock), kettle fix (`useFrom` dx 1.5 dy 2 so the second user does not pass the first). All in `BUILD_LOG.md`.
- Live proofs `LIVE_PROOF_1.md` to `LIVE_PROOF_6.md`; regression `REGRESSION.md` (bin/test-js 760/0; route suite 27/13 same as base; new routes r41, r42 pass; r5/r6 assertions now THIRTEEN).
- Build reviews: R1 0 B / 2 M / 5 m (planning tier); R2 0 B / 3 M / 7 m (planning tier). Outcomes in `BUILD_LOG.md`.

## Open (in order)

1. **F1 (new, from LIVE_PROOF_6):** a second talk to either newcomer shows only "End of conversation", so the curt line plays only on a first talk. Fix in data/ink (see how other one-line NPCs re-run their `start` knot; m05's cleaner is a candidate pattern), prove live, then a planning-tier round (it changes what a line reveals).
2. **R2 M2:** full playthroughs with office life on are not done. `HANDOVER_PLAYTEST.md` (cheap scripted tier) got stuck at the Vance phone call (only a close option; no evacuation choice). Treat as a scripted "stuck": recheck on the mid tier before calling it a bug; the clone route then the KO route with a newcomer KO to the credits. The bridge has no `game.loop.setFPS`: find the right handle (the agent reported `window.game.game.loop`).
3. R2 M3 remainder: L6 vent and hydrogen-alarm cases not run (need the VM flag chain plus a 14-minute timer); decide whether the new route tests plus the mapping read are enough, and log it.
4. R2 minors left open: pair render on the new kettle cells (`screenshots/lp5_c6_pair_before.png`, not yet looked at), sofa re-shoot.
5. Build review R3 (planning tier: F1 is a line-reveal change), then R4 and R5 as deltas on the review tier unless a major or design change appears. Stop at R5 with 0 B / 0 M.
6. npc-dialog-review on the new lines only (both new ink files, the pools, the bark, the debrief line).
7. Final static checks on the last commit: validator, `--office-summary` diff vs `v1_summary_build.txt`, lock/key diff empty, positions diff.

## For the report to the integrator

- Probes slipped into games 7782 and 7820 (not ours; one player move each, no row edited). Game 7984 was not used by this build after 23:26 UTC.
- Untracked `tools/playtest/m04_critical_failure-flags-game*.xml` files from new-game.rb are left in the worktree.
- Voicing needs a yes for: all new lines (`SPOKEN_LINES.md`), and the re-voice of the changed debrief head-count line (`ink/m04_closing_debrief.ink`, see `SPOKEN_LINES.md`).
