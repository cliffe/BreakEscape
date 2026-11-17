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
    Lerato Dlamini: Back again? Quick, before the phone goes.
}
* [Quiet night?]
    Lerato Dlamini: Quiet is how it starts. Then Asia opens and every line lights up.
    Lerato Dlamini: I keep a mug by the phone for that.
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

// Gate: irina_arrested. The arrest itself, nothing about Irina's character or work.
=== ex_floor_after_irina ===
Lerato Dlamini: Did you see the police come through?
Tomasz Wisniewski: I did. Her office has been dark since.
Lerato Dlamini: Nobody has told us a thing.
Tomasz Wisniewski: I only keep the queue running.
Lerato Dlamini: Same. Somebody has to.
-> DONE

// Gate: assets_seized. The floor's reaction in plain words; no wallets, funds or amounts.
=== ex_floor_after_seizure ===
Lerato Dlamini: Every phone line is lit up at once.
Tomasz Wisniewski: Queue's climbing. Callers everywhere.
Lerato Dlamini: And nobody will tell us why.
Tomasz Wisniewski: Then we answer, and we say very little.
Lerato Dlamini: Politely. That part I can do.
-> DONE
