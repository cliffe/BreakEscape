INCLUDE m10_carryover_vars.ink
// ===========================================
// m10 Full Disclosure: KOWALCZYK AT THE CORE (click lines only).
// NPC ids: kowalczyk_core_waiting (double-cross, waiting by the service door),
// kowalczyk_core (her copy during WREN's beat). Both koImmune.
// Her scene lines live in m10_tesseract.ink. This file only answers a click,
// sets nothing, and exits. Voice owner: group B (cross-read).
// ===========================================

VAR kowc_quiet = false

=== start ===
{ m09_recruiter_offer == "double_crossed" and not wren_at_core:
    -> waiting
- else:
    -> through
}

=== waiting ===
Agent 0x5E 'Lantern': He's the one you came down for. Go on.
~ kowc_quiet = true
#exit_conversation
-> rest

=== through ===
Agent 0x5E 'Lantern': Not here. Not in front of him.
~ kowc_quiet = true
#exit_conversation
-> rest

// Resting point: quiet on the pass after an exit, re-routes on a reopen.
=== rest ===
{ kowc_quiet:
    ~ kowc_quiet = false
- else:
    -> start
}
+ [(Leave her.)]
    -> start
