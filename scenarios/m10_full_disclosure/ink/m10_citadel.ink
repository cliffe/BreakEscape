INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: THE CITADEL (Join only).
// NPC id: citadel (hidden person NPC). Opened on conversation_closed:tesseract
// with ending joined (OT §4.7). No HaX lines: her last message is narrated on
// the player's road (T-57 cut, R3-m4). One narrator line for the curve.
// ===========================================

VAR cit_quiet = false

=== start ===
~ close_compute()
{ ending != "joined" or closing_done:
    -> leave
}
-> opening

// Playtest D: a line in the same knot as close_compute() didn't show; the
// opening is its own knot, as in six_oclock.
=== opening ===
~ citadel_open = true
Narrator: The Citadel, an hour later. Netherton is on the wall screen from Montana. Beside him, HaX's channel is still open. Nobody has spoken on it.
// Alignment A2: HaX's "0x00." inside the scene. R3-m9: placed where the player is, not at the Citadel.
Narrator: Somewhere on a road out of Montana, your phone lights. One message from HaX. '0x00.' You don't answer.
Director Magnus Netherton: He said it had to be one of ours. He was right, and I signed for that agent myself.
// Alignment m5: one line on what the player betrayed, by a short fixed priority.
{
- m02_completed and m02_gary_protected:
    Director Magnus Netherton: Whitlock came to the table. He asked if it was you. I told him yes.
- m04_voltage_captured:
    Director Magnus Netherton: Voltage asked who pressed it. I told him. He said he had thought better of you.
- m08_nightshade_triple_agent and m09_nightshade_shown_file:
    Director Magnus Netherton: Nightshade asked me one question. Whether it was you. I said yes, and he stopped talking.
}
+ [(Keep driving.)]
-
Narrator: At the Citadel, on the screen beside him, the casualty count climbs. Nobody turns it off.
#set_global:closing_done:true
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
