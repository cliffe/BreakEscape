# m06 office-life plan review, round 2

Reviewer tier: planning (full read, aimed at what round 1 did not reach). Counts: B=0 M=5 m=10

## Findings and outcomes

1. MAJOR. The need is `caffeine`, not `coffee`: the coffee preset satisfies `caffeine` (`public/break_escape/js/data/office-presets.json`; schema `:4844`; `scenarios/test_needs_sims/scenario.json.erb:570`). Fixed: renamed everywhere; `coffee` stays only as the pool name.
2. MAJOR. `cooldown` is milliseconds (`npc-manager.js:1279` to `:1282`); `240` meant 0.24 s. Fixed: `240000`, unit stated.
3. MAJOR. `needs.print` object form requires `producer` (schema `:5107`; `npc-needs.js:1119` to `:1122`). Fixed: `producer: "floor_copier"`, copier given that id.
4. MAJOR. `habits.print` had nothing to print (needs an `onUse` revealOutput hook and a `work` need); no `outputOf` slot declared; one slot would be recycled by later prints (`npc-needs.js:3884` to `:3891`); slot text belongs to the slot. Fixed by option (a): no routine printing, one dedicated slot `tomasz_settlement_page` filled only by Tomasz's command; reload loss of an untaken page accepted and stated.
5. MAJOR. `tomasz_laptop` declared as `laptop1` with no position lands at random (`references/mapping-patterns.md:15`). Fixed: `type: "laptop1"`, `sprite: "laptop"` (sprite search `core/rooms.js:2449` to `:2455`), build check for a single laptop.
6. MINOR. Magnet fields incomplete: `droppable` (`item-drop.js:122`), id must be `pizza` for `pizza_servings` (`npc-needs.js:887`), `tempt` band (`:1678` to `:1694`), `restores`, `useSeconds`. Fixed.
7. MINOR. `mini_fridge` needs `officeType: "fridge"`. Fixed, made definite.
8. MINOR. pc claim order; twins do not hide (`core/rooms.js:2519`). Fixed: twins dropped, array order stated.
9. MINOR. Dani's mapped breaks not gated on trouble (`references/mapping-patterns.md:97`). Fixed: `!globalVars.floor_staff_ko` added (also on the print command).
10. MINOR. `habits.screen` values missing; workstation globals are two (`workstation-state.js:50` to `:51`). Fixed.
11. MINOR. Desk phone `useFrom` missing (schema `:5484`); no call pools (`validate_office_life.rb:846`). Fixed: `useFrom`, `phone` pool for Lerato, `phone_message` for Tomasz.
12. MINOR. A knocked-out NPC never walks home (`npc-hostile.js:124` to `:140`). Fixed in 2.4 and 10.4.
13. MINOR. Voicing low: pools voice per speaker (schema `:227`, `:4935`). Fixed: one pool per NPC, about 60 clips, table in section 6.
14. MINOR. Exchange 1 had no owner record. Fixed: on Tomasz, `with: "trader_npc"`, `ink/m06_npc_trader.ink` untouched.
15. MINOR. Cast diversity deferred (`VOICE_CAST.md:92`, `:119`). Fixed: spread and change of employer recorded in QUESTIONS Q0.

Verified, no finding: HaX tail comma (`erb:1664` to `:1680`); credits entry shape (`erb:232` to `:297`); `needsHome` tile form (schema `:4882`), `needsRooms`, `answersPhones` (`:4941`), `deskPhone` (`:5484`), object `offWhen` (`:5481`); `room_entered` fires each entry (`core/rooms.js:3231` to `:3236`); room NPC mappings register on load (`npc-lazy-loader.js:96` to `:105`); slow decay feasible (schema `:4849`); V2 clear for Dani (`validate_office_life.rb:436` to `:455`).

Not checked: V5 traced in full; V8 caps; `affordance.overhearRadius` in the affordance schema; Tiled y conventions.
