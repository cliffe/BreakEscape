# test_access_doors: Haiku regression run, 2026-11-09

Scripted run of PLAYTEST.md (beats D1 to D5 with a reload after D4) on the keyless server, game 7, headless. Run after access model step 7.

| Beat | Result | Server record after the beat |
|---|---|---|
| D1 fallback (visitor card) | PASS | serverClones 0 |
| D2 card copied in conversation (Dana), door and cabinet open | PASS | serverClones 1: FIN-DANA-01 from npc dana |
| D3 card copied from a held keycard (Ian's spare) | PASS | serverClones 2: IT-IAN-01 from object ian_spare_badge |
| D4 ID-only copy (Priya): CCTV opens, evidence store refuses "Reader requires full authentication" | PASS | serverClones 3 (SEC-PRIYA-01 UID-only) |
| Reload after D4: cards, rooms and tasks kept, evidence store still refuses | PASS | unchanged |
| D5 shared card (Gary) opens the plant room | PASS | serverClones 4: PLANT-SHARED-01 from npc gary |

Leak check: no sign-in details or locked contents in any of the 86 responses the browser received. All 5 tasks complete.

Observations (minor, not defects):
- The unlocked finance cabinet opens its contents window, which blocks movement until closed. PLAYTEST.md now says to close it.
- One conversation with Ian needed a second try after moving closer.
