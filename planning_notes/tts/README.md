# TTS System - Server-Side Text-to-Speech for NPC Dialog

## Context

BreakEscape's person-chat minigame displays NPC dialog line-by-line. This plan adds
server-side TTS so each dialog line is spoken aloud using Google Gemini 2.5 Flash TTS.

The system generates MP3 audio on-demand per dialog line, caches it by MD5 hash, and
serves it to the client. Text is validated against the NPC's compiled Ink story to
prevent API abuse. Starting with Mission 1 NPCs for testing.

## Architecture

```
Client (person-chat)                Rails Server                      Gemini API
────────────────────              ────────────────                  ────────────────
Dialog line displayed  ──────►  POST /games/:id/tts
                                  │
                                  ├─ Validate NPC exists
                                  ├─ Validate text in Ink JSON
                                  ├─ Compute MD5(text|voice)
                                  │
                                  ├─ Cache hit? ──► Serve MP3
                                  │
                                  └─ Cache miss:
                                       ├─ Call Gemini TTS  ──────►  generateContent
                                       ├─ Decode base64 PCM  ◄──── (24kHz 16-bit PCM)
                                       ├─ ffmpeg PCM → MP3
                                       ├─ Save to tmp/tts_cache/
                                       └─ Serve MP3
                           ◄──────  audio/mpeg response
Play via HTML5 Audio
```

## Key Technical Details

- **Model**: `gemini-2.5-flash-preview-tts` via Gemini REST API
- **NOT** the `google-cloud-text_to_speech` gem — Gemini TTS uses the standard
  `generateContent` endpoint with `responseModalities: ["AUDIO"]`
- **Auth**: `GEMINI_API_KEY` environment variable (API key, not service account)
- **Response format**: Base64-encoded 16-bit PCM at 24kHz mono
- **Conversion**: ffmpeg converts PCM to MP3 (system dependency)
- **Cache**: `tmp/tts_cache/{md5}.mp3` — persists across requests, cleared on deploy

## Voice Assignments (Mission 1)

| NPC              | NPC ID                   | Voice  | Style Prompt                                                     |
|------------------|--------------------------|--------|------------------------------------------------------------------|
| Sarah Martinez   | sarah_martinez           | Kore   | Friendly, warm receptionist. Speak naturally and helpfully.      |
| Kevin Park       | kevin_park               | Charon | Enthusiastic, nerdy tech professional. Slightly anxious.         |
| Maya Chen        | maya_chen                | Leda   | Anxious, speaking in hushed tones. Nervous and concerned.        |
| Derek Lawson     | derek_lawson             | Zephyr | Confident, slightly menacing corporate executive.                |
| Agent 0x99 (pre) | briefing_cutscene        | Aoede  | Calm, professional intelligence handler giving a mission briefing.|
| Agent 0x99 (post)| closing_debrief_person   | Aoede  | Calm, professional intelligence handler in debrief.              |

Phone NPC (`agent_0x99`) excluded — person-chat only.

---

## Implementation Plan

### Phase 1: Server-Side Infrastructure

#### 1.1 Add Dependencies

**Gemfile** — Add `faraday` for HTTP requests to Gemini API:
```ruby
gem 'faraday', '~> 2.0'
```

System dependency: `ffmpeg` must be on PATH.

#### 1.2 Create TTS Service

**New file: `app/services/break_escape/tts_service.rb`**

Responsibilities:
- Accept text + voice config
- Compute cache key: `MD5(normalized_text + "|" + voice_name)`
  - Normalization: lowercase, strip punctuation, collapse whitespace
- Check disk cache at `tmp/tts_cache/{md5}.mp3`
- On cache miss: call Gemini API, decode base64 PCM, convert to MP3 via ffmpeg
- Return path to cached MP3 file (or nil on failure)

