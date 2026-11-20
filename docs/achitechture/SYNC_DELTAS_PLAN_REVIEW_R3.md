# Player state deltas plan: review, round 3

Plan reviewed: `docs/achitechture/SYNC_DELTAS_PLAN.md` at b30801b3a. Code checked on the same commit
(`build/sync-audit`, main merged at 59f4cce57). I read the plan on its own first, then checked it
against `SYNC_DELTAS_PLAN_REVIEW_R2.md`.

Counts: 1 blocker, 0 majors, 5 minors, 8 nits.

Every R2 finding is resolved (table at the end). Nearly all of the named files, functions and lines
check out on the branch. I found no way for a tampered client to get a secret through the sync
body, the old-tab path, the migration or the bootstrap backfill that honest play could not also
reach, and the 6a to 6b move no longer withdraws anything.

The blocker is the planner's open point. The capture record drops `secret`, and Len's PIN reaches
the student today only through that field. The minors are about the export rule (it is not exact
yet), the size figures for the capture record, one live case that cannot be set up as written,
and a new way a phish secret can be withheld.

## Blocker

### B1. 6.3 `captures_for_client`, 6.5 and the 6.7 len row: Len's PIN disappears from the capture log

Today the student sees the records door PIN in the Harvested Credentials tablet. The path:

- Ruth's mapping on `player_watched_reader` carries `"secret": "4471"`
  (scenarios/lab_physical_pentest/scenario.json.erb:867).
- `withhold_npc_secrets!` strips `addCapture.secret` only for an account holder
  (game.rb:4414 to :4432, the early `return unless account` at :4422). Ruth has no `creds`, so the
  PIN ships in the bootstrap.
- `makeCaptureEntry` keeps `secret` (captures.js:55). The entry goes into `se_captures`.
- `displaySecret` uses `secretsById` first and falls back to `entry.secret` (captures.js:93 to :99).
  `buildCaptureRow` shows that value, because lab_physical_pentest has `revealSecret` on
  (scenario.json.erb:78).
- `GET /capture_secrets` never serves it. No landing page carries `l.okafor`, and Len has no
  `creds`, so neither `by_address` nor the account pass answers (game.rb:1055 to :1059). The test at
  test/models/break_escape/lab_physical_pentest_secrets_test.rb:125 to :130 pins this: the `len`
  entry with `secret` gets nothing from the route.

The game tells the student to look for it there. The ledger shelves' label and hint say "You read
the records door PIN from here. It is on the Harvested Credentials tablet."
(scenario.json.erb:1826, :1834). The closing credits list "Shoulder surfing: a door PIN read over a
colleague's shoulder" (:624), and `opt_pin` is an authored task (:345).

Under the plan:

- `capture_candidates` says "`fields` never holds a secret: the stored entry has no `secret` key",
  and `captures_for_client` "never carries ... a secret" (6.3).
- `submitCapture` writes the mirror with the client's entry, PIN included. `onAnswer` then
  "replaces each answered mirror entry with the server's", which has no secret. So the PIN shows
  for the length of one sync and then turns into the mask.
- After a reload the mirror comes from the bootstrap's `captures`. There is no PIN in it and the
  route serves none, so the row shows the mask for good.
- Old saves lose it too. `migrate_legacy_captures!` rebuilds each entry through part 1, which drops
  the stored `secret`. That breaks 6.5's "its capture log, report and secrets look the same".
- An old tab's `se_captures` entry for `len` goes through the same gate and loses the PIN the same
  way.

The 6.7 len row says "Unchanged. Nothing is served for it through the secrets route, today or
after". That is true of the route, but not of what the student sees. The walk looked at the route
and missed the `entry.secret` fallback.

Concrete failure: in lab_physical_pentest a student watches Len at the keypad from the shelves.
They get the toast and the `opt_pin` tick, then open the tablet the hint names and find
`••••••••` where today they read 4471.

Fix: serve an authored writer secret from the server. `capture_secrets_for_client` gains a third
pass. For a recorded credential whose stored candidate's `source.writer` is a mapping or action
whose `capture` hash carries a `secret`, serve that secret, under `revealSecret` and part 3 as
for any other credential. Ruth has no `captureProof`, so Len's PIN is served once recorded, as it
is shown today. This exposes nothing new: the same string already ships in the bootstrap for a
non-account owner. (Taking the PIN out of the bootstrap is a separate tidy-up that this fix makes
possible.) Correct the 6.7 len row. Add a Rails case: record the `len` capture through
`PUT /sync_state`, and `GET /capture_secrets` returns `{ "len" => "4471" }`. Add the same case for
an old save's legacy entry after the migration. Add one JS case: after `onAnswer`, the row shows
the secret from `/capture_secrets`. Also have the 6.7 walk list every writer whose `capture` hash
carries `secret`, so a scenario added later is not missed.

