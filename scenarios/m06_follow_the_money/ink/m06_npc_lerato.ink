// ===========================================
// Mission 6: NPC - Lerato Dlamini (night floor coordinator)
// Office life (office_life/PLAN.md 2.3, 6): ambient. No clue, no task, nothing given.
// She takes the player for whoever they say they are and knows nothing of the operation.
// Safe topics only (PLAN 3.3): the phones, the rota, the coffee, who is on tonight.
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
Lerato Dlamini: Evening. I'm on the phones and the rota tonight.
-> hub

=== hub ===
{hub_quiet:
    ~ hub_quiet = false
- else:
    Lerato Dlamini: You again. Go on, before the phone goes.
}
* [Quiet night?]
    Lerato Dlamini: Quiet is how it starts. Then the early markets wake and every line lights up.
    Lerato Dlamini: And I've not eaten since I came in.
    ~ hub_quiet = true
    -> hub
* [Who else is on tonight?]
    Lerato Dlamini: Me, Tomasz on the support queue, and Dani, wired on coffee.
    ~ hub_quiet = true
    -> hub
+ [I'll let you get on.]
    Lerato Dlamini: Mind the coffee machine. It bites.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

// ===========================================
// EXCHANGES (heard once each; played between Lerato and Tomasz at the coffee point)
// ===========================================

// Gate: irina_taken (she has been collected from the floor). The arrest itself, nothing about Irina's character or work.
=== ex_floor_after_irina ===
Lerato Dlamini: Did you see the police come through?
Tomasz Wisniewski: I did. Two officers, very quiet.
Lerato Dlamini: Nobody has told us a thing.
Tomasz Wisniewski: I only keep the queue running.
Lerato Dlamini: Same. The floor won't run itself.
-> DONE

// Gate: assets_seized. The floor's reaction in plain words; no wallets, funds or amounts.
=== ex_floor_after_seizure ===
Lerato Dlamini: My phone hasn't stopped all night.
Tomasz Wisniewski: The queue climbs. Callers everywhere.
Lerato Dlamini: And I've no idea what to tell them.
Tomasz Wisniewski: Then we answer, and we say very little.
Lerato Dlamini: Politely. That part I can do.
-> DONE
