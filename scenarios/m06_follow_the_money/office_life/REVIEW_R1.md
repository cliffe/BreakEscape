# m06 office-life plan review, round 1

Reviewer tier: planning (full read). Partial: the reviewer stopped at its context guard; the unreviewed items are listed at the end and carried to round 2.

Counts: B=0 M=6 m=3

## Findings

1. MAJOR, plan 2.4, 3.1, 3.2, Q1. Making Dani and Priya owners of their PCs makes them "holding" under D78 (skill SKILL.md:72: the owner of a workstation is holding), so they may not move. Fix: drop ownership and screen habits for both, or record a D78 exception for the user.
2. MAJOR, plan 2.7, Q4, 2.2. Priya's ink places her in the lab on repeat visits: hub re-entry lines "Someone said Irina's out cold on the trading floor" (`ink/m06_npc_analyst.ink:124`) and "Someone said Irina's been detained" (`:127`) treat the trading floor as elsewhere; repeatable knot pattern_concerns "Look at this... #delivery: showing her working" (`:323`); "It's all in my write-up on the desk" (`:347`). Fix: apply the fallback now; Priya stays in the lab with no needs, only Dani moves.
3. MAJOR, plan 2.5. One decay rate cannot both keep Dani at post until first talk and send him for coffee every four to six minutes; the trading floor loads early on the critical path (Irina) but Dani is optional, so he would drift before most first meetings and "watches six price charts" (`ink/m06_npc_trader.ink:36`) would play at the coffee point. Fix: very slow natural decay; mapped breaks (for example `room_entered:trading_floor` with condition `trader_spoken`, cooldown about 240 s) supply the rhythm.
4. MAJOR, plan 10.4. "cover_strained unchanged" is wrong for Dani, Priya and Irina: existing HaX mappings (`erb:1459` to `:1470`, an ERB loop over trader_npc, blockchain_analyst, irina_volkova) set `cover_strained` on `npc_ko`; the guard has its own (`:1445` to `:1453`). Fix: expect it set by those existing mappings, unchanged only for Lerato and Tomasz; say so in 2.2 and 2.4. Office life itself still never sets it.
5. MAJOR, plan 0, 9, people table. "No KO credits line is possible" is wrong: the music credits list (`erb:232` to `:297`) takes conditional entries and already has `trader_ko` and `analyst_ko` lines. Fix: add credits lines for `lerato_ko` and `tomasz_ko` (SKILL.md:115).
6. MAJOR, plan 8, 3.1. Field list leaves out workstation fields: without `workstation: true` (or `lockChance` / `locksScreenOnLeave`) the object is not a workstation (`workstation-state.js:105`), so no `_owner_away` globals exist and the screen habit does nothing. Also missing: `readable`, `readDisplay`, `addToNotes`, `text`. Unchecked whether a `type: "pc"` with `readable: true` shows text or a PC screen; `references/mapping-patterns.md:20` says a readable non-PC uses `laptop1`.
7. MINOR, plan 3.4. Partly answered: with a tile home `_atOwnPost` is false (`npc-needs.js:3266` to `:3269`), so every trip emits `npc_left_post` (`:3279` to `:3290`); `ownerPresent` reads `atPost` (`workstation-state.js:676` to `:680`). Looks like it follows; still to confirm the return to a tile home sets `atPost` (`npc-needs.js:1488`).
8. MINOR, plan 2.9, 8. HaX's mapping list ends with an ERB `pairs` loop whose trailing comma is computed (`erb:1664` to `:1680`); new mappings go after it and the comma logic must change.
9. MINOR, plan 3.3. The safe code's hint is not on the forbidden list: `mixing_analysis` (lab) carries "21M cap. Last coin due around 2140." Fix: ban lore or chatter about the bitcoin cap, 2140 or "the last coin".

Verified, no finding: `irina_arrested` (`erb:752`) and `assets_seized` (`:748`) are declared; `floor_staff_ko` does not exist yet; cited lines checked are accurate; Dani's ink places him only by first meeting and "It's on the desk" (`:256`), fine on the same floor.

Not reviewed (carried to round 2): magnet `satisfies: ["hunger"]` tempting only NPCs with that need; `answersPhones`; the forgotten-print mapping shape; `offWhen` on `mini_fridge` and the photocopier; Tiled decor `pizza_boxes1` as a takeable magnet (`core/rooms.js` near `:2139`); `npc-hostile.js`; schema field names; V2; sync sums; cast diversity.

## Outcomes

1. Fixed: Dani owns no PC; screens only on the extras' machines (Tomasz's laptop). Dani-owns-PC kept as Q1 option (b), a D78 exception, with plan 3.4 as its build check.
2. Fixed: Priya stays in the lab with no needs; exchange 1 becomes Dani and Tomasz.
3. Fixed: slow natural decay plus a conditioned `room_entered` mapped break.
4. Fixed: 2.2, 2.8 and 10.4 now state the existing `cover_strained` mappings.
5. Fixed: credits lines for `lerato_ko`, `tomasz_ko`.
6. Fixed: section 8 and 3.1 name the workstation and readable fields; the laptop is `laptop1`, matching the readable shape.
7. Fixed: evidence moved into 3.4; the return check stays a build-time live check.
8. Fixed: 2.9 states the comma change.
9. Fixed: added to 3.3.
