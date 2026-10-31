// ================================================
// Awareness E13, defend only: Gwen Pritchard (person, Training Room)
// Brightwell Foods' IT service desk lead, late 30s, Welsh (BRAND_SET.md, Brightwell cast). She runs the announced assistant demo and receives the reports. Placeholder sprite until the PixelLab reset.
// One welcome line; the kiosk does the rest. The record carries the mapping that
// completes the task when episode_e13_ai_assistant_defend_defend_complete changes (11 S5.1), so the ink only reads that global.
// Resting point is the hub (m03 hub_quiet pattern): the goodbye parks there
// quietly, and a re-talk re-enters it and says the line that fits the moment.
// Written by planning_notes/phishing_and_social_engineering/awareness/gen_e8_e17_shells.py,
// then hand-kept (2026-10-30): the optional deepfake demo call below (hub choice,
// demo_call, reveal) is not in the generator, as in the full shell's ink.
// ================================================

VAR episode_e13_ai_assistant_defend_defend_complete = false
VAR e13_demo_offered = false
VAR demo_answer = ""
VAR hub_quiet = false

=== start ===
-> hub

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    { episode_e13_ai_assistant_defend_defend_complete:
        Gwen Pritchard: That's them all handled, thanks. A voice or a face can be faked. Check another way, on a number you already hold: that always works.
    - else:
        Gwen Pritchard: Brightwell's switched on its assistant, and the kiosk has the inbox beside it: supplier emails, voicemails and video calls. Some are real, some aren't.
    }
}
+ {episode_e13_ai_assistant_defend_defend_complete and not e13_demo_offered} [Optional: hear what a faked call sounds like]
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
