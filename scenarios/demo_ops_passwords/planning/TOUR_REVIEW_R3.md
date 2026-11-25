# demo_ops_passwords: tour review R3 (dialogue delta)

Delta: commit `8fcc6bdc8` (five lines in `ink/ama_owusu.ink`, JSON rebuilt, five rows in `planning/VOICED_LINES.md`) against `TOUR_REVIEW_R2.md`.

**Verdict: signed off.** 0 blockers, 0 majors, 0 minors.

## Closed

| R2 finding | Line | Result |
|---|---|---|
| D-M1 false domain rule | `:502` "A local account isn't part of the domain, so only the desks it was made on know it." | Closed. True for every route, consistent with `:318`, `:568` and `:189` (no claim that a domain account works everywhere). 16 words. |
| D-m1 "Both overrides" | `:496` "Each override left a row..." | Closed. True with one or two overrides. |
| D-m2 remembers-who-signed-in | `:490` second sentence dropped | Closed. |
| D-m2 weak falls at once | `:514` "A remembered record cracks like any other." | Closed. |
| D-m3 dead hedge | `:215` "Ask me to send them for coffee, then type the name and password under Other user." | Closed. 16 words. |

## Checks

- Compiled `ama_owusu.json` carries all new strings; no "Both overrides" or "Sign out first if" left in ink, JSON or `VOICED_LINES.md`.
- `VOICED_LINES.md` rows 32, 69 to 73 match the ink exactly; 300 rows.
- Voicing rules (tts-audio): no variables, no stage directions, no colon, semicolon or dash; every changed line is under 30 words; Ama only.
- Not re-run: compile, validator (fixer reports 7/7 and 0 errors; the diff is five prose lines). I-m1 (live check of remaining barks) stays with the 4.2 playthrough, not a voicing blocker.