API call details:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=API_KEY`
- Request body:
  ```json
  {
    "contents": [{
      "parts": [{ "text": "Style prompt\n\nActual dialog text" }]
    }],
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": { "voiceName": "Kore" }
        }
      }
    }
  }
  ```
- Response: `candidates[0].content.parts[0].inlineData.data` = base64 PCM audio
- ffmpeg conversion: `ffmpeg -y -f s16le -ar 24000 -ac 1 -i input.pcm -codec:a libmp3lame -qscale:a 4 output.mp3`

#### 1.3 Create Ink Text Validator

**New file: `app/services/break_escape/ink_text_validator.rb`**

Prevents API abuse by verifying requested text exists in the NPC's compiled Ink JSON.

Compiled Ink stores text as `^`-prefixed strings: `"^Sarah: Hi! You must be the IT contractor."`

Validation approach:
1. Load the compiled Ink JSON file
2. Scan for all `^`-prefixed strings via regex: `/"(\^[^"]*)"/`
3. For each match, strip the `^` prefix
4. Also strip `Speaker: ` prefix (Ink stores `"^Sarah: Hello"`, client sends `"Hello"`)
5. Normalize both request text and Ink text (lowercase, strip punctuation, collapse whitespace)
6. Return true if any normalized Ink text matches the normalized request

#### 1.4 Add TTS Controller Action

**Modify: `app/controllers/break_escape/games_controller.rb`**

New action `tts`:
- Add `tts` to the `before_action :set_game` list
- `POST /games/:id/tts` with params `{ npc_id, text }`
- Find NPC in scenario (reuse `find_npc_in_scenario`)
- Check NPC has `voice` config
- Validate text via `InkTextValidator.validate(ink_path, text)`
- Generate audio via `TtsService.new.generate(text, voice_name, style)`
- `send_file mp3_path, type: 'audio/mpeg', disposition: 'inline'`
- Max text length: 500 characters

#### 1.5 Add Route

**Modify: `config/routes.rb`**

Add inside the `member do` block:
```ruby
post 'tts'  # Generate TTS audio for NPC dialogue
```

#### 1.6 Add Voice Config to Scenario NPCs

**Modify: `scenarios/m01_first_contact/scenario.json.erb`**

Add `"voice"` block to each person-type NPC definition:
```json
"voice": {
  "name": "Kore",
  "style": "Friendly, warm receptionist. Speak naturally and helpfully."
}
```

---

### Phase 2: Client-Side Infrastructure

#### 2.1 Add getTTS to ApiClient

**Modify: `public/break_escape/js/api-client.js`**

New static method `getTTS(npcId, text)`:
- `POST` to `/tts` with JSON body
- Returns audio Blob (not JSON — unlike all other methods)
- Returns null on failure (graceful degradation)

#### 2.2 Create TTS Manager

**New file: `public/break_escape/js/systems/tts-manager.js`**

Uses HTML5 Audio (not Phaser sound — TTS is dynamic, not preloaded):
- `play(npcId, text)` → fetch audio blob, play via Audio element, return duration in ms
- `preload(npcId, text)` → fetch and cache blob URL for upcoming line
- `stop()` → stop playback immediately
- `onEnded(callback)` → register callback for when audio finishes
- `setVolume(vol)` → volume control (0.0-1.0)
- `setEnabled(enabled)` → toggle TTS on/off
- `destroy()` → cleanup resources and revoke object URLs

Preload cache: Map of `"npcId|text"` → object URL. Consumed on play.

#### 2.3 Integrate into PersonChatMinigame

**Modify: `public/break_escape/js/minigames/person-chat/person-chat-minigame.js`**

Four integration points:

**A. Import + instantiate** (top of file):
```javascript
import TTSManager from '../../systems/tts-manager.js';
// In constructor:
this.ttsManager = new TTSManager();
```

**B. Play audio in `displayDialogueBlocksSequentially`** (after `ui.showDialogue()` ~line 1163):
- Extract clean dialog text (the `line` variable, already stripped of speaker prefix)
- Only play TTS for NPC speakers (not player, not narrator, not system)
- `await this.ttsManager.play(this.npcId, ttsText)` → returns duration in ms
- If audio duration available: use `audioDuration + 500ms` as advance delay
- If no audio: fall back to `DIALOGUE_AUTO_ADVANCE_DELAY` (5000ms)
- Preload next line while current plays
- Method becomes `async` (safe — it uses setTimeout for flow control, not return values)

**C. Stop TTS on manual advance** (in click/continue handler):
```javascript
if (this.ttsManager) this.ttsManager.stop();
```

