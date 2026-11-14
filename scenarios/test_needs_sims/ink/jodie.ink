// Jodie Kerr, maintenance assistant, Glaswegian. Her id sorts before Keith's, so the needs system
// reads her exchange list first (_findExchange). job_called is set in neil.ink (the player reports
// the flickering light); job_cleared is set by the hub choice below, on a later visit (SIMS-4).
// job_called / job_cleared are scenario globals synced into these VARs on load.
VAR job_called = false
VAR job_cleared = false

=== start ===
# speaker:npc
Hiya. Jodie, maintenance. On call for whatever breaks, mostly the kettle.
-> hub

=== hub ===
+ [What do you do here?]
    # speaker:npc
    Fix whatever Keith's radio turns up. Lights, locks, leaks.
    -> hub
+ { job_called && not job_cleared } [Did that light get sorted?]
    # speaker:npc
    Aye, I swapped the tube. No more flickering. Cheers for flagging it.
    #set_global:job_cleared:true
    -> hub
+ [Busy night?]
    # speaker:npc
    Comes in waves. Right now it's just us and the boiler.
    -> hub
+ [I'll let you get on.] #exit_conversation
    # speaker:npc
    Nae bother. Away you go.
    -> hub

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

// Gated on job_called: a job has been reported and not yet come through.
=== exchange_job_called ===
Jodie: That light in here still flickering?
Keith: Neil's put it out on the radio.
Jodie: Someone'll be up to fix it soon.
-> DONE

// Gated on job_cleared and heard_exchange_job_called: the job has been done.
=== exchange_job_cleared ===
Keith: They sorted that flickering light.
Jodie: About time. Hurt my eyes, that did.
Keith: Peace and quiet again. Lovely.
-> DONE
