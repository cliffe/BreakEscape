// ===========================================
// ACT 1 NPC: Sister Aoife Doyle -- Ward Sister
// Mission 2: Ransomed Trust
//
// Sister Doyle is the mission's conscience. She does not care about ENTROPY,
// the board, or your cover story. She cares that she is running six critical
// beds off a clipboard.
//
// She rewards ENGAGEMENT WITH THE PATIENTS AS PEOPLE:
//   showed_empathy -> she volunteers the safe override outright, and later
//     will hand over an agency lanyard when your cover is burned.
//   otherwise      -> she tells you to go and look it up yourself. The code is
//     independently discoverable (founding plaque, Kim's diary) and there is a
//     pin-cracker in the storage room, so the cold player loses a shortcut and
//     a friend, never the mission.
// ===========================================

EXTERNAL player_name()

VAR influence = 0
VAR showed_empathy = false
VAR spoke_about_patients = false
VAR spoke_about_manual = false
VAR spoke_about_timeline = false
VAR gave_lanyard = false

// Synced from globalVars by engine at call-open
VAR cover_burned = false
VAR cover_restored = false
VAR offline_keys_recovered = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{cover_burned and not cover_restored and spoke_about_patients:
    -> burned_entry
}
{spoke_about_patients:
    -> returning
}
-> first_meeting

=== first_meeting ===
Narrator: Six beds. One nurse working the far end with a clipboard, and Sister Doyle planted at the side of bed two, not moving, eyes on a machine that is doing a woman's breathing for her.

Sister Doyle: *without looking round* Are you meant to be on my ward?

Sister Doyle: Because I've had four people through here tonight who weren't, and every one of them wanted to tell me about the computers.

