// Office Life Tour host: Ama Owusu (person, office aisle).
// S2 adds the morning hub: the looking-at choice, the morning hints and the
// cooler follow-up. S3 adds the lunch gate and the midday hints. S4 adds the
// evening turn ("Call it a day."), the evening hints and the recap ("Give me the
// short version."). Reopen pattern from test_needs_sims/neil.ink:
// the first talk diverts to hub.choices and later talks divert to hub; hub has a reopen line; exit uses
// # exit_conversation then -> END. reopenRefreshesHub is set on her NPC block.

// heard_exchange_cooler_chat is a scenario global, synced into this VAR when the
// conversation starts; the engine sets it when the cooler exchange has played.
VAR heard_exchange_cooler_chat = false
// act_midday is set by the lunch choice below (tag and local assignment, as in neil.ink).
// kitchen_seen and the two owner_away flags are scenario globals synced in when the
// conversation starts; a conversation held open while the staff walk back keeps stale values.
VAR act_midday = false
// act_evening is set by the "Call it a day." choice below (tag and local assignment).
VAR act_evening = false
VAR kitchen_seen = false
VAR chidi_pc_owner_away = false
VAR jun_pc_owner_away = false
// cake_servings mirrors the engine-owned cake_servings global (the magnet's remaining
// servings), synced in when the conversation starts; 0 means an early cake has already gone.
VAR cake_servings = 2
// met_ama is an ink-local VAR (not a global): it survives an ended story on a
// re-talk (restoreNPCState) and a reload (exportNpcInkVariables), so the opening
// A1/A2 plays once and later talks open at the hub with A0. Pattern from m01 met_maya.
VAR met_ama = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
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
        - act_evening:
            # speaker:npc
            Everyone's gone home but one. See where she goes.
            # speaker:npc
            Then walk into the kitchen. The lights there are on a motion sensor now.
        - act_midday:
            # speaker:npc
            Lunch takes people away from their desks. Some lock their screens; some don't.
            # speaker:npc
            Use an open one, then close it and wait by the desk for its owner.
            {
                - cake_servings > 0:
                    # speaker:npc
                    When they're all back and sitting, drop the cake from your inventory here in the office.
                    # speaker:npc
                    Once the cake is gone, tell me to call it a day.
                - else:
                    # speaker:npc
                    The cake's gone already. Tell me when to call it a day.
            }
        - else:
            # speaker:npc
            Wait for the coffee run. One person at a time; the rest queue.
            # speaker:npc
            They come back every few minutes. Switch the machine off at the wall socket while they queue.
            {
                - kitchen_seen and heard_exchange_cooler_chat:
                    # speaker:npc
                    You've seen the kitchen. Ask me about lunch when you're ready.
                - kitchen_seen:
                    # speaker:npc
                    Hang about by the water cooler.
                - else:
                    # speaker:npc
                    Before you open the kitchen, note the mugs on the floor. Someone dislikes them.
                    # speaker:npc
                    Then open the kitchen door and hang about by the water cooler.
            }
    }
    -> choices
+ { heard_exchange_cooler_chat } [What was that at the cooler?]
    # speaker:npc
    That was an exchange. Two people at the same machine can have one set conversation.
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
+ { act_midday and not act_evening } [Call it a day.]
    # speaker:npc
    The staff won't be back once they've gone home. Seen everything you wanted?
    + + [Yes, call it a day.]
        # speaker:npc
        Right. Home time for nearly all of them.
        # speaker:npc
        Have a wander if you like.
        #set_global:act_evening:true
        ~ act_evening = true
        # exit_conversation
        -> END
    + + [Not yet.]
        # speaker:npc
        Take your time.
        -> choices
+ { act_evening } [Give me the short version.]
    # speaker:npc
    Needs run down, and people go to whatever fills them.
    # speaker:npc
    The coffee machine takes one at a time, so people queue and chat.
    # speaker:npc
    Two at the cooler share a proper conversation, once. Stand close.
    # speaker:npc
    Switch something off and they turn back. That's a lever.
    # speaker:npc
    Some lock, some don't. An open screen is an opening, but owners come back.
    # speaker:npc
    Cake tempts anyone peckish, until it runs out.
    # speaker:npc
    In the evening the office dims, and the kitchen lights follow you.
    # speaker:npc
    That's the tour. Stay and look round as long as you like.
    -> choices
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END
