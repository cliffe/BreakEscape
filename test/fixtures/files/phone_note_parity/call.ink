// Fixture for the client/server note parity tests (A1 R1 m2): test/js/phone-call-note-parity.test.mjs
// and test/unit/break_escape/tts_phone_note_parity_test.rb. A voiced call's notes, read by the client
// (InkEngine.continue + deliveryFromTags) and by the extractor (TtsLineExtractor), must agree.
VAR x = 1

=== start ===
Plain opening.
{x == 1: Conditional line.} #delivery: dry
#delivery: from the line above
Line with a note above.
-> tun ->
After the tunnel. #delivery: back again
Glued part one <>
 and part two. #delivery: glued note
{x == 1:
    Block line one.
    Block line two. #delivery: block end
}
-> next_knot

=== tun ===
In the tunnel. #delivery: echoing
->->

=== next_knot ===
Diverted line. #delivery: crisp
Closing line.
-> END
