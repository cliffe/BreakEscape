// ===========================================
// Mission 6: NPC - Kemal Aydin, Satoshi's minder (executive wing)
// Pass 5 alignment A5 / D1 (m04 guard and Cipher pattern).
// - Sight challenge (los.challengeOnSight -> on_sighted), or spoken to.
// - Cover held: the FCA cover talks him round (minder_passed).
// - Cover strained (A3): somebody rang the FCA. Only a turned Irina's word
//   gets past him; otherwise the player picks the door in his blind window,
//   squares up (he turns hostile) or backs off. A strained cover never locks
//   the player out.
// Round 2 (R2-M3): Satoshi's door is locked and Kemal holds the key. The
// talk-past unlocks it (#unlock_door, fire-and-forget like the guard's, so it
// is re-issued on re-entry until the player has reached Satoshi). A pick he
// sees (lockpick_used_in_view -> on_lockpick_seen) ends the FCA line for this
// visit and leads to the stand-off. minder_challenged (synced) tells the
// credits he turned the player back at least once.
//
// Re-entry (guard file pattern): every resting choice lives in a stitch of
// `start`, so a re-open re-navigates to `start` and plays the opener for the
// current state. Exits print nothing after the exit line.
// ===========================================

// Synced scenario globals
VAR cover_strained = false
VAR irina_recruited = false
VAR irina_ko = false
VAR minder_passed = false
VAR minder_hostile = false
VAR satoshi_confronted = false
VAR minder_challenged = false   // Synced scenario global (round 2, R2-m7)

// Ink-local
VAR minder_met = false
VAR sighted_open = false   // R2-m4: the scene opened on his "The FCA does not come up here."
VAR saw_picks = false      // R2-M3: he caught the picks; the FCA line no longer works (survives a page reload with the other variables; only visit counts reset)

-> start

=== start ===
#speaker:satoshi_minder
{ minder_passed:
    { not satoshi_confronted:
        #unlock_door:satoshi_office
    }
    Kemal Aydin: He is expecting you. Go in.
    -> start.passed_choices
}
~ sighted_open = false
// Scenario design R1 (m12): keyed on the synced minder_challenged too, so the
// opener doesn't replay after a page reload; it's set after the check.
{ not minder_met and not minder_challenged:
    ~ minder_met = true
    #speaker:narrator
    Narrator: A broad man in his late fifties, grey at the temples, stands between you and the corner office as if he were part of the wall.
    #speaker:satoshi_minder
    Kemal Aydin: Moin. This floor is closed. Who let you up?
- else:
    Kemal Aydin: You again. The answer has not changed.
}
~ minder_met = true
~ minder_challenged = true
-> start.challenge

= challenge
+ {not cover_strained and not saw_picks} [The FCA. Mr Nakamoto's compliance file has my name on it.]
    -> talked_past
+ {(cover_strained or saw_picks) and irina_recruited and not irina_ko} [Dr Volkova sent me up. Ring her if you like.]
    -> irina_vouches
+ {cover_strained or saw_picks} [The FCA. Routine supervisory visit.]
    -> cover_blown
+ [Wrong floor. I'll go.]
    Kemal Aydin: Yes. You will.
    #exit_conversation
    -> start.challenge

= passed_choices
+ [Thanks.]
    Kemal Aydin: Do not thank me. I only open the door.
    #exit_conversation
    -> start.passed_choices

= standoff_choices
+ {irina_recruited and not irina_ko} [Dr Volkova sent me up. Ring her if you like.]
    -> irina_vouches
+ [Then step aside, or I'll move you.]
    -> goes_hostile
+ [(Back off down the corridor.)]
    Kemal Aydin: Good. Stay down there.
    #exit_conversation
    -> start.challenge

// los.challengeOnSight: he has seen the player in the corridor.
=== on_sighted ===
#speaker:satoshi_minder
{ minder_passed:
    -> start
}
~ sighted_open = true
// Round 3 (R3-m1): the narration plays on the first meeting only, so a repeat
// sighting is one line and a choice. Scenario design R1 (m12): and not after a
// reload once he has challenged the player.
{ not minder_met and not minder_challenged:
    ~ minder_met = true
    #speaker:narrator
    Narrator: The man by the corner office turns, sees you, and steps squarely into your path.
    #speaker:satoshi_minder
    Kemal Aydin: The FCA does not come up here.
- else:
    Kemal Aydin: I told you once. This floor is closed.
}
~ minder_met = true
~ minder_challenged = true
-> start.challenge

=== talked_past ===
#speaker:satoshi_minder
~ minder_passed = true
#set_variable:minder_passed=true
{ sighted_open:
    Kemal Aydin: It does tonight, then.
- else:
    Kemal Aydin: The FCA. At this hour. Very well.
}
Kemal Aydin: Thirty years I guarded banks for men in good suits. Then I guarded this one for a man in a hood. The paperwork is always the same.
#unlock_door:satoshi_office
Kemal Aydin: There. It is open. I will be outside the door.
#exit_conversation
-> start.passed_choices

=== irina_vouches ===
#speaker:narrator
Narrator: He holds your eye while he dials. A short exchange, then a longer silence on the other end.
#speaker:satoshi_minder
~ minder_passed = true
#set_variable:minder_passed=true
Kemal Aydin: She says you are expected. She has never once lied to me, so.
#unlock_door:satoshi_office
Kemal Aydin: Na gut. Go in.
#exit_conversation
-> start.passed_choices

=== cover_blown ===
#speaker:satoshi_minder
{ saw_picks and not cover_strained:
    Kemal Aydin: The FCA does not carry picks.
- else:
    Kemal Aydin: Mr Nakamoto's phone has been ringing about you. The FCA has never heard your name.
}
Kemal Aydin: I guarded banks that stole politely. He at least says what he is.
Kemal Aydin: So. Who are you really?
-> start.standoff_choices

=== goes_hostile ===
#speaker:satoshi_minder
Kemal Aydin: *takes off his watch and pockets it* Then come and move me.
#hostile:satoshi_minder
#exit_conversation
-> start.challenge

// lockpick_used_in_view on Satoshi's door (round 2, R2-M3). Repeatable; the
// mapping skips it while he is hostile or down.
=== on_lockpick_seen ===
#speaker:satoshi_minder
{ minder_passed:
    { not satoshi_confronted:
        #unlock_door:satoshi_office
    }
    Kemal Aydin: It is open. Put those away.
    #exit_conversation
    -> start.passed_choices
}
~ saw_picks = true
#set_variable:minder_challenged=true
#speaker:narrator
Narrator: A hand the size of a shovel closes over yours before the second pin sets.
#speaker:satoshi_minder
Kemal Aydin: No.
-> cover_blown

