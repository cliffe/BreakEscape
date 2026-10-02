// rfid-guard-low.ink
// Guard with EM4100 card (instant clone)
// Demonstrates proper hub pattern with #exit_conversation

VAR has_keycard = false
VAR has_rfid_cloner = false

// Card protocol variables (auto-synced)
VAR card_protocol = ""
VAR card_name = ""
VAR card_card_id = ""
VAR card_instant_clone = false

=== start ===
# speaker:npc
Hi! I work security here at the building.

{has_keycard:
  This badge on my belt? Just a basic EM4100 card. Nothing fancy.
}

-> hub

=== hub ===

{has_keycard:
  + [Ask about the badge]
    -> ask_badge
}

{has_keycard and has_rfid_cloner and card_instant_clone:
  + [Casually scan their badge] #clone_keycard:{card_card_id}
    # speaker:player
    You position your Flipper Zero near their badge while chatting...
    # speaker:npc
    ...and that's when I realized I'd left my lunch at home!
    -> cloned
}

+ [Chat about the job]
  -> chat_job

+ [Leave] #exit_conversation
  # speaker:npc
  See you around!
  -> hub

=== ask_badge ===
# speaker:npc
Oh, this old thing? Yeah, it's one of those 125kHz proximity cards.

Pretty basic technology. I just wave it at the reader and it opens.

No PIN or anything - just the card itself.

-> hub

=== chat_job ===
# speaker:npc
The job's not bad. Mostly just sitting at the desk and checking people in.

I get to read a lot during my shifts. The night shift especially is pretty quiet.

-> hub

=== cloned ===
# speaker:player
[You've successfully cloned the {card_name}!]

# speaker:npc
Anyway, I should probably get back to my post.

+ [Thanks for chatting] #exit_conversation
  # speaker:npc
  No problem! Have a good day!
  -> hub
