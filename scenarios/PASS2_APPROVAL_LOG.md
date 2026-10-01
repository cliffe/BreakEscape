# Pass 2 (m03–m08): items awaiting approval

Changes the pass-2 agents did **not** make on their own, because they touch shared engine code, other missions, canon, continuity, new art/VMs/lab sheets, or delete files. Each item gives what, why, evidence, the proposed change, and what happens if it's declined.

Mission-local improvements that were safe to make are recorded in each mission's `PASS2_IMPROVEMENTS.md` instead.

## Status (2026-10-01): all approved and implemented

All approved and implemented. Verified with 261 Rails tests, 31 node tests, a clean validator on m01–m08 and sis01–03, and regression playtests on every m01–m08 mission (games 1186–1215).

**Implemented**
- **Engine:** every item in section 1 below. The `positionSouthSingle` parity change is inert, because no existing layout moves.
- **Reload persistence:** cloner cards, aim states, NPC ink variables, one-shot handlers and dropped items.
- **Validator and schema:** section 2, plus `scripts/check_door_alignment.py`.
- **SecGen:** m03, m04 and m07 are published; the m05 and m08 XMLs are reordered and fixed. The flag order is inferred from reading the XML; no VMs were built.
- **Canon:** section 4 is signed off as it stands.
- **Continuity** (section 5):
  - m07 now sets up "two of ours";
  - m06's CTO is renamed Dr Irina Volkova;
  - the bible's m08 evaluator is now Dr S. Okafor.
- **Docs:** section 6 deleted. `README_scenario_design.md` gained an Authoring Rules section.

**Found by the regression playtests and fixed**
- **m01:** three "Derek is contained" messages. Cause: unchanged globals were re-emitted on every conversation start.
- **m01:** the KO-dropped launch device lost its data and its ID on reload.
- **m02:** the press terminal soft-locked after "I'll step away".
- **m02:** the credits covered the debrief. m02 now uses the same `hear_debrief` task.
- **m02:** Ghost's opening message was lost.
- **m02:** one-shot handlers replayed after a reload.
- **m02:** a KO'd Val still ran her scene.
- **m08 and m07:** two debrief wording fixes.

**Left as is**
- The 0x00 cohort line and m08's start-inventory lockpick: the log made no recommendation, so both are unchanged.
- Phone message history after a reload is still short. The intros no longer replay, but the scrollback is not saved.
- The SecGen flag order still needs a real build to confirm.

## Orchestrator summary: what needs a decision

Nothing in m01/m02, the engine, the validators or SecGen was changed. Everything below is a proposal. The detail is in the per-mission sections further down.

**1. Engine patches** (each one would also change m01/m02 behaviour, which is why none was applied; the missions work around them today)
- `globalVarOnKO` sets its global without emitting `global_variable_changed` (m03 §6).
- `npc._sprite` is missing for NPCs in rooms loaded after the start, so KO item drops, `#remove_npc` and lockpick line of sight silently fail (m03 §5–6, m04 §7).
- `setVisible` is dropped for an NPC whose room hasn't loaded (m06 §6).
- Re-talking an ink story that ended at `DONE` shows "(End of conversation)" (m03 §6).
- Phone chats never emit `conversation_closed`; `conversation_closed` can fire twice for one close (m05 §2, §8).
- The phone preload runs contacts' `start` knots with the global observer attached (m05 §7).
- `collect_items` has no default `targetCount` (m05 §8).
- `setGlobalOnStart` emits no event (m05 §8).
- A mapping `completeTask` on a collect task races the pickup (m06 §10).
- The HUD countdown ignores `cancelOnGlobal`, and a reload restarts armed timers (m07 §8).
- Notes given as flag rewards never reach the inventory or notepad (m07 §9).
- `disableClose` leaves the "End Conversation" button live (m08 §7).
- Smaller items: the wrong-password "Network error" (`err.status` vs the message string), the RFID cloner leaving an empty minigame container, and reload losing cloner cards and aim states (m03 §6).

**2. Validator and schema proposals:** a door-alignment check (`tools/pass2/door_align.py` reproduces the engine's coordinates), and rejecting `||` or parentheses in eventMapping conditions, `complete_task` actions without `taskId`, and collect tasks without `targetCount`. Also add `rfidCard` to the schema and stop flagging `targetKnot` inside `sendTimedMessage` (m04 §7, m05 §7, m06 §2, m07 §8, m08 §6).

**3. SecGen** (separate repo, untouched)
- Publish m04's VM (`scenarios/m04_critical_failure/secgen/`, now using `sudoedit` because `sudo_baron` only builds on Buster) (m04 §5).
- Publish an m07 VM (its current CTF names the target `server`, so its flags come back empty in Hacktivity) (m07 §2).
- Fix m08's XML: a stray `strings_to_pre_leak` block makes five flags (m08 §2).
- m03 has no published VM either. Flag order for m05, m06 and m08 needs a real build to confirm.

**4. Canon and tone calls** (already applied in the mission, so these need sign-off, not action)
- SAFETYNET has no arrest powers in m05–m08: suspects are detained and handed to the police (m05 §7).
- m03's codenames and its re-seat on m02's figures (m03 §1–2).
- m05's lethal "left bleeding" ending (m05 §7).
- The countdown consequences in m04 (6/12 min) and m07 (Seattle goes dark if the clock expires) (m04 §5, m07 §3).
- m06's $847,000 re-attributed to fit m05 (m06 §5).
- Blackout named in m04's briefing, and the "Task Force Null" hook (m04 §3).

**5. Continuity to decide**
- m08's "two of ours are dead" isn't set up in m07 (m08 §3).
- Three Elenas in a row in m05–m07 (m06 §8).
- Dr Chen collisions: m05's Sarah Chen and the bible's Lyra Chen (m08 §3).
- "Fifteen years in 0x00's cohort" against 0x00 being new in m01 (m08 §3).
- m08's start-inventory lockpick makes the safe chain optional (m08 §3).

**6. Stale docs that could be deleted:** m07 `README.md`/`ALIGNMENT_PLAN.md` and m08 `README.md`/`SOLUTION_GUIDE.md`/`DEVELOPMENT_STATUS.md`/`ALIGNMENT_PLAN.md`. They describe superseded designs; each mission's `TESTING_WALKTHROUGH.md` and `PASS2_IMPROVEMENTS.md` are current.

---

## m03_ghost_in_the_machine

Everything mechanical in m03 was fixable mission-locally and is recorded in `scenarios/m03_ghost_in_the_machine/PASS2_IMPROVEMENTS.md`. The items below need a human call.

### 1. Canon — codenames and the offstage hierarchy (already applied; flagging for sign-off)
- **What:** the pass keeps Victoria Sterling as the WhiteHat *cover-CEO* / operational lead under the codename **Sable**, reporting to **0day** (cell lead) and **the Architect** (offstage). Client codenames in the roster/catalogue are **Obsidian, Vortex, Eclipse** plus the canon cells **Ghost/Ransomware Incorporated** and **Critical Mass**.
- **Why:** the escalated bible (`story_design/universe_bible/03_entropy_cells/zero_day_syndicate.md`) makes `0day` the cell leader, not Sterling; the previous draft's codename "CIPHER" collided with Ransomware Inc's "Cipher King". The alignment plan already resolved this; the pass-2 work assumes it stands.
- **Evidence:** `scenario.json.erb` lines ~24–52 (narrative vars), `ink/m03_opening_briefing.ink` `topic_victoria`.
- **If declined:** the codenames/roster names would need reverting, which changes the roster hex, the catalogue, the briefing and the debrief together.

### 2. Continuity figures aligned to m02 (already applied; flagging)
- **What:** m03's numbers were re-seated on m02 canon — the exploit is the **ProFTPD 1.3.3c source backdoor** (no CVE, so none is quoted), the sale is **invoice ZDS-2024-0847 to Ghost, $25k within a $55k package**, the attack is **Fri 15 Nov 2024, 02:47, ransom £150,000**, and **no death count is stated** (m02 ends with 2 or 6 dead depending on the player's choice). *Correction (review round 2):* the first version of this item said no count was stated, but Victoria's ink still said "six" three times (`m03_npc_victoria.ink` confrontation). Those lines are now count-free, so the claim is true as of round 2. Please confirm count-free is what you want, rather than picking one canonical number and updating m02 to match. The old draft had a fabricated `CVE-2010-4652`, a $12,500 price, ProFTPD **1.3.5**, "$2.8M ransom" and "127 surgeries".
- **Why:** m02 is the source of truth (`scenarios/m02_ransomed_trust/scenario.json.erb:2554` invoice; `:107` ransom/date). A hospital-attack figure that disagrees with the mission it references is a visible continuity break.
- **If declined:** revert the ERB narrative variables; the debrief and HaX revelation call would need matching numbers put back.

