// fixture: a call story with every ink-side fault
EXTERNAL pretext_say(id)
EXTERNAL pretext_ask(id)
VAR dev_influence = -10
VAR pretext_intern_name = ""
VAR pretext_intern_value = ""
VAR pretext_service_desk_call_state = ""
=== function pretext_say(id) ===
~ return 0
=== function pretext_ask(id) ===
~ return 0
=== start ===
Dev: Service desk.
-> buddy
=== buddy ===
+ [I'm {pretext_intern_name}'s buddy.]
    ~ temp band = pretext_say("open_buddy")
    -> reaction(band)
+ [Sorry, I meant {pretext_intern_name}.]
    ~ temp band = pretext_say("repair_team")
    -> reaction(band)
+ [Shout at him.]
    ~ temp band = pretext_say("ghost_line")
    -> reaction(band)
+ [Name a manager.]
    ~ temp band = pretext_say(chosen_line)
    -> reaction(band)
+ [Can you tell me the portal's name?]
    ~ temp got = pretext_ask("ghost_ask")
    -> reaction(got)
// + [Commented out.] ~ pretext_say("also_ghost")
* [Only once, then it is gone.]
    ~ temp got = pretext_ask("portal_name")
    -> reaction(got)
* -> END
=== reaction(band) ===
{ pretext_team_value == "finance":
    Dev: Found her.
- else:
    Dev: Hm.
}
-> buddy
=== side_chat ===
* [A once-only choice outside the call knots is fine.]
    Dev: Sure.
    -> END
