// ================================================
// Mission 8: The Mole - THE CONFRONTATION (major scene)
// Speaker: Agent 0x47 'Nightshade'
// Entry knot: start   Completes: confront_nightshade
// Philosophy PRESENTED and REJECTED, never endorsed. Acknowledges the player's
// investigation (nightshade_suspected, suspect_theory). Fate chosen here and
// mirrored to the disposition terminal. Sets nightshade_arrested XOR triple_agent.
// PASS 2: the fate is decided HERE (fate_decided, decide_the_fate). The old
// terminal could not complete the task and could be pressed first. The scene
// opens with disableClose; confront_nightshade completes at the top (lesson 44);
// a re-entry guard skips to after_choice once the fate is set (lesson 14); he
// gives up Tomb Gamma either way (bible); no DONE (lesson 21). The handover
// wording follows canon: SAFETYNET has no arrest powers (lesson 39).
// ================================================

VAR player_name = "Agent 0x00"
VAR nightshade_arrested = false // Synced scenario global: Nightshade handed to the police; also set by the KO-before-fate mapping
VAR nightshade_triple_agent = false
VAR tomb_gamma_location_known = false
VAR nightshade_suspected = false
VAR suspect_theory = ""
VAR debrief_stance = ""
VAR asked_why = false
VAR asked_recruit = false
VAR asked_database = false
VAR asked_architect = false
VAR asked_taught = false
VAR fate_decided = false // Synced scenario global: Nightshade's fate is chosen; also set by the KO-before-fate mapping
VAR database_theft_understood = false // Synced scenario global: the player knows the attacks covered the database theft; also set by the flag4 mappings and the catalogue's onRead
VAR netherton_ko = false
VAR gamma_volunteered = false
// PASS 3 (P6, P8, P9)
VAR named_on_evidence = false
VAR found_go_bag = false
VAR asked_bag = false
VAR nightshade_ko = false
VAR accused_nightshade = false
// PASS 4 (fixes 1, 11)
VAR nightshade_print_lifted = false
VAR asked_cracker = false

=== start ===
{ fate_decided: -> after_choice }
#complete_task:confront_nightshade
Narrator: The interrogation room records everything. Nightshade stands at the table with both hands flat on it. He doesn't sit.

Agent 0x47 'Nightshade': You found it. Forty-seven minutes on the Portland plan, two days before you deployed. My account, my terminal, my mail.
Agent 0x47 'Nightshade': The name they stripped off that intercept in the cable vault was mine.
Agent 0x47 'Nightshade': I could have scrubbed every trace years ago. You're wondering why I didn't.
{ nightshade_suspected:
    Agent 0x47 'Nightshade': Because you'd already decided. I watched you do it, across my desk in the lab.
    Agent 0x47 'Nightshade': Some part of me wanted it to be you who closed the loop. My student. You never did trust the quiet.
- else:
    Agent 0x47 'Nightshade': Because some part of me wanted to be caught by someone who'd understand. I misjudged that, I think.
    Agent 0x47 'Nightshade': You look at me like a stranger. Fair enough.
}
// PASS 3 (impl review M2): after his answer to "Why didn't you?", so the
// question keeps its meaning.
{ nightshade_ko:
    Agent 0x47 'Nightshade': You put me on the floor of my own lab. I've had worse from people I liked less.
}
{ named_on_evidence:
    Agent 0x47 'Nightshade': The door log. I walked past that reader every morning for fifteen years and never once thought of it as a witness.
}
// PASS 4 (fix 10): its own block, so it plays alongside the door-log line.
// The accusation is only on offer before flag 4, so this is always early.
{ accused_nightshade:
    Agent 0x47 'Nightshade': You said it to my face before you could prove it.
    Agent 0x47 'Nightshade': I had the whole night to tidy up after that, and I didn't. Think about why.
}
// PASS 4 (fix 1): the thumbprint lifted off the USB stick.
{ nightshade_print_lifted:
    Agent 0x47 'Nightshade': And you printed the stick. Of course you did. I'd have told you nobody planted it, if you'd asked.
}
-> the_case

