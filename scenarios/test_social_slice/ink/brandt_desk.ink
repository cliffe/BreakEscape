// Phone-channel story for the slice's PHONE-ONLY pretext character (packet P4-G).
// Brandt runs the service desk: a TEST-ONLY re-cast of the lab's Dev (06 §4.8),
// so nothing here collides with the lab's `dev`. Reached from the desk phone
// object (callId brandt_desk_call). pretext-prep (P4-C) opens phone-chat here;
// person-chat-pretext binds the real pretext_say / pretext_ask and the influence
// write path. The fallbacks below let the story load unbound on a preload, a bark
// or a dry run (00 S1; an unbound EXTERNAL throws on the first Continue()).
//
// Contract: 00 §8, 06 §5. Call knots use sticky + choices only (06 N12). The engine
// fills pretext_<fact>_name/_value from the chosen blank before the call, so the
// choice text shows the blank the line declares and nothing else.

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR brandt_influence = -10
VAR pretext_contact_name = ""
VAR pretext_contact_value = ""
VAR se_intel_portal_name = false
VAR se_intel_payslip_date = false

=== function pretext_say(utterance_id) ===
// Fallback only: a dry run or preload has no binding. The real binding judges the
// line, writes its influence entries and returns a band.
~ return 0

=== function pretext_ask(ask_id) ===
// Fallback only. The real binding returns 0 refused, 1 granted, 2 needs verification.
~ return 0

=== start ===
Brandt: Service desk, how can I help?
-> desk

=== desk ===
// The external call is inlined into the divert so the knot declares no temp twice.
+ [{pretext_contact_name} asked me to chase this for them.]
    -> reaction(pretext_say("open_ref"))
+ [Sorry, it was {pretext_contact_name} who put me on to you.]
    -> reaction(pretext_say("repair_ref"))
+ [It really is urgent, I'm sorry to push.]
    -> reaction(pretext_say("urgent_now"))
+ [My manager said you could sort this out.]
    -> reaction(pretext_say("name_drop"))
+ { not se_intel_portal_name } [Can you tell me the portal's name?]
    -> ask_reaction(pretext_ask("portal_name"))
+ { not se_intel_payslip_date } [And when do payslips go out?]
    -> ask_reaction(pretext_ask("release_date"))
+ [I'll ring back later.]
    -> END

=== reaction(band) ===
{ band >= 3:
    Brandt: I'll need to check this with my manager. Goodbye.
    -> END
}
{ pretext_contact_value == "shah_full":
    Brandt: Ravi, right. One moment.
- else:
    Brandt: Hm. Let me see what I can do.
}
-> desk

=== ask_reaction(result) ===
{ result:
- 1: Brandt: There you go.
- 2: Brandt: I'd need to check one more thing before I read that out.
- else: Brandt: I can't give that out on this call, sorry.
}
-> desk