## Minors

### m1. 2.1 `clipMailMessage`: not an exact mirror of the server's sanitiser, and the constants test misses the literals

Checked against `sanitize_mail_message` (game.rb:3787 to :3811) and `sanitize_mail_json`
(:3896 to :3913).

What the plan says that matches: the keys picked to `MAIL_MESSAGE_KEYS` (:3580 to :3584, equal to
the client's `MAIL_MESSAGE_FIELDS`, mail-scheduler.js:43); `body`, `hiddenText` and
`hiddenTextLabel` cut to 4 000; `folder` only `inbox` or `sent`; `gameTime` only numeric; `read`
and `seeded` only boolean; `landed` boolean or null; strings cut to 1 000; at most 200 entries.

What it leaves out or gets loose:

- `sanitize_mail_json` drops every Hash key longer than 100 characters (:3905). The plan does not
  mention it.
- Depth: `return {} if depth >= MAX_MAIL_JSON_DEPTH` (and `[]` for an Array). A field value is
  depth 0, so an object nested six levels down becomes `{}`. It is not dropped and not kept. "Depth
  6" does not say which.
- `tells`: `select { |t| t.is_a?(String) && t.length <= 100 }.first(50)` drops a long tell. It does
  not cut it. "To strings of at most 100 characters" reads either way.
- `body`, `hiddenText` and `hiddenTextLabel` are dropped when they are not strings. The plan says
  only "cut".
- Ruby's `String#[0, n]` and `length` count code points, while JavaScript's `slice` and `length`
  count UTF-16 units. A body past 4 000 characters, or a nested string past 1 000, holding an emoji
  or another astral character is cut at a different place on each side.
- Float `NaN` and `Infinity` become `nil` on the server. JSON cannot carry them, so this one is
  moot. Say so, so the builder does not add a rule.

Each gap resends one message key on the first sync of every load and loses nothing. Still, 2.1
calls this a mirror and 3.7 tests it as exact.

The constants test reads `MAIL_MESSAGE_KEYS`, `MAX_MAIL_BODY_CHARS`, `MAX_MAIL_STRING`,
`MAX_MAIL_JSON_DEPTH` and `MAX_MAIL_JSON_ENTRIES` (3.7). These are literals inside the methods and
would change without failing it: the tells limits (100 and 50), the folder list, the 100-character
key limit, the three body keys, and the `read`/`seeded`/`landed` rules. Parsing `MAIL_MESSAGE_KEYS`
also means reading a `%w[ ]` that spans five lines (:3580 to :3584). The test should say it handles
that.

Fix: list every rule above in 2.1, with code points versus UTF-16 named as a known residual. Then
either lift the literals into named constants in game.rb (`MAX_MAIL_TELL_CHARS`, `MAX_MAIL_TELLS`,
`MAIL_FOLDERS`, `MAX_MAIL_JSON_KEY_CHARS`) so the source test reads them, or add a Rails test that
runs `sanitize_mail_message` over a fixture message that trips every rule and writes the result
for the node test to compare with `clipMailMessage`. The fixture route is better because it tests
behaviour, not constants.

### m2. 2.1 and 3.4: the "client exports what the server stores" rule stops at mail messages

The server also rewrites these, and the client exports each one raw:

- mail drafts: `sanitize_mail_drafts` picks `MAIL_DRAFT_KEYS` and passes each value through
  `sanitize_mail_json`, so a draft's `freeText` is cut to 1 000 characters (game.rb:3861 to :3869).
  `exportMailState` sends `out.drafts = this.state.drafts` as it is (mail-scheduler.js:169). A
  student with a long unsent free-text draft resends `drafts` on the first sync of every load.
- mail threads: `sanitize_mail_threads` keeps only `position` (at most 60 KB), `choices` (first 20)
  and `expects` (three modes, at most 10 options) (:3833 to :3860). The client sends the thread
  whole (mail-scheduler.js:168).
- mail metrics: counts are `to_i.clamp` (:3871 to :3883). This matches today, because the client
  writes integers (mail-bridge.js:274).
- phone threads: there are gaps beyond the three that 2.1 names. A message with no string `type` is
  dropped (game.rb:3518). `isBark`, `timed` and `preloaded` are kept only when boolean (:3525),
  but the client keeps any non-null value (npc-manager.js:2266). `storyState` is kept by the server
  only up to 60 KB in bytes (:3487, :3533), while the client allows 60 000 characters
  (npc-manager.js:142, :2274). Multi-byte ink text between those two limits is resent on every
  load, and its story position is already lost on reload today.

Each one costs one key per load and loses nothing (beyond the story position case, which is
already broken). But 3.4 says "no request until something changes", and 3.7 asserts `null` after
the seed, so the plan should not claim it. Fix: name these in 2.1 and in the 3.3 table. Apply the
same clip to drafts and threads in `exportMailState`, and the boolean and byte tests in
`_phoneStateEntry`, or record them as known per-load resends. Add one 3.7 case for a long draft.

### m3. 6.4 and section 8: the capture record is about three times larger than stated

6.4 says "about 150 bytes each ... lab_physical_pentest declares 19 targets (about 3 KB at most)"
and "answer part ... about 170 bytes". The stored entry carries `note`, and the authored notes are
whole sentences. I measured every capture writer in lab_physical_pentest, with `secret` and
`proof` removed and an `at` added: 19 writers, 8 443 bytes in total, the largest 894 bytes.
`MAX_CAPTURE_STRING` (500) allows up to about 1.2 KB per entry. So the record is about 8 KB in that
lab, and one sync answer is up to about 900 bytes.

It is still bounded by authoring and sent once per load, so the size rule holds. The figures are
wrong, and the size rule says every plan states them. The 10.2 assertion ("Answer under 600
bytes") passes only because its fixture is lab_social_engineering, whose notes are short. Fix:
restate 6.4 and section 8 from a measurement (the 6.7 walk script can print the sizes), and size
the 10.2 assertion from the longest note in the fixture scenario. Or add a second fixture from
lab_physical_pentest with a 900-byte bound.

### m4. 10.3 case B and 10.2: test_access_networks has no card copier

Case B asks for plant, unplug, join and implant "with a full cloner held" in test_access_networks.
That scenario has no `rfid_cloner` anywhere (`grep -c rfid_cloner` gives 0). Under the plan, no
route can fill a cloner's list past the scenario's own cloneable cards (5.3), and this scenario
has none. So the live case cannot be set up through the page. 10.2 says the 50-card list is "the
legacy case", which a Rails test can build by hand, but the live case does not say how.

Fix: in case B, say the cloner and its 50-card list are written into that game's `player_state`
by a short script before the page loads (a row update, never a `db:` task). Or run case B in a
scenario with both a cloner and a network. Say the same in 10.2: the cloner is added to the
inventory by hand.

### m5. 6.2 part 2: a mail section refused over its cap now withholds a phish secret

Part 2 needs the sent message to the target in the server's `mailState`. When `merge_mail_state!`
refuses the merged mail over a cap (`mail_state_refusal`, game.rb:3717 to :3742, reported as
`notSaved`), the rest of the request still saves, the capture included, but the new sent record
does not. Today the secret is served regardless, because `se_captures` is a global and the
globals merge saved it. Under 6b it is withheld for as long as the mail stays refused. R2 noted
this as the one remaining loss, but 6.2's list of how "an honest capture is never lost" does not
mention it.

It needs a mailbox over 200 unread or seeded messages, 50 jobs, 20 drafts or 1 MB after
trimming, so it is unlikely in the labs. Fix: say so in 6.2. Better, let part 2 also accept the
sent record from the same request's body when `mailState` was refused, by handing the step the
sanitised incoming message. A refused mail section then no longer costs the secret. Add a Rails
case.

## Nits

- **n1. 6.3 heard note.** `shared_login_body` takes the workaround that was heard (`w`, so
  `w['with']` names the colleague; npc_frustration.rb:445 to :456). `shared_login_capture` uses
  "its first `share_login` workaround's colleague". For an NPC with two `share_login` workarounds
  naming different colleagues, the heard answer's capture note changes. That contradicts "The
  answer is unchanged". Pass the workaround index when it is known (the heard route knows it) and
  use the first one only in the backfill.
- **n2. 6.3 migration and `importGlobals`.** "The server never stores that global after the
  deploy" holds for every route except carry-over imports. `resolve_imported_globals` writes any
  authored import name into the game's globals at creation (carry_over.rb:102 to :139, applied at
  :223). An import named `se_captures` would be migrated as `proven: true`. No scenario does this
  today. Have the validator refuse an import into a server-owned global, or have the migration
  skip a name listed in `importedGlobals`.
- **n3. 9 step 6a alone.** Every entry recorded while 6a alone is live is stored `proven: true`
  for good, forged ones included. That is the right trade for honest players, and under q78 it
  reveals only what honest play reaches. Say in 9 that the gap between 6a and 6b should be short,
  because it is the window in which a forged phish capture is grandfathered.
- **n4. 6.2 part 3, whose proofs.** `target_capture_proofs` takes the `captureProof` of every NPC
  that owns a credential mapping for the target. The account pass keys proofs by account
  (`proofs_for`, capture_model.rb:131 to :136, with shorthand holders resolved by address first,
  :107 to :125). They agree for every row in 6.7. In a scenario where one NPC's mapping captures
  another account, though, part 3 would apply the owner's proofs and not the account's. Reuse
  `proofs_for` on the account whose username equals the candidate's address, falling back to the
  owner, as `shorthand_proofs` already does.
- **n5. 9 build order, `clipMailMessage` and the phone export tests.** Step 1 names `stableJson`
  and `keyOf`. No step names `clipMailMessage` or the three phone export tests, and the 3.7 cases
  seeded from sanitised copies need both. Put them in step 1 or 2.
- **n6. 9 step 7, the baseline.** The live script, the fixtures and the size constant are built in
  step 7, but the baseline is "run once on the base commit before step 2". Say that the script is
  written first (step 1), or that the baseline is taken later from a second worktree at the base
  commit, as case E already does.
- **n7. 10.3 case C.** "Reload; the cards are listed and open their doors": `ceo_keycard` opens
  nothing in test-rfid (only `test_secure` has an RFID lock, needing `master_keycard`,
  scenarios/test-rfid/scenario.json.erb:69 to :71). Say that `master_keycard` opens
  `test_secure` and `ceo_keycard` is listed.
- **n8. 5.6 and 6.8, the race tests.** "The test commits a sync between the unlocked check and the
  lock" needs a hook in a single-threaded integration test. Say how (for example, stub
  `cards_need_repair?` to write and commit through a second connection before returning true).
  The 6.8 query count should count `pick(:scenario_data)` only: `currentRoom` makes a separate
  `pick` of `startRoom` (games_controller.rb:1807).

