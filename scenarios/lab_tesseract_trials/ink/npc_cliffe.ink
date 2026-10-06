// ================================================
// The Keyholder Trials: Dr Z. Cliffe Schreuders
// Leader / story NPC, not a helper. Two entry knots: common_room (early) and
// workshop (end). Building a live map of the building. Knows the player is an
// agent and never says how. Australian through word choice only.
// ================================================

VAR met_cliffe = false
VAR asked_build = false
VAR slipped = false
VAR met_in_workshop = false

// Synced scenario globals
VAR relay_opened = false
VAR ghost_offer_made = false
VAR decision_made = false
VAR ending = ""

// ------------------------------------------------
// Common room
// ------------------------------------------------
=== common_room ===
{ met_cliffe:
    Still here. Coffee's still terrible.
- else:
    ~ met_cliffe = true
    G'day. Don't mind me, I'm hiding from a committee.
}
+ [What are you working on?]
    -> build
+ {not slipped} [Have you seen the CryptoSecure leaflets?]
    -> leaflets
+ [I'll leave you to it.]
    #exit_conversation
    No worries.
    -> common_room

=== build ===
~ asked_build = true
A teaching tool. Sort of. A game where you learn by getting caught.
Narrator: He turns the laptop a little towards you. A map of this building. Small figures walking about. One of them is wearing your hoodie.
Reckon that's enough of a preview.
Narrator: He closes the lid.
-> common_room

=== leaflets ===
~ slipped = true
Saw them. Reckon whoever wrote them has marked a lot of exams.
Good luck with it, Agent.
Narrator: A beat.
Student. Sorry. Long week.
-> common_room

// ------------------------------------------------
// Workshop
// ------------------------------------------------
=== workshop ===
{ not met_in_workshop:
    ~ met_in_workshop = true
    Door was locked for a reason, mate. Though I suppose you had the key. Interesting, that.
    -> workshop_hub
}
-> workshop_hub

=== workshop_hub ===
{
- decision_made && ending == "sent":
    Hope that was worth it.
- decision_made && ending == "double":
    Interesting choice of channel.
- decision_made && ending == "refused":
    Good. Some offers you hear out and still say no to.
- decision_made && ending == "blown":
    Phones. Never trusted them.
- relay_opened:
    Scoreboard's been quiet today. Takes flags from anyone. Never asked who reads them.
- else:
    Busy. Don't touch the iron, it's hot.
}
+ {not asked_build} [What's on the big screen?]
    -> workshop_build
+ [I'll leave you to it.]
    #exit_conversation
    Mind the cable.
    -> workshop_hub

=== workshop_build ===
~ asked_build = true
Same thing as before. Bit further along.
{ ghost_offer_made:
    Narrator: On the screen, the small figure in your hoodie is standing near the scoreboard.
- else:
    Narrator: On the screen, the small figure in your hoodie is standing in his workshop.
}
-> workshop_hub
