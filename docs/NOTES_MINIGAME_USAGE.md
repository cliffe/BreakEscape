# Notes Minigame Usage

The Notes Minigame provides an interactive way to display note content with a notepad background and allows players to add notes to their inventory.

## Features

- Displays note content on a notepad background (`/assets/mini-games/notepad.png`)
- Shows observation text below the main content (if provided)
- Provides a "Add to Inventory" button with backpack icon (`/assets/mini-games/backpack.png`)
- Integrates with the existing inventory system
- Uses the minigame framework for consistent UI

## Usage in Scenarios

To use the notes minigame in your scenario files, add the following properties to note objects:

```json
{
  "type": "notes",
  "name": "Example Note",
  "takeable": true,
  "readable": true,
  "text": "This is the main content of the note.\n\nIt can contain multiple lines and will be displayed on the notepad background.",
  "observations": "The handwriting appears rushed and there are coffee stains on the paper."
}
```

### Required Properties

- `type`: Must be "notes"
- `text`: The main content to display on the notepad
- `readable`: Must be true to trigger the minigame

### Optional Properties

- `observations`: Additional observation text displayed below the main content
- `takeable`: Whether the note can be added to inventory (default: true)

## Programmatic Usage

You can also start the notes minigame programmatically:

```javascript
// Basic usage
window.startNotesMinigame(item, text, observations);

// Example
const testItem = {
  scene: null,
  scenarioData: {
    type: 'notes',
    name: 'Test Note',
    text: 'This is a test note content.',
    observations: 'The note appears to be written in haste.'
  }
};

window.startNotesMinigame(testItem, testItem.scenarioData.text, testItem.scenarioData.observations);

// Show mission brief
window.showMissionBrief();
```

## Features

### Navigation
- **Previous/Next Buttons**: Navigate through collected notes
- **Search Functionality**: Search through note titles and content
- **Note Counter**: Shows current position (e.g., "2 / 5")

### Mission Brief Integration
- The mission brief is automatically displayed via the notes minigame when starting a new scenario
- Uses the same notepad interface for consistency
- Automatically added to the notes system as an important note

### Search
- Real-time search through note titles and content
- Case-insensitive matching
- Filters the note list to show only matching results
- Clear search to show all notes again

### Player Notes
- **Edit Observations**: Click the edit button (✏️) to add or modify observations
- **Handwritten Style**: Player notes use the same handwritten font as original observations
- **Persistent Storage**: Player notes are saved to the notes system and persist between sessions
- **Visual Feedback**: Dashed border and background indicate editable areas

### Visual Effects
- **Celotape Effect**: Realistic celotape strip overlapping the top of the text box
- **Binder Holes**: Small circular holes on the left side of the text box
- **Handwritten Fonts**: Uses Google Fonts 'Kalam' for authentic handwritten appearance

## Automatic Collection

- **Auto-Collection**: Notes are automatically added to the notes system when the minigame starts
- **Scene Removal**: Notes are automatically removed from the scene after being collected
- **No Manual Action**: Players don't need to click "Add to Inventory" - it happens automatically
- **Seamless Experience**: Notes are collected and removed from the world in one smooth interaction

## Integration

The notes minigame is automatically integrated into the interaction system. When a player interacts with a note object that has `text`, the minigame will be triggered instead of the default text display. The note is automatically collected and removed from the scene.
