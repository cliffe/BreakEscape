// Fixture for F20: only a voiced call's own knots are voiced. "hub" is the
// contact's home knot (its currentKnot); "call" is the voiced call's targetKnot.
// The call diverts to "briefing" and back to the hub; "vault_topic" is reached
// only from the hub, so neither it nor the hub's own reply is part of the call.
// Compile: inklecate -o phone_call_hub.json phone_call_hub.ink
-> hub

=== hub ===
+ [Anything else?]
    Agent HaX: Nothing yet.
    -> hub
+ [The vault?]
    -> vault_topic

=== vault_topic ===
Agent HaX: The vault is sealed.
-> hub

=== call ===
Agent HaX: Don't hang up.
-> briefing

=== briefing ===
Agent HaX: Here is the plan.
* [Got it.]
    Agent HaX: Back to your desk.
    -> hub
