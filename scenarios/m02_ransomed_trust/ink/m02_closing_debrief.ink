// ===========================================
// ACT 3: CLOSING DEBRIEF
// Mission 2: Ransomed Trust
// Break Escape - Consequences and Reflection
// ===========================================

// Variables synced from globalVars by engine at call-open
VAR paid_ransom = false
VAR exposed_hospital = false
// Decision-weight: enacted ward outcome. ward_recovering distinguishes a fast recovery
// (ransom or combined) from the slow offline-only restore; the Bed 4 vars carry whether
// the player saved Mr Pryce by hand during the slow-path window.
VAR ward_recovering = false
VAR patient_bed4_deceased = false
VAR bed4_manually_stabilised = false
VAR gary_protected = false
VAR kim_guilt_revealed = false
VAR ghost_deal_accepted = false
VAR ghost_keys_used = false
VAR advised_board_pay = false
VAR advised_board_refuse = false
VAR flag_ghost_log_submitted = false
VAR lore_ghosts_manifesto_found = false
VAR lore_cryptosecure_found = false
VAR lore_zds_invoice_found = false

// Inside-asset investigation outcomes
VAR insider_identified = false
VAR insider_confronted = false
VAR insider_asset_arrested = false
VAR insider_asset_escaped = false
VAR insider_asset_exposed = false
VAR accused_wrong_suspect = false
VAR night_security_supervisor_ko = false
VAR insider_ambushed = false

// The cover-burn thread
VAR cover_burned = false
VAR cover_restored = false
VAR bernie_vouched = false
VAR staff_lanyard_obtained = false
VAR insider_method_confirmed = false

// Seed beat: the recovered ENTROPY PIN-cracker, analysed by Agent Nightshade.
VAR pin_cracker_found = false
VAR asked_about_cracker = false
VAR guard_knocked_out = false
VAR attacked_guard = false
// Playtest loop round 1 (B3/B4): set by HaX's player_ko mapping and Ghost's act2_reveal.
VAR player_was_ko = false
VAR ghost_affiliate_heard = false
VAR val_caught_picking = false

// Friendly-NPC knockouts -- set by globalVarOnKO. The debrief must own these
// out loud rather than narrate the people as though they were never touched.
VAR receptionist_ko = false
VAR gary_ko = false
VAR dr_kim_ko = false
VAR ward_nurse_ko = false
VAR raval_ko = false
VAR patient_assaulted = false
VAR patient_bed4_ko = false

// Local
VAR asked_about_the_call = false

// Local: how the player carries the weight of the mission. Set in the hub,
// paid off in the final reflection. Not a global -- self-contained to this scene.
VAR player_shaken = false
VAR player_cold = false

EXTERNAL player_name()

// ===========================================
// DEBRIEF START
// ===========================================

=== start ===
// Set at the top so a reload mid-debrief can't replay it; the room_entered backstop in the
// scenario completes hear_debrief if the last line was never reached.
#set_global:debrief_played:true
#speaker:narrator
Narrator: SAFETYNET headquarters. Forty-eight hours after St. Catherine's.

#speaker:agent_0x99
Agent HaX: Agent. Sit down. You've earned the chair.

Agent HaX: Systems are back. Patients are stable. But I've read your field notes twice and I keep landing on the same thing.

Agent HaX: This wasn't a burglary. Ghost didn't want money. They wanted a lesson taught in bodies.

Agent HaX: Casualties, calculated in advance, signed off before the operation started.

Agent HaX: We've seen that signature before. You've seen it before.

* [You mean Derek. Social Fabric.]
    ~ player_cold = true
    Agent HaX: I mean Derek. Same fingerprints, different hands.
    Agent HaX: Operation Shatter and this. ENTROPY doesn't improvise. Somebody's teaching them.
    -> debrief_hub
