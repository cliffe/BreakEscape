# m03 Ghost in the Machine: design re-review, round 1 (pass 4)

Reviewer: fresh adversarial reviewer, 2 October 2026. Read-only apart from this file. Scope: the pass-4 design changes listed in `DESIGN_REVIEW.md` §7, checked against `git diff HEAD -- scenarios/m03_ghost_in_the_machine/` and the untracked `ink/m03_night_transition.ink` and `PASS4_PLAYTEST.md`. Static checks only; no browser run.

## 1. Checks run

- `ruby scripts/validate_scenario.rb …/scenario.json.erb`: schema passes, ink valid, layout and doors OK. Warnings are the same set as `DESIGN_REVIEW.md` §1 (HaX's shared `room_entered` / `npc_ko` pairs, now at indices 0/34, 1/33, 23-26, 28/32; Netherton and Nightshade "no behaviour"). Graph 36/43, integrated 42/55, critical path unchanged. The validator regenerates `dungeon_graph.*` as a side effect; that is the only write it made.
- `python3 scripts/check_door_alignment.py`: all five doors OK.
- `reopencheck.mjs … m03_ghost_in_the_machine`: 0 problems (the `night_transition` NPC and new globals are in `missions.json:220, 378, 396, 479-481`).
- `loopcheck.js` on all eight compiled inks: no runtime errors.
- Recompiled every `.ink` to the scratchpad with `bin/inklecate` and compared with the committed `.json`: all eight identical, so the compiled files are in step.
- `tagdiff.mjs`: 158 structural differences. Every one maps to a §7 item (new VARs and conditions in Victoria/debrief, `directive_*` knots, removed `on_rfid_clone_success` and `on_restricted_area`, new `set_global` tags, sticky hint choices). Nothing unexplained. Neither removed knot is referenced anywhere (grep of the erb, inks and `missions.json`).
- `dialoguelint.mjs`: no new AI-tell warnings from this pass (the `banned-word` hits are "Foster"; the `not-x-but-y` hits are pre-existing and mostly allowed villain/player rhetoric). Two line-length errors got worse because of design edits: see finding 8. The rest are for the dialogue stage.

## 2. The night_transition cutscene

**The validator's onceOnly warning is not about this NPC.** It names `rooms/executive_wing_hallway/npcs[0]/eventMappings[0]`, the guard's deliberately repeatable `lockpick_used_in_view` catch (erb:1238-1245, `onceOnly: false`, `cooldown: 3000`). That is the known false positive in `DESIGN_REVIEW.md` §1 item 5. The `night_transition` mapping has `"onceOnly": true` (erb:964).

**Re-entry and reload after the scene: guarded three ways.**
1. `onceOnly` dedups in-session (`npc-manager.js:574-576`).
2. A onceOnly handler that opens a conversation is persisted to the server when that conversation closes (`npc-manager.js:636-649, 1144-1151`) and restored on load (`:1170-1183`).
3. `clone_call_done` is in the condition (erb:963), declared (erb:1462) and flushed on page hide (`state-sync.js:20-21`).
Re-entering the hallway later, or reloading after the scene has closed, cannot replay it.

**Reload *during* the scene: not safe.** The mapping's `setGlobal` runs at event time, before the 500 ms delay and before the scene opens (`npc-manager.js:651-664`, then `:887-905`). The engine deliberately waits for the close before persisting the trigger so a mid-scene reload can replay it (`:636-640`), but the global defeats that: after such a reload `clone_call_done` is true, the scene never plays and `conversation_closed:night_transition` never fires, so HaX's server-room text (erb:686-690) is lost too. Not a soft-lock (the aim text at erb:184 says where to go, and HaX's hub works), but the turn silently disappears. Finding 1.

**Opening a person-chat on room entry.** Safe enough. The handler ends any running minigame before starting the person-chat (`npc-manager.js:873-877`; `minigame-manager.js:24-27` does the same again). Walking through a door normally means nothing is open. The other `room_entered:main_hallway` handlers only set globals or complete tasks (erb:867-873 backstop, erb:915-919 guard grace), so nothing competes for the screen. The one auto-opened phone call that can come just before is `on_victoria_ko_card` (erb:828-835), which fires in the conference room and gives the relayed card on its first line, so a forced close loses nothing. The only gap is the engine-wide 500 ms window between the close and the open, which every cutscene in the game shares. The browser check is still owed: `PASS4_PLAYTEST.md` is a script, not results.

**Routes.** Plain clone, receptionist KO (fire-stairs line) and Victoria day-KO (the KO completes `clone_rfid_card` at erb:822-826, which flips `mission_phase` at erb:680-684, so the scene still fires) all reach the scene, each with its own first line (`m03_night_transition.ink:12-20`). The double-KO case uses the Victoria line, which has the player walk out past an unconscious receptionist; acceptable. The narrated position (back inside, in the main hallway) matches where the player stands when it closes.

## 3. Fix-by-fix verification

| # | Claimed | Verified | Evidence / notes |
|---|---|---|---|
| 1 | Turn as a scene; "sit tight" call removed | Done, one gap | erb:944-971, ink `m03_night_transition.ink`; old mapping replaced by the HaX text at erb:686-690; aim text erb:184. Mid-scene reload gap: finding 1. |
| 2 | Receptionist KO coherent | Done, one rough edge | Badge text gated (erb:669-674), condition holds because `globalVarOnKO` is written before `taskOnKO` (`npc-hostile.js:158-183`); HaX KO text erb:675-679; Victoria day (`m03_npc_victoria.ink:74-81`) and night (`:445-446`); debrief `:76-78`; credit erb:139. Walk-back mismatch: finding 3. |
| 3 | Victoria at night before the flags | Done | `night_on_call` (`m03_npc_victoria.ink:553-558`) keyed on `clone_call_done` (`:64-66`), after the KO/fate/ready checks; idle options partitioned on `clone_call_done` (`:579-584`), every state still has an exit. All-flags text no longer claims the card reader (erb:806). |
| 4 | Directive canon in every ending | Done | `phase_2_discussion` → shared `directive_substance` (`m03_closing_debrief.ink:203-236`); recruit option, credits line and "whole paper trail" still need the drive. m04's "We told you it was coming" now holds. Timing wording clash: finding 5. |
| 5 | Buyer's word vs seller's ledger | Done | briefing `:84`, revelation call `m03_phone_agent0x99.ink:260`, debrief `:87`. Consistent with m02's debrief. |
| 6 | Guard's cover choices count | Done, one false line | `#set_global:guard_told_safetynet` (`m03_npc_guard.ink:226`), `guard_bribed` (`:213`); both are night-only routes (`start` diverts to `daytime` before any reveal, `:33-35`), so Victoria's afternoon interview can't be contradicted. Victoria `:455-460`; debrief `:70-75`. Day-KO case: finding 2. |
| 7 | Security recap | Done | `what_made_it_possible` (`m03_closing_debrief.ink:305-318`), reached from all five Danny branches. Each line's gate matches what the player did: `draft_seen`/`roster_seen` live only inside the password-locked PC (erb:1283-1316). distcc line: finding 4. |
| 8 | Ungated decode check | Done | `m03_phone_agent0x99.ink:306-346`. Choices in a text-free knot; wrong answers loop back to it; hub re-entry at `:70`. The right answer matches the plaintext (erb:47). Guessability: finding 6. |
| 9 | Danny's opener | Done | `m03_danny_choice.ink:25-30`; `danny_evidence_seen` set by the folder `onRead` (erb:1377). |
| 10 | "Murder with an invoice" | Done | `#set_global:called_it_murder` on the briefing choice (`m03_opening_briefing.ink:110`); debrief `:88-90`. |
| 11 | Briefing framing | Done | `m03_opening_briefing.ink:24, 32, 294`. |
| 12 | Graph metadata | Done | VM launcher `puzzle_graph_role: vm` (erb:1134); keycards AND-gated with the cloner (erb:554-557, 1052-1055); plaque, whiteboard, draft clues. Graph regenerates to 36/43. |
| 13 | Network text | Done (text only) | whiteboard erb:1009, runbook erb:1087, task erb:192, briefing `:187`, Victoria `:286`, HaX hint `:209`. The `recon_guide` text still says "nmap the subnet" (`m03_phone_agent0x99.ink:110`), which is fine without an address. |
| 14 | Daytime lockpick line | Done | `m03_npc_guard.ink:410-416, 465-469`. |
| 15 | Perfect Stealth wording | Done | erb:310, 317-318. Matches the credit condition (erb:140). |
| 16 | Re-readable hints | Done | `m03_phone_agent0x99.ink:154-169`, `:56`; briefing `:175`. |
| 17 | First HaX text | Done | erb:634-643; `waitForEvent` is supported (`npc-manager.js:257`). A reload mid-briefing loses it, as in m01. |
| 18 | Tidy-ups | Partly | `proftpd_guide_requested` set (`:117`) and declared (erb:1478); `on_restricted_area` gone. Stale `lab_sheet/` drafts left for the user. |
| 19 | Operation name | Done | briefing `:26`. Line length: finding 8. |
| 20 | CyBOK keywords | Done | `mission.json`. Free text (`cybok_sync_service.rb:27-36`), so no index to break. |
| 21 | Later threads | (a) done, (b) with the user | debrief `:142`. |
| 22 | Per-flag texts | Done | erb:743-764. The price-list line's "ROT13" matches the SecGen encoder (`SecGen/…/m03_ghost_in_the_machine.xml`, rot13 encoder on flag 3). |

Other things checked and found sound: the clone rule is untouched (completion still on the `card_cloned` mappings at erb:528-532 and erb:661-667, not the ink tag); the guard's grace mappings are unchanged (erb:910-922, `cooldown: 0`); every new global is declared (erb:1474-1482) and every ink that reads one has a matching `VAR`; the phone resting knots follow the re-navigation rule (the only new choice knot, `directive_answer_choices`, prints no text).

## 4. Findings

No blockers. No majors. Nine minors, all mission-local.

1. **minor — A reload during the night scene loses the scene and HaX's next text.** Cause: `setGlobal: { clone_call_done: true }` on the mapping (erb:965) runs at event time (`npc-manager.js:651-664`), so the persist-on-close design (`:636-640`) can't replay it. **Fix:** remove `setGlobal` from that mapping and set the global at the end of the scene instead: put `#set_global:clone_call_done:true` on the last narrator line of `m03_night_transition.ink` (`:22`, "The main hallway is on its night lights…"). The onceOnly persistence (on close) and the global then both cover re-entry. Add a mid-scene reload to `PASS4_PLAYTEST.md` step 4. Victoria's `night_on_call` still works, since the global is set before the player can reach her.

2. **minor — The debrief's guard line is false after a Victoria KO.** "He rang her. That's one reason she had her coat on when you walked in." (`m03_closing_debrief.ink:71`) plays whenever `guard_told_safetynet`, including when she was knocked out in the afternoon or during her night phone call and never confronted. **Fix:** `{ victoria_fate != "ko": That's one reason she had her coat on when you walked in. }` as a second line, keeping "You told Sterling's own guard who you work for. He rang her." for everyone.

3. **minor — The receptionist-KO walk-back answers the wrong suspicion.** The KO branch sets `suspicion_warned` (`m03_npc_victoria.ink:77-78`), which offers "[Play the eager recruit again]" straight away (`:167`). Its text is "I came in swinging earlier. Freelance habit…" (`eager_recruit`, `:297-303`), which answers a pointed question the player never asked, and it refunds the whole +10. **Fix:** in `eager_recruit`, branch first on `receptionist_ko` with a line that fits ("You: The desk was empty when I came through. I signed myself in." / Victoria: "*coolly* How thoughtful."), and keep the existing line in the `else`. Two spoken lines.

4. **minor — The distcc recap line contradicts the room.** "Nobody turned it off because nobody remembered it was on." (`m03_closing_debrief.ink:314`), but the server-room whiteboard underlines the legacy build three times and warns students off it (erb:1009), and the runbook calls it "not a toy" (erb:1087). They knew. **Fix:** "Their records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful to them."

5. **minor — Two decode times for the same drive.** Found but not decoded: "our people took the two layers off overnight" (`:210`). Not found: "our people had it read in ten minutes" (`:213`). **Fix:** use "in ten minutes" in both. It also makes the encoding lesson (no key, just look) for free.

6. **minor — The decode check can be passed by elimination, and the debrief then credits the player.** Option 3 (hospital records, Ransomware Incorporated) is plainly m02's story, and option 1 echoes the client roster's "grid storage and Critical Mass". With free retries the right answer is at worst a third pick, after which the debrief says "took both layers off it yourself" (`:208`). **Fix:** make the distractors share the surface of the right answer so only the decoded text separates them, e.g. "Substations first, then hospital *records* once the grid drops. Spring." and "Grid storage first, then water treatment while hospitals run on generator. Before Christmas." The one-word differences (generator / winter) are only in the plaintext (erb:47). Optionally soften the debrief to "and you read what was under both layers" so it claims less.

7. **minor (story) — The receptionist at 11 p.m. greets the afternoon visitor like a regular.** "Oh! You made me jump. I only came back for my phone charger. … Night!" (`m03_npc_receptionist.ink:250-251`). The scene before it has just told the player the building is empty and they came back in through the staff entrance. A receptionist who finds the afternoon's job candidate in the lobby at eleven would at least wonder. **Fix:** one line of doubt the player can talk past, e.g. "Oh! You made me jump. I only came back for my charger. …Is Ms. Sterling expecting you this late?" with the existing "[You too.]" choice reworded to "[She is. Goodnight.]". Keeps her harmless; makes the night feel like a break-in.

8. **minor (dialogue stage) — Two lines got longer through design edits.** Netherton's opener is now 49 words (`m03_opening_briefing.ink:26`, lint cap 30) after "This is Operation Cyber Arsenal." was prepended; HaX's all-flags text is 47 words (erb:806, cap 30). **Fix:** in the dialogue stage, split Netherton's line after "This is Operation Cyber Arsenal." into its own beat, and split the all-flags text into two `sendTimedMessage` mappings or drop "If you want a say in what happens to Danny Foster" to the existing hint.

9. **minor (nit) — Small wording.** `m03_night_transition.ink:18` "walk into the afternoon" → "walk out into the afternoon". HaX's post-scene text says "Emulate Sterling's card at the reader" (erb:689), but after a day KO the player carries Nightshade's physical copy (erb:578-583); "Use Sterling's card at the reader" fits both routes.

Not a finding: `PASS4_PLAYTEST.md` is a test script, not results. None of the person-chat-after-room-entry behaviour has been seen in a browser yet.

## 5. Story editor's view

**Does the day-to-night beat land?** Mostly. Three lines do the job: a clean exit, a time stamp ("Eleven o'clock that night, you're back"), and one sound ("a guard's footsteps go round, and round again") that tells the player what the night is about before they meet him. That last line is the best in the scene. The variants are earned: the fire-stairs exit after a KO is a small, guilty detail. Two things hold it back. Nothing in the world changes afterwards (same lighting, the receptionist still at her desk), so the scene does all the work alone; finding 7 is the cheap part of that, and backlog B2 (night tint) the real fix. The background is the generic circuit-board card (`background1.png`); a night exterior would sell it better, but there isn't one and it isn't worth new art for three lines. Victoria's night phone call ("No. Not tonight. I said I'd deal with it myself.") is a good addition: it lets the player find her early without spending the confrontation, and if the guard has rung her it reads as foreshadowing.

**Does the debrief recap teach without lecturing?** Yes. "For the report, here's what let you in" frames it as HaX doing her job rather than a lesson, each point is one sentence from the defender's side, and only the ones the player actually used appear. "A card anyone can read from a step away is a key you've handed out" and "none of it needs a key. It only needs someone to look" are the kind of line a player remembers. The distcc line is the weak one (finding 4). Coming after Danny and before the final assessment, four more lines in an already long debrief is about the limit; don't add a choice to it.

**Does the drive check teach?** Partly. Asking "what does it say?" turns the second decoding pass into something the player does, and a wrong answer costs nothing, which fits "fun and educational, not hard". But as written it tests reading comprehension of three sentences more than decoding (finding 6). With closer distractors it does what the review wanted.

**The guard and the receptionist now cost something.** Victoria's "my night guard rang me earlier, terribly excited" and "She can't remember your face. I can." are both good, in her voice, and the debrief closes each with one line. The £500 line ("Finance will want a receipt") is the right weight.

## 6. Verdict

**Clean** (no blockers or majors; fold in the nine minors, most usefully 1-4, before the browser playtest, and add a mid-scene reload to that playtest).
