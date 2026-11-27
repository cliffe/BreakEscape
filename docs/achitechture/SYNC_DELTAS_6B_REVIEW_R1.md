# Sync deltas 6b-server review (R1): capture reveal/proof gating

Counts: 0 blockers, 1 major, 1 minor, 2 nits.

Scope: commit `9271f4435` (6b: reveal/proof gating) as it sits on 6a-server and
its review fixes (`5620ec5b6`). Worktree `.claude/worktrees/p-sync-review`,
detached at `09795e724`. Serving stays main's `authored_capture_secret` path per
the orchestrator's 6a amendment (no writer pass, no `candidate_secret`, no
`legacySecret`); 6b adds a `capture_revealable?` gate on the two readers. This
review takes that amendment as the contract. Files reviewed:
`app/models/break_escape/capture_proofs.rb`, `lib/break_escape/capture_model.rb`,
`app/models/break_escape/game.rb`, `app/models/break_escape/network_access.rb`,
`app/controllers/break_escape/games_controller.rb`.

## Verdict

6b does what it claims and is backward compatible. It closes the 6a window in
which a bare client capture claim was served at once: a credential whose phish
page evidence or capture proof does not hold is now stored `proven: false` and
withheld by both readers until the evidence reaches the server. The honest earned
routes still serve (Len's PIN, the SE phish once its page and mail are present).
Grandfathering is bounded to genuine pre-deploy saves: the `se_captures` global is
stripped on every client write path, so a new client cannot write a legacy-shaped
entry. A stale request records but never stamps and never serves new evidence.
Nothing in 6b grows the synced state: `proven` is a server-only boolean per
entry, never shipped to the client, and `seCaptures` stays bounded by the
scenario's capture targets (q77 compliant).

The one substantive point (M1) is that the part 2 phish gate reads client-synced
state, so a determined tamperer can still satisfy it without the minigame, and the
value it then serves can be a hard-access one. This is the stated best-effort
boundary for a client-side phishing lab (q77/q78), not a regression, but it defeats
the stated 6b goal of gating a phished hard-access secret and needs a user ruling.

## Accepted boundary (q77/q78), stated for the record

6b's part 2 evidence (`phish_page_evidence_holds?`, capture_proofs.rb:382) reads
`player_state.globalVariables.se_landing_pages` and the sent messages in
`player_state.mailState` / the request body. Both are ordinary client-synced
sections: `se_landing_pages` is written only by the browser minigames
(`landing-page-builder-minigame.js`, `mail-bridge.js`) and is NOT in
`SERVER_OWNED_GLOBAL_NAMES`, so `merge_global_variables!` stores it verbatim. The
server never computes a phish verdict; it cannot, because the "victim" is an
in-game simulation in the browser. So part 2 is a client assertion the server
mirrors, and a raw HTTP client can forge it (proven live, game 1900, below).

This is acceptable for a self-paced teaching lab in the same way the 6a review
accepted the bare-claim window under q78: the forger only skips their own
gameplay, there is no cross-player or system impact, and honest play produces the
very same evidence. 6b raises the forgery cost from a one-field capture claim to a
forged page record plus a landed sent message. The finding below is the one place
this boundary bites harder than the 6a review assumed.

## Major

### M1. A forged phish serves a hard-access capture secret; the hard-access guard is absent on the landing-page serving passes

Files: `app/models/break_escape/game.rb:1399` (the new `capture_revealable?`
gate), `app/models/break_escape/game.rb:1401-1407` (the `by_address` and
`only_secret` passes), `app/models/break_escape/capture_proofs.rb:382`
(`phish_page_evidence_holds?`).

Scenario. In `lab_social_engineering`, landing page `payroll_login` carries
`capture.secret = "Sofia2026!"` with `capture.address = "s.lord@ledgerwell.example"`,
and `Sofia2026!` is in `CaptureModel.hard_access_values` (it opens a lock or is a
flag in that scenario). `capture_secrets_for_client` serves it through the
`by_address` pass (game.rb:1402), which, unlike the `authored_capture_secret` pass
(game.rb:1406, guarded by `hard_access_capture_value?` at game.rb:1429), applies no
hard-access guard. 6b's only barrier in front of it is `capture_revealable?`, whose
part 2 evidence is the client-forgeable `se_landing_pages` record plus a landed
sent mail. The SE scenario has no account-holder NPC for this credential
(`account_capture_passwords` is empty there), so the account proof gate that
protects the same kind of value in `lab_physical_pentest` does not apply at all;
the forgeable part 2 gate is the whole defence.

Failure. A tampered client that never runs the phishing minigame sends one
`PUT /sync_state` carrying `globalVariables.se_landing_pages.payroll_login =
{built, meetsThreshold, victim.submitted}` and one `mailboxes.<box>.<id> =
{folder:'sent', landed:true, targetId:'lord', link:{kitId:'kit_payroll_page'}}`,
then `GET /capture_secrets` returns `{"lord":"Sofia2026!"}` (proven live, game
1900). The 6a review's stated invariant, "hard-access secrets stay withheld", does
not hold on the phish `by_address` path.

Why major, not a blocker. It is not a regression: under 6a the same value was
served on a bare claim, and under pre-6a the client wrote the `se_captures` global
directly. It may be fully intended, because a working phished credential is the SE
lab's payload and the server cannot verify client-side phishing. It is flagged
major because 6b is the step whose purpose (per the 6a review) was to gate exactly
this, and it serves a hard-access value on tamperable state. This needs a user
ruling.

Fix (whichever the ruling supports):
- If a phished hard-access secret must not be a free grant: apply the hard-access
  guard to the landing-page passes too, for example gate the final assignment at
  game.rb:1407 with `!hard_access_capture_value?(secret)` (or apply it to the
  `by_address`/`only_secret` lookups), so a landing-page secret that is a lock
  code, PSK or flag is withheld on the capture record alone, as the authored pass
  already is. Confirm this does not break an SE lab that intends the phished
  credential to be usable for sign-in.
- If it is accepted by design: record in the plan that part 2 is advisory, that a
  landing-page `capture.secret` which is a hard-access value is served on
  client-asserted evidence, and that authors must not put a value behind a phish
  gate that they also want hard-enforced.

## Minor

### m1. A forged, never-provable unproven entry makes every evidence-carrying sync load `scenario_data`

File: `app/controllers/break_escape/games_controller.rb:855-859`,
`app/models/break_escape/game.rb:786-790` (`stored_scenario_data`).

`needs_stamp = carries_evidence && @game.unproven_captures?`. Once a client records
a capture it can never prove (a forged phish target it will never send evidence
for), `unproven_captures?` stays true for the life of the game, so every later
sync that carries `globalVariables` or `mailState` (most real syncs) fetches
`scenario_data` (60-150 KB) inside the `sync_state` row lock to run the stamp,
which finds nothing to do. The plan acknowledges the fetch; the point here is that
a client triggers it cheaply and permanently with one forged claim. Blast radius is
one game (the lock is `FOR UPDATE` on that game's own row), so no cross-game
contention.

Fix: skip the stamp fetch when the request cannot complete any pending entry, for
example remember on the entry which page id / proof it waits on and only load when
the request's sections name that page or proof; or cap how long an unproven,
evidence-absent entry keeps forcing the load. At minimum, note the cost where
`needs_stamp` is computed.

## Nits

### n1. Part 3 withholds even when the account password opens nothing

File: `app/models/break_escape/capture_proofs.rb:304-307`,
`lib/break_escape/capture_model.rb:511`.

`capture_evidence_holds?` requires a `target_capture_proofs` entry to hold whenever
the list is non-empty, regardless of whether the captured account's password opens
anything. Main's account pass short-circuits (`account_capture_served?` returns
true when `account_password_opens_something?` is false, capture_proofs.rb:112), so
6b's reveal gate is stricter than the account pass for an account that carries a
`captureProof` but whose password opens nothing. The direction is safe (it
withholds, never over-serves), no authored scenario hits it today (the lab account
passwords all open something), but an author who adds a `captureProof` to such an
account would find the capture withheld until the proof holds. Worth a line in the
plan.

### n2. `each_stored_sent_message` rescans the whole mailbox per revealable check

File: `app/models/break_escape/capture_proofs.rb:395-417`.

Every `capture_revealable?` / `capture_evidence_holds?` call for a phish credential
walks all mailboxes and all messages. With several pending phish entries and a full
mailbox this is O(entries x messages) per serve and per stamp. Mail is trim-bounded
so it stays finite, but a per-request memo of the sent messages (or an early index
by `targetId`) would avoid the repeat scan. Informational.

## Answers to the review questions

1. `proven` / `capture_evidence_holds?`. Part 2 and part 3 are evaluated correctly
   (both must hold, AND). Part 3 proofs come from server-recorded facts
   (`plantedItems`, `droppedItems`, `signedInPcs`, `gainedFootholds`) that only
   grow, so they are genuinely server-owned and not forgeable from a capture claim.
   Part 2 page record and sent mail are client-synced and forgeable (M1). The
   stored entry's fields are still taken from the scenario by `record_capture!`, so
   a forged client cannot inject an arbitrary address, host or note; it can only
   make the gate pass for a declared target.

2. `capture_revealable?` / `stamp_proven_captures!` and the readers. Both secret
   readers are gated (`capture_secrets_for_client` game.rb:1399,
   `account_capture_usernames` network_access.rb:1290). These are the only two
   callers that serve a secret or an account username from `se_captures_record`;
   `captures_for_client` (the capture-log shape) intentionally serves unproven
   entries with no secret. No ungated secret path found.

3. Grandfathering. `se_captures_record` falls back to the legacy global only when
   `player_state['seCaptures']` is not a Hash, and the legacy global is stripped on
   every client write (`merge_global_variables!` game.rb:334, carry-over imports
   carry_over.rb:120/230, refused as a new game global). A new client that sends
   `globalVariables.se_captures` has each entry recorded through `record_capture!`
   (server fields, 6b `proven` computed), never written to the legacy global, so it
   cannot mint a grandfathered-proven entry. Bounded to genuine pre-deploy saves.

4. Stale sync. A stale request records (grow-only, safe to repeat) but
   `carries_evidence` is false, so `needs_stamp` is false, `record_capture!`
   computes `proven` from already-stored evidence only, the stamp is skipped
   (`return if stale`), and the forged mail/globals in the stale body are not
   merged. Proven live (game 1901): a stale body carrying `se_landing_pages` served
   nothing new. Correct.

5. Honest earned routes. Live proof green: Len's PIN served on the claim (not
   proof-gated, not a phish target), the SE phish served once its page and landed
   mail are present, and the physical-lab account captures (hampshire/lord/pierce)
   stay withheld without their proofs. `lab_physical_pentest_secrets_test` and the
   capture suites green.

