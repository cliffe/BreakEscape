# m05 office-life plan review, round 5

B 0 / M 0 / m 0

Read only, worktree `p-ol-m05` at `8efa58e5e`. Engine paths are under `public/break_escape/js/`; plan files under `scenarios/m05_insider_trading/office_life/`.

## R4 minors: all three fixed

- **m-a (conversation_closed cite): fixed.** PLAN.md:254 now cites `minigames/person-chat/person-chat-minigame.js:1993`. The `conversation_closed:${this.npcId}` name is built at 1993 and emitted on the next lines (once per instance on cleanup). Within one line, acceptable.
- **m-b (KO guard on the onceOnly re-hides): fixed.** PLAN.md:117 carries `globalVars.server_room_entered === true && globalVars.thandiwe_ko !== true`; :118 says "same condition (with the KO guard)". A failed condition does not consume the `onceOnly` key, so a KO'd Thandiwe is left as the attack probe left her. Bernadette's onceOnly shows (:196, :197) stay unguarded, which is right: she is hidden until the turn, so she cannot be KO'd before they fire, and a later show on a visible body does nothing.
- **m-c (lisa_met listing and wording): fixed.** `lisa_met` is in the section 2.11 declared-false list (:144) and in section 7 (:321, :325). DIALOGUE_SAMPLE.md now reads "Once you have spoken to Lisa, she may step to the kettle while you are two rooms away."

## Condition syntax

`globalVars.server_room_entered === true && globalVars.thandiwe_ko !== true` is valid. `safeEvaluateCondition` (`npc-manager.js:25` to `:132`) splits on `&&` (`:128` to `:130`) and sends each part to `evaluateSingle`. Each part matches `compareMatch` (`globalVars` dotted LHS, `===` or `!==`, literal `true` parsed by `parseLiteral`). `resolveLHS` reads `window.gameState.globalVariables`. An undeclared or unset global compares `!== true` as true, and both globals are declared `false` anyway. No `||` is used.

## Nothing else changed

`git diff fc761ca5c 8efa58e5e --stat` shows only PLAN.md (8 lines), DIALOGUE_SAMPLE.md (1 line) and the new R4 review. Section 7 counts are unaffected: the guard adds no mapping or key (onceOnly 12, cooldown-only 9, plain 2). Thandiwe's two onceOnly keys, the lazy-load fallback paragraph and the E-checks read consistently with the new condition. The mapping "same condition" wording at :118 is unambiguous enough for a builder.

## Findings

None that a builder would trip over.

## Verdict

Ready to build.

## Outcomes

No findings. Plan reviews stop at R5; the plan goes to build.
