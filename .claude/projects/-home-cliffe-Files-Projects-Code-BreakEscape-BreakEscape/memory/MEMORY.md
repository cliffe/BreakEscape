# Memory Index

- [Terminals are minigames, not ink](terminals-are-minigames-not-ink.md) — terminal task completion goes via globals + eventMappings, never ink
- [Use objective_task_completed event pattern](m02-event-pattern-objective-task-completed.md) — NPC eventMappings: objective_task_completed:<id>, not task_completed:<id>
- [Ink decompiler tooling](ink-decompiler-tooling.md) — recover .ink from compiled inkVersion-21 .json + verify round-trip
- [Phone NPC targetKnot limitation](phone-npc-targetknot-limitation.md) — targetKnot only works first-contact; use setGlobal+sendTimedMessage otherwise
