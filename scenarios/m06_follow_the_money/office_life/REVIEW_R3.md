# m06 office-life plan review, round 3

Reviewer tier: planning (full read of the plan, focus on the round-2 changes and what round 2 left unchecked). Counts: B=0 M=3 m=8

## Findings and outcomes

1. MAJOR. `sprite: "laptop"` claims the Tiled laptop but draws a missing texture (`core/rooms.js:533`, `:538` to `:542`; `game.js:1447` to `:1453` loads only laptop1 to laptop7). Fixed: `type: "laptop1"`, `position: "as-type:laptop"` (`core/rooms.js:2443` to `:2450`), no `sprite`; build checks texture key and position.
2. MAJOR. Copier slot under-specified: needs an explicit tray `position` (the floor's only Tiled notes sprite is claimed by `daily_trading_report`, `erb:1984`), takeable or `readDisplay`, a named and declared `revealOnGlobal` (as m02 `erb:2363` to `:2367`, `:3813`). Fixed: `tomasz_handover_sheet`, `revealOnGlobal: "tomasz_handover_sheet_shown"`, explicit position, `takeable`, `readable`, `addToNotes: false`. Engine check: the print command works with no `habits.print` (`npc-needs.js:1124` to `:1126`, `:3990` to `:3991`); the build hedge is removed.
3. MAJOR. Secrets list missed the fund puzzle (`erb:69` to `:75`: settlements-to-custody file, fee and dwell config, custody slots, UTC deposit times), the server-room passphrase convention (`erb:53`, lock `erb:2020`) and the data centre PIN's white-paper date (`erb:2160`); Tomasz as a "settlements clerk" with a "settlement summary" printout sat on the fund puzzle. Fixed: Tomasz is now an evening client-support lead with a shift handover sheet; 3.3 bans settlements, custody, slots, escrow, fees, percentages, dwell or minimum times, UTC timestamps, dollar amounts, any four-digit number, 2025 or "this year", passphrase or IT conventions, the white paper and 31 October.
4. MINOR. Dropped pizza draws the generic picture (`item-drop.js:75` to `:79`). Fixed: `sprite: "pizza_boxes1"`.
5. MINOR. `lockIfAwayOverSeconds` contradiction between 2.4 and 10.5. Fixed in 10.5.
6. MINOR. Owned workstation has three globals (`workstation-state.js:56` to `:57`, `:622`; `validate_office_life.rb:529`, `:803`). Fixed: `tomasz_laptop_accessed` added.
7. MINOR. `affordance.capacity` and `affordance.chatter` needed for pairing (`npc-needs.js:4411` to `:4413`). Fixed in 3.1 and section 8; queue-cell clash with the copier added as a build check.
8. MINOR. Phones lacked `type` and order. Fixed: both `type: "phone"`, `lerato_phone` first.
9. MINOR. Exchanges 2 and 3 lacked `with` (schema `:4944`). Fixed.
10. MINOR. New globals not said to be declared. Fixed: one line in section 7, plus the V8 cap figures.
11. MINOR. "Forgotten print waits" was wrong (`npc-needs.js:1131`, `:3935` to `:3943`). Fixed: never printed if `floor_staff_ko` comes first.

Verified, no finding: print command without `habits.print`; `lerato_desk` claim order; `officeType: "fridge"`; off machines skipped as targets (`npc-needs.js:1750`, `:4970`); V5 traced (`validate_office_life.rb:62` to `:66`); V8 caps (`:766` to `:770`); exchange gates set in ink (`ink/m06_npc_irina_volkova.ink:594`; `ink/m06_phone_agent_0x99.ink:575`; `ink/m06_satoshi_confrontation.ink:378`); story rules; text style.

Not checked: Tiled y conventions for Dani's post and `useFrom` values; coffee queue cells against the copier (now a build check); `habits.screen` semantics beyond round 2.
