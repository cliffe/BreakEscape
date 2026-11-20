// Fixture for test/js/ending-check-before-choice.test.mjs: a debrief hub whose
// "Walk me through it." choice carries #ending_check inside its brackets, so the chat
// asks before the choice is taken (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 8a).
-> start

=== start ===
Ruth: Ready when you are.
-> hub

=== hub ===
+ [Walk me through it. #ending_check]
    -> debrief
+ [Not yet.]
    Ruth: Take your time.
    -> hub

=== debrief ===
Ruth: Start with the front door.
-> END
