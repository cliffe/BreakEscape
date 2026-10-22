// ===========================================
// Mission 5: NPC - Lisa Park
// Marketing Coordinator, office observer. Runs the collection for Elena.
//
// PASS 2: never reaches DONE/END (lesson 21). The old event-triggered
// knots (on_torres_identified, on_mission_complete) had no trigger; the
// scene about Torres' children is now a hub choice once he's named.
//
// PASS 4 (whodunnit): the player no longer opens by asking about Torres.
// They ask who the collection is for, and the David questions follow once
// she has named him. She also passes on Halloran's row with the CEO (true,
// and a red herring).
//
// PASS 4 (dialogue): "What have you noticed lately?" spreads the gossip over
// Halloran, Ben and David, so it no longer singles David out before the
// badge log. hub_quiet gives the hub a re-entry line (m03 pattern).
//
// ROUND 2 (2026-10-17, user: Lisa vaguer): the tin is for "someone on the
// crypto team" and she won't say who. The name comes from Patricia's vetting
// files (spouse treated abroad, insurer said no) and the badge log. Once the
// player has the files or a suspicion she confirms it's David
// (confirm_david), and the personal topics open from there.
// ===========================================

VAR lisa_influence = 0              // 0-100 scale
VAR topic_office_mood = false
VAR topic_torres_personal = false
VAR topic_elena = false
VAR told_about_torres = false
VAR first_meeting = true
VAR heard_tin_story = false         // Synced scenario global: she has told the tin story (no name); read by HaX's who-nudge
VAR david_confirmed = false         // ink-local: she has said the tin is for David
VAR hub_quiet = false               // set by every exit, so a goodbye doesn't end on a greeting
VAR fate_noted = false              // Phase 4 dialogue C1 (D5-8): her reaction to Torres' fate, once

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR torres_identified = false
VAR torres_suspected = false        // Synced scenario global: the evidence points at Torres
VAR found_vetting_file = false      // Synced scenario global: Patricia's vetting files handed over
VAR final_choice = "" // Synced scenario global: Torres' fate; set by m05_torres_confrontation and HaX's post-KO call. Read for her reaction (D5-8)

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#complete_task:talk_to_lisa
{not first_meeting:
    -> hub
}
// Engine robustness audit (m01-m08): the met flag is set in each opening choice, not
// before the opening, so an Esc (this knot owns the choices, so a reopen re-runs it) or a
// reload at these choices brings the opening back instead of skipping to the hub.
#speaker:narrator
Narrator: A woman in her early thirties by the break room counter. Coffee going cold, a collection tin at her elbow.

#speaker:lisa_park
Lisa Park: Hi. You're the security person, right? Everyone's been whispering.

Lisa Park: Lisa Park, marketing. I don't go near the crypto stuff, but I sit by the kettle. I notice things.

+ [What have you noticed lately?]
    ~ first_meeting = false
    // No tag here: ask_office_mood's own tag lands on the same line, and two
    // tags would show two popups (D5-6).
    ~ lisa_influence += 10
    -> ask_office_mood