* [Say that plainly. Who's really behind this?]
    ~ player_shaken = true
    Agent HaX: You already know the answer you don't want. So do I.
    Agent HaX: We'll get to it. Ask me what you need first.
    -> debrief_hub

// ===========================================
// DEBRIEF HUB -- player-driven questions
// Each answer is distinct. Nothing here is on rails; the consequence
// report plays in full once you're done, no matter what you skip.
// ===========================================

=== debrief_hub ===
#speaker:agent_0x99

- (options)
Agent HaX: {&What do you want to know?|What else?|Anything more before we get to the cost?|Ask.}

* [Who was Ghost, really?]
    -> q_ghost_identity
* {q_entropy_link < 1} [This was ENTROPY again -- like Derek's cell at Viral Dynamics.]
    -> q_entropy_link
* {q_entropy_link > 0 and q_architect < 1} [Then who's running the cells? The Architect?]
    -> q_architect
* {cover_burned and not asked_about_the_call} [Someone took my name off their system mid-job. I want to talk about that.]
    -> q_the_phone_call
* {pin_cracker_found and not asked_about_cracker} [That PIN-cracker out of their kit in the server room -- has anyone looked at it?]
    -> q_pin_cracker
+ [Enough. Walk me through what it cost.]
    -> mission_summary

=== q_pin_cracker ===
~ asked_about_cracker = true
Agent HaX: Funny you ask -- I had our hardware man look at it the second it came in. He's still grinning about it. Nightshade, say hello.
Narrator: A wiry man in a lab coat leans into frame, turning the device over in gloved hands like it is a small, fascinating animal.
Agent 0x47 'Nightshade': Agent 0x00. Lovely piece of kit you brought me. It's a keypad oracle -- brute-force with a brain. It doesn't guess the PIN blind.
Agent 0x47 'Nightshade': Every wrong try, it tells you how many digits were right and in place, and how many in the wrong slot.

Agent 0x47 'Nightshade': Each answer narrows the field. Mastermind, in silicon.
Agent 0x47 'Nightshade': The firmware is how I know it's ENTROPY, not some catalogue burglar. Signed, versioned, built to be handed out, logged out, handed back.

Agent 0x47 'Nightshade': Somebody manufactures these at scale, for people they trust with buildings.
Agent 0x47 'Nightshade': I'll write it up properly. Short version: the people you're chasing have a supply chain.

Agent 0x47 'Nightshade': That should worry you more than the one device.
Agent HaX: *quietly* He's not wrong. He usually isn't.
-> debrief_hub

=== q_the_phone_call ===
#speaker:agent_0x99
~ asked_about_the_call = true

Agent HaX: Yes. I've thought about very little else since your field notes came in.

Agent HaX: Eleven words on an internal telephone, and it nearly cost you the operation. No exploit, no weapon.

Agent HaX: He removed the thing every one of your doors was actually running on. Other people's willingness to believe you.

{insider_method_confirmed:
    Agent HaX: And ENTROPY's own handling notes had it written down as doctrine. "Do not obstruct physically. Remove their standing." They knew exactly what they were buying when they bought Reeves.
}

* [It worked because there was no system left to correct the record in.]
    Agent HaX: That's the part I want you to keep.
    Agent HaX: The ransomware took more than their records. It took their ability to know who anybody was.
    Agent HaX: After that, the place runs on social trust. And trust is a great deal easier to attack than a server.
    -> debrief_hub

* {bernie_vouched} [It didn't work. A night receptionist put her own staff number against my name.]
    Agent HaX: *and there's something almost like a laugh in it* Bernadette Nwosu.
    Agent HaX: Eleven years on a reception desk, no clearance, no training, no idea who you were.
    Agent HaX: And she's the single reason ENTROPY's inside asset didn't run this to a conclusion.
    Agent HaX: Put her in the report by name. I'll make sure somebody senior enough to embarrass a hospital board reads it.
    -> debrief_hub

* {not cover_restored} [I never got it back. I worked the rest of that night as a trespasser.]
    Agent HaX: I know. It's in every line of your notes.
    Agent HaX: You did the job with the building against you, which is harder than the job you were briefed for. I'd rather you hadn't had to.
    -> debrief_hub

=== q_ghost_identity ===
#speaker:agent_0x99

Agent HaX: Honestly? We don't know. "Ghost" is a handle, not a name.

Agent HaX: Fourteen months of preparation. A device planted during a fire drill six weeks before you arrived.

Agent HaX: Comms discipline so clean we've got nothing. No face, no voice print, no trail out.

Agent HaX: What we know is the shape of them. A true believer, Ransomware Incorporated's field operative, and they meant every word.

Agent HaX: To Ghost, the patients were the argument.

{q_entropy_link > 0:
    Agent HaX: And that discipline? It's trained. Nobody's that careful by accident. Same school as Derek.
}

-> debrief_hub

=== q_entropy_link ===
#speaker:agent_0x99

Agent HaX: Yes. ENTROPY. The same network that ran Social Fabric out of Viral Dynamics.

Agent HaX: Derek Lawson kept casualty projections. A spreadsheet of how many Operation Shatter would kill, approved before he pulled the trigger.

// Round 2 (CF-E): only quote the manifesto if the player found it.
{lore_ghosts_manifesto_found:
    Agent HaX: Ghost kept mortality calculations. Different cell, different weapon, identical arithmetic.
- else:
    Agent HaX: Ghost will have done the same sums. Different cell, different weapon, identical arithmetic.
}

Agent HaX: Somebody taught both of them to do the sums and sleep at night. That's a method.

* [So the cells don't even know each other?]
    Agent HaX: Compartmentalised. Social Fabric never heard of Ransomware Incorporated. That's by design -- you can't burn a network you can't see.
    Agent HaX: But they all learned from the same source.
    -> debrief_hub
* [Then Derek was never the end of it.]
    Agent HaX: Derek was one node. Whatever happened to him at Viral Dynamics, the network kept moving. Ghost is proof.
    Agent HaX: We win this by finding the one who trains them.
    -> debrief_hub

=== q_architect ===
#speaker:agent_0x99

Agent HaX: The Architect. Derek's letter named them. Ghost's logs point the same way, without ever saying it.

Agent HaX: One person -- or one mind -- coordinating every cell. Social Fabric. Ransomware Incorporated. The two you haven't met yet.

Agent HaX: We don't have a name. We have a philosophy, a signature, and now two data points that rhyme. That's more than we had a week ago.

-> debrief_hub

// ===========================================
// MISSION SUMMARY -- consequence spine begins here
// ===========================================

=== mission_summary ===
#speaker:agent_0x99

// Round 1 (VM alignment): the projections are in the manifesto, not the flag-4 log.
{lore_ghosts_manifesto_found:
    Agent HaX: You found Ghost's manifesto. The mortality calculations.
    Agent HaX: Pre-planned. Spreadsheet-precise. They knew what the statistics meant before the operation started and ran it anyway.
}

{lore_ghosts_manifesto_found:
    Agent HaX: The manifesto -- read it again when you have time. It's how they see themselves. Understanding their ideology matters for what comes next.
}

{not flag_ghost_log_submitted and not lore_ghosts_manifesto_found:
    Agent HaX: The exploit chain was exactly what Ghost's communications suggested -- the ProFTPD 1.3.3c backdoor, fourteen years unpatched. Standard ENTROPY playbook.
}

{ghost_keys_used:
    Agent HaX: And you took Ghost's keys. Free, on Ghost's terms -- the restore ran on the attacker's goodwill, and the price was a promise.
    Agent HaX: The ethics of it depend entirely on what you did at the press terminal.
- else:
    {ghost_deal_accepted:
        Agent HaX: You shook on Ghost's deal and then never used their keys. I'm not sure Ghost knows what to make of that. I'm not sure I do.
    }
}

-> patient_outcomes

// ===========================================
// PATIENT OUTCOMES (Critical Callback)
// ===========================================

=== patient_outcomes ===
#speaker:agent_0x99

{paid_ransom:
    -> ransom_paid_outcomes
}
{ghost_keys_used:
    -> ghost_keys_outcomes
}
{ward_recovering:
    -> combined_recovery_outcomes
}
-> manual_recovery_outcomes

=== ransom_paid_outcomes ===
#speaker:agent_0x99

Agent HaX: You paid. Monitoring was back inside the hour, which is about as fast as that building was ever going to move.

Agent HaX: Two people died in the night. Both were critical before any of this started, and the coroner will say so.

Agent HaX: Forty-five didn't. I'm not going to dress either of those numbers up for you.

+ [Forty-five people got their morning because we moved fast.]
    Agent HaX: They did. That's the job.
    Agent HaX: The hundred and fifty thousand has gone somewhere, though. You should know where.
    -> entropy_funding_discussion

+ [Two people died. Say their part properly.]
    Agent HaX: *she doesn't reach for the file* They were alive when you walked in. Both of them.
    Agent HaX: The review will say the attack only brought forward what was coming.
    Agent HaX: I've read that sentence a lot of times. It's never once done what it's meant to.
    -> ransom_paid_funding

+ [What does a hundred and fifty thousand actually buy them?]
    -> entropy_funding_discussion

=== ransom_paid_funding ===
#speaker:agent_0x99

Agent HaX: The hundred and fifty thousand. You should know where it goes.

-> entropy_funding_discussion

=== ghost_keys_outcomes ===
#speaker:agent_0x99

Agent HaX: Ghost's keys. The wards were back inside the hour and St. Catherine's didn't pay a penny for it.

Agent HaX: Ghost's restore brought the ward monitors up first, before anything else in the estate.
Agent HaX: One died in the night, and she was critical before any of this started. It's the best number any route had.

Agent HaX: And Ghost is still in that network. The keys were Ghost's, so every host they decrypted is a host Ghost can reach again.
Agent HaX: The trust's incident team has found three ways back in so far, and they don't think that's all of them.

Agent HaX: The restore ran because Ghost chose to let it. Remember that the next time anybody offers you something for free.

-> entropy_funding_discussion

=== combined_recovery_outcomes ===
#speaker:agent_0x99

Agent HaX: You ran the combined restore. Ghost's own key material from the staging cache and the physical set from the safe, together.

Agent HaX: Four hours. Systems back well inside the window.

Agent HaX: Two died, both of them critical long before ENTROPY got anywhere near that building. The wards held.

Agent HaX: And you paid ENTROPY nothing. That's the closest thing to a clean result this night had.

Agent HaX: It cost you the legwork instead of costing them the win.

-> entropy_funding_discussion

=== manual_recovery_outcomes ===
#speaker:agent_0x99

Agent HaX: Offline keys alone. Eleven hours and thirty-four minutes of manual restore, right up against the edge of the fuel.

Agent HaX: {bed4_manually_stabilised:Five|Six} people died in that window. Ventilator complications, a dialysis failure, two cardiac arrests that nobody was watching a screen for.

{patient_bed4_deceased and patient_bed4_ko:
    Agent HaX: One of the six was Mr Pryce in Bed 4. You struck him earlier in the night.
    Agent HaX: When his circuit alarmed he couldn't call out, and nobody reached him in time. That one I am putting on you.
}
{patient_bed4_deceased and not patient_bed4_ko:
    Agent HaX: One of the six was the ventilated gentleman in Bed 4. Mr Pryce.
    Agent HaX: His circuit alarmed with no relay to carry it to the desk, and by the time a nurse got down the row it was over.
    Agent HaX: You were in the building when it happened. I'm not putting that on you. But a faster route home might have reached him.
}
{bed4_manually_stabilised:
    Agent HaX: It would have been six. Mr Pryce in Bed 4 went into a high-pressure alarm with nothing to carry it to the station.
    Agent HaX: You bagged him by hand until a nurse could take over. He's alive because you were standing there when the machine turned on him.
    Agent HaX: Sister Doyle asked me to make sure that was written down.
}

* [Those deaths are on the timeline I chose.]
    -> manual_recovery_guilt

* [But ENTROPY got nothing. No operational funding.]
    -> manual_recovery_vindication

=== manual_recovery_guilt ===
#speaker:agent_0x99

Agent HaX: {bed4_manually_stabilised:Five|Six} people died in a crisis Ghost built. You were the one trying to put it out.

Agent HaX: The review will make a lot of the fact that four of them were already very ill.
Agent HaX: Better you hear that from me than read it. And better you don't lean on it.

+ [Ghost built it so those deaths would land on me.]
    Agent HaX: Of course they did. That was planned months before you walked in.
    Agent HaX: They don't get the attack and the guilt. Pick one to give them.
    -> manual_recovery_vindication

+ [I made the call I could make with what I had.]
    -> manual_recovery_vindication

=== manual_recovery_vindication ===
#speaker:agent_0x99

Agent HaX: ENTROPY got nothing. Not a penny of operational funding for Ransomware Incorporated.

Agent HaX: Ghost's next hospital target is delayed. Possibly cancelled.

-> entropy_funding_discussion

// ===========================================
// ENTROPY FUNDING DISCUSSION
// ===========================================

=== entropy_funding_discussion ===
#speaker:agent_0x99

{paid_ransom:
    Agent HaX: Paid in Bitcoin. We watched it move for about six hours.
    Agent HaX: Then it went through a swap service in a jurisdiction that doesn't answer us, and came out as something with no readable ledger.
    Agent HaX: Which means Ransomware Incorporated is funded for their next two or three operations, and we have a very tidy report about the first six hours of it.
}
{not paid_ransom:
    Agent HaX: No transaction means no financial trail -- which cuts both ways. Less to trace, but they have less too.
}

Agent HaX: Either way, Crypto Anarchists handle ENTROPY's payment infrastructure across all cells. That's a mission for another day.

{paid_ransom:
    Agent HaX: Your ransom gives us a fresh transaction to trace. Specific wallets. Specific timing. That's data.
- else:
    Agent HaX: ENTROPY goes into their next operation short-funded. That changes what they can afford to do.
}

-> hospital_status

// ===========================================
// HOSPITAL STATUS
// ===========================================

=== hospital_status ===
#speaker:agent_0x99

{exposed_hospital:
    -> hospital_exposed_path
- else:
    -> hospital_quiet_path
}

=== hospital_exposed_path ===
#speaker:agent_0x99

Agent HaX: You published the evidence.

Agent HaX: "Hospital Ignored IT Warnings for Six Months Before Ransomware Attack." The story ran within the hour.

Agent HaX: A Health and Social Care Committee inquiry. Forty-plus hospitals implementing emergency security audits within a fortnight.

{ghost_deal_accepted:
    Agent HaX: Ghost got exactly what they wanted -- the public lesson. Without spending a penny.
    Agent HaX: Whether that matters depends on what you think counts as winning.
}

* [Did I do the right thing by exposing them?]
    -> exposure_reflection

* [What happened to Dr. Kim and Gary?]
    -> npc_outcomes_exposed

=== exposure_reflection ===
#speaker:agent_0x99

Agent HaX: Forty hospitals upgraded their security posture within two weeks of the story breaking.

Agent HaX: Long-term lives saved -- hard to count, but real.

Agent HaX: St. Catherine's is going to spend years in legal proceedings. Their reputation is damaged in ways that will cost the patients who still need care there.

Agent HaX: I don't know if it was right. I know it mattered.

-> npc_outcomes_exposed

=== hospital_quiet_path ===
#speaker:agent_0x99

Agent HaX: You kept the evidence internal. St. Catherine's board has privately committed to a security overhaul.

Agent HaX: Cyber Security budget tripled. Two hundred and fifty thousand a year.

Agent HaX: Reputation intact. Public unaware.

{ghost_deal_accepted:
    Agent HaX: Ghost considers the deal broken. They'll remember that.
}

* [Should I have exposed them?]
    -> quiet_resolution_reflection

* [What happened to Dr. Kim and Gary?]
    -> npc_outcomes_quiet

=== quiet_resolution_reflection ===
#speaker:agent_0x99

Agent HaX: 214 hospitals scanned. 147 with critical vulnerabilities. None of them know what happened here.

Agent HaX: Some of them will be hit before someone publishes the lesson. I don't know how many.

Agent HaX: St. Catherine's is safer. The rest of the sector -- unchanged.

-> npc_outcomes_quiet

// ===========================================
// NPC OUTCOMES (Exposed Path)
// ===========================================

=== npc_outcomes_exposed ===
#speaker:agent_0x99

Agent HaX: Dr. Kim resigned under pressure. Gave evidence to a select committee. Reputation damaged, not destroyed -- she's consulting in healthcare tech now.

{kim_guilt_revealed:
    Agent HaX: She told investigators she recommended the budget cuts. Accepted responsibility publicly.
    Agent HaX: That took something. Not many executives do that.
}

Agent HaX: Gary Whitlock...

{gary_protected:
    -> gary_protected_exposed
- else:
    -> gary_unprotected_exposed
}

=== gary_protected_exposed ===
#speaker:agent_0x99

Agent HaX: Vindicated. Your documentation of his warnings went public alongside everything else.

Agent HaX: He's Director of Cyber Security at Royal Northern now. Full team, proper budget.

Agent HaX: He asked us to pass something on: "Tell the agent who documented my warnings. They gave me my career back."

-> ghost_status

=== gary_unprotected_exposed ===
#speaker:agent_0x99

Agent HaX: He was fired within 48 hours of the attack. Scapegoated.

Agent HaX: But when the story broke -- his emails were in it. Seven warnings, ignored. The backlash forced St. Catherine's to rehire him. He's IT Security Director now.

Agent HaX: He survived it. But he asked me: "Does the agency know what happened to me here?"

Agent HaX: I told him yes. We know.

-> ghost_status

// ===========================================
// NPC OUTCOMES (Quiet Path)
// ===========================================

=== npc_outcomes_quiet ===
#speaker:agent_0x99

Agent HaX: Dr. Kim kept her position. Private reprimand, no public consequences.

{kim_guilt_revealed:
    Agent HaX: She told me she'll never ignore an IT warning again. I believe her. Guilt is a better teacher than public shame, sometimes.
}

Agent HaX: Gary Whitlock...

{gary_protected:
    -> gary_protected_quiet
- else:
    -> gary_unprotected_quiet
}

=== gary_protected_quiet ===
#speaker:agent_0x99

Agent HaX: You protected him. Your documentation went into the internal review.

Agent HaX: Promoted to Director of Cyber Security, full budget authority.

Agent HaX: He sent a message. "Thank whoever documented the warnings. Saved my career."

-> ghost_status

=== gary_unprotected_quiet ===
#speaker:agent_0x99

Agent HaX: He was fired quietly. No public scapegoat narrative -- but the career's gone.

Agent HaX: Blacklisted in healthcare IT. "Failed to prevent catastrophic breach."

Agent HaX: He did everything right. Warned them. Documented the risk. Seven times.

Agent HaX: Last I heard, he's working help desk at a further education college. £26,000 a year.

#speaker:narrator
Narrator: A pause.

#speaker:agent_0x99
Agent HaX: That's the injustice that radicalises people. The ones who did the right thing and got ground up for it anyway.

Agent HaX: Remember that when you think about Ghost's ideology. They're not wrong about the problem.

-> ghost_status

// ===========================================
// GHOST STATUS
// ===========================================

=== ghost_status ===
#speaker:agent_0x99

// Round 1 (B6): Ghost's keys leave Ghost in the network.
{ghost_keys_used:
    Agent HaX: Ghost's gone. No trace on the person. The keys are another matter.
- else:
    Agent HaX: Ghost's gone. Clean exit. No trace, no leads.
}

Agent HaX: Ransomware Incorporated is still operational.

* [Ghost escaped. We failed.]
    Agent HaX: We disrupted them, and we learned how they work. I'll take that.
    {paid_ransom:
        Agent HaX: We have a transaction trail. Financial data for an operation further down the line.
    - else:
        Agent HaX: And they paid for tonight out of their own pocket.
    }
    -> insider_status

* [What about ENTROPY's structure?]
    -> insider_status

// ===========================================
// INSIDE ASSET OUTCOME
// ===========================================

=== insider_status ===
#speaker:agent_0x99

{insider_asset_arrested:
    -> insider_rolled_up
}
{night_security_supervisor_ko:
    -> insider_neutralised_ko
}
{insider_asset_escaped or insider_ambushed:
    -> insider_escaped
}
{insider_identified:
    -> insider_flagged
}
{accused_wrong_suspect:
    -> insider_missed_wrong
}
-> insider_unnoticed

=== insider_rolled_up ===
#speaker:agent_0x99

Agent HaX: And you got the one Ghost planted inside. Graham Reeves, badge SC-4471.

Agent HaX: He authorised the fire drill that put ENTROPY's device on the LAN, six weeks before you walked in.

{cover_burned:
    Agent HaX: And he made the phone call. Which means the man slowing you down all night was standing four feet from the evidence, being helpful.
}

{insider_asset_exposed:
    Agent HaX: You named him publicly alongside the board. He'll stand next to their negligence in every story that runs.
}

Agent HaX: We've had his post assignments, his access logs, his handler contacts for six hours now.

Agent HaX: One arrest, and a thread into the whole cell.

Agent HaX: Underpaid, ignored, radicalised by the same negligence he helped punish.


-> entropy_coordination_reveal

=== insider_neutralised_ko ===
#speaker:agent_0x99

{insider_identified:
    Agent HaX: And you put down the inside asset yourself. Graham Reeves, badge SC-4471.
    Agent HaX: No interrogation, so the thread's thinner than an arrest would've given us. But he's off the board and contained.
- else:
    Agent HaX: One more thing. The night security supervisor you put down in the boardroom -- we ran him afterwards. Graham Reeves, badge SC-4471. He authorised the fire drill that planted ENTROPY's device.
    Agent HaX: You had the right man. You just never knew what you were holding. We recovered what we could from his post logs, but he wasn't talking.
}

Agent HaX: Underpaid, ignored, radicalised by the same negligence he helped punish.

-> entropy_coordination_reveal

=== insider_flagged ===
#speaker:agent_0x99

Agent HaX: You identified Ghost's inside asset -- Graham Reeves, night security supervisor, badge SC-4471. You didn't get to close it out yourself, but your identification was enough.

Agent HaX: SAFETYNET moved on your identification and picked Reeves up before he could disappear. His access logs and handler contacts are ours now. A thread into the cell.

-> entropy_coordination_reveal

=== insider_escaped ===
#speaker:agent_0x99
#set_global:insider_asset_escaped:true

// Round 1 (B4): only claim Ghost said it if the player heard it.
{ghost_affiliate_heard:
    Agent HaX: There's one more thing you should know. Ghost told you the truth -- there was an affiliate inside the building. Graham Reeves, the night security supervisor.
- else:
    Agent HaX: There's one more thing you should know. There was an affiliate inside the building. Graham Reeves, the night security supervisor.
}

{insider_ambushed:
    Agent HaX: He was standing at that terminal the whole time. {exposed_hospital:When you transmitted|When you closed the terminal}, he told you who he was and walked out.
    Agent HaX: By the time backup reached the conference room, he was gone.
- else:
    Agent HaX: He was standing at that terminal the whole time. His post was empty by the time anybody thought to look.
}
{accused_wrong_suspect:
    Agent HaX: And you spent your suspicion on the wrong person first. The evidence pointed where he wanted it to.
}

Agent HaX: Vanished. No trace. The same way Ghost went. That one's on the clock we were racing -- but if we'd read the signs earlier, we'd have had him.

-> entropy_coordination_reveal

=== insider_missed_wrong ===
#speaker:agent_0x99

Agent HaX: One loose end. Ghost wasn't bluffing about an inside affiliate -- there was one. And you spent your suspicion on the wrong person.

Agent HaX: The real asset was Graham Reeves, on the boardroom post. Badge SC-4471. He walked out the same night, unquestioned.

Agent HaX: It happens. The evidence pointed where they wanted it to point. But it's a lead we'll be chasing cold now.

-> entropy_coordination_reveal

=== insider_unnoticed ===
#speaker:agent_0x99

Agent HaX: One thing we never closed. Ghost said someone in that building confirmed their operational timing. An ENTROPY affiliate.

Agent HaX: We never identified them. Still on staff, still trusted, still inside.

Agent HaX: Next time we go into one of these, we look harder for the person holding the door.

-> entropy_coordination_reveal

=== entropy_coordination_reveal ===
#speaker:agent_0x99

// Round 1 (VM alignment): the ZDS link comes from the boardroom-safe invoice.
{lore_zds_invoice_found:
    Agent HaX: That invoice from the boardroom safe confirmed it -- Zero Day Syndicate sourced the ProFTPD exploit.
}
Agent HaX: Crypto Anarchists handle payment processing across all cells.

{lore_cryptosecure_found:
    Agent HaX: The CryptoSecure intelligence you recovered -- that's their financial front. We're building a picture of the network.
}

{lore_zds_invoice_found:
    Agent HaX: The Zero Day Syndicate invoice you found -- specific evidence of the procurement chain between ENTROPY cells. That's going straight into planning for what comes next.
}

{lore_ghosts_manifesto_found:
    Agent HaX: And the manifesto. Ghost's own statement of intent, staged on their own hardware, signed off by the Architect.
    Agent HaX: Analysts have had it two days and nobody's slept. We expected ravings.
    Agent HaX: It's a costed argument with an error bar on it, and the last line reads: "I am not asking to be forgiven. I am asking to be understood."
    Agent HaX: That document is the best thing you brought out of that building. It tells us what we're actually fighting.
}

Agent HaX: The Zero Day Syndicate is next in our sights. The Crypto Anarchists, further down the line.


-> staff_outcomes

// ===========================================
// THE PEOPLE WHO HELPED -- the mission's social ledger
// ===========================================

=== staff_outcomes ===
#speaker:agent_0x99

Agent HaX: One last section, and then I'll let you go. The people.

{bernie_vouched:
    Agent HaX: Bernadette Nwosu, night reception. She put her own staff number against a stranger on the word of one honest conversation, and she was right.
    Agent HaX: The trust's opened a disciplinary about it. I have written to them. At some length.
}

{receptionist_ko:
    Agent HaX: Bernadette Nwosu, night reception. You put her out cold behind her own desk and lifted the override key off the hook.
    Agent HaX: Sixty-one, eleven years on that desk, never a mark on her.
    Agent HaX: She's fine. She never saw who did it. That is not the same as it not having happened.
}

{cover_burned and not cover_restored:
    Agent HaX: Nobody vouched for you. You finished that job as an unidentified stranger in a hospital corridor, which is a thing I would rather you never had to do twice.
}

{raval_ko:
    Agent HaX: Nurse Raval, on manual obs rounds. You put her down between the beds, and six patients went longer than fifteen minutes without anybody checking them.
}

{patient_assaulted:
    Agent HaX: And you struck a patient. In a hospital bed, on a ward running on paper.
    Agent HaX: I've read the statement from the bed opposite. I'm not going to read it out to you.
}

{guard_knocked_out:
    Agent HaX: Val Okonkwo, security officer, north corridor. Concussion, four days off, and a written statement that she was assaulted by an intruder.
    Agent HaX: She'd spent eight weeks logging Graham Reeves and getting told to drop it.
    Agent HaX: The closest thing you had to an ally in that building, and you put her on the floor.
    Agent HaX: I'm not going to lecture you. You've read the file. I just want it said out loud once.
- else:
    // Round 1 (B3): a fight with Val that didn't end with her on the floor.
    {attacked_guard and player_was_ko:
        Agent HaX: Val Okonkwo. You went for her in her own corridor, and she put you on the floor.
        Agent HaX: She'd spent eight weeks logging Graham Reeves. Then she had to log you.
    }
    {attacked_guard and not player_was_ko:
        Agent HaX: Val Okonkwo. You went for her in her own corridor, and she logged every second of it.
        Agent HaX: She'd spent eight weeks logging Graham Reeves. Then she had to log you.
    }
    {val_caught_picking:
        Agent HaX: Val Okonkwo's incident log has you in it, crouched at her office door with a pick set.
        Agent HaX: Time, description, what you said. It's the most accurate document anybody produced that night.
    }
    {insider_identified:
        Agent HaX: Val Okonkwo had Reeves in her notebook for eight weeks and was told twice to leave it.
    Agent HaX: Her log is now the spine of the case against him.
        Agent HaX: She has asked, through her union, that the record show she raised it. It will.
    }
}

{ward_nurse_ko:
    Agent HaX: Sister Doyle, ward sister. You dropped her mid-shift. Forty-seven patients on backup power, and the one qualified pair of hands down.
    Agent HaX: It held. You were not owed that.
}

{dr_kim_ko:
    Agent HaX: And Dr. Kim. Whatever she signed off or looked away from, you knocked her senseless in her own office to take what you needed.
    Agent HaX: She came round, cooperated, never named you. File that wherever you keep the things you'd rather not have done.
}

{gary_ko:
    Agent HaX: Gary Whitlock came round in an ambulance with his keycard gone and a fair idea of who took it.
    Agent HaX: Right about everything for six months, and the night's answer was to put him down and step over him.
    Agent HaX: He knows. He hasn't said. That's a debt, not an acquittal.
}

{gary_protected:
    Agent HaX: And Gary Whitlock has the thing he actually wanted, which was never his job. It was somebody senior saying, in writing, that he was right.
}

-> final_reflection

// ===========================================
// FINAL REFLECTION
// ===========================================

=== final_reflection ===
#speaker:agent_0x99

Agent HaX: Here's what I'll say, Agent.

{player_cold:
    Agent HaX: You named Derek the moment I raised it. Cold. Focused. Useful, in this work.
}
{player_shaken:
    Agent HaX: You couldn't say the Architect's name out loud when you came in. Good. The day this stops costing you something is the day I start worrying about you.
}

{advised_board_refuse and paid_ransom:
    Agent HaX: One more thing. Dr. Kim held the board off because you told her you'd have the keys in time.
    Agent HaX: Someone wrote the cheque anyway. She spent trust she couldn't spare, on your word. People remember that.
}
{advised_board_pay and not paid_ransom:
    Agent HaX: You told Kim to pay, then found a way that didn't need paying.
    Agent HaX: She went into that boardroom arguing for a cheque nobody had to write. A small thing. She noticed it anyway.
}
{advised_board_refuse and not paid_ransom:
    Agent HaX: And you kept your word to Kim. You said you'd get the keys without paying, and you did.
    Agent HaX: In this work that's rarer than it should be. She knows what you spent to make good on it.
}
{advised_board_pay and paid_ransom:
    Agent HaX: You told Kim to pay, and that's how it ended. No surprises for her.
    Agent HaX: She trusted your read, and it held. That matters, next time you need someone inside to believe you.
}

{ward_recovering and not paid_ransom and not ghost_keys_used:
    Agent HaX: Ghost built that choice so that it couldn't be got right. You found the way through it Ghost had bet nobody would.
- else:
    Agent HaX: Ghost built that choice so that it couldn't be got right. That was the craft in it, more than the exploit.
}

Agent HaX: You made it anyway, at four in the morning, with half the facts and forty-seven people depending on it.

* [I made the best decision I could with what I had.]
    Agent HaX: You acted. That counts.
    -> mission_3_setup

* [I'm still not sure it was the right call.]
    {paid_ransom:
        Agent HaX: 45 people are alive today. That's real. Those are real families not burying someone.
        Agent HaX: ENTROPY has funding. That's also real. Both things are true simultaneously.
    - else:
        {ghost_keys_used:
            {exposed_hospital:
                Agent HaX: You paid ENTROPY nothing, had the wards back inside the hour, and kept your promise to Ghost. Ghost is still in that network. All of those are true at once.
            - else:
                Agent HaX: You paid ENTROPY nothing and had the wards back inside the hour, then broke your word to Ghost.
                Agent HaX: Ghost is still in that network, and now Ghost has a grievance. Both of those are true at once.
            }
        - else:
            {ward_recovering:
                Agent HaX: You gave ENTROPY nothing and still had the wards back in four hours. Two died who were most likely going regardless. That is about as well as this ends.
            - else:
                Agent HaX: ENTROPY went home empty-handed. Long-term, that matters.
                Agent HaX: {bed4_manually_stabilised:Five|Six} people died in the downtime. That also matters.
            }
        }
    }
    Agent HaX: I won't tell you which weighs more. I genuinely don't know. Neither does anyone who hasn't stood where you stood.
    -> mission_3_setup

* [What's next?]
    -> mission_3_setup

// ===========================================
// MISSION 3 SETUP
// ===========================================

=== mission_3_setup ===
#speaker:agent_0x99

// Round 2 (CF-E): the invoice is how the player would know this.
{lore_zds_invoice_found:
    Agent HaX: Zero Day Syndicate. They sold Ghost the ProFTPD exploit. They scanned 214 hospitals and recommended St. Catherine's specifically.
- else:
    Agent HaX: Zero Day Syndicate. Our analysts traced Ghost's exploit back to them after you left. They picked St. Catherine's out of 214 hospitals.
}

Agent HaX: Shut down their exploit marketplace and ENTROPY loses its technical supply chain across all cells.

Agent HaX: Operation Cyber Arsenal.

* [Let's take them down.]
    -> debrief_close

* [And the Architect? Who coordinates ENTROPY?]
    -> architect_tease

=== architect_tease ===
#speaker:agent_0x99

Agent HaX: The Architect runs the cells -- more of them than we've confirmed, and we don't know who they are yet.

Agent HaX: But each mission reveals more. Social Fabric, Ransomware Incorporated -- patterns emerging in how the cells communicate, how they're structured.

Agent HaX: Eventually we'll have enough to identify them. Then we end this.

-> debrief_close

// ===========================================
// DEBRIEF CLOSE
// ===========================================

=== debrief_close ===
#speaker:agent_0x99

Agent HaX: Get some rest, Agent.

Agent HaX: We'll brief the next operation when you're ready.

// The conclusion aim's last task completes HERE (before any exit), so the bond_visualiser
// credits come after the debrief rather than over it.
#complete_task:hear_debrief
#complete_mission
#exit_conversation

-> END
