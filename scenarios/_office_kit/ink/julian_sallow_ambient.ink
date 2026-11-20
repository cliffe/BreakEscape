VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca12": -> ca12 }
}
Julian Sallow: Mind the model on the table.
-> bye

=== ca12 ===
Julian Sallow: {kit_key_caught: Glad the gate held. Most of what's on my desk is client work.|Kettle's calling. Time for a brew, I think.}
-> bye

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE
