// Gossip Girl - Office Gossip
// Provides intel about staff including manager names

=== start ===
OMG hiiii! You're new here, right? I know EVERYONE in this office!
Want to hear the latest tea? ☕
-> hub

=== hub ===
* [What have you heard about the IT department?]
    -> topic_it
* [What do you know about the CEO?]
    -> topic_ceo
* [Any security concerns?]
    -> topic_security
+ [Thanks. That's enough gossip for now.] 
    -> ending
-> hub

=== topic_it ===
Oh the IT team? They're actually pretty cool!
Neye Eve is super smart but a bit gullible, you know? Always trying to be helpful.
Their manager is Alex Chen - really nice but SUPER busy. Barely see them around these days.
Fun fact: Neye is SO worried about impressing Alex that they practically jump when Alex's name comes up! 😂
* [Tell me more about the team dynamics]
    -> it_details
* [Interesting! What else?]
    -> hub

=== it_details ===
Well, Neye handles a lot of the day-to-day stuff - passwords, access codes, that kind of thing.
Alex trusts them completely. Maybe TOO much if you ask me... 👀
Like, Neye would probably do ANYTHING if they thought Alex was asking for it!
-> hub

=== topic_ceo ===
The CEO? *lowers voice* Girl, I have THEORIES...
Like, why are they here so late at night? And those "business trips" that nobody knows about?
I saw them coming out of the server room at 3 AM once. Like... what?!
Something shady is definitely going on. Mark my words! 🕵️
-> hub

=== topic_security ===
Security? Oh honey, let me tell you about the "security" around here...
Half the people write their passwords on sticky notes! Including the CEO!
And that reception safe? Pretty sure the code hasn't been changed in forever.
Actually wait - Neye mentioned they just updated it last week. Something about "security protocols."
They were SO proud of themselves for remembering to update it! 😊
-> hub

=== ending ===
Okay okay, I'll let you go! But if you hear anything juicy, come find me!
#exit_conversation
-> hub
