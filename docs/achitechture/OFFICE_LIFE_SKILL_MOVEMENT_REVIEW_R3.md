# Office-life skill movement step, review round 3

Blockers 0, Majors 1, minors 9.

Tree: `.claude/worktrees/p-ol-skill-move` at 4ff19d2a1 (R2 fixes e22f9db95 plus main). Read only. Between 8894096d3 and 4ff19d2a1 the only engine, script, app or lib change is the R2 comment in `scripts/validate_office_life.rb` (+3 lines), so the engine and schema citations are unchanged.

Assumption: "a PC the player can sign in to" means the engine's `lockType: "login"` PC plus any host the server reaches for a remote sign-in or share; I read that from code, not from a skill definition.
Assumption: I treated the validator as in scope only for its warning text and tests; removing the `post_override?` exemption is a behaviour change I list as a decision, not as a required fix.

## R2 findings: status

| R2 | Status | Evidence |
|---|---|---|
| M1 (D84 switch) | Fixed | SKILL.md:75 to :80, :141, :144, :256, :286; checklists.md:41. One gap in the background list, see m4. |
| M2 (protection 3) | Fixed in the skill | SKILL.md:81, :111, :138; gotchas.md:42. The validator still teaches the old protection, see M1. |
| M3 (sign-in PC) | Fixed | SKILL.md:133, :139, :244; checklists.md:15; network_access.rb:981 to :986 holds. "Sign-in PC" is not defined, see m5. |
| M4 (one offWhen, off for all) | Fixed in substance | SKILL.md:107, :134, :135; gotchas.md:45. The wiring is underspecified, see m1. |
| m1 | Fixed | SKILL.md:138; validate_office_life.rb:422 to :427 comment is accurate. |
| m2 | Fixed, and the withdrawal is right | `def render` is at `scripts/lock_key_diff.rb:85` on both trees. The R2 comment then moved the validator lines the skill cites, see m3. |
| m3 | Fixed | measurement-recipes.md:109 to :115. |
| m4 | Fixed | SKILL.md:133. |
| m5 | Fixed | SKILL.md:45. |

New engine citations from the R2 fix, all checked and holding: npc-needs.js:517, :830 to :837, :1555, :1785 to :1791, :2089 to :2095, :3256 to :3259, :3480 to :3484, :3522 to :3530; doors.js:883; npc-lazy-loader.js:99 to :105; person-chat-background.js:6 to :15; test-bridge/index.js:1051 to :1063, :1340 to :1383; schema :3966, :4850, :4851, :4963, :4973, :5480.

D84 premise checked: the game judges an NPC's room for interaction by its live body position (`roomIdOfTarget`, interaction-walls.js:106 to :118; `sameRoomFrom` :191 to :198), and the bridge's `otherRoom` uses the same test (test-bridge/state.js:423). Talking to a moved NPC in the kitchen works for the player and for a scripted run.

## Major

