# Office-life skill movement step, review round 4

Blockers 0, Majors 2, minors 2.

Tree: `.claude/worktrees/p-ol-skill-move` at 2ef162905 (R3 fixes 152124c20 plus outcomes). Delta review of `git diff f7fb0d746 2ef162905`. Read only.

Assumption: the derived-global mappings in mapping-patterns section 5 are meant to sit on an NPC's `eventMappings` (the engine has no scenario-level mapping list); I did not find a second host.
Assumption: "the event that opens the window" in SKILL.md:133 means the gate window, not the beat itself.

## R3 findings: status

| R3 | Status | Evidence |
|---|---|---|
| M1 | Partly fixed | Warning no longer mentions `patrolOverride` (`check_story_npcs_leave`, validate_office_life.rb:452 to :455); test added; SKILL.md:14 and the plan's five sites carry superseded notes; SKILL.md:244 has the ban. The new text offers an option the skill forbids, see M1 below. |
| m1 | Fixed | SKILL.md:133 to :134; mapping-patterns.md:131 to :141; gotchas.md:45; checklists.md:15; SKILL.md:244. The host of the mappings is unstated, see M2. |
| m2 | Fixed | measurement-recipes.md:122; SKILL.md:137. Cites hold: game.js:2703 to :2707 (comment and `update(delta)`), npc-needs.js:651 to :671 with `isVmActive` at :666. |
| m3 | Fixed | Validator cited by method name throughout; no `validate_office_life.rb:<line>` left in the skill. |
| m4 | Fixed at SKILL.md:76 and checklists.md:15; two sentences still give the short list, see m2 below. |
| m5 | Fixed | SKILL.md:133, :139, :244; checklists.md:15; gotchas.md:45. |
| m6 | Fixed | SKILL.md:259; checklists.md:42. |
| m7 | Fixed | See check 2. |
| m8 | Fixed | SKILL.md:111, :138. |
| m9 | Fixed | SKILL.md:244 now has the four items. |

## Check 2: engine and app edits are comments only

Every changed line in `npc-needs.js` (:454, :829, :1734, :3896, :6123), `unlock-system.js` (:523, :589) and `network_access.rb` (:970) is a `//`, `/** */`, ` * ` or `#` comment line. No code token changed. The JSDoc at npc-needs.js:3896 now says "(offWhen does not hold)", which is correct for object level.

## Check 3: V2 text and test

- The test (`validator-office-life.test.mjs:119`) filters to V2 lines and asserts none contains `patrolOverride`. `assertNot` is `!list.some(s => s.includes(frag))` (:30). The old text contained `patrolOverride.targetTile`, so the assertion fails on it; line :117 asserts the V2 line exists, so the filter is not trivially empty. Correct.
- The `V2: NPC '<id>'` prefix and the fragments matched at :117, :118, :128 are kept.
- The advice is wrong in one clause, see M1.

## Check 4: `<npc>_beat`, `<machine>_off` and the section 5 example

- Condition syntax holds. `safeEvaluateCondition` (npc-manager.js:25 to :131) splits on `&&` and evaluates `value === true`, `value === false` and `!globalVars.x`; `value` comes from the event data, which `setGlobal` emits as `{ name, value, oldValue }` (:1511) and the ink writer as `{ name, value }` (global-writer.js:194).
- No `||` in any example condition; the validator rejects `||` (validate_scenario.rb:6340).
- Each mapping writes one scalar key; the sync cost is one derived global per shared machine plus one beat global per beat, as the skill says.
- Shape: valid mapping objects (`eventPattern`, `condition`, `setGlobal`), shown as `jsonc` with a comment line, as elsewhere in the file.
- Gap: where the mappings live, see M2.

## Major

**M1. The new V2 warning offers the beat gate as a way to let a story NPC leave its room, which the skill forbids for exactly the NPCs V2 flags.**
- Evidence: the warning (validate_office_life.rb:452 to :455) fires only for an NPC that owns a required-task knot, is a conversation-mode target or is a key or card source, and whose needs leave its own room. It advises: "leash it to its own room ... , gate the machines it may use away from its post with the beat gate (mission-office-life, protection 3), or leave it without away needs."
- SKILL.md:80: such an NPC "still raises V2 when its needs leave its room ..., and the cast table keeps it in its own room ... do not plan kitchen trips for them." The cast table (:59) caps story-critical NPCs at "only confined to its own room, or none". checklists.md:15: "V2 clear or leash is its own room".
- The beat gate does not clear V2 (it does not change `away_need_rooms`), so the warning stays; SKILL.md:242 lets an implementer "justify" a warning, and the warning's own text is a ready justification for keeping a kitchen trip on a key source. Same class of fault as R3 M1: the tool teaches what the skill bans.
- Fix: "A story NPC must stay reachable: confine its needs to its own room (needsRooms) with every need target there, or give it no away needs. A beat gate does not lift this (mission-office-life, Stage 1). deferrable: false does not exempt it." Add a test assertion that the V2 line does not contain `beat gate`, or that it contains `own room` and not `gate the machines`.

