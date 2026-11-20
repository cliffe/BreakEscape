# m10 Full Disclosure: Stage 8 review, round 1

## 0. Verdict

**Fix first, a short pass, then stage 9.** No blockers. Five majors, fifteen minors. Nothing found soft-locks the mission, strands a critical-path task on a knock-out, or makes an ending unreachable. Join ENTROPY is three deliberate steps, each with a way back, and can't be reached any other way. The cold ending is labelled, warned and confirmed. Each of the six endings is reachable on a cold start.

The majors are cheap, but stage 9 can't wire them correctly as the documents stand: one needs a small ink edit (Victoria on a traced share), and four need a doc ruling or a short list before a mapping is written (the 06:00 clock step, the tunnel post's visibility rule, recruited Victoria's unanswered default, and the barks and texts that have no single list). An afternoon's work, then assembly.

Top five:

1. **M-1** Victoria treats a traced Zero Day share as dead, so trusting her after a trace opens the lock with a false line and no sale (`m10_victoria.ink:57`).
2. **M-2** The tunnel post's visibility rule contradicts itself, and `breach_announced` keeps the guard there on the branches where Nightshade's map or override should empty it (RL §2.2, OT §16).
3. **M-3** The `t0600` clock ruling (step on `six_done`, not on the scene's open) is in the dev log only; OT §6, OT §16, FA §4.2 and FA §21's stage 9 handover still say "as the scene opens".
4. **M-4** A recruited Victoria the player never speaks to ends as `""` or `avoided`, not `refused`, so her watch drops off the database list, the secured cell and the card.
5. **M-5** m10 has no single list of its JSON barks and texts (m09 has `texts/`); about thirty-five strings sit across six documents, and Ghost's 06:00 text on the two selling branches has no wording.

## 1. Scope, method and what was not opened

Reviewer: stage 8, read-only, 2026-10-21. Applied `story_design/story_dev_prompts/08_scenario_review.md` with `.claude/skills/scenario-design-review/SKILL.md` (which wins), and the parts of `mission-puzzle-chains` and `mission-alignment-plan` that can be judged before assembly. `scenario.json.erb` does not exist yet, so the validator and the walkthrough skill could not run; §10 lists what stage 9 must run and what it should see.

Read: `docs/agents/FINALE_BRIEF.md`; the current stage 0–6 documents; `scenarios/m10_full_disclosure/CONTRACT.md` (all of it); the shipped ink (HaX's phone, Tesseract, 06:00, the hearing, the Citadel, Victoria and Kowalczyk in full; the rest by grep); `credits_sections.json`; FINALE_ARC §3.2, §3.5–3.7, §4, §21. Checked against code where a claim was cheap to check: the eight draft room maps exist at the sizes RL §2 gives (`public/break_escape/assets/rooms/`), `flags_for_vm_slice` (`app/models/break_escape/mission.rb:274-280`), the station-qualified flag id (`games_controller.rb:2532-2559`), the include's counts (244 `VAR`s: 99 imports, 145 others, matching FA §21), every compiled `.json` newer than its `.ink`, and `credits_sections.json` parses. Ran `dialoguelint.mjs` on the folder (read-only); its findings are cited where they matter.

**Not opened:** `finale/VM_SHAPE.md`, `finale/FINALE_VM_PLAN.md`, `docs/agents/SECGEN_MODULE_PLAN.md`, `finale/SECGEN_DRAFT_NOTES.md`, SecGen, the field guides. VM flags are judged by their story meaning only (flag 1 the monitoring host, flag 2 the staging schedule, flag 3 out of the release container, flag 4 the core host). VM questions are in §11.

Short names: **s0** `stages/stage_0_initialization.md`; **arc** `stage_1/story_arc.md`; **SE** `stage_2/storytelling_elements.md`; **MC** `stage_3/moral_choices.md`; **OT** `stage_4/objectives_tasks.md`; **RL** `stage_5/room_layout.md`; **S6** `stage_6/lore_fragments.md`; **CT** `scenarios/m10_full_disclosure/CONTRACT.md`; **FA** `finale/FINALE_ARC.md`; ink files by name under `scenarios/m10_full_disclosure/ink/`. Line numbers are as of this review.

## 2. Findings

Each finding: where, the problem, the fix, and which document or file owns the fix.

### 2.1 Blockers

None.

### 2.2 Majors

**M-1. Trusted Victoria treats a traced share as dead.** `m10_victoria.ink:57` sells the raid only on `share_zero_day == "live"`; `:61` then says "Their share's dead, so they've nothing left to pay me with." On a trace (`share_zero_day == "traced"`, set by the console's "[Let it run. Trace who gets it.]", `m10_phone_agent0x99.ink:535-537`) the share is still going out at the lock, so the line is false, she doesn't sell, no alarm comes, and her watch then fails `close_compute`'s test anyway (`trusted` counts only with `head_start_killed == "zero_day"`, `m10_carryover_vars.ink:358`). MC §3.5 (`moral_choices.md:217`) says the safe trust needs the share **dead**, which a trace isn't. The resting line at `m10_victoria.ink:190` has the same test. HaX's "[What's still live?]" correctly reads a trace as live (`m10_phone_agent0x99.ink:417-424`), so the player is told one thing and shown another.
*Fix:* in both places test `share_zero_day != "stopped"` (live or traced: she sells); RL §2.7's reinforcements condition (`room_layout.md:230`, "with Zero Day's share live") becomes `globalVars.victoria_gallery === 'trusted' && globalVars.share_zero_day !== 'stopped' && !globalVars.nightshade_taken_in`. *Owner:* ink group C (`m10_victoria.ink`); RL §2.7 for the mapping; MC §3.5 one clause ("dead, not traced").

**M-2. The tunnel post's visibility rule contradicts itself.** RL §2.2 (`room_layout.md:108-110`) shows `tunnel_guard` when "Helena's plans used (default), **or the door announced the player**", and neither copy "Nightshade's map used, or the shown branch's override". OT §16 (`objectives_tasks.md:711`) sets `breach_announced` on every breach without the tether and lists `tunnel_guard` as its reader. The door announces the player on every branch except the tether, so on the map and override branches both rules hold, and a literal build puts the guard back in the post the player paid for (MC `moral_choices.md:78`: the map means "the post is empty when the player passes"; the shown branch's override, S6 `lore_fragments.md:619`: "the board doesn't talk to the floors below"). That undoes the m08/m09 Nightshade payoff on the two best branches. The alarm panel's lamps read the same `breach_announced` (RL `:124`), so they'd also light while the player holds the override.
*Fix:* one rule, three copies, all `&&`: `tunnel_guard` on `!nightshade_tethered && !nightshade_map_used && !override_held`; `tunnel_guard_kettle` on `nightshade_tethered`; neither otherwise. Drop "or the door announced the player" from RL `:108`. Set `breach_announced` on `!nightshade_tethered && !override_held` (OT `:197`, `:711`). HaX's `breach_call` line on the override branch ("It's read your badge. They know you're in.", `m10_phone_agent0x99.ink:571`) can stand if "they" is Tesseract, but a one-line override variant ("It's read your badge. Only he knows.") would make the override audible; ink group B's call if wanted. *Owner:* RL §2.2, OT §4.1 and §16; optionally ink group B.

**M-3. The 06:00 clock step is ruled but not written down where stage 9 reads.** The ruling (`scenarios/FINALE_DEV_LOG.md:358`): `raid_clock` steps to `t0600` when HaX's rest turns the screen over, by a mapping on a flag the rest sets (for example `six_done`), not as the scene opens. The ink matches the ruling (`m10_six_oclock.ink:37` "a few minutes before six"; `:448` "On the table, the screen turns over to six."). Still saying the opposite: OT §6's table (`objectives_tasks.md:360`, "`six_oclock`'s mapping as its scene opens"), OT §16 (`:697`), FA §4.2 (`FINALE_ARC.md:647`, "`t0600` the 06:00 scene"). FA §21's stage 9 handover (`:2180-2203`) doesn't list it at all. A stage 9 author working from OT will build the step on the open.
Two more details for the same fix. (a) `six_done` is set on the scene's last line, the same line that completes `close_the_night` and opens the conclusion, so the screen's `t0600` text (S6 `lore_fragments.md:548`, "RELEASE: DISARMED. NOTHING WENT AT SIX.") is never seen in play; that's fine, since the narrator says it, but stage 9 shouldn't spend effort making it visible. (b) On `scorched`, `six_done` is set before the hearing (`m10_six_oclock.ink:503`), so the step lands there too, which is correct.
*Fix:* OT §6 row "06:00" → "`t0600` by HaX's mapping on `global_variable_changed:six_done` (with the forward-only guard), not on the scene's open"; the same in OT §16 and FA §4.2; add a line to FA §21's stage 9 handover. *Owner:* OT §6, §16 (author); FA §4.2, §21 (arc-keeper).

**M-4. A recruited Victoria the player never answers doesn't end as `refused`.** MC §3.5 makes "unanswered" the default and gives it a payoff: "she is never handed anything, her watch and the tap both survive" (`moral_choices.md:219`). The ink writes `refused` only on her first line (`m10_victoria.ink:27-29`), so a player who walks past her and cracks the lock leaves `victoria_gallery` at `""`. Worse, MC's own defaults paragraph (`:192`) says the room exit sets `victoria_gallery` to `avoided`, and CT §1.5 (`CONTRACT.md:218`) limits the room-exit default to the escaped branches. Either way `close_compute`'s test (`m10_carryover_vars.ink:358`) fails, so Sterling's watch vanishes from the database list (`m10_tesseract.ink:907`), from the secured cell, from the card's cells line and from 06:00's dark-ops lines (`m10_six_oclock.ink:375`). The close then says the player burned an operation they never touched.
*Fix:* stage 9 adds a mapping on `room_exited` from the gallery **and** on `outer_lock_open` (the player may never leave the gallery westward) with `m03_victoria_fate === 'recruited' && victoria_gallery === ''` → `setGlobal victoria_gallery: 'refused'`. MC `:192` amended to "`refused` on the recruited branch, `avoided` on the others". *Owner:* MC §3.5 (one clause); CT §1.5 rule line; stage 9 mapping.

**M-5. No single list of m10's JSON barks and texts; one set has no wording.** m09 ships `scenarios/m09_digital_archaeology/texts/` (A HaX texts, B Recruiter texts, C texts and credits). m10 has nothing equivalent: CT §4.5 (`CONTRACT.md:581`) and OT §13 (`objectives_tasks.md:647`) name categories, FA §21 (`:2190`) names a dozen more, and the wordings are spread over OT §3–§6, SE §2.4 and §3.5, MC §3, S6 and CT §5.8. A stage 9 author has to reassemble about thirty-five strings, their speaker, trigger and condition, from six documents; misses are likely, and each miss is a beat that never plays (the pointer layer of §5 depends on most of them). One set has no wording anywhere: **Ghost's 06:00 text on the selling branches** (`ghost_sale` `stopped` or `bait`). CT §5.8 row 10-2 (`CONTRACT.md:663`) says it is keyed on `ghost_sale`, but SE `storytelling_elements.md:592` and MC `moral_choices.md:107-124` only word the kept and refused branches.
*Fix:* before stage 9, the orchestrator has one agent write `scenarios/m10_full_disclosure/texts/BARKS_AND_TEXTS.md`, a table of every string with speaker NPC id, event, condition, `onceOnly` and source line, using §3's inventory below as the starting list, and adds the two missing Ghost texts (one for talked out of the sale, one for the bait, which can split on whether the console killed the resale; Ghost's voice, under 25 words). *Owner:* orchestrator (texts file); SE §3.5 for Ghost's two lines.

### 2.3 Minors

**m-1. HaX's hub can show eleven choices.** OT §5's busiest save (`objectives_tasks.md:339`) assumes the shutter is cut by the time the player is in the server hall, but `power_room` → `server_hall` has no lock (OT §4.8 `:289`), so a player can take flag 2 with the shutter still live. With the voice on HaX, Quintero wrongly sent back, the bench log read (her clearing clue, and not yet the sign-out), the alibi not yet taken, the backdoor live and guide 3 offered, the hub shows "[What's still live?]", "[The backdoor.]", "[The hatch?]", "[Talk me through the shutter.]", "[Bring Quintero back.]", "[I know who WREN is.]", "[Who signed for the case?]", "[Who was where at ten past?]" and the three sticky choices: eleven (`m10_phone_agent0x99.ink:52-79`). "[The hatch?]" has no asked-once guard (`:57`, `:483-486`), unlike every other topic. *Fix:* add `hax_hatch_asked` to `hatch_topic` and its gate; recount on the seeded save. *Owner:* ink group B; OT §5's cap paragraph.

**m-2. "Shutter's down."** OT §3 (`objectives_tasks.md:148`) gives HaX's aim-transition bark as "Shutter's down. The hall's next.", against the "dead, never down" rule (CT `:627`; B-04). Stage 9 would copy it into JSON as written. *Fix:* "Shutter's dead. The hall's next." *Owner:* OT §3.

**m-3. The lock guard's pointer bark has two speakers in the docs.** OT §4.5 (`:242`), OT's milestone note (`:771`), RL §2.7 (`:227`), MC §3.5 (`:200`) and CT §5.8 10-3 (`:664`) agree: Fonoti's own bark, first person, "That takes the shift code. It's on my card, and it stays there." FA §4.0 (`FINALE_ARC.md:603`) still says it "comes from someone else (for example `monitor_guard`: 'Shift code's on the walkway guard.')", and FA §21 row 10-3 (`:2144`) says "the pointer bark moved off him". *Fix:* FA follows OT; stage 9 also gates the bark on `!globalVars.fonoti_ko` so a man on the floor doesn't speak. *Owner:* FA (arc-keeper); stage 9 condition.

**m-4. "SECOND BUYER: STOPPED" for a Ghost who never sold.** OT §6 (`:378`) maps `ghost_sale = stopped` → `share_resale = stopped`. Ghost's first line writes `stopped` on the kept and refused branches (MC `:105`), where nothing was ever for sale, so the screens read STOPPED instead of NONE (FA `:649`: "NONE where Ghost never sold") and HaX's "[What's still live?]" can say "Both stopped." (`m10_phone_agent0x99.ink:432`). No logic depends on it (`head_start_out` tests `!== 'live'`). *Fix:* the mapping also needs `globalVars.share_resale === 'live'`. *Owner:* OT §6.

**m-5. One credits clause can never print.** S6 §3.3 (`lore_fragments.md:952`): `ghost_sale === 'selling' && head_start_killed === 'ghost'`. `selling` is only the call's first-line default and every last choice overwrites it (MC `:133`), and "[Kill the resale.]" needs `ghost_sale == "bait"` (`m10_phone_agent0x99.ink:531`). *Fix:* drop the row. *Owner:* S6.

**m-6. The console can say "Pick." with nothing to pick.** On a walk back from the gallery after Victoria or Vos stopped Zero Day's share, with no resale live and the console unused, `console` prints "She cancelled Zero Day's. Nothing to follow." then "I can kill one feed, or follow one. Not both. Pick." (`m10_phone_agent0x99.ink:510-518`) over a menu holding only the backdoor (if live) and "[Leave it for now.]". *Fix:* print the "Pick." line only when a share option will show. *Owner:* ink group B.

**m-7. The flag 3 guide can't be had before flag 2.** `guide3_offered` is set on the hall console's use "once `flag2_submitted`" (OT §16 `:741`), and OT §3 allows flag 3 first (`:172`). A player working flag 3 first gets guide 2 from the button (`m10_phone_agent0x99.ink:133-140`). Small, but it's the support for the VM step most likely to stall. *Fix:* offer guide 3 on the sealed hatch's first use as well, or drop the flag 2 condition. *Owner:* OT §16; stage 9 mapping.

**m-8. Tesseract's sprite after the ending.** RL §2.8 (`:248`) has him visible "always". On `scorched` he is gone in the dark, on `joined` he walks out, on `arrest` and `surrender` he goes to a van, and on `lethal` and `executed` he is down; the closing scene opens 1.5 s after his conversation closes, and on a reload with `ending` set the backstop re-opens the scene with him still seated. The skill's "narrated as taken away whose sprite is still standing" check applies. *Fix:* hide `tesseract` on `ending` set for `scorched`, `joined`, `arrest` and `surrender` (his own mappings, one per value), and either hide or swap to a down pose on `lethal` and `executed`; show `scorched_card` as RL already plans. *Owner:* RL §2.8; stage 9.

**m-9. Stale strings in FA that stage 9 might copy.** FA §4.1 step 0 (`FINALE_ARC.md:613`): "Two cells have it. They'll waste it." (the ink says "Much good may it do them.", `m10_tesseract.ink:103`). FA §4.4 gallery row (`:686`): "Who changed the code?" (retired; CT 10-11, "Who gave out the code?"). FA §4.0 (`:599`): "the breach, with Netherton and, where present, Vector and Phantom at the gate" (OT `:351`: Netherton stays at the table, no gate copy). FA §21 says the contract wins, so this is housekeeping, but these are the lines a stage 9 author grepping FA would find first. *Owner:* FA (arc-keeper).

**m-10. Count slips in OT §16.** `objectives_tasks.md:759` says "the ten guide flags" and "all fourteen"; there are eight guide flags and twelve new globals (FA `:2209`). *Owner:* OT §16.

**m-11. A test run imports a name m10 doesn't import.** OT §9 run A5 (`:480`) lists `m08 nightshade_tidied`; it isn't in FA §3.2 or the include. Harmless at runtime; confusing in a test file. *Owner:* OT §9.

**m-12. The SAFETYNET (Join) section ignores Quintero's state.** `credits_sections.json`, `safetynet_join`, Quintero: one unconditional clause, "Raid lead. Stood down at the outer lock.", printed when she was knocked out or sent back too. FA §21's open item 3 (HaX's Join clause against the Citadel's open channel) reads fine together: an hour later the channel is open, by morning the desk is empty. *Fix:* add `quintero_ko` and `officer_out === 'quintero'` clauses ahead of it, as in `safetynet`. *Owner:* ink group A (the JSON fragment).

**m-13. `m03_guard_bribed` still has no line.** FA §21 open item 1 (`:2175`): SE's Finance line ("five hundred pounds and a security guard in Cardiff") is in no ink and no list. Either place it as a HaX text (it belongs in M-5's list) or cut the import to Tier 3 (90 → 89). *Owner:* orchestrator decision.

**m-14. Lint items left on the shipped ink.** `dialoguelint` today: `m10_tesseract.ink` 19 asterisk cues in 185 spoken lines (CT §5.6 asks for m01's one per 37, about five); `not-x-but-y` on HaX's "Not both. Pick." (`m10_phone_agent0x99.ink:518`; CT §5.6 allows the pattern to the villain only) and on the 4+ knock-out sting (`m10_tesseract.ink:627`, his, allowed); 14 `blank-reentry` checks on silent phone homes and resting knots, which are by design. *Fix:* trim Tesseract's cues to the ones the words don't carry; record HaX's line as the accepted MC wording (`moral_choices.md:275`, C9) or reword ("One feed. Kill it or follow it. Pick."). *Owner:* ink groups A and B.

**m-15. The override is a `key` with no lock.** `alarm_override` is type `key` (S6 `:685`) and works by being carried (`onPickup`, S6 `:619`). The validator may warn about a key that opens nothing, and a player may hunt for its lock; the tag text ("While you carry it, the board doesn't talk to the floors below.") covers the second. *Fix:* none needed if the warning is expected; stage 9 notes it beside the five expected door warnings. *Owner:* stage 9.

## 3. Completeness: what stage 9 has, and where it lives

Every deliverable stage 9 needs exists as data or as a precise spec, except the barks and texts list (M-5) and the two missing Ghost texts. "Data" means stage 9 can copy it; "spec" means stage 9 writes JSON from an exact description.

| Deliverable | State | Where |
|---|---|---|
| Rooms, sizes, connections, draft maps | data; all eight draft maps exist at the stated sizes (checked) | RL §1, §2 |
| Objects, positions, variants | spec, one table per room | RL §2.1–2.8; strings S6 §1 |
| Locks and codes | data: story doors `rfid` `tg_story_lock_<room>`; power room `rfid` `tg_power_room_card`; cupboard PIN `2817`; outer lock PIN `6083`; model terminal password `DOUBLECOUNT`; fitter's locker key, pick only | OT §4, §4.8; S6 §2.1 |
| Items and ids | data | S6 §2.3; RL §4 |
| Start kit | data, with the cracker's three description variants | RL §4 |
| Aims and tasks | JSON-ready (6 + 1 aims, 28 tasks) | OT §2 |
| Task triggers and pointers | spec | OT §3 |
| Door mappings, catch-ups, holding barks | spec | OT §4.1–4.5 |
| Clock and eight countdown objects | spec, with an ERB helper named; `t0600` row stale (M-3) | OT §6; S6 §1.9 |
| NPCs, ids, visibility, KO | spec | RL §2, §2.9 (roster) |
| eventMappings the ink relies on | list | CT §3.3, §4.2; OT §13 |
| Globals: 99 imports, 7 exports, 145 locals | data, in the include; defaults match | `m10_carryover_vars.ink`; CT §2 |
| m01–m08 export additions (58 JSON-only) | list | FA §3.3, §3.7 |
| Ink, 33 files, compiled and current | data | `ink/` |
| Speaker display names | data; † forms to confirm, consistent across all ink and m09 (checked) | CT §1.2 |
| Music cues | spec, including `silence` | OT §7 |
| Closing card E1–E6 | data | S6 §3.2, §3.6 |
| Credits | data: IN THIS OPERATION, THE CELLS, ELSEWHERE in S6 §3.3–3.5; SAFETYNET and IN MEMORY in `credits_sections.json` (parses) | S6 §3; CT §5.9 |
| Teaser slot | spec: `teaser.enabledBy: teaser_enabled`, empty lines, on E1, E2, E3, E5 | S6 §3.1 |
| Field guides | working ids only (`m10_guide_flag1`…`4`), no `labUrl` yet | CT §7 item 5; §11 below |
| VM stations | spec, with `<vm>` a placeholder | RL §2; OT §2 |
| Barks and texts | scattered, no single list (M-5) | see below |
| Narrator voice block | not mentioned anywhere; 74 `Narrator:` lines in the ink need it | §10.1 |
| Test states | 35 runs as `new-game.rb` lines | OT §9 |

**The barks and texts to gather** (the starting list for M-5's file; each needs speaker, event, condition, `onceOnly`):

- HaX, Act 1: the post-cutscene pointer to the table by branch and to start the gate console (OT §3 `:139`); "The gate terminal's yours." (`:140`); the three blast-door holding barks (`:198`); "Whoever's in the power room runs your lights." at flag 1 (OT §5 `:322`); the door-log pointer after flag 1 (`:162`) and her volunteered read on the log's first read, which must also set `door_log_given` (CT `:166`); "Duty line. The handset on the desk is ringing." (`:203`); the stair's holding bark (`:143`); Ghost's handset pointer on the selling branches (MC `:130`); "Helena's plans didn't have him. Nightshade's would have." (MC `:79`); Hollis (CT 10-14); the Arakawa-out sheriff text (CT 10-11).
- HaX, Act 2: "That's his sheet. Read it." (`:145`); the margin pointer and "Copy just the code." (`:146`); the power-room reader's line (`:147`); the shutter transition bark (`:148`, reworded per m-2); the slot voice's cost text (OT §4.9 `:301`); "That console takes what you pull from the staging copy." (`:150`); "You walked past his sheet." (`:171`); flag 2's "It's set for four…" and the schedule's three entries (OT §6 `:380`, §5 `:335`); the hatch pointer (`:151`); the bench-log and third-clue lines (`:164`, `:165`); Voltage's print match (RL §2.5 `:166`); the `letters` bark (CT 10-11); the three gallery-stair holding barks (OT §4.4 `:222`); "Lost you up there. I'm back." (OT §5 `:337`); Mercer-arrested's entry line (RL §5 `:380`, wording to confirm); `m03_guard_bribed` if kept (m-13).
- Gallery: the camera, Farah and "Who gave out the code?" barks; Fonoti's pointer; Nightshade's intercom (MC §3.5; OT §4.5).
- Core: Tesseract's three idle barks (SE `:181-185`).
- 06:00 and after: Ghost's text by `ghost_answer` (SE `:592`) and by `ghost_sale` (missing, M-5); the Recruiter's text on `double_crossed` (SE `:592`); HaX's later message on `executed` (FA `:726`) and on Join (FA `:756`; FA §21 item 4 says neither contract words them, but FA itself does); Ghost's mid-call text on `m02_ghost_keys_used` (MC `:133`).

## 4. Consistency across stages and with the ink

Mostly tight. The stage 7 fold (OT "Stage 7 folded in", FA §21) carried the ink's wording back into the stage docs well; where I compared a design line with the ink (the release lines, the C18 answers, the database's costs, the hearing's last words, the console options, the double-cross, the accusation order, the cold choice's labels and warning), the docs and ink agree. What doesn't:

| Item | Says | Should say | Finding |
|---|---|---|---|
| `t0600` | OT `:360`, `:697`; FA `:647`: on the scene's open | on `six_done` (dev log `:358`; the ink) | M-3 |
| Tunnel post | RL `:108` "or the door announced the player"; OT `:711` | map or override empties it | M-2 |
| Trusted Victoria | ink `:57` treats traced as dead | MC `:217`: dead only | M-1 |
| Unanswered recruited Victoria | MC `:192` `avoided`; CT `:218` escaped only | MC `:219` `refused` | M-4 |
| Shutter bark | OT `:148` "down" | "dead" (CT `:627`) | m-2 |
| Pointer bark's speaker | FA `:603`, `:2144` someone else | Fonoti, first person | m-3 |
| `SECOND BUYER` on kept/refused | OT `:378` → STOPPED | NONE (FA `:649`) | m-4 |
| His `both` line, "Who changed the code?", Netherton at the gate | FA `:613`, `:686`, `:599` | ink; CT 10-11; OT `:351` | m-9 |
| Guide flag count | OT `:759` ten / fourteen | eight / twelve | m-10 |

**Ids and codes, checked across RL, OT, S6, CT and the ink:** every `#give_item` id in the ink (`ghost_cupboard_code`, `ghost_lock_code`, `vector_cupboard_code`, `gallery_code_card`, `vos_code_card`, `nightshade_payment`, `alarm_override`, the four guide ids) is in S6 §2.3 or CT §3.1 with its holder; `#clone_keycard:tg_power_room_card` matches RL's `rfidCard`; `#unlock_door` targets are `power_room` and `core` only, as CT §3.2 rules; the four story doors appear in no ink tag. Codes `2817` and `6083` agree in OT, RL and S6. `#hostile` always names an id. No ink writes `raid_clock` or any `mNN_` import (grep). The include declares 99 imports and 145 others, matching FA §21. The `ghost`/`zero_day`/`both`/`none` lines agree three ways (Tesseract's arrival, HaX's return, `what_went_out`).

**One rule not yet a written rule:** `credits_sections.json` and S6 use `&&` only, as FA §4.6 rules, while `README_scenario_design.md` says `||` works in credits (CT §7 item 1). The stricter rule is never wrong; the README sentence should follow it so stage 9 doesn't "simplify" a condition.

## 5. Does the player always know what to do next

Yes, on paper. One aim per stretch of corridor, each unlocking on the last (OT §2); every task has a named pointer (OT §3's last column); every story door has a holding bark naming what's missing (OT §4); HaX's "[Where are we?]" has a rung for every state, including after the ending (`m10_phone_agent0x99.ink:82-123`), and it is the reload recovery line, since a reload always respawns at the forward post. The two dark stretches are covered: the gallery (her last line before the jam names the stair, the walkway and the lock; the walkway's screen shows the shares) and the core before flag 4 ("Finish on my box first. I'll keep.").

The §2g table, from OT §2–§3 (task pointers counted as "in-world" when a line, bark or object names them):

| Aim | Required tasks | With a pointer | Dead-zone risk | Narrated transition |
|---|---|---|---|---|
| Breach the perimeter | 4 | 4 | none: the breach waits on three halves, each with a holding bark | `breach_call` |
| Get below ground | 3 | 3 | low | `stair_call` |
| Cut the gallery's power | 2 (+2 optional) | 2 | **low but real**: the server hall is reachable before the cut (no lock between them), so aim 4's tasks can complete while aim 3 is open | HaX's shutter bark (m-2's wording) |
| Find the release | 3 (+2 optional) | 3 | low: flags 2 and 3 in either order | `gallery_open_call` |
| Reach the core | 4 | 4 | none: Tesseract speaks on entry | his arrival and HaX's return |
| End it | 4 | 4 | none: the menus are his conversation | the closing scene |
| Find the sleeper (optional) | 0 (4 optional) | 4 | n/a | HaX's three clue lines |

The out-of-order stretch in aim 3/4 is fine for play ("[Where are we?]" handles every combination: `:98-105`), but stage 9 should walk it once (§10.4 W-6): take flags 2 and 3 with the shutter live, then cut it, and check aims 3, 4 and 5 open and complete in a sensible order on the panel, since a locked aim reveals itself when one of its tasks completes (OT §2 `:46`).

Two smaller pointer gaps: the flag 3 guide before flag 2 (m-7), and the forward post's opening HaX line, which asks the player to start the gate console before the table (OT `:139`); it is a JSON bark and appears in no list yet (M-5).

## 6. Clue distribution, lock order and the endings

**Lock order and soft-locks.** RL §3's lock graph and boss-key audit hold up. Every critical-path lock's opener is reachable before it is needed, and none is circular: the blast door (three halves, all at the forward post), the inner door (on entry, or the ladder), the stair (Ghost's call, which can't be burnt: every click on the handset opens it, `resume: true`), the power-room door (four ways, one of them a return trip to the fitter's locker that needs only the pick), the gallery stair (flags 2–3 and the cut, any order), the outer lock (five ways, two of them needing nobody: Ghost's code where given, and the dusted plate plus the cracker on every save). SOFTLOCK_PATTERNS S1 and S2 are addressed in RL §3 "What could break"; I found no burnt gate, no once-only content behind a sticky option, and no setter that can't be reached. The core resumes from globals on every walk-back (`m10_tesseract.ink:34-63`), and every menu writes on the pick.

**Knock-outs.** Every forced-scene holder is `koImmune` (Tesseract, Netherton, `hax_post`, Malhotra, the table copies, Nightshade's copies, captured Voltage, Kowalczyk's van and core copies). Every knockable slot-holder has a no-talk way past (RL §3: Imran and Gary → the fitter's card or a clone; Wendell and escaped Voltage → the phone voice's cut; Victoria, Vos, Fonoti → cracker, plate, dropped card). Raid members' knock-outs are written (`<name>_ko`, the staging guards, 06:00's unnamed bruises line, the credits). Arakawa down before his call is covered (OT §6 `:349`). No KO strands a critical-path task. One narrative gap: Tesseract's sprite after his ending (m-8).

