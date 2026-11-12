VAR hub_quiet = false
// Scenario globals: the habit sets u1_kim_emailed_file at her first refusal (usbHabit.setGlobal);
// u1_kim_gave_usb is set by the stick's own onPickup once it reaches the player's tray, so only
// a give that worked (or a pick-up after a knock-out) closes the choice, and it stays closed
// after a reload (review R3 n5). u1_kim_asked_usb hides the choice from the hub listed straight
// after the give, while it is on its way; any other choice (and start, after a reload) clears it,
// so a give the server refused can be asked for again.
VAR u1_kim_emailed_file = false
VAR u1_kim_gave_usb = false
VAR u1_kim_asked_usb = false
=== start ===
~ u1_kim_asked_usb = false
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
    ~ u1_kim_asked_usb = false
    # speaker:npc
    Ask me again when the systems are working.
    -> hub
// Offered only after her first refusal (review R2 M1): a hand-over before it would stop the
// habit before the refusal, the email and the vent post could ever happen.
+ {u1_kim_emailed_file and not u1_kim_gave_usb and not u1_kim_asked_usb} [That USB stick isn't much use to you now, is it?]
    ~ u1_kim_asked_usb = true
    #give_item:usb
    # speaker:npc
    No. IT blocks it on every PC. Keep it, I'll stick to email.
    -> hub
+ [I'll let you get on.] #exit_conversation
    ~ hub_quiet = true
    ~ u1_kim_asked_usb = false
    # speaker:npc
    Cheers.
    -> hub
