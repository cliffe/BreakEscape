// ================================================
// Mission 1: First Contact - Maya Chen (Office Worker)
// Act 2: In-Person NPC (Optional)
// Provides office gossip and Derek intelligence
// ================================================

VAR influence = 0
VAR met_maya = false
VAR asked_about_derek = false
VAR asked_about_office = false
VAR asked_about_late_nights = false

// ================================================
// START: FIRST MEETING
// ================================================

=== start ===
{not met_maya:
    ~ met_maya = true
    ~ influence += 1
    Maya: Oh, hi! You're the IT auditor, right? I'm Maya.
    Maya: Taking a coffee break. This job is way too stressful sometimes.
    -> first_meeting
}
{met_maya:
    Maya: Hey again. Need anything?
    -> hub
}

// ================================================
// FIRST MEETING
// ================================================

=== first_meeting ===
+ [Nice to meet you. What do you do here?]
    ~ influence += 1
    Maya: Marketing coordinator. Basically, I make sure campaigns run on schedule.
    Maya: Which means a lot of late nights when Derek decides to change everything last minute.
    -> hub
+ [Stressful how?]
    Maya: Oh, just the usual. Tight deadlines, demanding clients, coworkers who work weird hours.
    -> hub

// ================================================
// CONVERSATION HUB
// ================================================

=== hub ===
+ {not asked_about_office} [What's the office culture like here?]
    -> ask_office_culture
+ {not asked_about_derek} [You mentioned someone named Derek?]
    -> ask_about_derek
+ {asked_about_derek and not asked_about_late_nights} [Tell me more about Derek's late nights]
    -> ask_late_nights
+ [I should get back to work]
    #exit_conversation
    Maya: Sure, good luck with the audit!
    -> hub

// ================================================
// ASK ABOUT OFFICE CULTURE
// ================================================

=== ask_office_culture ===
~ asked_about_office = true
~ influence += 1

Maya: It's pretty casual. Most people are friendly, collaborative.

Maya: Except for the few who treat this place like it's CIA headquarters. Locked offices, private meetings, "need to know" attitudes.

+ [Who's like that?]
    ~ influence += 1
    -> secretive_people
+ [That's interesting]
    -> hub

=== secretive_people ===
Maya: Mainly Derek. He's all about "client confidentiality" and "strategic advantage."

Maya: I get it—marketing is competitive. But sometimes it feels excessive.

-> hub

// ================================================
// ASK ABOUT DEREK
// ================================================

=== ask_about_derek ===
~ asked_about_derek = true
~ influence += 1

Maya: Derek Lawson. Senior Marketing Manager. My direct supervisor.

Maya: Smart guy, good at his job. But he's... intense. Always working, always on his phone with "strategic partners."

+ [How long has he been here?]
    -> derek_timeline
+ [Is he good to work for?]
    -> derek_as_boss

=== derek_timeline ===
~ influence += 1

Maya: About three months. He came in and immediately started restructuring everything.

Maya: Brought in new clients, new processes, new security protocols for the marketing department.

+ [New security protocols?]
    ~ influence += 2
    #complete_task:interview_maya
    Maya: Yeah, insisted on encrypted communications, locked file servers, access controls.
    Maya: Kevin had to set up a whole separate network segment for Derek's "sensitive client data."
    -> hub
+ [Sounds like a go-getter]
    Maya: Sure. If you like your boss being in the office until midnight every night.
    -> hub

=== derek_as_boss ===
~ influence += 1

Maya: He's fine, I guess. Expects a lot, but that's not unusual.

Maya: What's weird is how secretive he is. Won't let anyone access his files or his office.

+ [That does seem excessive]
    ~ influence += 1
    -> hub
+ [Maybe he's protecting client information]
    Maya: Maybe. But we all handle client information. He's the only one with a locked office.
    -> hub

// ================================================
// ASK ABOUT LATE NIGHTS
// ================================================

=== ask_late_nights ===
~ asked_about_late_nights = true
~ influence += 2

Maya: He's here every night, super late. Says he's coordinating with clients in different time zones.

Maya: But I've walked past his office and heard him talking about things that don't sound like marketing.

+ [What kind of things?]
    -> suspicious_conversations
+ [Like what?]
    -> suspicious_conversations

=== suspicious_conversations ===
~ influence += 2

Maya: "Infrastructure targeting." "Phase 3 timeline." "Network mapping."

Maya: I figured it was some kind of new technical marketing strategy. But it sounded... I don't know, weird?

+ [That's definitely unusual]
    ~ influence += 2
    Maya: Right? I thought about asking him, but he gets defensive when you question his methods.
    Maya: Anyway, probably nothing. I watch too many spy movies.
    -> hub
+ [Probably just marketing jargon]
    Maya: Yeah, you're probably right. Still weird though.
    -> hub
