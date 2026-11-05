// Test fixture: facilities worker on rounds. Short hub with a badge-clone option.
// KEEP the # clone_keycard tag: it is what the RFID cloner reads.

VAR met = false
VAR hub_quiet = false
VAR looked = false

=== start ===
{ met: -> hub }
~ met = true
Sam Ellery: Afternoon. Sam, facilities. *glances up from a clipboard* Something I can help with?
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Sam Ellery: {&Still on my rounds. What do you need?|Yes? Anything I can help with?}
}
+ { not looked } [Mind if I have a look at your staff badge?]
    ~ looked = true
    Sam Ellery: This old thing? Only gets me through the staff door. Go on, then.
    # clone_keycard:test_staff_badge
    Sam Ellery: *holds it out* Had it years.
    -> hub
+ { looked } [Can I take another look at that badge?]
    Sam Ellery: Help yourself.
    # clone_keycard:test_staff_badge
    -> hub
+ [Busy shift?]
    Sam Ellery: Steady enough. I walk the rounds and keep the doors behaving.
    -> hub
+ [Just passing through, thanks.]
    Sam Ellery: No bother.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== challenge ===
Sam Ellery: Hold on, that door is staff only. *steps across the doorway* Back this way, please.
#exit_conversation
-> hub
