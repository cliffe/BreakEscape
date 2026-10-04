// ===========================================
// PRESS TERMINAL -- Mission 2: Ransomed Trust
// Break Escape - Physical Exposure Decision
//
// The player physically acts to expose or suppress the hospital's negligence.
// Located in the conference room -- the scene of the board's original budget decision.
// Replaces the secondary_decision from the ransom terminal.
// ===========================================

EXTERNAL player_name()

// Synced from globalVars. The exposure decision is the LAST act of the mission
// and setting mission_complete here launches the debrief -- so the terminal must
// stay locked until BOTH gates clear:
//   backdoor_fully_exploited -> the technical investigation is done (full flag
//     chain: SSH -> ProFTPD -> database -> Ghost's operational log). The evidence
//     package can't be authenticated without it.
//   ransom_decision_made     -> the emergency itself has been resolved at the
//     recovery console.
// Without these a player can pick into the conference room early, release the
// evidence, and skip the entire technical mission.
VAR backdoor_fully_exploited = false
VAR ransom_decision_made = false

// The release decision itself. mission_complete and exposed_hospital are set together by
// do_upload / do_stay_quiet, so mission_complete doubles as "the decision has been made".
// Both are also set locally (~) so the read-only outcome knot is right in the same session,
// before the next globalVars sync.
VAR mission_complete = false
VAR exposed_hospital = false

// Phase 6 (low-risk): the base package below is always transmitted (the debrief's
// exposed-path lines assume it went out, so it stays fixed). These optional pieces of
// corroborating evidence are added to the transmission only if the player actually
// found them, so a thorough investigation visibly sends a fuller case without changing
// the base outcome or requiring a debrief rewrite.
VAR lore_zds_invoice_found = false
VAR lore_ghosts_manifesto_found = false
VAR insider_asset_exposed = false

// Pass 4: if the inside asset was never named, Reeves confronts the player here and
// HIS scene sets mission_complete as it closes; this terminal sets awaiting_ambush
// instead. Setting both in one pass used to start the debrief on top of the ambush.
VAR insider_identified = false
VAR insider_confronted = false
VAR night_security_supervisor_ko = false
VAR awaiting_ambush = false
// Playtest loop round 1 (B13)
VAR ghost_deal_accepted = false

=== start ===
#speaker:computer

// Decision already made: read-only outcome, never the decision menu again.
{mission_complete:
    -> decision_recorded
}
{awaiting_ambush:
    -> ambush_backstop
}
{not backdoor_fully_exploited:
    -> relay_locked_investigation
}
{not ransom_decision_made:
    -> relay_locked_incident
}

HOSPITAL COMMUNICATIONS TERMINAL

Secure outgoing relay -- St. Catherine's regional press network.
14 media recipients. 3 national health correspondents. SAFETYNET Evidence Archive.

Available for transmission:
- Board liability email (cover-up plan, Gary Whitlock scapegoating)
- FY2024 Budget Report (£85,000 security deferred, £3.2 million MRI approved)
- Gary Whitlock security advisory archive (May-November 2024, 7 formal warnings)
- SAFETYNET forensic record (ENTROPY backdoor, decryption keys recovered)

Transmission is irreversible. Once sent, this evidence enters permanent public record.

-> decision_menu

// ===========================================
// GATES: the investigation must be complete AND the incident resolved
// before the SAFETYNET evidence package will authenticate for release
// ===========================================

=== relay_locked_investigation ===
#speaker:computer

HOSPITAL COMMUNICATIONS TERMINAL

>>> OUTGOING RELAY LOCKED <<<

Evidence package FAILED AUTHENTICATION.

The SAFETYNET forensic record is incomplete. A public release needs verified proof of the intrusion: the exploited backdoor and the recovered keys.

Nothing on file yet proves how ENTROPY got in.

Finish working the backup server and recover the evidence. The archive will then accept a release.

-> relay_locked_investigation_choices

// No DONE: a finished story would leave the terminal with no choices on reopen. Stepping
// away re-enters start, so the gates are re-checked against the current globals.
// Round 3 (resting-knot rule): a reopen after flag 4 resumes HERE, at the knot that
// owns the saved choice, so this knot re-checks its own gate and goes back to start.
// Pass 4 dialogue: stepping away rests here too, not at start, so the locked screen
// isn't printed into the thread again on every exit (playtest confirm3, game 1438).
=== relay_locked_investigation_choices ===
{backdoor_fully_exploited or mission_complete:
    -> start
}
+ [Step away from the terminal.]
    #exit_conversation
    -> relay_locked_investigation_choices

=== relay_locked_incident ===
#speaker:computer

HOSPITAL COMMUNICATIONS TERMINAL

>>> OUTGOING RELAY LOCKED <<<

Evidence release held: incident still active.

The forensic record checks out, but the emergency is still live.

Recover the patient systems and log the ransom decision at the recovery console first. Then decide what the world gets to see.
-> relay_locked_incident_choices

=== relay_locked_incident_choices ===
{ransom_decision_made or mission_complete:
    -> start
}
+ [Step away from the terminal.]
    #exit_conversation
    -> relay_locked_incident_choices

