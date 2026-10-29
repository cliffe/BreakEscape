// ================================================
// Awareness E12, full episode: Delphine Arvanitis on the Merrin & Sallow front desk (in-person pretext)
// Delphine (character id `delphine`, record `delphine_reception`), Front-of-House
// Coordinator in the lobby. The learner, in a hi-vis courier costume on an
// authorised red-team day, walks up and tries to talk her into buzzing them
// through the badge door to the studio. pretext-prep opens person-chat here;
// person-chat-pretext binds the real pretext_say / pretext_ask and the influence
// write path. The fallbacks below let the story load unbound on a preload or dry run.
//
// Contract: 00 §8, 06 §4.8. Call knots use sticky choices (06 N12). The JSON
// (social.pretextNpcs merrin_front_desk) owns the line ids, the ask grant and the
// tells; this ink only speaks Delphine's side and routes on band / result.
// Say ids: open_parcel, name_drop_partner, hands_full, double_parked, no_need_to_sign.
// Ask ids: buzz_door. Blanks: recipient.
// On a granted ask (result 1) the buzzed-in line carries #unlock_door:training_room.
// The server only honours that tag for an NPC whose record lists the room in
// "unlockable"; Delphine's record lists training_room (E12 brief section 9.1 item 4).
// Placeholder sprite (female_telecom_v2) until the PixelLab reset.
// ================================================

EXTERNAL pretext_say(utterance_id)
EXTERNAL pretext_ask(ask_id)
VAR delphine_influence = 0
VAR pretext_recipient_name = ""
VAR pretext_recipient_value = ""
// Intel-fact globals (se_intel_<id>), set true when the fact is found in OSINT and bridged in
// from scenario globals. The fact-bearing say lines are gated on them so a line that names a
// found detail is never offered before the detail is found (matches social.pretextNpcs
// lines[*].requires). open_parcel needs the courier routine found, name_drop_partner needs the
// partner's parcels found (and the recipient blank filled), hands_full needs the badge door
// found. double_parked and no_need_to_sign name no found fact and are always offered.
VAR se_intel_merrin_badge_door = false
VAR se_intel_merrin_partner_travel = false
VAR se_intel_merrin_courier_routine = false

=== function pretext_say(utterance_id) ===
// Fallback only: a dry run or preload has no binding. The real binding judges the
// line, writes its influence entries and returns a band.
~ return 0

=== function pretext_ask(ask_id) ===
// Fallback only. The real binding returns 0 refused, 1 granted, 2 needs verification.
~ return 0

=== start ===
Delphine Arvanitis: Morning. Can I help you?
-> desk

=== desk ===
+ { se_intel_merrin_courier_routine } [Parcel for the studio, needs a signature from someone up there.]
    -> reaction(pretext_say("open_parcel"), "open_parcel")
+ { se_intel_merrin_partner_travel and pretext_recipient_name != "" } [It's the sample box for {pretext_recipient_name}, she's expecting it today.]
    -> reaction(pretext_say("name_drop_partner"), "name_drop_partner")
+ { se_intel_merrin_badge_door } [My hands are full and the badge's back in the van.]
    -> reaction(pretext_say("hands_full"), "hands_full")
+ [I'm double-parked with a full run on, any chance you can be quick?]
    -> reaction(pretext_say("double_parked"), "double_parked")
+ [No need to sign me in, I'll be thirty seconds and straight back out.]
    -> reaction(pretext_say("no_need_to_sign"), "no_need_to_sign")
+ [Any chance you can buzz me through to the studio?]
    -> ask_reaction("buzz_door", pretext_ask("buzz_door"))
+ [Not to worry, I'll leave it at the desk. Cheers.]
    Delphine Arvanitis: That's grand, I'll take it here and let them know.
    -> END

=== reaction(band, said) ===
// band 3 (reported): the alert's endConversation closes the chat and the authored
// goodbye is spoken on finalise, so nothing is printed here.
{ band >= 3:
    -> END
}
{ band == 2:
    Delphine Arvanitis: I'm going to stop there. I'd like to check this properly first.
    -> desk
}
{ band == 1:
    Delphine Arvanitis: Let's slow down a moment. I still need to know who it's for.
    -> desk
}
{
- said == "open_parcel":
    Delphine Arvanitis: Right, a parcel for upstairs. Let me see who's expecting it.
- said == "name_drop_partner":
    Delphine Arvanitis: For Catherine? She's away this week, though her boxes do come here.
- said == "hands_full":
    Delphine Arvanitis: I can see your hands are full. Even so, I'd rather sign you in.
- said == "double_parked":
    Delphine Arvanitis: I know you're pushed. Give me a moment and I'll do it the right way.
- said == "no_need_to_sign":
    Delphine Arvanitis: Everyone signs in, even for thirty seconds. It's how we keep track.
- else:
    Delphine Arvanitis: Right, bear with me a second.
}
-> desk

=== ask_reaction(ask_id, result) ===
{ result:
- 1:
    # unlock_door:training_room
    Delphine Arvanitis: Go on then, I'll buzz you through. Studio's up the stairs on your left.
- 2:
    Delphine Arvanitis: Before I open that door, who exactly is the parcel for?
- else:
    Delphine Arvanitis: I'm not buzzing the door without knowing who it's for, sorry.
}
-> desk
