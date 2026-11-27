# User decisions, 2026-11-12

Answers to the access model form (https://claude.ai/artifact/PanecaCQBMChKnqsDGa98a), questions q79 to q87. Each line: question, answer, what follows.

- q79 Can the player react to Friendface posts, or only staff? Staff only for now. Matches the reactions plan (section 2.2); player reactions stay in the ideas backlog as a possible rapport lever.
- q80 Which reactions? Like, laugh, sad, angry, in pixel art, displayed at 2x or more as usual. The 16x16 icons render at 32px (or another whole multiple of 16 that is at least 32), never at 16px.
- q81 May the build draw the four icons in the free pixel editor? Yes, drawn by hand; the user approves them before the reactions branch merges.
- q82 Should planting an implant count towards an objective on that PC? No, the existing mappings are enough for now.
- q83 Tidy the access and office-life fields now? Yes, consolidate now and make the schema clear. Old names are kept as aliases only where a deployed game uses them: m01, sis01, sis02 and lab_social_engineering. Every other scenario is updated to the new names, with no alias.
- q84 How far should the format be tightened? Add `formatVersion` and the upgrader now; close the core kinds (rooms, objects, NPCs) later.
- q85 m08's door PIN is sent to the browser at game start: accept it as best effort. The hardening plan's option (a): an acknowledged clue, so step 3b (server-held globals) is dropped.
- q86 Fix or delete basic_mission and vm_free_mission? Delete both. Done by moving the folders into the main checkout's gitignored `tmp/delete/`, never by a delete command; their eight known-failures entries and sign-off sections went with them.
- q87 Can a tampered browser skip the phishing steps to get the phished password? Accept it as best effort for now (sync deltas 6b M1). The backlog entry to record the evidence server-side stays.
