# m10 "Full Disclosure": Ink Contract (stage 7a)

## 0. Status, authority and how to use this file

**Stage 7a, draft 2 (2026-10-21): updated to match the ink as shipped after script edit round 1 (`SCRIPT_EDIT_R1.md`); §8 lists every change. Stage 8 fixes (2026-10-21) are in §11, which wins over any earlier section it contradicts.** Every 7b ink writer for m10 follows this file. It fixes file names, NPC ids, knot names, entry points, the globals each file reads and writes, the tags it emits and the eventMappings it relies on, so three writers can work in parallel and stage 9 can wire the result without guessing. It does not write lines. The design documents do that, and they win on wording:

| Short name | File (under `planning_notes/overall_story_plan/mission_initializations/`) | Authority for |
|---|---|---|
| arc | `m10_full_disclosure/stages/stage_1/story_arc.md` | beats, order, the cold start |
| SE | `.../stage_2/storytelling_elements.md` | voices and sample lines (samples fix the voice and beat; the writer finishes them) |
| MC | `.../stage_3/moral_choices.md` | every choice, its options, gains, costs, who says the cost first, and the decision globals (§12) |
| OT | `.../stage_4/objectives_tasks.md` | tasks, door wiring, HaX's hub (§5), the clock (§6), the core's resume order (§4.6), the close's order (§4.7, §7), the voiced calls (§13), the wiring globals (§16) |
| RL | `.../stage_5/room_layout.md` | NPC ids, rooms, who is visible when, the raid team's roster (§2.9) |
| S6 | `.../stage_6/lore_fragments.md` | every readable string, code, item id, and the closing card and credits as data (§3) |
| FA | `finale/FINALE_ARC.md` | imports (§3.2), exports (§3.5), `ko_pattern()` (§3.6), the core and endings (§4), the forced-call and voiced-call rules (§6.1's paragraphs "One rule for every forced phone scene", "HaX's forced calls re-ring to a guarded knot" and "Voiced calls (F20)", which apply to both missions), the stage 7 handover (§13 rows B1–B5, 10-1 to 10-14) |

Where they disagree: S6 wins on any string, MC on any choice or global value, OT on wiring, RL on ids and staging. This file wins on file names, knot names, entry points and who owns what. If this file contradicts a design document on story, the design document is right and this file is wrong: tell the orchestrator.

**Writers read, before writing a line:** this file; the design sections their files cite (§1.3–1.5 name them per file); `README_ink_best_practices.md` (above all "Common ink bugs (pass 4)" and the hub pattern); `story_design/story_dev_prompts/07_ink_scripting.md` (the three-line pacing rule); `tools/pass2/PASS2_LESSONS.md` lessons 3, 13, 14, 21, 31, 35, 36, 41, 44, 48; `AGENTS.md` "Standing user rules"; and the user's style rules in `~/.claude/CLAUDE.md`. Models: `scenarios/m08_the_mole/ink/` (Netherton's audit, the confrontation, HaX's phone hub) and `scenarios/m07_architects_gambit/ink/m07_architect_comms.ink` (Tesseract's voice through the handset; m10 is the same man without the distortion).

**Nobody on stage 7 opens VM material**: not `finale/VM_SHAPE.md`, `finale/FINALE_VM_PLAN.md`, `docs/agents/SECGEN_MODULE_PLAN.md`, SecGen, or the field guides. Flags are named by story meaning (flag 1 the foothold on the security monitoring host; flag 2 the staging schedule; flag 3 out of the release service's container; flag 4 the core host). HaX's field-guide lines say which guide she is sending and nothing about its content. Per-flag VM steers, if any are wanted, come later from an `opus48` agent.

**The timed VM run is not a gate.** FA §13's stage 7 gate (a timed VM run first) was overridden by the user on 2026-10-21: use the estimates (about 7 to 8 minutes a flag). The cut order in OT §8 stands if playtests come in long.

**Housekeeping for writers.** Write each file with Edit, knot by knot, not one whole-file rewrite. Compile and lint before reporting (§6). Don't edit this file, the design documents, other missions, the engine or `.claude/skills/`. Don't commit, stash or reset. Scratch files only in the folder the orchestrator gives you. Report: files written, line counts, every new fixed string that lives outside ink (barks, texts, bark wordings settled here), anything this contract got wrong.

## 1. Ink files, writer groups and knots

### 1.1 The three groups at a glance

All ink lives in `scenarios/m10_full_disclosure/ink/`, one `.ink` per person or conversation, compiled to a `.json` beside it. Every file starts `INCLUDE m10_carryover_vars.ink` (§2.2) and declares no scenario global itself.

**One file per person; copies share it.** RL stages one NPC record per person per room (`quintero_so`, `quintero_ws`, …). Each copy's record points at its person's file (`storyPath`) and names its own entry knot in `currentKnot` (the person-chat opens at `npc.currentKnot || 'start'`; `person-chat-minigame.js:523`). Each copy keeps its own saved story, so a copy never inherits another copy's position; anything one copy must know about another goes through a synced global. Each file's `start` knot is a router that sends any copy with no `currentKnot` to the right room knot by the `<room>_entered` globals, so a missing `currentKnot` still lands somewhere sensible.

| Group | Voices it owns | Files (NPC ids) | Rough lines |
|---|---|---|---|
| **A** | Dr Adrian Tesseract; the core's narrator; the 06:00 scene, the hearing and the Citadel | `m10_carryover_vars.ink` (include); `m10_tesseract.ink` (`tesseract`); `m10_kowalczyk_core.ink` (`kowalczyk_core_waiting`, `kowalczyk_core`); `m10_six_oclock.ink` (`six_oclock`); `m10_hearing.ink` (`hearing`); `m10_citadel.ink` (`citadel`); `m10_recruiter_phone.ink` (`recruiter_phone`); plus the JSON fragment `scenarios/m10_full_disclosure/credits_sections.json` (§5.9) | include 420; Tesseract 1,050; Kowalczyk core 40; 06:00 600; hearing 90; Citadel 70; Recruiter 15; JSON 70. **About 2,350** (superseded: §11 alignment R3-m3/m4, R4-m7) |
| **B** | Agent HaX; Director Magnus Netherton; the raid team (Kowalczyk, Quintero, Arakawa, Malhotra, Vector, Phantom, the minders) | `m10_phone_agent0x99.ink` (`agent_0x99`); `m10_hax_post.ink` (`hax_post`); `m10_director_netherton.ink` (`director_netherton`); `m10_kowalczyk.ink` (`kowalczyk_post`, `kowalczyk_van`, `kowalczyk_so`, `kowalczyk_ws`, `kowalczyk_pr`, `kowalczyk_hall`); `m10_quintero.ink` (`quintero_post`, `quintero_so`, `quintero_ws`, `quintero_pr`, `quintero_hall`, `quintero_lock`, `quintero_core`); `m10_arakawa.ink` (`arakawa_post`, `arakawa_gate`, `arakawa_blast`, `arakawa_so`, `arakawa_ws`, `arakawa_pr`, `arakawa_hall`); `m10_malhotra.ink` (`malhotra_post`); `m10_vector.ink` (`vector_post`, `vector_so`); `m10_phantom.ink` (`phantom_post`); `m10_minders.ink` (`minder_post`, `minder_blast`, `minder_lock`) | HaX phone 1,050; HaX in person 60; Netherton 480; Kowalczyk 300; Quintero 200; Arakawa 200; Malhotra 70; Vector 80; Phantom 80; minders 30. **About 2,550** |
| **C** | Nightshade; Ghost; Gary; Imran; Voltage; Static; Wendell; Vance and Elena (phone); Asante; Mercer; Victoria (in person and on the line); Vos; Sione Fonoti; the bunker's guards | `m10_nightshade.ink` (`nightshade_table`, `nightshade_van`, `nightshade_blast`, `nightshade_lock`); `m10_ghost_phone.ink` (`ghost_phone`); `m10_imran.ink` (`imran`); `m10_gary.ink` (`gary_consultant`, `gary_tech`); `m10_voltage.ink` (`voltage_van`, `voltage_power_captured`, `voltage_power`); `m10_static.ink` (`static_power`); `m10_wendell.ink` (`wendell`, `wendell_far`); `m10_vance_phone.ink` (`vance_phone`); `m10_elena_phone.ink` (`elena_phone`); `m10_asante.ink` (`asante`); `m10_mercer.ink` (`mercer`); `m10_victoria_line.ink` (`victoria_line`); `m10_victoria.ink` (`victoria_gallery`, `victoria_threat`); `m10_vos.ink` (`vos`); `m10_fonoti.ink` (`lock_guard`); `m10_guards.ink` (`tunnel_guard`, `tunnel_guard_kettle`, `duty_guard`, `duty_guard_b`, `workshop_guard`, `hall_guard_a`, `hall_guard_b`, `monitor_guard`, `farah_guard`, `reinforcement_a`, `reinforcement_b`) | Nightshade 360; Ghost 260; Imran 200; Gary 180; Voltage 260; Static 25; Wendell 150; Vance 70; Elena 70; Asante 110; Mercer 30; Victoria's line 100; Victoria 210; Vos 120; Fonoti 110; guards 120. **About 2,375** |

Line estimates are ink source lines (logic, choices and dialogue together), for balancing only. The include is mechanical (declarations from §2), which is why group A carries the heaviest single conversation and still balances.

**Order of work.** Group A writes `m10_carryover_vars.ink` first, as §2.2 specifies it, and tells the orchestrator when it compiles (target: before anyone else's first compile). Groups B and C write knots meanwhile; nothing compiles until the include exists. Only group A edits the include. A writer who needs a global that isn't in §2 asks the orchestrator, who has group A add it and updates §2 here.

### 1.2 Speaker register

The prefix on a spoken line is the NPC's `displayName`, character for character (README_ink_best_practices "The prefix must match"). Returning characters keep their own mission's displayName. Stage 9 sets these; if it must change one, it changes the prefix in every file with it. Rows marked † are the stage 2 forms stage 9 still has to confirm.

| Speaker prefix | NPC ids that speak it | Voice owner | Notes |
|---|---|---|---|
| `Dr Adrian Tesseract:` | `tesseract` | A | Never "The Architect" in person (SE §2) |
| `Agent HaX:` | `agent_0x99` (phone), `hax_post` (in person); second speaker in `tesseract`, `director_netherton`, `six_oclock`, `hearing` | B | On her own phone ink, no prefix (`phone-self-prefix`); a prefix only for a second speaker on her line |
| `Director Magnus Netherton:` | `director_netherton`; second speaker on HaX's calls and in `tesseract`, `six_oclock`, `hearing`, `citadel` | B | as m08; full forms by default, contractions only in quick asides (R-2); may call the player "Agent", "Agent 0x00" or "0x00" (R-1) |
| `Agent 0x5E 'Lantern':` † | Halina Kowalczyk (WREN): every `kowalczyk_*` id | B | "Halina" and "WREN" are what others call her; her own prefix is her SAFETYNET designation |
| `Agent 0x2D 'Anchor':` † | Marisol Quintero: every `quintero_*` id | B | |
| `Officer Kenji Arakawa:` † | every `arakawa_*` id | B | |
| `Officer Dev Malhotra:` † | `malhotra_post`; second speaker on the net | B | |
| `Agent 0x23 'Vector':`, `Agent 0x88 'Phantom':` | `vector_*`, `phantom_post` | B | m08's displayNames |
| `Minder:` † | `minder_*` | B | one of SAFETYNET's van team, unnamed |
| `Agent 0x47 'Nightshade':` | every `nightshade_*` id; second speaker in HaX's `breach_call` and in `six_oclock` | C | as m08 |
| no prefix (phone contact) | `ghost_phone` | C | m02's displayName is "Ghost" |
| `Gary Whitlock:` | `gary_consultant`, `gary_tech` | C | m02 |
| `Imran Siddiqui:` | `imran` | C | |
| `Voltage (Critical Mass):` † | every `voltage_*` id | C | m04's displayName; SE's samples write `Voltage:`. Stage 9 picks one and the prefix follows |
| `ENTROPY Operative 'Static':` | `static_power` | C | m04 |
| `Wendell Briggs:` | `wendell`, `wendell_far` | C | |
| no prefix (phone contact) | `vance_phone` (Robert Vance), `elena_phone` (Elena Rodriguez), `victoria_line` (Victoria Sterling) | C | |
| `Dr Abena Asante:` | `asante` | C | |
| `Dr. James Mercer:` | `mercer` | C | m07's displayName keeps its full stop (he's American) |
| `Victoria Sterling:` | `victoria_gallery`, `victoria_threat` | C | m03 |
| `Pieter Vos:` | `vos` | C | |
| `Sione Fonoti:` | `lock_guard` | C | S6 §2.4 |
| `Guard:` † | the guards in `m10_guards.ink` | C | B. Haugen at the monitor post can be `Guard:` too; the name lives on paper |
| `Narrator:` | any file, sparingly | the file's group | never inside a voiced call (§4); the core's warnings are fixed in MC §6.6–6.7 |

The player speaks only through choice text: brackets carry the player's actual words, and no `You:` line echoes them. The credits and every written line call the player "0x00". **Nobody uses a personal name or a gendered word for the player** (R-1). SAFETYNET people (HaX, Netherton and the raid team) and Tesseract may say "Agent", "Agent 0x00" or "0x00" aloud; nobody else names the player at all (so Mercer's SE line drops its "agent").

**Lines in another group's voice.** Some files carry a second speaker whose voice another group owns: HaX and Netherton inside `tesseract` and the closing scenes (A writes, B owns the voice), Nightshade in HaX's `breach_call` (B writes "Manual.", C owns), Kowalczyk and Quintero in the core and at 06:00 (A writes, B owns). The writer uses the design documents' fixed lines where they exist; any new line in another group's voice goes in the writer's report so the owning group's writer reads it in the cross-read (§6.1 step 6).

### 1.3 Group A: Tesseract, the core and the close

Read first: FA §4.1, §4.3, §4.5, §4.6; MC §6, §8, §10; SE §2 (all of it), §3.1's core and 06:00 lines, §3.2, §3.3's core and van lines; OT §4.6, §4.7, §7; S6 §3; arc §9.3, §9.4, §10, §11; m07's `m07_architect_comms.ink` for his rhythm.

#### `m10_carryover_vars.ink` (include; no NPC)

Declarations and two functions, nothing else: no knots, no text, no tags. Its exact contents are §2.2. Written first (§1.1).

#### `m10_tesseract.ink` (`tesseract`, person, `koImmune`; the core)

Every entry, first talk, mapping or walk-back, goes `start` → `core_router`. Nothing in this file relies on saved ink position: a reload restarts a person-chat, and a walk-away mid-scene must land at the first unset menu (MC rule 1.11). Every menu writes its global **on the pick**, before any reply line.

