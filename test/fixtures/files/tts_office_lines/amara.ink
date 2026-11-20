// V6 fixture (tts_office_lines_test.rb): an exchange knot with a #delivery: tagged line, a call
// knot, and a person-chat line that repeats a chatter pool line word for word.
=== start ===
# speaker:npc
Kettle on.
-> END

=== exchange_tom_parcel ===
Tom: Was that parcel on the floor for you?
Amara: It was. New headsets for the team. #delivery:whispering
-> DONE

=== call_take_message ===
Amara: Tom's desk. He's out, can I take a message?
-> DONE
