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
// hub_quiet (m03 pattern; DIALOGUE_REVIEW_R2 M1): set at the end of each topic
// knot, so the hub doesn't reprint its greeting straight after a scene's last
// line. Spent on the same pass, so a reopened conversation still greets.
VAR quiet = false

// Synced scenario globals
VAR relay_opened = false
VAR ghost_offer_made = false
VAR decision_made = false
VAR ending = ""

// ------------------------------------------------
// Common room
// ------------------------------------------------
=== common_room ===
{
- quiet:
    ~ quiet = false
- met_cliffe:
    Dr Z. Cliffe Schreuders: {&Still here. Coffee's still terrible.|Yeah?|Committee's still looking for me.}
- else:
    ~ met_cliffe = true
    Dr Z. Cliffe Schreuders: G'day. Don't mind me, I'm hiding from a committee.
}
+ [What are you working on?]
    -> build
+ {not slipped} [Have you seen the CryptoSecure leaflets?]
    -> leaflets
+ [I'll leave you to it.]
    #exit_conversation
    Dr Z. Cliffe Schreuders: No worries.
    -> common_room

=== build ===
~ asked_build = true
Dr Z. Cliffe Schreuders: A teaching tool. Sort of. A game where you learn by getting caught.
Narrator: He turns the laptop a little towards you. A map of this building. Small figures walking about. One of them is wearing your hoodie.
Dr Z. Cliffe Schreuders: Reckon that's enough of a preview.
Narrator: He closes the lid.
~ quiet = true
-> common_room

=== leaflets ===
~ slipped = true
Dr Z. Cliffe Schreuders: Saw them. Reckon whoever wrote them has marked a lot of exams.
Dr Z. Cliffe Schreuders: Good luck with it, Agent.
Narrator: A beat.
Dr Z. Cliffe Schreuders: Student. Sorry. Long week.
~ quiet = true
-> common_room

// ------------------------------------------------
// Workshop
// ------------------------------------------------
=== workshop ===
{ not met_in_workshop:
    ~ met_in_workshop = true
    Dr Z. Cliffe Schreuders: Door was locked for a reason, mate. Though I suppose you had the key. Interesting, that.
    -> workshop_hub
}
-> workshop_hub

=== workshop_hub ===
{
- quiet:
    ~ quiet = false
- decision_made && ending == "sent":
    Dr Z. Cliffe Schreuders: Hope that was worth it.
- decision_made && ending == "double":
    Dr Z. Cliffe Schreuders: Interesting choice of channel.
- decision_made && ending == "refused":
    Dr Z. Cliffe Schreuders: Good. Some offers you hear out and still say no to.
- decision_made && ending == "blown":
    Dr Z. Cliffe Schreuders: Phones. Never trusted them.
- relay_opened:
    Dr Z. Cliffe Schreuders: Scoreboard's been quiet today. Takes flags from anyone. Never asked who reads them.
- else:
    Dr Z. Cliffe Schreuders: Busy. Don't touch the iron, it's hot.
}
+ {not asked_build} [What's on the big screen?]
    -> workshop_build
+ [I'll leave you to it.]
    #exit_conversation
    Dr Z. Cliffe Schreuders: Mind the cable.
    -> workshop_hub

=== workshop_build ===
~ asked_build = true
Dr Z. Cliffe Schreuders: The building. Bit further along than this morning.
{ ghost_offer_made:
    Narrator: On the screen, the small figure in your hoodie is standing near the scoreboard.
- else:
    Narrator: On the screen, the small figure in your hoodie is standing in his workshop.
}
~ quiet = true
-> workshop_hub
