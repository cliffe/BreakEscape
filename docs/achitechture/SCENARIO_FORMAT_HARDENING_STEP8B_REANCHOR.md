# Step 8b re-anchor (2026-11-13)

Step 8b of `SCENARIO_FORMAT_HARDENING_PLAN.md` (section 4, "One owner field, format 2") was written
and reviewed against main `406fa7791`. Since then step 7 (formatVersion + upgrader) and step 8a
(one outage field, format 1, `offWhen`) landed, plus the Friendface emoji reactions, C3 replies, the
Friendface phone work and the feed lockout. This note records a re-anchor of step 8b (and the shared
step 8 text it depends on) against **2f5471209**.

## Verdict

**Mechanical.** No design change: no new reader kind, no field-meaning change, no corpus owner
conflict, no Ruby/JS rule disagreement. The errors are stale line numbers, one retired-key count,
and additional reader sites inside files the plan already named.

## What was checked

- Grepped `app`, `lib`, `public/break_escape/js`, `scripts`, `tools/playtest`, `docs/test-bridge.md`
  for every owner reader: `screenOwner`, `phoneOwner`, `phoneOf`, `leftBehindBy`, `leftBehindChance`,
  `affordance.owners`, `affordance.private`, `deskPhone`, and the `needsHome`-derived owner
  (`AccessIdentities.owner_id`, the client `ownerOf`, `login_pc_owner`).
- Checked each file:line the plan cites against the code.
- Recounted the retired keys in every scenario template (all plain JSON, no ERB except
  lab_physical_pentest which the grep counts hold for).
- Recounted the `needsHome`-derived owners by parsing each non-ERB template and running the owner
  rule (workstation detection = `workstation`/`locksScreenOnLeave`/`lockChance`/`lockType: login`;
  owner = `screenOwner` else first room NPC with `needsHome` == object id).
- Checked the new feed/reaction/reply/lockout code (`social_feed.rb`, `friendface-phone.js`) for any
  new owner reader. None: `friendface-phone.js:71-77`'s `owners` Set counts reply authors, a name
  collision only, not `affordance.owners`.
- Checked for a corpus owner conflict (an object with both `screenOwner` and `affordance.owners`) and
  for a `needsHome` shared by two NPCs (which would make the Ruby/JS first-match order observable).

## What was wrong or missing (file:line)

Line numbers (all corrected in the Step 8b section and the shared step 8 paragraph):

- `AccessIdentities.owner_id`: plan said `access_identities.rb:228`; def is at **:230**.
- client `ownerOf`: plan said `workstation-state.js:116`; def is at **:115**.
- `SocialFeed` phoneOf read: plan said `social_feed.rb:297`; the read is `friendface_owner` at **:343**
  (and `held_friendface_phone`). :297 is unrelated feed-body code.
- `GamesController` found-item phoneOf: plan said `games_controller.rb:2557`; it is at **:2671**
  (the allowed-field list that carries `phoneOf` is at :2535).
- `CLIENT_ITEM_FORBIDDEN_FIELDS`: plan said `games_controller.rb:2417-2424`; it is at **:2533-2538**.
- `object_revealed:<id>` `leftBehindBy` emit: plan said `npc-needs.js:5164`; it is emitted at **:5229**
  (read by `left-card-consequence.js:57`, which is correct).
- Shared step 8 field lists (`validate_scenario.rb`): plan said `known_npc_fields` lines 432-445 and
  `known_item_fields` lines 521-555; they are **691-704** and **780-814** respectively.

Count:

- **lab_physical_pentest carries 1 `affordance.private`** (scenario.json.erb:1243) the plan's
  Scenarios list omitted, so the corpus total is **20 `affordance.private`, not 19**. Corrected.

Readers inside already-named files that the plan's detail did not spell out (same known kinds, added
to the readers-moved list so a builder does not miss them):

- `validate_scenario.rb:6960` ("screenOwner names unknown person") and `:7011` (a workstation's owner
  read) are owner-semantic reads beyond `known_item_fields`.
- `validate_access_work.rb:397` (PCs owned through `screenOwner`) and `:1226-1230` (the
  `login_pc_owner` owner rule) both derive an owner.
- `Game#login_pc_owner` (game.rb:2088, `screenOwner`) and the held-phone check (game.rb:1739,
  `phoneOf`).
- `npc-needs.js` ships the owner fields in the client copy (`:4633` screenOwner, `:4640` phoneOwner)
  and reads the desk-phone owner at `:3989`; these move with the rename.

## What held

- The five-into-one merge, the kind table, the `deskPhone`/`private`/`owner` split, the
  forgeable-field (`owner` joins `CLIENT_ITEM_FORBIDDEN_FIELDS`, `phoneOf` stays), and the reveal-event
  rename all still match the code.
- Derived-owner counts match the plan exactly: test_access_habits 9, test_access_sessions 7,
  test_access_social 16, test_access_work 12 (plus 1 explicit `screenOwner`), test_needs_sims 3 (the
  same three PCs are its three `affordance.private` objects), test_npc_needs 2. Nine scenarios in all.
- Retired-key counts match except the lab omission above.
- **No corpus owner conflict:** no scenario carries both `screenOwner` and `affordance.owners` on any
  object, so the single-owner merge is safe, as the plan predicts.
- **No Ruby/JS rule disagreement on the corpus:** no object is the `needsHome` of two NPCs in any
  non-ERB scenario, so `owner_id` and `ownerOf` resolve the same single owner; first-match order is
  never observable. The build's reader-parity run still records this, as the plan asks.
- The new feed/reaction/reply/lockout features add no owner reader.
