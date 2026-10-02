// ===========================================
// NPC: Helen Marsh (SCADA Engineer)
// Scenario: Albion Battery Hall Crisis
// Role: Primary guide; walkdown companion; ESD knowledge; SIS expertise
// ===========================================
//
// GLOBALS READ:
//   anomaly_detected, historian_flatline_found, jump_server_confirmed,
//   sis_tamper_confirmed, esd_activated, facility_safe_state,
//   battery_hall_badge_collected
//
// GLOBALS WRITTEN:
//   helen_briefed (set in arrival_briefing and start)
//
// TASKS COMPLETED VIA EVENTMAPPING (not directly):
//   check_hmi_readings, check_thermometer, read_sis_config,
//   find_certification_doc, pull_ethernet_cable, read_incident_folder,
//   complete_nis_form
//
// ===========================================

// Global variables managed by scenario - declared locally and updated by game engine
VAR anomaly_detected = false
VAR historian_flatline_found = false
VAR jump_server_confirmed = false
VAR sis_tamper_confirmed = false
VAR esd_activated = false
VAR hydrogen_alarm = false
VAR facility_safe_state = false
VAR battery_hall_badge_collected = false
VAR castletech_contacted = false

// Local NPC state tracking
VAR helen_briefed = false
VAR topic_walkdown_offered = false
VAR topic_esd_explained = false
VAR topic_sis_explained = false
VAR topic_patch_discussed = false
VAR topic_facility_explained = false
VAR topic_hmi_explained = false
VAR topic_access_explained = false


// ===========================================
// TIMED OPENING CUTSCENE (called by timedConversation)
// ===========================================

=== arrival_briefing ===

Helen Marsh: I'm Helen Marsh — I run the PLC and SCADA systems here. And you're the incident response team they sent?

Helen Marsh: I haven't been here long — I came early for a maintenance window, wasn't expecting this. I called it in as soon as I saw the handover notes.

Helen Marsh: The overnight shift left no incident reports. Every reading looks entirely normal — and that's the problem.

Helen Marsh: Our historian data is showing almost zero variance across all racks. Temperature, state of charge, charge rate — everything flat. Too flat. Real battery systems don't behave like that.

Helen Marsh: The night shift technician — Jay Patel — his handover notes just say 'uneventful.' Jay's been here three years. He never writes that when it actually was.

{ not battery_hall_badge_collected:
    #give_item:keycard
    Helen Marsh: We should do a walkdown of Battery Hall 1 before the maintenance window opens. Check the temperature manually.
    Helen Marsh: Here's the plant room badge — Battery Hall 1 is through the north door.
}

~ helen_briefed = true
~ topic_walkdown_offered = true
#set_global:helen_briefed:true
#complete_task:talk_to_helen

#exit_conversation
-> hub


// ===========================================
// DEFAULT ENTRY (player walks up to Helen)
// ===========================================

=== start ===
#complete_task:talk_to_helen

{ not helen_briefed:
    Helen Marsh: Oh good — you're here. Let me brief you quickly.
    Helen Marsh: I'm Helen Marsh. Something about this morning handover isn't sitting right with me.
    Helen Marsh: The overnight shift technician — Jay Patel — never writes 'uneventful' when it actually was. Today he did.
    { not battery_hall_badge_collected:
        #give_item:keycard
        Helen Marsh: Here's the plant room badge for Battery Hall 1 — through the north door when you're ready.
    }
    ~ helen_briefed = true
    ~ topic_walkdown_offered = true
    #set_global:helen_briefed:true
}

-> hub


// ===========================================
// MAIN HUB (single repeatable entry point)
// ===========================================

=== hub ===

// --- Evidence-unlocked options appear first ---
+ { anomaly_detected } [Ask about the analog thermometer discrepancy]
    -> thermometer_discrepancy

// Bark-response option: appears after thermometer bark but before historian is reviewed
+ { anomaly_detected and not historian_flatline_found } [What should I look for in the historian trend?]
    -> historian_guidance

