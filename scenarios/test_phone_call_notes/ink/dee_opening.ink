// test_phone_call_notes, contact agent_dee (A1 R2 M1): a voiced contact whose preloaded opening has a
// #delivery: note. The phone preloads it on pickup; if the player reloads before opening the thread,
// the note must survive (the message's deliveryTags) so the first open still speaks it with the note.
=== start ===
Dee here, pick up. #delivery: breathless, glancing behind her
I only have a minute.
+ [Go on.]
    Good. Listen.
    #exit_conversation
    -> DONE