## The questions asked

### Can an honest player lose a capture or a secret?

- **6a alone.** No loss, apart from B1. Readers on the record serve every entry, as today. The
  cross-target lookup is closed. Heard shares come from the server. `invalid` is the only refusal
  an honest client could meet, and every writer in 6.7 has a candidate for its kind (the server
  reads a missing kind as `credential`, as captures.js:51 does).
- **6a to 6b.** Resolved: 6a stores `proven: true`, so un-building the page, the mail trim or a
  deleted sent message after the move withdraws nothing. The 6.8 case covers it.
- **Old saves.** Kept through the migration, heard shares included, except Len's PIN (B1).
- **Old tabs.** Kept: the interception records each entry through the gate, on stale requests too.
  An old tab's first capture after the deploy loads the new captures.js, whose exports stay.
  Len's PIN is lost here too (B1).
- **The pagehide flush.** The part rides every fallback list, and `flushKeep` keeps the evidencing
  sent records when the second list drops `mailState`. The page record is a global and is in every
  list (state-sync.js:516 to :519).
- **The reload race.** Two orders. If the old page's flush lands before the new page has synced,
  it is not stale, so the capture and its evidence are merged together and stamped. The new page
  shows the row after its next load. If the flush lands after the new page has synced, it is
  stale, so the capture is recorded but its mail and page record are not. Sending the kit to that
  target again sets the evidence, and the stamp runs because an unproven entry exists. Today the
  same race loses the capture entirely, so this is no worse. One gap is new and narrow: m5.
