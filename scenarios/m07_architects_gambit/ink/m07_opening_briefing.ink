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
Narrator: 02:41 Pacific. An unmarked sedan on the I-5, rain on the windshield, and the secure tablet on the passenger seat lighting up with the operations room at SAFETYNET headquarters. Behind the Director, the wall map. Four of the pins are red. All four went red inside the same minute.

Director Magnus Netherton: Agent 0x00. Keep driving. This will not take long, and I would rather you heard it from me than read it off a screen.

You: What am I looking at?

Director Magnus Netherton: Four ENTROPY operations went live inside the same sixty seconds. Not four cells improvising. One schedule.

Director Magnus Netherton: Three days ago you followed one fund paying six cells on one seventy-two-hour clock. Some of them had already been paid. Four of them are what you are looking at.

Director Magnus Netherton: Washington. Austin. San Francisco. And a grid control facility in an industrial park outside Portland, Oregon.

Narrator: The Portland pin stops blinking and goes solid.

Director Magnus Netherton: Pacific Northwest Regional Grid Control. One hundred and forty-seven substations, eight point four million people across Washington, Oregon and Northern California. A sequence is loaded on their SCADA stack that takes the lot down in four steps.

Director Magnus Netherton: It is waiting on a start signal from a host inside the building. When that host sends it, you will have minutes, not hours. Nobody stops it from outside that building.

// PASS 3 (capability arc): the kit, in the one knot every run opens on.
Director Magnus Netherton: You have what's in your go-bag: picks, the cloner, the print kit. No PIN cracker. Analysis still has it in pieces.

-> briefing_questions

// ================================================
// SMALL Q&A BEFORE THE DELEGATION
// One-shot questions, one sticky way forward
// ================================================

=== briefing_questions ===
* [Why me? There must be teams closer.]
    Director Magnus Netherton: There are teams closer to the other three. We have people on two other continents tonight and not one of them can be in Oregon in time. You are forty minutes out.
    Director Magnus Netherton: This is not a selection, Agent. It's an assignment. Portland is the only target of the four where a person standing inside the building changes the outcome. So that is where you are going.
    -> briefing_questions
* [What happens if the cascade runs?]
    Director Magnus Netherton: Twenty-three major transformers burn out. Transformers are not a stock item. Restoration runs four to seven days.
    Director Magnus Netherton: Hospitals hold seventy-two hours on backup. Water treatment fails at forty-eight. It is winter, and the projection on my desk is two hundred and forty to three hundred and eighty-five dead in the first three days.
    -> briefing_questions
