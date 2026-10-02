# m03 Ghost in the Machine: design review (pass 4)

Reviewer: design-review agent, 2 October 2026. Read-only review; nothing in the scenario or ink was changed.

## 1. Validator results

`ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb`: schema, ink, layout geometry and door alignment all pass. Graph summary: puzzle 25 nodes / 25 edges, story 6 / 5, integrated 31 / 37, rooms 7 / 6. Critical path (2 hops): Get Inside WhiteHat → Breach The Server Room → Settle Accounts.

### ❌ INVALID

None.

### ⚠️ WARNING

1. HaX (`agent_0x99`) has two `room_entered:executive_wing_hallway` mappings (indices 0 and 33). **Intended, harmless.** Index 0 is the lockpicking-guide offer (`scenario.json.erb:629-634`); index 33 is one of the ERB-generated `hear_debrief` backstops (`erb:837-845`), gated on `debrief_played`, which is only true after the mission has ended. They cannot both do anything in the same play.
2. The same pair on `room_entered:server_room` (indices 1 and 32): netexploit-guide offer (`erb:635-640`) and backstop. Same verdict.
3. Four `npc_ko:victoria_sterling` mappings (indices 22-25, `erb:789-816`). **Intended**: the comment at `erb:781-788` says they complete different tasks and fire together on purpose. I checked the one ordering risk: index 24 tests `mission_phase !== 'act2_infiltration'` while index 23 completes `clone_rfid_card`, whose completion is what flips the phase (`erb:657-661`). `completeTask` is async and emits `objective_task_completed:*` only after the server replies (`public/break_escape/js/systems/objectives-manager.js:537-616`), so index 24 is evaluated against the old phase. No bug.
4. Two `room_entered:conference_room_01` mappings (indices 27 and 31): day-KO settle (`erb:824-830`) and backstop. Harmless.
5. `executive_wing_hallway/npcs[0]/eventMappings[0]` is a person-chat cutscene without `onceOnly`. **Known false positive**: the guard's lockpick catch is meant to repeat, with the one-strike-per-approach rule handled by `guard_grace` (`erb:1172-1181`, `m03_npc_guard.ink:390-433`).
6. Missing behaviour on `reception_lobby/npcs[1]` and `npcs[2]` (Netherton, Nightshade). **False positive**: hidden co-speakers in the briefing (`erb:468-503`), the m01 seed-NPC pattern.

### ✅ GOOD PRACTICE

Event-driven cutscenes, `globalVarOnKO` on every person NPC who matters, `skipIfGlobal` on the briefing, the music system with conditional credits, hostile-NPC tuning, and `puzzle_graph_*` metadata are all present.

### 💡 SUGGESTION

- HaX has no `timedMessages` (`erb:556-628`). m01 sends one on `conversation_closed:briefing_cutscene` (`scenarios/m01_first_contact/scenario.json.erb:636-643`) so the phone lights up as play starts. m03 would benefit from the same one line (see fix 17).

## 2. Design review (skill Step 2)

### 2a. Solvability trace — OK

Critical path: briefing → receptionist clone (`m03_npc_receptionist.ink:227-235`, saved clone completes `clone_reception_badge` via `erb:522-530`) → conference door (`erb:933-935`) → Victoria's interview and clone (`m03_npc_victoria.ink:261-381`, completed on Save by `erb:645-651`) → server room (`erb:1008-1010`) → four flags at the drop-site (`erb:1086-1100`) → `night_confrontation_ready` (`erb:751-774`) → confrontation (`m03_npc_victoria.ink:420-521`) → debrief (`erb:906-913`) → `hear_debrief` on the last line (`m03_closing_debrief.ink:482`).

- Every key is reachable before its lock. No circular dependency.
- VM wiring: all four `submit_flags` tasks have `targetFlags` and `targetCount` (`erb:188-231`). The flag globals are set from `objective_task_completed:*` mappings (`erb:723-745`), not from `emit_event`, so the m02 silent killer doesn't apply. The three `emit_event` rewards (`erb:1096-1098`) have no listener; harmless.
- KO fallbacks are in place for both card holders (receptionist `taskOnKO` and a dropped card, `erb:512, 545-552`; Victoria's KO mappings plus HaX's relayed copy, `erb:569-578, 801-808`).
- **CONCERN (dialogue promises).** Two lines describe a state the game isn't in:
  - after the clone HaX says "Sit tight until the place clears out" (`m03_phone_agent0x99.ink:242`). Nothing happens if the player waits; the night is already on (`erb:657-661`). A literal-minded player may stand in the hallway waiting for a trigger that never comes.
  - after a receptionist KO, `taskOnKO` completes `clone_reception_badge` and HaX's mapping on that task says "Reception badge is in the cloner. Emulate it at the conference room reader" (`erb:652-656`). It isn't: the player is holding her dropped physical badge. (KO order: `globalVarOnKO` is written before the task is completed, `npc-hostile.js:155-183`, so a `receptionist_ko !== true` condition on the mapping will work.)

### 2b. Clue distribution — OK, with one concern

- Password: IT reset slip on the PC (`erb:1226-1229`) plus the plaque in reception (`erb:432-439`). The m01 sentimental-date pattern, now spelt correctly (pass-3 P0).
- Safe: whiteboard (server room, ROT13, `erb:42, 1056-1064`) → Sterling's unsent draft (office PC, Base64, `erb:1231-1239`) → CyberChef laptop (server room) → safe (server room). A real three-room loop when the server room comes first.
- **CONCERN.** The night act is one room. The server room holds the VM terminal, drop-site, laptop, safe, whiteboard and a filing cabinet (`erb:1011-1113`). The executive office holds the PC, cabinet and drive. Danny's office is the only other night destination. The clustering is defensible (it is a server room) but it is why the second half feels static (see §4.1).
- Readables with no puzzle purpose: the runbook in the server-room cabinet repeats the conference whiteboard and HaX's hints (accepted in pass 3 as D5). Danny's performance review and family photo are character, not clues; that is fine.
- No navigation-only notes except the **Building Directory** (`erb:425-431`). It names doors the map already shows, but it also sets up "executive cards only" for the server room, which is a clue to the boss-key. Keep it.

### 2c. Educational coverage — OK structurally, CONCERN on how much is checked

