// ================================================
// Phishing and Social Engineering lab: Gareth Fairbairn (person, Engagement Office)
// Ledgerwell's managing director, early sixties, soft Edinburgh, a little formal.
// Two beats only: the authorisation scene once roe_signed is set (he "signs" and
// states his one condition — no names), and a short pay-off line once the report
// is filed with no names in it (through-line 1, PLAN §5 stage 0 and stage 6).
// Everywhere else he's small talk by the window. Person lines stay under 30 words.
// ================================================

VAR roe_signed = false
VAR report_filed = false

VAR met = false
VAR signed_scene = false
VAR said_payoff = false
VAR quiet = false

=== start ===
{ met: -> resume }
~ met = true
Gareth Fairbairn: You'll be Tarnside's. Gareth Fairbairn. This is my firm, forty years of it.
-> resume

// Checked on every open: play a pending scene if one is due, else the hub.
=== resume ===
{ report_filed and not said_payoff: -> payoff }
{ roe_signed and not signed_scene: -> sign }
-> hub

=== hub ===
{
- quiet:
    ~ quiet = false
- else:
    Gareth Fairbairn: {&Yes?|Something else?|I'm just watching, carry on.}
}
+ {roe_signed and signed_scene and not report_filed} [You trust us with your staff, then?]
    -> trust
+ {not roe_signed} [Why bring in a firm to attack your own people?]
    -> why
+ [I'll leave you to it.]
    #exit_conversation
    Gareth Fairbairn: Aye. Mind the sheet.
    -> hub

=== sign ===
~ signed_scene = true
Gareth Fairbairn: Right. I'll sign it.
Narrator: He reads the sheet to the end, then puts his name at the bottom.
Gareth Fairbairn: One condition. No names in anything I read. If someone clicks, that's my training's fault, not theirs.
~ quiet = true
-> hub

=== payoff ===
~ said_payoff = true
Gareth Fairbairn: I've read your report. Not one name in it, just like I asked.
Gareth Fairbairn: I can hand that to the whole firm and nobody feels hunted. Thank you.
~ quiet = true
-> hub

=== trust ===
Gareth Fairbairn: I trust you to be straight about the gaps and kind about the people. That's the whole test.
~ quiet = true
-> hub

=== why ===
Gareth Fairbairn: Because one of mine nearly wired away a month's billing, and I'd rather learn it from you than a thief.
~ quiet = true
-> hub
