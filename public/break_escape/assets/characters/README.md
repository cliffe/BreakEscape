# BreakEscape Character Sprite Sheets

This directory contains all character sprite sheets for the BreakEscape Phaser.js game.

## Quick Reference

**Location:** `public/break_escape/assets/characters/`  
**Format:** PNG sprite sheets + JSON atlases  
**Frame Size:** 80x80 pixels  
**Total Characters:** 16 PixelLab characters + legacy assets  

## Available Characters

### PixelLab Characters (80x80, 8-directional)

Each character includes:
- `.png` - Sprite sheet with all animation frames
- `.json` - Phaser atlas with frame positions and animation metadata

| Character | Animations | Frames | File |
|-----------|------------|--------|------|
| Female Hacker (Hood Up) | 48 | 256 | `female_woman_hacker_in_a_hoodie_hood_up_black_ob` |
| Female Office Worker | 32 | 152 | `female_woman_office_worker_blonde_bob_hair_with_f_(2)` |
| Female Security Guard | 40 | 208 | `female_woman_security_guard_uniform_tan_black_s` |
| Hacker (Obscured Face) | 40 | 208 | `hacker_in_a_hoodie_hood_up_black_obscured_face_sh` |
| Hacker in Hoodie | 40 | 208 | `hacker_in_hoodie_(1)` |
| Telecom Worker | 37 | 182 | `high_vis_vest_polo_shirt_telecom_worker` |
| Mad Scientist | 30 | 170 | `mad_scientist_white_hair_lab_coat_lab_coat_jeans` |
| Office Worker (Male) | 40 | 224 | `office_worker_white_shirt_and_tie_(7)` |
| Nerd (Red T-Shirt) | 40 | 208 | `red_t-shirt_jeans_sneakers_short_beard_glasses_ner_(3)` |
| Security Guard (Male) | 40 | 208 | `security_guard_uniform_(3)` |
| Spy (Male) | 40 | 208 | `spy_in_trench_oat_duffel_coat_trilby_hat_fedora_my` |
| Female Hacker | 37 | 182 | `woman_female_hacker_in_hoodie` |
| Female Telecom Worker | 24 | 128 | `woman_female_high_vis_vest_polo_shirt_telecom_w` |
| Female Spy | 40 | 208 | `woman_female_spy_in_trench_oat_duffel_coat_trilby` |
| Female Scientist | 30 | 170 | `woman_in_science_lab_coat` |
| Woman with Bow | 31 | 149 | `woman_with_black_long_hair_bow_in_hair_long_sleeve_(1)` |

### Legacy Assets

- `hacker.png` - Original hacker sprite
- `hacker-red.png` - Red variant hacker sprite
- `hacker-talk.png` - Hacker talking sprite
- `hacker-red-talk.png` - Red hacker talking sprite
- `Sprite-0003.png` - Legacy sprite

## Loading in Phaser.js

### Basic Loading

```javascript
function preload() {
    this.load.atlas(
        'hacker',
        'break_escape/assets/characters/female_woman_hacker_in_a_hoodie_hood_up_black_ob.png',
        'break_escape/assets/characters/female_woman_hacker_in_a_hoodie_hood_up_black_ob.json'
    );
}
```

### Create Animations Automatically

```javascript
function create() {
    const sprite = this.add.sprite(400, 300, 'hacker');
    
    // Load atlas data
    const atlasData = this.cache.json.get('hacker');
    
    // Create all animations from metadata
    for (const [animKey, frames] of Object.entries(atlasData.animations)) {
        this.anims.create({
            key: animKey,
            frames: frames.map(f => ({key: 'hacker', frame: f})),
            frameRate: 8,
            repeat: -1
        });
    }
    
    // Play an animation
    sprite.play('walk_east');
}
```

## Animation Types

All PixelLab characters support these animation types (8 directions each):

- **breathing-idle** - Idle breathing (4 frames)
- **walk** - Walking (6 frames)
- **cross-punch** - Punching (6 frames)
- **lead-jab** - Quick jab (3 frames)
- **falling-back-death** - Death animation (7 frames)
- **taking-punch** - Getting hit (6 frames) *(some characters)*
- **pull-heavy-object** - Pushing/pulling (6 frames) *(some characters)*

### Directions

Each animation supports 8 directions:
- `east`, `west`, `north`, `south`
- `north-east`, `north-west`, `south-east`, `south-west`

### Animation Keys

Animation keys follow the format: `{type}_{direction}`

Examples:
- `breathing-idle_east`
- `walk_north`
- `cross-punch_south-west`
- `falling-back-death_north-east`

## Documentation

- **`SPRITE_SHEETS_SUMMARY.md`** - Detailed breakdown of all characters and animations
- **`tools/README_SPRITE_CONVERTER.md`** - Conversion tool documentation

## Performance

Using sprite sheets provides significant benefits:

✅ **16 HTTP requests** instead of ~2,500+ individual files  
✅ **Single GPU texture** per character  
✅ **Faster rendering** and frame switching  
✅ **Optimized memory** usage  

## Regenerating Sprite Sheets

To regenerate or add new characters:

```bash
python tools/convert_pixellab_to_spritesheet.py \
    ~/Downloads/characters \
    ./public/break_escape/assets/characters
```

See `tools/README_SPRITE_CONVERTER.md` for full documentation.
