// ===========================================
// Mission 5: Torres Confrontation - Act 3
// Critical choice: turn / hand over / expose / fight (fight resolves
// in-engine, then the player decides his fate after the knockout).
//
// PASS 2:
// - Torres waits in the data centre, at the upload terminal the scene
//   describes. He is shown when he is named; the player walks to him.
// - Re-entry guard (lesson 14): once final_choice is set, talking again
//   goes to a resting knot and can't replay or overwrite the outcome.
// - Never reaches DONE/END (lesson 21).
// - final_choice is a synced global; the debrief waits for this
//   conversation to CLOSE (conversation_closed:david_torres).
// - Canon (review M2): SAFETYNET has no jurisdiction and no arrest powers
//   (universe_bible/02_organisations/safetynet/overview.md:41-47). The
//   player detains Torres and hands him to Patricia, who calls the police.
//   "Cooperation" is a private deal: SAFETYNET pays for Elena's treatment
//   in exchange for a debrief before the police arrive. What a court does
//   next is not SAFETYNET's to promise.
// ===========================================

VAR final_choice = "" // Synced scenario global: Torres' fate ("turn_double_agent", "arrest", "combat_nonlethal", "combat_lethal", "public_exposure"); also set by HaX's post-KO call (m05_phone_agent_0x99)
VAR confront_stance = ""  // "sympathetic" or "hardline"
VAR torres_turned = false
VAR torres_arrested = false // Synced scenario global: Torres is in police custody; also set by HaX's post-KO call (m05_phone_agent_0x99)
VAR elena_treatment_funded = false
VAR entropy_program_exposed = false
VAR fight_quiet = false
VAR after_quiet = false

// Synced from scenario globals
VAR player_name = "Agent 0x00"
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_vetting_file = false
VAR found_pipeline_list = false
VAR flag4_submitted = false
VAR recruiter_contacted_player = false
VAR patricia_ko = false
VAR halloran_accused = false

// PASS 4 (design): evidence shapes what the player can argue on the turn
// path (journal, flag 4), and every ending stays open whatever was found.
// Lines that promised Patricia branch on patricia_ko. The player can pull
// the drive themselves at stop_upload.
//
// PASS 4 (dialogue): no scripted player lines. The player's words are in the
// choices; where the player answers without a choice, Torres works it out or
// a Narrator line reports it. fight_quiet and after_quiet give the two
// resting knots a re-entry line (m03 pattern), skipped after a goodbye.

// ===========================================
// ENTRY
// ===========================================

=== start ===
{final_choice != "":
    -> after_choice
}
-> confrontation_scene

=== confrontation_scene ===
#speaker:narrator
Narrator: 20:14. The data centre. The racks roar.

Narrator: David Torres sits alone at the terminal, a USB drive in the front port. The transfer bar reads 94 per cent. Sixteen minutes to the window.

Narrator: He doesn't turn around.

#speaker:david_torres
{patricia_ko:
    David Torres: I know you're there. Security's gone quiet tonight. That was you, wasn't it?
- else:
    David Torres: I know you're there. Patricia sent you.
}

David Torres: "Security consultant." You're not an auditor.

David Torres: The vault logged me in twice tonight. One of them was you.

{halloran_accused:
    David Torres: You had Ruth suspended. I watched Security walk her back to the lab. That's when I knew I had tonight and no more.
}

