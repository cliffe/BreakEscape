# Sprite System Documentation

## Overview

The game now supports two sprite formats:
1. **Legacy Format** - 64x64 frame-based sprites (old system)
2. **Atlas Format** - 80x80 JSON atlas sprites (new PixelLab characters)

## Available Characters

### New Atlas-Based Characters (80x80)

All atlas characters support 8-directional animations with the following types:
- **breathing-idle** - Idle breathing animation
- **walk** - Walking animation  
- **cross-punch** - Punch attack
- **lead-jab** - Quick jab
- **falling-back-death** - Death animation
- **taking-punch** - Getting hit (some characters)
- **pull-heavy-object** - Pushing/pulling (some characters)

#### Female Characters

| Key | Description | Animations |
|-----|-------------|-----------|
| `female_hacker_hood` | Hacker in hoodie (hood up) | 48 animations, 256 frames |
| `female_hacker` | Hacker in hoodie | 37 animations, 182 frames |
| `female_office_worker` | Office worker (blonde) | 32 animations, 152 frames |
| `female_security_guard` | Security guard | 40 animations, 208 frames |
| `female_telecom` | Telecom worker (high vis) | 24 animations, 128 frames |
| `female_spy` | Spy in trench coat | 40 animations, 208 frames |
| `female_scientist` | Scientist in lab coat | 30 animations, 170 frames |
| `woman_bow` | Woman with bow in hair | 31 animations, 149 frames |

#### Male Characters

| Key | Description | Animations |
|-----|-------------|-----------|
| `male_hacker_hood` | Hacker in hoodie (obscured face) | 40 animations, 208 frames |
| `male_hacker` | Hacker in hoodie | 40 animations, 208 frames |
| `male_office_worker` | Office worker (shirt & tie) | 40 animations, 224 frames |
| `male_security_guard` | Security guard | 40 animations, 208 frames |
| `male_telecom` | Telecom worker (high vis) | 37 animations, 182 frames |
| `male_spy` | Spy in trench coat | 40 animations, 208 frames |
| `male_scientist` | Mad scientist | 30 animations, 170 frames |
| `male_nerd` | Nerd (red t-shirt, glasses) | 40 animations, 208 frames |

### Legacy Characters (64x64)

| Key | Description |
|-----|-------------|
| `hacker` | Original hacker sprite |
| `hacker-red` | Red variant hacker |

## Using in Scenarios

### Atlas Character Configuration

```json
{
  "id": "npc_id",
  "displayName": "NPC Name",
  "npcType": "person",
  "position": { "x": 4, "y": 4 },
  "spriteSheet": "female_hacker_hood",
  "spriteTalk": "assets/characters/custom-talk.png",
  "spriteConfig": {
    "idleFrameRate": 8,
    "walkFrameRate": 10
  }
}
```

### Legacy Character Configuration

```json
{
  "id": "npc_id",
  "displayName": "NPC Name", 
  "npcType": "person",
  "position": { "x": 4, "y": 4 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  }
}
```

## Configuration Options

### Atlas Format (`spriteConfig`)

- `idleFrameRate` - Frame rate for idle animations (default: 8)
- `walkFrameRate` - Frame rate for walk animations (default: 10)
- `attackFrameRate` - Frame rate for attack animations (default: 8)

### Legacy Format (`spriteConfig`)

- `idleFrameStart` - Starting frame for idle animation (default: 20)
- `idleFrameEnd` - Ending frame for idle animation (default: 23)
- `idleFrameRate` - Frame rate for idle animation (default: 4)
- `walkFrameRate` - Frame rate for walk animation (default: 10)
- `greetFrameStart` - Starting frame for greeting animation
- `greetFrameEnd` - Ending frame for greeting animation
- `talkFrameStart` - Starting frame for talking animation
- `talkFrameEnd` - Ending frame for talking animation

## Technical Details

### How It Works

