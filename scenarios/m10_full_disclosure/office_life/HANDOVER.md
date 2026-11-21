# m10 office life: build-phase handover

Branch `build/ol-m10`, worktree `.claude/worktrees/p-ol-m10`. The plan closed at plan review R9 (0/0/0). The user answered D118 with "a. Accept all five recommendations": small forward-post treatment; Darren Price (Orus) and Sofia Marchetti (Despina, not option e); build unvoiced; third kit crate south-centre; overhearRadius 320. The orchestrator stopped at the 150k context limit. Resume from "Open" below.

## Built (commits on build/ol-m10)

- `24af25a03` slice A: crate and kettle placeholder in `room_m10_forward.json`; `fp_kettle`; `darren_price`, `sofia_marchetti` (voice table entries `fp_darren`, `fp_sofia`); globals; seven trouble mappings on `agent_0x99`; credits in both places; six o'clock ink (two conditions, two VARs); new `ink/m10_fp_support.ink`.
- `3b047ddd5` checks, `heard_ex_fp_*` declared, SPOKEN_LINES.md. `fcd50438e` six exchange lines cut to the 40-character cap.
- `c7ec42338`, `2c87e69d8`, `83b44627d` live B1: homes measured at (276,268) and (308,268) px = tiles 8.625/8.375 and 9.625/8.375 (`needsHome` is in tiles); F1 not needed; kettle depth over crate; L1 5/5; L5 0.5 px over ten needs-minutes; one needs-minute = 60 s; distances in LIVE_B1B.md; 320 covers console and terminal, the closest blast-door stand cell is 326 px from Sofia (accepted).
- `3c31d555b` build review R1 (0 B, 2 M, 8 m). `0d50e66b9` R1 fixes: `chaseRange` 32 (table items reachable 17 to 28 px from the extras, so no range clears the table), two pool lines reworded, docs, DIALOGUE_SAMPLE.md. Outcomes in BUILD_REVIEW_R1.md.
- `a228b9c2a` LIVE_B2A.md, `9c42608b7` LIVE_B2B.md plus `tools/playtest/m10-ol-b2b-*.mjs`, `e3b7fcdd6` LIVE_B2C.md (all partial).

## Session 2 (2026-11-17/18), commits on build/ol-m10

- `f5b7feead` dialogue R1 fixes (all 8). `93cc9ca10` post-breach brew needs `!!data.previousRoom` (a load no longer brews). `0a8d4e609` live B2b, B2c run 2, L2 control. `862860a6c` R2 fixes: Sofia credit clause on `fp_staff_upset` ("Welfare. Put the kettle away when the shouting started.", both copies), PLAN 2.1 lunge note, ink:48 reworded; untethered E2. `a6738ecfa` R3, LIVE_B2D. `0447998ff` R4, check D rerun. `a18be8bfb` dialogue R2. `2c07133d6` R5 fixes (ink:45 "Bitter out here, and we're out of sugar.", ink:54 "I'll keep a cup warm for you.").
- **chaseRange 32 was the orchestrator's call** (table items sit 17 to 28 px from the extras, so no range clears the table). AC0 relayed that the user accepts it.

## Review rounds

| Round | Tier | B | M | m |
|---|---|---|---|---|
| Build R1 | planning tier | 0 | 2 | 8 |
| Dialogue R1 | planning tier | 0 | 2 | 6 |
| Build R2 | planning tier | 0 | 0 | 4 |
| Build R3 (delta) | delta tier | 0 | 0 | 1 |
| Build R4 (delta) | delta tier | 0 | 0 | 0 |
| Dialogue R2 (changed lines) | delta tier | 0 | 0 | 1 |
| Build R5 (delta) | delta tier | 0 | 0 | 3 |
| Build R6 (delta, two lines) | delta judgement | 0 | 0 | 0 |

All findings fixed. R5's fixes changed two ink lines, so one more delta review (R6, minors only) on `2c07133d6` is due before voicing: check ink:45 and :54 in their knot, the compile, and SPOKEN_LINES lengths (40, 29).

## Live proof (all keyless :3099, fresh games)

- Radios orders (LIVE_B2B): console 7997 and table 7998 heard, Sofia first, Darren brews +2.0 s, Sofia +4.7 s; door 8000 missed at 326 px (accepted). No brew on the split close or a second Arakawa talk; reload past the split holds.
- Real strike (8013 Sofia, 8014 Darren): `npc_attacked` sets `fp_staff_upset` on the first hit, kettle off, survivor never brews. **The B2A gap was a debugKO artefact; no mapping added.**
- Chase at 32: max 28.8 px lunge, no pursuit; a struck extra stays where the lunge ended (engine walks home only past 32 px; PLAN 2.1 notes it).
- Walkthrough 1 to 16 (7999) and untethered route to the tunnel (8051): 0 NPCs within 14 px of the homes, no stalled walk.
- Reload past the breach (8071): no brew on load for 116 s; a real walk-in brews 2.7 s later. E1: both hide at `closing_done` and stay hidden after a reload. Credits order: Arakawa, Malhotra, Darren, Sofia (plain).
- Upset credit (8125): Sofia's upset clause chosen, read through `window.endingReplayOptions` on live globals; not seen on screen (the credits overlay shows one line at a time).
- L2 (LIVE_L2_CONTROL): the van_two and malhotra_post fails are the `moveToNear` helper stopping short; the extras change nothing. Pressing E there opens Minder's or Nightshade's chat: base van layout, out of scope, for the level designer.
- Not proven live: a real KO's credit line and the six o'clock "bruises" line; an Arakawa KO in the yard.

## Open (resume here)

Done in session 3 (2026-11-18): R6 delta on ink:45 and :54 clean (0/0/0): both plain, voiceable, in character (40 and 29 characters), no spoilers. Voiced under the user's "implement these using your best judgement": 24 clips (Orus 11, Despina 13), 0 wasted (`tts:wasted` reports 0 of 1242), 24 requests for 24 unique lines, durations 1.7 to 5.9 s, five transcripts match. `"ttsPregenerateChatter": true` added to the m10 scenario so the batch lists the kettle_fp pools (the other m10 chatter was already cached). `main` merged in cleanly, no m10 conflicts.

Remaining: only the uncommitted `dungeon_graph.*` (not ours) and `node_modules`.

## Wording sign-off (AC0 says it counts as signed off once the loops are clean)

All in `DIALOGUE_SAMPLE.md`: Darren's 3 conversation lines and 4 pool lines; Sofia's 3 conversation lines and 4 pool lines; the three exchanges (4 + 3 + 3 lines); credits (not voiced): Darren 2 clauses, Sofia 3 clauses, including the new upset clause.

## Voicing list (clip counts per voice)

| Voice | Speaker | Conversation (ink) | Exchanges (ink) | Pool (kettle_fp) | Clips |
|---|---|---|---|---|---|
| Orus | Darren Price | 3 (`ink:27`, `:30`, `:36`) | 4 (`:61`, `:63`, `:70`, `:77`) | 4 | 11 |
| Despina | Sofia Marchetti | 3 (`ink:45`, `:48`, `:54`) | 6 (`:62`, `:64`, `:69`, `:71`, `:76`, `:78`) | 4 | 13 |
| | | | | Total | 24 |

Line numbers are from SPOKEN_LINES.md; recheck there before voicing.