+ [Who's the collection tin for?]
    ~ first_meeting = false
    ~ lisa_influence += 5
    #influence_increased
    -> torres_sympathy

+ [Sorry, I'm short on time. Cleared staff first.]
    ~ first_meeting = false
    Lisa Park: No, totally. Good luck with it.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== torres_sympathy ===
#speaker:lisa_park
~ heard_tin_story = true

Lisa Park: Someone on the crypto team. I promised I wouldn't say who, so don't ask.

Lisa Park: His wife's got cancer. Stage 3. The treatment that might work is a trial in the States, and the insurer won't touch it. Hence the tin.

Lisa Park: He's been borrowing to cover it, I think. He's lost weight. Looks like he hasn't slept in months.

+ [That's rough. Thanks for telling me.]
    ~ lisa_influence += 10
    #influence_increased
    Lisa Park: He'd hate that I told you even that much. He can't stand a fuss.
    ~ hub_quiet = true
    -> hub

+ [Which one of them is it?]
    Lisa Park: I said don't ask. Patricia keeps files on that whole team. That's her job, not mine.
    ~ hub_quiet = true
    -> hub

+ [If he's done something, his circumstances don't change that.]
    ~ lisa_influence -= 10
    #influence_decreased
    Lisa Park: Wow. Okay. Right.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
#speaker:lisa_park
// Phase 4 dialogue C1 (D5-8): after the fate, the first reopen notices it.
// She sits by the kettle; she sees the office, not the vault.
{
- hub_quiet:
    ~ hub_quiet = false
- final_choice != "" and not fate_noted:
    ~ fate_noted = true
    {
    - final_choice == "arrest" or final_choice == "combat_nonlethal":
        // C2 (D5C2-5): Patricia gives the police the side door.
        Lisa Park: Someone's had the side door propped open for ten minutes. Nobody will say why.
    - final_choice == "public_exposure":
        Lisa Park: David just walked out in his coat. He didn't even look at the tin.
    - final_choice == "combat_lethal":
        Lisa Park: Has anyone seen David? His coat's still on his chair.
    - else:
        Lisa Park: Someone said David's gone home early. Is that good?
    }
- else:
    Lisa Park: {&Anything else? I've got nowhere to be.|Go on.|What else?}
}

+ {not topic_office_mood} [How's the office mood these days?]
    -> ask_office_mood

+ {not heard_tin_story} [Who's the collection tin for?]
    -> torres_sympathy

// Round 2: she names him only once the player has the files or a suspicion.
+ {heard_tin_story and knows_torres() and not david_confirmed} [Is the tin for David Torres?]
    -> confirm_david

+ {not heard_tin_story and knows_torres() and not david_confirmed} [What can you tell me about David Torres?]
    -> confirm_david

+ {david_confirmed and not topic_torres_personal} [Tell me more about David.]
    -> ask_torres_personal

+ {david_confirmed and not topic_elena} [Is David all right? At home, I mean?]
    -> ask_elena

+ {torres_identified and not told_about_torres} [It's David. I'm sorry.]
    -> told_torres

+ [That's all, thanks.]
    Lisa Park: Any time. I'll be here. Apparently forever.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== function knows_torres() ===
~ return found_vetting_file or torres_suspected or torres_identified

=== confirm_david ===
#speaker:lisa_park
~ david_confirmed = true
~ lisa_influence += 5
#influence_increased
{heard_tin_story:
    Lisa Park: Yes. It's David. His wife's called Elena.
    Lisa Park: I didn't tell you that. You didn't get it from me.
- else:
    Lisa Park: David? Keep this to yourself, yeah? The collection tin's for him.
    Lisa Park: His wife Elena's got cancer. A trial in the States, and the insurer won't touch it.
}
-> hub

=== ask_office_mood ===
#speaker:lisa_park
~ topic_office_mood = true
~ lisa_influence += 5
#influence_increased

Lisa Park: Tense. The crypto team keep looking at each other like it's a game of Cluedo.

{lisa_influence >= 15:
    ~ lisa_influence += 5
    #influence_increased
    Lisa Park: Dr Halloran had a stand-up row with the CEO last month about publishing. Half the building heard it.
    Lisa Park: Ben Ashworth's been snapping at everyone. David Torres has barely said a word in weeks.
    Lisa Park: And Owen's been living in the logs, poor lamb.
}

-> hub

=== ask_torres_personal ===
#speaker:lisa_park
~ topic_torres_personal = true
~ lisa_influence += 10
#influence_increased

Lisa Park: David's lovely. Always polite. Remembers everyone's birthday.

Lisa Park: Two kids, Sofia and Miguel. He used to talk about them non-stop.

Lisa Park: Now he barely talks at all.

{lisa_influence >= 20:
    ~ lisa_influence += 10
    #influence_increased
    Lisa Park: I saw him crying in the car park last month. I pretended I hadn't. Still feel awful.
    Lisa Park: And someone keeps ringing his desk phone. He takes it in the stairwell.
}

-> hub

=== ask_elena ===
#speaker:lisa_park
~ topic_elena = true

{topic_torres_personal:
    Lisa Park: His wife, Elena, came to the Christmas party two years ago. Lovely woman. Now she's ill. Properly ill.
    {lisa_influence >= 25:
        ~ lisa_influence += 10
        #influence_increased
        Lisa Park: He told me what the treatment costs once, after a glass of wine. Three hundred and eighty thousand dollars.
        Lisa Park: The tin's on about two grand. I can't even think about the rest.
    }
- else:
    Lisa Park: David's wife? She's ill. Cancer. That's all I really know.
}
-> hub

=== told_torres ===
#speaker:lisa_park
~ told_about_torres = true
~ david_confirmed = true

Lisa Park: No. David wouldn't...

Lisa Park: But Elena. The money. Oh, God.

Lisa Park: What happens to Sofia and Miguel? If he goes to prison and Elena's...

+ [That's not my concern tonight.]
    ~ lisa_influence -= 10
    #influence_decreased
    Lisa Park: Right. Just the job, then.
    ~ hub_quiet = true
    -> hub

// D5-8: once his fate is settled, the player can't say "I don't know yet".
+ {final_choice == ""} [I don't know yet. I'm trying to find a way that doesn't wreck them.]
    ~ lisa_influence += 5
    #influence_increased
    Lisa Park: Then try hard. Please.
    ~ hub_quiet = true
    -> hub

+ {final_choice != ""} [It's done. I'm sorry.]
    Lisa Park: Don't be. Just... don't tell me which way.
    ~ hub_quiet = true
    -> hub
