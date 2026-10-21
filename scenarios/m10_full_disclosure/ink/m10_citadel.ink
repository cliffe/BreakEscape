INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: THE CITADEL (Join only).
// NPC id: citadel (hidden person NPC). Opened on conversation_closed:tesseract
// with ending joined (OT §4.7). No HaX lines: her last message is a text
// (JSON). One narrator line for the curve, and nothing else about it.
// ===========================================

VAR cit_quiet = false

=== start ===
~ close_compute()
{ ending != "joined" or closing_done:
    -> leave
}
Narrator: The Citadel, an hour later. HaX's desk is empty, her headset on the keyboard.
Director Magnus Netherton: He said it had to be one of ours. He was right, and I signed for that agent myself.
+ [(Listen.)]
-
Narrator: On the wall screen, a line climbs. Nobody turns it off.
#set_global:closing_done:true
#complete_task:close_the_night
Director Magnus Netherton: Find 0x00. Bring them in, and bring them to me.
~ cit_quiet = true
#exit_conversation
-> finished

=== leave ===
~ cit_quiet = true
#exit_conversation
-> finished

=== finished ===
{ cit_quiet:
    ~ cit_quiet = false
- else:
    -> leave
}
+ [(Leave it.)]
    -> leave
