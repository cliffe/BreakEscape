# Stage 8 shipped-canon check A (helper of the first cross reviewer)

Recorded by the orchestrator from the helper's report (finale vs shipped m01–m08 working tree; read-only).

## Finale wrong
1. **PIN cracker stores (major).** FINALE_ARC:129 row 29 and m10 S6 lore_fragments.md:53 (160 units signed for by 0x47 in three years) vs shipped: SAFETYNET has one cracker, ENTROPY's (m04_opening_briefing.ink:284; m03:203; m05:249; m06:117; m07:54; m08:21 signed out to 0x47 since St. Catherine's; m02 erb ~2590). Fix: "Every unit 0x47 signed in for evaluation since St. Catherine's is withdrawn and held: 160 units… None was ever issued to the field."; row 29 to match.
2. **"Spring"/"summer" for m05 (Sept 2026; m07 December).** m09_phone_torres.ink:24, m09_phone_recruiter.ink:105, m09_noor_haddad.ink:41, m09_phone_agent0x99.ink:242, texts/C_texts_and_credits.md:67, comment m09_closing_debrief.ink:214, FINALE_ARC rows 61, 64. Fix: "in the autumn" / "back in September".
3. **"this year"** m09_briefing.ink:95 (m01–m03 were 2024). Fix: drop, or "since Viral Dynamics".
4. **Helena ticket on `m08_nightshade_tidied`** (holdall gone; lining reveal gated `!nightshade_tidied`). m09_briefing.ink:41-42; FINALE_ARC row 116, §1.4. Fix: arm `m08_completed and m08_nightshade_tidied`: "He cleared his locker before we reached it. The airline kept his booking: one way, to Helena."
5. **"He sold them the database."** m10_director_netherton.ink:88 (Nightshade took no money). Fix: "He gave them the database."
6. **m04 wall lines.** m09_briefing.ink:155 "maintenance fault" on quiet+crew_lost (m04: "industrial accident, cause under investigation"); :153 "You told the inquiry half" on partial without crew_lost (no inquiry there). Fix: crew_lost form; "You told the public half…".
7. **m06 seized fund** m09_briefing.ink:182 "gone by the next day" on assets_seized (m06: "You froze it before the payout"). Fix: add arm.
8. **"Nobody died."** m10_tesseract.ink:495 (two to six died at St. Catherine's). Fix: "Nobody died of it."
9. **Reeves on `unnoticed`** (FINALE_ARC row 21): m02 never identified him there. Fix: "G. Reeves. St. Catherine's night security. We never knew."
10. Stale FINALE_ARC text: row 19 "Six died" (manual route only); §1.1 line 16 (shipped ink gives HaX "Sorry about the leave."); §1.4 m08's last line quoted wrongly.

## Shipped-mission gaps (planned for stage 9)
m08 has no exportGlobals (20 imports need the block; names and defaults verified); m02 `reeves_fate` and m07 `teacher_discussed` don't exist yet; the other 38 JSON-only names verified present with matching defaults and writers; all tested string values exist in sources (52 m09 and 99 m10 carryover VARs checked mechanically).

## Harmless
"Same classroom" fits; "a room of twenty, once" tension; holdall/go-bag; Calder Wharf timing; m02's "GHOST PROTOCOL: CLOSED" avoided by the finale's rule; two Elenas.

## Verified consistent
Long list incl. m07 decode word for word; 92,460 = m08 sum; "Not the money. The lesson." (m02, Ghost); m03 Cardiff and £500; m04 Voltage print, Vance Teesside; m05 23 placements, 47 candidates; m06 87%, seven years; m08 Helena ticket, fifteen years; dates; no name clashes for new ids.
