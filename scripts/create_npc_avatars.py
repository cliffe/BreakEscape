#!/usr/bin/env python3
"""
Create simple 32x32px pixel-art NPC avatars
"""
from PIL import Image, ImageDraw

def create_helper_avatar():
    """Create a friendly helper avatar (green theme)"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Head (beige)
    head_color = (255, 220, 177)
    draw.ellipse([8, 6, 24, 22], fill=head_color, outline=(0, 0, 0))
    
    # Eyes (friendly)
    draw.rectangle([11, 12, 13, 14], fill=(0, 0, 0))
    draw.rectangle([19, 12, 21, 14], fill=(0, 0, 0))
    
    # Smile
    draw.arc([12, 14, 20, 20], 0, 180, fill=(0, 0, 0), width=1)
    
    # Body (green shirt - helpful)
    body_color = (95, 207, 105)  # Match game's green theme
    draw.rectangle([10, 22, 22, 32], fill=body_color, outline=(0, 0, 0))
    
    # Arms
    draw.rectangle([6, 24, 9, 30], fill=body_color, outline=(0, 0, 0))
    draw.rectangle([23, 24, 26, 30], fill=body_color, outline=(0, 0, 0))
    
    # Hands (beige)
    draw.rectangle([6, 30, 9, 32], fill=head_color)
    draw.rectangle([23, 30, 26, 32], fill=head_color)
    
    return img

def create_adversary_avatar():
    """Create a suspicious adversary avatar (red theme)"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Head (beige)
    head_color = (255, 220, 177)
    draw.ellipse([8, 6, 24, 22], fill=head_color, outline=(0, 0, 0))
    
    # Eyes (suspicious/narrowed)
    draw.line([11, 13, 13, 13], fill=(0, 0, 0), width=2)
    draw.line([19, 13, 21, 13], fill=(0, 0, 0), width=2)
    
    # Frown
    draw.arc([12, 16, 20, 22], 180, 360, fill=(0, 0, 0), width=1)
    
    # Body (red shirt - warning)
    body_color = (220, 50, 50)
    draw.rectangle([10, 22, 22, 32], fill=body_color, outline=(0, 0, 0))
    
    # Arms
    draw.rectangle([6, 24, 9, 30], fill=body_color, outline=(0, 0, 0))
    draw.rectangle([23, 24, 26, 30], fill=body_color, outline=(0, 0, 0))
    
    # Hands (beige)
    draw.rectangle([6, 30, 9, 32], fill=head_color)
    draw.rectangle([23, 30, 26, 32], fill=head_color)
    
    return img

def create_neutral_avatar():
    """Create a neutral NPC avatar (gray theme)"""
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Head (beige)
    head_color = (255, 220, 177)
    draw.ellipse([8, 6, 24, 22], fill=head_color, outline=(0, 0, 0))
    
    # Eyes (neutral)
    draw.ellipse([11, 12, 13, 14], fill=(0, 0, 0))
    draw.ellipse([19, 12, 21, 14], fill=(0, 0, 0))
    
    # Neutral mouth (straight line)
    draw.line([12, 17, 20, 17], fill=(0, 0, 0), width=1)
    
    # Body (gray shirt - neutral)
    body_color = (160, 160, 173)  # Match game's gray
    draw.rectangle([10, 22, 22, 32], fill=body_color, outline=(0, 0, 0))
    
    # Arms
    draw.rectangle([6, 24, 9, 30], fill=body_color, outline=(0, 0, 0))
    draw.rectangle([23, 24, 26, 30], fill=body_color, outline=(0, 0, 0))
    
    # Hands (beige)
    draw.rectangle([6, 30, 9, 32], fill=head_color)
    draw.rectangle([23, 30, 26, 32], fill=head_color)
    
    return img

if __name__ == '__main__':
    import os
    
    # Create avatars directory if it doesn't exist
    avatars_dir = 'assets/npc/avatars'
    os.makedirs(avatars_dir, exist_ok=True)
    
    # Create and save avatars
    helper = create_helper_avatar()
    helper.save(os.path.join(avatars_dir, 'npc_helper.png'))
    print('✅ Created npc_helper.png (green, friendly)')
    
    adversary = create_adversary_avatar()
    adversary.save(os.path.join(avatars_dir, 'npc_adversary.png'))
    print('✅ Created npc_adversary.png (red, suspicious)')
    
    neutral = create_neutral_avatar()
    neutral.save(os.path.join(avatars_dir, 'npc_neutral.png'))
    print('✅ Created npc_neutral.png (gray, neutral)')
    
    print('\n✅ All NPC avatars created successfully!')
    print('Files saved to:', avatars_dir)
