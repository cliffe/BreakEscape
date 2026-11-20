# Phish evidence chunk C: review R2 (fresh eyes, key question on the legacy capture migration)

Review only, in worktree `.claude/worktrees/p-hard-phish-c`, branch `build/hard-phish-c`, tip
`7da3bc1d2`. Range reviewed: `git diff ea7005131 7da3bc1d2` (the whole chunk: the reader change, the
retirement of the sync phish machinery, the dangling-`needs_stamp` fix, the live-proof script, and the
R1 minor-closing commit). Prior round: `PHISH_EVIDENCE_CHUNK_C_REVIEW_R1.md` (0 / 0 / 3).

Verification run at the tip (single files, no suites, no server):
`test/controllers/break_escape/phish_legacy_migration_controller_test.rb` +
`test/controllers/break_escape/capture_proofs_test.rb` 42 runs, 249 assertions, 0 failures;
`test/controllers/break_escape/se_landing_page_build_test.rb` +
`test/models/break_escape/capture_record_test.rb` 27 runs, 106 assertions, 0 failures;
`test/js/social-phish-send-client.test.mjs` 16 pass, 0 fail.

## Counts

- Blocker: 0
- Major: 0
- Minor: 1

## Verdict

SHIP chunk C. The three R1 minors are closed in `7da3bc1d2`. The forge the plan set out to close is
closed on every live vector: the reader reads only the two server-owned stores, every live write of
those stores goes through a server recompute under the row lock, and no current path can place a
`globalVariables.se_captures` map (the one input the unconditional-proven migration trusts) into a
game's stored `player_state`. The single Minor is a defence-in-depth gap that only a save written
before the capture hardening landed (`a4401fb83`) can reach, on a pre-production game with no such
saves to protect; it is a documented grandfather, consistent with the cheat policy, and the fix is
cheap.

## R1 minors: all closed in `7da3bc1d2`

- **R1 Minor 1 (co-migration untested).** Closed. `phish_legacy_migration_controller_test.rb` gains
  `legacy_globals_state` and the test `a pure pre-store save with both legacy globals co-migrates and
  serves the secret on one bootstrap` (asserts both legacy globals present before, both consumed
  after, `seCaptures['lord'].proven == true`, both stores populated, and `capture_secrets` serves
  `Sofia2026!`), plus the `weak-choices twin` that lands no send and withholds the secret. Both pass.
- **R1 Minor 2 (dead helper, no fast-path pin).** Closed. `capture_proofs_test.rb` gains `chunk C: a
  plain sync with no capture and no legacy global loads no scenario, a capture-bearing one does`,
  which uses the previously-dead `count_scenario_loads` helper (now with a caller) to assert the
  early return at `games_controller.rb:948` skips the scenario load on a plain sync and loads it on a
  capture-bearing one. Passes.
- **R1 Minor 3 (comment names a non-existent file).** Closed. `capture_record_test.rb:154-158` no
  longer references `phish_reader_test`; it names `capture_proofs_test`, the two route tests and the
  two legacy import tests.

---

## Key question: can any current path store `globalVariables.se_captures`?

The mechanism is as reported. `migrate_legacy_captures!` (capture_proofs.rb:497-530) moves a stored
`globalVariables.se_captures` map into `player_state['seCaptures']`; for any id in
`CaptureModel.client_target_ids` (which includes `phish_target_ids`) it calls
`store_capture_entry(..., proven: true)` with no reference to the build evidence (capture_proofs.rb:522).
`capture_revealable?` returns `true` at once on `entry['proven'] == true` (capture_proofs.rb:682),
short-circuiting `capture_evidence_holds?`. So a stored `globalVariables.se_captures['lord']` is
served `Sofia2026!` with no server-built page and no landed send.

The only question that matters is whether any current path can put that map (or any key
`migrate_legacy_captures!` reads, which is only `globalVariables.se_captures`) into a game's stored
`player_state`. It cannot. Every write path to `player_state['globalVariables']` is closed:

