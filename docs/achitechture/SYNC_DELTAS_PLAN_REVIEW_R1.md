# Player state deltas plan: review, round 1

Plan reviewed: `docs/achitechture/SYNC_DELTAS_PLAN.md` at 5b53322d7. Code checked: the same commit
(its code equals 66996634d). Hacktivity checked read-only at `../../Hacktivity` (branch main).

Counts: 2 blockers, 3 majors, 10 minors, 6 nits.

The plan's shape is right. Moving cards and captures to one-entry requests, answering with deltas and
seeding `confirmed` all follow the sync size rule, and most named files, functions and lines check out.
The two blockers are both in the compatibility paths (an old tab, a first load after deploy), which is
where the test plan is thinnest.

## Blockers

### B1. R2 (6.3, 6.5): the sync interception cannot read `scenario_data`

`sync_state` loads the row with `Game.lock.select(*SYNC_STATE_COLUMNS)` (games_controller.rb:783), and
`SYNC_STATE_COLUMNS` is `%i[id player_type player_id player_state updated_at]` (:1759). The plan has
`merge_global_variables!` (game.rb:291, called at games_controller.rb:1801) send each incoming
`se_captures` entry through `record_capture!`, which checks `declared_capture_target_ids`, which reads
`CaptureModel.declared_target_ids(scenario_data)` (capture_proofs.rb:117). On that narrow load,
reading `scenario_data` raises `ActiveModel::MissingAttributeError`.

Concrete failure: a tab open across the deploy lands a new capture. Its keyed diff sends `se_captures`,
the request 500s, nothing is marked confirmed, and every later sync from that tab carries the same key
and fails too. The pagehide flush fails the same way. Everything that tab changed after the capture
(globals, notes, mail, ink variables) is lost when it closes. This breaks the "old tab keeps working"
requirement in 6.5.

Fix: in the interception, fetch the scenario only when `se_captures` is present, as
`biometricSamples` already does (`Game.where(id: @game.id).pick(:scenario_data)`, :1885). Pass it to
the gate instead of reading the attribute, and do not `save!` inside the merge (sync saves once at
:798). The test in 6.7 ("a sync carrying `se_captures` records through the gate") must drive
`PUT /sync_state`, not the model method, or it will pass on a full load and miss this.

### B2. P1 (5.2) and R2 (6.3, 6.5): writes from unlocked reads overwrite concurrent syncs

`GET /scenario` is not in the `with_game_lock` list (games_controller.rb:93), nor is
`GET /capture_secrets`. The plan adds three writes to those paths:

- `repair_saved_cards!` from the bootstrap ("beside `end_claimed_sessions!`");
- the `se_captures` migration inside `se_captures_record`, triggered by the bootstrap's
  `filtered['captures']`;
- the same migration from `capture_secrets_for_client` and `account_capture_usernames`, which the plan
  switches to `se_captures_record` (6.3), so `GET /capture_secrets` can write too.

`save!` writes the whole `player_state` jsonb column. A save from an in-memory copy loaded before a
concurrent `PUT /sync_state` commits replaces that sync's writes. The reload sequence the plan
itself lists in 3.3 (old page's pagehide flush landing during the new page's `GET /scenario`) is
exactly this race, and the bootstrap is slow enough that the flush often commits in between. Result: the
first load after deploy of any game with captures can drop the old page's last globals
(`briefing_played` and similar re-entry guards), notes and mail.

`end_claimed_sessions!` already shows the pattern (game.rb:1791 to :1804): `with_lock`, which
reloads, then decide, then save. Fix: the plan says both new bootstrap writes run in `with_lock` with
their check repeated after the reload. It also says `se_captures_record` never writes: readers merge the
legacy global read-only, and only the locked bootstrap step (or `POST /captures`) migrates. Order the
bootstrap writes before the `saved*` blocks are read into `filtered`, or the client sees the pre-repair
inventory and the pre-migration global.

## Majors

### M1. R1 (3.1, 3.5): the phone seed is broken by the jsonb reorder the plan fixes elsewhere

The plan cites phone threads as the model ("already avoid this") and keeps their seed unchanged (3.5).
`restorePhoneState` seeds `_phoneStateSent` with `JSON.stringify(entry)` of the bootstrap entry
(npc-manager.js:2320). `exportPhoneState({ onlyChanged: true })` compares that against
`JSON.stringify` of the client-built entry (:2241). jsonb sorts keys by length then bytes, so the
saved entry comes back as `{history, storyPath, storyState, currentKnot, ...}` while the client builds
`{history, storyState, storyPath, ...}`, and the message objects inside `history` reorder too. The
strings never match. Today every phone thread with history is resent on the first sync after each load,
up to the 512 KB phone cap. That covers m01 to m10, since every mission has phone contacts.