### 3. Cross-mission bug observed, NOT fixed (out of authority): m04 flag targets use the dead reference form
- **What:** `scenarios/m04_critical_failure/scenario.json.erb:253–297` sets `"targetFlags": ["bms_jump_server:flag_1"]` … the **reference form**. `app/models/break_escape/game.rb:1108` states plainly that `submit_flags` matches only the **display form** (`"<vmid>-flagN"` / `"<station>:<vmid>-flagN"`); the reference form "silently never completes its task." m03 had the identical bug and it was the mission's ending blocker (fixed here). m04 very likely cannot conclude either.
- **Evidence:** `game.rb` `process_flag_task_completions!` (:1049) + the NOTE at :1108; controller `generate_flag_identifiers` (`games_controller.rb:2182`).
- **Proposed change:** in m04, rewrite the four `targetFlags` to `"flag_station_dropsite:bms_jump_server-flag1".."flag4"` (matching m02/m03).
- **If declined:** m04 stays unconcludable if its ending is gated on those flag tasks. (This is the m04 pass's job; logged here because m03 is out of scope for it and the evidence surfaced during m03's fix.)

### 4. Purely-additive schema value already permitted by the brief — none used
- No new enum values were needed. `unlock_object` (the one the brief pre-approved) is not used by m03. Noted for completeness.

### 5. Engine: hidden or KO'd NPCs still trigger the lockpick line-of-sight interrupt
- **What:** `npc-manager.js` `shouldInterruptLockpickingWithPersonChat` (:248-325) and `isInLineOfSight` (`npc-los.js:21`) check the room, the mapping and the cone. They do not check whether the sprite is visible, whether the NPC is KO'd, or the mapping's `condition`. An invisible guard can catch a pick, and so can an unconscious one.
- **Why it matters for m03:** the guard in the executive wing watches Sterling's office door. The round-1 version hid him in the afternoon, which would have caught daytime picks invisibly. Round 2 reverts him to visible, so that case is gone. The **KO case remains**: knock him out and his frozen cone can still interrupt a pick.
- **Proposed patch** (in the NPC loop, before the LoS test):
  ```js
  const sprite = npc._sprite || npc.sprite;
  if (!sprite || !sprite.visible) continue;              // hidden NPCs see nothing
  if (window.npcHostileSystem?.isNPCKO?.(npc.id)) continue;   // KO'd NPCs see nothing
  ```
  `npcHostileSystem.isNPCKO(id)` is the accessor already used at `npc-sprites.js:178` and `player-combat.js:548`. The same guard belongs in the LoS cone check in `npc-los.js`.
- **If declined:** m03 can't fully mitigate this. After a KO, the player has to pick out of the guard's facing cone. The walkthrough flags it as a playtest check. Every mission that parks an NPC with a lockpick mapping in a room with a pickable lock is exposed the same way.

