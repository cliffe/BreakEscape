// ===========================================
// m09 Digital Archaeology: The Recruiter (phone, voiced call)
// Group B, B1. CONTRACT.md §3.1, §7. Beat 2.4; MC §3.2-3.3.
// NPC id: recruiter (phone, currentKnot "start", not in npcIds).
// Voiced start knots: call, resume_name. Neither diverts to start.
// Her own lines carry no prefix; HaX is prefixed "Agent HaX:".
// No narrator line in call or resume_name. No printed variables.
// No pronoun for WREN before the name: "your Architect", "my placement", "them".
// US English for her; UK for HaX.
// ===========================================

INCLUDE m09_carryover_vars.ink

// Scenario globals this file reads or writes (CONTRACT §5).
VAR sleeper_shortlist = false   // Synced scenario global (scenario design R4 m4)
VAR recruiter_call_started = false
VAR recruiter_offer = ""   // Synced scenario global (also written by HaX's deck_resume)
VAR deck_pulled = ""   // Synced scenario global (also written by HaX's deck_resume)
VAR recruiter_secret = ""
VAR recruiter_said_yes = false
VAR recruiter_gone = false
VAR sleeper_named = false
VAR deck_choice_made = false
VAR raid_team_answer = ""

// Ink-local: the hang-up route, so a restart of `call` after a hang-up
// replays HaX's hang-up form rather than the no-block's.
VAR recruiter_hung_up = false

// ===========================================
// HOME STUB (not voiced; never reached by the call)
// ===========================================

=== start ===
// Shows only if the player opens her thread after the call. Choices only.
+ [Ring back.]
    Narrator: The number rings out.
    #exit_conversation
    -> DONE

// ===========================================
// THE CALL (voiced)
// ===========================================

=== call ===
// Guards for a restart from the top (a reload, or a ring that lands here
// late). Not in the contract's list; added so a restart never replays her
// opening after she has gone. No line on the done guard.
{deck_choice_made:
    #exit_conversation
    -> DONE
}
{recruiter_said_yes and not recruiter_gone:
    -> resume_name
}
{recruiter_gone:
    {recruiter_said_yes:
        -> yes_block
    }
    {recruiter_hung_up:
        -> hang_up_block
    }
    -> no_block
}

// 1. Defaults, once. Synced globals: `~` writes them and emits at once.
{not recruiter_call_started:
    ~ recruiter_call_started = true
    ~ recruiter_offer = "refused"
    ~ deck_pulled = "alpha_tapes"
    {m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed:
        ~ recruiter_secret = "kept"
    }
    {m05_recruiter_deal_accepted and m05_recruiter_deal_confessed:
        ~ recruiter_secret = "confessed"
    }
}

// 2. Openings. The task unlock rides on each opening's first spoken line.
{
- m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed:
    #unlock_task:answer_the_offer
    Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too.
    {recruiter_secret == "told" or recruiter_secret == "denied":
        -> spine
    }
    -> spring
- m05_recruiter_deal_accepted and m05_recruiter_deal_confessed:
    // R2 B-R2-01: her line first (the sold-and-lied clip), then HaX's.
    #unlock_task:answer_the_offer
    Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too.
    Agent HaX: We've talked about that. She has nothing on you.
    -> spine
- m05_completed:
    #unlock_task:answer_the_offer
    Last time I said the next one would cost me more. This is the next one.
    -> spine
- else:
    #unlock_task:answer_the_offer
    Agent 0x00, with a card cloner, a safe cracker and a handler listening. You're standing in my filing system. I thought I'd call.
    -> spine
}

