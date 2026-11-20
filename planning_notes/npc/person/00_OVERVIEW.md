# Person NPC System - Overview

## Vision
Add in-person character NPCs to Break Escape that players can walk up to and converse with face-to-face. These NPCs will exist as sprite characters in the game world, similar to the player character, and trigger a cinematic conversation interface when interacted with.

## Key Features

### 1. **Sprite-Based NPCs**
- NPCs appear as animated character sprites in rooms
- Use the same sprite sheet format as the player (`assets/characters/hacker.png` initially)
- Can be positioned anywhere in a room via scenario JSON
- Have idle animations and potentially greet/wave animations
- Follow the same depth layering system as player (bottomY + 0.5)

### 2. **Person-Chat Minigame**
A new conversation interface distinct from the phone-chat:
- **Cinematic presentation**: Zoomed 4x character portraits during dialogue
- **Side-by-side layout**: NPC portrait on left, player portrait on right
- **Subtitle-style dialogue**: Text appears below/over the portraits
- **Choice selection**: Buttons or numbered choices below portraits
- **Real-time rendering**: Uses actual game sprites, not static images

### 3. **Dual Identity System**
The same character can exist in multiple forms:
- **Phone contact** (`npcType: "phone"`) - Messages via phone minigame
- **In-person character** (`npcType: "person"`) - Physical sprite in room
- **Both** (`npcType: "both"`) - Can message AND appear in person

**Shared state**: Both forms access the same Ink story and conversation history
- If you talk to someone in person, then call them, they remember what you discussed
- Variables like `trust_level` persist across both interaction types

### 4. **Natural Interaction**
- **Proximity-based**: Walk up to NPC, press E or click to talk
- **Visual feedback**: Interaction prompt appears when in range
- **Same system as objects**: Uses existing interaction distance checks
- **Event integration**: Triggers `npc_interacted` events for barks/reactions

## Architecture Components

### Core Systems to Extend
1. **NPCManager** (`js/systems/npc-manager.js`)
   - Add support for `npcType: "person"` and `npcType: "both"`
   - Track NPC sprite references and room locations
   
2. **Rooms System** (`js/core/rooms.js`)
   - Create NPC sprites during room loading
   - Position NPCs based on scenario data
   - Handle NPC depth layering
   
3. **Interaction System** (`js/systems/interactions.js`)
   - Detect proximity to NPC sprites
   - Show "Talk to [Name]" prompt
   - Trigger person-chat minigame on interaction

4. **Minigame Framework** (`js/minigames/`)
   - New `person-chat-minigame.js` module
   - Handles zoomed sprite rendering and dialogue display

### New Components to Create
1. **NPC Sprite Manager** (`js/systems/npc-sprites.js`)
   - Creates and manages NPC sprite instances
   - Handles animations (idle, speaking, etc.)
   - Updates NPC positions and states
   
2. **Person-Chat Minigame** (`js/minigames/person-chat/`)
   - `person-chat-minigame.js` - Main controller
   - `person-chat-ui.js` - UI rendering
   - `person-chat-portraits.js` - Sprite zoom/capture system
   
3. **CSS Styling** (`css/person-chat-minigame.css`)
   - Portrait containers
   - Subtitle text styling
   - Choice button layout

## Scenario Configuration

### NPC Definition (in `npcs` array)
```json
{
  "id": "tech_contact",
  "displayName": "Alex the Sysadmin",
  "storyPath": "scenarios/ink/tech-contact.json",
  "avatar": "assets/npc/avatars/npc_helper.png",
  "npcType": "both",
  "phoneId": "player_phone",
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrame": 20,
    "animPrefix": "idle"
  },
  "roomId": "server1",
  "position": { "x": 5, "y": 8 },
  "interactionDistance": 80
}
```

### Key Configuration Properties
- **`npcType`**: `"phone"`, `"person"`, or `"both"`
- **`roomId`**: Which room the NPC sprite appears in (only for person/both)
- **`position`**: Grid coordinates { x, y } or pixel coordinates { px, py }
- **`spriteSheet`**: Texture key (default: `"hacker"`)
- **`spriteConfig`**: Animation settings
- **`interactionDistance`**: How close player must be to interact (default: 80px)

## Person-Chat Minigame Design

