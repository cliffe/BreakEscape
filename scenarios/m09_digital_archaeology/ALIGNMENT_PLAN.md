# m09 Digital Archaeology — Alignment & Advancement Plan
> Produced by the mission-alignment-plan skill. 2026-10-22. Plan only — not yet implemented.
> Measured against: m01_first_contact, m02_ransomed_trust (and m05's pass-5 bar). Reviewed: 1 round (finale loop phase 1, `ALIGNMENT_REVIEW_F_R1.md`).

## Executive summary

m09 has been built, playtested and dressed, and it already meets the m01/m02 bar on all ten rubric rows. Earlier choices from m01–m08 change who helps, what is possible and what is said to the player, not just what the debrief lists. The work left is mostly at the edges. The main item is passing m09's own choices on to m10, the memo stance above all, so the finale's ending can hear them. After that come small canon fixes (m05's month, the coordinate branch at the briefing), letting the player see what the purge took, and a music phase for Act 3.

## Current-state assessment

| # | Dimension | Current state | Gap | Target | Anchor |
|---|---|---|---|---|---|
| 1 | Canon and stakes | The signed 1,100–2,600 replaces Analysis' "hundreds"; the purge is the night's clock; Villanueva and Noor are people at risk tonight; the name is proved; m08's "seventy-two hours" is picked up. The month for m05 is wrong (m7) | minor | "October" / "in the autumn" | m05 erb:86 |
| 2 | Aims and objective staging | Six aims, each revealed by the previous one, task titles that don't give the answers away, `missionConclusion` with `concludeRequires` on the four flags only. The notice task can't close on a hold (m5) | minor | Retitle | m02 objectives |
| 3 | HaX hub | `support_hub` topics with guards, a status ladder checked row by row, four guide offers folded into one button gated on `_offered`/`_hint_given`, and VM steers per flag | none | as is | m02 phone_agent0x99.ink |
| 4 | Ink craft | Attribution and phone prefixes clean; dialoguelint 0 errors; the briefing wall is long (m10) | minor | Dialogue phase | `README_ink_best_practices.md` |
| 5 | Moral choices and consequences | Bins, the Recruiter (four outcomes plus owning or denying the m05 deal), Sorensen, Tran, Noor, the confession, the notice, the memo, Nightshade's file. The debrief and credits agree. Losses don't show at the end (m6); the m09 stances aren't exported (A1) | **major** | Exports plus loss lines | m05 credits; FINALE_ARC §3.4 |
| 6 | Music | Event cues for the briefing, threat, identity, call and victory, and reload-safe. No Act 3 phase (m1) | minor | threat → silence → spy-action | m08 erb:172-177 |
| 7 | Rooms and layout | 11 rooms, geometry and doors clean, the staff passage keeps the RFID lock off route B, four dressing rounds done | none | as is | §2f |
| 8 | Mechanics, education, VM | Picks, two RFID clones (EM4100 and MIFARE with custom keys), a print, the PIN cracker, Vigenère, four flags on two stations, each tied to a story beat. Lab URLs are placeholders (lab sheets come last). The SecGen box is unbuilt (F9) | minor (F9 with user) | Build, then lab sheet | m01 flag stations |
| 9 | KO resilience | Every person NPC has a fallback (`taskOnKO`, fate globals, a hidden koImmune holder for the bin files). No HaX reaction to knocking out the bystanders (m4) | minor | Two texts | m03/m05 KO texts |
| 10 | Bookends | Briefing with `skipIfGlobal`, a debrief opened by "[Bring me in.]" with reload backstops, `debrief_closed` rolls the card and credits after the last line, `bond_visualiser` | none | as is | lesson 46 |

## Target end-state

The night plays as it does now. Additionally:

- What the player says in m09 (whether Tesseract was right, who they backed on the raid team, whether they thanked Kowalczyk, what became of Sorensen, Tran and Noor) leaves the mission in `exportGlobals`, ready for m10's own loop to pay off.
- The m08 player hears why the archive comes before the bunker, Nightshade's call gives help only he could, and the ledger's plant echoes the mole hunt the player has just been through.
- The end of the night shows what the purge took as well as what was saved, and the music rises from the hour read to the call.
- m05 is "October" wherever it is dated.

## Phased plan

Finding ids refer to `ALIGNMENT_REVIEW_F_R1.md`.

### Phase 1 — carry-over, out and in (A1, m3, m9, m11)

- **Exports.** Add `memo_stance`, `raid_team_answer`, `kowalczyk_reply`, `sorensen_fate`, `tran_outcome`, `noor_told` and `alpha_clip_played` to `exportGlobals` (erb:2357-2359). Drop the `tran_ko` and `sorensen_ko` setters (erb:1344, 1677), or justify them in a comment. Record the new exports in FINALE_ARC §3.4, with the payoff each is meant for in m10.
- **Imports.** Add `m08_accused_vector`, `m08_accused_phantom`, `m08_named_on_evidence` and, if m3's optional line goes in, `m08_triple_agent_first_payment` to the import table (erb:2347-2348) and to `m09_carryover_vars.ink` (Tier 2).
- **Lines.** In `ledger_read`, after line 222, one HaX line for a wrong m08 accusation and one for `named_on_evidence` (text, unvoiced). Rewrite Nightshade's call, lines 22-23, so it gives help only he could give.
- *Files:* scenario.json.erb, m09_carryover_vars.ink, m09_phone_agent0x99.ink, m09_phone_nightshade.ink, FINALE_ARC.md §3.4.
- *Accept:* every new export is in `globalVariables` with a default; every new import's name is in m08's `exportGlobals`; ink compiles; no import is assigned.
- *Verify:* validator (with ink), reopencheck for agent_0x99 and nightshade_phone, dialoguelint.

### Phase 2 — canon (m2, m7)

- "September" → "October" or "in the autumn": torres.ink:24, recruiter.ink:106 (the choice button too), noor.ink:41, phone_agent0x99.ink:276, and the debrief comment at line 216. Update FINALE_ARC rows 61 and 64 and STAGE_8_RULINGS ruling 13's note.
- The coordinate line in the briefing after line 61.
- *Accept:* `grep -i september scenarios/m09_digital_archaeology` returns nothing player-facing.
- *Verify:* dialoguelint; a read-through of the briefing with `m08_tomb_gamma_location_known` both true and false.

### Phase 3 — end of the night and atmosphere (m1, m4, m5, m6)

- Music phases (erb:406-418), as in finding m1.
- KO texts for Old Coyote and Noor, mapped on HaX.
- Retitle `send_the_notice`.
- Paired loss lines under "WHAT THE PURGE TOOK".
- *Accept:* on each route the credits list both what was saved and what was lost; after a reload in each phase the music is the phase's track.
- *Verify:* validator; a short Sonnet browser check on :3001 that reloads during the hour read and after Tesseract's call, and runs the credits once with the legacy files lost and Tran left.

### Phase 4 — hand-offs

- m10 (handwriting "upright" → "sloping", and the payoffs for the new exports) goes to m10's own alignment round.
- m10 here (the briefing wall) goes to the dialogue phase.
- m12 (justifying the overlap warnings) goes to the scenario-design phase.
- F9 (building the SecGen box) stays with the user.

## Canon & lore alignment

- **m08 (before):** consistent. The "seventy-two hours" leave is cut short ("It ran one"); the Helena ticket or airline booking on every m08 branch; Netherton's promise not to name him until it can be proved, kept in the identity scene; the two dead agents named at the pen, as m07's "names withheld" promised. Gaps: the coordinate branch (m2) and the mole-hunt echo (m9).
- **m10 (after):** every m09 export is read. The invitation, "the rest" and the Join prediction all carry across. Conflicts: the handwriting (m8, fix in m10). Not carried: the m09 stances (A1).
- **m05:** the month (m7). Forty-seven candidates, the Recruiter's "next one will cost me more" and the TalentStack chain all match m05's ink.
- **Bible residue:** no Director Cross, no Cabal or institute, no eldritch content. The police make the arrests (debrief.ink:174).

## Open decisions for the user

None of this blocks the plan. Each phase is mission-local and reversible, and the orchestrator can settle it under AGENTS.md "Making judgements without asking". Two things touch other work:

1. **m10 edits** (the handwriting word, payoffs for the new exports). These are m10's files, so m10's own loop should do them, not m09's fixer. The orchestrator decides when.
2. **F9, building the SecGen box,** is already with the user. Phases 1–3 don't depend on it.

## Risks & regressions to guard

- `concludeRequires` stays on the four flag tasks. No new story gate goes on the ending.
- m10's import table (m10 erb:4053) lists twelve m09 names. New exports are harmless until m10 imports them, but renaming any existing export would break m10.
- The music rows: `game_loaded` rows must stay disjoint, or a reload plays two tracks. The debrief's `cutscene` and `victory` rows must still win after `start_debrief`.
- The month change touches a choice button in the Recruiter's voiced call. The button isn't voiced, but check that the `spring` stitch's tags are unchanged (use tagdiff against HEAD).
- Nightshade's call is unvoiced, so rewriting it costs no audio. Keep it under the 25-word phone cap.
- The erb is shared with other stages. Make small, exact edits and re-read before editing.

## Verification plan

After each phase: compile the ink; run the full validator (by the fixer), dialoguelint, reopencheck for the phones touched, `check_door_alignment.py` (no room changes are expected) and a tagdiff against HEAD. After phase 3: one Sonnet browser check on :3001 (keyless) covering a reload in each music phase, a knock-out of the guard, and credits on a losing route. Round 2 of this phase is a fresh reviewer confirming A1 and the minors are closed, with any it raises; round 3 confirms.
