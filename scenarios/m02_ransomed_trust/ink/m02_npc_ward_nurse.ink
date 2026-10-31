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
// Pass 4 dialogue: a re-talk re-navigates to hub, so the hub carries the return
// greeting (and the burned-cover beat). hub_quiet skips it once after a reply or a goodbye.
VAR hub_quiet = false

// Synced from globalVars by engine at call-open
VAR cover_burned = false
VAR cover_restored = false
VAR offline_keys_recovered = false

// ===========================================
// ENTRY
// ===========================================

=== start ===
{cover_burned and not cover_restored and not gave_lanyard and spoke_about_patients:
    -> burned_entry
}
{spoke_about_patients:
    -> returning
}
-> first_meeting

=== first_meeting ===
Narrator: Six beds. A nurse working the far end with a clipboard, and Sister Doyle planted at bed two, eyes on the machine that is breathing for a woman.

Sister Doyle: *without looking round* Are you meant to be on my ward?

Sister Doyle: I've had four people through here tonight who weren't, and every one of them wanted to tell me about the computers.

* [Security consultant. I'm here to get your monitoring back.]
    Sister Doyle: Right. The computers.
    -> stakes

* [What am I looking at? Talk me through the ward.]
    ~ showed_empathy = true
    ~ influence += 2
    # influence_increased
    Sister Doyle: *looks round for the first time* Two minutes. And I'm not leaving this bed while I do it.
    -> ward_tour

* [No. Tell me to go and I'll go.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: ...No. Stay.
    Sister Doyle: You're the first one tonight who's asked instead of announcing.
    -> stakes

// ===========================================
// THE WARD TOUR
// ===========================================

=== ward_tour ===
~ spoke_about_patients = true
#complete_task:talk_to_ward_nurse

Narrator: She nods down the row as she talks. She doesn't lower her voice. These are her patients, and they can hear.

Sister Doyle: Bed four. Mr Pryce, sixty-seven, ventilated. The machine has its own power. It's the monitoring that's gone dark.

Sister Doyle: Bed two. Mrs Hargreaves, on ECMO. That's her heart and her lungs, both, in a box beside the bed.

Sister Doyle: If that alarms and nobody's stood next to it, she has about four minutes.

Sister Doyle: Bed five's Ms Chen. Seventy-one, post-op, and she's been doing my obs for me with her eyes.

Sister Doyle: Six beds in this bay. Two more bays down the corridor. Forty-seven altogether.

* [Four minutes. And no alarm.]
    ~ showed_empathy = true
    ~ influence += 2
    # influence_increased
    Sister Doyle: So I stand here. That's the whole plan. I watch this bed with my own eyes, and Priya runs everybody else on paper.
    Sister Doyle: Twenty years of training, and tonight I'm an alarm.
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

Sister Doyle: The small thing. Always the small one.

Sister Doyle: A drift across three readings. The screen would have flagged it orange at ten past. I'll see it at half past, when I get back round.

Sister Doyle: Twenty minutes. That's the whole difference between the machine watching and me watching.

Sister Doyle: I've been good at this for twenty years. I'm not good enough to be six machines.

* [Then let's give you your machines back.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: *eyes already back on bed two* Go on, then.
    -> hub_intro

* [Nobody could be. Nobody should have to be.]
    ~ influence += 3
    # influence_increased
    Sister Doyle: Tell me that at half past, when I'm the one holding the chart.
    -> hub_intro

// ===========================================
// STAKES (the colder route)
// ===========================================

=== stakes ===
~ spoke_about_patients = true
#complete_task:talk_to_ward_nurse

Sister Doyle: Forty-seven across three wards. Ventilators, ECMO, dialysis, all fed into a monitoring system that died at ten to three.

Sister Doyle: The machines still run. Nobody's watching them.

Sister Doyle: Two of us, manual obs every fifteen minutes, and a biro.

-> hub_intro

=== hub_intro ===
~ hub_quiet = true
-> hub

// ===========================================
// HUB
// ===========================================

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    {cover_burned and not cover_restored and not gave_lanyard and not burned_entry:
        -> burned_entry
    }
    Sister Doyle: {offline_keys_recovered and not good_news: Tell me you've something.|{&Still here, then.|What is it?|Quick, then.}}
}
+ {not spoke_about_manual} [How are you managing without the systems?]
    -> manual_work

+ {not spoke_about_timeline} [How long can you keep this up?]
    -> timeline

+ {cover_burned and not cover_restored and not gave_lanyard} [Security think I was never booked in. I need a way back up that corridor.]
    -> the_lanyard

+ {offline_keys_recovered} [I've got the offline keys. Your monitors are coming back.]
    -> good_news

+ [I'll let you work.]
    Sister Doyle: {influence >= 4: Go on. And thank you for looking at them properly.|Aye.}
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== manual_work ===
~ spoke_about_manual = true

Sister Doyle: Obs every fifteen minutes. Cuff, probe, thermometer, biro.

Sister Doyle: Drug rounds off a paper chart we printed at two, before the printers went as well.

Sister Doyle: If a doctor changes a dose tonight, it changes on my bit of paper and nowhere else. God help whoever's on at seven.

Sister Doyle: We're managing. And managing is what you do instead of the actual standard.

+ [You shouldn't have to be doing this at all.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: No. But there's a woman in bed two, so.
    ~ hub_quiet = true
    -> hub

+ [Understood. Every hour I save you is a real hour.]
    ~ influence += 1
    # influence_increased
    Sister Doyle: It is. Go and save me some.
    ~ hub_quiet = true
    -> hub

// ===========================================
// TIMELINE + THE SAFE CODE
// ===========================================

=== timeline ===
~ spoke_about_timeline = true

Sister Doyle: Generators are good for twelve hours from lockdown. We're four in.

Sister Doyle: Eight hours, then. And the last two will be very bad ones, whatever anybody decides in a boardroom.

Sister Doyle: The registrar worked out a risk per hour. Came and told me it at half two, like it was helpful.

Sister Doyle: I asked him not to say it again on my ward.

Sister Doyle: If it's the emergency kit you're after: far end of this ward, through the door at the back. Backup gear's in there.

{showed_empathy:
    #complete_task:gather_pin_clues
    Sister Doyle: There's a PIN safe on it. The override's the year this place was founded. It's on the plaque in the lobby.
    Sister Doyle: Twenty years and nobody's changed it. If knowing that gets those monitors back a minute sooner, I don't care who I'm not supposed to tell.
- else:
    Sister Doyle: There's a PIN safe on it. Old institutional code. It's written up in half a dozen places in this building, if you stop and look.
    Sister Doyle: I haven't the time to walk you round it. I've patients to watch.
}

+ [I'll be as fast as I can.]
    Sister Doyle: Fast and right. If you can only have one, have the second.
    ~ hub_quiet = true
    -> hub

+ {showed_empathy} [Thank you, Sister.]
    ~ influence += 2
    # influence_increased
    Sister Doyle: Go on.
    ~ hub_quiet = true
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

// Pass 4: the lanyard is what the player shows Val; it no longer restores cover by itself.
=== lanyard_given ===
~ gave_lanyard = true
#give_item:id_badge:bank_staff_lanyard
#set_global:staff_lanyard_obtained:true

Narrator: She doesn't take her eyes off the machine.

Sister Doyle: Priya. Ward office, second drawer, the green ribbons. Bring one.

Narrator: Nurse Raval fetches it without breaking her round. Sister Doyle holds it out to you one-handed, still watching bed two.

Sister Doyle: Agency staff. We get four a week, and half of them never hand them back, so nobody counts them.

Sister Doyle: It's not your name or your face, and I've just earned myself about three disciplinaries.

Sister Doyle: But you looked at Mrs Hargreaves like she was a person. I've decided that's my evidence base.

* [I won't waste it.]
    ~ influence += 3
    # influence_increased
    Sister Doyle: You'd better not. Go.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

* [Why risk your job on me?]
    Sister Doyle: Everybody upstairs is having a meeting about it. You're the only one running.
    Sister Doyle: Now go, before I think about it properly.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== lanyard_refused ===
Sister Doyle: *not turning round* You want a hospital identity from me, an hour after we met, when security say you don't exist.

Sister Doyle: I've six critical beds and no monitoring. I can't also be the one who decides who you are.

Sister Doyle: Try IT. Up the link, along the main corridor, then through the handover room.

Sister Doyle: Gary's in there. He'd rather be sacked for helping than for nothing.

~ hub_quiet = true
#exit_conversation
-> hub

// ===========================================
// PAYOFF
// ===========================================

=== good_news ===
Narrator: She stops.

Sister Doyle: Say that again.

+ [The offline keys. Your monitoring's coming back tonight.]
    Narrator: She closes her eyes for about a second and a half. It's the first time all night she's looked away from that machine.
    ~ influence += 3
    # influence_increased
    Sister Doyle: Right.
    Sister Doyle: Right. Well. Go and do the rest of it, then.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// RETURNS
// ===========================================

=== returning ===
{offline_keys_recovered:
    Sister Doyle: Tell me you've something.
- else:
    Sister Doyle: Still here, then.
}
~ hub_quiet = true
-> hub

=== burned_entry ===
Sister Doyle: A man's been round asking if anybody let an unbadged stranger onto my ward.

Sister Doyle: I said I'd seen nobody. That's a lie, and I don't tell them for fun.

~ hub_quiet = true
-> hub
