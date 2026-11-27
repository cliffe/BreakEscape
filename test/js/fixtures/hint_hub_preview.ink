// Fixture: a looping phone hint hub (lab ruth_phone shape). The hub routes to
// the stage the globals point at; each stage re-checks itself on entry.
VAR stage_one_done = false
VAR stage_two_done = false

=== start ===
-> hub

=== hub ===
{
- not stage_one_done: -> stage1
- not stage_two_done: -> stage2
- else: -> stage3
}

=== stage1 ===
{ stage_one_done: -> hub }
Ruth: On the sheet still?
+ [Where do I start?]
    Ruth: The board.
    -> stage1
+ [Thanks.] #exit_conversation
    Ruth: Go on.
    -> hub

=== stage2 ===
{ stage_two_done: -> hub }
Ruth: Recon's next. #note:stage2
+ [What am I looking for?]
    Ruth: Three people.
    -> stage2

=== stage3 ===
Ruth: That's the lot.
+ [Thanks.]
    -> stage3
