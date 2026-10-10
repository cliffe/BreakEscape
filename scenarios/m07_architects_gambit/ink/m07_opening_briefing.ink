// ================================================
// Mission 7: The Architect's Gambit
// Opening briefing cutscene + the delegation
// Speaker: Director Magnus Netherton (over comms)
// Entry knot: start   (see CONTRACT.md)
// ================================================

VAR player_name = "Agent 0x00"
VAR team_assignment = ""
VAR team_assigned = false

// ================================================
// BEAT 1 - SECURE LINK FROM HQ. The agent is in a car on the I-5,
// forty minutes out of Portland (PASS 2: the old draft flew the agent in
// from HQ, hours of flight against thirty-minute windows).
// ================================================

=== start ===
Narrator: 02:41 Pacific. Rain on the I-5, and the secure tablet on the passenger seat lights up. Behind the Director, a wall map with four red pins.

Director Magnus Netherton: Agent 0x00. Keep driving. I would rather you heard this from me than read it off a screen.

Director Magnus Netherton: Four ENTROPY operations went live inside the same sixty seconds. Four cells, one schedule.

Director Magnus Netherton: Three days ago you followed one fund paying six cells on one seventy-two-hour clock. Four of them are on that map.

Director Magnus Netherton: Washington. Austin. San Francisco. And a grid control facility outside Portland, Oregon.

Narrator: The Portland pin stops blinking and goes solid.

Director Magnus Netherton: Pacific Northwest Regional Grid Control. One hundred and forty-seven substations. Eight point four million people in Washington, Oregon and Northern California.

Director Magnus Netherton: A sequence on their SCADA stack takes all of it down in four steps. It is waiting on a start signal from a host inside the building.

Director Magnus Netherton: Nobody stops it from outside that building.

// PASS 3 (capability arc): the kit, in the one knot every run opens on.
Director Magnus Netherton: You have your go-bag: picks, the cloner, the print kit. No PIN cracker. Analysis still has it in pieces.

-> briefing_questions

// ================================================
// SMALL Q&A BEFORE THE DELEGATION
// One-shot questions, one sticky way forward
// ================================================

=== briefing_questions ===
* [Why me? There must be teams closer.]
    Director Magnus Netherton: There are, to the other three. Nobody else can be in Oregon in time. You are forty minutes out.
    Director Magnus Netherton: And Portland is the one target where a person inside the building changes the outcome. So that is where you are going.
    -> briefing_questions
* [What happens if the cascade runs?]
    Director Magnus Netherton: Twenty-three major transformers burn out. They are not a stock item. Restoration takes four to seven days.
    Director Magnus Netherton: Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter.
    Director Magnus Netherton: The projection on my desk is two hundred and forty to three hundred and eighty-five dead in three days.
    -> briefing_questions
