# Finale (m09, m10): decisions for the user

Answered items move to `scenarios/FINALE_DEV_LOG.md` (F1–F8 answered 2026-10-20).



## F9. Build and check the SecGen drafts (when convenient)

Files in SecGen (uncommitted): `scenarios/break_escape/safetynet/m09_digital_archaeology.xml`, `m10_full_disclosure.xml`. Checklist for the build: `planning_notes/overall_story_plan/mission_initializations/finale/SECGEN_DRAFT_NOTES.md` (pre-login page empty on Tomb Beta; m10 flag 2 visible only after flag 1; root SSH refused on the two escape boxes; two accounts on the release host). Not blocking the design stages. A Haiku agent can run `review-secgen-module` on the modules listed in the notes first if you want.

## F21. Optional engine fix: ink `#add_note` builds a broken note

`NPCGameBridge.addNote` (npc-game-bridge.js ~L493-515) creates a note with `content` but no `text` or `id`; the notepad then throws on `text.match` (notes-minigame.js ~L348, ~L416, ~L444) and every such note shares an empty id in state sync. No shipped mission uses the tag, so nothing is broken today; m09 now uses `#give_item` of a notes item instead. Recommended: approve a small fix with a test, so the tag works if anyone uses it.
