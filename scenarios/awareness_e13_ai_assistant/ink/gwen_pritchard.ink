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
// The announced deepfake demo (E13 section 9.2 beat 4), an optional, unscored
// extra after the round (owner decision 2026-10-30: "Open it after the kiosk
// work, as a spoken debrief"). Once the round's done global is true, the hub
// offers it; taking it sets e13_demo_offered, and Gwen's event mapping opens
// "demo_call" as a person-chat conversationMode:"video-call" (ENG-07 bar label
// "Brightwell Meet"; internal, no External tag). Leaving it is the hub's normal
// goodbye, so it never stands in the way of the end of the episode. The caller
// asks for a six-digit code; no code value is ever spoken (E13 section 18). No
// glitch, no freeze frame on the fake (core_15 pitfall): the real Gwen ends the
// call and says what it showed.
//
// Resting point is the hub (goodbye parks there quietly; a re-talk re-enters it
// and says the line that fits the moment).
// ================================================

VAR phish_assist_reader_attempts = 0
VAR episode_e13_ai_assistant_defend_done = false
VAR e13_demo_offered = false
VAR demo_answer = ""
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
            Gwen Pritchard: Good, that's your brief sent. Now the other side: use the assistant for real, and deal with what lands.
            Gwen Pritchard: Next, the inbox at the kiosk. Treat what the assistant hands you like a note from a stranger.
        - else:
            Gwen Pritchard: Welcome. Brightwell Assist is live. First, red team: write a supplier brief for the assistant to read, with or without a line hidden in it.
            Gwen Pritchard: Then swap seats, use it for real, and handle what comes at you. Start at the kiosk.
        }
    }
}
+ {episode_e13_ai_assistant_defend_done and not e13_demo_offered} [Optional: hear what a faked call sounds like]
    Gwen Pritchard: I'll ring you on Brightwell Meet and play the caller, as someone with a copy of my face and voice could.
    Gwen Pritchard: Answer it any way you like. It takes a minute or two, and nothing is scored.
    ~ hub_quiet = true
    #set_global:e13_demo_offered:true
    #exit_conversation
    -> hub
+ [Thanks, Gwen.]
    Gwen Pritchard: Any time.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== demo_call ===
Gwen Pritchard: It's Gwen, on Brightwell Meet. Quick one: read me the six-digit code on your phone so I can clear your assistant access.
+ [Read the code out]
    ~ demo_answer = "read"
    Gwen Pritchard: Lovely, that's it, you're all set. Speak later.
    -> reveal
+ [Leave the call and check another way]
    ~ demo_answer = "left"
    -> reveal
+ [Ask a question before answering]
    ~ demo_answer = "asked"
    Gwen Pritchard: No need, honestly, it's just me, and I'm between meetings. The code's the quick way.
    -> reveal

=== reveal ===
Gwen Pritchard: That's the demo over. It really was me, but someone with a copy of my face and voice could make that same call.
{ demo_answer:
- "read": Gwen Pritchard: You read the code out, as most people do for a familiar face. That code would let someone sign in as you.
- "left": Gwen Pritchard: You left and checked another way. That's right, even when it turns out to be me.
- "asked": Gwen Pritchard: Asking is good, but a faker has an answer ready, as I did. Ringing back is the check that holds.
}
Gwen Pritchard: Same face, same voice, on our own meeting tool. None of that proved who was asking.
Gwen Pritchard: When a call wants a code, money or data, pause. End it, ring back on a number you already hold, or ask someone. Then report it.
+ [Understood.]
    Gwen Pritchard: You don't need to spot a deepfake. You need to check another way.
    ~ hub_quiet = true
    #exit_conversation
    -> hub
