# CA pilot mechanics: SE wording review, round 1

Scope: the attacker-side social-engineering wording and beats for the ca12 tailgate and the ca15 USB drop, judged on accuracy, attacker voice, matching defender lessons, TTS-ready writing and safety. Source: `CA_PILOT_MECHANICS_PLAN.md` sections 1.1-1.8 and 2.1-2.8, with existing ink in `scenarios/ca12_visitor_tailgater/ink/`, `scenarios/ca15_shadow_it/ink/` and `scenarios/ca15_shadow_it_defend/ink/` checked around the cited beats.

Verdict: no blockers. The attacker framing is strong in both episodes (baiting, placement, helpfulness-as-the-exploit, two-layer access), the writing is clean and voiceable, and nothing drops below awareness level. The findings below tighten accuracy and the attack/defend match.

Severity counts: BLOCKER 0, MAJOR 1, MINOR 6.

---

## MAJOR

### 1. [MAJOR] ca12: the physical test is never framed as authorised. [accuracy / attacker voice]

**As it is.** The only brief change is Jo's kit-bag sentence (1.1 step 1): *"Jo's kit bag is on the hook by the kiosk. The hi-vis is yours if you want it."* Nothing in the new beats establishes the rules of engagement, the agreed scope, or the authorisation (get-out) letter the tester carries. When firmly challenged, Yusuf's alerted branch ends the learner on *"It's the desk or the street, I'm afraid."* and hands back, with no sense that the tester is operating under a signed brief.

**Proposed.** Add one line to Jo's brief that names the authorisation without turning it into a how-to, e.g. *"We're booked in and scoped. The letter's in your bag if anyone detains you, but the whole point is not to need it, you get in by looking like you belong."* Keep Yusuf's retreat lines as they are; a quiet withdrawal when challenged is the correct tester move, so no in-beat letter reveal is needed.

**Reason.** The course's selling point is the attacker's side in attacker terms, and for a physical engagement the defining real-world facts are scope, RoE and the get-out letter. Without them the tailgate reads as "sneak in," which is the wrong model for an authorised test and weakens the attacker-accuracy USP. Establishing it in the brief also makes "retreat rather than argue" legible as deliberate tradecraft rather than failure.

---

## MINOR

### 2. [MINOR] ca12: the guard who waves a courier through has no clearly mirrored defender lesson. [lessons]

**As it is.** The hero tailgate turns on Yusuf *directing* an unverified courier past the desk: *"Delivery? Studio's straight through."* (1.8). The defend twin's `e12_call_tailgater` (per 1.9) is about a badge-less person slipping in behind a badge-holder toward the stairs, and Lorna's caught line is *"You kept the visitor with no badge at the gate."* That mirrors the piggyback, not the guard's own failure to make deliveries sign in and be escorted.

**Proposed.** Confirm the defend twin carries a line on delivery handling (sign in at the desk, wait for an escort, no self-guided access); if it does not, add one defender beat to that effect. No attack-side wording change.

**Reason.** The strongest new attack moment teaches a specific control gap, guards and staff directing unverified visitors onward, that the twin should name so the red flag the learner just exploited is the one they are taught to catch.

### 3. [MINOR] ca15: "Opened when the stick went in" is ambiguous and sits oddly beside the defend twin's mechanism. [accuracy / lessons]

**As it is.** The payoff note (2.6): *"Session note: TL-OPS-04. Opened when the stick went in. One kind click, and you're on their network."* The defend twin teaches *"The moment someone opens a file on that stick, it could run malware."* Joanne's own line is *"I'll just plug it in and see whose it is."* So the attack note implies execution on insertion, the twin implies execution on opening a file, and "one kind click" implies yet a third trigger.

**Proposed.** Pick one mechanism and let both halves agree. If the foothold is the beacon/callback firing when she opens a file to find the owner: *"Session note: TL-OPS-04. She opened a file to find the owner, that's all it took. One kind click, and they're on the network."*

**Reason.** The two twins should teach the same cause-and-effect; a learner who meets "went in" on the attack side and "opens a file" on the defence side gets a muddled rule about what actually triggers the compromise.