- **Sync merge.** `merge_global_variables!` rejects every key in `SERVER_OWNED_GLOBAL_NAMES`
  (`%w[se_captures]`, game.rb:2262) before merging (game.rb:806). Both callers go through it: the
  delta sync (`games_controller.rb:2496`, ring-filtered) and the legacy API sync
  (`api/games_controller.rb:25`). The live capture step does read the request's
  `params[:globalVariables]['se_captures']` as capture entries (`incoming_capture_entries`,
  games_controller.rb:995-998), but it feeds them to `record_capture!`, which stores
  `proven = capture_evidence_holds?` (capture_proofs.rb:169), never the unconditional true; and it
  writes a top-level `seCaptures` entry, not the global. The global is dropped from storage, so it
  cannot survive to a later bootstrap.
- **Set-global / ink.** `apply_task_set_globals!` (game.rb:5972-5996) writes only a global the
  scenario declares (`declared.key?(name)`) and only a scalar value (`nil`, String, Numeric, true,
  false; game.rb:5990). A Hash is refused, and a scalar `se_captures` fails
  `migrate_legacy_captures!`'s `legacy.is_a?(Hash)` guard, so it is deleted with nothing recorded.
  `NpcFrustration#set_workaround_global!` / `set_usb_habit_global!` write only `name => true`
  (npc_frustration.rb:433,443), a scalar, same outcome.
- **Bootstrap.** Reads, migrates and deletes `se_captures`; it never writes it.
- **Clone / wear / unlock.** `Wearables#write_server_globals!` writes only the disguise keys
  (wearables.rb:136-138). No route writes `se_captures`.
- **Carry-over / imported globals.** `apply_imported_globals_to_state` seeds imported names from the
  scenario defaults but rejects `SERVER_OWNED_GLOBAL_NAMES` first (carry_over.rb:230), so
  `se_captures` is never imported.
- **Game creation from scenario globals.** `initial_player_state` is built from VM/flag params only
  (games_controller.rb:126-179); `initialize_player_state` seeds `globalVariables ||= {}`
  (game.rb:6433) and never copies the scenario's declared `globalVariables` defaults into
  `player_state`. Two scenarios do declare `"se_captures": {}` in their defaults
  (`lab_social_engineering/scenario.json.erb:341`, `lab_physical_pentest/scenario.json.erb:293`), but
  a declared default is never copied into `player_state`, an empty map fails `legacy_captures?`
  (`legacy.any?` is false), and the only effect of the declaration is that a task's
  `onComplete.setGlobal.se_captures` would pass the `declared.key?` guard, after which the scalar-only
  value check and the `is_a?(Hash)` migration guard still make it inert. No scenario can author a
  usable stored `se_captures`.
- **Hacktivity game creation (read-only grep).** `game_slot_start_service.rb:56` sets
  `game.player_state = { 'vm_set_id' => ... }`; `game_slots_controller.rb:146` calls
  `reset_player_state!`; the stuck-completions rake only reads `player_state`. None writes
  `globalVariables` or `se_captures`.

**Conclusion: no current path, so this is not a Blocker.** The denylist and the migration both landed
in the same commit (`a4401fb83`, sync deltas 6a-server), so only a save written before that commit can
carry a stored `globalVariables.se_captures`. That is the grandfather case. It is rated as Minor 1
below.

---

## Minor findings

### Minor 1 (hardening, defence in depth): the legacy capture migration serves a phish secret off an unconditional client claim

Files: `app/models/break_escape/capture_proofs.rb:522` (`store_capture_entry(..., proven: true)`),
`:682` (`capture_revealable?` short-circuit), measured against `migrate_legacy_phish_evidence!`
(`:558-612`, which re-derives the build with `PhishScore` and gates the imported send on it).

For a phish target, `migrate_legacy_captures!` stamps the capture `proven: true` from the client
`globalVariables.se_captures` entry alone, never consulting the re-derived build. This is the one
phish secret path that trusts a client-written claim without a server recompute: the two routes
recompute, the delta sync records `proven = capture_evidence_holds?`, and `migrate_legacy_phish_evidence!`
re-derives the build verdict, but a target that also appears in the legacy capture global is served
regardless. The weak-choices twin test in `phish_legacy_migration_controller_test.rb` deliberately
carries the capture as a top-level unproven claim rather than in `globalVariables.se_captures`, and
its own comment states why: the global "migrates proven: true for any declared target regardless of
the build". So the asymmetry is known and deliberately side-stepped in the tests, not covered.

