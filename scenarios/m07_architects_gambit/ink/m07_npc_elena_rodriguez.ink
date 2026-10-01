// ===========================================
// m07 "The Architect's Gambit" -- Elena Rodriguez
// Critical Mass electrical engineer. Server Room.
//
// The only sympathy in this mission. She joined because the grid is fragile
// and nobody would listen. She was told six hours of darkness, a hospital
// carve-out, nobody hurt. Mercer showed her numbers. They were not the real
// numbers, and she has now seen the real ones.
//
// She carries two things:
//   1. The revision intel -- she was copied on the cross-cell coordination
//      summaries and read the Trojan Horse vendor manifest. Sets
//      projection_revised. Redundant with VM flag 1 (NFS traffic), which is
//      the same document.
//   2. The SCADA control room password, and the cable vault PIN. Both
//      redundant elsewhere. Nothing is gated on her.
//
// Outcomes: elena_outcome = "turned" | "fled" | "ko". KO is engine-side.
// ===========================================

EXTERNAL player_name()

// Synced from globalVariables by the engine at call-open
VAR elena_outcome = ""
VAR elena_ko = false
VAR projection_revised = false
VAR team_assignment = ""
VAR team_assigned = false
VAR team_redirected = false
VAR redirect_window_closed = false
VAR found_coordination_traffic = false
VAR casualty_projection_found = false
VAR vault_pin_found = false
VAR scada_password_found = false

// Local conversation state
VAR asked_who = false
VAR asked_told = false
VAR asked_why = false
VAR asked_stayed = false
VAR asked_mercer = false
VAR revision_heard = false
VAR gave_keys = false

=== start ===
{elena_ko:
    -> already_down
}
{elena_outcome == "ko":
    -> already_down
}
{elena_outcome == "fled":
    -> already_gone
}
{elena_outcome == "turned":
    -> post_turn_hub
}
-> opening

// ===========================================
// FIRST CONTACT
// ===========================================

=== opening ===
// PASS 2 (lesson 44): the task completes on meeting her, not on the exit line.
#complete_task:question_elena
Narrator: She is knelt at the back of the SCADA backup rack with a laptop balanced on one knee and a flashlight in her teeth. She has been there long enough that the floor tiles have marked her shins.

Narrator: She sees you, and does not run. She does not stand up either.

Elena Rodriguez: If you're one of his, you can tell him it isn't working and I'm not stopping.

Elena Rodriguez: If you're not one of his, then you're the other thing, and I'd rather you let me finish this rack before you do whatever it is you came to do.

+ [Finish what, exactly?]
    Elena Rodriguez: The load-shed tables. He rewrote them. I'm trying to put back the ones that keep the hospitals on the priority list.
    Elena Rodriguez: I've been at it forty minutes. It's read-only. Of course it is.
    -> hub

+ [SAFETYNET. Hands where I can see them.]
    Narrator: She lifts both hands without any real conviction, the laptop sliding off her knee onto the tiles.
    Elena Rodriguez: There. Now what? You've got about the same amount of time as I have and you're spending it on me.
    -> hub

