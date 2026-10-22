INCLUDE m10_carryover_vars.ink
VAR end_quiet = false   // end_rest: skip the line once after an exit
// m10 Full Disclosure: Agent 0x47 'Nightshade' (group C).
// NPC ids: nightshade_table (currentKnot table), nightshade_van (van),
// nightshade_blast (blast), nightshade_lock (lock). All koImmune.
// The door scene (MC §3.1, CONTRACT §1.5). Every closing choice writes
// tripwire_armed, then door_scene_done. Re-entry routes on globals, never on
// saved position. Netherton and HaX speak here as second speakers.

VAR ns_quiet = false        // skip the re-entry line once after an exit
VAR ns_paid = false         // the shown or unshown payment has been said
VAR ns_close_seen = false   // shown branch: the closing costs have been said
VAR ns_costs_said = false   // unshown branch: the closing costs have been said
VAR ns_arr_seen = false     // arrested branch: the opening has played

=== start ===
{ending != "": -> end_rest}
{
- outer_lock_open and nightshade_taken_in:
    -> lock
- breach_open and nightshade_tethered:
    -> blast
- door_branch() == "silent":
    -> van
- else:
    -> table
}

// ---------------------------------------------------------------
// The table: router for the three talking branches.
// ---------------------------------------------------------------
=== table ===
{ending != "": -> end_rest}
{door_scene_done:
    -> table_rest
}
~ temp b = door_branch()
{
- b == "shown":
    -> shown
- b == "unshown":
    -> unshown
- b == "arrested":
    -> arrested
- else:
    -> van
}

// ---------------------------------------------------------------
// Kept, shown his file. Pays in full, names entry 3 as the lie,
// hands over the override on both options.
// ---------------------------------------------------------------
=== shown ===
// Moved from table (inklint): each branch tests its own resume point, so another branch's menu isn't charged with it.
{ns_paid or override_held:
    -> shown_close
}
Agent 0x47 'Nightshade': He wrote fifteen years of me in his own hand. I'd know it anywhere. I learned to write like it.
Agent 0x47 'Nightshade': So you'll have all of it. Every door down there, and the catalogue entry he built it from.
{m09_completed:
    Agent HaX: Helena gave us the entries he built from. Not which door each one's on, or who stands where.
}
+ [Go on. All of it.]
    -> shown_doors
+ [Why give it all now?]
    Agent 0x47 'Nightshade': You sent me his file. After that there was no side left for me to be quiet about.
    -> shown_doors

= shown_doors
Agent 0x47 'Nightshade': The blast door reads one badge by name. Yours. The tunnel post changes shift at half two, and stands empty for a quarter of an hour.
Agent 0x47 'Nightshade': Entry three, the inner door. He told me to call it original, plain steel, no interlock. That one's wrong.
Agent 0x47 'Nightshade': He gave it me to give to you. Helena's drawings have the interlock. Believe the drawings.
+ [Why would he lie to you?]
    Agent 0x47 'Nightshade': Because he expected me to sell you, and wanted the sale to cost you something. He was half right. He usually is.
    -> shown_override
+ [And the rest of it is true?]
    Agent 0x47 'Nightshade': The rest is true. I checked it against the drawings myself, which is more than he ever expected of me.
    -> shown_override

= shown_override
#give_item:key:alarm_override
Agent 0x47 'Nightshade': And this is what I was keeping. The office's alarm board. Carry this and it doesn't talk to the floors below.
{whodunit_live:
    ~ ns_borrow_hint = true  // scenario design R2 m2: a method, not an alibi; clue_alibi stays HaX's
    Agent 0x47 'Nightshade': One more, from a man who did it for fifteen years. They always borrow a badge, and it's never the borrower's.
    Agent 0x47 'Nightshade': Look for whoever went where nobody watches.
}
~ ns_paid = true
-> shown_close

