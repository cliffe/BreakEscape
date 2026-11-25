// Passwords showcase host: Ama Owusu (person, office).
// Contract: SHOWCASE_PLAN 8.3.1 (passwords). Hub knot is hub; levers and recap knots divert back to hub.choices.
// Every VAR down to read_log_done is a scenario global (same initial value), synced in when the talk starts.
// Ink ticks set <task>_done beside #complete_task. No line names a fact, password or code.
// get_records ticks by itself (Ama's item_picked_up mapping); the claims below are offered only once
// the player could have done the thing (round 1 dialogue review M1).

VAR coffee_call = 0
VAR ask_weekend = 0
VAR act_midday = false
VAR act_evening = false
VAR kitchen_seen = false
VAR it_room_seen = false
VAR partner_office_seen = false
VAR heard_exchange_cooler_chat = false
VAR se_intel_delphine_dog_name = false
VAR se_intel_delphine_dog_year = false
VAR earn_facts_done = false
VAR get_records_done = false
VAR crack_guessable_done = false
VAR crack_reused_done = false
VAR crack_strong_done = false
VAR user_signin_done = false
VAR usb_refused_done = false
VAR admin_signin_done = false
VAR profile_read_done = false
VAR override_done = false
VAR read_log_done = false
VAR ask_jun = 0
VAR jun_pc_off = false
VAR hot_desk_signin_done = false
VAR collect_partner_done = false
VAR see_borrow_done = false
VAR collect_hot_desk_done = false
VAR crack_cached_done = false
VAR local_account_done = false
VAR local_refused_done = false
// Ink-local: the opening plays once; each recap plays once; two one-off lines.
VAR met_ama = false
VAR told_free_play = false
VAR asked_cooler = false
VAR recapped_facts = false
VAR recapped_records = false
VAR recapped_guessable = false
VAR recapped_reused = false
VAR recapped_strong = false
VAR recapped_user = false
VAR recapped_usb = false
VAR recapped_admin = false
VAR recapped_profile = false
VAR recapped_override = false
VAR recapped_log = false
VAR recapped_collect_partner = false
VAR recapped_borrow = false
VAR recapped_collect_hot_desk = false
VAR recapped_crack_cached = false
VAR recapped_local = false
VAR recapped_refused = false

=== start ===
{ met_ama:
    -> hub
}
~ met_ama = true
# speaker:npc
I'm Ama, from Fenlow. We look after the IT here.
# speaker:npc
Someone left a box of old password records in the confidential waste.
# speaker:npc
Show the partners why that matters. Come back and tell me what you find, and I'll tick it off.
-> hub.choices

