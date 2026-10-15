// rfid-guard-custom.ink
// Guard with MIFARE Classic (Custom Keys) - requires Darkside attack
// Demonstrates attack requirement pattern

VAR has_keycard = false
VAR has_rfid_cloner = false

// Card protocol variables (auto-synced)
VAR card_protocol = ""
VAR card_name = ""
VAR card_card_id = ""
VAR card_needs_attack = false
VAR card_uid = ""

=== start ===
# speaker:npc
Hey. I'm in charge of corporate security.

{has_keycard:
  This badge uses MIFARE Classic with custom encryption keys.

  Much more secure than those old EM4100 cards.
}

-> hub

=== hub ===

{has_keycard:
  + [Ask about badge security]
    -> ask_security
}

{has_keycard and has_rfid_cloner and card_needs_attack:
  + [Try to scan their badge]
    # speaker:player
    You try to scan, but it's encrypted...
    -> needs_attack
}

+ [Chat about security]
  -> chat_security

+ [Leave] #exit_conversation
  # speaker:npc
  Stay safe.
  -> hub

=== ask_security ===
# speaker:npc
This badge? It's a MIFARE Classic 1K with custom encryption keys.

Much better than the factory defaults some companies use.

Can't just clone these with a quick scan. The crypto is... well, it's broken technically, but it takes time to crack.

+ [How long to crack?]
  # speaker:npc
  With the right tools? Maybe 30 seconds using a Darkside attack.

  But most people don't have those tools.
  -> hub

+ [Interesting...]
  -> hub

=== chat_security ===
# speaker:npc
Corporate security is no joke. We take access control seriously.

All our badges use custom keys. Random generation, changed quarterly.

The CEO even has a DESFire card - that's military-grade encryption.

-> hub

=== needs_attack ===
# speaker:npc
What are you doing?

# speaker:player
Oh, just... checking my phone!

# speaker:npc
That looked like you were trying to scan my badge.

You'd need to run a proper attack to get this one. Can't just quick-clone it.

* [Play it cool]
  # speaker:player
  Sorry, my device sometimes picks up NFC signals by accident.
  # speaker:npc
  Uh huh. Sure.
  -> hub

* [Tell the truth]
  # speaker:player
  You're right - I was trying to clone it. But it's encrypted.
  # speaker:npc
  Yeah, that's the point of custom keys.

  You'd need to be close for about 30 seconds to run a Darkside attack.

  Good luck with that while I'm watching!
  -> hub
