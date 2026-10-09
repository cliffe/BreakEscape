# sis02_energy: decisions pending

## Lighting pass (2026-10-08)

Context: `scenarios/sis02_energy/LIGHTING_PLAN.md`. D1 (schema `emitters` key) and D2 (state-following glows) were approved by the user on 2026-10-08 and are recorded in `docs/agents/LIGHTING_LOG.md`.

### D3. `tint_objects` is not re-applied after a reload

**Background.** The `h2_advisory` timer sets `hydrogen_alarm` and tints the Battery Hall 1 racks red (`scenario.json.erb:414-428`, action at `systems/apply-actions.js:110-133`). After a reload with `hydrogen_alarm` already true, the timer dispatcher marks the timer fired and skips it (`ui/scenario-timer-dispatcher.js:71-78`), so the tint never comes back. The racks look normal again although the advisory is still in force. With the lighting plan, the rack glow and LEDs follow `hydrogen_alarm` and so stay red-orange, which makes the gap visible: red glow on untinted racks.

This is outside lighting (timer dispatcher or the tint action), so it isn't in the lighting plan.

**Options.**

1. When a timer is skipped at init because its `setGlobal` is already applied, re-run its idempotent visual actions (`tint_objects`) once the room loads. Small engine change; fixes every mission that uses `tint_objects`.
2. Have `tint_objects` take a `condition` and re-apply on room load while it holds. More general, more work.
3. Leave it. The player was told by radio before the reload; the mismatch only shows after a mid-advisory reload.

**Recommendation:** option 1, as part of a later engine pass; option 3 is acceptable for the lighting pass.

## Consistency pass (2026-10-09)

### D4. The sis02 improvement pass is on an unmerged branch (RESOLVED 2026-10-09)

**Resolved by the merge** 1cece907 ("Merge origin/claude/m03-improvement-loop"), which brought the branch's sis02 pass onto main: option 1. The remaining audit-log disagreement was also already fixed on the branch (the tab is HMI-ENG-02's engineering tool history and the SIS keeps no log); see IMPROVEMENT_LOG.md phase 10. Kept below for the record.


**Background.** The full sis02 pass from 5 October 2026 (dialogue rounds 1 to 4, round-2 dialogue, pack and lab sheet rewrite, cast) is only on `origin/claude/m03-improvement-loop`: 21 sis02 commits, `33f7e1e0` to `20a319e5`, none of them on `main`. The published lab sheet and pack (HacktivityLabSheets `288fd33`, `6553803`) were written from that branch. That is why they describe scenes `main`'s game lacks: the register export, Tom ringing Marcus back, Priya's CLAIM-EN-002 verdict, the 05:52 Trent Water file, the ESD with no lock, 3.8% by volume and the 2026 dates. The per-issue evidence is in `CONSISTENCY_PLAN.md`.

**Options.**
1. Port the branch's sis02 (and the engine commits it relies on) onto main, re-apply main's lighting and Helen intro, then fix the one disagreement left (the SIS audit log against "the SIS keeps no log").
2. Keep main's game and rewrite the published sheet and pack down to it.

**Recommendation:** option 1. Decide before any sis02 TTS is generated from main's lines, because a port would replace most of them.

## Review loop on main (2026-10-09)

### D5. Opening background art shows outdoor containers; the pack and game have two battery halls

**Background.** Helen's new narrator intro opens on `public/break_escape/assets/backgrounds/albion_energy.png` (untracked, the user's). The picture shows rows of white outdoor battery containers, pylons, a brick control building and one car. The pack describes two battery halls (`information_pack.md:681`), Battery Hall 1 is an indoor room in the game, and the team is already on site at 06:15 (`:781`). The narration was rewritten so it no longer contradicts the pack ("Two battery halls holding two hundred megawatt-hours…"; the "one car in the car park" line was dropped), but the picture still shows containers. The same image is now also the background of Helen's evacuation cutscene.

**Options.**
1. Keep the art. Most players read a fenced compound of battery enclosures as "the halls"; the words now match the pack. No cost.
2. Regenerate the exterior with one or two large hall buildings and a few cars (image generation: ask first, one at a time).
3. Change the pack and game to containerised "halls". Touches the published pack and many lines. Not recommended.

**Recommendation:** option 1 for now; option 2 if the mismatch bothers you when you see it.

### D6. Engine: globals reach the server only every 30 s (or on pagehide)

**Background.** In playtest game 1890 the harness closed the browser about 1.5 s after Helen's briefing. The task completion and the badge were saved (immediate POSTs), but `helen_briefed` and `battery_hall_badge_collected` were not, because globals sync on a 30 s timer or the pagehide flush (`public/break_escape/js/state-sync.js:11-24`, `:139-163`). On resume Helen ran her "briefing was cut" recovery and greeted the player again. A normal reload fires pagehide, so real players should rarely see this; a crash, a killed tab or a power cut within 30 s of a conversation would.

**Options.** 1. Call `window.stateSync?.sync()` right after `conversation_closed` is emitted (`person-chat-minigame.js:1646`, `phone-chat-minigame.js:927`). Small engine change, all missions benefit; needs node tests, Rails suite, reopencheck and a browser regression. 2. Leave it.

