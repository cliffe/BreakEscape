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

// PASS 4 round 2 (playtest 3a): the debrief now waits, so a player can meet
// him for the first time after the abort. Opening and stance gate read grid_saved.
{grid_saved:
    Narrator: The control room is warm and quiet. One man at the master console, hands flat on the desk. His screen says ABORT ACCEPTED.
    Dr. James Mercer: You took it off me at that console. I sat here and watched you do it.
- else:
    Narrator: The control room is warm and quiet. One man at the master console, sleeves turned back, typing. He does not stop when the door opens.
    Dr. James Mercer: You're early. Not by much.
}

Dr. James Mercer: James Mercer. I'd offer a hand, but you'd refuse it and we'd both be embarrassed.

{countdown_expired:
    Dr. James Mercer: You'll have noticed the schedule has passed its mark. It was never going to wait for a conversation.
}

Dr. James Mercer: Sit if you like. You've walked a long way through my building.

-> stance_gate

// ================================================
// THE STANCE -- what the player records about themselves
// ================================================

=== stance_gate ===
{grid_saved:
    Dr. James Mercer: There's no clock now, so we can be honest. Tell me how you've decided to hold this.
- else:
    Dr. James Mercer: Before you start. Tell me how you've decided to hold this. It changes how long it takes.
}

