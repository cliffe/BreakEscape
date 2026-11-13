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

The A0 baseline was captured from a detached checkout of 8a1ee3fbc (the commit before A1), served on :3023 and removed afterwards. Run the proof tools from there with `NODE_PATH=<repo>/node_modules` set (the harness needs `playwright`; from a checkout outside the repo tree it is not found otherwise).

Two facts about the bridge that cost time:

- Setting a global through `window.gameState.globalVariables[x] = v` (the `TRIGGER` option) does **not** emit `global_variable_changed:x`; it only changes the value. Mappings that listen to that event need `EMIT='global_variable_changed:x|{"name":"x","value":true}'` instead. Only `room_entered` and `game_loaded` backstops fire from a value that was already set.
- `--set` on `new-game.rb` is overwritten for imported globals (`m03_victoria_fate`); use `--imports=<file.json>`.
- m09 and m10 open with a briefing person-chat. `AUTOBRIEF=true` plays it out (the TTS log then also lists the briefing lines); a mapped call opens after it. `call_probe.sh` options added in A0: `UNTIL_TTS='regex'` (stop on a `/tts` request, for calls that finish before the poll sees them) and `SHOT_DELAY` (seconds before the screenshot).
- With no Gemini key every uncached line returns 503 and the call advances at once, so a mid-call screenshot is luck; the `/tts` request list is the evidence.

| Beat | Route used | A0 status |
|---|---|---|
| lab SE Dev call | `routes/se_dev.sh <outdir>`: head start `--start-room operations_room` (precondition only), then for real: desk phone, pretext card, Make the call, choices 1/4/5/6, Done, contact list, Dev thread, Close, sync, reload. | Done. `proofs/A0/storystate_after_call.json`, `..._after_reload.json`, `tts.jsonl` (4 Dev lines, no notes), 4 screenshots. `storySeed` differs on every run, so compare `sha256_noseed`. |
| m09 Recruiter call | `routes/call_probe.sh <outdir> m09_recruiter 120 m09_digital_archaeology --start-room loading_dock --set ledger_read_heard=true --set cage_opened=true` with `AUTOBRIEF=true` (ring c fires on load) | Done. `proofs/A0/m09_recruiter*`. |
| m09 Recruiter hit and `resume` | `routes/m09_recruiter_hit_resume.sh <outdir>`: ring, then `window.playerHealth.damage(10)`, then the call's Close button, sync, reload, resume | **Not reached: no hit during a call was tested.** The call rang and ran to its end before `damage(10)` ran (`A0/m09_hit_tts.jsonl`: the whole Recruiter call and HaX's follow-up played first). After the hit `m09_hit_2_after_hit.png` shows HaX's text thread with two choices, no call screen and no ON CALL bar, and `m09_hit_3_rering.png` shows "Answer the Recruiter's offer" struck through, so the re-ring conditions (`!recruiter_call_started` and the later ones) were already false after the reload. So "damage leaves the call open" and "no re-ring" are not established. A2c must capture a real mid-call baseline from the pre-A2c engine before it changes anything (HANDOVER_A0_A1.md, "A2c: start here"). |
| m09 HaX `identity_scene` | head start `--start-room loading_dock --set nightshade_file_held=true --set flag3_submitted=true`, AUTOBRIEF, then `EMIT='room_entered\|{"roomId":"loading_dock"}'` (the `:335` backstop) | Done by request list: `m09_identity_scene_tts.jsonl` holds the whole scene (HaX lines) and the Nightshade/Torres lines that follow. The poll missed the open call (it ran to its end first), so the screenshot shows the map. |
| m10 `breach_call` | `--set door_scene_done=true --set flag1_submitted=true --set pair_back=true`, AUTOBRIEF, then `EMIT='door_unlocked_by_npc\|{"roomId":"blast_tunnel","npcId":"agent_0x99"}'` (the mapping at `scenario.json.erb:1709` that sets `breach_open`, which then rings the call) | Done by request list: `m10_breach_call_tts.jsonl` (`director_netherton` "Breach. Go.", `nightshade_table` "Manual.", `agent_0x99` "He's on the crank...", then Arakawa's lines). Screenshot is the map after the call. |
| m10 `victoria_call` | `--imports=<{"m03_victoria_fate":"arrested"}>`, `--set mercer_fighting=false`, AUTOBRIEF, then `EMIT global_variable_changed:flag2_submitted` | Done: `m10_victoria_call.png` (call screen, ON CALL 0:31, subtitle prefix "VICTORIA STERLING:"), `m10_victoria_call_tts.jsonl` (2 lines, `victoria_line`, 503 keyless). |
| m02 console video call | `--start-room server_room --set restore_manifest_obtained=true`, AUTOBRIEF, `EMIT object_interacted {"objectType":"backup_recovery"}` | Done: `m02_console_video_call.png` (person-chat as video call, "GHOST"), tts list (`ghost` "Before you touch that console -- look up."). |
| lab_tesseract video call | `--start-room workshop`, AUTOBRIEF, `EMIT global_variable_changed:relay_opened` | Done: `lab_tesseract_offer_call.png` ("KEYHOLDER"), tts list. |
| m10 HaX co-speaker portraits | New m10 game, no autoBrief, click choice 2 ("Go on") through Netherton's briefing until the first `hax_post` line | Done: `m10_hax_portrait.png` (portrait, name "Agent HaX", subtitle "Our former chief strategist..."); `/tts` request for that line uses `npc_id` `hax_post` (a separate record from `agent_0x99`), see `m10_hax_portrait_tts.jsonl`. Pre-A1 baseline for the M2 rename to `agent_0x99:`. |

`call_probe.sh` env: `TRIGGER="name=value ..."` sets globals through the game's own proxy after bootstrap. It does **not** emit `global_variable_changed` (see "Two facts" above); `EMIT='event|{json}'` dispatches an event, which is how to fire a mapping that listens for a global change. Setting a trigger global this way is weaker than the plan's "real trigger" rule; say so when it is used.

**Warning (engine R5):** `ENGINE_SWEEP_R1/r1_live.sh` loads the R1 `beat_probe.js`, which calls `beat()` without `selfClose`, so every terminal call end looks like a hang-up. For m07 beat checks use `ENGINE_SWEEP_R1/r1_live_r2probe.sh` or `ENGINE_SWEEP_R5/r5_live.sh`.
