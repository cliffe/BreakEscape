# test_ca_flip_by_global (E5: flipDefenderLineByGlobal)

Start room: `ep_room` (kiosk, Host, Tester). Mail attack, so the flip can take the replay, missed and landed-no-tells paths. Stub content; all lines are test text.
Entries, in order (first truthy global wins):

1. `tcf_marker_b`: "Test line B: marker B was set." with heading "Test heading B"
2. `tcf_marker_a`: "Test line A: marker A was set." (no heading)
3. `phish_supplier_contact_landed`: "Test line L: the message landed and no marker was set."

Fallbacks when nothing matches: `flipDefenderLine` "Fallback defender line: nothing matched.", `flipMissed` "Generic missed text: no marker matched." under "Generic missed heading", `flipLandedNoTells` "Generic landed-no-tells text: no marker matched."

What to click:

1. Click the Tester (left side, lower) and choose "Set marker B" (or A, or "Clear both markers"), then "Done."
2. Kiosk: Begin the brief, the osint stage (close the browser), then write and send one email.
3. At the flip, read the line with class `aw-defender-line`. Expected: with B set, line B and heading "Test heading B". With A only, line A. With both, B wins (list order).
4. Missed path: send a message that does not land (expected: pick the canteen subject, which is off the target's finance interest). Expected: the matching entry's line replaces the missed text; heading B replaces "Generic missed heading" only when entry B matched; an entry with no heading (A) keeps the generic heading. With no marker set the generic missed text shows.
5. Landed-no-tells path: send a careful message (expected: invoice subject with the invoice pretext). With no marker set, the entry on `phish_supplier_contact_landed` shows. With a marker set, the marker line wins. Entries are read on this path too (class `aw-defender-line aw-landed-no-tells`).
6. Tell-bearing replay: if the send shows a replay with tells, the same entry choice applies to the defender line below it.

Which message lands, and whether it lands with or without tells, is inferred from the target's settings, not seen live. Check it in the live proof and adjust step 4 and 5 if the paths swap.

Status: validated only (0 errors). Not yet run in a browser.
