// test_ink_email: HaX on the phone. Opens the mail client on HaX's contact (composeTo) and starts
// Dr Varga's thread from a chat (# send_email).
=== start ===
Agent. Tell me when you have the jump server log.
-> hub

=== hub ===
+ [I have the log. How do I send it?]
    Email it to me, with the log attached.
    # trigger_minigame:mail_terminal accountIds=["agent"] composeTo=hax
    -> hub
+ [Anything else?]
    Dr Varga from the Institute may write to you. Hear her out.
    # send_email:ines_mail:ask_cover:3
    -> hub
+ [That's all for now]
    Copy that.
    #exit_conversation
    -> hub
