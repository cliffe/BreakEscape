# Step 8b (one owner field, format 2) adversarial code review, round 2

Branch `build/hard-8b`, reviewed at tip `ca13cba9a` against `git diff main...HEAD` (main merged in at
`92460079a`). Read-only review; the only change in this commit is this file. Judged against the
shared "Step 8" and "Step 8b" sections of `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md`, the
step 8b build-log sections, the R1 review with its Outcomes, and the live code and tests. I formed my
own view of the transform and every owner/marker reader before reading R1.

## Verdict

Ship. No blockers and no majors. R1's two minors are both closed. The marker-free player_state
rename (R1 minor 1) is safe: no reader that sees a stored copy fails to recognise an upgraded copy
that a fresh format-2 game would recognise. Two minors below are a latent-case documentation gap and
a test-coverage gap, neither a correctness defect.

## R1 minor 1: the stored-copy marker finding (the one the brief asks for)

**Closed, and safe.** `rename_one_hash_owner_fields!` now takes `write_markers:` (default true);
`one_owner_field_in_player_state!` (`lib/break_escape/format_upgrade.rb:333`) passes `false`, so a
stored item copy is renamed in place and gains at most the one `owner` key, no `deskPhone: true` or
`leftBehindChance: 0`. I traced every client and server reader that can see such a stored copy and
compared it with what a fresh format-2 game stores for the same item:

- **Friendface phone (inventory / NPC room drop).** Recognised by `type == 'phone_friendface'` plus
  `owner`, never by a marker. `owner` is a *rename* target, not a marker, so the player_state walk
  writes it regardless of `write_markers`. `SocialFeed#held_friendface_phone`/`friendface_phone_taken?`/
  `note_friendface_phone_taken!` (`app/models/break_escape/social_feed.rb:190,227,245`, via
  `friendface_owner` at `:343` reading `item['owner']`) and the pickup drop-check
  (`app/controllers/break_escape/games_controller.rb:2688`, `found_item['owner']`) all read `owner`.
  A fresh game's stored copy and an upgraded old game's stored copy both carry `owner`; the build-log
  live proof (jake_phone, build log ~l.2098-2116) confirms the upgraded stored copy is recognised.
  No marker needed. OK.
- **Desk phone.** `deskPhone` is read only off scenario-declared room objects (npc-needs `describe`/
  `onPhoneRing`, `OwnerClaim.colleague_phone?` at `owner_claim.rb:244`). A desk phone is `takeable:
  false` (schema `deskPhone`, `validate_npc_needs.rb`, corpus `tom_phone`), so no copy of one ever
  enters player_state. There is nothing for the missing marker to break. OK.
- **Left-behind item.** `leftBehindChance` is read only by `isSlot`/`leftBehindItems`/`describe`
  (`public/break_escape/js/systems/npc-needs.js:4616,5230,4657`), all of which scan
  `rooms[].objects` sprites, whose `scenarioData` is the scenario-sourced declared slot. The scenario
  walk keeps the marker (`write_markers: true`), so the live slot still satisfies `isSlot`. The
  stored inventory copy of a taken left-behind item is never scanned by those readers (they do not
  read inventory), and every corpus left-behind item (`tom_badge`, `pierce_comms_card`, `clerk_card`)
  is `takeable: true` but **not** `droppable`, so the player can never re-drop one into a room as a
  stored `objects_added` copy. No stored copy is read through `leftBehindChance` in the corpus. OK in
  practice; the one residual latent case is minor 1 below.

## Findings

- **minor** — `lib/break_escape/format_upgrade.rb:347` / build log l.2219. The build-log claim "a
  copy's left-behind or desk-phone behaviour is already settled on its scenario source" is true for
  the corpus but one shade stronger than the code guarantees. `isSlot`
  (`npc-needs.js:4615`, `(sd.outputOf || sd.leftBehindChance !== undefined) && globalOf(sp)`) and
  `describe` read `leftBehindChance` off a sprite's own `scenarioData`. A dropped item's world copy
  is `{ ...scenarioData, takeable: true, ... }` (`item-drop.js:465`) persisted to `objects_added`,
  so if a left-behind item were ever *also* `droppable`, a fresh format-2 game's re-dropped copy
  would carry `leftBehindChance` (`isSlot` true, `describe` sets `slot`/`takeable`) while an upgraded
  old game's re-dropped copy would not (`isSlot` false). This is a genuine fresh-vs-upgraded
  asymmetry, but unreachable today (no corpus left-behind item is droppable) and inert even if
  reached: a revealed left-behind item's `revealOnGlobal` is already true, and both `leftBehindItems`
  (`globalTrue(globalOf(sp))` continue) and the taken/`reacted` guards skip an already-taken item.
  Suggested fix: tighten the build-log sentence to say left-behind items are non-droppable so no
  stored room-object copy is ever read as a slot (keep the marker-free rename; do not re-add the key,
  which would reintroduce the second-key growth R1 minor 1 removed). No code change for correctness.

