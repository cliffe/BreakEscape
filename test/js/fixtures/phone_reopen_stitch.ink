// Fixture for test/js/phone-reopen-stitch.test.mjs.
// `scene.albion` is a stitch whose knot top does not divert to the hub, as the
// m09 identity scene is. `start` diverts to `hour_read` once `flag` lands, as the
// m09 start does through its support hub. `hub` is a resting knot reached from
// `hour_read`.
VAR flag = false
VAR scene_done = false
VAR hour_read_done = false
VAR extra = false

=== start ===
{ flag and scene_done and not hour_read_done:
    -> hour_read
}
-> hub

=== hub ===
Agent: What now?
+ {not scene_done} [The scene.]
    -> scene
+ [Bye.]
    -> DONE

=== scene ===
-> albion
= albion
Agent: Albion talk.
~ scene_done = true
+ [Understood.]
    Agent: Good.
    -> DONE
+ {extra} [One more thing.]
    Agent: Go on.
    -> DONE

=== hour_read ===
Agent: Hour read line.
~ hour_read_done = true
-> hub
