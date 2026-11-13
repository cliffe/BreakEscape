# m02 Ransomed Trust: design re-review, round 1 (pass 4)

Reviewer: fresh adversarial reviewer, 2026-10-02. Read-only apart from this file. Scope: the uncommitted pass-4 design changes (`git diff HEAD -- scenarios/m02_ransomed_trust/`, `DESIGN_REVIEW.md` §7, `PASS4_PLAYTEST.md`), with engine fix A (`lockpick-catch.js`) in the tree. Static review only; no browser run.

## Verdict

**Another round needed.** No blockers. All 21 fixes in §7 are in the tree and work on every route I traced, and nothing that worked before is broken. Three majors remain:
- M1: the deduction can be skipped by guessing.
- M2: the naming task's title doesn't say what completes it.
- M3: Ghost's keys are still dominated by the combined restore.

There are also 12 minors, all small, mission-local edits. A short third round after the fixes should be enough, followed by the browser playtest in `PASS4_PLAYTEST.md`. None of this has been seen in a browser yet.

## 1. Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb …/scenario.json.erb` | Schema passes; geometry and doors OK. One warning: Val's catch is a person-chat without `onceOnly` (intended, `scenario.json.erb:2971`). The "several onceOnly handlers" warnings are all gone. Critical path still ends on "Put A Name To The Badge" (tooling, already logged). Note: the validator rewrites `dungeon_graph.*` as a side effect. |
| `python3 scripts/check_door_alignment.py` | All OK, including `office_corridor west->security_office`. |
| Ink JSON in step | Recompiled all 15 inks with `bin/inklecate` into scratch and compared with the committed `.json`: identical. |
| `tagdiff.mjs` | 252 structural differences over the modified inks; the ones I traced (Val, Reeves, terminal, HaX, Ghost, debrief, Gary, Doyle, Bernie) match §7 of `DESIGN_REVIEW.md`. Files listed as "modified" with "structure: unchanged" (patients, Kim, briefing) are noise. |
| `dialoguelint.mjs` | 202 errors (line-len 168, text-len 33, choice-len 19) and 21 not-x-but-y warnings, mostly pre-existing. New pass-4 HaX texts over the 30-word cap: Bed 4 (`:1156`, 50 words), the two naming nudges (`:1052`, `:1058`), server-room arrival (`:943`), operator note (`:908`), SSH (`:956`). These belong to the dialogue stage, not this one. |
| `reopencheck.mjs … m02_ransomed_trust` | 0 problems (HaX 757 reopens, Ghost 81, terminal 1800). |

## 2. Fix-by-fix verification

**Engine fix A is wired correctly.** `unlock-system.js` and the key minigame's "Switch to Lockpicking" both call `catchLockpickInView` (`lockpick-catch.js:15-37`; `minigame-starters.js` `beforeSwitchToPickMode`; `tool-manager.js:122-128`). On a catch the key minigame is closed with `caughtLockpicking`, so the "wrong key" alert is suppressed. Val's and Gary's catches can now fire for key holders. Playtest step 9 should expect the catch, not the bypass.

**Val's window (checked against the engine).**
- Waypoints are `tile × 32` relative to the room (`npc-behavior.js:446-448`), so W1 is feet (96, 112) and W2 is (240, 112). The LOS eye is the sprite centre (`npc-los.js` `getNPCPosition`), with no wall occlusion. Facing comes from `behavior.direction` (`npc-los.js:128-141`), which stays on the last walking direction through a dwell (`npc-behavior.js:844-852`, `idle` with `this.direction`). So she faces west for the whole W1 dwell.
- The pick gate uses the player sprite centre (`lockpick-catch.js:21-23`). A door can only be started within 64 px of the door sprite centre (`doors.js:583-590`); the E-key path also requires 64 px from a point 16 px lower (`interactions.js:1683-1699`).
- Recomputed: inside the implementer's area (64 px of (16, 80), x 41-80, y 38-124) the worst case from the eye (96, 81) is 53.6° off-axis and 69.8 px away, so their numbers hold. If the player stands so that the E-key anchor (16, 96) is the binding one, the worst case rises to 62.4°, still inside the 70° half-cone but with about 8° of margin, not 16°. **Seen at W1, safe at W2 and on the east leg: confirmed.**
- Cone spill: range 110 from x 96 reaches x −14, so 14 px into the security office, as stated. On the east leg it reaches 30 px past the corridor's east wall. Cosmetic only.

