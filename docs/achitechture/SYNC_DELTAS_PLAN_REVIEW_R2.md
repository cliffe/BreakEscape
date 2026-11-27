# Player state deltas plan: review, round 2

Plan reviewed: `docs/achitechture/SYNC_DELTAS_PLAN.md` at 21fcac163. Code checked on the same commit
(`build/sync-audit`, main merged at 8e9031afc). The plan was read on its own first, then checked
against `SYNC_DELTAS_PLAN_REVIEW_R1.md`.

Counts: 0 blockers, 1 major, 6 minors, 10 nits.

Every R1 finding is resolved (table at the end). The named files, functions and lines check out, with
the few exceptions listed as nits. The sync size rule holds for every change: each request sends one
entry or the changed keys, and whole collections go down once per load. The one major is in the
6a/6b split, which the plan says can ship apart.

## Major

### M1. Section 9 step 6 and 6.3: entries recorded under 6a lose their secret when 6b ships

Step 6a ships `record_capture!` with parts 1 and 4 only, and says every stored entry is then
revealable as soon as it is recorded. `proven` and `capture_evidence_holds?` arrive with 6b. Nothing
in 6a writes `proven`, so every entry recorded while 6a alone is live has no `proven` key.

When 6b ships, `unproven_captures?` is true for all of those entries. The bootstrap step and the sync
step run `stamp_proven_captures!`, which stamps only the entries whose evidence holds at that moment.
`capture_revealable?` then withholds the rest.

Concrete failure, on the honest route in lab_social_engineering: under 6a the player lands the
payroll phish on lord and sees the secret. They reopen the landing-page builder and score the page
again to improve it. `applyScore` sets `built: false` (landing-page-model.js:614 to :630), so the page
record no longer satisfies part 2. 6b deploys. On the next load the entry is unproven and its evidence
fails, so `GET /capture_secrets` stops serving the secret the player already had. The same happens if
the mail trim (`trim_mail_messages!`, game.rb:3693, sent records are tier 1) dropped the old sent message, or if the
player deleted it. This breaks 6.2 ("never lost") and the "6a stands on its own" claim.

The migration already handles the same problem for pre-deploy saves by marking them `proven: true`.
Fix: 6a stores `proven: true` on every entry it records, because under 6a every entry is revealable.
6b then computes `proven` only for entries recorded after it ships. (The other way, treating a missing
`proven` as true in 6b, gives the same result.) Add a Rails case: record under the 6a rules, then
un-build the page and run the 6b stamp; the secret is still served.

## Minors

### m1. 6.2 part 3 and 6.3 `record_capture!`: the proof gate depends on which candidate the client names

Part 3 applies to "a mapping overlaid with an NPC's `usePayload` whose NPC declares a
`captureProof`". The candidate pick prefers a plain candidate when the client's fields allow it. The
client chooses those fields, so it chooses whether part 3 applies.

- lab_physical_pentest `lord`: the plain mapping carries `address: "s.lord"` and no host
  (scenario.json.erb:1390). A tampered client that sends `{ targetId: "lord", kind: "credential" }`
  with no host matches the plain candidate. The stored entry then has no `payload_owner` source, and
  part 3 never runs.
- `hampshire` and `pierce` in the same lab: their plain mappings carry the same address and host as
  the overlay (:1276 with :1244, :1555 with :1542), so the plain candidate always wins, even for an
  honest client. Part 3 never applies to them.

The real gate for all three is the account pass, which already checks the account's proofs
(`account_capture_served?`, capture_proofs.rb:101 to :114; game.rb:1083). So nothing leaks today, and
under q78 an account whose password opens nothing is only a time saver. Still, part 3 as written is
not the check 6.6 claims it is, and the 6.7 prose contradicts the table: "The `pierce` NPC's
`workstation_accessed` capture ... that is why parts 2 and 3 gate the reveal" (6.7, after the table),
while the table row says pierce is a plain mapping with "None from parts 2 and 3".

Fix: key part 3 on the target, not the candidate. If any candidate for (target, credential) has a
`proof` or a `payload_owner` with `captureProof`, require one of those proofs, whichever candidate
was stored. Or drop part 3, say the account pass is the proof check, and correct the 6.7 prose.

### m2. 6.3 client: loading capture-client.js lazily from mail-bridge opens a window where a capture is lost for good

Today `mail-bridge.js` `recordCapture` (:82) is synchronous: it imports captures.js statically and
writes `se_captures` in the same tick as the sent record (:403) and the page record (:423). The plan
loads capture-client.js "lazily by its callers", so `submitCapture` runs only after a dynamic import
resolves.

