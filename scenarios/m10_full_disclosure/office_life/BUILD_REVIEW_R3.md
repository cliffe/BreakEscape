# m10 office life: build review R3 (delta)

Scope: `git diff 0a8d4e609 862860a6c` plus the four R2 findings. Read-only; no server run.

B 0, M 0, m 1

## Findings

| # | Sev | File:line | Evidence | Fix |
|---|---|---|---|---|
| 1 | m | office_life/SPOKEN_LINES.md:11 | The Chars column for Sofia's new conversation line says 50; "Cold and tired, but fed. One out of three's not bad." is 52 characters. No limit applies to conversation lines, so this is a doc slip only. Every other length in the file matches its text. | Change 50 to 52. |

## R2 findings

- **#1 (live coverage after 93cc9ca10): pending, not a finding.** LIVE_E2_UNTETHERED.md (head 0a8d4e609) shows no problem: 0 NPC hits near the pair from clock 40 to 228, the untethered route through the breach into the tunnel, pair visible throughout. Still not covered: reload past the breach with the walk out and back in (B2C check 5), reload-stays-hidden, and the credits capture. The live run in flight should cover these. E2 notes the pair's kettle trips did not move the sprites on screen (event results only); the log calls it a design question, not a check failure.
- **#2 (Sofia middle clause): resolved.** Clause order is KO, then `fp_staff_upset`, then plain, in all four places (credits_sections.json:114 and :279; scenario.json.erb:1000 and :1165). The condition string `globalVars.fp_staff_upset === true` has the same form as `globalVars.fp_sofia_ko === true`. The engine takes the first clause whose condition holds (`closing-sequence.js:66`, `holds` at :37 through the test callback), so order is right, and `fp_staff_upset` is set by the mappings at scenario.json.erb:2053 to :2059. Both copies are textually identical (JSON text and ERB heredoc, indentation aside). Darren needs no matching clause: his plain line is about the generator and stays true.
- **#3 (PLAN 2.1 sentence): resolved.** Matches `npc-behavior.js:579` (`homeReturnThreshold = 32`) and `:3261` (`distanceFromHome > homeReturnThreshold` starts the return). The 28.8 px figure matches LIVE_B2B check 3 as quoted in R2.
- **#4 (Sofia's line): resolved.** `ink/m10_fp_support.ink:48` reads "Cold and tired, but fed. One out of three's not bad."; `bin/inklecate` on the ink gives JSON byte-identical to the committed `m10_fp_support.json`. The line reads as a joke about three adjectives (cold, tired, fed) and is clear. No em or en dash.

## Checked and clean

- SPOKEN_LINES.md pointers: pool lines at scenario.json.erb:2636 (Darren) and :2670 (Sofia) are right; ink pointers :30, :36, :45, :48, :54, :61 to :64, :69 to :71, :76 to :78 match; credits pointers match the new line numbers. All pool and exchange lengths match and are 40 or fewer without the prefix.
- DIALOGUE_SAMPLE.md shows the new conversation line and the new credit clause.
- Content rules: no new line names a team member, the sleeper, the kit, codes or movements; UK English; no em or en dash in the ink or SPOKEN_LINES.md. "Put the kettle away when the shouting started" names no one.
- The delta changes no mapping, lock, flag or engine file.