- **The same tick.** `performSend` builds the sent record (mail-bridge.js:403), the page record
  (:423) and the capture (:435) synchronously. capture-client is installed from main.js before any
  game code runs, so the R2 m2 loss is gone.

### Can a tampered client get a secret revealed without the evidence?

No route reveals a secret honest play could not reach.

- **The sync body.** Fields come from the scenario's candidates, and parts 2 and 3 are keyed on the
  target and on the secret being served. A capture with no host for `lord` stores the plain
  candidate but still needs `kit_qr` dropped. Parts 2 and 3 do not apply under 6a, which is today's
  rule with the cross-target hole closed (n3).
- **The old-tab path.** The same gate. The global is never stored (it is stripped before
  `merge_global_variables!`, and that method drops it too).
- **The migration.** It runs only on a pre-deploy copy. The only post-deploy writer of a Hash
  global outside the sync is a carry-over import (n2). Task `setGlobal` takes scalars only
  (game.rb:4183 to :4186), and a workaround's `setGlobal` writes `true` (npc_frustration.rb:411 to :417).
- **The bootstrap backfill.** `record_shared_logins!` reads `sharedLogins`, which only the heard
  route writes. `repair_saved_cards!` reads `serverClones`, which only `record_card_clone!` writes
  after its source checks (game.rb:2000 to :2037). The stamp reads client evidence, as the sync
  does, which is the policy's best effort.

