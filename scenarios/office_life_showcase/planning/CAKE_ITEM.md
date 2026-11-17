# Cake item: shared spec (office_life_showcase and demo_access_tour)

Source pattern: `scenarios/test_needs_sims/scenario.json.erb:93-105` (proven in sims). Schema: `scripts/scenario-schema.json:3981` (`affordance.magnet`). Engine: `npc-needs.js` (magnet normalising :223-232, placement :850-863, servings :884-889 and :1047-1051, finish :1094-1095); `item-drop.js:65`.

## Item

- id `cake`, type `cake1`, name "Cake". Held from the start in `startItemsInInventory`, `takeable: true`, `droppable: true`.
- The player drops it from the inventory ("Drop here"). Beside a table it goes on the table top (`item-drop.js:9-11`). Dropping is the cue: there is no other way to place a magnet (it must be a droppable held item).
- Food affordance: `satisfies ["hunger", "social"]`, `restores 40`, `useSeconds 12`, `capacity 3`, `chatter "cake"`, `useSound "eat_snack"`.
- Magnet: `tempt 30`, `servings 2`, `perPerson 1`, `announce "news_cake"`, `newsRadius 5`.

## How NPCs react

- An NPC learns of the cake by sight (it is in the cake's room: `npc_saw_magnet:<npcId>`) or by word (a knower back in its own room tells everyone within `newsRadius` tiles once: `npc_told:<id>`, line from the `news_cake` pool).
- A known cake tempts a need it satisfies while that need is at or below `urgentAt + tempt` (capped at 95). An urgent need prefers a known magnet.
- They walk over and eat. A serving is taken as eating starts (`magnet_serving:cake`) and written to the engine-owned global `cake_servings`.
- When the last serving goes, the cake is removed (`magnet_finished:cake`). Anyone still walking turns back with reason `gone` and a line from `grumble_gone` ("Missed it."). The same happens if the player picks the cake up.
- Avoidance blocks telling both ways (an NPC with `needsCompany.avoids ["*"]` is never told and tells nobody).
- `magnet_unreachable:cake` fires if dropped where no NPC with a matching need may go.

## Globals and sync cost

| Key | Kind | Bound | V8 row |
|---|---|---|---|
| `cake_servings` | engine-owned integer, declare at 2 | 0 to 2 | magnet servings 1/2 |
| (cake as a carried magnet) | item | one | dropped magnet items 1/2; office-life items 1/4 |

No onceOnly is needed for the cake. A task ticked on `magnet_finished:cake` needs no `onceOnly`, because `completeTask` returns early on a completed task (`objectives-manager.js:742-744`). Unchecked: how a dropped item's position is saved across a reload (sims README says carries replay on reload; not traced in code).

## Pools the scenario must declare (scenario-level `chatter`)

Copied from sims (all 40 characters or fewer):
- `cake`: "Who brought cake in?", "Go on, just a small slice.", "Whose birthday is it?", "This is really good."
- `news_cake`: "Someone's brought a cake in!", "There's cake going, if you're quick.", "Cake! It's somebody's birthday."
- `grumble_gone`: "Missed it."

The access tour can drop `news_cake` and the `announce` field if nobody needs telling; then no news line plays (picture only is not shown either, since there is no announce).

## Minimal variant for demo_access_tour

Need: on cue, the cake empties two desks (Thandiwe Moyo and Yasmin Chaudhry, open-plan room); overlay off; no task depends on it.

- Cue: the host asks the player to put the cake down in the open plan. Dropping it there is the cue. Both NPCs are in that room, so they learn by sight at once.
- Make both NPCs tempted for the whole tour without ever going hungry on their own: give each one need only, with a slow decay and an initial level inside the tempt band:
  - `"hunger": { "decayPerMin": 0.5, "urgentAt": 30, "initial": 50 }` (band is at or below 60; urgent only after 40 minutes, longer than the 35-minute tour). A reload resets needs to `initial`, which is still in the band.
- `needsHome`: each one's own desk PC. No other needs, so they sit at their desks until the cake is known.
- `servings 2`, `perPerson 1`: one slice each, nobody misses out, the cake is gone (`magnet_finished:cake`), and both walk back to their desks.
- Overlay: leave `needsDebugOverlay` out (default off). `showPressingNeeds` is the tour's choice; with `npcThoughts` on (default) a cake bubble shows over each walker.
- Optional guard bark if the cake goes down elsewhere: a mapping on the host, `magnet_placed:cake` with `"condition": "data.roomId !== '<open_plan_id>'"`, bark "Bring it over to the desks." (no onceOnly needed if it carries a cooldown). Plain `bark` text, voiceable.
- No task, no `onceOnly`, so the onceOnly row is untouched.

## Snippet to copy (into `startItemsInInventory`)

```json
{
  "type": "cake1",
  "id": "cake",
  "name": "Cake",
  "takeable": true,
  "droppable": true,
  "observations": "A cake for the office. Choose Drop here in your inventory to put it out where people will see it.",
  "affordance": {
    "satisfies": ["hunger", "social"], "restores": 40, "useSeconds": 12, "capacity": 3, "chatter": "cake", "useSound": "eat_snack",
    "magnet": { "tempt": 30, "servings": 2, "perPerson": 1, "announce": "news_cake", "newsRadius": 5 }
  }
}
```

And in `globalVariables`: `"cake_servings": 2`. And the three pools above in the scenario-level `chatter`.
