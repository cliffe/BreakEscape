// Fixture for tts_phone_text_variables_test.rb. Text knots print the player's name; call knots do not.
VAR player_name = "Agent"

=== start ===
Hello {player_name}, text me.
+ [Thread]
    Texting {player_name} here.
    -> start

=== call_clean ===
Good, you are there.
-> DONE

=== call_prints ===
Good evening, {player_name}.
-> DONE

=== call_reaches ===
Listen carefully.
-> reached

=== reached ===
Right, {player_name}.
-> DONE
