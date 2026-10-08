# TTS move to Gemini 3.8 (started 2026-10-08)

## Decisions (user)
- Model: `gemini-3.8-flash-tts` via the Interactions API (`/v1beta/interactions`). Style goes in a `speech_metadata` annotation, because 3.8 speaks the input text verbatim. PCM (`audio/l16`, 24 kHz) is requested so the ffmpeg step is unchanged.
- Agent HaX's stock style ending ("Speak quickly with urgency, as if time is short" and its variants) is replaced with: "A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice." Applied to m01 only so far. m02–m06 keep the old wording until each is regenerated, because a changed style is a new cache key and would leave those lines with no clip.
- Regenerate **m01 only** for now, then the user listens and decides on the rest.
- In-progress games must hear no gap or delay from the switch.
- `tts_cache/` is no longer gitignored (only temp, lock, corrupt-manifest files and the test folders are), so clips and manifests are committed like any file. Reason: generation isn't deterministic, so committing ships the takes that were reviewed.
- Never-committed 2.5 clips (~970, 53 MB): commit only those matching a current line; leave orphans from rewritten lines out of history. Result: 293 current (13 MB, to commit), 442 orphans moved to `~/tts_orphans_2026-10/` (outside the repo, with the matcher's lists and script in `_lists/`). 82 of the orphans are unchanged text under an edited voice; user chose to treat them as orphans too.
- Already-committed clips for m02 (26/456 current) and sis01 (0/567) are mostly for older text or voices. Left in place: games saved on an older version may use them. Those missions' current lines are largely unvoiced in the repo, so they generate live.
- The text-validation fragment gap (InkTextValidator accepts any text containing a 10+ character story fragment): user said ignore for now.

## How the cache works now
- Key: MD5 of `normalised text | voice | style | language | model` (`TtsService#compute_cache_key`). Clips from 2.5 were keyed without the model; `TtsService#legacy_cached_path` finds them.
- Each scenario folder gets a `manifest.json`: key → npc, text, voice, style, language, model, date.
- The endpoint (`GamesController#tts`) takes the voice from the scenario as it is now (`Mission#current_voice_configs`), falling back to the game's saved `scenario_data`. Order: current-model clip, previous-model clip (current voice, then saved voice), then live generation.
- The 2.5 clips stay on disk until every mission has been regenerated.

## Files
`app/services/break_escape/tts_service.rb`, `app/services/break_escape/tts_batch_processor.rb`, `app/models/break_escape/mission.rb` (`current_voice_configs`), `app/controllers/break_escape/games_controller.rb` (`tts`, `legacy_tts_clip`), `test/controllers/break_escape/tts_controller_test.rb`.

## Committing a regenerated mission
- `tts_cache/` is gitignored, so clips and `manifest.json` are added with `git add -f`.
- The mission's style edits and its new clips go in **one commit**, after its batch finishes. A new game saves the new style, so if the style ships without the clips, its lines have no clip under either key and are generated live mid-game.
- Engine change committed first, on its own.

## Status
- m01 batch running (log `tmp/tts-m01-38.log`). New clips listed in `tts_cache/m01_first_contact/manifest.json`; readable links in `tmp/tts_comparison/m01_new/`.
- Nothing committed yet.

## Regeneration runbook (one mission)
1. Run `bin/rails "app:break_escape:tts:batch_generate[<mission>]" > tmp/tts-<mission>-38.log 2>&1` in the background. It skips lines already on 3.8, so reruns only fill gaps.
2. When it ends, check the summary block: errors, and any line marked failed. Rerun once for failures. A 429 marked as daily limit stops the run; report it rather than looping.
3. Verify: every manifest entry has an MP3; every new MP3 (listed in `tts_cache/<mission>/manifest.json`) is non-empty and its ffprobe duration is plausible (no 0 s clips, nothing over ~60 s); no leftover `.*.pcm` / `.*.mp3` / `*.tmp` files.
4. Spot-check 5 clips with the most style-heavy prompts: transcribe with `gemini-3.8-flash` (generateContent, inline audio) and confirm the style prompt is not spoken and the text matches.
5. Make `tmp/tts_comparison/<mission>_new/` with readable symlinks (`NN_<npc>_<first words>.mp3`, ordered by mtime) for the user to listen.
Known gap: the batch voices every line of an ink story with the story owner's voice; narrator / co-speaker lines are requested at runtime under the speaker's own voice, so they may stay uncovered until the batch is fixed.

## Log
- 2026-10-09: engine committed eb0ff353; m01 (style + 518 clips + manifest) 0b30dbbc, 43 min of audio, ~$0.58; 22 current 2.5 clips for m03/m05/m08 28d2515b.
- The other 271 matched 2.5 clips (m02, sis01, sis02, Tesseract) and 9 uncommitted 2.5 m01 clips were archived to `~/tts_orphans_2026-10/_superseded/` instead of committed: those missions are being regenerated on 3.8 and production never had these clips, so they would only add history.
