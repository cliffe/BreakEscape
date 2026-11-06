// ================================================
// Mission 1: First Contact - Sarah Martinez (Receptionist)
// Act 2: In-Person NPC
// Entry point, provides visitor badge and basic intel
// ================================================

VAR influence = 0
VAR met_sarah = false
VAR has_badge = false
VAR asked_about_derek = false
VAR asked_about_office = false
VAR asked_about_kevin = false

// ================================================
// START: FIRST MEETING
// ================================================

=== start ===
{not met_sarah:
    ~ met_sarah = true
    ~ influence += 2
    Sarah: Hi! You must be the IT contractor. I'm Sarah, the receptionist.
    Sarah: Let me get you checked in.
    -> first_checkin
}
{met_sarah:
    Sarah: Hey, need anything else?
    -> hub
}

// ================================================
// FIRST CHECK-IN
// ================================================

=== first_checkin ===
+ [Thanks. I'm here to audit your network security]
    ~ influence += 1
    Sarah: Oh good! Kevin mentioned you'd be coming.
    Sarah: Let me print your visitor badge.
    -> receive_badge
+ [Just point me to IT and I'll get started]
    Sarah: Sure thing. Let me get your badge first.
    -> receive_badge

// ================================================
// RECEIVE BADGE
// ================================================

=== receive_badge ===
~ has_badge = true
#give_item:visitor_badge
#complete_task:meet_reception

Sarah: Here you go. This gets you into public areas.

Sarah: Restricted areas need keycard access or you'll need to ask Kevin.

-> hub

// ================================================
// CONVERSATION HUB
// ================================================

=== hub ===
+ {not asked_about_kevin} [Where can I find Kevin?]
    -> ask_kevin_location
+ {not asked_about_office} [Can you tell me about the office layout?]
    -> ask_office_layout
+ {not asked_about_derek and influence >= 3} [Anyone working late I should know about?]
    -> ask_late_workers
+ [Thanks, I'll get started]
    #exit_conversation
    Sarah: Good luck with the audit!
    -> hub

// ================================================
// ASK ABOUT KEVIN
// ================================================

=== ask_kevin_location ===
~ asked_about_kevin = true
~ influence += 1

Sarah: Kevin's desk is in the main office area—can't miss it. Covered in monitors and coffee cups.

Sarah: He's usually there this time of day.

+ [What's he like?]
    -> kevin_personality
+ [Thanks]
    -> hub

=== kevin_personality ===
~ influence += 1

Sarah: Super helpful, kind of overworked. The company relies on him way too much.

Sarah: He'll appreciate having someone competent help out.

-> hub

// ================================================
// ASK ABOUT OFFICE
// ================================================

=== ask_office_layout ===
~ asked_about_office = true
~ influence += 1

Sarah: Main office is through there—hot-desking setup. Conference room on the west side, break room to the east.

Sarah: Server room is behind main office, but you'll need Kevin's access for that.

+ [What about executive offices?]
    -> ask_executive_offices
+ [Got it, thanks]
    -> hub

=== ask_executive_offices ===
~ influence += 1

Sarah: Derek's office is off the main area—he's our Senior Marketing Manager. Usually locks his door when he's out.

Sarah: Most people just have desk space, but Derek got an office because of client confidentiality stuff.

-> hub

// ================================================
// ASK ABOUT LATE WORKERS
// ================================================

=== ask_late_workers ===
~ asked_about_derek = true
~ influence += 1

Sarah: Derek's usually here late. Like, really late. Sometimes I leave at 6 and he's still working.

Sarah: He says it's because of client timezones, but...

+ [But what?]
    -> derek_suspicion
+ [Dedication, I guess]
    -> hub

=== derek_suspicion ===
~ influence += 2

Sarah: I don't know. It just seems weird, you know? He's marketing, not IT.

Sarah: And I've seen him in the server room a couple times. Told me he was checking on campaign servers.

+ [That does seem odd]
    ~ influence += 1
    Sarah: Right? But I'm just the receptionist. What do I know?
    -> hub
+ [Maybe he's just thorough]
    Sarah: Maybe. Anyway, Kevin would know more about the technical stuff.
    -> hub
