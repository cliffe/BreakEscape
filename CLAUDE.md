# Break Escape

Read `AGENTS.md` before orchestrating multi-step work or tasking subagents: it covers the mission loop, model choice, what to decide without asking, standing user rules, verification and housekeeping.

Current pass: `docs/agents/PASS4_BRIEF.md`, log `scenarios/PASS4_EDITORIAL_LOG.md`, resume note `docs/agents/RESUME.md`. Ideas not yet scheduled: `docs/IDEAS_BACKLOG.md`.

Sprite hand edits (walk atlases) go in `tools/pixellab_overrides/`, never straight onto `assets/characters/<key>.png`: re-imports rebuild the atlas from PixelLab plus overrides. `tools/pixellab_drift_audit.py` finds untracked edits (`--adopt` saves them); `pixellab_pipeline.py import` refuses to overwrite an atlas that has any.
