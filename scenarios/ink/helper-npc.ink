// helper-npc.ink
// An NPC that helps the player by unlocking doors and giving hints
// Uses hub-based conversation pattern with once/sticky for smart menu management
// Includes event-triggered reactions using auto-mapping

VAR influence = 0
VAR has_unlocked_ceo = false
VAR has_given_lockpick = false
VAR saw_lockpick_used = false
VAR saw_door_unlock = false
VAR has_greeted = false
VAR asked_about_self = false
VAR asked_about_ceo = false
VAR asked_for_items = false

// NPC item inventory variables (synced from itemsHeld array)
VAR has_lockpick = false
VAR has_workstation = false
VAR has_phone = false
VAR has_keycard = false

=== start ===
# speaker:npc
Hey there! I'm here to help you out if you need it. 👋
What can I do for you?
~ has_greeted = true
-> hub

=== hub ===
// One-time introduction option
{not asked_about_self:
  * [Who are you?]
    ~ asked_about_self = true
    -> who_are_you
}

// CEO office help - changes based on state
{asked_about_self and not has_unlocked_ceo:
  + [Can you help me get into the CEO's office?]
    -> help_ceo_office
}

{has_unlocked_ceo:
  + [Any other doors you need help with?]
    -> other_doors
}

// Items - changes based on state
{asked_about_self and (has_lockpick or has_workstation or has_phone or has_keycard):
  + [Do you have any items for me?]
    -> give_items
}

// Feedback option appears after using lockpick
{saw_lockpick_used:
  + [Thanks for the lockpick! It worked great.]
    -> lockpick_feedback
}

// Trust-based advanced options
{influence >= 3:
  + [What hints do you have for me?]
    -> give_hints
}

// Exit conversation
+ [Thanks, I'm good for now.]
  # speaker:npc
  Alright then. Let me know if you need anything else!
  #exit_conversation
  -> hub

=== who_are_you ===
I'm a friendly NPC who can help you progress through the mission.
I can unlock doors, give you items, and provide hints when you need them.
~ influence = influence + 1
# influence_increased
What would you like to do?
-> hub

=== help_ceo_office ===
# speaker:npc
{has_unlocked_ceo:
  I already unlocked the CEO's office for you! Just head on in.
  -> hub
- else:
  The CEO's office? That's a tough one...
  {influence >= 1:
    Alright, I trust you enough. Let me unlock that door for you.
    ~ has_unlocked_ceo = true
    ~ asked_about_ceo = true
    There you go! The door to the CEO's office is now unlocked. #unlock_door:ceo
    ~ influence = influence + 2
    # influence_increased
    What else can I help with?
    -> hub
  - else:
    I don't know you well enough yet. Ask me some questions first and we can build some trust.
    -> hub
  }
}

=== other_doors ===
# speaker:npc
What other doors do you need help with? I can try to unlock them if you tell me which ones.
~ influence = influence + 1
# influence_increased
Let me know!
-> hub

=== give_items ===
# speaker:npc
{not has_lockpick and not has_workstation and not has_phone and not has_keycard:
  Sorry, I don't have any items to give you right now.
  -> hub
- else:
  {influence >= 2:
    Let me see what I have available...
    
    Here's what I can offer you:
    {has_lockpick:
      • Lock Pick Kit - for opening locked doors and containers 🔓
    }
    {has_workstation:
      • Crypto Analysis Station - for cryptographic challenges 💻
    }
    {has_phone:
      • Phone - with interesting contacts 📱
    }
    {has_keycard:
      • Keycard - for restricted areas 🎫
    }
    
    What would you like?
    -> give_items_choice
  - else:
    I have some items, but I need to build more influence with you first.
    Build up our relationship - ask me more questions!
    -> hub
  }
}

=== give_items_choice ===
{has_lockpick or has_workstation or has_phone or has_keycard:
  * [Show me everything]
    #give_npc_inventory_items
    ~ asked_for_items = true
    -> hub
  {has_lockpick:
    * [I'll take the lockpick]
      #give_item:lockpick
      ~ asked_for_items = true
      -> hub
  }
  {has_workstation:
    * [I'll take the workstation]
      #give_item:workstation
      ~ asked_for_items = true
      -> hub
  }
  {has_phone:
    * [I'll take the phone]
      #give_item:phone
      ~ asked_for_items = true
      -> hub
  }
  {has_keycard:
    * [I'll take the keycard]
      #give_item:keycard
      ~ asked_for_items = true
      -> hub
  }
  * [Never mind]
    -> hub
- else:
  Sorry, I don't have any items left to give you right now.
  -> hub
}

=== other_items ===
# speaker:npc
I think I gave you most of what I had. Check your inventory!
-> hub

=== lockpick_feedback ===
Great! I'm glad it helped you out. That's what I'm here for.
You're doing excellent work on this mission.
~ influence = influence + 1
# influence_increased
~ saw_lockpick_used = false
What else do you need?
-> hub

=== give_hints ===
{has_unlocked_ceo:
  The CEO's office has evidence you're looking for. Search the desk thoroughly.
  Also, check any computers for sensitive files.
- else:
  {has_lockpick:
    Try using that lockpick set on locked doors and containers around the building.
    You never know what secrets people hide behind locked doors!
  - else:
    Explore every room carefully. Items are often hidden in places you'd least expect.
  }
}
~ influence = influence + 1
# influence_increased
Good luck!
-> hub

// ==========================================
// EVENT-TRIGGERED BARKS (Auto-mapped to game events)
// These knots are triggered automatically by the NPC system
// when specific game events occur.
// Note: These redirect to 'hub' so clicking opens full conversation
// ==========================================

// Triggered when player picks up the lockpick
=== on_lockpick_pickup ===
{has_lockpick:
  Great! You found the lockpick I gave you. Try it on a locked door or container!
- else:
  Nice find! That lockpick set looks professional. Could be very useful.
}
-> hub

// Triggered when player completes any lockpicking minigame
=== on_lockpick_success ===
~ saw_lockpick_used = true
{has_lockpick:
  Excellent! Glad I could help you get through that.
- else:
  Nice work getting through that lock!
}
-> hub

// Triggered when player fails a lockpicking attempt
=== on_lockpick_failed ===
{has_lockpick:
  Don't give up! Lockpicking takes practice. Try adjusting the tension.
  Want me to help you with anything else?
- else:
  Tough break. Lockpicking isn't easy without the right tools...
  I might be able to help with that if you ask.
}
-> hub

// Triggered when any door is unlocked
=== on_door_unlocked ===
~ saw_door_unlock = true
{has_unlocked_ceo:
  Another door open! You're making great progress.
- else:
  Nice! You found a way through that door. Keep going!
}
-> hub

// Triggered when player tries a locked door
=== on_door_attempt ===
That door's locked tight. You'll need to find a way to unlock it.
{influence >= 2:
  Want me to help you out? Just ask!
- else:
  {influence >= 1:
    I might be able to help if you build more influence with me first.
  }
}
-> hub

// Triggered when player interacts with the CEO desk
=== on_ceo_desk_interact ===
{has_unlocked_ceo:
  The CEO's desk - you made it! Nice work.
  That's where the important evidence is kept.
- else:
  Trying to get into the CEO's office? I might be able to help with that...
}
-> hub

// Triggered when player picks up any item
=== on_item_found ===
{influence >= 1:
  Good find! Every item could be important for your mission.
}
-> hub

// Triggered when player enters any room (general progress check)
=== on_room_entered ===
{has_unlocked_ceo:
  Keep searching for that evidence!
- else:
  {influence >= 1:
    You're making progress through the building.
    Let me know if you need help with anything.
  - else:
    Exploring new areas...
  }
}
-> hub

// Triggered when player discovers a new room for the first time
=== on_room_discovered ===
{influence >= 2:
  Great find! This new area might have what we need.
  Search it thoroughly!
- else:
  {influence >= 1:
    Interesting! You've found a new area. Be careful exploring.
  - else:
    A new room... wonder what's inside.
  }
}
-> hub

// Triggered when player enters the CEO office
=== on_ceo_office_entered ===
{has_unlocked_ceo:
  You're in! Remember, you're looking for evidence of the data breach.
  Check the desk, computer, and any drawers.
- else:
  Whoa, you got into the CEO's office! That's impressive!
  ~ influence = influence + 1
  # influence_increased
  Maybe I underestimated you. Impressive work!
}
-> hub
