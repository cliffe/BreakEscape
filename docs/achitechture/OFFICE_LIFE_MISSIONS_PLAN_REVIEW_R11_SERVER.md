# Office Life Missions Plan: Round 11 server review (correctness, cheat resistance, state sync)

Read-only adversarial review of `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` (draft 11, 2026-11-14), weighted to sections 4, 6, 7, 8, 9 and 10. Every claim below was checked against the code in the `plan/office-life-missions` worktree. Earlier review files were not read.

## Verdict

Approve. No blockers and no majors. The plan is accurate where it is checkable against the engine, the server and m02's own files. The V5 stem/name/exclusion/ignore lists in section 4 match the current `public/break_escape/js/*.js` tree exactly, in both directions (every emitted office-life literal is classified, and every listed name has a matching literal). The m02 pilot's scenario and ink anchors all verify. The cheat-resistance, sync-count and growth questions in the brief resolve cleanly. One minor wording inconsistency and one nit follow.

Summary of the brief's questions:

- **Can a tampered client reach a story global, item or lock through a pilot element?** No. The pilot's new globals (`heard_night_watch_*`, `night_porter_ko`, `night_domestic_ko`, `it_copier_page_shown`) are read by no required task, objective, `concludeRequires` or lock. The printout is a secret-free `notes` item, not a type any lock or ink check reads. Server pickups are validated against declared scenario objects.
- **Are KO, `heard_` and `onceOnly` writes bounded deltas, and are the counts right?** Yes. 6 declared globals (3 `heard_`, 2 KO, 1 reveal) + 3 `onceOnly` trigger keys = 9 small keys, plus 1 inventory item. Section 6.9's arithmetic and section 7's worst case (64 keys) are correct.
- **Does the slot pickup pass the server checks?** Yes (see Nit 1 for the one caveat).
- **Is the V5 fixture buildable and green?** Yes. The lists are exhaustive and carry no phantom entries.
- **Is V6's scope consistent with the extractor and batch?** Yes for chatter, exchange and call clips; the "bark" claim is wrong (Minor 1).
- **Anything that grows with play time (the `room_entered` break, the coupling)?** No. Those mappings are neither `onceOnly` nor `maxTriggers`, so they never persist (see Minor/evidence below).

## Blockers

None.

## Majors

None.

## Minors

1. **Section 4, V6 row: V6 cannot list bark clips, so "and bark clip per voice" is wrong and contradicts section 10.**
   Evidence: section 4 V6 reads "It lists every chatter, exchange, call and bark clip per voice." `TtsLineExtractor`'s header states the opposite: "Barks and phone conversations are not voiced by the batch" (`app/services/break_escape/tts_line_extractor.rb:13`), with the only exception being voiced phone calls. `each_chatter_line` (`:112-121`) yields chatter pool lines; `entries` cover person-chat ink (exchanges, calls). No path yields eventMapping `bark` fields. Section 10 states this correctly: "EventMapping `bark` lines are voiced live on first play and are outside the extractor, V6 and the batch ... so the merge gate could not see one," and forbids adding barks until V6 and the batch are extended.
   Failure scenario: an implementer building V6 to the section 4 spec either finds there is nothing to extract for barks, or (worse) a future pass trusts section 4 that the merge gate's "0 uncached office-life clips" check covers barks, adds a bark, and ships it unvoiced because the gate never saw it. The binding rule in section 10 and the pilot adding no barks (6.3) prevent harm today, but the V6 definition the skill author implements from misstates the tool's reach.
   Fix: strike "and bark" from the V6 row in section 4 so V6 lists chatter, exchange and call clips only, matching the extractor and section 10.

## Nits

1. **Section 6.6 / 6.5: the server does not gate the printout pickup on its reveal global; the pickup is accepted pre-reveal, which is safe but worth recording.**
   Evidence: `validate_item_collectible` (`app/controllers/break_escape/games_controller.rb:2585` onward) accepts a pickup when the item is a declared scenario object (`find_accessible_item`), is `takeable`, and sits in an unlocked room or container. It does not read `revealOnGlobal` or `outputOf`. `it_copier_page` is a declared `takeable` `notes` object in `it_department`, so a tampered client could POST its pickup before Gary prints it, as soon as IT is unlocked.
   Failure scenario: none that matters. The page carries no secret (6.6), is a `notes` type no lock or ink check reads, and sets only its own engine-owned reveal global, so rule 1 holds and nothing required is reached. IT access still needs the override key or a pick. This confirms the brief's "does the slot pickup pass the server checks" answer: it passes, and passes even pre-reveal, with no cheat consequence.
   Fix: none required. Optionally note in 6.6 that the reveal gate is a client-side visual only, so the pilot's safety rests on the page being secret-free rather than on the server withholding it.

## Counts: B=0 M=0 m=1 n=1