### 4. [MINOR] ca15: the unlabelled stick leans entirely on return-to-owner helpfulness. [attacker voice / accuracy]

**As it is.** Nilesh: *"A stick, no label, no note."* (2.7), and the bait works only because Joanne wants to find the owner.

**Proposed.** Keep the beat, but have Nilesh name the choice so the attacker reasoning is explicit, e.g. add to the `red_stick` framing: *"No label is deliberate. A blank stick gets picked up to find the owner; a labelled one gets picked up out of nosiness. Either way it travels."*

**Reason.** Real drops often add a curiosity lure (a tempting label); the plan deliberately uses the helpfulness variant, which is valid and teaches well, but a one-clause nod to the labelled-lure alternative keeps the attacker voice honest about why this pretext was chosen and widens the lesson at no cost.

### 5. [MINOR] ca12: attacker voice at the hero tailgate is shown-text only. [attacker voice]

**As it is.** Every voiced line in the tailgate (1.8) belongs to staff (Yusuf, Delphine, Jun). The attacker's read of the moment lives only in Jo's hint toast and the shown `flipTailgate` string *"...Nobody had to say yes."*

**Proposed.** Consider one short voiced red-team line from Jo over the hero shot, in attacker terms, e.g. *"Two layers. The desk said yes once, and the door stayed open long enough to do the rest."*

**Reason.** The USP is the attacker's side in the attacker's own voice; a single voiced line at the set-piece moment lands that harder than shown text, and the trailer re-shoots (section 7) already frame this as the hero beat.

### 6. [MINOR] ca15: Nilesh's defender characterisation vs running the drop. [attacker voice / consistency]

**As it is.** Nilesh is written across both twins as the "ask first," service-desk voice (attack ink header: *"Quick, kind, funny; asking him is always the easiest move"*). The plan has him hand over the red-team stick and narrate the attacker's playbook (*"Kindness does the attacker's work."*).

**Proposed.** No new line needed; keep the existing host framing explicit on entry, *"Before we flip, one from the red-team kit"* already does most of it, and make sure the `#delivery:` tag reads it as him stepping into the red-team-host role, not as his own habit.

**Reason.** The attacker narration is good, but Nilesh's default voice is the defender; flagging the role switch in delivery keeps the two halves from blurring.

### 7. [MINOR] Delivery tags for the innocently-helpful and firm lines. [writing]

**As it is.** The draft table carries no `#delivery:` guidance, which the plan correctly defers to ink. Two lines are tone-sensitive: Joanne's *"I'll just plug it in and see whose it is."* must sound breezily helpful, not sinister, for the lesson to land; Yusuf's alerted *"It's the desk or the street, I'm afraid."* reads slightly combative for a building guard.

**Proposed.** Tag Joanne's use line `#delivery: cheerful, matter-of-fact` and soften Yusuf's alerted close to *"I'll have to ask you to wait outside, then."* Keep all other lines as drafted.

**Reason.** TTS-voiceability: the point of Joanne's line is that a kind, ordinary person does the wrong thing without a flicker of suspicion; a sinister read breaks the lesson. The guard reads better as firm-but-professional. No `{variables}` or inline stage directions appear in any draft line, so nothing else needs changing on the writing rules.

---

## Lines that pass clean (no change)

- Delphine *"I'll get the door for you."*; Yusuf *"Morning. Mind the step."*, *"Sorry, can I help you there?"*, the default and no-vest challenge branches, *"Desk's just there. Delphine will sort you out."*; Jun *"Morning, Yusuf."* and chatter pool. Accurate, voiceable, within length.
- `flipTailgate` *"You walked in behind a member of staff while the door held. Nobody had to say yes."* Best lesson framing in ca12.
- Nilesh `red_stick` pair, *"Kindness does the attacker's work."*, the nudge/timeout barks, and the hub line *"Nobody was careless there. She was being kind, and that's what a drop relies on."* Strong attacker voice; correctly places the weakness in people and process, not in Joanne.
- Joanne *"Someone's dropped a memory stick. Whose is this?"* and the kettle chatter pool. All under 40 chars where required; UK English throughout.
