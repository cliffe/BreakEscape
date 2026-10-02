// ================================================
// Mission 1: First Contact - Derek Confrontation
// Act 3: Major Moral Choice
// UPDATED: Evil monologue, clear villain, no sympathy
// Player confronts Derek with Operation Shatter evidence
// ================================================

VAR confrontation_approach = ""    // diplomatic, aggressive, evidence_based
VAR derek_knows_safetynet = false
VAR derek_showed_remorse = false   // Spoiler: he won't
VAR final_choice = ""              // arrest, recruit, expose
VAR derek_confronted = false       // Set to true when confrontation ends

// External variables
VAR player_name = "Agent 0x00"
VAR evidence_collected = false
VAR found_casualty_projections = false

// Entropy archive access — true once player reads ENTROPY Network Architecture
VAR entropy_reveal_read = false

// VM flags — still tracked for debrief scoring, not used as confrontation gate
VAR ssh_flag_submitted = false
VAR linux_flag_submitted = false
VAR sudo_flag_submitted = false

// ================================================
// START: DEREK APPEARS
// ================================================

=== start ===
// Check if player has accessed the ENTROPY encrypted archive (has the full picture)
{not entropy_reveal_read:
    -> insufficient_evidence
}
// Player has the ENTROPY intelligence — proceed with confrontation
#complete_task:confront_derek

Working late on the security audit?

I've been watching you, you know. The lockpicking. The server access. The files you've been copying.

You're not an IT contractor. And you've found Operation Shatter.

