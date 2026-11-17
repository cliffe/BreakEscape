# Office-life skill movement step, review round 2

Blockers 0, Majors 4, minors 5.

Tree: `.claude/worktrees/p-ol-skill-move` at 8894096d3 (fix 80ed8b83e plus main). Read only; the one command run was the section 9 one-liner on m03, written to the scratchpad.

Assumption: D84 (the user's answer to M3, option b) is now the rule, so I review option b as the target text and list the exact switch.
Assumption: needs-clock times below are given in needs-clock minutes; I did not measure how they map to real time.

## R1 findings: status

| R1 | Status | Evidence |
|---|---|---|
| B1 | Fixed | Four protections at SKILL.md:108; classes decide whether, table decides how far, SKILL.md:78. |
| M1 | Fixed | SKILL.md:126 to :127. `fallback: true` at npc-needs.js:172; fallback at :2089 to :2093; `_goHome` :2095; schema :5480 "one already using it finishes". All hold. |
| M2 | Fixed in substance. The reason given for `patrolOverride` is wrong, see m1 | SKILL.md:128. |
| M3 | Written as option a, now superseded by D84. The switch is not clean, see M1 | SKILL.md:75 to :77, :131, :246, :275. |
| M4 | Fixed | SKILL.md:129, :234; validate_office_life.rb:371 to :420 holds. |
| M5 | Fixed | SKILL.md:71; workstation-state.js:51 to :67, :677 to :680 hold. |
| M6 | Fixed | SKILL.md:71, :132; npc-hostile.js:781 to :786, :806 to :810; npc-needs.js:1235 to :1239, :1418 to :1431 hold. |
| M7 | Fixed | SKILL.md:72; npc-needs.js:5394 to :5400 count person-chat only. |
| m1 to m5 | Fixed | SKILL.md:47 and recipes section 9; :123; :67; :119 and :246; :107 and :133. |

Every other engine citation I opened holds on this tree: npc-needs.js:582, :778 to :788, :1099 to :1111, :1434 to :1457, :1734 to :1737, :3480 to :3484; npc-behavior.js:945 to :958; npc-manager.js:1622 to :1626; person-chat-background.js:15; validate_office_life.rb:424 to :452; mapping-patterns.md:129, :131; `m08_background_analyst.ink:26`; schema :3983, :4247, :4841 to :4850, :4881, :4894, :4895, :4973, :4983, :4984, :5474, :5480, :5481.

## Major

**M1. The switch to option b (now D84) is not clean, and the option b text gets the background rule wrong.**
- SKILL.md:77 says nothing else changes when the switch is made. That is wrong. SKILL.md:131 restates option a ("Under the open-conversation rule (Stage 1) an NPC whose talk is open at any time is not free"), and its heading "At its post before any conversation can start" is option a's requirement. SKILL.md:275 states option a. SKILL.md:246 proves only "at post" and has no check for talking to the NPC away from post.
- SKILL.md:76 says the chat "uses that room's background". That is precedence 4 only. An NPC-level `chatBackground` (schema :4963, "used ahead of the room's") wins "wherever the conversation happens" (person-chat-background.js:12 to :13). Ink `Background[...]` lines (:6 to :8) and a mapping's `background` (:9 to :11) win too. Any of these would show the NPC's desk while it stands at the kitchen cooler.
- Severity: major. A fixer who follows :77 leaves the skill contradicting itself.
- Fix: the exact edits are in the D84 section below.

**M2. Protection (3), the `patrolOverride` recall, should be narrowed for every NPC, not only moved existing ones.** SKILL.md:108.
- A `patrolOverride` is a scripted walk. `onExternalMove` sets `scriptSuspended` (npc-needs.js:778 to :788). That flag starts `false` after a reload (:582), and the event that fired the override does not fire again. A reload inside the beat window therefore restarts the routine, which is the M2 hole R1 closed for `suspend`.
- It also stops a tile short (gotchas.md:42; mapping-patterns.md:129). The skill's own gotcha summary says "send staff home with `offWhen`, not `patrolOverride`" (SKILL.md:270).
- Protection (3) can also hide a V2 warning. `post_override?` (validate_office_life.rb:424 to :430) exempts any NPC with a non-office-life `patrolOverride.targetTile` mapping (:449), even when it does not cover every beat.
- Fix: replace (3) with the protection (4) gate (a scalar global read by `offWhen`, measured lead time) for every story NPC that has needs. Keep `patrolOverride` only for NPCs without needs. Say that V2's `post_override?` exemption is not a protection.

**M3. `offWhen` on a sign-in PC also locks the player out, and "every source" is wider than the V2 list.** SKILL.md:125, :129, :234.
- SKILL.md:125 says to put the gate on "every source the NPC may use". That includes a desk PC that serves a `work` need (the home object is the preferred source, npc-needs.js:1785 to :1791).
- The schema (:5480) says that on a sign-in PC, `offWhen` "governs the player too: while it holds sign-in is refused". The server enforces it: `host_service_off?` refuses a walk-up sign-in with 403 "This PC is off" (app/models/break_escape/network_access.rb:968 to :985).
- A beat-window gate on such a PC can block a sign-in on the critical path, which breaks standing rules 1 and 2.
- SKILL.md:129 and :234 gate only "every need source in its V2 away list". That list leaves out sources in the NPC's own room, so the two lines disagree.
- Fix: gate every source away from the post object, and never a PC the player can sign in to. If the NPC's only away source for a need is such a PC, drop that need. Use the same wording at :125, :129, :234 and checklists.md:15.

**M4. `offWhen` takes one condition, joined by AND, and it switches the machine off for everyone.** SKILL.md:125.
- `_isOff` reads one `offWhen` (npc-needs.js:830 to :837). `requiredGlobalsHold` treats an object as "all must match" with strict equality (npc-needs.js, `requiredGlobalsHold`; schema :5480).
- A machine that already has an `offWhen`, such as m03's `wh_staff_upset` trouble gate (mapping-patterns.md:11, :108) or a breaker lever (SKILL.md:167), cannot also be "off during the beat window". The planner will either overwrite the existing gate, which breaks trouble handling or the lever, or AND the two, so the beat gate holds only when both are set.
- The gate also shuts the source for every NPC. Ambient pairs at that machine stop talking, and exchange timing, `lockIfAwayOverSeconds` windows and security windows that rely on ambient trips all change during the beat window. Nothing in the step asks the planner to list these effects.
- Fix: one derived global per gated machine, set true by a mapping on each cause, and its clearing rule written down (it is non-monotonic, so it goes in the sync budget, SKILL.md:182). In the people table, list the ambient NPCs, pairs, levers and windows that share each gated machine, with what they do during the window. Where possible, prefer a machine only the moved NPC uses.

## Minor

**m1. The reason given against `patrolOverride` is wrong.** SKILL.md:128 (and validate_office_life.rb:420 to :422).
- The override reads `npc.roomId` from `this.getNPC(npcId)` (npc-manager.js:1401, :1622).
- The manager's `roomId` follows the NPC only for multi-room patrol route walkers (npc-behavior.js:1016 to :1018). For other NPCs, :1014 updates only the behaviour's own `this.roomId`.
- A needs NPC may not patrol (SKILL.md:64). Its override therefore resolves in its declared room, not "a kitchen tile".
- The rule itself still stands: the walk stops a tile short and suspends needs, and the suspension does not survive a reload.
- Fix: replace the kitchen-tile clause with those two reasons. Note the validator comment for whoever next edits validate_office_life.rb.

**m2. The line-number source is misstated.** SKILL.md:10 says engine line numbers are "as on `build/ol-m03`".
- The engine JS is the same on both trees.
- The schema is not. `build/ol-m03` has `needsHome` at :4880 and the mapping `condition` at :4972, and the skill cites :4881 and :4973, which are this tree's lines.
- recipes section 9 cites `lock_key_diff.rb:85`. `def render` is at :84.
- Fix: "line numbers are as on main at 8894096d3", and :84.

**m3. The positions one-liner works but skips container contents.** measurement-recipes.md:112.
- Run on m03 it exits 0 and writes 29 sorted rows (19 objects, 10 `itemsHeld`).
- It never descends into `contents`. m03 has 8 items inside containers (server_room 2, executive_office 4, danny_office 2), and those are exactly the clues the check exists to protect.
- 10 of the 19 objects print an empty position (Tiled-claimed, as the text says).
- Fix: recurse into `contents`, printing the parent id as the position, e.g. a `walk = ->(r, o, at)` lambda that pushes a row and calls itself on each `o["contents"]` with `"in:" + id`.

**m4. The polarity of the mapped-break condition is not stated.** SKILL.md:125 says "the same global in the `condition`". A break must fire only while the gate is off. Write it as `"condition": "!globalVars.<gate>"`.

**m5. The Stage 0 V1 baseline captures the whole validator report.** SKILL.md:45. m03's `v1_summary_base.txt` begins with warnings and absolute paths from `p-ol-m03-build`, so a Stage 4 diff in another worktree is all noise.
- Fix: filter to the summary block, e.g. `| sed -n '/^OFFICE-LIFE SUMMARY/,$p'`, or ask for a summary-only flag.

## D84 (option b): the rule text, the exact switch, dwell at home, and scripted playtests

### Option b reviewed as the rule

The option b text at SKILL.md:76 is coherent with the engine on three points:
- A chat freezes a needs NPC where it stands, even mid-walk (npc-needs.js:1434 to :1444; npc-behavior.js:945 to :958).
- A use in progress keeps its remaining time (npc-needs.js:1438).
- The trip resumes afterwards (:1446 to :1457).

Option b needs three additions:
1. "Reads no location" must name the background. The NPC has no NPC-level `chatBackground` (schema :4963), its ink has no `Background[...]` line showing its post, and no mapping opens its chat with a `background` (person-chat-background.js:6 to :13).
2. Option b does not lift the room limit. A talkable story NPC that owns a required knot, is a conversation-mode target or is a key source still raises V2 when its needs leave its room (validate_office_life.rb:438 to :445), and SKILL.md:78 keeps such an NPC in its own room. Under D84, most talkable story NPCs get a routine only at a machine in their own room. Say so, so a planner does not plan kitchen trips for them.
3. "No beat hangs on it" should be defined. No `conversation_closed` mapping, and no global set in its ink, starts a cutscene, a sight check, a patrol move, a timed message that places it, or a hand-over that needs it at a spot.

### The exact switch (SKILL.md unless stated)

- :75 to :77: replace them with one bullet. **Open-conversation rule (D84, 17 Nov 2026).** A free NPC may be talked to away from its post when:
  - its conversation reads no location (no line places it; no NPC-level `chatBackground`, ink `Background[...]` or mapping `background` that shows its post);
  - no beat hangs on the conversation (as defined above);
  - the open-conversation check below passes.

  Give the reason (freeze, room background, trip resumes) with the citations already there.
- :73: no change ("not ruled out by the open-conversation rule" still reads right).
- :131: rename the item to **At its post before any beat that needs it**. Delete "Under the open-conversation rule (Stage 1) an NPC whose talk is open at any time is not free." Keep the measured-lead-time proof for beats, plus the freeze, background and resume facts as the reason talk away from post is acceptable. Add: "If the plan gives the NPC a first-talk gate (below), name it here."
- :134: change to "a beat with no named gate means the NPC is not free; a conversation that is not a beat needs no gate."
- :246: add "talk to each moved NPC away from post three ways: mid-walk, queued, and using the machine. Each time the chat opens, the background is the room it stands in, no line contradicts where it is, and it finishes its trip and walks home after the chat closes."
- :274 to :275: replace the M3 line with "D84, 2026-11-17: a talkable story NPC may take a short routine; talk away from post is allowed under the open-conversation rule. Use few moved NPCs per mission, found at post first (dwell at home or a first-talk gate)."
- checklists.md:40: add the away-talk check from :246.
- No change at :108, :125 to :130 or :132 to :133.

### Dwell at home and "found at post first": what the engine supports

- **Quiet time from first room load: supported by default.**
  - A room loads when the player opens its door (doors.js:883).
  - Its NPCs register with the needs system then (npc-lazy-loader.js:99 to :105).
  - Their levels start at `initial` with seeded jitter (npc-needs.js:517).
  - The first trip comes only after (`initial` minus `urgentAt`) / `decayPerMin` needs-clock minutes. With `initial` 100 and slow decay the NPC is at post when first met.
  - A reload registers it again at `initial` (schema :4850), so it is back at post after a reload too.
  - Rooms never unload, so once its room has loaded it keeps its routine for the rest of the game.
- **A home need with a long use: supported.**
  - A need its own post object satisfies picks that object first (npc-needs.js:1785 to :1791).
  - Using it does not count as leaving: `_targetsOwnPost` keeps `atPost` (:3256 to :3259, :3522 to :3530), so the workstation still sees the owner present.
  - `useSeconds` goes up to 600 (schema :3966).
  - Only the need being met pauses its decay (npc-needs.js:1555). Other needs keep decaying, so when the use ends the most urgent need wins.
  - Weight the home need (`weight`, schema :4851) so it wins most choices.
  - Caveat: I did not check whether a newly urgent need cuts a long use short. The planner should measure that (recipes section 3).
- **Gate on first talk: supported, two ways.**
  - (a) Per NPC, no shared machine. Give it a high `initial` and slow decay, and a `conversation_closed` mapped break with `needs: { set: { <need>: <low> } }`, `onceOnly`, and `delayMs` about 2000 (the SKILL.md:116 pattern). It stays at post until talked to, then goes. After a reload it dwells again until decay, which does no harm.
  - (b) As an `offWhen` on the machines, `{ "<npc>_met": false }`. `requiredGlobalsHold` uses strict equality, so the global must be declared `false` in `globalVariables`; an unset global never matches. This turns the machine off for every NPC (M4) and on a sign-in PC for the player (M3), so prefer (a).
- **"A few NPCs per mission, not all": not in the skill yet.** Add a line to SKILL.md:123: "Move at most two or three existing NPCs per mission, each found at post first (a home dwell or a first-talk break)."

### Scripted playtests that walk to an NPC

- **How the bridge finds an NPC.**
  - It searches every loaded room's `npcSprites` and reads the live sprite position (test-bridge/state.js:466 to :468; index.js:497 to :512).
  - A moved NPC is found wherever it is. Its reported `room` is still the room whose list holds it, the room it spawned in (core/rooms.js:3362; state.js:415). So `roomContents(<home>)` lists an NPC that is standing in the kitchen, with kitchen coordinates.
- **Where a scripted step goes wrong.**
  - `interact(id)` walks to a snapshot of the position when the NPC is off screen, then finds it again and clicks (index.js:1340 to :1383).
  - `moveToNear(id)` solves one standing point against a snapshot (index.js:1051 to :1063).
  - A walking NPC can move between the solve and the click. When the player is in a different room it gets `different-room` (index.js:1365 to :1374).
  - A scripted walkthrough written as "enter the home room, interact" can then report a stuck step that is office life, not a bug.
- **What the skill should tell scripted runs.**
  - Before each `interact` with a moved NPC, poll `window.__test.needs.state(id)` (index.js:2214) until `mode` is `idle` with `atPost` true, or until the NPC is standing still. Or interact through `moveToNear` again after each failure.
  - A first-talk dwell (a above) makes the first meeting always at post, which is the case scripted walkthroughs hit most.
  - Do not use `needs.setManualClock` (index.js:2197) in regression runs. It stops all office life and hides exactly what the run is meant to test.
  - Add this to SKILL.md:248 and to the playtest-scenario brief for missions with moved NPCs. A Haiku "stuck" next to a moved NPC gets the persona recheck the skill already requires.

## Fixer's two flagged points
- Protection (3) for other story NPCs: yes, narrow it (M2).
- m03 line numbers: the engine JS is the same on both trees. Schema citations match this tree, not `build/ol-m03` (m2). The m03 documents I spot-checked hold: SOFA_FIX.md:52, mapping-patterns.md:129 and :131, SIMS_TIDY_LOG.md:600 to :612, NPC_NEEDS_SYSTEM.md:474.

## Section 9 command
It works as written: run on m03 it exits 0 and gives 29 sorted rows. It misses container contents (m3), and the cited line is :84, not :85.

## Verdict
No blocker. Fix M1 to M4 (M1 is now the D84 switch), then run a delta round 3 on `opus55`. M1 and M2 change design rules, which is delta case 3.

## Outcomes

- M1: Fixed. D84 (option b) is the open-conversation rule in Stage 1, with "reads no location" covering the full background order (ink `Background[...]`, mapping `background`, NPC `chatBackground`, then the room's), "no beat hangs on it" defined, and the room limit kept (V2 story NPCs routine only in their own room); option a removed; the post item renamed "At its post before any beat that needs it"; the :134 line, the Stage 5 away-talk check, checklists Per live check and the Decisions entry (D84) updated.
- M2: Fixed. Protection (3) is now the `offWhen` beat gate for every story NPC with needs; `patrolOverride` only for NPCs without needs; `post_override?` stated as not a protection in Stage 1, Stage 2 and gotchas.md.
- M3: Fixed. Gate every source away from the post object, never a sign-in PC (server 403 cited), drop the need if that PC is the only away source; same wording in the beat gate, "Every way out", Stage 4 and checklists.md Per slice.
- M4: Fixed. One derived global per gated machine, set by a mapping on each cause, written clearing rule, in the sync budget; other users of each gated machine listed under the people table; prefer a machine only the moved NPC uses. Gotcha added.
- m1: Fixed. The kitchen-tile reason replaced by "stops a tile short" and "suspension lost on reload", with the roomId behaviour noted; the validate_office_life.rb comment above `post_override?` corrected (comment only, no logic change).
- m2: Fixed in part. Line-number source now "as on main at 8894096d3". Withdrawn: `def render` is at `scripts/lock_key_diff.rb:85` on both 8894096d3 and this branch, so :85 stays.
- m3: Fixed. The section 9 one-liner recurses into `contents` with `in:<id>` positions; on m03 it exits 0 with 37 rows (29 plus 8 container items).
- m4: Fixed. Mapped-break condition written as `"!globalVars.<gate>"`.
- m5: Fixed. Stage 0 baseline filtered with `sed -n '/^OFFICE-LIFE SUMMARY/,/^$/p'` (stops at the blank line after the block, so later warnings are left out); checked on m03.
- D84 guidance: Folded in. At most two or three moved NPCs per mission; "Found at post first" (high `initial`, slow decay, long home dwell, optional once-only `conversation_closed` break preferred to a machine gate); the two open measurements as planner work with a new recipes section 10; scripted-run poll-before-interact and no `setManualClock` in Stage 5, the Test plan and checklists; the bridge's spawn-room report in gotchas.md.
