# Fixture C draft: invented values and plan gaps

Plan read at 3,327 lines (`DEDUCTION_IMPLEMENTATION_PLAN.md`, unchanged from start to finish of this
draft). Line numbers below are from that version. §9.3 is lines 2167–2306.

## Values the plan does not give

| What | Value used | Plan line |
|---|---|---|
| Fact ids (12 cells) | `c_<suspect>_safenet`, `_field_kit`, `_burner`, `_travel`, `_alibi` | 2186–2190 (table names suspects and clues only) |
| Fact `text` and `label` for every cell | see `social.intelFacts` | 2207–2220 |
| Clue labels for `cult_burner`, `safenet_phone`, `field_kit`, `verified_alibi`, `no_alibi` | "cult-issued burner", "SAFETYNET phone", "field kit", "verified alibi", "no alibi" | 2179–2181 (labels given only for the two travel clues) |
| `marked` on non-burner clues | false | 2179 (only the burner has ✦) |
| Suspect NPC ids | `ded_c_ahmed`, `ded_c_novak`, `ded_c_baptiste` | 2186 (surnames only; pattern from §4.9 and §9.2) |
| HaX's NPC id | `ded_c_handler` (by analogy with `ded_a_handler`) | 2194 |
| Full names, roles, sprites, positions | Tariq Ahmed (archivist, sixties), Irena Novak (comms, forties), Odile Baptiste (courier, late twenties); `male_scientist`, `female_spy`, `female_telecom_v2` | 2186–2190, 1852 |
| `c_waiting_<id>` spelling | `<id>` = the full suspect id, e.g. `c_waiting_ded_c_novak` | 2247–2252 |
| Room types, door directions, object positions, start position | lounge room_office, comms room_closet, bedroom room_office, office room_ceo, garage room_servers; N office, E bedroom, W garage, S comms | 2194–2201 |
| Keycard lock id | `c_safehouse_card` (`opens_lock` of `c_keycard`, `requires` of bedroom and comms doors) | 2195–2197 |
| Novak's badge ids | `rfidCard.card_id` and garage `requires` `c_novak_badge`; itemsHeld keycard id `c_novak_badge_card`; name "Novak's badge" (matches `t_c_badge`'s `where`) | 2198–2201, 2220 |
| Office door PIN | 5183 | 2197, 2203 |
| Office safe PIN | 1890 | 2199–2200 |
| Container types and lock pins | `filing_cabinet` with unkeyed `lockType: key` locks (picks only); pins and difficulty | 2198–2199 |
| Notes item ids for the four pickups | `c_baptiste_kit_list`, `c_novak_bag_list`, `c_ahmed_kit_list`, `c_travel_log` (+ `c_safe_note`) | 2212–2219 |
| Log filter config | `logType: ics_rdp` reused as a door log; four entries; anomaly 03:40 GARAGE-RDR; labels "FLAG ENTRY", "CONFIRM FLAG" | 2201, 2219 |
| Log filter completion global | `c_door_log_done` | 2219 ("on its global") |
| "Last used 03:40" at the garage reader | a `hint` action in `t_c_badge` (no engine field shows it) | 2220 |
| How Novak's clone choice retires | trigger `t_c_badge_cloned` on `card_cloned` sets `c_novak_badge_cloned` (m05 pattern) | 2286 |
| How the badge is cloned | `#clone_keycard:c_novak_badge` from Novak's ink, needing `rfidCard` on the NPC; plan says only "holding her badge as an RFID card in `itemsHeld`" | 2198 |
| Exit phone object type | `aes_emergency_phone1` (type `phone` would open the phone UI) | 2194 |
| Comms room prop | a dead radio set | 2196 |
| Baptiste as the one social character; thresholds | default −20/−40/−60, kind word +20 | 2217 ("gossip with an influence cost"), 1493 |
| Baptiste's three gossip topics | Ahmed's trip (the clue), Novak (points to the office code in her bag), the leak night (points to the garage log) | 2217, 212 |
| What Baptiste's `reports` threshold does | sets `ded_c_baptiste_reported`; HaX mentions it. C has no tamper | 2243, 1535–1538 |
| HaX opening call trigger | `eventMappings` on `game_loaded`, `targetKnot: start` | 2194 |
| HaX keycard-revoked bark | "Your keycard's dead. Call me if you need the office." | 2203–2204 |
| Comms-lock flow | a hub choice leads to a warning knot with "Lock it." and "Not yet. Leave it open." (plan: choice "with a 'Not yet' beside it") | 2249–2250 |
| `show_scenario_brief` | `on_start` | 2171 |
| Brief wording around the profile | see `scenario_brief` | 2171 |
| `stakes.scoreLine` | false | 2270 |
| `c_keycard_revoked` has no `cost: true` | not marked in the plan; rigidity stays `costly` through `remove_item` | 2263–2264 |
| Objective aim id, titles, task titles | `c_safe_house`, "Get every call right", "Leave the safe house" | 2270–2271 |
| Credits playlist and statusText | `spy-action`, "OUT" | 2271–2272 |
| Closing card lines, credits title lines | see `music.events[0]` | 2271–2272 |
| Per-innocent credit lines | "Tariq Ahmed was taken down for nothing." etc. (from "names two innocents taken down in the credits") | 2276–2277 |
| Credits line wording for the three globals | "A sleeper walked out…", "HaX revoked your keycard…", "The network scattered." (the last is the plan's) | 2268–2272 |
| `debrief.closingLine` | "Novak's bag and the 03:40 garage door each settled her. …" | 2167–2306 (silent) |
| `mission.json` display name and description | see file | 1850–1851 |
| Every line of dialogue except the plan's quoted HaX lines | see `ink/` | 2266–2267 |

## Plan gaps and inconsistencies found while drafting

1. **Opening facts in the hand check include a closed container.** Line 2228 lists Baptiste's field kit as an
   opening fact, but it comes from a drawer that needs picks (line 2198), and DL8's container rule
   (lines 1795–1803) says a picked lock is closed and its contents are not opening facts. Line 2223
   uses that same rule for the office code in the same drawer. The draft follows DL8: the opening
   facts are Ahmed's phone, Baptiste's phone and Ahmed's trip. The result is unchanged (0 decided,
   3 open). The DL8 per-room line (2238–2239) then also leaves **Baptiste** open with the garage
   alone, because her kit cell is still hidden; still no warning. A hand evaluator over the draft's
   data matched the plan's states otherwise (O: 0/3; O+office: Novak guilty, Baptiste clear, Ahmed
   open; all facts: truth as the table).
