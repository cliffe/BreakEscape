# m10 Full Disclosure: NPC dialogue review, round 1

Phase 4 (dialogue), round 1. Reviewer: Opus, read-only on game files. Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run in full over all 31 inks in `ink/`, `texts/BARKS_AND_TEXTS.md`, `credits_sections.json` and the readable text, objectives, credits and closing card in `scenario.json.erb`. Context: CONTRACT.md §11 (stage 8 through alignment round 12) and the "Deferred to phase 4" sections of ALIGNMENT_REVIEW_F_R7 to R12.

No audio exists yet, so every voiced change below costs nothing now. The voiced column still matters: it is the list of clips the TTS stage will make.

**Verdict: revise.** 0 blockers, 2 major, 17 minor, 13 nits. 14 lint and validator items withdrawn (reasons in §2).

The ending lands. Each of the six endings closes on a line that pays off something set up earlier: "A courtroom, then. I did cost it." answers "I've costed both"; Tesseract's "I wrote that chapter, Magnus." / "I know. I kept it to one page." answers the briefing's one-page chapter; surrender's "He asked who taught you. I said I did." pays off HaX's van visit; HaX's "It's afterwards." answers his "Let it hurt afterwards, not during."; executed and Join end in silence and a message nobody answers. Netherton's season line and his memo line, the walkabout and ELSEWHERE carry the season's choices back to the player. The two majors are both about the core scene replaying itself after an Esc. Most minors are the deferred after-four lines.

---

## 1. Step 1: compile, validator, lint, tag diff

