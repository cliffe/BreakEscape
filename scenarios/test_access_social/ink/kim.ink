VAR hub_quiet = false
// Scenario globals: the habit sets u1_kim_emailed_file at her first refusal (usbHabit.setGlobal);
// u1_kim_gave_usb keeps the give once-only across a reload (a * choice resets on reload).
VAR u1_kim_emailed_file = false
VAR u1_kim_gave_usb = false
=== start ===
# speaker:npc
Sorry, busy. What is it?
~ hub_quiet = true
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    # speaker:npc
    Anything else?
}
+ [How's work today?]
    # speaker:npc
    Ask me again when the systems are working.
    -> hub
// Offered only after her first refusal (review R2 M1): a hand-over before it would stop the
// habit before the refusal, the email and the vent post could ever happen.
+ {u1_kim_emailed_file and not u1_kim_gave_usb} [That USB stick isn't much use to you now, is it?]
    ~ u1_kim_gave_usb = true
    #give_item:usb
    # speaker:npc
    No. IT blocks it on every PC. Keep it, I'll stick to email.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    # speaker:npc
    Cheers.
    -> hub