Concrete failure: the page record (now `victim.submitted: true`) and the sent mail are written at
once and ride the next sync or the pagehide flush. The capture waits for the import. If the page
unloads first, or the import fails (a network blip on the first capture of a page load), the capture
is never pending. After the reload, `captureGranted` is true only the first time the page's outcome
becomes submitted (landing-page-model.js:733), and the saved record already says submitted. Sending
the kit again can never grant the capture, so the honest player loses it permanently.

Fix: load capture-client.js at startup (`apply-actions.js` already sets `window.recordSECapture` at
load, :42; it can preload the module there), and have `submitCapture` write the mirror and the
pending entry synchronously once loaded. Or import it statically in mail-bridge.js and add it to the
harness copy lists. Add a node case: the capture is pending in the same tick as the sent record.

### m3. 6.3 and 6.5: heard-share captures in an old save, or in an old tab, are dropped

`migrate_legacy_captures!` moves each legacy entry "through part 1" and drops undeclared targets. A
heard-share target (test_access_work's `sam`) has no capture writer, so `capture_candidates` has
nothing to build its fields from, and the plan does not say what the migration does then. If it
drops the entry, an old save loses the capture-log row and the password the server once composed
(npc_frustration.rb:443 to :456). That contradicts 6.5 ("nothing visible changes for an old save").

An old tab whose heard `done` answer arrived just before the deploy, with the global not yet synced,
sends `sam` in `se_captures` afterwards. The interception refuses it as `server_only`, and the server
never recorded it, because the old server code only added `sharedLogins`.

Fix: in the locked bootstrap step, for each id in `sharedLogins` with no record entry, compose the
entry with `shared_login_body` and store it `by: :server`. The migration keeps a legacy heard-share
entry by the same route. Only test_access_work uses `share_login` today, so this is minor.

### m4. 10.3 case F (and C): not provable as written

Case F asks one tab to "land a capture, copy a card and plant a device", then after a reload expects
"the card is listed". It names no scenario. The only scenario with a capture writer, a card copier
and a network plant is lab_physical_pentest. Its signature copy is Melanie's comms card from the
action menu (scenario.json.erb:1673), and 5.4 states that an old tab's action-menu copy stays
session-only and is not listed after the reload. A builder who takes that route gets a failed check
that the plan itself predicts.

Fix: name lab_physical_pentest, copy Len's card through the chat clone (`{ npc_id }`, recorded by the
old tab's `/clone_card` and listed by the repair), and list the comms card as the expected exception
(copied from the old tab's action menu, not listed after the reload). With those choices, F is
provable.

Case C has the same problem in a smaller form: "copy three cards in test-rfid". test-rfid has two
cloneable cards (the guard's `master_keycard` and the world `ceo_keycard`), and a repeat copy
replaces in place (5.2), so only two can be listed.

Case E is provable as written. test-rfid's `ceo_keycard` is `takeable: true` in a world room
(action-menu path, no source on the base commit, listed through `update_saved_cards`), and 5.4 keeps
old stored cards as they are.

### m5. 5.1, 5.2 and 5.4: `world_card` has no runtime case

`stamp_scenario_object_ids!` (game.rb:4439 to :4445, called at game creation, :883) gives every room
object and container item an id. test-rfid's world keycard is authored with no id, but at runtime it is
`test_secure_keycard_1`, so the action menu and interactions.js both send `{ object_id }`. The 5.4
sentence "test-rfid has one world keycard with no id, which is what the `world_card` source is for"
is wrong. The 5.1 fallback problem ("wrong for a non-takeable card lying in the world") cannot occur
in a game created since stamping.

The only id-less keycards are held ones (`itemsHeld`, start inventory), which `held_card` covers.
Either drop `world_card` and `world_clone_source_keycard` (less code, less to secure), or keep it and
say it is for games created before the stamping change. Its Rails test then needs a hand-built game
row, since no scenario produces the case.

### m6. 2.1 and 3.3: a seed misses on every load where a server sanitiser changes a value

2.1 says a number form difference "resends one key once and never loses anything". The seed is the
server's sanitised copy, and the client's export is the unsanitised value. When they differ, the key
goes up on the first sync of every load, not once. Known sanitisers that change values:

- ink variables: non-scalar values are dropped (game.rb:3371 to :3374), so an NPC with an ink LIST
  value is resent whole on every load;
- mail: `body` cut to 4 000 characters, `tells` to 50, and `sanitize_mail_json` depth and entry caps
  (`sanitize_mail_message`, game.rb:3726 to :3750);
- phone threads: `sanitize_phone_state_entry` slices each message to `PHONE_MESSAGE_KEYS` and drops
  empty texts (game.rb:3454 to :3470).

Nothing is lost, and only the affected keys travel, so this is minor. The 3.7 tests only seed values
equal to the current state. Add node cases that seed from a server-sanitised copy (an ink LIST value,
a 5 000-character sent body, a phone message with an extra key) and assert what is resent. Then
either have the client export the sanitised form, or record in 3.3 that these keys travel once per
load.

## Nits

- **n1. 6.3 sync step, stale requests.** The capture step runs on a stale request, but the mail and
  globals merges do not (`merge_last_write_wins_sections` is skipped, games_controller.rb:787). A
  stale flush therefore records the capture without its evidence. Recovery works: the next send to
  that target carries the evidence, and the step runs because an unproven entry exists. 6.2's "never
  lost" should say so. The stale render branch (games_controller.rb:804 to :805) answers
  `{ success, stale }` only. Say that it carries `captures` and `capturesRefused` too, or the
  "`onAnswer` on stale" rule in 2.2 has nothing to read.
- **n2. 6.3 cost of unproven entries.** While any entry is unproven, every 30 s sync fetches the whole
  `scenario_data` and every bootstrap takes the row lock. A forged entry that can never be proven makes
  this permanent for that game. It costs the server, not the wire. Consider re-checking only when the
  request carries `globalVariables` or `mailState`.
- **n3. 6.7 table wording.** The len row ("the account pass keeps today's check"): Len has no
  `creds`, so the account pass serves nothing for `l.okafor`, and the mapping's `secret` is stripped
  (game.rb:4370). The row is right that nothing changes, but nothing is ever served. The
  test_capture_log hampshire row ("Not gated"): `chris` has a `captureProof`
  (test_capture_log scenario.json.erb:161), so the account pass gates it.
- **n4. 6.7 lab_social_engineering rows.** "Any target can be sent the kit" is true, but only the first
  target whose send turns `payroll_login`'s victim to submitted gets a credential capture. The page
  record is keyed by page and `captureGranted` fires once (mail-bridge.js:417 to :443).
- **n5. 6.3 kind default.** `makeCaptureEntry` turns a missing or unknown kind into `credential`
  (captures.js:51). The server's candidates read `capture['kind']` as authored. All 25 writers carry a
  kind today. Either default it the same way on the server or have the validator require it.
- **n6. Step order.** 3.2 (step 2) skips keys in `SERVER_OWNED_GLOBALS`, which 6.3 (step 6a)
  defines. Say step 2 adds the constant empty and 6a adds `se_captures` to it.
- **n7. 6.8 test list.** Three more JS tests seed `se_captures`: access-remote-signin.test.mjs,
  social-captures-view.test.mjs and social-report-footholds.test.mjs. They read the mirror, so they may
  not change, but the builder should check them.
- **n8. Paths and words.** "`mail-client/mail-bridge.js`" is
  `public/break_escape/js/minigames/mail-client/mail-bridge.js`. Section 1's "a migration" is a data
  move in the bootstrap step with no schema change. Say so, since case E runs two servers against one
  database.
- **n9. `captures_for_client`.** Not defined. Say that it returns unproven entries too (the row shows
  masked) and never `proven`.
- **n10. Old tabs and captures.js.** `apply-actions.js` loads captures.js with a dynamic import
  (:20), so an old tab that captures for the first time after the deploy fetches the new file. 6.3
  says captures.js "stays pure". Also say that its exports stay, for the old tabs.

## The questions asked

### Design call 1: captures in the `PUT /sync_state` body

Sound.

- Size: one entry of about 120 bytes per new capture, resent only until answered; the answer names
  only the incoming targets. The old tab's path sends its whole map on each new capture, but that map is
  bounded by the declared targets (19 at most in lab_physical_pentest).
- The pagehide flush: a part goes into each of the three fallback lists, and `flushKeep` keeps the
  evidencing sent records when the second fallback drops `mailState`. The page record is a global and
  is in every list. A separate route would need its own keepalive flush and its own ordering rule;
  riding the body avoids both.
- Ordering: within one request the step runs after `merge_last_write_wins_sections` and
  `merge_grow_only_sections`, under the row lock (games_controller.rb:782 to :797). `performSend` is
  synchronous from the sent record (:403) through the page record (:423) to the capture (:435), so all
  three are built into the same body. Across requests the reveal check is evaluated at read time, so
  a capture that lands before its evidence is revealed once the evidence arrives. The only gaps are
  the stale path (n1, recoverable) and the lazy import (m2).

### Design call 2: gate the reveal, not the record

Mostly sound under the cheat policy and q78.

- Part 1 closes the cross-target lookup: the address is the target's own authored one, so a forged
  capture can only reveal a secret honest play can reach. Part 4 is a real server-only rule.
- Part 2 is a sanity check on client-synced evidence. A forger must write a built, threshold-meeting
  page record and a sent mail to that target carrying that page's kit. That is best effort, as the
  policy allows, and the honest route always produces both in one body (checked below).
- Part 3 does not gate what it claims (m1); the account pass does the real work.
- The legacy migration's `proven: true` is safe: after the deploy nothing stores
  `globalVariables.se_captures` (the sync strips it; `apply_task_set_globals!` takes scalars only,
  game.rb:4122; no other route writes a client-named global).
- An honest player can lose a secret in three ways: through the 6a/6b transition (M1), through the
  lazy import (m2), and through heard-share migration (m3). After those fixes, the only remaining loss
  is a mail section refused over its cap on every sync, which would also lose the mail itself.

### Capture route table (6.7), spot checks

- lab_social_engineering payroll phish: confirmed. `kit_payroll_page` is a link kit for
  `payroll_login` in `social.mailClient.payloadKit`; the page's capture carries the address and
  secret. The sent record keeps `folder`, `targetId` and `link.kitId` (mail-bridge.js:666 to :679;
  `MAIL_MESSAGE_KEYS`, game.rb:3519). `buildRecord` keeps `built` and `meetsThreshold` when the victim
  is written back (landing-page-model.js:596 to :609). `describeVictimOutcome` needs
  `meetsThreshold` (:694, :701), so a granted capture always has its evidence.
- lab_physical_pentest pierce: the mapping is plain (scenario.json.erb:1555), the event carries no
  payload (workstation-state.js:575, :590), and the account pass gates the password on
  `session: staff_pc_2` (:1525). The row is right; the prose under the table is not (m1).
- lab_physical_pentest lord: confirmed. The overlay matches npc-manager.js:1212 to :1216. `kit_qr`
  needs `dev_qr` (:932). The drop is recorded in `droppedItems` (game.rb:480 to :482) when
  item-drop.js sends `player_drop` (:142 to :155), before the NPC can use it.
- lab_physical_pentest len: confirmed unchanged, though for a different reason than the row gives (n3).
- Scenario walk: 26 scenarios, the per-scenario counts and "no m01 to m10 mission" all reproduce.

### R1 seeding and B2's `with_lock`

- The seed follows the two rules in 3.3. Line references are right (state-sync.js:133, :279 to :281;
  game.js:1703, :1704; npc-manager.js:2241, :2255, :2320). The phone `keyOf` fix resolves R1 M1.
  The one weakness is per-load resends where the server sanitises (m6).
- `prepare_bootstrap_state!` copies the `end_claimed_sessions!` pattern (game.rb:1791 to :1804):
  `with_lock` reloads the whole row (`lock!` reloads every column, even after `set_game`'s plain
  `find`), the checks repeat after the reload, one save. It runs before any `saved*` block is read
  (the first player state read is at games_controller.rb:292, `savedGlobalVariables` at :312). Correct.

### Live cases E and F

E is provable as written. F needs its scenario and clone path named (m4).

### Step 6a alone

It ships cleanly apart from M1. It depends only on step 1 (`registerPart`, `prepare_bootstrap_state!`)
and on the constant in n6. Its readers must treat every entry as revealable, which 9 says.

## R1 findings

| R1 | Status in this version |
|---|---|
| B1 | Resolved: lazy `pick(:scenario_data)`, `scenario:` passed to every call, no save in the merge, tests through `PUT /sync_state` (6.3, 6.8) |
| B2 | Resolved: `prepare_bootstrap_state!` under `with_lock` before the `saved*` reads; every reader read-only (2.4) |
| M1 | Resolved: `stableJson` and `keyOf` on both phone sides (2.1); node case in 3.7 |
| M2 | Resolved by parts 1 to 4 (6.2), with the gaps in m1 |
| M3 | Resolved: cases E and F; request sizes in node (10.1), answers in Rails (10.2). F needs m4 |
| m1 | Resolved: `savedCurrentRoom`, and the first request is stated and tested (3.2, 3.4) |
| m2 | Resolved: saved globals seeded into `_held` (3.2) |
| m3 | Resolved: `listed: false` (5.2) |
| m4 | Resolved: `cloneFrom`, action menu and remove land together (5.2, step 4). See m5 |
| m5 | Resolved: MIFARE size and the scenario bound (5.3, 10.2) |
| m6 | Resolved: `removed` from what the server no longer holds (4.3) |
| m7 | Resolved: `refuse_oversized_body` for `clone_card` (2.5) |
| m8 | Resolved: scanner and test files listed (6.8); three more JS files in n7 |
| m9 | Resolved: `pendingCount` makes the run not ok; game-menu.js:296 listed (2.2) |
| m10 | Resolved: `postDataBuffer`, `player_state` and the log; baseline written into the test (10.2, 10.3) |
| n1 to n6 | Resolved |