1. **Loading**: Only the atlases a scenario uses are loaded, by key, from `characters/<key>.png` and `<key>.json` (`js/systems/character-textures.js`). The server sends the keys as `characterSprites` in the bootstrap scenario (`Game#filtered_scenario_for_bootstrap`), and `game.js` preload queues them in the same loader pass as the scenario JSON. If a room's NPC uses a key the list missed, `NPCLazyLoader` loads it before the room is built and logs a `was not preloaded` warning. Each atlas costs about 7 MB of texture memory once decoded, which is why they aren't all preloaded.
2. **Detection**: The system automatically detects whether a sprite is atlas-based or legacy
3. **Animation Setup**: 
   - Atlas characters use `setupAtlasAnimations()` which reads animation metadata from JSON
   - Legacy characters use frame-based animation generation
4. **Direction Mapping**: Atlas directions (east/west/north/south) map to game directions (right/left/up/down)

### Animation Key Format

Atlas animations are automatically mapped to the game's animation key format:

**Atlas Format**: `breathing-idle_east`, `walk_north`, etc.  
**Game Format**: `npc-{npcId}-idle-right`, `npc-{npcId}-walk-up`, etc.

### 8-Directional Support

All atlas characters support 8 directions:
- **Cardinal**: north (up), south (down), east (right), west (left)
- **Diagonal**: north-east, north-west, south-east, south-west

## Portrait Images (`spriteTalk`)

The `spriteTalk` field specifies a separate larger image used in conversation scenes. This is independent of the sprite sheet format and works with both atlas and legacy sprites.

```json
"spriteTalk": "assets/characters/custom-talk-portrait.png"
```

If not specified, the portrait path is derived from the sprite sheet name using the
`assets/characters/{spriteSheet}_talk.png` convention (the legacy `hacker` and `hacker-red`
sprites map to `hacker-talk.png` / `hacker-red-talk.png`). If that file is missing the loader
tries `{spriteSheet}_headshot.png`, and only then falls back to rendering a sprite sheet frame.
So a character only needs an explicit `spriteTalk` when its portrait is named off-convention.

A `spriteTalk` that is a square sheet of 256px or more is read as a 2×2 grid: frame 0 is the
closed mouth, and frames 1–3 cycle while TTS audio is playing.

## Lip-sync Portraits (`spriteVisemes`)

`spriteVisemes` is optional and turns on lip-sync mode. While a line plays, the portrait shows
mouth shapes worked out from the line's text (see `js/minigames/person-chat/lip-sync.js`), and shows
`rest` when silent. The TTS manager decodes each line's audio and `alignToEnvelope` fits the shapes
to its loudness curve: open vowels on loud stretches, closed lips and f/v/s in the dips, punctuation
on silences, and anything near-silent at rest. An "a" shows `wide_open` only on the line's loudest
peaks (`WIDE_OPEN_MIN`), otherwise `medium_open`: most are unstressed, and wide is the shape most
likely to look overdone. Until that is ready (a few ms), or if decoding fails,
the shapes are spread evenly over the line, held at least 100 ms, and closed whenever the live level
drops. If the field is absent or either file
fails to load, the portrait falls back to `spriteTalk` as above.

```json
"spriteVisemes": "assets/characters/bernie_nwosu_visemes.png"
```

Asset format (produced by `tools/pixellab_pipeline.py`):

- `<key>_visemes.png`: one row of `frameSize`×`frameSize` cells (128px, transparent), each the
  full bust with one mouth shape; the body is identical in every cell.
