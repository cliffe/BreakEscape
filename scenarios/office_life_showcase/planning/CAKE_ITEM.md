# Cake item: shared spec (office_life_showcase and demo_access_tour)

Source pattern: `scenarios/test_needs_sims/scenario.json.erb:93-105` (proven in sims). Schema: `scripts/scenario-schema.json:3981` (`affordance.magnet`). Engine: `npc-needs.js` (magnet normalising :223-232, placement :850-863, servings :884-889 and :1047-1051, finish :1094-1095); `item-drop.js:65`.

## Item

- id `cake`, type `cake1`, name "Cake". Held from the start in `startItemsInInventory`, `takeable: true`, `droppable: true`.
- The player drops it from the inventory ("Drop here"). Beside a table it goes on the table top (`item-drop.js:9-11`). Dropping is the cue. Holding the cake until then is what makes the cue: any loaded object with `affordance.magnet` is registered when its room loads (`scanMagnets`/`_noteMagnets`, `npc-needs.js:866-881`), so a cake that starts lying in a room is a live magnet at once, known to everyone in that room with a matching need. Start it in a room only if the cake should be known from the start.
- Food affordance: `satisfies ["hunger", "social"]`, `restores 40`, `useSeconds 12`, `capacity 3`, `chatter "cake"`, `useSound "eat_snack"`.
- Magnet (office_life_showcase built values): `tempt 45`, `servings 2`, `perPerson 1`. No `announce`/`newsRadius`: the tour drops the cake in the one shared room, so everyone sees it by sight and nobody is told, and the `news_cake` pool was dropped. `tempt 45` (not the originally planned 30) was tuned around the kitchen presets (fridge restores 80, microwave 60), so lunch eaters come back fuller; proven live in a natural run with three tempted and one "Missed it.". demo_access_tour keeps the minimal variant below.

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

No onceOnly is needed for the cake. A task ticked on `magnet_finished:cake` needs no `onceOnly`, because `completeTask` returns early on a completed task (`objectives-manager.js:742-744`). Reload, from code: a drop is saved on the server as a room object (`sourceType 'player_drop'`) with its room-relative position, and the item leaves the server inventory (`persistDrop`, `item-drop.js:16-18`, `:355-393`); on reload the room places it from that position, `scanMagnets` registers it again, and its servings come from `cake_servings`. office_life_showcase proves this live as build check BC1 (its PLAN.md, section 10): cake held, cake down untouched, one slice gone, and cake finished, each reloaded on a fresh game. The access tour can rely on BC1's result rather than run its own.

## Pools the scenario must declare (scenario-level `chatter`)

Copied from sims (all 40 characters or fewer):
- `cake`: "Who's the cake from?", "Go on, just a small slice.", "Whose birthday is it?", "This is really good."
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
- The numbers above are checked: the band is 30 to 60, `initial` 50 sits inside it, urgent only after 40 minutes; `servings 2`, `perPerson 1` and capacity 3 let both eat; `cake_servings` takes the declared global (`npc-needs.js:884-889`), and the schema requires it to equal `servings` (`scenario-schema.json:3981`).
- Two ways to drift from this variant, and what each costs: (1) starting the cake in a room (say the kitchen) instead of the inventory makes it known at load to anyone in that room with hunger, so the drop is no longer the cue. The validator still warns about such a cake (`scripts/validate_npc_needs.rb:275-277`: "has affordance.magnet but is not a droppable item the player holds; only a dropped magnet is built ... so it draws nobody"). That warning is stale: the engine registers a magnet lying in a room when the room loads (`scanMagnets`, `npc-needs.js:872-881`, from `_onRoomsLoaded`, `:1274`) and NPCs there learn of it by sight on their next tick (`_sight`, `:958-970`), and V10 already treats a room magnet as live (`fixed_magnet?`, `scripts/validate_office_life.rb:996-998`). A scenario that takes this route records the warning as known and expected in its validator notes and does not count it against a clean run; the one-line validator fix goes to the engine backlog. Neither tour takes this route, so neither sees the warning; (2) giving the two NPCs more needs than hunger (caffeine, work) means either may be away when the cake goes down; she then learns of it by sight on her return (`npc-needs.js:958-970`, `:1416`), so the cue still works, only later.

## Snippet to copy (into `startItemsInInventory`)

This is the generic template (word-of-mouth variant). office_life_showcase built it with `tempt 45` and no `announce`/`newsRadius` (see the Magnet note above): the tour drops the cake where everyone can see it, so nobody is told, and `45` was tuned to the kitchen presets.

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
