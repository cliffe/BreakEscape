# Slice 5 R5 delta review (14fadcc16)

Counts: B 0 / M 0 / m 0 / n 2

Reviewed 14fadcc16 (R4 m1 and n1) against ama_phone.ink/json, the plan and SLICE5_R4_REVIEW.md. Nothing edited. Driver scripts ran on scratch copies of the compiled JSON (the committed JSON equals a fresh inklecate compile of the .ink).

## Checks

1. W14 planted variant, w = 17: pass.
   - Planting between two asks (first ask unplanted, then `ap_planted` set): the second answer is "The access point's in..." with no skip line.
   - First ask with `ap_planted` already true: tail still gives the skip line once (`told_skip` was false), as intended.
   - Real repeat ask at the planted variant (two asks, nothing changes): skip line shows both times (`w == last_w`).
   - Unplanted repeat still shows it too (w = 14 twice).
   - `last_w` reads 17 after the planted variant. Over 4000 random flag sets, 3 asks each: no ink warnings or errors, `last_w` always within 0 to 17 (random max reached 13; 14 and 17 were covered by the targeted runs above). The plan note now says "0 to 17".
2. W6b keyring text: pass. "If you're signed in at the front desk again, sign out. Then connect from your keyring." reads as a plain phone text in Ama's voice, UK English, no dashes, no `{var}`. It occurs once in scenarios/ (ama_phone.ink) and once in the JSON compile; the plan row (line 371) matches word for word. The second W6b variant (no `has_julian_rdp`) is unchanged and shares only the clause "connect from your keyring", not a full sentence.
3. Hub regression (two "Where next?" asks each):
   - fresh: "Kit first..." both times, no skip line, `last_w` 0.
   - short: W11 with the skip line, repeated.
   - full: W8 "You've got the codes..." with the skip line, repeated.
   - unplugged: W12 (Yasmin) with no skip line, as designed.
   - lost via Desktop Connect (has_julian_rdp): new W6b text, then tail and skip line, repeated.
   - lost via Copy (no has_julian_rdp): "To get it back through the box..." variant plus skip line.
   - all done: "That's the lot. Come and find me at reception."

## Findings

- n1. Numbering: the plan table already uses "W17" for the unplug line ("When you've had enough, pull the box out..."), which sets no `w`. The planted W14 variant now uses `w = 17` in code, so "w = 17" and "W17" mean different lines. No behaviour effect (the unplug line never sets `w`, so no collision on `last_w`). A one-clause note in the plan ("the planted W14 variant uses w = 17; the unplug line W17 sets no w") would remove the ambiguity. Optional.
- n2. The W6b with-RDP text says "If you're signed in at the front desk again, sign out". This is conditional by design and fine. It is shown when `julian_lost_with_desk` is true and the player has since signed back in or not; both readings work. No change needed.

Nothing here would visibly break a live demo.