+ [{grid_saved:You were going to kill hundreds of people tonight, and you knew the number.|You're going to kill hundreds of people tonight and you know the number.}]
    ~ stance_taken = true
    ~ mercer_stance = "condemned"
    #set_global:mercer_stance:condemned
    Dr. James Mercer: Good. That's clean. I prefer it to the other thing.
    Dr. James Mercer: The other thing is being told I don't really mean it. That underneath I'm frightened, or sorry.
    Dr. James Mercer: It's insulting, and it wastes time.
    -> hub

+ [{grid_saved:I want to understand the reasoning. Talk me through it.|I want to understand the reasoning before I stop it. Talk me through it.}]
    ~ stance_taken = true
    ~ mercer_stance = "reasoned"
    #set_global:mercer_stance:reasoned
    Dr. James Mercer: Then you're the first in eleven years.
    Dr. James Mercer: Understanding it won't change it. I'd rather you didn't expect it to.
    Dr. James Mercer: People come away thinking they've found the loose thread. There isn't one. I've looked.
    -> hub

+ [Say nothing. Let him fill the silence.]
    ~ stance_taken = true
    ~ mercer_stance = "silent"
    #set_global:mercer_stance:silent
    You: ...
    Narrator: The display on the wall behind him hums. He waits as well.
    Dr. James Mercer: All right. It's a decent technique. It won't work on me, but I'll take the invitation.
    Dr. James Mercer: I spent twenty years being listened to politely by people who had already decided. I know what silence in a room means.
    -> hub

// ================================================
// HUB
// ================================================

=== returning ===
{grid_saved:
    Dr. James Mercer: Back. There's nothing left on that console for either of us.
- else:
    Dr. James Mercer: Back. The console hasn't changed its mind either.
}
-> hub

=== hub ===
+ {not heard_the_lesson} [Why the grid? You could have published. You could have testified.]
    -> topic_lesson

+ {not heard_the_numbers} [{grid_saved:How many people were going to die tonight?|How many people die tonight?}]
    -> topic_numbers

+ {not heard_elena} [Elena Rodriguez thinks this is a six-hour demonstration with nobody hurt.]
    -> topic_elena

+ {casualty_projection_found and not showed_him_the_page} [I've got your projection here. Read it back to me.]
    -> topic_the_page

+ {found_coordination_traffic and not mercer_told_diversion} [Four operations, one schedule, doctor. They're there to keep us busy. So are you.]
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

Dr. James Mercer: I did publish. Four papers, two of them still cited. I testified twice, and filed the same submission three times in eight years.
Dr. James Mercer: Each time it was costed, deferred and declined by people who couldn't tell you what a phase angle was.

Dr. James Mercer: In 2019 a solar storm came within ninety minutes of taking the western grid down on its own, and nobody wrote a word about it.
Dr. James Mercer: The system doesn't respond to argument. It responds to consequence.

Dr. James Mercer: So I stopped arguing.

+ [That is a very long way to walk to reach murder.]
    Dr. James Mercer: It's a very long way to walk to reach anything. That's what the length is for.
    -> hub
+ [You wanted to be right more than you wanted to be listened to.]
    Dr. James Mercer: No. I wanted to be listened to for eight years. Being right was what I had left.
    -> hub

=== topic_numbers ===
~ heard_the_numbers = true

Dr. James Mercer: Two hundred and forty at the low end. Three hundred and eighty-five at the high.

Dr. James Mercer: Hospitals, roads with no signals, old people in cold apartments. The breakdown is on the page.

Dr. James Mercer: Restoration is four to seven days, because nobody stocks transformers of that class. Which is itself the finding.

+ [You memorised them.]
    Dr. James Mercer: I wrote them. It would be a strange sort of cowardice to write them and then decline to know them.
    -> hub
+ [{grid_saved:And you would have done it.|And you are going to do it anyway.}]
    Dr. James Mercer: Yes.
    -> hub

=== topic_elena ===
~ heard_elena = true

{elena_outcome == "turned":
    Dr. James Mercer: She's told you, then. I did wonder which way she'd go once somebody was kind to her.
- else:
    Dr. James Mercer: Elena. Yes.
}

Dr. James Mercer: She had the outage model and the restoration curve. Both accurate. She didn't have the human-cost annex.
Dr. James Mercer: She'd have refused. I needed a substation engineer, not a conscience.

+ [You lied to her.]
    Dr. James Mercer: I withheld from her. She'd say lied. On the balance of it I'd let her have the word.
    Dr. James Mercer: I don't think worse of her. She can't carry the number. Most people can't. That's why most people don't get to decide.
    -> hub
+ [She thought nobody would be hurt. You let her believe that.]
    Dr. James Mercer: She thought it because I arranged the documents so she could. Yes.
    Dr. James Mercer: You'll want to make that an accusation. Make it. It's accurate.
    -> hub

=== topic_the_page ===
~ showed_him_the_page = true

Narrator: You put the projection on the console beside his hand. His signature, his date, his handwriting along the foot of the page.

Dr. James Mercer: "Twice now the warnings have been costed and declined. This is the third submission. It will be read."

Dr. James Mercer: I was rather pleased with that line. It's still true.

Dr. James Mercer: You brought it to make me look at it. I've looked at it more than you have.
Dr. James Mercer: I costed the hypothermia column myself. The modeler kept rounding down, and I thought that was dishonest.

+ [Then you'll say that in a room with a stenographer in it.]
    Dr. James Mercer: Now that is an interesting offer.
    -> hub
+ [Call it a submission if you like. It's a spreadsheet of the dead.]
    Dr. James Mercer: Those aren't different things. That's what I've been trying to tell you.
    -> hub

=== topic_diversion ===
~ mercer_told_diversion = true
#set_global:mercer_told_diversion:true

Dr. James Mercer: I'm aware there are other operations. I am nobody's distraction.

Narrator: He pulls the coordination window up on the console himself, and reads it.

Dr. James Mercer: This is a scheduling artifact. Cells share infrastructure. It doesn't follow.

Narrator: He reads it again.

Dr. James Mercer: The lesson stands whether or not somebody else found it convenient. The grid is still fragile. The number is still the number.

+ [It stands. It just isn't yours. You were the noise.]
    Dr. James Mercer: Then he chose well. I'd have been very hard to use for anything small.
    -> hub
+ [He needed somebody who'd sign the page. That's all you were for.]
    Dr. James Mercer: I'd like you to know that I would have done it regardless.
    -> hub

// ================================================
// RESOLUTION
// ================================================

=== resolution ===
{grid_saved:
    Dr. James Mercer: End what? You put the abort through while I sat here. There's nothing left running.
    -> resolution_choices
}
Dr. James Mercer: End it how? The sequence is local. It takes no abort from this chair, and it doesn't care what happens to me.
Dr. James Mercer: I built it that way so I couldn't be leaned on.

Dr. James Mercer: You don't need me. That's the part everyone gets wrong. You need the host in the server hall.

{flag4_submitted:
    Dr. James Mercer: Which you appear to have reached. My job is gone from the schedule. Well done, genuinely.
}

-> resolution_choices

=== resolution_choices ===
Dr. James Mercer: So. Your decision, not mine.

// PASS 2: the one tactical team is at another operation, and SAFETYNET has
// no arrest powers (lesson 39) -- the police take him.
+ {mercer_told_diversion} [Sit down, doctor. The police are on the stairs.]
    -> ending_hollowed

+ {casualty_projection_found} [On the record, doctor. Your name, your page, your words.]
    -> ending_record

+ [Away from the console, or I put you on the floor.]
    -> ending_hostile

+ [Go on. Walk out. You're not the emergency tonight.]
    -> ending_walks

+ [Not yet. I've something else to ask you.]
    Dr. James Mercer: By all means.
    -> hub

// --- Ending 1: the record --------------------------------------------
// Requires the signed projection. Fate: arrested.

=== ending_record ===
~ mercer_fate = "arrested"
#set_global:mercer_fate:arrested

Narrator: For the first time tonight, he looks surprised.

Dr. James Mercer: You'd let me speak. ... No. You'd let me be quoted. I know the difference.

Narrator: He unclips his facility badge, sets it on the console, and puts his hands where you can see them.

Dr. James Mercer: All right. On the record.

Dr. James Mercer: I'm agreeing because it suits me better than the alternative. Nothing you've said has moved me. Put that on the record too.

Narrator: Two state police officers come through the door. By the stairwell he is explaining transformer lead times to a man who did not ask.

#exit_conversation
-> already_resolved

// --- Ending 2: the hollowed -----------------------------------------
// Requires mercer_told_diversion. Fate: arrested, but not the same man.

=== ending_hollowed ===
~ mercer_fate = "arrested"
#set_global:mercer_fate:arrested

Narrator: He sits down, as though standing now needs a reason.

{flag4_submitted:
    Dr. James Mercer: Whatever you've done to the host, I didn't help you do it. I want you to be clear about that.
- else:
    Dr. James Mercer: The sequence still runs. I want you to be clear that I haven't stopped it and wouldn't.
}

Narrator: He turns the chair towards the coordination window, still open on the screen.

Dr. James Mercer: Twenty years. Four papers. Three submissions. And a scheduling slot.

Narrator: He does not crumble. When the police arrive, he stands before they ask him to.

Dr. James Mercer: The grid is still fragile.

Narrator: He says it on the way out, the way a man checks for his keys.

#exit_conversation
-> already_resolved

// --- Ending 3: hostility handoff ------------------------------------
// Fate: ko. The shutdown route is untouched -- flag 4 and the host next door.

=== ending_hostile ===
~ mercer_fate = "ko"
#set_global:mercer_fate:ko

Narrator: He stands. He is fifty-eight and not quick, and he comes towards you anyway.

Dr. James Mercer: You've come a very long way to be one more person who won't listen.

{flag4_submitted or grid_saved:
    Narrator: The console is behind him. The host is already yours, whatever happens in here.
- else:
    Narrator: The console is behind him. Whatever happens in here, the sequence still waits on the host in the server hall.
}

#hostile:james_mercer
#exit_conversation
-> already_resolved

// --- Ending 4: he walks ---------------------------------------------
// Fate: escaped.

=== ending_walks ===
~ mercer_fate = "escaped"
#set_global:mercer_fate:escaped

Dr. James Mercer: *a long pause* I'm sorry?

{flag4_submitted or grid_saved:
    Dr. James Mercer: Ah. The host is yours. So I'm a man in a room with a signed piece of paper.
- else:
    Dr. James Mercer: Ah. It's decided in the server hall, not here. So I'm a man in a room with a signed piece of paper.
}

Narrator: He takes his jacket from the chair, careful with the sleeves. At the door he stops.

{flag4_submitted or grid_saved:
    Dr. James Mercer: It didn't happen tonight. When the fourth submission is declined, agent, somebody does this. It never had to be me.
- else:
    Dr. James Mercer: When the third submission is declined, agent, somebody does this. It never had to be me.
}

{flag4_submitted or grid_saved:
    Narrator: Then he is gone down the service stair, past a schedule that no longer has his sequence on it.
- else:
    Narrator: Then he is gone down the service stair, and the sequence carries on without him.
}

#exit_conversation
-> already_resolved

// ================================================
// POST-RESOLUTION GUARD
// ================================================

=== already_resolved ===
Narrator: The console position is empty. The chair is still turned towards the door.

+ [Get to work.]
    Narrator: Nobody answers. The console hums on without him.
    #exit_conversation
    -> already_resolved
