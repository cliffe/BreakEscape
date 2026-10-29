// ================================================
// Awareness E13, full episode: Gwen Pritchard (person, Training Room)
// Brightwell's IT service desk lead, late 30s, Welsh (BRAND_SET.md, Brightwell
// cast; the same established Gwen, not a new surname). She welcomes, hands the
// seat over after the red-team half, runs the announced video-call demo, and
// receives the reports. Placeholder sprite (female_telecom_v2) until the
// PixelLab reset.
//
// Her NPC record carries the N16 mappings that complete plant_hidden_instruction
// (once a brief has been sent: phish_assist_reader_attempts > 0) and
// handle_assistant_inbox (on the defend set's done global), so the hub ink only
// reads those globals for its line, and the middle line keys on the attempt, not
// on whether it landed (scoring is defence only).
//
// === demo_call ===
// The announced deepfake demo (E13 section 9.2 beat 4). It is opened in the FLIP
// region as a person-chat conversationMode:"video-call" conversation, by an event
// mapping with targetKnot "demo_call" (ENG-07 labels the bar "Brightwell Meet";
// internal, no External tag). The fake Gwen asks for the six-digit code shown on
// the learner's phone; the code value is on screen only and is NEVER spoken
// (E13 section 18). No glitch, no freeze frame on the fake (core_15 pitfall):
// the real Gwen simply ends the call and turns from the next desk.
//
// Resting point is the hub (goodbye parks there quietly; a re-talk re-enters it
// and says the line that fits the moment).
// ================================================

VAR phish_assist_reader_attempts = 0
VAR episode_e13_ai_assistant_defend_done = false
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e13_ai_assistant_defend_done:
        Gwen Pritchard: That's them handled, thank you. You can't always tell a fake voice or face, so the answer's always the same.
        Gwen Pritchard: Check another way, on a number you already hold. Nobody's ever in trouble for checking.
    - else:
        { phish_assist_reader_attempts > 0:
            Gwen Pritchard: Good, that's your hidden line planted. Now the other side: use the assistant for real, and deal with what lands.
            Gwen Pritchard: The test I mentioned is in here somewhere.
        - else:
            Gwen Pritchard: Welcome. Brightwell Assist is live. First, red team: write a supplier brief with a line hidden in it for the assistant.
            Gwen Pritchard: Then swap seats, use it for real, and handle what comes at you. A test is coming, I'll say when.
        }
    }
}
+ [Thanks, Gwen.]
    Gwen Pritchard: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== demo_call ===
Gwen Pritchard: It's Gwen, on Brightwell Meet. Quick one: read me the six-digit code on your phone so I can clear your assistant access.
+ [Read the code out]
    Gwen Pritchard: Lovely, that's it, you're all set. Speak later.
    -> reveal
+ [Leave the call and check another way]
    -> reveal
+ [Ask a question before answering]
    Gwen Pritchard: No need, honestly, it's just me, and I'm between meetings. The code's the quick way.
    -> reveal

=== reveal ===
Gwen Pritchard: Right, that was me, but watch. I end the call and turn round from the next desk.
Gwen Pritchard: Same face, same voice, on our own meeting tool. None of that proved it was me asking.
Gwen Pritchard: When a call wants a code, money or data, pause. End it, call back on a number you hold, or ask someone. Then report it.
+ [Understood.]
    Gwen Pritchard: You don't need to spot a deepfake. You need to check another way.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
