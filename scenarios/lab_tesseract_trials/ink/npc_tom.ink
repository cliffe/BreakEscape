// ================================================
// The Keyholder Trials: Dr Tom Shaw (teaching lab)
// Helper. Gives the CyberChef lab laptop and the induction handouts (FN1-FN3).
// Huddersfield through word choice only. No knot ends in DONE or END.
// ================================================

VAR met_tom = false
VAR asked_cryptosecure = false
VAR asked_terminal = false

// Synced scenario globals
VAR locker_open = false
VAR guest_terminal_open = false
VAR corridor_open = false

=== start ===
{ met_tom: -> hub }
#complete_task:get_lab_laptop
~ met_tom = true
#give_item:workstation:lab_laptop
#give_item:notes:fn01_bits_bytes_bases
#give_item:notes:fn02_ascii_encodings
#give_item:notes:fn03_hex
Right then. You'll be one of mine. Tom Shaw, I run the first-year induction.
Narrator: He slides a battered department laptop across the desk, with a stack of handouts on top.
That's yours for the year. CyberChef's on it. No rocket science, just base two.
Pop it out into its own tab with the little arrow by the cross, top of the laptop. Then you can have the clue and the recipe side by side.
The handouts are the induction pack. Your notepad's got a pencil on every page. Paste owt you'll need later in there.
+ [What's CyberChef actually do?]
    -> magic
+ [Thanks. I'll get on.]
    -> hub

=== magic ===
You give it some input, you stack up operations, it shows you the output. That's all.
There's a button called Magic. It'll do the first few for you. It'll do nowt once there's a key. That's the bit they're paying for.
-> hub

=== hub ===
{ asked_terminal:
    Go on then. Tell me how you got into it.
- else:
    Owt else?
}
+ {locker_open and not guest_terminal_open and not asked_terminal} [That CryptoSecure terminal on your desk. Is it yours?]
    -> terminal
+ {not asked_cryptosecure} [What do you make of CryptoSecure?]
    -> cryptosecure
+ [Can you go over the board again?]
    -> board
+ [I'll get on.]
    #exit_conversation
    Go on then.
    -> hub

=== terminal ===
~ asked_terminal = true
Someone's put a terminal in my lab I never ordered. Half a mind to break into it myself.
Go on then. You first.
-> hub

=== cryptosecure ===
~ asked_cryptosecure = true
Turned up without asking the department, for one.
And see that Mailer they're flogging on the stand? A one-pixel picture in the email. Your mail app fetches it, and their server learns when you opened it and roughly where.
Turn remote images off. Everyone should.
-> hub

=== board ===
Same two letters, three ways. "Hi" is seventy-two, a hundred and five in decimal.
In binary every bit's a power of two: a hundred and twenty-eight down to one. Add up the ones that are lit.
In hex each digit is four bits, so a byte's always two digits: four-eight, six-nine.
{ corridor_open:
    You're past all that now, mind. Good.
}
-> hub