+ [It's over, David. Step away from the terminal.]
    #speaker:narrator
    Narrator: He turns slowly. His hand stays near the keyboard.
    #speaker:david_torres
    David Torres: Is it?
    -> torres_confrontation

+ [I've seen what you've been staging, David. All of it.]
    David Torres: Then you know more than I did when I started.
    -> torres_confrontation

// ===========================================
// MAIN CONFRONTATION
// ===========================================

=== torres_confrontation ===
#speaker:david_torres

{
- found_medical_bills:
    David Torres: You've seen the bills, then. Elena's trial. Three hundred and eighty thousand dollars.
- found_vetting_file:
    David Torres: You've seen Patricia's file, then. The loans. The house. Elena's trial, priced in dollars.
- else:
    David Torres: Do you know what a clinical trial costs, when the insurer says no? I do. To the dollar.
}

{found_torres_journal:
    David Torres: Did you read my journal as well? Three months of me lying to myself, in my own handwriting.
}

+ [They lied to you. What did they tell you it was for?]
    ~ confront_stance = "sympathetic"
    -> torres_knows_truth

+ [You knew. The dispatch network. The projection. You knew.]
    ~ confront_stance = "hardline"
    -> torres_knows_truth

=== torres_knows_truth ===
#speaker:david_torres

David Torres: At first? Investigative journalists, exposing a corrupt contractor. That's what the Recruiter said. For about two weeks.

{flag4_submitted:
    David Torres: Then they showed me the paperwork you've clearly found. The Architect's signature under a number.
- else:
    David Torres: Then they showed me the casualty projection.
}

David Torres: I've known for two months. It was never going to a newspaper. ENTROPY wants the dispatch network for themselves.

David Torres: Thirty to forty-five people, the first time they use it. Ambulances that don't arrive.

+ [You knew people would die. Why did you keep going?]
    -> torres_rationalization

+ [You're no different from ENTROPY's other true believers.]
    #speaker:narrator
    Narrator: He opens his mouth to answer, then stops himself.
    -> torres_rationalization

=== torres_rationalization ===
#speaker:david_torres

David Torres: Because the system is rotten. Because it would all come down anyway, and better it comes down on purpose...

David Torres: Because Elena was dying and nobody else was going to pay...

David Torres: Because thirty to forty-five people is... is...

David Torres: Is thirty to forty-five families. Like mine.

{found_torres_journal:
    David Torres: You read it. "Collateral damage for the greater good." I wrote that about strangers so I wouldn't have to think of them as people.
}

-> evidence_revelation

=== evidence_revelation ===
#speaker:david_torres

David Torres: Three months ago I was trying to save my wife.

David Torres: Now I'm sixteen minutes from getting people killed.

#speaker:narrator
Narrator: The transfer bar ticks to 95 per cent.

-> final_choice_moment

// ===========================================
// CRITICAL CHOICE
// ===========================================

=== final_choice_moment ===
#speaker:narrator

+ [You're not too far gone. Help us, and we'll help Elena.]
    #complete_task:confront_torres
    -> turn_double_agent_path

+ [It's over. You're staying here until the police arrive.]
    #complete_task:confront_torres
    -> arrest_path

+ [Drop the philosophy. Step away, or I make you.]
    #complete_task:confront_torres
    -> combat_offer

+ [I'm going public. The programme, the Recruiter, you. From a source nobody can trace.]
    #complete_task:confront_torres
    -> public_exposure_path

// ===========================================
// PATH 1: TURN
// ===========================================

=== turn_double_agent_path ===
#speaker:david_torres

David Torres: Not too far gone? You don't know how far.

-> turn_argument

// PASS 4 fix 8: what the player can say depends on what they found.
// The Elena argument is always there, so the ending never closes.
=== turn_argument ===
+ {found_torres_journal} [You wrote "what have I become". People who've gone all the way don't ask that.]
    #speaker:david_torres
    David Torres: You did read it. I've asked it every night for a month.
    -> turn_come_back
+ {flag4_submitted} [The Architect signed off on forty-five deaths. What's your life worth to them?]
    #speaker:david_torres
    David Torres: Less. I've known that since I saw the projection. I just never let myself finish the sum.
    -> turn_come_back
+ [Three months, not three years. Elena needs you at home, not in a cell.]
    #speaker:david_torres
    David Torres: Elena. She thinks the money's a bonus. She thinks I'm a good man having a hard year.
    -> turn_come_back

=== turn_come_back ===
#speaker:david_torres

David Torres: Come back how?

+ [Go back to your desk. Feed them our data. Lead us to the rest.]
    -> torres_deal_offered

=== torres_deal_offered ===
#speaker:david_torres

David Torres: And Elena?

Narrator: You make the offer: the trial paid for, and somewhere quiet for the family if it ever gets dangerous.

{recruiter_contacted_player:
    Narrator: You tell him the Recruiter has been in touch with you tonight, with forty-seven more names lined up behind him.
    David Torres: Forty-seven...
}

+ [I need everything. How she contacts you, how you're paid, who else you've met.]
    -> torres_accepts_turn

=== torres_accepts_turn ===
#speaker:david_torres

David Torres: All right. All right. I'll do it.

David Torres: I'll help you reach the others before they end up where I am.

~ torres_turned = true
~ elena_treatment_funded = true
#complete_task:make_critical_choice
~ final_choice = "turn_double_agent"
David Torres: Thank you. I didn't think anyone would give me a way out.

-> stop_upload

// ===========================================
// PATH 2: HAND HIM OVER
// ===========================================

=== arrest_path ===
#speaker:david_torres

{patricia_ko:
    David Torres: You're not police. Police would have come through that door shouting.
- else:
    David Torres: You're not police. So Patricia's ringing them.
}

David Torres: So what are you?

+ [Someone who stopped this. The police can have you, and the evidence.]
    David Torres: What about Elena? The kids?
    -> arrest_family_question

+ [It doesn't matter. What matters is who arrives next.]
    David Torres: That's not an answer.
    -> arrest_family_question

=== arrest_family_question ===
#speaker:david_torres

David Torres: Elena's trial. If I'm in a cell, nobody pays for it.

David Torres: She dies. Sofia and Miguel watch it happen.

+ [Tell me everything about ENTROPY before they get here, and we pay for Elena.]
    David Torres: And the court? *a beat* No. You can't promise that.
    David Torres: Everything, then. Whatever you need.
    ~ elena_treatment_funded = true
    -> arrest_cooperation

+ [I'm not a social worker, David.]
    David Torres: No. Of course not.
    -> arrest_no_cooperation

=== arrest_cooperation ===
#speaker:david_torres

David Torres: The Recruiter. How they found me. Where the money comes from. All of it.

David Torres: Just... Elena. Please.

~ torres_arrested = true
#complete_task:make_critical_choice
~ final_choice = "arrest"
David Torres: The upload first. I know.

-> stop_upload

=== arrest_no_cooperation ===
#speaker:david_torres

David Torres: Then I've got nothing to say to you. I'll wait for them.

~ torres_arrested = true
#complete_task:make_critical_choice
~ final_choice = "arrest"

-> stop_upload

// ===========================================
// PATH 3: FIGHT
// The fight resolves in-engine. The player decides his fate after the
// knockout in post_ko_choice (npc_ko:david_torres mapping, disableClose).
// ===========================================

=== combat_offer ===
#speaker:david_torres

David Torres: You're not taking me. Elena needs me.

#hostile:david_torres
#speaker:narrator
Narrator: He shoves the chair back and comes at you.

~ fight_quiet = true
#exit_conversation
-> fighting

// Resting knot while he is hostile. A hostile NPC is struck, not talked to,
// so this is only a safety net that keeps the story live (lesson 21).
=== fighting ===
#speaker:narrator
{fight_quiet:
    ~ fight_quiet = false
- else:
    Narrator: He's breathing hard, between you and the terminal.
}
+ [Back off and keep your guard up.]
    Narrator: He's past talking.
    ~ fight_quiet = true
    #exit_conversation
    -> fighting

// ===========================================
// POST-KNOCKOUT: DECIDE HIS FATE
// ===========================================

=== post_ko_choice ===
{final_choice != "":
    -> after_choice
}
#speaker:narrator
Narrator: Torres went down hard against the rack. He isn't getting up.

Narrator: His breathing is ragged, and blood is pooling under his head. The terminal reads 97 per cent.

+ [Kill the upload, then stay with him: recovery position, pressure, call it in.]
    ~ torres_arrested = true
    #complete_task:make_critical_choice
    ~ final_choice = "combat_nonlethal"
    -> post_ko_arrest

+ [Kill the upload and walk out. Leave him bleeding on the floor.]
    #complete_task:make_critical_choice
    ~ final_choice = "combat_lethal"
    -> post_ko_handoff

=== post_ko_arrest ===
#speaker:narrator
Narrator: You pull the drive and kill the transfer at 97 per cent. The last of it stays in the building.

{patricia_ko:
    Narrator: Then you roll him onto his side, press your jacket to the cut, and call HaX. An ambulance and the police arrive together, and nobody asks who rang. He comes round in hospital, under guard.
- else:
    Narrator: Then you roll him onto his side, press your jacket to the cut, and call Patricia. She brings the police and an ambulance. He comes round in hospital, under guard.
}

~ after_quiet = true
#exit_conversation
-> after_choice

=== post_ko_handoff ===
#speaker:narrator
Narrator: You pull the drive and kill the transfer at 97 per cent. The last of it stays in the building.

Narrator: You step over him on the way out.

~ after_quiet = true
#exit_conversation
-> after_choice

// ===========================================
// PATH 4: PUBLIC EXPOSURE
// ===========================================

=== public_exposure_path ===
#speaker:david_torres

David Torres: You'd burn all of it. The Recruiter, the placements. Me.

David Torres: The others she's working on... they'd be warned. That's the point, isn't it.

David Torres: And me? My family?

+ [You'll be named. Elena will read it. The kids will see your face.]
    -> public_exposure_consequence

=== public_exposure_consequence ===
#speaker:david_torres

David Torres: They're eight and eleven.

David Torres: This will follow them for the rest of their lives.

~ entropy_program_exposed = true
~ torres_arrested = true
#complete_task:make_critical_choice
~ final_choice = "public_exposure"
David Torres: I did this to save them. And you're going to wreck them anyway.

-> stop_upload

// ===========================================
// STOP THE UPLOAD (conversational paths)
// ===========================================

// PASS 4 fix 15: the player's hand or his. Same outcome either way.
=== stop_upload ===
#speaker:narrator
Narrator: The transfer bar sits at 97 per cent. His hand is still beside the keyboard.
+ [Pull the drive myself.]
    Narrator: You pull the USB drive out of the port. The transfer window stalls, then throws an error. The last of it stays in the building.
    -> upload_stopped
+ [Cancel it, David. Your hand, not mine.]
    Narrator: He reaches past you and cancels the transfer. The last of it stays in the building.
    -> upload_stopped

=== upload_stopped ===
#speaker:narrator

{found_pipeline_list:
    Narrator: The TalentStack envelope is still in your pocket. He looks at it, then away.
}

{torres_turned:
    #speaker:david_torres
    David Torres: What happens now?
    #speaker:narrator
    Narrator: You tell him: home, act normal. Elena starts treatment on Monday. You'll be in touch.
    #speaker:david_torres
    David Torres: And the others?
    Narrator: As many as you can reach. You don't promise more.
}

{torres_arrested and not entropy_program_exposed:
    #speaker:david_torres
    David Torres: How long will I get?
    David Torres: ...No. That's for a court, isn't it. Not you.
    {elena_treatment_funded:
        David Torres: But Elena gets her treatment.
        Narrator: You nod.
    - else:
        David Torres: Elena will be dead before I get out.
    }
}

{entropy_program_exposed:
    David Torres: When does it go public?
    Narrator: Within the week, once the other targets have been warned. The police will come for him before then.
    David Torres: And then my face is everywhere.
}

Narrator: Operation Schrödinger is stopped.

~ after_quiet = true
#exit_conversation
-> after_choice

// ===========================================
// RESTING KNOT (re-entry after the choice)
// ===========================================

=== after_choice ===
#speaker:narrator
{after_quiet:
    ~ after_quiet = false
- else:
    {final_choice == "combat_nonlethal" or final_choice == "combat_lethal":
        Narrator: He hasn't moved.
    - else:
        David Torres: {&Still here.|Is there something else?}
    }
}
+ {final_choice == "turn_double_agent"} [We'll be in touch, David.]
    #speaker:david_torres
    David Torres: I know. I'll be waiting for the call.
    ~ after_quiet = true
    #exit_conversation
    -> after_choice
+ {final_choice == "arrest"} [Sit tight. The police are on their way.]
    #speaker:david_torres
    David Torres: Where would I go?
    ~ after_quiet = true
    #exit_conversation
    -> after_choice
+ {final_choice == "public_exposure"} [Go home, David. They'll come for you soon enough.]
    #speaker:david_torres
    David Torres: Home. To tell Elena before the papers do.
    ~ after_quiet = true
    #exit_conversation
    -> after_choice
+ {final_choice == "combat_nonlethal" or final_choice == "combat_lethal"} [Leave him.]
    Narrator: He doesn't move.
    ~ after_quiet = true
    #exit_conversation
    -> after_choice
+ {final_choice == ""} [Not yet.]
    David Torres: The bar's still moving.
    #exit_conversation
    -> start
