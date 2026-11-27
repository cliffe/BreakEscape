# Container Minigame Usage

## Overview

The Container Minigame allows players to interact with container items (like suitcases, briefcases, etc.) that contain other items. The minigame provides a visual interface similar to the player inventory, showing the container's contents in a grid layout.

## Features

- **Visual Container Display**: Shows an image of the container item with its name and observations
- **Contents Grid**: Displays all items within the container in a grid layout similar to the player inventory
- **Item Interaction**: Players can click on individual items to add them to their inventory
- **Notes Handling**: Notes items automatically trigger the notes minigame instead of being added to inventory
- **Container Collection**: If the container itself is takeable, players can add the entire container to their inventory
- **Unlock Integration**: Automatically launches after successfully unlocking a locked container

## Usage

### Automatic Launch
The container minigame automatically launches when:
1. A player interacts with an unlocked container that has contents
2. A player successfully unlocks a locked container (after the unlock minigame completes)

### Manual Launch
You can manually start the container minigame using:
```javascript
window.startContainerMinigame(containerItem, contents, isTakeable);
```

### Parameters
- `containerItem`: The sprite object representing the container
- `contents`: Array of items within the container
- `isTakeable`: Boolean indicating if the container itself can be taken

## Scenario Data Structure

### Container Item
```json
{
    "type": "suitcase",
    "name": "CEO Briefcase",
    "takeable": false,
    "locked": true,
    "lockType": "key",
    "requires": "briefcase_key:45,35,25,15",
    "difficulty": "medium",
    "observations": "An expensive leather briefcase with a sturdy lock",
    "contents": [
        {
            "type": "notes",
            "name": "Private Note",
            "takeable": true,
            "readable": true,
            "text": "Closet keypad code: 7391 - Must move evidence to safe before audit",
            "observations": "A hastily written note on expensive paper"
        },
        {
            "type": "key",
            "name": "Safe Key",
            "takeable": true,
            "opens_lock": "safe_key",
            "keyPins": [52, 29, 44, 37],
            "observations": "A heavy-duty safe key hidden behind server equipment"
        }
    ]
}
```

### Content Items
Each item in the `contents` array should have:
- `type`: The item type (used for image path: `assets/objects/{type}.png`)
- `name`: Display name for the item
- `takeable`: Whether the item can be taken by the player
- Additional properties as needed (observations, text, `id`, `opens_lock`, etc.)

## Integration with Unlock System

The container minigame integrates seamlessly with the existing unlock system:

1. **Locked Container**: When a player interacts with a locked container, the unlock minigame starts
2. **Successful Unlock**: After successful unlocking, the container minigame automatically launches
3. **Unlock State**: The container's `isUnlockedButNotCollected` flag is set to prevent automatic collection

## Visual Design

- **Container Image**: Large image of the container item at the top
- **Container Info**: Name and observations displayed below the image
- **Contents Grid**: Grid layout showing all items within the container
- **Item Tooltips**: Hover tooltips showing item names
- **Action Buttons**: "Take Container" (if takeable) and "Close" buttons

## Styling

The minigame uses the following CSS classes:
- `.container-minigame`: Main container
- `.container-image-section`: Container image and info
- `.container-contents-grid`: Grid of container contents
- `.container-content-slot`: Individual item slots
- `.container-content-item`: Item images
- `.container-actions`: Action buttons

## Testing

Use the test file `test-container-minigame.html` to test the container minigame functionality with sample data.

## Example Scenario

The CEO Briefcase in the `ceo_exfil.json` scenario demonstrates a complete container implementation:
- Locked with a key requirement
- Contains a private note with important information (triggers notes minigame when clicked)
- Contains a safe key for further progression
- Automatically launches the container minigame after unlocking

### Notes Item Behavior
When a notes item is clicked in the container minigame:
1. The note is immediately removed from the container display
2. A success message shows "Read [Note Name]"
3. The container state is saved for return after reading
4. The container minigame closes
5. The notes minigame opens with the note's text and observations
6. The note is automatically added to the player's notes collection
7. **After closing the notes minigame, the player automatically returns to the container minigame**
8. If the container becomes empty, it shows "This container is empty"

**Special Exception**: Unlike other minigames that close all other minigames, the notes minigame from containers has a special return flow that brings the player back to the container after reading.
