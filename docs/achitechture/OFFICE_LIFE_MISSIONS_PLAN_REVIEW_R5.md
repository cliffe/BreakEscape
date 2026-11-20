# Office life missions plan: review round 5

Reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at a2fbef93c (draft 5), against the code and docs in this worktree.

## Verdict

Not ready. There are no blockers, but four majors. One of the three "beat protections" does nothing as the engine is written. The pilot's announce pools fail the validator and could never fire with the pilot's cast anyway. V5's event list misses about twenty timing-dependent events, and the fixture meant to catch that is checked against a catalogue with the same gaps. The format-rename route depends on a rewrite tool that may never be built. Each fix is local. The rest holds up against the code: the pilot choice, the sync table, voicing timing, the desk-phone reasoning, the dungeon graph JSON for V9, V6's extractor and rake form, and the 8b/8c field map.

## Blockers

None.

## Majors

**M1. Protection 3 ("resume, then suspend, on one event") does not keep an NPC at its post.**
Evidence: `control()` in `public/break_escape/js/systems/npc-needs.js:959-961` returns early on `resume` unless the NPC is already `scriptSuspended`, so on a free-running NPC it does nothing and does not walk it home. `suspend` (952-956) aborts any job, sets `mode = 'idle'` and freezes the NPC where it stands. If the NPC was suspended, `resume` calls `_goHome` and a `suspend` in the same dispatch cancels that walk at once. `npc-manager.js:1581-1582` applies one `needs` command per mapping, in order. So the pair ends with the NPC frozen wherever it was, possibly in another room. That is the exact failure section 2 (line 68) warns about for a bare `suspend`. Plan lines 68, 174 and 280 (V2's exemption) all rely on the pair.
Fix: redefine protection 3 as a mapping on the preceding event with `patrolOverride.targetTile` set to the post tile. A scripted `goToAndStay` suspends needs through `onExternalMove` (`npc-behavior.js:2993`, `npc-needs.js:636-646`) and walks the NPC to the tile. Then add a `"needs": "resume"` mapping on an event after the beat. `patrolOverride` resolves the tile against `window.rooms[npc.roomId]` (`npc-manager.js:1556-1566`), so add one case to the E1 probe: the NPC is in another room when the event fires, walks back, and the beat opens. V2 exempts only on that pattern.

**M2. The pilot's NPC-own announce pools fail the validator, and with this cast they could never be spoken.**
Evidence: plan line 304 gives Dani and Priya "their own `cake` and announce pools", and line 433 bans scenario-level `chatter` in campaign missions. `scripts/validate_npc_needs.rb:310-321` raises an ERROR when `magnet.announce` names no scenario-level pool with lines, so stage 4's "0 errors" exit cannot be met. Even without `announce` (the topic then falls back to `news` and the NPC's own pool merges in through `chatterPool`, npc-needs.js:242-251), the announce needs three things:
- a knower in its own post room, in a different room from the magnet (`_tickNews`, 838-849);
- a hearer that is a needs NPC in that same room (`_newsHearers`, 865-879, iterating `this.states`);
- someone to tell, or there is no line at all (849).

