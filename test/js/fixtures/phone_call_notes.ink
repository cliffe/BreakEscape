// Fixture for test/js/phone-call-notes-paths.test.mjs (A1 R1 M1): a voiced call's preloaded
// opening and its reopen re-run carry each line's #delivery: note.
VAR flag = false
VAR seen = false

=== start ===
Agent: Opening line. #delivery: calm and low
Agent: Second line, no note.
+ [Go on] -> hub

=== hub ===
Agent: Hub. -> DONE

=== call ===
Agent: Before the change. #delivery: hushed
- (opts)
{flag and not seen: -> fresh}
+ [Carry on] -> DONE

=== fresh ===
~ seen = true
{flag: #delivery: firm}
Agent: Fresh line one.
Agent: Fresh line two. #delivery: urgent
Agent: Fresh line three.
-> call.opts
