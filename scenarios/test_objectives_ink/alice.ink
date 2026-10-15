// alice.ink
// Demonstrates all three objective Ink tags:
// - #complete_task:task_id - marks a task as completed
// - #unlock_task:task_id - unlocks a locked task
// - #unlock_aim:aim_id - unlocks a locked aim
//
// IMPORTANT: Uses mission hub pattern - never uses -> END
// Instead uses #exit_conversation tag to leave the chat

VAR alice_talked = false
VAR secret_revealed = false
VAR secret_task_done = false

=== start ===
Hey there! I'm Alice. Welcome to the objectives system test.
Player: Hi there!
-> hub

=== hub ===
+ {not alice_talked} [Nice to meet you, Alice]
    -> first_meeting
    
+ {alice_talked and not secret_revealed} [Tell me about the secret mission]
    -> reveal_secret
    
+ {secret_revealed and not secret_task_done} [I'm ready for the secret task]
    -> complete_secret_task

+ {secret_task_done} [Any final words?]
    -> final_words
    
+ [What can you tell me about objectives?]
    -> explain_objectives

+ [I need to go] 
    See you around!
    #exit_conversation
    -> hub

=== first_meeting ===
Great to meet you too! This task is now complete.
#complete_task:talk_to_alice
~ alice_talked = true
You should go talk to Bob next - I just unlocked that task for you.
#exit_conversation
-> hub

=== explain_objectives ===
The objectives system uses three Ink tags:
-> explain_objectives_detail

=== explain_objectives_detail ===
+ [Tell me about complete_task]
    NPC: **complete_task:task_id** marks a task as completed. The ObjectivesManager will update the UI and sync with the server.
    -> explain_objectives_detail
    
+ [Tell me about unlock_task]
    NPC: **unlock_task:task_id** unlocks a locked task so it becomes active and visible.
    -> explain_objectives_detail
    
+ [Tell me about unlock_aim]
    NPC: **unlock_aim:aim_id** unlocks an entire aim (objective group) that was previously locked.
    -> explain_objectives_detail

+ [That's enough info, thanks]
    NPC: These tags let NPCs control the player's objectives through dialogue!
    -> hub

=== reveal_secret ===
Alright, I'll let you in on a secret...
There's a hidden mission that only unlocks through dialogue!
#unlock_aim:secret_mission
~ secret_revealed = true
I've just unlocked the "Secret Mission" aim for you. Check your objectives!
But the tasks inside are still locked. Let me unlock the first one...
#unlock_task:secret_task_1
There! Now you can complete the first secret task.
-> hub

=== complete_secret_task ===
Excellent! You're doing great with the secret mission.
#complete_task:secret_task_1
~ secret_task_done = true
That's one secret task down! Bob can help you with the second one.
-> hub

=== final_words ===
You've done great! Once Bob helps you finish, come back for the final debrief.
-> hub

=== final_debrief ===
// This knot is triggered automatically when the secret_mission aim is completed
// via eventMappings: "objective_aim_completed:secret_mission" -> "final_debrief"

NPC: *Alice looks up as you approach*
Narrator: Alice gives you a knowing smile.
Bob: You did it! The secret mission is complete.
NPC: I just received confirmation from headquarters.
#complete_task:final_debrief
NPC: Mission accomplished, agent. You've proven yourself.
NPC: The objectives system test is now complete. Well done!
+ [Thank you, Alice]
    NPC: Anytime. See you on the next mission.
    #exit_conversation
    -> hub
+ [What's next?]
    NPC: Take a break. You've earned it.
    NPC: When you're ready, there will be more missions waiting.
    #exit_conversation
    -> hub