6. `stored_scenario_data`. Correct: `has_attribute?('scenario_data')` is false on
   the narrow sync load (`SYNC_STATE_COLUMNS`) so it falls to the `pick`, and true
   on a full load / after `with_lock` (which reloads all columns), so one source
   either way. `scenario_data` is fixed at creation, so the in-memory attribute is
   never stale.

7. q77 sync rule. Compliant. `proven` is a server-only boolean per entry, stripped
   from `captures_for_client`, never shipped or re-synced. `seCaptures` is bounded
   by the scenario's capture targets. `incoming_sent_messages` reads the request
   body and stores nothing. No section grows per sync. (See m1 for a query-cost, not
   a payload-size, concern.)

8. Tests. See below.

## Live proof

Keyless headless server on :3230 (no `GEMINI_API_KEY`), stopped afterwards. Games
created in the shared dev DB: 1900 (`lab_social_engineering`), 1901
(`lab_physical_pentest`). No db tasks run.

- Game 1900, honest-route value: `payroll_login` secret `Sofia2026!`, kit
  `kit_payroll_page`, phish target `lord`.
- Forged, no evidence: `PUT /sync_state {captures:[{targetId:'lord'}]}` recorded
  the entry; `GET /capture_secrets` returned `{"secrets":{}}`. Withheld. (6b closes
  the 6a bare-claim window.)
