// Person-channel story for the slice's SPRITE pretext character (packet P4-G).
// Quinn is a Finance colleague you can approach in person, so the character has a
// world walk sprite and the influence pip (00 S13) is drawn for them, while the
// phone-only Brandt has no sprite and no pip. TEST-ONLY ids. Reached from the NPC
// sprite, which carries callId quinn_floor_call: pretext-prep (P4-D's callId
// branch) opens person-chat here. person-chat-pretext binds the real
// pretext_say / pretext_ask; the fallbacks below load the story unbound (00 S1).
//
// Contract: 00 §8, §13, 06 §5. Call knots use sticky + choices only (06 N12).

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR quinn_influence = 0
VAR pretext_person_name = ""
VAR pretext_person_value = ""

=== function pretext_say(utterance_id) ===
~ return 0

=== function pretext_ask(ask_id) ===
~ return 0

=== start ===
Quinn: Hiya. After someone in particular?
-> floor

=== floor ===
// The external call is inlined into the divert so the knot declares no temp twice.
+ [I'm here for {pretext_person_name}, actually.]
    -> reaction(pretext_say("open_floor"))
+ [Sorry to rush you, it's a bit urgent.]
    -> reaction(pretext_say("press_floor"))
+ [My manager pointed me your way.]
    -> reaction(pretext_say("name_floor"))
+ [Which desk is theirs?]
    -> ask_reaction(pretext_ask("desk_location"))
+ [And what shift are they on?]
    -> ask_reaction(pretext_ask("shift_pattern"))
+ [No worries, I'll catch them later.]
    -> END

=== reaction(band) ===
{ band >= 3:
    Quinn: I think I'd better check with the office manager first.
    -> END
}
{ pretext_person_value == "teague_full":
    Quinn: Morgan, sure, I know Morgan.
- else:
    Quinn: Right, let me think.
}
-> floor

=== ask_reaction(result) ===
{ result:
- 1: Quinn: Over by the window, there.
- 2: Quinn: Remind me who you are again?
- else: Quinn: I'd rather not say, sorry.
}
-> floor