- **minor** — `test/unit/format_8b_corpus_test.rb:28` (`SCENARIOS`). The corpus-equivalence and
  reader-parity fixtures cover `test_access_habits/social/work/needs_sims` only. Three scenarios the
  step rewrote to format 2 have no `old.json -> transform -> new.json` equivalence assertion:
  `test_access_sessions`, `lab_physical_pentest` (its `kieran_laptop` private-list derivation and
  `pierce_comms_card` left-behind owner), and `test_clone_left_card` (`clerk_card` left-behind
  owner). R1 noted this for `lab_physical_pentest` as an observation; it is broader. Low risk: these
  are test/lab scenarios with no production saves, their live templates are already format 2 and
  validate with 0 errors and no retired-key line (I re-ran all three at this tip, `--no-graph`), and
  the edit-proof retired-key guards cover the committed templates. Suggested fix: either add these
  three to a frozen old/new fixture pair in the corpus test, or record in the build log why the four
  chosen scenarios are the sufficient equivalence corpus (they between them exercise every renamed
  kind: workstation, private list, desk phone, Friendface phone, left-behind item).

## What I verified green

- Ruby: `test/unit/format_8b_corpus_test.rb`, `test/unit/format_upgrade_test.rb`,
  `test/controllers/break_escape/format_8b_deployed_noop_test.rb`, `test/unit/owner_claim_test.rb` —
  69 runs, 745 assertions, 0 failures, 0 skips.
- JS: `format-8b-reader-parity`, `npc-left-behind`, `npc-desk-phone`, `validator-retired-keys` — 76
  pass, 0 fail. R1 minor 2's two new `check_owner_fields` needsHome-warning cases both pass (the
  warning fires for a needsHome workstation with no owner, and stays silent with an explicit owner).
- Validator (`/usr/bin/ruby3.2 ... --no-graph`) on `test_access_sessions`, `lab_physical_pentest`,
  `test_clone_left_card`: 0 errors, no retired owner-key line.

## Fresh look at the whole step (what else R1 might have missed)

- **Upgrade on raw and prepared data.** `one_owner_field!` phase A renames every live Hash through the
  schema-aware walk (`free: :skip`); phase B derives an owner only for a workstation (String) or a
  `private: true` object (one-element list), reading the untouched `needsHome`. Idempotent, and the
  deployed-noop test proves the real transform is a no-op on the four deployed scenarios (no renamed
  key, no derivation). `corpus_test` runs `prepared(transform(old)) == prepared(new)` (the real load
  order). Confirmed.
- **Every owner reader.** Grepped `app/ lib/ public/.../js scripts/`: no stale old-key reader drives
  behaviour. The `screenOwner`/`phoneOwner`/`affordance.owners` references left in
  `scripts/validate_scenario.rb:658-665` are deliberate: the pre-rename two-field conflict check and
  the `old_explicit` suppressor for the needsHome warning, which must still recognise a hand-written
  old key. `games_controller.rb:2552` keeps `phoneOf` in the forbidden list on purpose (an old tab).
- **Forbidden-field list.** `CLIENT_ITEM_FORBIDDEN_FIELDS` adds `owner` and keeps `phoneOf`
  (`games_controller.rb:2552`); a client-built item cannot mint an owned phone. `deskPhone` and
  `leftBehindChance` are not in the list, but a client item carrying them cannot name an `owner`
  (stripped) and is never a room-object sprite, so neither grants a phone-ring or a left-behind
  reveal. No new cheat path (observation, no action).
- **SYNC SIZE RULE.** The player_state rename is net-zero per key (delete old name, add `owner`),
  runs once at load, is idempotent and marker-free, so a re-sent copy cannot grow. Holds.
- **Load-bearing oddities.** The `needsHome` owner fallback is removed from every reader and written
  explicitly by the transform; no never-firing `unlockDoor` mapping or `give_item`/world-object pair
  was touched. The non-workstation private PC (`kieran_laptop`) is never read for a derived owner
  (readers gate on `workstation?`/`login_pc?`). Confirmed as R1 found.
- **Weakened assertions.** The assertions removed from `npc-left-behind.test.mjs`
  (`'never left'`, `leftBehindChance: undefined`, `leftBehindBy: undefined`) reflect the semantic
  change (presence of `leftBehindChance` is now the marker, so its absence means "not a left-behind
  item" rather than "never left") and are replaced by the `owner`-based equivalents. The friendface
  test was strengthened, not weakened. No assertion was quietly loosened to pass.
