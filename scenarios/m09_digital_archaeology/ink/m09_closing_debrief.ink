// ================================================
// Mission 9: Digital Archaeology - closing debrief (C2)
// Host: closing_debrief (hidden, loading_dock), person-chat cutscene opened by
// its mapping on start_debrief (disableClose). A hangar at Helena's airfield.
// After a reload it RESTARTS AT start with ink variables kept and visit counts
// lost, so every answered beat is guarded by a global or an ink-local VAR and
// replays as one short bridging line (S4 §6.5, C-9).
// Speakers: Director Magnus Netherton, Agent 0x5E 'Lantern', Agent HaX (on the
// line, through hax_voice), Narrator.
// Entry knot: start. debrief_played on the first line; report_done directly
// above the last line. report_to_netherton completes, and debrief_closed rolls
// the card and credits, when the conversation closes (closing_debrief's
// mappings; lesson 46). Ends #exit_conversation, -> DONE.
// Contract §4.2; story arc §7; moral choices §3.5, §4.7, §8.
// SAFETYNET doesn't arrest: the police make the arrests (C-4).
// ================================================

INCLUDE m09_carryover_vars.ink

// m09 globals (CONTRACT §5.1, §5.3). Exports first.
VAR recruiter_offer = ""
VAR sleeper_named = false
VAR sleeper_shortlist = false
VAR recruiter_secret = ""
VAR hax_confession_answer = ""
VAR maintenance_code_used = false   // playtest round 2 m-2: Victoria's people opened the gate
VAR deed_found = false   // scenario design R2 m2: the lease file was taken
VAR albion_notified = false
VAR legacy_files_saved = false
// Local to m09.
VAR noor_told = false
VAR noor_ko = false
VAR noor_met = false
VAR old_coyote_ko = false
VAR sorensen_fate = "left"
VAR tran_outcome = "left"
VAR memo_stance = ""
VAR memo_read = false   // Synced scenario global (alignment R2 n1): HaX sets it when the Albion folder is read after flag 3
VAR kowalczyk_reply = ""
VAR debrief_notice_before = false
VAR debrief_played = false
VAR report_done = false

// Ink-local (persisted with the story; visit counts don't survive a reload).
VAR asked_archive = false
VAR asked_wren = false
VAR asked_recruiter = false
VAR asked_notice = false
VAR notice_answered = false

VAR said_floor_line = false   // R3 I-7 guard (ink-local)

=== start ===
// debrief_played is read before the tag lands, so a replay gets the short open.
#set_global:debrief_played:true
{ debrief_played:
    Narrator: The hangar again, under the floodlights. Netherton is waiting.
- else:
    Narrator: A hangar at Helena's airfield, under floodlights. Task Force Null's aircraft sits with its ramp down, and the team is unloading cases.
}
-> kowalczyk

=== kowalczyk ===
// Beat 2. double_crossed first: she isn't there, so no choice.
{
- recruiter_offer == "double_crossed":
    Narrator: A crate sits at the foot of the ramp. Nobody is lifting it.
    Director Magnus Netherton: Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser.
    -> the_hour
- kowalczyk_reply != "":
    // Replay after a reload: the question has been answered.
    Narrator: Kowalczyk is back at the ramp, passing cases down the line.
    -> the_hour
- else:
    Narrator: Kowalczyk reaches you before Netherton does, a crate on her hip.
    Agent 0x5E 'Lantern': Well? Did my toy earn its keep?
}
// SE R1 ruling 1: both buttons hold whether the cracker or the PIN opened the safe.
+ [Thank you. I was glad of it.]
    #set_global:kowalczyk_reply:warm
    Agent 0x5E 'Lantern': Course you were. I'll tell it you said so.
    Narrator: She grins and goes back to the ramp.
    -> the_hour
+ [It was in my pocket.]
    #set_global:kowalczyk_reply:flat
    Agent 0x5E 'Lantern': High praise. I'll have it framed.
    { sleeper_named:
        Narrator: She grins anyway. Netherton has come up behind you.
        Narrator: He watches her go back to the ramp, and says nothing.
    - else:
        Narrator: She grins anyway and goes back to the ramp.
    }
    -> the_hour

