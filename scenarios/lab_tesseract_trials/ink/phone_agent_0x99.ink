// ================================================
// The Keyholder Trials: Agent HaX on the player's phone
// Field notes on request, a progress-driven hint ladder, the climax choices
// (send / warn in band), Megan, the Comms fallback, and the debrief trigger.
// Phone lines take no "Name:" prefix. No knot ends in DONE or END.
// DESIGN sections 6 and 8.
// ================================================

// Synced scenario globals (read here; written with #set_global)
VAR comms_had = false
VAR lockbox_open = false
VAR locker_open = false
VAR guest_terminal_open = false
VAR corridor_open = false
VAR library_open = false
VAR special_collections_open = false
VAR pigeonholes_open = false
VAR drop_box_open = false
VAR workshop_open = false
VAR relay_opened = false
VAR ghost_offer_made = false
VAR decision_made = false
VAR ending = ""
VAR warned_out_of_band = false
VAR refusal_reported = false
VAR megan_file_read = false
VAR megan_choice = ""
VAR fn04_offered = false
VAR fn05_offered = false
VAR fn06_offered = false
VAR fn07_offered = false
VAR fn08_offered = false
VAR fn09_offered = false
VAR fn10_offered = false
VAR fn11_offered = false
VAR fn07_had = false
VAR fn10_had = false

// Ink-local state
VAR fn04_sent = false
VAR fn05_sent = false
VAR fn06_sent = false
VAR fn07_sent = false
VAR fn08_sent = false
VAR fn09_sent = false
VAR fn10_sent = false
VAR fn11_sent = false
VAR hint_step = ""
VAR hint_rung = 0

=== start ===
-> hub

