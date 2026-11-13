# Merge of main into the phone calls track (2026-11-13)

Branch `build/phone-calls-merge`, started from `build/phone-calls` at `351b504ad`.

| Commit | What |
|---|---|
| `db2a34cfa` | Merge of `main` (`c9a4f7a84`, 174 commits since the base `f2d53bb40`) |
| `3e4257095` | Merge of `build/phone-calls` up to `e00177f6c`: the nine TTS commits (`74cc3493b..dad414b2a`, `tts_cache/` only) and the log commit (`docs/agents/PHONE_CALLS_LOG.md`). No conflicts. |
| this commit | This note and the live proofs in `proofs/merge_main_2/` (no code) |

The full suites passed on `3e4257095` (counts below).

## Conflicts

**`app/models/break_escape/game.rb`** (phone state constants, `sanitize_phone_state_entry`). Main's side (`91da28d22`) only gave the existing phone limits names (`MAX_PHONE_TYPE_CHARS` and five more), with no change in behaviour. The branch's side added the call constants (`PHONE_CALL_*`, `PHONE_DELIVERY_TAG*`, `deliveryTags` and `callEvent` in `PHONE_MESSAGE_KEYS`) and the `deliveryTags`/`callEvent` cases. Resolution: both sets of constants are kept. The branch's code uses main's names, so the `> 20` and `<= 20` checks are now `MAX_PHONE_TYPE_CHARS`. Main's literal scan test (no inline numbers in the mirrored sanitisers) requires this.

**`public/break_escape/js/systems/npc-manager.js`** (`exportPhoneState`, `_phoneStateEntry`). Main (`9f85871c6`, `3cec62ff4`, `b8370b88d`) rewrote the export as an exact mirror of the server sanitiser: code-point clips, the 61440-byte `storyState` cap and a `keyOf` option for the "changed since last save" compare. The branch added `pendingCall` to the entry and a `{history: [], pendingCall: null}` marker when a contact's call slot has gone. Resolution: main's mirror and `keyOf`, plus the branch's `pendingCall` and the slot-cleared marker. The marker still parses the stored key, which is JSON under both `JSON.stringify` and `stableJson`.

A clash git did not flag: main's mirror copies only booleans for the fields it doesn't name. Taken as merged, it would have dropped `deliveryTags` (array) and `callEvent` (string) from every saved line, so missed-call rows would lose their event and voiced lines their delivery notes on reload. The mirror now cleans both as `game.rb` does: `callEvent` must be in `PHONE_CALL_EVENTS`, and `deliveryTags` follows `clean_phone_delivery_tags` (strings within 300 code points, no control characters except tab and newlines, at most 5). It also drops the lines the server drops: a type over `MAX_PHONE_TYPE_CHARS`, and a `call` row whose text is not the plain `PHONE_CALL_ROW_TEXT` shape. New client constants: `PHONE_CALL_ROW_TEXT` and `PHONE_CALL_EVENTS`. The branch's `PHONE_STORY_STATE_MAX_CHARS` is retired in favour of main's byte cap.

**`scripts/validate_scenario.rb`**. Main restructured `run_validation`: no single `begin` block, and checks run through `run.call` and `report.run_check`. Resolution: main's file, with the branch's six changes applied to it again:

- `require_relative 'validate_phone_calls'`
- `call` in the NPC known fields and `ring` in the event-mapping known fields
- `check_speaker_id_name_clashes`
- `call_answer_seconds` and `call_is_callback` in `RECURRING_SYNCED_INK_VARS`
- `check_speaker_id_name_clashes` and `check_phone_calls` added to the common checks

The diff from main is 22 lines added and 2 removed.

### Test changes that go with the resolution

