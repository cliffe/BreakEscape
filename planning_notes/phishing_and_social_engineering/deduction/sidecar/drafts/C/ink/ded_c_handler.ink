// ================================================
// Fixture C (DRAFT): Agent HaX on the player's phone.
// Plan §9.3. HaX gives the profile and "Trust no one", gives the office code
// once the keycard is revoked (c_keycard_revoked gate, DL8 counts it closed),
// offers the comms-room lock only while someone waits there (with "Not yet"),
// and rings with the pull-out call at the second wrong call (eventMappings
// target knot pull_out, warned close with "Not yet", §7.5).
// Phone rules: HaX's own lines take no prefix (phone-self-prefix); the resting
// knot holds choices only; no line prints a variable (voiced).
// Hidden stakes: nothing here says what a wrong call costs (twistNote).
// ================================================

VAR c_keycard_revoked = false
VAR c_comms_locked = false
VAR c_leaving = false
VAR c_pull_out = false
VAR c_waiting_ded_c_ahmed = false
VAR c_waiting_ded_c_novak = false
VAR c_waiting_ded_c_baptiste = false
VAR deduction_closed = false
VAR ded_c_baptiste_reported = false
VAR se_intel_c_novak_alibi = false
VAR se_intel_c_ahmed_alibi = false

// Ink-local
VAR office_code_given = false
VAR reported_heard = false

=== start ===
You're in. Three contacts share that house: Ahmed, Baptiste and Novak.
On the night of the leak, someone handed our network to the cult.
Here's what to look for. A cult-issued burner. There's one in circulation.
Or anyone who went out to the quarry site and can't prove where they were that night.
Trust no one.
Your keycard opens the bedroom and the comms room. The office has a code. The garage only takes Novak's badge.
When you're done, the exit phone in the lounge calls extraction.
-> hub

=== hub ===
+ {c_pull_out and not c_leaving and not deduction_closed} [About getting out.]
    -> pull_out
+ {(c_waiting_ded_c_ahmed or c_waiting_ded_c_novak or c_waiting_ded_c_baptiste) and not c_comms_locked and not deduction_closed} [Lock the comms room with whoever is waiting inside.]
    -> lock_confirm
+ {c_keycard_revoked and not office_code_given and not deduction_closed} [My keycard's dead. I still need the office.]
    -> office_code
+ {ded_c_baptiste_reported and not reported_heard} [Has anyone complained about me?]
    -> reported
+ [Where do things stand?]
    -> status
+ [Remind me what we're looking for.]
    -> profile
+ [Nothing for now.]
    Then stop calling me and get on with it.
    #exit_conversation
    -> hub

=== profile ===
A cult-issued burner. There's one out there.
Or a trip to the quarry site with no verified alibi for the night of the leak.
Either one is enough.
-> hub

=== status ===
{
- deduction_closed:
    It's done. Extraction has you.
- c_comms_locked:
    The comms room is locked. Use the exit phone when you're ready.
- c_waiting_ded_c_ahmed or c_waiting_ded_c_novak or c_waiting_ded_c_baptiste:
    Someone's waiting in the comms room. Lock it when you're sure, or leave it open.
- se_intel_c_novak_alibi and se_intel_c_ahmed_alibi:
    You've read the door log. Decide, then deal with them.
- c_keycard_revoked:
    No keycard, so you need the office code from me, or someone to open doors for you.
- else:
    Their kit, their trips, their alibis. Records tell you more than they will.
}
-> hub

=== office_code ===
~ office_code_given = true
Five, one, eight, three. That's all you get from me now.
-> hub

=== reported ===
~ reported_heard = true
Baptiste rang me. Says you lean on people. Lean less.
-> hub

=== lock_confirm ===
Once it's locked, it stays locked until extraction opens it. Whoever's inside goes with them.
+ [Lock it.]
    Locked. They're not going anywhere. #set_global:c_comms_locked:true
    -> hub
+ [Not yet. Leave it open.]
    Open it stays. Your call.
    -> hub

=== pull_out ===
You've turned on two of our own. Get out now?
If you go, anyone in the comms room goes with extraction. Anyone else stays in the field.
+ [Get out.]
    Extraction's on its way. Move. #set_global:c_leaving:true #set_global:c_comms_locked:true #verdict_close
    -> closed
+ [Not yet. I need a minute.]
    A minute. Then you're gone.
    -> hub

=== closed ===
+ [Nothing for now.]
    Go. Don't look back at the house.
    #exit_conversation
    -> closed
