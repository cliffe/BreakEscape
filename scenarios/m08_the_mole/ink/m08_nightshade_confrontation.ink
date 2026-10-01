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
VAR nightshade_confronted = false
VAR nightshade_arrested = false
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
VAR fate_decided = false
VAR database_theft_understood = false
VAR netherton_ko = false
VAR gamma_volunteered = false
// PASS 3 (P6, P8, P9)
VAR named_on_evidence = false
VAR found_go_bag = false
VAR asked_bag = false
VAR nightshade_ko = false
VAR accused_nightshade = false

=== start ===
{ fate_decided: -> after_choice }
#complete_task:confront_nightshade
~ nightshade_confronted = true
Narrator: The interrogation room records everything. Nightshade sits with his hands flat on the table, unhurried, and for the first time in nine days he looks like a man who has set something heavy down.

Agent 0x47 'Nightshade': You found it. All of it. The repository, the credentials, the logs with my account all over them. I could have scrubbed every trace years ago, you know.
You: Why didn't you?
{ nightshade_suspected:
    Agent 0x47 'Nightshade': Because you already knew. I watched you decide, across that desk in the lab. Some part of me wanted it to be you who closed the loop, not a stranger with a file. You, who trained beside me and never quite trusted the quiet.
- else:
    Agent 0x47 'Nightshade': Because some part of me wanted to be caught by someone who'd understand it. I misjudged that, I think. You look at me like I'm a stranger. Fair. Sit down anyway. You've earned the truth.
}
// PASS 3 (impl review M2): after his answer to "Why didn't you?", so the
// question keeps its meaning.
{ nightshade_ko:
    Agent 0x47 'Nightshade': You put me on the floor of my own lab. I've had worse from people I liked less.
}
{
- named_on_evidence:
    Agent 0x47 'Nightshade': The door log. I walked past that reader every morning for fifteen years and never once thought of it as a witness.
- accused_nightshade:
    Agent 0x47 'Nightshade': You said it to my face before you could put it in front of anyone. You were right, and it didn't matter until tonight.
}
-> the_case

=== the_case ===
You: The logs put you on the Portland plan for forty-seven minutes, forty-eight hours before we deployed. The mail resolves to your account and an entropy.onion address. It's over, Nightshade. I only came for the why.
Agent 0x47 'Nightshade': Order is a candle in a hurricane, {player_name}. We stand round it with our hands cupped, night after night, and we call it a career. ENTROPY only told me the truth I'd already worked out alone: the storm always wins. So I stopped shielding the flame. I helped the wind. It felt, God help me, like honesty.
-> hub

=== hub ===
+ { not asked_why } [Two people are dead. You keep talking about wind. Say what you actually did.]
    ~ asked_why = true
    Narrator: He answers evenly.
    Agent 0x47 'Nightshade': I gave them your deployment. I knew there would be four fires and one bucket, and that you would be standing in one of them. I didn't need to know which way the bucket went. Every way it went, people died. I did the arithmetic of who that would kill and I did it anyway. I wrote as much -- you read it. I'm not asking you to forgive the sum. I'm telling you I did it with my eyes open.
    You: You're dressing murder up as physics so you can sleep at night.
    Agent 0x47 'Nightshade': Perhaps. You always were better than me at the part I decided to skip.
    -> hub
+ { found_go_bag and not asked_bag } [You had a flight to Montana for the morning after Portland. Why are you still here?]
    ~ asked_bag = true
    Agent 0x47 'Nightshade': Because I wanted to see who they would send. I hoped it would be you.
    { asked_architect:
        Agent 0x47 'Nightshade': You have the coordinates now. Montana was always where I was going. I just wanted to see your face first.
    - else:
        Agent 0x47 'Nightshade': Montana. You'll want to know why Montana. Ask me properly.
    }
    -> hub
+ { not asked_recruit } [When. When did they turn you?]
    ~ asked_recruit = true
    Agent 0x47 'Nightshade': Training. The same barracks as you, the same instructors, the same bad coffee. They don't recruit with money, {player_name} -- money leaves a trail and buys a coward. They recruit the ones who've started to suspect the whole enterprise is a delaying action. They found me at twenty-three, half-formed and already tired. Then they waited. Fifteen years. That's the patience you're really up against tonight.
    -> hub