=== the_hour ===
// Beat 3 (fixed), then the name, once.
Director Magnus Netherton: Oh-six-hundred, day thirteen. Twenty hours. He has given us every one of them.
Director Magnus Netherton: Dr Adrian Tesseract. It is easier to say in a hangar than it was on the plane.
-> stance

=== stance ===
// Beat 4: the memo stance (MC §3.5), paid back at the pen.
{ memo_stance != "":
    Director Magnus Netherton: I have your answer on his memo. I will come back to it.
    -> notice
}
// Alignment R2 n1: a player who never read the folder hears the memo in one
// line, so the exported answer is never blind.
{memo_read:
    Director Magnus Netherton: You have read his memo. Was he right?
- else:
    Director Magnus Netherton: In 2017 he told the board to warn the vendor within thirty days. The board kept the flaw.
    Director Magnus Netherton: That was his memo, in short. Was he right?
}
+ [About Albion, yes.]
    #set_global:memo_stance:yes_albion
    Director Magnus Netherton: Hold that until I find a pen.
    -> notice
+ [No. Not about any of it.]
    #set_global:memo_stance:no
    Director Magnus Netherton: Hold that until I find a pen.
    -> notice

=== notice ===
// Beat 5. Sent in the archive: skip (the hub's "The notice." covers it).
// debrief_notice_before is copied by HaX's "[Bring me in.]" before this opens.
{
- debrief_notice_before:
    -> hub
- albion_notified:
    // Sent here, before a reload.
    Director Magnus Netherton: The notice has gone, on your word. I have signed for it.
    -> hub
- notice_answered:
    // Held here, before a reload.
    Director Magnus Netherton: The notice waits behind Montana. You said so.
    -> hub
- m04_disclosure_choice == "full" or m04_crew_lost:
    Director Magnus Netherton: His notice is still on that box. Send it, and the vendor starts on a fix for four hundred sites and the Critical Mass watch comes down tonight.
    Director Magnus Netherton: The inquiry will ask when we knew. Hold it, and he can call us hoarders, and be right.
- else:
    Director Magnus Netherton: His notice is still on that box. Send it, and the vendor starts on a fix for four hundred sites and the Critical Mass watch comes down tonight.
    Director Magnus Netherton: Hold it, and he can call us hoarders, and be right.
}
// Stage 8 SR minor 4 (ruling 19): full forms on Netherton's weighted lines.
Director Magnus Netherton: You read it. You decide. I will sign whichever.
+ [Send it.]
    ~ notice_answered = true
    #set_global:albion_notified:true
    Director Magnus Netherton: Then it goes tonight, under my name.
    -> hub
+ [Hold it.]
    ~ notice_answered = true
    // Alignment R2 n2: the debrief's hold is final, so it closes the task.
    #complete_task:send_the_notice
    Director Magnus Netherton: Then it waits behind Montana, with everything else.
    -> hub

=== hub ===
// Beat 6: the question hub. Each topic once (ink-local VARs, which survive a
// reload); "[Montana, sir.]" always there and goes to the spine.
{ asked_archive or asked_wren or asked_recruiter or asked_notice:
    // SE R1 optional trim: one re-entry line, not a three-way cycle.
    Director Magnus Netherton: Anything more, before I sign?
- else:
    Director Magnus Netherton: Ask me what you need to. Then I sign.
}
+ { not asked_archive } [The archive, sir.]
    ~ asked_archive = true
    -> the_archive
+ { not asked_wren } [WREN.]
    ~ asked_wren = true
    {
    - sleeper_named:
        Director Magnus Netherton: Halina Kowalczyk.
    - sleeper_shortlist:
        Director Magnus Netherton: Two names. I have worked with both for eleven years. One of them is lying to me tonight.
    - else:
        Director Magnus Netherton: One of four. I have known all four of them for years, and it does not help.
    }
    -> hub
