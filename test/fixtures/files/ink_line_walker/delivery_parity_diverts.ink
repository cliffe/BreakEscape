// Delivery notes carried across diverts, for the inkjs parity test. Recompile with:
//   bin/inklecate -o test/fixtures/files/ink_line_walker/delivery_parity_diverts.json test/fixtures/files/ink_line_walker/delivery_parity_diverts.ink
-> hub
=== hub ===
Kevin Park: Where to?
+ [Tagged way in]
  #delivery: wary
  -> shared
+ [Plain way in]
  -> shared
+ [To a stitch]
  #delivery: to the stitch
  -> other.second
+ [Before a choice]
  #delivery: lost before a choice
  -> chooser
+ [Logic first]
  #delivery: past the logic
  -> logic_first
+ [Own note wins]
  #delivery: overridden
  -> own_note
+ [Leave]
  -> END
=== shared ===
Kevin Park: The shared line.
Kevin Park: After the shared line.
-> hub
=== other ===
= first
Kevin Park: First stitch.
-> hub
= second
Kevin Park: Second stitch.
-> hub
=== chooser ===
+ [Pick] Kevin Park: Picked.
  -> hub
=== logic_first ===
~ temp n = 2
Kevin Park: After a little logic.
-> hub
=== own_note ===
Kevin Park: My own note. #delivery: own
-> hub