- `<key>_visemes.json` beside it: `{"frameSize": 128, "visemes": ["rest", "closed", "small_open",
  "medium_open", "wide_open", "round", "teeth"]}`, where `visemes[i]` names column `i`. Smaller
  or differently named sets work too; missing shapes fall back to the nearest one, then `rest`
  (Bernie's sheet has no `closed`: her resting mouth is already closed lips).
- An optional `blink` column (eyes shut, mouth at rest) makes the portrait blink for 130 ms every
  2–6 s whenever the mouth is resting, including pauses mid-line. Each NPC's id seeds its own
  schedule, so two portraits never blink in step.

## Adding New Characters

### From PixelLab (API, preferred)

```bash
python3 tools/pixellab_pipeline.py animate <pixellab.ai character URL>          # fill in the standard six animations
python3 tools/pixellab_pipeline.py import <URL> --key <spriteSheet key>
```

`import` downloads the character ZIP, renames web-UI animation folders to template ids, reapplies committed frame fixes from `tools/pixellab_overrides/`, pads 60×60 Pro frames to 80×80 (feet on row 69, to match the collision box), and writes `<key>.png/.json/_headshot.png`. Nothing needs adding to `game.js`: use `"spriteSheet": "<key>"`. See `.claude/skills/pixellab-character-pipeline/SKILL.md` for reviewing and repairing bad frames (`qa`, `fix`).

### From PixelLab (manual ZIP download)

1. Export character animations from PixelLab
2. Run the conversion script:
   ```bash
   python tools/convert_pixellab_to_spritesheet.py \
       ~/Downloads/characters \
       ./public/break_escape/assets/characters
   ```
3. Use in scenario with `"spriteSheet": "character_key"`, where `character_key` is the file name without extension. Nothing needs adding to `game.js`.

### Custom Sprites

For custom sprites, use the legacy format with frame-based configuration:

1. Create a sprite sheet with consistent frame size (e.g., 64x64)
2. Load in `game.js`:
   ```javascript
   this.load.spritesheet('custom_sprite', 'characters/custom.png', {
       frameWidth: 64,
       frameHeight: 64
   });
   ```
3. Configure frame ranges in scenario JSON

## Migration Guide

To migrate NPCs from legacy to atlas format:

1. Choose an appropriate atlas character from the available list
2. Update `spriteSheet` value to the atlas key
3. Replace frame-based config:
   ```json
   // Old
   "spriteConfig": {
     "idleFrameStart": 20,
     "idleFrameEnd": 23
   }
   
   // New
   "spriteConfig": {
     "idleFrameRate": 8,
     "walkFrameRate": 10
   }
   ```

## Character Assignment Examples

Based on M01 First Contact scenario:

- **Agent 0x00** (Player) → `female_hacker_hood` - Main protagonist, mysterious hacker
- **Agent 0x99** (Briefing) → `male_spy` - Handler/coordinator
- **Sarah Martinez** → `female_office_worker` - Corporate office worker
- **Kevin Park** → `male_nerd` - IT support/nerdy character
- **Maya Chen** → `female_scientist` - Research scientist
- **Derek Lawson** → `male_security_guard` - Security personnel

## Troubleshooting

### Sprite Not Loading

- Check that the scenario's `spriteSheet` matches the file name exactly (`<key>.png` and `<key>.json`); the validator reports a key that doesn't resolve
- Verify PNG and JSON files exist in `public/break_escape/assets/characters/`
- A `was not preloaded; loading on demand` warning means the key wasn't in the scenario's `characterSprites` list (for example an NPC added outside `rooms[*].npcs`)
- Check browser console for texture loading errors

### Animations Not Playing

- Verify `spriteConfig` uses correct format (frameRate vs frameStart/frameEnd)
- Check console for animation creation logs
- Ensure JSON atlas includes animation metadata

### Wrong Direction/Animation

- Atlas format uses automatic 8-directional mapping
- Check that the atlas JSON includes all required directions
- Verify direction mapping in `npc-sprites.js`

## Performance

Atlas sprites provide better performance:
- ✅ Single texture per character (efficient GPU usage)
- ✅ Pre-defined animations (no runtime generation)
- ✅ Optimized frame packing (2px padding prevents bleeding)
- ✅ 16 characters = 16 requests vs 2500+ individual frames
