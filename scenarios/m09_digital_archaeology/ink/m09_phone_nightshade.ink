// ================================================
// Mission 9: Digital Archaeology - Nightshade's call (C3)
// Host: nightshade_phone (phone contact, loading_dock). Voiced incoming call
// (ring: answer, decline or call back when missed), rung once HaX's flag-1
// read-out has reached its card line (flag1_read_done), on closing her thread;
// a cage-gate fallback and a room_entered reload backstop cover the other paths.
// Triple-agent branch only. His own lines take no prefix; HaX is prefixed.
// UK English. Collegial, precise, an image in place of jargon; serene, a little
// tired. Beat 1.4: he names what the restricted cage's locks give way to.
// Phone lines 25 words at most. His two texts back are in texts/C_texts_and_credits.md.
// Contract §4.3.
// ================================================

// m2: synced scenario globals, so a call back made after the cage is open or his
// file is in hand drops the pre-cage advice (would otherwise say "crack the keys first").
VAR cage_opened = false
VAR nightshade_file_held = false

=== start ===
// Home stub (lesson 21): not reached by the call. A finished call rests the thread here and shows
// the transcript; the Close choice keeps the story live, so no "Conversation ended" notice shows next to
// a missed call's Call back button. A missed call still leaves the engine's Call back (no fake ring-back).
+ [(Close.)]
    #exit_conversation
    -> start

=== call ===
// lint: call-knot
Agent 0x00. I'd ask how the leave was, but HaX would tell me to get off her line.
// Alignment R1 m3: help only he can give (HaX has said print and card).
// m2: by how far on the player is when the call connects (a late call back).
{
    - nightshade_file_held:
        So you've found my file. Never mind the boy in it. Look at the handwriting.
    - cage_opened:
        You're past her gate. The plan cabinet was never on her schedule -- that's how you know he wanted it kept. Read it.
    - else:
        Sorensen's card is on custom keys. Crack the keys first, then read it. Don't guess.
        That plan cabinet isn't on her schedule. It never was. Whatever's in it, he wanted kept.
}
+ [Why help me?]
    I'd rather be useful than watched. Tonight I get to be both.
+ [HaX is on this line.]
    I know. She's been listening since before you picked up.
- Every lock is a promise somebody made years ago. Most of them forget they made it. Goodnight, 0x00.
// Phone-calls M10 (2.10, 3.5): m09 has two "Agent HaX" records (agent_0x99 phone, hax_voice in person),
// so the co-speaker prefix is the id, not the display name, to fix the voice to the phone record.
agent_0x99: He's right. I hate that he's right.
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [Noted.]
    #exit_conversation
    -> DONE