- `test/fixtures/files/sync_bodies/sanitiser_cases.json` (main's shared client/server fixture):
  - Case 0's expected output no longer keeps the line whose type is over 20 characters. The branch's A4 rule (`05c48a567`, "a typeless line would not draw") drops that line whole. This matches the fixture's own "no type dropped whole" input.
  - New case: call row shape, the `callEvent` whitelist and `deliveryTags` cleaning. The expected output was generated from the server's `sanitize_phone_state_entry`.
  - Both `sanitiser-cases.test.mjs` and `sanitiser_cases_test.rb` pass with the new fixture.
- `test/js/social-mail-state-export.test.mjs`: the constant parity list now also covers `PHONE_DELIVERY_TAG_MAX`, `PHONE_DELIVERY_TAGS_MAX` and `PHONE_CALL_EVENTS`.

## Schema and note stripping

No schema change was needed. `scripts/scenario-schema.json` leaves `npc` and `eventMapping` open (no `additionalProperties: false`), so undeclared keys are kept. `AuthorNotes.strip_notes!` removes only `_`-prefixed keys. Under an undeclared node such as `ring` or `call`, any `_` key would count as a note and be stripped. None of the 13 scenarios has one.

Of the phone fields, the schema declares only `phoneTheme` (enum `terminal`/`social`; the scenarios use only those two) on NPCs and `callLabel` on event mappings. `ring`, `call`, `voiced` and `endingCheck` stay undeclared, as they were on the branch.

Survival check: a Rails runner script (session scratchpad, `phone_survival.rb`) renders each scenario with `Mission#generate_scenario_data` and builds an unsaved `Game`. It then runs `filtered_scenario_for_bootstrap`, the controller's `filter_requires_recursive` and `strip_notes!` from the root, plus `filtered_room_data` for every room, and compares every `ring`, `call`, `callLabel`, `phoneTheme`, `voiced` and `endingCheck` on each NPC and event mapping with the rendered scenario. All 13 scenarios pass with nothing missing or changed. The fields checked per scenario:

| Scenario | Phone fields checked |
|---|---|
| m01 | 4 |
| m02 | 5 |
| m03 | 7 |
| m04 | 6 |
| m05 | 14 |
| m06 | 3 |
| m07 | 21 |
| m08 | 14 |
| m09 | 36 |
| m10 | 37 |
| lab_social_engineering | 2 |
| test_phone_calls | 39 |
| test_phone_call_notes | 3 |

`boot_check!` only loads the schema file. That load succeeds in every runner and server start here.

## Validator

The run was `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --no-graph` for m01–m10, lab_social_engineering, test_phone_calls and test_phone_call_notes, on the merge, on main and on the branch tip (`git archive` copies).

- **Merge:** every scenario exits 0, with no ❌ lines.
- **Merge against the branch tip:** the sorted ❌/⚠️ lines are identical for all 13 scenarios.
- **Merge against main:** every difference is the branch's own scenario content. Examples: the shifted eventMapping indices in m01; `m01_first_ring_done` undeclared (a warning already on the branch); m02's "Call when you need me" lines with no call entry; one extra dialogue lint finding in m07. The two test scenarios don't exist on main.

There are no new errors.

## Suites

| Commit | JS (`bin/test-js`) | Rails |
|---|---|---|
| `db2a34cfa` (main merged) | 582 files passed, 0 failed | 2263 runs, 0 failures, 0 errors, 1 skip |
| `3e4257095` (audio merged) | 582 files passed, 0 failed | 2263 runs, 0 failures, 0 errors, 1 skip |

Before the merge, the branch was at JS 567/0 and Rails 2137/0 (1 skip).

The first JS run, before the fixture change, failed only `sanitiser-cases.test.mjs`, on case 0 above.

## Live proofs (keyless server on :3024, headless; `proofs/merge_main_2/`)

**(a) lab_social_engineering Dev call** (`tools/phone_calls/routes/se_dev.sh`, game 2399). Pass. `dev_service_desk` sha256_noseed is `ffe4c083298313e1…` and `ruth_phone` is `52c50b7abf11dcb8…`, both after the call and after the reload. These equal ENGINE_SWEEP_R3. The four Dev `/tts` lines returned 200.

**(b) m04 HaX dial ring** (`ENGINE_SWEEP_R4/r4_live.sh m04_ringout`, game 2400). Pass.
- The dial read set `anomaly_detected` and HaX rang.
- Left alone, it rang out after about 21 s (`phone_call_missed`), leaving a "Missed call" row and a callback for `on_anomaly_confirmed`.
- The thread header showed "Call back". Pressing it dialled (CALLING), then connected (ON CALL, HaX's lines, `phone_call_answered … callback`).
- Rows at the end: "Missed call", "Outgoing call, 0:12".

**(c) m07 Architect taunt.** Pass.
- `r5_live.sh b_vm_reload` (game 2402): T-30 rang inside the open Architect thread with `withheld: true` and the banner "No caller ID". The screen matches the pre-merge ENGINE_SWEEP_R5 shot. Declining left a voicemail held with `withheld: true`. After a reload it arrived once ("Missed call: No caller ID", "Voicemail", three transcript bubbles) with no toast.
- `r5_live.sh d_self` (game 2403): T-30 was answered and the call ran in theme `terminal`. It closed itself after the 2601 ms read beat, leaving the row "Call: No caller ID".
- Both ran from a scratch copy of r5_live.sh. The copy's only changes are an absolute library path and `ringer_now` also reporting `withheld` and the banner text.

**(d) m01 tutorial hold** (`PS_m01_m03/tut_idle.sh`, game 2404). Pass.
- With the tutorial accepted and the player idle in main_office_area, the first ring was held and came at 26.6 s (ENGINE_SWEEP_R4: 26.3 s).
- It sat in the `under-tutorial` layer, with no overlap of the panel or SKIP.
- The call connected ("You're in. One test call before it's texts only."), and the tutorial was still active during the call.
- This ran from a scratch copy with the library path pointed at this tree, since the original points at p-phone-calls.

The server was stopped afterwards and no session processes were left. The stale `tools/playtest/pipes-*` directories were moved to `tmp/delete/`.

## Open

- Client and server still differ on `read` in one way. The client export always writes `read`, while the server omits it when the saved line had none. This comes from main's mirror and is not a merge fault. The fixture cases give `read` to avoid it. If a restored line ever lacked `read`, that thread would be sent once more on the first sync.
- `pendingCall` is exported as a deep copy. The server cleans it with `clean_phone_pending_call`, so a call slot holding fields the server drops would also be resent once after a load. It does not grow.
