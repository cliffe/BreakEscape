---
name: tts-audio
description: Generate, top up, check, prune and commit Break Escape's NPC voice audio (Gemini TTS, the tts_cache/ folder) — and the standing rules for voice styles and voiced lines. Trigger when the user asks to "voice a mission", "generate the audio", "regenerate the TTS", "top up the audio", "which lines have no audio", "the voice sounds wrong / stressed / has the wrong accent", "change a character's voice or style", "prune the TTS cache", "clean up old audio", "commit the audio", "move to a new TTS model", or after a dialogue rewrite of a mission that already has audio.
---

# NPC voice audio (TTS)

Every voiced line is a cached MP3 made by Gemini TTS. The game asks the server for a line (`POST /games/:id/tts` with `npc_id` and the line text); the server validates the text, then serves a cached clip or generates one live. Live generation costs money, takes seconds mid-conversation, and on a server without a key means silence. So the aim is: **every line a player can hear has a reviewed clip committed to git before the mission ships.**

History and the reasoning behind each rule: `docs/agents/TTS_38_MIGRATION.md` (decisions and a dated log). `planning_notes/tts/README.md` is the original 2025 implementation plan and is out of date on the model and API.

## How it works

- **Model:** `gemini-3.8-flash-tts` via the Interactions API (`POST /v1beta/interactions`). The voice's `style` goes in a `speech_metadata` annotation, never in front of the text: 3.8 speaks its input word for word. PCM (`audio/l16`, 24 kHz) is requested and converted to MP3 with ffmpeg. `TtsService::GEMINI_TTS_MODEL` is the one place the model is named.
- **Voice config** lives in `scenario.json.erb`: `"voice": { "name": "Aoede", "style": "…", "language": "en-GB" }` on an NPC (or `ttsVoice` on an object with a fixed `voice` string, like a desk-phone voicemail). The top-level `narrator` has its own voice.
- **Cache key:** MD5 of `normalised text | voice | style | language | model`, in `tts_cache/<scenario>/<key>.mp3`. Normalising lower-cases and strips punctuation, so "Hi!" and "Hi." share a clip. **Any change to text, voice name, style wording, language or model is a new key and a new paid clip.**
- **Sidecar:** each clip has `<key>.json` beside it recording `npc, text, voice, style, language, model, scenario, source, generated`. It is the only provenance record (per-clip, so branches that both generate audio don't conflict). Older 2.5 clips often have none.
- **Which voice is used:** the endpoint takes the speaker's voice from the scenario file *as it is now* (`Mission#current_voice_configs`), not from the game's saved copy, so games started before a restyle still find the regenerated clips. The saved copy is the fallback.
- **Serving order:** current-model clip → previous-model (2.5) clip under the current voice, then under the saved voice → live generation. A mission not yet regenerated plays its 2.5 clips with no delay.
- **Which lines exist:** `InkLineWalker` reads compiled ink the way the client shows it (fragments joined, choice labels and tags skipped, string variables filled in, every branch of `{&a|b}` sequences and inline conditionals expanded, capped at 16 variants). `TtsLineExtractor` resolves each line's speaker like the client (`Narrator:` → narrator, a prefix or displayName → that NPC, no prefix → the conversation's NPC) and voices it with that speaker's voice. `InkTextValidator` uses the same walker. Phone chats are not voiced (no ink has `voice:` lines); barks are not extracted.

## Standing rules (user decisions)