| Lock / challenge | Teaches | Is the learning checked? |
|---|---|---|
| RFID, weak-default badge | MIFARE Classic default keys, dictionary attack | Yes, the clone must be saved (`erb:522-530`) |
| RFID, custom-key card | Darkside attack, holding range | Yes, and how the player handles Victoria decides whether the read lands (`m03_npc_victoria.ink:310-340`) |
| Key + lockpick, under a guard | Physical security, operational exposure | Optional (office and cabinets) |
| Password `Sterling2010` | Default reset passwords never changed | Optional |
| PIN 5829 from a Base64 draft | Encoding is not encryption | Optional, but genuinely checked: the code only comes from decoding |
| ROT13 whiteboard, hex roster, Base64-over-ROT13 drive | Recognising encodings, layering | **Not checked.** Tasks complete on opening the file (`erb:846-863`); the CyberChef laptop emits nothing (pass-3 F6) |
| Four VM flags | nmap, ProFTPD backdoor, ROT13 on the web host, distcc RCE | Yes, required by `concludeRequires` (`erb:336-343`) |

The brief fits the topic well: an exploit broker's own lab is the target, and the FTP box is the exact backdoor from m02 (`erb:639`). The weakness is that three of the four in-game decodes are honour-system. The debrief then narrates the directive's decoded content to a player who may never have decoded it (`m03_closing_debrief.ink:305-309`). See fix 8.

### 2c′. Field guides — OK

Six guides in HaX's `itemsHeld` (`erb:579-626`), each offered on request from a hub choice (`m03_phone_agent0x99.ink:53-66`). Exposure gating: lockpicking on entering the executive wing (`erb:629-634`), the four network/decoding guides on entering the server room (`erb:635-640`). The RFID guide is gated only on `briefing_played` (`:55`); that is acceptable because the cloner is the very first task. All six `labUrl`s match a published permalink in `HacktivityLabSheets/_labs/safetynet/` (checked front matter of each file).

Minor: `request_proftpd_guide` (`m03_phone_agent0x99.ink:109-116`) sets no `proftpd_guide_requested` global, unlike its five siblings. Harmless, but inconsistent. `lab_sheet/` in the mission folder still holds two pre-Hacktivity field-guide drafts that nothing references.

### 2d. Narrative structure — OK, two concerns

- Opening: `timedConversation` with `skipIfGlobal: briefing_played` (`erb:459-466`). It briefs role, objectives and kit, and closes with a clear first instruction (`m03_opening_briefing.ink:303`).
- Closing: hidden in-person debrief at HQ, launched on `victoria_choice_made` (`erb:906-913`), with `disableClose` and a credits roll on close (`erb:110-144`). Clear win condition.
- Spot-checked mappings: the post-clone call (`erb:663-670`), the distcc revelation call (`erb:738-745`) and the all-flags message (`erb:775-780`) all fire and point forward.
- **CONCERN: the day-to-night turn is invisible.** See §4.1.
- **CONCERN: Victoria talks to you at night as if it were still the afternoon.** Between the clone and the fourth flag she is still in the conference room. Talking to her runs `idle` → "Thank her for her time" → `start` → "We covered the main points. I'll be in touch about the training programme." (`m03_npc_victoria.ink:70-75, 544-545`). That is the afternoon line, said to an intruder after hours, and it undercuts her real night opener ("You came back after hours. Recruits don't do that.", `:424`). Fix 3.

### 2d′. Ink conventions — CONCERN (for the dialogue stage)