Failure scenario: a save written before `a4401fb83` that holds a forged or over-claimed
`globalVariables.se_captures['lord']` is served `Sofia2026!` on the next bootstrap even though its
re-derived build does not meet the page threshold and no send lands. No current path can create such a
save (see the key question), and on a pre-production game there are no production saves that predate
the hardening, so real-world exploitability is close to nil. Against that, the cheat policy
hard-enforces secrets, and this is the only remaining phish secret served on a client claim without a
server re-derivation.

Weighing the two: the grandfather is intentional and documented (game.rb:1863, "a pre-deploy save,
earned under the old rules"), and for non-phish captures there is no server re-derivation to defer to,
so honouring old-rules saves is the accepted policy. The phish case is different only because
chunk B/C give it a server build gate that this path bypasses. Rated Minor, not Blocker or Major,
because no current path reaches it and no pre-hardening production saves exist. Recommended fix (cheap,
closes the asymmetry with chunk B): in `migrate_legacy_captures!`, for an id in `phish_target_ids`,
store `proven: capture_evidence_holds?(...)` instead of `proven: true`, letting the same locked
bootstrap's `migrate_legacy_phish_evidence!` and `stamp_proven_captures!` prove it off the re-derived
build; an honest convincing save still serves (its build meets the threshold and its send lands), and
a weak or forged one is withheld. If the grandfather is to stay unconditional by decision, add one
test asserting a weak-build save carrying `globalVariables.se_captures` is served, so the behaviour is
pinned and the decision is explicit.

---

## Confirmed clean (checklist, observations not findings)

- **Forgery on every other vector.** Forged `se_landing_pages` / `mailState` on a sync are not merged
  (closed allowlist, globalVariables denied `se_captures`); forged top-level `seCaptures` records
  `proven = capture_evidence_holds?` (capture_proofs.rb:169) and is withheld by the live
  `capture_revealable?` re-check; a stale-but-recent sync can no longer advance the phish evidence
  (early return games_controller.rb:948, no phish stamp branch); the redrive flag is a strict boolean
  (games_controller.rb:1681) used only to refuse a downgrade (capture_proofs.rb:254-256), never to
  raise a verdict, which is always recomputed with `PhishScore` (capture_proofs.rb:243); two tabs
  serialise on the row lock, both routes under `with_game_lock` (games_controller.rb:103-105) and the
  send store first-wins on `landed: true`.
- **Every honest path gets the credential.** Online (routes recompute and re-stamp), offline then
  drain, reload re-drive (carries stored choices, re-posts), legacy saves with a sent mail (bootstrap
  co-migrates and stamps), legacy saves whose honest capture co-wrote `victim.submitted` with the
  capture global, and improving after a weak build (last-score-wins replaces the verdict). Covered by
  the rewritten `capture_proofs_test` and migration tests; all pass.
- **Retired code is dead.** `phish_evidence_fingerprint`, `each_stored_sent_message`,
  `phish_gated_unproven_captures?`, `@phish_fp_before`, `needs_stamp`, `@stored_sent_message_memo` and
  `extra_sent` appear only in retirement comments across app, lib and public. The sync fast path is
  pinned by the new fast-path test; non-phish captures are unaffected (`stamp_proven_captures!` and
  the part-3 proof block are unchanged, and foothold/proof kinds hold through `capture_evidence_holds?`).
- **Lock and lost updates.** `sync_state` runs inside `Game.transaction` with `Game.lock.select(...)`
  (a row lock); the scenario/bootstrap path and both phish routes run under `with_game_lock`. The two
  server stores are bounded (one entry per page, one per target-kit, first-wins) and
  `phishEvidenceMigrated` is a single flag, so synced state does not grow; none of the three appears
  in any controller response, view or client JS, so they never ride the bootstrap or a sync answer
  back and are never re-sent.
- **Test realism and standing rules.** The serving tests seed the stores the way the routes write
  them and the route/migration tests drive the real routes. No added line carries an em or en dash, a
  model name, or a new package (`playwright` is already `package.json:29`; `node:child_process` and
  `json` are stdlib and already used). UK English throughout.
- **JS client change.** The redrive marker rides the queue and a single in-flight `draining` flag
  removes redundant overlapping drains (se-landing-page-client.js). The server is authoritative and
  idempotent, so this is a client convenience with no security impact.