* [Who's coming in with me?]
    Director Magnus Netherton: Nobody. Agent HaX on the wire, and what you are carrying.
    Director Magnus Netherton: The building is mid-evacuation. That will help you, and it means nobody in there knows who you are.
    -> briefing_questions
* [Four operations on one clock. How do we know all this?]
    Director Magnus Netherton: We know the shape of it because we intercepted the tasking traffic. Targets, assignments, casualty modelling.
    Director Magnus Netherton: The threat desk has had six hours with it. Everything I read you tonight comes out of that intercept.
    -> briefing_questions
+ [Understood. Talk to me about the other three.]
    -> delegation_intro

// ================================================
// BEAT 2 - THE DELEGATION
// ================================================

=== delegation_intro ===
Director Magnus Netherton: We have one tactical team airborne and uncommitted. One. It can reach one of the other three in time to matter.

Director Magnus Netherton: The other two go unanswered.

Narrator: The line holds for a second longer than a bad connection would explain.

Director Magnus Netherton: Fracture, in Washington. Trojan Horse, outside Austin. Meltdown, in San Francisco. Ask about any of them, in any order.

Director Magnus Netherton: The desk's summary is on your handset if you want the figures on paper. The team needs your call before you are through the gate.

-> delegation_hub

// ================================================
// THE HUB - repeatable topics, no lossy chain
// ================================================

=== delegation_hub ===
+ [Walk me through Fracture.]
    -> brief_fracture
+ [Walk me through Trojan Horse.]
    -> brief_trojan_horse
+ [Walk me through Meltdown.]
    -> brief_meltdown
+ {brief_fracture or brief_trojan_horse or brief_meltdown} [Put them side by side for me.]
    -> compare_operations
+ {not (brief_fracture and brief_trojan_horse and brief_meltdown)} [Skip the rest. Where do you want them?]
    -> netherton_declines
+ [I've made the call.]
    -> commit_menu

// ================================================
// BRIEF 1 - FRACTURE
// ================================================

=== brief_fracture ===
Director Magnus Netherton: Operation Fracture. Ghost Protocol and Social Fabric, at the federal election security data centre outside Washington.

Director Magnus Netherton: Voter registration for forty-three states. A hundred and eighty-seven million people. The exfiltration is already running.

Director Magnus Netherton: Social Fabric controls a content cluster in the same building. Once the records are out, it publishes fraud evidence built from them.

Director Magnus Netherton: The breach makes the lie checkable. The desk projects disorder in twenty cities, and twenty to forty dead in the first week.

* [Nothing happens tonight, then.]
    Director Magnus Netherton: Nothing you could put on a casualty board tonight. The deaths come over the week, city by city.
    Director Magnus Netherton: And the records cannot be un-leaked. They will be on darknet markets by the weekend.
    -> brief_fracture_tail
* [What can the team actually stop at this point?]
    Director Magnus Netherton: Not the exfiltration. Sixty million records are gone before they land.
    Director Magnus Netherton: They can take the cluster before it publishes. A breach without the story is a scandal. With the story, it is a constitutional crisis.
    -> brief_fracture_tail
+ [Understood.]
    -> brief_fracture_tail

=== brief_fracture_tail ===
Director Magnus Netherton: Cell lead is Michael Reeves, fifteen years an NSA analyst. He designs operations and reads the results. He does not attend.

-> delegation_hub

// ================================================
// BRIEF 2 - TROJAN HORSE (the understated one)
// ================================================

=== brief_trojan_horse ===
Director Magnus Netherton: Operation Trojan Horse. Supply Chain Saboteurs, outside Austin. The target is TechForge, which signs software updates for twenty-four hundred vendors.

Director Magnus Netherton: Those updates reach forty-seven million systems. The Saboteurs hold the signing keys for eight hundred and forty vendors, and the run is staged.

Director Magnus Netherton: The projection: backdoors in signed updates, dormant for ninety days, then quiet access to hospitals, banks and government for years.

Director Magnus Netherton: No projected fatalities.

* [None at all?]
    Director Magnus Netherton: That is what the assessment says. An espionage platform. Ninety days of nothing, then a very expensive decade.
    Director Magnus Netherton: The desk graded it strategic rather than urgent.
    -> brief_trojan_tail
* [Ninety days is a long time to plan against.]
    Director Magnus Netherton: It is. That is why it grades the way it does. Ninety days is a horizon we can work inside.
    -> brief_trojan_tail
* [Who's running it?]
    -> brief_trojan_tail
+ [Understood.]
    -> brief_trojan_tail

=== brief_trojan_tail ===
Director Magnus Netherton: Cell lead calls herself Trojan Horse. Probably Jennifer Walsh, a vendor engineer whose employer would not fix the flaws she found.

Director Magnus Netherton: She is patient, which makes her hard to model. Her backdoors are well written and well commented. She is proud of them.

Director Magnus Netherton: If the team goes there, the run stops before deployment, eight hundred and forty keys are burned, and ENTROPY loses four months of work.

-> delegation_hub

// ================================================
// BRIEF 3 - MELTDOWN
// ================================================

=== brief_meltdown ===
Director Magnus Netherton: Operation Meltdown. Digital Vanguard, with Zero Day Syndicate supplying the ordnance.

Director Magnus Netherton: Twelve Fortune 500 companies at once, hit by forty-seven stockpiled zero-days through one automated framework.

Director Magnus Netherton: The projection: markets down twelve to eighteen per cent in a day, banking frozen, source code and keys stolen.

Director Magnus Netherton: And ransomware across four thousand two hundred hospitals. Eighty to a hundred and forty dead from delayed care, this week.

* [Deaths on what timescale?]
    Director Magnus Netherton: This week. The ransomware lands with the rest of it and the theatre lists stop the same morning.
    Director Magnus Netherton: Same clock as yours, near enough.
    -> brief_meltdown_tail
* [Where would the team even go? That's twelve buildings.]
    Director Magnus Netherton: One building. TechCore's security operations centre, twenty-fourth floor, downtown San Francisco. It watches all twelve networks.
    Director Magnus Netherton: Take that floor and they push defences to all twelve before deployment.
    -> brief_meltdown_tail
+ [Understood.]
    -> brief_meltdown_tail

=== brief_meltdown_tail ===
Director Magnus Netherton: Cell lead calls himself The Liquidator. Probably Marcus Ashford, a consultant who spent twenty years watching executives take the proceeds.

Director Magnus Netherton: Now he takes value the other way, and he cannot resist making it elegant.

-> delegation_hub

// ================================================
// COMPARISON
// ================================================

=== compare_operations ===
Director Magnus Netherton: Side by side, then. I will read it flat.

Director Magnus Netherton: Fracture: an election nobody believes in. Twenty to forty dead over a week. The records never come back.

Director Magnus Netherton: Trojan Horse: access to forty-seven million systems. No projected fatalities. A decade to rebuild.

Director Magnus Netherton: Meltdown: eighty to a hundred and forty dead this week. The markets recover inside a year. The patients do not.

* [So Meltdown. It's the only one killing people tonight.]
    Director Magnus Netherton: That is the reading the numbers invite.
    Director Magnus Netherton: It is also the loudest brief of the three. Loudest and worst are not always the same brief.
    -> compare_tail
* [Where did these projections come from?]
    Director Magnus Netherton: The threat desk, modelling off the intercepted tasking. Target packages, deployment parameters, ENTROPY's own casualty estimates.
    Director Magnus Netherton: Six hours old. The best picture we have ever had of a live ENTROPY operation.
    -> compare_tail
* [What would you do?]
    -> netherton_declines
+ [Give me a moment.]
    -> compare_tail

=== compare_tail ===
Director Magnus Netherton: Read them how you like, Agent. A life, a vote and a decade of our security do not convert into each other.

-> delegation_hub

// ================================================
// NETHERTON DECLINES TO STEER
// ================================================

=== netherton_declines ===
Narrator: A pause.

Director Magnus Netherton: You want me to make it.

Director Magnus Netherton: Twenty years of this work, Agent. A director who chooses for the agent he is sending in is choosing for himself, and calling it command.

Director Magnus Netherton: The handbook has eleven pages on delegation of force. Not one of them tells you which lot of people to leave.

Director Magnus Netherton: It is yours to make. I will log it, I will defend it, and I will not take it off you.

-> delegation_hub

// ================================================
// COMMIT
// ================================================

=== commit_menu ===
Director Magnus Netherton: Say the word and their aircraft turns.

+ [Send them to Fracture. Washington.]
    #set_global:team_assignment:fracture
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    Director Magnus Netherton: Fracture. Confirmed.
    Narrator: The pin over Washington changes colour. The other two stay red.
    Director Magnus Netherton: They will be on the ground in eleven minutes. Reeves will not be there. His cluster will.
    -> handoff
+ [Send them to Trojan Horse. Austin.]
    #set_global:team_assignment:trojan_horse
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    Director Magnus Netherton: Trojan Horse. Confirmed.
    Narrator: The pin over Austin changes colour. The other two stay red.
    Director Magnus Netherton: The long game, then. I will note that you chose the one with no bodies in the brief.
    -> handoff
+ [Send them to Meltdown. San Francisco.]
    #set_global:team_assignment:meltdown
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    Director Magnus Netherton: Meltdown. Confirmed.
    Narrator: The pin over San Francisco changes colour. The other two stay red.
    Director Magnus Netherton: Twenty-fourth floor. If they hold it, four thousand two hundred hospitals have an ordinary night.
    -> handoff
+ [Not yet. Go back.]
    Director Magnus Netherton: Quickly, Agent.
    -> delegation_hub

// ================================================
// TRANSIT AND HANDOFF TO THE FACILITY
// ================================================

=== handoff ===
Director Magnus Netherton: Two operations now run with nobody in their way. On the record, that is my decision as much as yours.

Director Magnus Netherton: Go. I will pick you up on the secure channel when it matters.

Narrator: Forty minutes of rain and empty interstate. Then an industrial park outside Portland, 03:24 by the dashboard clock.

Narrator: Chain-link, a lowered barrier, three storeys of concrete. People are coming out of the front doors with coats over their heads.

Director Magnus Netherton: The building is evacuating. The operations floor is past the security checkpoint, and one guard on that shift is compromised.

Director Magnus Netherton: Assume the badge readers are logging you. The sequence has not started. Assume that changes the moment they notice you. Agent HaX has your channel from here.

Director Magnus Netherton: Eight point four million people, Agent. Go and do the part you can reach.

#exit_conversation
-> END
