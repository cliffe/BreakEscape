// ===========================================
// NPC: Mrs Kowalski (Post-Op Patient — Bed 5)
// Scenario: Northgate Hospital
// Role: Patient advocacy; observational witness; pump safety concern escalation
// Context: Bed-bound in Bed 5 (bottom-centre); witness to events on Bed 2; alerts player to patient deterioration risk
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR bed4_escalated = false
VAR drug_library_compromised = false
VAR drug_library_restored = false
VAR pump_dose_error = false

// Local tracking vars for this NPC
VAR player_approached = false
VAR concern_mentioned = false
VAR pump_concern_raised = false
VAR monitoring_addressed = false

// Global reads: drug_library_compromised, pump_dose_error, drug_library_restored
// Global writes: (none — this NPC is observational)

// ===========================================
// KNOT ALIASES (match scenario currentKnot / targetKnot references)
// ===========================================

=== stable_witness ===
-> start

=== sedated_witness ===
-> state_sedated

// ===========================================
// FIRST ENCOUNTER — Player walks by
// ===========================================

=== start ===

{not player_approached:
    Mrs Kowalski: [Glances over from her pillow] You're the one from IT?
    ~ player_approached = true
    -> first_words
}

{player_approached:
    Mrs Kowalski: Have you got a moment?
    -> hub
}


// ===========================================
// OPENING EXCHANGE
// ===========================================

=== first_words ===

Mrs Kowalski: Feels like you've all been up all night dealing with this mess.

Mrs Kowalski: I just wanted to say — they're doing their best, the nurses. Don't blame them if things slip.

* [I appreciate that]
    Mrs Kowalski: The ward was chaos when I woke up. No monitors, staff running around with clipboards.
    Mrs Kowalski: But Sarah — the charge nurse — she didn't panic. That matters.
    -> hub

* [How are you feeling?]
    Mrs Kowalski: Post-op, so not great. But stable. My daughter would be asking all the questions you probably should be asking.
    Mrs Kowalski: She's not here yet, so I'm stuck doing it.
    -> hub


// ===========================================
// OBSERVATIONAL CONCERN
// ===========================================

=== pump_concern ===
~ pump_concern_raised = true

Mrs Kowalski: That pump — the one beside the bed. I've been watching it all morning.

Mrs Kowalski: It's beeping differently now. And there's a new rate on the screen.

Mrs Kowalski: [Points with her hand] Could you get someone to check it?

* [What do you think is wrong?]
    Mrs Kowalski: I don't know. I'm just a patient. But I know my body.
    Mrs Kowalski: The last bag was running slow and steady. This one feels different.
    Mrs Kowalski: Maybe it's nothing. But maybe it's worth having someone look.
    -> hub