+ { historian_flatline_found } [Ask about the historian flat-line reading]
    -> historian_anomaly

// Bark-response option: appears after jump_server bark, before SIS tamper confirmed
+ { jump_server_confirmed and not sis_tamper_confirmed } [What should I look for on the SIS configuration panel?]
    -> sis_investigation_guidance

+ { sis_tamper_confirmed } [Ask about the SIS configuration]
    -> sis_compromise_discussion

+ { sis_tamper_confirmed and not topic_patch_discussed } [Ask about the SIS patch situation]
    -> patch_situation

// Bark-response option: hydrogen alarm urgency — only before ESD is pressed
+ { hydrogen_alarm and not esd_activated } [The hydrogen detector just tripped — how urgent is this?]
    -> hydrogen_alarm_response

// Bark-response option: after ESD pressed, before facility safe state
+ { esd_activated and not facility_safe_state } [ESD done — what are the next steps?]
    -> post_esd_guidance

// --- Standing options ---
+ { not topic_esd_explained } [Ask about the hardwired ESD]
    -> esd_explanation

+ { not topic_walkdown_offered } [Let's do the Battery Hall walkdown]
    ~ topic_walkdown_offered = true
    -> walkdown_offer

+ { not topic_facility_explained } [Tell me about the facility]
    ~ topic_facility_explained = true
    -> facility_overview

+ { not topic_hmi_explained } [What does the HMI show?]
    ~ topic_hmi_explained = true
    -> hmi_overview

// Hidden once player has the badge — they already know how to get in
+ { not battery_hall_badge_collected and not topic_access_explained } [How do we get into the battery halls?]
    ~ topic_access_explained = true
    -> access_explained

+ [Ask about next steps]
    -> next_steps

+ [Nothing right now]
    Helen Marsh: I'll be here. Don't take too long — if my instincts are right, time matters.
    #exit_conversation
    -> hub


=== facility_overview ===

Helen Marsh: We have two battery halls — Hall 1 and Hall 2. 220 MWh total. Four racks in each hall.

Helen Marsh: The SCADA system monitors and controls everything — temperature, state of charge, charge rate. The SIS sits underneath that and should trip the system if any safety parameter is breached.

Helen Marsh: Should. That's the word I keep getting stuck on this morning.

-> hub


=== hmi_overview ===

Helen Marsh: HMI-OPS-01 shows everything you'd expect — Battery Hall 1 sitting at a steady 28 degrees, state of charge at 72 percent, all alarms green.

Helen Marsh: That's actually part of what concerns me. These readings show almost no variance overnight. Normally we'd see at least a degree of fluctuation as the cells cycle.

Helen Marsh: The historian trend would show that more clearly. Have a look if you want.

-> hub


=== access_explained ===

Helen Marsh: Battery Hall 1 requires the plant room RFID badge — I have it here.

Helen Marsh: The Engineering Workshop is east of us. Key's in the duty officer desk drawer. That room has the engineering workstation and the jump server rack.

-> hub


// ===========================================
// WALKDOWN OFFER
// ===========================================

=== walkdown_offer ===

{ not battery_hall_badge_collected:
    #give_item:keycard
    Helen Marsh: I've got the plant room badge here. Battery Hall 1 is through the north door.
- else:
    Helen Marsh: You already have the plant room badge. Battery Hall 1 is through the north door.
}

* [Yes — let's go now]
    Helen Marsh: Good. Head north through the door — I'll catch up with you there.
    Helen Marsh: Check the analog thermometer on Rack A2 when you arrive — that's the one I'm worried about.
    -> hub

* [I want to review the historian trend first]
    Helen Marsh: That's sensible. I'll be here when you're ready.
    -> hub

* [What should I look for in the battery hall?]
    -> what_to_look_for


=== what_to_look_for ===

Helen Marsh: The main thing I want to check is the temperature at Rack A2. The SCADA reading is fine — but that rack ran warmer than the others last month.

Helen Marsh: There's an old analog thermometer on the wall near A2. Not networked. I want to compare it against the digital reading.

Helen Marsh: If they disagree, that tells us something important.

* [Why specifically compare analog vs digital?]
    -> why_analog_comparison

* [What range should we expect?]
    -> expected_temperature_range

* [Let's go check it now]
    -> hub


=== why_analog_comparison ===

Helen Marsh: Because the digital reading is part of the SCADA system — if someone has compromised the system, they can falsify that data.

Helen Marsh: An analog thermometer is just a tube of mercury in a glass case. It doesn't have firmware, it doesn't have a network connection. It cannot be hacked remotely.

Helen Marsh: It can fail — the mercury can break or get stuck — but if it's physically intact, it shows the truth. That's why I use it as a cross-reference. When digital and analog readings disagree, the analog wins.

Helen Marsh: It's not elegant, but it's how you design systems that remain safe even when the digital parts are compromised.

-> hub


=== expected_temperature_range ===

Helen Marsh: Under normal charge cycle at this state-of-charge, the cells should be running between 28 and 32 degrees Celsius. Slight variance — not huge swings.

Helen Marsh: If the thermometer reads significantly higher than the HMI says — like if HMI says 28 and the thermometer says 40-plus — that's a red flag.

Helen Marsh: Lithium cells can undergo thermal runaway above about 55 degrees. The SIS should trip them offline before that happens. But if the SIS has been compromised or isn't working...

* [What happens if we don't catch thermal runaway in time?]
    -> thermal_runaway_explained

* [Is that what you're worried about today?]
    -> helen_intuition

* [Let's look at the thermometer and find out]
    -> hub


=== thermal_runaway_explained ===

Helen Marsh: The cells enter a self-sustaining exothermic reaction — they generate heat faster than the cooling system can remove it.

Helen Marsh: Once it starts, it's very hard to stop. The temperature ramps exponentially. The cell catches fire, or releases hydrogen gas.

Helen Marsh: We have 220 megawatt-hours in two battery halls. If a thermal runaway propagates across Rack A1, that's kilograms of lithium burning in a confined space.

Helen Marsh: Which is why we have the SIS — to trip the system and isolate the affected cells before thermal runaway develops.

Helen Marsh: And which is why, if I think the SIS might not be working, I want to verify the real temperature before trusting what the SCADA tells me.

-> hub


=== helen_intuition ===

Helen Marsh: Probably not. This facility has been running smoothly for two years. Overnight shift was uneventful — no alarms, no anomalies.

Helen Marsh: But Jay Patel never writes 'uneventful.' And the historian trend shows absolutely no variance — exactly the same reading for hours. That's not normal.

Helen Marsh: I've learned to trust my gut when the data is too clean. Perfect readings usually mean something is hiding underneath.

Helen Marsh: Could be nothing. But I want to know.

-> hub


// ===========================================
// ANOMALY DETECTION BRANCH
// ===========================================

=== thermometer_discrepancy ===

Helen Marsh: Fifty-one degrees. The HMI says twenty-eight.

Helen Marsh: I've been in this industry long enough to know what that means. One of those readings is a lie.

Helen Marsh: The analog thermometer was calibrated six months ago. It has no network connection. It cannot be falsified remotely.

* [So the SCADA reading is wrong?]
    Helen Marsh: If the physical thermometer is correct, then yes. Something is feeding the SCADA system false data.
    Helen Marsh: That thermometer is the most important object in this building right now, because it is the only reading that cannot be compromised.
    -> hub

* [Could the thermometer itself be faulty?]
    Helen Marsh: It's possible. But if I had to choose between trusting a networked digital system and a certified analog gauge, and those readings disagree by twenty-three degrees — I trust the gauge.
    Helen Marsh: The digital system has more failure modes. Including deliberate manipulation.
    -> hub

* [What do we do with this information?]
    Helen Marsh: We need to verify it — check the historian trend data, look at the access logs. And we need to seriously consider pressing the ESD before this escalates further.
    -> hub


// ===========================================
// HISTORIAN ANOMALY BRANCH
// ===========================================

=== historian_anomaly ===

Helen Marsh: Three hours of exactly twenty-eight point zero. Not twenty-seven point nine, not twenty-eight point one. Exactly twenty-eight.

Helen Marsh: Real sensor data has noise. Electrical interference, measurement jitter, thermal fluctuation. A perfectly flat line for three hours means the data is synthetic.

Helen Marsh: Someone wrote a value to the sensor feed and held it there. This is not a sensor failure. This is deliberate falsification.

* [How long has this been going on?]
    Helen Marsh: The flat-line starts at 23:12 last night. That's when the real reading was replaced.
    Helen Marsh: Which means Battery Hall 1 has been operating without meaningful temperature monitoring for over seven hours.
    -> hub

* [Is Marcus Webb the right person to call?]
    Helen Marsh: Yes. Marcus is OT Security. He's been trying to get the IT/OT boundary sorted for eighteen months. He'll know what to do.
    -> hub


// ===========================================
// ESD EXPLANATION
// ===========================================

=== esd_explanation ===
~ topic_esd_explained = true

Helen Marsh: The hardwired ESD is a red mushroom-head button on the wall in Battery Hall 1, near Rack A2.

Helen Marsh: It is a physical electrical interlock. When you press it, it breaks the charging circuit for Racks A1 through A4. Immediately. No SCADA involved, no SIS firmware, no network command.

Helen Marsh: It cannot be disabled remotely. It cannot be falsified. A cyber attack cannot prevent a hardwired circuit from opening.

* [How does it work exactly?]
    -> esd_technical_detail

* [Why do we need it if we have the SIS?]
    -> why_independent_esd

* [Should we press it now?]
    Helen Marsh: That's what Marcus needs to confirm. The ESD is irreversible without a manual reset — pressing it without proper authority creates its own complications.
    Helen Marsh: But if the cells are at fifty-one degrees and rising with a compromised SIS, the answer may well be yes.
    -> hub


=== esd_technical_detail ===

Helen Marsh: It's a direct relay. Power flows through a normally-closed switch. Press the button — circuit opens — racks disconnect. The software doesn't get a vote.

Helen Marsh: That's the point. The hardwired ESD exists precisely because we cannot trust that the programmable safety layers will always work.

Helen Marsh: The beauty of a hardwired circuit is that there's no attack surface. No firmware to patch, no network port to access, no credentials to steal.

Helen Marsh: It's dumb and simple. Which in safety engineering is actually a feature, not a limitation.

* [What's the physical consequence of pressing it?]
    -> esd_consequence

* [Can it be reset?]
    -> esd_reset

* [Let's move on]
    -> hub


=== esd_consequence ===

Helen Marsh: The charging circuit to Racks A1 through A4 breaks. They're instantly disconnected from the main power feed.

Helen Marsh: The battery management systems go into a safe state — no charging, no discharging, just cooling until the cells stabilise.

Helen Marsh: The facility loses about 100 megawatts of stored energy in those four racks. There are contract penalties for an unplanned shutdown.

Helen Marsh: But a lost contract penalty is better than a battery hall fire.

-> hub


=== esd_reset ===

Helen Marsh: It has to be done manually — someone walks into Battery Hall 1, finds the button housing, pops out the mechanical reset pin, and reinstalls the button.

Helen Marsh: It's deliberate. You can't accidentally recover from an ESD just by power-cycling the system. The reset requires physical presence and commitment.

Helen Marsh: That's a design choice. It forces deliberation. If you press the ESD, you know exactly what you've done and you take responsibility for the consequences.

-> hub


=== why_independent_esd ===

Helen Marsh: Because the SIS is software. It has firmware, processors, firmware updates. And all of that — in principle — can be compromised.

Helen Marsh: If the SIS fails, we need a safety function that cannot fail in the same way. That means it has to be fundamentally independent — a different kind of thing.

Helen Marsh: A hardwired circuit is about as far from software as you can get. No firmware, no networking, no complexity. Just relay contacts and wiring.

Helen Marsh: It's not elegant. But it's the reason we can still survive even if every digital system in this building has been compromised.

Helen Marsh: That's defence in depth. You don't put all your safety eggs in one digital basket.

-> hub


// ===========================================
// SIS COMPROMISE DISCUSSION
// ===========================================

=== sis_compromise_discussion ===
~ topic_sis_explained = true

Helen Marsh: Eighty-five degrees. The SIS thermal runaway threshold has been raised from fifty-five to eighty-five.

Helen Marsh: That means the automated safety function won't trip until the cells are already in irreversible failure. The protection we thought was there — isn't.

* [How did they get into the SIS?]
    -> sis_engineering_port

* [What are the consequences?]
    -> sis_compromise_consequences

* [How do we know it's been modified?]
    -> sis_audit_trail


=== sis_engineering_port ===

Helen Marsh: The SIS has an engineering port for configuration and maintenance. That port should be isolated — but it's reachable from the SCADA network.

Helen Marsh: If someone can get onto the SCADA network, they can reach the SIS engineering interface. Which means the SIS isn't independent. It's connected.

Helen Marsh: IEC 61511 requires SIS logical isolation from the control system for exactly this reason.

* [Why is the engineering port connected to SCADA?]
    -> engineering_port_history

* [What should the architecture look like?]
    -> sis_isolation_design

* [Back to the main discussion]
    #set_global:en002_claim_assessed:true
    -> hub


=== engineering_port_history ===

Helen Marsh: During commissioning, the SIS vendor needed remote access to configure the safety settings. So we connected the engineering port to the SCADA network with a temporary firewall rule.

Helen Marsh: That was supposed to be temporary — removed once commissioning was finished. But 'temporary' became permanent.

Helen Marsh: Now, anyone on the SCADA network who knows the access point can reach the SIS and potentially modify setpoints. Marcus flagged this eighteen months ago. The board decided to accept the risk rather than pay for a reconfiguration.

Helen Marsh: That decision was made on the assumption that the SCADA network couldn't be compromised. Which turned out to be a bad assumption.

#set_global:en002_claim_assessed:true
-> hub


=== sis_isolation_design ===

Helen Marsh: The SIS should be on its own isolated network. Not connected to SCADA. Not connected to enterprise IT. No network at all, ideally.

Helen Marsh: Engineering access to the SIS should happen at a physical console — an air-gapped terminal in a restricted room. You plug in a portable device, make your changes, verify them, then disconnect.

Helen Marsh: That way, even if the entire SCADA network is compromised, the SIS stays clean.

Helen Marsh: We didn't do that because it's operationally inconvenient and it costs money. So we left the engineering port on the SCADA network and hoped nobody would exploit it.

Helen Marsh: Someone did.

#set_global:en002_claim_assessed:true
-> hub


=== sis_compromise_consequences ===

Helen Marsh: The SIS was our last automated safety backstop. Without it, the only safety function remaining is the hardwired ESD — which is independent, but requires someone to physically go and press it.

Helen Marsh: Everything else — the BMS overcharge protection, the cell temperature alarm, the thermal runaway trip — all of those are compromised.

Helen Marsh: If the cells do start to go into thermal runaway, there's no automated protection. It's all on the ESD button.

* [That sounds intentional — like they wanted to disable the safeguards]
    -> attacker_intent

* [What about alarms — shouldn't we still see some warning?]
    -> alarm_theory

* [Back to the main discussion]
    -> hub


=== attacker_intent ===

Helen Marsh: That's one theory. Another is that they wanted to keep the system running — raise the threshold to prevent any automated shutdowns that would interrupt their access.

Helen Marsh: Either way, the result is the same. The safety system that's supposed to protect the facility is no longer protecting it.

Helen Marsh: Which is why that analog thermometer in Battery Hall 1 is now the most important instrument in this facility.

-> hub


=== alarm_theory ===

Helen Marsh: In theory, yes. The alarm panel in the control room should show something — high temperature warning, SIS deviation alert, something.

Helen Marsh: But if the HMI is also compromised — if they're feeding the alarm system false data the same way they're feeding false temperature readings — then the alarm system will also look normal.

Helen Marsh: This is why we don't rely only on digital alarms. We have the physical thermometer, we have the hydrogen detector, we have trained operators who know what normal looks like.

Helen Marsh: I'm trained to notice when everything looks too perfect. And this morning, everything looked too perfect.

-> hub


=== sis_audit_trail ===

Helen Marsh: The SIS has an audit log. Every configuration change is recorded — who made it, when, what was changed.

Helen Marsh: The log shows that the threshold was modified at 03:22 this morning by an administrative account. Account name is in the engineering workstation logs if you look.

Helen Marsh: The question is: who was authorised to make that change? The answer is: nobody who actually has that access level.

Helen Marsh: So either the credentials were stolen, or the account is compromised. Either way, it's unauthorised access.

#set_global:en002_claim_assessed:true
-> hub


// ===========================================
// PATCH SITUATION
// ===========================================

=== patch_situation ===
~ topic_patch_discussed = true

Helen Marsh: The patch was available eighteen months ago. It fixes the authentication bypass on the SIS engineering port — the exact vulnerability that was used to change those setpoints.

Helen Marsh: We deferred it because applying it requires recertification under IEC 61511. Eight weeks offline. £180,000. The board said no.

* [Was the deferral the right call?]
    -> patch_defensibility

* [What would applying the patch change?]
    -> patch_technical_detail

* [Why does recertification cost so much?]
    -> recertification_explained

* [What would you recommend now?]
    -> helen_patch_recommendation


=== patch_defensibility ===

Helen Marsh: I think about that. The risk was real — documented in Marcus's risk assessment. But it felt manageable at the time.

Helen Marsh: Now? With a battery hall approaching thermal runaway because someone exploited exactly that vulnerability?

Helen Marsh: It wasn't defensible. We accepted a documented risk with a compensating control that wasn't actually in place. That's the mistake.

Helen Marsh: The question for the debrief is: what's the right approach going forward? Apply the patch and accept the recertification cost? Or maintain deferral with genuinely effective compensating controls that actually exist and actually work?

-> hub


=== patch_technical_detail ===

Helen Marsh: It would close the authentication bypass on the SIS engineering port. An attacker on the SCADA network could no longer modify SIS setpoints without proper credentials.

Helen Marsh: But we'd need to re-run the full SIL 2 safety case — verify that the patched firmware meets the functional safety requirements. That's the eight weeks and £180,000.

Helen Marsh: The patch itself is maybe two hours of work. The recertification is the burden. We have to prove to a third-party auditor that the patched firmware still meets all the safety requirements of the original design.

Helen Marsh: That's not bureaucracy — it's actually important. You don't want to patch a safety system and accidentally break some critical function.

-> hub


=== recertification_explained ===

Helen Marsh: Because you can't just patch the firmware in a SIL 2 system without independent verification.

Helen Marsh: The SIS has a certified safety case — a formal document that says "this configuration of hardware and firmware will reliably prevent thermal runaway within this operational envelope."

Helen Marsh: If you change the firmware, you've changed the subject of the certification. So you have to certify it all over again.

Helen Marsh: That means hiring a third-party SIL 2 auditor, running through all the verification tests, doing a full safety analysis on the patched code, getting sign-off.

Helen Marsh: It's expensive and time-consuming because the safety function has to be proven to work correctly before we go live. You can't just patch and hope.

* [How long has the patch been available?]
    Helen Marsh: Eighteen months. Long enough that the board should have made a decision one way or the other. Instead we just kept deferring.
    -> hub

* [Is the risk documented anywhere?]
    Helen Marsh: Yes — Marcus's risk assessment. The vulnerability, the mitigation options, the compensating controls. All documented. All reviewed. And then all filed away.
    -> hub


=== helen_patch_recommendation ===

Helen Marsh: Apply the patch and do the recertification. I would have recommended that six months ago.

Helen Marsh: The alternative — deferral with compensating controls — only works if the compensating controls actually exist and actually work. At Albion, they don't.

Helen Marsh: The compensating control was OT-inclusive network monitoring. We tried to implement it through the CastleTech contract. But their contract explicitly excluded OT. So the compensating control was never there.

Helen Marsh: That's a business decision that looked okay on a spreadsheet but created a real safety gap.

Helen Marsh: Now we're paying the cost of that gap. The recertification cost looks small in comparison.

-> hub


// ===========================================
// NEXT STEPS
// ===========================================

=== next_steps ===

{ not anomaly_detected:
    Helen Marsh: Start with the manual readouts. The HMI readings look clean, but I don't trust them.
    Helen Marsh: Go to Battery Hall 1 and check the analog thermometer on Rack A2 — it's not networked, so it can't be falsified. Compare it against what HMI-OPS-01 shows.
    Helen Marsh: Then come back and look at the historian trend for Rack A1 on HMI-OPS-01. Three hours of data should tell us whether those readings are real.
    -> hub
}

{ not esd_activated:
    Helen Marsh: Priority one is the ESD. Those cells are at fifty-one degrees with a compromised SIS — we need to disconnect them from the charging circuit now.
    Helen Marsh: Marcus has the authority to direct that. Have you called him yet?
    -> hub
}

{ esd_activated and not facility_safe_state:
    { castletech_contacted:
        #set_global:facility_safe_state:true
        #set_global:priya_sharma_visible:true
    }
    Helen Marsh: Good — ESD is done. The racks are cooling.
    Helen Marsh: Now we need to isolate the attacker, understand the full scope of what they changed, and get the notification to NCSC.
    -> hub
}

{ facility_safe_state:
    Helen Marsh: We're in a safe state now. The immediate hazard is contained.
    Helen Marsh: Dr Priya Sharma from NCSC and HSE has arrived for the post-incident review. I'd suggest talking to her.
    -> hub
}


// ===========================================
// BARK-RESPONSE KNOTS (unlocked by radio messages)
// ===========================================

=== historian_guidance ===

Helen Marsh: Open the historian trend on HMI-OPS-01 — look at Rack A1 temperature for the last three hours.

Helen Marsh: Real sensor data always has noise — small jitter up and down. If you see a perfectly flat line, that data is synthetic. Someone wrote a fixed value to the sensor feed.

Helen Marsh: Also look at the rate-of-change overlay. If the real temperature was climbing before the flat-line started, you will see a clear break. That break tells us exactly when the falsification began.

-> hub


=== sis_investigation_guidance ===

Helen Marsh: The SIS configuration panel is in the engineering workshop — it shows all the current setpoints for the protective functions.

Helen Marsh: The key thing to look for is the thermal runaway trip threshold for Battery Hall 1. It should read fifty-five degrees Celsius — that is the certified setpoint under the IEC 61511 safety case.

Helen Marsh: If it reads anything higher — especially anything near eighty-five degrees — the safety system has been tampered with. That setpoint is the temperature at which the SIS is supposed to trip the racks offline automatically.

Helen Marsh: There is a SIS certification document in the filing cabinet in that room. Find it and compare the numbers against what the panel shows.

-> hub


=== hydrogen_alarm_response ===

Helen Marsh: That is serious. One percent LEL means the hydrogen concentration is measurable and rising. Lithium cells release hydrogen gas as they overheat.

Helen Marsh: At four percent LEL it becomes flammable. We have a short window.

Helen Marsh: If you have not pressed the ESD yet — that is the only thing that matters right now. Go to Battery Hall 1. Press the button. Do not wait.

-> hub


=== post_esd_guidance ===

Helen Marsh: Good — the racks are disconnecting from the charging circuit now. The cooling system will run at maximum until the cells stabilise.

Helen Marsh: Two things still need to happen. The attacker is still in the network — pull the jump server Ethernet cable if you have not already, then message Tom Hadley at CastleTech to block the enterprise-side connections.

Helen Marsh: And we need to file the NIS notification. We are inside the seventy-two hour window but it needs to go in now. The form is on the wall in the control room.

-> hub
