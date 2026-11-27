// ================================================
// Awareness E15, full episode: Nilesh Solanki (person, Training Room)
// Tarrowby's IT service desk analyst, 30s, Gujarati-British, grew up in
// Leicester (BRAND_SET.md, E6 additions; built Tarrowby cast, renamed from
// "Dev Mistry" in an earlier draft: keep the built spelling Nilesh Solanki).
// Quick, kind, funny; asking him is always the easiest move, which is the point.
// He frames the exercise; the kiosk runs it (brief, the Friday shortcuts, the
// "six months later" montage, then the scored sort and the Swap Shop drill).
// His record in the erb carries the eventMappings that complete sort_shortcuts
// on episode_e15_shadow_it_defend_complete; the ink reads that global only for its
// closing line.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Placeholder sprite (male_telecom) until the PixelLab reset.
// ================================================

VAR episode_e15_shadow_it_defend_complete = false
VAR kit_defend_done = false
VAR kit_caught = false
VAR kit_key_caught = false
VAR kit_ca15_host_said = false
VAR kit_ca15_out = false
VAR kit_ca15_done = false
VAR hub_quiet = false
// Red-team USB-drop beat (2.6). ca15_drop_given is set by the red_stick knot; the other
// three are set by the shell's eventMappings and read here. All four are declared in the
// scenario globalVariables so they sync. ca15_drop_said is an ink-local flag (not synced):
// it keeps the "after a find" hub line to a single showing.
VAR ca15_drop_offered = false
VAR ca15_drop_given = false
VAR ca15_drop_used = false
VAR ca15_drop_done = false
VAR ca15_drop_said = false

=== start ===
-> hub

=== hub ===
// A chat closed before the stick is given picks the offer up again next time.
{ ca15_drop_offered and not ca15_drop_given and not ca15_drop_done:
    -> red_stick
}
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { ca15_drop_used and not ca15_drop_said:
        Nilesh Solanki: Nobody was careless there. She was being kind, and that's what a drop relies on.
        Nilesh Solanki: A real attacker's stick can run code the moment it's plugged in. That's why unknown devices come to us first.
        ~ ca15_drop_said = true
    - else:
    { kit_defend_done && (kit_ca15_done || not kit_ca15_out) && not kit_ca15_host_said:
        { kit_key_caught:
            { kit_caught:
                Nilesh Solanki: You passed that posted stick to us without plugging it in, so nothing on it ran on a work machine.
            - else:
                Nilesh Solanki: That posted stick came to us unplugged, so nothing on it ran on a work machine. Some of the other shortcuts got past you.
            }
        - else:
            Nilesh Solanki: That stick posted in, marked from the client, was the one to bring to us.
        }
        Nilesh Solanki: A stick in the post is a found stick, whatever the note says. It comes to us, and nobody plugs it in.
        ~ kit_ca15_host_said = true
    - else:
    { episode_e15_shadow_it_defend_complete:
        Nilesh Solanki: That's shadow IT for you. If the official way's slow, tell us rather than building your own way round.
        Nilesh Solanki: And nobody gets told off for asking.
    - else:
        Nilesh Solanki: Nilesh, service desk. Today's about shadow IT. That's work done on devices, apps or accounts IT doesn't know about, usually as a shortcut.
        Nilesh Solanki: Personal email, a free app, a stray USB stick. If something's slowing you down, ask us first.
        Nilesh Solanki: Start at the kiosk. Play out the Friday, then sort what's actually waiting.
    }
    }
    }
}
+ [Thanks, Nilesh.]
    Nilesh Solanki: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// Red-team USB-drop beat: routed to by the shell's eventMappings on the world beat.
// Nilesh hands over the stick as he explains where to leave it (the #give_item is
// server-known: ca15_red_stick is in his itemsHeld), sets ca15_drop_given, then the
// learner can ask why it works or just take it. Both paths park the hub quietly.
=== red_stick ===
Nilesh Solanki: Before we go on, try the attacker's side. One USB stick, no label, no note. #delivery: stepping into the red-team host role, conspiratorial but light
Nilesh Solanki: To a work PC it's an unknown device. Ours is harmless, it only tells us when it's plugged in. #delivery: stepping into the red-team host role, conspiratorial but light
#give_item:usb_storage_swivel:ca15_red_stick
Nilesh Solanki: Leave it next door, somewhere people stop. Then watch who picks it up. #delivery: stepping into the red-team host role, conspiratorial but light
~ ca15_drop_given = true
+ [Why would anyone plug in a stranger's stick?]
    Nilesh Solanki: To find out whose it is. Kindness does the attacker's work. #delivery: stepping into the red-team host role, conspiratorial but light
    Nilesh Solanki: No label is deliberate. A labelled stick gets opened out of nosiness. A blank one gets plugged in to find its owner. #delivery: stepping into the red-team host role, conspiratorial but light
    -> red_stick_leave
+ [On it.]
    -> red_stick_leave

=== red_stick_leave ===
~ hub_quiet = true
#exit_conversation
-> hub