**Cumulative kit.** Every tool from m01–m09 has a use, and each has a talk route beside it (RL §3 "Capability arc"): pick (fitter's locker), cloner (power-room card), fingerprint kit (keypad plate on every save; bypass panel on escaped Voltage), PIN cracker (outer lock, cupboard), CyberChef (the margin strip). m10 grants nothing new, which is right for a finale.

**Clue distribution.** The whodunit's three clues are in three places and three forms (the security office's door log; the alibi, on the line; the workshop's bench log, plus the sign-out sheet back at the forward post), and two clues cross at one name. Helpers replace a clue, never name the answer (FA §4.4). The accusation menu's order puts Kowalczyk third, never first or last (`m10_phone_agent0x99.ink:261-282`); a wrong name costs one officer's job and blocks a second wrong name until a recall, so brute force is costly but never blocking. The face-to-face cards gate on what the player has actually seen (`m10_kowalczyk.ink:204-235`: the bench card on `clue_bench_log`, the casing card on `workshop_entered`), and with cards missing she can still be named by the stonewall, with the same globals. No task title, aim or item name names WREN. The rebuttal evidence for exchange 1 sits on the workshop's critical path (the casualty sheet), with an optional sharper form behind a decode; exchange 2's evidence comes from m09 or HaX's flag 4 lines on a cold start, so every exchange is winnable on every save.

**Every ending reachable, and each signposted.**

| Ending | Reached by (`m10_tesseract.ink`) | Signposted before the pick |
|---|---|---|
| Arrest | standing menu `:961-975` or seated "[You're under arrest.]" then "[Hold fire.]" `:989-1000` | Netherton's F13 line before the standing menu (`:951`) |
| Surrender | standing menu, two or more points | the same line |
| Lethal (justified) | seated arrest, "[Fire.]" | HaX's flag 4 fact, "I can try to kill the feed. Try." (`m10_tesseract.ink:183`; repeated in her hub, `m10_phone_agent0x99.ink:491`) |
| Executed (cold) | "[Shoot him where he sits/stands.]", always last, then the narrator's warning and "[Do it.]" / "[Lower the weapon.]" (`:1002-1021`) | the warning, word for word as MC §6.6; lowering removes the option |
| Scorched | database "[Wipe both. Theirs and ours.]" (`:888-892`) | HaX's purge line and Netherton's "We both answer for it." before the menu (`:869-870`) |
| Join | console "[Show me how it works.]" → "[Give me the key.]" → "[(Put your hand on the key.)]" → "[Yes. Publish it.]" (`:717-787`) | the casualty figure and "You can still step back." at step 1; HaX's "0x00. Don't." and "If you take it, the mission ends here, and you work for ENTROPY." at step 2; a confirmation at step 3; a way back on every menu |

Join is never a trap: four picks, three warnings, a way back at each step, no import or KO route to it, and the step back is remembered only as one line of his (`:946`). One judgement call for the user, not a finding: the suspension on Scorched Earth is implied ("We both answer for it.") rather than said before the wipe; the purge and losing him are said plainly, which is what the player is choosing on.

Cold start: the rebuttal sits 2nd, 1st, 3rd across the three menus (CT §5.4), so surrender is open to a player with no imports, and every ending is reachable with every import at its default.

## 7. Carry-over: do m01–m09 choices change what people say and do

Yes, and in the brief's sense: who turns up, who helps, who betrays, what's possible, what's said. Not a debrief of name-checks. Forty Tier 1 imports each change a room (RL §5's table), fifty Tier 2 imports change lines, and the include's 99 import `VAR`s match FA §3.2. By mission:

