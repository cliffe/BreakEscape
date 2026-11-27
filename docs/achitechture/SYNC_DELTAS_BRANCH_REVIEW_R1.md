# Sync deltas full-branch review (R1)

Counts: 0 blockers, 0 majors, 1 minor, 2 nits.

Scope: the whole branch diff `git diff b7d500ccf...1fba1baa7` (main `b7d500ccf`
merged into the tip). Worktree `.claude/worktrees/p-sync-review`, detached at
`1fba1baa7`. Focus per the brief: the new server capture paths (`CaptureModel`,
`CaptureProofs#record_capture!`, `/capture_secrets`, `migrate_legacy_captures!`,
`stamp_proven_captures!`), any route accepting client state, delta correctness,
migration idempotence, error handling and test coverage. The 6a (bare-claim
window) and 6b (forged-phish part 2 is advisory) boundaries, the cheat policy,
`authored_capture_secret` as the single serving path, step 8 and the sync-size
rule are taken as standing rulings and not re-raised.

## Verdict

The branch holds up. The server owns the capture record end to end: the client
names only a declared target id and a kind and picks between the scenario's own
candidate values; every stored field comes from `scenario_data`
(`CaptureModel.capture_candidates`), and `merge_global_variables!` strips the
`se_captures` global on every write path (game.rb:331), so no client sync can
write the record directly. I confirmed no client-writable key marks an entry
`proven` or reveals a secret early:

- `player_state['seCaptures']` is written only by the `CaptureProofs` methods;
  no sync-merge section copies a top-level `seCaptures` or `proven`
  (games_controller.rb:1975 `merge_last_write_wins_sections`, :2051
  `merge_grow_only_sections`).
- Part 3 proof records (`plantedItems`, `droppedItems`, `signedInPcs`,
  `gainedFootholds`) are written only by the dedicated server routes, never by a
  grow-only sync merge, so a capture claim cannot forge them.
- Claiming `kind: 'foothold'` to skip the phish gate serves no credential secret:
  `capture_secrets_for_client` and `account_capture_usernames` both `next` on a
  non-credential entry (game.rb:1391, network_access.rb:1287).
- A client cannot mint a heard-share capture: `record_heard_or_refuse` requires
  the target id to be in `sharedLogins` (capture_proofs.rb:502), which is
  server-recorded and not in any sync-merge section.

Migration is idempotent: `migrate_legacy_captures!` always deletes the
`se_captures` global at the end (capture_proofs.rb:230, :254), and
`legacy_captures?` is false afterwards, so a second bootstrap is a no-op (live
case E in the build log confirms this on a real base-era save). The P2 network
inventory delta and the P1 saved-card paths (new in the full diff, outside the 6a
/ 6b review scope) are sound: `item_for_answer` strips `saved_cards` and runs the
client filter on every item an answer carries (game.rb:187), and the saved-card
`rfid_data` the client supplies is display only - access is validated against
`serverClones`/`held_rfid_cards` (game.rb:2410), which no client field writes.

The delta client (`state-sync.js`) closes the jsonb-key-reorder resend loop with
`stableJson` seeding, and a confirmed key is deleted only when this page held it
(games_controller/state-sync `_held`), so nothing the server holds but the page
never showed is dropped. No resend loop found.

The three points below are hot-path efficiency and bad-input hygiene, none with a
security or correctness consequence in the labs as authored.

## Minor

### m1. The capture step re-sanitises the whole incoming mail on every non-stale sync, even when nothing waits on it

File: `app/controllers/break_escape/games_controller.rb:865-871`
(`apply_capture_sync_step`).

`extra_sent = stale ? [] : @game.incoming_sent_messages(mail_incoming)` runs on
every non-stale sync that reaches the step, which is every non-stale sync. But
`extra_sent` is used only (a) inside `if !stale && !@phish_fp_before.nil?` for
`needs_stamp`, and (b) in the `stamp_proven_captures!` call reached only when the
method does not early-return. On the common sync - no unproven captures
(`@phish_fp_before` nil) and no incoming captures - `extra_sent` is computed and
then discarded by the `return` on line 871. `incoming_sent_messages` calls
`mail_state_updates(mail_incoming)` (game.rb:84), which re-parses and re-sanitises
the entire incoming mail body - the same walk `merge_mail_state!` already ran once
this request. On a mail-heavy SE mission that doubles the per-sync mail
sanitisation cost on the hottest route for no result.

Failure scenario: a player in `lab_social_engineering` with a full mailbox and no
unproven capture syncs every few seconds; each sync parses the mail section twice
(once in `merge_mail_state!`, once in the discarded `extra_sent`). Functionally
correct, wasted CPU inside the sync_state row lock.

Fix: compute `extra_sent` lazily, only when it can be used, e.g.
`extra_sent = (!stale && (incoming.any? || !@phish_fp_before.nil?)) ? @game.incoming_sent_messages(mail_incoming) : []`,
so the no-capture, no-unproven sync skips the second parse.

## Nits

### n1. `remove_saved_card!` always saves and returns true, even on a no-op

File: `app/models/break_escape/game.rb:3878-3887`.

`remove_saved_card!` unconditionally calls `save!` and returns `true`. When no
cloner is held and the `card_id` names no `serverClones` record (a bogus id),
nothing changes but the row is still written. `POST /inventory`
`remove_saved_card` is reachable by any client, so repeated calls with junk ids
force an unconditional `player_state` write each time. Blast radius is one game's
own row, so no cross-game effect, but it is an unbounded write on bad input.