**M2. The derived-global mappings have no named host, and on a room NPC they miss edges.**
- Evidence: a person NPC's `eventMappings` go live only when its room loads (`registerNPC` in `npc-lazy-loader.js:96` to :103, which calls `_setupEventMappings`, npc-manager.js:378 to :379). `global_variable_changed:<cause>` is emitted once per write (npc-manager.js:1511; global-writer.js:194). A cause that changes before the host's room has loaded is never seen, and nothing re-derives `<machine>_off` later.
- Failure path: the planner puts the four mappings on the moved NPC (the natural reading of SKILL.md:134, "new mappings appended at the end"). `gary_beat` turns true before the player opens Gary's room, `coffee_off` stays false, the room loads, and Gary walks to the coffee machine inside his beat window. The same happens to `wh_staff_upset` if the host room loads after the trouble.
- m03 already avoids this: section 5's own example puts its mappings "on the HaX phone NPC" (mapping-patterns.md:110), and the start room's NPCs, phone contacts included, register at game start (game.js:2210 to :2215). The new paragraph and SKILL.md:134 do not say so.
- Fix: in SKILL.md:134 and the mapping-patterns section 5 bullet, add: "Put these mappings on an NPC registered at game start (the mission's phone NPC, or any NPC in the start room, `core/game.js:2210` to `:2215`), appended last, never on the moved NPC or an NPC in another room: a room NPC's mappings go live only when its room loads (`npc-lazy-loader.js:96` to `:103`) and a missed `global_variable_changed` is not replayed." Add the same to the checklists.md:15 derived-global clause ("hosted on a start-room NPC"). Apply the same rule to any mapping that sets `<npc>_beat`.

## Minor

**m1. A mapping-patterns line cite went stale.** SKILL.md:143 cites `references/mapping-patterns.md:131` for the m03 cooler-witness case. The new section 5 block moved it to :142 (:131 is now the beat-gate bullet). The :129 cite at SKILL.md:138 and the :11, :108 cites at :134 still hold. Fix: cite `:142`, or cite "section 5, the cooler case".

**m2. Two sentences still give the short background list.** R3 m4 added timed conversations and the phone-to-person transition to the precedence list at SKILL.md:76 and checklists.md:15. The rule-out sentence on the same line (:76, "An NPC-level `chatBackground`, a `Background[...]` line or a mapping `background` that shows its post ... rules it out") and SKILL.md:141 ("unless an ink, mapping or NPC-level background overrides it") leave them out. Fix: ":76 ... a mapping's or a timed conversation's `background`, or a phone-to-person transition, that shows its post ..."; ":141 ... unless an ink line, a mapping or timed-conversation background, a phone-to-person transition or an NPC-level background overrides it".

## Check 5: consistency, Stage 0 to Stage 5

Stage 1 (:76 to :81), Stage 2 (:111, :133 to :143), Stage 4 (:244) and Stage 5 (:256, :259), with checklists.md:15 and :39 to :42 and gotchas.md:42 to :45, now agree on `<npc>_beat`, `<machine>_off` only where a machine has two or more causes, break negation, the sign-in PC definition, found at post first, the null-state poll and the `patrolOverride` ban. No `<gate>`, "per gated machine", "can sign in to" or `affordance.offWhen` wording is left in the skill. The plan's superseded notes are at :68, :183, :288, :689 and :693. The open inconsistencies are M1 (validator against Stage 1) and the two minors.

## Verdict

No blocker. M1 is a one-line text change plus one assertion; M2 is two sentences in the skill and one clause in the checklist. Both are scoped, so round 5 can be a Sonnet delta.

## Outcomes

Fixes in a4f7ab12c plus a test-assertion follow-up.

- M1 fixed. The V2 warning in `check_story_npcs_leave` now says to leash the NPC to its own room (`needsRooms`) or give it no away needs, and that a beat gate does not lift this. The test asserts the V2 line does not contain `gate the machines`. (Asserting on `beat gate` itself failed, because the new text names the beat gate in order to rule it out.)
- M2 fixed. SKILL.md (derived-global bullet), `references/mapping-patterns.md` section 5 (bullet and example comment) and `references/checklists.md` now say the `<machine>_off` and `<npc>_beat` mappings are hosted on the phone NPC or another start-room NPC, never the moved NPC, citing `npc-lazy-loader.js:96` to `:103`, `npc-manager.js:1511` and `game.js:2210` to `:2215`.
- m1 fixed. SKILL.md "Other NPCs" cite now reads `mapping-patterns.md:142`; line 142 is the cooler-case bullet.
- m2 fixed. The rule-out sentence (Stage 1) and the "At its post" bullet list timed conversations and the phone-to-person transition.

Checks: `node test/js/validator-office-life.test.mjs` 33 pass, 0 fail. The Ruby validator on `test_needs_attack` and `m03_ghost_in_the_machine` prints no V2 line for either; the only office-life output is the existing V4 warnings on m03.
