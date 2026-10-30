// test_ink_email: Dr Ines Varga, an ink correspondent who is ALSO a judged phishing target.
// The ink offers suggested replies; "Write your own message" is the judged path
// (the contact carries both npc and targetId).
VAR ines_seminar_covered = false

=== ask_cover ===
# subject:Thursday seminar
Hello. Could you cover my Thursday seminar? I have a clash with the board.
-> options

=== options ===
* Happy to cover it. Send me the slides.
    # set_global:ines_seminar_covered
    # reply_after:5
    Thank you. The slides are in the shared folder.
    -> DONE
* Sorry, I can't make Thursday.
    # reply_after:5
    No problem. I will ask someone else.
    -> DONE
