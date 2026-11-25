// Test fixture (E5): sets the marker globals that flipDefenderLineByGlobal reads.
// Plain test text, not teaching content. Talk to the tester before running the episode.

VAR tcf_marker_a = false
VAR tcf_marker_b = false

=== start ===
Tester: Test line. Pick a marker for the flip.
-> hub

=== hub ===
+ [Set marker A.]
    #set_global:tcf_marker_a:true
    Tester: Marker A is set.
    -> hub
+ [Set marker B.]
    #set_global:tcf_marker_b:true
    Tester: Marker B is set.
    -> hub
+ [Clear both markers.]
    #set_global:tcf_marker_a:false
    #set_global:tcf_marker_b:false
    Tester: Both markers are clear.
    -> hub
+ [Done.]
    #exit_conversation
    -> END