=== hub ===
# speaker:npc
What can I help with?
- (choices)
+ { not earn_facts_done and se_intel_delphine_dog_name and se_intel_delphine_dog_year } [Here's what I learnt about Delphine.]
    -> tell_facts
+ { get_records_done and se_intel_delphine_dog_name and se_intel_delphine_dog_year and not crack_guessable_done } [I cracked Delphine's record.]
    -> tell_crack_guessable
+ { get_records_done and not crack_reused_done } [I cracked Graham's record.]
    -> tell_crack_reused
+ { get_records_done and not crack_strong_done } [I tried Julian's record twice.]
    -> tell_crack_strong
+ { admin_signin_done and not profile_read_done } [I opened Julian's client files.]
    -> tell_profile
+ [What's next?]
    -> whats_next
+ { not act_evening } [Send them for coffee.]
    -> lever_coffee
+ { not act_evening } [Could you ask Delphine about her weekend?]
    -> lever_weekend
+ { not act_midday } [Send them to lunch.]
    -> lever_lunch
+ { act_midday and not act_evening } [Call it a day.]
    -> lever_day_end
+ { heard_exchange_cooler_chat and not asked_cooler } [What was that at the cooler?]
    -> cooler
+ { earn_facts_done or get_records_done } [What did that show?]
    -> recap
+ { act_evening } [Give me the short version.]
    -> short_version
+ { admin_signin_done and not collect_partner_done } [I collected what Julian's PC remembers.]
    -> tell_collect_partner
+ { see_borrow_done and hot_desk_signin_done and not collect_hot_desk_done } [I collected at the hot desk.]
    -> tell_collect_hot_desk
+ { collect_hot_desk_done and not crack_cached_done } [I cracked one of those records.]
    -> tell_crack_cached
+ { local_account_done and not local_refused_done } [I tried the shared desk account at Julian's PC.]
    -> tell_local_refused
+ { not act_evening and not jun_pc_off } [Switch Jun's PC off.]
    -> lever_jun_off
+ { not act_evening and jun_pc_off } [Switch Jun's PC back on.]
    -> lever_jun_on
+ { not act_evening } [Could you ask Jun what he's been up to?]
    -> lever_jun_post
+ [I'll have a look round.]
    # speaker:npc
    Go on. I'll be here.
    # exit_conversation
    -> END

=== whats_next ===
{
    - not earn_facts_done and se_intel_delphine_dog_name and se_intel_delphine_dog_year:
        # speaker:npc
        You've got two things about Delphine. Tell me what you learnt.
    - not earn_facts_done:
        { not se_intel_delphine_dog_year:
            # speaker:npc
            Delphine posts on the office feed. Read it on the tablet in the kitchen.
            # speaker:npc
            If she hasn't posted yet, ask me to ask about her weekend.
        }
        { not se_intel_delphine_dog_name:
            # speaker:npc
            Her desk photo tells you more. Ask me to send them for coffee, and take it while she's away.
        }
    - not get_records_done and not act_midday:
        # speaker:npc
        The records are in the bin in the IT room, and Graham sits right there.
        { not (kitchen_seen and it_room_seen and partner_office_seen):
            # speaker:npc
            Walk round the kitchen, the IT room and the partner's office first.
        }
        # speaker:npc
        Then ask me to send them to lunch, and the room empties.
    - not get_records_done:
        # speaker:npc
        Search the confidential-waste bin in the IT room. Take all three record files.
    - not crack_guessable_done:
        # speaker:npc
        Open the capture log in your inventory. Crack Delphine's record with both things you learnt, then tell me.
    - not crack_reused_done:
        # speaker:npc
        There's a printer admin note in the cupboard by the printers. Take it.
        # speaker:npc
        Then crack Graham's record. It's salted, so every guess takes longer. Wait for it.
        # speaker:npc
        If you pressed Crack before you had the note, run it again now.
    - not crack_strong_done:
        # speaker:npc
        Try Julian's record. Try it twice, then tell me.
    - not user_signin_done:
        # speaker:npc
        Sign in at Delphine's PC with her password once she's left it.
    - not usb_refused_done:
        # speaker:npc
        Plug the USB stick into the port on Delphine's desk.
    - not admin_signin_done and not act_midday:
        # speaker:npc
        Julian's at his desk until his client lunch. Ask me to send them to lunch.
    - not admin_signin_done:
        # speaker:npc
        Julian's out at his client lunch. Sign in at his PC as Graham.
    - not profile_read_done:
        # speaker:npc
        Open Client files in Julian's profile, then tell me. Delphine's sign-in never could.
    - not override_done:
        # speaker:npc
        Still at Julian's PC as Graham? Plug the keystroke device into the socket beside it.
    - not collect_partner_done:
        # speaker:npc
        Still signed in at Julian's PC as Graham? Use Cached accounts on its desktop, then tell me.
    - not see_borrow_done:
        # speaker:npc
        Ask me to switch Jun's PC off, and watch where he goes. Do it before you call it a day.
    - not hot_desk_signin_done or not collect_hot_desk_done:
        # speaker:npc
        Jun left the hot desk signed in. Sign in there as Graham and use Cached accounts, then tell me.
    - not crack_cached_done:
        # speaker:npc
        Crack one of the records you collected. A weak one falls at once. Then tell me.
    - not local_account_done:
        # speaker:npc
        Graham's rota talks about a shared desk account. Its record is in the IT room. Crack it, then sign in at Delphine's PC.
        # speaker:npc
        Type the name and password under Other user.
    - not local_refused_done:
        # speaker:npc
        Now try the same account at Julian's PC. Look at what the sign-in screen says, then tell me.
    - not read_log_done and not act_evening:
        # speaker:npc
        You've done the hands-on part. Tell me to call it a day.
    - not read_log_done:
        # speaker:npc
        Open the sign-in log terminal in the IT room. Find your own rows, then flag the night-time failure.
    - else:
        # speaker:npc
        That's everything. Look round as long as you like.
}
{ crack_reused_done and act_midday and not act_evening and not told_free_play:
    ~ told_free_play = true
    # speaker:npc
    Next time Graham's away from his desk, try that password on his PC. Same password, typed by hand.
}
-> hub.choices

=== tell_facts ===
# speaker:npc
Good. Two different places, two things she shares without a thought.
# speaker:npc
Keep both. A cracker needs them.
#complete_task:earn_facts
~ earn_facts_done = true
-> hub.choices

=== tell_crack_guessable ===
# speaker:npc
Her password was built from things she posts. Guessing was enough.
#complete_task:crack_guessable
~ crack_guessable_done = true
-> hub.choices

=== tell_crack_reused ===
# speaker:npc
One person, one password, two accounts. That's reuse.
# speaker:npc
Once you hold one, you hold the other.
#complete_task:crack_reused
~ crack_reused_done = true
-> hub.choices

=== tell_crack_strong ===
# speaker:npc
Julian's won't fall. Long and random beats guessing.
#complete_task:crack_strong
~ crack_strong_done = true
-> hub.choices

=== tell_profile ===
# speaker:npc
An administrator reaches what a user can't. That's the real cost.
#complete_task:profile_read
~ profile_read_done = true
-> hub.choices

=== tell_collect_partner ===
# speaker:npc
Julian's PC remembers who signed in. An administrator gets the stored records, never the passwords.
#complete_task:collect_partner
~ collect_partner_done = true
-> hub.choices

=== tell_collect_hot_desk ===
# speaker:npc
Jun's record only turned up because he borrowed the PC. Anyone who signs in leaves something behind.
#complete_task:collect_hot_desk
~ collect_hot_desk_done = true
-> hub.choices

=== tell_crack_cached ===
# speaker:npc
Same cracker, new source. A weak password falls whatever the PC.
#complete_task:crack_cached
~ crack_cached_done = true
-> hub.choices

=== tell_local_refused ===
# speaker:npc
The sign-in screen names the domain. A domain account works across it. A local account stays on its own PCs.
# speaker:npc
So the shared account opens every desk it's on, and not Julian's.
#complete_task:local_refused
~ local_refused_done = true
-> hub.choices

=== lever_jun_off ===
# speaker:npc
I'll flick the switch at the wall. Watch what Jun does.
#set_global:jun_pc_off:true
~ jun_pc_off = true
-> hub.choices

=== lever_jun_on ===
# speaker:npc
Back on again.
#set_global:jun_pc_off:false
~ jun_pc_off = false
-> hub.choices

=== lever_jun_post ===
# speaker:npc
I'll ask Jun what he's been up to. Give him a minute.
~ ask_jun = ask_jun + 1
-> hub.choices

=== cooler ===
~ asked_cooler = true
# speaker:npc
Graham and Niamh, same time every day. Habits like that are what a guesser lives on.
-> hub.choices

=== lever_coffee ===
# speaker:npc
I'll tell them the coffee's on.
~ coffee_call = coffee_call + 1
-> hub.choices

=== lever_weekend ===
# speaker:npc
I'll ask Delphine how her weekend went. Give her a minute.
~ ask_weekend = ask_weekend + 1
-> hub.choices

=== lever_lunch ===
// Needs only pick targets in loaded rooms, and an NPC in a room not yet loaded hears no event.
// So lunch waits until the kitchen, the IT room and the partner's office have all been seen.
{ not (kitchen_seen and it_room_seen and partner_office_seen):
    # speaker:npc
    Walk round first, so you know who sits where. The kitchen, the IT room and the partner's office.
    # speaker:npc
    Then come back and I'll send them to lunch.
    -> hub.choices
}
# speaker:npc
Right. Lunch for everyone. Watch the rooms empty.
#set_global:act_midday:true
~ act_midday = true
# exit_conversation
-> END

=== lever_day_end ===
# speaker:npc
The staff won't be back once they've gone home. Seen everything you wanted?
+ [Yes, call it a day.]
    # speaker:npc
    Right. Home time for nearly all of them.
    # speaker:npc
    Graham stays. Ask him about the log.
    #set_global:act_evening:true
    ~ act_evening = true
    # exit_conversation
    -> END
+ [Not yet.]
    # speaker:npc
    Take your time.
    -> hub.choices

=== function unrecapped() ===
~ temp c = 0
{ earn_facts_done and not recapped_facts:
    ~ c = c + 1
}
{ get_records_done and not recapped_records:
    ~ c = c + 1
}
{ crack_guessable_done and not recapped_guessable:
    ~ c = c + 1
}
{ crack_reused_done and not recapped_reused:
    ~ c = c + 1
}
{ crack_strong_done and not recapped_strong:
    ~ c = c + 1
}
{ user_signin_done and not recapped_user:
    ~ c = c + 1
}
{ usb_refused_done and not recapped_usb:
    ~ c = c + 1
}
{ admin_signin_done and not recapped_admin:
    ~ c = c + 1
}
{ profile_read_done and not recapped_profile:
    ~ c = c + 1
}
{ override_done and not recapped_override:
    ~ c = c + 1
}
{ read_log_done and not recapped_log:
    ~ c = c + 1
}
{ collect_partner_done and not recapped_collect_partner:
    ~ c = c + 1
}
{ see_borrow_done and not recapped_borrow:
    ~ c = c + 1
}
{ collect_hot_desk_done and not recapped_collect_hot_desk:
    ~ c = c + 1
}
{ crack_cached_done and not recapped_crack_cached:
    ~ c = c + 1
}
{ local_account_done and not recapped_local:
    ~ c = c + 1
}
{ local_refused_done and not recapped_refused:
    ~ c = c + 1
}
~ return c

// Each ticked beat is recapped once, newest first, at most two per ask.
=== recap ===
~ temp said = 0
{ not earn_facts_done and not get_records_done and not crack_guessable_done and not crack_reused_done and not crack_strong_done and not user_signin_done and not usb_refused_done and not admin_signin_done and not profile_read_done and not override_done and not read_log_done and not collect_partner_done and not see_borrow_done and not collect_hot_desk_done and not crack_cached_done and not local_account_done and not local_refused_done:
    # speaker:npc
    Nothing to look back on yet. Have a go first.
    -> hub.choices
}
{ unrecapped() == 0:
    # speaker:npc
    That's all of it so far. Ask for the short version at the end.
    -> hub.choices
}
{ said < 2 and local_refused_done and not recapped_refused:
    ~ recapped_refused = true
    ~ said = said + 1
    # speaker:npc
    The shared account was refused where it doesn't belong. A local account stays local.
}
{ said < 2 and local_account_done and not recapped_local:
    ~ recapped_local = true
    ~ said = said + 1
    # speaker:npc
    One shared desk password would open every desk it covers. That's why it must not be weak.
}
{ said < 2 and crack_cached_done and not recapped_crack_cached:
    ~ recapped_crack_cached = true
    ~ said = said + 1
    # speaker:npc
    A remembered record falls like any other: a weak one at once, Jun's with one fact.
}
{ said < 2 and collect_hot_desk_done and not recapped_collect_hot_desk:
    ~ recapped_collect_hot_desk = true
    ~ said = said + 1
    # speaker:npc
    The hot desk remembered Jun because he'd sat there.
}
{ said < 2 and see_borrow_done and not recapped_borrow:
    ~ recapped_borrow = true
    ~ said = said + 1
    # speaker:npc
    Jun couldn't work, so he borrowed a PC and left it signed in.
}
{ said < 2 and collect_partner_done and not recapped_collect_partner:
    ~ recapped_collect_partner = true
    ~ said = said + 1
    # speaker:npc
    A PC keeps a record of who used it. An administrator can collect them.
}
{ said < 2 and read_log_done and not recapped_log:
    ~ recapped_log = true
    ~ said = said + 1
    # speaker:npc
    The log kept all of it, including the night someone tried Graham's PC.
}
{ said < 2 and override_done and not recapped_override:
    ~ recapped_override = true
    ~ said = said + 1
    # speaker:npc
    The administrator could plug in what the policy blocks for everyone else.
}
{ said < 2 and profile_read_done and not recapped_profile:
    ~ recapped_profile = true
    ~ said = said + 1
    # speaker:npc
    Julian's folders opened because the sign-in was an administrator's.
}
{ said < 2 and admin_signin_done and not recapped_admin:
    ~ recapped_admin = true
    ~ said = said + 1
    # speaker:npc
    An administrator's sign-in opens PCs that aren't theirs.
}
{ said < 2 and usb_refused_done and not recapped_usb:
    ~ recapped_usb = true
    ~ said = said + 1
    # speaker:npc
    The desk policy refused the stick. That's a rule doing its job.
}
{ said < 2 and user_signin_done and not recapped_user:
    ~ recapped_user = true
    ~ said = said + 1
    # speaker:npc
    A user's sign-in opens that user's desk, and no more.
}
{ said < 2 and crack_strong_done and not recapped_strong:
    ~ recapped_strong = true
    ~ said = said + 1
    # speaker:npc
    Julian's held. Long and random passwords are why.
}
{ said < 2 and crack_reused_done and not recapped_reused:
    ~ recapped_reused = true
    ~ said = said + 1
    # speaker:npc
    Graham's was salted, so it took a wait, but you already held the same password.
}
{ said < 2 and crack_guessable_done and not recapped_guessable:
    ~ recapped_guessable = true
    ~ said = said + 1
    # speaker:npc
    Her record fell at once. A password made of her own life is weak.
}
{ said < 2 and get_records_done and not recapped_records:
    ~ recapped_records = true
    ~ said = said + 1
    # speaker:npc
    A stored record isn't safe just because it isn't plain text.
}
{ said < 2 and earn_facts_done and not recapped_facts:
    ~ recapped_facts = true
    ~ said = said + 1
    # speaker:npc
    People give away what a guesser needs, and they don't notice.
}
{ unrecapped() > 0:
    # speaker:npc
    There's more. Ask me again.
}
-> hub.choices

=== short_version ===
# speaker:npc
People share what a guesser needs, and a stolen record falls to it.
# speaker:npc
A reused password opens more than one account. A long random one doesn't fall.
# speaker:npc
A user's sign-in opens one desk. An administrator's opens other people's.
# speaker:npc
A PC remembers who used it, and a shared local password falls wherever it's used.
# speaker:npc
And the log remembers all of it.
-> hub.choices
