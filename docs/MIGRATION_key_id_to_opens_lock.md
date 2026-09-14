# Migrating stored `key_id` to `opens_lock`

A runbook for `rake break_escape:migrate_key_id`. Hand this to whoever runs it —
a person or an agent. Follow it in order; every step has a check that tells you
whether to continue.

## What this is for

The scenario format used to have one field, `key_id`, doing two unrelated jobs:
naming an object so something could select it, and naming the lock an object
opens. It was split into three:

| Field | Answers |
| --- | --- |
| `type` | what class of thing is it |
| `id` | which object is this (unique) |
| `opens_lock` | which lock does it open (many-to-one) |

Scenario files and engine code have moved across. What has not is **existing
game rows**: a game snapshots its scenario into `scenario_data` when it is
created (`game.rb`, `before_create :generate_scenario_data`), so a mission
started before the rename still carries `key_id` and will for the rest of its
life.

Two back-compat fallbacks keep those games playable:

- `window.lockRef()` — `public/break_escape/js/utils/helpers.js`
- `BreakEscape::ItemIdentity` — `lib/break_escape/item_identity.rb`

plus one entry in the `#give_item` selector array in `npc-game-bridge.js`.

**The point of this migration is to make those three deletable.** Until it has
run in production, they must stay: they are the only thing keeping in-flight
games able to open a door.

## Before you start

You need to know, and should write down:

- **How many games are in flight.** At the time of writing, production held
  around 200 games, many incomplete. That is why we migrate rather than expiring
  them.
- **Whether anyone is playing right now.** `player_state` is written by live
  play. The task takes a row lock per game, so a concurrent write cannot be
  lost, but a quiet window is still the kind thing to pick.

## Step 1 — back up

Not optional. This rewrites two `jsonb` columns across every affected row.

```bash
pg_dump -U deploy -d break_escape_production -t break_escape_games \
  -f ~/break_escape_games_$(date +%Y%m%d_%H%M).sql
```

Check the file is non-empty and mentions the table before continuing. This dump
is your rollback: there is no down-migration, and there deliberately isn't one —
see *Rolling back* below.

## Step 2 — dry run

```bash
bundle exec rake app:break_escape:migrate_key_id[dry]
```

Nothing is written. You get:

```
N game(s) carry key_id. DRY RUN -- nothing will be written.
Would rename M field(s) across N game(s).
```

**Read the numbers before going on.**

- `N` should be in the same ballpark as the number of games created before the
  rename shipped. Wildly higher means you are pointed at the wrong database;
  zero means the migration has already run, or you are on a fresh one.
- `M` will be several times `N`. Each game's snapshot contains every key in the
  mission, and the player's inventory contains copies. Development saw ~8.6
  fields per game.

## Step 3 — read the conflict report

The task refuses to guess. If an item holds **both** `key_id` and `opens_lock`
with different values, that game is skipped and listed:

```
Skipped 2 game(s) holding both fields with different values:
  game 1187: player_state.inventory[3]: opens_lock="server_room" key_id="server_keycard"
```

This should be rare or empty. If it isn't, **stop and investigate before
applying** — it means something wrote `opens_lock` onto a row that already had
`key_id`, which is not a state any code path should produce. Understand how it
happened first; the migration is not the urgent part.

`opens_lock` is the live field, so where you do resolve one by hand, check which
value the lock's `requires` actually names.

## Step 4 — apply

```bash
bundle exec rake app:break_escape:migrate_key_id
```

Same output, without the DRY RUN line. Expect the counts to match step 2, minus
anything skipped.

## Step 5 — verify

Three checks. Run all three.

```bash
# 1. Nothing left behind.
psql -U deploy -d break_escape_production -tAc \
  "select count(*) from break_escape_games
   where scenario_data::text like '%key_id%' or player_state::text like '%key_id%';"
# expect: 0  (or exactly the number skipped in step 3)

# 2. Re-running is a no-op.
bundle exec rake app:break_escape:migrate_key_id[dry]
# expect: 0 game(s) carry key_id.

# 3. Spot-check one migrated key: the field name moved and nothing else did.
psql -U deploy -d break_escape_production -tAc \
  "select jsonb_path_query_first(player_state,'\$.inventory[*] ? (@.opens_lock != null)')
   from break_escape_games where id = <a migrated game id>;"
# expect: opens_lock holds what key_id held; name, type, keyPins, observations unchanged
```

Then **play one migrated game**: load it and open a door that needs a key. This
is the check that matters, and the only one that exercises the whole chain —
client `lockRef`, the POST, and server-side `has_key_in_inventory?`. A green
`select count(*)` proves the rows changed shape, not that a door opens.

## Step 6 — delete the fallbacks

Only after production is migrated and a migrated game has been played.

1. `helpers.js` — `lockRef()` becomes `return data?.opens_lock;`, and the
   backward-compatibility paragraph in its doc comment goes.
2. `lib/break_escape/item_identity.rb` — drop the `|| fetch(item, 'key_id')`
   leg and the matching paragraph.
3. `npc-game-bridge.js` — remove `item.key_id` from the selector array and
   trim the comment above it.
4. `test/models/break_escape/game_test.rb` — delete
   `"has_key_in_inventory still honours key_id for games started before the
   rename"`. It is now testing for a thing that must not work.
5. Run `bin/rails test` and re-validate the missions.

Leave `RFID_SCENARIO_PATTERNS.md` alone: its `key_id` examples are labelled
anti-patterns and should keep saying the validator rejects the field.

## Rolling back

Restore the dump from step 1. There is no down-migration on purpose: reversing
the rename would have to decide which of `id` and `opens_lock` an `opens_lock`
came from, and it cannot know. Do not write one.

If you have already done step 6 and then need to roll back the data, roll back
the code too — post-step-6 code cannot read a `key_id` row.

## Notes for whoever runs this

- The task is idempotent. Re-running after an interruption resumes cleanly;
  games already migrated are no longer in scope.
- It uses `save!(validate: false)`. Model validations concern gameplay state,
  not field naming, and a game that was already failing one should not become
  unmigratable because of it.
- `scenario_data` has no live writer — it is written once at creation. Only
  `player_state` is contended, which is why the row lock is there.
- Development results, for comparison: 2180 fields across 254 games, zero
  conflicts, zero rows left matching, second dry run clean.
