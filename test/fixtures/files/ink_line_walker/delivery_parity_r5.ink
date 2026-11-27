// Parity fixture (review R5): a #delivery: tag holding a conditional or a sequence, a static
// prefix before a conditional, a tag whose name is printed (#{t}), a dynamic tag in a redirect
// knot, before a non-delivery tag, on a choice line and in a tunnel above a line that may print
// nothing. The walker must never give a line a note the client does not send with it; it may
// drop a note (dialoguelint warns: delivery-note or delivery-unread).
//   bin/inklecate -o test/fixtures/files/ink_line_walker/delivery_parity_r5.json test/fixtures/files/ink_line_walker/delivery_parity_r5.ink
VAR flag = false
VAR mood = "loud"
VAR t = "delivery: shout"
-> hub
=== hub ===
Kevin Park: Hub.
+ [A]
  -> a
+ [B]
  -> b
+ [C]
  -> c
+ [D]
  -> d
+ [E]
  #delivery: outer e
  -> e
+ [F]
  #delivery: outer f
  -> f1
+ [G]
  -> g
+ Kevin Park: Pick static. #delivery: picked
  -> hub
+ Kevin Park: Pick dyn. #delivery: calm #delivery: {mood}
  -> hub
+ [Tun]
  #delivery: carried
  -> tun ->
  -> hub
+ [Leave]
  -> END
=== a ===
Kevin Park: A cond tag. #delivery: calm #delivery: {flag: loud|soft}
-> hub
=== b ===
Kevin Park: B seq tag. #delivery: calm #delivery: {~one|two}
-> hub
=== c ===
Kevin Park: C prefix cond. #delivery: calm #delivery: soft {flag: and loud}
-> hub
=== d ===
Kevin Park: D whole dyn. #delivery: calm #{t}
-> hub
=== e ===
#delivery: {mood}
Kevin Park: E own after dyn. #delivery: own e
-> hub
=== f1 ===
#delivery: {mood}
-> f2
=== f2 ===
Kevin Park: F chain.
-> hub
=== g ===
Kevin Park: G dyn then plain tag. #delivery: {mood} #speaker: x
Kevin Park: G next line.
-> hub
=== tun ===
#delivery: {mood}
{flag: Kevin Park: Tun maybe.}
Kevin Park: Tun line.
->->
