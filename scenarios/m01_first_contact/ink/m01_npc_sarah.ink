// ================================================
// Mission 1: First Contact - Sarah O'Brien (Receptionist)
// Entry point NPC - provides badge and main office key
// ================================================

VAR influence = 0
VAR met_sarah = false
VAR has_badge = false
VAR has_office_key = false
VAR asked_about_derek = false
VAR asked_about_office = false
VAR asked_about_kevin = false
VAR asked_about_manager = false

// ================================================
// START: FIRST MEETING
// ================================================

=== start ===
{not met_sarah:
    ~ met_sarah = true
    Sarah O'Brien: Hi! You must be the IT contractor. I'm Sarah, the receptionist.
    Sarah O'Brien: Let me get you checked in for the security audit.
    -> first_checkin
}
{met_sarah:
    Sarah O'Brien: Hey, need anything else?
    -> hub
}

// ================================================
// FIRST CHECK-IN
// ================================================

=== first_checkin ===
+ [Thanks. I'm here to audit your network security]
    ~ influence += 1
    # influence_increased
    Sarah O'Brien: Oh good! Kevin mentioned you'd be coming. He's been asking for a security review for months.
    -> receive_items
+ [Just point me to IT and I'll get started]
    Sarah O'Brien: Sure thing. Let me get you set up first.
    -> receive_items

// ================================================
// RECEIVE BADGE AND KEY
// ================================================

=== receive_items ===
~ has_badge = true
~ has_office_key = true
#give_item:id_badge
#give_item:key
#complete_task:check_in_reception

Sarah O'Brien: Here's your visitor badge and a key for the main office area.

Sarah O'Brien: Kevin should be in the IT room. It's through the main office, on the east side.

-> hub

// ================================================
// CONVERSATION HUB
// ================================================

=== hub ===
+ [Where exactly is the IT room?]
    -> ask_it_location
+ {not asked_about_kevin} [Tell me about Kevin]
    -> ask_kevin
+ {not asked_about_office} [What's the office layout like?]
    -> ask_office_layout
+ {not asked_about_derek and influence >= 3} [Anyone else I should know about?]
    -> ask_about_staff
+ {not asked_about_manager} [I noticed the manager's office is vacant?]
    -> ask_about_manager
+ [Thanks, I'll get started]
    #exit_conversation
    Sarah O'Brien: Good luck with the audit! Let me know if you need anything.
    -> hub

// ================================================
// ASK ABOUT IT LOCATION
// ================================================

=== ask_it_location ===
Sarah O'Brien: Go through the main office, then look for the door marked "IT" on the east wall.

Sarah O'Brien: The IT room has a keypad lock. Kevin's the one who knows the code.

Sarah O'Brien: Actually, I think there's a maintenance checklist somewhere in the main office with the codes. Kevin keeps forgetting them.

-> hub

// ================================================
// ASK ABOUT KEVIN
// ================================================

=== ask_kevin ===
~ asked_about_kevin = true
~ influence += 1
# influence_increased

Sarah O'Brien: Kevin's our IT manager. Really nice guy, kind of overworked.

Sarah O'Brien: He's been worried about security lately. Says someone's been accessing servers without authorization.

+ [Who would do that?]
    Sarah O'Brien: I don't know. He mentioned it to management but nothing happened.
    Sarah O'Brien: He seems stressed about it. Maybe you can help him figure it out.
    -> hub
+ [I'll talk to him]
    Sarah O'Brien: Good idea. He's usually in the IT room.
    -> hub

// ================================================
// ASK ABOUT OFFICE LAYOUT
// ================================================

=== ask_office_layout ===
~ asked_about_office = true

Sarah O'Brien: Main office is through that door—open plan with desks for the team.

Sarah O'Brien: Around the edges you've got: IT room on the east (where Kevin hangs out). Conference room and break room to the west. 

Sarah O'Brien: To the north are the private offices of Derek, Kevin, Maya, and the vacant manager's office

-> hub

// ================================================
// ASK ABOUT STAFF
// ================================================

=== ask_about_staff ===
~ asked_about_derek = true
~ influence += 1
# influence_increased

Sarah O'Brien: Well, there's Derek Lawson—Senior Marketing Manager. He's... intense.

Sarah O'Brien: Works late a lot. Like, really late. Sometimes I see his access logs from after midnight.

+ [That seems unusual]
    ~ influence += 1
    # influence_increased

    Sarah O'Brien: Yeah. He says it's for client calls in different time zones, but...
    Sarah O'Brien: I don't know. Something about him makes me uncomfortable.
    -> hub
+ [Some people are just dedicated]
    Sarah O'Brien: Maybe. Anyway, Maya Chen is nice. Content analyst. She's been here about a year.
    -> hub

// ================================================
// ASK ABOUT MANAGER
// ================================================

=== ask_about_manager ===
~ asked_about_manager = true
~ influence += 1
# influence_increased

Sarah O'Brien: Oh, that was Patricia's office. She was our department manager.

Sarah O'Brien: She got fired about a month ago. Really sudden. "Performance issues" they said.

+ [That sounds suspicious]
    ~ influence += 2
    # influence_increased
    Sarah O'Brien: Between us? Patricia was asking questions about Derek's projects.
    Sarah O'Brien: Next thing you know, HR calls her in and she's gone.
    Sarah O'Brien: Her briefcase is still in there. They escorted her out so fast she couldn't take everything.
    -> hub
+ [These things happen]
    Sarah O'Brien: I guess. Her office has been empty since. It's kind of creepy.
    -> hub
