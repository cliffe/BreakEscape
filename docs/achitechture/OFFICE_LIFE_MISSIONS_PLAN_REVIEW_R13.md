# Office life missions plan: review round 13

Plan reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md`, draft 13, at 9defbd111 (branch plan/office-life-missions). Read fresh against the engine, m02 and a live browser proof; no earlier review file was opened.

## Verdict

Not ready to close. 0 blockers, 4 majors, 9 minors, 3 nits.

The structure holds: the skill's stages, the validator set, the voicing route, the review loop, rule 1 and rule 2, Bernie's four phones, Gary option (a) and the sync sums all check out against the code, and nothing in the pilot moves a lock, key, required task or story global. The first-visit beat works as written: in 5 runs out of 5 the pair stood about 2.1 s after the player came in, met at the boiler and played the paper exchange to a player doing step 10 (all five lines heard in four runs, four of five in the fifth).

The other three break starts do not deliver what 6.4 and its exit test claim. The Kim break goes to the one chatter object the Kim-to-IT crossing never comes within earshot of; the burn exchange's first line was heard on 2 of 5 straight walks out of IT, and the "tune delayMs 0 to 2 s" step can only make that worse; an exchange that runs to its end counts as heard even when the player heard none of it, so the burn beat can be spent on an empty room; and the cooler pairing failed (partner timed out) on 1 of 3 tries. Each has a concrete fix below, and one fix (Kim's break at the boiler) was proved live.

## Blockers

None.

## Majors

### M1. The Kim break uses the cooler, which is out of earshot of the route the player takes after Kim

Evidence. Plan 6.4 mapping 3 (`OFFICE_LIFE_MISSIONS_PLAN.md:470`) sets the domestic's thirst on `conversation_closed:dr_sarah_kim`, "a cooler break as the player walks back through the staff room". After Kim the walkthrough sends the player to the IT door (`TESTING_WALKTHROUGH.md:124`; HaX's text at `scenario.json.erb:928`). Measured room-local positions in the staff room: Kim's door about (272, 0), the IT door about (310, 80), the south door about (272, 246); cooler approach cell (252, 244) and second user's cell (220, 244). From the IT door the cooler pair are 170 to 181 px away, beyond the 160 px `OVERHEAR_RADIUS` (`npc-needs.js:47`). Live: runs 3894, 3946 and 3947 (the last two with the player standing 5 s at the IT door, as when unlocking it) heard 0 cooler lines; every line logged `overheard: false` at 171 to 299 px. The pair also met 4.9 s after the close, after a 1.6 s crossing had ended, so "the pair are at the cooler as the player crosses" held for the domestic only.

What goes wrong. Exit test item 3 (`:480`, "a pool or exchange line is heard on at least 2" of 5) cannot be met on the walkthrough route; the break spends pool lines on an empty room.

Fix. Move mapping 3 to the porter and make it a boiler break: on the porter, `{ "eventPattern": "conversation_closed:dr_sarah_kim", "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`; the existing `npc_use_started:staff_boiler` coupling brings the domestic. Proved live (game 3948): the pair met 3.9 s after the close and three lines were overheard at 92 to 119 px by a player standing at the IT door. Rewrite the exit test item to "standing at the IT door to unlock it after Kim, a pool or exchange line from the boiler is heard on at least 3 of 5".

### M2. The burn exchange is heard on a straight walk out of IT about two times in five, and a delay makes it worse

Evidence. Plan 6.4 mapping 2 (`:469`) and exit test item 2 (`:479`, "4 of 5"), with "Stage 4 tunes a delayMs of 0 to 2 s so that the exchange starts with the player in the room". Measured from the close of Gary's conversation, with no delay: the porter reaches the boiler in 1.7 to 2.0 s, and the domestic stands only then (the coupling fires on the porter's `npc_use_started`, `npc-needs.js:3201`), so the pair meet 4.2 to 4.4 s after the close. The player enters the staff room 2.1 to 2.4 s after the close and is in the corridor 4.4 to 4.7 s after it. Five straight walks out (enter staff room, enter corridor): 3985 and 3986 heard line 1 (at 1.8 s into the room); 3946 left 0.07 s before the pairing, 3947 left 0.73 s before it, 3948 started the exchange but its first speaker was at 177 px and unheard. That is 2 of 5. A run in which Kim's cooler break was still going when Gary's conversation closed (3894) put the first burn line 8.2 s after the close. I also tried setting both NPCs at the close (a second `onceOnly` mapping on the domestic): they met 1.9 s after the close, while the player was still in IT, so the first turn went to a pool line with nobody in earshot and the next turn came after the player had left (0 of 2, games 3987 and 3988).

