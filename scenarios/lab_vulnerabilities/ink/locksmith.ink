// ===========================================
// LOCKSMITH NPC - LOCKPICKING TUTORIAL
// ===========================================

// NPC item inventory variables
VAR has_lockpick = false

// Progress tracking
VAR lockpicking_tutorial_given = false
VAR all_locks_picked = false

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
Welcome to the lockpicking practice room. I'm here to teach you the fundamentals of lockpicking.

{has_lockpick:
    Here's a professional lockpick set to get you started.
    #give_item:lockpick
    #complete_task:talk_to_locksmith
    #unlock_task:pick_all_locks
- else:
    I see you already have a lockpick set.
}

-> hub

// ===========================================
// MAIN HUB
// ===========================================

=== hub ===
What would you like to know?

{not lockpicking_tutorial_given:
  * [Can you teach me about lockpicking?]
      -> lockpicking_tutorial
}

{lockpicking_tutorial_given and not all_locks_picked:
  + [I'm working on picking the locks]
      You'll find five locked containers in this room. Each one contains a document fragment. Pick all five to complete the practice exercise.
      -> hub
}

+ [That's all I need] #exit_conversation
  Good luck with your practice. Come back if you need any tips!
  -> hub

// ===========================================
// LOCKPICKING TUTORIAL
// ===========================================

=== lockpicking_tutorial ===
~ lockpicking_tutorial_given = true

Lockpicking is a physical security skill that's essential for field operations. Here's how it works:

Most locks use pin tumblers. Each pin has two parts - a driver pin and a key pin. When the correct key is inserted, the pins align at the shear line, allowing the lock to turn.

When picking a lock, you need two tools: a tension wrench that applies rotational pressure to the lock cylinder, and a pick that manipulates the pins one by one.

The technique involves applying light tension with the wrench in the direction the lock turns, then using the pick to push each pin up until you feel it "bind" (stop moving). Pins bind in a specific order, so you work through them systematically. When all pins are set at the shear line, the lock will turn.

Practice makes perfect. Start with the containers in this room - they have different difficulty levels. Each container has a different lock configuration. Start with the easier ones and work your way up. When you've picked all five locks and collected all the documents, come back and I'll congratulate you on completing the practice.

Good luck!

-> hub


// ===========================================
// LOCKPICKING COMPLETE
// ===========================================

=== lockpicking_complete ===
~ all_locks_picked = true

Congratulations! You've successfully picked all five locks and recovered all the lost documents.

You've demonstrated understanding of lock mechanics, ability to apply proper tension, skill in identifying binding order, and patience and precision. These skills will serve you well in the field. Lockpicking is often the difference between mission success and failure when you need access without leaving evidence of forced entry.

You're ready for real-world operations. Well done, Agent.

-> hub


