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

## Lock types audit (2026-11-19)

- 1. NPC ink unlock on a gated lock: the pane never opens over the conversation; the step stays pending and the pane opens when it closes; walking away loses nothing. The NPC replaces the first factor only, the step is due even when the NPC is its owner (question 1 stays open). LOCK 5.4, JS test row, playtest beat B12.
- 2. Success before the server answers (Bluetooth, both rfid branches, key and lockpick toasts): on a gated lock no "opened" toast or release sound until the final answer has `success: true`. The client knows from the public `secondStep` field it already holds; nothing new is sent. LOCK 5.4, JS test row.
- 3. Card copier open when the pane appears: a cancel reports `second_step_cancelled`, not `denied`/`wrong_card`, and emits no `door_unlock_failed`. LOCK 5.4 and the JS test row.
- 4. LOG: `badge_swipe` ok is keyed on the method used (`rfid`, a card presented), not the lock type; an NPC opening an rfid door writes none. LOG 5.1 bullet, row table, test; LOCK section 13 agrees.
- 5. Cloned card at a gated door: the badge row names the card holder, the step rows name the step owner; the two may differ by design. LOCK section 13.
- 6. LOCK section 2 gains a short paragraph: keyring read only by sign-in; card, fingerprint and Bluetooth are separate first factors; fingerprint and Bluetooth/BLE are browser-trusted, so the step is the only server-checked part.
- 7. Two existing-code findings (keycard keyring credential survives revocation; validator counts `fob`/`rfid` item types the engine ignores) listed in LOCK section 14 as outside this plan's scope.

## R7 fixes (2026-11-19)