- Forged evidence (M1): `PUT /sync_state` with `se_landing_pages.payroll_login
  {built,meetsThreshold,victim.submitted}` and a `sent`/`landed` mail for `lord`
  with `kitId:kit_payroll_page`; `GET /capture_secrets` then returned
  `{"secrets":{"lord":"Sofia2026!"}}`. Served on forged client state; `Sofia2026!`
  is a hard-access value.
- Game 1901, Len honest: `PUT /sync_state {captures:[{targetId:'len'}]}` then
  `GET /capture_secrets` returned `{"secrets":{"len":"4471"},"accounts":{}}`.
  Served.
- Game 1901, accounts without proof: claiming hampshire/lord/pierce returned
  `{"secrets":{"len":"4471"},"accounts":{}}`: the account passwords stay withheld.
- Game 1901, stale: `clientTs` below the stored value returned
  `{"stale":true,...}`, merged no evidence, served nothing new.

## Tests (affected files, no lock)

Green:
- `capture_proofs_test`, `captures_sync_test`, `capture_record_test`,
  `capture_secret_test`, `capture_payload_secret_test`,
  `lab_physical_pentest_secrets_test`, `capture_secret_endpoint_test`,
  `capture_payload_secret_routes_test`: 116 runs, 1472 assertions, 0 failures.
- `network_withholding_test`, `access_model_withholding_test`: 21 runs, 245
  assertions, 0 failures.

6b changed Ruby only (git show confirms no JS), so no JS harness copy-list change
and no JS test rerun is required.
