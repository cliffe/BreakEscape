// ================================================
// The Keyholder Trials: Dr Tom Shaw (teaching lab)
// Helper. Gives the CyberChef lab laptop and the induction handouts (FN1-FN3).
// Huddersfield through word choice only. No knot ends in DONE or END.
// ================================================

VAR met_tom = false
VAR asked_cryptosecure = false
VAR asked_terminal = false
VAR told_keys = false

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
Dr Tom Shaw: Right then. You'll be one of mine. Tom Shaw. I look after the first-years this week.
Narrator: He slides a battered department laptop across the desk.
Dr Tom Shaw: That's yours for the year. CyberChef's on it. No rocket science, just base two.
Dr Tom Shaw: Pop it out into its own tab with the little arrow by the cross, top of the laptop. Then you can have the clue and the recipe side by side.
Dr Tom Shaw: I've put the induction handouts in your notepad. It's got a pencil on every page. Write down owt you'll need later in there.
+ [What's CyberChef actually do?]
    -> magic
+ [Thanks. Anything else I should know?]
    -> hub

=== magic ===
Dr Tom Shaw: You give it some input, you stack up operations, it shows you the output. That's all.
Dr Tom Shaw: There's a button called Magic. It'll do the first few for you. It'll do nowt once there's a key. That's the bit they're paying for.
-> hub

=== hub ===
{
- not told_keys:
    ~ told_keys = true
    Dr Tom Shaw: Your lab account's on that PC. I've put a key pair on it. Have a read of the README; you'll want the private one before the week's out.
- asked_terminal and not guest_terminal_open:
    Dr Tom Shaw: Well? Got into that terminal yet?
- asked_terminal and not corridor_open:
    Dr Tom Shaw: You got into it, then. Good. I'm still not ordering one.
- else:
    Dr Tom Shaw: Owt else?
}
+ {locker_open and not guest_terminal_open and not asked_terminal} [That CryptoSecure terminal on your desk. Is it yours?]
    -> terminal
+ {not asked_cryptosecure} [What do you make of CryptoSecure?]
    -> cryptosecure
+ [Walk me through the board?]
    -> board
+ [I'll get on.]
    #exit_conversation
    Dr Tom Shaw: Right. Off you go.
    -> hub

=== terminal ===
~ asked_terminal = true
Dr Tom Shaw: Someone's put a terminal in my lab I never ordered. Half a mind to break into it myself.
Dr Tom Shaw: Go on then. You first.
-> hub

=== cryptosecure ===
~ asked_cryptosecure = true
Dr Tom Shaw: Turned up without asking the department, for one.
Dr Tom Shaw: And see that Mailer they're flogging on the stand? It hides a one-pixel picture in the email.
Dr Tom Shaw: Your mail app fetches it, and their server learns when you opened it and roughly where.
Dr Tom Shaw: Turn remote images off. Everyone should.
-> hub

=== board ===
Dr Tom Shaw: Same two letters, three ways. "Hi" is seventy-two, a hundred and five in decimal.
Dr Tom Shaw: In binary every bit's a power of two: a hundred and twenty-eight down to one. Add up the ones that are lit.
Dr Tom Shaw: In hex each digit is four bits, so a byte's always two digits: four-eight, six-nine.
{ corridor_open:
    Dr Tom Shaw: You're past all that now, mind. Good.
}
-> hub
