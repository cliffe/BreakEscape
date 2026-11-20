---
name: terminals-are-minigames-not-ink
description: In Break Escape, in-world terminals/consoles are minigames, not ink dialogues
metadata:
  type: project
---

In Break Escape scenarios, interactive **terminals/consoles are implemented as minigames, not ink**. Examples: `backup_recovery` (recovery console), `ransomware_display`, `password`/`pin` locks, vm-launcher/flag-station. The one exception is the phone "hacker mode" overlay that pops up when the player is on another device.

**Why:** A terminal that has a `storyPath` to an ink file is almost always a mistake — the engine launches the minigame for its `type`/`lockType`, and the ink never runs. m02_ransomed_trust had an orphaned `m02_terminal_ransom_interface.ink` that was never referenced; it was deleted.

**How to apply:** Minigames complete objective tasks by *writing globals* (e.g. backup-recovery writes `backup_recovery_source`, `backup_restore_initiated`). To finish a task off a terminal, add an NPC `eventMapping` watching `global_variable_changed:<var>` with `completeTask`/`setGlobal` (sis01's Helen Carver and m02's Agent 0x99 do this). Do NOT wire terminal task completion through ink. Related: [[m02-event-pattern-objective-task-completed]].
