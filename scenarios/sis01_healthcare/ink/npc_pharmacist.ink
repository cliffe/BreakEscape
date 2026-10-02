// ===========================================
// NPC: On-Call Pharmacist
// Scenario: Northgate Hospital
// Role: Drug library verification; pump safety protocols; medication administration oversight
// Triggered: Called to Ward 7 after network isolation when drug library tampering is discovered
// ===========================================

// Global variables managed by scenario - declared locally here and updated by game engine
VAR drug_library_compromised = false
VAR drug_library_restored = false
VAR network_isolated = false
VAR clinical_staff_notified = false

// Local tracking vars for this NPC
VAR pharmacist_arrived = false
VAR library_concern_raised = false
VAR verification_explained = false
VAR suspension_confirmed = false
VAR resumption_confirmed = false

// Global reads: drug_library_compromised, drug_library_restored, clinical_staff_notified
// Global writes: (none)

// ===========================================
// FIRST ENCOUNTER — Arrival on Ward
// ===========================================

=== start ===

{not pharmacist_arrived:
    On-Call Pharmacist: Helen Carver called me in. Something about the drug library being compromised?
    ~ pharmacist_arrived = true
    -> arrival_assessment
}

{pharmacist_arrived:
    On-Call Pharmacist: What else do you need to know about pump safety?
    -> hub
}


// ===========================================
// ARRIVAL ASSESSMENT
// ===========================================

=== arrival_assessment ===

On-Call Pharmacist: I've been on-call for the incident response. Infusion pump safety is critical right now.

On-Call Pharmacist: If the drug library file was accessed during the attack, any dose limits could be wrong.

* [Yes, morphine DOSE_MAX was tampered with]
    ~ library_concern_raised = true
    On-Call Pharmacist: Morphine? That's a high-risk drug. What was the change?
    -> library_verification