Dani's post room is the floor and Priya's is the lab. Each is the only needs NPC in its room, and Irina has no needs, so no announce can ever fire. Voicing those pools (section 10, `ttsPregenerateChatter`) would pay for clips nobody hears.
Fix: drop `magnet.announce` and the announce pools from the pilot. Keep the cake as a per-room lever: sight is enough (`_sight`, 813-823), it draws Dani from his desk on the floor, or Priya from hers in the lab, which opens the screen-habit window. Add one line to section 5 and to the fit checklist: word of mouth needs two needs NPCs posted in one room, so it waits for Tier 3. When it comes back, choose between a scenario-level announce pool (which conflicts with section 10's ban and is voiced for every voiced NPC) and an approved change to the validator and extractor.

**M3. V5's event list is incomplete, and its fixture is checked against a catalogue with the same gaps.**
Evidence: the emitters in `public/break_escape/js/systems/*.js` include timing-dependent office-life events that no V5 prefix (line 283) covers: `npc_told`, `npc_avoided`, `npc_need_urgent`, `npc_need_parked`, `npc_needs_leashed`, `npc_job_failed`, `npc_use_failed`, `npc_use_refused`, `npc_use_started`, `npc_sat_at`, `npc_visit_arrived`, `npc_visit_done`, `npc_visit_dropped`, `npc_borrowed_session`, `npc_borrow_done`, `npc_borrow_dropped`, `npc_usb_copied`, `npc_usb_refused`, `npc_locked_out`, `npc_picked_up`, `npc_left_item_gone`, `npc_frustration_changed`, `npc_checked`, `npc_guest_left`, `npc_action_windup`. The fixture compares the constant with `NPC_NEEDS_SYSTEM.md`, and `grep -c` there returns 0 for `npc_told`, `npc_use_started`, `npc_visit_arrived`, `npc_borrowed_session`, `npc_usb_copied`, `npc_locked_out` and `npc_sat_at`. So the fixture would pass while a required task keyed on, say, `npc_told:<id>` goes unflagged, which breaks rule 1.
Fix: the fixture takes its list from the code. It scans `_emit(\`` and `env.emit(\`` in the office-life modules (`npc-needs.js`, `workstation-state.js`, `npc-workarounds.js`, `item-drop.js`, `table-drop.js`) and asserts that every name is either covered by a V5 prefix or on a short named exclusion list: `npc_ko`, `npc_attacked`, `npc_became_hostile`, `npc_hostile_changed`, `npc_influence_changed`, `npc_items_changed`, `npc_reported`, `npc_arrived`, `npc_placed`, `mail_sent`, each with its reason. Alternatively, invert V5: match every `npc_` event except that exclusion list.

**M4. The rename route depends on `tools/format/rewrite_templates.rb`, which may never be built.**
Evidence: plan section 8 rule 3 (line 385), section 13 step 6 and decision 3(a) run `rewrite_templates.rb --step <n>` on the branch. On main, `tools/format/` holds only `upgrade_games.rb`, so 8a landed without the tool. The 8b build log (branch `build/hard-8b`, `SCENARIO_FORMAT_HARDENING_BUILD_LOG.md` chunk 4) lists it as "(if the 8b case needs owner-derivation support)", and the 8b re-anchor note says every template it rewrites is plain JSON apart from lab_physical_pentest. m06 is a large ERB template. So the tool may not exist, or may not handle m06's ERB.
Fix: give rule 3 a fallback. Hand-edit the few renamed keys (the pilot writes perhaps 2 to 6). Then prove the edit the way 8b chunk 4 proves its corpus: the step's `FormatUpgrade` `scenario` transform applied to the old render equals the new render. Re-run the validator and V9 and log the diff as mechanical. Stage 0 records whether the tool exists for each merged step.

## Minors

**m1. The :3002 recipe is wrong.** `tools/playtest/new-game.rb` only creates a game; `PLAYTEST_PORT` only changes the printed URL (`new-game.rb:513`). Section 10 (line 410) and section 12 item 5 need the actual server start from the worktree, as in the existing practice: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main repo>/vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3002`. They also need `bundle exec rails runner tools/playtest/new-game.rb` (a worktree has no `.bundle/config`), and a note that the suite runner hard-codes 3001, so regression playtest jobs run by hand. Cite AGENTS.md:173 and :221 for the shared-database rule.

**m2. Hunger has no ordinary source on the floor.** The floor's `mini_fridge1.png` is undeclared decor (`assets/rooms/room_hce_trading.json`), so before a cake arrives, Dani's and Priya's `hunger` has nothing to meet it. The leash check may warn, and the needs will park. The stage 2 plan should either set hunger to sit inside the cake's tempt band without ever going urgent, or declare the fridge (another same-image claim). It should also list the `cake_servings` global the validator requires (`validate_npc_needs.rb:288`).

**m3. Rule 10 and decision 4(c) disagree.** Rule 10 (line 36) already forbids a release with unvoiced office-life lines, but decision 4(c) offers exactly that. Either say that choosing 4(c) overrides rule 10, or drop 4(c).

**m4. OFFICE_LIFE_PLAN 12.11 says the opposite about `deferrable: false`.** 12.11 (`OFFICE_LIFE_PLAN.md:4398-4400`) says a story beat uses `deferrable: false`. This plan correctly says that makes the NPC leave more readily (`NPC_NEEDS_SYSTEM.md:100`). `references/patterns.md` should state the correction, so a writer who reads 12.11 does not copy it.

**m5. The twin count on the floor.** The floor map has `pc6.png` three times and `pc8.png` and `pc11.png` twice each (`room_hce_trading.json`), and `trading_workstation` already claims one PC sprite. The pilot's stage 2 should list which twins it declares, so slice 1 does not hide monitors by accident.

**m6. Exchanges in the pilot are Dani and Priya only.** An exchange plays when a compatible pair of needs NPCs meets (`NPC_NEEDS_SYSTEM.md:621-626`). Irina has no needs, so exchanges with her cannot play, and Dani and Priya meet only at the floor's coffee point. Line 304 should say that the exchange count is one or two Dani-and-Priya knots, which also caps the voicing budget.

Counts: B=0 M=4 m=6
