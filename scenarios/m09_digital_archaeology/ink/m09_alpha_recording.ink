// ================================================
// Mission 9: Digital Archaeology - the Alpha tape clip (C6)
// Host: alpha_recording (hidden, tape_room), person-chat opened by its mapping
// on alpha_deck_used, every interaction, at knot `deck`. Each speaker voiced in
// their own voice: Tesseract (m07's voice) styled as an old lecture-room
// recording (tts-audio skill; the user hears it before it ships, C-10).
// Contract §4.4; moral choices §9 item 25. Ends #exit_conversation, -> DONE.
// ================================================

// m09 globals (CONTRACT §5.1, §5.3).
VAR deck_pulled = ""
VAR identity_scene_done = false
VAR alpha_clip_played = false

=== deck ===
{
- deck_pulled != "alpha_tapes":
    Narrator: Empty spools. Degaussed.
- not identity_scene_done:
    Narrator: The reel turns. A man clears his throat in a lecture hall, years ago.
    Agent HaX: I know whose voice that is. After.
- else:
    Dr Adrian Tesseract (recording): The best lock there is opens for the right name. Nobody fights a door that's expecting them.
    Dr Adrian Tesseract (recording): And build your own way out first. Always. Then let them build their way in.
    #set_global:alpha_clip_played:true
    Agent HaX: Tape two. He gave that lecture every year.
}
#exit_conversation
-> DONE
