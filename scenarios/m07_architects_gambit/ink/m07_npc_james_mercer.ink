// ================================================
// Mission 7: The Architect's Gambit
// Dr. James Mercer -- "Blackout" -- SCADA Control Room
//
// He is cold. He has read the 240-385 projection and signed it.
// He is not recruitable, not persuadable, not looking for absolution.
// The player does not get an outcome here. The player gets a stance.
//
// Four endings on real state:
//   casualty_projection_found  -> the record route      (arrested)
//   mercer_told_diversion      -> the hollowed route    (arrested)
//   always available           -> hostility handoff     (ko)
//   always available           -> he walks              (escaped)
//
// No player firearm. Violence resolves through #hostile + the combat system.
// Nothing here gates the shutdown -- flag 4 and crisis_control_system do that.
// ================================================

VAR player_name = "Agent 0x00"

// Read from the wider mission
VAR casualty_projection_found = false
VAR found_coordination_traffic = false
VAR elena_outcome = ""
VAR team_assignment = ""
VAR team_redirected = false
VAR countdown_expired = false
VAR flag4_submitted = false
VAR grid_saved = false

// Written back with #set_global
VAR mercer_stance = ""
VAR mercer_fate = ""
VAR mercer_told_diversion = false

// Local bookkeeping
VAR stance_taken = false
VAR heard_the_numbers = false
VAR heard_the_lesson = false
VAR heard_elena = false
VAR showed_him_the_page = false

// ================================================
// START
// ================================================

=== start ===
{mercer_fate != "":
    -> already_resolved
}
{stance_taken:
    -> returning
}

#complete_task:confront_mercer

Narrator: The control room is warm and very quiet. One man at the master console, jacket over the back of the chair, sleeves turned back. He is typing without hurry.

Narrator: He does not stop when the door opens.

Dr. James Mercer: You're early. Not by much.

Narrator: He finishes the line he is on, presses return, and only then turns round.

Dr. James Mercer: James Mercer. I'd offer a hand but you'd only refuse it, and then we'd both be embarrassed.

{countdown_expired:
    Dr. James Mercer: You'll have noticed the schedule has passed its mark. That isn't a failure on your part. It was never going to wait for the conversation.
}

Dr. James Mercer: Sit if you like. You've walked a long way through my building.

-> stance_gate

// ================================================
// THE STANCE -- what the player records about themselves
// ================================================

=== stance_gate ===
Dr. James Mercer: Before you start. Tell me how you've decided to hold this. It changes how long it takes.