=== shown_close ===
{door_scene_done:
    -> table_rest
}
{ns_quiet:
    ~ ns_quiet = false
    -> shown_menu
}
{ns_close_seen:
    Agent 0x47 'Nightshade': {&You're back. Where do I stand?|Still deciding where to put me? Take your time.}
    -> shown_menu
}
~ ns_close_seen = true
Agent 0x47 'Nightshade': I'd like one thing for it. To see his face when he works out whose hand turned me.
Director Magnus Netherton: Leave him here and nobody below sees him with us. He stays useful.
Director Magnus Netherton: Take him down there and every guard in the place sees him with us. After tonight he gets a new name, and nobody reaches him again. Not even you.
-> shown_menu

=== shown_menu ===
+ [Stay at the post.]
    ~ nightshade_taken_in = false
    ~ tripwire_armed = nightshade_map_used and not payment_checked
    ~ door_scene_done = true
    Agent 0x47 'Nightshade': I'd have liked to see his face. *quietly* I'll settle for knowing you did.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest
+ [Come with us. You can see his face.]
    ~ nightshade_taken_in = true
    ~ tripwire_armed = nightshade_map_used and not payment_checked
    ~ door_scene_done = true
    Agent 0x47 'Nightshade': Then I'll hold your door at the lock. Nobody comes up the walkway behind you while I'm on it.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest
+ [Give me a minute.]
    Agent 0x47 'Nightshade': Take it. I've had fifteen years to think about this door.
    ~ ns_quiet = true
    #exit_conversation
    -> shown_close

// ---------------------------------------------------------------
// Kept, not shown. Pays warmly; entry 3 is wrong and he doesn't say so.
// The check (S6-16) is a puzzle; the closing choice is map or plans.
// ---------------------------------------------------------------
=== unshown ===
{ns_paid or payment_read:
    -> unshown_close
}
{m08_triple_agent_first_payment:
    Agent 0x47 'Nightshade': I said I'd pay when you stood at the door. Every door, and where he got the idea.
- else:
    Agent 0x47 'Nightshade': All of it, as promised. Every door, and where he got the idea.
}
#give_item:notes:nightshade_payment
Agent 0x47 'Nightshade': The defences, written out as he briefed them to me. Read it before you go down.
// Ruling 6: on an m09 save the pointer also sets m09's flag 4 list apart.
{m09_completed:
    Agent HaX: Helena gave us the entries he built from. Not which door each one's on. Check his against the plans.
- else:
    Agent HaX: He's brought his payment. You've got Helena's plans.
}
Director Magnus Netherton: I am keeping him. If he burns you twice, that is on my signature as well.
+ [What does he get out of this?]
    Agent 0x47 'Nightshade': A little longer being useful to both sides. I'm honest about that, at least.
    -> unshown_extras
+ [I'll read it.]
    Agent 0x47 'Nightshade': Do. It's the best thing I've written in years.
    -> unshown_extras

= unshown_extras
{whodunit_live:
    ~ ns_borrow_hint = true  // scenario design R2 m2: a method, not an alibi; clue_alibi stays HaX's
    Agent 0x47 'Nightshade': Something free, since it isn't in the payment. They always borrow a badge, and it's never the borrower's.
    Agent 0x47 'Nightshade': Look for whoever went where nobody watches.
}
{m09_cage_bin == "nightshade_copy":
    Agent 0x47 'Nightshade': You read what I cleared. Then you know I kept his notes.
}
~ ns_paid = true
-> unshown_close

=== unshown_close ===
{door_scene_done:
    -> table_rest
}
{ns_quiet:
    ~ ns_quiet = false
    -> unshown_menu
}
{ns_costs_said:
    Agent 0x47 'Nightshade': {&My map, or her plans. I'm paid either way.|Still choosing? The post changes at half two whatever you decide.}
    -> unshown_menu
}
~ ns_costs_said = true
Agent 0x47 'Nightshade': My map has the refit. The tunnel post empties at half two. Helena's plans don't know the post exists.
Agent HaX: He's only as right as the man who briefed him.
Director Magnus Netherton: The plans are good plans. They are old plans.
-> unshown_menu

// Ruling 4 (STAGE_8_RULINGS): with m09 unplayed, the not-shown choice was never
// offered, so his map is true (the payment's entry 3 reads correct in JSON), no
// check, no tripwire.
=== unshown_menu ===
+ {m09_completed and payment_read and plans_read and not payment_checked} [Your inner door entry says 1962, no interlock. Helena's 1962 drawings have one.]
    ~ payment_checked = true
    Agent 0x47 'Nightshade': *smiles* You read your homework.
    Agent 0x47 'Nightshade': He told me original, unchanged, and I wrote what I was told. Go by the drawings for that door.
    ~ ns_quiet = true
    -> unshown_close
+ [We'll go by your map.]
    ~ nightshade_map_used = true
    ~ tripwire_armed = nightshade_map_used and not payment_checked and m09_completed
    ~ door_scene_done = true
    Agent 0x47 'Nightshade': Then the post is empty at half two. Go in when it is.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest
+ [Helena's plans will do.]
    ~ nightshade_map_used = false
    ~ tripwire_armed = nightshade_map_used and not payment_checked
    ~ door_scene_done = true
    Agent 0x47 'Nightshade': The originals. He'll have a man at the post, and I'll have a chair at this table. Nobody's surprised.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest
+ [Give me a minute.]
    Agent 0x47 'Nightshade': Read, then. I'll be here.
    ~ ns_quiet = true
    #exit_conversation
    -> unshown_close

// ---------------------------------------------------------------
// Arrested. First line writes nightshade_deal = "refused".
// Refusing is the closing choice; the deal hands over the payment and
// moves to deal_close, where the check is still possible.
// ---------------------------------------------------------------
=== arrested ===
{nightshade_deal == "":
    ~ nightshade_deal = "refused"
}
{nightshade_map_used:
    -> deal_close
}
{ns_quiet:
    ~ ns_quiet = false
    -> arrested_menu
}
{ns_arr_seen:
    Agent 0x47 'Nightshade': {&Still deciding? I'm in no hurry. I'm in cuffs.|I'm still here. The cuffs see to that.}
    -> arrested_menu
}
~ ns_arr_seen = true
Agent 0x47 'Nightshade': You said no deals. Netherton says otherwise tonight. I'd like to hear what you say.
Agent 0x47 'Nightshade': Name the deal and you get the refit. Every door he changed, as he briefed it to me before Portland.
{m09_cage_bin == "nightshade_copy":
    Agent 0x47 'Nightshade': You read what I cleared. Then you know I kept his notes.
}
Director Magnus Netherton: Without him you have Helena's plans. They are good plans. They are old plans.
{m09_completed:
    Agent HaX: Helena gave us his entries, not where each one sits. He's only as right as the man who briefed him.
- else:
    Agent HaX: He's only as right as the man who briefed him.
}
-> arrested_menu

=== arrested_menu ===
// inklint skipped-guard: unreachable today (ending needs the core, the core needs the breach, and on this branch only these picks set door_scene_done), kept so a reopen can never offer a deal after the night ends.
{ending != "": -> end_rest}
+ [No deals. I said it then.]
    ~ nightshade_deal = "refused"
    ~ nightshade_map_used = false
    ~ tripwire_armed = nightshade_map_used and not payment_checked
    ~ door_scene_done = true
    Agent 0x47 'Nightshade': Twice, then. You're the only one who's ever said it to me twice.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest
+ [Name them. You'll get your deal.]
    ~ nightshade_deal = "taken"
    ~ nightshade_map_used = true
    #give_item:notes:nightshade_payment
    Agent 0x47 'Nightshade': Then here it is. Everything he'd built by the spring, written out the way he told it to me.
    {whodunit_live:
        ~ ns_borrow_hint = true  // scenario design R2 m2: a method, not an alibi; clue_alibi stays HaX's
        Agent 0x47 'Nightshade': And something he never briefed. They always borrow a badge, and it's never the borrower's.
        Agent 0x47 'Nightshade': Look for whoever went where nobody watches.
    }
    -> deal_close
+ [Give me a minute.]
    Agent 0x47 'Nightshade': I've had months. Have a minute.
    ~ ns_quiet = true
    #exit_conversation
    -> arrested

=== deal_close ===
{door_scene_done:
    -> table_rest
}
{ns_quiet:
    ~ ns_quiet = false
- else:
    Agent 0x47 'Nightshade': {&The deal's done. Whether you trust it is your affair.|Read it, then go. Netherton will want his signature dry.}
}
+ {payment_read and plans_read and not payment_checked} [Your inner door entry says 1962, no interlock. Helena's 1962 drawings have one.]
    ~ payment_checked = true
    Agent 0x47 'Nightshade': *smiles* You read your homework.
    Agent 0x47 'Nightshade': He told me original, unchanged. So he lied to me as well. I'd wondered what I was worth to him.
    ~ ns_quiet = true
    -> deal_close
+ [That'll do. We go by your map.]
    ~ tripwire_armed = nightshade_map_used and not payment_checked
    ~ door_scene_done = true
    Agent 0x47 'Nightshade': Then the post is empty at half two. Go in when it is.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest
+ [Give me a minute.]
    Agent 0x47 'Nightshade': Take it. Read it twice.
    ~ ns_quiet = true
    #exit_conversation
    -> deal_close

// ---------------------------------------------------------------
// After the closing choice: one resting line by branch.
// ---------------------------------------------------------------
=== table_rest ===
{ns_quiet:
    ~ ns_quiet = false
- else:
    ~ temp b = door_branch()
    {
    - b == "shown" and nightshade_taken_in:
        Agent 0x47 'Nightshade': When the lock opens, I'll be behind you. Go on.
    - b == "shown":
        Agent 0x47 'Nightshade': I'll be here. Out of sight is where I'm useful.
    - b == "unshown" and nightshade_map_used:
        Agent 0x47 'Nightshade': You have my map. Use it while it's still true.
    - b == "unshown":
        Agent 0x47 'Nightshade': Old plans. He'd be pleased someone still reads the originals.
    - nightshade_deal == "taken":
        Agent 0x47 'Nightshade': That's all I knew before Portland. The rest you'll find for yourself.
    - else:
        Agent 0x47 'Nightshade': You kept your word. I'll keep my chair.
    }
}
+ [I'll see you after.]
    Agent 0x47 'Nightshade': Go carefully. He's thought about you for longer than you've thought about him.
    ~ ns_quiet = true
    #exit_conversation
    -> table_rest

// ---------------------------------------------------------------
// Silent, or never played: one word. The tether question is Netherton's.
// ---------------------------------------------------------------
=== van ===
{ending != "": -> end_rest}
{ns_quiet:
    ~ ns_quiet = false
- else:
    Agent 0x47 'Nightshade': Door.
}
+ [(Leave him be.)]
    ~ ns_quiet = true
    #exit_conversation
    -> van

// The tether at the blast door. "Manual." itself is on the net (HaX's breach_call).
=== blast ===
{ending != "": -> end_rest}
{ns_quiet:
    ~ ns_quiet = false
- else:
    Agent 0x47 'Nightshade': The old doors were the honest ones. A crank, and a man to turn it.
}
+ [Thank you.]
    Agent 0x47 'Nightshade': Don't. Go on down.
    ~ ns_quiet = true
    #exit_conversation
    -> blast

// Taken in, at the outer lock. "Go on. I've got the door." is a bark (JSON).
=== lock ===
{ending != "": -> end_rest}
{ns_quiet:
    ~ ns_quiet = false
- else:
    Agent 0x47 'Nightshade': Nobody comes up the walkway while I'm here. Go and look at him for me.
}
+ [I will.]
    Agent 0x47 'Nightshade': Tell me after whether he knew.
    ~ ns_quiet = true
    #exit_conversation
    -> lock

// Stage 9 walkthrough R1b-M1: after his ending, nothing in-raid. One quiet line
// by ending, none from SAFETYNET people on Join (a narrator beat), and the exit.
=== end_rest ===
{
- end_quiet:
    ~ end_quiet = false
- ending == "joined":
    Narrator: Nightshade watches you go and says nothing.
- ending == "executed":
    Narrator: Nightshade says nothing.
- ending == "scorched":
    Agent 0x47 'Nightshade': Gone in the dark. He always did like an exit.
- else:
    Agent 0x47 'Nightshade': It's done, then. Tell me how, one day.
}
+ [(Leave it.)]
    ~ end_quiet = true
    #exit_conversation
    -> end_rest
