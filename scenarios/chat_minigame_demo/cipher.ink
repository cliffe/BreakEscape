// ================================================
// chat_minigame_demo: Cipher (video-call)
// A remote contact rendered through person-chat's framed video-call view.
// Triggered by reading the Video Console (sets video_console_accessed = true),
// which fires the NPC's conversationMode:"video-call" event mapping at knot
// incoming_call. Demonstrates: the call frame + status bar, and the player
// self-view picture-in-picture (first frame while listening).
// ================================================

=== start ===
-> incoming_call

=== incoming_call ===
#speaker:cipher
Cipher: And we're live. This is the video-call view.
Cipher: It's the same person-chat portrait, but framed like a secure call -- a status bar up top, and your own camera feed in the corner.
Cipher: That little picture-in-picture is you. It holds your first frame while you listen.

* [Why use this instead of person-chat?]
    Cipher: When the other party isn't in the room with you. A remote contact, on a screen.
    -> outro
* [Slick.]
    Cipher: I know.
    -> outro

=== outro ===
#speaker:cipher
Cipher: That's all three chat styles -- person-chat, phone-chat, and this. Go build something.

> CALL ENDED

#exit_conversation
-> DONE