// Sold and lied: own the October deal, deny it, or hang up (MC §3.3).
// (Stitch keeps its old name, `spring`; m05 ran in the autumn, 16 Sep to 6 Oct, alignment R1 m7.)
= spring
+ [She's right. I let her courier have the list in October.]
    #set_global:recruiter_secret:told
    Agent HaX: Noted. Later.
    -> spine
+ [She's fishing. I never dealt with her.]
    #set_global:recruiter_secret:denied
    Of course. Shall we do business anyway?
    -> spine
+ [Hang up.]
    ~ recruiter_hung_up = true
    -> hang_up_block

// 3. The spine. One grievance line (script edit B-13); the tasking is said
// once, in the offer line below. Every line here is 25 words or fewer.
= spine
Margaret's shredding eleven years of my placements tonight, for his schedule. I'd like something back on the books.
+ [He's ENTROPY's planner. You work for him.]
    I work with him. Tonight he forgot the difference.
    -> offer
+ [Go on.]
    -> offer

// The double-cross cost she no longer says in full ("half my people will
// have moved") is said before the button by HaX's yes-block line.
= offer
One of your four is mine. Was mine, until your Architect took them for Montana. The name tonight. You let my tape deck wipe.
Say no and I wipe it myself. Same deck, no name.
I can't see which tape you pull, only that you pulled one. Take the name and pull anything, and I call my placement.
// Scenario design R4 m4 (dialogue R3: after her whole offer): a player who has read the H&L placing sheet.
{sleeper_shortlist:
    Agent HaX: We're down to two off that firm's sheet. She's selling you a coin toss.
}
// B-2: HaX on what her file holds, by m05 (group A to sign off). No
// default arm: it repeated the next line (script edit B-03).
{
- m05_final_choice == "turn_double_agent":
    Agent HaX: Torres gave us what he knew. Her file has the names he couldn't.
- m05_final_choice == "public_exposure":
    Agent HaX: Her file has her handlers, and every one of the forty-seven.
}
// The first half is the hang-up block's string, so one clip serves both.
Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded.
Agent HaX: He teaches what he'll do. If he built the bunker the way he taught it, it's on there.
Agent HaX: I can beat that wipe.
Nobody has.
Agent HaX: Buy from her and we go in an ENTROPY ledger, next to his orders. He'll read the sale, and he'll quote it at you.
-> answer

// 4. The answer.
= answer
+ [Give me the name. Let the deck go.]
    #set_global:recruiter_said_yes:true
    #set_global:recruiter_offer:taken
    #set_global:deck_pulled:none
    #set_global:sleeper_named:true
    #set_global:recruiter_gone:true
    Sensible. Halina Kowalczyk. Her mother's care home has had my check for eleven years.
    She gave you something at the briefing, I expect. She's generous. It's how we hired her.
    {raid_team_answer == "kowalczyk":
        Agent HaX: You thanked her at the briefing. Keep doing it.
    }
    -> yes_block
+ [No. Keep your name.]
    #set_global:recruiter_gone:true
    Then I'll tidy my own desk. *beat* Gone. Goodnight, agent.
    -> no_block

// The three HaX blocks: fixed, identical to A1's deck_resume (unprefixed there).
= yes_block
Agent HaX: She's watching the deck. Pull her file and we get half her people. She warns the rest, and Kowalczyk runs.
+ [Leave it. Let it wipe.]
    #set_global:recruiter_offer:taken
    #set_global:deck_pulled:none
    #set_global:deck_choice_made:true
    #complete_task:answer_the_offer
    Agent HaX: She fired it from Sorensen's office. I'm on the door.
    Agent HaX: Her card for the tape room will be in that office.
    // Final playtest: a one-word reply so the last line can be read.
    ++ [On my way.]
        #exit_conversation
        -> DONE
+ [Pull her file anyway.]
    #set_global:recruiter_offer:double_crossed
    #set_global:deck_pulled:her_file
    Agent HaX: First name on it is a handler in Baltimore.
    #set_global:deck_choice_made:true
    #complete_task:answer_the_offer
    Agent HaX: She fired it from Sorensen's office. I'm on the door.
    Agent HaX: Her card for the tape room will be in that office.
    // Final playtest: a one-word reply so the last line can be read.
    ++ [On my way.]
        #exit_conversation
        -> DONE

= no_block
Agent HaX: She only watched the counter. I can pull one before it wipes. Which?
-> tape_choice

// After a hang-up: no Recruiter line. HaX's asides stand in for narration.
= hang_up_block
// R2 audio cut 3: one counter line, not two.
#set_global:recruiter_gone:true
Agent HaX: She's started the wipe on her tape deck. She thinks you've gone.
Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded.
Agent HaX: One of them. Now.
-> tape_choice

= tape_choice
+ [Her file.]
    #set_global:recruiter_offer:named
    #set_global:deck_pulled:her_file
    Agent HaX: First name on it is a handler in Baltimore.
    // Scenario design R4 m4 (identical in HaX's deck_resume).
    {sleeper_shortlist:
        Agent HaX: Her file doesn't change it. WREN's still one of two.
    - else:
        Agent HaX: One of four. Two, if that firm's boxes say so.
    }
    #set_global:deck_choice_made:true
    #complete_task:answer_the_offer
    Agent HaX: She fired it from Sorensen's office. I'm on the door.
    Agent HaX: Her card for the tape room will be in that office.
    // Final playtest: a one-word reply so the last line can be read.
    ++ [On my way.]
        #exit_conversation
        -> DONE
+ [The Alpha tapes.]
    #set_global:recruiter_offer:refused
    #set_global:deck_pulled:alpha_tapes
    #set_global:deck_choice_made:true
    #complete_task:answer_the_offer
    Agent HaX: She fired it from Sorensen's office. I'm on the door.
    Agent HaX: Her card for the tape room will be in that office.
    // Final playtest: a one-word reply so the last line can be read.
    ++ [On my way.]
        #exit_conversation
        -> DONE

// ===========================================
// RE-RING 2: closed between "yes" and the name (voiced)
// ===========================================

=== resume_name ===
{deck_choice_made:
    #exit_conversation
    -> DONE
}
{not sleeper_named:
    #set_global:sleeper_named:true
    #set_global:recruiter_gone:true
    You hung up on the part you paid for. Halina Kowalczyk.
}
{raid_team_answer == "kowalczyk":
    Agent HaX: You thanked her at the briefing. Keep doing it.
}
-> call.yes_block
