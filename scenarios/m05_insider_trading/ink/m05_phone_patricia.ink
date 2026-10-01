// ===========================================
// PHONE NPC: Patricia Morgan (her mobile)
// Mission 5: Insider Trading
//
// PASS 3 P11. Lets the player name the insider without walking back
// through reception.
//
// Engine rules this file is written to (review r2 M1, r3 M3):
// - She is in the phone's npcIds, so `start` is preloaded the first time
//   the phone opens (phone-chat-minigame.js:283-380). Nothing before the
//   first choice prints or assigns (lesson 36).
// - A reopened chat with saved state, after any synced global changed,
//   re-runs the knot that owns the first saved choice, not `start`
//   (phone-chat-minigame.js:532-566). So every resting knot re-checks
//   patricia_ko and patricia_phone_available at its top, and the naming
//   knot returns to the hub once torres_identified is set.
// - Never reaches DONE/END (lesson 21).
// The naming conditions match m05_npc_patricia_morgan.ink exactly.
// ===========================================

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR patricia_ko = false
VAR patricia_phone_available = false
VAR torres_identified = false
VAR final_choice = ""
VAR patricia_authorised_office = false
VAR vault_reader_seen = false
VAR owen_ko = false
VAR office_card_obtained = false
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR flag3_submitted = false
VAR found_manifest = false
VAR found_upload_schedule = false
VAR found_pamphlet = false

=== function has_motive()
~ return found_medical_bills or found_torres_journal or found_vetting_file

=== function has_exfil()
~ return flag3_submitted or found_manifest or found_upload_schedule

=== start ===
{patricia_ko: -> no_answer}
{not patricia_phone_available: -> not_yet}
-> hub

// Before the first in-person meeting has closed. No NPC text: the preload
// would otherwise leave an unread message.
=== not_yet ===
{patricia_ko: -> no_answer}
{patricia_phone_available: -> hub}
+ [(Hang up.)]
    #exit_conversation
    -> not_yet

// After a KO. The ring-out sits behind the choice so the preload shows
// nothing (review r3 minor 1).
// Playtest 3b: a narrator line after the choice counted as an unread
// message. The outcome is in the choice text and nothing follows it.
=== no_answer ===
+ [(Ring her. It rings out.)]
    #exit_conversation
    -> no_answer

=== hub ===
{patricia_ko: -> no_answer}
{not patricia_phone_available: -> not_yet}
#speaker:patricia_morgan
+ {not torres_identified} [I know who it is.]
    -> phone_share_findings
+ {torres_identified and final_choice == ""} [He's in the data centre.]
    -> phone_hold_him
+ [Just checking in.]
    You: Just checking in.
    {not torres_identified:
        Patricia Morgan: Still here. Ring me when you've got something.
    }
    {torres_identified and final_choice == "":
        Patricia Morgan: You know where he is. Go.
    }
    {final_choice != "":
        Patricia Morgan: It's done, then. I'll look after the building.
    }
    #exit_conversation
    -> hub

=== phone_share_findings ===
{torres_identified: -> hub}
#speaker:patricia_morgan
Patricia Morgan: Go on, then. Who, and how do you know?
{has_motive() and has_exfil():
    -> phone_significant_findings
}
{has_motive():
    You: David Torres. He's drowning in debt and he's hiding it.
    Patricia Morgan: That's why he might. It isn't proof that he did. Show me it leaving the building.
    -> hub
}
{has_exfil():
    You: I can prove the data's being staged for transfer tonight.
    Patricia Morgan: Staged by whom, and why? Find me the reason. People don't do this for nothing.
    -> hub
}
You: I've got a feeling about it.
Patricia Morgan: So do I. That's why you're here. Ring me back with evidence.
-> hub

=== phone_significant_findings ===
{torres_identified: -> hub}
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
    {found_manifest:
        You: There's a staging manifest in the data centre. "Staged by: D. Torres."
    }
    {found_upload_schedule:
        You: The upload schedule in the data centre names him as the operator on site. Tonight, half past eight.
    }
}
{found_pamphlet:
    You: And someone at a firm called TalentStack has been ringing him.
}
Patricia Morgan: ...Damn. I sat three desks from him at the Christmas party.
#complete_task:identify_torres
~ torres_identified = true
~ patricia_authorised_office = true
Patricia Morgan: His badge just went through the hallway and the vault's logged him in. He's at the upload terminal.
{not vault_reader_seen:
    Patricia Morgan: The data centre door reads his fingerprint. Something from his office will carry it.
}
{not owen_ko and not office_card_obtained:
    Patricia Morgan: I've told Owen you can have the spare for his office.
}
Patricia Morgan: Whatever you decide when you're in front of him, ring me when it's done.
-> phone_significant_findings_choices

=== phone_significant_findings_choices ===
+ [On my way.]
    #exit_conversation
    -> hub

=== phone_hold_him ===
{final_choice != "": -> hub}
#speaker:patricia_morgan
Patricia Morgan: I know. Ring me when it's done.
-> phone_hold_him_choices

=== phone_hold_him_choices ===
+ [Understood.]
    #exit_conversation
    -> hub
