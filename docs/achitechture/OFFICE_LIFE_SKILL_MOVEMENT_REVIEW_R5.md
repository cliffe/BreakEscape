# Office-life skill movement step, review round 5

Blockers 0, Majors 0, minors 1.

Tree: `.claude/worktrees/p-ol-skill-move` at 5fcea3692. Delta review of `git diff 3f644ea10 5fcea3692` (R4 fixes a4f7ab12c plus the test follow-up). Read only. `node test/js/validator-office-life.test.mjs`: 33 tests, 33 pass, 0 fail.

Assumption: every mission's phone NPC is declared in the start room's NPC list, as in m03; I did not check other missions for a phone NPC declared elsewhere.

## Check 1: R4 findings

| R4 | Status | Evidence |
|---|---|---|
| M1 | Fixed | V2 text (`check_story_npcs_leave`, validate_office_life.rb:452 to :455) now gives two ways only: leash to its own room with every need target there, or no away needs. It says a beat gate does not lift this and points to Stage 1, which holds the rule (SKILL.md:80). |
| M2 | Fixed | SKILL.md:134, mapping-patterns.md:131 to :141 (example comment and the "Host these" bullet) and checklists.md:15 all name the phone NPC or a start-room NPC, never the moved NPC, and cover `<npc>_beat` mappings too. |
| m1 | Fixed | SKILL.md:143 cites `mapping-patterns.md:142`, which is the cooler-case bullet. |
| m2 | Fixed | SKILL.md:76 rule-out sentence and SKILL.md:141 now list timed conversations and the phone-to-person transition, matching the precedence list and checklists.md:15. |

New cites hold:
- `core/game.js:2210` to `:2215`: the starting room's NPCs load through `npcLazyLoader.loadNPCsForRoom` before the room visuals, with the comment that phone NPCs register then.
- `npc-lazy-loader.js:96` to `:103`: `registerNPC` per room NPC, run when that room loads.
- `npc-manager.js:1511`: the mapping `setGlobal` path emits `global_variable_changed:<name>` once per write (:1510 to :1511). There is no replay.
- Unchanged cites spot-checked: `mapping-patterns.md:11` and `:108` (the `wh_staff_upset` `offWhen`) and `:129` (the `patrolOverride` lesson).

## Check 2: V2 text and test

- The new text offers no way out of the room. "A beat gate does not lift this" names the gate only to rule it out.
- The R3 text contained "gate the machines it may use away from its post with the beat gate", so the assertion at validator-office-life.test.mjs:120 fails on it. The filter is not empty: :117 asserts the V2 line exists. The `patrolOverride` assertion (:119) is kept.
- `validate_office_life.rb:427` still cites "protection 3" for the `post_override?` comment. That is correct: SKILL.md:111 protection 3 is the beat gate and says `post_override?` is not a protection.

## Check 3: section 5 example

- Shape: four mapping objects with `eventPattern`, `condition` and `setGlobal`, each writing one scalar key (`coffee_off`). Conditions use `value === true`, `value === false && !globalVars.<x>`, which `safeEvaluateCondition` supports (R4 check 4). There is no `||`. Sync is bounded: one derived global per shared machine, as the skill says.
- Host: the comment says "on the HaX phone NPC (registered at game start), appended last", and the bullet below says "Host these on the phone NPC or another start-room NPC ...", which covers all four plus any `<npc>_beat` setter.
- Not raised: the comment sits between the two setting mappings and the two clearing ones, so on its own it reads as if it covers only the clearing pair. The bullet directly below says "Host these", so a planner will not misplace them.

## Check 4: rest of the step

The diff touches only the five named files plus the R4 outcomes. No other wording changed. Stage 1 (:76, :80), Stage 2 (:111, :133 to :143), checklists.md:15 and the validator text now agree that V2 NPCs stay in their own room and that derived and beat mappings live on a start-room NPC. There is one gap:

## Minor

**m1. The Stage 4 story-safe check leaves out the host rule.** SKILL.md:244 is the implementer's before-and-after check and mirrors checklists.md:15 item by item (R3 m9 brought it into line). It lists "a derived global where a machine has two or more causes" but not where its mappings live. checklists.md:15 now says "its mappings and any `<npc>_beat` mapping hosted on the phone NPC or a start-room NPC, never the moved NPC". An implementer working from Stage 4 would not catch the R4 M2 failure (mappings on the moved NPC, a cause missed before its room loads). Fix: after "a derived global where a machine has two or more causes" at SKILL.md:244, add "with its mappings and any `<npc>_beat` mapping on the phone NPC or a start-room NPC, never the moved NPC".

## Verdict

Ready to land. All four R4 findings are fixed, the new cites hold, the V2 warning and its test are correct, and the section 5 example is valid and bounded. m1 is a one-clause edit to SKILL.md:244. Make it in the landing commit; it needs no further review round.

## Outcomes

- m1: fixed, SKILL.md:244 now carries the host rule.
