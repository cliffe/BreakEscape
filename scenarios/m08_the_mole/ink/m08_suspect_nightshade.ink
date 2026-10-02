// ================================================
// Mission 8: The Mole - Suspect: Agent 0x47 'Nightshade' (THE MOLE, pre-reveal)
// Speaker: Agent 0x47 'Nightshade'
// Entry knot: start   Sets: nightshade_interviewed
// The tell is that nothing rattles him. Warm, not sinister. An attentive player
// leaves suspicious (nightshade_suspected); accusing him early gets a graceful,
// chilling deflection -- never a confession. The box makes the case, not this.
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

=== start ===
{ nightshade_interviewed:
    Agent 0x47 'Nightshade': Back so soon. You must be enjoying my company, or getting nowhere. I hope it's the first.
    -> hub
}
// PASS 2 review: set first; a brief-gated mapping completes interview_nightshade (lesson 27).
~ nightshade_interviewed = true
Narrator: The Crypto Lab is quiet. Nightshade looks up from a desk with nothing on it, no photographs, no mug, and smiles as if the last nine days never happened.

Agent 0x47 'Nightshade': There you are. I wondered when they'd send you.
Agent 0x47 'Nightshade': Of everyone in this building, they picked the one person who knows my tells. A compliment, or very poor planning. Ask me anything.
-> hub

=== hub ===
+ { not asked_alibi } [Where were you when the plan leaked?]
    ~ asked_alibi = true
    Agent 0x47 'Nightshade': Here, most likely. I'm always here. Pull the terminal logs. I'd genuinely encourage it.
    Agent 0x47 'Nightshade': The truth clears people, properly examined. I've always found that a comfort.
    Narrator: He offers it without a flicker.
    -> hub
+ { not asked_fear } [Everyone here is terrified. You're not.]
    ~ asked_fear = true
    ~ nightshade_suspected = true
    Agent 0x47 'Nightshade': Should I be? Fear is what you feel when the outcome is still uncertain. I made my peace with most outcomes long ago.
    Agent 0x47 'Nightshade': It's a discipline. I could teach it to you, though I don't think we'll have the time. #set_global:nightshade_suspected:true
    -> hub
+ { not asked_dead } [Two of ours are dead.]
    ~ asked_dead = true
    ~ nightshade_suspected = true
    Narrator: He says it quietly.
    Agent 0x47 'Nightshade': I know. I do know that.
    Agent 0x47 'Nightshade': I've been grieving a long time, 0x00. Longer than nine days. It wears smooth. #set_global:nightshade_suspected:true
    -> hub
+ { not asked_insiders } [Your insider briefing. "The calm of someone who's decided the rules don't apply."]
    ~ asked_insiders = true
    ~ nightshade_suspected = true
    Agent 0x47 'Nightshade': I did. The access a little too broad, the hours a little too odd, and the calm. Good. You were listening.
    Agent 0x47 'Nightshade': I'd add one thing now, if I were giving that briefing again.
    Agent 0x47 'Nightshade': Don't rule anyone out because they wrote the list. #set_global:nightshade_suspected:true
    Narrator: He holds your eye a moment longer than a colleague would.
    -> hub
+ { mole_identified and not asked_logs } [The root logs have your account on the Portland plan. Forty-seven minutes.]
    ~ asked_logs = true
    ~ nightshade_suspected = true
    Agent 0x47 'Nightshade': Then you have root on our own repository. I'm genuinely impressed. Nobody's touched that box in years.
    Agent 0x47 'Nightshade': Finish putting it through the relay. When it's all in, the Director will want this conversation in a room with a recorder.
    Agent 0x47 'Nightshade': I'll walk down myself. I'm not going to make anyone chase me. #set_global:nightshade_suspected:true
    -> hub
+ { found_nightshade_profile and not asked_training } [Dr Okafor flagged you a year ago. "Ideological drift."]
    ~ asked_training = true
    ~ nightshade_suspected = true
    Narrator: The smile holds. Something behind it goes cold.
    Agent 0x47 'Nightshade': You've been in the Director's safe. Good. Then you know Okafor was right, and you know he buried it.
    Agent 0x47 'Nightshade': Yes, I said those words. I say a great many true things, and nobody minds until the day they do.
    Agent 0x47 'Nightshade': Careful, 0x00. You're close to something now. Closer than is comfortable for either of us. #set_global:nightshade_suspected:true
    ~ nightshade_influence -= 1
    # influence_decreased
    -> hub
+ { found_badge_audit and asked_alibi and not asked_audit } [The door log has you in this lab from 10:15 to 11:43 that morning.]
    ~ asked_audit = true
    ~ nightshade_audit_confirmed = true
    Agent 0x47 'Nightshade': Yes. I told you: I'm always here. You've proved I keep long hours, 0x00. Bring me the account. #set_global:nightshade_audit_confirmed:true
    -> hub
+ { (asked_audit or asked_training) and not gave_locker_key } [Your locker in the break room. I want to see inside it.]
    ~ gave_locker_key = true
    #give_item:key:nightshade_locker_key
    Agent 0x47 'Nightshade': Take it. 0x47, second from the end. I'd genuinely encourage it.
    -> hub
+ { not mole_identified } [I think it's you, Nightshade.] -> accuse
+ [We're done here.] -> leave

=== accuse ===
~ accused_nightshade = true
~ nightshade_suspected = true
Narrator: He doesn't blink.
Agent 0x47 'Nightshade': Do you. On instinct, or on evidence? I know you, and I know which one you're running on. It isn't evidence yet.
Agent 0x47 'Nightshade': Here's what will happen. You'll leave, because a hunch won't hold me.
Agent 0x47 'Nightshade': And I'll still be here when you come back. I've nowhere I'd rather be, and nothing I'm afraid of.
Agent 0x47 'Nightshade': Go and get your proof. I'd rather you found me than guessed me. #set_global:nightshade_suspected:true #set_global:accused_nightshade:true
-> hub

=== leave ===
{ accused_nightshade:
    Agent 0x47 'Nightshade': Bring proof next time. It's the only thing worth bringing.
- else:
    Agent 0x47 'Nightshade': Come back when you can prove something. I'll be right here. I always am.
}
#exit_conversation
-> hub
