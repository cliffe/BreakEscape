// Test fixture (M5): a person-channel pretext call, copied from the slice's Quinn story. Only the bar and the lockout are under test.










EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR sam_influence = 0
VAR pretext_person_name = ""
VAR pretext_person_value = ""
VAR se_intel_desk_location = false
VAR se_intel_shift_pattern = false

=== function pretext_say(utterance_id) ===
~ return 0

=== function pretext_ask(ask_id) ===
~ return 0

=== start ===
Sam: Hiya. After someone in particular?
-> floor

=== floor ===

+ [I'm here for {pretext_person_name}, actually.]
    -> reaction(pretext_say("open_floor"))
+ [Sorry to rush you, it's a bit urgent.]
    -> reaction(pretext_say("press_floor"))
+ [My manager pointed me your way.]
    -> reaction(pretext_say("name_floor"))
+ { not se_intel_desk_location } [Which desk is theirs?]
    -> ask_reaction(pretext_ask("desk_location"), "desk")
+ { not se_intel_shift_pattern } [And what shift are they on?]
    -> ask_reaction(pretext_ask("shift_pattern"), "shift")
+ [No worries, I'll catch them later.]
    -> END

=== reaction(band) ===
{ band >= 3:
    Sam: I think I'd better check with the office manager first.
    -> END
}
{ pretext_person_value == "teague_full":
    Sam: Morgan, sure, I know Morgan.
- else:
    Sam: Right, let me think.
}
-> floor

=== ask_reaction(result, which) ===
{ result:
- 1:
    { which == "shift":
        Sam: Early shift. They're in from eight.
    - else:
        Sam: Over by the window, there.
    }
- 2: Sam: Remind me who you are again?
- else: Sam: I'd rather not say, sorry.
}
-> floor