What goes wrong. The crossing is about 2.3 s and chat turns are about 4 to 4.5 s apart (`bubbleMs` plus `CHAT_GAP_MS`, `npc-needs.js:46`, `:66`), so a straight crossing catches a turn only when the pairing lands in a window well under a second wide. Any `delayMs` moves the pairing past the exit. The plan presents the burn exchange as something the player "walks out of IT with their cover blown" into (`:367`, `:469`); measured, most players walk past it.

Fix. Delete the `delayMs` tuning sentence and keep the mapping undelayed. Restate the beat honestly: the burn exchange is heard on the walk out about half the time, and otherwise on the next crossing where the player stops (it stays unheard, and therefore available, as long as it never starts without an audience; see M3). Set the exit test to what was measured, "2 of 5 on a straight walk, 5 of 5 when the player stops 3 s in the staff room", or give the player a reason to stop: the existing HaX text that arrives 1.5 s after the first post-burn entry to the staff room (`scenario.json.erb:944`) is one; stage 5 then measures whether players stop to read it. Note in 6.4 that a Kim break still running when Gary's conversation closes delays the burn break by up to the cooler's 25 s.

### M3. An exchange that plays to an empty room counts as heard, so the burn beat can be lost

Evidence. `npc-needs.js:3904` starts an exchange when either NPC of the pair is in earshot (`_audience`, `:2701`); each line is then marked overheard by its own speaker's distance (`:3918`); and `_finishExchange` treats a completed exchange as heard whatever `heardLines` is (`:2753`, `heard = complete || ex.heardLines > 0`), sets `heard_<knot>` (`:2758`) and never offers it again. Live, game 3948: the burn exchange started while the player stood near the IT door, its first line (porter, 177 px) was not overheard, the player walked out, and the remaining two lines played to an empty room; `npc_exchange_heard:night_watch_burned` fired with `complete: true` and the global was set with 0 lines heard. Plan 6.8 (`:545`) says only that "a cut after one overheard line counts the exchange as heard", and `:541` relies on "a player who lingers in IT ... meets it on a later crossing".

What goes wrong. The plan's safety net for the burn and cleared exchanges does not exist: a crossing can consume the burn exchange silently, after which `night_watch_cleared` becomes eligible (its gate reads `heard_night_watch_burned`, `:542`) and plays a follow-up to news the player never heard.

Fix. Either (a) add engine item E9: count an exchange as heard only when `heardLines > 0`, and start one only when the first line's speaker is in earshot; small, testable in `test_needs_sims`, an approval item like E7; or (b) without it, state the behaviour in section 2 and 6.8, gate `night_watch_cleared` on a global the player's own action sets (for example `cover_restored` alone, written so it stands without the burn exchange), and add a stage 5 check that logs `heardLines` for every exchange. Recommend (a), landed with E7, since both fix "spent on an empty room".

### M4. The cooler's second-user cell is not where 6.5 says, and the partner timed out on 1 of 3 cooler breaks

