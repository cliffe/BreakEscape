# Player state deltas plan: review, round 4

Plan reviewed: `docs/achitechture/SYNC_DELTAS_PLAN.md` at 9259a81fd. Code checked on
`build/sync-audit` after merging `main` (39fb4cf33) at 48e44868d. I read the plan on its own
first, then checked it against `SYNC_DELTAS_PLAN_REVIEW_R3.md`.

Counts: 0 blockers, 1 major, 3 minors, 8 nits.

Every R3 finding is resolved (table at the end). The writer pass brings Len's PIN back, and I
found no other displayed secret that the change loses. `legacySecret` cannot be set by a client
after the deploy. Part 2, with the request's own sent messages, is a real check of target, page and
kit, and it is no weaker than the stored-mail check. The size rule holds.

The major is a displayed text loss of the same kind as R3's B1, one level down. The record cuts
every string to 500 characters, and an authored note in lab_physical_pentest is 693 characters
long. So the capture log and the engagement report show that finding cut off mid-sentence.

## Major

### M1. 6.3 `record_capture!` and 6.4: the 500-character cut truncates an authored note the student reads

`record_capture!` stores `{ targetId, roleLabel, address, kind, host, note, at, proven }` from the
candidate, "each string cut to 500 characters" (`MAX_CAPTURE_STRING = 500`). Part 1 takes every one
of these from the scenario, so the cut only ever applies to authored text.

lab_physical_pentest's `store_controller` mapping (scenario.json.erb:790, `kp_controller_found`,
task `opt_controller`) carries a note of 693 characters. It ends "...The control: keep the
controller in a secured comms room, change the default service login, log every change, and
restrict who can program the records-door zone." Cut at 500, it stops at "the control protecting
the records door is itself within reach; nothing w". The next longest are 451, 445 and 419
characters, all of which fit.

Today the note is never cut. `makeCaptureEntry` keeps it whole (captures.js:57), the state-sync
guard only picks keys, and `merge_global_variables!` stores the global as sent. The note is shown
in the capture log row (capture-rows.js:42, :49) and in the engagement report (report-model.js:212).

Concrete failure: a student finds the door-entry controller, opens the Harvested Credentials
tablet or the report, and reads a finding that breaks off mid-word, with the recommended control
missing. This happens on a new game. It also happens to an old save, because the migration rebuilds
each entry through part 1, and to an old tab's entry, through the interception. 6.5's "its capture
log, report and secrets look the same" does not hold for this row.

The 6.4 measurement had the data ("largest client entry 894 bytes") but did not compare the note
with the cap.

Fix: authored fields are bounded by authoring, so do not cut them at serve time. Either raise
`MAX_CAPTURE_STRING` to a value no authored field reaches (2 000 is ample) and have the validator
report an authored capture string over that cap as an error, or drop the cut for fields taken from
a candidate and keep a cap only on `targetId`. Restate the 6.4 bound from the new cap (about
2.3 KB per entry at most; lab_physical_pentest's record unchanged at about 8.4 KB sent). Add a
Rails case: record `store_controller` through `PUT /sync_state`, and the bootstrap's `captures`
carries the full note. The 6.7 walk script should also print each authored capture string over
the cap.

## Minors

### m1. 6.3 `candidate_secret` and 6.7: account holders' `usePayload` does carry a secret in the stored scenario, and the test does not cover it

6.7 says "No `usePayload` in any scenario carries a `secret`". That is true of the authored files,
but not of the stored `scenario_data` the server reads. At game creation `normalise_access_model!`
runs `normalise_npc_access!` (game.rb:4532 to :4551), which sets `payload['secret'] =
creds['password']` on the `usePayload` of every account holder. In lab_physical_pentest that puts
the `lord` NPC's password on its `usePayload` (scenario.json.erb:1375 authored, injected at
creation). test_capture_log's `sofia` payload gets the same treatment if that NPC holds an account.

