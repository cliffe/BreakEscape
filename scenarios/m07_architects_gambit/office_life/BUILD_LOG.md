# m07 office life: slice 3 build log

Commit c36090d54 (first cut). Measurements below are NOT done yet; see HANDOVER.md.

## Static checks (all on c36090d54)

- Validator: 0 errors, 31 warnings (baseline 30). New: V4 x2 (adaeze, gwen attackable mid-walk), justified: the 10.4 attack probe is the check that clears them. The agent_0x99 onceOnly-pair warnings are the existing family.
- Office summary: only adaeze_okafor and gwen_pritchard rows added (NPC count 8 to 10).
- Positions: only `["operations_floor","ops_cooler","water_cooler",[]]` added.
- Lock/key diff: empty.
- Ink compiles (10 files, 0 failed); dialoguelint: no findings on both operator files.

## Open conflict: exchanges not wired

Four exchange lines exceed the validator's 40 character bubble limit (an ERROR): ex_last_two 1 (56), ex_last_two 2 (45), ex_going_now 2 (42), ex_going_now 3 (44). Line text was not changed. The exchanges block was left out of the scenario so it validates; an ERB comment marks the spot in adaeze_okafor (before `eventMappings`). Ready block, to add once the user shortens the four lines (suggestions: "The board still has us down as missing." 39; "Someone should have crossed us off." 35; "Two minutes and I'm out of the door." 36; "The fire marshal won't thank us." 32):

```json
          "exchanges": [
            { "with": "gwen_pritchard", "knot": "ex_last_two", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false } },
            { "with": "gwen_pritchard", "knot": "ex_going_now", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false, "heard_ex_last_two": true } }
          ],
```

`heard_ex_last_two` and `heard_ex_going_now` are already declared false.

## Placeholders to measure

Positions Gwen tile (2,5), Adaeze tile (4,5) are estimates from the Tiled chairs (60,178) and (124,178); cooler `useFrom` is dx 0, dy -1, also an estimate.
