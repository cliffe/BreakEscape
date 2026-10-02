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
VAR elena_met = false

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
// PASS 4 (design review fix 3): elena_met lets the debrief and credits tell
// "met and left at the rack" from "never spoken to".
#complete_task:question_elena
#set_global:elena_met:true
Narrator: She is kneeling at the SCADA backup rack, a laptop on one knee and a flashlight in her teeth. She sees you, and does not get up.

Elena Rodriguez: If you're one of his, you can tell him it isn't working and I'm not stopping.

Elena Rodriguez: If you're not one of his, you're law. Either way, let me finish this rack first.

+ [Finish what, exactly?]
    Elena Rodriguez: The load-shed tables. He rewrote them. I'm trying to put back the ones that keep the hospitals on the priority list.
    Elena Rodriguez: Forty minutes I've been at it. It's read-only. Of course it is.
    -> hub

+ [SAFETYNET. Hands where I can see them.]
    Elena Rodriguez: *lifts both hands, unimpressed* There. Now what? You've got as little time as I have, and you're spending it on me.
    -> hub

+ [You're Elena Rodriguez. Critical Mass.]
    Elena Rodriguez: You've read a file about me.
    Elena Rodriguez: Then you know what I did. You don't know what I was told. Nobody asks that.
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

+ {casualty_projection_found and not revision_heard} [I've read the casualty projection. His signature's on it.]
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

Elena Rodriguez: Six hours. One region. Ten at night to four in the morning, on a Sunday in September, when nobody needs the heating.

Elena Rodriguez: It's December. It's below freezing out there.

Elena Rodriguez: Hospitals, dialysis, water treatment, all carved out. I asked about each one, and got a schedule with all three on it.

Elena Rodriguez: Long enough that the committee that's ignored this grid for eleven years would have to read about it. Nobody hurt.

Elena Rodriguez: That was the plan I agreed to. I have the version I signed off. It's on that laptop.

-> hub

=== q_why ===
~ asked_why = true

Elena Rodriguez: Because the grid really is that fragile. That part was never a lie. It's the part nobody wants to hear.

Elena Rodriguez: I wrote a cascade study in 2019. Twenty-three transformers, no spares, eighteen months to build replacements.

Elena Rodriguez: One bad afternoon and you lose a region for a year.

Elena Rodriguez: I sent it to the operator, the regulator and a congressional committee. One of them acknowledged receipt.

Elena Rodriguez: Then somebody read it properly. Asked me about page forty. Nobody had ever asked me about page forty.

Elena Rodriguez: That's how they get people like me. You'd think it was money.

-> hub

=== q_stayed ===
~ asked_stayed = true

Elena Rodriguez: Where would I go? There isn't a version of tonight where I'm not part of it.

Elena Rodriguez: I could be out of the parking lot in four minutes. I'd still have written the sequencing.

Elena Rodriguez: And there's a small chance. The load-shed tables decide who stays on. Get them back, and the hospitals stay lit whatever else goes.

Elena Rodriguez: It's a thin plan. The other one is feeling bad in a different building.

-> hub

=== q_mercer ===
~ asked_mercer = true

Elena Rodriguez: James Mercer. My professor's professor. Twenty years at the Department of Energy, until he said out loud what everyone said in the corridor.

Elena Rodriguez: He's the most convincing man I've ever met. I think he lied to himself first, and I was downstream.

Elena Rodriguez: He's upstairs in the control room. He won't come down. He'd have to look at somebody who believed him.

{not scada_password_found and elena_outcome == "":
    Elena Rodriguez: Don't ask me for the door. Not yet.
}

-> hub

// ===========================================
// THE REVISION -- two ways in, same document
// ===========================================

=== lever_briefing ===
Narrator: She stops working. For the first time, both her hands are still.

Elena Rodriguez: Say the second half of that again. Ninety days.

+ [Ninety days dormant. No projected fatalities. That's the brief.]
    -> revision_beat
+ [Why? What do you know about Austin?]
    -> revision_beat

=== lever_projection ===
Narrator: You hold out the projection. She reads all of it, standing.

Elena Rodriguez: My schedule had a hospital carve-out on page one.

Elena Rodriguez: Same document. Carve-out removed, signature added. He didn't argue with me. He gave me a different copy.

Elena Rodriguez: There's something else you need to see. Austin.

-> revision_beat

=== revision_beat ===
~ revision_heard = true
#set_global:projection_revised:true

Elena Rodriguez: I was copied on the coordination summaries. All four cells, one schedule, so we didn't step on each other.

Elena Rodriguez: I read the Austin row because it was the boring one.

Elena Rodriguez: The dormancy field says T plus nine. Nine days. Same table your ninety came out of, one column over.

Elena Rodriguez: And I recognised a name on the vendor manifest. Over a third of the entries are prefixed EHR or CAD.

+ [Assume I don't know what those prefixes mean.]
    Elena Rodriguez: Electronic health records. And computer-aided dispatch.
    -> revision_dispatch
+ [Dispatch. As in 911 call routing.]
    Elena Rodriguez: As in 911 call routing.
    -> revision_dispatch

=== revision_dispatch ===
Elena Rodriguez: They hold signing keys for the systems that decide whether an ambulance comes, and where, and how fast.

Elena Rodriguez: Whoever wrote your brief didn't have the manifest, or was handed it by somebody who wanted it filed under strategic.

Elena Rodriguez: I spent six months telling myself I was the one operation where nobody dies. I wasn't even the worst one on the page.

{found_coordination_traffic:
    Elena Rodriguez: You've already pulled the traffic off that export, haven't you. Good. I'd rather not be your only source.
- else:
    Elena Rodriguez: It's on the backup server, on a share nobody locked down. Read it yourself. Don't take it from me.
}

{team_assigned and not team_redirected and not redirect_window_closed:
    Elena Rodriguez: If you've already sent people somewhere tonight, you sent them on those numbers.
}
{team_assigned and redirect_window_closed:
    Elena Rodriguez: You've already sent them, haven't you. I'm sorry. I'd rather have known this in June.
}

-> hub

// ===========================================
// OUTCOME: TURNED
// ===========================================

=== turn_offer ===
Elena Rodriguez: You know what you're asking. Help you, and there's no version of my life after this that isn't a courtroom.

+ [I'm not going to pretend otherwise. There isn't.]
    Elena Rodriguez: No. There isn't. Thank you for not making it sound like a deal.
    -> turn_yes
+ [Then do it for the reason you wrote page forty.]
    Elena Rodriguez: That's a cheap thing to say to me.
    Elena Rodriguez: It's also the only true thing anyone's said in this building since Thursday.
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

Narrator: She flattens a folded worksheet against the rack.

Elena Rodriguez: Control room door: CascadeWindow19. He's too vain to change it twice.

Elena Rodriguez: Cable vault keypad: 4703. Mercer's tech reset it after my survey, so the plant log's out of date.

Elena Rodriguez: The trunk runs are down there. That's where the physical half of this got in.

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
    Elena Rodriguez: I tell somebody with a recorder everything I know, for as long as they want. Then I go where they put me.
    Elena Rodriguez: Don't call it brave. It's the only door left I don't have to lie my way through.
    -> post_turn_hub

+ [Stay on the load-shed tables. Keep the hospitals lit.]
    Elena Rodriguez: That was the plan anyway. It helps, being told.
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
Narrator: She is on her feet before you finish, back against the rack.

Elena Rodriguez: No. No, you don't get to do that. Not you as well.

Elena Rodriguez: That's what he did. Put a number in front of me and told me what I owed. You've just done it with a different number.

+ [That wasn't a threat. Sit down.]
    -> pressure_recover
+ [I don't have time to be gentle with you.]
    -> flee
+ [Say nothing.]
    You: ...
    Narrator: The silence goes on a beat too long, and she reads it.
    -> flee

=== pressure_recover ===
Elena Rodriguez: Yes, it was. You just didn't mean it.

Narrator: She stays standing, but her shoulders come down a fraction.

Elena Rodriguez: Ask me again. Properly. If I say no, you leave me at this rack.

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

Narrator: She goes sideways along the rack row, fast. She has walked this room in the dark a hundred times.

Elena Rodriguez: The tables are still read-only. Somebody has to fix that and it isn't going to be you.

Narrator: The service door swings. The stairwell is empty both ways.

#exit_conversation
-> already_gone

// ===========================================
// RE-ENTRY GUARDS
// ===========================================

=== already_gone ===
Narrator: Her laptop lies by the backup rack, screen dark. The load-shed tables are half done.

+ [Nothing to find here.]
    #exit_conversation
    -> already_gone

=== already_down ===
Narrator: She is face down beside the backup rack, breathing. On the laptop by her hand, a hospital priority column, half put back.

+ [Leave her.]
    #exit_conversation
    -> already_down
