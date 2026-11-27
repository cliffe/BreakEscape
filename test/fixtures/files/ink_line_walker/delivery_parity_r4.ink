// Parity fixture (review R4): a #delivery: tag that prints a value, and a one-line conditional
// followed by a divert. The walker must never give a line a note the client does not send with
// it; it may drop a note (dialoguelint warns: delivery-note or delivery-unread).
//   bin/inklecate -o test/fixtures/files/ink_line_walker/delivery_parity_r4.json test/fixtures/files/ink_line_walker/delivery_parity_r4.ink
VAR flag = false
VAR mood = "loud"
-> hub
=== hub ===
Kevin Park: Hub.
+ [Into a dynamic note]
  #delivery: outer
  -> dyn_a
+ [Two notes, the last dynamic]
  -> dyn_b
+ [Dynamic above a divert]
  #delivery: static first
  #delivery: {mood}
  -> plain_target
+ [Dynamic then a maybe]
  -> dyn_maybe
+ [Maybe then a divert]
  #delivery: outer k
  -> k
+ [Maybe with its own note]
  -> km
+ [Thread with an argument]
  #delivery: before thread arg
  <- talky(1)
  Kevin Park: After thread arg.
  -> DONE
+ [Leave]
  -> END
=== dyn_a ===
Kevin Park: A first. #delivery: {mood}
-> hub
=== dyn_b ===
Kevin Park: B line. #delivery: soft #delivery: {mood}
-> hub
=== plain_target ===
Kevin Park: Plain target.
-> hub
=== dyn_maybe ===
#delivery: before maybe
{flag: Kevin Park: Dyn maybe.}
Kevin Park: After dyn maybe. #delivery: {mood}
-> hub
=== k ===
#delivery: own k
{flag: Kevin Park: K maybe.}
-> b
=== km ===
{flag: Kevin Park: KM maybe.} #delivery: own km
-> b
=== b ===
Kevin Park: B first.
-> hub
=== talky(n) ===
Kevin Park: Talky arg first.
+ [Back] -> hub