**Recommendation:** option 1, in the next engine pass. Not fixed here (engine change, outside the approved scope). Round-2 playtest: real reloads at 0 s, 1.5 s and 40 s after the briefing did not reproduce it (the server row is written when the briefing ends), so only a crash or killed tab is exposed. Low priority.

### D7. Engine: the room tracker reports Battery Hall 1 in the top wall rows of the rooms below it

**Background.** `updatePlayerRoom` (`public/break_escape/js/core/rooms.js:2918-2944`) tests each room's floor in turn, and the hall's floor rectangle overlaps the top two (wall) rows of the control room and workshop. The test bridge reported `battery_hall_1` at the workshop SIS panel (game 1892). In a gas alarm, an entry event from the control room's north wall band could fire Helen's "Out of that hall" bark and set `entered_hall_in_gas_alarm`, which the debrief and credits criticise. Separately, `currentPlayerRoom` is set to null in gaps despite the comment saying the previous room is kept (`:2949-2955`).

**Options.** 1. Keep the current room while the player's feet are anywhere inside its full rectangle before testing other rooms, and never overwrite `currentPlayerRoom` with null. Engine change; affects every mission's room events; needs a browser regression. 2. Leave it if the round-2 playtest shows the wall band can't be reached in practice.

**Recommendation:** option 2 for now. Round-2 playtest (game 1895): wall collision stops the player's feet at y 38 or lower on both north walls; the room stayed correct everywhere and no false bark or flag fired in a gas alarm. The overlap is latent; fix it with option 1 if another mission's layout exposes it.

### D8. The log-filter minigame still calls the tab "SIS Engineering Audit"

**Background.** The audit-log disagreement is settled in the scenario: the tab is "ENG TOOL HISTORY", HMI-ENG-02's own record, because the safety controller keeps no change log (`scenario.json.erb`, sis_audit tab). But the shared log-filter minigame hard-codes three strings the player sees after flagging the session: "► Session flagged. Switch to the SIS Engineering Audit tab to complete your investigation.", the button "[VIEW SIS ENGINEERING AUDIT →]", and the banners "…SIS audit reviewed." (`public/break_escape/js/minigames/log-filter/log-filter-minigame.js:836`, `:839`, `:363`, `:1315`). "SIS audit" suggests the SIS logged the change, which is the point the lab sheet's Q16 and the pack make it did not. Only sis02 uses `additionalTabs` with this minigame (sis01 uses the minigame without them).

**Options.**
1. Small engine change, following the existing `flagActionLabel` pattern (`:12`, `:168`): read optional `tab2PromptText`, `tab2ButtonLabel` and `completeBannerText` from the scenario data, defaulting to today's strings, or build them from `additionalTabs[0].label`. Then set sis02's to "ENG TOOL HISTORY" wording. No other mission changes behaviour. Needs a node test and a browser check of sis01 and sis02.
2. Leave it; the lab sheet quotes both names so students can match them.

**Recommendation:** option 1. Not done here because it is a shared minigame (engine), outside the approved sis02-only scope.

### D9. Commit order: the Helen intro needs your uncommitted engine change

**Background.** Helen's narrator intro ends with `Background[none]:` (`npc_helen_marsh.ink`, top of `arrival_briefing`), which is handled only by your uncommitted change to `public/break_escape/js/minigames/person-chat/person-chat-portraits.js` (`setBackground`, `:618-625`). Committed without it, the exterior picture would stay behind Helen.

**Recommendation:** commit that engine change with or before sis02. Nothing to decide unless you want the intro to work without it (the alternative is a plain-frame background image).

### D10. Audio to generate (not done; costs money)

Voiced lines new or changed in this loop (Helen, Priya, narrator; Marcus and Tom are unvoiced phone texts):
- Narrator (new): "Albion Energy Storage, on the Trent near Newark. Saturday, half past six." / "Two battery halls holding two hundred megawatt-hours of lithium-ion cells, charging off the grid overnight while the county sleeps." / "The site's SCADA engineer got in at quarter past six. She hasn't taken her eyes off the control room screens since."
- Helen (new variants; old lines stay for their cases): "Fifty-one on the dial. Twenty-eight on my screen. The ESD's in, but one of them was lying to us. Which did you go on?" / "Fair enough. It's off charge, so take your time." / "Not the hall, not now. Press the station by the door."
- Helen radio texts (new): "Dead flat since twelve minutes past eleven. Somebody's writing it. Get that ESD in." / "Dead flat since twelve minutes past eleven. Somebody's writing it." / "Fifty-one on that dial? Then we needed that ESD."
- Priya (changed): "One thing I'd push you on. You pulled the jump server cable before Marcus knew about the session. My view is he should have been told first." (replaces "...before talking to Marcus. My view is he should have known first.")

### Noted, not changed (2026-10-09)
- sis01 has the same "Not Yet…" shape fixed here as SL5 (`npc_sharma.ink:75` completes the task before `debrief_complete` at `:427`). Outside this scope.
- `TESTING_WALKTHROUGH.md` is stale (old ids, 2025 dates, old radio lines). `PASS_PLAYTEST_R2.md` is the current script.
- At the credits, "Understand the Facility State" can still list two optional reading tasks (HMI readings, incident folder) as open. Not gated; left as designed.
- Helen's radio messages go to the default phone thread, not the Albion Site Phone, so a missed one can only be recovered by asking her "[What next?]" (engine behaviour for person NPCs).
