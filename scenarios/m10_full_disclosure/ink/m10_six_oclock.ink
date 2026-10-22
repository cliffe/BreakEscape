INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: 06:00 AT THE FORWARD POST (cutscene).
// NPC id: six_oclock (hidden person NPC at the forward post).
// Opened on conversation_closed:tesseract by ending (OT §4.7), never on Join.
// Contract: CONTRACT.md §1.3. Order: opening, walkabout (three picks at most),
// Netherton's numbers, the database's beat, the van, then HaX ("the rest").
// Group A writes the lines of Quintero, Kowalczyk, the raid team, Voltage,
// Gary, Imran, Wendell, Victoria and Nightshade here, from MC and SE; groups B
// and C cross-read them (group A report lists every one).
// ===========================================

// File-locals (six_ prefix)
VAR six_picks = 0          // walkabout picks used, three at most
VAR six_q = false          // Quintero visited
VAR six_k = false          // Kowalczyk visited
VAR six_o = false          // the officer sent back visited
VAR six_v = false          // Voltage visited
VAR six_g = false          // Gary or Imran visited
VAR six_w = false          // Wendell visited
VAR six_vic = false        // Victoria visited
VAR six_quiet = false

=== start ===
~ close_compute()
~ six_open = true
{
- ending == "executed":
    -> executed
- ending == "joined" or ending == "":
    -> exit_only
- else:
    -> opening
}

// Fixed beats outside the walkabout, so its cap can't drop them (FA §4.6).
=== opening ===
Narrator: The forward post, a few minutes before six. Floodlights, engines running, people sitting on bumpers with their jackets open.
{ m08_nightshade_triple_agent and m09_nightshade_shown_file and not nightshade_taken_in:
    Agent 0x47 'Nightshade': You left me where they couldn't see me. I'm still useful. That's rarer than you'd think.
}
{ m09_recruiter_offer == "named":
    Director Magnus Netherton: The arrest teams are at the doors. They go on the hour.
}
-> walkabout

