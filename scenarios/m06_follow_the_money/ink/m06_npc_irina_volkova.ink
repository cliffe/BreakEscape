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
// - The fate tags only set irina_fate_decided; the task completes from a
//   mapping once the conclusion aim is open (lesson 27).
// - Canon (lesson 39): SAFETYNET has no arrest powers. She is detained and
//   handed to the police with the evidence; no sentencing promises.
// - Cover is the FCA, not FinCEN.
//
// PASS 3:
// - P1: the cloner is in the start kit, so the clone option no longer reads
//   an inventory has_* VAR (person chat re-syncs those from HER itemsHeld, so it went
//   false after she handed over the wordlist). Clone rule: the tag sits on a
//   throwaway line, irina_badge_cloned comes from HaX's card_cloned mapping,
//   and a cancelled clone leaves the option on offer.
// - P9: she holds the spare executive badge and hands it over once the fund
//   is found, whatever her trust or fate. irina_exec_badge_given comes from
//   the pickup mapping. exec_badge_turn hides the option only until the
//   player's next choice, so a failed give can always be asked for again.
// - P10: her research notes (read_irina_notes) give a low-trust player a way
//   to turn her.
//
// PASS 4 (design):
// - Fix 3 (round 2, M3): a turned Irina gives Satoshi's safe code and, while
//   the fund isn't found, narrows the slot puzzle (6120 is his auditors' decoy;
//   nothing inside her six-hour hold is his) without naming the slot. Once the
//   player has the settlement log she checks a slot they name (slot_check);
//   a right answer sets irina_confirmed_slot for the debrief and credits.
//   Told, not handed over: a held text_file would drop readable on a KO
//   (E20/E22). A detained Irina gives nothing.
// ===========================================

VAR irina_trust = 0              // -50 to 100 scale
VAR irina_suspicious = false
VAR moral_conflict_revealed = false
VAR shown_casualties = false
VAR shown_architects_fund = false
VAR recruitment_offered = false
VAR recruitment_refused = false
VAR badge_discussion = false
VAR exec_badge_turn = -1   // TURNS() at the last hand-over
VAR asked_research = false
VAR asked_paperwork = false
VAR first_meeting = true

// Synced from scenario globals / inventory
VAR player_name = "Agent 0x00"
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR irina_recruited = false
VAR irina_arrested = false
VAR irina_fate_decided = false
VAR found_password_lists = false   // set by the pickup mapping (lesson 26)
VAR irina_badge_obtained = false   // set by the pickup mapping (lesson 26)
VAR irina_badge_cloned = false     // set by HaX's card_cloned mapping (clone rule)
VAR irina_exec_badge_given = false // set by the pickup mappings (lesson 26)
VAR read_irina_notes = false       // onPickup of her research notes (P10)
VAR architect_identity_found = false // safe opened (PASS 4 fix 3)
VAR read_settlement_log = false      // settlement log picked up (round 2, M3)
VAR given_time = false
VAR asked_passwords = false   // playtest D1: the second ask always succeeds
VAR wordlist_handed = false   // playtest D4: menu latch, same conversation
VAR badge_handed = false
// Final round (m03 pattern): set by every exit, so the resting knot's re-entry
// line shows on a reopen and never in the same batch as a goodbye.
VAR hub_quiet = false

// ===========================================
// INITIAL MEETING
// ===========================================

=== start ===
#speaker:irina_volkova
{irina_fate_decided:
    -> after_choice
}
// Playtest D1: the openers used to sit inside {first_meeting:} with no divert,
// so they fell through into the hub and all seven options showed at once. A
// first pick from the hub discarded the openers and capped trust at 10.
{first_meeting:
    -> first_meeting_scene
}
Dr. Irina Volkova: Back again. What do you need?
~ hub_quiet = true
-> hub

=== first_meeting_scene ===
#speaker:irina_volkova
~ first_meeting = false
// Review M1: the only other route to this task was taskOnKO.
#complete_task:meet_irina
Narrator: A sharp-eyed woman in her mid-thirties looks up from three monitors of transaction graphs.