**Routes past Val.**
- *Talk:* every clearance knot runs `val_opens_office` (`m02_npc_security_guard.ink:240-245`). Val lists `unlockable: ["security_office"]` and the server checks encounter plus `unlockable` (`game.rb:982-996`). Lanyard: three sources, none of which sets `cover_restored` any more (`scenario.json.erb:857-877`, Gary and Doyle ink). Pre-burn lanyard pickup no longer fires "That'll hold" (`:918-919` needs `cover_burned`). OK.
- *Blind-spot pick:* gate passes when she can't see. `regain_freedom_of_movement` completes on the first post-burn `room_entered:security_office` (`:933-936`). `cover_restored` stays false, so COVER BURNED, "Nobody vouched for you" and "I never did get it back" are reachable. OK.
- *Caught:* `on_lockpick_used` → `after_catch` → `cover_challenge_speech` if burned (`:282-286`). Cooldown 250 plus `!attacked_guard`. OK.
- *KO:* her key drops (`itemsHeld`, `:3010-3015`, same pattern as Bernie's key). The KO handler no longer sets `cover_restored`. The corridor challenge and the server-room catch skip a KO'd NPC (`npc-manager.js:815-823`). OK.
- *Burn lands:* `room_entered:office_corridor` opens `cover_challenge` (`:2991-2997`). The burn is set immediately on `talk_to_gary` (`:841-846`), and every route to the server room crosses the corridor after Gary. Reload mid-challenge: the handler is only persisted when the conversation closes, so it re-fires on the next entry (`npc-manager.js` `_persistTriggerOnClose` comment). OK.

**Ghost's deal.** `object_interacted` is emitted with `objectType` before the console opens (`interactions.js:619-625`). The video call ends the console 500 ms later (`npc-manager.js:960-978`; `minigame-manager.js` `startMinigame`). `requiresGlobal` and `requiresGlobalLabel` are honoured by the console (`backup-recovery-minigame.js:197-219`), and `backup_recovery_source` is written as the source id (`:310`). Accept, think (second ask on next console use, `on_console_again`), refuse and accept-from-device all reach the right globals. HaX's dead choice now shows. OK, with two notes in §3.

**Death toll.** Credits: 2 on `paid_ransom || ward_recovering`, 6 otherwise (`:172-173`). Debrief: paid 2, Ghost's keys 2, combined 2, offline 6. RANSOM REFUSED is hidden on Ghost's keys. Consistent.

**Bed 4.** `slow_path_window_open` is set only by the offline-only choice (`:1122`). The ward text fires 2.5 s later unless Mr Pryce is KO'd. The boardroom pointer is held and re-sent on `bed4_manually_stabilised` or `patient_bed4_deceased` (`:1145-1166`). Timers unchanged (`:3217-3235`). OK.

**Naming the insider.** HaX's four naming handlers are gone; three nudges remain, none sets `insider_identified` (`:1036-1065`). Naming via the HaX hub (`m02_phone_agent0x99.ink:477-506`) or to Reeves' face (`m02_npc_asset.ink:77`, `name_him`). Phone rules: the choices sit in a choices-only knot that re-checks `insider_identified` (PASS3 phone rule). OK mechanically; the deduction itself is weak (§3, M1).

**Never named → ambush.** The terminal defers `mission_complete` via `close_decision` (`m02_object_press_terminal.ink:226-236`). Setting `awaiting_ambush` closes the terminal and opens Reeves' scene 500 ms later (`npc-manager.js:873-897`). His scene has no choices; `InkEngine.continue()` returns one visible line at a time with its tags (`ink-engine.js:31-61`), so `mission_complete` is processed after his last line, and the debrief follows the ambush rather than racing it. The three backstops are present: Reeves' `start` (`:44-46`), the terminal's `ambush_backstop`, and 13 `room_entered:*` mappings on `closing_debrief_trigger` (`scenario.json.erb:1295-1302`). Each is once-only and conditioned on `awaiting_ambush && !mission_complete`, so the first to fire disables the rest. None can fire before the terminal decision. The 13 `hear_debrief` backstops (`:822-829`) need `debrief_played` and can't fire during the `disableClose` debrief. Neither set can fire early or twice.

**Raval, patients.** `raval_ko` replaces Doyle's global on Raval (`:1482`); per-bed KO globals guard every bark; `npc_attacked:<bed>` is a real event (`player-combat.js:316`). Debrief and credits lines present. OK.

**Reloads.** Door unlocks and globals persist on the server. Val's challenge re-fires if interrupted. Once-only phone texts (burn, Bed 4, nudges) are lost on reload; `general_advice` backstops the burn and the naming, not Bed 4 (§3, m6).

**Critical path without hints.** Val's pre-burn line points at Gary's card; HaX's burn text names Val and her office; the challenge opens by itself with a lanyard option, and a spare lanyard lies in the handover room on the main route. Solvable.

## 3. Findings

No blockers. Everything below keeps the mission solvable; the majors are about whether the new choices mean what the design says they mean.

### Major

**M1. The deduction can be skipped by guessing.** The orchestrator's decision is that the player names the insider. Two things undercut it:
- Reeves offers "You're badge SC-4471." to anyone who has the badge number (`m02_npc_asset.ink:77`, gated only on `insider_badge_id_found`). He is the only person with that choice, so it is a free correct accusation with no evidence needed.
- HaX's menu lists Reeves first and puts the reasoning in the choice text ("The night supervisor who's stood on the boardroom post all night", `m02_phone_agent0x99.ink:488`). A wrong name (Val, Gary) costs nothing and the menu comes straight back (`:489-494`).

Fix:
- Gate Reeves' accusation on `inspected_asset_post or insider_evidence_partial`. Without that evidence, give a softer probe ("Which badge do you wear on this post?") that he deflects.
- In HaX's menu, cut the choice to "Graham Reeves." and don't list it first.
- Make a wrong name cost something. Either it ends the exchange ("Come back when you're sure", one retry), or it sets `accused_wrong_suspect`, which the debrief already reads.

**M2. The task doesn't say what completes it.** "Match the badge number to the security post it belongs to" (`scenario.json.erb:424-428`) is done the moment the player reads the post log, but the task only completes when they *name* him to HaX or to his face. A player who reads the log, sees no tick, and goes to the terminal gets the ambush and loses the arrest. Fix: retitle it "Name the badge holder: tell HaX, or say it to his face". Optionally add a task "Read the duty sheet for badge SC-4471's post" that completes on `inspected_asset_post`, so the log read gets its own tick.

**M3. Combined restore still beats Ghost's keys for most players.** Ghost's keys cost 2 deaths and a promise. The combined restore costs 2 deaths and nothing (`m02_closing_debrief.ink` `ghost_keys_outcomes` vs `combined_recovery_outcomes`; credits `:172`). A player who does the flags in order arrives at the console with the escrow keys and the staging cache, so the deal is strictly worse than a choice they already have. It only matters to a player who reaches the console before flag 4 or the safe. §7 promised "a real three-way trade", and that isn't there yet. Fix: give the four hours a cost. Either run Bed 4's slow-path countdown on the combined route too (so it costs a run to the ward), or make it 3 deaths against 2 for the sub-hour routes. Then update the credits and debrief counts to match. This is a design change, so the orchestrator or the user should decide; it is mission-local.

### Minor

**m1. Punching Val doesn't set `attacked_guard`.** Only the ink's hostile choices set it (`m02_npc_security_guard.ink:144,321,371`). A player who punches her without talking makes her hostile through combat (`player-combat.js:309-317`), but her catch, the corridor challenge and the server-room catch all still pass `!attacked_guard`. Each would then open a chat with a hostile guard. Fix: add `{ "eventPattern": "npc_attacked:security_guard_patrol", "onceOnly": true, "setGlobal": { "attacked_guard": true } }` to HaX's or Val's mappings.

**m2. The wrong-suspect debrief and one credit are unreachable.** Every unnamed player now goes through the ambush, which sets `insider_asset_escaped`. `insider_status` checks escaped before `accused_wrong_suspect` (`m02_closing_debrief.ink:589-597`), so `insider_missed_wrong` (`:656`) and `insider_unnoticed` (`:667`) can't be reached, and neither can the credit "INSIDE ASSET: Unidentified" (`scenario.json.erb:199`). This was already true before pass 4, but far more players reach the ambush now. Fix: in `insider_escaped`, add an `{accused_wrong_suspect: …}` line, so a player who accused Kim or Gary hears about it. Delete or repurpose the dead credit.

**m3. The backstop routes put false words in the debrief.** `insider_escaped` says "he told you who he was and walked out" (`:650`). Under the terminal's `ambush_backstop` and the `room_entered` backstops, Reeves never spoke. Fix: condition the clause on `insider_ambushed`, with a plainer fallback ("His post was empty by the time anybody looked").

**m4. A vouched player after a reload meets Val for the "first" time.** `cover_challenge` doesn't set `warned_player`. The burn mapping's `targetKnot: cover_challenge` (`scenario.json.erb:2980-2989`) sets `npc.currentKnot` only in memory (`npc-manager.js:763-767`). After a reload, Val restarts at `start`. A player Bernie vouched for (`cover_restored`) who never had Val's first meeting then gets `first_encounter`, and from there `claim_consultant`: "Come back with [Gary's card] and I'll open the office", while already holding it. Fix: set `~ warned_player = true` in `cover_challenge` and `on_server_room_access`. In `start`, add `{cover_burned and cover_restored and not val_opened_office: -> open_after_vouch}` ahead of the `first_encounter` check.

