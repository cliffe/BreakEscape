// ================================================
// Mission 9: Digital Archaeology - Nightshade's call (C3)
// Host: nightshade_phone (phone contact, loading_dock), unvoiced, opened only by
// its mapping (flag1_submitted && m08_nightshade_triple_agent, delayMs 7000).
// Triple-agent branch only. His own lines take no prefix; HaX is prefixed.
// UK English. Collegial, precise, an image in place of jargon; serene, a little
// tired. Beat 1.4: he names what the restricted cage's locks give way to.
// Phone lines 25 words at most. His two texts back are in texts/C_texts_and_credits.md.
// Contract §4.3.
// ================================================

=== start ===
// Home stub: not reached by the call; shows only if the player opens his thread after it.
+ [Hello?]
    Narrator: The number rings out.
    #exit_conversation
    -> DONE

=== call ===
Agent 0x00. I'd ask how the leave was, but HaX would tell me to get off her line.
// Alignment R1 m3: help only he can give (HaX has said print and card).
Her card's on custom keys. Crack the keys first, then read it. Don't guess.
That plan chest isn't on her schedule. It never was. Whatever's in it, he wanted kept.
+ [Why help me?]
    I'd rather be useful than watched. Tonight I get to be both.
+ [HaX is on this line.]
    I know. She's been listening since before you picked up.
- Every lock is a promise somebody made years ago. Most of them forget they made it. Goodnight, 0x00.
Agent HaX: He's right. I hate that he's right.
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [Noted.]
    #exit_conversation
    -> DONE