| Knot | Entered from | What it must do |
|---|---|---|
| `start` | every open | `-> core_router`. No text. |
| `core_router` | `start`; the end of every step | Route on globals, first that holds (OT §4.6): (1) `m09_recruiter_offer == "double_crossed" and not wren_at_core` → `double_cross_open`; (2) `not core_greeted` → `arrival`; (3) any of `flag1_submitted`…`flag4_submitted` false → `finish_box`; (4) `not flag4_heard` → `flag4_lines`; (5) `not case_heard` → `case`; (6) the first of `exchange_1`, `exchange_2`, `exchange_3` still `""` → that exchange's knot; (7) `console_choice == ""` → `console` (which resumes Join by `join_step`); (8) WREN free and `not wren_at_core`, which is `whodunit_live and not wren_held and not kowalczyk_ko and console_choice == "stopped"` (`whodunit_live` is false on `taken` and `double_crossed`; `wren_held` is true once she is held before the core, §2.5) → `wren_beat`; (9) `database_outcome == ""` → `database`; (10) `ending == ""` → `his_end`; (11) otherwise → `after_end`. No text of its own. |
| `double_cross_open` | router (1) | MC §6.4 double-cross: the player arrives on the end of his refusal ("...it proves nothing. It has to be one of theirs." / Kowalczyk: "Adrian."); HaX: "Quintero. Core. Now."; Quintero takes her (or, with no Quintero, which here is `quintero_ko or officer_out == "quintero" or (nightshade_tethered and m09_sleeper_named)` because she breached ahead and comes late (MC §3.1), a one-option "[Take her.]" beat); Kowalczyk's line to the player on her way out. Sets `wren_at_core`, `sleeper_caught`; `quintero_enters_core` on the Quintero arm. Then `-> core_router` (step 0 runs as normal). |
| `arrival` | router (2) | His release line by `head_start_out`, one of four fixed strings (OT §4.5; `both` is now "Two cells have it. Much good may it do them."); HaX's return line by the same value is one of "Confirmed. Both shares went at the lock." / "Confirmed. Zero Day's share went." / "Confirmed. The resale went." / "Confirmed. Nothing left the lock." (A-10: it confirms his line rather than repeating it); "Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you."; HaX's return as second speaker (her one word, cracked and late; the designation; her line by `head_start_out`); his "Ninety-nine. You've done well with them." / her "Still HaX."; on `m04_voltage_captured`, the quote at HaX's return (FA §13 10-6); then HaX: "Get on his box. He'll keep." Sets `core_greeted`. Ends `#exit_conversation` so the player can walk to the host terminal. Asked about the head start (one optional choice before the exit): released, "Two hours for people who'll waste it. They were always scenery."; stopped, "Good. I never liked paying them." (FA §13 item 19). |
| `finish_box` | router (3) | "Finish on my box first. I'll keep." Then `#exit_conversation`. One line, no choices (it is the line a player hits by walking up early). |
| `flag4_lines` | router (4); his mapping on `flag4_submitted` (§3) | HaX as second speaker (SE §3.1 "As flag 4 lands"): on `not m09_completed`, the two notice lines; on an m09 save, "The notice you read in Helena is on here too."; then on every save the console fact and the vault line (MC §6.1). The purge is said once, at the database (A2-09), not here. Sets `flag4_heard`, then `-> core_router`. The router's step 3 already guarantees all four flags. |
| `case` | router (5) | His case (FA §4.1 step 1; SE §2.2): the Publication in six lines at most; the offer every player hears, with its line by `m01_player_launched_attack` and `m06_satoshi_stance` only where MC §6.7 says so; his evidence opening "I told you once I prefer to watch. I've watched.", at most three record lines by priority (`m04_disclosure_choice`, `m01_final_choice`, `m07_debrief_stance`, each with its default), never more than two before the player can answer, closing "Since your first day."; then the Recruiter beat (MC §6.2): `m09_recruiter_secret` to HaX, then `m09_recruiter_offer` to the player (the invoice on `taken`/`double_crossed`, the clean record said for the player on `named`/`refused` only when `m09_albion_notified` hides it from exchange 2). Break the case with at least one player choice every three lines (the pacing rule's dramatic-reveal exception allows four). The case's last menu is "[Make your argument, then.]" / "[(Say nothing.)]" (A2-07). `case_heard` is set in the knot `case_close`, which ends the case (A3); the Recruiter's menu is skipped when that beat has nothing to say on this save. Then `-> core_router`. |
| `exch_1`, `exch_2`, `exch_3` (knot names; ink can't name a knot after the global it writes, so not `exchange_n`) | router (6) | MC §6.3 and SE §2.3. Each: his opener (exchanges 2 and 3 open by the previous exchange's value: one opener for `rebuttal`, one for `record`, one for `miss`), his claim, then four buttons from the fixed slots in the fixed order (§5.4). Each pick writes `exchange_n` (`rebuttal` / `record` / `miss`) first, then his response: a concession with `*pause*` for a landed answer (the narrator marks only the first landed point: "He looks at the console for a long moment."), a dry miss line drawn from his range without repeats. Ledger stings (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`) play before his response where SE §2.1 places them. In exchange 3: on `should_have_told`, HaX's unasked line before the menu; on `m07_architect_echo_heard`, HaX's one beat as he says the line; the `ko_pattern()` sting by band (FA §3.6) before his response to whatever is picked, with "At the Citadel, it was your own handler." on `m08_hax_ko`. Between exchanges a pause menu lets the player prompt him on: "[Go on.]" / "[You're not finished.]" after exchange 1, "[And the last one?]" / "[(Let him go on.)]" after exchange 2 (A3). Each ends `-> core_router`. |
| `console` | router (7) | MC §6.4: "[Stop it.]" / "[Show me how it works.]". On `join_step >= 1` it opens on the furthest Join step's menu ("The key's where you left it." / "You were asking how it works."), so the casualty figure is never said twice; "[Show me how it works.]" on `join_step >= 1` resumes the Join menu the same way, and only enters `join_1` fresh when `join_step` is 0. "Stop it" writes `console_choice = "stopped"` and `partial_release` (`none`, or `small`/`large` when the backdoor channel is open and `not backdoor_closed`), plays his reply ("Then we do it the slow way…", or the `m09_reading_finished` "one thing" / "two things" line), the partial release as heard (with "Seattle first. As scheduled." on `m07_countdown_expired`), then `-> core_router`, which reaches `wren_beat` when she is free. On `m09_deck_pulled == "alpha_tapes"` with WREN free, HaX's service-door warning plays as the player reaches for it, before "Stop it" resolves. |
| `join_1`, `join_2`, `join_3` | `console`, router via `join_step` | MC §6.7 exactly: each step writes `join_step` (1, 2, 3, the furthest reached); step 1 his key line, his line by points (derive `points_landed` here too), the narrator's line with the casualty figure (the only place it is said); step 2 HaX "0x00. Don't." and the narrator's line; step 3 the key and its confirmation "Publish the database to everyone, now?" as an ink choice. Every menu offers the way back exactly as MC lists it ("[Step back.]" / "[Step away.]" / "[Stop it.]" / "[No.]"); "[Stop it.]" goes to the `console` knot's stop branch. Only the confirmation writes `ending = "joined"`, `console_choice = "joined"`, `database_outcome = "published"`, `partial_release = "published"`, `media_story_ran = false`; then "Thank you, Agent." and `-> join_end`. |
| `wren_beat` | router (8) | MC §6.4: she comes through the service door; his refusal ("Not you, Halina…") every time; her "Adrian."; then by branch: default (Quintero wounded: `quintero_wounded`, `quintero_enters_core`), `alpha_tapes` (Quintero takes her unhurt after the refusal), no Quintero (`quintero_ko or officer_out == "quintero"`: "[Stop her.]", one option, sets `wren_stopped`; on `alpha_tapes` HaX's warning goes to the player and the beat comes a second earlier). Sets `wren_entering` at the top (her copy reveals on it), `wren_at_core` on the resolution. Every arm then runs the tunnel `wren_react` (A-03): HaX, "Kowalczyk. *quietly* I signed her leave forms." (skipped on `sleeper_caught`, where the player already knows), and on the wounded arm Quintero's "Shoulder. Leave it." Named right on the line with no Quintero to send (`sleeper_caught and not wren_held`): his "You found her. Too late to stop her walking in." Then `-> core_router`. **WREN held before the core** (`wren_held`, or `m09_recruiter_offer == "taken"`): no beat; his glance at the service door and "You found her. I wondered whether you would." play once, in `console`'s stop branch. |
| `database` | router (9) | MC §6.5 in order: Netherton on the line ("Magnus." / "Adrian."), his secure case, HaX's cost of secure, Netherton's cost of disclose: the opener "Send ours to the vendors, and two operations go dark." and then the first two that apply of eight fixed one-operation noun phrases ("The watch on Sterling.", "Nightshade's channel.", the HashChain tags, "The watch on Voltage's people.", "The watch on what's left of Voltage's crew.", the Critical Mass watch, the head start's order book, the Zero Day brokers' tap; chosen by condition, never printed; audio cut 2, A2-03). HaX's cost of secure is "Keep them, and the infusion pumps in a hundred and forty hospitals are still live next year.", followed by the choice "[And if ours go to the vendors?]" / "[(Wait.)]" (A2-02). HaX's purge warning is said here and only here: "If both copies die, this room purges itself. He'll be ready for it, and you won't have him after." (A2-09). "[HaX. What would you do?]" writes the global `hax_asked_database` (A2-12; replaces the file-local `tess_asked_hax`). His two cost lines are merged into one ("Half of these cannot be patched this year, and the water controllers never…"), and HaX's disclosure and unpatchable lines are one line ("That's coordinated disclosure. Vendors first… with workarounds."), then the `m09_albion_notified` line, HaX's purge warning again, shorter, then wipe's cost (HaX, Netherton). Menu: the three options with MC's button texts plus "[HaX. What would you do?]" (returns to the menu, once). Writes `database_outcome` on the pick. "Wipe both" also writes `ending = "scorched"`, `media_story_ran` (true only on `m07_completed` and Fracture uncovered) and goes to `ending_scorched`. The others `-> core_router`. |
| `his_end` | router (10) | Derive `points_landed` from the three exchanges here (never counted). On `join_step >= 2`, his "You held your hand out for it…" first. Two or more: he stands, "Ask me, then."; Netherton's F13 line; menu "[Then cooperate. All of it.]" / "[No deal. You're under arrest.]" / the cold choice last. Fewer: "Arrest me, then."; menu "[You're under arrest.]" / the cold choice last; the arrest leads to the reach beat ("[Fire.]" / "[Hold fire.]"). The cold choice is MC §6.6 steps 1–4 word for word, `cold_lowered` removing it. Each final pick writes `ending` (and `fire_held` on "[Hold fire.]", §2.5) and `media_story_ran` (true on `executed`; else true only on `m07_completed` and uncovered Fracture), then goes to its ending knot. |
| `ending_arrest`, `ending_surrender`, `ending_lethal`, `ending_executed`, `ending_scorched`, `join_end` | the final pick | The ending's own beat at the core (FA §4.5–4.6, MC §8): one narrated line for each shot ("His hand is on the key. You fire. He falls against the console before it's pressed." / "He is still looking at you when you fire."); HaX's lines by ending (on `executed`: a long silence, then the designation once; Quintero takes the weapon without a word, or the van team at the lock when she is wounded or out); on `scorched` the purge (lights, suppression, blast doors cycling; he is gone by the service door, or his own way on `m09_sleeper_named`); on `join_end` he takes his coat and walks out with the player by the service door. Each ends `#exit_conversation` and diverts to `after_end`. Nothing here completes a task (`decide_his_end` completes on the `ending` mapping, §3). |
| `after_end` | router (11) | One fixed line per `ending` value for a player who talks to him again (dead: a narrator line; gone: none, the knot exits at once), then `#exit_conversation` and a divert to the resting knot `parked`, which re-routes on the next talk before printing anything. |

**Idle lines** (three at most, on events; FA §4.1 step 0): barks on `tesseract` (unvoiced text in JSON, stage 9), on the first use of the core host terminal, a field-guide request, and a failed submission. Group A writes the three lines in its report, not in ink.

#### `m10_kowalczyk_core.ink` (`kowalczyk_core_waiting`, `kowalczyk_core`; `koImmune`)

Their lines live in `tesseract`. This file only answers a click: `start` → `waiting` (on the double-cross, before she is taken: one line, and `#exit_conversation`) or `through` (during the beat: one line). Both exit; neither sets anything.

#### `m10_six_oclock.ink` (`six_oclock`, hidden person NPC; the forward post at 06:00)

| Knot | What it must do |
|---|---|
| `start` | First line: `~ close_compute()` (no text before it), then route by `ending`: `executed` → `executed`; `joined` → `exit_only` (this scene never plays on Join; a stray open exits); otherwise → `opening`. |
| `opening` | The scene opens "a few minutes before six" (A-01: the screen reaching six is the scene's last image, so nothing earlier may say it is six). The fixed beats outside the walkabout, in this order, each once (FA §4.6, MC §8.2): a shown Nightshade left at the post (`m08_nightshade_triple_agent and m09_nightshade_shown_file and not nightshade_taken_in`): "You left me where they couldn't see me. I'm still useful. That's rarer than you'd think."; on `m09_recruiter_offer == "named"`, Netherton: "The arrest teams are at the doors. They go on the hour." Then `-> walkabout`. |
| `walkabout` | A hub, at most three picks, then "[That's everyone.]" (sticky; also offered from the start). Quintero always first in the list (stretcher form on `quintero_wounded`; her line by `quintero_stance`, MC §4 C1). Then, in precedence, while picks remain: Kowalczyk in the van if caught or stopped at the core (`sleeper_caught or wren_at_core`; her reply by `kowalczyk_answer`, then "I liked you. I'd still have pressed it." only where her face-to-face scene didn't already say it; on a save where nobody named her, the only answer offered is "[I didn't. Not till you came through his door.]", writing `worked_out`; otherwise the answers are gated on what the player could know (A2-04): "[At the bench log. Then your name on the sign-out sheet.]" on `clue_bench_log` and not `taken`, "[At the briefing. You laughed too easily.]" not on `taken`, on `taken` "[In Helena. She sold me your name.]" (`bench`; her reply "Eleven years she paid my mum's care home. Then she sold me to you.") and "[Before Helena. I had a feeling about you.]" (`briefing`), and "[I didn't. I worked it out.]" always); a wrongly accused officer not recalled (`officer_out`); Voltage, Gary or Imran, Wendell, Victoria, by branch. One line each. A file-local counter (`six_picks`) caps it at three; spent people retire. On `scorched` the walkabout runs too. |
| `numbers` | Netherton's numbers, tonight's cost only (MC §10 rule 2): the head start by `head_start_out` (FA §4.6 "The head start"); the trace line on `share_zero_day == "traced"`; the story on uncovered Fracture (the partial release, backdoor and "Seattle's went first." are no longer said at 06:00, since the core already said them; A2-01); one line if any raid member was knocked out (no names, §5.8 10-11); the Zero Day tap line on `victoria_gallery == "confronted"`; the $12.8M on `m06_assets_seized` (secured / not; never on `executed`). Then a choice breaks the ledger before `database_beat`: "[And the database?]" / "[(Nod.)]", and "[(Say nothing.)]" alone on `executed`. Before it, `more_menu` offers "[And the rest of it?]" only when `numbers_more` has a line on this save (A2-01). |
| `database_beat` | By `database_outcome` (FA §4.6 "The database choice in the epilogue"): secured (vault, "Two maps now," the first operation's cell rolled up on screen); disclosed (HaX's acknowledgements line, the two operations going dark, the water utilities); both_wiped (Netherton's suspension of the player in front of the team, "I wanted to do the same…", then the wipe's gain line). (superseded: §11 alignment R4-m4) |
| `van` | Arrest and surrender only: the van; his nod to HaX; the chapter exchange with Netherton ("I wrote that chapter, Magnus." / "I know. I kept it to one page."); on `nightshade_taken_in`, the look at the van window ("You wrote me as a line item." / "You were a good one."); surrender's "There will be no trial." and HaX sitting with him for a minute. |
| `the_rest` | HaX's forty-seven beat first on `m09_recruiter_secret` `kept` or `denied` (harder wording on `denied`; FA §13 10-9); then "the rest" in two lines ("The night he left, he asked me to go with him." / "I said no. It took me till morning."), introduced on arrest by "It's afterwards." as the van goes; then her last word by ending (FA §4.6 table). On `scorched` the rest is not told here (the hearing has it): Netherton's suspension stands as the scene's end. As her last word lands, one narrator line: the table's screen reaches six and nothing happens. |
| `executed` | MC §8.3: no walkabout, no rest. The screen shows Social Fabric's story (the object's text; **no narrator line** reads it). Netherton: "I will not put my name under this one. You will be held until the board sits." HaX is not at the van (no HaX line; her message comes later as a text, JSON). Netherton's numbers without the $12.8M. The database beat without HaX reading acknowledgements. (superseded: §11 alignment R3-m3/m4) |
| last line, every ending except `scorched` | `#set_global:six_done:true`, `#set_global:closing_done:true`, `#complete_task:close_the_night` as tags above the scene's last spoken line, then `#exit_conversation`. On `scorched`: `#set_global:six_done:true` only, above the last line (the hearing completes the night). |
| `exit_only` | `#exit_conversation`, no text. |

Walkabout picks read only what the 06:00 scene knows; a person who isn't standing there is never offered.

#### `m10_hearing.ink` (`hearing`, hidden person NPC; Scorched Earth only)

`start`: `~ close_compute()` first, then the hearing: HaX beside the player ("He still knows. He's one man with a memory now, not a map."), the rest told here, her last word "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." (on `hax_asked_database`: "They'll ask me if I'd have stopped you. I'll tell them you asked, and I said it was yours.") (FA §4.6; MC §8.2). Short: about a minute. Last line carries `#set_global:closing_done:true` and `#complete_task:close_the_night`, then `#exit_conversation`.

#### `m10_citadel.ink` (`citadel`, hidden person NPC; Join only)

`start`: `~ close_compute()` first. The Citadel, opening on HaX's channel still open on the wall with nobody speaking on it (A-04; not her empty desk), Netherton orders 0x00 brought in, the casualty curve climbing on the screen (narrator, one line, the curve and nothing else). No HaX lines (her last message is a text, JSON). Last line: `#set_global:closing_done:true`, `#complete_task:close_the_night`, `#exit_conversation`. (superseded: §11 alignment R3-m3/m4)

#### `m10_recruiter_phone.ink` (`recruiter_phone`, phone; never rings) (superseded: §11 alignment R3-m3/m4)

`start` is the home knot, gated and silent (PASS2 lesson 36): it prints nothing and holds one sticky exit choice. The 06:00 text on `double_crossed` ("I'll remember the shape of you.") is a JSON text, not ink. (superseded: §11 alignment R3-m3/m4)

#### `credits_sections.json` (group A; JSON, not ink)

The SAFETYNET and In memory sections for entries E1–E6 (§5.9).

### 1.4 Group B: HaX, Netherton, the briefing, the raid team and the whodunit

Read first: arc §3, §4, §5, §8; SE §3.1, §3.2, §3.3, §3.4, §3.5's HaX pointers; MC §4 (C1, C9, C10), §5; OT §3, §4.1–4.5, §4.9, §5, §13; RL §2.1, §2.9; FA §4.0, §4.4 "The whodunit"; m08's `m08_phone_agent_0x99.ink` and `m08_director_netherton.ink`.

#### `m10_phone_agent0x99.ink` (`agent_0x99`, phone; home knot `start`)

The busiest file in the mission. Hub topics are text; the seven call knots are voiced (§4). Every knot that can be reached by a call mapping ends `#exit_conversation` and never diverts into `start` or `support_hub`.

| Knot | Entered from | What it must do |
|---|---|---|
| `start` | the phone opening outside a call; phone preload (PASS2 lesson 36) | Home knot. Prints nothing and writes nothing. `{hax_jammed: -> jammed}` else `-> support_hub`. |
| `jammed` | `start` | One line, "...", and the sticky exit only (OT §5 "The jam"). |
| `support_hub` | `start`; every topic's end | OT §5 exactly: progress-gated topics, newest first, each retired by its `_given` guard or its aim; the three sticky choices last ("[Where are we?]", "[Field guide.]" when a guide is on offer, "[That's all.]"). A phone resting knot holds choices only, no re-entry line (README_ink_best_practices bug 2, phone exception). At most ten visible on the busiest save (OT §5 "The ten-choice cap"). |
| `where_are_we` | hub | The "[Where are we?]" ladder in OT §5, first that holds, one fixed line each; after a reload it names the room to walk back to. Returns to the hub. |
| `field_guide` | hub | One button, branching by the VM stage the player is on, offered only once that stage's console has been used (`guideN_offered`, §2.5). Gives the stage's guide with `#give_item:lab-workstation:<guide_id>` (working ids `m10_guide_flag1`…`m10_guide_flag4`; stage 9 and the VM plan fix the real ids) and sets `guideN_given`. One plain line naming which guide she is sending; nothing about its content. |
| `how_are_you`, `why_me`, `the_hour`, `the_head_start` | hub (`briefing_played`; "[How are you?]" retires at `flag2_submitted`, B2-01; the last three retire at `breach_open`) | SE §3.1 "[How are you?]" by `m09_hax_confession_answer` (cold-start forms on `not m09_completed`); the briefing hub's three questions (arc §3, OT §5). |
| `fence`, `power_room_topic` | hub (`flag1_submitted`, with `m06_assets_seized` for the fence; "[The fence.]" retires at `workshop_entered`, B2-01) | OT §5 rows. |
| `door_log` | hub ("[The door log.]" while `not door_log_given`); HaX volunteers it on the log's first read (a bark, JSON) | Clue 1's read; the dummy camera if asked ("That camera's a box on a bracket. Never wired."). Sets `door_log_given`. **Stage 9 must also set `door_log_given` from the door-log bark's mapping**, because the alibi topic "[Who was where at ten past?]" now needs `door_log_given` (B2-01) and a player who only heard the bark would otherwise never see it. |
| `alibi` | hub (`clue_door_log and whodunit_live and not clue_alibi`) | Clue 2: what the player saw at the gate, what HaX had, what Netherton had (OT §3 row `check_the_alibis`; the `arakawa_ko` variant). Sets `clue_alibi`. |
| `signout` | hub (`clue_bench_log and whodunit_live and not signout_read`) | "Opened one fifty-two. Kowalczyk and Arakawa." (the `taken` and `double_crossed` forms never reach here: the whodunit is off). Sets `signout_read`. |
| `accuse`, `accuse_who`, `accuse_confirm`, `accuse_right`, `accuse_wrong` | hub "[I know who WREN is.]" (`clue_door_log and whodunit_live and not wren_at_core and accused == ""`) | The **line accusation** (MC §5): while `officer_out != ""`, a wrong name gets "Get <officer> back first." (one fixed line per officer) and the right one is still accepted. `accuse_who` lists the team on tonight's raid in this order, so the right name is never first (B-01): Malhotra, Arakawa, Kowalczyk, Quintero, then Vector and Phantom on `vector_on_team` / `phantom_on_team`, then "[Yes. Them.]" / "[Not yet.]". Right: `accused = "kowalczyk"`, `sleeper_caught = true`; Netherton on the net sends Quintero by the service side and `wren_held = true`, unless there is no Quintero to send (`quintero_ko or officer_out == "quintero"`), in which case Netherton says so and `wren_held` stays false. Wrong: `officer_out = "<name>"`, `wrong_accusation = true`; the officer's hint line on the net as second speaker (SE §3.4: Malhotra "Eleven years. Check the log again."); Netherton's cost line where MC §5 gives one. Each ends back at the hub. |
| `recall_malhotra`, `recall_arakawa`, `recall_quintero`, `recall_vector`, `recall_phantom` | hub, one per officer (`officer_out == "<name>"` and the clearing clue held: `clue_bench_log` for Quintero, `clue_alibi` for the rest) | Netherton's recall over the channel ("Officer Malhotra, you are cleared. Come back, and leave the face at the van."; one fixed form per officer); `officer_out = ""`, `<name>_recalled = true`. |
| `whats_live`, `what_went_out`, `backdoor_topic`, `hatch_topic`, `console_fact`, `vault_line` | hub, gates as OT §5 | `whats_live` reads `share_zero_day` and `share_resale` as fixed lines by state (four lines plus the lone-trace line) and ends with Sterling's rule on a recruited-Victoria save; `what_went_out` the four `head_start_out` lines, word for word her "Confirmed…" return lines in `arrival` (§1.3), sets `what_went_out_given`; the rest as OT §5. |
| `shutter_topic` | hub "[Talk me through the shutter.]" (`power_room_entered and not gallery_shutter_cut and phone_voice_is_hax`) | `-> cut_call`. Nothing else. |
| `console` | the release console controls' mapping (§3), text, not voiced | C9 and C10 (MC §4): HaX's "I can kill one feed, or follow one. Not both. Pick."; options "[Kill Zero Day's.]", "[Kill the resale.]" (only on `ghost_sale == "bait"` with `share_resale == "live"`), "[Let it run. Trace who gets it.]", and "[Close the backdoor.]" while `backdoor_channel_live and not backdoor_closed`; each pick writes `head_start_killed` (`zero_day` / `ghost` / `trace`) or `backdoor_closed`; once `head_start_killed != ""`, the share options are gone and only the backdoor (if live) and the exit remain. Ends `#exit_conversation`. |
| `breach_call` | voiced call (§4) | OT §4.1 and SE §3.1: Netherton on the net, "Breach. Go."; on `nightshade_tethered`, Nightshade on the net, "Manual.", then HaX: "He's on the crank. Their reader never saw you."; otherwise HaX: "It's read your badge. They know you're in."; on `m09_deck_pulled == "alpha_tapes"`, HaX: "The best lock there is. Tape two." No narrator. `#exit_conversation`. |
| `inner_door_call`, `tripwire_call`, `ladder_call`, `stair_call` | voiced calls | One or two lines each, fixed in SE §3.1 and OT §4.2–4.3. `#exit_conversation`. |
| `gallery_open_call` (knot name; `gallery_open` is the global, and ink can't share the name) | voiced call, `disableClose: true` | OT §4.4: the console warning if `head_start_killed == ""`; on a recruited Victoria, her one warning in one line ("Sterling goes with whoever's winning. Show her the order, and she'll know we read Zero Day's mail."); the sweep line; her last line before the jam naming the stair and the walkway; on `m03_victoria_fate == "arrested" and not victoria_line_done`, it ends on "Sterling's still on the line. She has something on Vos." **On `officer_out == "malhotra"`**: the warning(s) she owes, then the static fragment ("Netherton sweeps the... I'm losing y..."), and nothing after it. Never more than one warning before the last line (MC §3.5). `#exit_conversation`. |
| `cut_call` | voiced call when the slot voice is HaX; `shutter_topic` | The shared shape in §1.6. Routes on `cut_step` and `gallery_shutter_cut`. `#exit_conversation` at the end, and on every early exit choice. |

Unprompted HaX lines at beats (the flag lines, the pointers in SE §3.1 "On the way down" and "Pointers that say a cost before the pick", the nudges, "Lost you up there. I'm back.", the margin pointer and "Copy just the code.", the Hollis line, the `letters` line) are **barks or texts in JSON**, not ink (OT §13 "Barks and texts"). Group B owns their wording and lists every one it changes or settles in its report.

#### `m10_hax_post.ink` (`hax_post`, person, `koImmune`; the forward post)

HaX in person at the van end. `start` → `hub`: a re-entry line, two or three short topics at most (she points to her phone for the rest: the briefing questions live there), a sticky exit with her reply. Before the split only her own in-person lines; after `breach_open` she is "on the phone" (one line). No calls, no globals.

#### `m10_director_netherton.ink` (`director_netherton`, person, `koImmune`)

| Knot | Entered from | What it must do |
|---|---|---|
| `start` | every open | Router: `not briefing_done` → `briefing`; `briefing_done and not aside_done` → `aside`; `door_branch() == "silent" and not door_scene_done` → `tether`; otherwise → `hub`. |
| `briefing` | the `timedConversation` on `game_loaded` (`skipIfGlobal: briefing_played`) | `#complete_task:take_the_briefing` above the first spoken line (PASS2 lesson 42). arc §3 and §4: which form plays (played m09: `double_crossed`, then `taken` (the order the ink checks, MS-03; stage 8 SA m5), then the default kit check; cold start: on `not m08_completed`, Nightshade first, then the three facts with the name and the hour in front of the team), the stakes (both modes of the Publication; the full-disclosure-versus-Publication line once), Quintero's objection (second speaker) and C1 (Netherton's reply keeps "Twice now" only on `m09_completed`, where she objected in Helena; otherwise "Noted, Agent Quintero. The record also says six o'clock."), "[She's right. And we're going anyway.]" / "[The record says six. We go.]" / a say-nothing option, writing `quintero_stance`; the handbook line; the stakes menu (`briefing_stakes`) includes "[Has he costed it?]" (B3); Vector and Phantom at the table or declined (Netherton's line by branch); on a cold start Kowalczyk's cracker line (second speaker; drop "never been near him" on `not m08_completed`). Last line of this part sets `briefing_done`, then `-> aside`. Five lines at most between choices in the cutscene. |
| `aside` | `briefing`; `start` if the cutscene was closed early | arc §3 "The private aside" and FA §4.0: the van end, HaX as second speaker. Default: placed eleven years ago, why the team stays together, "and neither will you", "Whoever it is wants the same room you do. Find them before you get there."; "[Do we know who?]" gets "No. And if I bench four agents to find out, WREN knows we know." (B3); on `m09_sleeper_shortlist and not m09_sleeper_named` HaX's "Two faces from Helena. Watch both."; on `m08_named_on_evidence` with `whodunit_live`, HaX's line. **Check `double_crossed` before `taken`** (MS-03). `taken`: the named form, ending at the van window with Kowalczyk as second speaker: "When did you know?" and C18's three answers, writing `kowalczyk_answer`. On `taken` the player never saw her at the briefing or the bench log, so the answers are "[In Helena. She sold me your name.]" (`bench`; B3-01: her reply plays only at 06:00, and here a narrator line follows), "[Before Helena. I had a feeling about you.]" (still `briefing`; B-02), here and in Kowalczyk's `van` knot (stage 8 SR minor 1: "[I didn't. I worked it out.]" is cut on `taken`, where the Recruiter sold the name); the face-to-face crack and 06:00 keep "[At the briefing. You laughed too easily.]". `named`: Netherton adds "The arrests start at six. Not before. WREN would hear." `double_crossed`: wording to write (§5.8, 10-11). Last line sets `aside_done`. Then `#exit_conversation`, `-> hub`. |
| `tether` | `start` on the silent branch | MC §3.1 "Silent, or never played": Netherton's cost line in the right form (whodunit running, or Kowalczyk off the team), then the closing choice "[Bring him up. Let's hear the second word.]" / "[Leave him in the van.]" (default). Writes `nightshade_tethered` (true or false) and `door_scene_done`. Re-enters here until `door_scene_done`. |
| `split_line` | Netherton's mapping on the second of `door_scene_done` and `gate_console_used` (§3) | "Quintero, Kowalczyk. The service tunnel. Go." (Kowalczyk off the team: a form without her; §5.8). Its last line sets `split_started`. Ends `#exit_conversation`. |
| `hub` | re-talk | A re-entry line by progress, a few topics (the plans, the van, the tether, what he will sign), a sticky exit with a reply (after the night: "Go and get warm. The paperwork can wait an hour."). Nothing here sets a story global. |

#### `m10_kowalczyk.ink` (Kowalczyk: `kowalczyk_post`, `kowalczyk_van`, `kowalczyk_so`, `kowalczyk_ws`, `kowalczyk_pr`, `kowalczyk_hall`)

Knots by `currentKnot`: `post` (the kit check before the split; after `pair_back`, "Door end. Service door's real. Steel, a reader, a camera that doesn't move." if asked), `van` (`taken`: one resting line after the aside's question; if the aside closed before she was answered, it offers C18 itself while `kowalczyk_answer == ""`, with the `taken` answers "[In Helena. She sold me your name.]" / "[Before Helena. I had a feeling about you.]" / "[I didn't. I worked it out.]", as in §1.4 `aside`), `so`, `ws`, `pr`, `hall` (RL §2.9: the photo line in the security office; the peel-off line in the server hall by default, the security office on `nightshade_tethered`, the workshop on `wren_warned`; the peel-off line's last line sets `kowalczyk_gone_ahead`, on which her copies hide). Every bunker copy offers the **face-to-face accusation** while she is in the room (`clue_door_log and whodunit_live and accused == ""`): the four cards in arc §8.4's order, her two lies, the crack, then C18 ("When did you know?", three answers, `kowalczyk_answer`; the bench answer is "[At the bench log. Then your name on the sign-out sheet.]", offered only on `clue_bench_log`), then "I liked you. I'd still have pressed it." Writes `accused = "kowalczyk"`, `sleeper_caught = true`, `wren_held = true`. No pronoun for WREN anywhere before this scene.

#### `m10_quintero.ink` (Quintero: `quintero_post`, `quintero_so`, `quintero_ws`, `quintero_pr`, `quintero_hall`, `quintero_lock`, `quintero_core`)

