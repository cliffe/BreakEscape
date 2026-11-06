# Fixture A draft: what was invented

Draft of `scenarios/test_social_deduction_a/` from `DEDUCTION_IMPLEMENTATION_PLAN.md` §9.2 (plan read at
3,327 lines, 2026-10-22). "Line" means the plan line where the plan is silent or unclear. The same values
carry a `"_note"` key in `scenario.json.erb`.

## Plan gaps and conflicts (worth fixing in the plan)

| # | Plan line | Problem | What the draft does |
|---|---|---|---|
| G1 | 2106-2109 against 2141-2149 | `t_a_thrown_out_end`'s condition `globalVars.a_thrown_out` fires on any close after the third wrong call. In `bridge-deduction-a-wrong` the player says "Not yet" at A4 and later closes through "Go in" at A7, which sets `a_case_closed`, so the evening ends at Finish and the player never reaches the sanctum. That contradicts A7's acolyte check | "Get out" sets `a_left_early`; the trigger's condition is `globalVars.a_thrown_out && globalVars.a_left_early` |
| G2 | 2012-2013, 2016 | The sanctum is a "locked door (no key)", but the start inventory has a lockpick, and a lockpick opens any key lock. The player could pick the sanctum and skip HaX's warned close (and DL8's "beyond the close" set would be wrong) | `lockType: "rfid"`, `requires: "a_sanctum_seal"`, with no card in the scenario |
| G3 | 2094 | `#unlock_door:a_sanctum` from HaX's ink goes through the server's NPC unlock check, which needs `unlockable: ["a_sanctum"]` on the NPC record (`game.rb` `validate_npc_unlock`) and an "encountered" NPC. The plan does not say so | `unlockable: ["a_sanctum"]` on `ded_a_handler`. Whether a phone NPC counts as encountered once called is unchecked |
| G4 | 2016 | The start inventory lists the lockpick and fingerprint kit only, but HaX is a phone NPC and the player has no phone | Adds `player_phone` with `npcIds: ["ded_a_handler"]` |
| G5 | 2026, 2083 | The camera route is called both a trigger (`t_a_camera`) and "the monitor's `triggerOnInteract`" | The monitor's `triggerOnInteract` shows a `hint` and emits `a_camera_viewed`; trigger `t_a_camera` on that event grants the fact; the route gets `room: "a_archive"`, because §8 cannot infer a room for a custom event. A plain `object` route on `a_camera` would be simpler and lint-clean |
| G6 | 2007-2008, 1189 | The coats are notes items whose triggers read `!a_lodge_suspicious`, but a notes item's text is shown whatever the trigger does. After a wrong call the player would read "a ward charm in the lining" and get no fact | Each coat has a `textVariants` entry on `a_lodge_suspicious` ("someone got here first, pockets empty") |
| G7 | 2032, 508 | Marsh's burner SIM has no authored route (favour only, and the favour route is implicit). The plan does not say whether the schema and DL18 ("every cell has at least one route") accept `routes: []` | `routes: []` with a note. DL18 needs to count the implicit favour route |
| G8 | 1653-1668 | §7.8's sample prefixes HaX's lines with `HaX:`, but house phone inks put no prefix on the contact's own lines (README_ink_best_practices, common bug 4) | No prefix in `ded_a_handler.ink` |
| G9 | 2087-2088, 1657-1667 | The credits differ by `a_key_choice`, but §7.8 sets it only for "follow" and "seize" | "Confront" sets `a_key_choice = "confront"`, and the credits have a line for each value |
| G10 | 2015-2018 | Nothing says what the brass key opens. If it opened the sanctum, the KO route would get past the warned close | The key has `keyPins` and opens no lock |
| G11 | 2010 | A `log_filter_terminal` needs more `minigameData` than the plan gives (`sis02_energy` has anomaly, threat intel and flag labels) | Only `logEntries` and `completionActions` (sets `a_badge_log_done`). The T packet completes the rest |
| G12 | 2122-2156 | The harness has no command for lockpicking, dusting or the log filter, and the punch key is not named | Each is a `note` plus a `waitFor` on the global or room it produces; the punch is `pressKey q`, marked for the T packet to confirm |
| G13 | 2021-2031 | `fingerprint_identified:ded_a_marsh` needs the biometric system to identify the owner `ded_a_marsh`. The plan does not say whether identification needs a reference sample or a registered owner | `fingerprintOwner: "ded_a_marsh"` on the glass only; the rest is unchecked |
| G14 | 2003 | The person-chat prefix check (`person-chat-minigame.js:1605`, `[A-Z][a-z]+`) and the dialogue lint do not handle accented names. "Céline" left Delacroix's file with 0 lines in dialoguelint | The draft uses "Colette Delacroix" (worth a line in §9's cast advice) |