| Check | Result |
|---|---|
| Compile (inklecate on copies in scratch, so the repo JSON was not rewritten) | 31 files, 0 failed, no loose-end warnings. The compiled JSON matches every committed `.json`, so nothing is stale |
| `validate_scenario.rb` | passes. Dialogue-facing items: 3 bark/chat repeats (HaX), 1 stacked-text warning, both handled in §2. No unresolved speakers, no ink hazards, no `#give_item` mismatches. It rewrote `dungeon_graph.*` with identical content (git shows no change) |
| `dialoguelint.mjs` | 14 findings: blank-reentry 5, stage-cue-in-info 5, not-x-but-y 2, us-spelling 1, crowded-hub 1. The same backlog alignment R7 to R12 carried forward. Line caps hold: face-to-face max 29 words (cap 30), phone max 25 (cap 25), texts max 24 |
| `tagdiff.mjs` (against HEAD) | structure unchanged in all 32 files. The working tree's m10 ink matches HEAD. A snapshot for the fixer's `tagdiff --old` is in my scratch folder (`m10_dialog_r1/ink/`) |
| `voicelines.mjs` | 780 distinct runtime lines sampled (Tesseract capped at 159). Grep: no printed variable in any spoken line |
| `loopcheck.js` at `start`, every file | 31 of 31 clean (no runtime error, starvation or runaway) |
| Reopen simulation (inkjs, `scratchpad/m10_dialog_r1/scripts/reopen.cjs`: play, Esc at a choice, re-enter the knot that owns the choices with the call stack reset, as the engine does) | Reproduces the deferred Tesseract pitch, Wendell and Imran repeats. Also finds the database scene replaying from "Netherton's on the line." (M2) |
| Standing rules | `&&` appears nowhere in ink. No banned words in any ink, the texts file or the credits. "Cyber Security" is spaced (Gary's one use). No em dashes in spoken lines |

---

## 2. Withdrawn lint and validator items

| Item | Why withdrawn |
|---|---|
| blank-reentry ×5 (`citadel:41`, `hearing:66`, `six_oclock:529`, `kowalczyk_core:23`, `tesseract:165`) | The m02/m03 quiet pattern. The quiet flag is spent in the same `Continue()` that closes the chat, so a later talk finds it false and re-routes (`parked` → `core_router`) or exits (the closing scenes' stray reopen). Nobody ever sees a blank re-entry |
| stage-cue-in-info ×5 (`kowalczyk:251`, `nightshade:116, 196, 294`, `six_oclock:185`) | False positives. The "number" is the designation in the speaker prefix (`Agent 0x47`, `Agent 0x5E`). None of the five lines carries a figure or code. See nit n10 for the lint fix |
| not-x-but-y `tesseract:421` "Not the money. The lesson." | A direct quote of Ghost from m02 (`m02_phone_ghost.ink:573`). The scene is about the quote. Its partner at `:791` stays as minor m12 |
| us-spelling `elena_phone:41` "gray … labeled" | Elena Rodriguez is Californian (her voice block). CONTRACT §5.2 says spelling follows the speaker, the same as Voltage's "Grey panel" |
| crowded-hub `phone_agent0x99:75` (25 possible) | Most topics belong to one stage (briefing topics retire at the breach, recalls at the gallery, console topics come after flag 4). Stage 8 counted 10 on the busiest seeded save, which is the cap |
| Validator bark repeats ×2: "Ten past two…" and "The log says Malhotra's badge…" | The bark's mapping sets `door_log_given`, which hides "[The door log.]". The chat can only open on those words when HaX was jammed and the bark was skipped, and then nothing repeats. The third repeat ("Whoever's in the power room…") is real: minor m16 |
| Validator: two texts at 2000 ms on `room_entered:blast_tunnel` | T-19a and T-19b are exclusive (`m08_nightshade_triple_agent` vs `m08_nightshade_arrested`, in `mutuallyExclusiveGlobals` since alignment R1) |

---

## 3. The deferred phase-4 items: where each lands

| Deferred item (ALIGNMENT_REVIEW_F_R7–R12) | Finding |
|---|---|
| Tesseract's pitch replayed from "All four. Good." on a reopen at `case`, with Ghost's lesson and HaX's reply on m02 saves | **M1** |
| Victoria's "the order goes away" lines after four (escaped `:113`, threat `:165`) | **m1**, **m2** |
| Escaped Victoria's "[Go.]" naming Fonoti's card for an open lock (`:122`) | **m1** |
| Vos's "waiting for a delivery" after four on a traced or released share (`vos.ink:103`) | **m3**; the matching credit rows are **m4** |
| Fonoti still offering his card after the lock | **m5** |
| One-line first meetings after the lock (recruited Victoria, Vos) | **m6** (Victoria), **m3** (Vos) |
| Wendell's "*pause* Well. Which switch do you want." on an Esc | **m7** |
| Imran's repeated opener after Gary is knocked out | **m8** |
| Static's "Talk to him. From there." after a Restart that followed a fight | **m9** |
| R12: Gary's 06:00 "Nobody's problem all night." has a weaker echo | **n5**: keep it |
| R12: the door now opens a line before Victoria's "Open." / Vos's "The door is open." | **n1** |
| The dialoguelint backlog (blank re-entry 5, cue on an information line 5, crowded hub 1, not-X-but-Y 2, US spelling 1) | §2 withdraws 13 with reasons. The 14th (`tesseract:791`) is **m12** |
| (new, the same Esc class) the database scene replays from the top, up to 13 voiced lines | **M2** |

---

## 4. Findings

Voiced: **V** = a voiced line changes or is added; **T** = text, a choice or a credit (unvoiced); **–** = no line changes.

### Major

**M1. The case replays the whole pitch after an Esc.** `m10_tesseract.ink:209–252`, `:415–426`. **V.**
`tess_case_step` only becomes 1 at `:246`, after the third inline menu. An Esc at any menu before that, including `case_lesson`'s, reopens at the owning knot, which re-routes to `core_router` → `case` → "All four. Good. Now it's my turn." The simulation replays seven Tesseract lines, then "Ghost put it best, at St. Catherine's…" and HaX's answer again. This is the finale's central scene, and the repeat makes it play like a broken recording.
Current (on a reopen at `case_lesson`): `Dr Adrian Tesseract: All four. Good. Now it's my turn.` … and the rest of the pitch.
Proposed:
- Add file-locals `tess_pitch_said` and `tess_lesson_said`.
- Set `~ tess_pitch_said = true` after "Every year your service keeps its map … I did." (`:230`).
- At the top of `case_lesson`, after its guard, set `~ tess_lesson_said = true`, and call it only `{ m02_completed and not tess_lesson_said }`.
- Move the "[You've had all night…]" menu and everything after it to `:246` into a new knot `case_why`, with the usual `tess_menu` guard.
- Give `case` a third resume arm: `- tess_pitch_said:` → `Dr Adrian Tesseract: Where was I. Why you.` → `-> case_why`.
- An Esc at the first two menus still replays one to four lines. That is acceptable as a reminder.
New voiced line: "Where was I. Why you." It echoes "Where was I. Your record.", the step-1 resume line.

**M2. The database scene replays from "Netherton's on the line." after an Esc, including at the final decision.** `m10_tesseract.ink:1026–1086`. **V.**
`database_menu`'s guard re-routes a reopen through `core_router`, and `database_outcome == ""` sends it back to `database`. Even an Esc at the four-way "Secure / Disclose / Wipe / HaX?" menu replays everything, which the simulation confirms: HaX's lead-in, "Magnus." / "Adrian.", Netherton's four lines, the two operations, HaX's disclosure line, the m09 letter line and the purge warning. That is 10 to 13 voiced lines at the decision a player is most likely to step away and think about.
Proposed:
- Add file-locals `tess_db_greeted`, set after Netherton's "Agent. His copy, and ours…" (`:1033`), and `tess_db_costs_said`, set after "Then nobody has it… We both answer for it." (`:1059`).
- Open `database` with `{ tess_db_costs_said: Agent HaX: Netherton's still on the line. Your call. ~ tess_menu = true -> database_menu }`.
- When only `tess_db_greeted` is set, skip the HaX lead-in and the "Magnus." / "Adrian." pair, and resume at "Half of these cannot be patched…".
New voiced line: HaX "Netherton's still on the line. Your call."

### Minor

**m1. Escaped Victoria after four still sells the order and the code card.** `m10_victoria.ink:109–115`, `:122`. **V.**
Current: `I walk out. Zero Day's order goes away, and I tell you which of these two has the code card.` / `Or cuff me to that rail, and find the card yourself.` On "[Go.]": `The big one at the lock end. Fonoti. He carries the code card.`
Proposed: a first arm on `outer_lock_open`: `Victoria Sterling: You've opened that lock without me. All I can sell you now is my absence.` / `Victoria Sterling: Or cuff me to that rail. Your choice.` This holds whether the share went, was traced or was stopped. The other two arms stay. In `escaped_menu`'s "[Go.]", gate the Fonoti line `{ not outer_lock_open: … }`. The `lock_guard_known` write is harmless and can stay. Two new voiced lines.

**m2. Threat Victoria's talk-down promises to take an order that has already gone, or was already stopped.** `m10_victoria.ink:165`. **V.**
Current: `Then I'll owe you one, which I hate. Zero Day's order goes with me. Don't watch me leave.`
Proposed: on `outer_lock_open or share_zero_day == "stopped"`: `Then I'll owe you one, which I hate. Don't watch me leave.` Otherwise, as now. One new voiced variant.

**m3. Vos after four: "waiting for a delivery" that has already come, and a one-line first meeting.** `m10_vos.ink:19–25`, `:100–104`. **V.**
Current resting line (share traced or released): `I am waiting for a delivery. You are in the way of it.`
Proposed:
- In `vos_rest`, add an arm after the cancelled arm and before `else`: `- outer_lock_open: Pieter Vos: My delivery came at four. Now I am waiting for a flight. You are in the way of that too.` After the lock, any Zero Day share that wasn't stopped or killed has gone, so "came" is true.
- In `gallery`'s `outer_lock_open` arm, a first meeting with no m03 knock-out also plays his existing `I don't do philosophy. I do delivery dates.` before the rest line, so he gets two lines instead of one.
One new voiced line.

**m4. Vos's IN THIS OPERATION credit says he was still waiting for a delivery that came.** `scenario.json.erb:717–720`. **T.**
Current: `Named. Arrested on the walkway, waiting for a delivery.` (Join: `Named. Still waiting for his delivery.`) This prints on any share that wasn't stopped, including a traced or released one.
Proposed: split by whether the share reached him. On `share_zero_day !== 'stopped' && head_start_killed !== 'zero_day'`: `Named. Arrested on the walkway after his delivery came.` (Join: `Named. His delivery came at four.`). A share killed at the console gets the existing "cancelled" rows, as two extra rows, because the conditions can't use `||`.

**m5. Fonoti hands over his card after the lock is open.** `m10_fonoti.ink:129–162`. **V.**
Current: after the lock, his opener is `Evening. Nobody comes up the stair this late…`, and all four card options still show.
Proposed: in `talk`'s line block, a first arm `outer_lock_open:` → `Sione Fonoti: Door's open, so I guess my shift's done. Go on through.` Add `and not outer_lock_open` to each of the four card options, so only "[Never mind.]" remains. One new voiced line.

**m6. Recruited Victoria, ignored until after the lock, gets a single line.** `m10_victoria.ink:31–33`, `:207–208`. **V.**
Current: first meeting after four is `You found your own way in. I'll remember that.` and "[Goodbye, Victoria.]".
Proposed: in `recruited`'s `outer_lock_open` arm, a first meeting (`not vic_seen`, then set it) adds `Victoria Sterling: There you are. I could have opened that lock for you, or for them. Nobody asked me.` before `-> gallery_rest`. That gives the player one line about the offer they walked past, and her existing rest line answers it. One new voiced line.

**m7. Wendell repeats "*pause* Well. Which switch do you want." after an Esc.** `m10_wendell.ink:65–71`. **V** (no new line).
Proposed: add a file-local `wend_switch_said`. `wendell_switch` opens `{ wend_switch_said: -> wendell_switch_done }`, then sets it. The choice diverts to a new knot `wendell_switch_done`, which holds "There. Key's turned, breaker's down…" and goes on to `wendell_dale`. A reopen skips the question and lands on his answer. No line changes.

**m8. Imran repeats his opener after Gary is knocked out.** `m10_imran.ink:166`, `:287`. **V.**
Current, on the reopen: `They sacked the whole team and kept the board. You'd have taken this job too.`, the line he has just said in `follows_gary`.
Proposed: add a file-local `imran_board_said`, set in `follows_gary`'s `else` arm. In `workshop`'s `m02_completed` arm: `{ imran_board_said: Imran Siddiqui: Gary's down, so it's me you're asking. - else: (current) }`. One new voiced line.

**m9. Static, calm after a Restart that followed a fight, says "Talk to him. From there."** `m10_static.ink:124`. **V.**
Proposed: `{ voltage_outcome == "fought": ENTROPY Operative 'Static': You again. He's not finished with you. - else: (current) }`. This still sends the player to Voltage, who re-arms them both. One new voiced line.

**m10. His end replays "He stands, slowly…" and Netherton's long line after an Esc.** `m10_tesseract.ink:1136–1151`. **V.**
After an Esc at either end menu, `his_end` re-runs: the narrator beat, "Ask me, then." and Netherton's 26-word line (or "Arrest me, then.").
Proposed: add a file-local `tess_end_said`. On a reopen with it set: `Dr Adrian Tesseract: Well, Agent?` → the right menu. One new voiced line. The exchange openers (`exch_1`–`exch_3`) also replay two to four lines on an Esc. Leave them: each restates his claim, which helps a player coming back to the menu.

**m11. Netherton uses contractions on two weighted season lines.** `m10_six_oclock.ink:650`, `:652`. **V.**
Current: `…The pumps on his list were not among them. They still aren't. That was my signature too.` / `…They won't be now.`
Proposed: `They still are not. That was my signature too.` / `They will not be now.` That fits his full forms elsewhere and the third form at `:654`, "They will be now.". Two rewordings.

**m12. A second villain "Not X. Y." in the core scene.** `m10_tesseract.ink:791`. **V.**
Current: `Most of the operations I've watched, you put someone on the floor who wasn't armed. That isn't a lapse. It's a method.` On an m02 save it shares the scene with the Ghost quote. CONTRACT §5.6 allows one per scene.
Proposed: `Most of the operations I've watched, you put someone on the floor who wasn't armed. Often enough to call it a method.` One rewording.

**m13. Malhotra's defence uses WREN's number.** `m10_malhotra.ink:65`, `m10_phone_agent0x99.ink:380`. **V.**
Current: `Eleven years. Check the log again.` "Eleven years" is WREN's placement ("Placed eleven years ago"), Kowalczyk's 06:00 line and her credit. Heard right after a wrong accusation, it reads as a hint that the player was right after all.
Proposed: `I've run your comms since before the mole. Check the log again.` It ties to his re-vetting line. One string, used in both places.

**m14. On a cold start, HaX's "Ask me at six" has no prompt at six.** `m10_hax_post.ink:41–45`, `m10_six_oclock.ink:503`, `m10_hearing.ink:135`. **T.**
On a cold start HaX says "Ask me at six. I'll tell you then." At 06:00, "[You said you'd tell me the rest.]" needs `m09_completed`, so that player only gets "[(Stand with her.)]". She tells it anyway, but the player never gets to ask.
Proposed: promote `hpost_rest_asked` to a global `hax_rest_promised` (declare it in the include and in `globalVariables`), set it on both hax_post topics, and gate the 06:00 and hearing choices `{ m09_completed or hax_rest_promised }`. Use "or" in ink, as usual. No voiced change.

**m15. "[Where are we?]" in the power room says "Get to the power room."** `m10_phone_agent0x99.ink:130–133`. **T.**
Proposed: a rung after `gallery_shutter_cut`: `- power_room_entered: The shutter. Whoever runs that room, or you by hand.`

**m16. The "[The power room?]" topic opens on the bark's exact words.** `m10_phone_agent0x99.ink:227–228` and T-12. **T.**
The validator flags it: the flag-1 text "Whoever's in the power room runs your lights." arrives, and then the topic opens on the same sentence.
Proposed topic text: `Your lights and the gallery's blast shutter both run off that room.` / `The shutter has to be dead before you reach him.`

**m17. The last objective calls Tesseract "He" straight after HaX.** `scenario.json.erb:1419`. **T.**
Current: `…HaX can't reach you up there. He is waiting at his console in the core.`
Proposed: `…HaX can't reach you up there. Tesseract is waiting at his console in the core.`

### Nits

| # | File:line | Current | Proposed | |
|---|---|---|---|---|
| n1 | `victoria.ink:58–60`, `vos.ink:60–62` | The door opens on line 1, a line before "Open." / "The door is open." (R12 note) | Victoria: "Then you know I'm hedging. So is everyone. Open." / "And the order's withdrawn. Remember that I didn't have to." Vos: "*pause* Who told you that. No. Don't. The door is open." / "The order goes with me, and so do I. I'm leaving." The tags stay on line 1 | V ×4 |
| n2 | `phone_agent0x99.ink:622` | "It's read your badge. Only he knows." ("he" could be Nightshade, whose key it is) | "It's read your badge. Your key kept it off their board. He knows; they don't." (15 words) | V |
| n3 | `tesseract.ink:1263, 1265`; `scenario.json.erb:4071` | "a card in his hand: 'Afterwards, then.'" (reads as though he is holding it) | "a card in his handwriting: 'Afterwards, then.'" | V ×2, T |
| n4 | `tesseract.ink:74` | "Kowalczyk is standing by the service door, empty-handed. He hasn't left his chair." | "…Tesseract hasn't left his chair." | V |
| n5 | `six_oclock.ink:262` | "Nobody's problem all night. Same as St. Catherine's." | Keep. R11 already weighed this: any "nobody listened" form is false for a player who heard him out | – |
| n6 | `elena_phone.ink:186` | "Done. That shutter won't close tonight. Go get him." | "Done. That shutter's dead. Go get him." (CONTRACT §5.6: a cut shutter is "dead" in every voice) | V |
| n7 | `hax_post.ink:26–27` | Unreachable `ending != ""` arm (the hub diverts first) | Delete | – |
| n8 | `scenario.json.erb:3529` | "…kill it, or follow it. Not both." | "…kill it, or follow it." (stage 8 dropped "Not both." from the ink) | T |
| n9 | `texts/BARKS_AND_TEXTS.md:122` | "Tesseract now says the other half in his case" | "…in his arrival" (moved by alignment A6) | doc |
| n10 | `scripts/ink_runtime_check/dialoguelint.mjs` | stage-cue-in-info counts the speaker prefix's `0x47` / `0x5E` | Strip the `Name:` prefix before the number test | tooling |
| n11 | voices, `scenario.json.erb` | Gary and Netherton are both `Charon`, a line apart at 06:00 | Leave it: both are inherited from m02 and the styles differ. Note it for the tts-audio stage to judge by ear | – |
| n12 | `scenario.json.erb:560` | "Brought him out alive, in front of a court." | "Brought him in alive, to face a court." | T |
| n13 | `scenario.json.erb:776`, `:824` | A funded arrest prints "David Torres: serving. His wife's treatment goes on." and "Elena Torres is in treatment. It's working." | Gate Elena's ELSEWHERE row `&& globalVars.m05_final_choice !== 'arrest'`. The Torres row already says it | T |

---

## 5. Step 2 checks with nothing to report

- **2a Attribution.** Every prefix resolves to a registered NPC, including the hidden forward-post speaker records stage 9 added. The narrator has its voice block. Only cue-style emotes are inline, and narration beats are spread thin.
- **2a-bis Supported by the scenario.** Movement claims match the reveals and hides: Victoria "down the gallery stair", Quintero at the lock, Kowalczyk's copies hiding on `kowalczyk_gone_ahead`. Every handover has its tag (`#give_item`, `#clone_keycard`). Geography matches the connections, and props exist (plotting board, breaching case, casualty sheet).
- **2a-ter Voices.** Every speaking NPC has a block with the accent named and "consistent … throughout". The cast is varied (Texas, Pacific Northwest, Montana, Utah, Glasgow, Ghanaian-British, South London, Birmingham, Teesside, Rotterdam, Johannesburg). The only shared voice is n11.
- **2b Choices.** No `You:` echoes. No third-person menu labels except deliberate non-verbal ones ("(Say nothing.)", "(Go to Quintero.)"). No choice quotes a line the route hasn't played: Kowalczyk's "never went through stores" card is m09's briefing line on an m09 save and m10's on a cold one.
- **2c, 2c-bis Structure.** Every hub has a sticky exit with a reply. loopcheck is clean on all 31 files.
- **2d Choices that matter.** The pacing "breath" buttons ("[Sir?]/[(Wait.)]", "[(Go to the van window.)]/[(Stay where you are.)]") are flat by design, CONTRACT §5.1's three-line rule. Mark them OK. Every stance button writes a global that a later scene reads: `quintero_stance` at the lock and at 06:00; `kowalczyk_answer` in her reply; `ghost_answer` in the phone beat; `hax_asked_database` at the hearing. Nothing on the critical path is withheld without a second source.
- **2e Cross-file state.** The only `#set_global`s are `six_done` and `closing_done`, both declared and both read by HaX's mappings.
- **2f Influence.** N/A. The finale runs on stance and outcome globals, as the contract specifies.
- **2h KO.** Every raid file's `end_rest`, the `*_ko` credit clauses, Netherton's "bruises ENTROPY did not give them" and HaX's "Kowalczyk's awake in the second van" admit the knock-outs. The Arakawa knock-out clause reaches SAFETYNET through `credits_for`'s merge.
- **2i Stale status.** `where_are_we` is right at every stage except the power room (m15). Netherton's hub and HaX in person are right through to after the ending.

---

## 6. Voiced-line list for this round's proposals

None of these clips exist yet.

| Speaker | New | Reworded | Findings |
|---|---|---|---|
| Tesseract | 2 ("Where was I. Why you."; "Well, Agent?") | 1 | M1, m10, m12 |
| HaX | 1 ("Netherton's still on the line. Your call.") | 1 | M2, n2 |
| Victoria | 3 | 1 + 2 | m1, m2, m6, n1 |
| Vos | 1 | 2 | m3, n1 |
| Fonoti, Imran, Static | 1 each | – | m5, m8, m9 |
| Netherton | – | 2 | m11 |
| Malhotra | – | 1 (one string, two places) | m13 |
| Narrator | – | 3 | n3, n4 |
| Elena | – | 1 | n6 |

---

## 7. Top five

1. **M2**: the database decision replays 10 to 13 voiced lines, "Magnus." / "Adrian." included, after an Esc, even at the final menu.
2. **M1**: the case replays the whole pitch, and Ghost's lesson, after an Esc before the records.
3. **m1 / m2 / m3**: after four, Victoria and Vos still trade an order or a delivery that has already gone, and Victoria still names Fonoti's card for an open lock. This is the deferred cluster, with fixed wordings that hold on every share state.
4. **m13**: Malhotra's "Eleven years." echoes WREN's placement at the moment a player has just accused the wrong person.
5. **m14**: a cold-start player is told "Ask me at six" and isn't given the question at six.