+ [You're Elena Rodriguez. Critical Mass.]
    Elena Rodriguez: You've read a file about me.
    Elena Rodriguez: Then you already know what I did. You don't know what I was told, and I've stopped expecting anyone to ask.
    ~ asked_who = true
    -> hub

// ===========================================
// HUB
// ===========================================

=== hub ===
+ {not asked_told} [What were you told this was?]
    -> q_told

+ {not asked_why} [Why does an engineer end up working for ENTROPY?]
    -> q_why

+ {not asked_stayed} [You know what's coming. Why are you still in the building?]
    -> q_stayed

+ {not asked_mercer} [Tell me about Mercer.]
    -> q_mercer

+ {asked_told and not revision_heard} [The Austin operation. They briefed it as no fatalities, dormant for ninety days.]
    -> lever_briefing

+ {casualty_projection_found and not revision_heard} [I've read the casualty projection. Two hundred and forty to three hundred and eighty-five, and his signature's on it.]
    -> lever_projection

+ {revision_heard and elena_outcome == ""} [Help me stop it. You know this system and I don't.]
    -> turn_offer

+ {revision_heard and elena_outcome == ""} [You built this. Give me the control room or I take it out of you.]
    -> pressure_break

+ [I need to keep moving.]
    Elena Rodriguez: Yes. You do.
    #exit_conversation
    -> hub

=== q_told ===
~ asked_told = true

Elena Rodriguez: Six hours. One region. Dark from ten at night until four in the morning, on a Sunday, in April, when nobody's heating is load-bearing.

Elena Rodriguez: Hospitals carved out. Dialysis centres carved out. Water treatment carved out. I asked about all three and I got a schedule with all three on it.

Elena Rodriguez: Long enough that the committee that has ignored this grid for eleven years would have to sit in the dark and read about it in the morning. Nobody hurt.

Narrator: She says it the way you say something you have already stopped believing but have not yet found a way to put down.

Elena Rodriguez: That was the plan I agreed to. I have the version I signed off. It's on that laptop.

-> hub

=== q_why ===
~ asked_why = true

Elena Rodriguez: Because the grid really is that fragile. That part was never a lie, and it's the part nobody wants to hear.

Elena Rodriguez: I wrote a cascade study in 2019. Twenty-three transformers, no spares in country, eighteen-month lead time from the only two firms that still make them. One bad afternoon and you lose a region for a year.

Elena Rodriguez: I sent it to the operator. I sent it to the regulator. I sent it to a congressional committee. I got an acknowledgement of receipt from one of the three.

Elena Rodriguez: Then somebody read it. Properly. Asked me questions about page forty. Nobody had ever asked me a question about page forty.

Elena Rodriguez: You want to know how they get people like me. That's how. Not money.

-> hub

=== q_stayed ===
~ asked_stayed = true

Elena Rodriguez: Where would I go? There isn't a version of tonight where I'm not part of it.

Elena Rodriguez: I could be out of the parking lot in four minutes and I'd still have written the sequencing. Running just means I'm somewhere else when it happens.

Elena Rodriguez: And there's a chance. Small one. The load-shed tables are the last thing that decides who stays on. If I can get write access to that rack before the cascade steps, the hospitals stay lit even if everything else goes.

Elena Rodriguez: It's not much of a plan. It's the only one I've got that isn't just feeling bad in a different building.

-> hub

=== q_mercer ===
~ asked_mercer = true

Elena Rodriguez: Dr James Mercer. He was my professor's professor. Fifteen years at the operator before they let him go for saying out loud what everyone said in the corridor.

Elena Rodriguez: He is the most convincing man I have ever met, and I don't think he was lying to me. I think he was lying to himself first and I was downstream of it.

Elena Rodriguez: He's upstairs. Control room. He hasn't come down and he won't, because coming down would mean looking at somebody who believed him.

{not scada_password_found and elena_outcome == "":
    Elena Rodriguez: Don't ask me for the door. Not yet.
}

-> hub

// ===========================================
// THE REVISION -- two ways in, same document
// ===========================================

=== lever_briefing ===
Narrator: She stops working. It is the first time since you walked in that both her hands have been still.

Elena Rodriguez: Say the second half of that again. Ninety days.

+ [Ninety days dormant. No projected fatalities. That's the brief we were given.]
    -> revision_beat
+ [That's what my briefing said. You're telling me it's wrong.]
    -> revision_beat

=== lever_projection ===
Narrator: You hold out the printed projection. She takes it with the hand that is not holding the flashlight and reads it standing up, which takes a while, because she reads all of it.

Elena Rodriguez: Two hundred and forty. My schedule had a hospital carve-out on page one.

Elena Rodriguez: This is the same document with the carve-out taken out and a signature added. He didn't argue with me. He just gave me a different copy.

Narrator: She folds it once and hands it back without looking at it again.

Elena Rodriguez: There's something else you need to see, and it isn't about my operation.

-> revision_beat

=== revision_beat ===
~ revision_heard = true
#set_global:projection_revised:true

Elena Rodriguez: I was copied on the coordination summaries. All four cells, one schedule, because Critical Mass needed to know when the other limbs went off so we didn't step on each other.

Elena Rodriguez: I read the Austin one because it was the boring one. That's the one you skim.

Elena Rodriguez: The dormancy field on the injection run doesn't say ninety days. It says T plus nine. Nine days. It's in the same table your ninety came out of, one column over.

Elena Rodriguez: And the vendor manifest isn't enterprise software. I went through it because I recognised a name. Over a third of those entries are prefixed EHR or CAD.

+ [Assume I don't know what those prefixes mean.]
    Elena Rodriguez: Electronic health records. And computer-aided dispatch.
    -> revision_dispatch
+ [Dispatch. As in 911 call routing.]
    Elena Rodriguez: As in 911 call routing.
    -> revision_dispatch

=== revision_dispatch ===
Elena Rodriguez: They hold signing keys for the systems that decide whether an ambulance is sent, and to where, and how fast. Not read them. Sign updates for them.

Elena Rodriguez: That is not espionage. Whoever wrote your brief either didn't have the manifest or was given it by somebody who wanted it filed under strategic.

Narrator: She looks at the rack, and then back at you, and something in her face reorganises itself.

Elena Rodriguez: I spent four months telling myself I was the one operation where nobody dies. I wasn't even the worst one on the page.

{found_coordination_traffic:
    Elena Rodriguez: You've already pulled the traffic off that export, haven't you. Then you've read the same table I did. Good. I'd rather not be the only source you've got.
- else:
    Elena Rodriguez: It's on the backup server. NFS export, wide open, because nobody here believed anyone would ever be standing where you're standing. Go and read it yourself, don't take it from me.
}

{team_assigned and not team_redirected and not redirect_window_closed:
    Elena Rodriguez: If you've already sent people somewhere tonight, you sent them on those numbers.
}
{team_assigned and redirect_window_closed:
    Elena Rodriguez: You've already sent them, haven't you. I'm sorry. I'd rather have known this in March.
}

-> hub

// ===========================================
// OUTCOME: TURNED
// ===========================================

=== turn_offer ===
Elena Rodriguez: You understand what you're asking. I go up those stairs with you and there is no version of the rest of my life that isn't a courtroom.

+ [I'm not going to pretend otherwise. There isn't.]
    Elena Rodriguez: No. There isn't. Thank you for not making it sound like a deal.
    -> turn_yes
+ [Then do it for the reason you wrote page forty.]
    Elena Rodriguez: That's a cheap thing to say to me.
    Elena Rodriguez: It's also the only true thing anybody's said in this building since Thursday.
    -> turn_yes
+ [Nine days. Dispatch systems. Decide.]
    Narrator: She does not answer for a long moment. Then she closes the laptop and stands up.
    -> turn_yes

=== turn_yes ===
~ elena_outcome = "turned"
// PASS 2 (lesson 3): tags above the lines, so an early close still records them.
#set_global:elena_outcome:turned
#set_global:scada_password_found:true
#set_global:vault_pin_found:true
~ gave_keys = true

Narrator: She pulls a folded worksheet out of her back pocket and flattens it against the rack.

Elena Rodriguez: Control room door. CascadeWindow19. He changed it in March and he's too vain to change it twice.

Elena Rodriguez: The cable vault keypad is 4703, if you haven't got it off the maintenance log yet. Trunk runs are down there. That's where the physical half of this got in.

Elena Rodriguez: He'll be at the master console. He won't be armed. He'll want to explain.

-> post_turn_hub

=== post_turn_hub ===
// PASS 2: was gated on "not gave_keys", which was always true by here, so
// the repeat could never be offered.
+ [Give me the control room door and the vault code again.]
    Elena Rodriguez: CascadeWindow19. Vault keypad is 4703.
    -> post_turn_hub

+ [What do I say to him?]
    Elena Rodriguez: Nothing that sounds like a negotiation. He's better at those than you are.
    Elena Rodriguez: Ask him what the carve-out page says. He'll answer, because he can't help it, and then you'll both know.
    -> post_turn_hub

+ [What happens to you after tonight?]
    Elena Rodriguez: I sit in a room and I tell somebody with a recorder everything I know, for as long as they want, and then I go where they put me.
    Elena Rodriguez: That's not bravery. It's just the only door left that I don't have to lie to get through.
    -> post_turn_hub

+ [Stay on the load-shed tables. Keep the hospitals lit.]
    Elena Rodriguez: That was the plan regardless. But it helps, being told.
    Narrator: She is back on the floor beside the rack before you reach the door.
    #exit_conversation
    -> post_turn_hub

+ [Go. Get out of the building.]
    Elena Rodriguez: I'll go when the tables are back. Not before.
    #exit_conversation
    -> post_turn_hub

// ===========================================
// OUTCOME: FLED
// ===========================================

=== pressure_break ===
Narrator: She is on her feet before you finish the sentence, the rack at her back, the flashlight held like something she has just realised is not a weapon.

Elena Rodriguez: No. No, you don't get to do that. Not you as well.

Elena Rodriguez: That's what he did. He put a number in front of me and told me what I owed because of it. You've just done the same thing with a different number.

+ [That wasn't a threat. Sit down.]
    -> pressure_recover
+ [I don't have time to be gentle with you.]
    -> flee
+ [Say nothing.]
    You: ...
    Narrator: The silence goes on a beat too long, and she reads it.
    -> flee

=== pressure_recover ===
Elena Rodriguez: Yes, it was. You just didn't mean it to be.

Narrator: She stays standing, but her shoulders come down a fraction.

Elena Rodriguez: Ask me again. Properly. And if I say no, you leave me at this rack and you go up those stairs without me.

+ [Help me stop it. You know this system and I don't.]
    -> turn_offer
+ [Then stay at the rack. I'll do the rest.]
    ~ elena_outcome = "turned"
    #set_global:elena_outcome:turned
    #set_global:scada_password_found:true
    #set_global:vault_pin_found:true
    ~ gave_keys = true
    Elena Rodriguez: Control room door is CascadeWindow19. Vault keypad is 4703.
    Elena Rodriguez: That's everything I have. Go.
    -> post_turn_hub

=== flee ===
~ elena_outcome = "fled"
// PASS 2: #hostile removed -- she runs, she does not attack. The scenario
// hides her on elena_outcome == "fled".
#set_global:elena_outcome:fled

Narrator: She goes sideways along the rack row and she is quick about it, because she has walked this room in the dark a hundred times and you have not.

Elena Rodriguez: The tables are still read-only. Somebody has to fix that and it isn't going to be you.

Narrator: The service door swings. By the time you reach it the stairwell is empty in both directions.

#exit_conversation
-> already_gone

// ===========================================
// RE-ENTRY GUARDS
// ===========================================

=== already_gone ===
Narrator: The laptop is still on the floor by the backup rack, screen dark, a flashlight rolled up against the plinth.

Narrator: Whatever she was doing to the load-shed tables, she did not finish it.

+ [Nothing to find here.]
    #exit_conversation
    -> already_gone

=== already_down ===
Narrator: She is face down beside the SCADA backup rack where you left her, breathing, and going nowhere for some hours.

Narrator: The laptop is open beside her hand. A load-shed schedule, half rewritten, with a hospital priority column she was in the middle of putting back.

+ [Leave her.]
    #exit_conversation
    -> already_down
