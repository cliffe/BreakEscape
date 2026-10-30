// Fixture for the ink-driven plain email tests (test/js/social-mail-ink-runner.test.mjs).
// Compile: bin/inklecate -o test/js/fixtures/social/mail/hax_plain.json test/js/fixtures/social/mail/hax_plain.ink
VAR found_jump_log = false
VAR report_sent_to_hax = false
VAR contractor_laptop_found = false
VAR nudges = 0

=== ask_for_log ===
# subject:Jump server
You're in. Send me whatever you find on the jump server. Auth logs first.
-> reply_options

=== reply_options ===
* {found_jump_log} Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.
    -> send_log
* {not found_jump_log} Nothing yet, still looking.
    # reply_after:15
    ~ nudges += 1
    Keep at it. The auth log is usually under /var/log.
    -> reply_options
* Forwarding the overnight alert.[] Is it ours?
    # forward:seed_alert
    # subject:Fwd: Overnight alert
    # reply_after:5
    Ours. Leave it with me.
    -> DONE
* [Ask where to look]
    # speaker:player
    Where should I be looking?
    Server room first.
    -> DONE

= send_log
# subject:Re: Jump server
# attach:kit_jump_log
# set_global:report_sent_to_hax
# complete_task:report_findings
# reply_after:20
02:13 from 10.0.4.7. That is the contractor VPN range, and nobody signed off a change.
I have flagged it to Netherton. Check the contractor laptop in the store room next.
# mail_later:90:hax_chaser
~ report_sent_to_hax = true
-> DONE

=== hax_chaser ===
{ not contractor_laptop_found:
    # subject:Contractor laptop
    Any luck with that laptop? Store room, second shelf.
}
-> DONE

=== on_compose ===
* {found_jump_log && not report_sent_to_hax} Log attached from the jump server.
    -> reply_options.send_log
+ Where should I look next?
    # reply_after:10
    Server room first. Then tell me what you find.
    -> DONE
