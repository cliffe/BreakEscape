INCLUDE m10_carryover_vars.ink
// m10 Full Disclosure: Victoria Sterling's secure line from custody (group C).
// Phone NPC victoria_line, m03_victoria_fate = arrested only. Home knot `start`
// is gated and silent. The voiced call is `victoria_call` (targetKnot; resume: true).
// C8 (MC §3.5). No prefix for the contact, no narrator, no printed variables.
// HaX's "Sterling's still on the line" is in HaX's gallery_open (group B).

=== start ===
+ [(Put the phone away.)]
    #exit_conversation
    -> start

// ---------------------------------------------------------------
// The call. First line writes the default; the secret comes first, as
// goodwill; then her price. The last choice writes victoria_line_done.
// ---------------------------------------------------------------
=== victoria_call ===
{victoria_line_done:
    -> call_after
}
{victoria_line_deal == "":
    ~ victoria_line_deal = "no_deal"
}
It's Victoria Sterling. They allow me one call a night, and tonight it's you.
Vos is on your screen. Zero Day's order, under his name.
+ [What about him?]
    -> secret
+ [You're in a cell. Why help us?]
    -> secret

= secret
He took my desk by Monday. He's been selling my clients twice since Tuesday. I'd rather he lost than I won.
~ vos_secret_known = true
So, for nothing: he resells Zero Day's early access to a second buyer, and skims. Zero Day doesn't know.
A reduced charge, and you get the rest of my book. Or nothing, and you still have this.
+ [Deal. I'll tell them you helped.]
    ~ victoria_line_deal = "deal"
    ~ victoria_line_done = true
    Then I'll keep talking after tonight. You'll find I'm good at it.
    #exit_conversation
    -> call_after
+ [No deal. You gave it for free.]
    ~ victoria_line_deal = "no_deal"
    ~ victoria_line_done = true
    I did, didn't I. Use it on him. He hates being read.
    #exit_conversation
    -> call_after

// After the call: no text, one way out.
=== call_after ===
+ [(Put the phone away.)]
    #exit_conversation
    -> call_after