| Source | What the player sees change in m10 | Strength |
|---|---|---|
| m01 | Tesseract's evidence line and the clean-first-day answer (gated on `ko_pattern() == 0` and no launched attack); the Join offer's warmth | lines, in the argument that decides the ending |
| m02 | Ghost's whole call (kept / refused / broken / stranger, each a different scene and gift); Gary at the workshop door or on the bench, or absent; Imran's card watched; Reeves on the rota; the bed 4 ledger sting | scene-level |
| m03 | the gallery: recruited Victoria, escaped Victoria with or without the threat, arrested Victoria's call and Vos, or Vos alone | scene-level; M-1 and M-4 must be fixed for it to read true |
| m04 | Voltage captured (in the van, then working his own switchgear), escaped (at the switchgear, his print on the bypass), or absent (Wendell); Vance in the phone slot; Static; the disclosure line in his case | scene-level |
| m05 | Social Fabric's prop naming the player; the forty-seven and Elena in the close | close and props only |
| m06 | two empty posts and the fence gap; the HashChain operation on the database list; the $12.8M at 06:00; Satoshi's ledger sting | room and lines |
| m07 | the backdoor channel and its size; Mercer in the server hall; Hollis on the board; the projection desk; Seattle; the cells on the card; Elena in the phone slot | room, task and close |
| m08 | Nightshade's door scene (four branches); Vector and Phantom on the team or declined; HaX's and Netherton's knock-outs said to the player's face | scene-level |
| m09 | whether the whodunit runs at all (taken: WREN cuffed at the briefing; double-cross: waiting at the core; named: arrests at six); the shortlist; the Alpha tapes' warning; the Recruiter beat; HaX's "how are you" and the forty-seven; the notice's record answer | scene-level, and it reshapes the night's biggest optional thread |

