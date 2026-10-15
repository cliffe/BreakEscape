// ================================================
// Mission 1: First Contact - Kevin Park (IT Manager)
// Located in IT Room (PIN locked)
// Provides lockpicks, server keycard, and password hints
// ================================================

VAR influence = 0
VAR met_kevin = false
VAR discussed_audit = false
VAR asked_about_derek = false
VAR asked_about_passwords = false
VAR given_lockpick = false
VAR given_keycard = false
VAR given_password_hints = false
VAR warned_about_derek = false

// Global variables synced from scenario
VAR framing_evidence_seen = false
VAR kevin_choice = ""
VAR kevin_protected = false
VAR kevin_accused = false
VAR contingency_file_read = false
// kevin_warned is tracked via kevin_choice == "warn"

// Security Audit Variables
VAR security_audit_given = false
VAR audit_questions_asked = 0
VAR audit_correct_answers = 0
VAR audit_wrong_answers = 0

// ================================================
// START: FIRST MEETING
// ================================================

=== start ===
#set_variable:talked_to_kevin=true
#complete_task:meet_kevin
{not met_kevin:
    ~ met_kevin = true
    Kevin Park: Oh hey! You found the IT room. I'm Kevin—IT manager, sole IT department, and professional worrier.
    Kevin Park: You're the security auditor, right? Thank god you're here.
    Kevin Park: I've been telling them we need a review for months.
    -> first_meeting
}
{met_kevin:
    Kevin Park: Hey, what's up? Found anything interesting yet?
    -> hub
}

// ================================================
// FIRST MEETING
// ================================================

