// ================================================
// Mission 9: Digital Archaeology - Agent HaX, phone (group A, CONTRACT §2.1)
// Host: agent_0x99 (phone, currentKnot "start"). HaX speaks unprefixed.
// Voiced start knots (F20): deck_resume, identity_scene, identity_resume,
// tesseract_call. Each ends #exit_conversation then -> DONE and never
// enters start, support_hub, afterwards or any knot the hub uses. No
// Narrator lines anywhere in this file; no printed variables in voiced lines.
// Unvoiced: start, dock, flag1_read, ledger_read, afterwards, hour_read,
// hour_read_resume, support_hub and everything only the hub reaches.
// ================================================

INCLUDE m09_carryover_vars.ink

// ---- m09 globals this file reads or sets (CONTRACT §5.1, §5.3) ----
// Exports
VAR recruiter_offer = ""
VAR deck_pulled = ""
VAR sleeper_named = false
VAR sleeper_shortlist = false
VAR recruiter_secret = ""
VAR hax_confession_answer = ""
VAR albion_notified = false
VAR nightshade_shown_file = false
VAR cage_bin = ""
VAR legacy_files_saved = false
// Story locals and machinery
VAR raid_team_answer = ""
VAR tran_outcome = "left"
VAR reading_told_hax = false
VAR schedule_read = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR stacks_entered = false
VAR hatch_talked = false
VAR cage_opened = false
VAR nightshade_file_held = false
VAR notebook_read = false
VAR legacy_clock_run = false
VAR reading_found = false
VAR reading_finished = false   // scenario design R1 n4: the Reading topic waits for the last page
VAR deed_found = false   // scenario design R1 m3: the lease file's onPickup
VAR hl_box_opened = false   // scenario design R2 n3: the H&L lid's unlock (HaX latch)
VAR in_cage = false   // Synced scenario global (scenario design R5 m1)
VAR tape_card_held = false   // scenario design R1 n2: the tape room card taken from the safe
VAR salvage_keypad_seen = false
VAR tape_room_entered = false
VAR salvage_opened = false
VAR bin_chosen = false
VAR maintenance_code_used = false
VAR hand_matched = false
VAR ledger_read_heard = false
VAR recruiter_call_started = false
VAR recruiter_said_yes = false
VAR recruiter_gone = false
VAR deck_choice_made = false
VAR afterwards_heard = false
VAR gary_called = false
VAR identity_scene_started = false
VAR identity_scene_done = false
VAR identity_name_said = false
VAR hour_read_started = false
VAR hour_read_done = false
VAR hour_read_choice_reached = false
VAR tesseract_call_started = false
VAR tesseract_call_done = false
// Synced scenario globals (alignment R3): the call's close for the music cue,
// and whether the Albion memo has been read (set by HaX's mapping).
VAR tesseract_call_closed = false
VAR memo_read = false
VAR alpha_annotations_read = false
VAR start_debrief = false
VAR debrief_notice_before = false
VAR report_done = false
VAR catalogue_guide_offered = false
// Synced scenario global (playtest R1 A-M3): set on the dock call's last line,
// so a reload before it rings the call again.
VAR dock_done = false
VAR catalogue_guide_hint_given = false
VAR ledger_guide_offered = false
VAR ledger_guide_hint_given = false
VAR tomb_beta_guide_offered = false
VAR tomb_beta_guide_hint_given = false
VAR archive_code_guide_offered = false
VAR archive_code_guide_hint_given = false

// ---- Ink-local (CONTRACT §5.4; nothing outside this file reads them) ----
VAR dock_heard = false
VAR catalogue_topic_given = false
VAR series_topic_given = false
VAR tran_topic_given = false
VAR tran_topic_heard = false   // Puzzle chains R3 m1: warning and opening line said once
VAR name_topic_given = false
VAR legacy_topic_given = false
VAR alpha_topic_given = false
VAR nightshade_file_decided = false
VAR reading_told_hax_asked = false
// Puzzle chains R1 P1: the keypad topic in three tiers (was a boolean,
// keypad_topic_asked).
VAR keypad_topic_asks = 0
VAR confession_heard = false
// Shadows for topics that write a global by tag and return to the hub: a
// #set_global reaches this story only after ink has built the next choice
// list, so without these the answered topic shows once more.
VAR notice_sent_here = false
VAR nightshade_sent_here = false
VAR hand_answered_here = false

// ================================================
// START (home knot; unvoiced; prints nothing on the normal path)
// ================================================
=== start ===
// Guards in CONTRACT §2.1 order, one block (lint choice-fallthrough).
// Guard 1: a HaX scene is pending. Closing her thread fires the
// conversation_closed:agent_0x99 re-ring (S4 §6).
// Guard 2: the Recruiter's call is pending. Her ring comes back on the next
// room exit, not on this close, so "take it when it rings".
{
- (recruiter_gone and not deck_choice_made) or (identity_scene_started and not identity_scene_done) or (hour_read_started and not hour_read_done) or (tesseract_call_started and not tesseract_call_done):
    Pick up. I'm ringing you.
    #exit_conversation
    -> DONE
- recruiter_call_started and not recruiter_gone and not deck_choice_made:
    Her call first. Take it when it rings.
    + [Right.]
        #exit_conversation
    -> DONE
// Stage 8 m-14: a first open after flag 1 (a late first open, or a seeded
// playtest segment) skips the Act 1 dock lines and goes to the hub.
- not dock_heard and not flag1_submitted:
    -> dock
- else:
    ~ dock_heard = true
    -> support_hub
}

