// ================================================
// Mission 9: Digital Archaeology - David Torres' call (C4)
// Host: torres_phone (phone contact, loading_dock), unvoiced, opened only by its
// mapping: at the Harwick & Lowe boxes after flag 2 (m05_torres_turned), or the
// fallback once the Reading is found and he hasn't rung (stage 4 §6.6).
// Turned branch only. His own lines take no prefix. m05's voice: soft, slow.
// He knows the legacy filing scheme, one step off the search, and doesn't
// choose between the names. Phone lines 25 words at most. Contract §4.3.
// ================================================

// m09 globals (CONTRACT §5.1, §5.3).
VAR torres_called = false
VAR sleeper_shortlist = false

=== start ===
// Home stub: not reached by the call; shows only if the player opens his thread after it.
+ [Hello?]
    Narrator: The number rings out.
    #exit_conversation
    -> DONE

=== call ===
#set_global:torres_called:true
I gave you this address last spring. It was a line in a list.
I am still a live placement. Every morning I wake up, and I am still a line in her book.
// C-8: the pointer, by whether the firm's placing sheet has been read.
{ sleeper_shortlist:
    Two names from the firm's sheet, I think. Read the next of kin on each. That is the line they hire on.
- else:
    The old placements are filed under the firm that placed them. Find the firm's boxes, then the placing sheet.
}
They pick people with someone to lose. Look for the ones with a sick parent.
+ [Are you safe?]
    Safe enough. Please be quick.
    #exit_conversation
    -> DONE
+ [Thank you, David.]
    Do not thank me. I was one of them.
    #exit_conversation
    -> DONE
