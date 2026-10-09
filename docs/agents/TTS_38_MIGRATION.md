# TTS move to Gemini 3.8 (started 2026-10-08)

## Decisions (user)
- Model: `gemini-3.8-flash-tts` via the Interactions API (`/v1beta/interactions`). Style goes in a `speech_metadata` annotation, because 3.8 speaks the input text verbatim. PCM (`audio/l16`, 24 kHz) is requested so the ffmpeg step is unchanged.
- Agent HaX's stock style ending ("Speak quickly with urgency, as if time is short" and its variants) is replaced with: "A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice." Applied to m01 only so far. m02–m06 keep the old wording until each is regenerated, because a changed style is a new cache key and would leave those lines with no clip.
- Regenerate **m01 only** for now, then the user listens and decides on the rest.
- In-progress games must hear no gap or delay from the switch.
- `tts_cache/` is no longer gitignored (only in-flight temp files and the test folders are), so clips and their sidecars are committed like any file. Reason: generation isn't deterministic, so committing ships the takes that were reviewed.
- Never-committed 2.5 clips (~970, 53 MB): commit only those matching a current line; leave orphans from rewritten lines out of history. Result: 293 current (13 MB, to commit), 442 orphans moved to `~/tts_orphans_2026-10/` (outside the repo, with the matcher's lists and script in `_lists/`). 82 of the orphans are unchanged text under an edited voice; user chose to treat them as orphans too.
- Already-committed clips for m02 (26/456 current) and sis01 (0/567) are mostly for older text or voices. Left in place: games saved on an older version may use them. Those missions' current lines are largely unvoiced in the repo, so they generate live.
- The text-validation fragment gap (InkTextValidator accepts any text containing a 10+ character story fragment): user said ignore for now.

## How the cache works now
- Key: MD5 of `normalised text | voice | style | language | model` (`TtsService#compute_cache_key`). Clips from 2.5 were keyed without the model; `TtsService#legacy_cached_path` finds them.
- Each clip has a sidecar `<key>.json` beside `<key>.mp3` (`TtsService#write_sidecar`): key, npc, text, voice, style, language, model, scenario, source, generated, recorded_at. It is the only provenance record (the per-scenario `manifest.json` was retired 2026-10-09; per-clip files don't conflict when two branches voice the same mission). `model` is the current model when the file is on the current-model key, `gemini-2.5-flash-preview-tts` when on the pre-model key, omitted otherwise; `npc` and `generated` are omitted when unknown (backfills don't know when audio was made). Written via temp file and rename. Legacy 2.5 clips never given a sidecar stay without one; the pruner judges them by key.
- The endpoint (`GamesController#tts`) takes the voice from the scenario as it is now (`Mission#current_voice_configs`), falling back to the game's saved `scenario_data`. Order: current-model clip, previous-model clip (current voice, then saved voice), then live generation.
- The 2.5 clips stay on disk until every mission has been regenerated.

## Files
`app/services/break_escape/tts_service.rb` (sidecars), `app/services/break_escape/tts_batch_processor.rb`, `app/services/break_escape/tts_wasted_clips.rb` (`rake break_escape:tts:wasted`), `app/services/break_escape/tts_cache_pruner.rb`, `app/models/break_escape/mission.rb` (`current_voice_configs`), `app/controllers/break_escape/games_controller.rb` (`tts`, `legacy_tts_clip`), `test/controllers/break_escape/tts_controller_test.rb`.

## Committing a regenerated mission
- Clips and their `<key>.json` sidecars are committed together.
- The mission's style edits and its new clips go in **one commit**, after its batch finishes. A new game saves the new style, so if the style ships without the clips, its lines have no clip under either key and are generated live mid-game.
- Engine change committed first, on its own.

## Status
- m01 batch running (log `tmp/tts-m01-38.log`). New clips have `"source": "generate"` sidecars in `tts_cache/m01_first_contact/`; readable links in `tmp/tts_comparison/m01_new/`.
- Nothing committed yet.

## Regeneration runbook (one mission)
1. Run `bin/rails "app:break_escape:tts:batch_generate[<mission>]" > tmp/tts-<mission>-38.log 2>&1` in the background. It skips lines already on 3.8, so reruns only fill gaps.
2. When it ends, check the summary block: errors, and any line marked failed. Rerun once for failures. A 429 marked as daily limit stops the run; report it rather than looping.
3. Verify: every sidecar has an MP3; every new MP3 (sidecar `"source": "generate"` with today's `generated` date) is non-empty and its ffprobe duration is plausible (no 0 s clips, nothing over ~60 s); no leftover `.*.pcm` / `.*.mp3` / `*.tmp` files.
4. Spot-check 5 clips with the most style-heavy prompts: transcribe with `gemini-3.8-flash` (generateContent, inline audio) and confirm the style prompt is not spoken and the text matches.
5. Make `tmp/tts_comparison/<mission>_new/` with readable symlinks (`NN_<npc>_<first words>.mp3`, ordered by mtime) for the user to listen.
Known gap: the batch voices every line of an ink story with the story owner's voice; narrator / co-speaker lines are requested at runtime under the speaker's own voice, so they may stay uncovered until the batch is fixed.

## Log
- 2026-10-09: engine committed eb0ff353; m01 (style + 518 clips + manifest) 0b30dbbc, 43 min of audio, ~$0.58; 22 current 2.5 clips for m03/m05/m08 28d2515b.
- The other 271 matched 2.5 clips (m02, sis01, sis02, Tesseract) and 9 uncommitted 2.5 m01 clips were archived to `~/tts_orphans_2026-10/_superseded/` instead of committed: those missions are being regenerated on 3.8 and production never had these clips, so they would only add history.
- 2026-10-09: m01 coverage audit (Opus): batch missed 102 of 586 requestable m01 lines and made 34 unrequestable clips. Causes in `tts_batch_processor.rb`: unprefixed lines skipped; narrator lines voiced with the host's voice; regex cuts lines at `\"`; `{player_name}` splits lines; under-10-character filter. `InkTextValidator` has the same `\"` bug, so a few quoted lines get a 403. User decisions: fix extraction with a JSON line walker shared with the validator; top up m01 and the four missions; remove wasted clips; barks and phone `voice:` lines not in scope.
- Voiced lines must not use `{player_name}` (they can't be cached for other players). m01 debrief's three lines now say "Agent". Still to change when each mission is regenerated: m05 closing_debrief 175/655/684, opening 191/326; m06 closing_debrief 53/70/120, satoshi_confrontation 305/492/551/583, npc_irina_volkova 493; m07 closing_debrief 77/404; m08 closing_debrief 167, nightshade_confrontation 80/96, director_netherton 64. Phone ink and lab instructors aren't voiced.
- 2026-10-09: extraction rewrite committed 4d1f734c (InkLineWalker, TtsLineExtractor, validator on the walker, `rake break_escape:tts:wasted`). Every branch of sequences and inline conditionals is voiced (cap 16 variants). Top-ups: m01 100, m02 202, sis01 77, sis02 4, Tesseract 21; 0 errors. Wasted clips removed: 227. Each manifest (now sidecars) equalled its expected line set exactly.
- Commits: m01 aaae17e6, m02 1c20e8b8 (HaX v2 style, 7 name lines → "Agent"), sis01 6cb5db34, sis02 ae2af56c, Tesseract 62752d34. The user's uncommitted narrator openings (m01/m02/sis01/sis02 ink, background PNGs) are voiced but left uncommitted for them; their clips are committed, so those lines are covered when the ink lands.
- Still on 2.5: m03–m08, sis03, cybok_heist, demos. Before regenerating each: v2 HaX wording (m03–m06), `{player_name}` lines listed above (m05–m08), then batch + `wasted`.
- Unresolved by design: m01 "And {lore_collected} intelligence fragments recovered." (number interpolation, generated live).
- 2026-10-09: manifest.json retired; sidecars are the single provenance record (user decision: per-clip files don't conflict across branches). Sidecars gained `npc` and `model` (and `generated` for new audio); writes are atomic. The five manifests became sidecars: m02 1035, sis01 576, Tesseract 175 written (`"source": "manifest"`); m01 585 and sis02 183 already had sidecars, which gained npc/model/generated from the manifest. Manifests and `.lock` files deleted; no MP3 touched. `rake break_escape:tts:wasted` now reads sidecars (`TtsWastedClips`) and stays separate from `prune_cache`, which counts a line in any of the scenario's voices as matched and so can't see a line voiced with the wrong speaker. Dry run: 0 unrequested of 2,554 current-model clips. Legacy 2.5 clips without sidecars (m01 764, m02 27) are left as the pruner treats them.