- Narration uses `Narrator:` lines, and the scenario defines a `narrator` voice (`erb:64-72`). OK.
- Fights end with `#hostile:night_guard` + `#exit_conversation` (`m03_npc_guard.ink:357-385`). OK.
- **`You:` echoes after choices:** about 75 across the mission (briefing 20, debrief 18, guard 16, Victoria 13, receptionist 5, phone 3; Danny's ink is clean). Typical: `* [Refresh my memory]` followed by `You: Remind me what their deal is.` (`m03_opening_briefing.ink:33-34`). The `npc-dialog-review` stage owns the rewrite; flagging the count so it is planned for.
- Several choice brackets are menu labels: "Ask about Victoria Sterling", "Ask about other employees" (`m03_npc_receptionist.ink:116-119`), "Offer a bribe" and "Ask about the guard's shift" (`m03_npc_guard.ink:274-280`), "Question the ethics" (`m03_npc_victoria.ink:139`).
- `on_restricted_area` (`m03_npc_guard.ink:461-475`) is unreachable: no mapping targets it. Delete it or wire it.

### 2d″. Patrol guard — OK

Waypoints use the current schema with dwell times, in-bounds for the 10x6 hall (`erb:1152-1164`). Cone 120°, range 150 px, visualised (`erb:1166-1171`). The pass-3e tuning gives a readable window: about 8 s safe in a 13 s loop (`erb:1145`). The hall is 1 GU tall, so this is a timing pass, not a walk-around, which matches the design. One nit: the catch knot says "A torch beam lands on your hands" (`m03_npc_guard.ink:406`) and fires in daylight too, because the office can be picked in the afternoon and the mapping has no phase condition (`erb:1173-1181`). Fix 14.

### 2e. Dungeon graph metadata — CONCERN

The graph is thin (25 nodes / 25 edges against m01's 50 / 61):

- **VM challenges float free.** The `vm-launcher` (`erb:1065-1073`) has no `puzzle_graph_*` field, so there is no `server_room → VM terminal → vmch_*` chain; the four challenges hang off nothing (`dungeon_graph.md`, Puzzle Graph).
- **The two conversations that gate the critical path are missing.** The cloner points straight at both RFID doors (`erb:392-393`). There is no `puzzle_graph_actions` node for "clone the receptionist's badge" or "clone Victoria's card in the meeting", so the graph doesn't show that the server-room card comes from the conference room.
- **The safe and the PC have no incoming clue edge.** The draft (`erb:1231-1239`), whiteboard and plaque carry no `puzzle_graph_unlocks`, so `lock_wall_safe_server` and `lock_victoria_computer` look like locks with no key.
- No backwards edges; starting items are present as nodes.

Fix 12.

### 2f. Room layout — OK

Seven rooms, geometry clean, doors aligned. `main_hallway` is empty, but it is the depth-1 junction for four routes (pass-3 D1 kept it). Room types fit an office building. Two small things for the room-dressing skill: the conference room uses `room_office` although `room_meeting` exists and is used elsewhere, and Danny's office uses the same `room_office` template, so the two rooms look alike. No backtracking for early clues beyond the intended safe loop.

### 2g. Objectives scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk? | Bark / conversation at the transition? |
|---|---|---|---|---|
| Get Inside WhiteHat | 3 | 3 (briefing `:126, 173-174`; receptionist hub `:124`; Victoria hub `:141`) | Low | Yes: HaX text on the badge (`erb:652-656`), call on leaving Victoria (`erb:663-670`) |
| Breach The Server Room | 5 (4 flags + logs) | 5 (HaX on entering, `erb:635-640`) | Low | Yes: revelation call on distcc (`erb:738-745`) |
| Search Sterling's Office | 2 | 2 (HaX on the wing, `erb:629-634`; aim text) | Low | Call on first file read (`erb:681-697`) |
| Zero Day's Paper Trail | 4 | 3. The filing cabinet has no pointer beyond the task text | Low (side aim) | Calls on catalogue and drive (`erb:709-722`) |
| Perfect Stealth | 0 (1 optional) | Misleading: see below | n/a | Debrief only |
| Settle Accounts | 2 + 1 optional | 2 (HaX all-flags message, `erb:775-780`) | **Medium** at entry | Yes, but see below |

Notes:

- **The "Sit tight" dead zone** after act 1 (2a, §4.1). The aim text says "Come back once the building has emptied" (`erb:183`) and HaX says to wait. A player who obeys has nothing to wait for.
- **Perfect Stealth hides its real condition.** The task says "Complete all objectives without triggering guard detection" (`erb:315-321`), but the debrief also requires entering Sterling's office and not knocking the guard out (`m03_closing_debrief.ink:168-171`). A player who skips the office and never meets the guard is told "you never gave him the chance" with no award. Fix 15.
- **`find_operational_logs` is a duplicate tick.** It completes on the same event as `submit_distcc_flag` (`erb:738-745`), so the player sees two completions for one action. Low priority; noted, not proposed.
- Task titles are action-led throughout. Good.

### 2h. NPC knockout resilience

| Person NPC | Gates a required task / item? | `taskOnKO` (or mapping) | KO reflected in debrief / credits? | Verdict |
|---|---|---|---|---|
| Receptionist | `clone_reception_badge`; holds the badge | `taskOnKO` (`erb:512`) + card drop (`erb:545-552`) | **No.** `receptionist_ko` (`erb:511`) is read nowhere: not by HaX, Victoria, the debrief or the credits | **Should fix.** HaX also tells the player the badge is "in the cloner" (2a). Victoria then greets you as if nothing happened in her lobby |
| Victoria Sterling | `meet_victoria`, `clone_rfid_card`, `victoria_choice_made`; holds the exec card | Four KO mappings (`erb:789-816`) + day-KO settle (`erb:817-830`) + relayed card (`erb:801-808`) | Yes: fate `ko` in debrief (`m03_closing_debrief.ink:274-285`) and credits (`erb:133`) | OK |
| Night guard | Nothing | n/a | Yes: debrief (`:172-173`), stealth credit excluded (`erb:139`) | OK |
| Danny Foster | Optional `danny_choice_made` | `taskOnKO` (`erb:1340`) + fate mapping (`erb:831-836`) | Yes (`m03_closing_debrief.ink:387-390`, `erb:137`) | OK |
| Briefing / Netherton / Nightshade / debrief | Hidden | n/a | n/a | N/A |

Win condition: `hear_debrief` completes on the debrief's last line with a room-entry backstop (`erb:837-845`); nothing on the critical path depends on a single NPC staying conscious. OK.

## 3. Prioritised action list (skill Step 3)

**Must fix (blocks play):** nothing. No invalid fields, no win-condition failure, no KO soft-lock.

**Should fix (degrades experience):**
- The day-to-night turn is silent, and HaX tells the player to wait for something that never happens (fix 1).
- Receptionist KO: HaX says the badge is in the cloner, and nobody in the story notices the KO (fix 2).
- Victoria's afternoon goodbye plays at night before the confrontation (fix 3).
- Graph metadata: floating VM challenges, missing conversation gates, clue-less locks (fix 12).
- Perfect Stealth hides its real condition (fix 15).

**Worth considering (polish):** the HaX timed message (fix 17), the daytime "torch" line (fix 14), the unreachable guard knot and the missing ProFTPD-guide global (fix 18), and the `You:` echoes for the dialogue stage.

## 4. Beyond the checklist

### 4.1 Pacing and dead time

The mission has three beats: an afternoon of conversation, a night of technical work, and a confrontation. The first and last are strong. The joins are weak.

- **The turn has no moment.** The night starts when Victoria's card is saved: one mapping sets `mission_phase` and `time_of_day` (`erb:657-661`). Nothing marks it. There is no cutscene, no fade, no lighting change (`time_of_day` is read by nothing in the engine; grep of `public/break_escape/js` finds no reference). The receptionist is still at her desk saying she's "just shutting down" (`m03_npc_receptionist.ink:246-252`). The only cue is a phone call on leaving the conference room, which tells the player to "sit tight until the place clears out" (`m03_phone_agent0x99.ink:241-242`). m01 and m02 never ask the player to wait, and m03 doesn't need to either. One narrated beat ("Nine hours later…") on the briefing background would turn a state flip into a scene change and make the night feel like a second visit. Fix 1.
- **The VM stretch is quiet.** The four flags are the longest stretch of the mission, mostly spent outside the game window. HaX reacts to the distcc flag (`erb:738-745`) and to all four together (`erb:775-780`), but not to the first three. A one-line text per flag would mark progress, tie each flag back to the story ("that's the box they sold Ghost") and tell the player what comes next. Fix 22.
- **The final traversal.** Server room → hallway → wing → Danny → wing → hallway → conference: six crossings through known rooms (pass-3 plan §8). HaX's all-flags message gives that walk a purpose: Danny first, then Sterling. Acceptable.
- **Where it sags:** a player who skips the office in the afternoon and goes straight from the fourth flag to Victoria never sees the guard, the password, the safe or the decodes. The mission still works, but they have played half of it. Pass 3's P1/P2/P14 gave them reasons to go back; fix 4 makes sure the story still holds if they don't.

### 4.2 Does the player always know what to do next?

Mostly yes. Every aim transition has a HaX text or call (table in 2g). Three soft spots:

- **"Sit tight"** (fix 1).
- **The clone opportunity is hidden behind rapport.** "Move closer to examine the whiteboard" appears only after influence 20 or both topics (`m03_npc_victoria.ink:141`). A player who ends the conversation early has the "Pick the conversation back up" route (`:542`), and the briefing and HaX's hint name the whiteboard (`m03_phone_agent0x99.ink:168`). OK, but the briefing's own clone topic says only "while she talks" (`m03_opening_briefing.ink:174`). Naming the whiteboard there would save a hint. Fix 16.
- **HaX's hints vanish after one read.** Each topic is gated `not hint_x_given` (`m03_phone_agent0x99.ink:151-160`), so a player who forgets the reset-slip format can't ask again. The pass-4 brief asks for key information that "players can find again". Fix 16.

### 4.3 How clearly each puzzle teaches its Cyber Security idea

- **RFID cloning: clear and well staged.** Weak defaults first, custom keys second, with the attack named and timed (`m03_opening_briefing.ink:173-176`). Nightshade's "capture and replay … one day it'll be our badge" line gives the defender's view. The Victoria interview making the custom-key read depend on suspicion (pass-3 P4) is the best teaching design in the mission: social engineering and the technical attack are one puzzle.
- **Default password: clear.** The IT reset slip ("Surname + year founded … Change it!", `erb:1226`) teaches the failure in one line.
- **Encoding versus encryption: taught, not tested.** The observations describe each encoding's shape without the recipe (pass-3 P7, e.g. `erb:1237, 1246, 1264`), which is good teaching. But only the Base64 draft has to be decoded, because only it feeds a lock. The ROT13 whiteboard, the hex roster and the two-layer drive complete on opening (`erb:846-863`), and the debrief then reads the decoded directive aloud (`m03_closing_debrief.ink:306-308`). A player can finish "Zero Day's Paper Trail" without decoding anything. The mission's own CyBOK tags list multi-layer decoding (`mission.json`, AC). Fix 8 gives the drive a light, ungated check.
- **The VM chain: well framed.** The FTP flag is the ProFTPD backdoor that took the hospital down (`erb:639`, `m03_phone_agent0x99.ink:113-114`), which is the strongest link between a lab exercise and the story in the first three missions.
- **What's missing: the lesson stated back.** Nothing at the end names what made each step possible: badges on MIFARE Classic, a reset password never changed, a legacy daemon left running, "encoded" mistaken for "protected". m01's debrief reviews the player's security audit (`scenarios/m01_first_contact/ink/m01_closing_debrief.ink:522-545`). m03's debrief has room for four short HaX lines from the defender's side, conditional on what the player actually did. Fix 7.

### 4.4 Fun and stakes

- **The afternoon interview is good fun.** It is a puzzle the player can get wrong, the consequence is visible ("She walks back to the table. The cloner's read stalls"), and there is a way back (`m03_npc_victoria.ink:276-340`).
- **The night has little threat.** The guard only reacts to lockpicking in his cone (`erb:1172-1181`; `unlock-system.js:205` is the only line-of-sight event the engine emits). An intruder can walk past him all night. Talking to him is the player's choice. There is no clock (pass 3 deferred the clock to m04). For a mission that sells "come back after hours", the after-hours part is calm. This is an engine limit more than a mission bug: backlog idea B1.
- **The confrontation is the high point.** Victoria waiting in her coat, "you have exactly one move", and three outcomes with a real cost each (`m03_npc_victoria.ink:420-521`). The recruit option needing the drive (pass-3 P1) makes the paper trail matter.
- **Danny's scene works.** Three honest positions and none of them free (`m03_danny_choice.ink:59-106`). His opener assumes the player has read his files (`:25`) even if they walked straight in. Fix 9.
- **Guard choices don't matter.** The player can tell a WhiteHat employee "I'm with SAFETYNET" (`m03_npc_guard.ink:221-245`) or pay him £500 (`:207-219`). Neither is ever mentioned again: not by Victoria, who opens the night with "Who are you with?" (`m03_npc_victoria.ink:430`), and not by HaX. Blowing your cover to the target's own staff should cost something. Fix 6.

### 4.5 Story payoff, debrief and conclusion

The debrief reflects the player's choices well: four Victoria fates, five Danny fates, each lore item, the catalogue's own consequence (with care not to burn a recruited Victoria), and three stealth readings (`m03_closing_debrief.ink:166-183, 198-426`). The credits mirror it (`erb:117-143`).

Gaps:
- the receptionist KO (fix 2) and the guard's cover choices (fix 6) are never acknowledged;
- the interview (influence, suspicion, a dropped read) is never acknowledged after Victoria's own night opener;
- "Murder with an invoice" is HaX quoting the player's optional briefing line (`m03_opening_briefing.ink:110`) as if it were her own (`m03_closing_debrief.ink:192`). Fix 10;
- the security lessons are not stated back (fix 7).

### 4.6 Continuity

**Kit.** Picks from m01 and the cloner from the start (`erb:378-404`); no PIN cracker, with an in-story reason (`m03_opening_briefing.ink:177`). m04 confirms the carry: "your picks, and the cloner from the WhiteHat job" (`m04_critical_failure/ink/m04_opening_briefing.ink:279`). Good.

**From m02.**
- m02's debrief already says "Ghost's logs confirmed what we suspected -- Zero Day Syndicate sourced the ProFTPD exploit" (`m02_ransomed_trust/ink/m02_closing_debrief.ink:651`) and "They sold Ghost the ProFTPD exploit" (`:789`). m03 then says "We think so. Tonight we prove it" (`m03_opening_briefing.ink:84`) and "This is the thing we couldn't prove at the hospital" (`m03_phone_agent0x99.ink:259`). The mission's central payoff reads as already won. Reframe it as the buyer's word versus the seller's own ledger with Sable's signature: same discovery, now admissible and naming a person. Fix 5.
- m02 hands over the operation name "Operation Cyber Arsenal" (`m02_closing_debrief.ink:793`); m03 never uses it. Fix 19.
- Nightshade still has the cracker "on his bench" (`m03_opening_briefing.ink:177`), matching m02's debrief (`m02_closing_debrief.ink:121-128`). Good.

**To m04.** m04's briefing treats the Phase 2 directive as known to the player: "This is the one the directive from the Zero Day job warned us about … We told you it was coming" (`m04_opening_briefing.ink:245`), and its debrief quotes it again (`m04_closing_debrief.ink:121`). In m03 the drive is optional (`erb:297-303`), and a player who skips it is told "without the directive itself we're working the shape of it" (`m03_closing_debrief.ink:324`). Fix 4 makes the directive's content canon by the end of m03 in every branch, while keeping the in-mission rewards for finding it.

**Later threads.** A recruited Victoria is "a story for later missions" (`m03_closing_debrief.ink:244`), but no file in m04–m08 mentions Sterling, Sable or Danny Foster (grep across their erb and ink). Either a later mission picks the asset up, or the line should promise less. Needs a user call (fix 21).

**Noticed, not acted on.** Nightshade's "One day it'll be our badge somebody clones, so remember how easy it was" (`m03_opening_briefing.ink:175`) reads, in hindsight of m08, as a mole hint, and the seed comment says "NO hint of the m08 betrayal" (`erb:487`). It may be a deliberate irony. User call; listed under fix 21.

## 5. Proposed fixes

Tags: **blocker / major / minor**; **local** = the mission's own erb, ink and docs (approved under the pass-4 rules if it stays solvable and validator-clean); **approval** = touches the engine, another mission or another repo. Spoken-line counts are approximate; m03 audio has not been generated yet. Every ink change needs the usual recompile, tagdiff, inkcheck/loopcheck, reopencheck and validator run.

1. **major · local — Give the day-to-night turn a scene, and stop telling the player to wait.**
   - Reword `on_rfid_clone_success` (`m03_phone_agent0x99.ink:241-242`): drop "Sit tight until the place clears out"; HaX says to walk out with the visitors and come back after dark.
   - Add a short narrated beat when the call ends: a hidden person NPC (the `closing_debrief` pattern, `erb:866-915`) with a night exterior or `hq1` background, triggered once on `global_variable_changed:clone_call_done` (set by `erb:668`), skipped on reload by its own global. Two or three `Narrator:` lines: the building empties, the receptionist leaves, the player comes back through reception at night.
   - Optional, same fix: hide the receptionist at night with a `setVisible: false` mapping on `mission_phase`. **Check first**: her NPC carries the badge `card_cloned` mapping (`erb:522-530`), which must already have fired by then (it has, since the badge precedes the conference room), and a hidden start-room NPC must not break re-reveal on reload. If in doubt, leave her and keep `closing_up`.
   - If a person-chat can't follow a phone-chat cleanly, put the narration at the end of the call itself. Verify in the browser.
   - About 5 spoken lines.

2. **major · local — Make the receptionist KO coherent.**
   - Add `"condition": "globalVars.receptionist_ko !== true"` to the badge text mapping (`erb:652-656`). `globalVarOnKO` is written before `taskOnKO` fires (`npc-hostile.js:155-183`), so the condition holds.
   - Add a HaX mapping on `npc_ko:receptionist_npc`: a text that her badge is on the floor and that the lobby will be noticed.
   - Victoria: sync `receptionist_ko` into `m03_npc_victoria.ink` and give `first_impression` one alternative line when it's true (she noticed the empty desk), plus +10 `victoria_suspicious` so it feeds the existing P4 logic.
   - Debrief: one HaX line; credits: one warning line (`erb:117-143`) conditioned on `receptionist_ko`.
   - About 4 spoken lines.

3. **major · local — Victoria at night, before the confrontation is ready.** In `m03_npc_victoria.ink`, sync `mission_phase` and add a branch to `start` before the `victoria_card_cloned` block (`:70-75`): when `mission_phase == "act2_infiltration"` and not `night_confrontation_ready`, a narrated beat where she is on a call with her back to the door and the player backs out unseen, then `#exit_conversation` to `idle`. Change the `idle` choice text at `:544` to match ("Leave her to her call"). Alternative: hide her from the clone until `night_confrontation_ready`, which makes HaX's "her card just went through the conference room reader" (`erb:779`) literally true, but needs a reload check on a hidden non-`initiallyHidden` NPC and must not hide a KO'd body. The ink branch is the safer fix. About 2 spoken lines.

4. **major · local (preferred) — Make the Phase 2 directive canon in every ending, for m04's sake.** In the debrief's not-found branch (`m03_closing_debrief.ink:323-331`), HaX reports that the search team pulled the drive from Sterling's desk that morning and gives its substance (grid storage, substations, hospitals on generator, Critical Mass, winter), then goes on to `architect_revelation` as the found branch does. The player still loses the in-mission rewards for finding it (the recruit option, the credits line, the "whole paper trail" line at `:399-401`), so finding it still matters. Alternative (**approval**): soften m04's "We told you it was coming" (`m04_opening_briefing.ink:245`) instead. The m03 change is cheaper and keeps m04 untouched. About 3 spoken lines.

5. **major · local — Reframe the proof against m02.** m02 has already said Zero Day sold the exploit (`m02_closing_debrief.ink:651, 789`). Change m03's "We think so. Tonight we prove it" (`m03_opening_briefing.ink:84`), "This is the thing we couldn't prove at the hospital" (`m03_phone_agent0x99.ink:259`) and the matching debrief line (`m03_closing_debrief.ink:192`) to the buyer's-word-versus-seller's-ledger framing: Ghost's logs named Zero Day; tonight's record is Zero Day's own, timestamped, with Sable's approval on it, which is what a prosecution and a name need. About 3 spoken lines.

6. **major · local — Make the guard's cover choices count.**
   - Set a global (e.g. `guard_told_safetynet`) in `safetynet_reveal` (`m03_npc_guard.ink:221-245`) and another for an accepted bribe (`:207-219`); declare both in `globalVariables`.
   - Victoria: if `guard_told_safetynet`, her night opener skips "Who are you with?" (`m03_npc_victoria.ink:430`) for a line that shows she already knows, because the guard rang her.
   - Debrief: one HaX line on each (cover blown to the target's own staff; a bribe on the record).
   - About 4 spoken lines.

7. **major · local — State the security lessons back in the debrief.** Add a short knot before `final_assessment` (`m03_closing_debrief.ink:397`) with up to four HaX lines, each conditioned on what the player did: MIFARE Classic badges cloned from a step away (always); a reset password nobody changed (`access_victoria_computer` done, i.e. `draft_seen or roster_seen`); a legacy service left listening (always); "encoded" mistaken for "protected" (`catalogue_seen` or `usb_seen`). Defender's view, one sentence each, no attack detail. Optionally one player choice on which of these WhiteHat's clients should fix first. About 4-5 spoken lines.

8. **major · local — An ungated check on the two-layer drive.** Turn `on_architect_directive_found` (`m03_phone_agent0x99.ink:305-309`), which already asks "tell me what it says", into a short exchange: three player answers, one only knowable from the decoded text (the winter window and hospitals on generator). The right answer sets `directive_decoded`; a wrong one gets "That's still one layer down. Run it again" and leaves the choice open (sticky). Nothing is gated on it: the recruit option and the debrief stay on `usb_seen` as now. The debrief's found branch says "you decoded it" only when `directive_decoded`. This differs from pass-3 D7, which used a quiz as a gate; here a wrong answer costs nothing and the point is to make the second decoding pass a thing the player does. About 5 spoken lines.

9. **minor · local — Danny's opener.** Gate "You've seen it. The hospital files." (`m03_danny_choice.ink:25`) on `danny_evidence_seen` (already set by the folder's `onRead`, `erb:1309`), with an alternative such as "You're here about the hospital." 1 spoken line.

10. **minor · local — "Murder with an invoice."** The debrief's unconditional use (`m03_closing_debrief.ink:192`) quotes a briefing line the player may not have chosen (`m03_opening_briefing.ink:110`). Gate it on a global set by that choice, or give HaX her own words. 1 spoken line.

11. **minor · local — Briefing framing.** The narration says HaX is "patched in over comms" (`m03_opening_briefing.ink:24`) while the cutscene shows her in the room (`erb:442-466`), and she opens with "thanks for picking up" (`:32`). "1247 Market Street" (`:293`) is a US-style address in a mission with the CPS, quid and a Cardiff receptionist. Pick one framing and a UK address. 2-3 spoken lines.

12. **minor · local — Dungeon graph metadata.** Add `puzzle_graph_*` to the VM launcher so the `vmch_*` nodes hang off the server room; `puzzle_graph_actions` on the receptionist and on Victoria for the two clones (the conference door and the server-room door); `puzzle_graph_unlocks` on the plaque (→ `victoria_computer`), the whiteboard and the draft (→ `wall_safe_server`). Regenerate with the validator. No spoken lines.

13. **minor · local, needs a live check — The network as described versus the network as built.** The fiction describes separate hosts on a fixed `192.168.100.0/24` with a ".50" to avoid (`erb:189-193, 953`; `m03_opening_briefing.ink:186`; `m03_phone_agent0x99.ink:202`). The SecGen scenario builds all four services on one VM with an assigned address (`SecGen/scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml:89-94, 96-160`), and m01 uses `192.168.100.50` for its Kali box (`m01 erb:1974`). Check the subnet and host layout on a real Hacktivity build. If they differ, say "the training subnet" and "one box, four services" and drop ".50". No spoken lines unless the briefing line changes.

14. **minor · local — Daytime lockpick catch.** `mission_phase` is already synced into `m03_npc_guard.ink` (`:13`); give `on_lockpick_detected` a daytime line without the torch (`:406`, also `:455`). 1-2 spoken lines.

15. **minor · local — Perfect Stealth says what it means.** Retitle `zero_detection` (`erb:315-321`) and its aim text (`erb:309`) to "Get into Sterling's office without the guard catching you, and without knocking him out", matching `m03_closing_debrief.ink:168`. No spoken lines.

16. **minor · local — Hints the player can read again.** In `provide_hint` (`m03_phone_agent0x99.ink:151-160`), keep the topics available after first use (drop the `not hint_x_given` guards, or add a sticky "Say that again" branch). In the briefing's clone topic (`m03_opening_briefing.ink:174`), say the moment is "at the whiteboard". 1 spoken line.

17. **minor · local — HaX's first text.** Add a `timedMessages` entry on `conversation_closed:briefing_cutscene` (m01 pattern, `m01 erb:636-643`): "Reception first. Lean in near her lanyard." 1 line.

18. **minor · local — Tidy-ups.** Add `#set_variable:proftpd_guide_requested:true` to `request_proftpd_guide` and declare it (`m03_phone_agent0x99.ink:109-116`; `erb:1403-1409`); delete the unreachable `on_restricted_area` knot (`m03_npc_guard.ink:461-475`); delete or archive the two stale drafts in `scenarios/m03_ghost_in_the_machine/lab_sheet/` after checking nothing links them.

19. **minor · local — Use m02's operation name.** Netherton names "Operation Cyber Arsenal" in his first line (`m03_opening_briefing.ink:26`), picking up `m02_closing_debrief.ink:793`. 1 spoken line.

20. **minor · local — `mission.json` CyBOK tags.** Add the ProFTPD 1.3.3c backdoor (MAT) and default/reset passwords (AAA); drop "Docker networks" (SS), which doesn't describe a SecGen VM.

21. **approval — Later-mission threads.** (a) A recruited Victoria is promised as "a story for later missions" (`m03_closing_debrief.ink:244`) and nothing in m04–m08 picks her up: either a later mission references her (other mission) or the m03 line promises less (local). (b) Nightshade's "one day it'll be our badge somebody clones" (`m03_opening_briefing.ink:175`) against the "no m08 hint" rule (`erb:487`): keep as irony or cut. User call on both.

22. **minor · local — HaX acknowledges each flag.** Add `sendTimedMessage` to the scan, FTP and HTTP flag mappings (`erb:723-737`): one line each tying the flag to the story and pointing at the next service (e.g. FTP: "That's the backdoor they sold Ghost, running on their own training box"). Keep them short; the distcc call already carries the big beat. 3 spoken lines.

## 6. Ideas for the backlog

- **B1. A "seen by NPC" event (engine).** The only line-of-sight event is `lockpick_used_in_view` (`unlock-system.js:205`). A general `player_seen:<npc>` event, with a per-mapping condition on time of day or area, would let night guards challenge intruders, not just pickers, and give stealth missions real tension.
- **B2. Time of day as a visual state (engine/art).** `time_of_day` is set by m03 and read by nothing. A night tint or lighting overlay keyed on a global, plus night variants of the lobby, would make day/night missions read at a glance.
- **B3. A scene-transition card (engine/UI).** A reusable "Later that night" / "The next morning" interstitial with a background, triggered by an eventMapping, instead of borrowing a hidden person NPC for narration.
- **B4. A CyberChef workstation that reports decodes (minigame).** The laptop is an iframe that emits nothing (pass-3 F6). If it emitted `decoded:<itemId>` when the output matched a known plaintext, decode tasks could be honest without quizzes, in m03 and every later encoding puzzle.
- **B5. Per-flag handler reactions as a pattern (authoring).** A small helper in the ERB, or a documented pattern, for "HaX texts one line per flag", so VM stretches don't go quiet in other missions too.
- **B6. Debrief "what made this possible" block (authoring).** Make the defender's-view recap (fix 7) a standard part of every debrief, after m01's audit review.
- **B7. Conference-room template (art).** m03 uses `room_office` for both the conference room and Danny's office. A proper meeting-room layout with a whiteboard wall would make the interview room memorable.
- **B8. Recruited-Victoria payoff (story).** If the user wants the recruit branch to matter, a later mission (m05 or m07, both Zero Day-adjacent) could carry one conditional line or a phone message from "Sable". Needs a cross-mission save flag or a briefing question, so it is a design decision as much as a feature.

## 7. Changes made (pass 4 design)

Implementation agent, 2 October 2026. Mission-local files only (erb, ink, mission.json, walkthrough); nothing committed. One shared test fixture was touched: m03's block in `scripts/ink_runtime_check/missions.json` (new globals and the new NPC, so reopencheck covers them).

1. **Changed approach.** The day-to-night turn is now a scene, but the "sit tight" phone call is gone rather than reworded. A new hidden person NPC, `night_transition` (reception_lobby, ink `m03_night_transition.ink`), plays three narrated lines on the first main-hallway entry after the clone (or a day KO of Victoria), with variants for a KO'd receptionist and a KO'd Victoria. It sets `clone_call_done`, so a reload doesn't replay it. HaX's instruction follows as a text on `conversation_closed:night_transition`, so it stays in her thread. The old call knot `on_rfid_clone_success` and its mapping are removed. Why: chaining a person-chat after a phone-chat risks one minigame closing the other; a cutscene followed by a text doesn't. The receptionist is not hidden at night (pass 2 found `setVisible:false` didn't stick); her night line now says she came back for her charger. The act-2 aim text no longer says to wait.
2. **Done.** The badge text is gated on `receptionist_ko !== true`; HaX texts on `npc_ko:receptionist_npc`; Victoria notices the empty desk at the first meeting (+10 suspicion and `suspicion_warned`, so the eager-recruit walk-back is offered) and again in her night opener; one debrief line; a warning credit.
3. **Done, keyed differently.** Victoria's night-before-the-flags branch (`night_on_call`) keys on `clone_call_done`, not `mission_phase`, because `mission_phase` flips while the player is still in her room in the afternoon. Idle choice "[Look in on Sterling]". HaX's all-flags text no longer says her card "just went through the reader" (she has been in the room on the phone); it says she's off the phone now.
4. **Done (m03-only route).** Not-found branch: the search team recovered the drive this morning; the substance follows and the Architect section plays for everyone (`directive_substance` knot shared by both branches). Finding it still earns the recruit option, the credits line and the "whole paper trail" line. The final-assessment line reads "The drive in her desk, you left for the search team." m04 untouched.
5. **Done.** Briefing: "Ghost's logs say so. That's the buyer's word. Tonight we get the seller's." Revelation call and debrief reframed as the seller's own ledger, with Sable's approval, saying back what Ghost's logs said.
6. **Done.** `guard_told_safetynet` (set on entering `safetynet_reveal`, whichever cover the player then takes) and `guard_bribed` (accepted £500). Victoria's opener replaces "Who are you with?" with the guard having rung her; debrief has one line for each.
7. **Done.** New knot `what_made_it_possible` between Danny and the final assessment: a lead-in plus up to four one-sentence lines, each gated on what the player did (badge cloned; a file on her PC opened; distcc always; an encoded item opened). No player choice added.
8. **Done.** `on_architect_directive_found` now asks for the decoded content: three specific Phase 2 answers (only one matches the decoded text), a wrong one costs nothing and loops back, and "I haven't got it to read yet" parks it as a hub option. The right answer sets `directive_decoded`. Nothing is gated; the debrief's found branch says "took both layers off it yourself" only when it is set. Choices are in a text-free knot (phone re-navigation rule).
9. **Done.** Danny's opener is gated on `danny_evidence_seen`; otherwise "You're here about the hospital. Aren't you."
10. **Done.** The briefing choice sets `called_it_murder`; the debrief says "You called it murder with an invoice. Now we have the invoice." only then.
11. **Done.** HaX is in the room in the narration; "thanks for picking up" dropped; address "Callaghan Square, Cardiff".
12. **Done.** VM launcher has `puzzle_graph_role: vm` (the four challenges now hang off the server room); both NPC-held keycards point at their doors through an AND-gate with the RFID cloner (the cloner's own direct unlocks removed, so the graph shows where each card comes from); plaque → PC, whiteboard and draft → safe (AND CyberChef). Graph 25/25 → 36/43 (integrated 42/55). I used keycard edges rather than `puzzle_graph_actions` because the generator only links actions to aims, not to doors.
13. **Done, text only.** No VM build. In-game text no longer hard-codes `192.168.100.0/24` or ".50": task description, conference whiteboard, runbook, briefing, HaX's network hint and Victoria's whiteboard line now say "the training network" / "whatever the scan finds" / "isolated, server room terminal only". The FTP/web/legacy names stay as service names, which reads true for one box with four services. Left as is: the `vm_object` fallback `ip` (config; overridden in Hacktivity mode) and SecGen's own nc_message flag text, which still says the subnet (other repo).
14. **Done.** Torch lines are night-only in `on_lockpick_detected` and `lockpick_final`.
15. **Done.** Aim text "Get into Sterling's office without the guard catching you, and without knocking him out"; task "Get into Sterling's office unseen".
16. **Done.** All hint topics (and the confrontation hint) stay on offer after first use; the briefing clone topic says "Your moment is at the whiteboard".
17. **Done.** HaX `timedMessages` on `conversation_closed:briefing_cutscene`.
18. **Partly done.** `proftpd_guide_requested` set and declared; `on_restricted_area` deleted. **Not done:** deleting the two stale drafts in `lab_sheet/` (plus its README) was refused by the permission system; nothing links them (checked). Left for the user.
19. **Done.** Netherton opens with "This is Operation Cyber Arsenal."
20. **Done.** `mission.json`: ProFTPD 1.3.3c source backdoor (MAT), default and reset passwords (AAA); "Docker networks" replaced with "Legacy services" (SS).
21. **(a) Done:** "Whether she stays turned is anyone's guess." replaces the promise of later missions. **(b) Not done:** Nightshade's badge line left as it is (with the user).
22. **Changed approach.** The three texts are added to the existing flag mappings rather than as separate conditioned mappings: the engine's conditions don't support `||`, so "skip if last" can't be expressed. If a non-distcc flag lands last, its text is followed two seconds later by the all-flags message, which reads as a sequence.

Checks: ink compiles (8 files, 0 failures); validator schema passes with the same pre-existing warnings as §1 (none new); door alignment OK; render assertions pass; reopencheck m03 0 problems; inkcheck/loopcheck clean over the state matrix; tagdiff differences all intended.

### Round 2 (re-review `DESIGN_REREVIEW_1.md` and browser playtest `tools/playtest/m03-pass4-report.md`)

Re-review findings:

1. **Done.** The scene no longer sets `clone_call_done` when it opens. A second `night_transition` mapping sets it on `conversation_closed:night_transition`, so a reload mid-scene replays the scene and HaX's follow-up text. An ink tag on the last line would not have worked: person-chat runs every tag in a batch before showing the first line (`person-chat-minigame.js` `displayAccumulatedDialogue`).
2. **Done.** The "coat on" half of the guard line is gated on `victoria_fate != "ko"`.
3. **Done.** `eager_recruit` branches on `receptionist_ko`: "The desk was empty when I came through. I signed myself in." / "*coolly* How thoughtful." The old line stays in the else.
4. **Done.** Wording: "the one box they knew was broken … left listening because it was useful to them."
5. **Done.** Both found branches say ten minutes.
6. **Done.** Distractors now share the right answer's surface ("Substations first. Then hospital records, once the grid drops. Spring." / "Grid storage first. Then water treatment, while hospitals run on generator. Before Christmas."). The right answer is now the middle option. The debrief claims less: "you read what was under both layers yourself".
7. **Done.** Receptionist at night: "I only came back for my charger." / "Is Ms. Sterling expecting you this late?" Choice "[She is. Goodnight.]".
8. **Skipped (dialogue stage).** No line made longer. The two all-flags texts now each exist twice (see playtest 1); a comment in the erb says to edit each pair together.
9. **Done.** "walk out into the afternoon"; HaX says "use Sterling's card at the reader".

Playtest:

1. **Done.** The all-flags texts (normal and day-KO) now need `revelation_heard`, set by a tag on the revelation call's last knot (`m2_revelation_end`). Two new mappings on `global_variable_changed:revelation_heard` send the same texts when distcc was the last flag, 2 s after the call's last line. The validator treats them as disjoint (no new warning). Edge: a reload in the middle of that call means `revelation_heard` is never set, so the all-flags text never comes. HaX's "Where do I stand?" and Victoria's "Sterling. We need to talk." still cover it.
2. **Done.** The guard's `lockpick_used_in_view` mapping is conditioned on `guard_told_safetynet !== true && guard_bribed !== true`. The engine's lockpick interrupt checks the mapping's condition, so once he has been told or paid the pick goes ahead. His lines are alibis ("if anyone asks"), so they now hold. Perfect Stealth (debrief, credit, aim and task text) excludes both routes. A new debrief line covers them: "The guard never logged you, because you'd talked your way past him. Effective. Not stealth."
3. **Done.** New global `exec_wing_entered`, set by HaX's executive-wing mapping. "You never gave him the chance" now needs it; a player who never went into the wing gets no guard line.
4. **Done.** m01/m02 have no narrator-only scenes; their narration always sits in a HaX scene where her portrait is true. The night scene now uses the player's own portrait (`male_hacker_hood_down_talk.png`, displayName "Agent 0x00"; m02 uses a hidden player NPC the same way) and no background (background1's central rectangle was the "empty frame"). The validator now warns "person-chat cutscene has no background"; this is intended, and the only backgrounds available are HQ rooms, which would be wrong here.
5. **Done.** HaX's executive-wing warning delay is 0. The post-scene text also says "Mind the guard in the executive wing."
6. **Done.** The post-scene text delay is 0 (delivery is on the next 1 s tick after the scene closes). It now carries the direction itself.
7. **Done.** Same as re-review finding 6.

Not addressed: the playtest's thread-greeting note (defect 4, the "What do you need?" greeting drops out of the thread once a scripted call lands). This is engine phone-history behaviour, not m03.

Round 2 checks:
- Ink: compile clean (8 files).
- Validator: 0 INVALID. Warnings are the previous set plus the intended no-background warning above.
- Doors: OK.
- Render asserts: 11/11.
- reopencheck m03: 0 problems.
- Scripted inkjs paths: 22/22. This includes the right-answer path the playtester couldn't reach (sets `directive_decoded`, the hub option disappears, the debrief says "read what was under both layers yourself"). It also covers `revelation_heard` set only on the call's last knot, the night scene re-running cleanly (the mid-scene reload case), and every new debrief gate.
- inkcheck/loopcheck matrix: clean.
- tagdiff: 168 structural differences. The 10 added this round are all intended: debrief `exec_wing_entered` VAR, the three rewritten stealth conditions, the `victoria_fate != "ko"` condition; Victoria `eager_recruit` receptionist_ko/else; phone `#set_global:revelation_heard`.
- dialoguelint: the touched lines are clean apart from the two pre-existing over-long all-flags texts (finding 8).

Spoken lines this round: about 6 added (2 eager walk-back, 1 talked-past debrief line, 1 coat-line split, 1 receptionist doubt, 2 phone texts duplicated rather than written) and about 10 changed.
