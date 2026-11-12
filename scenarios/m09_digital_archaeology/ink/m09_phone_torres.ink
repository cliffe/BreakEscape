// ================================================
// Mission 9: Digital Archaeology - David Torres' call (C4)
// Host: torres_phone (phone contact, loading_dock). Voiced incoming call (ring:
// answer, decline or call back when missed). Rings once at the Harwick & Lowe
// boxes after flag 2 (m05_torres_turned): on trying the lid and backing out, or
// once the lid has opened (puzzle chains R1 P2); or the fallback on leaving
// Sorensen's office with the Reading found
// (P7; was on reading_found, which could shut the safe mid-read).
// Turned branch only. His own lines take no prefix. m05's voice: soft, slow.
// He knows the legacy filing scheme, one step off the search, and doesn't
// choose between the names. Phone lines 25 words at most. Contract §4.3.
// ================================================

// m09 globals (CONTRACT §5.1, §5.3).
VAR torres_called = false
VAR sleeper_shortlist = false
VAR hl_box_opened = false   // Synced scenario global (puzzle chains R1 P2): HaX sets it on the box's unlock

=== start ===
// Home stub (lesson 21): not reached by the call. A finished call rests the thread here and shows
// the transcript; the Close choice keeps the story live, so no "Conversation ended" notice shows next to
// a missed call's Call back button. A missed call still leaves the engine's Call back (no fake ring-back).
+ [(Close.)]
    #exit_conversation
    -> start

=== call ===
// lint: call-knot
#set_global:torres_called:true
I gave you this address back in October. It was a line in a list.
I am still a live placement. Every morning I wake up, and I am still a line in her book.
// C-8: the pointer, by whether the firm's placing sheet has been read.
{ sleeper_shortlist:
    Two names from the firm's sheet, I think. Read the next of kin on each. That is what they hire on.
- else:
    // Puzzle chains R1 P2: by whether the firm's box is open yet.
    {hl_box_opened:
        The old placements are filed under the firm that placed them. Read the placing sheet in the firm's box.
    - else:
        The old placements are filed under the firm that placed them. Their boxes take the ledger's file number. Then the placing sheet.
    }
    // R2 C-R2-05: the shortlist arm already points at next of kin.
    They pick people with someone to lose. Look for the ones with a sick parent.
}
+ [Are you safe?]
    Safe enough. Please be quick.
    #exit_conversation
    -> DONE
+ [Thank you, David.]
    Do not thank me. I was one of them.
    #exit_conversation
    -> DONE
