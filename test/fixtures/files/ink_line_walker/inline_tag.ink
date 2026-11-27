// Fixture for ink_line_walker_test.rb "an inline {cond: text #tag} ...": the form the walker skips.
VAR on = true
=== start ===
Before line.
{on: Hello there. #delivery: hushed}
After line. #delivery: calm
{on: Another one. #delivery: loud|Else line. #delivery: soft}
Safe form. {on: Yes.} #delivery: fine
Last line.
-> END