**m5. Dead branch in Val's after-the-fact catch.** `on_server_room_access` opens with `{cleared_after_burn: …}` (`m02_npc_security_guard.ink:511-516`). Every clearance sets both `cleared_after_burn` and `val_opened_office`, and the mapping now needs `!val_opened_office`, so that branch never runs. Delete it, or reuse it for a vouched player who picked the door anyway ("Bernie's word's on the log. Still -- my door.").

**m6. No backstop for HaX's Bed 4 texts.** "Get to the ward. Now." and the boardroom pointers are once-only phone texts, and phone history is lost on reload (PASS3 phone rule). `general_advice` has no slow-path branch. Fix: add `{slow_path_window_open and not bed4_manually_stabilised and not patient_bed4_deceased: Bed 4 is alarming -- get to the ward.}` at the top of `general_advice`.

**m7. `general_advice` makes false or stale claims.**
- "Val and Bernie have both told you who stands there" (`m02_phone_agent0x99.ink:769`) is untrue unless the player asked both. Use "Val's notebook and Bernie's desk both know who stands there", or condition it.
- A player who is vouched (`cover_restored`) but not yet past Val misses the "Get past Val" branch (`:764`) and falls through to older advice. Gate that branch on `cover_burned and not reached_security_office`, with a vouched variant ("Bernie's word is on the log. Ask Val to open up.").

