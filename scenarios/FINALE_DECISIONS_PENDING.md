# Finale (m09, m10): decisions for the user

Answered items move to `scenarios/FINALE_DEV_LOG.md` (F1–F8 answered 2026-10-20).



## F9. Build and check the SecGen drafts (when convenient)

Files in SecGen (uncommitted): `scenarios/break_escape/safetynet/m09_digital_archaeology.xml`, `m10_full_disclosure.xml`. Checklist for the build: `planning_notes/overall_story_plan/mission_initializations/finale/SECGEN_DRAFT_NOTES.md` (pre-login page empty on Tomb Beta; m10 flag 2 visible only after flag 1; root SSH refused on the two escape boxes; two accounts on the release host). Not blocking the design stages. A Haiku agent can run `review-secgen-module` on the modules listed in the notes first if you want.

When you build m09 (from the opus48 VM wiring, 2026-10-21): confirm the built hostnames are `catalogue_server` and `tomb_beta_server` (Kali `attack_vm`); each machine numbers its flags from 1 (story flag 3 = `tomb_beta_server-flag1`); note the catalogue server's service account name; flags 1–3 submit at the reading-room drop terminal, flag 4 at the tape-room station, both launchers opening the one attack VM. The early peek at Tomb Beta's credential is accepted (your answer); no network restriction needed.