**M1. The validator still tells authors to fix V2 with a `patrolOverride`, and adding one silences V2.**
- Evidence: `scripts/validate_office_life.rb:452` to `:454`: "leash it (needsRooms), or add a patrolOverride.targetTile mapping that returns it to its post before the beat". `:447` skips the warning when `post_override?` (`:428` to `:434`) finds any story-event `patrolOverride.targetTile` mapping. The comment just above (`:422` to `:427`) now says the exemption is not a protection, so the code and its own comment disagree.
- The skill sends every new warning to be "cleared or justified" (SKILL.md:242; checklists.md:9). An implementer who gets V2 on a story NPC and follows the warning adds the walk that SKILL.md:111 and :138 forbid, and the warning goes away. Only the manual line in checklists.md:15 ("no `patrolOverride` on any needs NPC") would catch it.
- The planner's sources teach the same old rule. SKILL.md:14 sends planners to `OFFICE_LIFE_MISSIONS_PLAN.md` sections 2 and 4, which still define protection 3 as the `patrolOverride` walk (`:68`, `:183`, `:288`, `:689`, `:693`). SKILL.md overrides the plan's section 12 counts in so many words (:208) but says nothing about section 2.
- Severity: major. The tool and the source document both point at the pattern the skill bans, and following them hides the warning.
- Fix:
  1. Change the warning text to match SKILL.md:80 and :81: "A story NPC must stay reachable: leash it to its own room (needsRooms) with every need target there. A patrolOverride is not a protection for a needs NPC (mission-office-life, protection 3). deferrable: false does not exempt it." Keep the `V2: NPC '<id>' ...` prefix, since the tests match on it.
  2. Test: add an assertion to `test/js/validator-office-life.test.mjs` V2 block (:115) that the warning text does not contain `patrolOverride`. The existing assertions match on `"V2: NPC 'gary' is a key or card source"`, `'out of its own room (to kitchen (need))'` and `'is the target of a conversation-mode mapping'` (:117, :118, :128), so the new text breaks none of them.
  3. Removing or narrowing the `post_override?` exemption is a behaviour change: it breaks `:120` to `:121` and the post-override test from `:132`, and `scenarios/test_needs_attack` may rely on it (it has a `patrolOverride` and needs). Put it to the user as a decision item, with the tests updated in the same commit if they say yes. Until then the skill's checklists.md:15 line is the only guard; also add "no `patrolOverride` on a needs NPC" to the Stage 4 line at SKILL.md:244.
  4. Add one line to SKILL.md:14: "Section 2's protection 3 (a `patrolOverride` walk) and the V2 row in section 4 are superseded by protection 3 below." Or correct the plan's five lines.

## Minor

**m1. The beat gate and the derived global are written as two different designs, and the clearing rule has no pattern.**
- SKILL.md:133 describes one scalar gate global read by `offWhen` on each machine and negated in each break's condition. :134 then gives every gated machine its own `<machine>_off`. :244 and checklists.md:15 require "one derived global per gated machine" on every gated machine.
- A planner cannot tell (a) whether a machine with no other `offWhen` cause needs a derived global (it then mirrors the beat global, one more non-monotonic key for nothing); (b) which global a mapped break negates once the machine reads `<machine>_off`; (c) how to set the derived global without editing an existing mapping's `setGlobal`, which standing rule 3 forbids.
- The clearing rule is safe only if every clearing mapping checks every other cause. A naive "beat over: set `<machine>_off` false" turns m03's trouble gate back off and sends upset staff back to the coffee machine. The validator rejects `||` (gotchas.md:66), so the clearing needs one mapping per cause-ending event, each with an `&&` condition on the others.
- Sync cost: bounded. One beat global per beat and at most one derived global per gated machine, each a scalar written by `setGlobal` (npc-manager.js:1500 to :1512). With at most two or three moved NPCs that is a handful of keys. The skill already sends them to the sync budget (:134).
- Fix: in SKILL.md:133 to :134, name the parts: a beat global `<npc>_beat` set by the event that opens the window; on a machine with no other cause, `offWhen: "<npc>_beat"` directly; on a machine that already has an `offWhen` or is shared by two beats, `offWhen: "<machine>_off"`, set true by new mappings appended at the end on `global_variable_changed:<cause>` with `"condition": "value === true"`, and cleared by one appended mapping per cause on `global_variable_changed:<cause>` with `"condition": "value === false && !globalVars.<other cause>"` (one term per other cause). Mapped breaks always negate `<npc>_beat`. Put this shape in `references/mapping-patterns.md` section 5 and make :244 and checklists.md:15 say "a derived global where a machine has two or more causes".

**m2. Section 10's needs-clock claim holds, but the VM pause is missing and it changes lead times.** measurement-recipes.md:122; SKILL.md:132, :137.
- The claim is right. The needs clock advances by the frame step the walks use (`window.npcNeedsSystem?.update(delta)`, core/game.js:2704 to :2707; npc-needs.js:651 to :671), clamped at `MAX_FRAME_MS` 1000 (:23). The comment at :652 to :658 says Phaser holds the step near one normal frame below 5 fps, so a throttled loop runs the clock and the walks slower than wall time, together.
- It leaves out that the clock stops altogether while the player is on the VM (`if (this.world.isVmActive()) return;`, npc-needs.js:666; `isVmActive`, :5358). Every campaign mission has VM flags. A gate global set while the player is on the VM, or by an event at the VM exit, gives no lead time: the NPC stays frozen mid-trip until the player leaves the VM, and the beat can open at once.
- Fix: cite game.js:2704 to :2707 and npc-needs.js:651 to :671 in section 10 in place of "may run the clock slower". Add: "the needs clock stops while the VM is open (npc-needs.js:666): the gate's setting event must not be a VM flag or happen while the VM is open, and the lead time counts from when the player leaves the VM". Add the same sentence to SKILL.md:137.

