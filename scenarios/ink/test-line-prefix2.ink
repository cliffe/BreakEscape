// Test Line Prefix Speaker Format
// Tests for PHASE 1-4.5: Speaker prefixes, narrator mode, background changes
//
// Test Coverage:
// - Line prefix format: "Speaker: Text"
// - Narrator mode: "Narrator: Text"
// - Narrator with character: "Narrator[character]: Text"
// - Background changes: "Background[filename]: optional text"
// - Mixed format with traditional tags
// - Multi-line dialogue with speaker changes

VAR test_phase = 0

=== start ===
~ test_phase = 1
PHASE 1: Line Prefix Speaker Format
Please observe the dialogue displays with speaker names derived from line prefixes.
-> phase_1_basic

=== phase_1_basic ===
// Test basic line prefix format with regular speakers
// Each line should show the speaker name correctly from the prefix

Player: Hello! I'm here for the security briefing.
security_guard: Welcome to the facility. I'll run through the basics for you.
security_guard: We use biometric authentication and keycard access throughout the building.
Player: That sounds comprehensive. Any recent incidents?
security_guard: Nothing major. System updates last week, everything's stable now.

+ [Continue to Phase 2] -> phase_2_narrator
+ [Repeat Phase 1] -> phase_1_basic

=== phase_2_narrator ===
~ test_phase = 2
PHASE 2: Narrator Mode Testing
Narrator: The sun begins to set over the facility grounds. An eerie silence fills the corridors.
Narrator: Your briefing complete, you prepare to move deeper into the building.

+ [Continue] -> phase_2_narrator_with_character

=== phase_2_narrator_with_character ===
// Narrator with character portrait displayed
Narrator[security_guard]: The guard glances nervously at the security monitors.
Narrator[security_guard]: Something seems different about the usual patrol rotation today.

+ [Continue] -> phase_3_background_changes

=== phase_3_background_changes ===
~ test_phase = 3
PHASE 3: Background Changes Testing
Background[lab-normal.png]: The laboratory appears normal at first glance.
scientist: Welcome to the lab. Everything is operating within normal parameters.
Background[lab-alert.png]: Suddenly, the room plunges into emergency lighting!
scientist: Wait... the alarm system just triggered. Something's wrong with the main servers!
scientist: We need to get to the server room immediately!

+ [Continue] -> phase_4_mixed_format

=== phase_4_mixed_format ===
~ test_phase = 4
PHASE 4: Mixed Format Testing
Now we'll test mixing line prefix format with traditional tag-based dialogue.
Test that both systems work together smoothly.

Player: What's the emergency protocol?
security_guard: Protocol Alpha - all personnel to designated zones.
security_guard: The facility goes into lockdown automatically.
Narrator: Red emergency lights begin flashing throughout the building.
Player: How long until the lockdown is complete?
security_guard: Usually takes about 30 seconds for all doors to secure.
scientist: The server room needs to stay accessible for diagnostics!

+ [Continue] -> phase_5_speaker_changes

=== phase_5_speaker_changes ===
~ test_phase = 5
PHASE 5: Multi-Speaker Dialogue Testing
Testing rapid speaker changes using line prefixes.

Player: Who's in charge here?
security_guard: I am, in the security department.
scientist: But I'm responsible for the lab systems.
security_guard: Right, so we need both perspectives.
Player: What do you recommend?
scientist: We need lab access first.
security_guard: I'll authorize it - follow me.
Narrator: The tension in the room is palpable as both professionals prepare for action.

+ [Continue] -> phase_6_narrator_variations

=== phase_6_narrator_variations ===
~ test_phase = 6
PHASE 6: Narrator Variations Testing

Narrator: Pure narrator - no character portrait shown
Narrator[scientist]: Narrator with scientist portrait
Narrator[security_guard]: Narrator with security guard portrait
Background[hallway-dark.png]: The hallway descends into darkness
Narrator: Another narration after background change
Player: Are we ready to proceed?
Narrator[security_guard]: The guard nods solemnly

+ [Continue] -> phase_7_comprehensive

=== phase_7_comprehensive ===
~ test_phase = 7
PHASE 7: Comprehensive Scene
A scene combining all features.

Background[facility-entrance.png]: You stand at the facility entrance
Narrator[security_guard]: The security guard approaches your position
security_guard: Welcome to the facility. I hope you're here for a good reason.
Player: I'm here to investigate the recent incident.
security_guard: Incident? There is no incident.
Background[security-office.png]: The guard escorts you to the security office
Narrator: Inside, screens display various security feeds
Narrator[scientist]: From a monitor, a scientist's face appears urgently
scientist: We need to talk. Alone.
security_guard: What's this about?
scientist: It's classified. Speaker confidential access only.
Narrator: The guard looks conflicted but nods slowly
security_guard: Alright. Go ahead. But I'm logging this.

+ [Investigate Further] -> phase_8_edge_cases
+ [Conclude Test] -> ending

=== phase_8_edge_cases ===
~ test_phase = 8
PHASE 8: Edge Cases & Stress Testing

// Multiple consecutive narrator lines
Narrator: The tension builds.
Narrator: Everything is at stake.
Narrator: Time seems to slow down.

// Multiple consecutive same speaker
Player: I need answers.
Player: Real answers.
Player: Not more evasions.

// Rapid background changes
Background[room-a.png]: Location: Room A
Background[room-b.png]: Location: Room B
Background[room-c.png]: Location: Room C

// Mixed speakers after backgrounds
scientist: The data is clear.
security_guard: But the implications are severe.
Player: We need to act fast.
Narrator: The three of you exchange worried glances.

+ [Conclude] -> ending

=== ending ===
~ test_phase = 9
All test phases completed!
Total phases run: {test_phase}

Thank you for testing the line prefix speaker format implementation.
The dialogue system should now support:
✓ Line prefix format (Speaker: Text)
✓ Narrator mode (Narrator: Text)
✓ Narrator with character (Narrator[char]: Text)
✓ Background changes (Background[file]: Text)
✓ Multi-speaker dialogue
✓ Mixed format compatibility
✓ Edge case handling

Test complete.
-> END
