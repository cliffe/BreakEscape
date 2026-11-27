# Phone Badge System - Implementation Summary

**Completed:** 2025-10-30  
**Status:** ✅ Fully Functional

## Overview

The phone badge system provides a visual indicator of unread NPC messages on phone items in the inventory. The badge appears as a green number in the top-right corner of the phone icon, matching the phone's LCD screen aesthetic.

## Features

### 1. Unread Message Indicator
- **Visual Design**: Green badge (#5fcf69) with black text and 2px border
- **Position**: Top-right corner of inventory slot (top: -5px, right: -5px)
- **Content**: Total count of unread NPC messages across all NPCs on that phone
- **Styling**: VT323 font, 20x20px, pixel-art aesthetic (no border-radius)

### 2. Dynamic Updates
Badge updates automatically when:
- Phone is added to inventory (with intro messages preloaded)
- Phone-chat minigame is closed (after reading messages)
- Timed messages are delivered to the phone
- Any NPC message is marked as read/unread

### 3. Intro Message Preloading
When a phone is added to inventory:
1. Creates temporary InkEngine instance
2. Loads Ink stories for all NPCs on the phone
3. Navigates to start knot and gets intro message
4. Adds intro messages to conversation history (marked as preloaded)
5. Saves NPC story state to prevent replay
6. Creates badge with correct initial count

## Implementation Details

### Files Modified

#### `js/systems/inventory.js`
```javascript
// Import InkEngine for preloading
import InkEngine from './ink/ink-engine.js?v=1';

// Helper function to preload intro messages
async function preloadPhoneIntroMessages(phoneId) {
  // Creates temp engine, loads stories, preloads intros
}

// Update badge with unread count
export function updatePhoneBadge(phoneId) {
  // Finds phone items by phoneId
  // Gets total unread count from NPCManager
  // Creates/removes badge DOM element as needed
}

// When adding phone to inventory
if (sprite.scenarioData?.type === 'phone' && sprite.scenarioData?.phoneId) {
  // Preload intro messages, then create badge
  preloadPhoneIntroMessages(phoneId).then(() => {
    // Create badge element if unread count > 0
  });
}
```

**Lines Added:** ~90 lines (preload function + badge logic)

#### `css/inventory.css`
```css
/* Phone badge styling */
.inventory-slot {
  position: relative;
}

.inventory-slot .phone-badge {
  display: block;
  position: absolute;
  top: -5px;
  right: -5px;
  background: #5fcf69; /* Phone LCD green */
  color: #000;
  border: 2px solid #000;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  line-height: 16px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.8);
  z-index: 10;
  border-radius: 0; /* Pixel-art aesthetic */
}
```

**Lines Added:** ~25 lines

#### `js/systems/npc-manager.js`
```javascript
// Get total unread count for a specific phone
getTotalUnreadCount(phoneId) {
  const npcs = this.getNPCsByPhone(phoneId);
  let total = 0;
  
  npcs.forEach(npc => {
    const history = this.conversationHistory.get(npc.id) || [];
    const unreadCount = history.filter(msg => 
      msg.type === 'npc' && !msg.read
    ).length;
    total += unreadCount;
  });
  
  return total;
}

// Register NPC with timed messages
registerNPC(id, opts = {}) {
  // ... existing code ...
  
  // Schedule timed messages if defined
  if (entry.timedMessages && Array.isArray(entry.timedMessages)) {
    entry.timedMessages.forEach(msg => {
      this.scheduleTimedMessage({
        npcId: realId,
        text: msg.message,
        delay: msg.delay,
        phoneId: entry.phoneId
      });
    });
  }
}

// Deliver timed message and update badge
_deliverTimedMessage(message) {
  // Add message to history
  this.addMessage(message.npcId, 'npc', message.text, { timed: true });
  
  // Update phone badge
  if (window.updatePhoneBadge && message.phoneId) {
    window.updatePhoneBadge(message.phoneId);
  }
  
  // Show bark notification
  // ...
}
```

**Lines Modified:** ~50 lines

#### `js/minigames/phone-chat/phone-chat-minigame.js`
```javascript
complete() {
  // Update phone badge when closing
  if (window.updatePhoneBadge && this.phoneId) {
    window.updatePhoneBadge(this.phoneId);
  }
  // ... rest of complete logic
}

async preloadIntroMessages() {
  // ... preload logic ...
  
  // Update phone badge after preloading
  if (window.updatePhoneBadge && this.phoneId) {
    window.updatePhoneBadge(this.phoneId);
  }
}
```

**Lines Modified:** ~10 lines

### Global Exports
```javascript
// inventory.js
window.updatePhoneBadge = updatePhoneBadge;

// Usage anywhere:
window.updatePhoneBadge('player_phone');
```

## Technical Decisions

### Why Real DOM Elements Instead of CSS Pseudo-elements?
Initially attempted using `::after` with `content: attr(data-unread-count)`, but:
- Browser compatibility issues with CSS `attr()` function
- `attr()` showing as strike-through in dev tools
- Pseudo-elements harder to debug and manipulate

**Solution:** Create real `<span class="phone-badge">` elements via JavaScript
- More reliable across browsers
- Easier to debug (visible in DOM inspector)
- Can be dynamically created/removed without CSS tricks

### Why Preload Intro Messages?
Without preloading:
- Badge would show 0 on game load
- Badge would only update after opening phone once
- Poor UX - player wouldn't know there are messages

**Solution:** Preload intro messages when phone added to inventory
- Badge shows correct count immediately
- Messages already in history when phone opened
- Better UX - player sees indicator right away

### Why Separate InkEngine Instances?
Each conversation needs its own story state:
- Variables are per-story
- Knots visited are tracked per-instance
- Multiple NPCs can't share the same engine

**Solution:** Create temporary engine for preloading
- Isolated from active conversations
- Clean state for each preload
- Matches phone-chat minigame pattern

## Usage Examples

### Scenario JSON with Timed Messages
```json
{
  "npcs": [
    {
      "id": "gossip_girl",
      "displayName": "Gossip Girl",
      "storyPath": "scenarios/ink/gossip-girl.json",
      "phoneId": "player_phone",
      "timedMessages": [
        {
          "delay": 5000,
          "message": "Hey! 👋 Got any juicy gossip for me today?",
          "type": "text"
        }
      ]
    }
  ],
  "startItemsInInventory": [
    {
      "type": "phone",
      "name": "Your Phone",
      "phoneId": "player_phone",
      "npcIds": ["neye_eve", "gossip_girl"]
    }
  ]
}
```

### Manual Badge Update
```javascript
// After manually adding a message
window.npcManager.addMessage('npc_id', 'npc', 'New message text');
window.updatePhoneBadge('player_phone');
```

## Testing

### Test Scenario
1. Load game with `ceo_exfil.json` scenario
2. Badge should show "2" on phone (Neye Eve + Gossip Girl intros)
3. After 5 seconds, badge updates to "3" (timed message from Gossip Girl)
4. Bark notification appears above inventory
5. Click phone in inventory
6. Read all messages
7. Close phone
8. Badge disappears (count = 0)

### Expected Behavior
- ✅ Badge appears immediately on load with correct count
- ✅ Badge updates when timed messages arrive
- ✅ Badge updates when phone closes after reading
- ✅ Badge disappears when all messages read
- ✅ Bark notifications trigger badge updates

## Integration Points

### For Game Systems
```javascript
// When adding NPC message programmatically
window.npcManager.addMessage(npcId, 'npc', messageText);
window.updatePhoneBadge(phoneId);

// When marking messages as read
messages.forEach(msg => msg.read = true);
window.updatePhoneBadge(phoneId);
```

### For Scenario Designers
```json
// Define timed messages in NPC config
{
  "timedMessages": [
    { "delay": 10000, "message": "First timed message" },
    { "delay": 30000, "message": "Second timed message" }
  ]
}
```

## Known Limitations

1. **Badge position**: Fixed at top-right of slot
   - Works for all inventory items
   - May overlap if item has very wide sprite

2. **Count display**: Shows total number
   - No breakdown by NPC
   - No indication of message priority

3. **Phone detection**: Uses `data-phone-id` attribute
   - Must be set when phone added to inventory
   - No fallback if attribute missing

## Future Enhancements

### Potential Improvements
- [ ] Different badge colors for urgent messages
- [ ] Animated badge pulse when new message arrives
- [ ] Breakdown tooltip (e.g., "2 from Alice, 1 from Bob")
- [ ] Badge on phone button in bottom-right corner
- [ ] Sound effect when badge count increases

### Alternative Designs Considered
- **Multiple badges**: One per NPC (rejected - too cluttered)
- **Badge animation**: Pulse/glow effect (deferred - keep simple)
- **Badge on phone button**: Global phone access (planned for Phase 3)

## Documentation Updates

- ✅ `01_IMPLEMENTATION_LOG.md` - Added badge system section
- ✅ `PHONE_BADGE_FEATURE.md` - This document
- ✅ Code comments in inventory.js, npc-manager.js
- ✅ Updated bug fixes list

## Summary

The phone badge system successfully provides visual feedback for unread NPC messages. The implementation uses real DOM elements for reliability, preloads intro messages for immediate feedback, and integrates seamlessly with the existing NPC/phone-chat systems.

**Total Implementation Time:** ~4 hours  
**Total Lines Added/Modified:** ~175 lines across 5 files  
**Bug Fixes Required:** 4 (CSS attr(), InkEngine import, preload timing, timed message delays)

---
**Status:** ✅ Complete and tested in `ceo_exfil.json` scenario
