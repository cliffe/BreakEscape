// ===========================================
// Mission 6: NPC - Dr. Irina Volkova
// CTO of HashChain Exchange, recruitable asset
//
// PASS 2:
// - Never reaches DONE (lesson 21): every exit is #exit_conversation -> hub,
//   and after her fate is settled, -> after_choice.
// - A player who opened badly (trust -5) could never earn the wordlist: the
//   hub had no way to build trust. Two once-only topics now do.
// - The cloner route the badge's observation promised now exists
//   (rfidCard on the NPC + #clone_keycard, m03 pattern).
// - Her fate was reachable only through trust >= 20 AND the blockchain
//   evidence, so a player who never earned her trust could not end the
//   mission. Once the fund is found, "drop the cover" is always offered.
// - The fate tags only set elena_fate_decided; the task completes from a
//   mapping once the conclusion aim is open (lesson 27).
// - Canon (lesson 39): SAFETYNET has no arrest powers. She is detained and
//   handed to the police with the evidence; no sentencing promises.
// - Cover is the FCA, not FinCEN.
// ===========================================

VAR elena_trust = 0              // -50 to 100 scale
VAR elena_suspicious = false
VAR moral_conflict_revealed = false
VAR shown_casualties = false
VAR shown_architects_fund = false
VAR recruitment_offered = false
VAR recruitment_accepted = false
VAR recruitment_refused = false
VAR badge_discussion = false
VAR badge_cloned = false
VAR asked_research = false
VAR asked_paperwork = false
VAR first_meeting = true

// Synced from scenario globals / inventory
VAR player_name = "Agent 0x00"
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR elena_recruited = false
VAR elena_arrested = false
VAR elena_fate_decided = false
VAR has_rfid_cloner = false
VAR found_password_lists = false   // set by the pickup mapping (lesson 26)
VAR elena_badge_obtained = false   // set by the pickup mapping (lesson 26)
VAR given_time = false
VAR asked_passwords = false   // playtest D1: the second ask always succeeds
VAR wordlist_handed = false   // playtest D4: menu latch, same conversation
VAR badge_handed = false

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:elena_volkov
{elena_fate_decided:
    -> after_choice
}
// Playtest D1: the openers used to sit inside {first_meeting:} with no divert,
// so they fell through into the hub and all seven options showed at once. A
// first pick from the hub discarded the openers and capped trust at 10.
{first_meeting:
    -> first_meeting_scene
}
Dr. Irina Volkova: Back again. What do you need?
-> hub

=== first_meeting_scene ===
#speaker:elena_volkov
~ first_meeting = false
// Review M1: the only other route to this task was taskOnKO.
#complete_task:meet_elena
Narrator: A sharp-eyed woman in her mid-thirties looks up from three monitors of transaction graphs.

Dr. Irina Volkova: You must be the FCA. Dr. Irina Volkova, Chief Technology Officer.

Dr. Irina Volkova: A supervisory visit. Always a pleasure, I'm sure.

+ [Thank you for making the time, Dr. Volkova. I know a visit like this is disruptive.]
    ~ elena_trust += 10
    -> professional_response

