// equipment-officer.ink
// NPC that demonstrates container-based item giving
// Shows all held items through the container minigame UI
// Uses global variable player_joined_organization to conditionally show full inventory

VAR player_joined_organization = false

=== start ===
# speaker:npc
Welcome to equipment supply! I have various tools available.
What can I help you with?
-> hub

=== hub ===
* [Tell me about your equipment] I'd like to know more.
  -> about_equipment

// Full inventory only if player joined organization
+ {player_joined_organization} [Show me what you have available]
  -> show_inventory

* [Show me your specialist items]
  -> show_inventory_filtered

+ [I'll come back later] #exit_conversation
  # speaker:npc
  Come back when you need something!

-> hub

=== show_inventory ===
# speaker:npc
Here's everything we have in stock. Take what you need!
#give_npc_inventory_items
What else can I help with?
-> hub

=== show_inventory_filtered ===
# speaker:npc
Here are the specialist tools:
#give_npc_inventory_items:lockpick,workstation
Let me know if you need access devices too!
-> hub

=== about_equipment ===
We supply equipment for fieldwork - lockpicking kits for access, workstations for analysis, and keycards for security. All essential tools for the job.
-> hub