Evidence. Plan 6.5 (`:490`): "With the approach at about (244, 244), the second user's first candidate is (276, 244), which the domestic reached in the prototype." With a `useFrom` one tile west of the preset's (`{ "dx": -1, "dy": 1 }` from the sprite centre (282, 208.5)), the live approach cell is (252, 244); the right-hand candidate (284, 244) is not walkable, so `besideCell` (`npc-needs.js:5021`) returns the left one, (220, 244). From the porter's post that cell lies past the east table (Tiled `tables` at 6.16, 6.56, about x 197 to 248, y 171 to 210), and the lane east of the table is where the domestic stands. Cooler breaks measured: 3894 and 3946 paired (overlap 22.5 s, matching the plan's "about 22 s"); 3947 logged `job_failed ... reason: timeout` for the porter and he walked home after 21.4 s, so the domestic used the cooler alone. No dx or dy is given in the plan.

What goes wrong. The implementer gets cell figures that do not match "one tile west", and the exit test item "both NPCs are using the cooler at once" (`:482`) is flaky. With M1 applied the cooler is used only by the domestic's own thirst breaks and their coupling, so this matters less, but it is still half of 6.4's "alternating boiler and cooler".

Fix. Write the `useFrom` as numbers, choose them so that the first walkable `besideCell` candidate lies on open floor with a clear route from both posts (for example an approach on the cooler's west face so the partner stands south or west of it in the open, checked with `room-snapshot.mjs`), and make the stage 4 check five consecutive cooler pairings with no `timeout`. If none is clean before E8 lands, make the cooler a solo thirst source (`capacity: 1`, no coupling) and put every coupled break at the boiler, which paired in every run (7 of 7).

## Minors

### m1. Pairing time after the first-visit trigger is 4.0 s, not 3.25 to 3.5 s

`OFFICE_LIFE_MISSIONS_PLAN.md:468` quotes "pairing 3.25 to 3.5 s after the trigger", a figure from the earlier `npc_left_post` coupling. With `npc_use_started` coupling, 8 runs measured the porter standing 2.08 to 2.32 s after entry and the pair meeting 6.04 to 6.47 s after entry, so 3.9 to 4.3 s after the trigger. `:473` already says the partner starts later; update the figure.

### m2. The first chat turn of the first meeting is a pool line, not the exchange

On the first pairing the exchange knot's lines are not loaded yet, `_findExchange` returns `pending` (`npc-needs.js:2691`), and `_tickChats` falls through to a bark (`:3903` to `:3906`). Every first visit measured opened with a pool line ("D coffee line 2.") and the paper exchange began on the next turn, 4 s later. Harmless, but the paper exchange's five lines then end about 26 s into the 28 s overlap; say so in 6.4 and 6.8, or have stage 4 confirm that the knot's story is preloaded when the staff room loads.

### m3. "A player who walks into earshot mid-break still hears one" does not match the cooldown's rhythm

`:466`. With `chatterCooldownMin: 0.25` and turns alternating every 4 to 4.5 s, each speaker's own turns come about 8 s apart, so each speaks at about 0 s and again at about 21 s, with picture chat between (runs 3946, 3948, 3895: two lines, then four picture turns over 12 to 13 s). A player who arrives 8 to 20 s into a break sees pictures. At the 25 s cooler each speaker says one line. Either state the gap, or measure 0.1 (6 s) against the 25-minute repeat rule in 6.8 and section 10.

### m4. Mapping 4 fires on every corridor entry, including leaving the staff room

`:471` calls it "Arriving from the ward", but `room_entered:office_corridor` with no condition also fires when the player walks south out of the staff room, starting a break behind them and taking the 120 s cooldown, so a return from the ward inside two minutes gets nothing. The `room_entered` payload carries `previousRoom` (recorded live). Fix: add `"condition": "data.previousRoom === 'ward_hall'"`. The validator also warns on this mapping (a staff-room NPC listening for a corridor event; it asks for `"fireOnlyWhenLoaded": true`); add that field, and list the warning in 6.10. Measured with the mapping as written: the pair met 0.23 to 2.0 s after the player entered the staff room (plan: 0.75 s); from the south door the domestic's lines were heard at 140 to 145 px and the porter's were not (160 to 183 px). The exit test has no item for this mapping; add one.

### m5. Gary's mug: the `useFrom` must be aimed from the sprite's runtime centre, and his needs values are missing

`:408` and `:414` describe the aim but give no `position`, `dx`, `dy` or need values (`:409` says only "slow: a sip every few minutes"). A declared `position` of (5.6, 4.2) put the mug's sprite centre at (187.5, 141), not (179.2, 134.4), so a `useFrom` worked out from the declared tile (dx 0.775, dy 1.675) gave a home cell 14.7 px from Gary, and after `suspend` then `resume` he sat in mode `returning` without moving (game 3929). With dx 0.5, dy 1.45 the cell was (204, 188), 3.4 px away, and the resume left him idle and 0 px from his spawn (game 3934). Fix: give the mug's position and `useFrom` numbers, the formula (`dx = (201.6 - mug.x) / 32` with `mug.x` read through `window.npcNeedsSystem.world.getObject('gary_mug')`), and the caffeine values (for example initial 60, decayPerMin 4, urgentAt 35: first sip at about 6 minutes, then every 7.5).

### m6. Boiler and microwave `useFrom` values are missing, and the microwave cell sits beside the boiler's partner cell

`:489` and `:491` say "on the floor in front of the sink counter" and "in front of the counter". Live with dy 2.5 (boiler) and dy 1.5 (microwave): boiler approach (164, 124), partner (196, 124), microwave (212, 124), only 16 px from the boiler partner's cell, so a porter heating food while the domestic stands at the boiler would stand against her. Give the numbers and move the microwave cell a tile east or check it live with both in use.

### m7. Section 6.1 still puts both posts at the east table

`:387`, last column: "Posts for the night porter and the night domestic at the east table." Sections 6.3 and 6.4 (`:436`, `:463`) put the domestic at the centre table (measured: she sat in `staff_room_hospital_chair_north_14`, the porter in `..._chair_south_20`). Change the cell to "the porter at the east table, the domestic at the centre table".

### m8. E8 names the wrong function to copy, and section 2 says the approach cell is route-checked

`:682` proposes giving `besideCell` "the same route check `approachCell` uses", and `:73` says the approach cell "has one". `approachCell` (`npc-needs.js:4836` to `:4851`) only snaps to the nearest walkable cell; the route check lives in `reachable()` during selection (`:4852`) and, for a beside cell, in `cellBeside` (`:5000` to `:5013`, `routeLength` from the visitor's position). Fix: "give `besideCell` the per-side `routeLength` check that `cellBeside` already uses", and in section 2 say the approach cell is checked for reachability when the target is chosen.

### m9. Mapping 1 is not a first-visit mapping

`:468` labels it "First visit" and `:367` says "one on the player's first entry", but with `cooldown: 120000` it fires on every staff-room entry two minutes after the last; live it fired again on the return from the ward (run 3894). That is fine for the room's life, but the cadence is then set by the player's crossings, not "about every four minutes", and the pool-repeat estimate in 6.8 and section 10 (about 25 minutes) assumes the slower natural rhythm. Rename it "staff-room entry" and have the stage 5 dialogue check count repeats over a 20-minute walkthrough rather than over a still player.

## Nits

- n1. `:464` says the pair "exist once the staff room loads" and that only the corridor is loaded on a fresh game. Live, the staff room loaded and both NPCs sat about 3 s after the player entered the corridor, before the player reached the staff-room door. Say "the staff room loads as the player approaches it from the corridor".
- n2. `:599` to `:602`: the approval list breaks after item 5 with a blank line, so items 6 and 7 read as a new list.
- n3. `:409` says the narration "now describes what the player watches him drink"; the sip shows a cup icon and a sound while he stands still, and the observation text the player sees on the menu still says "has not moved from that chair" (`scenario.json.erb:2035`). Accurate enough, but "what the player sees him sip" matches the build.

## Live proof

Server: keyless, from the worktree, on 127.0.0.1:3090; stopped at the end. Games 3877 to 3988 (m02, VM flags auto-derived), each patched in its own stored scenario copy by `r13_proof/patch13.rb` with the pilot's fields as draft 13 writes them (the boiler `useFrom` dy 2.5, cooler `useFrom` dx -1 dy 1, microwave dy 1.5, 6-line pools, cooldown 0.25, three exchanges with the 6.8 gates, the four break mappings and two coupling mappings, Gary option (a) with the print mapping). The exchange and conversation stories were served from a throwaway `scenarios/tmp_olm02_r13/ink/` folder, moved to `tmp/delete/r13_tmp_olm02` afterwards; nothing under `scenarios/` was committed or left behind. Headless chromium, the throttle from the brief, `setFPS(20)` with fixed steps on. The player moved with the test bridge's `enter` (lines up at each door and walks through) and `moveTo` (pathfinding walk). Scripts and raw JSON: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/r13_proof/`.

| Claim (plan) | Measured | Result |
|---|---|---|
| (a) Coupling on `npc_use_started:<object>` with `data.npcId` condition brings the partner (`:473`) | Partner stood 0.06 to 0.3 s after the first user's `npc_use_started`, at boiler and cooler, in every run | holds |
| Boiler overlap about 27 s (`:474`) | 27.8, 28.5, 28.2 s (first user 30.0 s use) | holds |
| Cooler pairs with the hand-written `useFrom`, overlap about 22 s (`:474`, `:490`) | Approach (252, 244), partner cell (220, 244), not (276, 244). Overlap 22.5 s in 2 runs; partner `timeout` in 1 of 3 | M4 |
| (b1) First entry, `delayMs` 2000: stand 2 s after entry; pairing 3.25 to 3.5 s after the trigger (`:468`) | Stood 2.08 to 2.32 s after entry (8 runs); pairing 3.9 to 4.3 s after the trigger | holds; figure m1 |
| Exit 1: paper exchange in full on 5 of 5 (`:478`) | 5 of 5 runs played it to a player doing step 10; all lines heard in 4, 4 of 5 in 1; first turn always a pool line | holds; m2 |
| (b2) Burn: close of Gary's conversation with `cover_burned` starts a boiler break; exit 2: first line heard on 4 of 5 (`:469`, `:479`) | Mapping fired at the close in every run with the staff room loaded; pairing 4.2 to 4.4 s after the close; first line heard on 2 of 5 straight walks; with both NPCs set at the close, 0 of 2 | M2 |
| Exchange heard rules (`:545`) | Run 3948: burn exchange completed to an empty room with 0 lines heard and `heard_night_watch_burned` set | M3 |
| (b3) Kim close starts a cooler break; exit 3: pair at the cooler as the player crosses on 4 of 5, a line heard on 2 (`:470`, `:480`) | Pairing 4.9 s after the close (crossing ended at 3.4 s); 0 lines heard in 3 runs, 171 to 299 px; with the break moved to the boiler, 3 lines heard at 92 to 119 px (1 run) | M1 |
| (b4) Corridor entry from the ward; pair meet 0.75 s after the player enters the staff room (`:471`) | 0.23, 1.66, 2.0 s; one run's domestic did not arrive before the script ended; fires on any corridor entry | holds roughly; m4 |
| Print 6 s after the close, page on the tray, silent if the player has left (`:411`) | `object_revealed:it_copier_page` 6.0 to 6.05 s after the close; page pickable; player already in the staff room | holds |
| (c) Gary: 0 px drift over 10 minutes of needs clock; aimed cell within about 6 px; suspend then resume 0 px (`:408`, `:414`) | 40 steps of 15 s: 0 px, never moving, either cell. Aimed cell 3.4 px, resume idle, 0 px. Cell from the declared tile: 14.7 px, resume left him `returning` and still after 6 s. Conversation opened mid-sip in 0.6 s | holds; m5 |
| (d) Posts (6.97, 4.85) and (4.2, 6.1): both return home and sit after every break (`:463`) | Home cells (223.0, 155.2) and (134.4, 195.2) px; `npc_returned_post` then `npc_sat` after every break in every run (chairs `hospital_chair_south_20`, `hospital_chair_north_14`) | holds |
| Validator on the patched copy | Presets as 6.5 (boiler as kettle, cooler, microwave, copier), one reveal slot, T1/P lines (porter caffeine T1 2.0, P 8.0; domestic thirst T1 6.0, P 8.0), no error from the pilot's fields; one warning on mapping 4 (`fireOnlyWhenLoaded`) | m4 |

Static checks that held: `npc-manager.js:1223` (cooldown in wall-clock ms, default 5000 when unset, so the coupling mappings carry an implicit 5 s cooldown, harmless); condition strings with `data.npcId === '...'` and `&&` (`npc-manager.js:24` to `:131`); `needs.set`, `needs.print` with `forget`, `suspend`, `resume` (`npc-needs.js:949` to `:995`); `npc_use_started` payload (`:3201`); `HOME_EPS` 12 (`:30`); `_pickBark` spends a line at pairing (`:2637`); requireGlobal objects compared with `===` (`:266`); every V5 name in section 4 is emitted somewhere under `public/break_escape/js/`; the m02 citations (`scenario.json.erb:201`, `:936`, `:1481`, `:2035`, `:3332`; Gary ink `:80`, `:351`, `:764`; Bernie's four phones `m02_npc_receptionist.ink:282`; `cover_burned` set only in the keycard knots, `m02_npc_gary_whitlock.ink:206` to `:378`); lighting `lighting.js:655`, `:729`; `player-combat.js:453`; `NPC_NEEDS_SYSTEM.md:100`; `SCENARIO_FORMAT_HARDENING_PLAN.md:27`; clip totals in 6.8 (24 + 11 + 26 = 61; 53 with E7) and the sync sum in 6.9 (10 keys).