- M1: the wait lives in `MfaClient.runLockStep` for `method: "npc"` only: opens when `currentMinigame` is null or `_ending`, `pendingConversationReturn` is null and no `gameConfirmOpen`, checked every `CHAT_RETURN_SETTLE_MS`, two clear checks in a row; no `conversation_closed` hook. LOCK 5.4, JS rows.
- M2: server `npcStepGrants["door:<roomId>"]` (G2, doors only) kept through deny/expiry/X, deleted by the open; reaches the browser as `opener` in the `secondStep` answer and `npcStepOpener` in the bootstrap; `handleUnlock` on such a door re-posts `npc` via `NPCGameBridge.unlockDoor(roomId, opener)`; bridge returns `secondStepCancelled`, no "Failed to unlock"; UI waiting toast; "walking away" defined; X sends nothing, record lives out five minutes. LOCK 5.3, 5.4, 7, 8, tests.
- M3: STEP 2 cancel branch (no copier, no `door_unlock_failed`, no `refusedKeycards`), `showAccessRefusal` branch, `_askAccessList` live-instance branch, suspended copier silent, pass via late path with `autoOpen: true` on a gated lock. LOCK 5.4, JS rows.
- M4: fingerprint reader shows "Print accepted.", skips both `expectPanelWithin` calls; toast after `success: true`. LOCK 5.4, JS row.
- M5: G2 names the bootstrap allowlist (kind and owner only), `doors.js` `doorProperties`, the three `getLockRequirementsForDoor` copies; build steps and shared files updated. LOCK 5.3, 12.
- m1: key/lockpick toasts cited at `minigame-starters.js:232-234`, `:481`, `:83`, `:257`, moved with `expectContainerAfterUnlock` into the `unlock-system.js` callbacks on a gated lock.
- m2: one cancel rule via `MfaClient.cancelFeedback`: deny/expiry tone plus "Not approved.", player's X nothing; `body.closedByPlayer` added.
- m3: LOG 5.1 lead-in reworded; both `badge_swipe` rows need `method: "rfid"`; `flag_reward` named; refused-row test added. LOG 5.1, 13.8 rows, L1b tests.
- m4: LOCK 13 defers to LOG 13.8's copy rule for `as`.
- m5: BLE `completesTask`/`onPairSetGlobal` move after `success: true` on a gated lock via `applyBlePairEffects`.
- m6: B12 split into B12a to B12e (Gordon's ink opens, Moira owns; give_item child; X; retry; reload; approve) on a fresh game.
- Nits: n1 keyring wording; n2 backlog destination and owners; n3 kind/owner only; n4 clone-outside-access-list opens alone.

## R8 fixes (2026-11-19)

- m1: the retry from the door posts `npc` directly for `doorProperties.connectedRoom` and calls `unlockTarget` with the answer, so the sprite opens; `door_unlocked_by_npc` does not fire on a retry; bridge change stays at its `catch`. LOCK 5.4, JS rows, B12c, B12e.
- m2: `MfaClient.runLockStep` is the one writer of `npcStepOpener` (scenario room and every sprite from `_findAllDoorSpritesForRoom`); JS row added. Differs from the review in one detail: `ApiClient.unlock` already spreads its fifth arg `extra` into the body, so the fromDoor flag is a new sixth arg, never posted. LOCK 5.4.
- m3: the gate writes the grant on any accepted `npc` post for a gated door, also on a re-answer from a live record (one small write, no row, no count); `opener` is the grant after the write; server-only, never in a sync body. LOCK 5.2 step 4, 5.3, G2 NPC grant row.
- m4: pane opens at once when the first check is clear and no chat return pending, toast only when not clear; the door retry passes `fromDoor` and skips the wait. LOCK 5.4, B12c.
- m5: `runLockStep` serialised, one pane at a time, later requests queued and re-checking clear; JS row added. LOCK 5.4.
- n1: `playerIsKnockedOut` added to clear; null `startMinigame` is a silent cancel. LOCK 5.4.
- n2: fallback and its JS row cut (both server checks are static); the retry has no refusal path. LOCK 5.4.
- n3: section 10 names `npcStepGrants`. n4: LOG section 11 badge bullet left (review says no contradiction; not in this file set). n5: reworded. LOCK 5.4.
- n6: not cut. Cost of each answer and the cut options added to open question 1; the wait-for-conversation question added as 9 so it stays open (decision belongs to the user).

## R9 fixes (2026-11-19)

- m1: the door retry handles the real rejection (`body.reason === 'second_step_cancelled'` returns via `cancelFeedback`; any other rejection shows "Failed to verify access"); no unhandled rejection; both tested. LOCK 5.4, JS rows.
- m2: a queued request re-posts `/unlock` at the head before opening; success settles with no pane, already-open target is dropped quietly, expired record opens on the new one; stale and already-open cases tested. LOCK 5.4, JS rows.
- m3: the queue serialises on an open pane only; a waiting `npc` request holds no place, so a pad's own step opens at once; tested. LOCK 5.4, JS rows.
- m4: `door_unlocked_by_npc` fires once per open from whichever path opens it (bridge on the conversation path, the retry with `retry: true` otherwise); doors with no second step unchanged; listeners checked: m09 `restricted_cage` (`cage_opened`), m10 five `setGlobal` mappings (lines 1806, 1840, 1848, 1951, 1984), `objectives-manager.js:348`. B12c, B12e, JS rows updated. Differs from the earlier R8 choice (no emit on retry).
- n1: shared-files rows name the sixth argument and the queue, knock-out check and `npcStepOpener` writer.
- n2: a `fromDoor` request whose single check is not clear settles as a silent cancel and never queues behind a waiting request.
- n3: the bootstrap adds `npcStepOpener` only for a room not in `unlockedRooms`.
- n4: `opener` wording fixed: the grant's value, also on a re-answer from any method.
- Open questions 1 and 9 left open and undecided.

## Round 2 picks (2026-11-19)

- R2-4 a: 5.2 step 4 states the `npc` method never skips the step (NPC stands in for the first factor only, even as owner; only a claimed flag reward skips); question 1 and its cut options removed from section 15.
- R2-10 a: 5.4 states the pane does not open over a chat; question 9 removed.
- R2-5 b: new 5.5 "Carried items" with the inventory-path audit table, `carried_step_ids`, Rule D (`carried_step_reachable?`), shared record for copies, `secondStep` in `FORGEABLE_ITEM_FIELDS`, opening from the inventory; question 7 removed.
- R2-5 b: Rule D lands in G1, not G3, because G1 already allows a step inside an NPC-carried container and on a nested takeable (same reach gap); G3 adds only the top-level carried placements. Orchestrator may challenge.
- R2-5 b: stage table gains G3 (after G1, either side of G2; `password`/`pin`, then G2's types once G2 lands); header says G1, G2 and G3; section 1 gains the briefcase example; section 4 gains a G3 JSON example and placement text.
- R2-5 b: refusals from the closed lists only (generic 422, 404 "Container not found", "Item not found in scenario", `/mfa/*` 404); section 6 route table and 5.2 step 2 read Rule D.
- R2-5 b: section 9 replaces the carried-item refusal with "until G3" plus the carried-item errors (key or card, `usb`, consumable, hideable) and a copy-transfer warning.
- R2-5 b: sections 7, 8 and 10 state no new state key, nothing in synced `player_state`, shipped scenarios unchanged.
- R2-5 b: section 11 gains seven controller rows (G1 reach after removal, not yet released; G3 drop and pick-up, every home, re-add, client-built, copies), a node paragraph, the briefcase and courier box in the feature scenario, beats B13a to B13f, and the live proof list.
- R2-5 b: section 12 order and shared files (`game.rb`, `games_controller.rb`, new `item_identity.rb` row owned by this plan, since no ops plan edits it; the handover's request to the core plan dropped).
- R2-5 b: section 14 request 2 gains the `/mfa/*` reach call; a new "Open" line notes the existing reach gap for plain carried items, with no scope change.
- R2-11 a: section 14 marks both existing-code bugs as fixed outside this plan on their own branch.
- Section 15 renumbered 1 to 6 (old 2, 3, 4, 5, 6, 8); in-body references updated (sections 4, 5.2, 5.3, 5.4, 8, 14).

## R10 fixes (2026-11-19)

- MAJOR-1: wording fix per the orchestrator's ruling. Section 1 now promises "no crafted request skips Gordon's approval"; G3's done-when says a gone item is reached only after a re-add and still needs both checks unless passed; 5.5 gains "Re-adds" naming the four paths (start item, grant, NPC give, room takeable) as best-effort under the cheat-resistance policy, with the record surviving; NPC-give row says a give is the browser's word; new G3 "Re-add after removal" controller row; section 14 "Open" line; section 15 question 1 offers (a) wording only, recommended, or (b) server-only `carriedGone` with storage, delta-sync, tests and scenario costs.
- MAJOR-2: Rule D is now a path rule, `carried_step_reachable?(object, path)`, triggered when the object or anything on its path is in `carried_step_ids`, so contents of a gated carried object are judged too; runs with Rule C at every exit; new "Gated contents path" row.
- MAJOR-3: `carried_step_chains` memoises every carrier at or above each carried gated id with its home; leg 1 walks innermost first for held or dropped; leg 2 falls back to the outermost carrier's home. New "Innermost carrier" row with cases (a) briefcase removed, (b) archive removed, (c) both. Case (b) is reachable (the archive is listed in the held briefcase again), which follows the ruling on MAJOR-4 rather than the review's "fails both ways".
- MAJOR-4: a nested takeable that leaves the inventory goes back to its container, as today (`filter_container_contents`); 5.5 table row says so; old row 935 split into "NPC briefcase" (422/404 kept) and "nested takeable" (listed again, re-answers from the record); validator warning on `remove_item` naming a gated nested takeable.
- MAJOR-5: leg 2 treats a `nested` carrier as in place and defers to the route's own tests (room, Rule B, `path_unlocked?`, `session_admits?` or the folder route, the share foothold) with their own answers; new "Sign-in desktop in place" row; Copies row extended (desktop copy in reach after the inventory copy is removed; Move case).
- Take routes: Rule D judges the path above the item being taken only, so a legitimate give, start item or grant add is not refused by its own not-yet-held state. Not in the review; found while redesigning.
- MINOR-1: validator error on `droppable: true` for a gated declared-grant item; grant row in 5.5 says a dropped grant item resolves nowhere until picked up.
- MINOR-2: "Where it runs" puts Rules C and D straight after the finder, before `check_container_unlocked`, scope 403s and the take tests; B13f adds `GET /container` and a take; new "Refusal order" row.
- MINOR-3: section 14 request 2 says the MFA lock form leaves one hook and G1 puts `carried_step_reachable?` in it.
- MINOR-4: flag-station `itemsHeld` row in 5.5's table; validator walk covers flag stations and errors on `secondStep` there.
- MINOR-5: validator reads `DEFAULT_HEAL_BY_TYPE` patterns from `consumables.js` once per run; a spec fails on zero or uncompilable patterns (no Ruby mirror exists to compare against).
- MINOR-6: section 15's six answered questions removed; references at sections 4, 5.2, 5.3, 5.4, 8 and 14 replaced with the decisions (LOCK-2 to LOCK-6, LOCK-8, all a). G1/G2/G3 order was already stated in section 3.
- MINOR-7: Copies paragraph reads "`copy`, or `both` when the player picks Copy"; table row notes `record_copied_item!` runs only for `copy`.
- NIT-1: Rule D names `Game#room_unlocked?` and excludes the awareness world room and `npcRouteRooms`.
- NIT-2: "walks the same homes except profiles and shares, which the scope branches find".
- NIT-3: B13e uses `GET /container` on the briefcase and `/unlock` plus a take on `board_minutes`; the courier box's `remove_item` names the briefcase by id.
- NIT-4: drop row says rooms never lock again, so the case is a crafted `player_drop` naming an unopened room.

## R11 fixes (2026-11-19)

- MAJOR-1: at take routes and the copy builder Rule D judges the item's own carrier chain minus the item itself (trigger as before, deepest carried id, empty chain true), so a gated archive in a gone ungated briefcase is refused; give, start and grant adds still pass. Case (c), the Re-adds paragraph and the G-stage row updated.
- MINOR-1: section 15 option (b) now writes on `remove` only when no room's `objects_added` holds the id, on `hide`, the jack plant and the implant; clears on pick-up; read by `validate_item_collectible` only. Recommendation (a) stays; the closing line names the drop rule.
- MINOR-2: Rule D runs before the takeable test (`:3416-3437`); its take refusal is "Item not found in scenario", never the named takeable 422. Refusal order row and B13e extended.
- MINOR-3: the out-of-reach drop is a model test (a copy written straight into `objects_added` of an unopened room); no route reaches it (`games_controller.rb:1087-1089`).
- MINOR-4: new section 9 error for a carrier with no `id` at or above a `secondStep` object.
- NIT-1: leg 1 says a route room in `npcRouteRooms` does not count and an awareness world room counts once its first `GET /room` adds it.
- NIT-2: row 998 takes the archive, not the note, and says why.
- NIT-3: the removal row in 5.5 names the jack plant and the implant.

## Round 3 decisions applied (2026-11-19)

- R3-5 a: no `carriedGone` list. Section 15 question 1 removed; section 15 reads "None open."
- R3-5 a: 5.5 "Re-adds" and the G3 done-when say the re-add routes are known best-effort routes and the step itself is never skipped; section 14's two bullets reworded to match.
- R3-8 a: new stage G4 (section 3 table, build order in 12): Rule D extended to plain carried containers (top-level carriers with a lock or `contents`), after G3.
- R3-8 a: new 5.5 paragraph "Plain carried containers (G4)": trigger, closed-list refusals, bounded `carried_step_chains` (one entry per such carrier, nested takeables have none, single memoised walk).
- R3-8 a: section 11 gains three G4 rows (legitimate flows: give, start item, nested container in a held briefcase, dropped item in an unlocked room; chain table bound; shipped scenarios).
- R3-8 a: shipped scenarios touched, from a grep of `scenarios/`: `test_unlock_gaps` (start cryptex bag, courier bag), `ceo_exfil` (reception tablet), `test_social_m5_channels` (m5 terminal); their critical paths must still pass. Section 10 states the G4 exception.

## Round 3 delta fixes (2026-11-19)

- Major 1: an id-less plain carrier (the `ceo_exfil` tablet) gets no chain entry and keeps today's best-effort behaviour; stated in 5.5 "Plain carried containers", in the shipped-scenarios paragraph and in the G4 test rows ("none for a carrier with no `id`", shipped row).
- Major 1 (ruling): validator warning in section 9 for a plain carried container (NPC `itemsHeld` or start item, with a lock or `contents`) that has no `id`, with its own spec; the error for a gated carrier without an id is unchanged. G4 row in the build section not changed beyond the tests.
- Minor 1: the Rule D reach paragraph ends "(From G4 the trigger also includes plain carriers, below.)"; section 10 names the G4 trigger as well.
- Minor 2: G4 fixture row gains a takeable `usb` stick with `contents` after a plant (`network_access.rb:262`, `:516`); a later `GET /container` is refused.
- Nit 1: section 10 names the five `ops_unchanged` scenarios (`test_objectives`, `test_simple_success`, `test_pin_dust`, `m01_first_contact`, `m02_ransomed_trust`).

## Cross-plan R8 fixes (2026-11-19)

- m1: the G4 id-less warning now covers every plain carrier the validator sees with no `id` (NPC `itemsHeld`, start item, granted item, `takeable` room object, such as the `ceo_exfil` tablet); its spec adds a `takeable` room object.