Failure scenario: a tampered client loops `POST /inventory
{action:'remove_saved_card', card_id:'x'}`; each call writes the row though
nothing in it changed.

Fix: track whether the list changed or the `listed` mark was set, and `save!` /
return `true` only then; otherwise return without a write.

### n2. The pre-merge phish fingerprint walks the whole mailbox on every sync while any entry is unproven, including a part-3-only unproven entry

Files: `app/controllers/break_escape/games_controller.rb:810`
(`@phish_fp_before = ... phish_evidence_fingerprint`),
`app/models/break_escape/capture_proofs.rb:326-352`
(`phish_evidence_fingerprint` -> `each_stored_sent_message`).

The 6b review m1 fix computes `@phish_fp_before` whenever `unproven_captures?`,
and the fingerprint walks every mailbox and message. An entry that is unproven
only because of a part 3 proof (a `captureProof` not yet held) can never be
advanced by a sync_state request (part 3 proofs arrive through other routes), yet
it keeps `unproven_captures?` true for the game's life, so every non-stale sync
pays the mailbox walk (and, with m1 above, a second walk in `extra_sent`) to
produce a fingerprint that part 3 can never move. The reader re-checks evidence
live at `GET /capture_secrets`, so the secret is still served the instant the
proof holds - this is cost, not withholding. Mail is trim-bounded, so it stays
finite. Same class as 6b n2.

Failure scenario: a scenario with a `captureProof`-gated credential; once the
capture is recorded and before the proof holds, every sync walks the full
mailbox for a fingerprint that will not change until the proof (not a sync) lands.

Fix: remember on the unproven entry which page id / proof it waits on, and
compute the fingerprint (and set `@phish_fp_before`) only when some unproven entry
is actually phish-gated; a part-3-only unproven set needs no fingerprint. At
minimum, note the cost at the `@phish_fp_before` site.

## Prior-review findings: closure check

All closed as the build log claims.

- 6a M1 (note channel unguarded): `scripts/validate_capture_log.rb` now errors on
  an authored `note`/`roleLabel`/`address`/`host` carrying a hard-access value;
  the runtime composed note is clipped to `MAX_CAPTURE_NOTE_CHARS`
  (capture_model.rb:487).
- 6a M2 (`default_account_address!`): now scoped to a self-capture
  (`owner_id_of(owner) == targetId`, capture_model.rb:373), with the validator
  erroring on a cross-target no-address writer.
- 6a N1 (two scenario sources): both paths read `stored_scenario_data`
  (game.rb:781), with the loaded-attribute fast path.
- 6a N2 (double-answer): the over-cap refusal skips an id already answered
  (games_controller.rb, `incoming.drop(...)` loop).
- 6a N3 (unbounded composed note): clipped (capture_model.rb:487).
- 6a N4 (hardcoded `se_captures` in the validator): `SERVER_OWNED_GLOBAL_NAMES`
  (game.rb:1732) plus `carry_over_server_owned_globals_test` asserting the two
  lists agree.
- 6b M1 (forged phish serves a hard-access secret): accepted as advisory per the
  orchestrator ruling; backlog entry logged (docs/IDEAS_BACKLOG.md).
- 6b m1 (unprovable entry forces the load): `phish_evidence_fingerprint` gates the
  scenario load; see n2 above for the residual walk cost.
- 6b n1 (part 3 stricter than main): kept deliberately, logged at the code site
  and in the build log.
- 6b n2 (mailbox rescan): `each_stored_sent_message` memoised per request against
  the mailboxes identity (capture_proofs.rb:452).

## Tests run (affected files, no lock, per the 2026-11-12 test-lock rule)

All green.

- Rails: `capture_record_test`, `captures_sync_test`, `clone_card_saved_cards_test`,
  `network_inventory_delta_test`, `saved_current_room_test` (42 runs, 148
  assertions, 0 failures); `capture_proofs_test`, `sanitiser_cases_test`,
  `item_for_answer_test`, `sync_payload_size_test` (48 runs, 253 assertions, 0
  failures); `carry_over_server_owned_globals_test`, `capture_record_test`,
  `item_for_answer_test` (22 runs, 73 assertions, 0 failures).
- JS: `capture-client`, `sync-request-sizes`, `sanitiser-cases`, `cp-helpers`
  (28 pass); `state-sync`, `sync-delta-proof`, `inventory-tray`,
  `social-state-sync-confirmed`, `network-links`, `phone-reopen-and-persistence`,
  `validator-capture-log`, `capture-log`, `rfid-clone-card`, `social-captures`
  (206 pass, 0 fail).

The capture and delta tests are genuine guards (they assert the server overwrites
client-sent address/kind, withholds unproven credentials, strips `se_captures`
from globals, and sends only changed sections after a reload), so a regression in
the recording or gating path would fail them. I did not revert the fixes to
re-prove each test red; the assertions target the exact behaviour the fixes add.

JS harness copy lists: `capture-client.js`'s only new static imports are
`captures.js` and `global-writer.js`, both already copied by
`capture-client.test.mjs`'s harness; the other changed modules add no new static
import that a touching test harness omits. No `ERR_MODULE_NOT_FOUND` seen in the
runs above.

## No live check run

Static review and the affected suites settled every question in scope; the 6a and
6b live proofs plus the build log's live case E already exercise the server paths
on the shared dev DB. I did not start the port-3260 server.
