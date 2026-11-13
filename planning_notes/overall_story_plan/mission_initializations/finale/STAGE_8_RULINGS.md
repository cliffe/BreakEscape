# Stage 8 rulings (orchestrator, 2026-10-21)

Sources, all in this folder or the missions' `stages/stage_8/`: m09 `REVIEW_R1.md` (m09-R), m10 `REVIEW_R1.md` (m10-R), `STAGE_8_SEAM_A.md` (SA), `STAGE_8_SEAM_REVIEW.md` (SR), `STAGE_8_VOICES_THREADS_A.md` (VT), `STAGE_8_BIBLE_PASS_A.md` (BA), `STAGE_8_BIBLE_PASS.md` (BP), `STAGE_8_CHARACTER_CANON_A.md` (CC), `STAGE_8_SHIPPED_CANON_A.md` (SC), `STAGE_8_CROSS_REVIEW.md` (CR).

No finale audio has been generated, so voiced-line rewrites cost nothing yet. Every fix keeps the standing rules: `&&` only, no printed variables in voiced lines, phone lines ≤25 words, UK English, the naming rule.

## General rule
Accept every finding in those files, with the fix the finding proposes, except where a ruling below says otherwise. Where a fix proves wrong in the file, record why. Where two files give different fixes for the same fault, the ruling below picks; if none does, take the one that changes fewer shipped strings.

## Specific rulings
1. **Default bin (m09-R M-02, SA M1, SA m4):** option (a): Sorensen hands over the file nearest her (`#give_item:notes:derek_file`, one line, no choice) on the hatch route when the cage opens with no bin chosen, and on "[Walk past her.]" on Victoria's route. The `cage_opened` default mapping gains `!bin_chosen`.
2. **Shredder (m09-R M-03):** reword the line; no engine change. The shredder may stop being fed, not stop sounding.
3. **HaX's hubs:** m09 per m09-R M-01; m10 adds an asked-once guard to "[The hatch?]" (m10-R). Both ≤10 on the reviewers' seeds.
4. **Triple agent with m09 unplayed (SA M2):** the FINALE_ARC §3 rule applies (a penalising value equal to the default needs the source's `completed`). Gate m10's "not shown" obstacle version on `m09_completed`; an m08 triple-agent save without m09 gets the neutral version (no tripwire penalty for a choice never offered).
5. **Tomb Alpha answer (SR major 2, SA m1):** m09 exports `alpha_annotations_read` (twelfth export); m10 gates the Tomb Alpha lines on it as well as `deck_pulled == "alpha_tapes"`.
6. **Helena's plans (SR major 1):** one HaX line at Nightshade's table on `m09_completed` that sets Tesseract's own defence list (m09 flag 4) apart from the 1962 drawings.
7. **PIN crackers (BP F-01, SC 1):** use SC 1's wording ("signed in for evaluation since St. Catherine's … None was ever issued to the field"), keeping the bench, Gallatin, the four batches and the WREN cloner.
8. **Kowalczyk's credit (CC 1, SR major 3):** "Breaching lead, Task Force Null. Eleven years in SAFETYNET. …" on all four clauses.
9. **Join credit (CR, VT):** provisional "Handler. Her last message to 0x00 went unanswered." (taste call listed for the user). Citadel scene opens with Netherton on the wall screen from Montana and HaX's channel open beside him. After-ending lines gated `ending != "joined"`.
10. **Nightshade in custody, m08 unplayed (VT 1):** drop `or not m08_completed` at m09_briefing.ink:215.
11. **Quintero's objections (VT 2):** cut "again" in m09 ("Noted."); m10 keeps "Twice now".
12. **Tesseract's teaching (VT 3, CC, SC):** "I taught rooms of twenty, once."
13. **Dates (SC 2, 3):** m05 events are "in the autumn" / "back in September"; drop "this year" at m09_briefing.ink:95.
14. **Open threads (VT, SR):** ink lines for rows 31 ("Not the money. The lesson." in Tesseract's case), 72 ("You froze my bank"), 88 (Mercer, Netherton's `briefing_team`), 90 (Elena, `cut_0`), 99/102 (Netherton, `briefing_stakes`), 116 (m09 briefing, with SC 4's tidied arm). Row 104: a one-line variant in Nightshade's unshown branch on `m08_triple_agent_first_payment` (keeps the import). Row 79: dropped (the secured reserve cell pays it off). Rows 21–22, 46, 51, 66 and 38 (Terry Mott): HaX barks or texts, written now in the texts files below.
15. **m10 texts file (m10-R M-5):** create `scenarios/m10_full_disclosure/texts/BARKS_AND_TEXTS.md` in m09's format, from m10-R §3's inventory plus every bark/text named above (incl. Ghost's 06:00 text on the selling branches, HaX's texts after `executed` and on Join, `m03_guard_bribed`). m09's texts files take its own new barks.
16. **06:00 clock (m10-R M-3):** the docs and FINALE_ARC §4.2, §21 say the clock steps to t0600 on HaX's rest (`six_done`), not at the scene's open.
17. **Unread m09 imports:** drop `m04_voltage_escaped` and `m07_team_redirected` (m09 → 42 + 8 `completed`).
18. **Naming rule (CC 2):** FINALE_ARC's rule is scoped to SAFETYNET and Tesseract in m10; the m09 Recruiter's "Agent 0x00" / "agent" stands.
19. **Netherton's contractions (SR minor 5):** full forms on weighted lines in m09 and m10.
20. **Asset list (m09-R M-04):** stage 9's first step is one list per mission of art, room maps, backgrounds, voice-bible entries and the narrator voice block, with placeholders. No image generation until the user approves scope.
21. **Bible notes (BA, BP, CC):** collected into `BIBLE_NOTES_FOR_LATER.md` in this folder by the arc-keeper. The bible itself is not edited.

## VM questions
m09-R and m10-R "For the user" VM items go first to an opus48 agent with the VM plan; it answers what the plan settles and lists the rest for the user. It also rewrites the `// VM-STEER` comments in `m09_phone_agent0x99.ink` to story level ("flag 2 hint; checked against the VM plan"), since every Opus agent reads that file.

## Owners
- m09 fixer: m09 ink, texts, CONTRACT.md, m09 stage docs.
- m10 fixer: m10 ink, credits_sections.json, new texts file, CONTRACT.md, m10 stage docs.
- Arc-keeper: FINALE_ARC.md (incl. §3 counts, rows named above, §21 handover), BIBLE_NOTES_FOR_LATER.md.
