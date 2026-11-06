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
VAR fairbairn_condition_heard = false
VAR fairbairn_payoff_heard = false
VAR overpromised_anonymity = false

VAR met = false
VAR signed_scene = false
VAR said_payoff = false
VAR quiet = false

=== start ===
{ met: -> hub }
~ met = true
Gareth Fairbairn: We weren't introduced properly. Gareth. Forty years I've had this firm, and I hired most of that floor myself.
~ quiet = true
-> hub

// Play a pending scene if one is due, then return to the hub body. Run as a tunnel
// at the top of `hub` (like Ruth's recheck/keys), so an engine-resumed reopen that
// lands at `hub` still fires the sign or payoff scene it would otherwise only play
// from `start` (lab R4 D1). sign and payoff set their own once-flags, so the tunnel
// is a no-op on every later open.
=== scenecheck ===
// sign is checked before payoff (P1 insurance): a report can only be filed after the
// Recon key, which is now gated on the signature, so the sign scene always plays first.
// If the two were ever both pending, Gareth signs this open and gives the payoff next.
{ roe_signed and not signed_scene: -> sign }
{ report_filed and not said_payoff: -> payoff }
->->

=== hub ===
-> scenecheck ->
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
    {
    - report_filed:
        Gareth Fairbairn: Aye. Tomasz is through there. I think he's enjoying this more than he lets on.
    - roe_signed:
        Gareth Fairbairn: Aye. Go gently with them.
    - else:
        Gareth Fairbairn: Aye. Mind the sheet.
    }
    -> hub

=== sign ===
~ signed_scene = true
Gareth Fairbairn: Right. I'll sign it.
Narrator: He reads the sheet to the end, then puts his name at the bottom.
Ruth Adeyemi: That signature is the difference between a test and a crime. Without it, you're committing an offence under the Computer Misuse Act.
Gareth Fairbairn: One condition. No names in anything I read. If someone clicks, that's my training's fault, not theirs.
#set_global:fairbairn_condition_heard:true
~ quiet = true
->->

=== payoff ===
~ said_payoff = true
Gareth Fairbairn: I've read your report. Not one name in it, just like I asked.
Gareth Fairbairn: She'll read it too, the one who nearly wired that invoice to a spoofed supplier last quarter. Nothing in it points at her. Thank you.
{ overpromised_anonymity:
    Gareth Fairbairn: You nearly promised nobody'd ever know, that first morning. I asked for the promise we could keep. You kept it.
}
#set_global:fairbairn_payoff_heard:true
~ quiet = true
->->

=== trust ===
Gareth Fairbairn: I trust you to be straight about the gaps and kind about the people. That's the whole test.
~ quiet = true
-> hub

=== why ===
Gareth Fairbairn: Because next time it won't be caught, and I'd rather learn that from you than a thief.
~ quiet = true
-> hub
