# OPS_LOCK_SECOND_STEP_PLAN.md, reviser decisions

## Round 1 (reviser on Opus 5.5, 2026-11-19)

- B1: adopted. Rule C (`step_ancestors`, `behind_closed_step?`, modelled on `path_unlocked?`) in 5.2, with a two-column exits table. Verified: `/unlock` (Rule C inside `validate_unlock` beside `unlock_scope_refused?`, feedback helpers answer nil), plain `GET /container` (404 as invented), scope branches and the share and sign-in desktop takes (already refuse by their path test, since a gate object is locked), room-object and released-container takes, the inventory copy.
- M1: adopted. Resolve once first; first factor judged with the shortcut (`game.rb:4695-4698`) off for an unopened gate object; `flag_reward` skips only when `flag_reward_unlocks_object?` holds.
- M2: adopted. Server `npc` rule kept; section 2 now says the only NPC unlock path today is doors; chat-helpers edit dropped; K9 rewritten as a PIN pad close-and-retry beat; crafted `npc` post is a controller test.
- M3: adopted. Step handled once in `ApiClient.unlock` (callers listed in section 2, verified). Not quite "one place": `notifyServerUnlock` swallows rejections and its callers pass answers to `unlockTarget` untested, so a cancelled marker plus a guard in `unlockTarget` is also needed. `doors.js:699` kept only in the 5.3 split-gated row, as unreachable for a gated room.
- m1: adopted; propped door is best-effort, skips the step; question 2 still to reword (see handover).
- m2: adopted (share and desktop takes tabled; one-level search noted).
- m3: adopted, with a twist: the answer uses the gate's resolved object only when `second_step_ids` is non-empty, so existing scenarios keep the old finder call.
- m4: adopted (nested takeable may carry the step; rule stated in section 4 and tested).
- n1: partly done (MFA summary cut, section 13 tail cut). Section 7, door table vs question 2, and further trims not done.
- Orchestrator log note (first reviser): `by` renamed `approver`; `as: { npc: }` only when the pane names the owner (it does for every kind as planned), else nil. The log plan's text says "seven" `mfa_*` events while both tables list eight; flagged, not changed.

## Round 1b (second reviser, Opus 5.5, 2026-11-19)

- M1: already done (`approver`); `own_phone` now never written for a lock.
- M2: adopted per orchestrator ruling. Open question 8 (recommend no carry-over); lock routes ignore `accountResets`, verify uses the owner's `code_device`, approve needs the owner's held phone, `ownPhone` dropped, `own=1` lists no lock request; kind registered with the MFA plan's `device_in_use?`. Controller test added.
- M3: adopted. Request 1 rewritten as a numbered list by MFA section; items 1-7 marked met by MFA request 11 (commit 629b8cc07); item 8 (answer again from a live record) still asked. Client: `takeCompleted(subject)`, `MfaClient` emits the events.
- m1: follow the MFA rule (push refused only for `phone: false`); the never-passable rule covers holding the phone where the lock is needed.
- m2: adopted; sets built from every authored home, independent of holding.
- m3: adopted; `secondStep` joins the `access`/`acceptsUIDOnly` error list at `validate_scenario.rb:8059`.
- m4: adopted; validator errors for `secondStep` on `startRoom` or an awareness world room, and for an `unlock_object` task naming a gated object by anything but its id. 5.3 states `GET /room` is the only other `unlockedRooms` writer and is safe under that rule.
- m5: adopted; 40-character id rule in the validator; closed `method` list; request 5 now asks for `places`, notes "seven" should read eight; Q3(c) no longer calls lockpick a lock type.
- m6: adopted; `badge_swipe` timing in section 13, K11, request 5 and the L2 controller row.
- m7: adopted; `gameClock`, `assert_ops_log_holds_no_secret`, secret-guard unit case, validator spec per error, graph test file, `lock_key_diff` unchanged check, JS dependency on MFA M1b copy lists.
- m8: adopted; section 8 says passed records persist and resets drop them.
- n1: room `lockType` pointer fixed; `infusion_pump`, `backup_recovery` removed. n2: in request 5. n3: `object:<id>`/`door:<room>` key as `PinDust`. n4: section 10.
- Orchestrator notes: `save_limit: true` wording; closed method list. Length not yet under 650 (709); see handover.

## R2 (third reviser, 2026-11-19; stopped at the context limit, partly applied)