Dr. Irina Volkova: You must be the FCA. Dr. Irina Volkova, Chief Technology Officer.

Dr. Irina Volkova: A supervisory visit. Always a pleasure, I'm sure.

+ [Thanks for making the time, Dr Volkova. I know these visits are a nuisance.]
    ~ irina_trust += 15
    #influence_increased
    -> professional_response

+ [Let's be quick. I need your servers, your logs and your wallets.]
    ~ irina_trust -= 5
    #influence_decreased
    ~ irina_suspicious = true
    -> suspicious_response

+ [Thirty-seven papers and nearly three thousand citations. I've read some of your work.]
    ~ irina_trust += 25
    #influence_increased
    -> academic_response

=== professional_response ===
#speaker:irina_volkova
Dr. Irina Volkova: Courtesy. Your colleagues usually treat us as criminals from the first handshake.

Dr. Irina Volkova: We run a privacy exchange. The law permits those, last time I read it.

-> audit_discussion

=== suspicious_response ===
#speaker:irina_volkova
Dr. Irina Volkova: Eager, aren't you?

Dr. Irina Volkova: Supervisors start with paperwork. Customer checks, anti-laundering. You went straight for the machines.

~ irina_suspicious = true
-> audit_discussion

=== academic_response ===
#speaker:irina_volkova
Dr. Irina Volkova: You read my work? Most people from your side see "cryptographer" and hear "hacker".

Dr. Irina Volkova: I built this exchange on sound principles. Zero-knowledge proofs, homomorphic encryption. Things I can defend.

-> academic_discussion

=== academic_discussion ===
#speaker:irina_volkova
Dr. Irina Volkova: My research is about financial privacy. Governments should not be able to read every transaction a person makes.

Dr. Irina Volkova: I would call that a privacy position. Your office calls it something else.

+ [Financial surveillance worries me too. I understand the principle.]
    ~ irina_trust += 10
    #influence_increased
    Dr. Irina Volkova: Then we have that much in common.
    -> hub

+ [It also launders money. That's why I'm here.]
    ~ irina_trust += 5
    #influence_increased
    Dr. Irina Volkova: Fair. Ask for what you need and I'll show you it's documented.
    -> hub

=== audit_discussion ===
#speaker:irina_volkova
Dr. Irina Volkova: So what does the FCA want to see? Our customer checks are compliant. Our monitoring meets the thresholds.

{irina_suspicious:
    Dr. Irina Volkova: Unless you are looking for something that isn't on a checklist.
}
-> hub

// ===========================================
// CONVERSATION HUB
// ===========================================

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Dr. Irina Volkova: {&Go on.|What else?|Yes?}
}
+ {not found_password_lists and not wordlist_handed} [I'll need to test your password strength. What do people here actually use?]
    -> request_passwords

+ {not asked_research} [What's the post-quantum work on your second screen?]
    -> research_topic

+ {irina_suspicious and not asked_paperwork} [Let's start again, properly. Walk me through your anti-laundering procedures.]
    -> paperwork_topic

+ {not badge_discussion} [Tell me about your door access.]
    -> discuss_badges

+ {badge_discussion and not irina_badge_obtained and not badge_handed and not irina_badge_cloned} [I need to check your office reader. Can I borrow your badge?]
    -> badge_followup

+ {not irina_badge_obtained and not badge_handed and not irina_badge_cloned} [(Let the cloner read her badge while she talks.)]
    -> clone_badge

+ {found_architects_fund and not irina_exec_badge_given and TURNS() > exec_badge_turn} [Satoshi's wing. You've a badge for it.]
    -> exec_badge_handover

+ {irina_trust >= 20 and found_blockchain_evidence and not shown_casualties} [There's something you need to see, Dr. Volkova.]
    -> show_blockchain_evidence

+ {found_architects_fund and not recruitment_offered} [I'm not from the FCA. I'm SAFETYNET, and your exchange banks ENTROPY.]
    -> reveal_identity

+ {recruitment_offered and not irina_recruited and not recruitment_refused} [I need an answer, Dr. Volkova.]
    -> recruitment_decision

+ [That's all for now.]
    #speaker:irina_volkova
    {irina_trust >= 30:
        Dr. Irina Volkova: Find me if you need anything else.
    - else:
        {irina_trust >= 0:
            Dr. Irina Volkova: Alright. I'll be here.
        - else:
            Dr. Irina Volkova: Fine.
        }
    }
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// REQUEST PASSWORDS (the wordlist)
// ===========================================

=== request_passwords ===
#speaker:irina_volkova
// Playtest D1: trust >= 15 is reachable on every opener (professional 15;
// academic 25+; efficient -5 +10 paperwork +10 research = 15), and a second
// ask always succeeds, so the passphrase clue can never be lost.
{irina_trust >= 15 or asked_passwords:
    ~ irina_trust += 5
    #influence_increased
    ~ wordlist_handed = true
    #give_item:text_file:m06_password_dictionary
    {irina_trust >= 20:
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
#speaker:irina_volkova
~ asked_research = true
~ irina_trust += 10
#influence_increased

Dr. Irina Volkova: Post-quantum key exchange. Lattice-based. The day a quantum computer breaks elliptic curves, every wallet on earth is readable, and I would rather we were ready than surprised.

Dr. Irina Volkova: It's the part of this job I'm still proud of.
-> hub

=== paperwork_topic ===
#speaker:irina_volkova
~ asked_paperwork = true
~ irina_trust += 10
#influence_increased
~ irina_suspicious = false

Dr. Irina Volkova: Now that's a supervisor's question.

Dr. Irina Volkova: Every flagged transaction comes to me personally. I review it, I decide, I sign it off. That part I do by the book.
-> hub

// ===========================================
// BADGE (lend or clone)
// ===========================================

=== discuss_badges ===
#speaker:irina_volkova
~ badge_discussion = true

Dr. Irina Volkova: Badges. Trading floor for staff, this one for my office, executive badges for the top floor.

Dr. Irina Volkova: *taps the lanyard at her collar* Four years round my neck. The badges are the one part of our security I'd defend.

Dr. Irina Volkova: Satoshi is paranoid about doors and careless about passwords. Exactly backwards.
-> hub

=== badge_followup ===
#speaker:irina_volkova
{irina_trust >= 25:
    ~ irina_trust += 5
    #influence_increased
    ~ badge_handed = true
    #give_item:keycard:cto_access_badge
    Dr. Irina Volkova: *unclips it* Bring it back. And don't tell facilities I handed it over, they'll write a memo about it.

    Dr. Irina Volkova: West door. Try not to judge the whiteboard.
    -> hub
- else:
    Dr. Irina Volkova: My badge stays on my neck for a visitor I met an hour ago. Nothing personal.

    Narrator: Her lanyard hangs open at her collar, well within a cloner's range.
    -> hub
}

// ===========================================
// CLONE THE BADGE (start-kit cloner; m05 clone shape)
// ===========================================
// Narration, the tag on a throwaway line (the RFID minigame takes over), then
// a debrief that reads the synced global. A cancelled clone leaves
// irina_badge_cloned false, so the hub option comes back as the retry.

=== clone_badge ===
#speaker:narrator
Narrator: You keep her talking about lattices and bring the cloner in your pocket within range of her lanyard.
#clone_keycard:cto_badge
Narrator: She keeps talking.
-> clone_debrief

=== clone_debrief ===
{irina_badge_cloned:
    #speaker:narrator
    Narrator: One pass, EM4100, a clean copy. She never noticed.
    #speaker:irina_volkova
    Dr. Irina Volkova: ...anyway. You didn't come here for a lecture on elliptic curves.
- else:
    #speaker:narrator
    Narrator: The cloner didn't get a clean read.
}
-> hub

// ===========================================
// THE SPARE EXECUTIVE BADGE (P9)
// ===========================================
// Offered from the hub and from after_choice once the fund is found. She
// hands it over whatever her trust; a detained Irina doesn't look up.

=== exec_badge_handover ===
~ exec_badge_turn = TURNS()
{irina_arrested:
    #speaker:narrator
    #give_item:keycard:executive_access_badge
    Narrator: The spare executive badge is in her top drawer, under a reader-install manual. You take it.
    -> after_choice
}
{not shown_architects_fund:
    ~ shown_architects_fund = true
    #speaker:narrator
    Narrator: You put the fund allocation in front of her. She reads the per-cell lines, then the casualty line, then the signature.
    #speaker:irina_volkova
    Dr. Irina Volkova: Satoshi's Ghost. He signs the money with that name. He thinks it's funny.
}
#give_item:keycard:executive_access_badge
Dr. Irina Volkova: I put the readers in on his floor. Facilities lent me a spare to do it and never asked for it back. Here.
Dr. Irina Volkova: His wing is east of the data centre. He'll be at his desk; he always is.
{irina_fate_decided:
    -> after_choice
}
-> hub

// ===========================================
// SHOW THE EVIDENCE
// ===========================================

=== show_blockchain_evidence ===
#speaker:narrator
~ shown_casualties = true
Narrator: You lay Priya's write-up on her desk. Money in from the cells, money back out, all of it through the mixer she wrote.

#speaker:irina_volkova
Dr. Irina Volkova: Where did you get our internal analysis?

+ [You flagged these transactions yourself. You already knew.]
    Dr. Irina Volkova: I flagged them because they were wrong. Not because I knew what they paid for.
    -> evidence_pivot
+ [Never mind where. Read what it pays for.]
    -> evidence_pivot

=== evidence_pivot ===
#speaker:irina_volkova
{found_architects_fund:
    Narrator: You put the fund allocation beside it, open at the casualty projection.
    ~ shown_architects_fund = true
    ~ irina_trust += 15
    #influence_increased
    Dr. Irina Volkova: They costed the deaths. They put a number in a cell and moved on.

    Dr. Irina Volkova: I told myself this was about privacy. Financial freedom. Not... this.
- else:
    ~ irina_trust += 15
    #influence_increased
    Dr. Irina Volkova: RansomInc. That's the hospital money, pooled. It went through my mixer.
    Dr. Irina Volkova: I told myself it was about privacy. I am finding that harder to say out loud than I used to.
}
~ moral_conflict_revealed = true
-> reveal_identity

// ===========================================
// REVEAL IDENTITY + RECRUITMENT
// ===========================================

=== reveal_identity ===
#speaker:irina_volkova
~ recruitment_offered = true
Narrator: You put your SAFETYNET credentials on the desk.

Dr. Irina Volkova: My work. Used to kill people.

+ [You built it believing in it. They turned it. Help us take it apart.]
    ~ irina_trust += 10
    #influence_increased
    -> recruitment_decision
+ [You're in this to your neck. The honest way out is helping us end it.]
    ~ irina_trust += 5
    #influence_increased
    -> recruitment_decision
+ [Dr Volkova, I'm detaining you. The police will take it from here.]
    -> detain_irina

=== recruitment_decision ===
#speaker:irina_volkova
{irina_trust >= 35:
    -> recruit_accept
- else:
    Dr. Irina Volkova: I won't turn on Satoshi on the strength of one conversation and a graph.

    Dr. Irina Volkova: Financial privacy is a right. If people abuse it, that is on them.

    + [Then you're complicit. You're detained until the police arrive.]
        ~ recruitment_refused = true
        -> detain_irina
    // PASS 3 P10: what she wrote in her own office is leverage.
    + {read_irina_notes} [You wrote "What have I become?" I read it in your office.]
        -> notes_leverage
    // Review minor 1: a real alternative. Giving her time can turn her.
    + {not given_time} [Think about it. I'll come back before anyone else does.]
        ~ given_time = true
        ~ irina_trust += 10
        #influence_increased
        Dr. Irina Volkova: You're giving me time. Nobody in this building has ever done that.
        ~ hub_quiet = true
        #exit_conversation
        -> hub
}

=== notes_leverage ===
#speaker:irina_volkova
Dr. Irina Volkova: You were in my office.
Dr. Irina Volkova: ...Yes. I wrote it, and then I went back to work, because he pays well and it was easier.
Dr. Irina Volkova: I don't want to write it again.
~ irina_trust += 15
#influence_increased
-> recruit_accept

=== recruit_accept ===
#speaker:irina_volkova
Dr. Irina Volkova: ...Then I'll help you. On one condition: what I give you tonight gets used. Not buried.

Narrator: You give her your word.

~ irina_recruited = true
~ irina_fate_decided = true
#set_variable:irina_recruited=true
#set_variable:irina_fate_decided=true
{not found_architects_fund:
    Dr. Irina Volkova: His wallet is one of our cold slots. Not 6120; that's the one he shows auditors.
    Dr. Irina Volkova: And my pool holds everything six hours. Anything that landed sooner isn't his.
}
{not architect_identity_found:
    Dr. Irina Volkova: His safe is 2140. The year the last bitcoin is mined. He told me once, as if it were clever.
Dr. Irina Volkova: Whatever he keeps on The Architect is in there.
}
Dr. Irina Volkova: The pool keys and the wallet map go to your handler tonight, and the name on the account that pays me.

Dr. Irina Volkova: And {player_name}? Thank you for treating this as a choice.
~ hub_quiet = true
#exit_conversation
-> after_choice

// ===========================================
// DETAIN
// ===========================================

=== detain_irina ===
#speaker:irina_volkova
~ irina_arrested = true
~ irina_fate_decided = true
#set_variable:irina_arrested=true
#set_variable:irina_fate_decided=true

{moral_conflict_revealed:
    Dr. Irina Volkova: *offers her wrists* I really did think I was building something good.
- else:
    Dr. Irina Volkova: This is the state overreach we warned people about.
}

Dr. Irina Volkova: All those papers. For this.
~ hub_quiet = true
#exit_conversation
-> after_choice

// ===========================================
// SLOT CHECK (round 2, M3): she confirms, she doesn't solve
// ===========================================

=== slot_check ===
#speaker:irina_volkova
Dr. Irina Volkova: Which one?
+ [2207.]
    -> slot_wrong
+ [3815.]
    -> slot_wrong
+ [4471.]
    -> slot_right
+ [5093.]
    -> slot_wrong
+ [6120.]
    Dr. Irina Volkova: I told you. That's the one he shows auditors.
    -> after_choice
+ [8846.]
    -> slot_wrong
+ [Let me look again.]
    -> after_choice

=== slot_wrong ===
#speaker:irina_volkova
Dr. Irina Volkova: No. Take my cut off each deposit, then check the times against my hold.
-> after_choice

=== slot_right ===
#speaker:irina_volkova
#set_variable:irina_confirmed_slot=true
Dr. Irina Volkova: Yes. Every deposit I cleared ended up there.
-> after_choice

// ===========================================
// AFTER HER FATE IS SETTLED (re-entry, lesson 21)
// ===========================================

=== after_choice ===
#speaker:irina_volkova
{ hub_quiet:
    ~ hub_quiet = false
- else:
    {irina_recruited:
        Dr. Irina Volkova: What else do you need?
    - else:
        Narrator: She sits very still at her desk, waiting for the police, and doesn't look up.
    }
}
+ {found_architects_fund and not irina_exec_badge_given and TURNS() > exec_badge_turn} [Satoshi's wing. You've a badge for it.]
    -> exec_badge_handover
+ {irina_recruited and not found_architects_fund and read_settlement_log} [I've read the settlement log. Check a slot for me.]
    -> slot_check
+ [Nothing. Carry on.]
    {irina_recruited:
        Dr. Irina Volkova: Then be careful up there.
    - else:
        Narrator: She doesn't answer.
    }
    ~ hub_quiet = true
    #exit_conversation
    -> after_choice
