INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: DR ADRIAN TESSERACT, the core.
// NPC id: tesseract (person, koImmune). displayName "Dr Adrian Tesseract".
// Contract: CONTRACT.md §1.3. Every entry goes start -> core_router, which
// routes on globals only (a person-chat restarts after a reload). Every menu
// writes its global on the pick, before any reply line.
// Second speakers in this file: Agent HaX, Director Magnus Netherton (group B's
// voices) and Agent 0x5E 'Lantern' (Kowalczyk). No phone call at the core.
// Knots exch_1..exch_3 are the contract's exchange_1..exchange_3: ink won't let
// a knot share a name with a global (group A report).
// ===========================================

// File-locals (tess_ prefix; never a scenario global's name)
VAR tess_quiet = false      // set before every exit, so a reopen of `parked` re-routes
VAR tess_asked_hax = false  // "[HaX. What would you do?]" asked once
VAR tess_menu = false       // set before every divert into a choices-only menu; a reopen finds it false and re-routes
VAR tess_bridge = false     // true only on the first pass through exch_bridge

=== start ===
-> core_router

// Resting point after every #exit_conversation (m02/m03 quiet pattern). The
// first pass after an exit prints nothing; a re-talk that lands here re-routes.
=== parked ===
{ tess_quiet:
    ~ tess_quiet = false
- else:
    -> core_router
}
+ [(Turn back to him.)]
    -> core_router

// OT §4.6, first that holds. No text of its own.
=== core_router ===
{
- m09_recruiter_offer == "double_crossed" and not wren_at_core:
    -> double_cross_open
- not core_greeted:
    -> arrival
- not (flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted):
    -> finish_box
- not flag4_heard:
    -> flag4_lines
- not case_heard:
    -> case
- exchange_1 == "":
    -> exch_1
- exchange_2 == "":
    -> exch_2
- exchange_3 == "":
    -> exch_3
- console_choice == "":
    -> console
- whodunit_live and not wren_held and not kowalczyk_ko and console_choice == "stopped" and not wren_at_core:
    -> wren_beat
- database_outcome == "":
    -> database
- ending == "":
    -> his_end
- else:
    -> after_end
}

// MC §6.4, the double-cross. The player walks in on the end of his refusal.
// No Quintero: held, knocked out, sent back, or breached ahead on the tether
// and still on her way (MC §3.1).
=== double_cross_open ===
Narrator: Kowalczyk is standing by the service door, empty-handed. He hasn't left his chair.
Dr Adrian Tesseract: ...it proves nothing. It has to be one of theirs.
Agent 0x5E 'Lantern': Adrian.
Agent HaX: ...Quintero. Core. Now.
{
- quintero_ko or officer_out == "quintero" or (nightshade_tethered and m09_sleeper_named):
    -> double_cross_take
- else:
    ~ quintero_enters_core = true
    ~ wren_at_core = true
    ~ sleeper_caught = true
    Narrator: Quintero comes in from the lock and takes Kowalczyk by the arm. Kowalczyk doesn't fight her.
    -> double_cross_out
}

=== double_cross_take ===
Narrator: Nobody comes. Kowalczyk looks at you, and waits.
+ [Take her.]
    ~ wren_at_core = true
    ~ sleeper_caught = true
    Narrator: You take her by the arm. She doesn't fight you.
    -> double_cross_out

=== double_cross_out ===
Agent 0x5E 'Lantern': She told me you'd break it. The Recruiter. She was right about you.
Narrator: She goes out through the lock without looking back at him.
-> core_router

// OT §4.5, §4.6 step 2. His release line, then HaX back on the open line as
// the second speaker (she was jammed in the gallery).
=== arrival ===
{
- head_start_out == "both":
    Dr Adrian Tesseract: Two cells have it. Much good may it do them.
- head_start_out == "zero_day":
    Dr Adrian Tesseract: Zero Day has it. You didn't stop that one.
- head_start_out == "ghost":
    Dr Adrian Tesseract: Someone's buyers have it. Not Zero Day's.
- else:
    Dr Adrian Tesseract: Nothing went at four. You were thorough.
}
Dr Adrian Tesseract: Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you.
{ m09_recruiter_offer == "double_crossed":
    Agent HaX: 0x00. I've got you clean now.
- else:
    Agent HaX: ...back. 0x00.
}
{
- head_start_out == "both":
    Agent HaX: Confirmed. Both shares went at the lock.
- head_start_out == "zero_day":
    Agent HaX: Confirmed. Zero Day's went.
- head_start_out == "ghost":
    Agent HaX: Confirmed. The resale went.
- else:
    Agent HaX: Confirmed. Nothing left the lock.
}
{ m04_voltage_captured:
    Agent HaX: Voltage said above Blackout it stops being a person you can arrest. There's the person.
}
Dr Adrian Tesseract: Ninety-nine. You've done well with them.
Agent HaX: Still HaX.
Agent HaX: Get on his box. He'll keep.
~ core_greeted = true
~ tess_menu = true
-> arrival_menu

=== arrival_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [You were paying them for a head start?]
    { head_start_out == "none":
        Dr Adrian Tesseract: Good. I never liked paying them.
    - else:
        Dr Adrian Tesseract: Two hours for people who'll waste it. They were always scenery.
    }
    ~ tess_menu = true
    -> arrival_menu_2
