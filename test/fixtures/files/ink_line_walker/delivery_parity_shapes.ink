// Parity fixture (review R2 m1): a #delivery: note carried into a tunnel, a knot
// with only stitches, a divert chain, and a knot whose first line is conditional.
VAR flag = false
VAR flag_on = true
-> hub
=== hub ===
Kevin Park: Where?
+ [Stitched knot]
  #delivery: into stitched
  -> stitched
+ [Tunnel]
  #delivery: via tunnel
  -> tun ->
  Kevin Park: Back from tunnel.
  -> hub
+ [Cond first]
  #delivery: past false cond
  -> condfirst
+ [Cond first, true]
  #delivery: onto true cond
  -> condon
+ [Cond here]
  #delivery: over a false line
  {flag: Kevin Park: Hidden line.}
  Kevin Park: Shown line.
  -> hub
+ [Relative stitch]
  -> rel
+ [Divert chain]
  #delivery: chained
  -> chain1
+ [Chain to stitches]
  #delivery: chain then stitch
  -> chain_to_stitched
+ [Leave]
  -> END
=== stitched ===
= one
Kevin Park: Stitch one line.
-> hub
=== tun ===
Kevin Park: In the tunnel.
->->
=== condfirst ===
{flag: Kevin Park: Only if flag.}
Kevin Park: Always here.
-> hub
=== condon ===
{flag_on: Kevin Park: Flag is on.}
Kevin Park: After the flag line.
-> hub
=== rel ===
Kevin Park: Rel start.
#delivery: to sibling
-> two
= two
Kevin Park: Rel two.
-> hub
=== chain1 ===
-> chain2
=== chain2 ===
Kevin Park: End of chain.
-> hub
=== chain_to_stitched ===
-> stitched2
=== stitched2 ===
= first
Kevin Park: Stitch two first line.
-> hub
