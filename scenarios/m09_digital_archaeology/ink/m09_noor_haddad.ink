// ===========================================
// m09 Digital Archaeology: Noor Haddad, records clerk (person-chat)
// Group B, B2. CONTRACT.md §3.2. Beat 1.2; MC §4.2.
// NPC id: noor_haddad, front desk. Entry knot: start.
// 34, Lebanese-American, Dearborn. Quick, Midwestern, guarded; answers a
// question with a question when she's scared. US English.
// Her job is not the cost and nothing rides on it (MC §4.2). The cost of
// telling her is her father's nightly call.
// ===========================================

INCLUDE m09_carryover_vars.ink

// Scenario globals (CONTRACT §5.3).
VAR noor_told = false
VAR ledger_page_seen = false

// Ink-local.
VAR noor_met = false
VAR noor_cover = ""          // "contractor" / "auditor" / "safetynet" (not-warned form only)
VAR noor_tell_signposted = false
VAR noor_list_checked = false
VAR noor_asked_peg = false
VAR hub_quiet = false

=== start ===
// A reopen lands on hub; this guard covers a page reload (ink vars survive).
{noor_met: -> hub}
~ noor_met = true
{
- m05_found_pipeline_list and not m05_recruiter_deal_accepted:
    // Warned in time: she knows what the player is. No tell choice later.
    #complete_task:meet_the_clerk
    #give_item:keycard:noor_staff_card
    Noor Haddad: You're the one they said would come. Here, my card. The staff door's round the side.
    Noor Haddad: Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice.
    Noor Haddad: I didn't send the last one. It's under the desk.
    -> back
- m05_found_pipeline_list and m05_recruiter_deal_accepted and m05_recruiter_deal_confessed:
    // Warned late: the warning, and no card.
    #complete_task:meet_the_clerk
    Noor Haddad: Somebody rang me in the summer and told me to watch my boss. Then nobody rang back.
    Noor Haddad: Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice.
    Noor Haddad: I don't know you. I'm not losing this job for a phone call.
    -> back
- else:
    // Not warned (cold starts too): a wary bystander. The player picks a cover.
    #complete_task:meet_the_clerk
    Noor Haddad: We're closed. Nobody comes in for a deed at this hour.
    -> cover
}

=== cover ===
+ [Shredder service. Margaret Sorensen called about the feed.]
    ~ noor_cover = "contractor"
    Noor Haddad: Peg called somebody? Okay. It's in the cage. You can't miss the noise.
    -> back
+ [Audit. The lease-holder wants the destruction certificates checked.]
    ~ noor_cover = "auditor"
    Noor Haddad: At this hour? The certificates come after the run. Somebody's nervous.
    -> back
+ [SAFETYNET. Someone in this building is recruiting people.]
    ~ noor_cover = "safetynet"
    Noor Haddad: Recruiting? I file deeds for dead ranchers. Nobody recruits a records clerk.
    -> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
// Re-entry line on a re-talk only: topics and exits return through `back`.
{not hub_quiet:
    {
    - noor_cover == "safetynet":
        Noor Haddad: {&You again. Still recruiting?|What now? I've got trolleys to load.|Peg's going to notice you, you know.}
    - else:
        Noor Haddad: {&What now? I've got trolleys to load.|Still here? Peg's going to notice.|You again. Okay.}
    }
}
~ hub_quiet = false
// HaX signposts the tell once, the first time it can show.
{not noor_tell_signposted and not (m05_found_pipeline_list and not m05_recruiter_deal_accepted) and not noor_told:
    ~ noor_tell_signposted = true
    Agent HaX: Tell her and she's a witness. She goes tonight, and she doesn't ring her dad for a while.
}
// Sticky on every branch: standing close while she checks her list.
+ [Which boxes are next on that list?]
    #clone_keycard:reading_staff_door
    {noor_list_checked:
        Noor Haddad: Same list. Fewer boxes.
    - else:
        Noor Haddad: Series R. Forty-eight boxes, and she wants every one gone tonight.
    }
    ~ noor_list_checked = true
    -> back
+ {not noor_asked_peg} [How long have you worked for Sorensen?]
    ~ noor_asked_peg = true
    Noor Haddad: Three years. She hired me off a temp agency in Billings.
    Noor Haddad: She knew my name before I said it. I thought that was nice.
    -> back
+ {not (m05_found_pipeline_list and not m05_recruiter_deal_accepted) and not noor_told and not ledger_page_seen} [Tell her what the bonus was.]
    Noor Haddad: My dad's on dialysis in Dearborn. I never told her that. How did she know that?
    -> reach
+ {not (m05_found_pipeline_list and not m05_recruiter_deal_accepted) and not noor_told and ledger_page_seen} [Show her the page.]
    Noor Haddad: Was I going to say yes? Don't answer. I know I was.
    -> reach
+ [I'll let you get on.]
    Noor Haddad: {&Mind the trolleys.|Sure. Peg's counting.}
    #exit_conversation
    -> back

// She reaches for her phone; the player stops her (MC §4.2, R2-07).
=== reach ===
Narrator: She has her phone out. Her thumb is already on his number.
Agent HaX: Don't let her ring from here.
+ [Not tonight. Not from here.]
    #set_global:noor_told:true
    Noor Haddad: He waits up for my call. He'll think I forgot him.
    Narrator: She puts the phone face down on the desk and goes for her coat.
    #exit_conversation
    -> back
