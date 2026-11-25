// Ops demo (Terminal) host: Ama Owusu of Fenlow Managed IT (person, office).
// Hub knot is `hub`; levers, "What's next?", recaps and the short version divert back to it.
// Plan: docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md 2.4. Every VAR below except met_ama is a scenario global
// that the scenario file declares with the same initial value, synced in when the conversation starts.
// An ink write to a declared global is also sent as #set_global where an event or a room reads it.
// No evening and no "Call it a day": the last beat is the unplug.
// The two self-reports (console, log) and the token self-report are not checked by the engine.

VAR coffee_call = 0
VAR plug_in_done = false
VAR sweep_done = false
VAR use_token_done = false
VAR needs_console_done = false
VAR scan_check_done = false
VAR console_done = false
VAR confirm_all_done = false
VAR step_up_done = false
VAR keeps_log_done = false
VAR relay_seen = false
VAR shared_screen_done = false
VAR graham_assist_ended = false
VAR token_ran_out = false
VAR token_expired_done = false
VAR spare_port_offered = false
VAR unplug_done = false
VAR met_ama = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
I'm Ama, from Fenlow. Zainab is setting up remote support on the file server. Let's look at it the way an attacker's tools would.
# speaker:npc
This drop box is yours. I'll point out each step.
-> hub

=== hub ===
# speaker:npc
{&What can I help with?|Anything else?|Go on.}
- (choices)
+ [What's next?]
    -> whats_next
+ [Send them for coffee.]
    -> lever_coffee
+ { not shared_screen_done } [Ask Graham to end the shared screen.]
    -> lever_end_screen
+ { scan_check_done and not console_done } [I used the console.]
    -> console_talk
+ { step_up_done and not keeps_log_done } [My log's still there.]
    -> log_talk
+ { (sweep_done and not token_ran_out and not (use_token_done and needs_console_done)) or (shared_screen_done and not token_expired_done) } [My token's greyed out.]
    -> token_out
+ { token_ran_out and not (use_token_done and needs_console_done) and not spare_port_offered } [Can I have another go?]
    -> spare_offer
+ { plug_in_done } [What did that show?]
    -> recap
+ [Give me the short version.]
    -> short_version
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END

=== whats_next ===
{
    - not plug_in_done:
        # speaker:npc
        Plug the box into the server room port, by the rack. This time the view opens as a Terminal.
    - not sweep_done:
        # speaker:npc
        Sweep the network, then look at the table it gives you.
    - not use_token_done:
        # speaker:npc
        Zainab left a sign-in token for the backup PC. It's in your keyring now the box is in. Use it while it's fresh.
    - not needs_console_done:
        # speaker:npc
        While the token's live, plug the keystroke device into the backup PC's socket.
    - not scan_check_done:
        # speaker:npc
        Scan the file server, then check its storage service.
    - not console_done:
        # speaker:npc
        Open the console and search, then ask for info on one finding. Then tell me.
    - not confirm_all_done:
        # speaker:npc
        Confirm all three. Only that tells them apart.
    - not step_up_done:
        # speaker:npc
        Ask Zainab for her card. Use it on the real update finding, then the tool roll card on the settings one.
    - not keeps_log_done:
        # speaker:npc
        Switch to Panels and back. Your Terminal log is still there. Then tell me.
    - not shared_screen_done:
        { relay_seen:
            # speaker:npc
            Keep his screen open, then ask me to have Graham end it.
        - else:
            # speaker:npc
            Ask Graham to share his screen.
        }
    - not token_expired_done:
        # speaker:npc
        Your token runs out six minutes after the box went in. When it shows greyed out in your keyring, tell me.
    - not unplug_done:
        # speaker:npc
        To finish, unplug from the Terminal. Try a short form of the word first.
    - else:
        # speaker:npc
        That's the lot. Ask for the short version, or stay and look round.
}
-> hub

=== lever_coffee ===
~ coffee_call = coffee_call + 1
# speaker:npc
Right. A coffee run. Chidi will head for the machine.
-> hub

=== lever_end_screen ===
{ not relay_seen:
    # speaker:npc
    Connect to his screen first.
    -> hub
}
~ graham_assist_ended = true
~ shared_screen_done = true
#set_global:graham_assist_ended:true
#set_global:shared_screen_done:true
#complete_task:shared_screen
# speaker:npc
Gone. A shared screen lasts only as long as its owner allows.
-> hub

=== console_talk ===
# speaker:npc
What did the console say?
+ [It listed a module for every finding.]
    # speaker:npc
    The false one too. A module existing proves nothing about this server.
    -> console_ticked
+ [Info gave a write-up and reference ids.]
    # speaker:npc
    That's how you look a weakness up. It doesn't tell you it's real here.
    -> console_ticked
+ [Actually, I haven't yet.]
    # speaker:npc
    Try it, then tell me.
    -> hub

=== console_ticked ===
~ console_done = true
#complete_task:console
# speaker:npc
Search and info are a console's way of listing what exists. Testing is what tells you what's true.
-> hub

=== log_talk ===
~ keeps_log_done = true
#complete_task:keeps_log
# speaker:npc
The Terminal stays for as long as the view is open, with everything you typed.
-> hub

=== token_out ===
~ token_ran_out = true
~ token_expired_done = true
#set_global:token_ran_out:true
#set_global:token_expired_done:true
#complete_task:token_expired
{ use_token_done and needs_console_done:
    # speaker:npc
    Tokens run out. Once the clock's gone, the token won't open anything again.
    -> hub
}
-> spare_offer

=== spare_offer ===
~ spare_port_offered = true
#set_global:spare_port_offered:true
# speaker:npc
If your token's greyed out before you used it, move the box to the spare port by the rack. Zainab left a second token for that one.
-> hub

=== recap ===
# speaker:npc
Which part?
+ [Getting in.]
    -> recap_in
+ { scan_check_done } [The report.]
    -> recap_report
+ { relay_seen or token_expired_done or unplug_done } [Remote ways in.]
    -> recap_remote

=== recap_in ===
{ sweep_done:
    # speaker:npc
    The sweep listed the machines that answer, as a table.
}
{ use_token_done:
    # speaker:npc
    The token signed you in to the backup PC without a password. Whoever holds a token holds the account, for as long as it lasts.
}
{ needs_console_done:
    # speaker:npc
    The keystroke device wanted someone at the keyboard. A remote session isn't one.
}
-> hub

=== recap_report ===
{ scan_check_done:
    # speaker:npc
    The scan and the check gave each finding a scanner's write-up. The names and ids are invented for training.
}
{ confirm_all_done:
    # speaker:npc
    Testing sorted two real findings from one false one.
}
{ step_up_done:
    # speaker:npc
    The first real finding gave a user session. The second needed it, and gave an administrator's.
}
-> hub

=== recap_remote ===
{ relay_seen:
    # speaker:npc
    A shared screen is somebody else's session, on loan.
}
{ token_expired_done:
    # speaker:npc
    The token was good only for its clock.
}
{ unplug_done:
    # speaker:npc
    Unplugging the box ended every session that ran through it.
}
-> hub

=== short_version ===
# speaker:npc
A scanner's write-up is a report. Test each finding before you trust it.
# speaker:npc
A token, a shared screen and a saved link all work without a password, but each can run out or be ended.
# speaker:npc
Some tools need a person at the keyboard. A remote session isn't one.
-> hub