=== first_meeting ===
#complete_task:meet_kevin
+ [Happy to help. What's the security situation?]
    ~ influence += 2
    ~ discussed_audit = true
    # influence_increased
    -> security_situation
+ [I'll need access to secure areas for testing]
    ~ discussed_audit = true
    -> access_discussion
+ [You seem stressed]
    ~ influence += 1
    ~ discussed_audit = true
    # influence_increased
    -> kevin_stress

// ================================================
// SECURITY SITUATION
// ================================================

=== security_situation ===
Kevin Park: Honestly? I'm worried.

Kevin Park: Someone's been accessing the server room without authorization. Late at night. Multiple times.

Kevin Park: I flagged it to management three times. Nothing happened.

+ [Who do you think it is?]
    ~ warned_about_derek = true
    ~ influence += 1
    # influence_increased
    -> derek_suspicion
+ [That's what I'm here to investigate]
    Kevin Park: Good. Because I'm starting to feel like I'm the only one who cares about security around here.
    -> offer_tools

// ================================================
// DEREK SUSPICION
// ================================================

=== derek_suspicion ===
Kevin Park: *lowers voice* I think it's Derek Lawson. Senior Marketing Manager.

Kevin Park: The access logs show his credentials being used at 2 AM. But he says it's for "campaign servers."

Kevin Park: We don't have campaign servers in that room. It's all internal infrastructure.

Kevin Park: The last person who raised concerns about Derek was Patricia—our manager. She got fired.

+ [I'll look into it]
    ~ influence += 2
    # influence_increased
    Kevin Park: Please do. But be careful. Derek has friends in high places.
    Kevin Park: Here, let me give you some tools that might help.
    -> offer_tools
+ [Could be someone spoofing his credentials]
    Kevin Park: Maybe. But I don't think so. I've seen him leaving the office at weird hours.
    -> offer_tools

// ================================================
// ACCESS DISCUSSION
// ================================================

=== access_discussion ===
Kevin Park: Right, you'll need access to secure areas.

Kevin Park: I've got a keycard for the server room. It's on the south side of the IT room.

Kevin Park: And for physical security testing, I've got something special.

-> offer_tools

// ================================================
// KEVIN STRESS
// ================================================

=== kevin_stress ===
Kevin Park: Yeah, it's been a rough few months.

Kevin Park: Ever since Patricia got fired, things have felt... off.

Kevin Park: She was investigating something. Asking questions about Derek's projects.

Kevin Park: Now she's gone and nobody will tell me why.

+ [What was she investigating?]
    ~ warned_about_derek = true
    Kevin Park: I don't know exactly. Something about Derek's "external partners."
    Kevin Park: She kept her notes in her office safe. I think her briefcase is still in there too.
    -> offer_tools
+ [Let's focus on the audit]
    Kevin Park: Right. Sorry. Let me get you set up.
    -> offer_tools

// ================================================
// OFFER TOOLS
// ================================================

=== offer_tools ===
Kevin Park: Okay, so for the audit I can give you a lockpick set. I bought it for when people lock themselves out, but it's useful for testing physical security.

Kevin Park: Also, here's my server room keycard. You'll need it to access the main servers.

Kevin Park: I've set up a Kali Linux workstation in there for you—use it for the technical side of the audit.

+ [I'll take all of it]
    ~ given_lockpick = true
    ~ given_keycard = true
    ~ given_password_hints = true
    #give_item:lockpick
    #give_item:keycard
    #give_item:notes
    Kevin Park: Here you go. The lockpicks work on most of the older locks around here.
    Kevin Park: Just... be careful, okay? Something's not right here.
    -> hub
+ [Just the keycard for now]
    ~ given_keycard = true
    #give_item:keycard
    Kevin Park: Sure. Let me know if you need anything else.
    -> hub

// ================================================
// CONVERSATION HUB
// ================================================

=== hub ===
+ {framing_evidence_seen and kevin_choice == ""} [I have evidence that implicates you in the breach. Explain yourself.]
    -> evidence_confrontation
+ {contingency_file_read and kevin_choice == ""} [I need to tell you something about Derek]
    -> warn_kevin_direct
+ {not security_audit_given and (given_lockpick or given_keycard)} [I'd like to give you a preliminary security audit update]
    -> security_audit_start
+ {not given_lockpick} [About those lockpicks...]
    -> get_lockpicks
+ {not given_keycard} [I need the server room keycard]
    -> get_keycard
+ {not asked_about_passwords and influence >= 2} [Tell me about password security here]
    -> ask_passwords
+ {not asked_about_derek and influence >= 3} [What else can you tell me about Derek?]
    -> ask_about_derek
+ [I'll keep investigating. Thanks for the help.]
    #exit_conversation
    Kevin Park: No problem. And seriously—if you find anything, let me know. I need to know I'm not going crazy.
    -> hub

// ================================================
// GET LOCKPICKS
// ================================================

=== get_lockpicks ===
~ given_lockpick = true
#give_item:lockpick

Kevin Park: Here's the lockpick set. It's professional grade.

Kevin Park: Most of the older locks in the building are vulnerable. Good for testing security.

-> hub

// ================================================
// GET KEYCARD
// ================================================

=== get_keycard ===
~ given_keycard = true
#give_item:keycard

Kevin Park: Here's my server room keycard.

Kevin Park: The servers hold everything. If there's evidence of unauthorized activity, that's where you'll find it.

-> hub

// ================================================
// WARN KEVIN - Direct warning after finding CONTINGENCY file
// Triggered by contingency_file_read = true (global var from scenario)
// ================================================

=== warn_kevin_direct ===
Kevin Park: You found something. I can tell.

Kevin Park: Is it about the name-filing thing? Because I've been trying to figure out who's been submitting reports in my name and—

+ [Kevin. Stop. Derek is planning to frame you for the entire breach.]
    -> warn_kevin_details
+ [Actually, it's nothing. Never mind.]
    Kevin Park: ...Okay. If you say so. I'll be here if you change your mind.
    -> hub

=== warn_kevin_details ===
Kevin Park: Say that again.

Player: I found a contingency plan in Derek's files. Fake logs, forged emails — all pointing to you. If this investigation closes in on him, he activates it. You get arrested. He walks.

Kevin Park: *quietly* Patricia.

Kevin Park: That's why she was fired. She got too close to Derek and he neutralised her. And now he's got a ready-made scapegoat if someone else gets too close.

Kevin Park: *looks up* How do I... what do I do? I have two kids. I can't—

+ [Act normal. We handle Derek. You won't be touched.]
    #set_variable:kevin_choice=warn
    #set_variable:kevin_protected=true
    Kevin Park: Act normal. Okay. I can do that.
    Kevin Park: You're not just an auditor, are you.
    Kevin Park: Don't answer that. I think I'm better off not knowing.
    Kevin Park: Just... thank you. Genuinely.
    #exit_conversation
    -> hub
+ [Document everything you know about Derek. Timestamp it. Send it somewhere safe.]
    #set_variable:kevin_choice=warn
    #set_variable:kevin_protected=true
    Kevin Park: Right. Yes. A paper trail they can't dismiss.
    Kevin Park: I'll send a copy to my personal email and a solicitor. If anything happens to me, there's a record.
    Kevin Park: I don't know who you are or why you're really here — but whatever you're doing, it's the right thing.
    #exit_conversation
    -> hub

// ================================================
// ASK ABOUT PASSWORDS
// ================================================

=== ask_passwords ===
~ asked_about_passwords = true
~ given_password_hints = true
~ influence += 1
# influence_increased

Kevin Park: Password security here is... not great.

Kevin Park: Company name plus numbers. Birthdays. Anniversary dates.

Kevin Park: Derek uses his birthday or anniversary in everything. Makes his passwords easy to guess.

-> hub

// ================================================
// ASK ABOUT DEREK
// ================================================

=== ask_about_derek ===
~ asked_about_derek = true

Kevin Park: Derek's been here about 18 months. Senior Marketing Manager.

Kevin Park: At first he seemed normal. Then he started requesting "enhanced privacy" for his systems.

Kevin Park: Wanted separate network segments, encrypted communications, locked office at all times.

Kevin Park: Said it was for "client confidentiality" but... marketing doesn't need that level of security.

+ [What do you think he's really doing?]
    Kevin Park: I don't know. But whatever it is, it's not marketing.
    Kevin Park: He's been meeting with external people—calls them "partners."
    ~ influence += 2
    # influence_increased
    -> hub
+ [Maybe he's just paranoid]
    Kevin Park: Maybe. But Patricia didn't think so. And now she's gone.
    -> hub

// ================================================
// SECURITY AUDIT - MCQ Assessment
// ================================================

=== security_audit_start ===
~ security_audit_given = true
#set_variable:security_audit_completed=true

Kevin Park: Oh! Yeah, I'd love to hear what you've found so far.

Kevin Park: I mean, you're the professional. What's your assessment of our security posture?

Player: I've been observing and testing. Let me give you some preliminary findings.

Kevin Park: Please, go ahead. I need to know if I'm overreacting or if we really do have problems.

-> audit_question_1

// ================================================
// AUDIT QUESTION 1: Physical Security
// ================================================

=== audit_question_1 ===
~ audit_questions_asked += 1

Player: First, let's talk about physical security. What would you say is the most significant concern?

+ [The building's physical access controls are adequate for a company this size]
    ~ audit_wrong_answers += 1
    Kevin Park: Really? I was worried about those old door locks...
    Kevin Park: But I guess if you think they're adequate, maybe I'm being paranoid.
    -> audit_question_2
+ [The old mechanical locks and that PIN pad on the IT room are easily bypassed]
    ~ audit_correct_answers += 1
    ~ influence += 1
    # influence_increased
    Kevin Park: Yes! That's exactly what I've been saying!
    Kevin Park: I requested modern electronic locks six months ago. Budget was "under review."
    Kevin Park: Anyone with basic lockpicking skills could get into most rooms here.
    -> audit_question_2
+ [Physical security isn't really a priority compared to digital security]
    ~ audit_wrong_answers += 1
    Kevin Park: Hmm. I thought physical access was important, but you're the expert.
    Kevin Park: I guess I should focus more on the digital side then.
    -> audit_question_2

// ================================================
// AUDIT QUESTION 2: Access Control
// ================================================

=== audit_question_2 ===
~ audit_questions_asked += 1

Player: Second question—I've been reviewing the access logs. What concerns you most about the patterns?

+ [Everything looks normal. Standard office hours access mostly]
    ~ audit_wrong_answers += 1
    Kevin Park: But... what about those 2 AM logins to the server room?
    Kevin Park: Maybe I'm reading too much into it.
    -> audit_question_3
+ [Derek's credentials being used for server room access at 2 AM is a red flag]
    ~ audit_correct_answers += 1
    ~ influence += 1
    # influence_increased
    Kevin Park: Thank you! I knew I wasn't crazy!
    Kevin Park: Management keeps telling me he's just "dedicated" and "works odd hours."
    Kevin Park: But we don't have anything in that server room that marketing should be accessing at all.
    -> audit_question_3
+ [The access logs seem fine, but you should implement better monitoring]
    ~ audit_wrong_answers += 1
    Kevin Park: I thought the current logs were already showing problems...
    Kevin Park: But yeah, better monitoring couldn't hurt.
    -> audit_question_3

// ================================================
// AUDIT QUESTION 3: Password Security
// ================================================

=== audit_question_3 ===
~ audit_questions_asked += 1

Player: Third—password security. What's your assessment of the biggest vulnerability?

+ [Your password complexity requirements are sufficient]
    ~ audit_wrong_answers += 1
    Kevin Park: I guess the requirements are technically there...
    Kevin Park: I just worry people are finding predictable ways around them.
    -> audit_question_4
+ [Staff are using predictable patterns—birthdays, company name plus numbers]
    ~ audit_correct_answers += 1
    ~ influence += 1
    # influence_increased
    Kevin Park: Exactly! I see it all the time in password reset requests.
    Kevin Park: "Viral2023" "Viral2024" - I've warned people but they keep doing it.
    Kevin Park: And Derek... well, you've probably figured out his pattern by now.
    -> audit_question_4
+ [Passwords aren't the real issue—focus on multi-factor authentication instead]
    ~ audit_wrong_answers += 1
    Kevin Park: We don't have MFA yet—budget constraints.
    Kevin Park: So I'm stuck with just passwords for now. Wish we could implement MFA.
    -> audit_question_4

// ================================================
// AUDIT QUESTION 4: Personnel Security
// ================================================

=== audit_question_4 ===
~ audit_questions_asked += 1

Player: Fourth—personnel security. What's the biggest red flag you see?

+ [The staff seem trustworthy. No major concerns]
    ~ audit_wrong_answers += 1
    Kevin Park: I want to believe that, I really do.
    Kevin Park: But Patricia's firing still bothers me.
    -> audit_question_5
+ [A manager investigating security concerns was suddenly fired—that's suspicious]
    ~ audit_correct_answers += 1
    ~ influence += 2
    # influence_increased
    Kevin Park: Right?! That's what worries me most!
    Kevin Park: Patricia was asking the right questions. Then she was gone.
    Kevin Park: And nobody will tell me why. Just "performance issues."
    Kevin Park: It sends a message: don't ask questions about Derek.
    -> audit_question_5
+ [You need better background checks and security clearances]
    ~ audit_wrong_answers += 1
    Kevin Park: I mean, we do background checks for sensitive positions...
    Kevin Park: But yeah, we could probably do better.
    -> audit_question_5

// ================================================
// AUDIT QUESTION 5: Data Protection
// ================================================

=== audit_question_5 ===
~ audit_questions_asked += 1

Player: Finally—data protection practices. What concerns you about how sensitive data is handled here?

+ [Standard security practices seem to be followed adequately]
    ~ audit_wrong_answers += 1
    Kevin Park: I suppose most people follow the basics...
    Kevin Park: Though Derek's setup still seems excessive to me.
    -> audit_complete
+ [Derek's encrypted comms and separate network segments lack business justification]
    ~ audit_correct_answers += 1
    ~ influence += 2
    # influence_increased

    Kevin Park: Yes! That's exactly it!
    Kevin Park: Marketing doesn't need that level of segmentation. We're not handling credit cards or medical records.
    Kevin Park: He claims it's for "client confidentiality" but I've never seen documentation justifying the architecture.
    Kevin Park: It looks less like security and more like... hiding something.
    -> audit_complete
+ [You need better encryption across the board]
    ~ audit_wrong_answers += 1
    Kevin Park: We have encryption where we need it...
    Kevin Park: Though I guess more couldn't hurt?
    -> audit_complete

// ================================================
// AUDIT COMPLETE - Kevin's Response
// ================================================

=== audit_complete ===

Kevin Park: Thank you. Seriously, thank you for taking the time to go through this with me.

{audit_correct_answers >= 4:
    Kevin Park: You really understand what's happening here. Everything you've flagged matches my concerns exactly.
    Kevin Park: It's such a relief to have a professional validate what I've been seeing.
    Kevin Park: I've felt like I'm going crazy, or being paranoid. But you see it too.
    ~ influence += 3
    # influence_increased
}
{audit_correct_answers == 3:
    Kevin Park: You've identified some key issues. A few things we see differently, but overall you're confirming my main worries.
    Kevin Park: At least I know I'm not completely off base with my concerns.
    ~ influence += 2
    # influence_increased
}
{audit_correct_answers <= 2:
    Kevin Park: I appreciate the feedback, even if we see some things differently.
    Kevin Park: Maybe I am being too paranoid about some of this stuff.
    Kevin Park: But... I still can't shake the feeling something's wrong here.
    ~ influence += 1
    # influence_increased
}

Kevin Park: I'm going to document your findings in my incident log.

Kevin Park: If management won't listen to me, maybe they'll listen to the security auditor.

Kevin Park: Keep investigating. And please—if you find anything concrete, tell me immediately.

-> hub

// ================================================
// EVIDENCE CONFRONTATION - Triggered by framing_evidence_seen = true
// Player has found planted evidence + contingency files, comes back to Kevin
// ================================================

=== evidence_confrontation ===
~ met_kevin = true
~ framing_evidence_seen = false

Kevin Park: You're back. Something's wrong — I can see it on your face. What did you find?

Kevin Park: Someone used my credentials remotely. That's exactly the kind of thing I've been reporting.

Kevin Park: *voice breaks slightly* Patricia figured it out. That's why he had her fired. And if I'd kept pushing... that would have been me next.

Kevin Park: What happens now? Am I... is Derek going to get away with it?

+ {contingency_file_read} [He's not. We have his contingency files. He documented his own frame-up plan.]
    -> evidence_exonerated
+ {not contingency_file_read} [Something's not right. I'll keep investigating.]
    Kevin Park: Please — if you find anything that clears me, tell me immediately. I'm not the one who did this.
    #exit_conversation
    -> hub
+ [The evidence on file points to you, Kevin. I have to report what I found.]
    -> wrongly_accused_warning
+ [I'm not here to discuss it. This conversation is over.]
    Kevin Park: What? No — please. I can prove it. The header on that email, the simultaneous session flag—
    ~ framing_evidence_seen = false
    #exit_conversation
    -> hub
+ [You are ENTROPY! Time for you to pay!]
    #hostile:kevin_park
    Kevin Park: *Angry and confused* I don't even know what that means!
    #exit_conversation
    -> hub

// ================================================
// EXONERATED - Player believes Kevin / reveals the truth
// ================================================

=== evidence_exonerated ===
Kevin Park: He documented it? He actually wrote down what he was planning to do to me?

Kevin Park: *exhales slowly* That's... that's both terrifying and the best news I've heard in months.

Kevin Park: So what do I do? Do I just go back to my desk and pretend everything's normal?

+ [Yes. Act normal. Let us handle Derek.]
    #set_variable:kevin_choice=warn
    #set_variable:kevin_protected=true
    Kevin Park: Okay. Yeah. I can do that.
    Kevin Park: Can I ask — who are you, really? You're not just a security auditor, are you.
    Kevin Park: Actually, don't answer that. I think I'm better off not knowing.
    Kevin Park: Just... thank you. I thought I was going to be the next Patricia.
    #exit_conversation
    -> hub
+ [Leave the contingency files visible. Investigators will find the evidence themselves.]
    #set_variable:kevin_choice=evidence
    #set_variable:kevin_protected=true
    Kevin Park: So I'll be protected without even knowing how. I can work with that.
    Kevin Park: The forged email header alone should be enough for anyone paying attention.
    Kevin Park: Keep your cover. I'll keep mine. Good luck with whatever you're really doing here.
    #exit_conversation
    -> hub

// ================================================
// WRONGLY ACCUSED WARNING - Player chooses to report Kevin anyway
// Kevin makes a final plea; player can still back down or commit
// ================================================

=== wrongly_accused_warning ===
#set_variable:kevin_accused=true
Kevin Park: The report has a "HEADER MISMATCH DETECTED" flag. That's not me questioning it — that's the mail server's own forensic system flagging a forgery.

Kevin Park: And the anomaly report itself says my workstation was active at the same time the server room was being accessed. That means two sessions running simultaneously. That means someone else was using my credentials.

Kevin Park: You're a security professional. You know what those flags mean.

Kevin Park: *voice breaks* Please. I have two kids. I've been trying to do the right thing here for months.

+ [The inconsistencies are there. I believe you. Tell me about Derek.]
    -> evidence_exonerated
+ [The totality of evidence is too strong. I'm calling this in, Kevin.]
    #set_variable:kevin_choice=wrongly_accused
    Kevin Park: I understand you have a job to do. I just hope whoever reviews this actually reads the forensic notes.
    Kevin Park: For what it's worth — I hope you find whatever you're really looking for here.
    #exit_conversation
    -> hub
+ [You are ENTROPY! Time for you to pay!]
    #hostile
    Kevin Park: *Angry and confused* I don't even know what that means!
    #exit_conversation
    -> hub
