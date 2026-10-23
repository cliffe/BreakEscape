=== test_cascade_nurse ===
# Nurse NPC for event cascade test - responds to patient alert and major incident

-> patrol_idle

=== patrol_idle ===
I'm making my rounds of the ward.
-> END

=== patient_alert_response ===
I'm coming right away to assess the patient!
-> END

=== incident_response ===
MAJOR INCIDENT DECLARED — All staff report to emergency protocols now!
-> END
