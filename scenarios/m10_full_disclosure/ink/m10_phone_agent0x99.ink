INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Agent HaX on the phone (agent_0x99)
// Group B, stage 7b. Contract: scenarios/m10_full_disclosure/CONTRACT.md §1.4.
// Home knot: start. It prints nothing and writes nothing (phone preload,
// PASS2 lesson 36), so the jam check runs on every open.
// Text, never voiced: start, jammed, support_hub and every topic, console.
// Voiced calls (F20; CONTRACT §4): breach_call, inner_door_call,
// tripwire_call, ladder_call, stair_call, gallery_open_call, cut_call. Each ends
// #exit_conversation then -> DONE: a phone thread whose story has ended
// restarts at start on the next open (m09 CONTRACT §455), and no call knot
// diverts into start, support_hub or a hub topic. No narrator, no printed
// variable, in any call knot.
// HaX's own lines take no prefix (phone-self-prefix). Netherton, Malhotra,
// Nightshade and the raid team speak on the net with their prefixes.
// ================================================

// File-locals (hax_ prefix): topics asked once.
VAR hax_how_asked = false
VAR hax_why_asked = false
VAR hax_hour_asked = false
VAR hax_headstart_asked = false
VAR hax_fence_asked = false
VAR hax_power_asked = false
VAR hax_backdoor_asked = false
VAR hax_console_asked = false
VAR hax_vault_asked = false
VAR hax_hatch_asked = false
VAR hax_monitor_asked = false  // educational R1 (E-m6): the flag-1 concept steer
VAR hax_box_asked = false      // educational R1 (E-m6): the flag-4 concept steer
VAR hax_suspect = ""

=== function hax_guide_ready() ===
~ return (guide1_offered and not guide1_given and not flag1_submitted) or (guide2_offered and not guide2_given and not flag2_submitted) or (guide3_offered and not guide3_given and not flag3_submitted) or (guide4_offered and not guide4_given and not flag4_submitted)

=== function hax_quintero_free() ===
~ return not quintero_ko and officer_out != "quintero"

// ---------------- home and hub (text) ----------------

=== start ===
{ending == "joined": -> line_dead}
{ending != "": -> after_ending}
{hax_jammed: -> jammed}
-> support_hub

