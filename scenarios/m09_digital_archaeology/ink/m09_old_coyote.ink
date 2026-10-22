// ===========================================
// m09 Digital Archaeology: Cody Old Coyote, night guard (person-chat)
// Group B, B6. CONTRACT.md §3.4. Beat 1.1; SE §3; MC §4.5.
// NPC id: old_coyote. Entry knots: challenge (his player_spotted mapping,
// cooldown 0) and start (the player walks up to him).
// 24, Apsaalooke (Crow), Lodge Grass. Dry, a little bored, sharp when
// treated as furniture. Not a mystic, not a stoic. US English.
// Telling him the truth sends him to his truck (his mapping hides him).
// ===========================================

// Scenario globals (CONTRACT §5.3).
VAR old_coyote_told = false

// Ink-local.
VAR coyote_challenges = 0
VAR coyote_cover = ""        // "auditor" / "contractor"
VAR coyote_asked_course = false
VAR coyote_asked_cage = false
VAR coyote_asked_log = false
VAR hub_quiet = false

=== challenge ===
~ coyote_challenges += 1
{coyote_challenges == 1:
    Cody Old Coyote: Hold on, sis, I'll call you back. *to you* Hey. Building's closed. Who let you in?
- else:
    {
    - coyote_cover == "auditor":
        Cody Old Coyote: Still auditing?
    - coyote_cover == "contractor":
        Cody Old Coyote: Still fixing the shredder?
    - else:
        Cody Old Coyote: You again.
    }
}
+ {coyote_cover == ""} [Lease-holder's audit. Sorensen knows I'm here.]
    ~ coyote_cover = "auditor"
    Cody Old Coyote: She didn't tell me. She doesn't tell me much. Go ahead.
    #exit_conversation
    -> back
+ {coyote_cover == ""} [Shredder contractor. It's been jamming.]
    ~ coyote_cover = "contractor"
    Cody Old Coyote: It hasn't jammed once all week. Believe me, I'd know. Go on.
    #exit_conversation
    -> back
// Puzzle chains R6 m3: keyed on the cover, not the count, so an Esc on the first
// challenge doesn't put "Same as before" in the mouth of a player who gave none.
+ {coyote_cover != ""} [Same as before. Carry on.]
    Cody Old Coyote: Knock yourself out.
    #exit_conversation
    -> back
// R2 B-R2-03 / R3 B-R3-03: each truth button says something true for the
// cover the player gave (none, auditor, contractor).
+ {not old_coyote_told and coyote_cover == "auditor"} [I'm not an auditor. You don't want to see tonight.]
    -> truth
+ {not old_coyote_told and coyote_cover == "contractor"} [I'm not here for the shredder. Go and sit in your truck.]
    -> truth_plain
+ {not old_coyote_told and coyote_cover == ""} [You don't want to be a witness tonight. Go and sit in your truck.]
    -> truth_plain

// Shared by the challenge and the hub.
=== truth ===
#set_global:old_coyote_told:true
Cody Old Coyote: Figured. Auditors bring coffee. I'll be in the truck.
#exit_conversation
-> back

=== truth_plain ===
#set_global:old_coyote_told:true
Cody Old Coyote: Figured. I'll be in the truck.
#exit_conversation
-> back

=== start ===
-> hub

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{not hub_quiet:
    {coyote_challenges == 0 and coyote_cover == "":
        Cody Old Coyote: Hey. Building's closed. You lost?
    - else:
        Cody Old Coyote: {&What's up?|Make it quick, I'm on a lap.}
    }
}
~ hub_quiet = false
+ {not coyote_asked_course} [Why work nights?]
    ~ coyote_asked_course = true
    Cody Old Coyote: Lineman's course. Climbing poles in a blizzard. Poles don't make that noise all night.
    -> back
+ {not coyote_asked_cage} [Have you seen what's going on in the cage?]
    ~ coyote_asked_cage = true
    Cody Old Coyote: I'm paid to walk the fence. Nobody pays me to look in the cage.
    -> back
+ {not coyote_asked_log} [Do you write any of this down?]
    ~ coyote_asked_log = true
    Cody Old Coyote: Every night. It's on my desk by the dock. Read it if you want. You'd be the first.
    -> back
+ {not old_coyote_told and coyote_cover == "auditor"} [I'm not an auditor. You don't want to see tonight.]
    -> truth
+ {not old_coyote_told and coyote_cover == "contractor"} [I'm not here for the shredder. Go and sit in your truck.]
    -> truth_plain
+ {not old_coyote_told and coyote_cover == ""} [You don't want to be a witness tonight. Go and sit in your truck.]
    -> truth_plain
+ [I'll let you get on with your round.]
    Cody Old Coyote: Fence isn't going anywhere.
    #exit_conversation
    -> back
