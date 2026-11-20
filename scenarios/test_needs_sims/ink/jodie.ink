// Jodie Kerr, maintenance assistant, Glaswegian. Her id sorts before Keith's, so the needs system
// reads her exchange list first (_findExchange). job_called is set in neil.ink (the player reports
// the flickering light). After the job-called exchange Jodie walks to the staff lockers for a spare
// tube; job_cleared is set by the scenario when she finishes there (npc_used:staff_lockers), never
// by a choice here, so the light steadies when she does the job (SIMS-4 R2 M2).
// job_called / job_cleared are scenario globals synced into these VARs on load.
VAR job_called = false
VAR job_cleared = false
VAR heard_exchange_job_called = false

=== start ===
# speaker:npc
Hiya. Jodie, maintenance. On call for whatever breaks, mostly the kettle.
-> hub

=== hub ===
+ [What do you do here?]
    # speaker:npc
    Fix whatever Keith's radio turns up. Lights, locks, leaks.
    -> hub
+ { job_called && not job_cleared && heard_exchange_job_called } [Will you see to that light?]
    # speaker:npc
    Aye, spare tube's in my locker.
    -> hub
* { job_cleared } [Did that light get sorted?]
    # speaker:npc
    Aye, sorted. Spare tube was in my locker. Cheers for flagging it.
    -> hub
+ [Busy night?]
    # speaker:npc
    Comes in waves. Right now it's just us and the boiler.
    -> hub
+ [I'll let you get on.]
    # speaker:npc
    Nae bother. Away you go.
    # exit_conversation
    -> END

// Exchanges played by the needs system when Keith and Jodie meet at a chatter object, with the
// player in earshot. Never reached from the player's conversation. Lines are voiceable: the "Name:"
// prefix is stripped before timing and TTS.

// The first-visit exchange, ungated, no clock time (waiting for the radio).
=== exchange_waiting ===
Keith: Quiet on the radio tonight.
Jodie: Long shift when it's this slow.
Keith: I'll take quiet over chaos.
Jodie: Don't jinx it now, Keith.
Keith: A brew while we can, then.
-> DONE

// Gated on job_called: a job has been reported. Jodie takes it; the scenario then sends her to the
// lockers for a tube (Jodie's npc_exchange_heard:exchange_job_called mapping).
=== exchange_job_called ===
Jodie: That light in here still flickering?
Keith: Neil's put it out on the radio.
Keith: That'll be one for you, Jodie.
Jodie: Once I've finished this, aye.
-> DONE

// Gated on job_cleared and heard_exchange_job_called: Jodie has done the job.
=== exchange_job_cleared ===
Keith: Light's behaving now.
Jodie: Spare from my locker did it.
Keith: Peace and quiet again. Lovely.
-> DONE
