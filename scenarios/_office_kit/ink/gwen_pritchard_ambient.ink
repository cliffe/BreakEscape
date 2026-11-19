VAR kit_defend_done = false
VAR kit_ep = ""

=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Gwen: Morning. Grab a coffee if you need one.
-> DONE

=== ca01 ===
Gwen: Good spot on that invoice. Phone the supplier next time too.
-> DONE