`candidate_secret` reads "the overlaid `usePayload`'s `secret` where it has one", so for
`lord`'s overlaid candidate (the `dev_qr` mapping, :1429) it would find the password. The plan's
guard ("only when neither the owner NPC nor the payload owner is an account holder") stops it, so
the design is right. The guard is not belt and braces, though: it is the only thing between a
forged capture and the password. Under step 6a every entry is revealable, so the account pass's
proof filter is the only gate today, and the writer pass runs after it. A builder who reads 6.7
and leaves the payload-owner check out would serve `lord`'s password with no `kit_qr` dropped.

The 6.8 case covers "a fixture writer with a `secret` on an account holder's mapping", not the
injected payload.

Fix: correct the 6.7 sentence (authored files carry none; the loader injects the password into
each account holder's `usePayload`, which is why the guard checks the payload owner). Add a Rails
case on the real scenario: in lab_physical_pentest, record `lord` through `PUT /sync_state` with
the overlaid candidate's host, with no drop recorded, under 6a rules. `GET /capture_secrets` must
not answer for `lord`. The 6.7 walk script should read the stored scenario after
`normalise_access_model!`, not the raw render, so it lists these.

### m2. 2.1: three gaps left in the "exact mirror"

Checked rule by rule against `sanitize_mail_message`, `sanitize_mail_json`,
`sanitize_mail_threads`, `sanitize_mail_drafts`, `mail_state_updates` and
`sanitize_phone_state_entry` (game.rb:3833 to :3959, :3723 to :3757, :3561 to :3604). Most of the
rules match, code points included. These do not:

- **Thread `choices` depth.** Ruby runs `sanitize_mail_json(thread['choices'].first(20))`
  (game.rb:3891): the array is depth 0 and each choice is depth 1. The plan says "its first 20
  elements through `clipMailJson(..., 0)`", which reads as each element at depth 0. Built that way,
  a choice nested six levels down is emptied one level later on the client than on the server.
- **The message `id` comes from the key.** `mail_state_updates` stores
  `sanitize_mail_message(value.merge('id' => msg_id))`, with `msg_id` the key's segment after the
  box id (game.rb:3723 to :3734). The plan checks `mail_id?` on the message's own `id`. A
  non-string `m.id` (a number) is then skipped by the client, while today the server stores it
  under the string key. Any message whose `id` differs from its key would differ from the seed on
  every load.
- **Literals outside the checked methods.** `mail_state_updates` has its own `thread_key.present?
  && thread_key.length <= 200` (:3739), and `mail_box_id?` has `present?` and a bare `100`
  (:3936 to :3938). The constants test only scans the five `sanitize_*` methods. The plan's
  `MAX_MAIL_THREAD_KEY_CHARS` and `MAX_MAIL_BOX_ID_CHARS` would replace one of each pair and leave
  the other. The blank-key rules (`present?` on box ids and thread keys) are not in 2.1.

Smaller: the phone knots (`currentKnot`, `lastEnteredKnot`, `preloadedKnot`) and `storyPath` are
kept only when strings (game.rb:3581, :3583 to :3585); 2.1 gives only the length. A thread `position` that
is an array is dropped by the server (String or Hash only), and `typeof` alone will not exclude it
on the client.

Each gap resends one key per load and loses nothing. But the plan calls the clips exact and
asserts `null` after the seed. Fix: write the `choices` rule as
`clipMailJson(choices.slice(0, 20), 0)`. Have `clipMailMessage` take the message id from the key
and set `id` to it, as the merge does. Add `mail_state_updates`, `mail_id?` and `mail_box_id?` to
the literal scan. Put a deep choice, a numeric `id`, a blank thread key, a non-string knot and an
array `position` in the shared fixture.

### m3. 10.3 case B and 9 step 1: the seeding script needs guards, and it is built too late for the baseline

The script itself is safe in kind. `bin/rails runner` with one `update_column(:player_state, ...)`
on one row by id runs no migration and touches no schema. It writes one column of one row and
skips callbacks. Three gaps remain:

- **The wrong row.** Worktrees share the development database (memory: a `db:` task once wiped
  every game), and that database holds the user's own games and other agents' playtests. Every
  local playtest uses the same demo player (new-game.rb header). A mistyped or stale id
  silently adds a fake 50-card cloner to someone else's game. The plan gives no guard.
- **The race.** `update_column` writes the whole `player_state` from a copy read without a lock.
  The plan runs it "before the page loads", which is safe, but nothing enforces it. A tab already
  open on that game would have its next sync overwritten, or would overwrite the seed.
- **The order.** The baseline is taken "straight after step 1", and "the baseline run seeds the
  same cloner", but step 1 lists only `sync-delta-proof.mjs`. The seeding script is not built
  until the live proof.

Fix: make it a head-start option of `tools/playtest/new-game.rb` (`--seed-full-cloner`), which
already "edit[s] this one game row" before `save!`. There is then no second write, no race and no id
to mistype. If it stays a separate script, have it refuse unless the game's scenario is
test_access_networks, its inventory holds no `rfid_cloner` yet, and `Rails.env` is development
or test; run the write inside `game.with_lock`; and print the game id and scenario it touched.
Either way, list it in step 1.

## Nits

- **n1. Line drift after the merge.** The merge brought 60 lines into game.rb, 68 into
  npc_frustration.rb, 62 into lab_physical_pentest and 65 into access_leak_scanner.rb. Every plan
  reference above game.rb:2661 still holds. Every game.rb reference past it has moved:
  - game.rb, +46: 3147/3148 to 3193/3194, 3155 to 3201, 3434 to 3480, 3486 to 3533, 3488 to
    3534, 3515 to 3558 to 3561 to 3604, 3566 to 3612, 3580 to 3584 to 3626 to 3630, 3717 to 3742
    to 3763 to 3788, 3754 to 3800, 3787 to 3811 to 3833 to 3857, 3833 to 3860 to 3879 to 3905,
    3861 to 3869 to 3907 to 3915, 3871 to 3883 to 3917 to 3929, 3886 to 3932, 3896 to 3913 to 3942
    to 3959;
  - game.rb, +58: 4414 to 4432 to 4472 to 4490 (`return unless account` now :4480), 4500 to 4558;
  - npc_frustration.rb: `shared_login_body` 443 to 456 is now 453 to 466 (201 to 210 unchanged);
  - lab_physical_pentest scenario.json.erb: 345 to 358, 624 to 649, 867 to 906, 932 to 971,
    1237 to 1276, 1244 to 1283, 1273 to 1312, 1276 to 1315, 1317 to 1356, 1390 to 1429, 1417 to
    1456, 1525 to 1564, 1542 to 1581, 1555 to 1594, 1673 to 1712, 1689 to 1728, 1826 to 1865, 1834
    to 1874, 2368 to 2410 (78 unchanged);
  - access_leak_scanner.rb:624 is now :677;
  - the 6.7 writer path for Len is now `/rooms/briefing_room/npcs[1]/eventMappings[27]/addCapture`,
    not `[25]`. Two new mappings for `len_keying` sit before it in Ruth's list. The builder's
    walk rerun catches this, but a test fixture that hard-codes `[25]` would not.
  Fix: restate them, or name functions rather than lines where a hunk moves often.
- **n2. 6.3 `writer` is positional.** The path only means something against the game's own
  stored `scenario_data`. That copy is fixed at creation; the key-id rake task rewrites it in
  place without moving array positions. Say so in 6.3, and say that `candidate_secret` must never
  resolve a stored `writer` against a fresh render of the scenario file (n1 shows the index moves
  between commits).
- **n3. 10.3 cases D, E and F: Len's PIN window is now 2.5 seconds.** Since the merge the
  `player_watched_reader` mapping also needs `len_keying` (scenario.json.erb:890, :906), true only
  while Len keys at the reader (`useMs: 2500`, :1467). The proof script must wait for that global
  before the shelves click, or it records a missing PIN that is a timing miss, not a bug.
- **n4. 6.2 part 2 could match the honest flow more closely, at no cost.** On the honest route the
  sent record carries `landed: true` (buildRecord, mail-bridge.js:680) and the page record's
  `victim.submitted` is true (`describeVictimOutcome`, landing-page-model.js:701), because
  `captureGranted` needs both. Part 2 checks neither, so a real send that failed to land plus a
  one-id forged capture passes. Under q78 that only saves time (a better resend would land), so it
  is allowed, but requiring both keeps the sanity check equal to the honest evidence. Build
  `extra_sent` through `mail_state_updates`, not bare `sanitize_mail_message`, so it gets the
  same box id, message id and `id` rules as the merge.
- **n5. 2.1 ink variables are not quite "the same test".** `merge_npc_ink_variables!` also drops
  NPC ids and variable names over 100 characters (game.rb:3478, :3481).
  `exportNpcInkVariables` (npc-conversation-state.js:221 to :236) does not. No scenario has such a
  name, so this is one key per load in theory. Mirror it or say why not.
- **n6. 2.1 `cpLength(s)` has no `n`.** The text says it returns `s.length` "when
  `s.length <= n`". Give the signature, or say that `cpLength` is only ever compared against a
  limit.
- **n7. 3.7 constants test: existing client names differ.** "The client mirrors each under the
  same name" fits the new constants. The test also compares `MAIL_MESSAGE_KEYS` with
  `MAIL_MESSAGE_FIELDS` (mail-scheduler.js:43), `PHONE_MESSAGE_KEYS` with `PHONE_MESSAGE_FIELDS`
  (npc-manager.js:145) and the phone limits with `PHONE_HISTORY_MAX_MESSAGES` and
  `PHONE_MESSAGE_MAX_CHARS`. Say whether those are renamed or mapped in the test.
- **n8. 6.3 sync step: the refusal branch.** A sync whose `currentRoom` is refused raises
  `ActiveRecord::Rollback` (games_controller.rb:787 to :788) and answers 403 before the capture
  step runs. The capture stays pending and is resent, which is right, but 2.2 says `onAnswer` runs
  only on a 2xx. Say that a refused sync leaves captures pending.

## The questions asked

### B1, the writer pass

Resolved. I checked every scenario myself. Capture writers exist only in lab_physical_pentest,
test_capture_log, test_clone_left_card and test_interaction_warning. Only one authored `capture`
hash carries a `secret`: Ruth's `len` mapping (now :906, still `"4471"`). No authored `usePayload`
carries one. Account holders' payloads are given the password at creation (m1), and the guard
covers them. The other secrets a student sees come from routes the server keeps serving: the
landing page pass (lab_social_engineering), the account pass, and the heard share's note, which
the record stores.

Readers of a displayed secret: only `capture-rows.js` calls `displaySecret`, used by the capture
log tablet and the landing-page builder's captures view. Both fetch `/capture_secrets` on open,
and `loadCaptureSecrets` asks even when `syncConfirmed()` answers false. The report, the password
minigame and the remote sign-in read no `entry.secret`. So after the answer replaces the mirror,
Len's PIN comes back from the writer pass on every path (new game, reload, old save through the
migration, old tab after a reload).