**m8. "That'll hold" doesn't send a vouched player back to Val.** `scenario.json.erb:918-922` fires on Bernie's vouch as well as on Val's clearance. After the vouch, the door is still locked, and the text says "Go and find out why" without mentioning Val. Fix: split it on `val_opened_office`. The vouch variant should end "Val will have heard by now. Ask her to open up."

**m9. Ghost's deal from the device lacks a decision gate.** `m02_phone_ghost.ink:230` lacks `not ransom_decision_made`. If a player closes the second-ask call without choosing and then restores, they can still "accept" afterwards and hear "Keys transmitted. They're on your console now". Fix: add `and not ransom_decision_made` to the choice.

**m10. Two credit and debrief lines don't match the route.**
- COVER RE-ESTABLISHED: "Access regained without incident" (`scenario.json.erb:187`) prints alongside "Neutralised on shift" if Bernie vouched and the player then KO'd Val. Add `&& !globalVars.guard_knocked_out`, or reword it to "Bernie's word restored your standing".
- "You also owe Ghost a promise" (`m02_closing_debrief.ink:813`) is wrong when the player kept quiet. Condition it on `exposed_hospital` ("…and you kept it") with a broken-promise variant.

**m11. Stale comment.** The Reeves erb comment says "HaX's room_entered loop" (`scenario.json.erb:2718`). The loop is on `closing_debrief_trigger`.