// Stage 9 follow-up: once his ending is chosen the hub is closed. One rest
// line by ending and the exit; on Join, nothing at all from her.
=== after_ending ===
{
- ending == "executed":
    Not now.
- ending == "scorched":
    Get out with the team. We'll talk at the hearing.
- else:
    It's done. Come up when you're ready.
}
+ [That's all.]
    #exit_conversation
    -> DONE

=== line_dead ===
+ [Hang up.]
    #exit_conversation
    -> DONE

// OT §5 "The jam": one line and the exit, nothing else.
=== jammed ===
...
+ [Hang up.]
    #exit_conversation
    -> DONE

// Scenario design R1 n2: the console and vault topics retire once flag4_lines has said both in the scene.
// OT §5. Choices only (phone resting knot). Newest topics first; each retires
// on its own guard or when its aim is done; the three sticky choices last.
=== support_hub ===
+ {flag4_submitted and not flag4_heard and not hax_console_asked} [The console.] -> console_fact
+ {flag4_submitted and not flag4_heard and not hax_vault_asked} [The vault line.] -> vault_line
+ {outer_lock_open and not hax_jammed and not what_went_out_given} [What went out?] -> what_went_out
+ {flag2_submitted and not hax_jammed and not outer_lock_open} [What's still live?] -> whats_live
// Stage 8 (ruling 3, m-1): while "[What's still live?]" shows, it carries the
// backdoor too, so the hub stays at ten on the busiest save.
+ {flag2_submitted and outer_lock_open and backdoor_channel_live and not backdoor_closed and not hax_backdoor_asked} [The backdoor.] -> backdoor_topic
+ {flag2_submitted and not flag3_submitted and not hax_hatch_asked} [The hatch?] -> hatch_topic
// Educational R1 (E-m6): concept steers for flags 1 and 4 (wording checked against the VM plan by opus48).
+ {outer_lock_open and not flag4_submitted and not hax_box_asked} [His box.] -> box_topic
+ {power_room_entered and not gallery_shutter_cut and phone_voice_is_hax} [Talk me through the shutter.] -> shutter_topic
+ {clue_door_log and whodunit_live and not wren_at_core and accused == ""} [I know who WREN is.] -> accuse
// Alignment m12: recalls after the accusation, and gone once past the gallery stair.
+ {officer_out == "malhotra" and clue_alibi and not gallery_open} [Bring Malhotra back.] -> recall_malhotra
+ {officer_out == "quintero" and clue_bench_log and not gallery_open} [Bring Quintero back.] -> recall_quintero
+ {officer_out == "arakawa" and clue_alibi and not gallery_open} [Bring Arakawa back.] -> recall_arakawa
+ {officer_out == "vector" and clue_alibi and not gallery_open} [Bring Vector back.] -> recall_vector
+ {officer_out == "phantom" and clue_alibi and not gallery_open} [Bring Phantom back.] -> recall_phantom
+ {clue_bench_log and whodunit_live and not signout_read} [Who signed for the case?] -> signout
+ {clue_door_log and door_log_given and whodunit_live and not clue_alibi} [Who was where at ten past?] -> alibi
+ {clue_door_log and whodunit_live and not clue_alibi and not door_log_given} [The door log.] -> door_log
+ {flag1_submitted and not power_room_entered and not hax_power_asked} [The power room?] -> power_room_topic
+ {door_scene_done and not flag1_submitted and not hax_monitor_asked} [Their monitoring. Where do I start?] -> monitor_topic
+ {flag1_submitted and m06_assets_seized and not workshop_entered and not hax_fence_asked} [The fence.] -> fence
+ {briefing_played and not breach_open and not hax_why_asked} [Why does he want me?] -> why_me
+ {briefing_played and not breach_open and not hax_hour_asked} [The hour.] -> the_hour
+ {briefing_played and not breach_open and not hax_headstart_asked} [The head start.] -> the_head_start
+ {briefing_played and not flag2_submitted and not hax_how_asked} [How are you?] -> how_are_you
+ [Where are we?] -> where_are_we
+ {hax_guide_ready()} [Field guide.] -> field_guide
+ [That's all.]
    Line stays open.
    #exit_conversation
    -> DONE

// OT §5's ladder, first that holds. After a reload it names where to walk back to.
=== where_are_we ===
{
- ending != "" and ending != "joined":
    It's done. Come up when you're ready.
- database_outcome != "":
    It's him now.
- console_choice != "":
    The database. Then him.
- exchange_3 != "":
    Your call on his console.
- flag4_submitted:
    Hear him out.
- outer_lock_open:
    You're in. His box first.
- gallery_open:
    Up the stair. The lock's at the end.
- flag2_submitted and flag3_submitted and not gallery_shutter_cut:
    The shutter's still live. Power room.
- flag2_submitted:
    Get under the release service. The hatch in the sealed section.
- server_hall_entered:
    The console takes the staging copy.
- gallery_shutter_cut:
    Server hall's through there.
// Dialogue R1 m15: in the power room, the job is the shutter.
- power_room_entered:
    The shutter. Whoever runs that room, or you by hand.
- workshop_entered:
    Get to the power room. Then the shutter.
- ghost_call_done:
    Stair's open.
- security_office_entered:
    The handset. Answer it.
- tripwire_tripped and not inner_door_open:
    The ladder at the guard post. Up and round.
- breach_open:
    Through the tunnel.
- door_scene_done and flag1_submitted:
    Quintero's on her way back.
- door_scene_done:
    Their monitoring. Gate terminal.
- flag1_submitted:
    Netherton won't call it till the table's settled.
- else:
    The table first, then the gate terminal.
}
-> support_hub

// One button for every guide; it gives the guide for the stage the player is
// on, once that stage's console has been used. Working ids (CONTRACT §7 item 5).
=== field_guide ===
{
- guide1_offered and not guide1_given and not flag1_submitted:
    ~ guide1_given = true
    #give_item:lab-workstation:m10_guide_flag1
    Sending you the guide for their monitoring host. It's on your workstation.
- guide2_offered and not guide2_given and not flag2_submitted:
    ~ guide2_given = true
    #give_item:lab-workstation:m10_guide_flag2
    Sending you the guide for the staging copy. Workstation.
- guide3_offered and not guide3_given and not flag3_submitted:
    ~ guide3_given = true
    #give_item:lab-workstation:m10_guide_flag3
    Sending you the guide for the release service's container. Workstation.
- guide4_offered and not guide4_given and not flag4_submitted:
    ~ guide4_given = true
    #give_item:lab-workstation:m10_guide_flag4
    Sending you the guide for his box. Workstation.
- else:
    Nothing new to send. You've got what I've got.
}
-> support_hub

// ---------------- the briefing's questions, and Act 1 ----------------

// SE §3.1, by m09_hax_confession_answer; the neutral form on a cold start or
// an m09 save with no answer.
=== how_are_you ===
~ hax_how_asked = true
{
- m09_hax_confession_answer == "should_have_told":
    I said everything from now on. So: I haven't slept, and I'd rather it was anyone else in that chair.
- m09_hax_confession_answer == "same_in_your_place":
    Better for having told you. Ask me again at six.
- m09_hax_confession_answer == "afterwards":
    You gave me my own line back in Helena. I'm holding you to it.
- else:
    I'm going to watch someone I used to admire be arrested. I'll manage.
}
-> support_hub

// The briefing's three questions (arc §3 beat 8; OT §5). They retire at the breach.
=== why_me ===
~ hax_why_asked = true
He wants it to be one of ours. Ask him why. He'll enjoy telling you.
He's watched every job you've done since your first day. He thinks it'll be you.
+ [He's wrong.]
    Then prove it to him slowly. He likes to be shown.
    -> support_hub
+ [Why would he think that?]
    Because he's read everything you've ever signed. Most of it twice.
    -> support_hub

=== the_hour ===
~ hax_hour_asked = true
Six o'clock UTC, city by city. Hospitals first, in his own order.
Or everywhere in the same minute, if someone presses his key.
-> support_hub

=== the_head_start ===
~ hax_headstart_asked = true
The cells get the database at four. Two hours early, as pay for the theft.
How it goes out is on their system somewhere below. Find it before four and we can do something about it.
-> support_hub

=== fence ===
~ hax_fence_asked = true
Two posts empty. That's your freeze. He couldn't make payroll.
-> support_hub

=== power_room_topic ===
~ hax_power_asked = true
// Dialogue R1 m16: not the flag-1 text's words again.
Your lights and the gallery's blast shutter both run off that room.
The shutter has to be dead before you reach him.
-> support_hub

// ---------------- the whodunit ----------------

// Clue 1 (arc §8.2). HaX volunteers the same read as a bark on the log's first
// read; this topic is for a player who missed it.
=== door_log ===
~ door_log_given = true
Ten past two, the core's service door opened to one of our badges.
The log says Malhotra's badge. Malhotra was on with me at ten past.
+ [Is there a camera on that door?]
    That camera's a box on a bracket. Never wired.
    -> support_hub
+ [So somebody has a copy.]
    // Educational R1 E-M4: what a door log proves.
    That's how I read it. A door log proves a card was there. Not who held it.
    -> support_hub

// Clue 2. What the player saw, what HaX had, what Netherton had. The arakawa_ko
// form holds whether he went down before his call or after it.
=== alibi ===
~ clue_alibi = true
{
- arakawa_ko:
    Arakawa was at the gate with you at ten past, upright or not.
- else:
    You had Arakawa at the gate, on the phone to his daughter.
}
{
- vector_on_team and phantom_on_team:
    I had Malhotra. Netherton had Vector and Phantom at the table.
- vector_on_team:
    I had Malhotra. Netherton had Vector at the table.
- phantom_on_team:
    I had Malhotra. Netherton had Phantom at the table.
- else:
    I had Malhotra, on the line.
}
So who wasn't where somebody could see them at ten past?
+ [Quintero and Kowalczyk. They were in the tunnel.]
    Both forks come out by the service door. Either of them could have.
    -> support_hub
+ [Let me think about it.]
    Think fast. It's a short night.
    -> support_hub

// Clue 3's second half, read off the sheet on the table (S4-14).
=== signout ===
~ signout_read = true
Opened one fifty-two. Kowalczyk and Arakawa.
-> support_hub

// The line accusation (MC §5; CONTRACT §1.4). Same outcomes as face to face.
// The cost of a wrong name is said before "[Yes. Them.]", for every name
// alike, so the confirmation gives nothing away.
=== accuse ===
Go on. Who?
-> accuse_who

// Order carries no hint (SCRIPT_EDIT_R1 B-01): Malhotra, the name on the
// log, first; Kowalczyk neither first nor last.
=== accuse_who ===
+ {officer_out != "malhotra"} [Malhotra.]
    ~ hax_suspect = "malhotra"
    -> accuse_confirm
+ {officer_out != "arakawa" and not arakawa_ko} [Arakawa.]
    ~ hax_suspect = "arakawa"
    -> accuse_confirm
+ [Kowalczyk.]
    ~ hax_suspect = "kowalczyk"
    -> accuse_confirm
+ {officer_out != "quintero" and not quintero_ko} [Quintero.]
    ~ hax_suspect = "quintero"
    -> accuse_confirm
+ {vector_on_team and officer_out != "vector" and not vector_ko} [Vector.]
    ~ hax_suspect = "vector"
    -> accuse_confirm
+ {phantom_on_team and officer_out != "phantom" and not phantom_ko} [Phantom.]
    ~ hax_suspect = "phantom"
    -> accuse_confirm
+ [Not yet.]
    Then keep looking.
    -> support_hub

=== accuse_confirm ===
{officer_out != "" and hax_suspect != "kowalczyk": -> accuse_refused}
{
- hax_suspect == "kowalczyk":
    Kowalczyk breaches for us. If you're wrong, we lose our doors till you can clear her.
- hax_suspect == "quintero":
    Quintero leads on the ground. If you're wrong, nobody's at your back at the end.
- hax_suspect == "arakawa":
    Arakawa holds the county for us. If you're wrong, the sheriff starts asking questions.
- hax_suspect == "malhotra":
    Malhotra runs my relay. If you're wrong, I lose it till you can clear him.
- hax_suspect == "vector":
    Vector's at the table with Netherton. If you're wrong, Netherton's a pair of hands short.
- else:
    Phantom's at the table with Netherton. If you're wrong, Netherton's a pair of hands short.
}
+ [Yes. Them.]
    {hax_suspect == "kowalczyk": -> accuse_right}
    -> accuse_wrong
+ [Not yet.]
    Fine. It keeps.
    -> support_hub

// One wrong accusation at a time (MC §5): one fixed line per officer out.
=== accuse_refused ===
{
- officer_out == "malhotra":
    Get Malhotra back first.
- officer_out == "quintero":
    Get Quintero back first.
- officer_out == "arakawa":
    Get Arakawa back first.
- officer_out == "vector":
    Get Vector back first.
- else:
    Get Phantom back first.
}
-> support_hub

// Right. Written on the pick. wren_held when someone can hold her before the
// core: Quintero sent by the service side, or Kowalczyk already down in the van.
=== accuse_right ===
~ accused = "kowalczyk"
~ sleeper_caught = true
Kowalczyk. I'll put it to Netherton.
{
- kowalczyk_ko:
    ~ wren_held = true
    Director Magnus Netherton: She is already in the van. She stays there, and now she stays cuffed.
- hax_quintero_free():
    ~ wren_held = true
    Director Magnus Netherton: Agent Quintero. The service side. Detain Agent Kowalczyk, quietly.
    Agent 0x2D 'Anchor': Copy. Going.
- else:
    Director Magnus Netherton: I have nobody to send. Quintero is off the raid.
    Then she's heading for the core. You'll meet her there.
}
-> support_hub

// Wrong. Written on the pick. The officer's line on the net is also a hint
// (SE §3.4); Netherton's cost line where MC §5 has one.
=== accuse_wrong ===
~ officer_out = hax_suspect
~ wrong_accusation = true
I'll put it to Netherton.
{
- hax_suspect == "malhotra":
    Director Magnus Netherton: Officer Malhotra. Headset off, and sit in the van, please.
    Officer Dev Malhotra: Eleven years. Check the log again.
    That's my relay gone. I'll do what I can without it.
- hax_suspect == "quintero":
    Director Magnus Netherton: Agent Quintero, come back up to the post. Now, please.
    Agent 0x2D 'Anchor': I took the drain. I didn't pack the case. Read the sheet.
- hax_suspect == "arakawa":
    Director Magnus Netherton: Officer Arakawa, back to the post. The county will have to manage without you.
    Officer Kenji Arakawa: You were standing right next to me. Think.
- hax_suspect == "vector":
    Director Magnus Netherton: Vector, step away from the table, please.
    {m08_accused_vector:
        Agent 0x23 'Vector': You've done this to me once. Check it properly, then say sorry properly.
    - else:
        Agent 0x23 'Vector': Check it properly. Then say sorry properly.
    }
    Director Magnus Netherton: Then I am a pair of hands short. Carry on.
- else:
    Director Magnus Netherton: Phantom, step away from the table, please.
    Agent 0x88 'Phantom': Ask me for my list next time. It has a name on it, and it isn't mine.
    Director Magnus Netherton: Then I am a pair of hands short. Carry on.
}
-> support_hub

// Recalls (MC §5, S6-12): Netherton over HaX's channel, the officer's answer.
=== recall_malhotra ===
~ officer_out = ""
~ malhotra_recalled = true
Director Magnus Netherton: Officer Malhotra, you are cleared. Come back, and leave the face at the van.
Officer Dev Malhotra: Back on. Relay's up.
-> support_hub

=== recall_quintero ===
~ officer_out = ""
~ quintero_recalled = true
Director Magnus Netherton: Agent Quintero, you are cleared. Go back down.
Agent 0x2D 'Anchor': Next time, read the sheet first.
-> support_hub

=== recall_arakawa ===
~ officer_out = ""
~ arakawa_recalled = true
Director Magnus Netherton: Officer Arakawa, you are cleared. Back to it.
Officer Kenji Arakawa: You heard me on the phone to her. Then you thought I'd do this?
-> support_hub

=== recall_vector ===
~ officer_out = ""
~ vector_recalled = true
Director Magnus Netherton: Vector, you are cleared. Back to the table.
Agent 0x23 'Vector': I'll take the apology when you're out of there.
-> support_hub

=== recall_phantom ===
~ officer_out = ""
~ phantom_recalled = true
Director Magnus Netherton: Phantom, you are cleared. Back to the table.
Agent 0x88 'Phantom': Noted. It's going on the list.
-> support_hub

// ---------------- Act 2 and the core ----------------

// SE §3.1 "[What's still live?]": both shares by state, and what can still
// stop each. head_start_killed tells a spent console from an unused one.
=== whats_live ===
{
- share_zero_day == "traced":
    {
    - share_resale == "live":
        We're following Zero Day's. It goes at the lock, and we watch who catches it.
        The second buyer's goes with it. The console's done its one thing.
    - else:
        We're following Zero Day's. Nothing else goes.
    }
- share_zero_day == "stopped":
    {
    - share_resale == "live" and head_start_killed != "":
        Zero Day's is dead. The second buyer's still live, and the console's done its one thing.
    - share_resale == "live":
        Zero Day's is dead. The second buyer's still live. That one's the console or nothing.
    - share_resale == "stopped":
        Both stopped. Nothing goes at the lock.
    - else:
        Zero Day's is dead, and nobody else is buying. Nothing goes at the lock.
    }
- else:
    {
    - head_start_killed == "":
        Zero Day's is live. The console, or whoever's in the gallery.
    - else:
        Zero Day's is live. The console's spent, so it's whoever's in the gallery.
    }
    {share_resale == "live" and head_start_killed == "":
        The second buyer's live as well. Only the console stops that one.
    }
}
{m03_victoria_fate == "recruited":
    Sterling goes with whoever's winning.
}
{backdoor_channel_live and not backdoor_closed and not hax_backdoor_asked:
    -> backdoor_topic
}
-> support_hub

// Her four return lines, word for word (CONTRACT §1.6 "The release, said twice").
=== what_went_out ===
~ what_went_out_given = true
{
- head_start_out == "both":
    Confirmed. Both shares went at the lock.
- head_start_out == "zero_day":
    Confirmed. Zero Day's share went.
- head_start_out == "ghost":
    Confirmed. The resale went.
- else:
    Confirmed. Nothing left the lock.
}
{share_zero_day == "traced":
    We followed it out. Netherton has the trace.
}
-> support_hub

// C10's pointer, with the count by m07 branch (arc §6.3 item 4).
=== backdoor_topic ===
~ hax_backdoor_asked = true
{
- m07_team_redirected:
    Fourteen million systems on his backdoor channel, still open.
- else:
    Forty-seven million systems on his backdoor channel, still open.
}
It's holding a batch for the moment anyone stops his release. Close it at the console. One action, and it costs you nothing.
-> support_hub

// FA §6.2, in story terms only.
=== hatch_topic ===
~ hax_hatch_asked = true
Sealed section, east end of the hall. A Cold War maintenance hatch, painted over, and somebody's opened it since.
// Educational R1: "the disarm" read as something found on the machine; flag 3's effect in game is the stair.
The release service runs in a container on the host under it.
Get out of the container onto that host. That opens the way up to him.
-> support_hub

=== monitor_topic ===
~ hax_monitor_asked = true
Their monitoring watches the cameras and the doors. It's still software, and software has holes.
Get a foothold on it and their own eyes work for us.
-> support_hub

=== box_topic ===
~ hax_box_asked = true
He walled his box off, the way the release service was boxed in. Isolation like that can still be broken out of.
And he always builds his own way out first. Find his.
-> support_hub

// After flag 4 (MC §6.1): the feed, and the vault line with the purge.
=== console_fact ===
~ hax_console_asked = true
I've got his box. If anything goes out from that console, I can try to kill the feed. Try.
-> support_hub

=== vault_line ===
~ hax_vault_asked = true
The line into our vault is open from there. We left it open.
And if both copies die, the room purges. Doors, lights, all of it. He'll be ready for that. We won't.
-> support_hub

// The last net for the by-hand cut (OT §4.9). Exits after the cut, as the call does.
=== shutter_topic ===
-> cut_call

// ---------------- the release console (C9, C10; text, not voiced) ----------------

// Opened by the release console controls' mapping (CONTRACT §3.3), text.
// Re-opens on each click and shows only what is still open.
=== console ===
{ending != "": -> console_shut}
{
- head_start_killed == "":
    {share_zero_day == "stopped":
        {vos_secret_used:
            Vos cancelled Zero Day's. Nothing to follow.
        - else:
            She cancelled Zero Day's. Nothing to follow.
        }
    }
    {
    - share_zero_day == "live":
        One feed. Kill it or follow it. Pick.
    - ghost_sale == "bait" and share_resale == "live":
        The resale's live. I can kill it. One go.
    - backdoor_channel_live and not backdoor_closed:
        No share left to touch. His backdoor's still open.
    - else:
        No share left to touch.
    }
- backdoor_channel_live and not backdoor_closed:
    The share's done. His backdoor's still open.
- else:
    That console's done all it can for us.
}
-> console_menu

// Walkthrough R1b-m1: after his ending the console is closed (nothing on Join).
=== console_shut ===
{ending != "joined":
    That console's done all it can for us.
}
+ [Leave it.]
    #exit_conversation
    -> DONE

=== console_menu ===
+ {head_start_killed == "" and share_zero_day == "live"} [Kill Zero Day's.]
    ~ head_start_killed = "zero_day"
    Done. Zero Day's share is dead. Nobody follows it now.
    -> console_menu
+ {head_start_killed == "" and ghost_sale == "bait" and share_resale == "live"} [Kill the resale.]
    ~ head_start_killed = "ghost"
    Done. Five buyers just paid for nothing.
    -> console_menu
+ {head_start_killed == "" and share_zero_day == "live"} [Let it run. Trace who gets it.]
    ~ head_start_killed = "trace"
    Following it. It goes at the lock, and we watch who catches it.
    -> console_menu
+ {backdoor_channel_live and not backdoor_closed} [Close the backdoor.] -> console_backdoor
+ [Leave it for now.]
    {head_start_killed == "":
        It'll be here. Their head start won't wait for it.
    - else:
        Fine.
    }
    #exit_conversation
    -> DONE

// C10: one action, free, with a confirmation and a HaX line.
=== console_backdoor ===
Close his backdoor channel? One action. It doesn't touch the shares.
+ [Close it.]
    ~ backdoor_closed = true
    Closed. Whatever it was holding stays held.
    -> console_menu
+ [Not yet.]
    Your call.
    -> console_menu

// ---------------- voiced calls ----------------

// OT §4.1, SE §3.1. Netherton on the net; Nightshade's second word on the
// tether. No narrator.
=== breach_call ===
Director Magnus Netherton: Breach. Go.
{
- nightshade_tethered:
    Agent 0x47 'Nightshade': Manual.
    He's on the crank. Their reader never saw you.
- override_held:
    It's read your badge. Your key kept it off their board. He knows; they don't.
- else:
    It's read your badge. They know you're in.
}
{m09_deck_pulled == "alpha_tapes":
    The best lock there is. Tape two.
}
-> hax_close_way

=== inner_door_call ===
Inner door's on their monitoring. I've got it.
-> hax_close_got

// OT §4.3: named as Nightshade's doing, with the way round in the same breath.
=== tripwire_call ===
That's Nightshade's entry. The door's locked from their side, and they know we're coming.
There's a ladder at the guard post. Up and round.
-> hax_close_way

=== ladder_call ===
Up the shaft. The release is on the corridor wall. Throw it and come back down.
Door's yours.
-> hax_close_way

=== stair_call ===
Stair's open. Workshop floor's below you.
-> hax_close_way

// OT §4.4, arc §6.3 item 8 and §6.5. Named gallery_open_call: the contract's
// "gallery_open" is also a global, and ink rejects the clash. disableClose: true, lines only, so a
// re-open replays it. The warnings she owes, then the sweep line and the next
// door, unless Malhotra's relay is gone: then static after the warnings.
=== gallery_open_call ===
{head_start_killed == "" and head_start_out == "":
    Fifteen minutes to their head start. That console's your last chance at it.
}
{m03_victoria_fate == "recruited":
    Sterling goes with whoever's winning. Show her the order, and she'll know we read Zero Day's mail.
}
{officer_out == "malhotra":
    Netherton sweeps the... I'm losing y...
    -> hax_close_und
}
Netherton sweeps the whole place at six. Whoever you leave standing up there, he collects.
Up the stair, along the walkway, the lock's at the far end. He's jamming me.
You're on your own for one room. I'll be at the door.
{m03_victoria_fate == "arrested" and not victoria_line_done:
    Sterling's still on the line. She has something on Vos.
}
-> hax_close_und

// The by-hand cut (CONTRACT §1.6), HaX's voice. Her own guarded resume knot:
// it routes on cut_step, so a re-ring, the hub topic or a reload lands on the
// first unanswered step. No resume on the mapping (§4.3).
=== cut_call ===
{gallery_shutter_cut:
    Shutter's already dead. Nothing left to do in there.
    -> hax_close_right
}
{
- cut_step >= 2:
    -> cut_step_2
- cut_step == 1:
    -> cut_step_1
- else:
    -> cut_step_0
}

=== cut_step_0 ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
It's falling to us, then. The isolator's on the wall by the old board.
A key switch and a breaker row, labelled GALLERY SHUTTER.
+ [I'm at it.]
    ~ cut_step = 1
    -> cut_step_1
+ [Give me a minute.]
    Ring me when you're standing at it.
    #exit_conversation
    -> DONE

=== cut_step_1 ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
Turn the key a quarter. That takes the row off their board.
+ [Key's turned.]
    ~ cut_step = 2
    -> cut_step_2
+ [Give me a minute.]
    Take it. The key won't turn itself.
    #exit_conversation
    -> DONE

=== cut_step_2 ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
Top row. The third breaker from the left feeds the shutter.
-> cut_breakers

=== cut_breakers ===
// Alignment R10-m2: a reopened step re-runs this knot, so a shutter cut meanwhile ends the call.
{gallery_shutter_cut:
    -> cut_call
}
+ {not gallery_camera_blinded} [And the gallery camera?]
    ~ gallery_camera_blinded = true
    Fourth one along. Throw it as well. Their monitor up there just went dark.
    -> cut_breakers
+ [Pulling it.]
    ~ cut_step = 3
    ~ gallery_shutter_cut = true
    That's the shutter. It's dead.
    -> hax_close_way
+ [Give me a minute.]
    Third from the left. I'll be here.
    #exit_conversation
    -> DONE

// Stage 9 final check (m09 CONTRACT §15 pattern): the phone closes ~3 ms after
// the last line before #exit_conversation, so a call whose last line carries
// information ends on a short unvoiced player reply. Flags are set before it.

=== hax_close_way ===
+ [On my way.]
    #exit_conversation
    -> DONE

=== hax_close_got ===
+ [Got it.]
    #exit_conversation
    -> DONE

=== hax_close_und ===
+ [Understood.]
    #exit_conversation
    -> DONE

=== hax_close_right ===
+ [Right.]
    #exit_conversation
    -> DONE