The knock-out pattern across m01–m08 lands once, in exchange 3, by band, and m08's knock-out of HaX gets its own line ("At the Citadel, it was your own handler."). That's the right weight.

Two thin spots, neither a defect: m05 reaches the player only through a prop and the close, and `m03_guard_bribed` has no line at all (m-13). If one more line is cheap anywhere, it's a HaX line keyed on an m05 import (the forty-seven are already in her 06:00 beat on m09 saves), so an m05-only player hears it before the credits.

Cold start (no imports): every scene has a default occupant, the briefing carries the three facts m09 would have given (FA §4.0), and the cracker's description drops what a new player can't know (RL §4). The never-played tests use `mNN_completed` where a default would lie (CT §2.3). I spot-checked `ko_pattern()` (m01 needs `m01_completed`), the clean-first-day gate, Ghost's stranger branch and the cracker's variants; all hold.

## 8. Pacing and length

Budget 105 minutes end to end, ceiling 110 (OT §8; arc §2), with the VM about 32 of it at roughly 8 minutes a flag. The split by act (25 / 40 / 32 / 8) is coherent and the worst real save is about 109 (OT `:439`). The user waived the timed VM run before stage 7 (CT `:23`), so these are still estimates.

Three pacing risks for the playtests, not findings:

- **Act 3 is one long conversation.** From flag 4 to the ending, the core is about 18 minutes of Tesseract's file (185 voiced lines), broken only by menus. The pause menus between exchanges (CT §10) and the rule of a choice every three lines help. The playtest should time the core and note where a tester stops reading; the cut order (OT §8 `:443`) already names his idle lines and Vector's and Phantom's lines, not the core. If the core runs long, the first trims are inside the case (six lines on the Publication, three record lines), not the exchanges.
- **The server hall is the act's centre and carries 17 minutes of VM plus C8, C9, C10, the peel-off and two patrols.** It's the right room for it (4×2), but a player who takes flags 2 and 3 before the cut walks back through the power room; §10.4 W-6 times that.
- **FA §4.1's "stage 8 times flag 4 with him in the room" (milestone M-13)** can't happen at stage 8 without a scenario. Move it to the first stage 9 playtest.