* [I'll check it now]
    Mrs Kowalski: Thank you. I don't like making a fuss, but Sarah's been pulled in three directions.
    Mrs Kowalski: Someone needs to pay attention to what's being put into my arm.
    -> hub

* [The nurses have it covered]
    Mrs Kowalski: [Settles back against her pillow, quietly] Okay. I hope you're right.
    #influence_decreased
    -> hub


// ===========================================
// MONITORING CONVERSATION
// ===========================================

=== monitoring_discussed ===
~ monitoring_addressed = true

Mrs Kowalski: This morning I was on continuous monitors. Everything tracked on that big screen.

Mrs Kowalski: Then the ransomware hit and suddenly it's back to how hospitals used to be — someone checking me every fifteen minutes.

Mrs Kowalski: Which means if something happens between checks...

* [The nurses are doing their best]
    Mrs Kowalski: I know they are. But there's a reason they invented continuous monitoring.
    Mrs Kowalski: I'm post-op cardiac. I'm supposed to have an alarm on my chest and a screen showing my heart rate.
    Mrs Kowalski: Instead I have a clipboard and hope.
    -> hub

* [What are you most concerned about?]
    Mrs Kowalski: My oxygen saturation. If that drops and nobody's watching, I won't know. Neither will they — until it's late.
    Mrs Kowalski: Sarah's nurse checked me a few minutes ago. I was doing fine then.
    Mrs Kowalski: But things change fast after surgery.
    -> hub

* [We're working on restoring the monitoring]
    Mrs Kowalski: I hope so. [Pulls the blanket up] I just don't want to be the reason you all have a bad day at work.
    -> hub


// ===========================================
// DRUG SAFETY AWARENESS
// ===========================================

=== drug_safety_concern ===

{not drug_library_compromised:
    Mrs Kowalski: The pharmacist came by earlier with the charge nurse. They looked worried.
    Mrs Kowalski: Is something wrong with my medication?
    -> hub
}

{drug_library_compromised:
    Mrs Kowalski: [Quietly anxious] The pharmacist just told me they have to do manual dosing instead of the pump.
    
    Mrs Kowalski: I'm trying not to worry. But "manual dosing" after someone hacked the system — that's a lot to process.
    
    * [The manual approach is actually safer right now]
        Mrs Kowalski: How is manual safer than a machine programmed to do it?
        Mrs Kowalski: [Pauses] I suppose a human can see what they're doing. A machine just does what it's told.
        -> hub
    
    * [They're taking extra precautions with you]
        Mrs Kowalski: I know. The pharmacist explained. She's going to watch every dose.
        Mrs Kowalski: It's strange to have someone that focused on what goes into my arm. Not bad strange, just... different.
        -> hub
    
    * [Is your medication already restored?]
        {drug_library_restored:
            Mrs Kowalski: I think so? Someone verified something on a computer and the charge nurse looked relieved.
            Mrs Kowalski: They're still being careful but I'm not as worried now.
        }
        {not drug_library_restored:
            Mrs Kowalski: I don't think so yet. Which is why I'm being very careful about what I ask for.
        }
        -> hub
}


// ===========================================
// PATIENT ADVOCACY
// ===========================================

=== patient_advocacy ===

Mrs Kowalski: You know what Sarah said to me this morning? "Your safety is the only thing that matters to me right now."

Mrs Kowalski: And she meant it. Even with the monitors down, the ransomware, the staffing stretched thin.

Mrs Kowalski: I'm just one patient in one bed, and she's still putting that first.

* [That's what good nursing looks like]
    Mrs Kowalski: Yes. I worked in hospitals once, years ago. Not as a nurse — admin — but I remember that feeling.
    Mrs Kowalski: That's why I'm speaking up about the pump. Not to cause trouble, but because she needs to know.
    -> hub

* [She's doing an extraordinary job today]
    Mrs Kowalski: She is. And so are you, from what I can see.
    Mrs Kowalski: It's not just the IT people who matter. It's people willing to say when something doesn't feel right.
    -> hub


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===

+ {not concern_mentioned and not pump_concern_raised} [Is something bothering you?]
    ~ concern_mentioned = true
    Mrs Kowalski: Just watching my infusion pump. It's new today — different bag.
    Mrs Kowalski: I'm sure it's fine. But if you could look at it...
    -> pump_concern

+ {pump_concern_raised and not drug_library_compromised} [About that pump]
    Mrs Kowalski: Did someone check it? I don't mean to nag, but I've been watching it all morning.
    -> hub

+ {not monitoring_addressed} [How are you coping without continuous monitoring?]
    -> monitoring_discussed

+ {drug_library_compromised and not drug_library_restored} [About your medication]
    -> drug_safety_concern

+ [Thank you for looking out for the ward]
    Mrs Kowalski: [Smiles weakly] That's what we do for each other, isn't it?
    Mrs Kowalski: Even when you're just a patient in a bed.
    -> hub

+ [Leave conversation]
    Mrs Kowalski: [Settles back against her pillow] Be safe.
    #exit_conversation
    -> hub


// ===========================================
// BED 2 PATIENT STATE WITNESSES
// ===========================================

=== state_stable ===

Mrs Kowalski: The lady in the next bed was asking for the nurse earlier. She seemed a bit groggy after her operation, but they said that's normal.

-> hub


=== state_sedated ===

Mrs Kowalski: I'm not sure she's alright. She was trying to call out but she can't seem to wake up properly. Is that normal?

-> hub


=== state_critical ===

Mrs Kowalski: [Voice urgent] Please, someone needs to look at her — she's not responding at all! I've been pressing the call bell but nobody's coming!

-> hub


=== state_deceased ===

Mrs Kowalski: [Hands shaking, voice barely audible] She stopped breathing. I kept pressing the bell. I kept pressing it. Nobody came in time.

-> hub
