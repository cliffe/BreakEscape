---
name: phone-npc-targetknot-limitation
description: Phone NPC eventMappings with targetKnot only work on first contact
metadata:
  type: project
---

For **phone** NPCs, an `eventMapping` with `targetKnot` only works the FIRST time that phone story is opened. Once a storyState is saved, `targetKnot` is ignored on reopen. The validator flags phone eventMappings that use `targetKnot` without `conversationMode`.

**How to apply:**
- First-contact phone cutscenes (e.g. a planted-device phone, a closing-debrief phone) may use `targetKnot` — add `"conversationMode": "phone-chat"` so it opens a fresh phone-chat to that knot (matches m02 ghost, m03 closing_debrief).
- For a phone the player has already opened (e.g. the always-available handler 0x99), do NOT rely on `targetKnot` for later events. Use `setGlobal` a flag + `sendTimedMessage` to notify, and add a conditional hub option `+ {flag} [..] -> knot` in the Ink. This is the m01/m02 handler-guidance pattern. Related: [[m02-event-pattern-objective-task-completed]], [[terminals-are-minigames-not-ink]].