+ [Let's be efficient. I need backend servers, transaction logs and wallet infrastructure.]
    ~ elena_trust -= 5
    ~ elena_suspicious = true
    -> suspicious_response

+ [Thirty-seven papers and nearly three thousand citations. I've read some of your work.]
    ~ elena_trust += 15
    -> academic_response

=== professional_response ===
#speaker:elena_volkov
Dr. Irina Volkova: I appreciate the courtesy. Most of your colleagues treat us as criminals from the first handshake.

Dr. Irina Volkova: We run a privacy-focused exchange. That is not the same thing as an illegal one.

~ elena_trust += 5
-> audit_discussion

=== suspicious_response ===
#speaker:elena_volkov
Dr. Irina Volkova: Eager, aren't you?

Dr. Irina Volkova: Supervisors usually start with paperwork. Customer checks, anti-laundering procedures. You went straight for the machines.

~ elena_suspicious = true
-> audit_discussion

=== academic_response ===
#speaker:elena_volkov
Dr. Irina Volkova: You read my work? Most people from your side see "cryptographer" and hear "hacker".

Dr. Irina Volkova: I built this exchange on sound principles. Zero-knowledge proofs, homomorphic encryption. Things I can defend.

~ elena_trust += 10
-> academic_discussion

=== academic_discussion ===
#speaker:elena_volkov
Dr. Irina Volkova: My research is about financial privacy. Governments should not be able to read every transaction a person makes.

Dr. Irina Volkova: That is a privacy position, not a criminal one.

+ [Financial surveillance worries me too. I understand the principle.]
    ~ elena_trust += 10
    -> hub

+ [It also launders money. That's why people like me visit exchanges like this.]
    Dr. Irina Volkova: Fair. Ask for what you need and I'll show you it's documented.
    ~ elena_trust += 5
    -> hub

=== audit_discussion ===
#speaker:elena_volkov
Dr. Irina Volkova: So what does the FCA want to see? Our customer checks are compliant. Our monitoring meets the thresholds.

{elena_suspicious:
    Dr. Irina Volkova: Unless you are looking for something that isn't on a checklist.
}
-> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
+ {not found_password_lists and not wordlist_handed} [I'll need to test your password strength. What do people here actually use?]
    -> request_passwords

+ {not asked_research} [What's the post-quantum work on your second screen?]
    -> research_topic

+ {elena_suspicious and not asked_paperwork} [Let's start again, properly. Walk me through your anti-laundering procedures.]
    -> paperwork_topic

+ {not badge_discussion} [Tell me about your door access.]
    -> discuss_badges

+ {badge_discussion and not elena_badge_obtained and not badge_handed and not badge_cloned} [About your office badge.]
    -> badge_followup

+ {has_rfid_cloner and not elena_badge_obtained and not badge_handed and not badge_cloned} [ (Read her badge with the cloner while she talks.) ]
    -> clone_badge

+ {elena_trust >= 20 and found_blockchain_evidence and not shown_casualties} [There's something you need to see, Dr. Volkova.]
    -> show_blockchain_evidence

+ {found_architects_fund and not recruitment_offered} [I'm going to stop pretending. I'm not from the FCA.]
    -> reveal_identity

+ {recruitment_offered and not recruitment_accepted and not recruitment_refused} [I need an answer, Dr. Volkova.]
    -> recruitment_decision

+ [That's all for now.]
    #speaker:elena_volkov
    {elena_trust >= 30:
        Dr. Irina Volkova: Find me if you need anything else.
    - else:
        {elena_trust >= 0:
            Dr. Irina Volkova: Alright. I'll be here.
        - else:
            Dr. Irina Volkova: Fine.
        }
    }
    #exit_conversation
    -> hub

// ===========================================
// REQUEST PASSWORDS (the wordlist)
// ===========================================

=== request_passwords ===
#speaker:elena_volkov
// Playtest D1: trust >= 15 is reachable on every opener (professional 15;
// academic 25+; efficient -5 +10 paperwork +10 research = 15), and a second
// ask always succeeds, so the passphrase clue can never be lost.
{asked_passwords:
    You: I'm asking again. Your own people's passwords, the list you already made.
- else:
    You: I need to test how strong your backend passwords really are. What do people here actually pick?
}
{elena_trust >= 15 or asked_passwords:
    ~ elena_trust += 5
    ~ wordlist_handed = true
    #give_item:text_file:m06_password_dictionary
    {elena_trust >= 20:
        Dr. Irina Volkova: Reasonable request for a supervisor. Here.
    - else:
        Dr. Irina Volkova: Fine. You'd find it on the file server in ten minutes anyway. Here.
    }

    Dr. Irina Volkova: My own audit wordlist. Every crypto firm on earth picks from the same twenty words and bolts a year on the end.

    Dr. Irina Volkova: Sixty-one per cent of our staff accounts fell to that list last time I ran it. Management's response was to stop me running it.
    -> hub
- else:
    ~ asked_passwords = true
    Dr. Irina Volkova: I don't know you well enough to hand a visitor our credential data.

    Dr. Irina Volkova: Earn a little trust first. Then we can talk about the backend.
    -> hub
}

// ===========================================
// TRUST-BUILDING TOPICS
// ===========================================

=== research_topic ===
#speaker:elena_volkov
~ asked_research = true
You: The second screen. That's not a trading dashboard.

Dr. Irina Volkova: Post-quantum key exchange. Lattice-based. The day a quantum computer breaks elliptic curves, every wallet on earth is readable, and I would rather we were ready than surprised.

Dr. Irina Volkova: It's the part of this job I'm still proud of.
~ elena_trust += 10
-> hub

=== paperwork_topic ===
#speaker:elena_volkov
~ asked_paperwork = true
You: Let's start again, properly. Walk me through your anti-laundering procedures.

Dr. Irina Volkova: *thawing slightly* Now that's a supervisor's question.

Dr. Irina Volkova: Every flagged transaction comes to me personally. I review it, I decide, I sign it off. That part I do by the book.
~ elena_trust += 10
~ elena_suspicious = false
-> hub

// ===========================================
// BADGE (lend or clone)
// ===========================================

=== discuss_badges ===
#speaker:elena_volkov
~ badge_discussion = true
You: Tell me about your door access.

Dr. Irina Volkova: Badges. Trading floor for staff, this one for my office, executive badges for the top floor.

Dr. Irina Volkova: *taps the lanyard at her collar* Four years round my neck. The badges are the one part of our security I'd defend. Satoshi is paranoid about doors and careless about passwords, which is exactly backwards.
-> hub

=== badge_followup ===
#speaker:elena_volkov
{elena_trust >= 25:
    You: I'll need to check your office reader as part of the visit. Can I borrow the badge?

    ~ elena_trust += 5
    ~ badge_handed = true
    #give_item:keycard:cto_access_badge
    Dr. Irina Volkova: *unclips it* Bring it back. And don't tell facilities I handed it over, they'll write a memo about it.

    Dr. Irina Volkova: West door. Try not to judge the whiteboard.
    -> hub
- else:
    Dr. Irina Volkova: My badge stays on my neck for a visitor I met an hour ago. Nothing personal.

    {has_rfid_cloner:
        Narrator: Her lanyard hangs open at her collar, well within a cloner's range. She'd never feel it read.
    }
    -> hub
}

// ===========================================
// CLONE THE BADGE (silent, needs the cloner)
// ===========================================
// The hub offers this only while she still has the badge and hasn't lent it.

=== clone_badge ===
#speaker:narrator
~ badge_cloned = true
Narrator: You keep her talking about lattices and let the cloner in your pocket read the badge on her lanyard. One pass, EM4100, a clean copy.
#clone_keycard:cto_badge
#speaker:elena_volkov
Dr. Irina Volkova: ...anyway. You didn't come here for a lecture on elliptic curves.
-> hub

// ===========================================
// SHOW THE EVIDENCE
// ===========================================

=== show_blockchain_evidence ===
#speaker:narrator
~ shown_casualties = true
Narrator: You lay the transaction graph on her desk. Ransom money in. Exploit money in. The Initiative's budget back out. All of it through the mixer she wrote.

#speaker:elena_volkov
Dr. Irina Volkova: *goes still* Where did you get our internal analysis?

+ [You flagged these transactions yourself. You already knew.]
    Dr. Irina Volkova: I flagged them because they were wrong. Not because I knew what they paid for.
    -> evidence_pivot
+ [It doesn't matter where. Read what it's paying for.]
    -> evidence_pivot

=== evidence_pivot ===
#speaker:elena_volkov
{found_architects_fund:
    You: The Architect's Fund. $12.8 million, six cells, a projection of 180 to 340 dead. You built the machine that moves it.
    ~ shown_architects_fund = true
    Dr. Irina Volkova: *reads it twice* They costed the deaths. They put a number in a cell and moved on.

    Dr. Irina Volkova: I told myself this was about privacy. Financial freedom. Not... this.
- else:
    You: Hospital ransoms. Exploit sales. All of it laundered clean through your infrastructure.
    Dr. Irina Volkova: I told myself it was about privacy. I am finding that harder to say out loud than I used to.
}
~ moral_conflict_revealed = true
~ elena_trust += 15
-> reveal_identity

// ===========================================
// REVEAL IDENTITY + RECRUITMENT
// ===========================================

=== reveal_identity ===
#speaker:elena_volkov
~ recruitment_offered = true
You: I'm SAFETYNET. The exchange you built is the bank for every ENTROPY cell we've met.

Dr. Irina Volkova: *quietly* My work. Used to kill people.

+ [You didn't see the whole picture. You can help us take it apart.]
    ~ elena_trust += 10
    You: You built these systems believing in them. ENTROPY turned them into a weapon. Help us dismantle their network and that means something.
    -> recruitment_decision
+ [You built it and you profited. But cooperation is a way to make it right.]
    ~ elena_trust += 5
    You: You're in this up to your neck. The honest way out is to help us end it, not to pretend you didn't know.
    -> recruitment_decision
+ [You're being detained, Dr. Volkova. Now.]
    -> detain_elena

=== recruitment_decision ===
#speaker:elena_volkov
{elena_trust >= 35:
    Dr. Irina Volkova: *long pause* Then I'll help you. On one condition: I see the intelligence I give you actually used. Not buried.

    You: You'll know. You have my word.

    ~ elena_recruited = true
    ~ elena_fate_decided = true
    #set_variable:elena_recruited=true
    #set_variable:elena_fate_decided=true
    Dr. Irina Volkova: Then yes. Start with three Crypto Anarchist cells Satoshi doesn't know I can name.

    Dr. Irina Volkova: And {player_name}? Thank you. For treating this as a choice.
    #exit_conversation
    -> after_choice
- else:
    Dr. Irina Volkova: I won't turn on Satoshi on the strength of one conversation and a graph.

    Dr. Irina Volkova: Financial privacy is a right. If some people abuse it, that is on them, not on me.

    + [Then you're complicit, and I'm treating you as complicit.]
        ~ recruitment_refused = true
        -> detain_elena
    // Review minor 1: a real alternative. Giving her time can turn her.
    + {not given_time} [Think about it. I'll come back before anyone else does.]
        ~ given_time = true
        ~ elena_trust += 10
        Dr. Irina Volkova: You're giving me time. Nobody in this building has ever done that.
        #exit_conversation
        -> hub
}

// ===========================================
// DETAIN
// ===========================================

=== detain_elena ===
#speaker:elena_volkov
You: Dr. Irina Volkova, I'm detaining you for laundering and for facilitating terrorism. The police will take it from here.

~ elena_arrested = true
~ elena_fate_decided = true
#set_variable:elena_arrested=true
#set_variable:elena_fate_decided=true

{moral_conflict_revealed:
    Dr. Irina Volkova: *offers her wrists* I really did think I was building something good.
- else:
    Dr. Irina Volkova: *cold* This is exactly the state overreach we warned people about.
}

Dr. Irina Volkova: I hope it was worth it.
#exit_conversation
-> after_choice

// ===========================================
// AFTER HER FATE IS SETTLED (re-entry, lesson 21)
// ===========================================

=== after_choice ===
#speaker:elena_volkov
{elena_recruited:
    Dr. Irina Volkova: I'm still here, and still yours. What do you need?
- else:
    Narrator: She sits very still at her desk, waiting for the police, and doesn't look up.
}
+ [Nothing. Carry on.]
    #exit_conversation
    -> after_choice