+ [(Go to his terminal.)]
    Dr Adrian Tesseract: I'll be here.
    ~ tess_quiet = true
    #exit_conversation
    -> parked

=== arrival_menu_2 ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [(Go to his terminal.)]
    Dr Adrian Tesseract: I'll be here.
    ~ tess_quiet = true
    #exit_conversation
    -> parked

// OT §4.6 step 3: walked up before flag 4.
=== finish_box ===
Dr Adrian Tesseract: Finish on my box first. I'll keep.
~ tess_quiet = true
#exit_conversation
-> parked

// SE §3.1 "As flag 4 lands"; MC §6.1. HaX inside his conversation. Opened by
// his own mapping on flag4_submitted, or on a walk-up after a reload.
=== flag4_lines ===
{ m09_completed:
    Agent HaX: The notice you read in Helena is on here too.
- else:
    Agent HaX: He argued for the vendor nine years ago and lost.
    Agent HaX: The notice is on here. He wrote it himself, and he never sent it.
}
Agent HaX: I've got his box. If anything goes out from that console, I can try to kill the feed. Try.
+ [Only try?]
    Agent HaX: His console. I can't see what he's wired behind it.
+ [Understood.]
-
Agent HaX: And the line into our vault is open from here. We left it open.
Agent HaX: He's rigged this room. If both copies die, it purges: doors, lights, all of it. He'll be ready for that. We won't.
~ flag4_heard = true
-> core_router

// FA §4.1 step 1; SE §2.2; MC §6.2. The Publication, the offer every player
// hears, his evidence (three record lines at most, two before an answer), then
// the Recruiter beat. A choice at least every three lines.
=== case ===
Dr Adrian Tesseract: All four. Good. Now it's my turn.
+ [Go on, then.]
+ [Step away from the console first.]
    Dr Adrian Tesseract: No. But I'll keep my hand where you can see it.
