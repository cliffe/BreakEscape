# Fixture B draft: invented values and plan gaps

Draft of fixture B ("Night shift") from `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` (3327 lines when read,
2026-10-22). Line numbers below are from that version. Everything the plan states is copied as given:
the whole `social` block of §4.9 (people, Tomás's character, the twelve intel facts, the deduction block),
the three triggers, the room chain, the two PIN codes, the object ids, the tasks, `scoring: "completion"`.

## Invented because the plan is silent

| # | Value | Plan line |
|---|---|---|
| 1 | `scenario_id` `test_social_deduction_b`, `scenario_name` "Night shift", `endGoal`, `version`, `show_scenario_brief: "on_resume"` | 1850 (folder name only) |
| 2 | The company, Kelvedon Data, and the incident: door alarm just after 02:00, payroll export on a file-sharing site by 04:00 | 756 (brief contents only), 1873-1878 |
| 3 | The whole `scenario_brief` wording around the two verbatim strings, ending "Sending the report ends the exercise." (training-episode warning, README_scenario_design 1540) | 756-757 |
| 4 | `startPosition`, `gameClock` "Thu 22:30", the player block (`displayName` "Analyst", hood sprite) | none |
| 5 | The player phone in `startItemsInInventory` with `npcIds: ["ded_b_security_manager"]`; the plan says Nair is a phone NPC but not how the phone reaches the player | 1883-1884 |
| 6 | Nair's NPC id equals her people id `ded_b_security_manager`; avatar `female_telecom_headshot.png`; a `timedMessages` nudge to call her | 675, 1883 |
| 7 | Every `displayName` = the `social.people` name (so ink prefixes resolve); sprites: Okoro `female_office_worker_v2`, Haddad `female_blowse_v2`, Tomás `male_telecom_v2`, Lindqvist `male_office_worker_v2`, Morgan `female_scientist_v2` (placeholders; P10-K-B picks) | 1852-1853 |
| 8 | Cast backgrounds and ages (Okoro Nigerian-British late 30s; Haddad Lebanese-British mid 20s; Lindqvist Swedish-born mid 50s; Morgan Welsh early 60s; Tomás Valencian early 60s; Nair Indian-British mid 40s) | 1852-1853 |
| 9 | NPC positions, room types (`room_office`, `room_break`, `room_servers`), door signs, connection directions (office east to kitchen, kitchen north to server) | 1880-1889 |
| 10 | `hr_cabinet` as `type: "filing_cabinet"`; the board's `name` "Case Board"; every `observations` line | 1880 |
| 11 | The text of `hr_summary` and of `b_overtime_complaint` (written to match the four grievance facts) | 1881-1882, 1906 |
| 12 | `itemsHeld` entry shape for `b_overtime_complaint` (`type: "notes"`, `readable`, `text`) | 1906-1909 |
| 13 | A coffee machine object `b_coffee` in the kitchen (set dressing for the kind word) | none |
| 14 | The badge log's content: `logType: "ics_rdp"` (nearest existing column set), eight rows, `accountHistory` per account, the anomaly is the door alarm itself (`door_contact`, HELD OPEN, 02:14), so flagging it accuses nobody; flag labels and confirm text. Times fit the facts (Lindqvist 23:40, Okoro 02:10, Haddad and Morgan in role) and Lindqvist's ink (reset at 02:31) | 1887-1888 |
| 15 | Haddad's ticket number INC-4471, device hostnames NGOZI-GALAXY and SAMIRA-XPS | none |
| 16 | The DHCP `hint` action's `title` and `message` | 1903-1904 |
| 17 | Aim id `b_case`, aim and task titles, `conclusionScreen` body ("Your report is with Priya. The debrief shows how each call stood."), `concludeRequires: {}` | 762-764, 1927 |
| 18 | `ded_b_tomas_latched: ""` as the "other 06 character globals"; `b_heard_alarm` declared (named in §9.1, missing from §4.9's list) | 757-761, 1886 |
| 19 | No `music`, `timers`, credits or `creditsOverlay`: B is a training episode on the success screen | 1689-1696, 1875-1877 |
| 20 | Ink file names `ink/<npc id>.ink`, `storyPath` `scenarios/test_social_deduction_b/ink/<id>.json` | 1466-1470 |
| 21 | All dialogue. Ink for Okoro, Haddad and Morgan (the plan gives them no ink): no grants, no verdict tags, each points at the evidence; Okoro points at Samira's laptop (true, a fair red herring) | 1893-1898 |
| 22 | Nair's hub topics "Remind me what you're looking for" and "Where should I look next?" (status answer by stage), the post-close reactions to `b_wrong_name` / `b_insider_named`, and the close-check warnings for "no names given" and "door log not read" | 1615-1616, 1919-1928 |
| 23 | Nair's reply after `#verdict_close` keeps to "part of this doesn't sit right" / "fresh eyes in the morning" / "That squares", so the debrief still carries the detail | 1922-1923 |
| 24 | Morgan reacts to `ded_b_tomas_reported`. With B's numbers that band (-60) is out of reach (worst case -30 after the kind word), so the `reports` threshold exists for DL12 only | 683, 1914-1917 |
| 25 | Bridge selectors and the board test-state shape (`board.suspects[].slots[].cells[].state`, `board.debrief.cards[]`, `noBlameCase`), the phone-opening step, keypad entry by `pressKey`, the log-filter row click | 1932-1962 (steps only) |

## Where the draft departs from the plan's sample code (house rules win)

| # | Change | Plan line | Why |
|---|---|---|---|
| D1 | Prefix `Tomás Rivera:`, not `Tomás:` | 1477, 1512 | A prefix must match `displayName` or `id` exactly (README_ink_best_practices 30-54) |
| D2 | Tomás's choices are spoken lines ("Who's been unhappy on nights?"), as §9.1 words them, not "[Ask who has been unhappy on nights]"; kind word "[Thanks for the coffee, Tomás. It's a long night.]" | 1503-1504, 1911-1915 | Player choices are dialogue (README_ink_best_practices 218-240) |
| D3 | Exit is `+ [I'll let you get on.]` with a reply and `#exit_conversation`, not `-> END` | 1505 | Exit with a reply (README_ink_best_practices bug 5) |
| D4 | Nair speaks the report line ("Ngozi Okoro. Noted. #verdict:report:...") instead of "You give Nair a name: ..." | 1604 | In a phone ink an unprefixed line is the contact speaking; the plan's narration would show in Nair's bubble |
| D5 | Tomás's alarm topic answers even while he is wary (grudging line, no cost) | 1535-1536, 1916-1917 | It grants no clue and gates the server code; wariness must not block the critical path. The bridge order of §9.1 B1 is unaffected |
| D6 | The kind word is `* {not tomas_thanked}`, and the alarm topic `* {not b_heard_alarm}` | 1504, 1914 | `*` resets on reload; the guard keeps "once" true across a reload |
| D7 | Nair's three long briefing lines split under the 25-word phone cap | none | dialoguelint `line-len` |
| D8 | No `lockedHint` on the server door | none | Validator: a `lockedHint` shows only for key locks |

## Plan gaps found while drafting

1. **`hint` is not a valid `triggerOnInteract` type in `scripts/scenario-schema.json`.** The draft's
   `dhcp_printout` fails schema validation: "value "hint" did not match one of ... grant_fact". §9.1
   (line 1903-1904) needs it, `applyActions` supports it and DL16's known list (line 1835) includes it. P10
   needs a schema edit (S16 or P10-K-B) to add `hint` to that enum, or B shows the printout another way.
2. **`completeBanner` is not in `minigame-data-schemas.json` for `log_filter_terminal`**, although the
   minigame reads it. Dropped from the draft; not a plan problem, but a fixture author will hit it.
3. **dialoguelint does not see `Tomás Rivera:` lines** (its SPEAKER regex uses `\w`, which misses "á"),
   so Tomás's file reports zero lines and no rules run on it. The engine itself splits on the first colon
   and is fine. Either the lint gets a Unicode-aware regex or the fixture drops the accent from the
   `displayName` (the plan's `name` keeps it).
4. §4.9's declared-globals list (757-761) omits `b_heard_alarm`, which §9.1 (1886, 1913) relies on.
5. §9.1 never says how the player gets a phone for Nair (a `startItemsInInventory` phone with `npcIds`).
6. §7.5's sample `name_okoro` narration (1604) reads as Nair's own speech in a phone chat (D4).
7. The plan never says what the badge log's flaggable anomaly is. A log filter needs exactly one, and
   flagging a suspect's row would tell the player who is guilty; the draft flags the door alarm instead.

## Checks run on the draft

- All six `.ink` files compile with inklecate (into the scratchpad); `inkcheck.js` from `start`: no
  runaway or failing paths.
- dialoguelint: 0 errors after D7 (but see gap 3).
- `validate_scenario.rb --no-graph --skip-ink` on a copy with the `_note` keys and the `hint` stripped:
  the only errors are the expected pre-P10 ones (`deduction` on intel facts and `social.deduction` not in
  the schema yet; top-level `triggers` unknown).
- The brief contains the profile text and `briefText` verbatim (checked by script).