The close (about 8 minutes) is tight: 06:00 is capped at three walkabout picks, the numbers sit behind optional prompts, and the card is five lines.

## 9. Educational framing

Sound at game-design level. The technical learning is in the four VM flags (a foothold on a monitored segment, data off a staging host, out of a container onto its host, then the core host), introduced through exposure-gated field guides on request (`field_guide`, `m10_phone_agent0x99.ink:127-148`), and in the cumulative kit, each tool once more on a quiet route. The finale adds one small, well-motivated lesson in the room: the margin strip is Base64 written by Asante to herself, and its point (encoding is not encryption) is made by doing it (s0 §2.2). The decode has an author with a motive, which is the puzzle-chains test.

The bigger lesson is the one the title names: vulnerability disclosure. The three database options map onto real positions (hoarding for operations, coordinated disclosure with vendors first and workarounds for the unpatchable, and destroying the capability), each with a cost to strangers said before the pick, at a realistic speed (acknowledgements tonight, about ninety days to fix, a year to fit). The briefing separates real full disclosure from the Publication once (s0 §1; D-02), so the game never teaches that "full disclosure" means dumping everything. Nobody lectures; the argument with Tesseract and the database costs carry it.

Two checks for stage 9, not findings: the four guide ids are working names with no `labUrl` yet (lab sheets come last, by the user's rule), and the skill's labUrl check will report them broken until then; and the scenario's `description` and the lab sheet should name CyBOK areas as s0 §1 lists them (OS and virtualisation security; network security; law and regulation with human factors).

## 10. Stage 9 checklist

Run in this order. "Expect" is what a correct build shows; anything else is a stage 9 bug unless listed as expected.

### 10.1 Validator

`ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb`

| Check | Expect |
|---|---|
| ❌ INVALID | none |
| "Nothing can open it" warnings | exactly five, each with an ERB comment: the story doors into `blast_tunnel`, `security_office`, `workshop_floor`, `gallery`, and `fitter_locker` (RL §2 `:53`) |
| Same-room clue and lock | one, `model_terminal` (password) with the margin strip; intended (RL §3 `:331`) |
| `alarm_override` | possibly a "key with no lock" warning; intended (m-15) |
| `submit_flags` tasks | four, each with `targetFlags` (station-qualified, `<station>:<vm>-flag1`) and `targetCount: 1` |
| Flag stations | each `flags` from `flags_for_vm_slice('<vm>', N, 1, …)` with N 0–3; `hintOnlyFlags` a Hash naming the other three |
| `flagRewards` | `emit_event flag_N_in`; HaX's four mappings `setGlobal flagN_submitted` (the validator's emit-event warning is answered by them) |
| Ink scans through `INCLUDE` | no dead `VAR`s among the 145 locals; no "undeclared `#set_global`" for `six_done` / `closing_done`; no import written. If every file reports undeclared globals, the validator isn't following `INCLUDE` (CT §7 item 9): fix the scan or record the false positives, don't add per-file `VAR`s |
| `globalVariables` | 145 entries, defaults equal to the include's (`raid_clock` `"t0145"`, `whodunit_live` `true`, `asante_outcome` `"untouched"`, `share_zero_day` `"live"`, `share_resale` `"none"`, `partial_release` `"none"`, `cut_step` / `join_step` / `points_landed` `0`, the rest `false` or `""`); `importGlobals` 99; `exportGlobals` 7 |
| `#give_item` vs `itemsHeld` | all match: `agent_0x99` the four guides; `ghost_phone` two notes; `vector_so` one; `lock_guard` `gallery_code_card`; `vos` `vos_code_card`; `nightshade_table` `nightshade_payment` and `alarm_override` |
| `#unlock_door` | `power_room` on `imran` and `gary_tech` (the shipped ink; `gary_consultant` opens nothing, though CT `:504` reads as if he might); `core` on `victoria_gallery` and `vos`; each NPC with `unlockable` |
| `#clone_keycard:tg_power_room_card` | `rfidCard` on `imran` and `gary_tech`; a second, card-less Imran record (or another way) on `ghost_watch_on_route` (CT §7 item 6) |
| Narrator | a top-level `narrator` voice block (74 `Narrator:` lines in person-chats) |
| KO check | no critical-path warning: the two `#complete_task` tags sit on `director_netherton` (`koImmune`) and the three hidden closing NPCs |
| Room layout geometry | "✓ Room layout geometry OK" |
| Dungeon graph | critical path forward_post → blast_tunnel → security_office → workshop_floor → power_room → server_hall → gallery → core; each VM launcher (`gate_console`, `hall_console`, `core_console_vm`) connected to its `vmch_*` node; no backwards edge out of a locked room |

