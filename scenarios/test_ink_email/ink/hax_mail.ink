// test_ink_email: Agent HaX's email thread (ink-driven plain email).
// This story IS the thread. A run of a knot delivers one email; the choices a run ends on are the
// player's suggested replies (the choice text is the start of the player's own message).
// Tags: # subject / # attach / # forward / # reply_after / # speaker:player / # mail_later; the rest are
// ordinary game tags. Tags above a line belong to that line. Everything before the line that carries
// # reply_after is the player's message; that line and what follows is HaX's reply.
VAR found_jump_log = false
VAR report_sent_to_hax = false
VAR contractor_laptop_found = false

=== ask_for_log ===
# subject:Jump server
You're in. Send me whatever you find on the jump server. Auth logs first.
-> reply_options

=== reply_options ===
* {found_jump_log} Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.
    -> send_log
* {not found_jump_log} Nothing yet, still looking.
    # reply_after:6
    Keep at it. The auth log should be on the desk in the server room.
    -> reply_options
* Forwarding the overnight alert.[] Is it ours?
    # forward:seed_alert
    # subject:Fwd: Overnight alert
    # reply_after:5
    Ours. Leave it with me.
    -> reply_options
* [Ask what the 10.0.4.7 range is]
    # speaker:player
    What is 10.0.4.7? Should I know it?
    Contractor VPN. Find the log and I will tell you more.
    -> reply_options

= send_log
# subject:Re: Jump server
# attach:kit_jump_log
# set_global:report_sent_to_hax
# reply_after:8
02:13 from 10.0.4.7. That is the contractor VPN range, and nobody signed off a change.
# complete_task:report_findings
# unlock_door:store_room
I have opened the store room. The contractor laptop is on the second shelf.
# mail_later:40:hax_chaser
-> DONE

=== hax_chaser ===
{ not contractor_laptop_found:
    # subject:Contractor laptop
    Any luck with that laptop? Store room, second shelf.
}
-> DONE

=== store_room_note ===
# subject:Store room
Good, you're in. Do not power the laptop on. Photograph the label and leave it where it is.
-> DONE

=== on_compose ===
* {found_jump_log && not report_sent_to_hax} Log attached from the jump server.
    -> reply_options.send_log
+ Where should I look next?
    # reply_after:6
    Server room first. Then tell me what you find.
    -> DONE
