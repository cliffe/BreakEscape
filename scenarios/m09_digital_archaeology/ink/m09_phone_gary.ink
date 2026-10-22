// ================================================
// Mission 9: Digital Archaeology - Gary Whitlock's call (C5)
// Host: gary_phone (phone contact, loading_dock), unvoiced, opened only by its
// mapping on the first attempt at the salvage cage's keypad (m02_gary_protected).
// His own lines take no prefix. Birmingham and the Black Country: flat, a
// bitter joke, slightly less bitter now. UK English. He can't see the room:
// no Montana, no "your wall". The hint is fixed (S6 §2.3), split for the
// 25-word phone cap. Contract §4.3.
// ================================================

// m09 global (CONTRACT §5.3): read by A1 hub 5.
VAR gary_called = false
VAR salvage_opened = false   // Synced scenario global (puzzle chains R1 P5)

=== start ===
// Home stub: not reached by the call; shows only if the player opens his thread after it.
+ [Hello?]
    Narrator: The number rings out.
    #exit_conversation
    -> DONE

=== call ===
#set_global:gary_called:true
// Puzzle chains R1 P5: a player who opened the door at the first try.
{salvage_opened:
    It's Gary. Whitlock, from St. Catherine's. HaX says you're through that keypad already. Didn't need me, then.
- else:
    It's Gary. Whitlock, from St. Catherine's. HaX says you're stood at a keypad in a tape library.
    Seen codes like that. Archives key them to the shelf scheme.
    Read it like a shelf mark, not a number. Vigenère: every letter shifted by the next letter of the bay's word.
    There'll be a chart near the keypad.
}
+ [How's the new job?]
    Director of Cyber Security, me. They gave me a lanyard with my name spelt right. That's how you know it's serious.
    #exit_conversation
    -> DONE
+ [Thanks, Gary.]
    Go on, then. Somebody should read an archive properly for once.
    #exit_conversation
    -> DONE