Then the export side: the 58 JSON-only `exportGlobals` additions to m01–m08 (FA §3.3; m08's block is new), and the validator on each of those eight erbs, each clean of new warnings.

### 10.2 Door and layout checks

| Check | Expect |
|---|---|
| `python3 scripts/check_door_alignment.py <erb>` | all seven connections align (every pair is E–W, or N–S between equal widths; RL §1) |
| `python3 scripts/predict_door_sides.py <erb>` | E/W doors on row 2 everywhere. The one parity call is the security office's south stair and the workshop's north stair: RL keeps both bottom corners of the office ((1, 8), (8, 8)) and both top corners of the workshop ((1, 2), (8, 2)) clear until this says which. Then confirm `fitter_locker` (1, 6), `records_cupboard` (1, 4), `duty_guard`'s patrol end (6, 8) and `gary_consultant` (3, 4) aren't on the chosen approach |
| The validator's geometry check | no overlaps; the 4×2 server hall at x 10–14 and the core at x 16–18 clear of each other |
| Dungeon graph (`break-escape-dungeon-graph`) | regenerated; the eight-room corridor, the five-way outer lock and the four VM nodes visible |
| Interaction reach | in the browser, the player can stand within 32 px of: `duty_handset` (5, 5) with `vector_so` at (3, 5); `lock_keypad_plate` (9, 3) beside the outer lock; `key_console` is a prop (no reach needed); `release_console_controls` (12, 4) between two readables; `post_ladder` (7, 4) in the 1-GU tunnel with the patrol |
| Patrols | `lock_guard`'s waypoints (7, 4) → (2, 4) inside a 10×6 map; `los.visualize: true`, a directional angle (not 360), range in pixels; `duty_guard` and the two hall guards' waypoints inside their real tilemaps |

### 10.3 Ink and runtime checks

| Check | Expect |
|---|---|
| `./scripts/compile-ink.sh m10_full_disclosure` after the M-1 and m-1 edits | every file compiles; `END` warnings only on phone threads ending `-> DONE` |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m10_full_disclosure/` with the erb present (phones bound) | the 25-word phone cap and `phone-self-prefix` clean on HaX, Ghost, Vance, Elena, Victoria's line; `crowded-hub` on `support_hub` answered by the seeded count below |
| Seeded hub count | on the save in m-1 (server hall, flag 2 in, flag 3 not, shutter live, voice HaX, an officer out with the clue, bench log read, guide 3 offered): ten choices at most after `hax_hatch_asked` |
| `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` (add an m10 entry) | every phone contact reopens cleanly after `#exit_conversation`; HaX after each of her seven calls lands on `start` → hub; `cut_call`'s re-ring lands on the first unanswered `cut_step` |
| F20 walk (the TTS line extractor) | voiced: the ten call knots only; never `start`, `support_hub` or a topic; total about 81 call lines (CT §10) |
| Tags inside conditionals | `#set_global:closing_done:true` and `#complete_task:close_the_night` fire on every arm in `m10_hearing.ink:49-55` (tags above a conditional) and `m10_six_oclock.ink:449-467` (tags inside arms): walk each with `inkcheck.js` and read the tag output |
| `ko_pattern()` | the table test on seeded saves: 0 on a cold start; m01 latches count only with `m01_completed`; bands 1, 2–3, 4+ |
| `close_compute()` | the five strings equal S6 §3.2's examples, and on a recruited Victoria never answered, `close_secure_cell = zd_uk` once M-4's mapping is in |
| `tagdiff.mjs` | from the first commit of the ink on, after every rewrite |
| Greps | no `raid_clock` in any `.ink`; no `#set_global:<name>:<digits>`; no `~` on any `mNN_` name; `t0600` set only on `six_done` |

### 10.4 Walkthrough and browser checks

Write the `walkthrough-scenario` critical path from the erb, then reconcile it with the dungeon graph. Expect the path to be: briefing and aside (auto) → gate console → table scene → flag 1 → split, Arakawa's call, pair back (auto) → blast door → tunnel → security office → handset (Ghost) → stair → workshop → power-room door → power room → the cut → server hall → flags 2 and 3 → gallery stair → gallery → outer lock → core → flag 4 → case → three exchanges → console → (WREN) → database → his end → closing scene → card, teaser, credits. Every step should have a task or a holding bark.

Then these runs, on OT §9's F15 starts where one fits. Each lists what it proves and what to expect.

| Run | Start / imports | Do | Expect |
|---|---|---|---|
| W-1 | E3 cold, full run | the critical path; arrest | 105 ± 10 min with the VM; every pointer heard; card five lines, one credits roll |
| W-2 | S-core | each ending once: arrest (both routes), surrender, lethal, executed, scorched, Join | the right closing scene; `close_the_night` on its last line; one credits roll; MISSION FAILED on Join only; teaser slot silent (and skipped on executed and Join) |
| W-3 | S-core, Join | step 1 → back, step 2 → back, then stop | `join_step` 2; "You held your hand out for it." once at his end; WREN comes through as normal |
| W-4 | m03 `recruited`, S-sh | trace at the console, then trust Victoria | after M-1: she sells the raid, reinforcements (or Nightshade's narrator line), the lock open behind her |
| W-5 | m03 `recruited`, S-sh | never speak to her; crack the lock | after M-4: `victoria_gallery` `refused`; disclosure's list names "The watch on Sterling."; the secured cell is Zero Day's UK desk |
| W-6 | S-wk | walk to the server hall uncut; flags 2 and 3; then cut | "[Where are we?]" right at each step; aims 3–5 open and close in a sensible order; the gallery stair opens on the cut |
| W-7 | A3 (shown) and A5 (unshown, map) | breach | after M-2: the tunnel post empty on both; on A5 unchecked, the tripwire and ladder; alarm lamps dark while the override is held |
| W-8 | any, end at 06:00 | watch the forward post screen | after M-3: `raid_clock` stays `t0400` through the scene and steps to `t0600` on `six_done` |
| W-9 | B1 / B5 | Wendell told; Wendell knocked out with each voice (Vance, Elena, HaX) | the phone voice rings, re-rings on re-entry, and `cut_call` resumes on the right step; HaX's hub topic as last net |
| W-10 | E2 hard | crack the outer lock inside Fonoti's cone | his challenge as the cracker closes, the door open; "[Shift change. Orders from upstairs.]" works once |
| W-11 | E3 cold | dust the keypad plate | the four worn keys show; the crack is quick; the pointer bark plays once, and never from a knocked-out Fonoti (m-3) |
| W-12 | S-so | read the door log; check `door_log_given` | set by the bark's mapping alone, so "[Who was where at ten past?]" appears without the "[The door log.]" topic |
| W-13 | S-so | wrong accusation of each officer, then the recall | the cost line per officer; "Get … back first." on a second wrong name; Kowalczyk always accepted; credits "Recalled." clause |
| W-14 | A1 `taken`, A2 `double_crossed` | full first act and the core | no whodunit aim; Kowalczyk cuffed at the van or waiting at the core; C18 asked once, replied at 06:00 |
| W-15 | any, reload in each room | reload | respawn at the forward post, every opened door open, every room's people re-staged on entry, "[Where are we?]" names the room |
| W-16 | after each ending | look at the core | Tesseract hidden or down as his ending says (m-8) |
| W-17 | E1 kind | check `#give_item:key:alarm_override` | `override_held` set by `onPickup` (S6 `:619`); if not, the giving line sets it |
| W-18 | S-core on `m09_completed` saves | time flag 4 with him in the room | the M-13 timing FA §4.1 asked stage 8 for |

The mission's 35 F15 runs (OT §9) remain the playtest plan; W-1 to W-18 are what stage 9 should see before handing to playtest.

## 11. For the user

VM questions (I didn't open the VM plan, SecGen or the drafts, so these are questions, not findings):

1. **Does m10's drafted VM have the earlier entry stage the brief asked for**, so flags 1 and 2 sit on the monitoring host before the container escape and core host (FINALE_BRIEF `:17`)? Every stage doc assumes four flags in that order.
2. **One VM or several?** OT §2 and RL §2 write one `<vm>` and four station slices; more than one VM changes the four `targetFlags` strings and each station's `acceptsVms`.
3. **Can the flag 2 work be done from the gate console?** Story-wise the staging copy sits on the monitoring host (s0 §2.1), so a player might find it at the forward post, then have to carry it to the server hall's release console. That's fine if intended (the wrong-station hint names the right terminal), but the field guide for flag 2 is only offered from the hall console.
4. **How long do the four flags take?** The 32-minute VM share of the 105-minute budget is an estimate at about 8 minutes a flag; the timed run was waived. If it runs over 34 minutes, OT §8's cut order starts with the backdoor task.
5. **How many field guides, with which ids and lab sheets?** The ink gives four working ids (`m10_guide_flag1`…`4`); lab sheets are last by your rule, so their `labUrl`s will read as broken at stage 9 until then.

Design calls that are yours:

6. **The teaser** is wired empty on four endings with `teaser_enabled` false. Its content, if any, is still to decide.
7. **The season's last lines** (S6 §7): the telescope line on every ending that reaches six o'clock, and "Zero Day: still trading." on Join.
8. **`m03_guard_bribed`**: place SE's Finance line as a HaX text, or cut the import (m-13).
9. **New art and cast**: three new maps (forward post, gallery walkway, core) and a 4×2 server hall, bunker props first (RL §8); sprites and voice-bible entries for m10's new speakers before audio. Voiced volume is large (81 call lines, 185 for Tesseract, about 100 at 06:00, plus every person-chat); worth knowing before the TTS pass.
10. **Scorched Earth's suspension** is implied before the wipe ("We both answer for it.") rather than stated. I think that's right (the purge and losing him are stated), but it's a tone call.