+ { not asked_recruiter } [The Recruiter.]
    ~ asked_recruiter = true
    {
    - recruiter_offer == "named":
        // C-4: the police make the arrests, never SAFETYNET; WREN still mustn't hear.
        Director Magnus Netherton: Her handler list is with Analysis. Ours are on it by codename only; she kept the key to the names.
        Director Magnus Netherton: The police make the arrests at oh-six-hundred, day thirteen. Nobody moves before then. WREN would hear.
    - recruiter_offer == "double_crossed":
        Director Magnus Netherton: About half of her network. She warned the rest, and she warned Kowalczyk.
    - recruiter_offer == "taken":
        Director Magnus Netherton: You bought a name, and it was the right name. She will sell the invoice.
    - else:
        Director Magnus Netherton: She is at large, and you did not let her set the price.
    }
    { recruiter_secret == "told":
        Director Magnus Netherton: HaX tells me you said something on that call. I do not need to hear it twice.
    }
    -> hub
+ { debrief_notice_before and not asked_notice } [The notice.]
    ~ asked_notice = true
    Director Magnus Netherton: You sent it without asking me. I would have said yes. I would have taken a week to say it.
    -> hub
// Blind playtest F4 (the ending rule: warn, and let the player finish first).
+ [Montana, sir.]
    {not asked_archive or not asked_wren or not asked_recruiter or (debrief_notice_before and not asked_notice):
        -> montana_confirm
    }
    -> spine

=== montana_confirm ===
Director Magnus Netherton: Then I sign, and that is the night closed. Anything else first?
+ [Sign it, sir.]
    -> spine
+ [One more thing.]
    -> hub

=== the_archive ===
// SA §7.1 order; at most two lines, the first two that apply. Sorensen's and
// Tran's "left", and lost files, get nothing; Noor always has a line.
~ temp said = 0
// Playtest round 2 m-2: Victoria's m03 payoff, outside the two-line cap (like Noor's).
{ m03_victoria_fate == "recruited" and maintenance_code_used:
    Director Magnus Netherton: Sterling's people opened that gate for us. The first time we have used her. It will not be the last.
}
{ sorensen_fate == "talked":
    Director Magnus Netherton: She wrote down every box she destroyed. She even got the numbers right.
    ~ said = said + 1
}
{ sorensen_fate == "ko":
    Director Magnus Netherton: Mrs Sorensen woke up asking for a lawyer. She has not said a word since.
    ~ said = said + 1
}
{ legacy_files_saved:
    Director Magnus Netherton: Eleven names. None of them ours. Tonight that is the best news I have.
    ~ said = said + 1
}
{ said < 2:
    {
    - noor_ko:
        Director Magnus Netherton: Miss Haddad woke up at her own desk with a headache and two of Arakawa's people. She has asked who hit her. I have not told her.
    - noor_told:
        Director Magnus Netherton: Miss Haddad is in a hotel in Great Falls with two of Arakawa's people. She has not been allowed to ring her father. She asked twice.
    - m05_found_pipeline_list and not m05_recruiter_deal_accepted:
        // Warned back in October (m05's badge log runs 16 Sep to 6 Oct): she knew what she was on before tonight.
        Director Magnus Netherton: Miss Haddad went home at the end of her shift. She knew what list she was on before you arrived.
    - noor_met:
        Director Magnus Netherton: Miss Haddad went home and rang her father. She is still on a list, and she does not know it.
    // Playtest R1 C-m-6: a player who never met her hears who she is.
    - else:
        Director Magnus Netherton: The clerk on the front desk went home and rang her father. Noor Haddad. She is on one of the Recruiter's lists, and she does not know it.
    }
    ~ said = said + 1
}
{ said < 2 and old_coyote_ko:
    // "He" names the guard: this line can follow any other.
    Director Magnus Netherton: Your night guard wants to climb power lines for a living. He will. Not this week.
    ~ said = said + 1
}
{ said < 2:
    {
    - tran_outcome == "talked":
        Director Magnus Netherton: Tran left on foot. His handler is being watched, and knows it.
    - tran_outcome == "ko":
        Director Magnus Netherton: Tran is in custody, and has asked for a lawyer and a phone charger.
    }
}
-> hub

