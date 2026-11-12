# Sync deltas 6a-server review (R1)

Counts: 0 blockers, 0 majors, 2 minors, 4 nits.

Scope: the 6a-server commits `fc8e37965~4..fc8e37965` (`a4401fb83`, `eea02e21a`,
`cf05062a4`, `fc8e37965`) plus the reader slice `849a4fa3d`. Worktree
`.claude/worktrees/p-sync-review`, detached at `9a156704c`. Serving stays main's
authored path per the orchestrator's 6a amendment (no writer pass, no
candidate_secret, no legacySecret, no stored `writer` key); this review takes
that amendment as the contract.

## Verdict

The step does what it claims and is backward compatible. The trust model is
narrower than main, not wider: before this step any `PUT /sync_state` could write
the `se_captures` global with an arbitrary `address`, so a client could name
another page's capture address or another account's username and be served that
secret (plan 6.2). Now the client names only the target id and the kind and picks
between the candidate values the scenario's own writers allow; every stored field
comes from the scenario. An undeclared target is refused where before any sync
could write the global. The record holds no `secret`. Migration is idempotent and
drops malformed legacy data cleanly. The carry-over guard, the per-sync cap and
the bounded capture strings all hold. Tests cover the machinery and the routes.

The two minors and four nits below are defensive hardening and authoring hazards,
none with a live exploit in the two capture scenarios as authored today.

## Accepted under q78 (by design, not a finding)

A tampered client can record a capture for a declared target before reaching its
beat and then be served that target's non hard-access secret. Proven live: a
forged `PUT /sync_state { captures: [{ targetId: 'len', kind: 'credential' }] }`
on a fresh game (before the shoulder-surf beat) recorded `seCaptures['len']` with
the scenario's own fields (the stored `address` is the authored `l.okafor`
whatever the client sends; the model test `a capture for A naming B address` shows
a client `s.hampshire` overwritten with `s.lord`), and `GET /capture_secrets` then
returned `{"len":"4471"}`.

