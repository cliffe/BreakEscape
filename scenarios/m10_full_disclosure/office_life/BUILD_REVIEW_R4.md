# m10 office life: build review R4 (delta)

Scope: `git diff 862860a6c a6738ecfa` (BUILD_REVIEW_R3.md, LIVE_B2D.md, SPOKEN_LINES.md only; no scenario, ink, engine or credits change), the R3 finding, LIVE_B2D against PLAN section 10, and a last pass over the whole office-life surface. Read-only; no server run.

B 0, M 0, m 0

## Findings

No findings.

## R3 finding

- **#1 (SPOKEN_LINES.md:11 length): resolved.** The Chars cell now reads 52; "Cold and tired, but fed. One out of three's not bad." counts 52 characters. It matches `ink/m10_fp_support.ink:48`.

## LIVE_B2D against PLAN

- **E1 (both hide at `closing_done`; stay hidden after a reload): met.** Both extras `vis false` at clock 569, one clock-second after `closing_done` (568). After sync and reload, read before any polling (page clock 1), both are `h` at (276,268) and (308,268), unchanged after Enter on the title and the Mission Brief open. Closes the R2 and R3 "pending" item and LIVE_B2C check 6.
- **Reload past the breach (PLAN 10.3, HANDOVER item 3): met.** No `job_start`, `using` or `npc_use_started:fp_kettle` for 116 s after the load; a real walk-in gave `level_set` 1.7 s later and `using` 2.7 s later, matching the `room_entered:forward_post` mapping (`!!data.previousRoom`) at scenario.json.erb:2646.
- **Credits order: met.** Recorded stream runs MALHOTRA, DARREN PRICE, SOFIA MARCHETTI, plain lines for both, which is PLAN 2.6 (straight after Malhotra) and credits_sections.json:80 to :121. The stream stops at Sofia, so "before Vector" is shown by the static file only; low risk, same engine order.
- **E3 (tunnel guard kettle beat, tethered): met elsewhere**, LIVE_B2C check 2 (beat shown, ink diff touches only `m10_fp_support` and `m10_six_oclock`). Not re-run on the untethered route, which PLAN does not require.
- **Punch on Sofia: precondition met** (`fp_staff_upset` true, `fp_sofia_ko` false, no KO). The upset credit line is pending the in-flight D re-run, as briefed.

## PLAN checks with no live result in any LIVE_*.md

Not findings; for the orchestrator to keep or accept.

1. Credits knocked-out clauses (`fp_darren_ko`, `fp_sofia_ko`, style `warning`) never seen live, and the six o'clock "bruises" line (PLAN 10.4) never seen live after an extra's KO. LIVE_B2A A2 and A3 used `debugKO`, which sets the KO global but not `fp_staff_upset`.
2. A real knock-out of an extra (a punch sequence to zero health) was never run. The R2-era question (HANDOVER item 2) is answered in design by `npc_attacked:*` setting `fp_staff_upset` first (scenario.json.erb:2053 to :2054, and B2D shows a real punch sets it), but "KO of one extra, the survivor stops brewing" is untested live.
3. Knock out a team member in the yard (PLAN 10.4, Arakawa at the gate): LIVE_B2A A4 could not reach `arakawa_gate`; the `global_variable_changed:arakawa_ko` mapping (:2055) is unproven live.
4. L2 `van_two` and `malhotra_post` reach: LIVE_L2_CONTROL shows the fault is layout and harness (neighbouring NPC takes E), with and without the pair; not an office-life effect, so open only as an existing-layout note.
5. Walkthrough 10.1 steps 6 to 16 played only as a stand-in-flag run in B2D (flags typed, not earned); the VM flags stay required in the scenario (no `flag` bypass added in the diff).
6. Sofia's upset credit line ("Put the kettle away when the shouting started."): pending, D re-run in flight.

## Checked and clean (whole surface)

- `darren_price` and `sofia_marchetti` (scenario.json.erb:2615 to :2674): ids, `needsHome` equal to `position` (tiles), `needsRooms ["forward_post"]`, shared group `fp_support`, own KO globals, `chaseRange` 32, no `patrolOverride`, exchanges owned by Darren with all three gated on `fp_staff_upset: false`, breaks all carry `!globalVars.fp_staff_upset`. Sofia's coupling reads `data.npcId === 'darren_price'`, one way, so no loop.
- `fp_kettle` (:2876 to :2884): `offWhen: "fp_staff_upset"`, `capacity 2`, `queue false`, no `officePresets`, not takeable, no lock.
- `agent_0x99` mappings (:2053 to :2059): seven `onceOnly` entries appended last; globals declared at :4759 to :4764.
- Credits: the two copies (credits_sections.json and the ERB heredoc at :983 to :1001 and :1148 to :1166) hold the same clause order (KO, upset, plain). Entries sit after Malhotra in both sections.
- `ink/m10_fp_support.ink`: no line names a team member, the sleeper, the kit, a code or anyone's movements; conversations all exit with `#exit_conversation`; exchange lines carry full display names; UK English.
- No em or en dash in the ink, credits_sections.json or SPOKEN_LINES.md. The delta changes no lock, flag or mapping, so VM flags stay required.
- Working tree: only `dungeon_graph.*` modified in the mission folder (not part of this build).
