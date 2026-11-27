// Office life slice 5 (office_life/DIALOGUE_SAMPLE.md, clips 17 to 37). Short-form conversation on the
// m03 hub pattern, plus three exchange knots Zainab owns with Yusuf. Day only: she is hidden at night.

// Synced scenario global: an attack on either day member of staff, or Ffion knocked out by day.
VAR wh_staff_upset = false
// Set by the engine once a line of each exchange was heard.
VAR heard_ex_open_door = false
VAR heard_ex_tailgate = false
VAR heard_ex_client_sites = false
// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false
// Set after the first meeting, so a reload does not replay the greeting.
VAR met_player = false

// Root divert: a finished conversation restarts from the root (npc-conversation-state.js).
-> start

=== start ===
{wh_staff_upset:
    -> upset
}
{met_player:
    ~ hub_quiet = false
    -> hub
}
~ met_player = true
~ hub_quiet = true
Zainab Hussain: Hiya. Here to see Sterling? Good luck.
-> hub

=== hub ===
{wh_staff_upset:
    -> upset
}
{hub_quiet:
    ~ hub_quiet = false
- else:
    Zainab Hussain: Still about? The sofa's not getting any comfier.
}
* [Why are you working out here?]
    Zainab Hussain: Bench room's full of test kit, so this is my desk.
    Zainab Hussain: Ffion lets me plug in, and I bring her biscuits. Fair trade.
    ~ hub_quiet = true
    -> hub
* [Been with WhiteHat long?]
    Zainab Hussain: Since the spring. I came down from Leeds, and I'm still on the road most days.
    Zainab Hussain: Eight years of vans and trains. I left a tablet on a train once. Never again.
    ~ hub_quiet = true
    -> hub
* [Any chance you could badge me through to the back?]
    Zainab Hussain: Visitor passes are Ffion's job, not mine.
    Zainab Hussain: Anyway, this lanyard's only got my van keys on it.
    ~ hub_quiet = true
    -> hub
+ [I'll let you get on.]
    Zainab Hussain: Ta-ra, love.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== upset ===
Zainab Hussain: Stay away from me. I mean it.
#exit_conversation
-> DONE

// Exchanges. Each first line stands alone; the engine plays them on a separate story.
=== ex_open_door ===
Zainab Hussain: Sterling says her door's always open.
Yusuf Demir: It is. Nobody gets past it.
Zainab Hussain: Who are the after-hours lot, then?
Yusuf Demir: Not our clients. Not our business.
-> DONE

=== ex_tailgate ===
Zainab Hussain: Someone followed me in this morning.
Yusuf Demir: And you held the door for them.
Zainab Hussain: They had a lanyard. And a coffee.
Yusuf Demir: A coffee isn't a badge. Write it up.
-> DONE

=== ex_client_sites ===
Yusuf Demir: Is Danny back from client sites yet?
Zainab Hussain: Evenings only, these days, I hear.
Yusuf Demir: Must be some client.
-> DONE
