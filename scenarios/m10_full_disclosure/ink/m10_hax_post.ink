INCLUDE m10_carryover_vars.ink
// ================================================
// Mission 10: Full Disclosure - Agent HaX in person (hax_post), the forward post
// Group B, stage 7b. Contract §1.4. koImmune. start -> hub: a re-entry line,
// two short topics, a sticky exit with her reply. Her questions live on the
// phone. After the breach she is "on the phone". No calls, no globals.
// The rest (SE §3.1): she promised it in Helena; on a cold start she plants
// it here. Group A pays it at 06:00, so nothing here tells it.
// No DONE or END: exits divert to hub, which skips its line once.
// ================================================

VAR hpost_quiet = false
VAR hpost_rest_asked = false
VAR hpost_phone_asked = false

=== start ===
-> hub

=== hub ===
{
- hpost_quiet:
    ~ hpost_quiet = false
- ending != "":
    Agent HaX: It's done. Sit down a minute.
- breach_open:
    Agent HaX: I'm on your phone. Use that, not me.
- door_scene_done:
    Agent HaX: Gate terminal. Then we wait on Netherton.
- else:
    Agent HaX: The table's waiting. So is he.
}
+ {not breach_open and not hpost_rest_asked and m09_completed} [You said there was more. In Helena.]
    ~ hpost_rest_asked = true
    Agent HaX: I did. It isn't over yet.
    Agent HaX: Six o'clock. If we're both still standing, you'll get the rest.
    ~ hpost_quiet = true
    -> hub
+ {not breach_open and not hpost_rest_asked and not m09_completed} [You knew him well?]
    ~ hpost_rest_asked = true
    Agent HaX: He trained me. When he left, there was a conversation I've never told anyone about.
    Agent HaX: Ask me at six. I'll tell you then.
    ~ hpost_quiet = true
    -> hub
+ {not breach_open and not hpost_phone_asked} [I've got questions.]
    ~ hpost_phone_asked = true
    Agent HaX: Ask me on the phone. I'll hear you just as well underground.
    ~ hpost_quiet = true
    -> hub
+ [I'll get going.]
    Agent HaX: Go on. I'm right here.
    ~ hpost_quiet = true
    #exit_conversation
    -> hub
