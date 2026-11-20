# m02_ransomed_trust — conclusion-gate verification

**What this run answers:** plumbing (does m02 still play end to end) and the specific regression fix
(does the mission conclude via the new `POST /break_escape/games/:id/conclude` gate, and does it
avoid the old stranding bug). It is not a hunt for unexpected-input bugs and not a full
solvability pass (the four VM flags are session-supplied stand-ins, see the earned-secrets table).

Game id: **1035** (mission 46, `m02_ransomed_trust`), created via
`tools/playtest/new-game.rb m02_ransomed_trust`.

Session log: `tools/playtest/m02_ransomed_trust-conclude-session.jsonl` (520 lines).
Flags XML: `tools/playtest/m02_ransomed_trust-flags-game1035.xml`.

The browser was run **headless** (`--headless`), not headed. In this environment the headed
Chromium build hung indefinitely past `window.__test`'s 45s appearance timeout (confirmed with a
standalone Playwright script: headless found `window.__test` in ~10s, headed never returned it in
repeated attempts up to 45–60s). This is an environment/display issue, not a scenario or game
finding — noting it because the skill's default is headed.

## 1. Does m02 still play normally end to end?

Yes, no regression found on the route played. Critical path exercised: opening cutscene →
Bernie (honest route, `sign_in_at_reception`, `bernie_trusts_player`) → Dr Kim (`meet_dr_kim`,
boardroom PIN, badge) → patient ward / Sister Doyle → IT department (ransomware terminal read,
`decode_ransomware_note`) → Gary Whitlock (rapport route, `talk_to_gary`, Server Room Keycard,
lanyard, credentials) → cover burn/restore → server room (RFID keycard) → all four VM flags
submitted at the SAFETYNET Drop-Site Terminal, each triggering the expected Ghost call → Emergency
Storage safe (PIN 1987, earned from Dr Kim's escrow-safe dialogue) → Offline Backup Encryption
Keys → Hospital Recovery Console (Combined Recovery, VM keys + physical keys) → Ghost's Act 3 call
(declined the deal) → Boardroom (PIN 0417, earned from Kim) → Hospital Communications Terminal →
transmitted the evidence → credits.

Session log line ranges (1-indexed, `seq` field): bootstrap seq 1–3; Bernie seq 4–11; Kim seq
64–99 (took two attempts to route through `access_problem` correctly, see note below); Gary seq
101–219; server room access + flags seq 220–300; safe/recovery console/press terminal seq
301–520.

One harness-navigation snag, not a scenario defect: `enter` only caches the doorway direction it
has actually seen (`rememberDoors` keys on `from->to` as printed in the door id), so walking back
out of a dead-end room (e.g. `dr_kim_office`, `it_department`) via `{"cmd":"enter"}` fails with
`no-known-doorway` until you `moveTo` the door's own coordinates directly. Worked around by moving
to the known doorway coordinates from the room `room` had already reported them at. This is a gap
in the playtest harness's doorway cache, not a game or scenario bug — flagged per the skill's rule
to suspect the harness before the game.

One authoring/dialogue-choice mistake on my part, not a bug: the first pass through Dr Kim's
opening picked "Understood. Where's Gary now?", which Ink routes to `discuss_gary` rather than
through `the_deferral`/`access_problem`, so `meet_dr_kim` did not complete on the first attempt.
Re-entering her hub and picking "Before anything else — I need to get into your IT department"
completed it correctly. Not reported as a scenario defect: the branch exists and is reachable:
the initial choice regex I supplied just picked a different, valid conversational branch.

## 2. Credits and the server record

**Credits appeared** in the browser: `brief().missionEnd` reported
`creditsShowing: true, closable: false` with `conclusionScreen: bond_visualiser`-style content
(bass/mid/high/peak signal readout, comms intel feed, operative data, encryption panel) after
confirming the transmission at the Hospital Communications Terminal. Per the skill, this overlay
is a terminal state and is **not** treated as evidence on its own.

**Server record**, checked via `bin/rails runner` immediately after `{"cmd":"sync"}`:

```
status=completed
mission_concluded_at=Sat, 12 Sep 2026 15:07:16.705510000 UTC +00:00
score=83
completed_at=Sat, 12 Sep 2026 15:07:16.705510000 UTC +00:00
```

The client-side credits event and the server-side `mission_concluded_at` timestamp are
contemporaneous (15:07:16 vs the `brief()` call that reported `creditsShowing:true` moments
later in the same command sequence), consistent with `scenario-music-events.js`'s
`concludeMission()` calling `fetch('/break_escape/games/${gameId}/conclude', …)` and only opening
credits once `result.concluded` comes back true (confirmed by reading that function directly:
`public/break_escape/js/music/scenario-music-events.js:134–180`). I did not have access to a
request-level Rails log for this run (no `log/development.log` was present under this checkout),
so the HTTP call itself was not directly inspected — the corroboration is the code path plus the
exact timing match between the credits opening and the server's `mission_concluded_at`.

## 3. Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — honest dialogue route | seq 9 | yes |
| Visitor Badge (Countersigned) | (item) | Dr. Sarah Kim, CTO office — `access_problem` | seq 77 | yes |
| Boardroom PIN | `0417` | Dr. Sarah Kim, CTO office — `boardroom_code` hub option | seq 71 | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — rapport route | seq 179 | yes |
| Gary's SSH credential | `Hospital1987` | Gary Whitlock — password-hints dialogue | seq 187 | yes |
| Spare Contractor Lanyard | (item) | Gary Whitlock — "someone's phoned security" hub option | seq 207 | yes |
| Emergency Storage safe PIN | `1987` | Dr. Sarah Kim — `escrow_safe` hub option (founding year, plaque) | seq 75 | yes |
| `hospital_backup_server` flag 1 (SSH) | `<flag:1>` | Server Room Access Terminal / SAFETYNET Drop-Site Terminal | seq 268 | **no** |
| `hospital_backup_server` flag 2 (ProFTPD) | `<flag:2>` | same drop-site | seq 271 | **no** |
| `hospital_backup_server` flag 3 (database) | `<flag:3>` | same drop-site | seq 285 | **no** |
| `hospital_backup_server` flag 4 (Ghost's log) | `<flag:4>` | same drop-site | seq 294 | **no** |

**Boundary:** this build has no VM behind `hospital_backup_server` in standalone. The four flags
were session-supplied stand-in values (per the skill's `session` policy), substituted from
`tools/playtest/m02_ransomed_trust-flags-game1035.xml`, not exploited on a real box. Everything
gated behind them (the Ghost calls, the ENTROPY Staging Cache's flag lock, `backdoor_fully_exploited`,
the recovery console's "Combined Recovery" prerequisite, and ultimately conclusion itself) is
**exercised, not tested** for actual VM exploitability. The server-side gate mechanics
(`concludeRequires`, `unmet_conclude_requirements`, `conclude_mission!`) are fully verified,
independent of whether the flags were earned or handed over.

## 4. Negative test — the gate refuses incomplete VM work

Run via `bin/rails runner tools/playtest/negative-test-1035.rb 1035`, verbatim:

```
=== ACTUAL CURRENT STATE (after all four flags submitted in the live browser run) ===
status=in_progress mission_concluded_at=nil score=63
  task:submit_ssh_flag => "completed"
  task:submit_proftpd_flag => "completed"
  task:submit_database_flag => "completed"
  task:submit_ghost_log_flag => "completed"
  task:unmask_identify => nil

=== BEFORE: simulate only 2 of 4 flags done (in-memory only, not persisted) ===
unmet_conclude_requirements => ["task:submit_database_flag", "task:submit_ghost_log_flag"]
conclude_mission! (simulated before) => {:concluded=>false, :already=>false, :missing=>["task:submit_database_flag", "task:submit_ghost_log_flag"]}
reloaded — g.status=in_progress (discarded the in-memory patch, no save! was called)

=== AFTER: real conclude_mission! call on actual persisted state (all 4 flags genuinely submitted) ===
conclude_mission! => {:concluded=>true, :already=>false, :missing=>[]}
status=completed mission_concluded_at=Sat, 12 Sep 2026 14:54:20.957642000 UTC +00:00 score=63

=== unmask_identify (story task) status at conclusion ===
nil
insider_evidence_partial global: false
inspected_asset_post global: false
```

**Methodology note on the "before" half:** by the time I reached this check, all four flags had
already been submitted through the browser (the earlier stage of the run), so there was no longer
a live game state with only some flags done. Rather than fabricate a second game just for this
check, the "before" half above patches a **duplicated, unsaved** copy of `player_state` (two of
the four `submit_*` tasks forced back to `pending`) and calls the read-only
`unmet_conclude_requirements` against it — no `save!` was called, and `g.reload` afterwards
discarded the patch, restoring the real persisted state (confirmed above: `g.status` still
`in_progress` after reload, before the real `conclude_mission!` call). The "after" half is the
genuine, unpatched, persisted state. This demonstrates the exact gate mechanism the fix changed:
`missing` names `task:submit_database_flag` / `task:submit_ghost_log_flag` — literally the
outstanding `task:submit_*` entries, not `unmask_identify` or any other `requiresCompleted` item.

I then reverted this manual conclusion (`status`/`mission_concluded_at`/`completed_at` set back to
`in_progress`/`nil`/`nil` via `update_columns`, score left as-is since the column is `NOT NULL`)
so that the browser session could reach the *organic* ending afterwards — see §2, where the real
client-triggered `POST /conclude` flow independently concluded the same game a second time, this
time for real, at `mission_concluded_at` 15:07:16, score 83 (higher than the manual-conclusion
snapshot's 63, because by then the recovery console, Ghost's Act 3 call, and the press-terminal
exposure decision had also been completed).

## 5. Old bug cannot recur — confirmed

`unmask_identify` requires `insider_identified`, which requires `insider_evidence_partial` (set
only by Bernie's Reeves breadcrumb, Dr Kim's `fire_drill` topic, Val Okonkwo's `discuss_reeves`
topic, or reading three specific objects — the boardroom "Ransomware Incorporated Proposal", Val's
Pocket Notebook, or the ENTROPY Asset Tag) **and** `inspected_asset_post` (set only by reading the
boardroom's Night Security Post Log). I deliberately steered every conversation (`converse` with
explicit `choices` regexes rather than its default branch-exhaustion) to avoid all of these, and
never read the three named documents.

Confirmed on the final, organically-concluded game record:

- `unmask_identify` task status: `nil` (never completed)
- `insider_evidence_partial`: `false`
- `inspected_asset_post`: `false`
- `insider_identified`: `false`

The mission **did** conclude anyway — `status=completed`, `mission_concluded_at` set, `score=83`.
This is strictly lower than it would have been with the insider thread resolved (that aim's tasks
— `unmask_gather_evidence`, `unmask_db_window`, `unmask_ghost_badge`, `unmask_identify` — feed
`calculate_task_score`, and `unmask_gather_evidence`/`unmask_identify` were left incomplete), but
the ending was reached and recorded regardless. This is exactly the fix's intent: the old
`requiresCompleted` gate would have stranded this exact run at `in_progress` forever, because
`unmask_identify`'s only route was never taken.

One incidental observation from the closing sequence, not classified as a defect: with
`insider_identified` false, Graham Reeves's `press_terminal_ambush` fired on
`decide_hospital_exposure` (as documented) and set `insider_confronted: true`, but neither
`insider_asset_escaped` nor `insider_asset_arrested` ended up `true`. The walkthrough's own notes
describe this branch as setting `insider_asset_escaped`. I'm flagging the discrepancy for someone
with scenario-authoring context to judge — it did not affect conclusion, gating, or score
mechanics, which is what this run was verifying.

## Summary of defects found

None in the conclusion-gate mechanism itself — it behaved exactly as documented in every check
above. Two non-blocking observations, neither classified as confirmed bugs:

1. Playtest harness: `enter`'s doorway cache is direction-specific and doesn't help with the
   reverse trip out of a dead-end room; workaround was moving to the door's known coordinates.
2. Scenario/ink: `insider_confronted` fires from the ambush branch without the documented
   `insider_asset_escaped`/`insider_asset_arrested` — worth a scenario-author's look, does not
   affect the conclusion gate.