**m12. Playtest script.** Engine fix A is in the tree, so step 9 should expect the catch, and steps 7, 8 and 15 can now be run while holding Bernie's key. Also add a step for M2's task tick, and for a vouched player reloading before they talk to Val (m4).

## 4. Story editor's view

**Is m02 better than it was?** Yes, clearly. The pass-3 build had a midpoint that was only text messages: the burn could be undone before it happened, and nobody in the building ever watched you. Now the burn has a face. Val stops you at the door you need, and the ways past her each cost something different: a lanyard you had to find, Bernie's name on the line, Val's trust, a timed pick with a real chance of being caught, or a concussion you'll hear about in the debrief. The ending is honest too. The death toll agrees across console, debrief and credits, Bed 4 now has a pointer, and the debrief and credits track what happened to the cover, the nurses and the patients. As the reference mission it now teaches the "credential is the cover" pattern properly.

**Did the Reeves change lose a good beat?** Less than it seems. The old fight was broken. It set `insider_asset_escaped` before a punch was thrown, credited "Escaped in the scuffle" with Reeves on the floor, and raced the debrief. A walk-out is the right shape for the character, too: an ideological convert who came prepared to be caught has no reason to brawl. What was lost is the player's voice. The scene has no choices, so the climax of an unnamed run is three paragraphs of the villain talking and then the debrief. Suggestion: give the player one reply before he goes ("You won't get far." / "[Go for the door.]" / "[Say nothing.]"), each followed by the same walk-out line, so the player at least gets to answer him. Keep `mission_complete` where it is.

**Is the player-deduces flow satisfying?** The chain itself is good: Ghost's log gives a number, the boardroom duty sheet ties the number to a post, and Val's notebook, the rota and Bernie's extensions put a man on that post. That is the right size of deduction for m02. It doesn't feel earned yet, because the game will accept the answer without the reasoning (M1). It also doesn't say clearly when the deduction is finished (M2). With M1 and M2 fixed, naming Reeves to his face, with his badge number, will be the best moment in the mission.

**Ghost's deal** now arrives at the right moment and has a mechanical shape. The video call cutting off the console ("Before you touch that console -- look up.") is a strong scene. It needs M3 before it is a real choice for most players.

## Ideas for the backlog

- Engine: a `nonCombatant` NPC flag remains the proper fix for the patients (already logged).
- Validator: flag a `lockpick_used_in_view` person-chat on an NPC whose catch can open a chat while the NPC is hostile (m1 pattern: `attacked_guard` set only by ink).
- Engine: persist `npc.currentKnot` changes from event mappings, or document that `targetKnot` without `conversationMode` is lost on reload (m4).