+ { not asked_taught } [You stood in a briefing and taught me how to catch an insider.]
    ~ asked_taught = true
    Agent 0x47 'Nightshade': I did. Every word of it was true. The access a little too broad, the hours a little too odd, the calm. I never said where I'd learned it.
    Agent 0x47 'Nightshade': I thought, if anyone ever used it on me, I'd like it to be you. That's vanity, I know. It's the last one I've got.
    -> hub
+ { not asked_database } [Portland wasn't about the four attacks, was it.]
    ~ asked_database = true
    ~ database_theft_understood = true
    Agent 0x47 'Nightshade': No. The attacks were the noise. While you and Netherton agonised over which fire to fight, they walked the global threat database out through a door I left open. Every vulnerability SAFETYNET has ever catalogued. That was the night's real work. The dead were... the cost of your attention being elsewhere.
    -> hub
+ { asked_database and not asked_architect } [Then where did it go? Where's The Architect?]
    ~ asked_architect = true
    Narrator: He studies you for a long moment.
    Agent 0x47 'Nightshade': You want the workshop. Tomb Gamma. I'll give it to you -- freely, because it's worth more than my silence and because I'd like, just once, to be the one who tips the board over.
    Agent 0x47 'Nightshade': Forty-seven point two-three-eight-two north. One-twelve point five-one-five-six west. An old Cold War bunker in Montana. That's where the database went, and that's where you'll find the man who's been reading your mail for fifteen years. #set_global:tomb_gamma_location_known:true
    ~ tomb_gamma_location_known = true
    -> hub
+ { asked_architect } [Enough. It's time to decide what happens to you.] -> the_choice
+ { not asked_architect } [Enough talk. What happens to you now.] -> the_choice

=== the_choice ===
Narrator: The disposition screen on the wall behind you takes one entry per detainee, and {netherton_ko:the Director will countersign it when he is back on his feet|the Director countersigns whatever goes in}. Nightshade is the one asking, though, and after fifteen years you owe him the answer to his face.
Agent 0x47 'Nightshade': So. What does SAFETYNET do with a man who thinks he was right?
+ [No deals. You go to the police with every page of this, and you answer for those two names in a courtroom. That's the whole difference between us.]
    #complete_task:decide_the_fate
    ~ nightshade_arrested = true
    -> lock_in ->
    Agent 0x47 'Nightshade': Clean. Predictable. I'd have expected nothing else from you, and I mean that as the compliment it is. Enter it. I won't fight it.
    -> aftermath
+ [No cell and a clear conscience. You get a leash. You stay in play, you feed us ENTROPY, and you buy back one inch of what you took every single day.]
    #complete_task:decide_the_fate
    ~ nightshade_triple_agent = true
    -> lock_in ->
    Narrator: A long pause.
    Agent 0x47 'Nightshade': You've grown a ruthless streak since training. I approve of it, which should frighten you more than it does. I'll be your ghost inside their machine, for exactly as long as it suits me to be. Never forget I told you that part.
    -> aftermath

// PASS 2 playtest D1: the engine's End Conversation button ignores
// disableClose. Everything the outcome needs (fate, fate_decided, Tomb Gamma)
// is written in the same step as the choice, so closing anywhere after it
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
    Agent 0x47 'Nightshade': You never asked where it all went. I'll tell you anyway. It's worth more than my silence, and I'd like, just once, to be the one who tips the board over.
    Agent 0x47 'Nightshade': Tomb Gamma. Forty-seven point two-three-eight-two north, one-twelve point five-one-five-six west. An old Cold War bunker in Montana. The database went there, and so will you.
- else:
    Agent 0x47 'Nightshade': Take the coordinates to Netherton. Tomb Gamma won't wait for you to grieve me.
}
{ netherton_ko:
    Narrator: You type the entry. The countersignature field stays empty, waiting for a Director who is still being looked at by the medic.
- else:
    Narrator: You type the entry. The Director's countersignature appears on the screen before you have looked away from it.
}
Narrator: You hold Nightshade's eye for a moment longer than you mean to. Then you go.
#exit_conversation
-> after_choice

=== after_choice ===
Agent 0x47 'Nightshade': {nightshade_triple_agent: Go on. They'll be expecting you upstairs.|Go on. I'll still be here when the police come.}
+ [Leave him.]
    #exit_conversation
    -> after_choice