**D. Cleanup on conversation end:**
```javascript
if (this.ttsManager) { this.ttsManager.stop(); this.ttsManager.destroy(); }
```

---

---

## Running the TTS Batch Generator

The rake task must be run from the **Hacktivity host Rails app** (not the engine root), because the engine itself has no Gemfile of its own. Use the launcher script:

```bash
# One scenario
./scripts/tts_batch.sh m02_ransomed_trust

# All scenarios
./scripts/tts_batch.sh

# Cache statistics
./scripts/tts_batch.sh cache_stats

# Clear cache
./scripts/tts_batch.sh clear_cache
```

Or invoke directly from the Hacktivity directory:

```bash
cd /home/cliffe/Files/Projects/Code/Hacktivity
bundle exec rake break_escape:tts:batch_generate[m02_ransomed_trust]
bundle exec rake break_escape:tts:batch_generate          # all
bundle exec rake break_escape:tts:cache_stats
```

**Notes:**
- Requires `GEMINI_API_KEY` set in the Hacktivity app environment (or exported in your shell).
- Rate-limit failures retry automatically; re-run the same command to fill in missed lines — cached files are skipped.
- Cache lives at `tts_cache/` in the BreakEscape engine root.

---

### Phase 3: Testing & Verification

#### 3.1 Prerequisites
- `GEMINI_API_KEY` env var set
- `ffmpeg` installed and on PATH
- Voice config added to at least Sarah Martinez NPC

#### 3.2 End-to-End Test (Sarah Martinez)
1. Start game, enter reception, talk to Sarah
2. Verify audio plays for Sarah's dialog lines
3. Verify audio does NOT play for player choice text
4. Verify auto-advance timing matches audio duration (not fixed 5s)
5. Verify clicking "Continue" stops audio and advances
6. Verify ESC stops audio and closes conversation

#### 3.3 Cache Verification
1. Check `tmp/tts_cache/` for MP3 files after first conversation
2. Restart server, repeat conversation — verify no API calls in logs (cache hit)

#### 3.4 Graceful Degradation
1. Remove GEMINI_API_KEY → conversations work normally, no errors
2. Invalid API key → conversations work normally, error logged server-side

#### 3.5 Security Validation
```bash
# Should return 403 - text not in NPC story
curl -X POST http://localhost:3000/break_escape/games/1/tts \
  -H "Content-Type: application/json" \
  -d '{"npc_id":"sarah_martinez","text":"arbitrary text not in story"}'

# Should return 403 - wrong NPC
curl -X POST http://localhost:3000/break_escape/games/1/tts \
  -H "Content-Type: application/json" \
  -d '{"npc_id":"kevin_park","text":"Hi! You must be the IT contractor."}'
```

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `Gemfile` | Modify | Add `faraday ~> 2.0` |
| `app/services/break_escape/tts_service.rb` | **Create** | Gemini TTS API + caching + PCM→MP3 |
| `app/services/break_escape/ink_text_validator.rb` | **Create** | Validate text exists in Ink JSON |
| `app/controllers/break_escape/games_controller.rb` | Modify | Add `tts` action |
| `config/routes.rb` | Modify | Add `post 'tts'` route |
| `scenarios/m01_first_contact/scenario.json.erb` | Modify | Add `voice` config to 6 NPCs |
| `public/break_escape/js/api-client.js` | Modify | Add `getTTS()` method |
| `public/break_escape/js/systems/tts-manager.js` | **Create** | Client TTS playback manager |
| `public/break_escape/js/minigames/person-chat/person-chat-minigame.js` | Modify | TTS integration in dialog loop |

## Cost Estimate

Mission 1 has ~500 unique dialog lines averaging ~50 characters each:
- ~25,000 characters per full playthrough
- At ~$30/1M chars = **~$0.75 per scenario** (first generation)
- Cached forever after — subsequent playthroughs cost $0

## Future Enhancements (Not in this plan)

- Pre-generation rake task: walk all Ink files, generate all audio at deploy time
- Phone-chat TTS support
- Player-configurable TTS on/off toggle in settings
- Voice speed/pace control per NPC
- Streaming TTS for lower first-byte latency on cache misses
