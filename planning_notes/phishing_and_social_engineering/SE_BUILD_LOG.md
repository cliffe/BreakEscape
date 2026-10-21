# Build log: social-engineering systems

Brief: `docs/agents/SE_BUILD_BRIEF.md`. Plan: `IMPLEMENTATION_PLAN.md`. Artefacts: `build_log/`.

## Resume

Status (2026-10-21): Phase 0 wave 1 started (P0-A, P0-A1 to P0-A9, P0-B, P0-P); slice art batch 1 started.

## User instructions for this build (2026-10-21)

- Influence-bar visibility configurable per NPC: done as README decision AA (`835e4cea`).
- Commit at the end of each design-implement-review iteration (standing authority for this build).
- First batch of art may be generated with Gemini and PixelLab without asking per image; ask before any
  later round of improvements. Pixel art is made at its final size, never rescaled.
- Hacktivity changes go to main, but check with the user before making any Hacktivity change. Other
  repos may be changed now.
- Questions: the question tool when no context is needed; otherwise a batched `.md` with images and
  context.

## Decisions taken without asking

| Date | Decision | Reason |
|------|----------|--------|
| 2026-10-21 | lab_scanning and sis01 R3 checks run as their own packet, P0-A9 | keeps each mission packet to one mission |
| 2026-10-21 | First art batch = the new Slice rows of ASSETS (OBJ1, OBJ2, NPC5, UI1 to UI7) | "first batch" read as the first build slice |

## Review rounds

(none yet)