Does the pass serve anything a student could not see today? No. It serves only a secret authored
on the writer the stored entry names, under `revealSecret`, and only where no account holder owns
the writer or its payload. Every such secret already ships in the bootstrap today
(`withhold_npc_secrets!` strips only account holders' mapping and payload secrets, game.rb:4472
to :4490). A tampered client could claim `len` without watching and get the PIN. The PIN is in the
bootstrap already, and the plan's open point on writer secrets says so.

`legacySecret` forging: no client can set it after the deploy. The migration reads only a stored
`globalVariables.se_captures`. After the deploy that key is stripped from the sync body before
`merge_global_variables!`, and that method drops it too. Carry-over imports are refused by name.
Every other server writer of globals writes an authored name with a scalar: task `setGlobal`
(game.rb:4210 to :4234), workaround and USB-habit globals (`true`, npc_frustration.rb:411 to
:427), wearables and the disguise global. A non-Hash value is deleted with nothing moved. The flag
also needs the saved string to equal the authored secret, so even a pre-deploy forgery gains only
a value its author already knew.

### The export clips

Close to exact. What matches: the key pick, the body keys dropped when not strings, folder, number
and boolean rules, `landed` with `null`, tells dropped and not cut, the depth rule on a field (a
field's value is depth 0, `{}` and `[]` kept empty), the 200 entries taken before long keys are
dropped, and drafts. The phone fields match too: no string `type` drops the message, and a long
`type` drops the key only. So do the boolean flags, the byte cap on `storyState`, `deferredTags`
sent only when one remains, the `deferredGlobalsBase` rules, the nil entry, and the history order
(last 150, then filter, on both sides). Code points are handled by `cpSlice`, and bytes by
`TextEncoder`. What does not match is in m2.

The constants test plus the shared fixture is a good drift guard. A changed Ruby rule fails the
Rails fixture test, and a changed fixture then fails the node test. The literal scan needs a wider
scope (m2).

### m5, `extra_sent`

Yes, a client can forge a sent message in the same request. It could forge one just as easily in
the stored mail through any ordinary sync, because mail is client-synced. So `extra_sent` adds no
new route. The check stays real within the policy: the server ties the target to a scenario page
through a link kit the scenario names, and needs a built page record that meets the threshold. A
forger has to write a consistent page record and a consistent sent mail. It is no longer enough to
name a target id. The phish verdict stays a client-flow step, as the policy allows, and the
intended route is never blocked: the honest send writes all three in one body, and a refused mail
section no longer withholds the secret. n4 is a free tightening. Stale requests correctly get no
`extra_sent`.

### Case B's seeding script

It cannot touch the schema, and it touches no other game unless it is given the wrong id. It has
no guard against a wrong id and no lock (m3). Moving it into `new-game.rb` closes both.

### Readiness

Not Final as written, because of M1. The fix is small and needs no redesign: change one cap and
add one validator check and one test. With M1 fixed, the three minors are wording and test
additions a builder can take in step 1 and step 6. I would mark the plan Final once M1 is fixed
and m1 to m3 are folded in. A short confirmation round is enough; it does not need a full review.

## R3 findings

| R3 | Status in this version |
|---|---|
| B1 | Resolved: the writer pass in `capture_secrets_for_client` (6.3), `candidate_secret` with the account-holder guard, the 6.7 len row corrected, Rails and JS cases in 6.8, and the walk lists every writer secret. See m1 (the injected payload secret) and n1 (the path index moved) |
| m1 | Resolved: every message rule listed in 2.1, code points by `cpSlice`, limits lifted into named constants, the shared fixture with Rails and node tests, the multi-line `%w[ ]` parse. Residual gaps in m2 |
| m2 | Resolved: `clipMailThread`, `clipMailDrafts` and the phone field rules added; metrics pinned; 3.3 table and 3.7 cases updated. Residual gaps in m2 |
| m3 | Resolved: 6.4 and section 8 restated from a measurement; second 10.2 fixture from lab_physical_pentest. The measurement exposes M1 |
| m4 | Resolved: case B seeds the cloner by script, 10.2 writes it by hand. See m3 |
| m5 | Resolved: part 2 accepts the request's own sanitised sent messages on a non-stale request; Rails case for the refused mail section and the stale variant |
| n1 | Resolved: `shared_login_capture` takes the heard workaround; first one only for the backfill and migration |
| n2 | Resolved: carry-over imports of `se_captures` refused, with a validator error |
| n3 | Resolved: step 6a says the gap to 6b should be short and why |
| n4 | Resolved: part 3 keyed on the captured account through `proofs_for`, owner as the fallback |
| n5 | Resolved: the clips and phone export tests are in step 1 |
| n6 | Resolved: the proof script is built in step 1 and the baseline is taken from a second worktree at the base commit. The seeding script is not in step 1 (m3) |
| n7 | Resolved: case C says `master_keycard` opens `test_secure` and `ceo_keycard` is listed |
| n8 | Resolved: the stub hook in `cards_need_repair?` with `update_all`, and the query count limited to the whole `scenario_data` pick |
