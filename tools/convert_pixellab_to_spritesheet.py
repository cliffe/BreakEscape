#!/usr/bin/env python3
"""
Convert PixelLab character animations into Phaser.js sprite sheets.

This script scans a directory of character animations exported from PixelLab
and converts them into optimized sprite sheets with Phaser.js-compatible JSON atlases.

Usage:
    python convert_pixellab_to_spritesheet.py <input_dir> <output_dir>
    
Example:
    python convert_pixellab_to_spritesheet.py ~/Downloads/characters ./assets/sprites
"""

import os
import re
import sys
import json
from pathlib import Path
from PIL import Image
import argparse


def normalize_anim_type(raw_name):
    """
    Normalize a PixelLab animation directory name to lowercase-hyphen format.

    New PixelLab exports use PascalCase with underscores and a unique hash suffix,
    e.g. 'Breathing_Idle-9fa0f8f5'. Old exports used 'breathing-idle'.
    This strips the hash and produces the canonical form expected by the game's
    animTypeMap in npc-sprites.js.

    PixelLab uses the bare name 'animation-XXXXXXXX' (no descriptive prefix) when
    it cannot identify the animation type — in practice this is always a walk cycle.

    Examples:
        'Breathing_Idle-9fa0f8f5'     -> 'breathing-idle'
        'Cross_Punch-53585b01'        -> 'cross-punch'
        'Falling_Back_Death-2077851e' -> 'falling-back-death'
        'animation-96bfd644'          -> 'walk'
        'walk'                        -> 'walk'   (already normalised)
        'jab_attack'                  -> 'lead-jab' (web-UI display name)
    """
    # Strip trailing -XXXXXXXX hash (8 hex chars)
    name = re.sub(r'-[0-9a-f]{8}$', '', raw_name)
    # PascalCase_With_Underscores → lowercase-hyphen
    name = name.replace('_', '-').lower()
    # PixelLab uses the bare name 'animation' for unrecognised animations, which are walk cycles
    if name == 'animation':
        name = 'walk'
    # Web-UI animations are exported under their display names, not template ids.
    # 'animating' is left alone: it has been seen for idle, so it can't be guessed.
    return DISPLAY_NAME_ALIASES.get(name, name)


DISPLAY_NAME_ALIASES = {
    'walking': 'walk',
    'cross-punch-attack': 'cross-punch',
    'jab-attack': 'lead-jab',
    'taking-a-punch': 'taking-punch',
    'falling-backward': 'falling-back-death',
}


def resolve_export_root(character_dir):
    """
    Return the folder that holds animations/ (and rotations/).

    Web-UI exports put animations/ directly in the character folder. API exports
    (GET /v2/characters/{id}/zip) nest it one level down, in a folder named after
    the character state, e.g. 'Idle/animations/Walk/east/frame_000.png'.
    """
    character_dir = Path(character_dir)
    if (character_dir / 'animations').exists():
        return character_dir
    nested = [d for d in sorted(character_dir.iterdir()) if (d / 'animations').is_dir()]
    return nested[0] if nested else character_dir


def scan_character_animations(character_dir):
    """
    Scan a character directory and extract all animation frames.
    
    Returns a dictionary structure:
    {
        'character_name': str,
        'animations': {
            'breathing-idle': {
                'east': ['path/to/frame_000.png', ...],
                'north': [...],
                ...
            },
            'walk': {...},
            ...
        }
    }
    """
    character_dir = Path(character_dir)
    animations_dir = resolve_export_root(character_dir) / 'animations'

    if not animations_dir.exists():
        return None

    character_data = {
        'character_name': character_dir.name,
        'animations': {}
    }
    
    # Scan animation types (breathing-idle, walk, etc.)
    for anim_type_dir in sorted(animations_dir.iterdir()):
        if not anim_type_dir.is_dir():
            continue
            
        anim_type = normalize_anim_type(anim_type_dir.name)
        character_data['animations'][anim_type] = {}
        
        # Scan directions (east, north, etc.)
        for direction_dir in sorted(anim_type_dir.iterdir()):
            if not direction_dir.is_dir():
                continue
                
            direction = re.sub(r'-[0-9a-f]{8}$', '', direction_dir.name)

            # Skip duplicate direction variants (keep the first one encountered)
            if direction in character_data['animations'][anim_type]:
                continue

            # Collect frame files
            frames = sorted([
                f for f in direction_dir.iterdir()
                if f.suffix.lower() in ['.png', '.jpg', '.jpeg']
            ])

            character_data['animations'][anim_type][direction] = frames
    
    return character_data


