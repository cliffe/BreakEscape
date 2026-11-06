# Using `#exit_conversation` Tag in Ink Stories

## Overview
The `#exit_conversation` tag tells the Break Escape game to close the minigame (phone-chat or person-chat) and return to the main game.

## Important: Tag Placement Matters!

According to Ink documentation, tags can be placed in different positions on a choice line, affecting where they appear:

```ink
* Text #tag1 [hidden #tag2 ] #tag3
```

- `#tag1` appears on both choice menu and output
- `#tag2` only appears on choice menu (hidden by brackets)
- `#tag3` only appears on output content

## Correct Pattern for Exit Conversation

To have the `#exit_conversation` tag appear in the **output** (where the game engine reads it), place it on a line **after** the choice:

### ✅ CORRECT - Tag appears in output:
```ink
+ [That's enough gossip for now]
    #exit_conversation
    -> hub
```

After player selects this choice, the tag will be in the result and trigger minigame closure.

### ❌ INCORRECT - Tag may not appear in output:
```ink
+ [That's enough gossip for now] #exit_conversation
    -> hub
```

This places the tag on the choice definition itself, but it might not appear in the output tags that the game engine checks.

## Complete Example

```ink
=== hub ===
* [Ask about IT]
    What have you heard about the IT department?
    -> topic_it

* [Ask about CEO]
    What's the dish on the CEO?
    -> topic_ceo

+ [I should go]
    #exit_conversation
    Actually, I should get back to it. Talk later!
    -> END

-> hub
```

When player selects "I should go":
1. Choice displays: "I should go"
2. NPC responds: "Actually, I should get back to it. Talk later!"
3. Tag `#exit_conversation` is processed
4. Minigame closes after showing the response
5. Game returns to main scene

## With Bracket Syntax

You can combine `#exit_conversation` with bracket syntax for the choice:

```ink
+ [Time to leave]
    #exit_conversation
    [choice hidden] Right, I'm out of here!
    -> hub
```

Or use output text only (choice text in brackets gets stripped):

```ink
+ [Goodbye [everyone]!]
    #exit_conversation
    -> hub
```

Choice shows: "Goodbye everyone!"
Player says: "Goodbye !" (if you use this pattern)

## Both Minigames Supported

✅ **phone-chat-minigame.js** - Respects `#exit_conversation` tag
✅ **person-chat-minigame.js** - Respects `#exit_conversation` tag

Both minigames detect the tag after a choice is made and close appropriately.

## Files Using This Pattern

- `scenarios/ink/gossip-girl.json` - Hub exits with tag
- `scenarios/ink/equipment-officer.json` - Exit choice with tag
- Any new conversation stories should follow this pattern
