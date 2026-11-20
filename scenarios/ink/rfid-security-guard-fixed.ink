// rfid-security-guard.ink (FIXED)
// Security Guard NPC for RFID test scenario
// Demonstrates proper hub pattern and #exit_conversation usage

VAR has_keycard = false
VAR has_rfid_cloner = false
VAR conversation_count = 0

// Card protocol variables (auto-synced from NPC itemsHeld)
VAR card_protocol = ""
VAR card_name = ""
VAR card_card_id = ""
VAR card_security = ""
VAR card_instant_clone = false
VAR card_needs_attack = false
VAR card_uid_only = false
VAR card_uid = ""
VAR card_hex = ""

=== start ===
~ conversation_count += 1
# speaker:npc
Hey there. I'm the security guard for this facility.

{has_keycard:
  I've got the master keycard that opens the secure room.
  {card_protocol == "EM4100":
    It's a basic EM4100 card - nothing fancy.
  }
  {card_security == "medium":
    This one's got proper encryption. Corporate security.
  }
}

-> hub

=== hub ===
// Main conversation hub

{has_keycard and not card_instant_clone:
  + [Ask about the keycard security]
    -> ask_security
}

{has_keycard:
  + [Ask about the keycard]
    -> ask_keycard
}

{has_keycard and has_rfid_cloner and card_instant_clone:
  + [Subtly scan their badge] #clone_keycard:{card_card_id}
    # speaker:player
    You casually position your Flipper Zero near their badge...
    -> cloned_success
}

{has_keycard and has_rfid_cloner and card_needs_attack:
  + [Scan badge (requires attack)]
    # speaker:player
    You try to scan their badge, but it's encrypted.
    # speaker:player
    You'll need to run a Darkside attack - this will take about 30 seconds.
    -> needs_attack
}

+ [Just browsing] #exit_conversation
  # speaker:npc
  Alright, let me know if you need anything.
  -> hub

=== ask_security ===
# speaker:npc
{card_security == "low":
  Honestly? It's just a basic proximity card. Nothing special.

  The company's been meaning to upgrade for years...
- else:
  This card uses {card_protocol} with custom encryption.

  Pretty secure stuff. Can't just clone these easily.
}
-> hub

=== ask_keycard ===
# speaker:npc
This keycard? Yeah, it's the master access card. Opens everything in the building.

I can't just hand it to you though - security policy and all that.

+ [Offer to buy it]
  # speaker:npc
  Ha! Nice try, but I can't sell company property. I'd lose my job.
  -> hub

+ [Ask if you can borrow it]
  # speaker:npc
  Sorry, no can do. This thing never leaves my person.
  -> hub

+ [Back]
  -> hub

=== cloned_success ===
# speaker:npc
...So anyway, that's why I love working nights. Much quieter, you know?

The pay's better too. Plus I get to catch up on my podcasts.

+ [Thanks for the chat!] #exit_conversation
  # speaker:npc
  No problem! Stay safe out there.
  -> hub

+ [Any other secure areas?]
  # speaker:npc
  Well, there's the CEO's office, but that's on a different floor entirely.

  This master card works for most areas on this level though.
  -> hub

=== needs_attack ===
# speaker:npc
Hey, what are you doing with that device?

# speaker:player
Oh, just... checking the time!

# speaker:npc
That didn't look like checking the time...

You'll need to be more subtle. Or find a way to get the card when they're not looking.

-> hub