* [Security consultant. I'm here to get your monitoring back.]
    Sister Doyle: *dry* Right. The computers.
    -> stakes

* [What am I looking at? Talk me through the ward.]
    ~ showed_empathy = true
    ~ influence += 2
    # influence_increased
    Sister Doyle: *looks at you properly for the first time* You want to know what you're looking at.
    Sister Doyle: Right. Two minutes, and I'm not leaving this bed while I do it.
    -> ward_tour

* [No. Tell me to go and I'll go.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: *pause* ...No. Stay.
    Sister Doyle: You're the first one tonight who's asked instead of announcing.
    -> stakes

// ===========================================
// THE WARD TOUR
// ===========================================

=== ward_tour ===
~ spoke_about_patients = true
#complete_task:talk_to_ward_nurse

Narrator: She nods down the row as she talks, and does not lower her voice, because these are her patients and she is not going to discuss them as though they cannot hear.

Sister Doyle: Bed four. Mr Pryce, sixty-seven, ventilated. The machine's on its own power so it keeps breathing for him whatever happens. It's the monitoring that fed the station, and the station's dark.

Sister Doyle: Bed two. Mrs Hargreaves, on ECMO. That's her heart and her lungs, both, sat in a box beside the bed. If that alarms and nobody's stood next to it, she has about four minutes.

Sister Doyle: Bed five's Ms Chen, post-op, and she's been watching this bed all night because she's worked out I can't be everywhere. Seventy-one years old and she's doing my obs for me with her eyes.

Sister Doyle: Six beds in this bay. Two more bays down the corridor. Forty-seven altogether.

* [Four minutes. And no alarm.]
    ~ showed_empathy = true
    ~ influence += 2
    # influence_increased
    Sister Doyle: Four minutes.
    Sister Doyle: So I stand here. That's the whole plan -- I stand at this bed and I watch it with my own eyes, and Priya runs everybody else on paper.
    Sister Doyle: Twenty years of training and tonight I'm an alarm.
    -> hub_intro

* [What are you most frightened of?]
    ~ showed_empathy = true
    ~ influence += 3
    # influence_increased
    -> the_fear

* [Understood. I'll be quick.]
    Sister Doyle: Aye. Do.
    -> hub_intro

=== the_fear ===
~ showed_empathy = true

Narrator: She says it quietly, and she does not stop looking at bed two while she says it.

Sister Doyle: Not the big thing. The small one.

Sister Doyle: A number I'd have caught. A trend across three readings that the screen would have flagged in orange at ten past, and I'll see it at half past because that's when I got back round.

Sister Doyle: Twenty minutes. That's all it is. That's the whole difference between the machine watching and me watching.

Sister Doyle: I'm good at this. I've been good at this for twenty years. I'm not good enough to be six machines.

* [Then let's give you your machines back.]
    ~ influence += 2
    # influence_increased
    Narrator: She is already looking back at the machine.

    Sister Doyle: Go on then.
    -> hub_intro

* [Nobody could be. That's not a failing, that's arithmetic.]
    ~ influence += 3
    # influence_increased
    Sister Doyle: Tell that to me at half past, when I'm the one holding the chart.
    -> hub_intro

// ===========================================
// STAKES (the colder route)
// ===========================================

=== stakes ===
~ spoke_about_patients = true
#complete_task:talk_to_ward_nurse

Sister Doyle: Forty-seven across three wards. Ventilators, ECMO, dialysis, all of them fed into a monitoring system that stopped existing at ten to three.

Sister Doyle: The machines still run. It's the watching that's gone.

Sister Doyle: Two of us, forty-seven patients, manual obs every fifteen minutes and a biro.

-> hub_intro

=== hub_intro ===
-> hub

// ===========================================
// HUB
// ===========================================

=== hub ===
+ {not spoke_about_manual} [How are you managing it without the systems?]
    -> manual_work

+ {not spoke_about_timeline} [How long can you keep this up?]
    -> timeline

+ {cover_burned and not cover_restored and not gave_lanyard} [Sister -- somebody's told security I was never booked in. I need something that gets me back up that corridor.]
    -> the_lanyard

+ {offline_keys_recovered} [I've got the offline keys. Your monitors are coming back.]
    -> good_news

+ [I'll let you work.]
    Sister Doyle: {influence >= 4: Go on. And thank you for looking at them properly.|Aye.}
    #exit_conversation
    -> hub

=== manual_work ===
~ spoke_about_manual = true

Sister Doyle: Obs every fifteen minutes. Blood pressure by cuff, sats by probe, temp, respiratory rate, written down.

Sister Doyle: Drug rounds off a paper chart we printed at two before the printers went as well. Which means if a doctor changes a dose tonight, it changes on my bit of paper and nowhere else, and God help whoever's on at seven.

Sister Doyle: We're managing. I want to be very clear that "managing" is not a compliment. Managing is what you do instead of the actual standard.

+ [You shouldn't have to be doing this at all.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: No. But here we are, and there's a woman in bed two, so.
    -> hub

+ [Understood. Every hour I save you is a real hour.]
    ~ influence += 1
    # influence_increased
    Sister Doyle: It is. Go and save me some.
    -> hub

// ===========================================
// TIMELINE + THE SAFE CODE
// ===========================================

=== timeline ===
~ spoke_about_timeline = true
#complete_task:gather_pin_clues

Sister Doyle: Generators are good for twelve hours from lockdown. We're four in.

Sister Doyle: Eight hours. That's what you've got, and I'll tell you now, the last two of those are going to be very bad ones whatever anybody decides in a boardroom.

Sister Doyle: The registrar worked out a number. Risk per hour. He came and told me it, at half two, like it was helpful.

Sister Doyle: I asked him not to say it again on my ward.

Narrator: She flicks a page over on the clipboard.

Sister Doyle: If it's the emergency kit you're after -- far end of this ward, through the door at the back. Backup gear's in there.

{showed_empathy:
    Sister Doyle: There's a PIN safe on it. In twenty years that override has never once been changed, and it's the year this place was founded -- it's on the plaque in the lobby if you want to feel clever about it.
    Sister Doyle: Take it. If knowing that gets those monitors back one minute sooner then I don't care who I'm not supposed to tell.
- else:
    Sister Doyle: There's a PIN safe on it. Old institutional code -- the sort of thing that's written down in half a dozen places in this building if you actually stop and look at anything.
    Sister Doyle: I haven't the time to walk you round it. I've patients to watch.
}

+ [I'll be as fast as I can.]
    Sister Doyle: Fast and right. In that order, and if you can only have one, have the second.
    -> hub

+ {showed_empathy} [Thank you, Sister.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: Go on.
    -> hub

// ===========================================
// THE LANYARD -- cover-burn recovery, empathy-gated
// (Redundant with Gary's contractor pass, Bernie vouching, and Val's
//  own judgement -- so this is a reward, never a requirement.)
// ===========================================

=== the_lanyard ===
{showed_empathy:
    -> lanyard_given
- else:
    -> lanyard_refused
}

=== lanyard_given ===
~ gave_lanyard = true
~ cover_restored = true
#give_item:id_badge:bank_staff_lanyard
#set_global:staff_lanyard_obtained:true
#set_global:cover_restored:true

Narrator: She does not take her eyes off the machine.

Sister Doyle: Priya. Ward office, second drawer, the green ribbons. Bring one.

Narrator: Nurse Raval fetches it without breaking her round. Sister Doyle takes it one-handed and holds it out to you, still watching bed two.

Sister Doyle: Agency staff. We get four a week through here and half of them never hand them back, so nobody counts them.

Sister Doyle: It's not your name and it's not your face and I've just committed about three separate disciplinaries handing it to you.

Sister Doyle: But you stood and looked at Mrs Hargreaves like she was a person and not a statistic, and I've decided that's my evidence base.

* [I won't waste it.]
    ~ influence += 3
    # influence_increased
    Sister Doyle: You'd better not. Go.
    #exit_conversation
    -> hub

* [Why risk your job on me?]
    Sister Doyle: Because everybody upstairs is having a meeting about it and you're the only one running.
    Sister Doyle: Now go on before I think about it properly.
    #exit_conversation
    -> hub

=== lanyard_refused ===
Sister Doyle: *not unkindly, but not turning round either* You want me to hand a hospital identity to a man I met an hour ago who's just told me security don't think he exists.

Sister Doyle: I've six critical beds and no monitoring. I cannot also be the one who decides who you are.

Sister Doyle: Try IT -- up the link and along the main corridor. Gary is in there, and he's the sort who'd rather be sacked for helping than for nothing.

#exit_conversation
-> hub

// ===========================================
// PAYOFF
// ===========================================

=== good_news ===
Narrator: She stops.

Sister Doyle: Say that again.

+ [The offline keys. Your monitoring's coming back tonight.]
    ~ influence += 3
    # influence_increased
    Narrator: She closes her eyes for about a second and a half. It is the first time all night she has looked away from that machine.
    Sister Doyle: Right.
    Sister Doyle: *eyes back on the monitor* Right. Well. Go and do the rest of it, then.
    #exit_conversation
    -> hub

// ===========================================
// RETURNS
// ===========================================

=== returning ===
{offline_keys_recovered:
    Sister Doyle: Tell me you've something.
- else:
    Narrator: She has not moved from bed two.

    Sister Doyle: Still here, then.
}
-> hub

=== burned_entry ===
Sister Doyle: There's been a man round asking whether anybody let an unbadged stranger onto my ward.

Sister Doyle: I said I'd not seen anyone. Which is a lie, and I'd like you to know I don't tell them for fun.

-> hub