### Len's PIN

Removing `secret` from the record changes what a student sees on the intended route. See B1.

### `clipMailMessage` and the constants test

It is close but not exact, and the test misses the literals. See m1. The rule also stops short of
drafts, threads and some phone fields. See m2.

### Feasibility

- **Build order.** Sound. P1 lands as one unit, and 6a and 6b split cleanly. Two small gaps: n5
  and n6.
- **Sizes.** The R1, P1 and P2 figures hold. The capture record's are about three times low (m3).
- **Live cases.** A runs as written. B cannot be set up as written (m4). C runs, with one wording
  fix (n7). D runs. E runs: test-rfid's `ceo_keycard` is takeable in a world room, reached with the
  guard's copied master card, and the base commit stores it through `update_saved_cards`. F runs:
  Len's `#clone_keycard:cm_records_badge` (ink/len.ink:34, :39) goes through the chat clone as
  `{ npc_id }`, Len's `rfidCard` carries `cm_records_badge` (scenario.json.erb:1417), and the comms
  card is the stated exception. `action-menu.js` is loaded by a dynamic import at game start
  (core/game.js:1893), so the old tab already holds its old copy before the restart, as F needs.

### The size rule

Holds for every change. Each request sends one entry or the changed keys, and whole collections go
down once per load. The figures to correct are in m3.

## R2 findings

| R2 | Status in this version |
|---|---|
| M1 | Resolved: 6a stores `proven: true` on every entry (6.2, 6.3, 9); the Rails case is in 6.8 |
| m1 | Resolved: part 3 keyed on the target through `target_capture_proofs` (6.2, 6.3); the no-host `lord` case is in 6.8; the 6.7 prose now matches the rows. See n4 for whose proofs count |
| m2 | Resolved: capture-client.js imported statically by main.js and installed after `new StateSync` (main.js:145); `submitCapture` is synchronous; the same-tick node case is in 6.8 |
| m3 | Resolved: the migration and `record_shared_logins!` keep heard shares from `sharedLogins`; an old tab's heard share is recorded by the server's route (6.3, 6.5) |
| m4 | Resolved: F names lab_physical_pentest, Len's chat clone and the comms card exception; C lists two cards. See n7 |
| m5 | Resolved: `world_card` dropped; 5.1 explains the id stamping (game.rb:4500, :883) |
| m6 | Resolved in part: the export rule and the sanitised-seed cases are in 2.1 and 3.7. Not exact yet (m1) and not covering drafts, threads and some phone fields (m2) |
| n1 | Resolved: the stale path is in 6.2, and the stale answer carries `captures` and `capturesRefused` (6.3) |
| n2 | Resolved: the scenario is fetched only when the request carries globals or mail; `stampable_captures?` keeps the bootstrap lock-free for a forged entry |
| n3 | Resolved: the len and test_capture_log hampshire rows rewritten. The len row is still wrong about what the student sees (B1) |
| n4 | Resolved: the first-target rule is in the lab_social_engineering rows |
| n5 | Resolved: the server reads a missing kind as `credential` |
| n6 | Resolved: `SERVER_OWNED_GLOBALS` added empty in step 2, `se_captures` added in 6a |
| n7 | Resolved: the three JS tests are listed in 6.8 |
| n8 | Resolved: the full mail-bridge path; "a data move ... no schema change" |
| n9 | Resolved: `captures_for_client` defined (unproven entries included, never `proven`) |
| n10 | Resolved: captures.js keeps its exports for old tabs |
