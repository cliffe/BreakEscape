// Office Life Tour host: Ama Owusu (person, office aisle).
// S2 adds the morning hub: the looking-at choice, the morning hints and the
// cooler follow-up. S3 adds the lunch gate and the midday hints. The evening
// turn and recap choices come in a later slice. Reopen pattern from test_needs_sims/neil.ink:
// start diverts to hub.choices; hub has a reopen line; exit uses
// # exit_conversation then -> END. reopenRefreshesHub is set on her NPC block.

// heard_exchange_cooler_chat is a scenario global, synced into this VAR when the
// conversation starts; the engine sets it when the cooler exchange has played.
VAR heard_exchange_cooler_chat = false
// act_midday is set by the lunch choice below (tag and local assignment, as in neil.ink).
// kitchen_seen and the two owner_away flags are scenario globals synced in when the
// conversation starts; a conversation held open while the staff walk back keeps stale values.
VAR act_midday = false
VAR kitchen_seen = false
VAR chidi_pc_owner_away = false
VAR jun_pc_owner_away = false

=== start ===
# speaker:npc
Today you watch an office instead of breaking into one.
# speaker:npc
Everyone here is driven by something. Start with the coffee machine.
-> hub.choices

=== hub ===
# speaker:npc
What can I help with?
- (choices)
* [What am I looking at?]
    # speaker:npc
    Each person has needs: coffee, water, food, company, work. They run down over time.
    # speaker:npc
    When one runs low, they go to whatever fills it. That's an affordance.
    -> choices
+ [What should I try next?]
    {
        - act_midday:
            # speaker:npc
            Lunch takes people away from their desks. Some lock their screens; some don't.
            # speaker:npc
            Use an open one, then close it and wait by the desk for its owner.
            # speaker:npc
            When they're all back and sitting, drop the cake from your inventory here in the office.
        - else:
            # speaker:npc
            Wait for the coffee run. One person at a time; the rest queue.
            # speaker:npc
            They come back every few minutes. Switch it off at the wall socket while they're queued.
            # speaker:npc
            Before you open the kitchen, note the mugs on the floor. Someone dislikes them.
            # speaker:npc
            Then open the kitchen door and hang about by the water cooler.
    }
    -> choices
+ { heard_exchange_cooler_chat } [What was that at the cooler?]
    # speaker:npc
    This is an exchange. Two people at the same machine can have one set conversation.
    # speaker:npc
    They have it once, and only if you're close enough to hear.
    -> choices
+ { not act_midday } [Let's do lunch.]
    {
        - not kitchen_seen:
            # speaker:npc
            Have a look in the kitchen first. That's where lunch happens.
            -> choices
        - chidi_pc_owner_away or jun_pc_owner_away:
            # speaker:npc
            Hang on, Chidi or Jun is still out. Give it a minute.
            -> choices
        - else:
            # speaker:npc
            Good idea. Watch who goes, and what they leave on their desks.
            # speaker:npc
            Anyone in the middle of something finishes it first.
            #set_global:act_midday:true
            ~ act_midday = true
            # exit_conversation
            -> END
    }
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END
