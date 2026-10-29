# m01 video trial: log

Plan: `docs/video/M01_TRIAL_PLAN.md`. Newest entries at the bottom.

## 2026-10-29

- Brief gathered on a review page (claude.ai artifact 9ewiCXuTDXZ88YU43EHzpE); user corrections recorded in plan section 2.
- Reference trailer analysed (scene cuts at 5, 9.5, 11.5 ... 71.9 s; contact sheet in the session scratchpad).
- PulseAudio 16.1 installed from apt. Smoke capture: Xvfb :99 + null sink + ffmpeg x11grab/pulse, 3 s, video and audio present (tone peak -18 dB). Lesson: put `-t` on the output, not the x11grab input, or the pulse input never ends.
- Plan review R1 (Sonnet): 3 blocker, 11 major, 9 minor. All fixed or withdrawn with reason (plan section 14). One round only: spike, factual blockers checked by the orchestrator.
- Decisions (orchestrator, overrule freely): Break Escape title as a Press Start 2P wordmark until real logo art exists; game's own subtitle bar used, no second subtitle layer; 30 fps capture by default; crossfades allowed in the slideshow only.
- Started: stage 0 (Sonnet, capture tooling) and stage 1 (Haiku, scout).
- Stage 1 scout (Haiku) first pass: 8 of 9 shot types located (`docs/video/scout/m01_scout.md`). No guard sight cone in m01 (no `los` config); VM launcher needs a SecGen VM, so the drop-site flag station stands in. 32 lines checked offline; live rerun requested.
- Stage 0 (Sonnet) tooling built in `tools/video/capture/` (env-up/down, launch, record-take, check-take). Stub-page results: 30 fps veryfast and 60 fps ultrafast clean; audio leads picture by 13-85 ms, constant part corrected in the trim. Chromium as root needs `--no-sandbox`; X screen is 1928x1088 so a 1920x1080 window isn't shrunk by 1 px.
- Container setup (this container only): the dev database had never been provisioned. Weakening pg_hba to trust was refused by the safety check, rightly. Instead: Postgres role `root` (LOGIN CREATEDB, peer auth unchanged), `BE_DB_USER=root`, `bin/rails app:db:prepare` (120 missions). A cloud session needs these exported for every Rails command: `LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root`.
- Tooling bugs found (not fixed, outside the trial's scope): `tools/playtest/new-game.rb:162` creates a DemoUser with `username:`, but the column is `handle`, so it fails on an empty database; `tools/playtest/start-keyless-server.sh` uses `bundle exec rails`, which isn't found here (`bin/rails server` works).
- Scout live rerun: 32 lines POSTed to the real `/tts` endpoint on :3001; 27 play (2.0-8.8 s), 5 are 503 (all Agent HaX phone lines: no cached clips for agent_0x99 phone text). Matches the offline prediction exactly.
- Decision (orchestrator): Derek's shot uses a finale line, as the reference trailer did and the user praised. Primary `derek_5` "Murder? No. Think of it as... forced education." (7.1 s, trim to the line); alternate `derek_6` "Entropy is inevitable. Trust is a lie..." which pairs with a "Hold back the Entropy" card. Showing Derek as the antagonist matches the existing trailer; no culprit-naming text, codes or ending screens on screen. Entry state `--start-room break_room --set entropy_reveal_read=true`, to be checked in the browser at take time.
- Decision: no guard sight cone in m01, so the montage drops that beat (it can come from a later mission's trailer); HaX briefing line must come from the 3 briefing lines that play, not phone lines.