**m3. Validator line citations are 3 lines off on this branch.** SKILL.md:80 (`:438` to `:445`), :81 (`:432` to `:452`, `:424` to `:430`). The R2 comment added 3 lines above `post_override?`. On this tree: `post_override?` comment :422 to :427, method :428 to :434; `check_story_npcs_leave` :436 to :456; the reasons :441 to :447. `away_need_rooms` (:371 to :420) is unchanged. SKILL.md:10 pins line numbers to 8894096d3, but readers use the branch file, and fixing M1 moves them again. Fix: cite these by method name (`post_override?`, `check_story_npcs_leave`, `away_need_rooms`), or re-cite after M1 lands.

**m4. The background list leaves out timed conversations and the phone-to-person transition.** SKILL.md:76 names "a mapping's `background` on the event that opens the chat". Precedence 2 in person-chat-background.js:9 to :11 is "a timed conversation's `background`, an event mapping's `background`, or the phone-to-person transition". A `timedConversation` that opens with the NPC's office as its background places it as surely as a mapping does. Fix: "an explicit background passed to the chat (a mapping's or a timed conversation's `background`, or a phone-to-person transition)" at :76, and the same in checklists.md:15.

**m5. "A PC the player can sign in to" is not defined.** SKILL.md:133, :139, :244; checklists.md:15; gotchas.md:45. In the client, the walk-up refusal applies to `lockType: "login"` PCs (unlock-system.js:559, :608 to :611). On the server, `host_service_off?` (network_access.rb:981 to :986) also refuses remote sign-ins and shares, and the schema (:5480) adds "no share is served and no pivot relays". A planner may take "sign in to" to mean only the keyboard. Fix: "a `lockType: "login"` PC, or any PC that is a network host for a remote sign-in, a share or a pivot".

**m6. The scripted-run poll hangs before the NPC's room loads.** SKILL.md:259; checklists.md:42. `needs.state(id)` returns `null` until the NPC registers (test-bridge/index.js:2214; `getState`, npc-needs.js:5093 to :5095), and it registers only when its room loads (npc-lazy-loader.js:105). A poll for `atPost === true` before the player has opened the room never ends. Fix: "a `null` state (not registered yet, so standing at its spawn) counts as at post", and give the poll a timeout that fails the step with the last state recorded.

**m7. `offWhen` lives at object level. Settled from code; several engine comments still say `affordance.offWhen`.** Fixer's open point 3.
- Object level is the only place read. The client copies object-level `sd.offWhen` into the needs world (npc-needs.js:5237 to :5241, "format 8a moved it off the affordance; the format upgrade guarantees object-level"). `_isOff` reads that copy (:830 to :837). The server reads `obj['offWhen']` (lib/break_escape/access_work.rb:1272 to :1274, used by network_access.rb:982). The format upgrade moves `affordance.offWhen` up to the object (lib/break_escape/format_upgrade.rb:42, :55). The schema has `offWhen` on the object (:5480, "was affordance.offWhen") and not in the affordance definition.
- SKILL.md:133 and :153 and mapping-patterns.md:11, :18 are right.
- Stale comments that could mislead a planner who reads the engine: npc-needs.js:454, :829, :1734, :6123; unlock-system.js:524; app/models/break_escape/network_access.rb:970. These are engine follow-ups, outside this skill. Fix: note them for the integrator; no skill change.

