// test_phone_calls, contact legacy_voiced
VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Legacy here.
+ [Anything new?]
    Nothing yet. Text me when it matters.
    -> start

=== legacy_call ===
// lint: call-knot
This is a legacy voiced call with no ring. It opens at once.
+ [Carry on.]
    Carrying on. The line stays open.
    -> DONE
