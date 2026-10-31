# Stage 8 seam check A (helper of the first cross reviewer)

Recorded by the orchestrator from the helper's report (read-only; checked against contracts, ink, m10 stage 6 lore; no scenario.json.erb yet). Fuller pass: STAGE_8_SEAM_REVIEW.md.

**Headline:** all 11 m09 exports match by name, type and default across m09 CONTRACT §5.1, m10 CONTRACT §2.2 (L337) and m10_carryover_vars.ink L114-124; m10 reads no other m09_* name; every value is handled or deliberately defaulted. No blocker in shipped ink.

## Findings
- **M1 (major, m09):** m09 CONTRACT.md:323 sets `cage_bin = derek_file` on `cage_opened` with no condition; FA §3.4 L500 and m09 CONTRACT.md:419 say only when no bin was picked. On the hatch route a pick happens before the cage opens (m09_sorensen_hatch.ink:85-103), so the default would overwrite it. Fix: add `!bin_chosen` to the §5.1 row.
- **M2 (major / ruling, FINALE_ARC then m10):** an m08 triple-agent save with m09 unplayed falls on the "not shown" branch (m10_carryover_vars.ink:322-324, :360): obstacle version for a choice never offered. No false line. State it in FA §3's never-played row, or gate on `m09_completed`.
- **M3 (major, m10 CONTRACT §3.3):** mappings assumed but not listed: (1) `whodunit_live = false` on `taken` and on `double_crossed` (only L95, L370); without it a `taken` save enters `wren_beat` (tesseract :54). (2) `clue_alibi` set at the aside when the shortlist replaces clue 2 (L386; FA §4.4 L696); netherton :227-228 writes nothing. (3) hide the `kowalczyk_*` field copies on `double_crossed`, show the van copy on `taken` (RL §2, not §3.3 L528); else she says "Kit check" at the post.
- **M4 (major, FINALE_ARC §4.0 / m10 contract):** `kowalczyk_cracker` description "handed it to you before Helena" (FA L593) is wrong on a cold start (she hands it over at m10's briefing, netherton :183-190). Add a cold-start variant to the contract.
- **m1 (m10):** tesseract :601 "Your Tomb Alpha notes say carry it…" and phone :573 gated only on `deck_pulled == "alpha_tapes"`; m09's clip is optional and has no "carry it". Reword to stand alone, or accept.
- **m2 (FINALE_ARC):** FA §3.4 L497 calls the `afterwards` payoff "her briefing line"; it's the optional "[How are you?]" answer (phone :161), retiring at flag 2.
- **m3 (FINALE_ARC):** FA §3.2 L441 `told` credit wording differs from S6 lore_fragments.md:852 ("Told their handler about the Recruiter's call."); FA to match.
- **m4 (m10/m09):** default `cage_bin = derek_file` even if the file was never held; tesseract :345 "You priced Derek before anyone hired him" doesn't guard. Accept or export a held flag.
- **m5 (m10 contract):** CONTRACT.md:190 order `taken` then `double_crossed`; ink checks the reverse. Doc only.

## Cold-start sweep
Every m10 reference to an m09 event is gated on an m09 import or `m09_completed`, or worded to work cold (netherton :67, :97-112, :132-135, :150, :183, :211-215; Arakawa :65; Kowalczyk :71, :242; HaX post :32/:38; tesseract :177-181, :503, :509, :607; 06:00 and hearing). m10 imports m01–m08 directly.