// MC §8.2, FA §4.6: a hub of the people the night left standing here, at
// most three picks, Quintero first. One line each. Nobody absent is offered.
=== walkabout ===
~ temp gary_here = m02_completed and (m02_gary_protected or not m02_exposed_hospital) and gary_outcome != "left_in_place"
~ temp imran_here = imran_outcome != "talked_round"
~ temp wendell_here = (not m04_voltage_captured and not m04_voltage_escaped) or (m04_voltage_escaped and (not m04_static_left or m04_static_left_alone))
~ temp vic_here = victoria_gallery == "arrested_here" or victoria_gallery == "ko"
~ temp kow_here = sleeper_caught or wren_at_core
~ temp officer_here = officer_out != "" and officer_out != "quintero"
{ six_picks >= 3:
    -> phone_beat
}
+ { not six_q } { quintero_wounded } [(Go to Quintero's stretcher.)]
    -> walk_quintero
+ { not six_q } { not quintero_wounded } [(Go to Quintero.)]
    -> walk_quintero
+ { not six_k and kow_here } [(Go to the van window. Kowalczyk.)]
    -> walk_kowalczyk
+ { not six_o and officer_here } [(Go to the officer you sent back.)]
    -> walk_officer
+ { not six_v and (m04_voltage_captured or m04_voltage_escaped) } [(Go to Voltage.)]
    -> walk_voltage
+ { not six_g and gary_here } [(Go to Gary.)]
    -> walk_gary
+ { not six_g and not gary_here and imran_here } [(Go to Imran.)]
    -> walk_imran
+ { not six_w and wendell_here } [(Go to Wendell.)]
    -> walk_wendell
+ { not six_vic and vic_here } [(Go to Victoria.)]
    -> walk_victoria
+ [That's everyone.]
    -> phone_beat

// Alignment A2: Ghost's last word and the Recruiter's arrive here, inside the
// scene, before the numbers (the JSON texts T-47 to T-55 stay as the thread's
// record). Read by the narrator as the texts they are.
=== phone_beat ===
Narrator: Your phone buzzes on the bonnet. A number with no name.
{
- ghost_answer == "not_why":
    Narrator: 'Neither was this. Clean exit.'
- ghost_answer == "card_unsigned":
    Narrator: 'Mine will be too. Clean exit.'
- ghost_answer == "ask_them":
    Narrator: 'I did. They didn't know who I was. Clean exit.'
- ghost_answer == "hospitals":
    Narrator: 'Clean. I noticed.'
- ghost_answer == "trust":
    Narrator: 'You checked. Most don't.'
- ghost_sale == "bait" and head_start_killed == "ghost":
    Narrator: 'Five buyers paid for nothing, and you have their names. I kept the money. Clean exit.'
- ghost_sale == "bait":
    Narrator: 'Sold. You watched who bought it. I hope the names were worth it. Clean exit.'
- else:
    Narrator: 'Left on a quiet day, as you asked. First sale I ever turned down. Clean exit.'
}
{ m09_recruiter_offer == "double_crossed":
    Narrator: A second number, American. 'I'll remember the shape of you.'
}
+ [(Put the phone away.)]
-
-> numbers

// Each pick counts once, then returns to the hub.
=== walk_back ===
~ six_picks = six_picks + 1
-> walkabout

// Quintero (group B's voice): MC §4 C1's 06:00 line by stance; a knock-out or
// a wrong accusation takes the line instead.
=== walk_quintero ===
~ six_q = true
{
- quintero_ko:
    Agent 0x2D 'Anchor': Somebody put me on the floor down there. I know who. I'd like to know why, one day.
- officer_out == "quintero":
    Agent 0x2D 'Anchor': I watched the whole thing on a screen in the van. Read the sheet next time.
- quintero_stance == "quintero" and m09_raid_team_answer == "quintero":
    Agent 0x2D 'Anchor': You backed me in Helena, and again tonight. I'll remember who did.
- quintero_stance == "quintero":
    Agent 0x2D 'Anchor': You backed me. I'll remember who did.
- quintero_stance == "netherton" and m09_raid_team_answer == "quintero":
    Agent 0x2D 'Anchor': You backed me in Helena. Not tonight. Next time, back the slow way. Once.
- quintero_stance == "netherton":
    Agent 0x2D 'Anchor': Next time, back the slow way. Once.
- quintero_wounded:
    Agent 0x2D 'Anchor': Shoulder. I've had worse from a door.
- else:
    Agent 0x2D 'Anchor': Everybody walked out. That's all I wanted from tonight.
}
-> walk_back

// Kowalczyk (group B's voice). C18 is asked in one of three places; 06:00
// plays her reply, and asks first after a line accusation (CONTRACT §1.6).
=== walk_kowalczyk ===
~ six_k = true
{
- m09_recruiter_offer == "double_crossed":
    Agent 0x5E 'Lantern': Eleven years. You'd think I'd mind more than I do.
    -> walk_back
- kowalczyk_answer == "":
    -> kow_question
- m09_recruiter_offer == "taken":
    -> kow_reply ->
    Agent 0x5E 'Lantern': I liked you. I'd still have pressed it.
    -> walk_back
- else:
    -> kow_reply ->
    -> walk_back
}

=== kow_question ===
Agent 0x5E 'Lantern': When did you know?
+ { not sleeper_caught } [I didn't. Not till you came through his door.]
    ~ kowalczyk_answer = "worked_out"
+ { sleeper_caught and clue_bench_log and m09_recruiter_offer != "taken" } [At the bench log. Then your name on the sign-out sheet.]
    ~ kowalczyk_answer = "bench"
+ { sleeper_caught and m09_recruiter_offer != "taken" } [At the briefing. You laughed too easily.]
    ~ kowalczyk_answer = "briefing"
+ { sleeper_caught and m09_recruiter_offer == "taken" } [In Helena. She sold me your name.]
    ~ kowalczyk_answer = "bench"
+ { sleeper_caught and m09_recruiter_offer == "taken" } [Before Helena. I had a feeling about you.]
    ~ kowalczyk_answer = "briefing"
+ { sleeper_caught and m09_recruiter_offer != "taken" } [I didn't. I worked it out.]
    ~ kowalczyk_answer = "worked_out"
-
-> kow_reply ->
Agent 0x5E 'Lantern': I liked you. I'd still have pressed it.
-> walk_back

=== kow_reply ===
{
- kowalczyk_answer == "bench" and m09_recruiter_offer == "taken":
    Agent 0x5E 'Lantern': Eleven years she paid my mum's care home. Then she sold me to you.
- kowalczyk_answer == "bench":
    Agent 0x5E 'Lantern': The paperwork. It's always the paperwork.
- kowalczyk_answer == "briefing":
    Agent 0x5E 'Lantern': *almost laughs* No, you didn't. But thank you.
- kowalczyk_answer == "worked_out":
    Agent 0x5E 'Lantern': That's worse. That means I was good.
}
// m09 A1: what the player said to her in Helena.
{
- m09_raid_team_answer == "kowalczyk":
    Agent 0x5E 'Lantern': You took my side in Helena, in front of Quintero. That was the hard part.
- m09_kowalczyk_reply == "warm":
    Agent 0x5E 'Lantern': You thanked me for the cracker, on the apron. I'd have liked to deserve it.
}
->->

// A wrongly accused officer never recalled (group B's voices).
=== walk_officer ===
~ six_o = true
{
- officer_out == "malhotra":
    Officer Dev Malhotra: I sat in the second van all night with my headset off. The log was right there.
- officer_out == "arakawa":
    Officer Kenji Arakawa: Sheriff opened the road at four. I'll still make Billings by Saturday.
- officer_out == "vector":
    { m08_accused_vector:
        Agent 0x23 'Vector': Twice now. I'll wait for the apology this time.
    - else:
        Agent 0x23 'Vector': Check it properly next time. I'll wait for the apology.
    }
- officer_out == "phantom":
    Agent 0x88 'Phantom': Tonight's on my list now. Under your name.
}
-> walk_back

// Voltage (group C's voice), by what happened in the power room.
=== walk_voltage ===
~ six_v = true
{
- voltage_outcome == "his_hands":
    Voltage (Critical Mass): You took me out of Albion in cuffs. Tonight you gave me my hands back. Tell the inquiry the shutter died first time.
- voltage_outcome == "by_hand" and m04_voltage_captured:
    Voltage (Critical Mass): Albion's agent, doing my job for me. Slower than me, but right.
- voltage_outcome == "by_hand":
    Voltage (Critical Mass): You let me walk out of Albion, and tonight you did my job for me. Slower, but right.
- voltage_outcome == "stood_down_print":
    Voltage (Critical Mass): You lifted my thumb at Albion and kept it for tonight. I'm still annoyed about it.
- voltage_outcome == "talked_down" and m04_voltage_escaped:
    Voltage (Critical Mass): *flatly* You let me walk out of Albion, and I never said a word since. Put that in too.
- voltage_outcome == "talked_down":
    Voltage (Critical Mass): *flatly* March to tonight, and I never said a word. Put that in too.
- voltage_outcome == "fought" or voltage_outcome == "ko":
    Voltage (Critical Mass): Albion, and now this. Next time, show me the sheet before you swing.
- else:
    Voltage (Critical Mass): You walked straight past my switchgear. I'm still deciding if that was an insult.
}
-> walk_back

// Gary (group C's voice), where he was in the bunker and is standing here.
=== walk_gary ===
~ six_g = true
{
- m02_gary_protected and gary_ko:
    Gary Whitlock: You saved my career and then put me on the floor. Consistent, I'll give you that.
- m02_gary_protected and imran_outcome == "taken_in":
    Gary Whitlock: They've put him in the van behind mine. I'll write to him. Somebody should.
- m02_gary_protected and imran_outcome == "talked_round":
    Gary Whitlock: Imran texted from the bus. First time he's thanked anyone for anything.
- m02_gary_protected and imran_outcome == "ko":
    Gary Whitlock: I sat with Imran till the medics came. He asked who it was. I said I didn't see.
- m02_gary_protected:
    Gary Whitlock: You kept my name clean at St. Catherine's. Tonight I got to spend it.
- gary_outcome == "talked_round":
    Gary Whitlock: St. Catherine's sacked me for being right. A board finally listened. Shame it's a review board.
- gary_outcome == "taken_in":
    Gary Whitlock: Nobody at St. Catherine's wanted my statement. Somebody asked tonight. First time in writing.
- gary_outcome == "ko":
    Gary Whitlock: I'd have come quietly, you know. I did at St. Catherine's.
- else:
    Gary Whitlock: Nobody came to my bench all night. Same as St. Catherine's.
}
-> walk_back

// Imran (group C's voice), when Gary isn't here and Imran didn't go home.
=== walk_imran ===
~ six_g = true
{
- imran_outcome == "taken_in":
    Imran Siddiqui: My mum thinks I'm on a course in Leeds. Can someone ring her before the news does?
- imran_outcome == "card_cloned":
    Imran Siddiqui: You copied my card while I was talking. I'd have handed it over if you'd asked.
- imran_outcome == "ko":
    Imran Siddiqui: You could have just asked me.
- else:
    Imran Siddiqui: Nobody asked me anything all night. Same as the board.
}
-> walk_back

// Wendell (group C's voice).
=== walk_wendell ===
~ six_w = true
{
- m04_voltage_escaped:
    Wendell Briggs: Kept my head down at the far panel. Never saw a thing, and I'll say so.
- wendell_outcome == "told":
    Wendell Briggs: Dale stayed home. Slept right through it, he says.
- wendell_outcome == "ko":
    Wendell Briggs: Somebody laid me out at my own panel. I'd like that in writing.
- else:
    Wendell Briggs: Do I still get paid for the week?
}
-> walk_back

// Victoria (group C's voice), only when she is in custody here.
=== walk_victoria ===
~ six_vic = true
{
- victoria_gallery == "ko":
    Victoria Sterling: You never did learn to ask first. Not in Cardiff, not here. I'll want a doctor, and then a lawyer.
- m03_victoria_fate == "recruited":
    Victoria Sterling: You turned me after WhiteHat, and tonight you cuffed me. You'll want my book one day. Ask nicely.
- else:
    Victoria Sterling: I walked out of WhiteHat. I won't walk out of this. You'll want my book one day. Ask nicely.
}
-> walk_back

// MC §10 rule 2: tonight's cost only. Netherton signs for each line.
=== numbers ===
Narrator: Netherton comes down the line of vans with a tablet under his arm.
+ [What did it cost, sir?]
+ [(Let him talk.)]
-
{ ending == "lethal":
    Director Magnus Netherton: He reached. I will put that first.
    Director Magnus Netherton: The cells have gone quiet since. They have a martyr now. Quiet is worse.
}
-> numbers_core ->
-> more_menu ->
+ [And the database?]
+ [(Nod.)]
-
-> database_beat

=== more_menu ===
{ not ((media_story_ran and ending != "executed") or kowalczyk_ko or quintero_ko or arakawa_ko or vector_ko or phantom_ko or victoria_gallery == "confronted" or (m06_assets_seized and ending != "executed")):
    ->->
}
+ [And the rest of it?]
+ [(Wait.)]
-
-> numbers_more ->
->->

// The head start, the bait's catch and the trace. Shared with the executed
// ending, which hears the same numbers.
=== numbers_core ===
{
- head_start_out == "both":
    Director Magnus Netherton: Two cells have it. We will be finding out which entries for a year.
- head_start_out == "zero_day":
    Director Magnus Netherton: Zero Day got its two hours. Nobody else did.
- head_start_out == "ghost":
    Director Magnus Netherton: Zero Day got nothing. The resale went out at four.
- else:
    Director Magnus Netherton: The cells got nothing at four.
}
{ head_start_killed == "ghost" and ghost_sale == "bait":
    Director Magnus Netherton: The resale's buyers paid for nothing. Five of them, and we have their names.
}
{ share_zero_day == "traced":
    Director Magnus Netherton: We followed Zero Day's share. Four buyers, and one of them was careless.
}
->->

// The story, our own people, the tap, the $12.8M. (SCRIPT_EDIT_R2 A2-01: the
// partial release is not repeated here; HaX and he said it at the core, and
// ELSEWHERE carries Seattle's batch.)
=== numbers_more ===
{ media_story_ran and ending != "executed":
    Director Magnus Netherton: Social Fabric ran its story from outside as we breached. Your photograph is on it, and not a word of it is true.
}
{ kowalczyk_ko or quintero_ko or arakawa_ko or vector_ko or phantom_ko:
    Director Magnus Netherton: Someone in the second van has bruises ENTROPY did not give them. I will want that explained.
}
{ victoria_gallery == "confronted":
    Director Magnus Netherton: The Zero Day tap went dark at five. She will have sold that too.
}
{ m06_assets_seized and ending != "executed":
    { database_outcome == "secured":
        Director Magnus Netherton: The Council is keeping the twelve point eight million with the copy, as evidence. I argued for the victims' fund. I lost.
    - else:
        Director Magnus Netherton: The twelve point eight million goes back to the victims' fund. I have signed for that as well.
    }
}
->->

// FA §4.6 "The database choice in the epilogue". One beat with a consequence.
=== database_beat ===
{
- database_outcome == "secured":
    Director Magnus Netherton: His copy goes into the vault tonight, beside ours.
    { ending != "executed":
        Agent HaX: Two maps now.
    }
    -> secured_cell ->
- database_outcome == "disclosed":
    { ending != "executed":
        Agent HaX: Forty vendors have acknowledged. Patch windows, ninety days. It'll be a year before most of them are fitted.
    }
    -> dark_ops ->
    { ending == "executed":
        Director Magnus Netherton: Three water utilities went to manual at five. There is no patch for their old controllers. They will turn the valves by hand till spring.
    - else:
        Agent HaX: Three water utilities went to manual at five. There's no patch for their old controllers. They'll turn the valves by hand till spring.
    }
- database_outcome == "both_wiped":
    -> scorched_close
}
{ ending == "executed":
    -> executed_close
}
-> van

// Secured: the first named operation rolls up its own cell (close_secure_cell).
=== secured_cell ===
{
- close_secure_cell == "zd_uk":
    Director Magnus Netherton: Sterling's watch paid out at five. Zero Day's UK desk is being picked up as we speak.
- close_secure_cell == "procurement":
    Director Magnus Netherton: Nightshade's channel paid out at five. The Initiative's procurement desk is in custody.
- close_secure_cell == "torres":
    Director Magnus Netherton: Torres's channel paid out at five. Two of the Recruiter's placements are in custody.
- close_secure_cell == "crypto":
    Director Magnus Netherton: The HashChain tags led us to the Crypto Anarchists' reserve. It was frozen at five.
- close_secure_cell == "cm":
    Director Magnus Netherton: The Critical Mass watch paid out at five. What is left of them is being picked up.
- else:
    Director Magnus Netherton: The order book's largest buyer was picked up at five.
}
->->

// Disclosed: the first two operations on MC §6.5's list go dark, each with
// its own fixed line (the same test order as the core's database knot).
=== dark_ops ===
~ temp n = 0
{ m03_victoria_fate == "recruited" and (victoria_gallery == "confronted" or victoria_gallery == "refused" or (victoria_gallery == "trusted" and head_start_killed == "zero_day")):
    ~ n = n + 1
    Director Magnus Netherton: Sterling's line went dead at five.
}
{ n < 2 and m08_nightshade_triple_agent and not m09_nightshade_shown_file:
    ~ n = n + 1
    Director Magnus Netherton: Nightshade has been moved. I cannot reach him.
}
{ n < 2 and m05_final_choice == "turn_double_agent":
    ~ n = n + 1
    Director Magnus Netherton: Torres stopped sending at five.
}
{ n < 2 and m06_monitoring_enabled:
    ~ n = n + 1
    Director Magnus Netherton: The HashChain tags dropped at five past.
}
{ n < 2 and m09_completed and not m09_albion_notified:
    ~ n = n + 1
    Director Magnus Netherton: The Critical Mass watch went blind at five.
}
{ n < 2:
    ~ n = n + 1
    Director Magnus Netherton: The order-book watch went quiet with the first patches.
}
{ n < 2:
    Director Magnus Netherton: Our tap on Zero Day's brokers dropped at ten past five.
}
->->

// Arrest and surrender: the van (FA §4.6 table). Lethal goes straight on.
=== van ===
{ ending != "arrest" and ending != "surrender":
    -> the_rest
}
Narrator: A police van idles by the gate. Tesseract sits in the back, his hands in his lap.
{ ending == "arrest":
    Narrator: He nods to HaX through the window.
    Agent HaX: You'll want a lawyer, Adrian. Get a good one. I'm testifying.
- else:
    Narrator: HaX climbs into the back of the van and sits with him for a minute. Nobody hears what they say.
}
+ [(Go to the van window.)]
+ [(Stay where you are.)]
-
Dr Adrian Tesseract: I wrote that chapter, Magnus.
Director Magnus Netherton: I know. I kept it to one page.
{ nightshade_taken_in:
    Narrator: Nightshade stops at the van window on his way past.
    Agent 0x47 'Nightshade': You wrote me as a line item.
    Dr Adrian Tesseract: You were a good one.
}
{ ending == "arrest":
    Director Magnus Netherton: A trial. He will make speeches. Let him.
    Director Magnus Netherton: He is in a cell. The cells are not.
- else:
    Director Magnus Netherton: There will be no trial.
    Director Magnus Netherton: His protocol was good. The couriers went at half five, and their quartermaster with them.
}
-> the_rest

// HaX: the forty-seven (kept or denied), then the promise from Helena, then
// her last word by ending (FA §4.6 table). The screen reaches six as it lands.
=== the_rest ===
-> season ->
{
- wren_at_core and not sleeper_caught and not six_k:
    Agent HaX: Kowalczyk came through his door for the key. Nobody named her before she did it herself.
- kowalczyk_ko and not sleeper_caught:
    Agent HaX: Kowalczyk's awake in the second van. She hasn't asked who put her there.
}
-> fortyseven ->
{ ending == "arrest":
    Narrator: The van pulls out through the gate.
    Agent HaX: It's afterwards.
}
+ { m09_completed } [You said you'd tell me the rest.]
+ [(Stand with her.)]
-
Agent HaX: The night he left, he asked me to go with him.
Narrator: On the table, the screen turns over to six. Nothing happens.
{
- ending == "arrest":
    #set_global:six_done:true
    #set_global:closing_done:true
    Agent HaX: I said no. It took me till morning.
- ending == "surrender":
    Agent HaX: I said no. It took me till morning.
    #set_global:six_done:true
    #set_global:closing_done:true
    Agent HaX: He asked who taught you. I said I did.
- else:
    Agent HaX: I said no. It took me till morning.
    #set_global:six_done:true
    #set_global:closing_done:true
    Agent HaX: There'll be a board. I'll be sitting next to you.
}
~ six_quiet = true
#exit_conversation
-> finished

// A fixed beat before the rest, outside the walkabout (D-07); harder on denied.
=== fortyseven ===
{
- m09_recruiter_secret == "kept":
    -> fortyseven_kept
- m09_recruiter_secret == "denied":
    -> fortyseven_denied
}
->->

=== fortyseven_kept ===
Agent HaX: Now. The forty-seven. Tell me properly, and then it's done.
+ [(Tell her properly.)]
    Narrator: You tell her all of it. She doesn't interrupt.
    ->->

=== fortyseven_denied ===
Agent HaX: The forty-seven. You told me she was fishing. Now tell me what she actually said.
+ [(Tell her the truth.)]
    Narrator: You tell her. She doesn't look at you until you've finished.
    Agent HaX: Don't do that to me again.
    ->->

// Scorched Earth: the suspension and the wipe's gain end this scene; the
// hearing tells the rest and closes the night (OT §4.7).
=== scorched_close ===
-> season ->
Director Magnus Netherton: Agent 0x00. As of now you are suspended, pending a hearing.
+ [Understood, sir.]
+ [(Say nothing.)]
-
Director Magnus Netherton: I wanted to do the same. That is why you are suspended and I am not.
#set_global:six_done:true
Director Magnus Netherton: Nobody holds the map now. Not him, not the buyers, not whoever sits in my chair next.
~ six_quiet = true
#exit_conversation
-> finished

// MC §8.3: no walkabout, no rest, no HaX. The screen carries Social
// Fabric's story as the object's own text; no narrator reads it.
=== executed ===
Narrator: The forward post at six. The screen on the table isn't showing the clock any more.
Director Magnus Netherton: I will not put my name under this one. You will be held until the board sits.
// Alignment A2 (ruling D2): the screen inside the scene, as on-screen text
// (speaker Screen, unvoiced). Still no narrator reads it.
+ [(Look at the screen.)]
-
Screen: SOCIAL FABRIC. LIVE. SAFETYNET AGENT SHOOTS UNARMED MAN IN MONTANA BUNKER.
Screen: A SAFETYNET agent shot a man in a converted Cold War bunker in Montana tonight. He was not moving. His hands were empty, and in plain sight.
+ [(Say nothing.)]
+ [Sir...]
-
-> numbers_core ->
-> numbers_more ->
+ [(Say nothing.)]
-
-> database_beat

=== executed_close ===
Director Magnus Netherton: Take 0x00 to the second van. Nobody discusses tonight with them until the board sits.
// Alignment A2: HaX's later message inside the scene (T-56 stays as the thread's record).
Narrator: In the van, your phone lights once. HaX.
#set_global:six_done:true
#set_global:closing_done:true
Narrator: 'I'll be at the board. I don't know what I'll say.'
~ six_quiet = true
#exit_conversation
-> finished

// Join never comes here; a stray open exits at once.
=== exit_only ===
~ six_quiet = true
#exit_conversation
-> finished

// Resting point. The closing mappings carry !closing_done, so a reopen is a
// stray: it says nothing and exits.
=== finished ===
{ six_quiet:
    ~ six_quiet = false
- else:
    -> exit_only
}
+ [(Leave it.)]
    -> exit_only

// Alignment A5 (ruling D1 c): the one line on the player's side that adds the
// season up (season_line() picks it), then Helena's memo answer (m09 A1).
// Nothing on a cold start. Before "the rest", and before the suspension.
=== season ===
~ temp key = season_line()
{
- key == "albion_full":
    Director Magnus Netherton: You told Albion's public the truth. That is why the Council let me run this raid at all.
- key == "albion_half":
    Director Magnus Netherton: Albion's half-truth bought us a quiet year. Tonight we spent it.
- key == "albion_quiet":
    Director Magnus Netherton: We buried Albion. Tonight I signed for every line we left out.
- key == "stcath_exposed":
    Director Magnus Netherton: Forty hospitals patched after St. Catherine's. The pumps on his list were not among them. They will be now.
- key == "stcath_bed4":
    Director Magnus Netherton: You kept a man breathing by hand at St. Catherine's. Tonight was the same work, longer.
- key == "austin_covered":
    Director Magnus Netherton: You covered Austin when the numbers said otherwise. You did the same tonight.
- key == "austin_uncovered":
    Director Magnus Netherton: Eleven counties have dropped calls since Denver. Tonight is the first night I can tell them why.
- key == "mole":
    Director Magnus Netherton: You caught one of ours at his own desk. Tonight you walked through his door and came back.
- key == "first_week_button":
    Director Magnus Netherton: Your first week, you took your hand off a button. Tonight you did it again.
- key == "first_week":
    Director Magnus Netherton: I signed your first field report. I have signed for every one since.
}
{ m09_completed:
    {
    - m09_memo_stance == "yes_albion":
        Director Magnus Netherton: You told me he was right about Albion. He was. It never made him right about anything else.
    - m09_memo_stance == "no":
        Director Magnus Netherton: You told me he was wrong about all of it. I put that answer under my signature tonight.
    }
}
->->