// Script edit round (S1, approved): one line for the player before the candle.
=== the_case ===
+ [It's over, Nightshade. Tell me why.]
    Agent 0x47 'Nightshade': Order is a candle in a hurricane. We stand round it with our hands cupped, night after night, and call it a career.
    Agent 0x47 'Nightshade': ENTROPY only told me what I'd already worked out alone. The storm always wins.
    Agent 0x47 'Nightshade': So I stopped shielding the flame. I helped the wind. God help me, it felt like honesty.
    -> hub

=== hub ===
// Playtest round: the database reveal and the Architect come last among the topics.
+ { not asked_why } [Two people are dead. You keep talking about wind. Say what you actually did.]
    ~ asked_why = true
    Agent 0x47 'Nightshade': I gave them your deployment. Four fires, one bucket, and you in one of them. I did the arithmetic of who, and did it anyway.
    Agent 0x47 'Nightshade': I'm not asking you to forgive the sum. I'm telling you I did it with my eyes open.
    Agent 0x47 'Nightshade': You'd call it dressing murder up as physics. Perhaps. You always were better than me at the part I decided to skip.
    -> hub
+ { not asked_recruit } [When. When did they turn you?]
    ~ asked_recruit = true
    Agent 0x47 'Nightshade': Training. My own, in the barracks you slept in years later. They found me at twenty-three, half-formed and already tired.
    Agent 0x47 'Nightshade': Not with money. Money buys a coward. They look for the ones who've started to suspect it's all a delaying action.
    Agent 0x47 'Nightshade': Then they waited fifteen years. I doubt I was the only tired one they found.
    -> hub
// PASS 4 (fix 11): the PIN cracker, held back since m03 "on his bench".
+ { not asked_cracker } [Every mission, the PIN cracker stayed on your bench.]
    ~ asked_cracker = true
    Agent 0x47 'Nightshade': It did. Every lock it would have opened in a minute, you opened the long way.
    Agent 0x47 'Nightshade': Nobody asks a careful man why he's keeping a device for study. I chose what you went in without.
    -> hub
+ { not asked_taught } [Netherton told me to learn mole-catching from you.]
    ~ asked_taught = true
    Agent 0x47 'Nightshade': He did. Every word I taught you was true. I just never said where I'd learned it.
    Agent 0x47 'Nightshade': If anyone ever used it on me, I wanted it to be you. Vanity, I know. It's the last one I've got.
    -> hub
+ { found_go_bag and not asked_bag } [You had a flight to Montana the morning after Portland. Why are you still here?]
    ~ asked_bag = true
    Agent 0x47 'Nightshade': Because I wanted to see who they would send. I hoped it would be you.
    { asked_architect:
        Agent 0x47 'Nightshade': You have the coordinates now. Montana was always where I was going. I just wanted to see your face first.
    - else:
        Agent 0x47 'Nightshade': Montana. Work out what Portland was really for, and where it went, and you'll have your Montana.
    }
    -> hub
+ { not asked_database } [The four attacks were cover for something else. Weren't they?]
    ~ asked_database = true
    ~ database_theft_understood = true
    Agent 0x47 'Nightshade': Yes. The attacks were the noise. While you and Netherton chose which fire to fight, they walked the threat database out through a door I left open.
    Agent 0x47 'Nightshade': Every vulnerability SAFETYNET has ever catalogued. The dead were... the cost of your attention being elsewhere.
    -> hub
+ { asked_database and not asked_architect } [Then where did it go? Where's The Architect?]
    ~ asked_architect = true
    Narrator: He studies you for a long moment.
    Agent 0x47 'Nightshade': You want the workshop. Tomb Gamma. I'll give it to you freely. I'd like, just once, to be the one who tips the board over.
    Agent 0x47 'Nightshade': Forty-seven point two-three-eight-two north. One-twelve point five-one-five-six west. #set_global:tomb_gamma_location_known:true
    Agent 0x47 'Nightshade': An old Cold War bunker in Montana. The database went there, and so did the man who put me here fifteen years ago.
    ~ tomb_gamma_location_known = true
    -> hub
+ { asked_architect } [Enough. It's time to decide what happens to you.] -> the_choice
+ { not asked_architect } [Enough talk. What happens to you now.] -> the_choice

=== the_choice ===
Narrator: The disposition screen behind you takes one entry per detainee, and {netherton_ko:the Director will countersign it when he is back on his feet|the Director countersigns whatever goes in}. Nightshade is watching you.
Agent 0x47 'Nightshade': So. What does SAFETYNET do with a man who thinks he was right?
+ [No deals. The police get the file. You answer for those two names in court.]
    #complete_task:decide_the_fate
    ~ nightshade_arrested = true
    -> lock_in ->
    Agent 0x47 'Nightshade': Clean. Predictable. I'd expect nothing else from you, and I mean that as a compliment.
    Agent 0x47 'Nightshade': Enter it. I won't fight it.
    -> aftermath
+ [No cell. A leash. Feed us ENTROPY, and pay it back an inch a day.]
    #complete_task:decide_the_fate
    ~ nightshade_triple_agent = true
    -> lock_in ->
    Narrator: A long pause.
    Agent 0x47 'Nightshade': You've grown a ruthless streak since I taught you. I approve, which should frighten you more than it does.
    Agent 0x47 'Nightshade': I'll be your ghost inside their machine, for exactly as long as it suits me.
    Agent 0x47 'Nightshade': Never forget I told you that part.
    -> aftermath

// PASS 2 playtest D1 found End Conversation ignoring disableClose; the engine
// now hides it (base-minigame.js), so only a reload can interrupt the scene.
// Everything the outcome needs (fate, fate_decided, Tomb Gamma) is still
// written in the same step as the choice, so an interruption anywhere after it
// leaves a complete state; the lines that follow are delivery only.
=== lock_in ===
~ fate_decided = true
{ not tomb_gamma_location_known:
    ~ gamma_volunteered = true
    ~ tomb_gamma_location_known = true
}
->->

=== aftermath ===
{ gamma_volunteered:
    Agent 0x47 'Nightshade': You never asked about The Architect. I'll tell you anyway. I'd like, just once, to be the one who tips the board over.
    Agent 0x47 'Nightshade': Tomb Gamma. Forty-seven point two-three-eight-two north, one-twelve point five-one-five-six west.
    Agent 0x47 'Nightshade': An old Cold War bunker in Montana. Everything they took from us went there, and so will you.
- else:
    Agent 0x47 'Nightshade': Take the coordinates to Netherton. Tomb Gamma won't wait for you to grieve me.
}
{ netherton_ko:
    Narrator: You type the entry. The countersignature field stays empty. The Director is still with the medic.
- else:
    Narrator: You type the entry. The Director's countersignature appears before you've looked away.
}
// PASS 4 (dialogue): the teacher's line from m07, unexplained.
Agent 0x47 'Nightshade': And 0x00. Let it hurt afterwards, not during.
Narrator: You hold his eye a moment longer than you mean to. Then you go.
#exit_conversation
-> after_choice

=== after_choice ===
Agent 0x47 'Nightshade': {nightshade_triple_agent: Go on. They'll be expecting you upstairs.|Go on. I'll still be here when the police come.}
+ [Leave him.]
    #exit_conversation
    -> after_choice
