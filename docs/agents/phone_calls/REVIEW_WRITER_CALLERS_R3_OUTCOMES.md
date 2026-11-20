# Callers writing review R3: outcomes

Orchestrator, 2026-11-12, commit 5c6327184.

| Finding | Change |
|---|---|
| M1 hung-up T-30 loses the teacher echo | `m07_architect_comms.ink` :184, :271, :338, :390: `{late_first_contact and not architect_echo_heard:` became `{not architect_echo_heard:`, so the next call carries the echo whenever T-30 ended before `t30_close`. To confirm live in M6 (the review read it from plan row 25). |
| m1 folded T-20 line comes last | In `taunt_t10_vm` the folded "Washington, then…" / "San Francisco, then…" block now follows "Stop this…", before the doors line. No text changed, so no key moves. |

Checks: inklecate clean; dialoguelint no new hits; loopcheck 6/6 clean on `taunt_t10_vm`, `taunt_t20`, `taunt_t10`, and `start` loops as a hub should.

For the M5 live proof (noted by the reviewer, not a finding): after a knockout during the Recruiter's first call, ringing her back replays that call from the start.
