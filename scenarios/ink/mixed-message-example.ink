=== start ===
Hello! This is a test of mixed message types.

+ [Tell me more]
    -> voice_example

=== voice_example ===
voice: This is a voice message. I'm calling to let you know that the security code has been changed to 4829. Please acknowledge receipt.

+ [Got it, thanks!]
    Great! I'll see you soon.
    -> END

+ [What was the code again?]
    voice: The code is 4-8-2-9. I repeat: four, eight, two, nine.
    -> END
