# Finale (m09, m10): decisions for the user

Answered items move to `scenarios/FINALE_DEV_LOG.md` (F1–F8 answered 2026-10-20).



## F9. Build and check the SecGen drafts (when convenient)

Files in SecGen (uncommitted): `scenarios/break_escape/safetynet/m09_digital_archaeology.xml`, `m10_full_disclosure.xml`. Checklist for the build: `planning_notes/overall_story_plan/mission_initializations/finale/SECGEN_DRAFT_NOTES.md` (pre-login page empty on Tomb Beta; m10 flag 2 visible only after flag 1; root SSH refused on the two escape boxes; two accounts on the release host). Not blocking the design stages. A Haiku agent can run `review-secgen-module` on the modules listed in the notes first if you want.

## F20. How much of HaX's phone thread gets voiced (TTS cost)

The voiced-calls feature works per contact: marking any of HaX's calls `voiced` makes the audio batch voice her whole phone thread (hub topics, status answers, texts), not just the call. m10 estimate: ~100 forced-call lines become ~320; m09 similar in proportion. Options:
- **A (recommended):** a small change so the batch voices only the knots a voiced call opens (the extractor follows the call's knot, not the whole story). Keeps the cost to the calls themselves. Engine/tooling change.
- B: voice HaX's whole thread (most immersive; highest cost).
- C: leave HaX's calls as text; voice only the other callers (Recruiter, Ghost, arrested Victoria, Tesseract's call stays one-sided text).
