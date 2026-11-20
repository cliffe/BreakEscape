// fixture: a clean call story, sticky choices only
EXTERNAL pretext_say(id)
EXTERNAL pretext_ask(id)
VAR dev_influence = -10
VAR pretext_intern_name = ""
VAR pretext_intern_value = ""
VAR pretext_team_name = ""
VAR pretext_team_value = ""
=== function pretext_say(id) ===
~ return 0
=== function pretext_ask(id) ===
~ return 0
=== start ===
Dev: Service desk.
-> buddy
=== buddy ===
+ [I'm {pretext_intern_name}'s buddy, in {pretext_team_name}.]
    ~ temp band = pretext_say("open_buddy")
    -> reaction(band)
+ [Sorry, it is {pretext_team_name}.]
    ~ temp band = pretext_say("repair_team")
    -> reaction(band)
+ [It is urgent, her payslip is missing.]
    ~ temp band = pretext_say("urgent_payslip")
    -> reaction(band)
+ [Can you tell me the portal's name?]
    ~ temp got = pretext_ask("portal_name")
    -> reaction(got)
+ [And the payslip date?]
    ~ temp got = pretext_ask("payslip_date")
    -> reaction(got)
+ [Ring back later.]
    -> END
=== reaction(band) ===
{ pretext_intern_value == "lord_full":
    Dev: Found her.
- else:
    Dev: Hm.
}
-> buddy