def get_frame_size(frames):
    """Get the size of the first frame (assumes all frames are same size)."""
    if frames:
        with Image.open(frames[0]) as img:
            return img.size
    return (0, 0)


# The engine's collision boxes assume 80x80 frames with the feet near y=69
# (npc-sprites.js body offset 30,66; player.js 31,66). Newer PixelLab characters,
# e.g. Pro-mode ones, come out at 60x60 with the same on-screen figure height, so
# smaller frames are padded onto this canvas rather than changing the engine.
DEFAULT_CANVAS = 80
DEFAULT_FEET_Y = 69


def frame_offsets(character_data, canvas, feet_y):
    """
    Where to paste each frame on the canvas, keyed by source frame size.

    Frames are placed so the figure is centred horizontally and its feet land
    on feet_y. PixelLab characters usually share one frame size, but directions
    backfilled later can come back on a different canvas (e.g. 76x76 or 80x80
    south strips on a 60x60 character), so each size gets its own offset,
    from the median standing pose of that size. Within one size the offset is
    shared, so animations don't jitter.

    Returns ({(w, h): (x, y)}, (canvas_w, canvas_h)). With canvas=0, or when
    every frame already is canvas-sized, frames are pasted unchanged.
    """
    anims = character_data['animations']
    # Every animation starts from a standing pose, so the first frame of each strip gives a
    # feet line and centre. Take the median per frame size, so one odd strip (or a patched
    # frame) can't shift the whole character.
    samples = {}
    for directions in anims.values():
        for frames in directions.values():
            if not frames:
                continue
            with Image.open(frames[0]) as img:
                samples.setdefault(img.size, []).append(img.getbbox())
            for f in frames[1:]:
                with Image.open(f) as img:
                    samples.setdefault(img.size, [])
    if not canvas or all(size == (canvas, canvas) for size in samples):
        return {size: (0, 0) for size in samples}, next(iter(samples))
    offsets = {}
    for (w, h), boxes in samples.items():
        boxes = [b for b in boxes if b]
        if not boxes:
            offsets[(w, h)] = ((canvas - w) // 2, (canvas - h) // 2)
            continue
        feet = sorted(b[3] for b in boxes)[len(boxes) // 2]
        centre_x = sorted((b[0] + b[2]) // 2 for b in boxes)[len(boxes) // 2]
        offsets[(w, h)] = (canvas // 2 - centre_x, feet_y - feet)
    return offsets, (canvas, canvas)


def create_sprite_sheet(character_data, output_path, padding=2,
                        canvas=DEFAULT_CANVAS, feet_y=DEFAULT_FEET_Y):
    """
    Create a sprite sheet from all animation frames.

    Frames smaller than `canvas` are padded up to it (see frame_offset).
    Returns metadata about frame positions for the atlas JSON.
    """
    # Collect all frames in order
    all_frames = []
    frame_metadata = []
    
    for anim_type, directions in sorted(character_data['animations'].items()):
        for direction, frames in sorted(directions.items()):
            for frame_path in frames:
                frame_name = f"{anim_type}_{direction}_{frame_path.stem}"
                all_frames.append(frame_path)
                frame_metadata.append({
                    'path': frame_path,
                    'name': frame_name,
                    'animation': anim_type,
                    'direction': direction
                })
    
    if not all_frames:
        raise ValueError("No frames found!")
    
    # Get frame dimensions (assume all frames are same size)
    offsets, (frame_width, frame_height) = frame_offsets(character_data, canvas, feet_y)
    if list(offsets.values()) != [(0, 0)]:
        for size, off in offsets.items():
            print(f"  Placing {size[0]}x{size[1]} frames on {frame_width}x{frame_height} at offset {off}")
    
    # Calculate sprite sheet dimensions
    # Try to make it roughly square
    num_frames = len(all_frames)
    cols = int(num_frames ** 0.5) + 1
    rows = (num_frames + cols - 1) // cols
    
    sheet_width = cols * (frame_width + padding)
    sheet_height = rows * (frame_height + padding)
    
    # Create sprite sheet
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # Place frames on sprite sheet
    atlas_frames = {}
    
    for idx, (frame_path, metadata) in enumerate(zip(all_frames, frame_metadata)):
        col = idx % cols
        row = idx // cols
        
        x = col * (frame_width + padding)
        y = row * (frame_height + padding)
        
        # Paste frame onto sprite sheet
        with Image.open(frame_path) as frame_img:
            frame_img = frame_img.convert('RGBA')
            ox, oy = offsets[frame_img.size]
            # Paste through a cell-sized layer so an oversized frame can't bleed into neighbours
            cell = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
            cell.paste(frame_img, (ox, oy))
            sprite_sheet.paste(cell, (x, y))
        
        # Store frame position for atlas
        atlas_frames[metadata['name']] = {
            'frame': {
                'x': x,
                'y': y,
                'w': frame_width,
                'h': frame_height
            },
            'rotated': False,
            'trimmed': False,
            'spriteSourceSize': {
                'x': 0,
                'y': 0,
                'w': frame_width,
                'h': frame_height
            },
            'sourceSize': {
                'w': frame_width,
                'h': frame_height
            },
            'animation': metadata['animation'],
            'direction': metadata['direction']
        }
    
    # Save sprite sheet
    sprite_sheet.save(output_path)
    print(f"✓ Created sprite sheet: {output_path}")
    print(f"  Dimensions: {sheet_width}x{sheet_height}")
    print(f"  Frames: {num_frames}")
    print(f"  Frame size: {frame_width}x{frame_height}")
    
    return atlas_frames, frame_width, frame_height, offsets


def create_phaser_atlas(character_data, atlas_frames, sprite_sheet_filename, output_path, frame_width, frame_height):
    """
    Create a Phaser.js-compatible JSON atlas file.
    
    This uses the JSON Hash format which is widely supported by Phaser.
    """
    # Group frames by animation and direction for easy reference
    animations = {}
    
    for frame_name, frame_data in atlas_frames.items():
        anim_type = frame_data['animation']
        direction = frame_data['direction']
        
        anim_key = f"{anim_type}_{direction}"
        
        if anim_key not in animations:
            animations[anim_key] = []
        
        animations[anim_key].append(frame_name)
    
    # Create Phaser atlas structure
    atlas = {
        'frames': {},
        'meta': {
            'app': 'PixelLab to Phaser Converter',
            'version': '1.0',
            'image': sprite_sheet_filename,
            'format': 'RGBA8888',
            'size': {
                'w': 0,  # Will be calculated
                'h': 0
            },
            'scale': '1'
        },
        'animations': animations
    }
    
    # Add frame data
    for frame_name, frame_data in sorted(atlas_frames.items()):
        atlas['frames'][frame_name] = {
            'frame': frame_data['frame'],
            'rotated': frame_data['rotated'],
            'trimmed': frame_data['trimmed'],
            'spriteSourceSize': frame_data['spriteSourceSize'],
            'sourceSize': frame_data['sourceSize']
        }
    
    # Calculate actual sheet size from frames
    if atlas_frames:
        max_x = max(f['frame']['x'] + f['frame']['w'] for f in atlas_frames.values())
        max_y = max(f['frame']['y'] + f['frame']['h'] for f in atlas_frames.values())
        atlas['meta']['size'] = {'w': max_x, 'h': max_y}
    
    # Save atlas JSON
    with open(output_path, 'w') as f:
        json.dump(atlas, f, indent=2)
    
    print(f"✓ Created atlas JSON: {output_path}")
    print(f"  Animations: {len(animations)}")
    
    # Print animation summary
    print("\n  Animation Summary:")
    for anim_key in sorted(animations.keys()):
        frame_count = len(animations[anim_key])
        print(f"    - {anim_key}: {frame_count} frames")


def process_character(character_dir, output_dir, key=None, padding=2,
                      canvas=DEFAULT_CANVAS, feet_y=DEFAULT_FEET_Y):
    """
    Process a single character directory into <key>.png, <key>.json and
    <key>_headshot.png in output_dir.

    key defaults to a name derived from the folder (see sprite_name_map).
    tools/pixellab_pipeline.py calls this directly with an explicit key.
    """
    character_dir = Path(character_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\nProcessing: {character_dir.name}")
    print("=" * 60)
    
    # Scan character animations
    character_data = scan_character_animations(character_dir)
    
    if not character_data or not character_data['animations']:
        print(f"✗ No animations found in {character_dir}")
        return False
    
    # Map long directory names to short spriteSheet keys used in game.js
    sprite_name_map = {
        'female_woman_hacker_in_a_hoodie_hood_up_black_ob': 'female_hacker_hood',
        'female_woman_office_worker_blonde_bob_hair_with_f_(2)': 'female_office_worker',
        'female_woman_security_guard_uniform_tan_black_s': 'female_security_guard',
        'woman_female_hacker_in_hoodie': 'female_hacker',
        'woman_female_high_vis_vest_polo_shirt_telecom_w': 'female_telecom',
        'woman_female_spy_in_trench_oat_duffel_coat_trilby': 'female_spy',
        'woman_in_science_lab_coat': 'female_scientist',
        'woman_with_black_long_hair_bow_in_hair_long_sleeve_(1)': 'female_blowse',
        'hacker_in_a_hoodie_hood_up_black_obscured_face_sh': 'male_hacker_hood',
        'hacker_in_hoodie_(1)': 'male_hacker',
        'office_worker_white_shirt_and_tie_(7)': 'male_office_worker',
        'security_guard_uniform_(3)': 'male_security_guard',
        'high_vis_vest_polo_shirt_telecom_worker': 'male_telecom',
        'spy_in_trench_oat_duffel_coat_trilby_hat_fedora_my': 'male_spy',
        'mad_scientist_white_hair_lab_coat_lab_coat_jeans': 'male_scientist',
        'red_t-shirt_jeans_sneakers_short_beard_glasses_ner_(3)': 'male_nerd',
    }
    char_name = character_data['character_name']
    clean_name = key or sprite_name_map.get(char_name, char_name.lower().replace(' ', '_').replace('.', '').replace('_', '_'))

    # Create output files
    sprite_sheet_filename = f"{clean_name}.png"
    atlas_filename = f"{clean_name}.json"

    sprite_sheet_path = output_dir / sprite_sheet_filename
    atlas_path = output_dir / atlas_filename

    # Also update headshot filename to use clean_name
    
    # Create sprite sheet
    atlas_frames, frame_width, frame_height, offsets = create_sprite_sheet(
        character_data,
        sprite_sheet_path,
        padding=padding,
        canvas=canvas,
        feet_y=feet_y,
    )

    # Create atlas JSON
    create_phaser_atlas(
        character_data,
        atlas_frames,
        sprite_sheet_filename,
        atlas_path,
        frame_width,
        frame_height
    )

    # Extract headshot from south direction image (center top 32x32)
    # Priority: rotations/south.png (flat file at character root), then animations
    HEADSHOT_ANIM_PRIORITY = ['breathing-idle', 'walk', 'idle']
    try:
        south_source = None
        # 1. Check character_dir/rotations/south.png
        rotations_south = resolve_export_root(character_dir) / 'rotations' / 'south.png'
        if rotations_south.exists():
            south_source = rotations_south
        else:
            # 2. Fall back to first frame of a known animation with south direction
            south_frames = []
            for anim_candidate in HEADSHOT_ANIM_PRIORITY:
                south_frames = character_data['animations'].get(anim_candidate, {}).get('south', [])
                if south_frames:
                    break
            # 3. Last resort: any animation with a south direction
            if not south_frames:
                for anim_type, directions in character_data['animations'].items():
                    south_frames = directions.get('south', [])
                    if south_frames:
                        break
            if south_frames:
                south_source = south_frames[0]

        if south_source:
            with Image.open(south_source) as raw_south:
                # Apply the same padding as the atlas so the crop lands on the head
                south_img = Image.new('RGBA', (frame_width, frame_height), (0, 0, 0, 0))
                raw = raw_south.convert('RGBA')
                # Rotations may not share a size with any animation frame; place them the same way
                off = offsets.get(raw.size)
                if off is None and set(offsets.values()) == {(0, 0)}:
                    off = (0, 0)  # padding disabled (--canvas 0): paste unchanged
                if off is None:
                    bb = raw.getbbox() or (0, 0, raw.width, raw.height)
                    off = (frame_width // 2 - (bb[0] + bb[2]) // 2, feet_y - bb[3])
                south_img.paste(raw, off)
                # Calculate center top crop
                img_width, img_height = south_img.size
                headshot_size = 32
                left = (img_width - headshot_size) // 2
                upper = 16
                right = left + headshot_size
                lower = upper + headshot_size
                headshot = south_img.crop((left, upper, right, lower))
                headshot_filename = f"{clean_name}_headshot.png"
                headshot_path = output_dir / headshot_filename
                headshot.save(headshot_path)
                print(f"✓ Created headshot: {headshot_path}")
        else:
            print("✗ No south-facing image found for headshot extraction.")
    except Exception as e:
        print(f"✗ Error extracting headshot: {e}")

    print("\n✓ Character processing complete!")
    return True


def main():
    parser = argparse.ArgumentParser(
        description='Convert PixelLab character animations to Phaser.js sprite sheets'
    )
    parser.add_argument(
        'input_dir',
        help='Input directory containing character folders'
    )
    parser.add_argument(
        'output_dir',
        help='Output directory for sprite sheets and atlases'
    )
    parser.add_argument(
        '--padding',
        type=int,
        default=2,
        help='Padding between frames in pixels (default: 2)'
    )
    parser.add_argument(
        '--canvas',
        type=int,
        default=DEFAULT_CANVAS,
        help=f'Pad smaller frames up to this square size, 0 to disable (default: {DEFAULT_CANVAS})'
    )
    parser.add_argument(
        '--feet-y',
        type=int,
        default=DEFAULT_FEET_Y,
        help=f'Row the feet land on when padding (default: {DEFAULT_FEET_Y})'
    )
    
    args = parser.parse_args()
    
    input_dir = Path(args.input_dir).expanduser()
    output_dir = Path(args.output_dir).expanduser()
    
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}")
        sys.exit(1)
    
    print("PixelLab to Phaser.js Sprite Sheet Converter")
    print("=" * 60)
    print(f"Input: {input_dir}")
    print(f"Output: {output_dir}")
    
    # Find all character directories
    character_dirs = [d for d in input_dir.iterdir() if d.is_dir()]
    
    if not character_dirs:
        print(f"Error: No character directories found in {input_dir}")
        sys.exit(1)
    
    print(f"\nFound {len(character_dirs)} character(s) to process\n")
    
    # Process each character
    success_count = 0
    for char_dir in character_dirs:
        try:
            if process_character(char_dir, output_dir, padding=args.padding,
                                 canvas=args.canvas, feet_y=args.feet_y):
                success_count += 1
        except Exception as e:
            print(f"✗ Error processing {char_dir.name}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print(f"Processing complete: {success_count}/{len(character_dirs)} successful")


if __name__ == '__main__':
    main()
