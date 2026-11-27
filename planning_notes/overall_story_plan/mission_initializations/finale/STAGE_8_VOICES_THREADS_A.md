# Stage 8 voices, open threads and the Join credit, A (helper of the first cross reviewer)

Recorded by the orchestrator from the helper's report (read-only). Paths under scenarios/ unless noted.

## Voices: contradictions
1. **Nightshade in custody, m08 never played (major, m09).** m09_briefing.ink:212 HaX "He's in custody and saying nothing." vs :215-216 Netherton "He said you'd know where to find him. He meant the door." (guard `... or not m08_completed`); m10_director_netherton.ink:88, :289 "one word since we took him: 'Door.'"; texts/A_hax_texts.md:54 (A3-21) "in custody saying nothing" on cold start. Fix: drop `or not m08_completed` at :215 (FINALE_ARC row 107's guard), or give never-played players "He has said one word to me. 'Door.'"
2. **Quintero's objection count (minor).** m09_briefing.ink:276 "Noted, again." vs m10_director_netherton.ink:151 "Twice now." Cut "again" in m09 or make m10 "Three times now".
3. **Tesseract's teaching (minor).** m10_tesseract.ink:544 "I taught a room of twenty, once." vs "every year" (m09_alpha_recording.ink:26), "half my field officers". Option: "I taught rooms of twenty, once."

Consistent: Tesseract left seven years ago; Nightshade fifteen years; "eleven years" (WREN, care home, shortlist, Kowalczyk; Malhotra too, by design); Albion "retain" nine years; "Ninety-nine". HaX steady (no exclamations; "Line's open."; confession answers carry exactly). Oddity: "I signed her leave forms." (m10_tesseract.ink:835) — nothing makes HaX Kowalczyk's line manager. Netherton never addresses the player in m09 (m08 and m10 do): low drift. Kowalczyk, Quintero, the Recruiter (matches m05: "Sensible.", lowercase "agent"), Tesseract (avg ~10 words a line, max 22) all consistent.

## Open threads (FINALE_ARC §2): not closed
| # | Thread | Status |
|---|---|---|
| 20 | Exposed-hospital talk-down option (m10) | MISSING: no `m02_exposed_hospital` use in m10_tesseract.ink exchange slots (:342-372) |
| 21, 22 | Reeves' fate; insider asset | MISSING: only in import tables (m09 contract :330-331; m10 :330); rota prop and HaX line; m09 handler sheet |
| 31 | "Not the money. The lesson." (m10) | MISSING |
| 38 | Terry Mott's £500 (m03_guard_bribed) | MISSING (already ruled: stage 9 HaX text) |
| 46 | Static left / left alone | partial: "Static got out of Albion on his own." and bench kit not found |
| 51 | Vance knocked out | MISSING ("I rang Vance. He said no.") |
| 66 | Netherton's "two o'clock" (programme exposed) | MISSING (the story naming 0x00; HaX at the prop) |
| 72 | Fund frozen | partial: Tesseract's "You froze my bank" not found |
| 79 | "The Architect keeps spares" | partial: reserve ledger not found |
| 88 | Mercer arrested / KO'd | MISSING (briefing map line) |
| 90 | Elena turned | partial: nothing says "Netherton decided" |
| 99, 102 | m07 debrief stance; Council | partial: Netherton's "You asked for the numbers. You have them." not found |
| 108 | KO before fate / no coordinate | partial: "the deed becomes a task" in no task or contract |
| 116 | Go-bag ticket to Helena (every player) | partial: m04-safehouse and m06-monitoring branches never hear it |
| 104 | note | `m08_triple_agent_first_payment` imported Tier 1, read by no file |
| 34, 35 | note | arrested line is HaX's wall card, not Netherton's as the row says |

All other non-dropped rows closed (several "closed, deferred" to stage 9 JSON/object text named in the contracts).

## Join credit ruling
"Her desk was empty by morning." (credits_sections.json:166) clashes in continuity (not sequence): R1 A-04 cut the desk image; FINALE_ARC §4.6 Join row (L756) gives HaX's last act as a message with the player's designation, unanswered. Suggested credit keeping contract §5.9's "0x00, never you": "Handler. Her last message to 0x00 went unanswered." Netherton in person at the Citadel "an hour later" (m10_citadel.ink:16-23) vs at the forward post all night: open on "Netherton is on the wall screen from Montana; beside him, HaX's channel is still open. Nobody has spoken on it."
After-ending lines not gated against `joined`: m10_hax_post.ink:23-24, m10_phone_agent0x99.ink:84-85, m10_director_netherton.ink:343-344. Add `ending != "joined"`, or add hax_post to the stage 9 unreachable check.
