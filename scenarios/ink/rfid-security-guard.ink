// rfid-security-guard.ink
// Security Guard NPC for RFID test scenario
// Demonstrates clone_keycard tag functionality
// Player can subtly clone the guard's master keycard during conversation

=== start ===
# speaker:npc
Hey there. I'm the security guard for this facility.

I've got the master keycard that opens the secure room.

-> hub

=== hub ===
+ [Ask about the keycard]
  -> ask_keycard

+ [Just browsing]
  # speaker:npc
  Alright, let me know if you need anything.
  -> END

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

+ [Subtly scan their badge]
  # clone_keycard:Master Keycard|FF4A7B9C21
  # speaker:player
  You casually position your Flipper Zero near their badge while chatting...
  -> cloned

+ [Leave them alone]
  # speaker:npc
  Sure thing. Have a good one!
  -> END

=== cloned ===
# speaker:npc
...So anyway, that's why I love working nights. Much quieter, you know?

The pay's better too. Plus I get to catch up on my podcasts.

+ [Thanks for the chat!]
  # speaker:npc
  No problem! Stay safe out there.
  -> END

+ [Any other secure areas?]
  # speaker:npc
  Well, there's the CEO's office, but that's on a different floor entirely.

  This master card works for most areas on this level though.
  -> cloned