2. **The exit phone's cancel button reads "Cancel".** Line 2255 says cancel is "not yet". `gameConfirm`
   takes labels (`systems/notifications.js:183`), but the `confirm_action` action passes only `text`
   (`systems/apply-actions.js:192-193`). DL12 accepts it either way. Choose: accept "Cancel", or add an
   optional `cancelLabel` to `confirm_action` (an S20 change).
3. **No engine route shows "Last used 03:40" on the reader.** Line 2220 implies a reader display. The
   draft uses a `hint` toast from `t_c_badge`.
4. **Cloning needs `rfidCard`, not only `itemsHeld`.** `#clone_keycard` reads the NPC's `rfidCard`
   (`chat-helpers.js` `clone_keycard`). Line 2198 mentions only `itemsHeld`. The draft has both; the
   itemsHeld keycard still matters for a KO drop, which opens the garage directly with no
   `card_emulated` (the door log still settles Novak).
5. **`#unlock_door` from Ahmed or Baptiste** (line 2202) may need server permission for that NPC to
   unlock those rooms; whether `NPCGameBridge.unlockDoor` checks it was not verified here.
6. **The start fingerprint kit has no use in C** (line 2205; §9.5 line 2505 lists no dusting for C).
   Kept because the plan lists it.
7. **After "Not yet" on the pull-out call, the plan gives no way back to it.** The mapping is
   `onceOnly`, so it never rings again. The draft adds a hub choice, "About getting out.", gated on
   `c_pull_out and not c_leaving`, which returns to the same warned knot. The exit phone also still
   closes the case.
8. **Bridge selectors are placeholders.** The board's DOM (`[data-suspect]`, `[data-mark]`,
   `[data-because]`), the RFID UI's buttons and the log filter's row markup are guessed; P10-H and the
   real packet fix them. The bridges use the harness's real commands (`enter`, `lock`,
   `mg completeLockpick`, `mg take`, `converse`, `debugKO`), all from
   `.claude/skills/playtest-scenario/scripts/playtest-session.js`.
9. **`_note` keys outside `social`.** The plan allows `_` keys under `social` (line 402); the draft also
   puts `_note` on rooms, objects, triggers and the top level. If `scripts/scenario-schema.json` closes
   any of those shapes, move the notes into `<%# %>` ERB comments.

## Checks run on the draft

- All four `.ink` files compile with `inklecate` (into the scratchpad, not here); `loopcheck` reports
  no runtime errors; `dialoguelint` is clean after one "not X, but" fix.
- `scenario.json.erb` and both `.jsonl` files parse as JSON.
- The validator was not run: the deduction lints and `triggers` schema do not exist yet.