### Visual Layout
```
╔═══════════════════════════════════════════════════════════╗
║  Person Chat - Alex the Sysadmin                    [X]   ║
╠═══════════════════════════════════════════════════════════╣
║                                                             ║
║   ┌─────────────┐              ┌─────────────┐            ║
║   │             │              │             │            ║
║   │  NPC Face   │              │ Player Face │            ║
║   │  (4x zoom)  │              │  (4x zoom)  │            ║
║   │             │              │             │            ║
║   └─────────────┘              └─────────────┘            ║
║      [NPC Name]                   [You]                    ║
║                                                             ║
║   ┌─────────────────────────────────────────────────┐     ║
║   │ "I've been watching the security logs all day.  │     ║
║   │  Something strange is going on..."               │     ║
║   └─────────────────────────────────────────────────┘     ║
║                                                             ║
║   [1] What did you notice?                                 ║
║   [2] Can you help me access the server?                   ║
║   [3] I'll come back later.                                ║
║                                                             ║
╠═══════════════════════════════════════════════════════════╣
║                                 [Add to Notepad] [Close]  ║
╚═══════════════════════════════════════════════════════════╝
```

### Zoom/Portrait System
Three potential approaches:
1. **RenderTexture**: Capture sprite region to texture, scale up
2. **Separate Camera**: Create zoomed camera focused on sprite
3. **Sprite Cloning**: Clone sprite at 4x scale, crop to face area

**Recommended**: RenderTexture approach for flexibility and performance

### Animation During Conversation
- **Speaking animation**: Subtle head bob or mouth movement
- **Idle animation**: Normal idle when not actively speaking
- **Choice selected**: Brief reaction animation
- **Conversation end**: Wave or nod before closing

## Dual Identity Implementation

### Conversation State Sharing
Both phone-chat and person-chat access the same:
- **InkEngine instance**: Single story state per NPC
- **Conversation history**: Shared message log
- **Variables**: Trust level, decisions, flags all persist

### UI Differences
| Feature | Phone-Chat | Person-Chat |
|---------|------------|-------------|
| Layout | Mobile phone interface | Cinematic portraits |
| Contact List | Shows all phone contacts | Single NPC conversation |
| Avatars | Small circular icons | 4x zoomed sprite faces |
| Context | Remote messaging | Face-to-face dialogue |
| Atmosphere | Asynchronous | Immediate presence |

### Example Dual Identity Flow
1. Player enters server room → sees Alex standing by terminal
2. Player walks up → "Talk to Alex" prompt appears
3. Player presses E → person-chat opens with zoomed portraits
4. Conversation: "Hey, I found something weird in the logs"
5. Player closes conversation → returns to game
6. Later, player opens phone → sees Alex in contacts
7. Player messages Alex → continues same conversation via phone
8. Alex remembers earlier in-person discussion

## Integration with Existing Systems

### Event System
New events for person NPCs:
- `npc_approached:npc_id` - Player enters interaction range
- `npc_interacted:npc_id` - Player starts conversation
- `npc_conversation_started:npc_id` - Person-chat opens
- `npc_conversation_ended:npc_id` - Person-chat closes

### Pathfinding
NPCs are static (for MVP):
- No pathfinding required initially
- Stand in fixed positions defined in scenario
- Future: Could add patrol routes or reactive movement

### Depth Layering
NPCs follow player depth rules:
```javascript
const npcBottomY = npc.y + npc.displayHeight / 2;
npc.setDepth(npcBottomY + 0.5);
```

### Collision
NPCs have collision bodies:
- Prevent player walking through NPCs
- Use same collision system as interactive objects
- Rectangular body based on sprite size

## Benefits of This System

### For Players
- **More immersive**: Face-to-face conversations feel more real
- **Visual storytelling**: See characters' faces during dialogue
- **Contextual**: Different conversations in different locations
- **Flexible**: Can message remotely OR talk in person

### For Scenario Designers
- **Expressive**: Place characters in narrative-appropriate locations
- **Flexible**: Mix phone and in-person interactions
- **Reusable**: Same character works in multiple contexts
- **Educational**: Can demonstrate different security interview techniques

### For Developers
- **Modular**: Reuses existing NPC/Ink systems
- **Extensible**: Easy to add new sprite types later
- **Consistent**: Follows established patterns (minigames, interactions)
- **Maintainable**: Separates concerns (sprites, UI, conversation logic)

## Future Enhancements

### Phase 2 Features
- **Multiple NPC sprite sheets**: Different character appearances
- **Animated reactions**: Characters respond visually to choices
- **Group conversations**: Talk to multiple NPCs at once
- **NPC movement**: Patrol routes, following player, etc.

### Phase 3 Features
- **Voice lines**: Audio clips for character voices
- **Emotion system**: NPCs show happiness, anger, worry
- **Dynamic positioning**: NPCs move based on story events
- **Multi-room NPCs**: Characters can relocate between areas

## Next Steps
See individual planning documents:
1. `01_SPRITE_SYSTEM.md` - NPC sprite creation and management
2. `02_PERSON_CHAT_MINIGAME.md` - Conversation interface design
3. `03_DUAL_IDENTITY.md` - Phone + person integration
4. `04_SCENARIO_SCHEMA.md` - JSON configuration reference
5. `05_IMPLEMENTATION_PHASES.md` - Development roadmap
