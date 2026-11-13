---
title: "Integration Notes: SAFETYNET Field Guide Item & Agent 0x99 Dialogue"
description: "Instructions for integrating the field guide into the game dialogue system"
---

# Integration Guide: Field Guide Dialogue System

## What Was Added to the Scenario

### 1. New Lab-Workstation Item (server_room)

Added to the server room's objects array:
```json
{
  "type": "lab-workstation",
  "id": "safetynet_field_guide_workstation",
  "name": "SAFETYNET Ops Manual",
  "sprite": "workstation-secure",
  "takeable": true,
  "readable": true,
  "observations": "A secure workstation containing Agent 0x99's field guide for Linux command-line operations and SSH bruteforce tactics.",
  "labUrl": "file:///SAFETYNET_FIELD_GUIDE_Linux_SSH_Bruteforce.md"
}
```

### 2. Global Variables

Added to `globalVariables`:
- `password_list_found` — Set when "My Passwords" is picked up
- `field_guide_offered` — Set when Agent 0x99 offers the guide
- `field_guide_requested` — Set when player requests it via dialogue
- `field_guide_received` — Set when player actually gets the item

### 3. Event Mappings (Agent 0x99)

Added two event mappings:

#### Event 1: When password list is found
```json
{
  "eventPattern": "item_picked_up:notes",
  "condition": "data.itemName === 'My Passwords'",
  "onceOnly": true,
  "setGlobal": { "password_list_found": true },
  "sendTimedMessage": {
    "delay": 1500,
    "message": "Derek's password list. 🦎 Save those to a file on the Kali — one password per line — then feed it to Hydra with `-P passwords.txt`. That's your wordlist for the SSH brute force."
  }
}
```

#### Event 2: When password_list_found changes to true
```json
{
  "eventPattern": "global_variable_changed:password_list_found",
  "condition": "value === true",
  "onceOnly": true,
  "setGlobal": { "field_guide_offered": true },
  "sendTimedMessage": {
    "delay": 3000,
    "message": "This password list could be useful when you get to the server room. I've put together an ops manual — tactical guide to Linux commands and SSH bruteforce. Would help you move faster once you're inside their Kali system. Let me know if you want it."
  }
}
```

## What Needs to Be Done: Dialogue Integration

The minified Ink file at `scenarios/m01_first_contact/ink/m01_phone_agent0x99.json` needs to be updated to include a dialogue choice for requesting the field guide.

### Option A: Modify the Ink Source (Recommended)

1. **Find the Ink source file** — There should be an `.ink` source file (not compiled) somewhere:
   - Likely at `scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink` or similar
   - Or search: `find . -name "*.ink" -type f`

2. **Edit the Ink source** to add this choice to the `support_hub` knot, after the other dialogue options:

```ink
ev
str
  "I'd like that ops manual you mentioned"
/str
{ VAR? field_guide_offered }
{ VAR? field_guide_received }
!
&&
/ev
{"*": ".^.c-11", "flg": 4}
```

And add the corresponding dialogue handling:

```ink
"c-11": [
  "\nSending the field guide to your secure terminal now.",
  "Linux fundamentals, SSH bruteforce with Hydra, privilege escalation with sudo.",
  "Everything you need to move fast once you're inside their Kali system.",
  {"->": "request_field_guide"}, null
]
```

Then add the `request_field_guide` knot:

```ink
== request_field_guide ==
# speaker:agent_0x99
^ Check your workstation in the server room. The ops manual is loaded and ready.
^ ev true /ev
{ VAR= field_guide_requested }
^ Good luck in there.
^ ev
str
  "Got it, thanks"
/str
/ev
{"*": ".^.c-0", "flg": 4}
{ "c-0": [
  "\n",
  "# exit_conversation /#",
  {"->": "support_hub"}, null
]}
```

### Option B: Add Item Delivery via Event Mapping (Workaround)

If you can't easily modify the Ink source, you can add an automatic item delivery mechanism:

Add this event mapping to Agent 0x99 in the scenario to deliver the item when player enters server room with field_guide_requested true:

```json
{
  "eventPattern": "room_entered:server_room",
  "condition": "global.field_guide_offered === true && global.field_guide_requested === false",
  "onceOnly": false,
  "sendTimedMessage": {
    "delay": 2000,
    "message": "The field guide is available. Request it if you need it. Just ask me next time we talk."
  }
}
```

Then add a trigger for when the workstation is picked up:

```json
{
  "eventPattern": "item_picked_up:safetynet_field_guide_workstation",
  "onceOnly": true,
  "setGlobal": { "field_guide_received": true },
  "sendTimedMessage": {
    "delay": 1000,
    "message": "You've got the ops manual. Good hunting, Agent Zero."
  }
}
```

## File Location in Scenario

The field guide Markdown file should be placed at:
```
scenarios/m01_first_contact/lab_sheet/SAFETYNET_FIELD_GUIDE_Linux_SSH_Bruteforce.md
```

The `labUrl` in the item references it as:
```json
"labUrl": "file:///SAFETYNET_FIELD_GUIDE_Linux_SSH_Bruteforce.md"
```

You may need to adjust the path based on how your game engine resolves file URLs.

## Dialogue Flow Summary

1. **Player finds password list** in derek's office
   ↓
2. **Agent 0x99 sends timed message** congratulating them
   ↓
3. **3 seconds later**, Agent 0x99 sends second message offering the ops manual
   ↓
4. **Player can request the manual** via dialogue choice (if Ink is updated)
   ↓
5. **Agent 0x99 confirms** and makes it available in server room
   ↓
6. **Player picks up the workstation** in server room
   ↓
7. **Agent 0x99 sends final message** as they access it

## Integration Testing Checklist

- [ ] Password list triggers `password_list_found` global
- [ ] Agent 0x99 sends offer message 3 seconds after finding list
- [ ] Dialogue option appears when `field_guide_offered` is true
- [ ] Selecting the option sets `field_guide_requested` to true
- [ ] Lab-workstation item appears in server room (or becomes accessible)
- [ ] Player can pick up the item and open the field guide
- [ ] Field guide Markdown file displays correctly
- [ ] Agent 0x99 confirms message when item is acquired

## Notes

- The `field_guide_received` variable marks when the item has actually been taken
- The field guide is available whether or not the player requested it (it's in the server room)
- The dialogue just provides an in-character way for Agent 0x99 to offer help
- The player can still pick up the workstation if they skip all the dialogue

## Fallback: Auto-Delivery

If dialogue integration proves difficult, the field guide will still be available as a lab-workstation item in the server room. Players can find it without needing to request it via Agent 0x99. The event mappings handle all the timed messages and variable tracking, so the core functionality works even if the dialogue choice isn't implemented.