+ [You're going to kill hundreds of people tonight and you know the number.]
    ~ stance_taken = true
    ~ mercer_stance = "condemned"
    #set_global:mercer_stance:condemned
    Dr. James Mercer: Good. That's clean. I prefer it to the other thing.
    Dr. James Mercer: The other thing is when they try to tell me I don't really mean it. That underneath I'm frightened, or sorry, or looking for a way out. It's very insulting and it wastes what little time there is.
    -> hub

+ [I want to understand the reasoning before I stop it. Talk me through it.]
    ~ stance_taken = true
    ~ mercer_stance = "reasoned"
    #set_global:mercer_stance:reasoned
    Dr. James Mercer: Then you're the first in eleven years.
    Dr. James Mercer: I should say now that understanding it will not change it, and I'd rather you didn't expect it to. People come away from the reasoning thinking they've found the loose thread. There isn't one. I've looked.
    -> hub

+ [Say nothing. Let him fill the silence.]
    ~ stance_taken = true
    ~ mercer_stance = "silent"
    #set_global:mercer_stance:silent
    You: ...
    Narrator: You say nothing at all. The display on the wall behind him hums. He waits as well.
    Dr. James Mercer: All right. That's a technique, and it's a decent one, and it won't work on me, but I'll take the invitation.
    Dr. James Mercer: I spent twenty years being listened to politely by people who had already decided. I know what silence in a room means. Ask what you want or don't. I'll be here either way.
    -> hub

// ================================================
// HUB
// ================================================

=== returning ===
Dr. James Mercer: Back. The console hasn't changed its mind either.
-> hub

=== hub ===
+ {not heard_the_lesson} [Why the grid? You could have published. You could have testified.]
    -> topic_lesson

+ {not heard_the_numbers} [How many people die tonight?]
    -> topic_numbers

+ {not heard_elena} [Elena Rodriguez thinks this is a six-hour demonstration with nobody hurt.]
    -> topic_elena

+ {casualty_projection_found and not showed_him_the_page} [I've got your projection here. Read it back to me.]
    -> topic_the_page

+ {found_coordination_traffic and not mercer_told_diversion} [Your operation is one of four tonight, doctor. All on one schedule.]
    -> topic_diversion

+ [Doctor, this ends here. How do you want it to end?]
    -> resolution

+ [I've heard enough of you for now.]
    {grid_saved:
        Dr. James Mercer: Take your time. There's nothing left for either of us to hurry for.
    - else:
        Dr. James Mercer: Take your time. I'm not going anywhere until the sequence does.
    }
    #exit_conversation
    -> hub

-> hub

// ================================================
// TOPICS
// ================================================

=== topic_lesson ===
~ heard_the_lesson = true

Dr. James Mercer: I did publish. Four papers, two of them still cited. I testified twice. I filed the same submission three times across eight years and watched it costed, deferred and declined by people who could not have told you what a phase angle was.

Dr. James Mercer: In 2019 a coronal event came within about ninety minutes of taking the western interconnect down on its own. Nobody wrote about it. Nothing changed. The system does not respond to argument. It responds to consequence.

Dr. James Mercer: So I stopped arguing.

Narrator: He says it the way a lecturer arrives at the obvious step, and waits to see whether the room has kept up.

+ [That is a very long way to walk to reach murder.]
    Dr. James Mercer: It's a very long way to walk to reach anything. That's rather the point about the length of it.
    -> hub
+ [You wanted to be right more than you wanted to be listened to.]
    Dr. James Mercer: No. I wanted to be listened to for eight years. Being right was what I had left.
    -> hub

=== topic_numbers ===
~ heard_the_numbers = true

Dr. James Mercer: Two hundred and forty at the low end. Three hundred and eighty-five at the high.

Narrator: He does not have to look it up.

Dr. James Mercer: A hundred and twenty to a hundred and eighty in hospitals, from generator failures and from response times that stretch past what a heart will tolerate. Forty to sixty-five on the roads, in the dark, at intersections with no signals. Eighty to a hundred and forty from cold, in apartments where the elderly do not have a second way to stay warm.

Dr. James Mercer: Water treatment fails at forty-eight hours. Restoration is four to seven days, because a transformer of that class is not a stock item and never has been. Which is itself the finding.

+ [You memorised them.]
    Dr. James Mercer: I wrote them. It would be a strange sort of cowardice to write them and then decline to know them.
    -> hub
+ [And you are going to do it anyway.]
    Dr. James Mercer: Yes.
    Narrator: No pause before it. No weight on it. The single most ordinary word he has said.
    -> hub

=== topic_elena ===
~ heard_elena = true

{elena_outcome == "turned":
    Dr. James Mercer: She's told you, then. I did wonder which way she'd go once somebody put a kind voice on it.
- else:
    Dr. James Mercer: Elena. Yes.
}

Dr. James Mercer: She was given the outage model and the restoration curve. Both accurate. She was not given the human-cost annex, because she would have refused, and I needed a substation engineer, not a conscience.

+ [You lied to her.]
    Dr. James Mercer: I withheld from her. She'd say lied. On the balance of it I'd let her have the word.
    Dr. James Mercer: If it helps you: I don't think worse of her for it. She simply isn't able to carry the number. Most people aren't. That is why most people don't get to decide.
    -> hub
+ [She thought nobody would be hurt. You let her believe that.]
    Dr. James Mercer: She thought it because I arranged the documents so she could. Yes.
    Narrator: He turns back to the console for a moment, checks something, turns back.
    Dr. James Mercer: You'll want to make that an accusation. Make it. It's accurate.
    -> hub

=== topic_the_page ===
~ showed_him_the_page = true

Narrator: You put the projection down on the console beside his hand. His own signature, his own date, his own handwriting along the foot of the page.

Narrator: He picks it up. He reads it the way a man rereads something he wrote, checking whether it still holds.

Dr. James Mercer: "Twice now the warnings have been costed and declined. This is the third submission. It will be read."

Dr. James Mercer: I was rather pleased with that line. It's still true.

Narrator: There is no flinch in him anywhere. He signed it because signing it was the honest thing to do, and he would like that noted.

Dr. James Mercer: You brought it here to make me look at it. I've looked at it more than you have. I costed the hypothermia column myself because the modeller kept rounding down and I thought that was dishonest.

+ [Then you'll say that in a room with a stenographer in it.]
    Dr. James Mercer: Now that is an interesting offer.
    -> hub
+ [You are not a teacher. You are a man with a spreadsheet of the dead.]
    Dr. James Mercer: Those aren't different things. That's what I've been trying to tell you.
    -> hub

=== topic_diversion ===
~ mercer_told_diversion = true
#set_global:mercer_told_diversion:true

You: Fracture, Trojan Horse, Meltdown, and you. One schedule, one authority, one clock. It came off a share in your own server room.

Dr. James Mercer: I'm aware there are other operations.

You: You're not aware of what they're for. Three of them are loud and none of them are meant to succeed. They're for occupying us. So is this one. You're the biggest and the noisiest of the four, doctor. That's the whole of your function tonight.

Narrator: He starts to answer. Stops.

Narrator: He turns to the console and pulls the coordination window himself, because of course he has the access, and reads it. It takes him about twenty seconds.

Dr. James Mercer: This is a scheduling artefact. Cells share infrastructure. It doesn't follow.

Narrator: He reads it again anyway. His hand stays on the desk longer than it needs to.

Dr. James Mercer: The lesson stands whether or not somebody else found it convenient. The grid is still fragile. The number is still the number.

Narrator: He is saying it correctly and he is saying it to himself.

+ [It stands. It just isn't yours. You were the noise.]
    Dr. James Mercer: Then he chose well. I'd have been very hard to use for anything small.
    -> hub
+ [He needed somebody who'd sign the page. That's all you were for.]
    Narrator: Mercer looks at the wall display for a while without saying anything.
    Dr. James Mercer: I'd like you to know that I would have done it regardless.
    Narrator: Which is true, and is also the first thing he has said tonight that he needed you to believe.
    -> hub

// ================================================
// RESOLUTION
// ================================================

=== resolution ===
{grid_saved:
    Dr. James Mercer: End what? You took the abort at that console while I sat here. There is nothing left running for me to end.
    -> resolution_choices
}
Dr. James Mercer: End it how? The sequence is local. It doesn't take an abort from this chair, it doesn't phone anyone, and it doesn't care what happens to me tonight. I built it that way so I couldn't be leaned on.

Dr. James Mercer: You don't need me. That's the part everyone gets wrong. You need the host in the server hall.

{flag4_submitted:
    Dr. James Mercer: Which you appear to have already reached. Somebody has root on it and my job is gone from the schedule. Well done, genuinely.
}

-> resolution_choices

=== resolution_choices ===
Dr. James Mercer: So. Your decision, not mine.

// PASS 2: the one tactical team is at another operation, and SAFETYNET has
// no arrest powers (lesson 39) -- the police take him.
+ {mercer_told_diversion} [Sit down, doctor. The police are on the stairs.]
    -> ending_hollowed

+ {casualty_projection_found} [You're going to the police, and you're going to say all of it on the record.]
    -> ending_record

+ [Get away from the console. Now.]
    -> ending_hostile

+ [Walk out. I've no time to spend on you.]
    -> ending_walks

+ [Not yet. I've something else to ask you.]
    Dr. James Mercer: By all means.
    -> hub

// --- Ending 1: the record --------------------------------------------
// Requires the signed projection. Fate: arrested.

=== ending_record ===
~ mercer_fate = "arrested"
#set_global:mercer_fate:arrested

You: You signed it. You costed the hypothermia column because rounding down felt dishonest to you. You're going to say that in a deposition, under your own name, with the page in front of you.

Narrator: For the first time all evening he looks at you as though you have said something he did not expect.

Dr. James Mercer: You'd let me speak.

You: I'd let you be quoted. There's a difference and you'll find out what it is.

Narrator: He thinks about it for perhaps three seconds. Then he unclips his facility badge, sets it on the console, and puts his hands where you can see them.

Dr. James Mercer: All right. On the record.

Dr. James Mercer: You should understand that I'm agreeing because it's a better outcome for me than the alternative, and not because you've moved me. Nothing you've said has moved me. I want that on the record too.

Narrator: Two state police officers come through the door forty seconds later. He does not resist and does not stop talking, and by the time they have him in the stairwell he is explaining transformer lead times to a man who did not ask.

#exit_conversation
-> already_resolved

// --- Ending 2: the hollowed -----------------------------------------
// Requires mercer_told_diversion. Fate: arrested, but not the same man.

=== ending_hollowed ===
~ mercer_fate = "arrested"
#set_global:mercer_fate:arrested

Narrator: He sits down. Not in surrender. More as though standing had become a thing that required a reason.

{flag4_submitted:
    Dr. James Mercer: Whatever you've done to the host, I didn't help you do it. I want you to be clear about that.
- else:
    Dr. James Mercer: The sequence still runs. I want you to be clear that I haven't stopped it and wouldn't.
}

You: I know.

Narrator: He turns the chair a few degrees towards the coordination window, still open on the screen, and looks at it again.

Dr. James Mercer: Twenty years. Four papers. Three submissions. And a scheduling slot.

Narrator: He does not crumble. He is far too well built for that. But something goes out of the room with him still in it, and when the police arrive he stands up before they ask him to.

Dr. James Mercer: The grid is still fragile.

Narrator: He says it to nobody in particular, on the way out, the way a man checks that he still has his keys.

#exit_conversation
-> already_resolved

// --- Ending 3: hostility handoff ------------------------------------
// Fate: ko. The shutdown route is untouched -- flag 4 and the host next door.

=== ending_hostile ===
~ mercer_fate = "ko"
#set_global:mercer_fate:ko

You: Away from the console. Hands where I can see them. I won't ask again.

Narrator: He stands. He is fifty-eight and he is not quick, and he moves towards you anyway, which tells you what the next few seconds are.

Dr. James Mercer: You've come a very long way to be one more person who won't listen.

{flag4_submitted or grid_saved:
    Narrator: The console is behind him. It stays behind him. The host is already yours; whatever happens in this room changes nothing about that.
- else:
    Narrator: The console is behind him. It stays behind him. Whatever happens in this room, the sequence is still waiting on a host in the server hall, and that is still where you have to go.
}

#hostile:james_mercer
#exit_conversation
-> already_resolved

// --- Ending 4: he walks ---------------------------------------------
// Fate: escaped.

=== ending_walks ===
~ mercer_fate = "escaped"
#set_global:mercer_fate:escaped

You: Go on. Out. You're not the emergency and I'm not going to pretend you are.

Narrator: That lands harder than anything else you have said to him.

Dr. James Mercer: I'm sorry?

{flag4_submitted or grid_saved:
    You: The host is mine and the sequence is dead. You're a man in a room with a signed piece of paper. Leave.
- else:
    You: The host is in the server hall. That's where tonight gets decided. You're a man in a room with a signed piece of paper. Leave.
}

Narrator: He collects his jacket from the back of the chair. He is careful about the sleeves. At the door he stops, because he cannot quite help it.

{flag4_submitted or grid_saved:
    Dr. James Mercer: It didn't happen tonight. When the fourth submission is declined, agent, somebody does this. It doesn't have to be me. It never had to be me.
- else:
    Dr. James Mercer: When the third submission is declined, agent, somebody does this. It doesn't have to be me. It never had to be me.
}

{flag4_submitted or grid_saved:
    Narrator: Then he is gone down the service stair, past a schedule that no longer has his sequence on it.
- else:
    Narrator: Then he is gone down the service stair, and the sequence carries on without him, which was always the arrangement.
}

#exit_conversation
-> already_resolved

// ================================================
// POST-RESOLUTION GUARD
// ================================================

=== already_resolved ===
Narrator: The console position is empty. The chair is still turned towards the door.

+ [Get to work.]
    #exit_conversation
    -> already_resolved
