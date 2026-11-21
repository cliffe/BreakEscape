VAR kit_defend_done = false
VAR kit_ep = ""
VAR kit_key_caught = false

=== start ===
{ kit_defend_done:
    { kit_ep == "ca12": -> ca12 }
    { kit_ep == "ca04": -> ca04 }
}
Julian Sallow: Mind the model on the table.
-> bye

=== ca12 ===
Julian Sallow: {kit_key_caught: Glad the gate held. Most of what's on my desk is client work.|Kettle's calling. Time for a brew, I think.}
-> bye

=== ca04 ===
{ kit_key_caught:
    Julian Sallow: Good instinct. A voicemail is no way to approve a payment.
- else:
    Julian Sallow: The real supplier's chasing money that went to the wrong account. Messy.
}
-> bye

=== bye ===
+ [See you later.]
    #exit_conversation
    -> DONE

=== ca04_react ===
{ kit_key_caught:
    Julian Sallow: Well judged. The rush and the "keep it between us" are there to stop you picking up the phone to check. #delivery: measured, dry
- else:
    Julian Sallow: "Pay before I land, keep it quiet" is the whole trick. A genuine request survives a quick call to confirm. #delivery: measured, wry
}
-> bye