`post` (the pair back: "We split at the fork. I took the drain. It comes up by the service door anyway."), `so` ("I don't like doors that know your name." on `breach_announced`; the photo line on the tether with Kowalczyk off the team; Arakawa's peel-off reaction on the tether when he isn't there to say it), `ws`, `pr`, `hall` (one line each at most), `lock` (MC §4 C1's lock line by `quintero_stance`; the arrested-Nightshade-refused line; "He wants you on your own. I'll be on this side of it."; her secret if asked on `quintero_stance == ""`, SE §3.4), `core` (one resting line: "One arm's plenty for a door. You've got work." when wounded, else "Door's mine. You've got work."; B2-03). Every copy before the gallery offers the **face-to-face wrong accusation** (gated as Kowalczyk's, plus `officer_out == ""`): her line "I took the drain. I didn't pack the case. Read the sheet.", `officer_out = "quintero"`, `wrong_accusation = true`. Her recall line plays in HaX's `recall_quintero`.

#### `m10_arakawa.ink` (Arakawa: `arakawa_post`, `arakawa_gate`, `arakawa_blast`, `arakawa_so`, `arakawa_ws`, `arakawa_pr`, `arakawa_hall`)

`gate` is his call (OT §6 "Arakawa's call"): opened by his own mapping; he dials, the telescope line unprompted as he hangs up ("She wants a telescope. I'm getting her a telescope."), Malhotra on the net as second speaker ("Arakawa, you're off the net."). No choice. Its last line sets `arakawa_call_done`. `post`, `blast` (the tether), `so` (the photo line when Kowalczyk is off the team), `ws` (his reaction on `wren_warned`), `pr`, `hall` ("Service side. She always takes the door nobody's watching."); his resting lines in the bunker also need `not nightshade_tethered` (on the tether he is at the blast door). The face-to-face wrong accusation as Quintero's, with his own hint line; his recall line ("You heard me on the phone to her. Then you thought I'd do this?") plays in HaX's `recall_arakawa`.

#### `m10_malhotra.ink`, `m10_vector.ink`, `m10_phantom.ink`, `m10_minders.ink`

Malhotra (`malhotra_post`, `koImmune`): a few lines at the van end; the face-to-face wrong accusation ("Eleven years. Check the log again."). Vector (`vector_post`, `vector_so`): at the table; in the security office he gives the cupboard code (`#give_item:notes:vector_cupboard_code`, on its own line above his reply) and says why he knows it (S6-15); the face-to-face wrong accusation. Phantom (`phantom_post`): his list, which replaces clue 3 (sets `clue_bench_log`), and the face-to-face wrong accusation. Minders (`minder_post`, `minder_blast`, `minder_lock`): one line each, no globals.

Face-to-face accusations in any of these files write exactly what the line accusation writes (MC §5: "the same outcomes"), and HaX's hub sees the result through the globals.

### 1.5 Group C: the five full scenes and the bunker's people

Read first: MC §3 (all five scenes), §4 C7, §7; arc §7; SE §3.5, §3.6; OT §4.2, §4.5, §4.9; RL §2.1–2.7; S6 §1, §2; the shipped voices of each returning character (m02 Ghost and Gary, m03 Victoria, m04 Voltage, Static and Vance, m07 Elena and Mercer, m08 Nightshade).

**Rules for every slot scene** (MC rule 1.4): the scene's first line writes its outcome global to `"avoided"` only while it is still `""` (`imran_outcome`, `gary_outcome`, `voltage_outcome`, `wendell_outcome`, `victoria_gallery` on the escaped branches, `vos_outcome`); a room-exit mapping does the same for a player who never spoke (stage 9). Recruited Victoria's first line writes `"refused"` the same way, and on her branch stage 9's default is `refused`, not `avoided`: mappings on `room_exited` from the gallery **and** on `outer_lock_open` with `globalVars.m03_victoria_fate === 'recruited' && globalVars.victoria_gallery === ''` set `victoria_gallery: 'refused'` (stage 8 M-4). Knock-outs are written by mappings (`ko`), never by ink. Each scene re-enters on its outcome global: once decided, a re-talk gets a resting line, never the menu again (PASS2 lesson 14).

#### `m10_nightshade.ink` (`nightshade_table`, `nightshade_van`, `nightshade_blast`, `nightshade_lock`; all `koImmune`)

| Knot | What it must do |
|---|---|
| `start` | Router by `door_branch()` (§2.6) and copy: `table` for the three table branches, `van`, `blast`, `lock`. |
| `table` | Re-enters on `door_scene_done` (resting line) or at the closing choice (MC §3.1 "Walk-away"). Three branches: **shown** (pays in full; marks the wrong entry as Tesseract's lie; hands over the override with `#give_item:key:alarm_override` on both options; closing choice "[Stay at the post.]" (default) / "[Come with us. You can see his face.]", Netherton's two cost lines first as second speaker; writes `nightshade_taken_in`); **not shown** (pays warmly, gives the payment with `#give_item:notes:nightshade_payment`; HaX's pointer as second speaker; once `payment_read and plans_read`, the check option worded per S6-16, which sets `payment_checked` and gets "You read your homework."; closing choice "[We'll go by your map.]" / "[Helena's plans will do.]" (default), each with its cost said first; writes `nightshade_map_used`); **arrested** (first line writes `nightshade_deal = "refused"`; "You said no deals…"; "[No deals. I said it then.]" first and default, which is a closing choice / "[Name them. You'll get your deal.]", which writes `nightshade_deal = "taken"` and `nightshade_map_used`, gives `#give_item:notes:nightshade_payment` and goes to `deal_close`. `deal_close` holds the payment check (as on not shown) and the closing choice "[That'll do. We go by your map.]", so the check can still disarm the tripwire on this branch). The check's button is "[Your inner door entry says 1962, no interlock. Helena's 1962 drawings have one.]" (S6-16 shortened to the 15-word cap). The opener says "fifteen years of me in his own hand" and never "line item", which is kept for 06:00 (C-01). On the not-shown and arrested branches, `m09_cage_bin == "nightshade_copy"` adds his one line. His ENTROPY-habits line (FA §4.4 "Helpers") on shown, not shown and the deal sets `clue_alibi`. Every closing choice writes `tripwire_armed` (`nightshade_map_used and not payment_checked`) and then `door_scene_done`, in that order. |
| `van` | Silent branch: "Door." and nothing else (a click shows it again). The tether question is Netherton's. |
| `blast` | The tether at the blast door: one line in person ("Manual." itself is on the net, in HaX's `breach_call`). |
| `lock` | Taken in, at the outer lock: one line on a click ("Go on. I've got the door." is a bark, JSON). |

#### `m10_ghost_phone.ink` (`ghost_phone`, phone; home knot `start`)

`start` is gated and silent (prints nothing, writes nothing, one sticky exit). `ghost_call` is the voiced call (§4): its **first line** writes `ghost_sale` (`stopped` on kept and refused, `selling` otherwise) and `ghost_gift = ""`; then MC §3.2's three branches: **kept** (`m02_ghost_deal_accepted and m02_exposed_hospital`; the question and three answers writing `ghost_answer` `not_why` / `card_unsigned` / `ask_them`; the last line gives `#give_item:notes:ghost_cupboard_code` and names the west-wall cupboard); **refused** (`m02_ghost_deal_refused`; "You turned me down. Why?"; "[I don't buy from people who hold hospitals.]" writes `ghost_gift = "code"`, `ghost_answer = "hospitals"` and gives `#give_item:notes:ghost_lock_code`; "[I didn't trust you to keep it.]" writes `ghost_gift = "card"`, `ghost_answer = "trust"`, `lock_guard_known = true`, and names "The one at the lock end. Fonoti." then "He carries the code card, and he'll want to be off shift.", which Fonoti's option quotes); **selling** (broken, unanswered, stranger: talk Ghost out of it, with the hook working on broken only after "[I didn't keep it. I'm asking anyway.]", visible misses for money and threats, writing `ghost_sale = "stopped"`; or "[Sell it, then. I want to see who's buying.]" writing `ghost_sale = "bait"`; no hang-up button). Every branch's last choice writes `ghost_call_done`. HaX's pointer as the handset rings is a bark (JSON), not a line here; her one line inside the call is the bait's cost before the selling menu ("If it sells, the release console can kill that share. It only does one.", second speaker on the line; C2-03). No "Where were we." lines: `resume: true` re-enters no knot (FA §13 10-10). Ends `#exit_conversation`.

#### `m10_imran.ink` (`imran`) and `m10_gary.ink` (`gary_consultant`, `gary_tech`)

Imran: `workshop` (MC §3.3: his grievance by `m02_exposed_hospital`; the casualty sheet "Read what's pinned over my bench."; the margin pointer "There's something written in the margin. Not plain English."; the decision "[Go home. Keep your phone.]" / "[I'm taking you in.]", HaX's cost line first as second speaker. Talked round: `imran_outcome = "talked_round"`, `#unlock_door:power_room`, the bench-log line "Names, not stores. Look at the log.", the call that sends Farah home. Taken in: `imran_outcome = "taken_in"`, HaX reads the supplier delivery off his phone as second speaker; the power-room card by `#clone_keycard:tg_power_room_card`, or `#unlock_door:power_room` on `ghost_watch_on_route`, where he keeps the card on him). On the protected branch Gary speaks inside Imran's scene as second speaker ("I trained him. He read my emails."; his reaction to the decision). `follows_gary`: on the unprotected branch Imran says one line and defers to Gary.

Gary: `consultant` (protected: at the door, "You saved my career."; recognises the casing; asks the player to talk Imran round or take him in, and points them at Imran), `tech` (unprotected and quiet: three short beats; a dismissive pick ends it without a fight, "Then you're the board. Card's on my belt."; options talk him round (`#unlock_door:power_room`), leave him in place (`#clone_keycard:tg_power_room_card`), "[You're coming in, Gary.]" (C-10; also clones the card); writes `gary_outcome` and Imran's matching `imran_outcome`, and its first line writes `imran_outcome = "avoided"` as well as `gary_outcome` while each is `""`; HaX's cost lines as second speaker where MC gives them).

#### `m10_voltage.ink` (`voltage_van`, `voltage_power_captured`, `voltage_power`), `m10_static.ink` (`static_power`), `m10_wendell.ink` (`wendell`, `wendell_far`)

Voltage: `van` (captured, at the forward post until the breach: one line). `captured` (MC §3.4: he offers both; "[Your hands. Go on.]" writes `voltage_outcome = "his_hands"`, "I could. Watch my hands.", the inquiry ask, then `gallery_shutter_cut`, then a one-step acknowledgement choice; "[I'll do it. Talk me through it.]" writes `voltage_outcome = "by_hand"` and runs the in-person cut in §1.6's shape, with "You're right not to trust me."). `escaped` (the print stand-down only on `m04_voltage_print_on_bypass and voltage_print_lifted`: "I'm not going to argue with my own thumb.", `voltage_outcome = "stood_down_print"`; the talk-down with the corrected sheet, offered only on `casualty_sheet_read`, two right picks, a miss "Don't tell me about sums."; `talked_down`; either stand-down cuts the shutter: `gallery_shutter_cut`; a failed talk or the player's choice to fight: `voltage_outcome = "fought"`, `cut_by_hand = true`, `#hostile:voltage_power`, and `#hostile:static_power` on `m04_static_left and not m04_static_left_alone`). Static: one line, nothing else.

Wendell: `wendell` (the default branch: he thinks the servers belong to a data company; the phone voice's cost text has already been sent (JSON); the buttons are the player's own words, "[Those servers are set to shut down hospitals at six. That's the job.]" (tell him) and "[Never mind. Carry on, Mr Briggs.]" (work round him); SE's "son. Or ma'am." is dropped (§1.2). Telling him: `wendell_outcome = "told"`, `server_hall_warned = true`, `gallery_shutter_cut = true`, "Well. Which switch do you want.", the call to Dale; "work round him": `wendell_outcome = "worked_round"`, `cut_by_hand = true`). `far` (escaped without Static: nervous at the far panel, one or two lines).

#### `m10_vance_phone.ink` (`vance_phone`) and `m10_elena_phone.ink` (`elena_phone`)

Each: `start` home, gated and silent; `cut_call`, the voiced by-hand cut in §1.6's shape, in that contact's voice. About eight spoken lines each. Ends `#exit_conversation`.

#### `m10_asante.ink` (`asante`), `m10_mercer.ink` (`mercer`)

Asante (C7, MC §4): on `server_hall_warned` she won't talk (one line, exit); otherwise she shows the schedule and, asked about the sheet (on `casualty_sheet_read`), confirms her correction ("I corrected his sums. He thanked me."), `asante_confirmed_sheet = true`. Either one writes `asante_outcome = "talked"`. Mercer: one line, "When the fourth submission is declined, somebody does this." (no "agent", §1.2), with `#hostile:mercer` above it.

#### `m10_victoria_line.ink` (`victoria_line`, phone), `m10_victoria.ink` (`victoria_gallery`, `victoria_threat`), `m10_vos.ink` (`vos`)

Victoria's line: `start` silent home; `victoria_call` (voiced): first line writes `victoria_line_deal = "no_deal"`; Vos's secret first, as goodwill, on a line that writes `vos_secret_known`; her price; "[Deal. I'll tell them you helped.]" / "[No deal. You gave it for free.]" writes `victoria_line_deal`; the last choice writes `victoria_line_done`. HaX's re-ring line is in HaX's `gallery_open_call`.

Victoria in the gallery: `recruited` (first line writes `victoria_gallery = "refused"` while `""`; HaX's warning was in `gallery_open_call`; confront "[Before you touch that lock. Zero Day's order has your name on it.]" → `confronted`, `#unlock_door:core`; trust "[Open it.]" → `trusted`, `#unlock_door:core`, and when `share_zero_day == "live"` she sells the raid and leaves back down the gallery stair, past the player; the alarm and reinforcements are mappings). `escaped` (no threat: her trade; "[Go.]" → `walked`, names Fonoti, `lock_guard_known = true`; "[You're under arrest.]" → `arrested_here`). `threat` (on `victoria_threat`: her m03 line in its shipped words, MC §3.5; the talk-down on her own words → `talked_down`, she leaves down the gallery stair; a miss "Don't analyse me." raises the pistol and leaves only the knock-out, `#hostile:victoria_threat`; a re-talk after the miss lands in the resting knot `threat_missed`, so the talk-down can't be retried).

Vos: first line writes `vos_outcome = "avoided"` while `""`. On `vos_secret_known`: the one-option line "[Your second buyer. The one you skim from.]", `vos_secret_used = true`, `vos_outcome = "stood_aside"`, `#unlock_door:core`. Otherwise his trade: "[Deal.]" names Fonoti as he hands over his copy (`#give_item:notes:vos_code_card`), `lock_guard_known = true`, `vos_outcome = "bought"`; "[No.]" `vos_outcome = "refused"`.

#### `m10_fonoti.ink` (`lock_guard`, Sione Fonoti)

`start` → `talk`: polite, slow; one option per naming route, each gated as OT §4.5's table ("[The rota says you carry the card.]" on `gallery_rota_read`; "[Ghost says you'll want to be off shift.]" on `ghost_gift == "card"`; "[Sterling sent me.]" on `victoria_gallery == "walked"`; "[Vos sold you out.]" on `vos_outcome == "bought"`, which lets him stand down without giving a card the player already holds). Each of the first three ends with `#give_item:notes:gallery_code_card` above his reply. `challenge` (opened by his `player_spotted` mapping as the cracker closes): sets `lock_guard_challenged` at the top; "[Shift change. Orders from upstairs.]" works once (a file-local flag; C-07: a hired guard wouldn't know SAFETYNET's director); anything else, or a second try, `#hostile:lock_guard`. His two barks are JSON (S6 and OT §4.5 wordings).

#### `m10_guards.ink` (the bunker's guards)

One knot per guard id (`tunnel`, `kettle`, `duty`, `duty_b`, `workshop`, `hall_a`, `hall_b`, `monitor`, `farah`, `reinforcement`), each a short challenge for a `challengeOnSight` open or a click: two or three lines, a talk-past where the design allows one (tunnel, kettle, duty_b, workshop), else `#hostile:<id>`. Both reinforcements share `reinforcement`, which emits `#hostile:reinforcement_a` and `#hostile:reinforcement_b`. Turned guards rest in a shared `fight` knot, talked-past guards in a shared `passed` knot. "Nobody said let you through armed." is the tunnel guard's alone (C-03). The gallery's effect barks ("Camera's dead again. I'll go and look.", "Where's Farah? She was on till six.") are JSON. Hired muscle, varied, American (S6 §2.4); nobody here knows what the bunker is for.

### 1.6 Seams between groups

Where one group's file depends on another's, the globals in §2 are the whole interface. These are the places where two groups touch the same beat.

**The by-hand cut, one shape in four places** (HaX's `cut_call` in B; Vance's and Elena's `cut_call` in C; Voltage's in-person "talk me through it" in C). One synced int, `cut_step`, carries the place, so a closed call, a re-ring, the hub topic or a walk-back always lands on the first unanswered step:

| `cut_step` | The voice says | Choices |
|---|---|---|
| 0 | where the isolator is and what it looks like (the object's text: "A key switch and a breaker row, labelled GALLERY SHUTTER.") | "[I'm at it.]" → `cut_step = 1`; "[Give me a minute.]" → `#exit_conversation` |
| 1 | turn the key to isolate | "[Key's turned.]" → `cut_step = 2`; the same wait choice |
| 2 | the breaker row; which breaker is the shutter | "[And the gallery camera?]" (once; the voice says which switch, and it is thrown: `gallery_camera_blinded = true`); "[Pulling it.]" → `cut_step = 3`, `gallery_shutter_cut = true`, one closing line, `#exit_conversation` |

The knot opens with `{gallery_shutter_cut: one line, #exit_conversation}`, then routes on `cut_step`. A cut shutter is "dead", never "down" (B-04: a shutter that comes down is a closed one); every voice says it that way. In Vance's and Elena's calls the wait choice exits to that step's own menu, so `resume: true` lands on it. No narrator lines (it is voiced on the phone). Each voice says it in their own way in about eight lines across the steps; the camera line is the only optional one. Voltage's in-person version uses the same steps and the same global, with his lines in place of the phone voice's, and with the camera choice, so his "I'll tell you which one's the gallery camera" is kept.

**The accusation, two doors into one result.** The line accusation is HaX's hub (B); the face-to-face accusation is a choice in each raid member's person file (B). Both write the same globals (`accused`, `officer_out`, `wrong_accusation`, `sleeper_caught`, `wren_held`), and every reader (A's core and 06:00, B's staging lines, the credits) reads only those. Kowalczyk's question (C18) is asked in one of three places: the aside at the van window on `taken` (B, Netherton's file), the face-to-face crack (B, Kowalczyk's file), or at 06:00 after a line accusation (A, `six_oclock`'s walkabout: she asks and the player answers there, then her reply). Each writes `kowalczyk_answer` once; 06:00 plays her reply whenever `kowalczyk_answer != ""` and asks the question first when she is at the van (`sleeper_caught or wren_at_core`) and `kowalczyk_answer == ""`. A WREN stopped at the core with nobody having named her gets one answer only, "[I didn't. Not till you came through his door.]" (`worked_out`). On `taken` the answers are "[In Helena. She sold me your name.]" (`bench`; her 06:00 reply "Eleven years she paid my mum's care home. Then she sold me to you.") and "[Before Helena. I had a feeling about you.]" (`briefing`) only; "[I didn't. I worked it out.]" is never offered on `taken` (stage 8 SR minor 1).

**The door scene's branch.** Nightshade's file (C), Netherton's tether (B), HaX's breach call (B) and the 06:00 lines (A) all branch on the same four-way choice. They call `door_branch()` from the include (§2.6) rather than re-deriving it.

**The release, said twice.** Tesseract's arrival line (A) and HaX's return line (A, in his file) read the same `head_start_out`; the card's head-start line (S6 §3.2) reuses his words. HaX's return lines are the "Confirmed…" forms (§1.3 `arrival`), so she confirms his line instead of repeating it, and her hub `what_went_out` (B) uses the same four lines word for word.

**The closing chain.** A's `tesseract` ending knots end the conversation; stage 9's mappings open `six_oclock` (or `citadel`) on `conversation_closed:tesseract`. Nothing in `tesseract` opens a closing scene, sets `six_done` or `closing_done`, or completes `close_the_night`.

**06:00 speaks for groups B and C.** The walkabout and the van carry Quintero, Kowalczyk, Voltage, Gary or Imran, Wendell, Victoria and Nightshade. Group A writes those lines from MC §4, §5, §8.2 and SE §3.3–3.6, keyed on the outcome globals B and C write, and lists them in its report for the cross-read.

**Ghost names the guard; the guard answers.** C writes both ends (`ghost_phone` and `lock_guard`), so the "[Ghost says you'll want to be off shift.]" option and Ghost's line agree.

## 2. The state contract

### 2.1 How globals reach the ink

- **Every scenario global is a synced `VAR`, declared once, in the include.** The engine writes each `globalVariables` value into the ink `VAR` of the same name when a conversation opens, and the variable observer sends any `~` assignment back to `gameState`, broadcasts it to every loaded story and emits `global_variable_changed:<name>` (`npc-conversation-state.js:547-597`). Ink rejects a `VAR` declared twice in one compiled story, so no ink file other than `m10_carryover_vars.ink` declares a scenario global. File-local state (counters, "asked once" flags) uses a `VAR` with the file's prefix (`tess_`, `six_`, `hax_`, `neth_`, `kow_`, `quin_`, `arak_`, `ns_`, `ghost_l_`, `imran_`, `gary_`, `volt_`, `wend_`, `vic_`, `vos_l_`, `fon_`, `grd_`, …), never a scenario global's name.
- **Three legs** (README_ink_best_practices; FA §13 10-7): every global a file writes is (1) in `globalVariables` (stage 9, from §2.5), (2) declared in the include, (3) written somewhere. §2.5 names the writer of each.
- **Imports are read-only.** No `~` and no `#set_global` on any `mNN_` name, ever (the engine reverts it and the validator errors).
- **How to write a global.** Use a plain `~ name = value` assignment for every global this contract lists. It updates the running story at once, so a router reading the value later in the same conversation sees it (the core depends on this), keeps strings as strings, and still emits `global_variable_changed`. `#set_global:name:value` is allowed where a design document names the tag (it writes `gameState` and emits the event, but turns digit-only values into numbers, and the running story sees it only after the tag is processed). **Never both for one write**: the tag would fire the event a second time. The closing scenes' `close_compute()` uses `~` only (FA §13 10-13).
- **Where the write goes.** On a decision, the global is written on the line straight after the choice, before any reply (MC rule 1.11: "written on the pick"). A done-flag that closes a scene goes on the last choice, or the last line if the scene has none (FA §6.1's forced-scene rule), never on opening or closing the conversation.
- **String values start with a letter**; ints only where §2.5 says int (`cut_step`, `join_step`, `points_landed`). `raid_clock` is never written by ink (OT §6: mappings only; stage 9 greps for it).
- **Conditions in ink** may use `and`, `or`, `not` and parentheses freely. **Conditions in JSON** (eventMappings, object variants, `closingCard` lines, credits clauses) use `globalVars.<name>`, `!`, `===`, `!==` and `&&` only: no `||`, no parentheses, no arithmetic (FA §13 B5; S6 §0). Where JSON needs an "or", ink computes it first into a global (`close_compute`'s five strings, `wren_held`), or stage 9 writes one mapping or variant per arm.

### 2.2 The shared include, `m10_carryover_vars.ink`

Group A writes it first. Every other `.ink` in the folder begins with the line `INCLUDE m10_carryover_vars.ink` and nothing above it. Checked on 2026-10-21: `bin/inklecate` resolves an `INCLUDE` beside the root file, and compiles the include on its own too (`scripts/compile-ink.sh` compiles every `.ink` in the folder, so the include gets a `.json` that no NPC points at; harmless). No other mission uses `INCLUDE` yet, so stage 9 also checks the validator's ink scans read through it (§6.2).

Contents, in this order, and nothing else (no knots, no text, no tags):

1. A header comment: what the file is, "read-only imports: never assign", and the date.
2. **Imports**, every name in §2.3, `VAR <alias> = <default>` with FA §3.2's default (`false` or `""`), grouped by source mission, then the nine `mNN_completed`.
3. **Exports**, the seven in §2.4, with their defaults.
4. **Locals**, every name in §2.5, with their defaults, grouped as §2.5 groups them.
5. **The close's five strings**: `close_secure_cell`, `close_cell_name`, `close_cells`, `close_human`, `close_zero_day`, each `= ""`.
6. **Functions** (§2.6): `ko_pattern()`, `door_branch()`, `landed_count()`, `close_compute()`. Functions read globals and return values; only `close_compute()` assigns, and only its five strings.

Every default here equals the default stage 9 puts in `globalVariables` (or `importGlobals`). If the two ever differ, the scenario's value wins at runtime, and the validator's dead-`VAR` and undeclared-global checks catch the drift.

### 2.3 Imports

FA §3.2: 90 variables (Tier 1 40, Tier 2 50) plus nine `completed`, every alias the default `mNN_<var>`. Read-only. Defaults: `""` where marked, else `false`. **Wherever a present, at-large or penalising value equals the default**, the condition also needs that source's `mNN_completed`, so a player who never played it is told nothing false (FA §3, rule above the never-played table; MC rule 1.9).

| Source | Tier 1 (presence, route, helper, obstacle, scene form) | Tier 2 (lines only) |
|---|---|---|
| m01 | – | `m01_final_choice` `""`, `m01_player_launched_attack`, `m01_maya_ko`, `m01_kevin_ko`, `m01_sarah_ko` |
| m02 | `m02_ghost_deal_accepted`, `m02_exposed_hospital`, `m02_ghost_deal_refused`, `m02_ghost_keys_used`, `m02_gary_protected`, `m02_reeves_fate` `""`, `m02_insider_asset_arrested`, `m02_insider_asset_escaped` | `m02_patient_assaulted`, `m02_receptionist_ko`, `m02_ward_nurse_ko`, `m02_raval_ko`, `m02_gary_ko`, `m02_dr_kim_ko`, `m02_bed4_manually_stabilised`, `m02_patient_bed4_deceased` |
| m03 | `m03_victoria_fate` `""`, `m03_sterling_on_call_seen` | `m03_guard_bribed`, `m03_guard_knocked_out`, `m03_receptionist_ko`, `m03_danny_ko` |
| m04 | `m04_voltage_captured`, `m04_voltage_escaped`, `m04_voltage_print_on_bypass`, `m04_static_left`, `m04_static_left_alone`, `m04_vance_is_ally`, `m04_disclosure_choice` `""` | `m04_crew_lost`, `m04_robert_vance_ko`, `m04_security_guard_ko` |
| m05 | – | `m05_entropy_program_exposed`, `m05_elena_treatment_funded`, `m05_final_choice` `""`, `m05_found_pipeline_list`, `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed`, `m05_lisa_ko`, `m05_owen_ko`, `m05_halloran_ko`, `m05_patricia_ko` |
| m06 | `m06_assets_seized` | `m06_satoshi_stance` `""`, `m06_monitoring_enabled`, `m06_guard_ko`, `m06_trader_ko`, `m06_analyst_ko` |
| m07 | `m07_elena_outcome` `""`, `m07_mercer_fate` `""`, `m07_mercer_ko`, `m07_hollis_resolved` `""`, `m07_debrief_stance` `""`, `m07_team_assignment` `""`, `m07_team_redirected` | `m07_countdown_expired`, `m07_architect_echo_heard`, `m07_elena_ko` |
| m08 | `m08_nightshade_triple_agent`, `m08_triple_agent_first_payment`, `m08_nightshade_arrested`, `m08_nightshade_ko_before_fate`, `m08_accused_vector`, `m08_accused_phantom`, `m08_vector_apologised`, `m08_phantom_apologised`, `m08_vector_hostile`, `m08_phantom_hostile` | `m08_offduty_agent_ko`, `m08_analyst_ko`, `m08_athena_ko`, `m08_netherton_ko`, `m08_hax_ko`, `m08_named_on_evidence` |
| m09 | `m09_nightshade_shown_file`, `m09_sleeper_named`, `m09_recruiter_offer` `""`, `m09_deck_pulled` `""`, `m09_sleeper_shortlist` | `m09_recruiter_secret` `""`, `m09_reading_finished`, `m09_albion_notified`, `m09_cage_bin` `""`, `m09_legacy_files_saved`, `m09_hax_confession_answer` `""` |
| completed | `m01_completed` … `m09_completed` (nine) | |

Counts: Tier 1, 40; Tier 2, 50. FA §3.2 and MC §7 say which line or branch each one changes; writers read those rows, not this table, for meaning. Values the ink tests against (for typos): `m03_victoria_fate` `recruited` / `escaped` / `arrested` / `ko`; `m04_disclosure_choice` `full` / `partial` / `quiet`; `m06_satoshi_stance` `wondered` / `rejected` / `refused`; `m07_team_assignment` `fracture` / `trojan_horse` / `meltdown`; `m07_debrief_stance` `hardened` (and others; only `hardened` is read); `m07_mercer_fate` `arrested` (else at large, with `m07_completed`); `m07_hollis_resolved` `evaded`; `m07_elena_outcome` `turned`; `m09_recruiter_offer` `taken` / `double_crossed` / `named` / `refused`; `m09_deck_pulled` `none` / `her_file` / `alpha_tapes`; `m09_recruiter_secret` `kept` / `told` / `confessed` / `denied`; `m09_cage_bin` `derek_file` / `letters` / `nightshade_copy`; `m09_hax_confession_answer` `should_have_told` / `same_in_your_place` / `afterwards`; `m01_final_choice` and `m05_final_choice` as their missions export them (writers check the source erb's values before testing one).

### 2.4 The seven exports

FA §3.5, MC §12. Stage 9 lists them in `exportGlobals`; nothing reads them in a later mission yet, but each must be written on every route that reaches `/conclude`, at the one moment given.

| Global | Type, default | Values | Written by (file, knot) | Read by in m10 |
|---|---|---|---|---|
| `ending` | string, `""` | `arrest`, `surrender`, `lethal`, `executed`, `scorched`, `joined` | A: `m10_tesseract.ink` `his_end` (four), `database` ("wipe both" → `scorched`), `join_3` (the confirmation → `joined`); always after `database_outcome` | the closing scenes, the closing mappings, music, card, credits, `decide_his_end` mapping |
| `database_outcome` | string, `""` | `secured`, `disclosed`, `both_wiped`, `published` | A: `database` (three); `join_3` (`published`) | 06:00, card, credits, `close_compute`, `decide_the_database` mapping |
| `sleeper_caught` | bool, `false` | | B: the right accusation (hub or face to face); A: `double_cross_open`. Stage 9: a HaX `game_loaded` mapping sets it on `m09_sleeper_named && m09_recruiter_offer === 'taken'` | A's core and 06:00; credits |
| `wrong_accusation` | bool, `false` | stays true after a recall | B: any wrong accusation | 06:00, credits |
| `head_start_out` | string, `""` | `none`, `zero_day`, `ghost`, `both` | stage 9 mappings at the outer lock (OT §4.5); **no ink writes it** | A: `arrival`, 06:00, `close_compute`; B: `what_went_out` |
| `partial_release` | string, `"none"` | `none`, `small`, `large`, `published` | A: `console` ("Stop it"), `join_3` | 06:00, credits |
| `media_story_ran` | bool, `false` | | A: wherever `ending` is written (§1.3) | 06:00, credits |

`head_start_out`'s value `ghost` names Ghost's buyers' share in code only; it never appears on a screen or in a line (S6 §0).

### 2.5 Local globals: who writes, who reads

OT §16 and MC §12 are the full inventories; this table adds which **ink file** writes each, and the five globals this contract adds (marked **new**). "Map" means a stage 9 eventMapping writes it (on HaX unless stated); ink only reads it. Bool defaults are `false` unless given.

**Act, doors and clock (written by mappings; ink reads)**

| Global | Type, default | Writer | Ink readers |
|---|---|---|---|
| `raid_clock` | string, `"t0145"` | map only (never ink) | none required; a line that names a time must agree with OT §6's table |
| `flag1_submitted` … `flag4_submitted` | bool | map, on `flag_N_in` | A `core_router`; B hub, `where_are_we` |
| `briefing_played` | bool | Netherton's `setGlobalOnStart` | B hub |
| `briefing_done`, `aside_done` | bool | B `m10_director_netherton.ink` (`briefing`, `aside` last lines) | B Netherton `start`; music; the WREN aim |
| `whodunit_live` | bool, **`true`** | map (`game_loaded`) | A router; B accusation, alibi, signout |
| `whodunit_open` | bool | map (on `aside_done`) | none |
| `door_scene_done` | bool | C `m10_nightshade.ink` (`table`) or B Netherton `tether` | B `start`, hub; C `table` re-entry |
| `gate_console_used`, `split_started`, `pair_back` | bool | map; `split_started` by B Netherton `split_line` | B `where_are_we` |
| `arakawa_call_done` | bool | B `m10_arakawa.ink` (`gate`, last line); map when `arakawa_ko` | none |
| `breach_open`, `inner_door_open`, `stair_open`, `gallery_open`, `outer_lock_open` | bool | map (`door_unlocked_by_npc` / `door_unlocked`) | B hub, `where_are_we`, calls; A none |
| `breach_announced` | bool | map | B Quintero `so` |
| `tripwire_armed` | bool | C `m10_nightshade.ink` (closing choice) | none in ink |
| `tripwire_tripped`, `wren_warned`, `security_alerted` | bool | map | B Kowalczyk and Arakawa staging lines |
| `ladder_used` | bool | map | B `ladder_call` (routing only) |
| `override_held` | bool | the override's `onPickup` | none |
| `plans_read`, `payment_read` | bool | objects' `onRead` | C Nightshade `table` (the check) |
| `forward_post_entered`, `blast_tunnel_entered`, `security_office_entered`, `workshop_entered`, `power_room_entered`, `server_hall_entered`, `gallery_entered`, `core_entered` | bool | map (first `room_entered`) | B `where_are_we`, hub; any `start` router |
| `ghost_call_done` | bool | C `m10_ghost_phone.ink` (last choice) | B `where_are_we` |
| `ghost_watch_on_route` | bool | C Ghost `ghost_call`, first line, on the broken branch with `m02_ghost_keys_used` (OT §16) | C Imran; map (Imran's card uncloneable) |
| `door_log_given`, `signout_read`, `what_went_out_given` | bool | B hub (and `signout_read` by the sheet's `onRead`; `door_log_given` also by the door-log bark's mapping, stage 9) | B hub (`door_log_given` gates the alibi topic) |
| `clue_door_log`, `clue_alibi`, `clue_bench_log` | bool | objects' `onRead`; B `alibi`; C Nightshade's habits line (`clue_alibi`); B Phantom's list (`clue_bench_log`); map at the aside for the shortlist | B hub, accusation gates |
| `casualty_sheet_read`, `margin_note_read` | bool | objects' `onRead` | A exchange 1 (the rebuttal's decoded form); C Voltage talk-down |
| `phone_voice_is_hax` | bool | map | B `shutter_topic` gate |
| `cut_by_hand` | bool | C Wendell `wendell` ("work round him"), C Voltage `escaped` (fight); map on the KOs and Wendell's walk-away | none in ink |
| `cut_step` | int, `0` | `cut_call` (B and C) and Voltage's in-person cut (C) | the same |
| `gallery_shutter_cut` | bool | C Voltage, Wendell, Vance, Elena; B HaX `cut_call` | B `where_are_we`, hub |
| `voltage_print_lifted`, `keypad_dusted` | bool | map | C Voltage `escaped` |
| `backdoor_channel_live` | bool | map (`game_loaded`, from the m07 imports) | A `console` (partial release); B `console`, hub |
| `hax_jammed` | bool | map | B `start` |
| `at_keypad`, `lock_guard_challenged` | bool | map; `lock_guard_challenged` by C Fonoti `challenge` | C Fonoti |
| `lock_guard_known`, `gallery_rota_read` | bool | `gallery_rota`'s `onRead`; C Ghost (card answer), Victoria (`walked`), Vos (`bought`), each with a `~` assignment (§2.1), not OT's `#set_global` | C Fonoti |
| `core_greeted`, `flag4_heard`, `case_heard` | bool | A `tesseract` | A router |
| `wren_entering`, `wren_stopped`, `quintero_enters_core` | bool | A `tesseract` | A; the core copies' mappings |
| `six_done`, `closing_done` | bool | A closing scenes (last lines) | the closing mappings, music |
| `vector_on_team`, `phantom_on_team` | bool | map (`game_loaded`, one per arm of FA row 112) | B Netherton briefing, accusation list |
| `guide1_offered` … `guide4_offered` **new** | bool | map, on the first use of each stage's console (gate console for 1; hall console for 2, and for 3 once `flag2_submitted`; the core's VM console for 4) | B `field_guide` |
| `guide1_given` … `guide4_given` **new** | bool | B `field_guide` | B hub |

**Decisions** (MC §12; values exactly as listed there)

| Global | Type, default | Writer (file, knot) | Readers |
|---|---|---|---|
| `quintero_stance` | string, `""` (`quintero` / `netherton`) | B Netherton `briefing` | B Quintero `lock`; A 06:00 |
| `nightshade_taken_in`, `payment_checked`, `nightshade_map_used` | bool | C Nightshade `table` | B Quintero `lock`; A 06:00, `van`; map (tripwire, lock copies) |
| `nightshade_deal` | string, `""` (`refused` on the arrested branch's first line / `taken`) | C Nightshade `table` | B Quintero `lock`; A credits via S6 |
| `nightshade_tethered` | bool | B Netherton `tether` | B calls, staging lines; C Nightshade `blast`; A `double_cross_open` |
| `ghost_sale` | string, `""` (`stopped` / `bait` / `selling`) | C Ghost `ghost_call` (first line, then the pick) | B `console`; map (share display) |
| `ghost_gift` | string, `""` (`code` / `card`) | C Ghost | C Fonoti; map (bark) |
| `ghost_answer` **values fixed here** | string, `""` (`not_why` / `card_unsigned` / `ask_them` / `hospitals` / `trust`) | C Ghost | map (Ghost's 06:00 text by value) (superseded: §11 alignment R3-m3/m4) |
| `imran_outcome` | string, `""` (`talked_round` / `taken_in` / `card_cloned` / `ko` / `avoided`) | C Imran, Gary `tech`; map (`ko`, room exit) | A 06:00; map (Farah) |
| `gary_outcome` | string, `""` (`talked_round` / `left_in_place` / `taken_in` / `ko` / `avoided`) | C Gary `tech`; map | A 06:00 |
| `voltage_outcome` | string, `""` (`his_hands` / `by_hand` / `stood_down_print` / `talked_down` / `fought` / `ko` / `avoided`) | C Voltage; map | A 06:00 |
| `wendell_outcome` | string, `""` (`told` / `worked_round` / `ko` / `avoided`) | C Wendell; map | A 06:00 |
| `server_hall_warned` | bool | C Wendell | C Asante, Mercer (map: no draw-off) |
| `gallery_camera_blinded` | bool | the by-hand cut (B or C) | map (monitor guard) |
| `asante_outcome` | string, `"untouched"` (`talked` / `ko`) | C Asante (on the schedule or on confirming the sheet); map (`ko`) | credits |
| `asante_confirmed_sheet` | bool | C Asante | A exchange 1 |
| `victoria_line_deal` | string, `""` (`no_deal` on the call's first line / `deal`) | C Victoria's line | credits |
| `vos_secret_known`, `victoria_line_done` | bool | C Victoria's line; `victoria_line_done` also by map on entering the gallery | C Vos; B `gallery_open_call` |
| `vos_secret_used` | bool | C Vos | map (share display) |
| `victoria_gallery` | string, `""` (`confronted` / `trusted` / `refused` / `talked_down` / `walked` / `arrested_here` / `ko` / `avoided`) | C Victoria; map | A 06:00, `close_compute`, `numbers`; map |
| `vos_outcome` | string, `""` (`stood_aside` / `bought` / `refused` / `ko` / `avoided`) | C Vos; map | `close_compute`; C Fonoti |
| `head_start_killed` | string, `""` (`zero_day` / `ghost` / `trace`) | B `console` | A `close_compute`; map |
| `share_zero_day` | string, `"live"` (`stopped` / `traced` / `released`) | map only | A `arrival`, `close_compute`, 06:00; B `whats_live` |
| `share_resale` | string, `"none"` (`live` / `stopped` / `released`) | map only | B `whats_live` |
| `backdoor_closed` | bool | B `console` | A `console`; map (task) |
| `accused` | string, `""` (`kowalczyk`) | B (hub or Kowalczyk's file) | A router, 06:00; map (staging) |
| `officer_out` | string, `""` (`malhotra` / `quintero` / `arakawa` / `vector` / `phantom`) | B accusation and recall | B `gallery_open_call`, staging; A `wren_beat`, 06:00 |
| `wren_held` **new** | bool | B: a right face-to-face accusation; a right line accusation with Quintero available to send | A router (8), `wren_beat`, `console` |
| `kowalczyk_gone_ahead` **new** | bool | B Kowalczyk (the peel-off line's last line) | map: her later copies stay hidden |
| `kowalczyk_ko`, `quintero_ko`, `arakawa_ko`, `vector_ko`, `phantom_ko` | bool | `globalVarOnKO` on the field copies | A, B (staging lines; "no Quintero" tests) |
| `malhotra_recalled`, `arakawa_recalled`, `quintero_recalled`, `vector_recalled`, `phantom_recalled` | bool | B `recall_*` | credits |
| `fonoti_ko`, `gary_ko`, `mercer_ko` | bool | `globalVarOnKO` | credits |
| `wren_at_core`, `quintero_wounded` | bool | A `tesseract` | A 06:00; credits |
| `kowalczyk_answer` | string, `""` (`bench` / `briefing` / `worked_out`) | B (aside on `taken`; Kowalczyk's file); A (06:00 after a line accusation) | A 06:00 |
| `exchange_1`, `exchange_2`, `exchange_3` | string, `""` (`rebuttal` / `record` / `miss`) | A `exch_n` (knots `exch_1`…`exch_3`) | A; music |
| `points_landed` | int, `0` | A `his_end`, `join_1` (derived by `landed_count()`, never incremented) | A |
| `console_choice` | string, `""` (`stopped` / `joined`) | A `console`, `join_3` | A router; map (task) |
| `join_step` | int, `0` | A `join_1`–`join_3` (the furthest reached) | A |
| `cold_lowered` | bool | A `his_end` | A |
| `hax_asked_database` **new (R2)** | bool, `false` | A `tesseract` `database_menu` ("[HaX. What would you do?]") | A `hearing` (HaX's last line); stage 9 adds it to `globalVariables` |
| `fire_held` **new** (S6-25, taken) | bool | A `his_end` ("[Hold fire.]") | credits: HaX's first clause "Killed his feed in time. Testifying." |

`teaser_enabled` (FA §7) is configuration, default `false`, and no ink reads or writes it.

### 2.6 `ko_pattern()` and `close_compute()`

Four functions in the include. Ink functions can't print in a way the player sees safely and must not carry tags (R2-06), so none of them has text or tags.

**`ko_pattern()`** returns an int: how many earlier missions have at least one bystander knock-out latch set (FA §3.6, 27 names). Add one for each mission whose test holds:

| Mission | Test |
|---|---|
| m01 | `m01_completed and (m01_maya_ko or m01_kevin_ko or m01_sarah_ko)` |
| m02 | `m02_patient_assaulted or m02_receptionist_ko or m02_ward_nurse_ko or m02_raval_ko or m02_gary_ko or m02_dr_kim_ko` |
| m03 | `m03_guard_knocked_out or m03_receptionist_ko or m03_danny_ko` |
| m04 | `m04_security_guard_ko or m04_robert_vance_ko` |
| m05 | `m05_lisa_ko or m05_owen_ko or m05_halloran_ko or m05_patricia_ko` |
| m06 | `m06_guard_ko or m06_trader_ko or m06_analyst_ko` |
| m07 | `m07_elena_ko` |
| m08 | `m08_offduty_agent_ko or m08_analyst_ko or m08_athena_ko or m08_netherton_ko or m08_hax_ko` |

Read in two places only: exchange 3's ledger sting by band (1; 2–3; 4 or more; 0 says nothing), and the clean-first-day answer's gate in exchange 1 (`ko_pattern() == 0`). A table-driven test of it waits for stage 9 (§6.2).

**`door_branch()`** returns a string, the first that holds: `"shown"` on `m08_nightshade_triple_agent and m09_nightshade_shown_file`; `"unshown"` on `m08_nightshade_triple_agent`; `"arrested"` on `m08_nightshade_arrested and not m08_nightshade_ko_before_fate`; otherwise `"silent"` (which covers `m08_nightshade_ko_before_fate` and `not m08_completed`). MC §3.1; RL §2.1's visibility mappings use the same tests, one mapping per arm.

**`landed_count()`** returns an int: how many of `exchange_1`, `exchange_2`, `exchange_3` are `"rebuttal"` or `"record"`. A's `his_end` and `join_1` write `~ points_landed = landed_count()`; nothing increments it.

**`close_compute()`** writes the five close strings by `~` assignment and returns nothing. Called with `~ close_compute()` as the very first line of `six_oclock`, `hearing` and `citadel`, before any text (FA §4.6; S6 §3.1). Every branch assigns all five, so a replayed scene recomputes from scratch.

| Global | Logic (first that holds) | Source |
|---|---|---|
| `close_secure_cell` | only when `database_outcome == "secured"`: `zd_uk` when Victoria's watch survives (`m03_victoria_fate == "recruited"` and (`victoria_gallery == "confronted"` or `"refused"`, or `"trusted"` with `head_start_killed == "zero_day"`)); `procurement` on `m08_nightshade_triple_agent and not m09_nightshade_shown_file`; `crypto` on `m06_monitoring_enabled`; `cm` on `m09_completed and not m09_albion_notified`; else `book`. Not secured: `""` | S6 §3.1 |
| `close_cell_name` | `couriers` on `ending == "surrender"`; else `close_secure_cell` when not `""`; else `bait` on `head_start_killed == "ghost" and ghost_sale == "bait"`; else `trace` on `share_zero_day == "traced" and head_start_killed != "ghost"`; else `reeves` on `m07_completed and m07_team_assignment == "fracture"`; `ashford` on `... == "meltdown"`; `walsh` on `not m07_completed or m07_team_assignment == "trojan_horse"`; else `none` | S6 §3.2 C |
| `close_cells` | `c0`…`c5`: (1 for the console when `bait` or `trace` above holds) + (1 when secured, the cold ending included) + (2 on surrender) + (1 for m07 unless `m07_completed and m07_team_assignment == ""`). Build the string from the count with a fixed `{ n: - 0: c0 - 1: c1 … }` switch; never print the number | S6 §3.1, S6-24 |
| `close_human` | S6 §3.2 U's eleven rows in order (`dispatch_fixing`, `dispatch_dropping`, `albion_full_sent`, `albion_full`, `albion_inquest_sent`, `albion_inquest`, `albion_half`, `fortyseven_late`, `fortyseven_none`, `elena`, `none`). "Austin uncovered" is `m07_completed and m07_team_assignment != "trojan_horse"`; the forty-seven's two conditions are FA §2 row 62's | S6 §3.2 U |
| `close_zero_day` | `vos_named` when Vos held the gallery (`m03_victoria_fate` is `"arrested"`, `"ko"` or `""`) and `vos_outcome != "bought"`; else `trading` | S6 §3.1 |

The card and the credits read these with single `===` tests (S6 §3.2–3.5), shown after the scene closes, so they always see the computed values. A walk-away mid-scene is safe: the `game_loaded` backstop re-opens the scene, which recomputes on its first line.

## 3. Tags and the eventMappings the ink relies on

### 3.1 The tags m10's ink may use

Action tags go on their own line **above** the spoken line they belong to (PASS2 lesson 3), never after a divert that leaves them behind. A tag on its own line attaches to the next line of text, so it must not sit above a `Narrator:` line (`tag-on-narrator`).

| Tag | Where, exactly | Notes |
|---|---|---|
| `#complete_task:take_the_briefing` | B Netherton `briefing`, above the first spoken line | PASS2 lesson 42 |
| `#complete_task:close_the_night` | A `six_oclock` (not on `scorched`), `hearing`, `citadel`: above the scene's last spoken line | the conclusion screen opens the moment it completes (PASS2 lesson 46), so nothing may follow but `#exit_conversation` |
| **No other `#complete_task`** | – | every other task completes by a stage 9 mapping on the global the ink writes (OT §3): `settle_the_table` ← `door_scene_done`; `answer_the_handset` ← `ghost_call_done`; `cut_the_shutter` ← `gallery_shutter_cut`; `use_the_console` ← `head_start_killed`; `close_the_backdoor` ← `backdoor_closed`; `hear_him_out` ← `exchange_3`; `decide_the_console` ← `console_choice`; `decide_the_database` ← `database_outcome`; `decide_his_end` ← `ending`; `check_the_alibis` ← `clue_alibi`; `read_the_bench_log` ← `clue_bench_log`; `name_the_sleeper` ← `accused` / `officer_out` / `wren_at_core` |
| `#give_item:notes:ghost_cupboard_code` / `notes:ghost_lock_code` | C Ghost, kept branch's last line / the hospitals answer | items in `ghost_phone`'s `itemsHeld` (S6 §2.2) |
| `#give_item:notes:vector_cupboard_code` | B Vector `so` | `vector_so`'s `itemsHeld` |
| `#give_item:notes:gallery_code_card` | C Fonoti `talk` (rota, Ghost, Sterling options) | `lock_guard`'s `itemsHeld` |
| `#give_item:notes:vos_code_card` | C Vos, "[Deal.]" | `vos`'s `itemsHeld` |
| `#give_item:notes:nightshade_payment`, `#give_item:key:alarm_override` | C Nightshade (payment on the not-shown branch and the arrested branch's deal, never on shown, S6 §1.10; override on the shown branch only) | `nightshade_table`'s `itemsHeld`; the override's `onPickup` sets `override_held` (stage 9 checks `#give_item` fires it, S6 §6) |
| `#give_item:lab-workstation:<guide_id>` | B `field_guide` | ids from the VM plan; working ids `m10_guide_flag1`…`4` |
| `#clone_keycard:tg_power_room_card` | C Imran (taken in, unless `ghost_watch_on_route`), Gary `tech` (left in place) | the NPC record carries `rfidCard` with that `card_id`; needs the start kit's cloner |
| `#unlock_door:power_room` | C Imran (talked round; taken in on `ghost_watch_on_route`), Gary (`talked_round`, both branches where MC has him open it) | NPC carries `"unlockable": ["power_room"]` |
| `#unlock_door:core` | C Victoria (`confronted`, `trusted`), Vos (`stood_aside`) | NPC carries `"unlockable": ["core"]` |
| `#hostile:<npcId>` | C Voltage (`voltage_power`, and `static_power` with him), Mercer, `victoria_threat`, `lock_guard`, the guards | the id form, never bare `#hostile`, so the right NPC turns |
| `#exit_conversation` | every exit choice and every call knot's end | on its own line, after the NPC's reply (`exit-no-reply`); person-chat exits then divert to a resting knot (PASS2 lesson 21: no `DONE` or `END` in person-chat). Phone threads may end `-> DONE` after `#exit_conversation`, as HaX's does (R-7; m09 contract §7.2 rule 1) |
| `#set_global:<name>:<value>` | allowed, never alongside a `~` for the same write (§2.1) | |

**Not used in m10:** `#add_note` (F21: the notepad throws on it; codes are notes items), `#remove_npc` (hiding is a `setVisible` mapping), `#unlock_task` and `#unlock_aim` (mappings, OT §2), `#trigger_minigame` (the key's confirmation is an ink choice, RL §6 item 45), `#influence*`, and `#speaker:` (prefixes decide the speaker; README_ink_best_practices "`# speaker:` tags: fallback only").

### 3.2 Doors are mappings, not tags

The four story doors (the blast door, the inner door, the stair, the gallery stair) open only by HaX's `unlockDoor` mappings on their done-flag conditions (OT §4). No ink file emits `#unlock_door` for them, and no ink writes `breach_open`, `inner_door_open`, `stair_open`, `gallery_open` or `outer_lock_open`: those come from the unlock events. The ink's part is to write the conditions' inputs (`door_scene_done`, `ghost_call_done`, `gallery_shutter_cut`, and the mappings' `flagN_submitted`) at the right moment, and the holding barks (JSON) say what is missing. The only ink door unlocks are the four person-opened ones in §3.1.

### 3.3 The eventMappings each file needs (stage 9 writes them; the ink assumes them)

| NPC | Event and condition | Opens or writes |
|---|---|---|
| `director_netherton` | `timedConversation` on `game_loaded`, `skipIfGlobal: briefing_played`, `setGlobalOnStart: briefing_played` | his `start` (→ `briefing`) |
| `director_netherton` | the second of `door_scene_done` and `gate_console_used`, with `!split_started` (`delayMs: 1500`); catch-ups on `game_loaded` and `door_unlock_failed:blast_tunnel` | knot `split_line` |
| `arakawa_gate` | `conversation_closed:director_netherton` with `split_started && !arakawa_call_done && !arakawa_ko`; catch-ups as OT §6 | reveal, then knot `gate` |
| `agent_0x99` | the seven calls (§4) | their call knots |
| `agent_0x99` | `object_interacted`, `data.objectName === 'Release Console Controls' && data.roomId === 'server_hall'`, with `flag2_submitted === true && !hax_jammed`, `cooldown: 0` | `phone-chat`, knot `console`, not voiced |
| `ghost_phone`, `victoria_line`, `vance_phone`, `elena_phone` | §4 | `ghost_call`, `victoria_call`, `cut_call` |
| `tesseract` | `room_entered:core` with `!core_greeted` (`delayMs: 800`); `global_variable_changed:flag4_submitted` (`delayMs: 1500`) | `core_router` |
| `kowalczyk_core_waiting`, `kowalczyk_core`, `quintero_core` | reveal and hide on `wren_entering`, `wren_stopped`, `wren_at_core`, `quintero_enters_core` (RL §2.8) | staging |
| every `kowalczyk_*` field copy | hide on `kowalczyk_gone_ahead`, `accused === 'kowalczyk'`; never shown on `m09_recruiter_offer === 'double_crossed'` or `'taken'` (stage 8 SA M3) | staging |
| `kowalczyk_van` | shown on `game_loaded` with `globalVars.m09_recruiter_offer === 'taken'` (cuffed; stage 8 SA M3) | staging |
| `agent_0x99` | `game_loaded` with `globalVars.m09_recruiter_offer === 'taken'`, and a second with `=== 'double_crossed'`: `setGlobal whodunit_live: false` (stage 8 SA M3; without it a `taken` save can enter `wren_beat`) | globals |
| `agent_0x99` | `global_variable_changed:aside_done` with `value === true && globalVars.m09_sleeper_shortlist && !globalVars.m09_sleeper_named && globalVars.whodunit_live`: `setGlobal clue_alibi: true` (the shortlist replaces clue 2; FA §4.4; stage 8 SA M3) | globals |
| `agent_0x99` | `global_variable_changed:six_done` with `value === true`, forward-only guard: `setGlobal raid_clock: 't0600'` (stage 8 M-3, ruling 16; not on the 06:00 scene's open) | globals |
| `tesseract` | `conversation_closed:tesseract` with `globalVars.ending` `scorched` / `joined` / `arrest` / `surrender` (one mapping per value, plus `game_loaded` copies): hide; on `lethal` and `executed` hide or a down pose (stage 8 m-8; RL §2.8) | staging |
| barks and texts | every row of `texts/BARKS_AND_TEXTS.md` (stage 8 M-5) | barks, texts |
| `lock_guard` | `player_spotted:lock_guard` (the cracker closing in his cone) | knot `challenge` |
| the guards with `challengeOnSight` | `player_spotted:<id>` | their knot in `m10_guards.ink` |
| `six_oclock`, `hearing`, `citadel` | OT §4.7 (on `conversation_closed:tesseract` by `ending`, `!closing_done`, `onceOnly`; `hearing` on `six_done`; `game_loaded` backstops) | their `start` |
| `agent_0x99` | the share display, the head start, the clock, the task completions, `whodunit_*`, `guideN_offered`, `<room>_entered` | globals only |

Every person-chat mapping that opens a knot names it with `targetKnot`; a copy's normal click uses its `currentKnot`.

## 4. Voiced calls

### 4.1 The rule (F17, F20; FA §6.1; OT §13)

A voiced call voices the knot its mapping names (`targetKnot`, on a mapping with `voiced: true`) and every knot reachable from it through diverts, tunnels and choices, **but never the contact's home knot** (its `currentKnot`, default `start`) or anything reached only through it. So:

1. **Every voiced mapping names a `targetKnot` that is not the home knot**, ring and re-ring alike, and carries its own `voiced: true` (stage 9). Every home knot in m10 is `start`.
2. **Every call knot ends `#exit_conversation`** and never diverts to `start`, `support_hub` or any hub topic. A hub topic that reuses a call knot (HaX's "[Talk me through the shutter.]" → `cut_call`) exits after it too; under F20 it is voiced from the hub as well, which is fine.
3. **No narrator lines in a voiced call.** Narration there is silent and reads as a gap. What a narrator would say becomes the caller's line or a second speaker's on the net (the crank is Nightshade's "Manual."; the ladder is HaX's own lines).
4. **No printed variables in a voiced line.** Choose between fixed strings with conditionals.
5. **No "Where were we." lines under `resume: true`**: a resume re-enters no knot, so such a line would never play (FA §13 10-10). Calls with `resume` simply continue.
6. **At most one non-HaX voice on the line per room** (FA §4.0, R3-01). Netherton, Malhotra and Nightshade on HaX's channel count as hers.
7. Phone lines hold to 25 words (dialoguelint's phone cap; until stage 9 binds each file to its NPC, the lint applies the 30-word person cap, so writers hold the phone cap themselves).

### 4.2 The calls

| Call knot | File (group) | Contact, home knot | Rings on (stage 9) | `disableClose` / `resume` | Speakers | Approx. lines |
|---|---|---|---|---|---|---|
| `breach_call` | `m10_phone_agent0x99.ink` (B) | `agent_0x99`, `start` | `global_variable_changed:breach_open` | false / none | HaX; Netherton; Nightshade on the tether | 4–5 |
| `inner_door_call` | B | `agent_0x99`, `start` | `inner_door_open` with `!ladder_used` | false / none | HaX | 1 |
| `tripwire_call` | B | `agent_0x99`, `start` | `tripwire_tripped` | false / none | HaX | 1 |
| `ladder_call` | B | `agent_0x99`, `start` | `inner_door_open` with `ladder_used` | false / none | HaX | 2 |
| `stair_call` | B | `agent_0x99`, `start` | `stair_open` | false / none | HaX | 1 |
| `gallery_open_call` | B | `agent_0x99`, `start` | `gallery_open` (the global) | **true** / none | HaX | 7 |
| `cut_call` (HaX) | B | `agent_0x99`, `start` | `cut_by_hand` (HaX arm); re-ring on `room_entered:power_room` and once on `conversation_closed:agent_0x99` (`cut_by_hand && !gallery_shutter_cut && phone_voice_is_hax`) | false / **none** (routes on `cut_step`) | HaX | 8 |
| `cut_call` (Vance) | `m10_vance_phone.ink` (C) | `vance_phone`, `start` | `cut_by_hand` (Vance arm); re-ring on `room_entered:power_room` | false / true | Robert Vance | 8 (shipped 10) |
| `cut_call` (Elena) | `m10_elena_phone.ink` (C) | `elena_phone`, `start` | the same, Elena arm | false / true | Elena Rodriguez | 8 (shipped 10) |
| `ghost_call` | `m10_ghost_phone.ink` (C) | `ghost_phone`, `start` | `object_interacted` on the duty handset, `!ghost_call_done`, `cooldown: 0` | true / true | Ghost; HaX once (the bait's cost) | 33 (shipped 26) |
| `victoria_call` | `m10_victoria_line.ink` (C) | `victoria_line`, `start` | `flag2_submitted` (`m03_victoria_fate === 'arrested' && !victoria_line_done && !hax_jammed`); re-ring once on `conversation_closed:agent_0x99` after `gallery_open_call` | false / true | Victoria Sterling | 9 (shipped 7) |
| **Total** | | | | | | **about 80** (shipped after R1: HaX's calls 28, Ghost 26, Vance 10, Elena 10, Victoria 7; **81**) |

Every HaX call mapping also carries `!hax_jammed` and `delayMs: 1500`, so a call never opens over a conversation, a flag station or the gallery (OT §13 rule 5).

### 4.3 HaX's guarded resume knots

HaX's calls never use `resume` (FA §6.1, "HaX's forced calls re-ring to a guarded knot"): she hosts several calls and a hub, so a saved position could belong to another call. Her door calls and `gallery_open_call` are lines only, with no choice to leave unanswered, so a re-open simply replays them; `gallery_open_call` has `disableClose: true` and always plays out. **Her one call with choices is `cut_call`**, and it is its own guarded resume knot: it opens with `{gallery_shutter_cut: …}`, then routes on `cut_step` (§1.6), so a re-ring, the hub topic or a reload lands on the first unanswered step and never on a choice already made. The C9 console knot (`console`) is a text conversation, not a call: it re-opens on each click and shows only the choices still open (`head_start_killed == ""`, `not backdoor_closed`).

Forced scenes of other contacts (Ghost, Victoria, Vance, Elena) each have one call, so `resume: true` restores the right place; their knots still name a `targetKnot` for the first ring and the no-saved-story case.

### 4.4 HaX's voice in Tesseract's conversation

HaX's lines at the core (her return, her flag 4 lines, her lines in the case, the exchanges, the console, the database and the endings) are **second-speaker lines inside `m10_tesseract.ink`**, prefixed `Agent HaX:`. There is no phone call at the core: opening a call would end his open person-chat (OT §4.6 step 4; milestone A7). These lines are voiced as a face-to-face scene and are not counted in §4.2. Netherton on the line at the core is the same: `Director Magnus Netherton:` lines inside his conversation.

### 4.5 Text, not voice

Unvoiced, and outside these call knots: HaX's hub and every topic; her barks (the holding barks, the power-room reader, "Lost you up there. I'm back.", the handset bark); the slot voice's cost text before Wendell's menu; Ghost's mid-call text on `m02_ghost_keys_used` (a held toast); every 06:00 text (Ghost's by `ghost_answer` or `ghost_sale`, the Recruiter's on `double_crossed`, HaX's later message on `executed`); the gallery's guard barks; Tesseract's idle lines. Writers settle any of their wording in the report; stage 9 puts them in JSON. (superseded: §11 alignment R3-m3/m4)

After writing, each group recounts its voiced lines (calls only) with `node scripts/ink_runtime_check/voicelines.mjs <file.json>` on its call files and reports the count against this table.

## 5. Writing rules

### 5.1 Plain writing (the user's rules)

Everything a player reads or hears follows the user's style rules in `~/.claude/CLAUDE.md`, and dialoguelint flags most breaches. In short: no inflated framing ("pivotal moment", "testament to", "stands as"); none of the banned words (delve, intricate, tapestry, pivotal, underscore, landscape, foster, enhance, crucial, breathtaking, captivate, profound, steadfast, robust, load-bearing, and the lint's longer list: leverage, navigate, valuable, additionally…); no summing-up lines; at most one or two "However"/"Moreover"-type transitions in a file; no "It's not X, it's Y" and no two-sentence "Not X. Y." (a villain may keep one per scene, §5.6); em dashes only where a comma or brackets won't do; no fake spectrums; no "It's important to note"; no trailing "-ing" tag clauses; vary sentence length. People in a TV thriller say less than they mean; nobody states the theme (SE §1).

**Pacing** (07 prompt): three lines at most from one speaker before the player gets a choice; four for a dramatic reveal; five in the opening cutscene. One to two lines is the norm. Dialoguelint's caps: 30 words a face-to-face line, 25 a phone line, 15 a choice.

**Choices.** Brackets carry the player's actual words, first person, each with a different consequence or stance; no `You:` echo; menus written by MC's kind labels (dilemma, puzzle, stance, task, information, hub; MC rule 1.12). A choice can only quote or answer what the player has heard on this route: check every choice against every way into its knot. A spoken goodbye always gets a reply. Hubs end on a sticky exit, retire spent topics, and show at most ten choices at once.

### 5.2 Which English

UK English for SAFETYNET and everything the player's side says or writes: HaX, Netherton, Malhotra, Kowalczyk (West London, with her family's vowels), the narrator, every choice, the credits ("Cyber Security" with a space where it appears). **US English** for the American characters' own words: Quintero (West Texas), Arakawa (Pacific Northwest), Wendell (rural Montana), Fonoti (Utah), the bunker's guards, Mercer, and the bunker's paperwork (roster, data center). Others keep their own: Tesseract an unplaceable educated English (UK spelling), Asante South London, Imran Birmingham, Vos Dutch-accented English (UK spelling), Victoria, Gary, Ghost, Voltage, Static, Vance and Elena as in their missions (SE §4). Spelling follows the speaker; times are UTC everywhere, said the way the speaker would ("ten past two", "oh-two-ten" for the van team).

### 5.3 Tesseract's voice (SE §2.1; m07)

The m07 voice without the distortion: short, exact, unhurried; he finishes his thoughts, as a teacher does with a student he rates. Most lines under fifteen words; his case may run to twenty-five, never more. No jargon. One image per scene at most. He grades ("Better." / "That's a slogan." / "Closer."), asks questions he knows the answer to, uses numbers exactly and never rounds aloud in his own favour. He calls the player "Agent" or "0x00", HaX "Ninety-nine" (nobody else does), and Kowalczyk "Halina" once. Courteous to the end: he never interrupts, raises his voice, gloats or apologises, threatens nobody but the player (once, as a courtesy, on surrender), and never says "you don't understand", "join me" or his motive as a speech. When he concedes he gives up exactly what was proved. His `*pause*` on a landed point is the scene's one repeated cue. "Let it hurt afterwards, not during." is his, said once, in exchange 3. "Afterwards" is said at most twice in a run (his exchange 3 line and HaX's "It's afterwards." on arrest; on Scorched Earth only his card says it).

### 5.4 The argument: slots, order and button lengths (MC §6.3; SE §2.3)

- Each exchange is one menu of **four fixed slots in a fixed order**: the rebuttal, the evidence decoy and the two record slots, with the plain decoy filling the first empty record slot. A record answer placed under the wrong claim goes after slot 4. Empty slots close up.
- **On a cold start** the three menus read [decoy, **rebuttal**, decoy], [**rebuttal**, decoy, decoy], [decoy, decoy, **rebuttal**]. Keep the slot order that produces this; the pools only change which record answers fill slots 3 and 4.
- **Record pools hold at most two candidates, most specific first** (MC §6.3's table). Each record answer shows only when its import holds (with `mNN_completed` where the default would lie).
- **Button lengths:** every button in a menu within a few words of the others; no length tells. The rebuttal is neither the longest nor the shortest button in more than one of the three exchanges (SE §2.3; the decoy in exchange 1 is twelve words, R4-04). All choices under fifteen words.
- **Decoys never answer the words he has just said**; each answers an earlier or different claim (R3-02). An evidence decoy cites something found tonight; the plain decoy is about him, not the claim.
- **His responses:** a landed answer gets the pause (first time only, the narrator's "He looks at the console for a long moment."), then a concession of exactly what was proved; a miss gets an immediate dry line from his range, never repeated in a run (SE §2.1). Ledger stings (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`, and `ko_pattern()` in exchange 3) play before his response and decide nothing.
- Claims 2 and 3 open on the exchange before: three openers each (landed rebuttal, landed record, miss), so he never concedes what wasn't proved.
- What the point count buys is said before the end-for-him menu (MC §6.3): two or more, he stands with empty hands and offers cooperation; fewer, he stays seated and the arrest has a dangerous moment. Neither is a failure.

### 5.5 Signposting the dark choices

**The cold ending** (MC §6.6, §8.3): the button names the act and his posture ("[Shoot him where he sits.]" / "[Shoot him where he stands.]"), always the last option, on both menus; no other button in the scene uses "shoot", and "[Fire.]" shares no word with it. Then the narrator's warning, word for word: "His hands are empty and in plain sight. He isn't moving. If you fire now, it's an execution, and HaX is on the line." Then "[Do it.]" / "[Lower the weapon.]"; lowering returns to the menu without the cold option ("You lower it. He hasn't moved."). The shot is one line: "He is still looking at you when you fire." Nothing from him; nobody sums it up. It can't be reached by a misclick, a knock-out, the clock, a failed talk-down or any import.

**Join** (MC §6.7; FA §4.3): three deliberate steps, each offering the way back; the casualty figure said once, at step 1; HaX's "0x00. Don't." at step 2; the confirmation is the only button that sets the ending. Imports change how warmly he makes the offer, never the signposting.

**The justified shot** is offered only in the reach beat on fewer than two points, after HaX's flag 4 fact ("I can try to kill the feed. Try."). Holding fire always works; nothing tells the player so.

### 5.6 Violence, and the finale's standing rules

- **Violence is a line** (FA §1.6; SE §1): knock-outs; each shot one narrated line; Quintero wounded at most (a shoulder), never killed; no gore, no lingering, TV level.
- **WREN** has no pronoun anywhere before the accusation (or the reveal on `taken` / `double_crossed`); nobody genders the player.
- **"The plant"** is never used for the room ("the power room") or for WREN ("WREN", "the sleeper"), and is kept off the machinery too ("generators", "switchgear").
- **A cut shutter is "dead"**, never "down" (B-04), in every voice.
- **Netherton's full forms** carry his weight ("I am keeping him", "cannot", "that is"); contractions only in quick asides (R-2).
- **UTC only**, never local time; every spoken time matches OT §6's countdown table (for example "It's set for four" after flag 2; "Fifteen minutes to their head start" leaving the hall at 03:45).
- **One villain "Not X. Y." per scene**, and none from anyone else.
- **Asterisk cues** at m01's density (about one per 37 spoken lines), mid-line or behind a prefix, never starting a line and never on a line with a number or code (`emote-as-choice`, `stage-cue-in-info`).
- **Names said once**: "Ninety-nine" is his alone; HaX answers "Still HaX." once; he says "Halina" once; Kowalczyk says "Adrian." once.
- **"His console" or "the key console"** in the core, never "the release console" (that is the server hall's).
- **"Ghost"** never appears on a screen, the card or a credit; the console's catch is "the resale share", m07's cells are named by their leaders, never "Ghost Protocol".
- **No eldritch content** anywhere; the teaser slot is the user's and stays empty.
- **Every knock-out case is written** (SE §9): a downed slot-holder or raid member leaves a line or a prop that admits it, in the scene that would have had them.
- **The cold start reads cold** (FA §13 item 16): a player whose first mission is m10 must follow every line, including the van and "our mole" on `not m08_completed`.
- **SAFETYNET canon** (PASS2 lesson 39): no arrest powers, no legal cover; agents detain and hand over. "Under arrest" is the team's word for detention; nobody cites an Act or a sentence.

### 5.7 Lengths at a glance

| Scene | Target |
|---|---|
| Briefing cutscene and aside | about 5 minutes (OT §8), spine only |
| Each slot scene | 2–3 minutes, one decision after the talk |
| His case | about 2 minutes; the Recruiter beat 30 seconds |
| Each exchange | about 2 minutes |
| 06:00 | about 5 minutes; walkabout lines one each |
| The ending's own beat at the core | about 1 minute |

### 5.8 Stage 7 handover items, settled here

FA §13's stage 7 rows, each with where it lands. "Wording" means the writer writes it inside the stated limits.

| Row | Settled as | Owner |
|---|---|---|
| B1 F20 in the ink | §4.1 | B, C |
| B2 HaX's guarded resume knots | §4.3: `cut_call` routes on `cut_step`; her other calls are lines only | B |
| B3 closing card and credits | the card and the four sections are S6 §3's data, copied by stage 9; stage 7 adds the SAFETYNET and In memory sections (§5.9) | A |
| B4 rules carried | §5.6 | all |
| B5 no `\|\|` in JSON | §2.1; `close_compute` | A |
| 10-1 voiced calls; "Manual."; Quintero's door line; m09's `alpha_tapes` line | §4.2; "Manual." is Nightshade on the net in `breach_call`; "I don't like doors that know your name." is Quintero's in `quintero_so` on `breach_announced` (in person, so it doesn't add a voice to the call); "The best lock there is. Tape two." closes `breach_call` on `alpha_tapes` | B |
| 10-2 Ghost's refused branch | §1.5 Ghost; Ghost's 06:00 text is JSON by `ghost_answer` (refused: by answer) and `ghost_sale` (selling branches) | C (superseded: §11 alignment R3-m3/m4) |
| 10-3 the lock guard's ink | §1.5 Fonoti; the pointer bark is his, first person, JSON | C |
| 10-4 the power room | the cost text is JSON (OT §4.9); the cut shape is §1.6 | C, B |
| 10-5 staging lines | per RL §2.9 in each raid file; the Malhotra-out cost is `gallery_open_call`'s static branch; Victoria's call after `gallery_open_call` closes, with HaX's "Sterling's still on the line…" ending that call | B, C |
| 10-6 `core_router` | §1.3; "Take your time…" in `arrival`; "Get on his box. He'll keep." is HaX's; the speaker answer and `should_have_told` in exchange 3's slot 2 with HaX's unasked line before the menu; the captured-Voltage quote at HaX's return; idle lines as barks | A |
| 10-7 globals | §2; `raid_clock` never in ink; `ending` and `database_outcome` written before any ending beat | all |
| 10-8 the hub | §1.4; "[What went out?]" gated `outer_lock_open and not hax_jammed and not what_went_out_given`; dialoguelint `crowded-hub` on the busiest save | B |
| 10-9 06:00 | §1.3 `six_oclock`; the forty-seven as a fixed beat on `kept` and `denied`; Quintero's unhurt line on the double-cross and `alpha_tapes`; the Recruiter's text is JSON from `recruiter_phone` | A (superseded: §11 alignment R3-m3/m4, R4-m7) |
| 10-10 resume lines | §4.1 rule 5 | B, C |
| 10-11 wording left open | **"Who changed the code?"** is retired; the lock guard's bark "Who gave out the code?" on `door_unlocked` with `ghost_gift === 'code'` (OT §4.5) is the only form. **The aside on the double-cross**: Netherton and HaX at the van end, no whodunit and no "find them": one line that she has gone where he is and the player will meet her there, one from HaX at most; no shortlist or paper line. **HaX's `letters` line**: a bark on the first read of `uplink_printer` with `m09_cage_bin === 'letters'`: "Tran's handler is on that rota. He's in the Helena letters." (m09 S6 §6.3). **Knocked-out raid members at the forward post**: one Netherton line in `numbers` when any raid member was knocked out, naming nobody; the credits carry each person. **The Arakawa-out deputy**: Netherton's "Sheriff's asking who the road's closed for. I've told him to wait." as a HaX text (JSON) on the first room entry after `officer_out` becomes `arakawa`; no deputy NPC. **Rows 32–33's exit**: Victoria and her talked-down self leave "back down the gallery stair", past the player. **The split line without Kowalczyk** (`taken`, `double_crossed`): Netherton sends Quintero with a minder. | A, B, C |
| 10-12 §13 line items 2, 4, 5, 11, 14, 20, 21, 24, 26, 32, 33 | each lands in the knot that §1.3–1.5 assigns to its beat; MC and SE hold the content | all |
| 10-13 `close_compute` | §2.6 | A |
| 10-14 stage 6's lines | Hollis: a HaX bark on reading `duty_board` with `m06_assets_seized && m07_hollis_resolved === 'evaded'`: "Stood down for the budget. Your freeze kept him home tonight." The payment check option: S6-16's wording, C. "Fonoti" in Ghost's, escaped Victoria's and Vos's lines, C. "Copy just the code.": a HaX bark after the margin pointer, B. `fire_held`: taken (§2.5). **"D. Varga" on the server-hall rota**: the rota clipped to `uplink_printer` gains "D. Varga" (Tran's handler, m09 S6 §6.3) so HaX's `letters` line points at a name the player can see; a readable string, so **stage 9** adds it to the printer's text and variants | A, B, C, stage 9 |

### 5.9 The SAFETYNET and In memory credits sections (orchestrator ruling, FINALE_DEV_LOG "Fold (m10 stages 0–5)")

They ship. Group A writes them as JSON in `scenarios/m10_full_disclosure/credits_sections.json`, in the committed F14 `section` format (README "Closing card and credits"; `public/break_escape/js/music/closing-sequence.js`), for stage 9 to place in each entry E1–E6 after ELSEWHERE and before the production credits:

- **SAFETYNET** (arc §11.3 item 4), a `section` with `people`: Director Magnus Netherton; Agent HaX; the raid team on this save (Quintero, Arakawa, Malhotra, and Vector and Phantom on `vector_on_team` / `phantom_on_team`); a wrongly accused officer never recalled is still listed; **last**, "Halina Kowalczyk, 'WREN'" (her Initiative codename under SAFETYNET's heading is the sting). Names are in capitals, and the raid team's agents go by designation (`DIRECTOR MAGNUS NETHERTON`, `AGENT HAX`, `AGENT 0x2D 'ANCHOR'`, `OFFICER KENJI ARAKAWA`, `AGENT 0x23 'VECTOR'`, `HALINA KOWALCZYK, 'WREN'`). Each person gets one short clause, first that holds, ending on an unconditional clause where they must always appear. Quintero's first clause, on `quintero_ko`, is "Raid lead. On her feet by Friday, and asking questions." (R2), ahead of the wounded clause. Kowalczyk's clauses, in order: on `double_crossed`, "Former breaching lead. Walked off the apron in Helena. Taken at the core."; on `sleeper_caught`, "… Badge returned."; on `wren_at_core`, "… Stopped at the core with her hand out for his key."; on `kowalczyk_ko`, "… Woke in the second van. Nobody had named her."; otherwise "… Badge still active." (A-02: never the only clause). Clauses state an outcome, never the choice that caused it, and never repeat a line from IN THIS OPERATION. On E6 (Join), the section is Netherton, HaX and the raid team only, with a clause each that fits the Citadel ending.
- **IN MEMORY**, a `section` with `lines`, unconditional on every entry: "Agent 0x19 Callum Fraser." and "Agent 0x6B Ana Lúcia Ferreira." (FA §5; the two agents killed at the unanswered m07 sites). Nothing else: no epithet, no date.

Every condition uses `globalVars.<name>`, `!`, `===`, `!==` and `&&` only (§2.1). No character from S6 §0's coded-string list in any string. The player is "0x00", never "you". Stage 9 checks the file parses as JSON and that each section prints on every save that should show it.

## 6. Checks each writer runs, and what waits for stage 9

### 6.1 Before a writer reports

Run from the repo root. Paste the summary of each into the report; "should pass" is not a result.

1. **Compile:** `./scripts/compile-ink.sh m10_full_disclosure`. Every file compiles, including the include. Zero `END` warnings: no `END` or `DONE` in person-chat files (PASS2 lesson 21). Phone threads may end `-> DONE` after `#exit_conversation` (R-7; m09 contract §7.2 rule 1), and the script's `END` warning on them is expected. Treat inklecate's "apparent loose end" warnings as bugs (README_ink_best_practices).
2. **Dialogue lint:** `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m10_full_disclosure/` (or list your own files: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m10_full_disclosure/ink/m10_<name>.ink …`; `--json` for machine output). It always exits 0, so read it. Clear every `error`; clear or justify every `check` and `warn` in the report (`voiced-variable`, `emote-as-choice`, `choice-fallthrough`, `blank-reentry`, `tag-on-narrator`, `phone-self-prefix`, `exit-no-reply`, `crowded-hub`, `not-x-but-y`, banned words, `stage-cue-density`). Until stage 9 writes the scenario, every file shows as `[person, unmapped]`, so the lint applies the 30-word cap to phone files too: hold phone lines to 25 words by hand.
3. **Runtime walk:** `node scripts/ink_runtime_check/inkcheck.js scenarios/m10_full_disclosure/ink/<file>.json <knot> [VAR=value …]` from every entry knot this contract names for your files (each `currentKnot`, each call knot, each mapping's `targetKnot`), at least twice: a cold start (every import at its default, `mNN_completed` false) and one rich save that turns on the imports your file reads (for example `m09_completed=true m09_recruiter_offer=named m08_completed=true m08_nightshade_triple_agent=true`). Group A also walks `core_router` from each resume state (set `core_greeted`, `flag4_heard`, `case_heard`, each `exchange_n`, `console_choice`, `database_outcome` in turn) and `six_oclock` once per `ending`. No runtime errors, no unreachable content you meant to reach.
4. **Hubs that loop:** `node scripts/ink_runtime_check/loopcheck.js <file.json> <knot>` on every re-enterable hub: HaX's `support_hub`, Netherton's `hub`, `hax_post`'s hub, `six_oclock`'s `walkabout`, and each raid file's resting knots. No hub may empty out.
5. **Voiced lines:** `node scripts/ink_runtime_check/voicelines.mjs <file.json>` on each file with a call knot; report the call-knot counts against §4.2, and confirm by eye that no call knot prints a variable or a `Narrator:` line.
6. **Greps:** no `VAR` in your files except prefixed file-locals (`grep -n "^VAR" scenarios/m10_full_disclosure/ink/m10_<name>.ink`); no `raid_clock` write; no `#add_note`; no `#set_global:<name>:<digits>` for a string global; no write to any `mNN_` import; every `#give_item` id is one in §3.1.
7. **Cross-read:** read the lines other groups wrote in your characters' voices (§1.2, §1.6), and send corrections through the orchestrator rather than editing their files.

### 6.2 What waits for stage 9 (or the browser)

- **The scenario itself**: `scenario.json.erb`, `globalVariables` and `importGlobals` from §2, the seven `exportGlobals`, every eventMapping in §3.3 and §4.2, the barks and texts the writers' reports list, the countdown variants, and the closing card and credits from S6 §3 plus `credits_sections.json`.
- **Validator**: `ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb`, including whether its ink scans (dead `VAR`, undeclared `#set_global`, imports written) read through `INCLUDE` correctly; no mission has used `INCLUDE` before.
- **Dialoguelint again** once the erb binds each phone file to its NPC (the 25-word phone cap and `phone-self-prefix` then apply properly), and on the scenario's timed texts.
- **`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`** (needs an m10 entry) for every phone contact's reopen behaviour, especially HaX after each call and `cut_call`'s re-ring.
- **`node scripts/ink_runtime_check/tagdiff.mjs`** from the first commit of the ink on, for every later rewrite (AGENTS.md "Verifying work").
- **The `ko_pattern()` table-driven test** on seeded saves (FA §3.6), and a check that `close_compute()` gives the five strings S6 §3.2's examples expect.
- **Browser checks** OT and RL list: `delayMs` holding HaX's calls until a minigame closes; Tesseract's `flag4_submitted` mapping opening `core_router` after the flag station closes; the lock guard's challenge as the cracker closes; `#give_item` firing the override's `onPickup`; the reveal and hide of every raid-team copy on each branch; the closing chain on all six endings, with one credits roll each.
- **Voice audio**: only after the dialogue is signed off (tts-audio skill); the spoken-line list from `voicelines.mjs` and the person-chat files.

## 7. Open items for the orchestrator

Decisions this contract made where the design left room, and the things it could not settle. None blocks 7b.

1. **`||` in credits conditions.** `README_scenario_design.md` "Closing card and credits" says card and credits conditions are JavaScript and that `||` and parentheses work there; FA §13 B5 and S6 §0 rule `&&` only for the close. This contract keeps the stricter rule (it is never wrong). Either the README sentence or the ruling should change so the two agree.
2. **The include declares every scenario global**, not only the imports FA §3 assigns it. Reason: `close_compute()` reads locals, and ink rejects a `VAR` declared twice in one compiled story, so locals declared per file would clash with the include in every file that reads them. Consequence: `m10_carryover_vars.ink` is the one place to add a global.
3. **New globals** (fold into OT §16 and MC §12 at the next fold): `guide1_offered`…`guide4_offered`, `guide1_given`…`guide4_given` (field-guide gating, named the way OT §5's exposure gate needs), `wren_held` (WREN held before the core; needed because a right line accusation with no Quintero sets `sleeper_caught` but still lets her reach the core), `kowalczyk_gone_ahead` (the peel-off; RL §2.9 says her copies hide after it but names no global), `fire_held` (S6-25's optional global, taken). Also `ghost_answer`'s five values, which MC §12 left as "one value per answer".
4. **Displaynames to confirm at stage 9** (§1.2 †): Kowalczyk `Agent 0x5E 'Lantern'`, Quintero `Agent 0x2D 'Anchor'`, `Officer Kenji Arakawa`, `Officer Dev Malhotra`, Voltage (`Voltage (Critical Mass)` as m04, or SE's `Voltage`), `Minder`, `Guard`.
5. **Field-guide item ids** are working names (`m10_guide_flag1`…`4`) until the VM plan fixes how many guides there are and their ids.
6. **Imran's card on `ghost_watch_on_route`.** The design makes his card uncloneable on that save; an NPC's `rfidCard` is static data, and the cloner may work on him directly whatever the ink says. Stage 9 needs a way (a second Imran record without `rfidCard`, shown on that save, is one). The ink side is settled: on that save the taken-in branch uses `#unlock_door:power_room` instead of `#clone_keycard`.
7. **Wording this contract settled in place of a design document** (§5.8 row 10-11): the double-cross aside's content, the split line without Kowalczyk (Quintero with a minder), one unnamed Netherton line for knocked-out raid members, the Arakawa-out line as a HaX text, the retirement of "Who changed the code?". The script editor at 7c should read these first.
8. **06:00 carries five other characters' voices** (Quintero, Kowalczyk, Nightshade, the Act 2 slot-holders). Group A writes them; groups B and C cross-read (§6.1 step 7). If the orchestrator would rather move the walkabout's lines to their owners, B and C can write a `walkabout_<person>` knot set in A's file, but two writers in one file is the riskier option.
9. **No INCLUDE precedent.** The validator, dialoguelint and `voicelines.mjs` have never seen a mission that includes a shared file. Dialoguelint parses `INCLUDE` as a declaration (checked); the others are stage 9's to confirm (§6.2).
10. **Line estimates** in §1.1 are for balancing and come from the design's scene sizes and m07/m08's file lengths, not from a draft. If one group runs more than a third over, the orchestrator can move Asante and Mercer (C) or the minders and Malhotra (B) without touching any interface in §2.

## 8. Script edit R1 changes

The stage 7 ink was reviewed in `SCRIPT_EDIT_R1.md` (round 1: 0 blockers, 7 majors, 43 minors, cross-read rulings R-1 to R-7, an audio cut list). The orchestrator accepted every ruling and cut. The sections above now describe the ink as shipped; where they and the ink disagree, the ink wins. What changed, by section:

**Rules (§1.2, §3.1, §5.6, §6.1)**
- **Naming the player (R-1).** The rule is now "no personal name or gendered word for the player". SAFETYNET people (Netherton included) and Tesseract may say "Agent", "Agent 0x00" or "0x00"; nobody else names the player.
- **Netherton's contractions (R-2).** Full forms on weighted lines; contractions only in quick asides.
- **`DONE` (R-7).** The ban on `END` and `DONE` applies to person-chat only. Phone threads may end `-> DONE` after `#exit_conversation`, as HaX's does.
- **"Dead", not "down" (B-04)** for a cut shutter, in HaX, Vance, Elena and Voltage's 06:00 lines. "The plant" stays off the machinery too.

**Knot names (§1.3, §1.4, §4.2)**
- HaX's gallery call is `gallery_open_call`, and Tesseract's exchanges are `exch_1`, `exch_2`, `exch_3`, because ink can't name a knot after a global. Stage 9's mappings use these names.
- New knots: `wren_react` (tunnel, `tesseract`), `parked` (resting knot, `tesseract`), `deal_close` (Nightshade, arrested branch), `threat_missed` (`victoria_threat`), `fight` and `passed` (shared guard resting knots).

**Group A (§1.3, §1.6, §5.9)**
- 06:00 opens "a few minutes before six"; on `named`, Netherton: "The arrest teams are at the doors. They go on the hour." (A-01)
- His release line for `both` is "Two cells have it. Much good may it do them."; HaX's return lines are the four "Confirmed…" forms, which `what_went_out` reuses word for word (A-10).
- The database: Netherton's "Two operations go dark if you do this." plus the first two of eight fixed one-operation lines; his two cost lines merged into one, and HaX's disclosure and unpatchable lines merged into one (audio cuts 2–4).
- The console resumes the Join menu at the furthest step once `join_step >= 1`, so the casualty figure is said once.
- `wren_beat` runs `wren_react`: HaX's "Kowalczyk. *quietly* I signed her leave forms." (skipped on `sleeper_caught`) and, on the wounded arm, Quintero's "Shoulder. Leave it." (A-03)
- C18 at 06:00 is offered whenever Kowalczyk is at the van (`sleeper_caught or wren_at_core`); on a save where nobody named her, the only answer is "[I didn't. Not till you came through his door.]" (`worked_out`).
- `after_end` rests in `parked`.
- Credits: SAFETYNET staff by capitalised designation; Kowalczyk's five clauses in order, with "Badge still active." last, never alone (A-02).
- The Citadel opens on HaX's open channel, not her empty desk (A-04). A-26 accepted unchanged.

**Group B (§1.4, §1.6)**
- `accuse_who` order: Malhotra, Arakawa, Kowalczyk, Quintero, Vector, Phantom (B-01).
- On `taken`, C18's second answer is "[Before Helena. I had a feeling about you.]" (value still `briefing`), in the aside and in Kowalczyk's `van` (B-02). Elsewhere it stays "[At the briefing. You laughed too easily.]".
- The console's resale option is "[Kill the resale.]".
- `gallery_open_call` carries recruited Victoria's warning as one line.
- Netherton's reply to Quintero says "Twice now" only on `m09_completed`; otherwise "Noted, Agent Quintero. The record also says six o'clock."
- `what_went_out` uses the "Confirmed…" lines.

**Group C (§1.5, §2.5, §3.1)**
1. Nightshade's payment is given on the not-shown branch and the arrested branch's deal, never on shown (S6 §1.10); the override on shown only.
2. The arrested deal leads to `deal_close`, which holds the payment check and the closing choice "[That'll do. We go by your map.]", so the check can disarm the tripwire there. The check's button is shortened to "[Your inner door entry says 1962, no interlock. Helena's 1962 drawings have one.]". His opener keeps "line item" for 06:00 (C-01).
3. Fonoti's challenge option is "[Shift change. Orders from upstairs.]" (C-07). Ghost's card answer adds "He carries the code card, and he'll want to be off shift.", which Fonoti's Ghost option quotes.
4. Wendell's buttons are the player's words: "[Those servers are set to shut down hospitals at six. That's the job.]" / "[Never mind. Carry on, Mr Briggs.]"; "son. Or ma'am." dropped.
5. Gary's cuff option is "[You're coming in, Gary.]" (C-10); his `tech` scene also writes `imran_outcome = "avoided"` on its first line.
6. Both reinforcements share `reinforcement` (two `#hostile` ids); guards rest in `fight` / `passed`; "Nobody said let you through armed." is the tunnel guard's alone (C-03).
7. `lock_guard_known` is written with `~` by Ghost, Victoria and Vos; Asante writes `talked` on the schedule or the sheet.
8. "The plant" kept off the machinery ("generators", "switchgear").
9. Victoria's threat miss rests in `threat_missed`; escaped Voltage's talk-down needs `casualty_sheet_read`; captured Voltage's "his hands" pick ends on a one-step acknowledgement.
- Line fixes with no interface change: C-02 (Netherton full forms), C-04 (Ghost's repeated opener; "You'll want to now."), C-05 (Elena closes "Go get him."), C-06 ("He had my desk"), C-08 (Victoria "Zero Day pays on time. You never did."), C-09 ("server cabinet"); R-6's "I told you it'd be waiting."; Mercer loses "agent".

**Voiced counts after R1**
- Calls: HaX 28, Ghost 26, Vance 10, Elena 10, Victoria 7 (81, against §4.2's 80).
- Person-chat, group A: Tesseract 185, 06:00 100, hearing 8, Citadel 2, Kowalczyk core 2.

## 9. Script edit R2 changes

Round 2 (`SCRIPT_EDIT_R2.md`) confirmed every R1 change and raised minors only. The orchestrator accepted every finding. The sections above describe the ink after round 2; the ink wins where they differ.

**New global (§2.5)**
- `hax_asked_database` (bool, default `false`): written by `tesseract`'s database menu on "[HaX. What would you do?]" (replacing the file-local `tess_asked_hax`); read by the hearing's last line (A2-12). Stage 9 adds it to `globalVariables`.

**Group A (§1.3, §1.6, §5.9)**
- `flag4_lines` no longer carries the purge; HaX says it once, at the database: "If both copies die, this room purges itself. He'll be ready for it, and you won't have him after." (A2-09)
- The database: Netherton's operations are noun phrases after "Two operations go dark if you do this." (A2-03); HaX's cost of secure is "Keep them, and the infusion pumps in a hundred and forty hospitals are still live next year.", then "[And if we send ours out?]" (A2-02).
- The case's last menu is "[Make your argument, then.]" / "[(Say nothing.)]" (A2-07).
- HaX's `zero_day` return line is "Confirmed. Zero Day's share went." in `tesseract` and in HaX's `what_went_out`.
- 06:00 `numbers`: the partial release, the backdoor and "Seattle's went first." are no longer said; "[And the database?]" / "[(Wait.)]" ("[(Say nothing.)]" alone on `executed`) breaks the ledger before the database (A2-01).
- C18 at 06:00 offers only answers the player could give (A2-04): the bench answer "[At the bench log. Then your name on the sign-out sheet.]" on `clue_bench_log` and not `taken`; on `taken`, "[In Helena. Your name on the placing sheet.]" (`bench`) and "[Before Helena. I had a feeling about you.]" (`briefing`); "[I didn't. I worked it out.]" stays.
- Protected Gary at 06:00 on `imran_outcome == "ko"`: "I sat with Imran till the medics came. He asked who it was. I said I didn't see." (A2-13)
- Credits: Quintero's first clause on `quintero_ko` is "Raid lead. On her feet by Friday, and asking questions."

**Group B (§1.4, §2.5)**
- HaX's hub fits ten choices (B2-01): "[How are you?]" retires at `flag2_submitted`, "[The fence.]" at `workshop_entered`, and "[Who was where at ten past?]" needs `door_log_given`. **Stage 9 must set `door_log_given` from the door-log bark's mapping**, or a player who only heard the bark never sees the alibi topic (the hub's "[The door log.]" topic also sets it).
- Kowalczyk's face-to-face bench answer is "[At the bench log. Then your name on the sign-out sheet.]", on `clue_bench_log`; her `van` uses the `taken` answers above.
- Quintero at the core: "It'll keep. Go on." (wounded) / "I've got the door. Go on." (B2-03). Netherton's hub exit after the night: "Go and get warm. The paperwork will keep for an hour."

**Group C (§1.5)**
- C2-03: HaX's line in Ghost's call is "If it sells, the release console can kill that share. It only does one."
- C2-01: Victoria's resting line after selling the raid is "You have your door. Don't ask me for anything else."
- C2-02: the Farah guard opens "Who are you? This walkway's closed till six."
- No knots, globals or tags changed.

**Voiced counts after R2**
- Calls: HaX 28, Ghost 26, Vance 10, Elena 10, Victoria 7 (81).
- Person-chat, group A: Tesseract 184, 06:00 98, hearing 9, Citadel 2, Kowalczyk core 2.

## 10. Script edit R3 changes

Round 3 (`SCRIPT_EDIT_R3.md`) raised ten minors and no interface problems. The orchestrator accepted them all. The sections above describe the ink after round 3; the ink wins where they differ. §8 and §9 keep earlier wordings as history.

**Group A (§1.3, §1.6)**
- The case: `case_heard` is set in the new knot `case_close`; the Recruiter's menu is skipped when that beat is empty on the save.
- Exchanges: a pause menu between them, "[Go on.]" / "[You're not finished.]" after exchange 1 and "[And the last one?]" / "[(Let him go on.)]" after exchange 2; the KO sting on `m08_hax_ko` is "At the Citadel, it was your own handler."
- The database: Netherton opens "Send ours to the vendors, and two operations go dark."; "The watch on what's left of Voltage's crew."; HaX's pumps line is followed by "[And if ours go to the vendors?]" / "[(Wait.)]".
- 06:00 `numbers`: `more_menu` offers "[And the rest of it?]" only when `numbers_more` has a line; the database menu is "[And the database?]" / "[(Nod.)]"; `executed` keeps "[(Say nothing.)]" alone.
- The hearing on `hax_asked_database`: "They'll ask me if I'd have stopped you. I'll tell them you asked, and I said it was yours."
- C18 on `taken`: "[In Helena. She sold me your name.]" (`bench`) replaces "[In Helena. Your name on the placing sheet.]"; her 06:00 reply is "Eleven years she paid my mum's care home. Then she sold me to you."

**Group B (§1.4)**
- The same `taken` answer in Netherton's `aside` (taken form) and Kowalczyk's `van` (value `bench`; her reply plays only at 06:00, and a narrator line follows in the aside and the van) (B3-01).
- The aside's "[Do we know who?]": "No. And if I bench four agents to find out, WREN knows we know." Netherton's hub exit: "Go and get warm. The paperwork can wait an hour." The briefing's stakes menu: "[Has he costed it?]".
- Quintero at the core: "One arm's plenty for a door. You've got work." (wounded) / "Door's mine. You've got work."
- Arakawa's bunker resting lines also need `not nightshade_tethered`.

**Group C (§1.5)**
- C3-01: Victoria's resting line after selling the raid is "We're square. Don't ask me for anything else." No interface change.

**Voiced counts after R3**
- Calls: unchanged at 81 (HaX 28, Ghost 26, Vance 10, Elena 10, Victoria 7).
- Person-chat: Tesseract 185, 06:00 99, hearing 9, Citadel 2, Kowalczyk core 2; Netherton +1.

## 11. Stage 8 changes

Applied 2026-10-21 by the m10 fixer from `finale/STAGE_8_RULINGS.md` and the review files it names (m10-R = `stages/stage_8/REVIEW_R1.md`; SA, SR, VT, BP, CC, SC, CR as the rulings abbreviate them). This section wins over §1–§10 where they differ. No audio exists yet, so every changed voiced string costs nothing.

**Ink**

| File, knot | Change | Source |
|---|---|---|
| `m10_victoria.ink` `recruited_menu`, `gallery_rest` | trusted Victoria sells on `share_zero_day != "stopped"` (live or traced), not only `== "live"`; the resting line uses the same test | m10-R M-1 |
| `m10_phone_agent0x99.ink` `support_hub`, `hatch_topic` | "[The hatch?]" asked once (`hax_hatch_asked`, a file-local); "[The backdoor.]" shows only after the lock, and "[What's still live?]" carries the backdoor lines until then (falls through to `backdoor_topic`, which sets `hax_backdoor_asked`). The busiest seeded save shows 10 choices (11 before) | m10-R m-1; ruling 3 |
| `m10_phone_agent0x99.ink` `console` | "Pick." only when a share option will show: "One feed. Kill it or follow it. Pick." (Zero Day's live); "The resale's live. I can kill it. One go." (bait resale only); "No share left to touch." (+ "His backdoor's still open." where it is). "Not both." is gone | m10-R m-6, m-14 |
| `m10_phone_agent0x99.ink` `breach_call` (voiced) | new arm on `override_held`: "It's read your badge. Only he knows." | m10-R M-2 (optional fix, taken) |
| `m10_phone_agent0x99.ink` `where_are_we`; `m10_hax_post.ink` `hub`; `m10_director_netherton.ink` `hub` | after-ending lines gated `ending != "joined"` | VT; ruling 9 |
| `m10_citadel.ink` `start` | "The Citadel, an hour later. Netherton is on the wall screen from Montana. Beside him, HaX's channel is still open. Nobody has spoken on it."; the count is "On the next screen" | CR; ruling 9 |
| `m10_nightshade.ink` `unshown_menu` | the check option needs `m09_completed`, and the map arms the tripwire only with `m09_completed`: an m08 triple-agent save with m09 unplayed gets the neutral version (true map, no check, no tripwire; S6 gives the payment's neutral variant) | SA M2; ruling 4 |
| `m10_nightshade.ink` `unshown` | on `m08_triple_agent_first_payment`, his opener is "I said I'd pay when you stood at the door. Every door, and where he got the idea." | ruling 14, row 104 (keeps the import) |
| `m10_nightshade.ink` `shown`, `unshown`, `arrested` | on `m09_completed`, HaX sets m09's flag 4 list apart from the payment: shown, a new line "Helena gave us the entries he built from. Not which door each one's on, or who stands where."; not shown, her pointer becomes "Helena gave us the entries he built from. Not which door each one's on. Check his against the plans."; arrested, "Helena gave us his entries, not where each one sits. He's only as right as the man who briefed him." (folded into her existing lines to keep a choice every three lines) | SR major 1; ruling 6 |
| `m10_director_netherton.ink` `briefing` | "He gave them the database." (was "sold") | SC 5 (BP F-08's "opened the door for" not taken; same cost, SC's is closer to the shipped line) |
| `m10_director_netherton.ink` `briefing_stakes` | on `m07_completed and m07_debrief_stance == "hardened"`: "The Council said yes. You asked for the numbers. You have them." | ruling 14, rows 99 and 102 |
| `m10_director_netherton.ink` `briefing_team` | on `m07_completed and m07_mercer_fate == "arrested" and not m07_mercer_ko`: "Mercer's statement drew us the server hall. It is on the map." | ruling 14, row 88 |
| `m10_director_netherton.ink` `tether` | "You will be at the lock without her." | SR minor 4; ruling 19 |
| `m10_director_netherton.ink` `aside_taken`; `m10_kowalczyk.ink` `van`; `m10_six_oclock.ink` `kow_question` | "[I didn't. I worked it out.]" never offered on `taken` (cut from the two taken-only menus; gated `m09_recruiter_offer != "taken"` at 06:00) | SR minor 1 |
| `m10_kowalczyk.ink` `crack` | HaX: "I said that the morning you handed it over." | SR minor 2 |
| `m10_six_oclock.ink` `numbers` | "He reached. I will put that first."; "She will have sold that too." | SR minor 4; ruling 19 |
| `m10_six_oclock.ink` `database_beat` | "There is / There's no patch for their old controllers." | SR minor 7 |
| `m10_six_oclock.ink` `walk_gary` | protected Gary: "Consultant for a night. I spent it watching other people's benches." (a third lanyard joke cut) | SR minor 5 |
| `m10_gary.ink` `consultant` | "You saved my career. Director of Cyber Security now, and the lanyard's still spelt right." (m09's title kept; works with or without m09's call) | SR minor 5 |
| `m10_elena_phone.ink` `cut_0` (voiced) | "It's Elena Rodriguez." (two Elenas); first ring only (`elena_decided_said`, a file-local): "Your director decided what to do with me. This is it." | ruling 14, row 90; CC (optional) |
| `m10_tesseract.ink` `case` | on `m06_assets_seized`, after "All four…": "You froze my bank. I had to economise on guards. I expect you noticed." | ruling 14, row 72 |
| `m10_tesseract.ink` `case`, new tunnel `case_lesson` | on `m02_completed`: "Ghost put it best, at St. Catherine's. Not the money. The lesson." / "[Ghost held a hospital to ransom to say it.]" / "[(Say nothing.)]" / HaX: "Ghost wasn't wrong about the problem. I said so then. Wrong about the answer. So is he." | ruling 14, row 31 |
| `m10_tesseract.ink` `flag4_lines` | HaX: "The notice from Helena is on here too." | SR minor 8 |
| `m10_tesseract.ink` `exch_2_menu` | "[… Nobody died of it.]" | SC 8 |
| `m10_tesseract.ink` `exch_3` | "I taught rooms of twenty, once." | ruling 12 |
| `m10_tesseract.ink` `exch_3_menu` | the Tomb Alpha notes answer needs `m09_alpha_annotations_read` as well as `alpha_tapes`; without it slot 4 falls to "She carries it…" | SR major 2; ruling 5 |
| `m10_tesseract.ink` `wren_react` | HaX: "Kowalczyk. *quietly* I sent her mum flowers." (nothing makes HaX her line manager) | VT oddity |
| `m10_tesseract.ink` `database`, `database_menu` | "…and the oldest water controllers never."; "I will have his collected." | SR minors 7, 4 |
| `m10_tesseract.ink` `ending_scorched` | the hidden-panel exit on `m09_recruiter_offer == "taken"` (was `m09_sleeper_named`) | SR minor 11 |
| `m10_tesseract.ink` | `*pause*` cues cut from twelve landed answers; five cues left in the file (lint was 19) | m10-R m-14 |
| `m10_carryover_vars.ink` | new import `VAR m09_alpha_annotations_read = false` (Tier 2) | ruling 5 |

**JSON**

- `credits_sections.json`: Kowalczyk's four clauses read "Breaching lead, Task Force Null. Eleven years in SAFETYNET. …" (CC 1, SR major 3; ruling 8); `safetynet_join` HaX: "Handler. Her last message to 0x00 went unanswered." (ruling 9, provisional, a taste call for the user); `safetynet_join` Quintero gains `quintero_ko` and `officer_out === 'quintero'` clauses ahead of the default (m10-R m-12).
- New `texts/BARKS_AND_TEXTS.md`: 57 numbered rows (T-01 to T-57, with lettered splits), every bark and text stage 9 needs, with speaker, trigger, condition, `onceOnly` and source (m10-R M-5; ruling 15). New wordings: Ghost's three selling-branch texts at 06:00 (T-52 to T-54), the door-log read split (T-14), the Mercer entry line (T-31), the hatch pointer (T-34), the programme-exposed line (T-38), HaX's Join text "0x00." (T-57). Placed from the rulings: Reeves (T-18), Static (T-27), Vance (T-26), the `letters` bark (T-37), Terry Mott's £500 (T-21; m10-R m-13, import kept).

**Mappings stage 9 now owes** (also in §3.3): `whodunit_live` false on `taken` and `double_crossed`; `clue_alibi` at the aside on the shortlist; the `kowalczyk_*` field copies never shown on `taken` or `double_crossed`, the van copy on `taken` (SA M3); `victoria_gallery = 'refused'` on the recruited branch on `room_exited` from the gallery and on `outer_lock_open` (M-4, §1.5); `raid_clock = 't0600'` on `six_done` (M-3; ruling 16); Tesseract hidden after his ending (m-8); `breach_announced` on `!nightshade_tethered && !override_held`, and `tunnel_guard` on `!nightshade_tethered && !nightshade_map_used && !override_held` (M-2; RL §2.2); the reinforcements on `share_zero_day !== 'stopped'` (M-1; RL §2.7); guide 3 also offered on the sealed hatch's first use (m-7; OT §16); `share_resale = stopped` from Ghost's call only where it was `live` (m-4; OT §6); `kowalczyk_cracker`'s cold-start descriptions are S6 §1.10's two `!m09_completed` variants (SA M4); `nightshade_payment`'s neutral variant (ruling 4; S6 §1.10).

**Stage documents** (each change marked "stage 8" in place): OT §3 ("Shutter's dead."), §4.1 (`breach_announced`, the override arm), §5 (the hatch guard, the cap paragraph), §6 (`t0600` on `six_done`; the share display's `live` guard), §9 A5 (`nightshade_tidied` dropped), §16 (`raid_clock`, `breach_announced`, `tripwire_armed`, guide 3, "eight guide flags … twelve"); RL §2 (a sixth expected warning, `alarm_override`), §2.2 (one tunnel-post rule), §2.3 (lamps), §2.7 (reinforcements), §2.8 (Tesseract hidden after his ending), §5 (Mercer's briefing line); MC §3.1 (the neutral not-shown version, row 104's opener, ruling 6's lines), §3.5 (`refused` default with its mappings; live or traced), C9's console line; SE §3.1 (console, notice, Netherton's full forms, water controllers, Gary), §3.5 (Ghost's three selling texts); S6 §1.1 incident file items 3 and 4 (BP F-09; ruling 7), §1.10 (the payment's neutral variant), §2.5, §3.3 (GHOST clause 6 dropped, m10-R m-5), §4.1, §4.4 (crackers signed in for evaluation, never issued); arc §1 ("gave"), §5 (console), §10 (full forms, controllers).

**Counts.** Imports 99 → 100 (Tier 2 50 → 51; FA §3.2 and §21 to follow); the include now declares 245 `VAR`s (100 imports, 145 others); `globalVariables` unchanged at 145; exports unchanged at 7. New file-locals (not globals): `hax_hatch_asked` (HaX phone), `elena_decided_said` (Elena). Voiced: calls 81 → 83 (HaX 29: the override arm; Elena 11: the first-ring line); person-chat Tesseract 185 → 188, Netherton 85 → 87, Nightshade's file 60 → 64 (one Nightshade alternative, three HaX lines, each an alternative by branch, so a run hears at most one or two of them). Changed voiced strings (new clips when audio is made): Netherton ×4, Tesseract ×5 plus the twelve trimmed cues, HaX ×3 (notice, flowers, Kowalczyk's "morning"), 06:00 ×5, Gary ×1, Elena ×1, the Citadel narrator ×2.

**Not changed, with the reason**

- SR minor 10 (the casualty figure said two ways): m10 is consistent ("Eleven hundred to twenty-six hundred"); m09's form is the odd one, and changing either costs clips. Left for the user.
- SR minor 3 / ruling 11: m10 keeps "Twice now"; m09 cuts "again".
- SA m4 (`cage_bin = derek_file` never held): ruling 1 now hands the file over on every route, so m10's Derek answer stands.
- SC 2 (m05 dates): m10 has no spring/summer/"this year" reference to m05. Nightshade's "Everything he'd built by the spring" is about the refit, not m05, and stays.
- m10-R §4's README `||` sentence and §10's stage 9 checks (narrator voice block, validator runs) are not in this fixer's files.

**Stage 9 follow-up (after the build commit).** Once `ending != ""` the three SAFETYNET hubs close: HaX's phone `start` diverts to `after_ending` (one text line by ending, "[That's all.]" only) or, on `joined`, `line_dead` ("[Hang up.]" only, no line); `hax_post` to `post_after` / `post_dead`; Netherton's `start` and `hub` to `neth_after` / `neth_dead`. Rest lines: arrest, surrender, lethal "It's done. Sit down a minute." (HaX in person) / "It's done. Come up when you're ready." (phone) / "Go and get warm. The paperwork can wait an hour." (Netherton); executed "Not now." / "Not now, Agent. The board will want you rested."; scorched "Go with the team. We'll talk at the hearing." / "Get out with the team. We'll talk at the hearing." / "We both answer for it. Go and get warm first." On `joined` the person NPCs give one narrator line ("She doesn't look up." / "Netherton doesn't look at you.") and an exit; nobody from SAFETYNET speaks. No in-raid topic, "[Where are we?]" or briefing line is reachable after the ending. New voiced person-chat lines: HaX in person 2, Netherton 2 (plus 2 narrator lines).

**Stage 9 walkthrough R1 fixes (`WALKTHROUGH_R1.md`; JSON only, no ink changed).** M-1: HaX's mappings set `gate_console_used` on `flag1_submitted` (and a `game_loaded` catch-up), so the split, Arakawa's call, `pair_back` and the breach no longer need a click on the gate console. M-2 (PASS2 lesson 46; m09's `debrief_closed` pattern): `end_it` keeps its `conclusionScreen`. The closing scenes no longer carry `#complete_task:close_the_night` (removed from `m10_six_oclock.ink` ×4, `m10_hearing.ink`, `m10_citadel.ink`; their last lines keep `#set_global:closing_done:true`). HaX's mappings on `conversation_closed:six_oclock|hearing|citadel` with `closing_done` set the new JSON global `night_closed` and complete `close_the_night`, with a backstop on the next `room_entered` after a reload; the six card-and-credits music entries trigger on `night_closed` by `ending`. m-1: the briefing `timedConversation` is `disableClose`, and Netherton reopens `start` on `game_loaded` while `briefing_played && !aside_done`. m-2: a HaX bark on each later failed try at the locked inner door, "The ladder at the guard post. Up and round." (`tripwire_tripped && !ladder_used && !inner_door_open`). **For the ink owner (group B):** a `where_are_we` rung above `breach_open`: `tripwire_tripped and not inner_door_open` → "The ladder at the guard post. Up and round." m-3: every bunker raid-team copy hides on `room_exited` from its own room, as `vector_so`. m-4: the launchers are "Field Console (Gate)", "(Server Hall)", "(Core)"; `puzzle_graph_actions`/`links` model the table scene, the tether, the split and Arakawa's call (blast door), the shutter cut (gallery stair), Imran/Gary (power room) and Victoria/Vos from inside (core). m-5: the visualiser's footer ticker already reads the scenario's `creditsOverlay` (true on every ending, Join included); its fixed header "MISSION COMPLETE // AUDIO INTEL" and the server's `completed` status need an engine option (as on m01's launch ending), left for the user.

**Walkthrough R1b (ink side).**
- R1b-M2: the six face-to-face accusation functions (`quin_`, `arak_`, `mal_`, `vec_`, `pha_`, `kow_can_accuse`) add `and not wren_at_core and ending == ""`.
- R1b-M1: the raid team's files (`m10_quintero`, `m10_arakawa`, `m10_malhotra`, `m10_vector`, `m10_phantom`, `m10_kowalczyk`, `m10_minders`, `m10_nightshade`) gain a file-local `end_quiet` and a knot `end_rest`, and every entry knot (`start` and each `currentKnot`: post, van, gate, blast, so, ws, pr, hall, lock, core, table, menu) diverts there once `ending != ""`. `end_rest` gives one line and "[(Leave it.)]": on Join a narrator beat only ("<name> doesn't look at you."); on executed a narrator beat ("Quintero won't look at you.", etc.); on scorched a get-out line; otherwise a quiet rest line ("It's done. Get some air." for Quintero, "I'll open the road at seven. Go and sit down." for Arakawa, and so on). A caught Kowalczyk gets "Kowalczyk looks at the floor." `m10_kowalczyk_core.ink`'s `start` gets the same beat (`after_end`). Quintero's "You've got work." can't play after an ending.
- R1b-m1 (ink half): HaX's `console` diverts to `console_shut` after the ending ("That console's done all it can for us.", nothing on Join; no backdoor option). The erb guard is the builder's.
- R1b-m4: HaX's accusation menu hides Arakawa, Quintero, Vector and Phantom when knocked out (`not <name>_ko`).
- New voiced person-chat lines: 16 rest lines (8 files × scorched and default) plus 18 narrator beats (8 files × Join and executed, the caught Kowalczyk, and her core copy); none on a critical path.


**Walkthrough R1b fixes (JSON).** R1b-M1: every in-raid NPC (60 records: the raid team's copies, the minders, Nightshade's copies, Voltage, Static, Wendell, Imran, Gary, Asante, Mercer, Victoria, Vos, Fonoti and every guard; not Netherton, HaX in person, Tesseract or the hidden scene NPCs) hides itself once `closing_done` is set, on the change, on `game_loaded` (forward post) and on entering its room. R1b-M3: Kowalczyk's bunker copies also need `!wren_entering && !wren_at_core && ending == ""` and hide on `wren_entering`. R1b-m1: HaX's console mapping needs `ending === ''`. R1b-m2: "Where's Farah?" uses `delayMs: 4000` (the engine ignores `barkDelay`). R1b-m3: HaX closes Arakawa's call on `global_variable_changed:arakawa_ko` (not `npc_ko`, which fires before the global). R1b-m5: `quintero_lock` hides on `quintero_enters_core` and doesn't reveal after it. R1b-m6: `minder_blast` shows when Arakawa is knocked out at the blast door after the breach. R1b-m10: the "Arakawa's still on the phone" bark needs `split_started`. Not changed: R1b-m7 (KO traces, design), R1b-m8 (no down pose art; Tesseract stays hidden), R1b-m9 (use fresh saves), the duty guard's repeatable lockpick catch (intended).- Builder follow-up: `where_are_we` gains `tripwire_tripped and not inner_door_open` → "The ladder at the guard post. Up and round." above `breach_open`.

**Implementation review R1 and playtests R1 A–D (ink side).**
- T-43 (`texts/BARKS_AND_TEXTS.md`): now Nightshade's own intercom bark, "That's far enough. Back down the stair, all of you." (a bark can't carry narration).
- Server hall guards (playtest B-03): `hall_a` and `hall_b` gain "[(Wave the team up behind you.)]" on `hall_team_present`, which diverts to the new knot `hall_stand_down`. It sets `hall_guards_stood_down` and plays a narrator beat plus "That's more of you than they pay me for. I didn't see anyone.", and both guards then rest in `passed`. Two new local globals sit in the include, both default `false`: `hall_team_present` (stage 9 sets it while any raid copy stands in the hall) and `hall_guards_stood_down` (stage 9 stops both patrols and their `challengeOnSight` on it). Without the team, the hall stays a fight.
- Arakawa's call (playtest A m-1): "Our clock runs on UTC. At home it's her bedtime. Thirty seconds, I promise."
- HaX's line accusation with nobody to send (B-06): "Then she's heading for the core. You'll meet her there."
- Briefing (playtest A m-7): "…as pay for stealing our database." The arrested branch drops the cold-start Nightshade intro, so "the theft" had nothing to refer back to.
- Call endings (the m09 §15 pattern): every phone call whose last line carries information now ends on an unvoiced player reply, through a small close knot, and then `#exit_conversation`:
  - HaX: `breach_call`, `tripwire_call`, `ladder_call`, `stair_call` and the cut's success end on "[On my way.]"; `inner_door_call` on "[Got it.]"; both `gallery_open_call` exits on "[Understood.]"; `cut_call`'s already-dead line on "[Right.]".
  - Ghost: the kept code and the refused code on "[Got it.]"; the refused card, the bait and the talked-out end on "[Understood.]".
  - Victoria's line: both deals end on "[Understood.]".
  - Vance and Elena: the cut's success ends on "[On my way.]"; the already-dead line on "[Right.]".
  - Replies to "[Give me a minute.]" are left as they were. Done flags are still set before each reply.
- Kowalczyk's credits (playtests C F5, D m-3): the SAFETYNET clauses on `wren_at_core` and `kowalczyk_ko` end "Badge cancelled at six." instead of repeating the IN THIS OPERATION event. S6 §3.3's three IN THIS OPERATION clauses now say "Never accused." in place of "Never named.". The ERB copies of both are the builder's to update.

**Implementation review R1 and playtests R1 A–D (JSON side).**
- Reveals (ROOMS M1, playtest C F1): every `setVisible: true` mapping, the raid copies' included, carries `&& !globalVars.closing_done`. A later mapping on the same event wins, so the `after_end` hides placed first could not hold on their own.
- Story doors (TEXTS M3, ROOMS m3): the blast door, inner door, Stair B and the gallery stair listen on `door_unlock_attempt` with `data.connectedRoom` (barks, catch-up `unlockDoor`s, the tripwire setter, Netherton's split catch-up and Arakawa's gate catch-up). `door_unlock_failed` only fires on a refusal, and an RFID door with any card in hand opens the cloner instead. Holding barks are chained so one plays per try: T-02 needs `door_scene_done`, T-07 `flag2_submitted`, T-08 both flags. The ladder bark sits above the tripwire setter, so it is silent on the first push. The power-room bark (T-05) stays on `door_unlock_failed` and is now `onceOnly`, as is T-42.
- T-10 drops `!outer_lock_open` (HaX sets it first). T-43 is the ink fixer's new string. T-46 is cut (no failed-flag event); noted at Tesseract.
- Delayed texts carry `skipIfGlobal` at delivery: `casualty_sheet_read` (T-23, T-30), `margin_note_read` (T-24a/b), `hax_jammed` (T-22, T-33b/c, T-36a–c, T-38, T-39). New HaX texts for a skimmed briefing (playtest A m-6), both skipped once `gate_console_used`: "Field console by the gate first. Start it, then the terminal." (8 s after `door_scene_done`) and "Not the terminal yet. The field console beside it." (first look at the Gate Terminal). The texts file needs rows for these.
- Speakers (playtests C F2, D m-2): prefixes resolve only against NPCs registered this session, and a room's NPCs register when it loads. The forward post loads on every boot and reload, so it holds hidden speaker records `imran_voice`, `gary_voice`, `wendell_voice` and `tesseract_voice` (same sprite, visemes and voice block as the room NPC; no storyPath). Netherton, HaX, Victoria and Voltage already have forward-post records. The `hearing` host now borrows HaX's name, art and voice (its lines are HaX's and the Narrator's).
- Server hall (playtest B-03): `hall_team_present` is cleared by HaX on entering or leaving the hall and set by each raid copy that shows there; `hall_guards_stood_down` (ink) stops both challenges (`skipIfGlobal`) and parks both patrols (`patrolOverride` to their first waypoint, also on re-entry). The east guard's challenge waits 4 s, re-checked then.
- Fonoti's challenge skips on `lock_guard_challenged`, `lock_guard_known` or `outer_lock_open` (playtest B-04).
- `gallery_open_call` needs `!outer_lock_open && head_start_out === ''` (playtest C F3: a late fire after a reload told the player the head start was still to come).
- Objects: `incident_file` is type `notes4` (a buff folder; `case-file` opens the intel board). `duty_handset` (6,4), `plotting_board` (2,4) and `schedule_terminal` (10,7, now `aes_round_terminal1`) moved onto open floor for reach; `schedule_terminal` has a post-flag-2 observation. `bypass_panel` shows the print as "Unknown fitter" on every branch (owner id stays `voltage` for the event). Staging: `phantom_post` (7,4) off the player spawn; `arakawa_blast` and `minder_blast` (17,8) off GEN 3; `nightshade_blast` (18,6) off the tank.
- Knock-outs (impl R1 minor 3): a KO no longer overwrites a settled `imran_outcome`, `gary_outcome`, `wendell_outcome` (`told`) or `victoria_gallery`. Wendell's KO still sets `cut_by_hand` while the shutter is live. Protected Gary is read through `gary_ko` (minor 4).
- Clock (minor 12): 02:00 on the second of `door_scene_done` and `gate_console_used` (and on load); 02:10 needs `!arakawa_ko`. The `raid_clock < 'tHHMM'` conditions (minor 5) are a recorded exception to §2.1: the engine compares strings, and the fixed `tHHMM` form sorts in time order.
- Required story tasks (minor 11) catch up on `game_loaded` from their done-globals (`settle_the_table` through `close_the_night`).
- Credits: the ERB copy of `credits_sections.json` raises on any difference when the file is reachable (minor 6). Kowalczyk's IN THIS OPERATION clauses read "Never accused."; her SAFETYNET clauses match the JSON. Quintero's wound clause drops "Talking by six." The card's one-cell line reads "One cell broken: <name>." (playtest D m-4).
- Recorded deviations (impl R1 minors 7, 8; ROOMS m1, m2): the scorched card is folded into `key_console`'s variant; `static_kit` and `farah_chair` show on every save; the sign-out sheet's variant order differs from S6 §1.1; the RL `*_ko` globals for the tunnel guard, duty guard, Wendell, Voltage, Victoria and Vos are not set (nothing reads them); HaX's `npc_ko` mappings write the `*_outcome` values the close reads.

**Builder JSON batch follow-up.** `gallery_open_call`'s head-start line now also needs `head_start_out == ""`. `m10_hearing.ink` and `m10_citadel.ink` now run `close_compute()` and then divert to a new `opening` knot, as `six_oclock` does, because playtest D lost the opening line when it shared a knot with the call. The after-ending knots for `hax_post` (`post_after`, `post_dead`) and Netherton (`neth_after`, `neth_dead`) each use their own quiet flag (`hpost_end_quiet`, `neth_end_quiet`), so a quiet flag left over from an in-raid exit can't blank their first line. Texts: T-58a and T-58b are added (the field-console pointers), and T-46 is marked cut.

**Full-route playtest 1.**
- Tesseract `database`: "[There's a third way.]" now gets its own lead-in, Netherton's "There is. Wipe both copies, his and ours.", then HaX's purge warning (re-worded slightly to follow on). The wipe prompt keeps HaX's line, and both then share Netherton's "We both answer for it." (m-3; one new Netherton line, one new HaX line).
- Vos: on a Zero Day share killed or stopped (`head_start_killed == "zero_day" or share_zero_day == "stopped"`), his re-entry, his "[No.]" reply and his resting line no longer wait for a delivery: "My delivery is not.", "My delivery was cancelled, so I have time.", "My delivery was cancelled. I am waiting for a flight. You are in the way of that too." (m-2).
- Imran: a new option, "[I haven't read it yet. Tell me.]", on `not casualty_sheet_read`, with the reply "Casualties. His own sums, in thousands. I build casings. Somebody else decides what goes in them." (m-4).
- Texts: T-16 is reworded to "That's Ghost on the handset. They want one last sale before they leave. Make it not worth it." with a suggested trigger on the handset's first use (m-5).
- Credits: S6 §3.5's ELSEWHERE gains two arms that sit before the "still trading" rows, for `share_zero_day === 'stopped'`: "Zero Day: got nothing tonight. Still trading." and "Zero Day: got nothing tonight. Its broker, Pieter Vos, named." The live copy is in the ERB (builder).

**Alignment R1 (JSON side; ALIGNMENT_PLAN.md, ALIGNMENT_REVIEW_F_R1.md).**
- A7 music: `wren_entering` plays `threat`; the ending, once picked, plays `silence` (arrest, surrender, lethal, executed), `threat` (scorched, under the purge) or `end` (joined); the first line of each closing scene sets `six_open`, `hearing_open` or `citadel_open` (ink), which plays `cutscene`, so 06:00's mood no longer depends on the talk-down score. Every cue has an exclusive `game_loaded` twin in story order. The core's arrival has no cue: the head start's "Steel Shadows" is already playing. Lethal's credits run on `end`; `victory` stays for arrest and surrender. The three scene-open globals are declared false.
- A2: the closing texts (Ghost's T-47–T-54, the Recruiter's T-55, executed's T-56, Join's T-57) carry `skipIfGlobal: "night_closed"`, so a toast held behind the closing scene is dropped as stale at release rather than shown over the card; the thread keeps any text already delivered. T-56's delay is 2 s (was 30 s). The scenes now carry those beats in ink.
- A1 / D1: `AGENT 0x00` has one outcome clause per ending, after `Pressed the key.` and the m09 `told` clause. An unnamed line under it, "Ten operations. Still answering for every one.", shows on any non-Join save with `m09_completed`.
- m4: the eight SAFETYNET people appear once. `credits_for` moves each one's IN THIS OPERATION conditional clauses ahead of their SAFETYNET role clauses and drops them from IN THIS OPERATION; with no outcome, the role line shows. Join keeps Kowalczyk in IN THIS OPERATION (she has no SAFETYNET entry there). `credits_sections.json` is unchanged and the drift check still holds.
- A3 / A4: ELSEWHERE rows for Derek Lawson by `m01_final_choice` and David Torres by `m05_final_choice`, each gated on its `mNN_completed`. `m01_player_aborted_attack` is imported (default false) for the season line's first-week arm.
- m3: the scenario brief ends "Helena gave us the shape of a sleeper on tonight's team." (true on every branch); `show_scenario_brief` stays `on_resume` until a regression run.
- m10: the two `room_entered:blast_tunnel` HaX texts are exclusive (`m08_nightshade_triple_agent` and `m08_nightshade_arrested` are in `mutuallyExclusiveGlobals`).

**Alignment phase 1, round 1 (ink side; `ALIGNMENT_PLAN.md`, `ALIGNMENT_REVIEW_F_R1.md`), plus m09's new exports.**
- New imports in the include (Tier 2; the builder adds them to `importGlobals`):
  - `m01_player_aborted_attack` (false);
  - `m09_memo_stance`, `m09_raid_team_answer`, `m09_kowalczyk_reply` (all "");
  - `m09_sorensen_fate`, `m09_tran_outcome` ("", read only with `m09_completed`);
  - `m09_noor_told`, `m09_alpha_clip_played` (false).
- New locals: `six_open`, `hearing_open`, `citadel_open` (false; music, A7), set on each closing scene's opening. `close_secure_cell` and `close_cell_name` gain the value `torres` (after `procurement`).
- New function `season_line()` in the include: the key for the 06:00 season line (A5, ruling D1).
- **A6, Tesseract's case:**
  - His record is now at most two lines, in priority order: `rec_albion` (m04 disclosure, or m09's memo answer), `rec_derek` (`m01_completed` only), `rec_debrief`, and `rec_cold` when none of them applies.
  - Each line has a menu that answers it in the player's voice, and he gives a one-line reply. The menus are inline, as before; a reload replays `case` from the top, as it always did.
  - Satoshi moved into `join_1`. The frozen bank moved into `arrival`. "Files are written by people…" and the "Since your first day" pair are cut, but "Since your first day." stays as a single line.
  - New file-local `tess_rec`.
- **A4, m1 (Derek):** a cold start no longer hears "You handed Derek over".
- **A3, m05:** five m05 stings in `exch_1_sting` by `m05_final_choice`, worded to m05's canon (Torres died by his rack on `combat_lethal`). On `turn_double_agent`, Torres's channel joins `database_ops`, `dark_ops` and `secured_cell`.
- **m09 payoffs:**
  - `m09_memo_stance`:
    - in `rec_albion` (his challenge, and the player's answer);
    - in `join_1` (the signpost "This is Albion, for everyone.");
    - in 06:00's `season` (Netherton).
  - `m09_raid_team_answer`: Quintero's 06:00 line, and Kowalczyk's 06:00 reply.
  - `m09_kowalczyk_reply`: her crack, her 06:00 reply, and the double-cross at the core.
  - `m09_alpha_clip_played`: HaX's service-door warning.
  - `m09_tran_outcome`: texts row T-37b.
  - Sorensen and Noor: credit strings, handed to the builder.
- **A2, the closing beats:**
  - `six_oclock` has a new `phone_beat` knot between the walkabout and the numbers: Ghost's last word and the Recruiter's, read by the narrator.
  - The executed ending gets "[(Look at the screen.)]" and two `Screen:` lines (headline and paragraph, unvoiced; the builder registers the speaker). HaX's later message is now the scene's last line, after the closing tags.
  - The Citadel opening now narrates HaX's "0x00.".
- **A5, the walkabout:** backward clauses on Voltage (Albion), Gary (St. Catherine's), Victoria (WhiteHat and Cardiff), Quintero (Helena) and Kowalczyk (Helena). A new `season` tunnel opens `the_rest` and `scorched_close`; it gives one season line and the memo line.
- **A8:** surrender's gain ("His protocol was good. The couriers went at half five, and their quartermaster with them.") and lethal's cost ("The cells have gone quiet since. They have a martyr now. Quiet is worse.").
- **m5, Citadel:** one Netherton line by a fixed priority (Gary protected, Voltage captured, Nightshade shown).
- **Minors:**
  - m2: Netherton introduces himself only when m02–m09 are all unplayed.
  - m6: a narrator beat on `m08_netherton_ko`.
  - m7: HaX's "He's right. Carry on.".
  - m8: Gary is "Consultant for SAFETYNET tonight, apparently.".
  - m9: HaX's "He's watched every job you've done".
  - m12: the recall topics sit after "[I know who WREN is.]" and hide once `gallery_open`.
- **S6:** the photo's hand is "sloping" (m09's clue). The ERB copy is the builder's.
- Executed screen (user ruling, no engine change): the two `Screen:` lines are now `Narrator[none]:` lines that describe the screen ("The screen reads: …" and "One paragraph: …"), voiced by the narrator. No Screen speaker is needed.

**Alignment R1 ELSEWHERE strings (the ink fixer's, wired in the ERB's `elsewhere_one`).**
- Derek Lawson: serving. He still hasn't said who. (`globalVars.m01_completed === true && globalVars.m01_final_choice === 'arrest'`)
- Derek Lawson: serving. He still hasn't said who. (`globalVars.m01_completed === true && globalVars.m01_final_choice === 'fight'`)
- Derek Lawson: turned the deal down. Serving. (`globalVars.m01_completed === true && globalVars.m01_final_choice === 'recruit'`)
- Derek Lawson: in the papers, then in prison. Social Fabric never mentioned him again. (`globalVars.m01_completed === true && globalVars.m01_final_choice === 'expose'`)
- Derek Lawson: gave himself up, as he was told. Serving. (`globalVars.m01_completed === true && globalVars.m01_final_choice === 'surrender'`)
- David Torres: still turned. Still sending. (`globalVars.m05_completed === true && globalVars.m05_final_choice === 'turn_double_agent'`)
- David Torres: serving. His daughter's treatment goes on. (`globalVars.m05_completed === true && globalVars.m05_final_choice === 'arrest' && globalVars.m05_elena_treatment_funded === true`)
- David Torres: serving. (`globalVars.m05_completed === true && globalVars.m05_final_choice === 'arrest' && !globalVars.m05_elena_treatment_funded`)
- David Torres: named in the papers. Out of work. (`globalVars.m05_completed === true && globalVars.m05_final_choice === 'public_exposure'`)
- David Torres: recovered, and charged. (`globalVars.m05_completed === true && globalVars.m05_final_choice === 'combat_nonlethal'`)
- Margaret Sorensen: talked. The archive kept its files. (`globalVars.m09_completed === true && globalVars.m09_sorensen_fate === 'talked'`)
- Margaret Sorensen: has not said a word since. (`globalVars.m09_completed === true && globalVars.m09_sorensen_fate === 'ko'`)
- Margaret Sorensen: retired the week after. The shredder went with her. (`globalVars.m09_completed === true && globalVars.m09_sorensen_fate !== 'talked' && globalVars.m09_sorensen_fate !== 'ko'`)
- Noor Haddad: warned in time. Still at the archive. (`globalVars.m09_completed === true && globalVars.m09_noor_told === true`)
- Noor Haddad: never told. Still on the list. (`globalVars.m09_completed === true && !globalVars.m09_noor_told`)
- `combat_lethal` (m05) has no Torres row.

**Alignment round 2 (ink side; `ALIGNMENT_REVIEW_F_R2.md`).**
- **R2-M2:** Elena is Torres's wife. The stings now read "…for paying his wife's hospital bills. I count her as well." and "…His wife reads them in a hospital bed."
- **R2-M3:** `season_line()` skips the three Albion keys when m09's memo line will follow, and gains a `denver` key (`m07_completed`, no team).
- **R2-M4, the m09 exports:**
  - New imports: `m09_reading_told_hax`, `m09_noor_ko`, `m09_old_coyote_ko`, `m09_debrief_notice_before` (all false, Tier 2).
  - `ko_pattern()` gains an m09 arm (Noor, Old Coyote, Sorensen or Tran knocked out, with `m09_completed`).
  - In `the_rest`, HaX on `reading_told_hax`: "You showed me what he wrote about you in Helena. So you get this."
  - At the database, HaX on `debrief_notice_before`: "You sent his notice before anyone asked you to. This is that letter, a thousand times."
- **R2-m1:** `case` now resumes on `tess_case_step` (0 pitch, 1 records, 2 the Recruiter), with "Where was I. Your record." on a resume. Each record writes `tess_rec_<name>` and `tess_rec` on its pick, in the new knot `case_records`.
- **R2-m2:** when he asks about the memo, the menu offers only the memo answer and "[I'm not saying it for you.]" ("No. You said it for Magnus. That's how it starts.").
- **R2-m3:** "[Then you should have sent your notice.]" is cut.
- **R2-m4:** "Since your first day." is folded into the lead line ("…I've watched you since your first day.").
- **R2-m5:** at most one ledger sting between the point and his reply (bed four, else m05).
- **R2-m6:** `austin_uncovered` now says "since Austin". Denver gets its own line: "In Denver you held the team in the air all night. Tonight you went in."
- **R2-m7:** Voltage escaped: "You let me walk out of Albion. March to tonight, I never said a word. Put that in too."
- **R2-m8:** recruited Victoria knocked out: "You asked nicely in Cardiff. Tonight you didn't bother. I'll want a doctor, and then a lawyer."
- **R2-m9:** executed: "In the van, your phone lights twice. A number with no name, which you don't open. Then HaX."
- **R2-m12:** `season` opens with "[Sir?]" / "[(Wait.)]" so Netherton never runs five lines. It returns at once when it has nothing to say.
- **R2-m16:** "He said it had to be one of ours…" and "Whitlock came to the table…".
- **R2-m17:** the ink comments are fixed (the `tess_*` VAR comments, the case header, the executed knot's comment).

**Alignment round 2 (JSON side; ALIGNMENT_REVIEW_F_R2.md).**
- R2-M1: `AGENT 0x00` holds only the six ending clauses. "Told their handler about the Recruiter's call." is an unnamed row under it (`m09_recruiter_secret === 'told' && ending !== 'joined'`).
- R2-m11: "Ten operations. Still answering for every one." needs `m01_completed` to `m09_completed` all true; otherwise "Still answering for every one." on `m09_completed` (neither on Join).
- R2-M2: "David Torres: serving. His wife's treatment goes on." (funded arrest); unfunded arrest stays "David Torres: serving."
- R2-m15: "Elena Torres: a widow since the server room. Her treatment was never funded." (warning) on `m05_completed && m05_final_choice === 'combat_lethal'` (m05 funds the treatment only on the turn and arrest paths).
- R2-M4: imports `m09_reading_told_hax`, `m09_noor_ko`, `m09_old_coyote_ko`, `m09_debrief_notice_before` (Tier 2, false).
- R2-M5: Noor's ELSEWHERE rows are exclusive (every holding row prints): told → "Noor Haddad: told in time. A witness in Great Falls, safe tonight."; m05's list kept and not told or knocked out → "Noor Haddad: warned in October. Back at the archive."; knocked out and not told → "Noor Haddad: woke at her own desk. Still asking who hit her." (warning); otherwise two rows (`!m05_found_pipeline_list`, `m05_recruiter_deal_accepted`) → "Noor Haddad: never told. Still on the list."
- R2-m10: the 06:00 texts (T-47 to T-56) skip on `six_open`, and T-57 on `citadel_open`; the scenes carry those beats, so no toast lands between scenes or over the card.
- R2-m13: a reload during the exchanges restores the talk-down score: `game_loaded` twins after the "Steel Shadows" twin, one per order-valid exchange state with a landed point (one landed: "Shadow In E Minor"; two or more: `silence`).
- R2-m14: the SAFETYNET merge now puts each person's SAFETYNET conditional clauses first, then their IN THIS OPERATION conditional clauses, then the SAFETYNET default. The 25 IN THIS OPERATION clauses that could never print under that order (correction, R3-m10: two of them, Netherton's and HaX's Join clauses, did print, because `safetynet_join` has no conditionals; its defaults now say the same) are deleted from the ERB (HaX's ending clauses and `fire_held`; Netherton's joined, executed and scorched; Quintero's KO, wrong accusation and wound; Arakawa's and Malhotra's wrong accusation; Vector's and Phantom's on-team four). HaX's SAFETYNET default "Handler." is removed from `credits_sections.json` and the ERB copy (every ending has its own clause). Kowalczyk's IN THIS OPERATION clauses stay: on Join she is still listed there. Netherton's SAFETYNET default doesn't print on executed or scorched; it does on the other three.
- R2-m17: the music and carry-over comments in the ERB now match the code.

**Alignment round 3 (ink side; `ALIGNMENT_REVIEW_F_R3.md`).**
- **R3-M1:** the St. Catherine's season line has three fixed forms by `database_outcome`:
  - secured: "…They still aren't. That was my signature too.";
  - both_wiped: "…They were on the map we just burned.";
  - disclosed: "…They will be now.".
  None of the other season lines depends on the database outcome.
- **R3-m5:** on executed with a double-cross, the van line is "In the van, your phone lights three times. Two numbers with no name, which you don't open. Then HaX.".
- **R3-m6:** the hearing's `the_rest` carries the `reading_told_hax` line (the same string as at 06:00).
- **R3-m7:** on an arrest with the treatment funded, the sting is "You handed Torres to the police, and your service paid his wife's bills afterwards. Cheaper than paying them before.".
- **R3-m9:** the Citadel's phone line is "Somewhere on a road out of Montana, your phone lights. One message from HaX. '0x00.' You don't answer.".
- **R3-m3:** the ink and texts comments no longer call T-47 to T-56 the thread's record. Since R2-m10 they are inert (skipped on `six_open`). Deleting the mappings is the builder's call.
- **Corrected above:** the R2-m14 note.

**Alignment round 3 (JSON side; ALIGNMENT_REVIEW_F_R3.md).**
- R3-m1: the second "never told" Noor row also needs `m05_found_pipeline_list === true`, so the two never both print.
- R3-m2: first SAFETYNET clauses (warning), in `credits_sections.json` and the ERB copy: Vector on `vector_on_team && vector_ko` "Cryptographer. Knocked out by his own agent. Back at the annex on Monday."; Phantom on `phantom_on_team && phantom_ko` "Auditor. Floored by the agent whose kit he audits. He has filed it."; Quintero on `quintero_ko` "Raid lead. Put on the floor by her own agent. On her feet by Friday, and asking questions." (replacing her old `quintero_ko` clause, which it covers). The merge order stays as in R2-m14.
- R3-m3: the 06:00 texts T-47 to T-56 are deleted from the ERB (Ghost's eight, the Recruiter's, executed's HaX). The closing scenes carry them, and the phone can't be opened between `six_open` and the credits. This supersedes R1 A2's "keep the JSON texts for the thread" and R2-m10's `six_open` skip. The texts file marks them cut.
- R3-m4: T-57 ("0x00.") is deleted from the ERB; the Citadel scene carries it.
- R3-m8: the season fallback row reads "Still answering for every operation."
- R3-m10: the 0x00 and merge-order comments in the ERB match the code. Correction to R2-m14: two of the 25 deleted clauses did print, Netherton's and HaX's Join clauses; `safetynet_join`'s defaults now say the same.

**Alignment round 4 (ALIGNMENT_REVIEW_F_R4.md; ink and JSON).**
- R4-m1: SAFETYNET recall clauses ahead of the presence catch-alls, in `safetynet` and `safetynet_join` (both copies): Vector on `vector_on_team && vector_recalled` "Cryptographer. Sent back, then recalled. Still waiting for an apology."; Phantom on `phantom_on_team && phantom_recalled` "Auditor. Sent back, then recalled. It's on his list."
- R4-m2: `safetynet_join` gains the Vector and Phantom knock-out clauses first (the `safetynet` strings); Quintero's Join knock-out clause is "Raid lead. Put on the floor by her own agent. On her feet by Friday, and asking questions." (warning).
- R4-m3: Kowalczyk's `kowalczyk_ko` SAFETYNET clause is "Breaching lead, Task Force Null. Eleven years in SAFETYNET. Woke in the second van. Never accused. Badge still active." (warning).
- R4-m4/m5 (`m10_six_oclock.ink` `scorched_close`): Netherton's map line now answers "And the database?" first, before the season tunnel; two forms by `head_start_out` ("none": as before; otherwise "Nobody holds the whole map now. Not him, and not whoever sits in my chair next."). Then the season, the suspension, `#set_global:six_done:true`, and "I wanted to do the same…" as the last line, so the hearing still triggers one line before the end. The both-wiped St. Catherine's season form ends "They were on it too."
- R4-m6 (`m10_citadel.ink`): the button is "[(Keep driving.)]"; the header says her message is narrated on the player's road (T-57 cut).
- R4-m7: `recruiter_phone` is gone from the phone's `npcIds`, its NPC record is deleted, and `m10_recruiter_phone.ink/.json` are deleted (staged with `git rm`). The START KIT comment, ASSET_LIST row and texts file speaker list match. `phone_beat` carries her line.
- R4-m8: comments in `m10_six_oclock.ink` and `m10_ghost_phone.ink` say the 06:00 texts are cut; the texts file's §6 is one sentence saying T-47 to T-57 are cut; the CONTRACT lines that specified them as JSON texts carry "(superseded: §11 alignment R3-m3/m4)".
- R4-m9: m06 rows in `elsewhere_two` (Join leaves it out), one per save, all on `m06_completed`: seized → "The twelve point eight million: frozen in a SAFETYNET wallet. It never reached the cells."; watched (not seized) with `database_outcome === 'disclosed'` → "The HashChain wallets: tagged since the fund. Dark since the disclosure." (warning); watched otherwise → "The HashChain wallets: still tagged. Still watched." Every save with `m06_completed` gets exactly one row: m06's call-in needs `assets_decided`, so a deferred decision can't complete m06 (corrected in R5). Departure from the review: one seized row, not two split by `database_outcome`. m06's own record of the freeze ("$12.8M moved into a SAFETYNET wallet. The balances never reach the cells.") supports that wording; the "victims' fund" and "held as evidence" readings aren't in m06. "The tags dropped at five past" became "Dark since the disclosure.", which names the cause without a time the scene doesn't state.
- Voiced-line delta for FINALE_TTS_COUNT.md: +1 Netherton line (the "whole map" form) and 1 Netherton line reworded (the both-wiped St. Catherine's form). Credits, buttons and comments aren't voiced.

**Alignment round 5 (ALIGNMENT_REVIEW_F_R5.md).**
- R5-m1 (Join credits): `safetynet_join`, both copies, gains Malhotra's `officer_out === 'malhotra'` "Comms. In the second van with his headset off when it went out." and Arakawa's `officer_out === 'arakawa' && !arakawa_ko` "US liaison. Sent back to the post. Reopened the county road anyway." as first clauses, and Vector's and Phantom's wrong-accusation clauses after their knock-out and recall clauses (the `safetynet` strings). Kowalczyk's IN THIS OPERATION list: "Named. Left cuffed in the van." also needs `wren_held`; "Named on the line. Nobody was free to hold her." (`sleeper_caught && ending === 'joined'`) follows it; "Knocked out below ground. Never accused." moves ahead of "Never came through the service door. No need.". Checked: the printed non-Join credits are identical over 100,000 random states of the whodunit globals (closing-sequence.js `expandCredits`, before and after), and the seven Join cases print the intended lines.
- R5-m2: the scorched St. Catherine's season form ends "They won't be now."
- R5-m3: the Citadel's last narrator line is "At the Citadel, on the screen beside him, the casualty count climbs. Nobody turns it off."
- R5-m4: "The HashChain wallets: tagged since the Architect's Fund paid out. Dark since the disclosure." (warning).
- R5-m5: superseded markers at the group A file row, row 10-9 and `database_beat`; T-55's texts row reads "**Cut** (alignment R3-m3; R4-m7 deleted `recruiter_phone` and its ink)". The R4-m9 note on deferred m06 saves is corrected: every `m06_completed` save gets exactly one row.
- Voiced-line delta: one Netherton line and one narrator line reworded; no new lines. (R4 counted the Netherton line as reworded already.)

**Alignment round 6 (ALIGNMENT_REVIEW_F_R6.md; Join credits only, nothing voiced).**
- R6-m1: in `safetynet_join` (both copies), Vector's and Phantom's clauses run knock-out, `officer_out`, recall, presence default, as in `safetynet`; a man sent back a second time after a recall is credited as sent back.
- R6-m2: Arakawa's Join `officer_out` clause is "US liaison. Sent back to the post. The sheriff opened the road at four." (six_oclock's "Sheriff opened the road at four.").
- R6-m3: the two "Zero Day: got nothing tonight" ELSEWHERE rows need `ending !== 'joined'`; on Join a share killed at four prints "Zero Day: shut out at four. Given everything at six." or, with Vos named, "… Its broker, Pieter Vos, named." (both warning). With the "still trading" rows (`share_zero_day !== 'stopped'`) the four are exclusive.
- Checked: printed credits over 20,000 random states per ending, before and after: no non-Join difference; on Join only the Arakawa line, the Zero Day rows and Vector's and Phantom's second-accusation lines change.

**Alignment round 7 (ALIGNMENT_REVIEW_F_R7.md; nothing voiced).**
- R7-m1: Victoria's three gallery outcomes (`confronted`, `talked_down`, `walked`) and Vos's secret stop Zero Day's share only on `head_start_out === ''` (was `share_zero_day !== 'released'`). `head_start_out` has one writer, the four `outer_lock_open` mappings, which set `both`, `zero_day`, `ghost` or `none` once, when the lock opens; nothing resets it. So the guard is "before four" exactly: a pre-four choice stops any share as before, and after four a traced share stays traced. Proved with an engine-level trace (inkjs runs Victoria's escaped menu after the lock and confirms "[Go.]" is offered and writes `walked`; the scenario's own mappings are then replayed with npc-manager.js's condition evaluator): trace → lock → "[Go.]" now ends `traced` (was `stopped`); trace → "[Go.]" → lock still ends `stopped` with `head_start_out` `none`; the same two orders for Vos's secret behave the same way. Not run in the browser. Victoria's and Vos's voiced "the order goes away" lines after four are left for phase 4.
- R7-m2: the Join Zero Day rows read "Zero Day: shut out at four. Given everything by the key." (and the Vos form). These rows are ERB-only (ELSEWHERE), not in `credits_sections.json`.
- R7-m3: Vos's IN THIS OPERATION credit gains four rows ahead of the old four (one per `vos_outcome` of `refused`/`avoided`, by Join or not), on `share_zero_day === 'stopped'`: Join "Named. His delivery was cancelled. He caught his flight."; otherwise "Named. Arrested on the walkway, waiting for a flight." First match, so every Vos save prints one row. ERB-only too.
- Checked: printed credits over 20,000 random states per ending, before and after (whodunit, Zero Day and `vos_outcome` globals): only the Vos stopped-share rows and Join's Zero Day rows change.

**Alignment round 8 (ALIGNMENT_REVIEW_F_R8.md).**
- R8-m1: once `outer_lock_open` is true, recruited Victoria (`m10_victoria.ink` `recruited`, after her default `refused`) goes to `gallery_rest`, which gains a `refused` arm: "You found your own way in. I'll remember that." (new voiced line). Vos (`m10_vos.ink` `gallery`, after his default `avoided`) goes to `vos_rest`, whose existing lines cover `avoided`. Escaped and threat Victoria are unchanged (their choices after four are real; their "order goes away" lines stay deferred to phase 4).
- R8-m2 (`m10_gary.ink` `tech_menu`): each `imran_outcome` write is guarded on `imran_outcome != "ko"`. On the walk-out pick with Imran knocked out, Gary says "Right. Power room's open. I'll get Imran to the medics first." (new voiced line) in place of "Imran, coat…" and Imran's Farah line.
- R8-m3 (ERB): `npc_ko:voltage_power` writes `voltage_outcome: ko` only when it isn't `stood_down_print` or `talked_down`, and `cut_by_hand` only while `!gallery_shutter_cut` (as Wendell's).
- Proof (inkjs and engine-level, no browser): recruited Victoria before the lock offers her menu; after the lock she gives the new line, offers only "Goodbye", and stays `refused`. Vos before the lock offers the card; after it, his resting line and only "Goodbye", staying `avoided`. Gary's three picks with Imran knocked out leave `imran_outcome` `ko` (walk-out with Imran standing is unchanged). Replaying `npc_ko:voltage_power` through the scenario's mappings and npc-manager.js's evaluator: after a print or talk-down stand-down his outcome stands and `cut_by_hand` stays false (before the fix: `ko` and true); after a fight, `ko` and `cut_by_hand` as before. The credits' random-state comparison shows no printed change (these fixes act on the globals the credits read, not on the rows).
- Voiced delta for FINALE_TTS_COUNT.md: +2 lines (Victoria 1, Gary 1).

**Alignment round 9 (ALIGNMENT_REVIEW_F_R9.md; ink only).** Within a session the engine reopens a person-chat at the knot that owns the saved choices, so a guard only in an entry knot is skipped on a reopen; each fix below repeats the guard in the menu knot.
- R9-m1: `{outer_lock_open: -> gallery_rest}` at the top of Victoria's `recruited_menu`, and `{outer_lock_open: -> vos_rest}` at the top of `vos_menu`.
- R9-m2: on a first meeting after the lock, Vos still says "You put Sterling in hospital. I sent flowers. Business is business." on an m03 knock-out (existing line), then rests.
- R9-m3: `{server_hall_warned: -> warned}` at the top of Asante's `hall_menu`.
- R9-m4: `{gary_ko or gary_outcome == "ko": -> workshop}` at the top of Imran's `follows_gary`, so a knocked-out Gary hands Imran his own scene.
- R9-m5: telling Wendell makes the cut only on a live shutter, in a new `wendell_switch` knot (no tunnel, since a reopen can land there), which also sets `cut_by_hand = false`; on a dead shutter he goes straight to "Dale's on the next shift…" (new `wendell_dale` knot holds that line). No new line.
- Sweep (the same class, found and fixed): Imran's `imran_menu` repeats `imran_decide`'s settled-outcome test (HaX's `card_cloned` mapping can settle him while he's parked there); captured Voltage's `captured`, `captured_menu` and the three `cut_pN_menu` stitches go to `captured_rest` on `gallery_shutter_cut` (Wendell or the phone voice can cut it while he waits); Wendell's "Never mind" sets `cut_by_hand` only on a live shutter. Checked and left: Nightshade's `shown_menu`, `unshown_menu` and `arrested_menu` (only their own picks write `door_scene_done` and `nightshade_map_used` on those branches), escaped Voltage (nobody else can cut while he stands), Gary's `tech_menu` (its outcome writes follow the ERB's precedence for a cloned card), Fonoti, the guards, Ghost and Victoria's line (no external writer reaches their menus). The closing scenes and Tesseract were outside the sweep (forced scenes with their own routers).
- Proof: reopen simulations on the compiled ink (talk, close, the event, reopen at the owning knot): Victoria and Vos rest after the lock and keep `refused` / `avoided`; Vos's flowers line plays on a first post-lock meeting; Asante gives her warned line and stays `untouched`; Imran opens his own scene after Gary is knocked out; Wendell told after the phone cut skips the switch beat, told before it cuts and clears `cut_by_hand`; Imran keeps `card_cloned`; captured Voltage rests after Wendell's cut. Not run in the browser. The ERB and credits are unchanged this round.
- Left for later: a captured Voltage who has chosen "I'll do it" keeps `by_hand` if Wendell then cuts the shutter.
- Voiced delta: none.

**Alignment round 10 (ALIGNMENT_REVIEW_F_R10.md).** The reopen rule: the engine re-enters the knot that owns the saved choices (the knot only, never a stitch) with its call stack reset.
- R10-M1 (`m10_tesseract.ink`): `rec_albion`, `rec_derek`, `rec_debrief`, `rec_cold` and `case_lesson` are tunnels that hold choices. Each now opens with `{ tess_menu: ~ tess_menu = false - else: -> core_router }`, and `~ tess_menu = true` sits on the line before each tunnel call, so a reopen re-routes through `core_router` → `case` → "Where was I. Your record." and calls the record properly. Proved (the reviewer's scratch test on the committed file): reopens at `case_lesson`, `rec_albion` and `rec_derek` play and pick without error, and a straight run still reaches "Three things.". Swept every m10 ink for knots with choices that end `->->`: only `m10_six_oclock.ink`'s `more_menu`, `fortyseven_kept`, `fortyseven_denied` and `season` remain; that scene is `disableClose` and a reload restarts it at `start`, so they are left.
- R10-m1: each officer's `accuse_check` (Arakawa, Malhotra, Phantom, Quintero, Vector) opens with `{ not <x>_can_accuse(): -> menu/post }` (the knot its "[Forget I said it.]" uses). Proved: parked at "Sure?", Kowalczyk accused elsewhere, reopen: the officer's re-entry line and menu, no "[I'm sure.]", `officer_out` unchanged.
- R10-m2: `{gallery_shutter_cut: -> cut_call}` at the top of Vance's and Elena's `cut_0`–`cut_2` and HaX's `cut_step_0`–`cut_step_2` and `cut_breakers`. Proved (`phone_cut.cjs`): each parked step, shutter cut meanwhile, reopen: "Shutter's dead already…" / "The shutter's already dead…" and "[Right.]".
- R10-m3 (`m10_gary.ink`): `gary_c_seen` is set in `consultant_imran`, after his pointer to Imran. Proved: Esc at the first choice, then a reopen or a reload, replays the opener and both choices, and the pick reaches "That's Imran at the far bench…".
- R10-m4: escaped Voltage's `escaped` sends `fought` to `fight` (re-arming him and Static with "Then be quick about it."); Victoria's `threat_missed` carries `#hostile:victoria_threat` on its fresh-entry line. Proved: after a fight and a reload, Voltage re-arms and stays `fought` with only "[Stay down.]"; after a miss and a reload, Victoria's line carries the hostile tag. (Reason corrected in R11: a reload restores hostility since 8e868565; the re-arm covers a Restart after the player is knocked out, which calms hostiles.)
- Sweep addition: captured Voltage's `cut_p0`–`cut_p2` knots also test `gallery_shutter_cut` at the top (round 9 put it in the stitches, which a reopen never enters directly).
- R10-m5 (reword route, true on every save): Gary's 06:00 `avoided` line is "Nobody decided anything about me all night. Same as St. Catherine's."; Imran's is "Nobody made me choose, all night. Same as the board."; Imran's default credit is "Left at his bench at six, under his own sheet." (Join: "Left at his bench."). The credits comparison shows only that line changing.
- Voiced delta for FINALE_TTS_COUNT.md: 2 lines reworded (Gary, Imran at 06:00); no new lines.

**Alignment round 11 (ALIGNMENT_REVIEW_F_R11.md; wording only).**
- R11-m1: the 06:00 `avoided` lines (replacing R10-m5's) are Gary "Nobody's problem all night. Same as St. Catherine's." and Imran "Left me to it all night. Same as the board."; both hold whether or not the player spoke to him, and keep the echo.
- R11-m2: Imran's default credit is "Still at his bench at six, under his own sheet." (Join: "Still at his bench."). ERB only; `credits_sections.json` doesn't carry it. The credits comparison shows only that line changing.
- The R10-m4 comments (`m10_voltage.ink` `escaped`, `m10_victoria.ink` `threat_missed`) and the R10-m4 bullet now give the right reason: a reload restores hostility (since 8e868565); the re-arm covers a Restart after the player is knocked out.
- Voiced delta: 2 lines reworded (Gary, Imran at 06:00), replacing R10's two rewordings; no new lines.