This is acceptable under q78 because Len's PIN opens nothing. The records door is
`lockType: rfid, requires: cm_records_badge` (scenarios/lab_physical_pentest,
door line ~1989 and the baked door ~1237), and the capture's own authored note
says "the PIN alone never opened the door". The PIN is an event-gated value that
is not in `CaptureModel.hard_access_values`, so `authored_capture_secret`'s
hard-access guard (game.rb:1344) correctly does not withhold it, and the forged
claim saves the player only the time of playing the optional beat, not any access
honest play could not reach. Hard-access secrets (a password or PIN that opens a
lock, an RFID/biometric requires, a Wi-Fi PSK, a flag) stay withheld by that
guard, and account passwords stay behind `account_capture_served?`. This is the
documented 6a grandfathering window (plan 6.2, "the window in which a forged phish
capture is grandfathered"); 6b closes it with the evidence and proof gates.

## Minors

### M1. The capture `note` rides the bootstrap mirror and the sync answer with no hard-access guard

Files: `app/models/break_escape/capture_proofs.rb:264` (`captures_for_client`
includes `note`), `app/controllers/break_escape/games_controller.rb:900`
(`client_capture_entry` includes `note`), `app/controllers/break_escape/games_controller.rb:325`
(the `scenario` bootstrap mirror `savedGlobalVariables.se_captures`).

The `secret` field is guarded four ways on the serving path, but the `note` is
shipped verbatim the moment a capture is recorded, and recording is forgeable
before the beat (see the q78 note above). The brief's stated invariant is "no
secret may ride the bootstrap mirror"; the mirror and the sync answer both carry
`note` with no scan at all. The one sanctioned exception, the heard-share login
note, is earned-only and correct (see N3). The gap is that nothing stops a future
author putting a lock-opening value into a capture `note`: it would then leak
through the mirror and the sync answer on a forged pre-beat claim even though the
same value in `secret` would be withheld.

Failure scenario: an author writes `addCapture.note = "door PIN is 7788"` where
7788 is a password/pin lock code. A tampered client forges the capture before the
beat; `GET /scenario` and the sync answer ship the note; the player reads the lock
code without reaching the beat. No current scenario does this (I checked every
authored note in lab_physical_pentest and lab_social_engineering; all are
findings prose, none contains a lock code, PSK or flag).

Fix: in `scripts/validate_capture_log.rb`, where the authored string lengths are
already checked against `all_capture_candidates`, also error when an authored
`note` (or `roleLabel`/`address`/`host`) contains a `CaptureModel.hard_access_values`
value. This keeps the note channel as safe as the `secret` channel and costs
nothing at runtime.

### M2. `default_account_address!` assumes the writer's owner is the account it captures

File: `lib/break_escape/capture_model.rb:365` (`default_account_address!`), called
from `all_capture_candidates` (:338, :348, :361).

A capture writer whose owner NPC holds an account and authors no `address` takes
that owner's account username as the stored address. This is load-bearing for
serving (both readers key an account holder's secret on `entry['address']`), and
it is correct for a self-capture, which every target in the labs is (plan 6.2
part 3: "owner and the account are the same NPC"). But nothing enforces that the
writer's `targetId` is the owner's own account. A mapping on account-holder A with
`targetId: 'B'` and no `address` would default the address to A's username, so a
capture claimed for B would be served A's password (`by_username[A]` in
`capture_secrets_for_client`, game.rb:1318), binding a secret to the wrong
account.

Failure scenario: an author writes an addCapture on NPC A (an account holder)
that is meant to capture NPC B's credential but omits `address`. The record binds
A's username to target B, and `GET /capture_secrets['B']` returns A's password.
No current scenario triggers this; it is a latent authoring correctness hazard
that the brief's point 2 asks about.

Fix: either require an explicit `address` when a capture writer's `targetId` does
not match its owner's id (a validator error in validate_capture_log.rb), or scope
`default_account_address!` to apply only when the owner's own id equals the
capture `targetId`. The validator route is safer because it fails loudly at
authoring time rather than silently dropping the default.

## Nits

### N1. The sync step and the bootstrap step read the scenario from two different sources

Files: `app/controllers/break_escape/games_controller.rb:857` and `:2033`
(`Game.where(id: @game.id).pick(:scenario_data)`), versus
`app/models/break_escape/game.rb` `run_bootstrap_writers!`/`record_shared_logins!`
which use `scenario_data` (the method).

`pick(:scenario_data)` reads the stored jsonb column; `scenario_data` is the
model accessor. In standalone they are the same object graph (the route and live
proofs both store and serve the correct scenario fields), but if any mount renders
or memoises `scenario_data` differently from the raw column, the sync-path
`record_capture!` and the bootstrap-path `record_shared_logins!` could see
different scenarios within one game. Worth a one-line confirmation that
`scenario_data` is the stored column for every mount (Hacktivity included), or a
shared private helper so the two paths cannot drift.

### N2. The per-sync overflow refusal can double-answer a duplicate target id

File: `app/controllers/break_escape/games_controller.rb:873`
(`incoming.drop(MAX_CAPTURES_PER_SYNC)`).

An entry past the 64 per-sync cap is marked `capturesRefused[target_id] =
'invalid'` even when the same `target_id` was already recorded or answered within
the first 64. The client would then receive both a `captures` entry and a
`capturesRefused` entry for one id. Harmless (the record is already stored
first-wins), but the refused map is noisier than it needs to be. Skip the refusal
when `@capture_answers` already holds that id.

### N3. The server-composed heard-share note is not bounded by the validator

Files: `lib/break_escape/capture_model.rb:477` (`shared_login_capture` builds the
note from `displayName`/username at runtime), `app/models/break_escape/capture_proofs.rb:178`
(`record_shared_login!` stores it whole with no length check).

The authored capture string bounds (validate_capture_log.rb) only cover authored
candidates, not the note the server composes from NPC names. A very long
`displayName` would make the composed note exceed `MAX_CAPTURE_NOTE_CHARS` and be
stored and shipped unbounded. Low risk because names are short and bounded
elsewhere, but the composed note is the one capture string with no cap. The note
correctly carries the password only under `revealSecret` and only once the share
is heard; `npc_workaround_h_test` confirms it appears nowhere but `captures` and
the `savedGlobalVariables.se_captures` mirror, which is the sanctioned exception
to the "no secret in the record" invariant and is earned-only. This nit is about
the length bound only.

### N4. The carry-over validator hardcodes `se_captures` instead of tracking the server-owned list

File: `scripts/validate_scenario.rb:5311` (`if %w[se_captures].include?(name)`).

The model's authoritative list is `Game::SERVER_OWNED_GLOBAL_NAMES`
(game.rb:1645). The validator cannot easily load the Rails constant, but the
hardcoded literal will drift if a second server-owned global is added. Add a
guard test asserting the two lists agree, or a comment at both sites pointing at
the other.

## Tests run (affected files, no lock)

All green.

- `capture_record_test` + `captures_sync_test`: 21 runs, 73 assertions, 0 failures.
- The six must-stay-green capture tests (`capture_proofs_test`, `capture_secret_test`,
  `lab_physical_pentest_secrets_test`, `capture_payload_secret_test`,
  `capture_payload_secret_routes_test`, `capture_secret_endpoint_test`) with
  `npc_workaround_h_test` and `carry_over_test`: 150 runs, 1700 assertions, 0 failures.
- `npc_frustration_test`, `access_leak_scanner_test`, `reload_persistence_test`:
  150 runs, 748 assertions, 0 failures.
- JS `validator-capture-log.test.mjs` + `capture-log.test.mjs`: 33 pass, 0 fail.
- Scenario validator (`--no-graph`) on lab_physical_pentest and
  lab_social_engineering: 0 errors each.

Coverage gaps that follow from the findings: no test asserts a note carrying a
hard-access value is rejected (M1, the guard does not exist yet), and none covers
a no-address mapping whose owner is not the captured account (M2).

## Live proof

Keyless headless server on port 3180 (session-start.sh harness, keyless confirmed
in the boot log), stopped by its exact PID when done. Two games created on the
shared dev DB, both lab_physical_pentest: id 1853 (honest browser drive) and id
1855 (forged claim). No db tasks run.

Honest path, game 1853, driven through the `window.__test` bridge:
- Walked briefing_room to open_plan, positioned the player by the ledger shelves
  with `courier_ready` false (no hi-vis), waited for Len's routine, and clicked
  the shelves while `len_at_door && len_keying`. `kp_pin_surfed` went true (the
  `player_watched_reader` beat fired).
- Server-side after the sync: `player_state['seCaptures']['len']` written with the
  scenario's own fields (`address: l.okafor`, the authored note, `kind:
  credential`, `proven: true`); no `se_captures` legacy global stored.
- `GET /capture_secrets` returned `{"len":"4471"}`; before the beat it returned
  `{}` (fresh game check).
- `GET /scenario` (reload) shipped `captures.len` (no secret, no `proven`) and
  mirrored it into `savedGlobalVariables.se_captures.len`, so the current client
  reader still fills the capture log after reload.

Forged path, game 1855 (fresh, before any beat):
- `GET /capture_secrets` was `{}` before the forge.
- `PUT /sync_state { captures: [{ targetId: 'len', kind: 'credential',
  address: 'l.okafor' }] }` (with the page's CSRF token and session cookie) was
  accepted; the answer stored the authored fields and overwrote any client-sent
  address with `l.okafor`.
- `GET /capture_secrets` then returned `{"len":"4471"}`.
- Acceptable under q78: Len's PIN opens nothing (records door is RFID/badge; the
  authored note says the PIN alone never opened the door). See the accepted-under-q78
  section above.
