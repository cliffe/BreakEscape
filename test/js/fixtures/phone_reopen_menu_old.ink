// Old layout: each submenu keeps its choices in the knot itself (no `menu` stitch).
VAR flag = false
VAR from_hub = false
VAR ticks = 0

-> hub

=== hub ===
Hub line.
+ [Elsewhere] -> hub

=== ok ===
~ from_hub = false
+ {not flag} [Old hint] -> hub
+ {flag} [New hint] -> hub
+ [Never mind.] -> hub

=== msg ===
~ from_hub = false
Menu header. #hdr
+ [Option A] -> hub
+ [Never mind.] -> hub

=== badtext ===
~ from_hub = false
+ [Old wording] -> hub
+ [Never mind.] -> hub

=== diverts ===
~ from_hub = false
+ [Option A] -> hub
+ [Never mind.] -> hub

=== mixed ===
~ from_hub = false
+ [Option A] -> hub
+ [Never mind.] -> hub

=== pre ===
~ from_hub = false
+ {not flag} [Old hint] -> hub
+ {flag} [New hint] -> hub
+ [Never mind.] -> hub

=== nomenu ===
~ from_hub = false
+ [Option A] -> hub
+ [Never mind.] -> hub
