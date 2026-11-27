// Parity fixture (review R3): shapes where a carried #delivery: note meets a tunnel return,
// another note on the way, or a thread. The walker must never give a line a note the client
// does not send with it; it may drop a note (dialoguelint warns: delivery-unread).
//   bin/inklecate -o test/fixtures/files/ink_line_walker/delivery_parity_r3.json test/fixtures/files/ink_line_walker/delivery_parity_r3.ink
VAR flag = false
VAR g = false
VAR x = 0
-> hub
=== hub ===
Kevin Park: Which way?
+ [Maybe tunnel]
  #delivery: into maybe tunnel
  -> maybe_tun ->
  Kevin Park: Back from the maybe tunnel.
  -> hub
+ [Logic tunnel]
  #delivery: into logic tunnel
  -> logic_tun ->
  Kevin Park: Back from the logic tunnel.
  -> hub
+ [Tagged chain]
  #delivery: outer chain
  -> chain_a
+ [Tagged maybe]
  #delivery: outer maybe
  -> tagged_maybe
+ [Second maybe tagged]
  #delivery: outer second
  -> second_maybe
+ [Nested tunnel]
  #delivery: outer nested
  -> nest_a ->
  Kevin Park: Back from the nested tunnel.
  -> hub
+ [Tunnel with an argument]
  #delivery: outer argument
  -> arg_tun(2) ->
  Kevin Park: Back from the argument tunnel.
  -> hub
+ [Thread]
  #delivery: before thread
  <- talky
  Kevin Park: After the thread.
  -> DONE
+ [Into a thread]
  #delivery: into threaded
  -> threaded
+ [Leave]
  -> END
=== maybe_tun ===
{flag: Kevin Park: Maybe in the tunnel.}
->->
=== zed ===
Kevin Park: First line of the next knot.
-> END
=== logic_tun ===
~ x = x + 1
->->
= extra
Kevin Park: An extra stitch.
->->
=== chain_a ===
#delivery: inner chain
-> chain_b
=== chain_b ===
Kevin Park: End of the tagged chain.
-> hub
=== tagged_maybe ===
#delivery: own maybe
{flag: Kevin Park: Tagged maybe line.}
Kevin Park: After the tagged maybe.
-> hub
=== second_maybe ===
{flag: Kevin Park: First maybe line.}
#delivery: own second
{g: Kevin Park: Second maybe line.}
Kevin Park: After two maybes.
-> hub
=== nest_a ===
-> nest_b ->
Kevin Park: After the inner return.
->->
=== nest_b ===
#delivery: in nest b
->->
=== arg_tun(n) ===
Kevin Park: Inside the argument tunnel.
->->
=== threaded ===
<- opts
Kevin Park: After the threaded options.
-> DONE
=== opts ===
+ [Back] -> hub
=== talky ===
Kevin Park: Talky opens.
+ [Back again] -> hub
