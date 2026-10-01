// ===========================================
// Mission 5: NPC - Patricia Morgan (CSO)
// Chief Security Officer, the player's sponsor on site
//
// PASS 2: person-chat conversations never reach DONE/END (lesson 21).
// Every exit is #exit_conversation followed by -> hub, so re-talk
// re-enters the hub. Naming the insider needs both halves of the case:
// a motive item AND proof of exfiltration (see scenario.json.erb header).
// ===========================================

VAR patricia_influence = 5            // 0-10 scale
VAR topic_investigation = false
VAR topic_suspects = false
VAR topic_company_politics = false
VAR gave_vetting_file = false
VAR first_meeting = true

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR patricia_authorised_office = false
VAR office_card_obtained = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR found_incident_log = false
VAR found_pamphlet = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR found_manifest = false
VAR found_upload_schedule = false

=== function has_motive()
~ return found_medical_bills or found_torres_journal or found_vetting_file

=== function has_exfil()
~ return flag3_submitted or found_manifest or found_upload_schedule

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:meet_handler
{not first_meeting:
    -> hub
}
~ first_meeting = false
#speaker:narrator
Narrator: A woman in her early fifties looks up from a wall of access logs. Military bearing, sharp eyes, a mug of tea gone cold beside the keyboard.

#speaker:patricia_morgan
Patricia Morgan: You'll be the consultant. Patricia Morgan, Chief Security Officer. Thanks for coming at short notice.

+ [Fill me in. What have you found so far?]
    You: Fill me in on what you've found so far.
    ~ patricia_influence += 1
    -> briefing_details

+ [Skip the pleasantries. I need access.]
    You: I'm here to work. What access can you give me?
    Patricia Morgan: Direct. Good.
    ~ patricia_influence += 1
    -> provide_access