### 6. Engine gaps found by the m03 browser playtest (log only; m03 works around each where it can)
Evidence and repros are in `tools/playtest/m03-pass2-report.md`.
- **D2, `globalVarOnKO` doesn't emit `global_variable_changed`.** `npc-hostile.js:159-166` writes the global and calls `broadcastGlobalVariableChange`, which only syncs ink stories. Proposed patch: emit `global_variable_changed:<var>` with `{name, value:true, oldValue}` there, as `apply-actions.js` does. m03 now keys on `npc_ko:<id>` instead. Any mission still keyed on `global_variable_changed:<globalVarOnKO>` is dead until this lands.
- **D3, an NPC outside the start room has no sprite reference, so a KO does nothing visible.** Second symptom from the confirmation run (1158/1159): the same NPC record has no sprite or x/y, so the lockpick line-of-sight check (`npc-manager.js:248-325`) can't locate the guard, and guard detection can't be tested at all. Original symptom: There's no death animation and `dropNPCItems` returns early, so the NPC stays standing and drops nothing (Victoria and the guard in game 1156). Proposed: resolve the sprite from the room's `npcSprites` (or `behavior.sprite`) when `npc._sprite` is unset. m03's workaround is HaX handing over a copy of Victoria's card.
- **D4, empty `.minigame-container` after saving on the cloner's EM4100 screen.** Input stays disabled and Escape does nothing (games 1155 and 1157). Suspect `minigame-manager.js` `endMinigame` ordering.
- **D5, a reload loses state:** cloner `saved_cards` (client-only `scenarioData`), aim statuses (revert to `locked`) and Victoria's intro (replays). If the player reloads before cloning, they must redo the clone.
- **D7, `setVisible:false` on the receptionist didn't hold in play.** Undiagnosed from the source: behaviour is registered for every sprite NPC and `update_npc_state!` merges `isVisible`. It needs a live trace. m03 no longer relies on it for her. Victoria still uses it after her fate, and a re-entry guard backs it up.
- **D9, re-talking an ended conversation shows "(End of conversation)".** (Update: m03's root-divert workaround did not work live. m03 now uses the m02 rule that person-chat conversations never reach DONE. The engine fix below still stands for other missions.) `restoreNPCState` (`npc-conversation-state.js:121-135`) restores variables when the story has ended but doesn't navigate, and `person-chat-minigame.js:469-477` then continues from an empty root. Proposed: when only variables were restored, `goToKnot(this.npc.currentKnot || 'start')`. m03 works around it with a root `-> start` in every ink file. Any other mission whose knots end in `-> DONE` has this bug.
- **D10, a wrong password shows "Network error" and refunds the attempt.** `password-minigame.js:474` checks `error.message.includes('422')`, but `api-client.js:41-50` sets `err.status`. Proposed: `if (error.status === 422 || error.message?.includes('422'))`, matching the PIN minigame fix in `b7523bdc`.


---

## m04_critical_failure

Everything mechanical in m04 was fixable mission-locally and is recorded in
`scenarios/m04_critical_failure/PASS2_IMPROVEMENTS.md`. The items below need a
human call or are cross-cutting engine findings already logged under m03.

### 1. Cross-mission flag-form bug (m03 approval-log item 3) — RESOLVED here
- **What:** m04's four `submit_flags` targeted the dead reference form
  (`bms_jump_server:flag_1`), so the mission could never conclude. This was
  logged under m03 as out of that pass's scope.
- **Resolution:** fixed mission-locally in this pass — retargeted to
  `flag_station_dropsite:bms_jump_server-flag1..flag4` (station-qualified display
  form). No approval needed; recorded here to close m03's item 3.

### 2. Engine items already logged under m03 — m04 is exposed to the same ones
No new engine patches are proposed; m04 works around each the way m03 does.
- **Lesson 18 / m03 approval item 6 D2 (`globalVarOnKO` emits no
  `global_variable_changed`).** m04 hit this on its **primary combat ending**:
  Voltage's KO left `voltage_neutralised`/`esd_authorized` unset, so the player
  could not press the Emergency Shutdown. Worked around with an `npc_ko:voltage`
  eventMapping (and `npc_ko:operative_cipher/relay` for the defeat counter). The
  engine fix proposed under m03 (emit `global_variable_changed:<var>` from
  `npc-hostile.js:159-166`) would let the original, simpler mappings work and is
  still worth landing.
- **m03 approval item 5 / item 6 D3 (hidden or KO'd NPC LoS; NPC-outside-start
  sprite gap).** m04 has no hidden guard over a pickable lock, so the LoS case
  does not bite. The **sprite-at-KO** gap is a residual risk here: Cipher (Level 2
  card) and Relay (Master card) are single points of failure on the critical
  path. They are in-room **hostile** NPCs whose sprites exist during the fight, so
  `dropNPCItems` should work — but this is the one thing a browser playtest must
  confirm. No spare card was added, because a spare would let the player skip the
  combat the mission is built around.
- **Lesson 21 / m03 approval item 6 D9 (re-talk shows "(End of conversation)").**
  Fixed mission-locally with the m02 rule (person-chat conversations never reach
  DONE/END): the guard, Vance and Voltage's arrest/escape paths now return to
  sticky resting hubs. The engine fix proposed under m03 still stands.

### 3. Canon / continuity (already applied by the alignment pass; flagging for sign-off)
- **Blackout named in the briefing.** The opening briefing states the cell leader
  as "Blackout — Dr James Mercer" (matches `universe_bible/03_entropy_cells/
  critical_mass.md:25-26`). This reveals his real name in mission 4. The
  alignment plan decided this deliberately (decision #2), but if a later mission
  is meant to treat Blackout's identity as a reveal, this is the line to revisit.
  *If declined:* trim the briefing to the codename only.
- **"Task Force Null" debrief hook.** The closing debrief assigns the player to a
  new "Task Force Null". m05's opening does not reference it (it starts a fresh
  thread), so there is no contradiction, but nothing downstream pays it off yet.
  Left as-is; flagged in case the user wants it seeded into m05–m08 or dropped.
- **Costly-success casualties.** m04 permits a partial-failure ending with named
  on-site deaths (Hall 2 night crew) and feed casualties (40–60). This is the
  agreed "how dark" level (decision #1) but is a canon/tone call worth confirming
  stands after the wider season pass.

### 4. Purely-additive schema value — none used
No new enum values were needed. `unlock_object` (pre-approved by the brief) is
not used by m04.

### 5. Review round 2 — new items requiring approval

- **Publish m04's SecGen scenario.** m04 has no scenario under
  `SecGen/scenarios/break_escape/safetynet/` (m01, m02, m05, m06, m08 do). The
  mission-local `scenarios/m04_critical_failure/secgen/m04_critical_failure.xml`
  is authored and was corrected this round (see below), but until it is published
  to the SecGen repo the four VMs don't build and the flag tasks can't be verified
  live. *Proposed:* publish the XML to SecGen. *Out of authority* (SecGen repo).
  *If declined:* m04's VM/flag stage stays unbuildable.

- **B2 (orchestrator-verified) — privesc module swap, applied mission-locally.**
  `modules/vulnerabilities/unix/local/sudo_baron` conflicts with every base except
  Debian 10 Buster; the VM is Debian 12, so the module would be disabled and
  flag3 (needed by `concludeRequires`) would never generate. The mission-local XML
  now uses `.*/sudoedit` (CVE-2023-22809; conflicts only with Stretch/Kali/
  Windows/Ubuntu). Docs, `mission.json`, and player/HaX text updated. No approval
  needed for the mission-local change; logged because it rides with the "publish
  to SecGen" item and because the `distcc-exploitation` field guide on
  HacktivityLabSheets should gain a companion sudoedit note or the HaX privesc
  hint should point at an existing guide (currently it teaches the technique
  in one line only).

- **Timer re-timing (tone call).** The thermal clock now starts on
  `attack_mechanism_known` (was `anomaly_detected`) and is 6 min to advisory /
  12 min to vent (was 22 / 40). This makes the countdown the final act and makes
  COSTLY SUCCESS a real risk rather than near-impossible. If you want the finale
  more or less forgiving, these two `delayMs` values are the dial.

### 6. Round-2 corrections to this section's round-1 claims

The round-1 write-up (and `PASS2_IMPROVEMENTS.md`) over-claimed a "clean spine",
that Vance always hands over the keycard, that m04 didn't contradict m03, and that
in-room hostiles reliably drop their cards at KO. A reviewer showed each wrong;
all are now fixed mission-locally (see `PASS2_IMPROVEMENTS.md` → "Review round 2").
The engine items (lesson 18 KO globals, lesson 19 KO sprite/drop, lesson 21
re-talk) remain as logged under m03 items 5–6; m04 now works around each.

### 7. Review round 3 (browser playtest 1161/1162; re-verified live in 1163/1164) — engine items

All nine playtest defects are fixed mission-locally (see `PASS2_IMPROVEMENTS.md` →
"Review round 3"). These are the engine/tooling findings behind them.

- **Door alignment isn't validated, and N/S placement can disagree with door placement (D1).**
  - *What:* for a single north/south connection between rooms of different widths,
    `positionSouthSingle`/`positionNorthSingle` (`rooms.js:1317/:1222`) take the
    left/right alignment from the parity of the *current room's origin*.
    `placeSouthDoorSingle`/`placeNorthDoorSingle` (`doors.js:150/:66`) take each
    door's side from the parity of the *shared wall*. With a 10×6 `*_1x2gu` room
    (1 GU stacking height) on top, they disagree, and the doorway opens onto a
    wall 320px away. The validator's geometry check tests overlap only, so m04
    passed it while being unfinishable on foot.
  - *Evidence:* m04 game 1161 (`scada` door at 592,416 vs hall-1 door at 912,416).
    An engine-faithful port (`door_align.py`, in the session scratchpad
    `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/door_align.py`,
    with `render.rb` beside it) reproduces those exact coordinates and reports
    m01–m03 all aligned.
  - *Proposed (tooling, out of authority):* add the door check to
    `scripts/validate_scenario.rb`, or ship `door_align.py` as
    `scripts/check_door_alignment.py`, and run it for every mission.
  - *Proposed (engine, optional):* anchor the N/S room-positioning parity on the
    shared wall, as doors do: in `positionSouthSingle` use
    `worldToGrid(currentPos.x, currentPos.y + currentDim.stackingHeightPx)`.
    Existing layouts would shift, so re-run the door check on m01–m08 first.
  - *Rule for the brief:* in the m04 improvements doc, "The door-alignment rule".
  - *If declined:* every mission must avoid unequal-width N/S pairs under a
    1 GU-stack room by hand, or catch them in a playtest.

- **`registerNPC` rebuilds the registry entry, dropping `npc._sprite` (D3, D4, and m03 D3).**
  - *What:* `registerNPC` builds a new entry object each call
    (`npc-manager.js:166-187`). The lazy loader registers a room's NPCs after an
    `await` on story loading (`npc-lazy-loader.js:~42-75`). For NPCs in rooms loaded
    later, the registry entry ends up without the `_sprite` that
    `createNPCSprite` wrote (`npc-sprites.js:175`). Anything that reads it silently
    no-ops:
    - `dropNPCItems` (KO drops, `npc-hostile.js:257-261`);
    - `removeNpcFromScene` (returns `success:true` but destroys nothing,
      `npc-game-bridge.js:762-765`);
    - the line-of-sight code (`npc-los.js:69-71`).
  - *Evidence:* game 1163, live:
    - Voltage, Static and Relay: `mgrHasSprite:false` while
      `rooms.plant_room.npcSprites` holds their sprite.
    - Vance and the guard (early-loaded rooms): `mgrHasSprite:true`, same object.
    - `#remove_npc` on Voltage logged `removeNpcFromScene → success:true`, and he
      stayed visible.
  - *Proposed patch:* in `registerNPC`, carry runtime fields over from an existing
    entry:
    ```js
    const prev = this.npcs.get(realId);
    if (prev) { for (const k of ['_sprite', 'roomId']) if (prev[k] !== undefined && entry[k] === undefined) entry[k] = prev[k]; }
    ```
    As belt and braces, have `dropNPCItems`/`removeNpcFromScene` fall back to
    `rooms[npc.roomId].npcSprites.find(s => s.npcId === npcId)`, as proposed under
    m03 item 6 D3.
  - *If declined:* no hostile NPC in a later room can drop items or be removed by
    tag. m04 works around it with HaX relay cards and `setVisible:false`. Other
    missions that rely on drops or `#remove_npc` will fail silently.

- **ESD refusal text can't track state (D6).**
  - *What:* `esd-pushbutton-minigame.js:122` reads one static `unauthorizedText`.
  - *Proposed (optional):* accept `unauthorizedTextVariants: [{condition, text}]`,
    evaluated like `observationVariants`.
  - *If declined:* m04's state-neutral checklist text is accurate as it stands.

- **Not isolated: why the playtest build's `#give_item` never reached `giveItem` (D2).**
  - Live, the same knots now give the card on both routes, after two changes: the
    m02 selector form, and removing the ink-side flag write just before the tag.
  - `processGameActionTags` needs `currentConversationNPCId` for
    `give_item`/`remove_npc` but not for `complete_task`, which matches the
    split the playtest saw.
  - Flagged in case another mission shows the same symptom.


---

## m05_insider_trading

Everything mechanical in m05 was fixable mission-locally and is recorded in
`scenarios/m05_insider_trading/PASS2_IMPROVEMENTS.md`. The items below need a
human call or are cross-cutting engine findings already logged under m03/m04.

### 1. Engine items already logged (m03/m04) — m05 is exposed to the same ones
No new engine patches are proposed; m05 works around each the way m03/m04 do.
- **m03 item 6 D9 / lesson 21 (re-talk shows "(End of conversation)").** Fixed
  mission-locally: no person/phone conversation reaches DONE.
- **m04 §7 D3 / lesson 19+24 (`npc._sprite` unset in later-loaded rooms → KO
  drops and `#remove_npc` silently fail).** m05 hits this on Kevin (server badge
  + office card). Worked around with HaX relayed copies on `npc_ko:kevin_park`.
  The engine fix proposed under m04 §7 (carry `_sprite` across `registerNPC`,
  plus a `rooms[...].npcSprites` fallback in `dropNPCItems`) would let the
  physical drop work and is still worth landing.
- **Lesson 18 (`globalVarOnKO` emits no `global_variable_changed`).** m05 keys
  all KO reactions on `npc_ko:<id>` (the m01 pattern), so it is not exposed, but
  the engine fix proposed under m03 item 6 D2 still stands.

### 2. NEW engine finding — phone chats never emit `conversation_closed`
- **What:** the music/credits system and NPC eventMappings can key on
  `conversation_closed:<npcId>`, but only `person-chat-minigame.js:1566` emits
  it. `phone-chat-minigame.js` has no equivalent emit. Any credits trigger or
  mapping waiting on a **phone** NPC's close never fires.
- **Why it matters for m05:** the closing debrief shipped as a *phone* NPC with
  the credits music keyed to `conversation_closed:closing_debrief_trigger`, so
  the credits could never roll. Fixed mission-locally by making the debrief a
  hidden *person* NPC (the m02/m04 pattern).
- **Evidence:** `public/break_escape/js/minigames/person-chat/person-chat-minigame.js:1566`
  (emits) vs `public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js`
  (no `conversation_closed` emit).
- **Proposed patch:** emit `conversation_closed:<npcId>` from the phone-chat
  minigame's teardown, matching person-chat, so phone debriefs and phone-close
  mappings behave the same as person ones.
- **If declined:** every mission must run person-chat for any debrief/credits
  trigger, and must not rely on a phone conversation closing to drive state.

### 3. `setVariable` arithmetic strings are assigned literally (documentation gap)
- **What:** `setVariable: { "evidence_level": "evidence_level + 1" }` stores the
  literal string, it does not increment. m05 shipped its entire evidence model
  on this and every numeric gate was dead.
- **Evidence:** `interactions.js:1437`, `npc-game-bridge.js:30`,
  `container-minigame.js:477` all assign the value as given.
- **Proposed (optional, tooling):** either support a small expression form in
  `setVariable` (e.g. a `+= 1` / `increment` key the engine evaluates), or have
  the validator flag any `setVariable` value that names a known global, since
  that is almost always a failed increment. m05 now uses booleans, which assign
  correctly, but the next author will hit the same trap.
- **If declined:** authors must model counters as booleans + a count function in
  ink, as m05 now does.

### 4. Purely-additive schema value — none used
No new enum values were needed. `unlock_object` (pre-approved by the brief) is
not used by m05.

### 5. SecGen — already published; flag order unverified
- m05's SecGen scenario IS published under
  `SecGen/scenarios/break_escape/safetynet/m05_insider_trading.xml` (unlike
  m03/m04/m07). Checked read-only: the modules build on the declared Debian 12
  Bookworm base — `bludit_upload_images_exec` pulls in `apache_stretch_compatible`
  (conflicts only with non-bookworm/buster/stretch bases) and
  `php_5_stretch_compatible` (conflicts only with wheezy); `sudo_root_less`,
  `zip_file` and `parameterised_accounts` declare no base conflict. No base
  conflict blocks the build.
- **Unverified (needs a build):** that the four flags number in the order the
  scenario references them (`flag1`=recon, `flag2`=upload RCE, `flag3`=staging
  manifest, `flag4`=Architect authorisation). The order is inferred from XML
  document order via `extract_flags_by_vm` (`game.rb:1528`, which reverses the
  read-job order). If a build numbers them differently, swap the four
  `flagRewards` descriptions / the `submit_flagN` titles to match; the
  `targetFlags` (`qdc_research_server-flagN`) stay as generated.

### 6. Canon / continuity (flagging for sign-off)
- **Stakes retarget (Decision A, already in the draft, kept).** m05 targets a UK
  Home Office emergency-dispatch rollout with a signed 30–45 civilian-casualty
  projection. This is the agreed "how dark" register (m04 decision #1). Confirm
  it still stands after the season pass.
- **Recruiter gender.** The draft and bible both use "she/her" for the Recruiter
  and list "Sarah Chen" among her aliases; m05's sympathetic scientist is
  "Dr Sarah Chen". The name collision is pre-existing (flagged in the alignment
  plan). Not changed here; renaming Chen would touch her ink, the directory and
  mission.json `key_npcs`, so it is left for a human call.
- **Debrief trust penalty for lying about the Recruiter call (−25) vs confessing
  (−10).** New consequence; confirm the numbers are the intended dial.

### 7. Review round 2 — new items and corrections

- **Canon call (applied; please confirm): SAFETYNET has no arrest powers in m05.**
  Round 1 swapped US state-power framing ("federal custody") for UK state-power
  framing ("arrested under the National Security Act", "solicitor", sentence
  lengths). Per `story_design/universe_bible/02_organisations/safetynet/overview.md:41-47`
  and commit 94df1678, m05 now has the player detain Torres and hand him to
  Patricia, who calls the police. SAFETYNET's evidence reaches the police
  anonymously. "Cooperation" is a private deal: SAFETYNET pays for Elena's
  treatment in exchange for a debrief before the police arrive, and sentencing
  is out of its hands. A turned Torres's family can be "moved somewhere quiet"
  (the bible's car / flight / new name).
  *If declined:* restore the arrest/sentence lines in
  `m05_torres_confrontation.ink`, `m05_closing_debrief.ink` and the credits.

- **Continuity for the m06 pass: what m05 now establishes about the money.**
  m06 says the m05 job was worth "$847,000 in cryptocurrency" through wallet
  `1ENTROPY5InsiderTh`. In m05:
  - the data was **not sold**: ENTROPY meant to keep it;
  - the final upload was **stopped at 97%**, though 73% had already gone over
    six weeks;
  - the upload schedule and the debrief now say the Architect released a
    **$847,000 acquisition budget in cryptocurrency to the Insider Threat
    Initiative through the TalentStack wallet**, and Torres's debt relief and
    retainer came out of it.

  *Proposed m06 alignment:* reword m06's "the corporate espionage data from
  Mission 5? $847,000" to "the Insider Threat Initiative's budget for the
  Quantum Dynamics job, $847,000" (`m06_opening_briefing.ink:48`,
  `m06_phone_agent_0x99.ink:287`, and the two ERB strings at
  `m06_follow_the_money/scenario.json.erb:42,943`). The wallet name can stay.
  *If declined:* m06's "espionage data … $847,000" reads as a sale, and a
  player who stopped the upload in m05 will notice.

- **Engine/tooling: eventMapping conditions support `&&` only.**
  `safeEvaluateCondition` (`npc-manager.js:14-101`) returns false for any `||`
  or parenthesised term, silently. Credits conditions use a full JS evaluator
  (`scenario-music-events.js:34-48`), so the same expression works in one place
  and is dead in the other. m05 shipped eleven dead mappings this way; all are
  split now.
  *Proposed (tooling):* have `validate_scenario.rb` reject `||`, `(` or `)` in
  any eventMapping `condition`.
  *Proposed (engine, optional):* support `||` at the top level
  (`s.split('||').some(part => part.split('&&').every(evaluateSingle))`).
  *If declined:* authors must keep writing one mapping per alternative.

- **Engine: the phone preload runs listed contacts' start knots with the global
  observer attached.** `phone-chat-minigame.js:283-380` preloads intro messages
  for every contact in `npcIds` with no history. Ink run there can write synced
  globals (`phone-chat-conversation.js:94-99`), so any contact whose start knot
  sets state or reveals plot fires that state the first time the phone opens.
  m05's Recruiter did exactly this. It is fixed mission-locally (not listed; a
  guard knot).
  *Proposed:* run the preload without `observeGlobalVariableChanges`, or restore
  the variables after it.
  *If declined:* every phone antagonist must be kept off `npcIds`, or guard its
  start knot.

- **Tone (please confirm): the lethal ending is now neglect, not a killing.**
  After the KO the player can leave Torres bleeding. The debrief says he died
  because nobody checked him for forty minutes. This replaces round 1's "left
  for cleanup". It keeps the agreed "how dark" level, but is stated plainly.

- **Correction to this section's items 1–6.** Item 2's premise is unchanged. The
  round-1 PASS2 doc over-claimed four things, all corrected in
  `PASS2_IMPROVEMENTS.md` → "Round-1 claims corrected":
  - a live "door onto a wall" (it was a derivation, not an observation);
  - JS-evaluated mapping conditions;
  - an EXTERNAL crash (`player_name` is bound);
  - a `conversation_closed:recruiter` mapping.

### 8. Review round 3 (browser playtest 1165-1167) — engine items

- **`conversation_closed:<npc>` can fire twice for one close (playtest D5).**
  In run 1, `conversation_closed:patricia_morgan` was logged twice (seq
  1197/1198 in `tools/playtest/m05-pass2-run1-session.jsonl`). A phone-chat
  mapping on that event then jumped the Recruiter to `start` twice, and the
  second jump skipped her offer (D2). m05 is now robust to it (routing keys on
  `recruiter_deal_offered`).
  *Proposed:* find the double emit in `person-chat-minigame.js` cleanup (the
  emit at :1566), which looks as if it can run from two teardown paths, and
  guard it with a per-instance `closedEmitted` flag.
  *If declined:* any mapping on `conversation_closed` that isn't onceOnly-safe
  or idempotent can fire twice.
- **`collect_items` has no default `targetCount` on the client.**
  `objectives-manager.js:359/373` compares against `task.targetCount`
  unguarded; the server defaults it to 1 (`game.rb:1180`). m05 now sets it
  explicitly on all ten tasks.
  *Proposed (engine):* default `targetCount` to 1 for `collect_items` at
  initialisation, as is already done for `submit_flags` (:53-54).
  *Proposed (tooling):* have the validator warn when a `collect_items` task has
  no `targetCount`.
  *If declined:* every mission must set it by hand, or the task silently never
  completes.
- **`timedConversation.setGlobalOnStart` sets the guard global without an
  event** (`npc-manager.js:1273-1277`). A task that completes only at the end
  of that cutscene can be stranded by an early close or a reload, because the
  cutscene never replays. m05 now completes its briefing task at the start of
  the briefing, with two backstops.

## m06_follow_the_money

Everything mechanical in m06 was fixable mission-locally and is recorded in
`scenarios/m06_follow_the_money/PASS2_IMPROVEMENTS.md`. The items below need a
human call or are cross-cutting findings already logged under m03/m04/m05.

### 1. Engine items already logged — m06 is exposed to the same ones
No new engine patches proposed; m06 works around each the way m03/m04/m05 do.
- **Lesson 18 (`globalVarOnKO` emits no `global_variable_changed`).** m06 now
  keys both KO reactions on `npc_ko:<id>`. Not exposed. Engine fix logged under
  m03 still stands.
- **Lessons 19/24/38 (`npc._sprite` unset in later-loaded rooms → KO drops and
  `#remove_npc` fail).** Elena and Satoshi are both in later-loaded rooms. Worked
  around with HaX relay knots (`on_elena_ko_relay` hands `relayed_password_dictionary`
  + `relayed_cto_badge`; `obtain_access_tools` lists the relayed id so the collect
  task completes with a real item). The engine fix proposed under m04 §7 would let
  the physical drop work and is still worth landing.
- **Lesson 31 (phone chats never emit `conversation_closed`).** m06's debrief is
  a hidden **person**-chat (the m01/m02/m05 pattern), so credits fire on its
  close. The phone-chat `conversation_closed` emit proposed under m05 §2 still
  stands.
- **Lesson 21 (re-talk shows "(End of conversation)" after DONE).** Fixed
  mission-locally: Elena, trader, analyst and Satoshi loop to a hub; the only
  `-> DONE` left is Satoshi's hostile branch (un-re-talkable) and the terminal
  debrief.

### 2. Validator gap — `rfidCard` reported as an unknown field
- **What:** `rooms/.../npcs[].rfidCard` is read by the engine
  (`npc-conversation-state.js:418` syncs `card_protocol` / `card_name` /
  `card_card_id` and the clone-difficulty flags into the NPC's ink), and
  `#clone_keycard` depends on it. The schema/validator does not know the field,
  so it warns "will be ignored by the game engine", which is wrong.
- **Evidence:** m03 (`receptionist_npc`, `victoria_sterling`) carries the same
  warning and its clone route works in game; m06 adds it to `elena_volkov`.
- **Proposed (optional, tooling):** add `rfidCard` (object: `card_id`,
  `rfid_protocol`, `name`) to `scripts/scenario-schema.json` under the NPC
  definition so the validator stops mislabelling a supported field. Not done —
  it is a shared validator file.
- **If declined:** authors keep ignoring the warning (as m03 does).

### 3. Purely-additive schema values — none needed
No new enum values were required. `give_item` flag-reward entries
(item_name-matched) and `unlock_object` are already engine-supported; the flag-3
and flag-4 payouts use `give_item`, which the m02 backup-recovery station also
uses.

### 4. SecGen — published; modules clear their base; flag order unverified against a build
- m06's SecGen scenario IS published at
  `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml`. Checked
  read-only. Target `hackme_crack_me_lab` is a **Debian 9 desktop KDE** base
  (`modules/bases/debian_stretch_desktop_kde`, distro "Debian 9.5.0 Stretch"),
  and every module it uses builds on it:
  - `distcc_exec` — `<conflict>` is only on `distcc` software presence (nothing
    else installs distcc here); CVE-2004-2687, CVSS 9.3, no base conflict.
  - `readable_shadow` — conflicts only with "Writable Shadow File"; not present.
  - `ssh_root_login`, `parameterised_accounts`, `kde_minimal`, `handy_cli_tools`,
    `hash_tools` — no base `<conflict>`; `requires` are satisfied (accounts
    utility, update).
  - `kali_cracker` uses `kali_pwtools` / `metasploit_framework` / `nmap` on a
    Kali base — the standard attack box, no conflict.
  No base conflict blocks the build.
- **Unverified (needs a build):** that the four flags number in XML document
  order (flag_1 hcauth → flag_2 hcledger → flag_3 hcfindb → flag_4 hcvault), the
  order the scenario references as `hackme_crack_me_lab-flag1..4`. If a build
  numbers them differently, swap the four `flagReward` descriptions and the
  `submit_flagN` titles to match; the `targetFlags` stay as generated. Flag 3 is
  the one the data-centre PIN hangs off, so its identity matters most.

### 5. Canon / continuity (flagging for sign-off)
- **$847,000 re-attribution (kept, aligning to m05).** Across m06 the figure is
  the Architect's **acquisition budget** for the Quantum Dynamics job, paid **out**
  of `1ARCHITECT9FUND` to the Insider Threat Initiative via the **TalentStack**
  wallet — an outbound payment, not proceeds of selling data. This matches m05's
  upload schedule and closing debrief. Confirm it still reads correctly against
  the final m05 text.
- **The Architect = Dr. Adrian Tesseract (87%)** seeded in the safe file, now
  framed as the CEO's own insurance notes. This is the season arc's big reveal
  (`planning_notes/overall_story_plan/season_1_arc.md:840,857,875`); left intact.
  Confirm the mid-season reveal should still live here as a lead, not a fact.
- **Stakes register.** m06 keeps "180-340 projected casualties" and "The
  Architect's Masterpiece / 72 hours" from the fund document. Consistent with the
  m04/m05 "how dark" register. No change proposed.

### 6. NEW engine finding (review round 2): `setVisible` is dropped for an NPC whose room hasn't loaded
- **What:** an `initiallyHidden` NPC revealed by an eventMapping `setVisible`
  never appears if the reveal event fires before its room loads. NPC
  eventMappings register only when the NPC's room loads
  (`npc-lazy-loader.js:23-73`, `rooms.js:806`). Rooms load when their door opens
  (`doors.js:678-686`). A request that does reach `setNPCVisible` before the
  sprite exists is dropped (`npc-behavior.js:151-160`), and the sprite is later
  created hidden.
- **Why it matters for m06:** Satoshi was hidden and revealed on
  `found_architects_fund` / `room_entered:executive_wing`. Both fire before
  `satoshi_office` loads, so he never appeared and the mission could not end.
  Fixed mission-locally by making him visible from the start: he is already
  behind the executive badge.
- **Proposed patch:** have `setNPCVisible` record the desired visibility on the
  NPC data when there is no sprite, and have sprite creation honour it. Also
  consider registering eventMappings at scenario load for NPCs whose mappings
  only change state (not sprites).
- **If declined:** no mission may reveal a hidden NPC in a room the player
  hasn't opened yet. m03–m08 should be checked for the same pattern.
- **Note:** `public/break_escape/js/core/rooms.js` and `npc-manager.js`
  currently have someone else's uncommitted changes. Neither was touched.

### 7. Debrief trigger pattern worth adopting elsewhere (no approval needed; FYI)
m06 now opens its debrief on `minigame_completed` / `minigame_failed` (emitted by
every minigame close, `base-minigame.js:94-104`) plus `conversation_closed` and a
`room_entered` backstop, each latched through `start_debrief_cutscene` in
`setGlobal`. This avoids opening the debrief over a phone chat or the drop-site
(which `npc-manager.js` would tear down) and covers state set inside phone chats.
Other missions that trigger from `global_variable_changed` inside a phone chat
(m05's `torres_fate_by_phone`) may want the same.

### 8. Canon (review round 2) — three consecutive "Elena"s (log only)
m05 Elena Torres (David's wife), m06 Dr. Elena Volkov, m07 Elena Rodriguez. Three
missions running with the same first name will read as a slip. Not renamed:
renaming a character other missions depend on needs sign-off. Suggest m06's CTO
as the easiest to change, since she is m06-local and no later mission refers to
her by name. **If declined:** it stays as it is.

### 9. Correction to my round-1 report
Round 1 said a live m06 playtest was not possible because the ending needs VM
flags. That was wrong. Earlier missions were playtested to `status=completed` by
submitting the session's `<flag:N>` tokens, and an m06 playtest follows this
pass.

### 10. Round 3 (browser playtest, games 1173/1174): engine findings
- **Collect-task race (playtest D3).** When a notes item has `onPickup.setVariable`, the global changes (and `global_variable_changed` fires) before `item_picked_up`. A mapping that calls `completeTask` on a `collect_items` task from that global reaches the server before the collect POST. The server rejects it ("Insufficient items collected", `game.rb:1179-1210`) and the task reverts to active. The later `item_picked_up` is then ignored while the task is `completing`. That was 3 of 4 cases in the playtest.
  - m06 fix: no mapping `completeTask` on any collect task; they complete themselves.
  - **Proposed engine patch:** let `handleItemPickup` count a pickup while a task is `completing` (queue it), or have the server re-check after the collect lands.
  - **Proposed validator check:** warn on any `completeTask` that targets a `collect_items` task.
  - **If declined:** other missions with that pattern have intermittently stuck tasks. Worth grepping m03–m08 for it.
- **Conclusion screen opens on aim completion, not after the debrief (playtest D2).** `conclusionScreen: bond_visualiser` opens the moment the missionConclusion aim's last task completes. If that task is a story decision, the visualiser covers the debrief person-chat, which opens underneath it (z-index 1500).
  - m06 fix: m05's `hear_debrief` pattern, with the last task completed on the debrief's last line.
  - **Proposed (docs):** add to README_scenario_design.md that a missionConclusion aim with a debrief must end in a debrief task. m02's aim ends on story decisions and may show the same overlap; worth checking there.
- **Reload of a concluded game (playtest D6)** re-opens the credits, and the world then would not move in a headless run. Probably harness plus a heavy canvas. Noted, not chased; not mission-local.

## m07_architects_gambit

Everything mechanical was fixed mission-locally (see `scenarios/m07_architects_gambit/PASS2_IMPROVEMENTS.md`). The items below need a human call or refer to engine items already logged.

### 1. Engine items already logged — m07 is exposed to the same ones
- **Lesson 18 (`globalVarOnKO` emits no event):** m07 now keys all four KO reactions on `npc_ko:<id>` (m03 §6 D2).
- **Lessons 19/24 (`npc._sprite` unset in later-loaded rooms):** Elena, Park and Mercer hold nothing required. Their exits use `setVisible` instead of `#remove_npc`. Morrison is in the start room, so his badge drop should work (m04 §7).
- **Lesson 21 (re-talk after DONE):** worked around in every conversation (m03 §6 D9). **Phone-chat form, new detail:** a phone story that reaches DONE shows "Conversation ended" on every reopen (`phone-chat-minigame.js:583`), unless a bark opens it with an explicit knot. HaX's only exit went to DONE, so HaX was unusable after the first call. Worth grepping the other missions' phone ink for `#exit_conversation` followed by `-> DONE`.
- **Lesson 43 (mappings register when the NPC's room loads):** the debrief and Architect NPCs moved to the start room (m06 §6).
- **Lesson 46 (visualiser over the debrief):** fixed with the m06 `hear_debrief` pattern (m06 §10).

### 2. Publish an m07 SecGen scenario (new VM; needs approval)
- **What:** `mission.json` points at `ctf/putting_it_together`, whose target system is named `server`. The scenario reads flags from `vm_flags_json('scada_attack_host')` and `flags_for_vm('scada_attack_host')`. In Hacktivity mode, `mission.rb:203-219` returns `{}` for a missing name, so the mission's flags would be empty.
- **Proposed:** add `SecGen/scenarios/break_escape/safetynet/m07_architects_gambit.xml`, a copy of `putting_it_together` with these changes:
  - `server` renamed `scada_attack_host`;
  - `attack_vm` kept;
  - the server's modules ordered `nfs_overshare`, `nc_message`, `parameterised_accounts`, `sudo_root_awk`, so the flags number NFS, listener, user, root — the order the mission now assumes.
  
  Then set `mission.json` `secgen_scenario` to match.
- **Base-conflict check (lesson 30):** `nfs_overshare` conflicts only with another `nfs` type. `nc_message` needs cron + update. `sudo_root_awk` needs the sudo puppet module. `parameterised_accounts` needs accounts. None conflicts with the Debian 12 KDE base.
- **Unverified:** SecGen's flag numbering against a real build (the same caveat as m05/m06).
- **If declined:** standalone mode works on placeholder flags. Hacktivity mode has no valid flags, so the mission cannot conclude there.

### 3. Countdown consequence (tone; already applied, please confirm)
- **What changed:** the clock now arms at flag 3 (operator login) and runs 15 real minutes. If it expires, step one of the sequence (Seattle metro) executes before the abort. This is recorded in the printout, the credits (a warning line), one factual debrief line and an Architect bark. No casualty figure was added.
- **Why:** the old 60-minute clock ran from the briefing, VM time included (lesson 29). It hit zero for most players with no effect, although the HUD said "Cascade". This follows the m04 costly-success precedent.
- **If declined:** remove the `countdown_expired` credits/debrief/printout lines and set `cascade_zero` to `showCountdown: false`. The rest of the rework (arming at flag 3) can stay.

### 4. m08 continuity (questions for the m08 pass; nothing changed in m08)
- m08's opening (`m08_opening_briefing.ink:19`) sends the player to "Director Cross". m07 and m08's own debrief use Director Magnus Netherton. Which is canon?
- m08 (`m08_director_netherton.ink:29`) says "Two of ours are dead at the sites the team could not reach". m07's debrief reads out both unanswered operations but never mentions SAFETYNET dead. Should m07's `operations_gone_dark` add it? This is a how-dark call, so it has not been added.
- m08 says "nine days ago". m07 sends the agent on 72 hours' leave, which is compatible.
- m08's Nightshade was "on the Mission 7 plan … forty-eight hours before Portland". m07's intercept predates the deployment by 51 minutes. Compatible (access vs send time), but worth one look. m08 also says "Mission 7" in player-facing text (`m08_opening_briefing.ink:17`, `m08_nightshade_confrontation.ink:36`).
- "Elena Rodriguez" stays; see m06 §8.

### 5. Decorative LOS cones (log only)
Morrison and Park have visualised LOS cones, but LOS only acts through a `lockpick_used_in_view` mapping (`npc-manager.js:249-270`). Neither has one, and neither room has a pickable lock. So the cones suggest stealth play that does nothing, and "evade" has no mechanical effect.
- **Options:** hide the cones (`visualize: false`), or give the guard something real to watch. That would need an engine hook such as a `player_spotted` event.
- **If left:** a cosmetic mismatch only.

### 6. Purely additive schema values — none needed.

### 7. Docs
- The false-completion docs the alignment plan named (`DEVELOPMENT_STATUS`, `COMPLETION_SUMMARY`, `SESSION_SUMMARY`) no longer exist. Nothing to delete.
- `README.md` and `ALIGNMENT_PLAN.md` still describe the old clock. The pass left them alone, and `CONTRACT.md` has a superseding amendments section. Delete or refresh on request.

### 8. Review round 2: engine and tooling findings
- **HUD countdown ignores `cancelOnGlobal`; a reload restarts finished clocks.**
  - **Evidence:** `public/break_escape/js/ui/scenario-timer.js` has no cancel handling. The dispatcher marks a cancelled timer in `_cancelledTimers` but never calls `scenarioTimerUI.markFired` (`scenario-timer-dispatcher.js:54-66,79`), so the red clock keeps counting after the win, through the debrief and credits. On reload, a timer whose `startOnGlobal` is already true restarts from zero (`:36-38`), so it can fire its `setGlobal` again on a finished game.
  - **m07 workaround:** a `condition` on every timer (`!globalVars.grid_saved`, etc.). The HUD and the dispatcher both evaluate it.
  - **Proposed patch:** in the `cancelOnGlobal` handler, also call `window.scenarioTimerUI?.markFired(timer.id)`. On init, skip timers whose `setGlobal` keys are all already set.
  - **If declined:** every mission with a cancelled clock shows a running countdown after it should stop. Check m04 (thermal clock) and m08.
- **Validator false positive: `targetKnot` in `sendTimedMessage`.**
  - The validator says it is "silently ignored for phone NPCs" and reports ❌ INVALID. The engine uses it: `npc-manager.js:678-686` → `_deliverTimedMessage` → bark `startKnot` (`npc-barks.js:511`, navigated at `:630`) → an explicit knot overrides the saved state (`phone-chat-minigame.js:510-534,579-582`).
  - **Proposed:** drop that check, or limit it to NPCs whose ink has no such knot.
  - **If declined:** m07 shows 6 spurious ❌ lines. Removing the field would break the Architect's barks.
- **Round 1 correction:** m07's validator result was reported as "0 errors". It also carried these 6 ❌ INVALID lines, which round 1 did not count.

### 9. Browser playtest (games 1177/1178): engine finding
- **A `notes` item given by a flag reward never appears client-side.**
  - **Evidence:** `process_item_reward` adds it to the server inventory. On the client, `addToInventory` returns early for `/^notes\d*$/` types (`public/break_escape/js/systems/inventory.js:501-507`), assuming the notes minigame already showed it. For a reward item that never happens, so the note is in neither the inventory nor the notepad, even after a reload.
  - **m07 workaround:** the flag-2 Listener Capture is now `text_file`, the shape m06's and m02's live flag rewards use.
  - **Proposed patch:** in that branch, also add the note to the notepad, e.g. via the same path `onRead` notes use, when the item arrives from a flag reward or NPC give.
  - **If declined:** authors must never use `notes` for a flag-reward or given item. Worth a validator check.

---

## m08_the_mole

Everything mechanical was fixed mission-locally (see `scenarios/m08_the_mole/PASS2_IMPROVEMENTS.md`). The items below need a human call or refer to engine items that are already logged.

### 1. Engine items already logged — m08 is exposed to the same ones
- **Lesson 18 (`globalVarOnKO` emits no event):** all five KO reactions are now `npc_ko:<id>` (m03 §6 D2).
- **Lessons 19/24 (no sprite in later-loaded rooms):** Netherton's keycard drop on KO can't be relied on. The badge printer is the second route, and HaX's KO message points to it. The Crypto Lab Nightshade is hidden with `setVisible`, not `#remove_npc` (m04 §7).
- **Lesson 21 (re-talk after DONE), person and phone forms:** worked around in every file (m03 §6 D9, m07 §1).
- **Lesson 43 (mappings register on room load):** the debrief moved to the start room (m06 §6).
- **Lesson 46 (visualiser over the debrief):** fixed with the m06/m07 pattern (m06 §10).
- **Lesson 41 (`conversation_closed` can fire twice):** the debrief trigger is latched by `start_debrief_cutscene`. HaX's first-contact message is `onceOnly`.
- **New detail, no patch proposed:** `applyActions` `complete_task` reads `action.taskId` (`apply-actions.js:46`), but m08 had written `"task"`. That failure is silent. **Proposed validator check:** reject a `triggerOnInteract` or `flagRewards` `complete_task` entry without `taskId`. **If declined:** authors can repeat the slip unnoticed.

### 2. SecGen `m08_the_mole.xml` (read-only check; needs a SecGen edit + a build)
- **Base conflicts (lesson 30):** none.
  - `gitlist_040` conflicts only with another `webapp`, and none is present. Its apache/mysql/php `requires` are the same as the shipped `ctf/such_a_git.xml` on the same Debian 12 KDE base.
  - `sudo_root_apt_get` (platform unix) needs the sudo puppet module.
  - `parameterised_accounts` needs accounts.
- **A phantom fifth flag:**
  - **What:** `sudo_root_apt_get` is given `<input into="strings_to_pre_leak">` with a `flag_generator`, but that module's metadata reads only `strings_to_leak` and `leaked_filenames`. The XML therefore generates **five** flags, one of which is placed nowhere.
  - **Proposed:** delete the sudo module's `strings_to_pre_leak` block (line 263 of the XML; line 214 is GitList's, which is valid).
  - **If declined:** Hacktivity may list an unobtainable flag, and the `flags_by_vm` slice the mission indexes may shift.
- **Flag order (unverified, likely wrong):**
  - **What:** the mission assumes GitList recon → stashed credentials → home directory → root. In document order, the generators run home-directory flag (`parameterised_accounts`, first in the XML) → GitList `strings_to_leak` (password) → GitList `strings_to_pre_leak` (recon) → root.
  - **Why it matters:** if the build numbers flags in document order, the task titles and HaX's flag messages will narrate the wrong step. Completion still works, because `concludeRequires` needs all four.
  - **Proposed:** after a build, either reorder the XML so the generators run recon, password, home, root (if SecGen numbers by document order), or swap the four `flagRewards` descriptions, task titles and HaX messages to match. Keep the `targetFlags`.
  - **If declined:** the story is out of order in Hacktivity mode only.
- **Player-facing text in the XML** still says "Mission 7" (description). Not changed (read-only).

### 3. Continuity / canon (flagging for sign-off)
- **"Two of ours are dead":** kept in m08 (Netherton, Phantom, the tactical board, HaX). It is canon in `story_design/universe_bible/03_entropy_cells/insider_threat_initiative.md:77`, but m07's `operations_gone_dark` reads out civilian deaths only.
  - **Proposed (m07, not done):** one line in m07's debrief, e.g. after the second unanswered operation: "And two of ours. Names withheld until the families are told."
  - **If declined:** m08 states a cost that m07 never showed. Players may read it as new information, which is survivable.
- **"Director Cross":** treated as rename residue and fixed to Netherton everywhere in m08. ALIGNMENT_PLAN:333 records the rename as applied, and the bible has no Cross. No decision needed unless Cross was meant to be a second director.
- **Dr Chen (review round 2: renamed in m08; bible follow-up needed):**
  - **What:** m08's psych eval was signed "Dr S. Chen, Psychology Division". That collided with **m05's Dr Sarah Chen** (Chief Scientist, `scenarios/m05_insider_trading/scenario.json.erb:1189`) and with the bible's **Dr Lyra "Loop" Chen, Chief Technical Analyst** (`04_characters/safetynet/dr_chen.md`). The bible's `insider_threat_initiative.md:76` still calls the m08 evaluator "SAFETYNET psychologist Dr Chen" and links to Lyra Chen's page.
  - **Done (mission-local):** m08's evaluator is now **Dr S. Okafor, Psychology Division**, in all places (psych eval, Nightshade's interview, Netherton's beat, the debrief).
  - **Proposed (bible, not done):** change `insider_threat_initiative.md:76` to "SAFETYNET psychologist Dr S. Okafor" and drop the `dr_chen.md` link. Separately, three Chens across the season (m05 Sarah, the bible's Lyra, and formerly m08) is worth a pass.
  - **If declined:** the bible disagrees with m08's text; nothing in-game conflicts any more.
- **Nightshade "trained in the same cohort as Agent 0x00", fifteen years ago (bible canon)** sits awkwardly with 0x00 as a first-time field agent in m01 (`agent_0x00.md:35`, "first 10 missions"). Not changed.
- **The fate wording follows lesson 39:** "handed to the police with the case file". The bible's fate line says "Arrested (trial)". Please confirm the handover framing is the intended reading.
- **Database theft as the real objective of the four-site night:** m07's debrief frames the night as the Architect "measuring" the agent. m08 (and the bible) say the attacks covered the theft of the Global Threat Database. Both can be true, and m08's Netherton line ("theatre, to cover the one door") layers on top. No change; noting it for the m09 author.

### 4. Purely additive schema values: none needed.

### 5. Docs / files
- README.md, SOLUTION_GUIDE.md, DEVELOPMENT_STATUS.md and ALIGNMENT_PLAN.md describe the old terminal, the break-room debrief, the free badge printer and the reference-form flags. `CONTRACT.md` has a superseding "PASS 2 amendments" section. Refresh or delete on request; deleting needs approval.

### 6. Review round 2 note: aim ladder residual (no approval needed; FYI)
- m08's early-reveal tasks are now brief-gated custom tasks (see PASS2_IMPROVEMENTS "Review round 2"). The one residual: a `submit_flags` task completed before its aim unlocks (only possible by skipping the Director, printing a badge and doing VM work first) still reveals its aim. **Proposed (engine, optional):** in `objectives-manager.js` near :573-578, record a completion on a locked aim's task without revealing the aim until its `unlockCondition` is met. **If declined:** a player who deliberately skips the brief sees an accurate, spoiler-safe aim early.

### 7. Browser playtest (games 1181–1183): engine findings
- **`disableClose` doesn't cover the person-chat "End Conversation" button.**
  - **Evidence:** `base-minigame.js:18-28` hides the × and skips the Esc handler when `disableClose` is set, but still renders `#minigame-cancel` whenever `showCancel` is true. `person-chat-minigame.js:176` sets its text to "End Conversation". In playtest the m08 confrontation was closed on its opening line this way.
  - **Proposed patch:** in `base-minigame.js`, render the cancel button only when `showCancel && !disableClose` (or hide it, as the × is). The same applies in person-chat, if it builds its own controls.
  - **m08 workaround:** a HaX nudge on `conversation_closed:nightshade_confrontation` while `!fate_decided`; room re-entry reopens the scene; the outcome is written at the choice.
  - **Also exposed:** m05's post-KO scene relies on `disableClose` too, but it has a HaX safety net. m06/m07's debriefs use `disableClose`; closing those early skips the rest of the debrief, and the room-entry backstop completes the task without credits.
  - **If declined:** every forced cutscene can be skipped with one click.
- **The final debrief line needed ~17 "continue" presses in one run (D3).** It is not ink: both fates end on identical tags after 10 lines. Suspect the wait on the final `complete_task:take_the_debrief` server round-trip, or the typing timer. Unconfirmed; worth a trace in a future playtest.

### 8. Design note (no change made)
- **The lockpick in the start inventory** opens the interrogation room from minute one, which makes the printout → safe → key chain optional except for the psych eval. Removing it would make the chain mandatory, and it has no KO risk because no NPC is involved. It is a start-item removal, so it is left for a decision.
