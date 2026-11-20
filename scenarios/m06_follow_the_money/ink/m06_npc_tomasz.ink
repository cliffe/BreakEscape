// ===========================================
// Mission 6: NPC - Tomasz Wisniewski (evening app-support lead)
// Office life (office_life/PLAN.md 2.3, 6): ambient. No clue, no task, nothing given.
// App tickets only (crashes, slow screens, notifications, a caller waiting). PLAN 3.3 applies.
// ===========================================

// Re-entry line for a re-talk, skipped once after an answer or a goodbye.
VAR hub_quiet = false
// Set after the first meeting, so a reload does not replay the greeting.
VAR met_player = false

=== start ===
~ hub_quiet = true
{met_player:
    ~ hub_quiet = false
    -> hub
}
~ met_player = true
Tomasz Wisniewski: Sorry, I am in the middle of a ticket. How can I help?
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Tomasz Wisniewski: Yes? Quickly, I have a caller waiting.
}
* [How is the queue tonight?]
    Tomasz Wisniewski: Quiet. One app crashing on launch, one notification that rings twice.
    Tomasz Wisniewski: Nothing worse. I do not trust it.
    ~ hub_quiet = true
    -> hub
* [Who covers the phones?]
    Tomasz Wisniewski: Lerato has the desk phone. If she is away, I pick up.
    ~ hub_quiet = true
    -> hub
+ [I'll leave you to it.]
    Tomasz Wisniewski: Thank you. Back to my queue.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// EXCHANGE (heard once; Tomasz and Dani at the coffee point)
// ===========================================

// Gate: floor_staff_ko false. The first line stands alone.
=== ex_dani_tomasz_late_shift ===
Tomasz Wisniewski: Dani, is that your fifth coffee tonight?
Dani Okonkwo: Sixth. Asia opens soon and I'm fading.
Tomasz Wisniewski: At least your charts never shout at you.
Dani Okonkwo: No. Your callers do enough of that.
Tomasz Wisniewski: One said his notification rang twice.
Dani Okonkwo: Tell him it's a feature. Works for me.
-> DONE