- M2: adopted (path form). `resolve_unlock_target` returns `{ object:, path: }`; Rule C reads ids on the path; `step_ancestors` removed; other finders carry the path. Validator error for `secondStep` inside any `usb` item; copied-source controller test added. Verified `held_usb_sticks` deep_dups (`game.rb:5011-5020`).
- m1: partly; 5.2 gate now recomputes from the record with `numbers(...)` and `nonce`. Item 8 still to drop from section 14.
- m2: adopted; empty list for `GET /mfa/phone`, generic 422 for the three posts; ids only.
- m3: adopted; `validate_unlock(..., resolved: nil)`, nil keeps today's find (controller is the only production caller, `games_controller.rb:1226`).
- m4: adopted; `finishLock` posts via `ApiClient.post` with a fresh `nextClientTs()`, one re-post per pass, JS test.
- m6: adopted as a validator error (smaller: only the payload filter reads `tableItems`, `game.rb:7287`).
- n1: adopted in the live proof. n2: section 2 client paragraph, 5.2 subject table, section 7, section 4 owner rules, merged test rows done.
- Unreviewed items checked: validator sites (new `scripts/validate_lock_step.rb`, run list `:8948`, door loop `:8058-8065`, world room path `game.rb:153-159`, task reads `:1602`/`:1719`); the "graph marks needed" rule rewritten (graph computes no reachability); graph edge from the owner's NPC node.
- Not yet done: M1, m5, m7, request 1 trim, Q8 trim; see handover.

## R3 fixes (2026-11-19)

- M1: adopted. Section 10 proof 2 now adds `lock_step_unlock.json`, `lock_step_container.json`, `lock_step_rooms.json` to `ops_unchanged/`, compared by `bin/ops-golden-compare` in `lock_step_unchanged_test.rb`; own capture script dropped.
- m1: adopted. Both door rules live in `validate_lock_step.rb` with its own `doors[]` loop; `validate_scenario.rb` gets the require and run-list line only.
- m2: adopted. `MfaModel.lock_step_never_passes?(scenario, lockable)` in `lib/break_escape/mfa_model.rb`, called by validator and graph; graph requires `mfa_model`; owner node gets the room edge, or none for a headless record.
- m3: adopted. A task needs the lock when its target is the lock or anywhere below it (error); rooms: any task target in the room.
- m4: picked the self-resolving form (`resolved: nil` calls `resolve_unlock_target`), as simpler than a rule about when no gated object can be involved; `/unlock` passes `resolved:`.
- m5: adopted. Section 6 states the kept bodies; no new `{ success: false, reason }` answer.
- Nits: beats renamed B1-B11 (B unused before); MFA stages written M1a to M3 and log stages L1a, L1b; n3 `<record key>`; n4 `alreadyOpen` by Rule B; n5 room NPCs and headless records; n6 `tableItems` warning added; n7 stays as request 3.
- Plan trimmed to 729 lines by shortening open-question wording.

## R4 fixes (2026-11-19)

- M1: rule restored to "and", per kind. `push` never passes only with the phone untakeable and the owner never approving; `push_number_match` and `code` have one route each (held phone, device). Number matching needs the phone in hand: the MFA plan's `POST /mfa/approve` and M3 graph edge say so. `moira_pc`, `moira_locker`, `records_room` no longer match.
- m1: `resolved: nil` resolves a door through `room_data` (no path), an object through `resolve_unlock_target`.
- m2: new `MfaModel.held_item_sources(scenario)`, a plain-Ruby walk beside `device_for` covering room objects, room NPCs, headless records' `itemsHeld`, declared grants (`declared_grants.rb`) and start items. `Game.headless_npc_records` and the validator copy are left alone.
- m3: fixtures name `test_objectives`, `test_simple_success`, `test_pin_dust`, `m01_first_contact`, `m02_ransomed_trust` and the fixed script (every lock wrong and right, `GET /container`, `filtered_room_data`), written by the core plan's capture task. The controller tests build inline scenarios, so they could not be named as fixtures.
- m4: `lock_step_never_passes?` and `held_item_sources` listed in 5.1 and the shared-files row; unit test moved to `mfa_model_test.rb`.
- Nits: graph uses the MFA plan's require; "never passes" label; "L1a and L1b first". Plan at 740 lines or under by trimming open-question wording.

## R5 fixes (2026-11-19)

- M1: owner ruling. `held_item_sources` counts a device exactly when the game lets the player hold it: room objects and `contents`, start items, and a room NPC's `itemsHeld` only when its story offers the type (`offers_item_text?`) or it is not `koImmune`. Headless records and declared grants dropped, as `held_friendface_phone` and `device_for` do not count them; widening that stays a request to the MFA plan. Unit test turned round. Dana is `koImmune` with no give, so `dana_cabinet` (B10) gets the warning and the dashed edge.
- m1: golden script fixes room-walk order, scope ancestors open first, the `requires` item set by the test, refused locks recorded; `test_simple_success` gives room answers only.
- Nits: lines rewrapped; `dana_cabinet` named as the lock that matches. Plan at 745 lines.

## R6 fixes (2026-11-19, orchestrator; review rounds end here)

- m1: the knock-out branch now uses the server's full test (not `koImmune`, not `npcType: "phone"`, no scenario `disableAttacks`; `owner_claim.rb:73-74`, `game.rb:2050-2059`), with unit cases for each. The MFA plan's matching helper text (its line 841) has the same gap: passed to the cross-plan R3 fix list.
- n1: walk order defined (breadth-first along connections in file order, objects in file order); locks below a refused ancestor recorded as unreached.
- n2: lines 542 and 620 rewrapped; "story or record". Plan at 751 lines; the 745 cap was an orchestrator target, not a rule.