**m8. The wording of protection 3 reads as compulsory and is used for two things.** SKILL.md:111 says "(3) for any story NPC that has needs, the beat gate". :133 says to use it "only where a beat needs the NPC at post and no other protection fits", so a story NPC with needs confined to its own room (protection 2) does not need it. :138 labels the `patrolOverride` ban "(protection 3)", which is the old protection's name. Fix: at :111, "(3) where a beat needs a story NPC with needs at its post spot, the beat gate"; at :138, "(see protection 3)".

**m9. The Stage 4 check is shorter than the checklist.** SKILL.md:244 lacks three items that checklists.md:15 has: mapped breaks conditioned `!globalVars.<gate>`, at most two or three moved NPCs each found at post first, and the machine's other users listed. It also lacks "no `patrolOverride` on a needs NPC" (M1). Fix: add the four items to :244.

## Fixer's open points

1. V2 warning text: yes, change it now (M1, fix 1 and 2). The test is `test/js/validator-office-life.test.mjs` V2 block from :115; none of its current assertions match the old advice, so add one that the text no longer contains `patrolOverride`. Removing the exemption is a user decision with test changes at :120 to :121 and from :132.
2. Section 10: the claim holds in code (m2), so it can be stated as fact with citations. The real gap is the VM pause.
3. `offWhen` placement: object level, settled (m7).

## Consistency, Stage 0 to Stage 5

Stage 0 to Stage 2 and Stage 5 now agree on D84, found at post first, the beat gate and the sign-in limit. The Test plan (:200) names every Stage 5 check. The remaining inconsistencies are the single gate against the derived global (m1), the Stage 4 line against the checklist (m9), and the validator and missions plan against protection 3 (M1).

## Verdict

No blocker. Fix M1 (warning text, test, and the sources line), then the minors. M1 adds no new design decision beyond the exemption question, which goes to the user. Round 4 can be a delta on the cheaper tier once M1 is fixed. If the exemption is removed, that is a validator behaviour change and case 3 sends it back to `opus55`.

## Outcomes

Fixed in 152124c20. The `post_override?` exemption is unchanged and stays a user decision.

- **M1.** Fixed. The V2 warning (`scripts/validate_office_life.rb`, `check_story_npcs_leave`) now points to a leash, the beat gate (protection 3) or no away needs, and does not mention `patrolOverride`; the `V2: NPC '<id>'` prefix is kept. New assertion in `test/js/validator-office-life.test.mjs` (V2 block). SKILL.md:14 says the plan's section 2 protection 3 and the V2 row are superseded; the plan has a short superseded note at its lines 68, 183, 288, 689 and 693. Stage 4 line now includes "no `patrolOverride` on any needs NPC".
- **m1.** Fixed. SKILL.md beat-gate items name `<npc>_beat`, the direct `offWhen` case, the `<machine>_off` case with set and per-cause clear mappings, and the break negation; example added to `references/mapping-patterns.md` section 5; checklists.md and gotchas.md say "where a machine has two or more causes".
- **m2.** Fixed. The VM pause and the frame-step citations are in `references/measurement-recipes.md` section 10 and SKILL.md lead-time paragraph.
- **m3.** Fixed. Validator citations are by method name.
- **m4.** Fixed in SKILL.md and checklists.md (timed conversation `background` and phone-to-person transition).
- **m5.** Fixed. "Sign-in PC" is defined at each use (SKILL.md, checklists.md, gotchas.md).
- **m6.** Fixed. A `null` state counts as at post and the poll has a timeout (SKILL.md, checklists.md).
- **m7.** Comment wording only, no code: npc-needs.js (comments at the review's four sites plus the one at the old :3896), unlock-system.js (two comments), network_access.rb (one comment) now say object-level `offWhen`. The comment at npc-needs.js:5238 is correct and was left. `node --check` and `ruby -c` pass.
- **m8.** Fixed. Protection 3 now reads "where a beat needs a story NPC with needs at its post spot"; the ban line says "see protection 3".
- **m9.** Fixed. The Stage 4 line has the four missing items.

Tests: `node test/js/validator-office-life.test.mjs` 33 of 33 pass. The Ruby validator on `scenarios/test_needs_attack` and on m03 gives output identical to the previous commit's validator (neither raises V2, so the new text does not appear there).