1. **Audio last.** Generate a mission's audio only once its dialogue is signed off. Every rewritten line orphans its clip, and committed clips stay in git history for good (sis02's whole first 3.8 set, 20 MB, was orphaned by a rewrite a day later).
2. **No printed variables in voiced lines.** `{player_name}`, `{player_name()}`, counts or any `{var}` make the text differ per player, so it can never be cached. Use fixed words: HaX says "Agent". Numbers that depend on game state stay live by design (m01's `{lore_collected}` line). Variables in phone chats and lab instructor scripts are fine; those aren't voiced.
3. **Agent HaX is calm under pressure.** Her style ends: "A seasoned professional who has done this a hundred times. Quick, clipped and businesslike because time is short, yet completely unflustered; the urgency is in the pace, never in the voice." Never "speak quickly with urgency, as if time is short" — on 3.8 that made her sound stressed and wobbly. Scene-specific moods (m04/m05 debriefs, m07 strain, m08 hurt, the Tesseract's "brisk, dry") keep their own wording. As of 2026-10-09 m03–m06 still have the old wording; apply the new ending when each is regenerated, not before (a restyle without new clips leaves those lines unvoiced).
4. **Commit the audio.** `tts_cache/` is tracked (only temp files and the `quota_test`, `test_debug`, `test_event_cascade` folders are ignored). Generation isn't deterministic, so committing ships the takes that were reviewed; production doesn't generate its own.
5. **A mission's voice changes and its clips go in one commit.** If a style change ships without its clips, new games request keys that don't exist and generate live. Engine changes are committed separately, first.
6. **In-progress games must notice nothing.** Keep 2.5 clips until every mission is on 3.8 and games saved before the switch are unlikely to be running; the pruner's dry run lists them as orphans, which is expected.
7. **Stage directions are fine inline.** `*after a while*`, `*quietly*` are acted, not spoken (checked on 3.8).
8. **Cost is small but real:** about $9 per million audio tokens at 25 tokens/s, so roughly $0.80 per hour of audio until 31 Dec 2026, double from 1 Jan 2027. A whole mission is $0.20–$1.50. Confirm before voicing several missions; the user approves the cost.
9. **Draft playtests run on the keyless server on :3001** so they never pay for lines that will change (see playtest-scenario).

## Voice a mission (or regenerate it)

Prereqs: dialogue signed off (rule 1); `GEMINI_API_KEY` set; ink compiled (`bin/inklecate -o x.json x.ink`, or `scripts/compile-ink.sh <scenario>`); no other agent editing the mission's ink.

1. **Prep the text.** Search the mission's voiced ink for `{player_name`, `{` interpolations and `player_name()`: rewrite them (rule 2). For HaX, apply the rule 3 ending if it isn't there. These are writing changes: show the user the before/after lines.
2. **Generate.** From the engine root:
   ```bash
   bin/rails "app:break_escape:tts:batch_generate[<scenario>]" > tmp/tts-<scenario>.log 2>&1
   ```
   It skips lines that already have a current-model clip, so a rerun only fills gaps. Several missions can run in parallel (separate folders). Expect ~10 s per line; a big mission takes over an hour, so run it in the background. A 429 that looks like a daily limit stops the run; report it rather than looping.
3. **Check coverage and waste.**
   ```bash
   bin/rails "app:break_escape:tts:wasted[<scenario>]" 2>&1 | grep -v warning:
   ```
   The header reads `N of M sidecar clips are not requested (E lines expected)`. Done when N is 0 and clips = E. (It prints to stderr; a leading blank line is normal.) Anything listed is a clip nothing will request: narration voiced as the host, a fragment, an old take. Check a sample by eye, then remove with `git rm` (or `rm` if untracked) together with its sidecar.
4. **Verify the audio.** No clip under ~0.8 s or over 60 s (ffprobe); no leftover `.*.pcm`, `.*.mp3`, `*.tmp`. Transcribe five clips with the most style-heavy prompts (`gemini-3.8-flash` `generateContent` with inline audio) and confirm the text matches and the style prompt isn't spoken.
5. **Let the user listen.** Make `tmp/tts_comparison/<scenario>_new/` with readable symlinks (`NNN_<npc>_<first-words>.mp3`, from the sidecars, ordered by mtime) and point them at it. List any clip where the transcript differed from the text.
6. **Commit** the mission's voice/ink changes and `tts_cache/<scenario>/` together (rule 5): `git add -A tts_cache/<scenario>` plus the scenario/ink files *you* changed. Other sessions may have uncommitted edits in the same folders: stage only your hunks (build the staged file from `HEAD` if a file is mixed) and never sweep their files in. Don't push unless asked.

## After a dialogue edit to a voiced mission

Run step 3 (`wasted`) to see what the edit orphaned, then step 2 to voice the new lines, then steps 4–6. List every spoken line an edit touches before making it, since each costs a clip (AGENTS.md).

## Change a voice or style

A style edit re-keys every line that NPC speaks. Get the wording right on samples first: generate 2–3 variants of one representative line to `tmp/tts_comparison/` with a scratch script (Interactions API, as `TtsService#call_gemini_tts` builds it), have the user pick by ear, then apply it and regenerate the mission. Gemini's own description of a clip ("composed, no tremor") did not hear the wobble the user heard; the user's ears decide.

## Prune old audio

```bash
bin/rails app:break_escape:tts:prune_cache[<scenario>]            # dry run
APPLY=1 bin/rails app:break_escape:tts:prune_cache[<scenario>]    # move orphans to tmp/tts_pruned/<date>/
```

`prune_cache` keeps any clip whose text matches a line in *any* of the scenario's voices and counts 2.5 clips under their old key as matched; `wasted` is stricter (exact speaker and voice, current model only). Use `wasted` to catch wrong-voice clips, `prune_cache` to clear clips for lines that no longer exist. Respect rule 6 before pruning 2.5 clips. Prefer moving to deleting; deleting committed clips doesn't shrink history.

## Move to a new TTS model

Change `GEMINI_TTS_MODEL`; the model is in the key, so old clips become the fallback tier automatically. Check the new model's request format and whether it speaks input verbatim (style placement), sample one character's lines with the user before regenerating anything, keep the old clips until every mission has moved, and update this skill and `docs/agents/TTS_38_MIGRATION.md`.

## Gotchas found the hard way

- The old regex extractor missed 102 of m01's 586 lines (unprefixed lines, narrator voiced as the host, lines cut at `\"`). If `wasted` ever reports a whole class of lines voiced as the wrong speaker, suspect extraction, not the audio.
- Audio stays under the old key when only the *saved* game copy changed; the endpoint uses the current scenario's voice. Don't "fix" this by reading `scenario_data`.
- A branch merge can delete committed clips (the pruner on `claude/m03-improvement-loop` removed 1,166 orphans). Check `git ls-tree -r --name-only HEAD tts_cache | wc -l` around merges.
- `git add -A tts_cache/<scenario>` also adds sidecars and anything else untracked there; look at `git diff --cached --stat` before committing.
- A rerun after editing `tts_batch_processor.rb` while a batch is running loads half-edited code. Don't edit the batch code while batches run.
- The live endpoint (your :3000 server) writes clips during play; a few extra entries after a batch are usually that.

## Files

- `app/services/break_escape/tts_service.rb` — API call, cache keys, sidecars, legacy lookup
- `app/services/break_escape/ink_line_walker.rb`, `tts_line_extractor.rb`, `ink_text_validator.rb` — which lines exist and who says them
- `app/services/break_escape/tts_batch_processor.rb` — the batch
- `app/services/break_escape/tts_wasted_clips.rb`, `tts_cache_pruner.rb`, `tts_expected_lines.rb` — checking and pruning
- `app/controllers/break_escape/games_controller.rb` (`tts`, `legacy_tts_clip`), `app/models/break_escape/mission.rb` (`current_voice_configs`)
- `lib/tasks/break_escape_tasks.rake` — `batch_generate`, `wasted`, `prune_cache`, `cache_stats`
- Client: `public/break_escape/js/systems/tts-manager.js`, `minigames/person-chat/person-chat-minigame.js` (`determineSpeaker`, the `ttsManager.play` call)
- Tests: `test/controllers/break_escape/tts_controller_test.rb`, `test/unit/break_escape/ink_line_walker_test.rb`, `ink_text_validator_test.rb`, `tts_cache_pruner_test.rb`, `tts_wasted_clips_test.rb`
