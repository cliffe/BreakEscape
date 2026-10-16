// ================================================
// Mission 8: The Mole - Suspect: Agent 0x47 'Nightshade' (THE MOLE, pre-reveal)
// Speaker: Agent 0x47 'Nightshade'
// Entry knot: start   Sets: nightshade_interviewed
// The tell is that nothing rattles him. Warm, not sinister. An attentive player
// leaves suspicious (nightshade_suspected); accusing him early gets a graceful,
// chilling deflection -- never a confession. The door audit makes the case, not this.
// ================================================

// PASS 2: task at the top of the first meeting (lesson 44); exits return to
// the hub (lesson 21); inline emotes are narrator beats; two new beats pay off
// his m05 insider briefing and react to flag 4 naming his account.
VAR nightshade_interviewed = false
VAR nightshade_influence = 0
VAR nightshade_suspected = false
VAR found_nightshade_profile = false
VAR asked_alibi = false
VAR asked_fear = false
VAR asked_dead = false
VAR asked_training = false
VAR accused_nightshade = false
VAR mole_identified = false
VAR asked_insiders = false
VAR asked_logs = false
// PASS 3 (P7, P8): the door-audit beat and the locker key.
VAR found_badge_audit = false
VAR nightshade_audit_confirmed = false
VAR asked_audit = false
VAR gave_locker_key = false
// PASS 5 (B1): mole_identified can now come from the door audit before the
// box, so the root-logs topic also needs flag 4 (found_access_logs).
VAR found_access_logs = false
// Phase 4 dialogue C1 (D8-2): the m03/m07 quiet flag. Every return from inside
// the conversation and every exit comes through back, so the hub's re-entry
// line plays only on a re-talk (a reopen lands on hub, not start).
VAR hub_quiet = false

=== start ===
{ nightshade_interviewed: -> hub }
// PASS 2 review: set first; a brief-gated mapping completes interview_nightshade (lesson 27).
~ nightshade_interviewed = true
// Engine regression fixes (2026-10-17, R6): he stands mid-lab, not at his desk, so he turns rather than looks up.
Narrator: The Crypto Lab is quiet. Nightshade turns as you come in and smiles as if the last nine days never happened. His desk behind him is bare: no photographs, no mug.

Agent 0x47 'Nightshade': There you are. I wondered when they'd send you.
Agent 0x47 'Nightshade': Of everyone in this building, they picked the one person who knows my tells. A compliment, or very poor planning. Ask me anything.
-> back

=== back ===
~ hub_quiet = true
-> hub