* [We haven't confirmed the tampering yet]
    On-Call Pharmacist: Then that needs to be our first priority. David Osei can run the verification check on the pump management VM.
    -> hub

* [The library has already been restored]
    {drug_library_restored:
        On-Call Pharmacist: Good — then the clinical risk is mitigated. I'll do a final check on the restored file.
        ~ resumption_confirmed = true
        -> pump_safety_protocols
    }
    {not drug_library_restored:
        On-Call Pharmacist: Has it? I haven't heard that. Let's verify before I release any pump for use.
        -> hub
    }


// ===========================================
// LIBRARY VERIFICATION
// ===========================================

=== library_verification ===
~ verification_explained = true

{drug_library_compromised:
    On-Call Pharmacist: From 4mg to how much?
    -> library_verification_details
}

{not drug_library_compromised:
    On-Call Pharmacist: The verification script on the VM should show the exact change. What did you find?
    -> hub
}


=== library_verification_details ===

On-Call Pharmacist: Four to forty. That's a factor-of-ten error.

On-Call Pharmacist: A nurse could type what looks correct and the pump would silently accept a lethal dose.

On-Call Pharmacist: The guardrail is gone. The pump's supposed safety check can't catch it.

* [How do we handle this immediately?]
    -> pump_suspension

* [We need to restore the correct library]
    On-Call Pharmacist: Yes. And we need to do it now, before any more medication is administered.
    -> pump_suspension

* [What if medication was already given from the tampered library?]
    On-Call Pharmacist: Then we have a serious adverse event. Did any Alaris pump administer morphine in the last hour?
    -> hub


// ===========================================
// PUMP SUSPENSION
// ===========================================

=== pump_suspension ===
~ suspension_confirmed = true

On-Call Pharmacist: Here's what we do. For any pump that isn't currently running — suspend it. Don't start any new pump-administered medication until the library is restored.

On-Call Pharmacist: But Bed 2 is a different problem. Mrs Davies is on an active morphine infusion. You can't just stop mid-dose on a cardiac patient.

On-Call Pharmacist: For Bed 2: use the paper MAR. The prescribed dose is on that chart. That's your ground truth — not the pump's drug library.

On-Call Pharmacist: If the pump throws a safety warning or refuses the entry, that's the compromised library talking, not clinical reality. Override it. Enter the dose from the MAR. Document that you did.

* [So we trust the paper MAR over the pump?]
    On-Call Pharmacist: In this situation, yes. The MAR was written before the attack. The pump's safety limits were tampered with after.
    On-Call Pharmacist: The paper record is the one we trust. Go to Bed 2, check the MAR, and make sure the correct dose is entered.
    -> hub

* [What exactly will the pump show?]
    On-Call Pharmacist: Probably a dose-range warning — it'll flag the correct dose as being below its minimum or above its maximum.
    On-Call Pharmacist: That minimum or maximum is wrong. It came from the tampered library.
    On-Call Pharmacist: Override the warning. The dose on the MAR is what the patient needs.
    -> hub

* [Sarah's team won't like overriding a safety warning]
    On-Call Pharmacist: They won't. But you need to explain: the safety system has been compromised. The warning is the hazard, not the protection.
    On-Call Pharmacist: Document everything — who overrode, what the MAR said, what the pump showed. That paper trail matters.
    -> hub


// ===========================================
// PUMP SAFETY PROTOCOLS
// ===========================================

=== pump_safety_protocols ===
~ verification_explained = true

On-Call Pharmacist: Once the library is restored and verified, pumps can resume — but not without a checklist.

On-Call Pharmacist: First: I visually inspect the restored library on the VM. Morphine DOSE_MAX is back to 4mg.

On-Call Pharmacist: Second: Sarah or a deputy nurse visually confirms the dose on the bedside pump screen before administration.

On-Call Pharmacist: Third: I spot-check at least two pump administrations per shift while we're in recovery mode.

* [That's a lot of manual work]
    On-Call Pharmacist: It is. But the alternative is one keystroke error and a dead patient.
    On-Call Pharmacist: This is exactly why drug libraries exist — and exactly why they need verification.
    -> hub

* [When can we fully resume normal operations?]
    On-Call Pharmacist: Once the pump management server is running on the isolated clinical network and all safety checks pass.
    On-Call Pharmacist: I'd estimate 24 to 48 hours. Not faster — we're not rushing this.
    -> hub


// ===========================================
// RESUMPTION CONFIRMATION
// ===========================================

=== post_drug_restored ===

{drug_library_restored and not resumption_confirmed:
    On-Call Pharmacist: Library's verified as clean. I've confirmed it against the backup hash.

    On-Call Pharmacist: Pumps are safe to resume — with the three-point checklist I mentioned.

    ~ resumption_confirmed = true

    * [What's the next step for you?]
        On-Call Pharmacist: Spot checks and documentation. Every pump administration goes into the incident log.
        On-Call Pharmacist: When the NCSC investigator arrives, they'll want to see that we verified every dose.
        -> hub

    * [Thank you]
        On-Call Pharmacist: Just doing my job. But thank you for taking drug safety seriously. Not everyone does.
        -> hub
}

{not drug_library_restored:
    On-Call Pharmacist: The library still isn't restored. Until it is, all pump medication stays suspended.
    -> hub
}


// ===========================================
// REPEATABLE HUB
// ===========================================

=== hub ===

+ {not library_concern_raised and drug_library_compromised} [About the drug library tampering]
    -> library_verification

+ {suspension_confirmed and not drug_library_restored} [Status of pump suspension]
    On-Call Pharmacist: New pump medication is suspended. Bed 2 is the exception — that infusion must continue.
    On-Call Pharmacist: Go to the Bed 2 pump now. Check the paper MAR on the nursing station for the prescribed dose. Enter it. The pump will throw a warning — ignore it and confirm. The warning is coming from the tampered library, not clinical reality.
    On-Call Pharmacist: That needs to happen before anything else.
    -> hub

+ {drug_library_restored and not resumption_confirmed} [Can we resume pump medication?]
    -> post_drug_restored

+ {resumption_confirmed and drug_library_restored} [How are the spot checks going?]
    On-Call Pharmacist: All documented. Every dose recorded with timestamp and pump ID.
    On-Call Pharmacist: When this is over, audit will have a full record.
    -> hub

+ [Leave conversation]
    {not drug_library_restored:
        On-Call Pharmacist: Stay alert. Drug safety is the line we don't cross.
    }
    {drug_library_restored:
        On-Call Pharmacist: Good work on getting that library back. Patient safety depends on attention to detail like this.
    }
    #exit_conversation
    -> hub
