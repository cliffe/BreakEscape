# Live proof routes (plan 5.4)

Environment note: the brief's `RBENV_VERSION=3.1.6` is not installed here. Use the default rbenv Ruby (2.7.8) and `BUNDLE_PATH=.../BreakEscape/vendor/bundle`.

Tools, all in `tools/phone_calls/`:

- `newgame.sh <scenario> [new-game.rb opts]` makes a game on :3023 and prints `GAME_ID=`.
- `session-start.sh`, `ps.js`: the skill's harness with one addition, `--tts-log FILE` (one JSON line per `POST /tts`: npc_id, text, delivery, status), recorded from before the first page load. Drive with `tools/playtest/cmd.sh <game_id> '<json>'`; `ev.sh <game_id> <snippet.js>` runs a JS snippet in the page.
- `open.sh <game_id> <session_log> <tts_log> [autoBrief]` starts a headless session and bootstraps.
- `dump_tts_keys.rb` writes the key baseline (below). `js/storystate-dump.js` dumps `npc.storyState`.
- Stop sessions with `cmd.sh <id> '{"cmd":"quit"}'`. Stale `tools/playtest/pipes-*` directories make a later `quit` hang: delete them.

Key baseline: `docs/agents/phone_calls/keys_baseline/<scenario>.txt` (sorted extractor keys, 25 scenarios with a phone record) and `_index.txt` (scenario, phone ids, key count). Re-run:
`BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/phone_calls/dump_tts_keys.rb <outdir>` then `diff -r keys_baseline <outdir>`.

## Routes and A0 status

| Beat | Route used | A0 status |
|---|---|---|
| lab SE Dev call | `routes/se_dev.sh <outdir>`: head start `--start-room operations_room` (precondition only), then for real: desk phone, pretext card, Make the call, choices 1/4/5/6, Done, contact list, Dev thread, Close, sync, reload. | Done. `proofs/A0/storystate_after_call.json`, `..._after_reload.json`, `tts.jsonl` (4 Dev lines, no notes), 4 screenshots. `storySeed` differs on every run (random ink seed), so compare `sha256_noseed`; two runs of the unchanged engine gave identical `sha256_noseed` for both NPCs. |
| m09 Recruiter call | `routes/call_probe.sh <outdir> m09_recruiter 120 m09_digital_archaeology --start-room loading_dock --set ledger_read_heard=true --set cage_opened=true` with `AUTOBRIEF=true` | Captured: ring (c) fires 15 s after load, The Recruiter call opens with HaX as co-speaker. `proofs/A0/m09_recruiter*`. The hit-closes-it and `resume` re-ring part was NOT run. |
| m09 HaX `identity_scene` | `--set flag3_submitted=true --set nightshade_file_held=true` (the `room_entered` backstop) | NOT captured. The opening briefing person-chat holds the scene and the 90 s wait ran out. Needs a route that clears the briefing first (or a longer wait). |
| m10 `breach_call` | `--set door_scene_done=true --set flag1_submitted=true --set pair_back=true`, then set `breach_open` after boot | NOT captured. m10's opening briefing was still running. The real setter is the `door_unlocked_by_npc` mapping (`scenario.json.erb:1709`): emit that event once the briefing is closed. |
| m10 `victoria_call` | `flag2_submitted` with `m03_victoria_fate=arrested` (import) | Not attempted. |
| m02 console video call | `object_interacted` on `hospital_recovery_console` in `server_room` with `restore_manifest_obtained=true` | Not attempted. |
| lab_tesseract video call | `relay_opened` (relay terminal, `workshop`) | Not attempted. |
| m10 HaX co-speaker portraits | `Agent HaX:` lines in `m10_tesseract.ink`, `m10_director_netherton.ink` | Not attempted. |

`call_probe.sh` env: `TRIGGER="name=value ..."` sets globals through the game's own proxy after bootstrap (emits `global_variable_changed`); `EMIT='event|{json}'` dispatches an event. Setting a trigger global this way is weaker than the plan's "real trigger" rule; say so when it is used.
