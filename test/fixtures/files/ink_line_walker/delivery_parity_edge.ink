// Delivery-note parity with inkjs (review R1 M2), the reviewer's first scratch ink. Recompile with:
//   bin/inklecate -o test/fixtures/files/ink_line_walker/delivery_parity_edge.json test/fixtures/files/ink_line_walker/delivery_parity_edge.ink
VAR flag = true
VAR count = 0
-> start
=== start ===
Kevin Park: Opening. 
#delivery: softly
-> b
=== b ===
Kevin Park: Hello from b.
#delivery: crisp
{flag: Kevin Park: Conditional line.}
Kevin Park: Part one <>
and part two. #delivery: glued
Kevin Park: You have {count} items. #delivery: counting
~ count = count + 1
#delivery: above logic
~ temp x = 1
Kevin Park: After logic.
+ [Ask] 
  Kevin Park: Answer. #delivery: answering
  -> c
=== c ===
#delivery: at knot top
Kevin Park: In c.
Kevin Park: Plain end.
-> END