// Tunnel: the m01 warning about Tran, three fixed strings (Beat 1.1).
// Used by hub topic 17 only (unvoiced); the dock call has the warning inline
// since stage 9 (playtest R1 A-m1).
=== tran_warning ===
{
- m01_completed and not m01_maya_ko:
    Maya's list has a Tran on it.
- m01_maya_ko:
    Maya Chen would have flagged him. We don't have Maya's names.
- else:
    Viral Dynamics' staff files have a Tran in them.
}
->->

// ================================================
// DOCK (Beat 1.1; unvoiced; mapping M1 or first open)
// ================================================
=== dock ===
~ dock_heard = true
That noise is a cross-cut shredder. It's been running since before you landed.
Shutter's his round. The office door's quieter.
Night guard. Twenty-four. Not ours, not theirs. Don't hurt him.
{raid_team_answer == "quintero":
    Quintero's going to hate that she was right if this goes badly. Let's not.
}
// Playtest R1 A-M4: both replies say where the way in is.
+ [The office door. I'll pick it.]
    Good. It's the west door. That's the front desk, and nowhere near his torch.
+ [The shutter. I'll time his round.]
    It's up on the north side, in the corner. His torch crosses the far end of the floor. Go when it's gone.
-
+ [Who else is inside?]
    Margaret Sorensen runs the place. County clerk for twenty years before this.
-
// Playtest R1 A-m1 and confirm run: the Tran warning is part of the same
// line as the clerk and Tran, one fixed sentence pair per m01 branch, so no
// empty chunk (a tag-only line or a block) comes between them and the close.
// The done flag rides on that line.
{
- m01_completed and not m01_maya_ko:
    #set_global:dock_done:true
    A clerk's on tonight, and an IT contractor, Jesse Tran. Maya's list has a Tran on it.
    // Scenario design R3 m1: the first job, said aloud.
    Once you're in, set the laptop up in the reading room and get me into their catalogue. It's how we find out what Sorensen's burning.
- m01_maya_ko:
    #set_global:dock_done:true
    A clerk's on tonight, and an IT contractor, Jesse Tran. Maya Chen would have flagged him. We don't have Maya's names.
    Once you're in, set the laptop up in the reading room and get me into their catalogue. It's how we find out what Sorensen's burning.
- else:
    #set_global:dock_done:true
    A clerk's on tonight, and an IT contractor, Jesse Tran. Viral Dynamics' staff files have a Tran in them.
    Once you're in, set the laptop up in the reading room and get me into their catalogue. It's how we find out what Sorensen's burning.
}
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [On my way.]
    #exit_conversation
    -> DONE

// ================================================
// FLAG 1 READ (Beat 1.4; unvoiced)
// ================================================
=== flag1_read ===
// The stacks door opens on its own mapping (S4 §4 row 1), which can retry,
// so nothing here says the door is open.
// Walkthrough R1 m-01: the salvage line is given on the first line, so a
// player who closes the call at its first choice still holds it.
#give_item:notes:catalogue_salvage_line
Series R is the restricted series. R-114 to R-161, bay ten, behind the cage mesh in the restricted stacks.
Sorensen's in there with them. The boxes on the clerk's trolleys are the ones on this list.
The catalogue keeps something else live. Their ledger.
+ [Ledger or stacks first?]
    The ledger keeps. Her shredder doesn't. Stacks first.
+ [She's shredding Series R?]
    Box by box. The first sixteen are already gone.
    The ledger keeps. Her shredder doesn't. Stacks first.
-
Her card's on a reel at her hip. You've done this before.
I've sent you the odd one. Salvage cage, their own code.
// Scenario design R3 m2: name Act 3's target where the line is handed over.
The catalogue calls what's in there Tomb Beta. It's still drawing power, and nobody's scheduled it for anything.
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [Got it.]
    #exit_conversation
    -> DONE

// ================================================
// LEDGER READ (Beat 2.3; unvoiced)
// ================================================
=== ledger_read ===
// First line sets ledger_read_heard: the Recruiter's ring (a) and ring (c)
// key on it (CONTRACT §6.2; ring (b) removed at scenario design R4 m3). No pronoun for WREN.
#set_global:ledger_read_heard:true
The ledger's live. Twenty-three placements, forty-seven candidates.
And a legacy section, older than any list we've ever had off them.
One legacy entry, codename WREN. Updated on day ten, in Sorensen's hand. "Assigned TF Null, Montana operation."
+ [TF Null. That's the raid team.]
    WREN's on our team. One of the four you met at the briefing.
+ [Who is WREN?]
    The entry doesn't say who. It says where.
    WREN's on our team. One of the four you met at the briefing.
-
I've told the Director. He'll say nothing to them. Neither will you.
// m05, at most one line (CONTRACT §2.1); arrest, combat_nonlethal and
// never played get nothing.
{
- m05_final_choice == "public_exposure":
    The twenty-three are all marked "blown".
- m05_final_choice == "turn_double_agent":
    Torres' entry still reads "live". They never learned he turned.
- m05_final_choice == "combat_lethal":
    ...
}
{m07_found_tomb_gamma:
    You bagged the dossier. "Including the people." This is the people.
}
+ [What else is on the entry?]
    A source code, H&L, and a file number. HL2015-0477.
-
// Alignment R1 m9, moved after the file number (R2 n9): m08's mole hunt,
// echoed in this one, as the next thing on screen.
{
- m08_accused_vector or m08_accused_phantom:
    Last time you named one of ours on a hunch. Do this one on paper.
- m08_named_on_evidence:
    You found Nightshade on paper. Same again.
}
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [Got it.]
    #exit_conversation
    -> DONE

// ================================================
// AFTERWARDS (Beat 2.7; unvoiced; hub topic 7 diverts here)
// ================================================
=== afterwards ===
// One loss line, a fixed string per case (A-6): the bin that went, by
// cage_bin (the other bin is Nightshade's copy on m08_nightshade_tidied),
// with the tape that went, by deck_pulled.
{
- (cage_bin == "letters" or cage_bin == "nightshade_copy") and deck_pulled == "none":
    Derek's file is gone. So are her list and his tapes.
- (cage_bin == "letters" or cage_bin == "nightshade_copy") and deck_pulled == "her_file":
    Derek's file is gone. So are his tapes.
- cage_bin == "letters" or cage_bin == "nightshade_copy":
    Derek's file is gone. So is her list.
- m08_nightshade_tidied and deck_pulled == "none":
    Nightshade's copy is gone. So are her list and his tapes.
- m08_nightshade_tidied and deck_pulled == "her_file":
    Nightshade's copy is gone. So are his tapes.
- m08_nightshade_tidied:
    Nightshade's copy is gone. So is her list.
- deck_pulled == "none":
    The Social Fabric letters are gone. So are her list and his tapes.
- deck_pulled == "her_file":
    The Social Fabric letters are gone. So are his tapes.
- else:
    The Social Fabric letters are gone. So is her list.
}
{cage_bin == "letters":
    Arakawa got Villanueva. She wanted to know who'd bother.
}
{recruiter_secret == "told":
    Back in October I'd have kept that between us. Not tonight.
}
Afterwards. Not during.
It's yours to carry. Nobody else signed for it.
// On the last line, so a player who closes early still gets hub topic 7.
#set_global:afterwards_heard:true
The rest when this is over. Her office is the west door off the restricted stacks.
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [Understood.]
    #exit_conversation
    -> DONE

// ================================================
// DECK RESUME (voiced, forced; Recruiter re-ring 3)
// ================================================
=== deck_resume ===
// Voiced. Guard first, no line. The yes-block and no-block are CONTRACT §3.1's
// fixed strings, character for character with B1 (unprefixed here), so one
// audio clip serves both. Never diverts to start, support_hub or afterwards.
{deck_choice_made:
    #exit_conversation
    -> DONE
}
I've paused the deck. It won't hold long.
{recruiter_said_yes:
    -> yes_block
- else:
    -> no_block
}

= yes_block
She's watching the deck. Pull her file and we get half her people. She warns the rest, and Kowalczyk runs.
+ [Leave it. Let it wipe.]
    #set_global:recruiter_offer:taken
    #set_global:deck_pulled:none
    -> office
+ [Pull her file anyway.]
    #set_global:recruiter_offer:double_crossed
    #set_global:deck_pulled:her_file
    First name on it is a handler in Baltimore.
    -> office

= no_block
She only watched the counter. I can pull one before it wipes. Which?
+ [Her file.]
    #set_global:recruiter_offer:named
    #set_global:deck_pulled:her_file
    First name on it is a handler in Baltimore.
    // Scenario design R4 m4: the H&L sheet already read (identical in the Recruiter's tape_choice).
    {sleeper_shortlist:
        WREN's still one of the two on that firm's sheet.
    - else:
        One of four. Two, if that firm's boxes say so.
    }
    -> office
+ [The Alpha tapes.]
    #set_global:recruiter_offer:refused
    #set_global:deck_pulled:alpha_tapes
    -> office

= office
#set_global:deck_choice_made:true
#complete_task:answer_the_offer
She fired it from Sorensen's office. I'm on the door.
Her card for the tape room will be in that office.
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [On my way.]
    #exit_conversation
    -> DONE

// ================================================
// IDENTITY SCENE (voiced, forced; Beats 3.3-3.4)
// ================================================
=== identity_scene ===
-> opening

// Beat 3.3 steps 1-2. Netherton is on the line from the aircraft's forward
// cabin; his three lines are fixed and he says nothing else.
= opening
// VM hint, flag 3: checked against the VM plan (opus48). The credential's first
// line is story terms only (CONTRACT §11 item 2): a SAFETYNET staff credential,
// issued before he left, never revoked. The name is said by Netherton below, not
// anywhere the player reads for themselves. Voiced lines kept verbatim (no new audio).
// Script edit R1 A-01: the hand line opens the scene when it is still open,
// so it never interrupts the credential; the start tags go on the first line.
#set_global:identity_scene_started:true
#unlock_task:hear_the_name
{not hand_matched:
    #complete_task:match_the_hand
    #set_global:hand_matched:true
    The writing on Nightshade's file. I put it beside the margins in my old course notebook. Same hand.
}
Tomb Beta's owner. It's one of ours. A SAFETYNET staff credential.
Issued before he left us. Never revoked. The name on it is...
#set_global:identity_name_said:true
Director Magnus Netherton: I said we would not name him until we could prove it. We can. Dr Adrian Tesseract.
Director Magnus Netherton: He was our chief strategist until seven years ago. He trained half my field officers.
Director Magnus Netherton: HaX.
-> confession

// Beat 3.3 step 3. At most one recognition line, then one of four openings
// by m06_architect_identity_found x m07_teacher_discussed, then the wall.
// Script edit R1 A-a: three lines a form from nine shared strings.
= confession
{
- m07_architect_echo_heard:
    You heard him say it in Portland. My line. His line.
- m03_directive_decoded:
    You've read him before. Sterling's drive.
}
{
- m06_architect_identity_found and m07_teacher_discussed:
    I gave you his name after HashChain and called it Satoshi's guess. It was mine as well.
    I told you on the phone he taught me. I put his name in a drawer.
    He was mine, and I wanted to be wrong.
- m06_architect_identity_found:
    I gave you his name after HashChain and called it Satoshi's guess. I've been hoping ever since that it was only his.
    // Dialogue R1 n6, R2 m1: the scene's opening has just said the notebook (its tag lands
    // after the batch, so a branch on hand_matched can't tell), so the short form always.
    He taught me. The margins in that notebook are his.
    He was mine, and I wanted to be wrong.
- m07_teacher_discussed:
    I told you somebody taught me that line. I didn't say who.
    "Keep it out of your notes" was me keeping it out of mine.
    He was mine, and I wanted to be wrong.
- else:
    There was a file on a crypto fund, with his name in it at eighty-seven per cent. I put it in a drawer.
    He taught me. The margins in that notebook are his.
    He was mine. I wanted the other thirteen.
}
// Fixed (CONTRACT §2.1), split at a sentence break for the 25-word phone cap.
Two cards on that wall. I had his name the night they died.
I don't know if saying it would have saved them. I didn't say it.
~ confession_heard = true
-> answer

// Beat 3.3 step 4. Choices only, so identity_resume can land here. Each
// answer writes the full set of tags wherever it is answered (CONTRACT §7.3).
= answer
+ {not m06_architect_identity_found} [You should have told me.]
    -> said_should
+ {m06_architect_identity_found} [You should have taken it to Netherton.]
    -> said_should
+ {not m06_architect_identity_found} [I'd have done the same in your place.]
    -> said_same
+ {m06_architect_identity_found} [I'd have sat on it too.]
    -> said_same
// R2 A-R2-08: only quoted once the player has heard it. The other two
// answers always show, so the knot can't starve.
+ {afterwards_heard or m07_architect_echo_heard or (m08_completed and not m08_nightshade_ko_before_fate)} [Afterwards. Not during.]
    -> said_afterwards

// Script edit R1 A-b: the Reading forms are one line said before the
// normal reply.
= said_should
#set_global:hax_confession_answer:should_have_told
#set_global:identity_scene_done:true
#unlock_task:send_the_notice
#complete_task:hear_the_name
// Script edit R2 follow-up: the first half of the other answers' Reading
// form, one clip shared. R3 A-R3-01: her own turn after it, so "Yes. I
// should have." reads as not telling.
{reading_told_hax:
    He wrote that I'd cover for you.
    I covered for him.
}
Yes. I should have.
You get all of it from now on.
-> back_to_work

= said_same
#set_global:hax_confession_answer:same_in_your_place
#set_global:identity_scene_done:true
#unlock_task:send_the_notice
#complete_task:hear_the_name
{reading_told_hax:
    He wrote that I'd cover for you.
    Tonight you covered for me.
}
Don't be kind about it. *beat* Thank you. Once.
-> back_to_work

= said_afterwards
#set_global:hax_confession_answer:afterwards
#set_global:identity_scene_done:true
#unlock_task:send_the_notice
#complete_task:hear_the_name
{reading_told_hax:
    He wrote that I'd cover for you.
    Tonight you covered for me.
}
...That's mine. You don't get to use it on me. *beat* Thank you.
-> back_to_work

// Beat 3.3 step 5 (milestone M-05).
= back_to_work
// Alignment R3 r3-3: a player who read the folder first isn't sent back to it.
{memo_read:
    Seven years, and nobody turned it off. You've read his memo and the draft.
- else:
    Seven years, and nobody turned it off. There's more on his box. A memo, and a vendor notice he never sent. Read them.
}
-> albion

// Beat 3.4. The hub's notice topic has its own lines and never comes here.
// Script edit R1 A-03/A-04/A-e/A-f: one controller line per form, no
// choice, the inquiry as its own sentence. R2 audio cut 1: the watch and the
// send are one line.
= albion
// Walkthrough R1 m-05: #unlock_task:send_the_notice moved into the three
// answer stitches, beside identity_scene_done, so a reload before these
// lines can't leave the task hidden.
{
- m04_disclosure_choice == "full":
    That's Albion's hole. We marked it "retain" nine years ago. The vendor never heard a word from us.
// Stage 8 SC 6: m04's partial branch has an inquest only when crew were lost.
- m04_disclosure_choice == "partial" and m04_crew_lost:
    You told Albion's inquiry half of it. We told the vendor less.
- m04_disclosure_choice == "partial":
    You told the public half of it. We told the vendor less.
- m04_disclosure_choice == "quiet":
    You kept Albion quiet. So did we, about this, for nine years.
- else:
    This is the hole Critical Mass came through at Albion. We'd known about it for nine years.
}
{m04_disclosure_choice == "full":
    They audited every battery site. The controller's still in water works and substations. Four hundred sites.
- else:
    Albion fixed its own plant. That controller also runs water works and substations. Four hundred sites, still open.
}
Our watch sits on that kit. Send it, the vendor starts a fix, and the watch comes down.
{m04_disclosure_choice == "full" or m04_crew_lost:
    And Albion's inquiry gets to ask when we knew.
}
It isn't my call. It isn't yours either. If you're going to, don't ask me first.
{deck_pulled == "alpha_tapes":
    // Puzzle chains R1 P3: the scene can play in the cage (file fetched late).
    His tapes are on the bench in the tape room. When you want them.
}
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
+ [Understood.]
    #exit_conversation
    -> DONE

// ================================================
// IDENTITY RESUME (voiced, forced re-ring)
// ================================================
=== identity_resume ===
// Guard first, no line. Then route by the scene's own globals (CONTRACT §7.3).
// Cut off before the name: the opening again (it holds the hand line too).
// Cut off after the name but before the wall line: the confession again, so
// the answer buttons never quote a confession the player hasn't heard.
{
- identity_scene_done:
    #exit_conversation
    -> DONE
- not identity_name_said:
    -> identity_scene.opening
- not confession_heard:
    Still here. Netherton too.
    -> identity_scene.confession
- else:
    Still here. Netherton too.
    -> identity_scene.answer
}

// ================================================
// HOUR READ (Beat 3.5; text, forced, not voiced)
// ================================================
=== hour_read ===
-> body

// Beat 3.5. Text, not voiced. UTC only.
= body
#set_global:hour_read_started:true
#unlock_task:hear_the_mirror_job
That job on his box still copies to Tomb Gamma. It's the Publication.
He's giving it away. At oh-six-hundred it starts going out, city by city.
// Playtest R1 C-m-5: the question is hers, in the same bubble.
There's a key on here that sends it everywhere in the same minute. Then why build the key?
He'll call it full disclosure.
// The D-02 line, once, split at its sentence breaks for the 25-word cap.
+ [Isn't it?]
    // Educational R1 E-M1/E-m1: "usually" and "to everyone" restored; coordinated ends with the public.
    Full disclosure is one researcher publishing one flaw, in full, to everyone. Usually because the vendor stopped answering.
    His notice was the coordinated kind: vendor first, time to fix it, then the public. This is every weapon we hold, handed out at once.
-
+ [Who gets it first?]
    The cells. Oh-four-hundred, UTC. Two hours ahead of everyone else.
    And his defences at Tomb Gamma are on here. Every one of them built from an entry in the stolen database.
+ [What's he hiding behind?]
    A list of his defences at Tomb Gamma. Every one of them built from an entry in the stolen database.
    And the cells get it at oh-four-hundred, UTC. Two hours ahead of everyone else.
-
+ [Analysis had a guess. Is it on there?]
    His own number. Analysis guessed low.
    One thousand one hundred to two thousand six hundred. The first month. He's signed it.
+ [How many people, HaX?]
    One thousand one hundred to two thousand six hundred. The first month. He's signed it.
-
{m06_minder_walked:
    Kemal Aydin walked out on a smaller number than this.
}
-> realisation

// The realisation, stated once (W-05). On schedule_read the line that sets
// hour_read_choice_reached comes right before the choice, so
// hour_read_resume can land on the choice.
= realisation
{schedule_read:
    #set_global:hour_read_choice_reached:true
    I'm sending this up to Netherton. Anything to add before I do?
    -> realisation_choice
- else:
    #set_global:hour_read_done:true
    Nobody's wiping this box. Not her, not him.
    -> read_close
}

= realisation_choice
// Puzzle chains R1 P3: the schedule ticks the cage; it's his cage it skips.
+ [Her schedule. His cage has no tick.]
    #set_global:hour_read_done:true
    No. It hasn't. He shredded everyone but himself.
    -> read_close
+ [Read me the defences.]
    #set_global:hour_read_done:true
    They're ours, turned round. We wrote the manuals. He read them more carefully than we did.
    -> read_close

// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
= read_close
+ [Understood.]
    #exit_conversation
    -> DONE

// ================================================
// HOUR READ RESUME (text, forced re-ring)
// ================================================
=== hour_read_resume ===
{
- hour_read_done:
    #exit_conversation
    -> DONE
- hour_read_choice_reached:
    Still here. Before this goes to Netherton, anything to add?
    -> hour_read.realisation_choice
- else:
    -> hour_read.body
}

// ================================================
// TESSERACT CALL (Beat 3.6; voiced, forced, restarts from the top)
// ================================================
=== tesseract_call ===
// Voiced. He rings HaX; the player hears her side only. Her opening aside
// stands where a narrator line would have been (narration isn't voiced).
#set_global:tesseract_call_started:true
That's my other line. Withheld. Stay on, and don't say a word.
...Yes.
I know it's you.
Nobody's called me that since the course. *beat* It's HaX. It has been for seven years.
...I'll bring them.
He kept his voice down. He always did.
He called me Ninety-nine. He says the door will open for you by name. He says take your time getting there.
#set_global:tesseract_call_done:true
And he asked if we'd liked his notes.
Netherton's on the ground at Helena. Tell me when you're ready to come in.
// Final playtest: the thread closed ~3 ms after the last line, so the call
// ends on a one-word reply (m01/m05 pattern) and the line can be read.
// Alignment R3 r3-1: the music's spy-action cue keys on this, once.
+ [Understood.]
    #set_global:tesseract_call_closed:true
    #exit_conversation
    -> DONE

// ================================================
// SUPPORT HUB (unvoiced; newest topics first; S4 §7.1)
// ================================================
=== support_hub ===
// Phone resting knot: choices only. Topics use + with not-guards, never *.
// 1. Bring me in. Scenario design R1 M1: a confirm step first (the user's rule:
// warn before the debrief and let the player finish up). Up to two open threads.
+ {tesseract_call_done and not report_done} [Bring me in.]
    -> bring_in_confirm
// 2. The notice, from any room (stage 4 P8). Stage 8 M-01: one hub row;
// the send and the hold are its answers (notice_ask).
+ {identity_scene_done and not albion_notified and not notice_sent_here} [His notice.]
    // Educational R1 E-m3: incident disclosure (m04) and vulnerability disclosure, kept apart.
    // Dialogue R2 n5: the cue line last, above the buttons.
    // Scenario design R4 m1: "inquiry" only on the routes that had one (as the albion stitch).
    {
    - m04_disclosure_choice == "full" or m04_crew_lost:
        Albion's inquiry was about what happened. This is about the hole itself, and who else has it.
    - m04_disclosure_choice != "":
        Albion's report was about what happened. This is about the hole itself, and who else has it.
    }
    Still on his box. Say the word.
    -> notice_ask
// 3. The name (SE §4.4), once.
+ {identity_scene_done and not name_topic_given} [About the name.]
    ~ name_topic_given = true
    He told us to call him Adrian on the course. None of us ever managed it.
    // Educational R1 E-M4 (wording checked against the VM plan by the opus48 agent).
    When someone leaves, we take back their kit and shut their accounts the same day. Not his.
    That's all you get tonight. The rest is afterwards.
    -> support_hub
// 3b. The Alpha decode. Script edit R1 A-05: gated on a read of the annotation
// sheets (alpha_annotations_read, a new stage 9 onRead latch on
// alpha_annotations), not on the clip, so the button never claims a decode
// the player didn't do.
+ {alpha_annotations_read and not alpha_topic_given} [His annotation sheets, with the tapes.]
    ~ alpha_topic_given = true
    That's the version he taught us.
    -> support_hub
// 4. VM help, flags 3-4: one story-level steer before flag 3, one between 3 and 4.
+ {salvage_opened and not flag4_submitted} [I'm on his box. Where do I look?]
    {flag3_submitted:
        // VM hint, flag 4: checked against the VM plan (opus48). Name the target, imply no live link ("set to copy", as hour_read).
        Now all of it. Something on there is set to copy to Tomb Gamma. Take the whole box and we'll see what.
    - else:
        // VM hint, flag 3: checked against the VM plan (opus48). Line kept vague: the owner reveal is the player's to make, not spoken here.
        First, whose box it is. Somebody set it up and never handed it back.
    }
    -> support_hub
// 5. The salvage keypad. First ask quotes the coded line (S6 §2.3), each its
// own text; the last line is split at its sentence break for the 25-word cap.
+ {salvage_keypad_seen and not salvage_opened} [The keypad on the cage.]
    // Puzzle chains R1 P1 (F1): tier 1 points at the room, tier 2 gives the
    // rule (stage 6 C-02's wording), tier 3 gives the tool. Supersedes S6 §2.3
    // and S4 §7.1 row 5 for this topic.
    ~ keypad_topic_asks = keypad_topic_asks + 1
    {
    - keypad_topic_asks == 1:
        Catalogue line from flag one.
        SALVAGE CAGE ACCESS
        MSJMQAEGDZNVI
        Just the code, not the label. It's their own code. Archives key things to the shelves. Look at the wall by that keypad.
        {gary_called:
            Gary told you how.
        - else:
            If the cipher's new to you, ask me for the archive-code field guide.
        }
    - keypad_topic_asks == 2:
        // Educational R1 E-M2: the season's first keyed cipher, against m02's encodings.
        It's Vigenère. A cipher this time, not an encoding. Without the key, nobody reads it.
        The key is the salvage bay's word, on the chart by the keypad.
    - else:
        ROT13 moved every letter thirteen places. This moves each letter by the next letter of the key.
        Vigenère Decode, on your workstation. Key: the salvage bay's word. Capitals in, capitals out.
    }
    -> support_hub
// 6. The tape room's card.
+ {deck_choice_made and not tape_room_entered} [The tape room.]
    Her card for the tape room will be in the safe.
    It's a floor safe, in her office.
    -> support_hub
// 7. Afterwards, for a player who closed the call early.
+ {deck_choice_made and not afterwards_heard} [Afterwards.]
    -> afterwards
// 8. The Reading (MC §4.6).
+ {reading_found and reading_finished and not reading_told_hax_asked} [The Reading.]
    Do you want to tell me what it says?
    -> reading_ask
// 9. WREN and the cross-reference nudge. Stage 8 M-01: retires on the deck
// choice; topic 1 and the debrief carry the unread boxes after that.
+ {ledger_read_heard and not sleeper_named and not sleeper_shortlist and not deck_choice_made} [WREN.]
    H&L's boxes are in the open stacks. You've got the number.
    {m05_torres_turned:
        Torres is still on their books. He may know how that firm filed its people.
    }
    -> support_hub
// 10. Nightshade's file (triple-agent branch). Either answer sets
// nightshade_file_decided; after Hold, the send stays until the debrief.
+ {m08_nightshade_triple_agent and nightshade_file_held and not nightshade_file_decided} [Nightshade's file.]
    He doesn't know this exists. Send it, and he stops being theirs. He stops being much use to us after, too.
    Keep it, and he stays useful. He never finds out what his teacher wrote about him.
    -> nightshade_ask
+ {nightshade_file_decided and not nightshade_shown_file and not nightshade_sent_here and not start_debrief} [Send Nightshade his file.]
    -> nightshade_send
// 11. The hand on his file, the honest three-way answer (stage 4 P17).
+ {nightshade_file_held and not hand_matched and not hand_answered_here} [The hand on his file.]
    {not notebook_read:
        Read the notebook scan in my case file first. Then look again.
        -> support_hub
    - else:
        You've got both in front of you. Tell me.
        -> hand_ask
    }
// 12. VM help, flag 2.
+ {flag1_submitted and not flag2_submitted} [The ledger. Where is it?]
    // VM hint, flag 2: checked against the VM plan (opus48). Same machine as flag 1, going further in; stay off flag 1's "part that isn't public".
    Same box you're already on. The live ledger sits where only the machine's keeper can reach. Get that far and it's yours.
    -> support_hub
// 13. The legacy box (MC §4.3), once. Stage 8 M-01: also gone once his
// file is held, since passing her for the cabinet runs the clock.
+ {cage_opened and not legacy_clock_run and not legacy_files_saved and not legacy_topic_given and not nightshade_file_held} [The box behind her.]
    ~ legacy_topic_given = true
    That's the Initiative's legacy files. Their placements outside SAFETYNET, in her own hand.
    It goes in the shredder the moment you go to the cabinet or step out of the cage. If you want it, it's through her.
    -> support_hub
// 14. Victoria's route (S4 §4 row 2b). No _given flag: if the unlock fails,
// the topic comes back.
+ {m03_victoria_fate == "recruited" and stacks_entered and not cage_opened} [Can Victoria's people get me through that gate?]
    #set_global:maintenance_code_used:true
    There's a maintenance code for that gate. Sorensen never changed it.
    The cabinet in there takes her print. It's on the stamp on her shelf.
    -> support_hub
// 15. The restricted series. Stage 8 M-01: an Act 1 topic, gone once the
// cage is open.
+ {flag1_submitted and not series_topic_given and not cage_opened} [The restricted series.]
    ~ series_topic_given = true
    R-114 to R-161, bay ten. All of it's behind the cage mesh in the restricted stacks.
    Sorensen's in there with it, at the shredder.
    The gate takes her card, the cabinet takes a print.
    -> support_hub
// 16. VM help, flag 1 (fixed).
// Playtest R1 A-m5: retires once asked; the status ladder carries it after.
+ {not flag1_submitted and not catalogue_topic_given} [The catalogue. What am I looking for?]
    ~ catalogue_topic_given = true
    The catalogue's the index. Find the part that isn't public.
    -> support_hub
// 17. Tran.
// Alignment R4 r4-2: not once Tran is talked off the wipe or down.
// Puzzle chains R4 m1: past the gate only once the bin is chosen (the default bin reads derek_file before any choice).
// R5 n1: or on the hatch route, where the handover is certain to give Derek's file.
+ {not tran_topic_given and (bin_chosen or hatch_talked or not cage_opened) and tran_outcome == "left"} [Tran.]
    // Puzzle chains R3 m1: retire only once the answer can't change (the bin is chosen,
    // or tidied). Before the hatch a second ask gives the bin's line after it.
    // Puzzle chains R5 n1: hatch talked and gate open means the handover gives Derek's file, so that is final too.
    {bin_chosen or m08_nightshade_tidied or (hatch_talked and cage_opened):
        ~ tran_topic_given = true
    }
    {not tran_topic_heard:
        -> tran_warning ->
        He's wiping tapes from the server closet off the open stacks.
        // Scenario design R4 m5: what the reels are (FINALE_ARC row 847).
        Those reels are the Initiative's recruiting interviews. The legacy names, in their own voices, saying yes.
    }
    ~ tran_topic_heard = true
    // Puzzle chains R1 P4: on tidied there is no paper lever (Nightshade burned it).
    // Puzzle chains R2 m1: otherwise the hatch bin decides it. The letters are his lever.
    {
    - m08_nightshade_tidied:
        Nothing on him tonight that I can use. It's a fight, or you leave him to it.
    - cage_bin == "derek_file":
        The letters went in her feed. It's a fight, or you leave him to it.
    - cage_bin == "letters":
        You've got the letters. He's the J.T. in them. Show him.
    - else:
        You'd need paper with his name on it to talk him off it. Otherwise it's a fight.
    }
    -> support_hub
// 18. Field guides, one button.
+ {(catalogue_guide_offered and not catalogue_guide_hint_given) or (ledger_guide_offered and not ledger_guide_hint_given) or (tomb_beta_guide_offered and not tomb_beta_guide_hint_given) or (archive_code_guide_offered and not archive_code_guide_hint_given)} [I need a field guide.]
    -> guides_menu
// 19. Status, always.
+ [Where do I stand?]
    -> status
+ [That's all for now.]
    Line's open.
    #exit_conversation
    -> DONE

// Choices only (phone resting knots), so a re-navigation replays nothing.
=== notice_ask ===
+ [Send it.]
    ~ notice_sent_here = true
    #set_global:albion_notified:true
    Gone.
    Vendor's acknowledged. They're saying ninety days for a fix. Getting it onto four hundred sites will take a year.
    Analysis is pulling the watch. It's dark by morning.
    -> support_hub
+ [Not yet.]
    It keeps. So does the hole.
    // Educational R1 E-m2: the equities call, named as a real practice.
    Every service that finds a hole makes this call: keep it to use, or tell the vendor. We kept this one nine years.
    -> support_hub

=== reading_ask ===
+ [All of it.]
    ~ reading_told_hax_asked = true
    #set_global:reading_told_hax:true
    He put me in it. Of course he did.
    Thank you. I'd rather hear it from you than find it.
    -> support_hub
+ [It's about me. It can stay that way.]
    ~ reading_told_hax_asked = true
    Fair. I won't ask again.
    -> support_hub

=== nightshade_ask ===
+ [Send Nightshade his file.]
    ~ nightshade_file_decided = true
    -> nightshade_send
+ [Hold it.]
    ~ nightshade_file_decided = true
    Held. Say the word before the debrief if you change your mind.
    -> support_hub

=== nightshade_send ===
~ nightshade_sent_here = true
#set_global:nightshade_shown_file:true
Sent. He'll read it tonight.
-> support_hub

=== hand_ask ===
+ [Same hand.]
    ~ hand_answered_here = true
    #complete_task:match_the_hand
    #set_global:hand_matched:true
    Those are my notes. That's his pen.
    {bin_chosen and cage_bin == "derek_file":
        Two samples. One pen.
    }
    Hold that. I want it from two directions before anyone says a word.
    -> support_hub
+ [Different hands.]
    Look at the loop on the g. Then look again.
    -> support_hub
+ [I can't tell.]
    Put the scan beside it. Same pen pressure, same crossed sevens.
    -> support_hub

// The status ladder, most advanced first; each row names the next step.
// Script edit R1 A-15: no recruiter_call_started row; start's guards exit
// before the hub while her call is pending. Stage 8: re-checked row by row
// (m-02); a flag already in is never named as the next step.
=== status ===
{
- tesseract_call_done:
    His box has given us all it's got. When you're ready, tell me to bring you in.
- hour_read_done:
    Stay by his box. I don't think he's finished with us.
// Stage 8 m-02 and the truthfulness pass: rows for flag 4 or flag 3 already
// in, so no row names a flag the player has submitted.
- identity_scene_done and flag4_submitted:
    Flag four's in. I'm reading what it gave us. I'll ring you.
- identity_scene_done:
    Flag four. Take the whole box, and we'll see what it still does.
- flag3_submitted and not nightshade_file_held:
    Flag three's in. Bring me Nightshade's file from the plan cabinet in the cage. Then we say the name.
- flag3_submitted:
    Flag three's in. Stay on. I'm ringing you.
- salvage_opened and nightshade_file_held:
    Flag three. Find out whose box that is.
- salvage_opened:
    Flag three. Find out whose box that is. And bring Nightshade's file from the plan cabinet in the cage.
- tape_room_entered:
    The keypad on the salvage cage. The catalogue line I sent you is in their cipher. The key's on the wall by it.
// Scenario design R1 n2: once the card is in hand, the safe row is stale.
- deck_choice_made and tape_card_held:
    Her card's in your hand. The tape room's north of the restricted stacks.
- deck_choice_made:
    Her office. Get the safe open. Her card opens the tape room, and Tomb Beta's server is past it.
- flag2_submitted and cage_opened:
    // Scenario design R5 m1: with ring (b) gone, a stacks-first player may not be in the cage.
    {in_cage:
        Step out of the cage. Someone's been waiting for you to come up for air.
    - else:
        Keep moving. Someone's been waiting for you to come up for air.
    }
// Scenario design R1 m1 (R2 n4, R3 n1: above the hatch and flag-2 rows): Victoria's m03 payoff,
// until the code is asked for.
- stacks_entered and m03_victoria_fate == "recruited" and not maintenance_code_used and not cage_opened:
    Victoria's people can open that gate. Ask me.
// Dialogue R1 m5: a player who has already talked at the hatch.
- flag2_submitted and hatch_talked and not cage_opened:
    The gate beside her hatch takes her card. If you haven't cloned it, lean on her counter again.
- flag2_submitted:
    The hatch, then the gate. Her card's on that reel.
- cage_opened and nightshade_file_held:
    Flag two. The ledger's still on the catalogue server.
- cage_opened:
    The plan cabinet takes her print. It's on her stamp, on the hatch shelf. Then flag two, the ledger.
// Walkthrough R1 m-04: after the hatch, name the gate and the cabinet.
- hatch_talked and not cage_opened:
    Clone her card at the hatch if you haven't. The gate's beside her, and the cabinet inside takes her print.
- stacks_entered:
    The hatch. Talk to her across the counter, and take what you can off her.
- flag1_submitted:
    The restricted stacks, through the reading room. Series R is in there.
// Playtest R1 A-M2: the laptop's set up (its click offers the guide).
- catalogue_guide_offered:
    The laptop's live. Get into the catalogue server, then bring what you find to the drop terminal.
- else:
    Get inside, set up the laptop on a reading desk, and get into the catalogue.
}
-> support_hub

// ================================================
// BRING-IN CONFIRM (unvoiced; scenario design R1 M1)
// ================================================
=== bring_in_confirm ===
~ temp open_told = 0
That's Helena done. Once you're on the plane, the archive's closed to us.
// Scenario design R2 m1: the threads that close for good first, at most two.
{m08_nightshade_triple_agent and nightshade_file_held and not nightshade_file_decided:
    ~ open_told = open_told + 1
    You haven't said what we do with Nightshade's file.
}
{open_told < 2 and not sleeper_named and not sleeper_shortlist:
    ~ open_told = open_told + 1
    {hl_box_opened:
        H&L's placing sheet is still in their box. You haven't read it.
    - else:
        H&L's boxes are still shut. That's yours to leave, if you leave it.
    }
}
{open_told < 2 and not deed_found:
    ~ open_told = open_told + 1
    Her lease file's still in her office. It's the bunker's address.
}
{open_told < 2 and tran_outcome == "left":
    ~ open_told = open_told + 1
    Tran's still at his tapes. Arakawa's people can collect him.
}
// The notice isn't lost here (the debrief asks), so it is a heads-up outside the cap.
{not albion_notified:
    The notice is still on his box. Netherton will ask.
}
+ [Bring me in.]
    // Copied once, never again, so a replayed debrief reads a stable value.
    {not start_debrief:
        ~ debrief_notice_before = albion_notified
    }
    // A tag, so it re-emits even when already true (a reload reopens the debrief).
    #set_global:start_debrief:true
    Bringing you in. Netherton's in the hangar.
    #exit_conversation
    -> DONE
+ [Not yet. I want to finish something.]
    Go on. I'll be here.
    -> support_hub

// ================================================
// GUIDES MENU (choices only)
// ================================================
=== guides_menu ===
// The hint_given writes use ~ rather than #set_global: a tag reaches this
// story only after ink has built the next choice list, so the guide just
// given would show again. ~ on a synced VAR writes the global at once.
+ {catalogue_guide_offered and not catalogue_guide_hint_given} [The catalogue server.]
    ~ catalogue_guide_hint_given = true
    #give_item:lab-workstation:m09_catalogue_field_guide
    On your workstation. Start with the index.
    -> guides_menu
+ {ledger_guide_offered and not ledger_guide_hint_given} [The ledger.]
    ~ ledger_guide_hint_given = true
    #give_item:lab-workstation:m09_ledger_field_guide
    On your workstation. Same server, further in.
    -> guides_menu
+ {tomb_beta_guide_offered and not tomb_beta_guide_hint_given} [Tomb Beta's server.]
    ~ tomb_beta_guide_hint_given = true
    // VM hint, flag 3: checked against the VM plan (opus48). Points at the guide only, no method, no commands.
    #give_item:lab-workstation:m09_tomb_beta_field_guide
    On your workstation. Read the part about old accounts nobody closed.
    -> guides_menu
+ {archive_code_guide_offered and not archive_code_guide_hint_given} [The archive's code.]
    ~ archive_code_guide_hint_given = true
    #give_item:lab-workstation:m09_archive_code_guide
    On your workstation. One worked example, then it's yours.
    -> guides_menu
+ [Never mind.]
    -> support_hub