+ [I know what you're planning, Derek.]
    ~ confrontation_approach = "aggressive"
    ~ derek_knows_safetynet = true
    -> derek_response_direct
+ [I've seen the casualty projections.]
    ~ confrontation_approach = "evidence_based"
    ~ derek_knows_safetynet = true
    -> derek_response_evidence
+ [SAFETYNET knows everything.]
    ~ confrontation_approach = "aggressive"
    ~ derek_knows_safetynet = true
    -> derek_response_safetynet
+ {found_casualty_projections} [I have everything. The archive. The network map. The Architect's letter. It's over, Derek — what happens next is up to you.]
    ~ confrontation_approach = "evidence_based"
    ~ derek_knows_safetynet = true
    -> confrontation_choice

// ================================================
// INSUFFICIENT EVIDENCE - PLAYER NEEDS VM FLAGS
// ================================================

=== insufficient_evidence ===
Oh, you must be the IT contractor. Security audit, right?

I'm kind of busy. Maybe check back later?

+ [I need to look at your systems]
    Feel free to look around the office. But I don't have time for an interview right now.
    Come back when you've actually found something worth discussing.
    #exit_conversation
    -> start
+ [We should talk about some irregularities I've found]
    Irregularities? Like what exactly?
    If you don't have specifics, I've got work to do. Come back when you have real evidence — not speculation.
    #exit_conversation
    -> start
+ [I'll come back later]
    Good idea. I'm sure the server room has plenty to keep you busy.
    #exit_conversation
    -> start

// ================================================
// DEREK RESPONDS - DIRECT APPROACH
// ================================================

=== derek_response_direct ===
"Planning." Such a neutral word for what we're doing.

We're not planning an attack. We're planning an education.

+ [You're planning to kill people.]
    -> derek_admits_casualties
+ [You're insane.]
    -> derek_calm_response

=== derek_calm_response ===
Insane? I'm the sanest person in this building.

Everyone else pretends the systems work. Pretends their data is secure. Pretends that trust is deserved.

I know the truth. And after Sunday, so will everyone else.

-> derek_admits_casualties

// ================================================
// DEREK RESPONDS - EVIDENCE APPROACH
// ================================================

=== derek_response_evidence ===
Ah. The casualty projections.

I was wondering if you'd find those. They're the most honest part of the whole operation.

+ [You calculated how many people would die.]
    -> derek_admits_casualties
+ [42 to 85 people. Those are your numbers.]
    -> derek_admits_casualties

// ================================================
// DEREK RESPONDS - SAFETYNET
// ================================================

=== derek_response_safetynet ===
SAFETYNET. The organization that thinks surveillance protects people.

You found the files. The targeting lists. The message templates.

Good. Then you understand what's coming.

-> derek_admits_casualties

// ================================================
// DEREK ADMITS TO CASUALTIES - THE EVIL MONOLOGUE
// ================================================

=== derek_admits_casualties ===
Yes. Between 42 and 85 people will die in the first 24 hours.

It's not random noise. We've segmented the population—demographic cohorts where tailored lies land hardest, multiplied by everyone else caught when the system buckles.

Hospitals overwhelmed by false closure alerts. Emergency lines jammed with spoofed calls—people who can't reach real help in time. Crowd crush and secondary crashes as everyone reacts at once. Heart attacks from sheer panic. It compounds.

I calculated every one of them.

+ [How can you be so calm about murdering people?]
    -> evil_monologue_part1
+ [You're a monster.]
    -> evil_monologue_part1
+ [Why?]
    -> evil_monologue_part1
+ [I don't need to hear this. You're done.]
    -> confrontation_choice
+ [Save it for your trial.]
    -> confrontation_choice

// ================================================
// EVIL MONOLOGUE - PART 1
// ================================================

=== evil_monologue_part1 ===
Murder? No. Think of it as... forced education.

Every security professional in the world says "humans are the weakest link." They write papers about it. Give talks at conferences. Collect consulting fees.

But no one actually DEMONSTRATES it. No one shows what happens when you target human psychology at scale.

We're going to prove—conclusively, undeniably—that digital trust is a lie. That every message you receive could be fake. That nothing is secure.

+ [By killing innocent people.]
    -> evil_monologue_part2
+ [You're just terrorists with a philosophy degree.]
    -> evil_monologue_part2
+ [Stop talking. This is over.]
    -> confrontation_choice
+ [I'm not here to debate philosophy with you.]
    -> confrontation_choice

=== evil_monologue_part2 ===
"Innocent." That's an interesting word.

The cohorts we're profiling? Vulnerable demographics—statistical slices where coordinated misinformation moves fastest and verification breaks down first. High leverage. Predictable panic.

And they're not some narrow fringe case. They trust hospital alerts without verification. They forward emergency broadcasts without checking the source.

They're not innocent. They're negligent. They've outsourced their critical thinking to systems that can be manipulated.

We're teaching them—all of them—that trust is dangerous. Verify everything. Question everything. Or die.

+ [Some of them WILL die. That's murder.]
    -> evil_monologue_part3
+ [You're rationalizing mass murder.]
    -> evil_monologue_part3
+ [Enough. I've heard enough.]
    -> confrontation_choice
+ [You don't get to finish that sentence.]
    -> confrontation_choice

// ================================================
// EVIL MONOLOGUE - PART 3 (The Coldest Part)
// ================================================

=== evil_monologue_part3 ===
Forty-two to eighty-five deaths. Let's call it sixty.

The model isn't uniform—lies don't land on everyone with the same weight—but once capacity collapses, geography and timing decide who pays. That's engineered, not accidental.

Do you know how many people die every year because they trusted the wrong email? Clicked the wrong link? Gave credentials to the wrong person?

Thousands. Tens of thousands. Deaths from delayed emergency response. Medical errors from compromised records. Violence incited by disinformation.

We're going to end that. One bad weekend. Sixty deaths. And then NO ONE will ever trust a digital message again without verification.

Sixty deaths to save tens of thousands per year. That's not murder. That's optimization.

+ [You're calculating human lives like statistics.]
    -> derek_final_philosophy
+ [The Architect taught you this, didn't they?]
    -> architect_reference
+ [This ends now.]
    -> confrontation_choice

=== architect_reference ===
The Architect opened my eyes. But I chose this path myself.

Entropy is inevitable. Trust is a lie. Security through obscurity fails.

We just accelerate the lesson. Make it unavoidable. Make it hurt enough that people remember.

-> derek_final_philosophy

// ================================================
// DEREK'S FINAL PHILOSOPHY
// ================================================

=== derek_final_philosophy ===
You look at me like I'm a monster.

But I'm the only honest person in this industry. Every security researcher KNOWS trust is broken. They just profit from pretending it can be fixed.

I'm the one willing to actually fix it. To burn the comfortable lies so something real can grow from the ashes.

Those sixty people? Their deaths will save millions.

And in ten years, when no one falls for phishing because Operation Shatter taught them to verify everything, you'll understand.

I'm not a villain. I'm a prophet.

+ [You're delusional.]
    -> confrontation_choice
+ [You're going to prison for the rest of your life.]
    -> confrontation_choice
+ [I almost feel sorry for you. Almost.]
    -> confrontation_choice

// ================================================
// CONFRONTATION CHOICE (Major Decision)
// ================================================

=== confrontation_choice ===
So. Here we are. You've heard my reasoning. You've seen the evidence.

What happens now is up to you.

I have here a launch device to remotely activate Operation Shatter. One confirmation code is all it takes. And I have it memorised.

But know this—even if you stop Operation Shatter here, the idea doesn't die. There are other cells. Other believers. Other architects of the inevitable.

+ [I'm taking you down. Now.] #color:red
    ~ final_choice = "fight"
    -> choice_fight
+ [I'm calling in SAFETYNET. You're under arrest.]
    ~ final_choice = "arrest"
    -> choice_arrest
+ [Work with us. Help us stop the other cells.]
    ~ final_choice = "recruit"
    -> choice_recruit
+ [I'm exposing everything publicly. Let the world see what you are.]
    ~ final_choice = "expose"
    -> choice_expose
+ [You know it's over. Drop the device. Surrender.]
    ~ final_choice = "surrender"
    -> choice_surrender

// ================================================
// CHOICE: FIGHT (Hostile Engagement)
// ================================================

=== choice_fight ===
Player: No lawyers. No trials. No platform for your twisted philosophy.

Derek Lawson: *steps back* You're making a mistake.

Player: The only mistake was thinking you'd get to walk out of here.

Violence? How disappointing. I expected better from SAFETYNET.

Player: You calculated deaths like statistics. You don't get to lecture me about violence.

#hostile
#speaker:derek
#influence:-100
#add_objective:defeat_derek_hostile

If you want a fight, you'll get one. But you won't stop ENTROPY. You'll just prove we're right about the system.

Come on then!

#set_global:derek_fight_triggered:true
#exit_conversation

-> END

=== fight_outcome ===
#complete_task:defeat_derek_hostile
#event:hostile_npc_defeated:derek

#speaker:derek
Derek Lawson: *coughs* You think... you think this changes anything?

I'm a martyr now. ENTROPY will remember this. The Architect will remember.

#speaker:narrator
Narrator: SAFETYNET backup arrives and restrains Derek Lawson.

~ derek_confronted = true
#exit_conversation

-> END

// ================================================
// CHOICE: ARREST (Surgical Strike)
// ================================================

=== choice_arrest ===
Player: You're done, Derek. Operation Shatter dies today. And you're going to spend the rest of your life in prison.

Prison. How quaint.

You think concrete walls stop ideas? I'll become a martyr. People will study my philosophy. Question why I was silenced.

Player: You'll be a case study in how not to become a terrorist.

Terrorist. That's what they call educators who make people uncomfortable.

Narrator: You call in SAFETYNET backup. Derek doesn't resist—he's too confident that he's already won something.

-> arrest_outcome

=== arrest_outcome ===
#speaker:narrator
#set_global:derek_confronted:true
#give_item:launch-device
#remove_npc
#exit_conversation
Narrator: Backup arrives within minutes. Derek Lawson is in custody.
-> END

// ================================================
// CHOICE: RECRUIT (Double Agent)
// ================================================

=== choice_recruit ===
Player: You said there are other cells. Other architects of chaos.

Player: Help us stop them. Turn informant. Give us ENTROPY from the inside.

Become a double agent? Betray The Architect?

Derek Lawson: *laughs* You think I'd sell out the only people who understand the truth? For what—reduced sentence?

No. I'm not like you, willing to compromise principles for convenience.

Arrest me. Expose me. I don't care. But I will never betray ENTROPY.

Player: Then you leave me no choice.

-> recruit_outcome

=== recruit_outcome ===
#speaker:narrator
#set_global:derek_confronted:true
#give_item:launch-device
#remove_npc
#exit_conversation
Narrator: SAFETYNET backup arrives. Derek Lawson is taken into custody.
-> END

// ================================================
// CHOICE: EXPOSE (Public Disclosure)
// ================================================

=== choice_expose ===
Player: I'm taking everything. The casualty projections. The demographic segmentation. The targeting lists. The forged alerts you wrote to weaponise blind trust.

Player: I'm giving it all to the press. Let the world see what ENTROPY really is.

You think that hurts me? I WANT people to see this.

Public disclosure means the philosophy spreads. People will read those casualty projections and think—what if it happened? What if next time we're not stopped?

Fear is the first step to wisdom. You're doing my work for me.

+ [Then the world will also see you in handcuffs.]
    -> expose_execute
+ [At least they'll know to watch for people like you.]
    -> expose_execute

=== expose_execute ===
Player: Maybe. But they'll also see that SAFETYNET stopped you. That we found you before you killed anyone.

Player: And every time someone reads about Operation Shatter, they'll remember that we caught you. That your "inevitable entropy" wasn't so inevitable after all.

A temporary setback. Entropy always wins eventually.

Player: Not today.

Narrator: You begin compiling the evidence for public release while calling in backup.

-> expose_outcome

=== expose_outcome ===
#speaker:narrator
#set_global:derek_confronted:true
#give_item:launch-device
#remove_npc
#exit_conversation
Narrator: The evidence upload completes. SAFETYNET backup arrives. Derek Lawson is in custody.
-> END

// ================================================
// CHOICE: SURRENDER (Derek stands down)
// ================================================

=== choice_surrender ===
Derek Lawson: *pauses* You have the archive. The Architect's letter. The network map.

Derek Lawson: *quietly* ...You really do have everything.

Then you don't need a fight to end this.

Narrator: Derek sets down the launch device.

Derek Lawson: Take it. Stop the launch. I won't resist.

But hear me — ENTROPY doesn't end with me. The Architect planned for this.

-> surrender_outcome

=== surrender_outcome ===
#speaker:narrator
#set_global:derek_confronted:true
#set_global:derek_surrendered:true
#give_item:launch-device
#remove_npc
#exit_conversation
Narrator: Derek's hands are empty. SAFETYNET backup is called. The launch device is yours.
-> END
