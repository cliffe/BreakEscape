# Review A7 docs, round 1: outcomes

2026-11-12. Docs only. Files: `README_scenario_design.md`, `README_ink_best_practices.md`, `docs/agents/phone_calls/A7_DOCS_NOTES.md`.

| Finding | Outcome |
|---|---|
| M1 voicemail hold | Fixed in both READMEs. Describes behaviour only (waits while the caller's thread is open, a reload delivers it quietly), not the save format, because A6 is changing it. |
| M2 `#ending_check` in a call | Fixed: new paragraph in "Endings and calls" and the ink bring-in example reordered with the explanation. Example compiled. |
| m1 Call button refresh | Fixed (`call.when` row). |
| m2 caption sources | Fixed, using the review text (checked against `phone-ringer-dom.js:108,144,498`). |
| m3 Ruth | Fixed ("lab Dev"). |
| m4 cut-short call | Fixed in the missed-call list and the reload paragraph. |
| m5 `voiced`, `callLabel` rows | Added to both tables. |
| m6 `targetKnot` rule | Fixed. |
| m7 mode table | Fixed. |
| m8 voicemail example | `VAR heard_vm = false` added; compiled. |
| m9 call-knot example | Added an `extract_call` knot and a sentence saying which rings and which is dialled; compiled. |
| n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12 | All done. n6 checked against `_placeCallFromTags` (`phone-chat-minigame.js:1460-1479`). |
| n13 | Not changed, as instructed. For the orchestrator: the engine dials `#place_call:<knot>` for a pending callback's knot with no `call` entry, but the validator errors on that tag. The validator could accept a ring knot with `onMissed: "callback"` if a mission wants it. |

Ink examples touched (call-knot, voicemail, bring-in) were compiled with `bin/inklecate` in the scratchpad. No JSON example was touched.