R1's stated outcome (first sync sends only what changed, "often nothing") and live proof case A on
m01 will both fail on `phoneState`. Fix: move `stableJson` to a small shared module, or export it from
state-sync.js and pass it in as `mailKeys` is. Use it on both sides in npc-manager.js
(`restorePhoneState`, `markPhoneStateSynced`, `exportPhoneState`). Add a node case in which a reordered
saved thread is not resent.

### M2. R2 (6.2, 6.6): the server gate is no stronger than today's, and the secret is looked up by a client string

The plan gives the forgery in 6.1 as its reason for a server-owned record ("puts the check in one
place"). Its gate only checks that the target is declared and that the shape is closed, which is the
same check `capture_secrets_for_client` makes today (game.rb:1052). So the bypass moves from one route
to another without getting harder:

- Today: `PUT /games/:id/sync_state` with
  `globalVariables.se_captures = { <declared target>: { kind: "credential", address: ... } }`
  (games_controller.rb:1801 to game.rb:291 to :311 stores it). Then `GET /games/:id/capture_secrets`
  (games_controller.rb:1347 to :1356) serves the secret through game.rb:1052 to :1057.
- After the plan: `POST /games/:id/captures` with the same entry, or the same sync, through the
  interception.

There is a second gap inside it. The secret is chosen by the entry's client-written `address`:
`by_address[address]` (game.rb:1055) and `by_username[normalise_username(address)]` (:1056). The
remote sign-in list has the same reader (network_access.rb:1131 to :1133). So one capture for target A,
earned or not, can name another page's capture address or another account's username and be served
that secret. Capture proofs limit this for accounts whose password opens something, but only in a
scenario that declares proofs (capture_proofs.rb:101 to :114). Landing-page secrets are not covered.
Today only lab_social_engineering, lab_physical_pentest and test_capture_log set `revealSecret`, and
lab_social_engineering has one landing-page secret, so the single-secret fallback (:1057) already
answers any phish target there.

Recommendation: see "R2 recommendation" below. As written, the plan should either add those checks or
drop the claim in 6.2 that the record removes the forgery.

### M3. Test plan (9.1, 9.2): no real-path proof of the compatibility cases, and request sizes measured in the wrong place

Both blockers sit in paths the listed tests do not drive for real: the old tab's sync carrying
`se_captures`, and the first load of an old save while a flush lands. 9.2 covers only new-client flows.

- Add live case E, an old save. Play lab_social_engineering and test-rfid on the base commit until
  there is a capture, a cloned card (one by the action menu, unrecorded today) and a seen capture-log
  row. Then restart the keyless server on the branch with the same database and reload. Check: the
  capture log, the report and the secret look the same; the cards are listed and open their doors;
  no badge comes back; `player_state` has no `globalVariables.se_captures` and has `seCaptures`.
- Add live case F, an old tab. Open a tab on the base commit's server, restart the server on the
  branch without reloading (the import map's `?v=` stays the old version in that tab), then land a
  capture, copy a card and plant a device. Check every `PUT /sync_state` answers 200 and the tray
  matches the server.
- 9.1 asserts "on the request body size" in Rails integration tests, but there the test builds the
  body, so it measures the test and not the client. Request sizes belong in the node tests of the body
  builders (`savedCardForServer`, `submitCapture`, `buildChanges`) and in 9.2's captured requests.
  Rails should assert answer sizes only.

## Minors

### m1. R1 (3.2, 3.4, 3.7): the first sync is not empty

`currentRoom` is unseeded (3.2), so the first `buildChanges()` always sends it
(state-sync.js:301). `somethingElse` is then true, so the whole `scenarioClock`, `timedMessages` and
mail `jobs` ride along (:333 to :354). 3.4 ("no request until something changes"), the 3.7 case
"`buildChanges()` returns null" and 9.2 case A ("none") will not hold. Either seed `currentRoom` from
the room the restore places the player in, or state the expected first request (a few hundred bytes)
and test for that.

### m2. R1 (3.2): seed `_held` for globals

All saved globals are applied by `Object.assign` (game.js:1704), so the seeded global keys could start
in `_held.globalVariables`. Then a global deleted before the first sync, such as the SIEM minigame's state
key, is still sent as `null`. Today and in the plan it is never deleted on the server and comes back
on reload. This is not a regression, but it is a cheap fix while the code is open.

### m3. P1 (5.2): `remove_saved_card!` is undone by `repair_saved_cards!`

Removing a card leaves its `serverClones` record, so the next bootstrap's repair adds it back. Either
the remove also marks the record "not shown", or the repair skips ids the player removed. Otherwise
the planned "cloner full" flow (5.2) cannot shrink the list across a reload.

### m4. P1 (5.2): the action-menu source

The action-menu path is for a world keycard (`!isInventoryItem(sprite)`, action-menu.js:63), so the
proposed fallback `{ held_card: true }` is wrong. The server refuses it ("Keycard not held",
game.rb:2004). Send `object_id` only, and no source when the world card has no id. This change is also
what keeps lab_physical_pentest's intended "clone, don't pocket" route working across a reload. Melanie's
comms card (`pierce_comms_card`, card_id `lw_comms_card`, scenario.json.erb:1672) is cloned from the
action menu. Today that copy is never recorded and persists only through `update_saved_cards`. The
action-menu fix must land in the same commit that removes `persistSavedCards`, not after it as step 4
orders them.

### m5. P1 (5.3, 9.1): sizes and bounds

- A fully cracked MIFARE Classic card holds 16 sectors of `{keyA, keyB}` (rfid-attacks.js:45, :117),
  about 750 bytes of `rfid_data` alone. With the body wrapper, the request is near or over the
  1 000-byte bound in 9.1, not "250 to 600". Measure m03's or m08's card and set the bound from it.
- Under P1 only a card whose `card_id` is a `serverClones` key is stored, so the list is bounded by the
  scenario's cloneable cards, not 50. Say so in 5.3: it is the better bound. The 9.1 cases "a cloner
  with 50 cards" and "50 copies of 50 cards" cannot be reached through the real routes in test-rfid.
  They need a synthetic scenario with 50 cards, or should be stated as the legacy bootstrap case only.

### m6. P2 (4.3): build `removed` from what the server no longer holds

For a plant, "the ids of every inventory entry the plant rejected" can miss entries with no `id`
(`ItemIdentity.held_in?` matches by identity, network_access.rb:217). For an `already` plant, "the id
of the device stored in the foothold" can name an id the player still holds a copy of. The safer rule
for every route is that `removed` lists the touched ids absent from the server's inventory after the
action, which is what `syncInventoryFromServer` effectively does today. State that `applyInventoryDelta`
is never given an item without an id to remove.

### m7. P1, R2: no pre-parse size cap on the new bodies

The only pre-parse body cap is `refuse_oversized_npc_frustration` (games_controller.rb:35, :1719).
`POST /captures` and `POST /clone_card` with `card` are parsed whole before the 4 KB and 500-char
caps apply. Add the same `prepend_before_action` with a small limit (8 KB is ample) and a test that an
oversized body is refused before parsing.

### m8. R2 (6.7): readers and tests the plan missed

- `tools/playtest/lib/access_leak_scanner.rb:624` exempts a password only under a `.se_captures`
  path. After R2 the heard login's note (with the password, under `revealSecret`) sits under the
  bootstrap's `captures` and the `/captures` answer, so leak scans will report false leaks. Update the
  scanner in the same step.
- Five more test files seed `se_captures` (13 lines): test/models/break_escape/capture_secret_test.rb,
  test/controllers/break_escape/capture_secret_endpoint_test.rb, access_model_no_password_test.rb,
  network_shares_test.rb, test/models/break_escape/access_model_withholding_test.rb. List them beside
  the four in 6.7.

### m9. 2.2 and 6.3: what `syncConfirmed` promises

A capture left in the pending list after its retry in `beforeSync` fails must make that run not ok,
or `syncConfirmed` resolves true while the server lacks the capture, and capture-rows.js:70 then asks
for a secret the server will not serve. Also list game-menu.js:296 (the quit path) among the callers
in 2.2.

### m10. 9.2: the live proof's capture method

The pagehide flush is a keepalive request sent while the page unloads. Playwright usually cannot read
its response body after the navigation. Take request sizes from `request.postDataBuffer()` and the
flush's result from the server log or from `player_state` afterwards. "No larger than today's measure
plus 1 KB" (9.1) needs the measured number written into the test, since a Rails test cannot read the
baseline run.

## Nits

- n1. P2 4.3: nothing reads the `/inventory` add answer (inventory.js:687 reads `success` and
  `message`), so `added` there can be dropped for `{ success }`. `add_inventory_item!` returns nil
  today (game.rb:170), so the plan's `stored` needs a change there either way.
- n2. R2 6.5: "oldest `at` first, so first-wins keeps the original" does nothing. The legacy global
  holds one entry per target already.
- n3. R2 6.3: the server record should not keep a client-written `secret`. The secret is served by
  `/capture_secrets`, and storing a client value under that key only invites confusion. Consider
  truncating rather than dropping an over-cap `note`, so an authored note is not silently lost.
- n4. R2 6.3: `se_captures = gameScenario.captures || {}` creates the mirror in every mission. Set it only
  when the bootstrap carries `captures` or the scenario declares the global.
- n5. 4.1: the unrouted `Api::GamesController#inventory` (app/controllers/break_escape/api/games_controller.rb:40,
  :43) also echoes the whole inventory. Its header says it must stay unrouted, so leave it alone and
  mention it.
- n6. 8: old tabs keep their own module set because the import map pins `?v=ASSETS_VERSION`
  (application_helper.rb:82 to :95). The step 8 transition assumes the version is bumped with the
  release, so say so.

## Checks the plan asked for

### jsonb key order (R1)

`stableJson` over both sides handles object key order at every depth, and the "not sent only when equal
to the server's copy" rule means any remaining mismatch resends a key and loses nothing. Other mismatches
behave the same way: mail messages gaining `id` in `sanitize_mail_message` (game.rb:3726), ink values the
server filters out (:3371), Rails dropping `nil` from arrays in params. The one place the reorder bites is
the phone seed outside state-sync.js (M1).

### Cards that stop persisting (P1, 5.4)

Searched m01 to m10 and both labs:

- Chat clones: every `#clone_keycard` tag sits in a person NPC's own ink and names that NPC's own
  `rfidCard.card_id`. m03 Ffion and Victoria, m04 Vance and Relay, m05 Owen, m06 Irina, m07 Hollis,
  m08 Netherton, m09 Noor and the Sorensen hatch, m10 Imran and Gary, and lab_physical_pentest Len all
  match. No phone ink carries the tag. None stops persisting.
- Keycards with no `card_id` (identified by `opens_lock`): m01 and m02 (no cloner in either), and
  m04 (4), m05 (4), m07 (2) and m08 (2). Each sits in an NPC's `itemsHeld` or in a container's
  `contents`, so it is taken and held, not copied in place. A copy of one would stop persisting, but
  the player keeps the card itself on these routes. None is on an intended copy route.
- The one copy route at risk is lab_physical_pentest's comms card. It has a `card_id`, but it is
  copied from the action menu, which today sends no source. It is covered only if m4's fix lands with
  the rest of P1.

### Outside readers

Hacktivity does not read any answer this plan changes. A grep of app, lib, config, script and test
for `/inventory`, `network/*`, `clone_card`, `saved_cards`, `se_captures`, `seCaptures`,
`serverClones` and `__capture_log_seen` finds only `test/integration/mission_page_alias_test.rb:169`,
which sends `PUT sync_state` with `currentRoom` alone and is unaffected. Hacktivity's own
`player_state` reads are `objectivesState` (lib/tasks/break_escape_stuck_completions.rake:13) and
`vm_set_id` (app/services/game_slot_start_service.rb:56). hacktivity-desktop and hacktivity-android
have no reader. Inside this repo, tools/playtest reads none of the answers, but the leak scanner reads
the `se_captures` path (m8).

### Size rule

After the fixes above, each change is bounded. Cards are bounded by the scenario's cloneable cards at
4 KB each, sent once per copy. The capture record holds one entry per declared target, about 120 bytes
each and at most 8 x 500 characters, sent once per capture. Seen keys are one per capture-log row, sent
once each. Answers carry only touched items. The bootstrap still carries the cloner list (up to 64 KB for
an old save) and the capture record once per load, which the rule allows.

## R2 recommendation

The phish verdict should stay a client-flow step. The server never sees a victim click: the mail
scheduler and the landing-page score both run in the browser, and no server route records a delivery
or a submission. Requiring "the server saw the phish" would mean moving the mail runner and the score
to the server. That is outside this plan, and an incomplete version of it would block the intended
route.

The sanity check should still be a real one, and the secret must be bound to the target. In this
plan, `record_capture!` (6.3) should:

1. Take `address`, `kind`, `host` and `roleLabel` from the authored capture writer for that target
   (`CaptureModel.capture_writers`, shared with the validator), never from the client. When a writer
   allows two addresses (the page's capture address, or the target's own address when the page has
   none, capture_model.rb:77 to :82), the client may choose between those two only. Then
   `by_address` and `by_username` (game.rb:1055, :1056; network_access.rb:1131) can only answer
   for that target's own secret.
2. For a phish-target credential, require server-held evidence that the step happened. That means a
   `se_landing_pages[pageId]` record for a page this target can land on, with `built` and
   `meetsThreshold` true, and, where the scenario sends phish mail, a sent message to that target in
   `mailState` carrying that page's link kit. Both are client-synced, so this stays best effort, but a
   forger then has to write a consistent built page and a sent mail rather than one target id.
3. For a mapping capture that declares a `proof`, and for a `usePayload` foothold, require the proof to
   hold (`capture_proof_holds?`, capture_proofs.rb:55).
4. Refuse a client write for a heard-share target (any id in `sharedLogins`): the server records that
   capture itself in npc_frustration.rb.

Write this into 6.6 as the sanity check, and keep 11's "stronger capture check" for moving the
verdict itself to the server. If the user prefers to defer points 2 and 3, point 1 should still go in
this plan, since it costs little and closes the cross-target lookup.
