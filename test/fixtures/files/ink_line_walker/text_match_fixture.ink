// Lines for the TTS text-match tests (tts_text_match_test.rb): a plain line, a
// tagged line, a line printing player_name(), one printing game state, a glued
// line, narration, a line with an accented letter, and a string variable
// changed in play printed in a line and as a speaker prefix. Recompile with:
//   bin/inklecate -o test/fixtures/files/ink_line_walker/text_match_fixture.json test/fixtures/files/ink_line_walker/text_match_fixture.ink
EXTERNAL player_name()
VAR clue_count = 0
VAR visitor = "Sarah"
-> start

=== start ===
Kevin Park: The server room is down the hall.
Kevin Park: I suppose it doesn't matter now. #delivery: quietly, almost to herself
Kevin Park: On the line, {player_name()}.
Kevin Park: You found {clue_count} clues.
Kevin Park: The first half <>
and the glued half.
Narrator: The lights hum overhead.
Kevin Park: Meet me at the café at noon.
Kevin Park: Ask {visitor} at the front desk.
{visitor}: What can I help you with?
Narrator: The phone buzzes for {player_name()}.
~ visitor = "Tom"
~ clue_count = clue_count + 1
-> END

=== function player_name() ===
~ return "Agent"
