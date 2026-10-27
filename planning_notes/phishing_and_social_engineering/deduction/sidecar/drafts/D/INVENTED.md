# Fixture D draft: values invented where the plan is silent or ambiguous

Plan: `DEDUCTION_IMPLEMENTATION_PLAN.md`, read at 3327 lines. Another workflow edited it while I worked: it
was 3344 lines when I finished. §9.4 itself is word for word the same, now at lines 2325-2466 (17 lines
lower). Line numbers below refer to the 3344-line version. In `scenario.json.erb` each invented value carries a `_note` (or a sibling `_note_<key>`
where the key's container is a map that a note key would corrupt: `globalVariables`, `social.characters`,
`startPosition`), starting "invented: plan silent".

Files: `scenario.json.erb` (pure JSON, no ERB tags, parses with `json.load`), `mission.json`,
`ink/*.ink` plus compiled `ink/*.json` (inklecate clean; `loopcheck` clean on all eight; `dialoguelint`
reports no rule hits), `bridges/bridge-deduction-d.jsonl` (158 commands) and
`bridges/bridge-deduction-d-fail.jsonl` (48). Every eval `fn` parses.

## A. Plan silent: invented values

| # | What I invented | Where in the draft | Plan line(s) |
|---|---|---|---|
| 1 | Every character name and the cast mix: Akiko Sato, Mei Chen, Pieter de Vries, Dmitri Volkov, Kwame Mensah, Lowri Hughes (steward), Ezra Lindgren (conductor), Nadia Rahman (guard); roles "Passenger, carriage N" | NPC `displayName`, `social.people` | 1882 ("placeholder names … chosen by the fixture packet"), 2334-2340 (surnames only) |
| 2 | Sprites for all NPCs and the player (existing sheets, placeholders) | NPC records, `player` | 1882 |
| 3 | Room type `room_office` with `door_sign` "Carriage N"; every position | `rooms.*` | 2330 (cars in a line; no room art named) |
| 4 | **Door locks**: `lockType: "rfid"`, `requires: "d_door_release"`, a card nobody has, so only the guard's `unlockDoor` opens a carriage. A key lock would be pickable with the start lockpick. The validator will warn "no item declares rfid 'd_door_release'" (m09's restricted_stacks has the same warning) | `d_car2`..`d_car5` | 2330-2331 ("locked until the stop before it"; lock type not given) |
| 5 | Guard backstops copied from m09's HaX: `door_unlock_attempt` retries and `game_loaded` re-unlocks per stop, plus a "That door stays shut till the next stop" bark, and one bark per stop | `ded_d_guard.eventMappings` | 2348-2351 (only the four `d_stop_<n>` mappings) |
| 6 | A phone item in `startItemsInInventory` (`phoneId: player_phone`, `npcIds: ["ded_d_guard"]`), needed for a phone NPC | top level | 2348-2349 |
| 7 | Start inventory contents: lockpick and fingerprint kit (implied by the briefcase and the glass, never listed for D) | `startItemsInInventory` | 2371, 2367 |
| 8 | The 30 s warning is its own timer (`d_stop_<n>_warn`, 90 000 ms, `actions: [hint]`, `condition: "!globalVars.d_stop_<n>"`), because the timer dispatcher reads no warning field. The condition stops a "slowing" hint after a stop the player already brought forward. Hint title "Night train" | `timers` | 2387-2389, 1659-1660 |
| 9 | Timer `label`, `showCountdown: false`, `onceOnly: true` | `timers` | 2387-2389 |
| 10 | Item and object ids the plan does not name: `d_rack_label`, `d_chen_ticket`, `d_chen_coat`, `d_lost_property`, `d_sato_notebook_item`, `d_newspaper`, `d_devries_phone`, `d_shred`, `d_briefcase`, `d_volkov_letter`, `d_brass_key`, `d_backup`, `d_mensah_ticket`, `d_door1`..`d_door4`, `d_board_notes`, `d_board_call` | `rooms.*.objects`, `triggers.where` | 2357-2374, 2390, 2420 |
| 11 | Global `d_shred_done`, the shredded document's `stateWrites.onComplete`, that `t_d_shred` keys on | `d_shred`, `t_d_shred`, `globalVariables` | 2362 ("on its global", unnamed) |
| 12 | Declaring the four backup-recovery globals (`backup_restore_initiated` false, `backup_recovery_source` "", `recovery_eta_hours` 0, `backup_reinfected` false), as m02 does | `globalVariables` | 2368, 1805-1807 |
| 13 | All `backup_recovery` `minigameData` (one source, `needs: []`, no key slots) and the object's framing as a "lost-phone kiosk" | `d_backup` | 2368 |
| 14 | Shredded document content, strip count 8, `allowRotation: false` | `d_shred` | 2362 |
| 15 | The briefcase lock: key-type lock with pins and no key (picked, as m01's briefcase); the notes item inside is a typed letter plus an empty velvet tray, so the clue reads "carries the key on his person" and does not need a second physical key | `d_briefcase` | 2371 ("lockpick, a notes item") |
| 16 | Volkov's held key: `type: "key"`, pins, opens nothing | `ded_d_volkov.itemsHeld` | 2371 |
| 17 | Fingerprint difficulty "easy"; de Vries's prints on `d_glass` only (§7.7) | `d_glass` | 2367, 1671-1676 |
| 18 | Every fact `text`, `label` and `source` | `social.intelFacts` | 2355-2374 (ids, clues, routes only) |
| 19 | Every clue label ("was in the Archive", "brass Tesseract key", …). Slot labels and profiles come from fixture A | `deduction.clues` | 2331-2332, 2011-2020 |
| 20 | `tamperText` "The train stops. When it pulls away, a clue you had not found yet has gone with it." | `deduction` | 468 (default exists; D gives none) |
| 21 | `debrief.closingLine` | `deduction.debrief` | 474 (optional) |
| 22 | Character band-flag globals `ded_d_<w>_wary`, `ded_d_<w>_reported`, `ded_d_<w>_latched` (""), influence globals, `channels.person` | `social.characters`, `globalVariables` | 2376-2377 ("default thresholds") |
| 23 | The `reports` threshold sets a flag that nothing reads; there is **no** witness-report tamper in D. Answers never take a witness below −30, so −60 is unreachable | `social.characters` | 2376-2379 (silent on a report beat), 1661-1662 |
| 24 | `koImmune: true` on the steward and the conductor. The conductor is the only recovery route for `d_sato_pass`; a KO would strand a strict case, and DL6 does not model a witness KO | NPC records | 2376-2379 |
| 25 | Witness topic wording, the kind words ("You've kept that tea going all night", "let me hold the ticket box"), vague answers, re-entry lines | `ink/steward.ink`, `ink/conductor.ink` | 2376-2379, 1519-1572 |
| 26 | The kind word is gated on an ink VAR (`<w>_kind_given`), not a `*` choice, because `*` state resets on reload and the plan says "once-only" | same | 2378, 1526 |
| 27 | Ink for Sato, de Vries and the guard (the plan lists no topics for them) and every suspect line beyond the plan's three topic names; reaction choices gated on clues the player holds (no grants, no clearing) | `ink/sato.ink`, `ink/devries.ink`, `ink/guard.ink`; extra lines in `chen`, `volkov`, `mensah` | 2363, 2372, 2374 |
| 28 | Mensah's topic text "Is that your umbrella?" (plan: "Mensah's ink") | `ink/mensah.ink` | 2374 |
| 29 | Guard ink: a choices-only phone hub that reads `d_stop_1..4` and `deduction_closed` for "When's the next stop?" | `ink/guard.ink` | 2347-2351 |
| 30 | `scenario_brief` prose around the verbatim profile texts and `briefText`; place name "Miskatonic Halt"; `show_scenario_brief: "once"` | top level | 2331, 1710-1715 |
| 31 | Aim id `d_case`, aim and task titles and description | `objectives` | 336-337 ("two tasks in one aim") |
| 32 | Music: the loss playlist `threat` (the plan says only "non-victory"); `autoStop`, `disableClose`, `fade` copied from lab_social_engineering; both closing cards; every credits line (outcome-conditioned per suspect); the win entry's subtitle | `music.events` | 2425-2429, 1727-1739 |
| 33 | `set_global d_ending` with `value: true` | `stakes.onClose` | 2425-2426 |
| 34 | No `closeHint` (only required for `anytime`) | `deduction` | 275-277 |
| 35 | `mission.json`: display name, description wording, `difficulty_level: 1`, and `"scoring": "tasks"` written out rather than omitted (the plan says "the default") | `mission.json` | 2328, 1880-1881 |
| 36 | Door-object sprite: `type: "notes"`, non-takeable, as a stand-in | `d_door1`..`d_door4` | 2390 |
| 37 | Bridge mechanics: the board `getTestState()` field names (`board.deduction.suspects[].cells[].state`, `board.view`, `board.debrief.noBlame`), the gameConfirm click by button text, the shredded document finished through `_onComplete()`, the backup through `commitSelection()`, the lockpick through `completeLockpick`, marks set through `runtime.setMark` (all logged as exercised, not earned) | `bridges/*.jsonl` | 2435-2459, 1474-1492 |

## B. Plan ambiguous, or something the real packet should settle

1. **Door objects after their stop.** The plan gives the object and its warning but not what happens after
   the stop. In my draft, using it again shows the same warning and confirming does nothing (the trigger is
   `once`). That reads wrong. The real fixture should switch the object's text after the stop
   (`observationVariants` on `d_stop_<n>`) or hide it. Plan 2390-2396.
2. **Backup recovery side effect.** `commitSelection` schedules a delayed reinfection when
   `network_isolated` is not true (`backup-recovery-minigame.js:340-345`), so D's kiosk can later set
   `backup_reinfected` and toast. The plan does not mention it. Either declare `network_isolated: true` in
   D, or mark the source so it skips the reinfection. Plan 2368.
3. **Sato's notebook "carried".** The only route is a notebook in lost property, so the fact says she
   *owns* one, not that she carries it. The fact text has to stay true (plan 515), so I wrote "handed in to
   lost property" and left the clue in the carry slot. Worth a line in the real fixture or a different
   route. Plan 2364.
4. **Chen's coat as a pickup.** "A notes pickup" (2362) means the player picks up a coat. I kept it, with
   text describing the pocket. A note in the pocket would read better in a real mission.
5. **First-punch warning in the fail bridge.** The bridge's `debugKO` skips the swing and may not emit
   `npc_attacked:<id>` with `wasFriendly`, which the warning listens for (§5.5). The fail bridge notes a
   fallback (one real punch first). Plan 2450-2451.
6. **"Wants peace"** is in the suspect table (2338) but fixture A has no such clue, so its label is
   mine. The count of 1 comes from the plan ("the other wants 1", 2341).
7. **Tamper list per stop.** The table (2398-2403) gives one fact per stop, so each `deduction_tamper`
   lists one fact. If the player already holds it, that stop destroys nothing. That matches the rule
   ("first not held"), but it means a careful player never sees a fade. The plan may want a longer list
   per stop (for example stop 2: `[d_chen_charm, d_chen_notebook]`) so that a stop always costs something.
   I did not change it.
8. **Hand-check note.** D's opening room holds a loose route (the rack label), so `d_sato_pass` counts as an
   opening fact even though stop 1 can fade it. The plan's DL8 hand check (2405-2414) already counts it,
   so this agrees; I only flag that the opening facts include a fadable one.
