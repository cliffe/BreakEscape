// ================================================
// Mission 1: First Contact - Maya Chen (Informant)
// Located in Maya's Office
// She is the informant who contacted SAFETYNET
// ================================================

VAR influence = 0
VAR met_maya = false
VAR revealed_informant = false
VAR warned_about_derek = false
VAR discussed_operation = false
VAR asked_about_patricia = false

// ================================================
// START: FIRST MEETING
// ================================================

=== start ===
#set_variable:talked_to_maya=true
#complete_task:talk_to_maya
{not met_maya:
    ~ met_maya = true
    Maya Chen: Oh! You startled me. You're the... IT contractor, right? The security auditor?
    -> first_meeting
}
{met_maya:
    Maya Chen: *glances at door* Is it safe to talk?
    -> hub
}

// ================================================
// FIRST MEETING
// ================================================

=== first_meeting ===
+ [That's right. I'm reviewing security systems]
    Maya Chen: Are you really here for a security audit? Or are you here because of my message?
    -> reveal_check
+ [You seem nervous]
    ~ influence += 1
    # influence_increased
    Maya Chen: I have reason to be. Things aren't what they seem here.
    -> reveal_check

// ================================================
// REVEAL CHECK
// ================================================

=== reveal_check ===
+ [What message?]
    Maya Chen: The tip. To SAFETYNET. About Operation Shatter.
    Maya Chen: *pauses* If you don't know what I'm talking about, forget I said anything.
    + + [I'm from SAFETYNET]
        ~ revealed_informant = true
        ~ influence += 5
        # influence_increased
        Maya Chen: *visible relief* Thank god. I was starting to think no one would come.
        -> informant_reveal
    + + [Tell me more about this operation]
        Maya Chen: Only if you're here to stop it. People are going to die.
        -> operation_details
+ [SAFETYNET sent me]
    ~ revealed_informant = true
    ~ influence += 5
    # influence_increased
    Maya Chen: *exhales* Finally. I've been waiting for weeks.
    -> informant_reveal

// ================================================
// INFORMANT REVEAL
// ================================================

=== informant_reveal ===
Maya Chen: I'm the one who contacted you. The anonymous tip.

Maya Chen: I was hired as a content analyst. I thought we were doing marketing. Then I started seeing the target lists. The psychological profiles. The projected casualties.

Maya Chen: They're planning to kill people. On purpose. They call it "Operation Shatter."

+ [Tell me everything]
    ~ discussed_operation = true
    -> operation_details
+ [Who's behind it?]
    ~ warned_about_derek = true
    -> derek_intel

// ================================================
// OPERATION DETAILS
// ================================================

=== operation_details ===
~ discussed_operation = true
#unlock_task:inform_safetynet_operation_shatter

Maya Chen: From what I've gathered, Operation Shatter is a coordinated disinformation attack. They've profiled millions of people—demographic cohorts they're betting will panic first—cross-referenced with who reacts fastest to an alert, who forwards without checking, who trusts which channels.

Maya Chen: The plan is to send fake emergency messages—hospital closures, bank failures, government alerts—tuned per segment where they think it'll spread fastest.

Maya Chen: The panic will swamp real emergency capacity and cause deaths—delayed response, overcrowding, accidents. They've calculated it: 42 to 85 people will die in the first 24 hours.

+ [And they're okay with that?]
    Maya Chen: Derek—he's the one running it—I've overhead him call it "education."
    Maya Chen: Says the deaths will teach people not to trust digital communications. He's insane. But he believes every word.
    -> hub
+ [When does it launch?]
    Maya Chen: Sunday. 6 AM. That's when the messages go out.
    Maya Chen: You have three days to stop it.
    -> hub

// ================================================
// DEREK INTEL
// ================================================

=== derek_intel ===
~ warned_about_derek = true

Maya Chen: Derek Lawson. Senior Marketing Manager. But he's not really marketing.

Maya Chen: He's ENTROPY. Part of a cell called "Social Fabric."

Maya Chen: Derek's the operations lead. He built the target lists, wrote the fake messages, coordinated with their technical people.

+ [Where's the evidence?]
    Maya Chen: I've overheard and glimpsed so much, but haven't dared to gather physical evidence. But I'm sure it's there. Derek's sloppy. He thinks he's untouchable.
    Maya Chen: If you can get into his office, I'd start there. And the server room—that's where the real infrastructure lives.
    -> hub
+ [What about the others here?]
    Maya Chen: Kevin's innocent. He's suspicious of Derek but doesn't know the full picture.
    Maya Chen: Sarah just works reception. She doesn't know anything.
    Maya Chen: Patricia—the old manager—she figured it out. That's why they fired her.
    -> hub

// ================================================
// CONVERSATION HUB
// ================================================

=== hub ===
+ {not discussed_operation} [Tell me about Operation Shatter]
    -> operation_details
+ {not warned_about_derek} [What can you tell me about Derek?]
    -> derek_intel
+ {not asked_about_patricia} [What happened to Patricia?]
    -> patricia_story
+ {revealed_informant} [What should I do first?]
    -> tactical_advice
+ [I need to keep investigating]
    #exit_conversation
    Maya Chen: Be careful. Derek's paranoid. If he suspects you're onto him, he won't just walk away.
    -> hub

// ================================================
// PATRICIA STORY
// ================================================

=== patricia_story ===
~ asked_about_patricia = true

Maya Chen: Patricia Wells. She was our department manager.

Maya Chen: She noticed Derek's weird behavior. The late nights, the encrypted calls.

Maya Chen: She started investigating. Kept notes in her office.

Maya Chen: One day HR called her in. "Performance issues." She was gone within an hour.

Maya Chen: They didn't even let her take her briefcase. It's still in her office.

+ [What's in the briefcase?]
    Maya Chen: Her investigation notes, I think. A timeline of what she found.
    Maya Chen: I never got a good look. She kept everything locked up tight—smart, given what happened to her.
    -> hub
+ [That's suspicious timing]
    Maya Chen: Derek arranged it. I saw emails between him and HR.
    Maya Chen: Anyone who gets too close gets removed.
    -> hub

// ================================================
// TACTICAL ADVICE
// ================================================

=== tactical_advice ===
Maya Chen: Derek's office, the server room—that's where the real answers are. Figure out how to get in.

Maya Chen: Patricia was piecing this together before they got rid of her. Whatever she found might still be here somewhere.

+ [That's a lot to do]
    Maya Chen: Operation Shatter launches Sunday. We don't have much time.
    -> hub
+ [I'll get started]
    #exit_conversation
    Maya Chen: Good luck. And... thank you. For coming.
    Maya Chen: I was starting to think no one cared about stopping this.
    -> hub