* [Who's coming in with me?]
    Director Magnus Netherton: Nobody. Agent HaX on the wire and what you're carrying. That's the deployment.
    Director Magnus Netherton: The building is mid-evacuation, which will help you and will also mean nobody there knows who you are.
    -> briefing_questions
* [Four operations at once. That's not a cell. That's a campaign.]
    Director Magnus Netherton: It is. And we know the shape of it because the tasking traffic was intercepted — cell assignments, target packages, casualty modelling, all of it.
    Director Magnus Netherton: The threat desk has had six hours with it. Everything I'm about to read you comes out of that intercept.
    -> briefing_questions
+ [Understood. Talk to me about the other three.]
    -> delegation_intro

// ================================================
// BEAT 2 - THE DELEGATION
// ================================================

=== delegation_intro ===
Director Magnus Netherton: We have one tactical team airborne and uncommitted. One. They can reach exactly one of the remaining three targets in time to matter.

You: And the other two?

Director Magnus Netherton: Go unanswered.

Narrator: The line holds for a second longer than a bad connection would explain.

Director Magnus Netherton: Fracture, in Washington. Trojan Horse, outside Austin. Meltdown, in San Francisco. I'll read you what the desk has on any of them, in whatever order you want.

Director Magnus Netherton: The team goes where you send them, and they need the call before you're through the gate.

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
Director Magnus Netherton: Operation Fracture. Ghost Protocol, working with Social Fabric. The target is the federal election security data centre outside Washington.

Director Magnus Netherton: Voter registration for forty-three states. One hundred and eighty-seven million people — names, addresses, Social Security numbers, voting history, party affiliation. Ghost Protocol have been inside as IT contractors for months and the exfiltration is already running.

Director Magnus Netherton: Co-located in the same building, on an old hosting contract nobody revisited, is a content distribution cluster that Social Fabric now controls.

Director Magnus Netherton: The projection. One hundred and eighty-seven million records exfiltrated. Identity theft wave of four to eight million victims over five years, twelve to twenty-four billion in individual fraud losses.

Director Magnus Netherton: Coordinated disinformation deploys on completion — fabricated fraud evidence built out of the genuine stolen records, deepfaked confessions from named officials. The breach is what makes the lie checkable.

Director Magnus Netherton: Polling models put forty to sixty per cent of the electorate believing subsequent elections are rigged. Civil disorder in twenty or more cities. Twenty to forty deaths in the first week. Elections delayed or disputed in multiple states.

* [Nothing happens tonight, then.]
    Director Magnus Netherton: Nothing you could put on a casualty board tonight, no. The deaths come over the following week, in disorder that tracks the narrative city by city.
    Director Magnus Netherton: The records cannot be un-leaked. They will be on darknet markets by the weekend and they will stay there.
    -> brief_fracture_tail
* [What can the team actually stop at this point?]
    Director Magnus Netherton: Not the exfiltration. Sixty million records are already gone by the time they land.
    Director Magnus Netherton: They can take the Social Fabric cluster intact, before deployment. A breach with no story attached is a scandal and a congressional hearing. A breach with the story is a constitutional crisis.
    -> brief_fracture_tail
+ [Understood.]
    -> brief_fracture_tail

=== brief_fracture_tail ===
Director Magnus Netherton: Cell lead is Michael Reeves. Fifteen years an NSA analyst before he decided the honest response to mass surveillance was to make it undeniable. He designs operations and reads the results. He does not attend.

-> delegation_hub

// ================================================
// BRIEF 2 - TROJAN HORSE (the understated one)
// ================================================

=== brief_trojan_horse ===
Director Magnus Netherton: Operation Trojan Horse. Supply Chain Saboteurs, on an industrial campus outside Austin.

Director Magnus Netherton: The target is TechForge. You won't have heard of them. Twenty-four hundred enterprise vendors upload patches, TechForge signs them, and the signed updates reach forty-seven million systems. They are the courier.

Director Magnus Netherton: The Saboteurs compromised the code-signing hardware and hold private signing keys for eight hundred and forty vendors. The injection run is staged and waiting on a clock.

Director Magnus Netherton: The projection. Backdoors injected into signed updates across forty-seven million systems, polymorphic per vendor. Dormant ninety days, then staged activation. Persistent access for espionage and exfiltration across eighteen thousand hospitals, twelve thousand financial institutions, four thousand two hundred government agencies.

Director Magnus Netherton: ENTROPY revenue eight hundred million to one point two billion over five years. Remediation and intellectual property theft, two hundred and forty to four hundred and twenty billion over a decade.

Director Magnus Netherton: No projected fatalities.

* [None at all?]
    Director Magnus Netherton: That is what the assessment says. It is an espionage platform, not a weapon. Ninety days of nothing, then a very long, very expensive decade.
    Director Magnus Netherton: The desk graded it strategic rather than urgent.
    -> brief_trojan_tail
* [Ninety days is a long time to plan against.]
    Director Magnus Netherton: It is. That is precisely why it grades the way it does. Ninety days is a horizon we can work inside.
    -> brief_trojan_tail
* [Who's running it?]
    -> brief_trojan_tail
+ [Understood.]
    -> brief_trojan_tail

=== brief_trojan_tail ===
Director Magnus Netherton: Cell lead calls herself Trojan Horse. Probably Jennifer Walsh — senior engineer at a major vendor, left after finding flaws in update mechanisms her employer declined to fix.

Director Magnus Netherton: She is patient in a way that makes her difficult to model. Her backdoors are well written and well commented. She's proud of them.

Director Magnus Netherton: If the team goes there, the run is stopped before deployment, eight hundred and forty keys get burned and reissued, and ENTROPY loses four months of access it will have to build again the hard way.

-> delegation_hub

// ================================================
// BRIEF 3 - MELTDOWN
// ================================================

=== brief_meltdown ===
Director Magnus Netherton: Operation Meltdown. Digital Vanguard, with Zero Day Syndicate supplying the ordnance.

Director Magnus Netherton: Twelve Fortune 500 companies simultaneously. Three banks, three technology firms, two healthcare groups, two energy majors, two retailers. Eight point four trillion in combined market capitalisation, four point two million employees.

Director Magnus Netherton: Forty-seven stockpiled zero-days across Windows Server, Oracle, Cisco, Salesforce, SAP and ServiceNow, packaged into one automated framework. Eight months of work and a single button.

Director Magnus Netherton: The projection. Trading systems manipulated and frozen. Markets down twelve to eighteen per cent inside twenty-four hours, four point two trillion in value destroyed. Banking transactions frozen. Source code, intellectual property and encryption keys exfiltrated.

Director Magnus Netherton: Ransomware across four thousand two hundred hospitals. Roughly eighteen thousand procedures cancelled in the first week. Eighty to one hundred and forty deaths from delayed care. Eighty-seven million patient records taken.

Director Magnus Netherton: Immediate layoffs, one hundred and forty to two hundred and twenty thousand. First-week economic impact, two hundred and eighty to four hundred and twenty billion.

* [Deaths on what timescale?]
    Director Magnus Netherton: This week. The ransomware lands with the rest of it and the theatre lists stop the same morning.
    Director Magnus Netherton: Same clock as yours, near enough.
    -> brief_meltdown_tail
* [Where would the team even go? That's twelve buildings.]
    Director Magnus Netherton: One building. TechCore's security operations centre, downtown San Francisco, twenty-fourth floor. The SOC monitors all twelve client networks.
    Director Magnus Netherton: It's the only place a defence can be coordinated across the whole set inside thirty minutes. Take that floor and you push mitigations to all twelve before deployment.
    -> brief_meltdown_tail
+ [Understood.]
    -> brief_meltdown_tail

=== brief_meltdown_tail ===
Director Magnus Netherton: Cell lead calls himself The Liquidator. Probably Marcus Ashford, ex-management consultant. Spent a career fixing companies and watching executives take the proceeds. Now he extracts value in the other direction and cannot resist making it elegant.

-> delegation_hub

// ================================================
// COMPARISON
// ================================================

=== compare_operations ===
Director Magnus Netherton: Side by side, then. I'll read it flat and you can do what you like with it.

Director Magnus Netherton: Fracture. Harm is to democratic legitimacy. Twenty to forty dead over a week. Irreversible — records do not come back, and neither does a count people have stopped believing in.

Director Magnus Netherton: Trojan Horse. Harm is persistent access across forty-seven million systems. No projected fatalities. Reversible only by rebuilding those systems, which is a decade of work.

Director Magnus Netherton: Meltdown. Harm is immediate. Eighty to one hundred and forty dead this week. Partly reversible — markets recover inside a year. The patients do not.

* [So Meltdown. It's the only one killing people tonight.]
    Director Magnus Netherton: That is one reading of it, and it is the reading the numbers invite.
    Director Magnus Netherton: I'd only note that it is also the loudest brief of the three, and loud is not the same as worst.
    -> compare_tail
* [Where did these projections come from?]
    Director Magnus Netherton: Threat desk modelling, off the intercepted tasking traffic. Target packages, deployment parameters, ENTROPY's own casualty estimates.
    Director Magnus Netherton: Six hours old. It is the best picture we have ever had of a live ENTROPY operation.
    -> compare_tail
* [What would you do?]
    -> netherton_declines
+ [Give me a moment.]
    -> compare_tail

=== compare_tail ===
Director Magnus Netherton: A life, a vote, and the security floor under every operation we run for the next decade. Those are not the same unit, Agent. There is no arithmetic here that finishes the job for you.

-> delegation_hub

// ================================================
// NETHERTON DECLINES TO STEER
// ================================================

=== netherton_declines ===
Narrator: A pause.

Director Magnus Netherton: You want me to make it.

You: You've been doing this twenty years. I've had four minutes.

Director Magnus Netherton: And in twenty years the one thing I've learnt is that a director who picks for the agent he is about to send into a building is picking for himself and calling it command.

Director Magnus Netherton: The handbook has eleven pages on delegation of force. Not one of them tells you which lot of people to leave.

Director Magnus Netherton: It's yours to make. I'll log it, I'll defend it, and I won't second-guess it. But I won't take it off you.

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
    Director Magnus Netherton: They'll be on the ground in eleven minutes. Reeves won't be there, but his cluster will.
    -> handoff
+ [Send them to Trojan Horse. Austin.]
    #set_global:team_assignment:trojan_horse
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    Director Magnus Netherton: Trojan Horse. Confirmed.
    Narrator: The pin over Austin changes colour. The other two stay red.
    Director Magnus Netherton: The long game, then. I'll note in the log that you chose the one with no bodies on it.
    -> handoff
+ [Send them to Meltdown. San Francisco.]
    #set_global:team_assignment:meltdown
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    Director Magnus Netherton: Meltdown. Confirmed.
    Narrator: The pin over San Francisco changes colour. The other two stay red.
    Director Magnus Netherton: Twenty-fourth floor. If they hold it, four thousand two hundred hospitals don't get hit.
    -> handoff
+ [Not yet. Go back.]
    Director Magnus Netherton: Quickly, Agent.
    -> delegation_hub

// ================================================
// TRANSIT AND HANDOFF TO THE FACILITY
// ================================================

=== handoff ===
Director Magnus Netherton: That's the team gone. Two operations are now running with nobody in the way of them, and that is on the record as my decision as much as yours.

Director Magnus Netherton: Go. I will pick you up on the secure channel when it matters.

Narrator: Forty minutes of rain and empty interstate. Then an industrial park outside Portland, 03:24 by the dashboard clock, raining hard enough that the wipers can't keep up.

Narrator: Chain-link, a lowered barrier, three stories of poured concrete behind it. People are coming out of the front doors into the rain with coats over their heads.

Director Magnus Netherton: Building's evacuating. Security checkpoint is manned and one of the guards on that shift is compromised. Assume the badge readers are logging you.

Director Magnus Netherton: The sequence has not been started yet. Assume that changes the moment they notice you. Agent HaX has your channel from here.

You: Understood.

Director Magnus Netherton: Eight point four million people, Agent. Go and do the part you can actually reach.

#exit_conversation
-> END
