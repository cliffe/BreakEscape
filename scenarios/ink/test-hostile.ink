// test-hostile.ink - Test hostile tag system

=== start ===
# speaker:test_npc
Welcome to hostile tag test.
-> hub

=== hub ===
+ [Test hostile tag]
    -> test_hostile
+ [Test exit conversation]
    -> test_exit
+ [Back to start]
    -> start

=== test_hostile ===
# speaker:test_npc
Triggering hostile state for security guard!
# hostile:security_guard
# exit_conversation
-> hub

=== test_exit ===
# speaker:test_npc
Exiting cleanly.
# exit_conversation
-> hub
