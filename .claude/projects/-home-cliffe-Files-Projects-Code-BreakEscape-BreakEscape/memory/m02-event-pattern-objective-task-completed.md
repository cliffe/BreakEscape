---
name: m02-event-pattern-objective-task-completed
description: NPC eventMappings must use objective_task_completed:<id>, not task_completed:<id>
metadata:
  type: project
---

To react to an objective task completing, NPC `eventMappings` must use eventPattern **`objective_task_completed:<taskId>`**. The engine emits `objective_task_completed:<id>` (objectives-manager.js) and `task_completed_by_npc`, but **never `task_completed:<id>`**. m02_ransomed_trust originally used `task_completed:<id>` in 8 mappings, which silently never fired (lost most of Agent 0x99/Ghost guidance).

**How to apply:** When wiring NPC reactions to task completion, use `objective_task_completed:`. For reacting to globals set by minigames/terminals, use `global_variable_changed:<var>`. Related: [[terminals-are-minigames-not-ink]].
