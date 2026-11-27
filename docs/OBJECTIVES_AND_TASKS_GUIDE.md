# Objectives and Tasks Guide

This guide covers how to add achievements and tasks to Break Escape scenarios using the objectives system.

## Overview

The objectives system allows you to:
- Define **Aims** (high-level goals) containing multiple **Tasks**
- Track player progress through dialogue-triggered tags
- Lock/unlock aims and tasks dynamically via NPC conversations
- Trigger NPC conversations when objectives are completed
- Sync progress with the server for persistence

## Quick Start

### 1. Define Objectives in scenario.json

```json
{
  "objectives": [
    {
      "id": "main_mission",
      "title": "Primary Mission",
      "description": "Complete the main objectives",
      "status": "active",
      "aims": [
        {
          "id": "gather_intel",
          "title": "Gather Intelligence",
          "status": "active",
          "tasks": [
            {
              "id": "talk_to_alice",
              "title": "Talk to Alice",
              "status": "active"
            },
            {
              "id": "talk_to_bob", 
              "title": "Talk to Bob",
              "status": "locked"
            }
          ]
        },
        {
          "id": "secret_mission",
          "title": "Secret Mission",
          "status": "locked",
          "tasks": [
            {
              "id": "secret_task_1",
              "title": "Complete secret objective",
              "status": "locked"
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Control Objectives from Ink Dialogue

Use these Ink tags in your `.ink` files:

```ink
=== first_meeting ===
Great to meet you! This task is now complete.
#complete_task:talk_to_alice

You should go talk to Bob next - I just unlocked that task.
#unlock_task:talk_to_bob

-> hub

=== reveal_secret ===
I'll let you in on a secret mission...
#unlock_aim:secret_mission

The first task is now available.
#unlock_task:secret_task_1

-> hub
```

## Ink Tags Reference

| Tag | Description | Example |
|-----|-------------|---------|
| `#complete_task:task_id` | Marks a task as completed | `#complete_task:talk_to_alice` |
| `#unlock_task:task_id` | Unlocks a locked task | `#unlock_task:secret_task_1` |
| `#unlock_aim:aim_id` | Unlocks an entire aim | `#unlock_aim:secret_mission` |

## Task Statuses

| Status | Description |
|--------|-------------|
| `active` | Task is visible and can be completed |
| `locked` | Task is hidden until unlocked |
| `completed` | Task has been finished |

## Event-Triggered Conversations

NPCs can automatically start conversations when objectives are completed:

```json
{
  "id": "alice",
  "displayName": "Alice",
  "storyPath": "scenarios/my_scenario/alice.json",
  "eventMappings": [
    {
      "eventPattern": "objective_aim_completed:secret_mission",
      "targetKnot": "final_debrief",
      "autoTrigger": true,
      "background": "assets/backgrounds/office.png"
    }
  ]
}
```

### Event Patterns

| Pattern | Fires When |
|---------|------------|
| `objective_aim_completed:aim_id` | Specific aim is completed |
| `objective_task_completed:task_id` | Specific task is completed |
| `objective_aim_completed` | Any aim is completed |
| `objective_task_completed` | Any task is completed |

## Global Variables for Cross-NPC State

Define variables that sync across all NPC conversations:

```json
{
  "globalVariables": {
    "alice_talked": false,
    "bob_talked": false,
    "secret_revealed": false
  }
}
```

In Ink files, declare and use these variables:

```ink
// alice.ink
VAR alice_talked = false
VAR bob_talked = false

=== hub ===
+ {not alice_talked} [Nice to meet you]
    -> first_meeting
    
+ {alice_talked and bob_talked} [What's next?]
    -> next_steps
```

**Important:** Declare global variables in BOTH Ink files that use them.

## Complete Example

### scenario.json.erb

