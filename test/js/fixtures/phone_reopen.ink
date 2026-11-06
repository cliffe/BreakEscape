// Fixture for test/js/phone-reopen-and-persistence.test.mjs (E10/E13).
// `hub` has leading text and a tag (both seen on the first visit), then a state
// re-check that diverts to new content, then the choices.
VAR flag = false
VAR reacted = false
VAR extra_option = false
VAR hub_visits = 0

=== start ===
-> hub

=== hub ===
~ hub_visits = hub_visits + 1
Agent: What do you need? #note:leading
{flag and not reacted: -> react}
- (opts)
+ [Option A]
    Agent: A.
    -> hub
+ {extra_option} [Extra option]
    -> hub
+ {flag} [About the find]
    -> hub

=== react ===
~ reacted = true
Agent: You found it. #complete_task:report_find
Agent: Good work.
-> hub.opts