+ [I've been briefed. Quantum crypto, inside job, tonight.]
    You: I know the basics. Quantum-safe keys, an inside job, and it finishes tonight.
    Patricia Morgan: Then we can skip a step.
    ~ patricia_influence += 2
    -> provide_access

=== briefing_details ===
#speaker:patricia_morgan

Patricia Morgan: Data leaving the building. Four point two terabytes over six weeks.

Patricia Morgan: Project Heisenberg. Quantum-safe key material for the national emergency dispatch rollout.

Patricia Morgan: If ENTROPY gets the rest of it, we're not talking about a leak. We're talking about ambulances that don't arrive in time.

+ [How did you spot it?]
    Patricia Morgan: Transfer volumes. Two to four in the morning, out to an external host.
    Patricia Morgan: It took me three weeks to rule out legitimate remote work. Then I was told to stop looking.
    -> provide_access

+ [Who has access to the data?]
    -> suspects_overview

=== suspects_overview ===
#speaker:patricia_morgan

Patricia Morgan: Eight people with developed vetting in the cryptography division.

Patricia Morgan: Dr Sarah Chen leads the team. Five senior researchers. Two junior engineers.

Patricia Morgan: All vetted. All trusted. Until now.

+ [Can you get me in front of them without tipping anyone off?]
    ~ patricia_influence += 1
    You: Can you get me access without tipping them off?
    Patricia Morgan: Already done. As far as the building knows, you're a routine security audit.
    -> provide_access

+ [Any prime suspects?]
    Patricia Morgan: I have a feeling. A feeling isn't evidence. That's your job.
    -> provide_access

=== provide_access ===
#speaker:patricia_morgan

#give_item:id_badge:visitor_badge
Patricia Morgan: Visitor badge. It gets you through the front of the building and nowhere that matters.

Patricia Morgan: Kevin Park in IT holds the spare cards. Dr Chen's badge opens the server side. I can lean on either of them if you need me to.

Patricia Morgan: My log of what's been flagged is on the desk. Take it.

+ [Where should I start?]
    You: Where should I start?
    Patricia Morgan: People. Someone in this building has noticed something and not said it. Then the servers.
    Patricia Morgan: And when you think you have a name, bring me the why and the proof. Not one. Both.
    #exit_conversation
    -> hub

+ [I'll find my own way from here.]
    You: I'll find my own way from here.
    Patricia Morgan: Bring me a name when you have one. With proof.
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB (return visits)
// ===========================================

=== hub ===
#speaker:patricia_morgan

+ {not topic_investigation} [How far did your own investigation get?]
    -> ask_investigation

+ {not topic_suspects} [Who's on the suspect list?]
    -> ask_suspects

+ {not topic_company_politics} [Why did management shut you down?]
    -> ask_company_politics

+ [I need your help with something.]
    -> request_authorization

+ {not torres_identified} [I think I know who it is.]
    -> share_findings

+ {torres_identified} [Anything else I should know before I go in?]
    Patricia Morgan: He's not a fighter. But cornered people surprise you. Keep the terminal between you and the door.
    -> hub

+ [That's everything for now.]
    You: That's everything for now. I'll keep you posted.
    Patricia Morgan: Stay in touch.
    #exit_conversation
    -> hub

=== ask_investigation ===
#speaker:patricia_morgan
~ topic_investigation = true

Patricia Morgan: It hit a wall. The access looks legitimate because it is legitimate. Whoever it is has every right to touch that data.

{patricia_influence >= 6:
    Patricia Morgan: Between you and me? I should have pushed harder. I let a polite email stop me.
    ~ patricia_influence += 1
}

-> hub

=== ask_suspects ===
#speaker:patricia_morgan
~ topic_suspects = true

Patricia Morgan: Dr Sarah Chen, team lead. David Torres, cryptography lead. Five others with varying access.

{patricia_influence >= 6:
    Patricia Morgan: Torres has been... distracted. Personal trouble at home.
    Patricia Morgan: Distracted doesn't make a man a traitor. I've been wrong about people before.
}

-> hub

=== ask_company_politics ===
#speaker:patricia_morgan
~ topic_company_politics = true

Patricia Morgan: The Home Office readiness review is in three weeks. The CEO, Jennifer Zhao, wants a clean file for it.

Patricia Morgan: So: no press, no prosecution if it can be avoided, and no security incident on the record.

{patricia_influence >= 6:
    Patricia Morgan: I want it done properly. She wants it done quietly. Tonight we find out which of us wins.
    ~ patricia_influence += 1
}

-> hub

// ===========================================
// AUTHORISATION REQUESTS
// ===========================================

=== request_authorization ===
#speaker:patricia_morgan

Patricia Morgan: What do you need?

+ {not gave_vetting_file} [The vetting files on the cryptography team.]
    You: I need the vetting files on the cryptography team.
    ~ gave_vetting_file = true
    ~ patricia_influence += 1
    #give_item:notes:torres_vetting_file
    Patricia Morgan: Seven of them are clean. Here's the one that isn't.
    Patricia Morgan: I asked to interview him three weeks ago. You'll see who cancelled it.
    -> hub

+ {not patricia_authorised_office and not office_card_obtained} [I need into David Torres' office.]
    You: I need to get into David Torres' office.
    ~ patricia_authorised_office = true
    Patricia Morgan: Kevin holds IT's spare for every office. I'll message him now and tell him it's on my authority.
    Patricia Morgan: If this turns out to be nothing, it was a routine audit. Understood?
    -> hub

+ [Actually, it can wait.]
    You: Actually, it can wait.
    -> hub

// ===========================================
// NAMING THE INSIDER
// Needs one motive item and one exfiltration item.
// ===========================================

=== share_findings ===
#speaker:patricia_morgan

Patricia Morgan: Go on, then. Who, and how do you know?

{has_motive() and has_exfil():
    -> significant_findings
}
{has_motive():
    You: David Torres. He's drowning in debt and he's hiding it.
    Patricia Morgan: That's why he might. It isn't proof that he did.
    Patricia Morgan: Show me it leaving the building. The server room, the portal, whatever he's staging it on.
    -> hub
}
{has_exfil():
    You: I can prove the data's being staged for transfer tonight.
    Patricia Morgan: Staged by whom, and why? Eight people could have touched that share.
    Patricia Morgan: Find me the reason. People don't do this for nothing.
    -> hub
}
You: I've got a feeling about it.
Patricia Morgan: So do I. That's why you're here. Come back with evidence.
-> hub

=== significant_findings ===
#speaker:patricia_morgan

You: David Torres.
{found_medical_bills or found_vetting_file:
    You: His wife's treatment isn't covered and he's borrowed against the house.
}
{found_torres_journal:
    You: His own journal says he knows what this costs and he's doing it anyway.
}
{flag3_submitted:
    You: The staging manifest on the research portal is in his name.
- else:
    You: There's a staging manifest and an upload schedule in the data centre. Both say D. Torres. Tonight, half past eight.
}
{found_pamphlet:
    You: And someone at a firm called TalentStack has been ringing him.
}

Patricia Morgan: ...Damn.

Patricia Morgan: I sat three desks from him at the Christmas party. His kids drew on the tablecloth.

~ patricia_influence += 2
#complete_task:identify_torres
~ torres_identified = true
Patricia Morgan: All right. It's your call from here. I'll keep the building quiet and the CEO out of your way.

Patricia Morgan: His badge has just gone through the server hallway. He's heading for the data centre, north of the server room.

Patricia Morgan: When you've got him, keep him there and call me. I'll bring the police. They can have him, and whatever you send them, without your name on it.

Patricia Morgan: Be careful. When you confront him, you're on your own.

+ [I'll stop him.]
    You: I'll stop him.
    #exit_conversation
    -> hub
+ [Whatever happens next, it's on me.]
    You: Whatever happens next is on me, not you.
    Patricia Morgan: No. Some of it's on me. I let them stop me.
    #exit_conversation
    -> hub