-
Dr Adrian Tesseract: At six it starts going out, city by city. Everything SAFETYNET ever found, free, with working detail.
Dr Adrian Tesseract: Press this, and it goes everywhere in the same minute. Eleven hundred to twenty-six hundred, the first month.
Dr Adrian Tesseract: Hospitals, dispatch, water. In the hands of people who could never have got in before.
+ [You'd kill eleven hundred people to make a point.]
    Dr Adrian Tesseract: At the low end. I don't round down.
+ [And then what?]
-
Dr Adrian Tesseract: Then it stops, because every vendor on earth patches at once, and nobody can hoard what everybody has.
Dr Adrian Tesseract: Every year your service keeps its map, it costs more than that. Nobody counts it. I did.
+ [You've had all night. Why haven't you pressed it?]
+ [You could have done this from anywhere. Why wait for me?]
-
Dr Adrian Tesseract: It has to be one of you. If I press it, it's a crime. If you press it, it's a confession.
Dr Adrian Tesseract: Either you press it, or I get a courtroom. I've costed both.
{ m01_player_launched_attack:
    Dr Adrian Tesseract: You pressed it once, on your first day. You know what it costs, and you know you could.
}
+ [I'm not pressing anything.]
+ [Why would I?]
-
{
- m06_satoshi_stance == "wondered":
    Dr Adrian Tesseract: You told a man waiting for the police that you sometimes wonder whether we're right. I liked that.
- m06_satoshi_stance == "rejected":
    Dr Adrian Tesseract: You told him murder was murder. I'm offering you a number instead.
- m06_satoshi_stance == "refused":
    Dr Adrian Tesseract: You told him no without thinking. Think now.
}
{ m07_completed:
    Dr Adrian Tesseract: I told you once I prefer to watch. I've watched.
- else:
    Dr Adrian Tesseract: I prefer to watch. I've watched you.
}
{
- m04_completed and m04_disclosure_choice == "full":
    Dr Adrian Tesseract: You told them the truth, and they audited every site. That was my lesson, delivered by you.
- m04_completed and m04_disclosure_choice == "partial":
    Dr Adrian Tesseract: You told them half. Half is how we got here.
- m04_completed and m04_disclosure_choice == "quiet":
    Dr Adrian Tesseract: You buried it. You understand me better than you admit.
- else:
    Dr Adrian Tesseract: Albion. A plant left open because someone decided the hole was worth more than the fix. I argued against that, once.
}
+ [You've been reading my file.]
    Dr Adrian Tesseract: Files are written by people who need you to be a shape. I read the work.
+ [That was my call. Not yours.]
    Dr Adrian Tesseract: It was. I'm only reading it back.
-
{
- m01_completed and m01_final_choice == "fight":
    Dr Adrian Tesseract: You beat a marketing manager and called it a war.
- m01_completed and m01_final_choice == "recruit":
    Dr Adrian Tesseract: You asked Derek to turn. He had nothing to turn with. I saw to that.
- m01_completed and m01_final_choice == "expose":
    Dr Adrian Tesseract: You put Derek in the papers. The papers did my recruiting for a month.
- m01_completed and m01_final_choice == "surrender":
    Dr Adrian Tesseract: Derek gave himself up because I told him to. You were meant to wonder why.
- else:
    Dr Adrian Tesseract: You handed Derek over. He kept his promise to me and said nothing.
}
{
- m07_completed and m07_debrief_stance == "defended":
    Dr Adrian Tesseract: 'I'd make it again.' You would. I counted on it.
- m07_completed and m07_debrief_stance == "owned":
    Dr Adrian Tesseract: You said it was yours. You'll carry this too.
- m07_completed and m07_debrief_stance == "refused":
    Dr Adrian Tesseract: 'Don't ask me to rank them.' I ranked them for you.
- m07_completed and m07_debrief_stance == "hardened":
    Dr Adrian Tesseract: You asked your Council for the numbers. They're on the desk outside. Did you look?
- else:
    Dr Adrian Tesseract: Two of yours died at the sites nobody covered. I've read their names.
}
Dr Adrian Tesseract: Since your first day.
+ [Then you know I won't press it.]
    Dr Adrian Tesseract: I know you haven't yet.
+ [You've watched. So what?]
-
-> case_recruiter

// MC §6.2: m09's two Recruiter exports, once each, here.
=== case_recruiter ===
{
- m09_recruiter_secret == "kept":
    Dr Adrian Tesseract: You heard the receipt in Helena, Ninety-nine. Your agent never explained it, did they.
    Agent HaX: I'll deal with that when this is done.
- m09_recruiter_secret == "told" or m09_recruiter_secret == "confessed":
    Dr Adrian Tesseract: Forty-seven names, Ninety-nine. Your agent...
    Agent HaX: They told me. Next.
- m09_recruiter_secret == "denied":
    Dr Adrian Tesseract: You heard the receipt in Helena, Ninety-nine. Forty-seven names, and your agent kept every one of them from you.
    Agent HaX: You told me she was fishing.
}
{
- m09_recruiter_offer == "double_crossed":
    Narrator: He glances at the service door.
    Dr Adrian Tesseract: You bought WREN from my Recruiter. You understand costing.
- m09_recruiter_offer == "taken":
    Dr Adrian Tesseract: You bought WREN from my Recruiter. You understand costing.
- (m09_recruiter_offer == "named" or m09_recruiter_offer == "refused") and m09_albion_notified:
    Dr Adrian Tesseract: My Recruiter offered you a name. You wouldn't buy it. I would have.
}
+ [Make your argument, then.]
+ [Say what you came to say.]
-
~ case_heard = true
Dr Adrian Tesseract: Three things. Answer them properly and I'll tell you so.
-> core_router

// ===========================================
// The three exchanges (MC §6.3; SE §2.3; CONTRACT §5.4). Four fixed slots in a
// fixed order: evidence decoy, rebuttal, record pool, record pool (exchange 3:
// evidence decoy, record pool, rebuttal, record pool). The plain decoy fills the
// first empty record slot; a record answer under the wrong claim goes last.
// Cold-start button words: ex1 12/13/14, ex2 13/14/11, ex3 13/11/12, so the
// rebuttal is never the longest or the shortest.
// ===========================================

// Exchange 1. "The cost is acceptable."
=== exch_1 ===
{ casualty_sheet_read:
    Dr Adrian Tesseract: You've seen the sheet. You think the number's obscene.
- else:
    Dr Adrian Tesseract: You've heard the number. You think it's obscene.
}
Dr Adrian Tesseract: That's the cheapest it will ever be. Wait a year and the number goes up.
~ tess_menu = true
-> exch_1_menu

=== exch_1_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
~ temp hard = m07_completed and m07_debrief_stance == "hardened"
~ temp clean = m01_completed and not (m01_maya_ko or m01_kevin_ko or m01_sarah_ko) and not m01_player_launched_attack and not m02_patient_assaulted and ko_pattern() == 0
~ temp bag = m02_bed4_manually_stabilised
~ temp derek = m09_cage_bin == "derek_file"
~ temp slot3 = hard or clean
~ temp slot4 = bag or derek
// slot 1: evidence decoy (order, not price)
+ [Your schedule puts the hospitals first, and you chose that order yourself.]
    ~ exchange_1 = "miss"
    -> exch_1_sting ->
    Dr Adrian Tesseract: I chose the order. I asked whether the price was worth paying.
    -> bridge_in
// slot 2: the rebuttal, sharper once Asante's correction is confirmed
+ { margin_note_read or asante_confirmed_sheet } [Asante corrected your sheet, and you signed your old figure under her initials.]
    ~ exchange_1 = "rebuttal"
    -> exch_1_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* I knew.
    -> bridge_in
+ { not (margin_note_read or asante_confirmed_sheet) } [Someone corrected your sheet upwards, and you signed your old number under it.]
    ~ exchange_1 = "rebuttal"
    -> exch_1_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* I signed it.
    -> bridge_in
// slot 3: hardened > the clean first day > plain decoy
+ { hard } [Your Council's curve is on the desk outside. It doesn't stop after a month.]
    ~ exchange_1 = "record"
    -> exch_1_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* No. It wouldn't.
    -> bridge_in
+ { not hard and clean } [My first day, I had a choice to hurt people. I didn't.]
    ~ exchange_1 = "record"
    -> exch_1_sting ->
    Dr Adrian Tesseract: One agent is an anecdote.
    -> first_landed ->
    Dr Adrian Tesseract: *pause* I'll grant you the anecdote.
    -> bridge_in
+ { not slot3 } [You'll be in a cell long before the first month of this is over.]
    -> exch_1_plain
// slot 4: the bag > Derek's file > plain decoy (when slot 3 took a record)
+ { bag } [I bagged one man by hand for an hour. Your sheet calls him rounding.]
    ~ exchange_1 = "record"
    -> exch_1_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* I had him as rounding. He wasn't.
    -> bridge_in
+ { not bag and derek } [You priced Derek before anyone hired him. You hand your costs out.]
    ~ exchange_1 = "record"
    -> exch_1_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* Derek paid it. I didn't.
    -> bridge_in
+ { slot3 and not slot4 } [You'll be in a cell long before the first month of this is over.]
    -> exch_1_plain
// after slot 4: a record answer under the wrong claim
+ { m04_completed and m04_disclosure_choice == "full" } [I told Albion's public the truth. They audited every site. Nobody died for it.]
    ~ exchange_1 = "miss"
    -> exch_1_sting ->
    Dr Adrian Tesseract: True, and beside the point. I asked what it costs.
    -> bridge_in

=== exch_1_plain ===
~ exchange_1 = "miss"
-> exch_1_sting ->
Dr Adrian Tesseract: That's about me. I asked about a price.
-> bridge_in

// A breath between exchanges, so his response and his next claim never run
// together (the pacing rule). The exchange is already written.
=== bridge_in ===
~ tess_bridge = true
-> exch_bridge

// A reopen lands here with tess_bridge false and goes straight on.
=== exch_bridge ===
{ tess_bridge:
    ~ tess_bridge = false
- else:
    -> core_router
}
+ [Go on.]
+ [You're not finished.]
-
-> core_router

// Ledger sting (SE §2.1): stings, decides nothing.
=== exch_1_sting ===
{ m02_completed and m02_patient_bed4_deceased:
    Dr Adrian Tesseract: Bed four at St. Catherine's. I have him as one. You were in the building.
}
->->

// The narrator marks the first landed point only (SE §2.1). Called right after
// the pick has written its exchange, so a count of one means this is the first.
=== first_landed ===
{ landed_count() == 1:
    Narrator: He looks at the console for a long moment.
}
->->

// Exchange 2. "Services like yours hoard. Only a shock fixes it."
=== exch_2 ===
{
- exchange_1 == "rebuttal":
    Dr Adrian Tesseract: Then the price is wrong. The reason isn't.
- exchange_1 == "record":
    Dr Adrian Tesseract: Then your record argues with my sums. It doesn't argue with my reason.
- else:
    Dr Adrian Tesseract: You've no answer to the price. Then hear why I'll pay it.
}
Dr Adrian Tesseract: Infusion pumps. A hundred and forty hospitals. Your service has known for three years and calls it an asset.
Dr Adrian Tesseract: Nobody fixes anything until it hurts everyone at once.
~ tess_menu = true
-> exch_2_menu

=== exch_2_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
~ temp full = m04_completed and m04_disclosure_choice == "full"
~ temp exposed = m02_exposed_hospital
~ temp notice = m09_albion_notified
~ temp clean_rec = m09_recruiter_offer == "named" or m09_recruiter_offer == "refused"
~ temp slot3 = full or exposed
~ temp slot4 = notice or clean_rec
// slot 1: the rebuttal (about "only")
+ [Only a shock? You never tried. You wrote the notice and kept it.]
    ~ exchange_2 = "rebuttal"
    -> first_landed ->
    Dr Adrian Tesseract: No. I didn't send it.
    -> bridge_in
// slot 2: evidence decoy (the price again)
+ [The pump flaw's on your own schedule. You'll hand it to everyone at six.]
    ~ exchange_2 = "miss"
    Dr Adrian Tesseract: I will. That's the price again. I asked whether anything else works.
    -> bridge_in
// slot 3: earlier missions, full disclosure > St. Catherine's > plain decoy
+ { full } [I told Albion's public the truth. They audited every site. Nobody died for it.]
    ~ exchange_2 = "record"
    -> albion_sting ->
    -> first_landed ->
    { m04_crew_lost:
        Dr Adrian Tesseract: *pause* None of them died of the truth. I'll grant that.
    - else:
        Dr Adrian Tesseract: *pause* No. Nobody did.
    }
    -> bridge_in
+ { not full and exposed } [I published St. Catherine's cover-up. Forty hospitals fixed their networks. Nobody died.]
    ~ exchange_2 = "record"
    -> first_landed ->
    Dr Adrian Tesseract: *pause* Done properly. Yes.
    -> bridge_in
+ { not slot3 } [Eleven hundred people at the low end. You can't spend them.]
    -> exch_2_plain
// slot 4: Helena, the notice > the clean record > plain decoy
+ { notice } [I sent your notice from Helena, nine years after you wrote it.]
    ~ exchange_2 = "record"
    -> albion_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* Sooner than I managed.
    -> bridge_in
+ { not notice and clean_rec } [Your Recruiter offered me a name. I wouldn't buy it from her.]
    ~ exchange_2 = "record"
    -> first_landed ->
    { m09_recruiter_offer == "named":
        Dr Adrian Tesseract: *pause* No. You'd rather the slow way. It worked.
    - else:
        Dr Adrian Tesseract: *pause* No. You let her keep her people sooner than pay her. I didn't think your service still did that.
    }
    -> bridge_in
+ { slot3 and not slot4 } [Eleven hundred people at the low end. You can't spend them.]
    -> exch_2_plain

=== exch_2_plain ===
~ exchange_2 = "miss"
Dr Adrian Tesseract: That's the price again. I've moved on to why.
-> bridge_in

// Ledger sting on an answer argued from Albion (FA row 47).
=== albion_sting ===
{ m04_completed and m04_crew_lost:
    Dr Adrian Tesseract: Nine of the night crew at Albion. I've read the inquiry.
}
->->

// Exchange 3. "Someone has to make it hurt. Better me, with clean hands."
// His one use of the line. The knock-out pattern stings before any response.
=== exch_3 ===
{
- exchange_2 == "rebuttal":
    Dr Adrian Tesseract: Then I'm late. Someone still has to do it.
- exchange_2 == "record":
    Dr Adrian Tesseract: Then it can be done without bodies. Someone still has to make them do it.
- else:
    Dr Adrian Tesseract: You can't tell me who hoards. Then let me tell you who pays.
}
Dr Adrian Tesseract: I taught a room of twenty, once. Let it hurt afterwards, not during.
{ m07_architect_echo_heard:
    Agent HaX: You heard him say that on your handset.
}
Dr Adrian Tesseract: Somebody has to be the during. Better me.
{ m09_hax_confession_answer == "should_have_told":
    Agent HaX: My agent told me I sat on it. They were right. You never told me anything.
}
~ tess_menu = true
-> exch_3_menu

=== exch_3_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
~ temp speaker = m09_hax_confession_answer == "same_in_your_place" or m09_hax_confession_answer == "afterwards"
~ temp taught = m09_hax_confession_answer == "should_have_told"
~ temp tapes = m09_deck_pulled == "alpha_tapes"
~ temp helena = m09_completed
~ temp slot2 = speaker or taught
~ temp slot4 = tapes or helena
// slot 1: evidence decoy (the price again)
+ [Your schedule sends the pumps out first. That's a target list with reasons.]
    ~ exchange_3 = "miss"
    -> ko_sting ->
    Dr Adrian Tesseract: You've told me the cost. I asked who does the hurting.
    -> core_router
// slot 2: HaX, by her answer in Helena > plain decoy
+ { speaker } [HaX. You're on speaker.]
    ~ exchange_3 = "record"
    -> ko_sting ->
    { m09_hax_confession_answer == "afterwards":
        Agent HaX: All right. Let him hear it from me.
    }
    Agent HaX: You said it to twenty of us in a room with no windows. I wrote it on the back of my hand.
    Agent HaX: I've said it to every agent I've run since. I never once meant 'so someone else can bleed'.
    -> first_landed ->
    Dr Adrian Tesseract: Ninety-nine.
    -> core_router
+ { taught } [She learned that from you.]
    ~ exchange_3 = "record"
    -> ko_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* Yes. By example.
    -> core_router
+ { not slot2 } [Nobody elected you to teach the whole world a lesson.]
    -> exch_3_plain
// slot 3: the rebuttal
+ [Better you? You need my hand on that key so yours stays clean.]
    ~ exchange_3 = "rebuttal"
    -> ko_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* Better me, I said. And I brought you.
    -> core_router
// slot 4: the Tomb Alpha notes > what HaX does with the line > plain decoy
+ { tapes } [Your Tomb Alpha notes say carry it. They never say hand it on.]
    ~ exchange_3 = "record"
    -> ko_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* I was younger. I meant it then.
    -> core_router
+ { not tapes and helena } [She carries it so she never hands it on. You never taught that part.]
    ~ exchange_3 = "record"
    -> ko_sting ->
    -> first_landed ->
    Dr Adrian Tesseract: *pause* I never said it. She worked it out.
    -> core_router
+ { slot2 and not slot4 } [Nobody elected you to teach the whole world a lesson.]
    -> exch_3_plain

=== exch_3_plain ===
~ exchange_3 = "miss"
-> ko_sting ->
Dr Adrian Tesseract: Nobody elected the people who hoard, either. I asked who does the hurting.
-> core_router

// FA §3.6: the knock-out pattern, by band; 0 says nothing.
=== ko_sting ===
~ temp k = ko_pattern()
{
- k >= 4:
    Dr Adrian Tesseract: Most of the operations I've watched, you put someone on the floor who wasn't armed. That isn't a lapse. It's a method.
- k >= 2:
    Dr Adrian Tesseract: More than once, you've put someone on the floor who wasn't armed. Clean hands, Agent?
- k == 1:
    Dr Adrian Tesseract: You put someone on the floor who wasn't armed. Once. I noticed.
}
->->

// ===========================================
// The console (MC §6.4) and Join (MC §6.7; FA §4.3). Join resumes at the
// furthest step reached, by its menu only, so the casualty figure is said once.
// ===========================================
=== console ===
{
- join_step >= 3:
    Dr Adrian Tesseract: The key's where you left it.
    ~ tess_menu = true
    -> join_2_menu
- join_step == 2:
    Dr Adrian Tesseract: The key's where you left it.
    ~ tess_menu = true
    -> join_2_menu
- join_step == 1:
    Dr Adrian Tesseract: You were asking how it works.
    ~ tess_menu = true
    -> join_1_menu
}
Narrator: His hand is still beside the key.
Dr Adrian Tesseract: That's my argument. The key is yours to use or not.
~ tess_menu = true
-> console_menu

=== console_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [Stop it.]
    -> console_stop
+ [Show me how it works.]
    { join_step < 1:
        -> join_1
    }
    Dr Adrian Tesseract: You were asking how it works.
    ~ tess_menu = true
    -> join_1_menu

// "Stop it": written on the pick. The partial release goes now if the
// backdoor's channel was left open (FA §4.2).
=== console_stop ===
~ console_choice = "stopped"
{
- backdoor_channel_live and not backdoor_closed and m07_team_redirected:
    ~ partial_release = "small"
- backdoor_channel_live and not backdoor_closed:
    ~ partial_release = "large"
- else:
    ~ partial_release = "none"
}
{ m09_deck_pulled == "alpha_tapes" and whodunit_live and not wren_held and not kowalczyk_ko and not wren_at_core:
    Agent HaX: Service door. He always builds his own way out first.
}
Narrator: The release goes dead under your hands. He doesn't try to stop you.
{
- m09_reading_finished and m09_cage_bin != "derek_file":
    Dr Adrian Tesseract: Then I was wrong about two things.
- m09_reading_finished:
    Dr Adrian Tesseract: Then I was wrong about one thing.
- else:
    Dr Adrian Tesseract: Then we do it the slow way. In court. I've a lot to say.
}
{
- partial_release == "large":
    Agent HaX: That's the backdoor. Its queue went the second you shut him down. Forty-seven million systems.
- partial_release == "small":
    Agent HaX: That's the backdoor. What was left on it just went. Fourteen million systems.
}
{ partial_release != "none" and m07_countdown_expired:
    Dr Adrian Tesseract: Seattle first. As scheduled.
}
{ wren_held or m09_recruiter_offer == "taken":
    Narrator: He glances at the service door. Nobody comes through it.
    Dr Adrian Tesseract: You found her. I wondered whether you would.
}
-> core_router

=== join_1 ===
{ join_step < 1:
    ~ join_step = 1
}
~ points_landed = landed_count()
Dr Adrian Tesseract: It's a key. You press it. Everything I've told you happens.
{ points_landed >= 2:
    Dr Adrian Tesseract: You've beaten me. Now you want the key?
- else:
    Dr Adrian Tesseract: You couldn't answer me. Then let it be you.
}
Narrator: Pressing it publishes the database to everyone, everywhere, in the same minute. Eleven hundred to twenty-six hundred people, the first month, by his own figure. You can still step back.
~ tess_menu = true
-> join_1_menu

=== join_1_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [Give me the key.]
    -> join_2
+ [Step back.]
    Dr Adrian Tesseract: As you like.
    ~ tess_menu = true
    -> console_menu
+ [Stop it.]
    -> console_stop

=== join_2 ===
{ join_step < 2:
    ~ join_step = 2
}
Agent HaX: 0x00. Don't.
Narrator: If you take it, the mission ends here, and you work for ENTROPY.
~ tess_menu = true
-> join_2_menu

=== join_2_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [(Put your hand on the key.)]
    -> join_3
+ [Step away.]
    Dr Adrian Tesseract: As you like.
    ~ tess_menu = true
    -> console_menu
+ [Stop it.]
    -> console_stop

// The only button that sets Join's ending.
=== join_3 ===
~ join_step = 3
Narrator: The key console asks once. Publish the database to everyone, now?
+ [Yes. Publish it.]
    ~ console_choice = "joined"
    ~ database_outcome = "published"
    ~ partial_release = "published"
    ~ media_story_ran = false
    ~ ending = "joined"
    Dr Adrian Tesseract: *quietly* Thank you, Agent.
    -> join_end
+ [No.]
    Narrator: You take your hand off the key.
    ~ tess_menu = true
    -> join_2_menu

// MC §6.4. WREN free: she comes through the service door for the key, and he
// refuses her. Her copy reveals on wren_entering.
=== wren_beat ===
~ wren_entering = true
Narrator: The service door opens. Kowalczyk comes through it fast and goes for the key.
Dr Adrian Tesseract: Not you, Halina. When they find out what you are, it proves nothing. It has to be one of theirs.
Agent 0x5E 'Lantern': Adrian.
{ sleeper_caught and not wren_held:
    Dr Adrian Tesseract: You found her. Too late to stop her walking in.
}
{
- quintero_ko or officer_out == "quintero":
    ~ tess_menu = true
    -> wren_stop
- m09_deck_pulled == "alpha_tapes":
    ~ quintero_enters_core = true
    ~ wren_at_core = true
    Narrator: Quintero is already through the lock. She has Kowalczyk's wrist before it reaches the key.
    -> wren_react ->
    -> core_router
- else:
    ~ quintero_enters_core = true
    ~ quintero_wounded = true
    ~ wren_at_core = true
    Narrator: Quintero comes in from the lock at the noise. They go down hard against the console, and Quintero gets up holding her shoulder, with Kowalczyk pinned.
    Agent 0x2D 'Anchor': Shoulder. Leave it.
    -> wren_react ->
    -> core_router
}

=== wren_stop ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [Stop her.]
    ~ wren_stopped = true
    ~ wren_at_core = true
    Narrator: You get to her first. She doesn't fight you for it.
    -> wren_react ->
    -> core_router

// SCRIPT_EDIT_R1 A-03: the reveal gets one reaction. Not when she was already
// named on the line (his "Too late to stop her walking in." covers that).
=== wren_react ===
{ not sleeper_caught:
    Agent HaX: Kowalczyk. *quietly* I signed her leave forms.
}
->->

// ===========================================
// The database (MC §6.5; FA §4.1 step 4). Each cost said before the menu, by
// the person with a reason to say it. Netherton names the first two
// operations that apply, one fixed line each (never a printed name).
// ===========================================
=== database ===
Agent HaX: Netherton's on the line. He wants to hear this.
+ [Put him through.]
+ [Then he can listen.]
-
Dr Adrian Tesseract: Magnus.
Director Magnus Netherton: Adrian.
Director Magnus Netherton: Agent. His copy, and ours in the vault. You decide what happens to both. Hear what each costs first.
Director Magnus Netherton: Half of these cannot be patched this year, and the water controllers never. Send them out and every buyer knows where to hit.
+ [And if we keep them?]
+ [Go on, sir.]
-
Agent HaX: Infusion pumps in a hundred and forty hospitals. Still live next year if we do this.
+ [What does it cost to send ours to the vendors?]
+ [And the other way?]
-
-> database_ops ->
Director Magnus Netherton: Both of them run through holes on that list. Patch the holes and we lose the way in. I will sign it.
Agent HaX: That's coordinated disclosure. Vendors first, quietly, with time to fix. The ones nobody can patch go to the operators, with workarounds.
{ m09_albion_notified:
    Agent HaX: You burned the Critical Mass watch for one letter. This is that letter, a thousand times.
}
+ [And if I wipe both copies?]
+ [There's a third way.]
-
Agent HaX: If both copies die, this room purges itself. Doors, lights, everything. You won't have him after.
Director Magnus Netherton: Then nobody has it, and nobody fixes anything either. We both answer for it.
~ tess_menu = true
-> database_menu

=== database_menu ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [Secure it. Their copy's evidence. Ours stays in the vault.]
    ~ database_outcome = "secured"
    Director Magnus Netherton: Understood. I'll have his collected.
    -> core_router
+ [Coordinated disclosure. Wipe theirs, and send ours to the vendors, on a schedule.]
    ~ database_outcome = "disclosed"
    Director Magnus Netherton: Then I sign it tonight.
    -> core_router
+ [Wipe both. Theirs and ours.]
    ~ database_outcome = "both_wiped"
    ~ media_story_ran = m07_completed and m07_team_assignment != "fracture"
    ~ ending = "scorched"
    -> ending_scorched
+ { not tess_asked_hax } [HaX. What would you do?]
    ~ tess_asked_hax = true
    Agent HaX: No. This one's yours. If I choose, I'll choose for the wrong reasons.
    ~ tess_menu = true
    -> database_menu

// SCRIPT_EDIT_R1 cut 2: an opener, then the first two that apply, one fixed
// line each. MC §6.5's list: (1) Victoria's watch, (2) Nightshade's channel, (3) the
// HashChain tags, (4) the Critical Mass watch (named by m04's branch), (5) the
// order-book watch (every save), (6) the Zero Day tap (gone only when 1 holds).
// 5 always applies, so the first two are always one of these pairs.
=== database_ops ===
~ temp n = 0
Director Magnus Netherton: Two operations go dark if you do this.
{ m03_victoria_fate == "recruited" and (victoria_gallery == "confronted" or victoria_gallery == "refused" or (victoria_gallery == "trusted" and head_start_killed == "zero_day")):
    ~ n = n + 1
    Director Magnus Netherton: The watch on Sterling goes dark.
}
{ n < 2 and m08_nightshade_triple_agent and not m09_nightshade_shown_file:
    ~ n = n + 1
    Director Magnus Netherton: Nightshade's channel goes dark.
}
{ n < 2 and m06_monitoring_enabled:
    ~ n = n + 1
    Director Magnus Netherton: The HashChain tags go dark.
}
{ n < 2 and m09_completed and not m09_albion_notified:
    ~ n = n + 1
    {
    - m04_voltage_escaped:
        Director Magnus Netherton: The watch on Voltage's people goes dark.
    - m04_voltage_captured:
        Director Magnus Netherton: The watch on what's left of Voltage's crew goes dark.
    - else:
        Director Magnus Netherton: The Critical Mass watch goes dark.
    }
}
{ n < 2:
    ~ n = n + 1
    Director Magnus Netherton: The watch on the head start's order book goes dark.
}
{ n < 2:
    Director Magnus Netherton: Our tap on Zero Day's brokers goes dark.
}
->->

// ===========================================
// The end for him (MC §6.6; FA §4.1 step 5). points_landed is derived here.
// The cold choice is always last, and "Lower the weapon." removes it.
// ===========================================
=== his_end ===
~ points_landed = landed_count()
{ join_step >= 2:
    Dr Adrian Tesseract: You held your hand out for it. I won't forget that.
}
{ points_landed >= 2:
    Narrator: He stands, slowly, and holds his hands out from his sides. They're empty.
    Dr Adrian Tesseract: Ask me, then.
    Director Magnus Netherton: If he cooperates, there is no trial. He gives us cells, and nobody hears his speech. Arrest him, and he makes it in open court.
    ~ tess_menu = true
    -> end_menu_standing
- else:
    Dr Adrian Tesseract: Arrest me, then.
    ~ tess_menu = true
    -> end_menu_seated
}

=== end_menu_standing ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [Then cooperate. All of it.]
    ~ media_story_ran = m07_completed and m07_team_assignment != "fracture"
    ~ ending = "surrender"
    -> ending_surrender
+ [No deal. You're under arrest.]
    ~ media_story_ran = m07_completed and m07_team_assignment != "fracture"
    ~ ending = "arrest"
    -> ending_arrest
+ { not cold_lowered } [Shoot him where he stands.]
    -> cold_warning

=== end_menu_seated ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> core_router
}
+ [You're under arrest.]
    -> reach
+ { not cold_lowered } [Shoot him where he sits.]
    -> cold_warning

// Fewer than two points: the dangerous moment. No timer.
=== reach ===
Narrator: His hand goes to the console. One key, and the first city's list goes out anyway.
+ [Fire.]
    ~ media_story_ran = m07_completed and m07_team_assignment != "fracture"
    ~ ending = "lethal"
    -> ending_lethal
+ [Hold fire.]
    ~ fire_held = true
    ~ media_story_ran = m07_completed and m07_team_assignment != "fracture"
    ~ ending = "arrest"
    -> ending_arrest

// MC §6.6 steps 2-4, word for word.
=== cold_warning ===
Narrator: His hands are empty and in plain sight. He isn't moving. If you fire now, it's an execution, and HaX is on the line.
+ [Do it.]
    ~ media_story_ran = true
    ~ ending = "executed"
    -> ending_executed
+ [Lower the weapon.]
    ~ cold_lowered = true
    Narrator: You lower it. He hasn't moved.
    { points_landed >= 2:
        ~ tess_menu = true
        -> end_menu_standing
    - else:
        ~ tess_menu = true
        -> end_menu_seated
    }

// ===========================================
// The endings' own beats at the core (FA §4.5-4.6; MC §8). Each ends the
// conversation; nothing here completes a task or opens a closing scene.
// ===========================================
=== ending_arrest ===
{ fire_held:
    Agent HaX: Got it. Feed's dead. Hold. *breath* He's done.
    Narrator: He takes his hand off the key and looks at it.
    Dr Adrian Tesseract: Ninety-nine.
    Narrator: Then he holds out his wrists.
- else:
    Narrator: He holds out his wrists before anyone asks.
    Dr Adrian Tesseract: A courtroom, then. I did cost it.
}
~ tess_quiet = true
#exit_conversation
-> parked

=== ending_surrender ===
Narrator: He sits down at the bunker's terminal and types the cells' contact protocol himself, without hurrying.
Dr Adrian Tesseract: They never knew who I was. They'll work out who you are by Thursday. Be careful.
~ tess_quiet = true
#exit_conversation
-> parked

=== ending_lethal ===
Narrator: His hand is on the key. You fire. He falls against the console before it's pressed.
Agent HaX: I was a second behind you. Log it. I'll sign under you.
~ tess_quiet = true
#exit_conversation
-> parked

=== ending_executed ===
Narrator: He is still looking at you when you fire.
Narrator: The line stays silent for a long time.
Agent HaX: 0x00.
{ quintero_wounded or quintero_ko or officer_out == "quintero":
    Narrator: Two of the van team come in from the lock. One of them takes the weapon out of your hand. Nobody speaks.
- else:
    Narrator: Quintero comes in from the lock and takes the weapon out of your hand. She doesn't say a word.
}
~ tess_quiet = true
#exit_conversation
-> parked

// Scorched Earth: his own dead-man purge (FA §4.5). On m09_sleeper_named
// nobody propped the service door, so he goes his own way.
=== ending_scorched ===
Narrator: The wipe goes through. Then the room goes: the lights die, the suppression dumps, and somewhere behind the walls the blast doors start to cycle.
{ m09_sleeper_named:
    Narrator: When the emergency lights come up, his chair is empty, and a panel nobody had found stands open. On the console, a card in his hand: 'Afterwards, then.'
- else:
    Narrator: When the emergency lights come up, his chair is empty, and the service door is open. On the console, a card in his hand: 'Afterwards, then.'
}
Agent HaX: Out, 0x00. The team's at the lock. Follow their torches.
~ tess_quiet = true
#exit_conversation
-> parked

=== join_end ===
Narrator: Every screen in the room changes to the same word. RELEASED.
Narrator: He takes his coat from the back of his chair and holds the service door for you.
~ tess_quiet = true
#exit_conversation
-> parked

// Router step 11: a re-talk after the ending. One fixed line per ending; the
// dead and the gone get none.
=== after_end ===
{
- ending == "arrest":
    Dr Adrian Tesseract: I'll see you in court, Agent.
- ending == "surrender":
    Dr Adrian Tesseract: Thursday, Agent. Remember.
- ending == "lethal" or ending == "executed":
    Narrator: He hasn't moved since.
}
~ tess_quiet = true
#exit_conversation
-> parked