=== decision_menu ===

+ [I'm transmitting everything. The public needs to see this.]
    -> confirm_upload

+ [I'm leaving this undisclosed. The hospital's reputation stays intact.]
    -> confirm_stay_quiet

+ [I'll step away from the terminal for now.]
    // Back to the menu (not DONE) so reopening offers the decision again.
    #exit_conversation
    -> decision_menu

// ===========================================
// UPLOAD PATH
// ===========================================

=== confirm_upload ===
#speaker:computer

CONFIRM UPLOAD?

The board chair's cover-up memo, the budget decisions and six months of Gary Whitlock's ignored warnings will be authenticated, attributed and transmitted.

St. Catherine's board cannot suppress this.

Gary Whitlock's warnings enter public record.

+ [Confirmed. Send it all.]
    -> do_upload

+ [Wait -- let me reconsider.]
    -> decision_menu

=== do_upload ===
#speaker:computer

TRANSMITTING...

[SENT] Board liability email -- Hospital Board Chair to Legal Department
[SENT] FY2024 Budget Report -- IT security deferral vs MRI approval
[SENT] Gary Whitlock advisory archive -- 7 warnings, 0 actioned responses, May-November 2024
{lore_zds_invoice_found:[SENT] Zero Day Syndicate procurement invoice -- exploit sourcing, ENTROPY affiliate chain}
{lore_ghosts_manifesto_found:[SENT] Recovered operator manifesto -- pre-planned mortality calculations, signed off}
{insider_asset_exposed:[SENT] Named inside asset -- Graham Reeves, badge SC-4471, authorised the fire-drill device planting}

TRANSMISSION COMPLETE.

14 media recipients confirmed. SAFETYNET Evidence Archive: logged.

St. Catherine's board will face a public inquiry within 48 hours.

Gary Whitlock's warnings are on the public record.

Forty-three other hospitals on ENTROPY's reconnaissance list will see this story. Some will patch before anyone teaches them the same lesson.

{lore_zds_invoice_found or lore_ghosts_manifesto_found or insider_asset_exposed:
The material you assembled reaches past the board and into ENTROPY itself. All of it is now public, attributed and timestamped.
}

#complete_task:decide_hospital_exposure
~ exposed_hospital = true
#set_global:exposed_hospital:true
-> close_decision

// ===========================================
// SUPPRESS PATH
// ===========================================

=== confirm_stay_quiet ===
#speaker:computer

CONFIRM: Do not transmit?

The board liability email, budget decisions, and Gary Whitlock's warning archive remain confidential.

St. Catherine's reputation protected. Board members retain their positions.

Gary Whitlock's situation remains an internal matter.

// Playtest loop round 1 (B13): the promise to Ghost is on the line here.
{ghost_deal_accepted:
    You told Ghost this would go out. Keeping it internal breaks that promise.
}

The sector-wide vulnerability profile does not become public knowledge.

+ [Confirmed. Keep it internal.]
    -> do_stay_quiet

+ [Wait -- let me reconsider.]
    -> decision_menu

=== do_stay_quiet ===
#speaker:computer

Evidence retained. No transmission.

St. Catherine's board has privately committed to a full security overhaul. Gary Whitlock's position will be resolved through internal channels.

The sector-wide risk profile -- 214 hospitals scanned, 147 with critical vulnerabilities -- remains unpublished.

Other hospitals will not learn from this until something similar happens to them.

#complete_task:decide_hospital_exposure
~ exposed_hospital = false
#set_global:exposed_hospital:false
-> close_decision

// Either finish the mission here, or hand the ending to Reeves' ambush.
=== close_decision ===
{insider_identified or insider_confronted or night_security_supervisor_ko:
    ~ mission_complete = true
    #set_global:mission_complete:true
- else:
    ~ awaiting_ambush = true
    #set_global:awaiting_ambush:true
}
#exit_conversation
-> outcome_idle

// Backstop: the ambush was due but never ran (a reload between the two, say).
// The man on the post has gone; the mission ends here.
=== ambush_backstop ===
~ mission_complete = true
The supervisor's post beside the relay is empty. Whoever stood here has gone.
#set_global:insider_asset_escaped:true
#set_global:mission_complete:true
-> outcome_idle

// ===========================================
// AFTER THE DECISION: read-only. No path here reaches DONE, so the terminal always has a
// choice to show on reopen.
// ===========================================

=== decision_recorded ===
#speaker:computer

HOSPITAL COMMUNICATIONS TERMINAL

Outgoing relay: CLOSED. The release decision is on record and cannot be changed.

{exposed_hospital:
    Status: TRANSMITTED. The board email, the FY2024 budget report, Gary Whitlock's advisory archive and the SAFETYNET forensic record are public.
- else:
    Status: WITHHELD. Nothing was transmitted. The evidence stays internal, and the sector-wide risk profile stays unpublished.
}

-> outcome_idle

=== outcome_idle ===
+ [Review the transmission record.]
    -> decision_recorded
+ [Close the terminal.]
    #exit_conversation
    -> outcome_idle