=== spine ===
// Beat 7, every player. The two names (fixed), read before he signs.
Narrator: He takes a card from his breast pocket.
Director Magnus Netherton: Agent 0x19, Callum Fraser. Agent 0x6B, Ana Lúcia Ferreira.
Narrator: He reads the first name off the card. He doesn't look down for the second.
// The order, and his reply to the stance at the pen (N-07).
// Scenario design R1 m3: the briefing's open question ("Not the bunker. Not
// yet."), answered for every player before he signs.
// R2 m2: sourced on every route; the lease arm rewards going back for it.
{
- deed_found:
    Director Magnus Netherton: Sun River. A civil defence bunker Tesseract's people leased from the state in 2016. Mrs Sorensen's own file gave us the address. That is where the order sends us.
- m08_tomb_gamma_location_known:
    Director Magnus Netherton: Sun River. Nightshade's coordinate, and a lease in Mrs Sorensen's office that Tesseract's people took in 2016. That is where the order sends us.
- else:
    Director Magnus Netherton: Sun River. Analysis found the lease an hour ago. It was in Mrs Sorensen's office all night. That is where the order sends us.
}
// Teaching R2-n5: the account lesson, brought back as a consequence (voiced).
Director Magnus Netherton: A staff credential, seven years live. Every leaver's account is being checked before Monday.
Narrator: He lays the Montana order on a crate and uncaps a pen.
// R3 I-7: the ruthless save, remembered once (pays off the briefing's
// "Nobody mentions why.").
// Ink-local guard: ink variables survive a reload (visit counts don't), so a
// replay of the spine doesn't say it twice.
{m08_netherton_ko and not said_floor_line:
    ~ said_floor_line = true
    Director Magnus Netherton: You knocked me down at the Citadel. Nobody has mentioned it. I am mentioning it once.
}
{
- memo_stance == "yes_albion":
    Director Magnus Netherton: Then I sign for him too.
- memo_stance == "no":
    Director Magnus Netherton: Good. Then he can make that argument in court, and lose it.
}
// m08's stance: his own name beside Nightshade's, or a thank-you he doesn't explain.
{
- m08_debrief_stance == "owned":
    Director Magnus Netherton: My name is on Nightshade's file now, beside his. I said it would be.
- m08_debrief_stance == "defended":
    Director Magnus Netherton: Before I forget. Thank you.
}
// HaX, last on the line, by her confession answer; "the rest" still owed on every answer.
Narrator: HaX is on the line from the Citadel, already packing.
{
- hax_confession_answer == "should_have_told":
    Agent HaX: Everything I have on the bunker is on your phone. As promised.
- hax_confession_answer == "same_in_your_place":
    Agent HaX: I said thank you once. I'm not saying it twice. *beat* I haven't forgotten.
- hax_confession_answer == "afterwards":
    Agent HaX: You said afterwards. I'm holding you to it.
}
// R36 (VM weave): HaX names the player's own technical arc once, concept level.
Agent HaX: And think how we did it. Onto their catalogue on a night-run login someone left on a slip, then up to the box's keeper to reach the ledger.
Agent HaX: Onto the Architect's own server through a hole in his enrolment site, then the same climb to lift his name and his notice. Access, escalate, recover. Twice over.
Agent HaX: I still owe you the rest. When this is over.
// Why the team goes in together, the last spoken line. double_crossed first.
{
- recruiter_offer == "double_crossed":
    Director Magnus Netherton: She knows we know. She will be where he is. So will we.
- sleeper_named:
    Director Magnus Netherton: We take her at the briefing, in front of the others, where there is nowhere to go. Until then she sees nothing in my face. Nor in yours.
- else:
    Director Magnus Netherton: If I bench anyone tonight, WREN knows we know. They come. You watch them.
}
// Beat 8: the last image. report_done directly above it. Stage 9 (lesson 46,
// m10 walkthrough): the task completes and the credits roll when this
// conversation closes (closing_debrief's mappings, debrief_closed), so the
// conclusion screen can't cover the last line.
#set_global:report_done:true
{
- recruiter_offer == "double_crossed":
    Narrator: He caps the pen. Her crate is still on the ramp.
- sleeper_named:
    Narrator: He caps the pen. Across the hangar, Kowalczyk waves.
- else:
    Narrator: He caps the pen.
}
#exit_conversation
-> DONE
