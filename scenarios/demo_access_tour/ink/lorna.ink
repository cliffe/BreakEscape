// Lorna Easton, facilities. Minimal slice-2 knot: the sticky clone choice shows once the RFID
// cloner is held (cloner_held, the scenario global, synced by name). The tag goes after the last
// spoken line, with hub_quiet, so it reaches the engine with no text. KEEP the #clone_keycard tag.
VAR met = false
VAR hub_quiet = false
VAR looked = false
VAR cloner_held = false

=== start ===
{ met: -> hub }
~ met = true
Lorna Easton: Facilities. If it's a door or a cupboard, it's mine.
~ hub_quiet = true
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Lorna Easton: {&Anything I can help with?|Doors and cupboards, that's me.|Yes?}
}
+ { cloner_held and not looked } [Chat with Lorna, close enough for the cloner in your pocket to read her card.]
    ~ looked = true
    Lorna Easton: Mostly I'm walking the building, checking the cupboard and the server room.
    Lorna Easton: This card gets me everywhere I need. I'd be lost without it.
    ~ hub_quiet = true
    # clone_keycard:FAC-LORNA-01
    -> hub
+ { cloner_held and looked } [Stand close and chat again while the cloner reads her card.]
    Lorna Easton: Still here? I'll be on my rounds in a minute.
    ~ hub_quiet = true
    # clone_keycard:FAC-LORNA-01
    -> hub
+ [Just passing through, thanks.]
    Lorna Easton: No bother.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
