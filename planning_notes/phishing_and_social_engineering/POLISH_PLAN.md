# SE polish plan: lab and awareness episodes

**Set by the user on 2026-10-22.** Every design stage gets the full five cycles, using the skills relevant to a lab, not the SAFETYNET mission ones. TTS is skipped for now.

Each cycle is design → implement → review. A fresh Opus reviewer runs the stage's skill in full and tags each finding blocker, major or minor, with file:line. A fixer acts on the findings, and the same fixer is resumed between cycles. Each cycle is logged as a severity table with an outcome for every finding. If cycles keep improving the work, they may go up to 10. A cycle is a real improvement pass, not only a confirmation.

## Which skills apply

| Stage | Skill | Lab | Awareness episodes |
|---|---|---|---|
| Scenario design | `scenario-design-review` | yes | yes |
| Puzzle chains | `mission-puzzle-chains` | yes: the lab's gating, key order and stage chain. Skip the VM and cumulative-kit parts | lightly: the stage order and kiosk only |
| Dialogue | `npc-dialog-review` | yes: Ruth, Ruth's phone, Fairbairn, Tomasz, Dev, Pierce and Lord mail ink, and the player-facing scenario text | yes: host ink, episode strings and triage copy |
| Playtests | `playtest-scenario`, "The improvement loop" | yes: personas, a reload, regression, then a blind run with student materials only | yes: per episode, plus a facilitated run |
| Room dressing | `mission-room-dressing` | yes | the one training room |
| Lighting | `mission-room-lighting` | yes | the one training room |
| POV backgrounds | `room-pov-background` | redo after dressing and lighting, if those change | the training room |
| Characters | `pixellab-character-pipeline` | Tomasz placeholder, shared keys | hosts (scope to be agreed with the user first) |
| Lab sheet | `mission-lab-sheet` | last, in HacktivityLabSheets | facilitator notes, last |
| Audio | `tts-audio` | SKIPPED (user) | SKIPPED |

**Not used:** `mission-alignment-plan` (HaX hub, VM flags, campaign canon), `mission-secgen-review` (VMs) and SAFETYNET music staging. The lab and the episodes have no VMs and are not part of the spy campaign.

## Order

1. Scenario design, 5 cycles.
2. Puzzle chains, 5 cycles.
3. Dialogue, 5 cycles. Snapshot the ink first, so `tagdiff --old` proves the structure is unchanged. Keep a list of the spoken lines that change.
4. Playtest loop, up to 3 rounds, then the blind run.
5. Room dressing, then lighting, then POV backgrounds, each for 5 cycles. Run the characters in parallel, once the art scope is agreed.
6. Lab sheet and facilitator notes.

The earlier ad hoc dialogue cycles C1–C3 count as background, not as cycles of the formal `npc-dialog-review` skill. The five formal cycles start fresh.

The lab and the awareness episodes run as two parallel tracks. Within a track, stages run in order, because a later stage can undo an earlier one.
