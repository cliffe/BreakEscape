# m01 video trial: log

Plan: `docs/video/M01_TRIAL_PLAN.md`. Newest entries at the bottom.

## 2026-10-29

- Brief gathered on a review page (claude.ai artifact 9ewiCXuTDXZ88YU43EHzpE); user corrections recorded in plan section 2.
- Reference trailer analysed (scene cuts at 5, 9.5, 11.5 ... 71.9 s; contact sheet in the session scratchpad).
- PulseAudio 16.1 installed from apt. Smoke capture: Xvfb :99 + null sink + ffmpeg x11grab/pulse, 3 s, video and audio present (tone peak -18 dB). Lesson: put `-t` on the output, not the x11grab input, or the pulse input never ends.
- Plan review R1 (Sonnet): 3 blocker, 11 major, 9 minor. All fixed or withdrawn with reason (plan section 14). One round only: spike, factual blockers checked by the orchestrator.
- Decisions (orchestrator, overrule freely): Break Escape title as a Press Start 2P wordmark until real logo art exists; game's own subtitle bar used, no second subtitle layer; 30 fps capture by default; crossfades allowed in the slideshow only.
- Started: stage 0 (Sonnet, capture tooling) and stage 1 (Haiku, scout).