## Values invented because the plan is silent

### Scenario top level
- `scenario_brief` wording around the verbatim profile text, `briefText` and favour rule (§7.9, line 1678-1685): a short opener, "What to look for", then the three profiles, the stakes, and the favour rule.
- `show_scenario_brief: "on_resume"`, `startPosition {5, 7}`, the player sprite `female_hacker_hood_v2` (line 2003).
- `scenario_name: "Open evening"`, `scenario_id: "test_social_deduction_a"` (from §9's folder name, line 1850).

### Cast (line 1972, 2003)
- Full names, roles and backgrounds: Dr Ifeoma Okafor (epigrapher from Lagos, fifties), Margaret Venn (retired librarian, seventies), Imogen Marsh (junior fellow, thirties), Haruka Ishikawa (book conservator, forties), Colette Delacroix (antiquarian dealer from Lyon, sixties), Callum Reid (bar staff, Glaswegian, twenties), Sunil Mehta (intern, nineteen). All five suspects are women, because the plan's hand check calls each one "her". Okafor's first name avoids Adaeze, which is already a recurring character.
- Placeholder sprites (`female_scientist_v2`, `female_office_worker_v2`, `female_blowse_v2`, `female_telecom_v2`, `female_spy`, `male_office_worker_v2`, `female_security_guard_v2`, `female_hacker_hood_v2`) and every position.
- Hostile foes' display names, sprites, `hostile` numbers (`chaseSpeed` 90 or 100, `attackDamage` 3 or 4, from m07 and m04) and a shared one-line ink (`ded_a_foes.ink`) (lines 2005, 2009, 2013).

### Rooms and objects (lines 2003-2018)
- Room `type` `room_office` for all four, door signs, and connections: hall west to the cloakroom, hall east to the archive, archive north to the sanctum.
- Cloakroom lock: `lockType: "key"`, `requires: "a_cloakroom_door"`, `keyPins`, hint (a key lock with no key, so the lockpick is the way in).
- Archive lock: `lockType: "pin"`, `requires: "2291"` (the code is the plan's), hint.
- Object ids not given: `a_locker` (container type `safe`, unlocked), `a_coat_venn`, `a_coat_ishikawa`, `a_code_note`, `a_badge_log`. Given: `a_board`, `a_wine_glass`, `a_marsh_phone`, `a_camera`, `a_reading_desk`, `a_altar`.
- Every object name, observation and text: the coats, the attendant's note ("Archive door is 2291 tonight…"), the camera hint ("slips a brass key into her jacket"), the reading-desk hint, the altar's observation, the badge-log entries and timestamps.
- `a_marsh_phone`'s type `phone` with no `phoneId`. This is a guess: it must be takeable and must not open the player's phone UI.
- `a_wine_glass` as a `notes` object with `fingerprintDifficulty: "easy"`.
- `a_reading_desk` and `a_altar` as `notes`-type plain objects that carry `triggerOnInteract`.
- The brass key's `keyPins` and observation.

### Facts (lines 1983-1985, 2021-2032)
- Fact ids follow `a_<suspect>_<clue>`. The plan names three of them (`a_marsh_wants_promotion`, `a_okafor_brass_key`, `a_venn_ward_charm`); the other 15 copy that pattern.
- Every fact `text`, `label` and `source`.
- Clue labels the plan does not give: "signed into the Archive", "in the lecture hall", "out in the garden", "wants the Codex", "wants funding", "ward charm", "notebook", "umbrella". "sigil ring", "burner SIM", "wants a promotion" and "brass Tesseract key" come from §6.2 (line 1340) and §6.4 (line 1405).

### Triggers, timers, globals
- `t_a_coat_venn`, `t_a_coat_ishikawa`, `t_a_glass`, `t_a_key_drop`: `on` and `where` as the plan says; `once` left at the default.
- Global `a_left_early` (G1) and `a_briefed` (the opening call plays once).
- Witness globals `ded_a_barstaff_*` and `ded_a_intern_*` (`influence`, `latched`, `wary`, `reported`), following §4.9's pattern for Tomás (line 759).
- No timers (the plan gives none for A).

### Social characters (lines 2005-2006, 1489-1542)
- `displayName`, `syncedVars` and threshold `icon`s (copied from `lab_social_engineering`). The thresholds are the §7.2 defaults.
- What `reports` does: it sets `ded_a_<w>_reported` only. A has no tamper, so nothing else reads it.
- The topics, which come from the clue-route table: the bar staff covers Okafor's and Venn's wants and Delacroix's umbrella; the intern covers the wants of Marsh, Ishikawa and Delacroix. The kind words: "Have one on me" for the bar staff and "You're doing fine, Sunil" for the intern.

### HaX (lines 2075-2109)
- The opening call is opened by an `eventMappings` entry on `game_loaded` with condition `!a_briefed`, plus a bark. The plan says only "HaX's opening call".
- The barks on the key sighting and on `a_thrown_out`.
- Hub topics beyond the plan: "How do I get into the Archive?" (branches on Venn's charm and `ded_a_ally_lost`), "Where do I stand?" (branches on the cost globals and whether everyone has a verdict, without counting guilty), "What now?" after close.
- The close warning adds "You haven't been through the badge log yet" when `!a_badge_log_done` (§7.5 says to mention anything obvious left undone, line 1616).
- `key_after`: HaX's reaction to "confront" or "seize", read from the outcome.
- The "Get out" and "Not yet" lines.

### Suspects' ink (line 2006, 1568-1586)
- Every line. Each suspect has a non-clue topic, so their own words grant and clear nothing: Okafor's third line of the frieze, Venn's "I told you so", Marsh's "what a fellow does", Ishikawa's re-sewn binding, Delacroix's price.
- Accusation choice text: "Accuse <name> of serving the lodge. There's no taking this back."
- Reactions for right and wrong calls.
- Venn's wrong-call line ("I'm going home"), which matches `lose_ally`'s leave.
- Marsh's ask, gated on her want fact: "I hear you're after a seat on the inner council." The plan's line follows it verbatim.
- Marsh's neutral after-favour line: she types without looking.

### Objectives (lines 2105, 2110-2116)
- Aim `a_investigate` ("Find the lodge's people") holding `a_case_solved` ("Call every guest right").
- Aim `a_conclusion` ("End the evening") holding `a_evening_over`, with `missionConclusion` and the plan's `conclusionScreen`.
- The plan names only the two tasks.

### Music and credits (lines 2110-2116)
- `playlist: "victory"`, `autoStop`, `disableClose`, `fade`, `statusText: "CLOSED"`, and a two-line `closingCard`.
- The credits subtitle "OPEN EVENING AT THE TESSERACT INSTITUTE" and the section headings THE RITUAL, THE KEY and THE GUESTS.
- Line texts the plan does not give: "The ritual began a voice short.", the three `a_key_choice` lines, "Okafor walked free with the key.", "Marsh slipped out before the doors were locked.", "Ishikawa was marked as a traitor for nothing.", "Delacroix was shown the door for nothing."
- The plan gives "Venn was thrown out of the lodge for nothing." and "You were thrown out before the ritual." verbatim.
- One playlist covers right and wrong endings. A costly case needs only the neutral header, but a victory playlist after a missed cultist may feel wrong. Worth deciding.

### Deduction block
- `debrief.closingLine`.
- `retry: 0` stated explicitly.
- `tamperText`, `earlyCollapse` and `allowEarly` left at their defaults.

### mission.json (line 1850, 1973)
- `display_name` and the description wording. The description ends "Not a mission." and states no guilty number.
- `difficulty_level: 1`.
- `scoring` is left out, so it falls back to `tasks` (the plan says A uses the default).

### Bridges (lines 2122-2156)
- Helper eval (`window.__ded`: globals, runtime state, board test state, toast spy, `call(contact)` through `interactInventory('phone')`, and `pick(rx)` through `t.minigame.choose`).
- DOM selectors and data attributes the plan does not fix: `data-suspect`, `data-mark`, `data-profile`, `.bond-visualiser`, `.bv-ticker-inner` (the last is from the plan).
- How Tab order is checked (A0: 15 `aria-pressed` buttons plus Close).
- `bridge-deduction-a-out` grants all 18 facts through `deductionRuntime.grantFact` from the console.
- The dusting, lockpicking and log-filter steps are notes plus waits (G12).