=== hub ===
{ not hub_quiet:
    Agent 0x47 'Nightshade': {&Back so soon. You must be enjoying my company, or getting nowhere. I hope it's the first.|Still here, as promised. Ask.}
}
~ hub_quiet = false
+ { not asked_alibi } [Where were you when the plan leaked?]
    ~ asked_alibi = true
    Agent 0x47 'Nightshade': Here, most likely. I'm always here. Pull the terminal logs. I'd genuinely encourage it.
    Agent 0x47 'Nightshade': The truth clears people, properly examined. I've always found that a comfort.
    Narrator: He offers it without a flicker.
    -> back
+ { not asked_fear } [Everyone here is terrified. You're not.]
    ~ asked_fear = true
    ~ nightshade_suspected = true
    Agent 0x47 'Nightshade': Should I be? Fear is what you feel when the outcome is still uncertain. I made my peace with most outcomes long ago.
    Agent 0x47 'Nightshade': It's a discipline. I could teach it to you, though I don't think we'll have the time. #set_global:nightshade_suspected:true
    -> back
+ { not asked_dead } [Two of ours are dead.]
    ~ asked_dead = true
    ~ nightshade_suspected = true
    Narrator: He says it quietly.
    Agent 0x47 'Nightshade': I know. I do know that.
    Agent 0x47 'Nightshade': I've been grieving a long time, 0x00. Longer than nine days. It wears smooth. #set_global:nightshade_suspected:true
    -> back
+ { not asked_insiders } [Your insider briefing. "The calm of someone who's decided the rules don't apply to them."]
    ~ asked_insiders = true
    ~ nightshade_suspected = true
    Agent 0x47 'Nightshade': I did. The access a little too broad, the hours a little too odd, and the calm. Good. You were listening.
    Agent 0x47 'Nightshade': I'd add one thing now, if I were giving that briefing again.
    // Blind A (D1, M5): the narrator's "holds your eye" tell cut; the line does the work.
    Agent 0x47 'Nightshade': Don't rule anyone out because they wrote the list. #set_global:nightshade_suspected:true
    -> back
+ { mole_identified and found_access_logs and not asked_logs } [The root logs put Cryptography Lab terminal 03 on the Portland plan. Forty-seven minutes.]
    ~ asked_logs = true
    ~ nightshade_suspected = true
    Agent 0x47 'Nightshade': Then you have root on our own repository. I'm genuinely impressed. Nobody's touched that box in years.
    Agent 0x47 'Nightshade': Finish putting it through the relay. When it's all in, the Director will want this conversation in a room with a recorder.
    Agent 0x47 'Nightshade': I'll walk down myself. I'm not going to make anyone chase me. #set_global:nightshade_suspected:true
    -> back
+ { found_nightshade_profile and not asked_training } [Dr Okafor flagged you a year ago. "Ideological drift."]
    ~ asked_training = true
    ~ nightshade_suspected = true
    Narrator: The smile holds. Something behind it goes cold.
    Agent 0x47 'Nightshade': You've been in the Director's safe. Good. Then you've read Okafor, and you know he buried it.
    Agent 0x47 'Nightshade': Yes, I said those words. I say a great many true things, and nobody minds until the day they do.
    Agent 0x47 'Nightshade': Careful, 0x00. A sealed file makes a very tidy suspect. Tidy isn't the same as right. #set_global:nightshade_suspected:true
    ~ nightshade_influence -= 1
    # influence_decreased
    -> back
// PASS 5 (alignment C2, n5): no hidden asked_alibi prerequisite.
+ { found_badge_audit and not asked_audit } [The door log has you in this lab from 10:15 to 11:43 that morning.]
    ~ asked_audit = true
    ~ nightshade_audit_confirmed = true
    Agent 0x47 'Nightshade': Yes, that row's right. {asked_alibi:I told you: I'm always here.|I'm always here.} You've proved I keep long hours, 0x00.
    Agent 0x47 'Nightshade': A door says who walked in. It doesn't say what anyone did at the bench. #set_global:nightshade_audit_confirmed:true
    -> back
+ { (asked_audit or asked_training) and not gave_locker_key } [Your locker in the break room. I want to see inside it.]
    ~ gave_locker_key = true
    #give_item:key:nightshade_locker_key
    // Blind A (D1, M5): no second tell on the hand-over, and no second "genuinely encourage".
    Narrator: He takes it off his ring without hesitating and holds it out.
    Agent 0x47 'Nightshade': Take it. 0x47, second from the end.
    -> back
// Phase 4 dialogue C1 (D8-16): once said, it isn't on offer again.
+ { not mole_identified and not accused_nightshade } [I think it's you, Nightshade. (Out loud. The whole floor will hear.)] -> accuse
+ [We're done here.] -> leave

=== accuse ===
~ accused_nightshade = true
~ nightshade_suspected = true
Narrator: He doesn't blink.
Agent 0x47 'Nightshade': Do you. On instinct, or on evidence? I know you, and I know which one you're running on. It isn't evidence.
Agent 0x47 'Nightshade': Here's what will happen. You'll leave, because a hunch won't hold me.
Agent 0x47 'Nightshade': And I'll still be here when you come back. I've nowhere I'd rather be, and nothing I'm afraid of.
Agent 0x47 'Nightshade': Go and get your proof. Whichever way it points, it'll be worth more than a guess. #set_global:nightshade_suspected:true #set_global:accused_nightshade:true
-> back

=== leave ===
{ accused_nightshade:
    Agent 0x47 'Nightshade': Close the door gently. The whole floor's listening now.
- else:
    Agent 0x47 'Nightshade': Come back when you can prove something. I'll be right here. I always am.
}
#exit_conversation
-> back