=== hub ===
#speaker:agent_0x99
{ decision_made:
    Call me when you're clear.
- else:
    { ghost_offer_made:
        I'm here. Careful what you say on this line.
    - else:
        Go ahead.
    }
}
+ {decision_made} [I'm clear. Debrief me.]
    -> debrief
+ {ending == "refused" and not refusal_reported} [I turned the Keyholder down.]
    -> refusal_report
+ {ghost_offer_made and not decision_made} [Sending you my report now.]
    -> send_report
+ {ghost_offer_made and not decision_made} [It's a trap. Don't open anything from me.]
    -> warn_in_band
+ {megan_file_read and megan_choice == "" and not decision_made} [Megan Oyelaran is on their list. Can we help her?]
    -> megan_request
+ {not comms_had} [Remind me how I reach you if this phone's no good.]
    -> comms_reminder
+ {field_note_waiting()} [Send me that field note.]
    -> send_field_note
+ {not decision_made} [I'm stuck.]
    -> stuck
+ [That's all for now.]
    #exit_conversation
    Copy.
    -> hub

=== function field_note_waiting() ===
~ return (fn11_offered and not fn11_sent) or (fn10_offered and not fn10_sent and not fn10_had) or (fn08_offered and not fn08_sent) or (fn09_offered and not fn09_sent) or (fn07_offered and not fn07_sent and not fn07_had) or (fn06_offered and not fn06_sent) or (fn05_offered and not fn05_sent) or (fn04_offered and not fn04_sent)

// ------------------------------------------------
// Field notes: the newest offered note that hasn't been sent
// ------------------------------------------------
=== send_field_note ===
{
- fn11_offered and not fn11_sent:
    ~ fn11_sent = true
    #give_item:notes:fn11_text_encodings
    EBCDIC. Old mainframes. Sent.
- fn10_offered and not fn10_sent and not fn10_had:
    ~ fn10_sent = true
    #give_item:notes:fn10_hax
    Signatures. Read the part about what was signed. Sent.
- fn08_offered and not fn08_sent:
    ~ fn08_sent = true
    #give_item:notes:fn08_aes
    AES. Sent.
- fn09_offered and not fn09_sent:
    ~ fn09_sent = true
    #give_item:notes:fn09_public_key
    Public keys. Sent.
- fn07_offered and not fn07_sent and not fn07_had:
    ~ fn07_sent = true
    #give_item:notes:fn07_hax
    Hashes. Sent.
- fn06_offered and not fn06_sent:
    ~ fn06_sent = true
    #give_item:notes:fn06_vigenere
    Vigenère. Sent.
- fn05_offered and not fn05_sent:
    ~ fn05_sent = true
    #give_item:notes:fn05_layers_caesar
    Layers, and your first key. Sent.
- fn04_offered and not fn04_sent:
    ~ fn04_sent = true
    #give_item:notes:fn04_base64
    Base64. Sent.
- else:
    Nothing new to send. You've got them all so far.
}
-> hub

// ------------------------------------------------
// Comms fallback (N2, R3-12)
// ------------------------------------------------
=== comms_reminder ===
{ not lockbox_open:
    #give_item:notes:comms_discipline_hax
    Read it, then keep it. It's the one thing on this phone I'd rather nobody else saw.
- else:
    Not on this line. It's in your brief.
}
-> hub

// ------------------------------------------------
// Megan (mid-mission choice, ask HaX)
// ------------------------------------------------
=== megan_request ===
{ megan_choice != "": -> hub }
Not on this line. Leave it with me.
#set_global:megan_choice:protected
#set_global:megan_choice_made:true
~ megan_choice = "protected"
-> hub

// ------------------------------------------------
// The climax choices
// ------------------------------------------------
=== send_report ===
{ decision_made: -> hub }
{ warned_out_of_band:
    ~ ending = "double"
    #set_global:ending:double
- else:
    ~ ending = "sent"
    #set_global:ending:sent
}
#set_global:decision_made:true
~ decision_made = true
Received.
-> hub

=== warn_in_band ===
{ decision_made: -> hub }
~ ending = "blown"
#set_global:ending:blown
#set_global:decision_made:true
~ decision_made = true
Understood.
-> hub

=== refusal_report ===
~ refusal_reported = true
#set_global:refusal_reported:true
Copy. Leave by the front. Don't run. Then call me.
-> hub

=== debrief ===
#set_global:start_debrief_cutscene:true
#exit_conversation
On my way to you.
-> hub

// ------------------------------------------------
// Hint ladder: three rungs for the current step
// ------------------------------------------------
=== stuck ===
~ temp step = "l1"
{
- ghost_offer_made:
    ~ step = "climax"
- workshop_open:
    ~ step = "l10"
- drop_box_open:
    ~ step = "l9"
- pigeonholes_open:
    ~ step = "l8"
- special_collections_open:
    ~ step = "l7"
- library_open:
    ~ step = "l6"
- corridor_open:
    ~ step = "l5"
- guest_terminal_open:
    ~ step = "l4"
- locker_open:
    ~ step = "l3"
- lockbox_open:
    ~ step = "l2"
}
-> rung(step)

=== rung(step) ===
{ hint_step != step:
    ~ hint_step = step
    ~ hint_rung = 0
}
{ hint_rung < 3:
    ~ hint_rung = hint_rung + 1
}
{
- step == "climax":
    Whatever you've been handed, read it before you do anything with it.
- step == "l1":
    { hint_rung:
    - 1: Each number on the leaflet is one character.
    - 2: Look them up on your ASCII chart, or let CyberChef do it.
    - else: From Decimal. Type the word into the lockbox exactly as it comes out.
    }
- step == "l2":
    { hint_rung:
    - 1: The keypad wants four digits. You have eight.
    - 2: The digits 0 to 9 are ASCII 48 to 57, two digits each. If you got four capital letters, it read them as hex.
    - else: Put a space after every two digits, then From Decimal. If the keypad locks you out, walk away and try again.
    }
- step == "l3":
    { hint_rung:
    - 1: Only noughts and ones, in groups of eight.
    - 2: Each group is one byte, so one character.
    - else: From Binary. The guest terminal's in the teaching lab.
    }
- step == "l4":
    { hint_rung:
    - 1: Nought to nine and a to f only.
    - 2: Two hex digits per byte. It doesn't need spaces.
    - else: From Hex. The password for the corridor door is the last word.
    }
- step == "l5":
    { hint_rung:
    - 1: Letters, digits, maybe a plus or a slash, and equals signs at the end.
    - 2: Base64. Six bits per symbol. The poster shows how.
    - else: From Base64. The library keypad's PIN is in the sentence.
    }
- step == "l6":
    { hint_rung:
    - 1: Two layers. What's the outside one?
    - 2: After Base64 you've got shifted letters. The slip gives the shift.
    - else: From Base64, then ROT13 with Amount minus six.
    }
- step == "l7":
    { hint_rung:
    - 1: Trial VII needs a key word. The file's notes say where.
    - 2: Dr Selvarajan's whiteboard. Block four.
    - else: Copy only the ciphertext. Vigenère Decode, with block four's word as the key. It gives you the pigeonhole code and an IV. Paste the IV onto the drop box tag in your notepad.
    }
- step == "l8":
    { hint_rung:
    - 1: Your envelope is sealed to your public key. What opens it?
    - 2: Your private key is on your lab account in the teaching lab. The drop box then wants a key, an IV and its tag.
    - else: From Base64, then RSA Decrypt with your private key pasted in. Thirty-two hex characters come out: an AES key. Then AES Decrypt on the tag, with that key and Trial VII's IV. Leave the rest.
    }
- step == "l9":
    { hint_rung:
    - 1: Some locks just want a key.
    - 2: Check what came out of the drop box.
    - else: The brass key opens the workshop, north of the corridor.
    }
- step == "l10":
    { hint_rung:
    - 1: It wants a fingerprint, not a password.
    - 2: SHA-256 of the drop box passphrase. First eight characters.
    - else: Add SHA2 under AES Decrypt in the recipe you've got, Size two fifty-six. Or Dr Selvarajan's handout.
    }
}
-> hub