```json
{
  "scenario_brief": "Investigate the facility",
  "startRoom": "lobby",
  
  "globalVariables": {
    "alice_talked": false,
    "mission_complete": false
  },
  
  "objectives": [
    {
      "id": "investigation",
      "title": "Investigation",
      "status": "active",
      "aims": [
        {
          "id": "gather_info",
          "title": "Gather Information", 
          "status": "active",
          "tasks": [
            {
              "id": "talk_to_alice",
              "title": "Speak with Alice",
              "status": "active"
            },
            {
              "id": "find_evidence",
              "title": "Find the evidence",
              "status": "locked"
            }
          ]
        }
      ]
    }
  ],
  
  "rooms": {
    "lobby": {
      "type": "room_office",
      "npcs": [
        {
          "id": "alice",
          "displayName": "Alice",
          "npcType": "person",
          "position": { "x": 5, "y": 5 },
          "storyPath": "scenarios/my_scenario/alice.json",
          "eventMappings": [
            {
              "eventPattern": "objective_task_completed:find_evidence",
              "targetKnot": "evidence_found",
              "autoTrigger": true
            }
          ]
        }
      ]
    }
  }
}
```

### alice.ink

```ink
VAR alice_talked = false

=== start ===
Hello there! Welcome to the facility.
-> hub

=== hub ===
+ {not alice_talked} [I need your help]
    -> first_meeting

+ {alice_talked} [Any updates?]
    -> check_progress

+ [I need to go]
    See you later!
    #exit_conversation
    -> hub

=== first_meeting ===
Of course! Let me tell you what I know...
#complete_task:talk_to_alice
~ alice_talked = true

There's evidence hidden in the server room. I've unlocked that task for you.
#unlock_task:find_evidence
-> hub

=== check_progress ===
Have you found the evidence yet? Keep looking!
-> hub

=== evidence_found ===
// Triggered automatically when find_evidence task is completed
You found it! Excellent work, agent.
~ mission_complete = true
The investigation is complete.
#exit_conversation
-> hub
```

## Best Practices

### 1. Use the Hub Pattern
Never use `-> END` in NPC dialogues. Always return to a hub:

```ink
=== hub ===
+ [Option 1] -> do_thing_1
+ [Option 2] -> do_thing_2
+ [Goodbye]
    See you!
    #exit_conversation
    -> hub
```

### 2. Place Tags After Dialogue
Put objective tags after the dialogue line they relate to:

```ink
// ✅ Good - tag fires after player sees the text
Great work completing that task!
#complete_task:my_task

// ❌ Avoid - tag fires before text displays  
#complete_task:my_task
Great work completing that task!
```

### 3. Chain Tasks Logically
Unlock the next task when completing the current one:

```ink
=== complete_first_task ===
You've finished the first part!
#complete_task:task_1
#unlock_task:task_2
Now you can move on to the next step.
-> hub
```

### 4. Use Conditional Choices
Show different options based on task status using global variables:

```ink
=== hub ===
+ {not task_1_done} [Start the mission]
    -> begin_mission
    
+ {task_1_done and not task_2_done} [Continue the mission]
    -> continue_mission
    
+ {task_2_done} [Finish up]
    -> wrap_up
```

### 5. Provide Feedback
Always give the player clear feedback when objectives change:

```ink
=== unlock_secret ===
I've got something special for you...
#unlock_aim:secret_mission
Check your objectives - a new mission has appeared!
#unlock_task:secret_task_1
The first task is ready. Good luck!
-> hub
```

## Debugging Tips

1. **Check browser console** for objective-related logs:
   - `🎯 Task completed: task_id`
   - `🔓 Task unlocked: task_id`
   - `🔓 Aim unlocked: aim_id`

2. **Verify global variables** are declared in all Ink files that use them

3. **Test event triggers** by watching for:
   - `📡 Emitting event: objective_task_completed:task_id`
   - `⚡ Event-triggered conversation: jumping to knot`

4. **Use the objectives panel** (press `O` in-game) to see current status

## Files Reference

| File | Purpose |
|------|---------|
| `js/systems/objectives-manager.js` | Core objectives logic |
| `js/minigames/helpers/chat-helpers.js` | Tag processing |
| `js/systems/npc-conversation-state.js` | Global variable sync |
| `docs/GLOBAL_VARIABLES.md` | Global variables documentation |
