# CA12 t11 (defend queue) masks

Dry-run of `tools/video/takes/ca12/t11_defend_queue.mjs`, 22 Nov 2026, headless, two fresh games, both runs reached the end.
Body 15.3 s (marks run 0.00 to 15.28 s; setup of about 8.2 s happens off camera). Frame is 1920x1080, the kiosk window is centred.
Times are seconds from the body start (the first mark, `panel-queue`).

## Script change (follow-up to the first draft)

The draft opened "Unknown visitor" first. Its card reads "(slips in behind a badge-holder at the gate and heads for the stairs)",
which is the tailgater tell, so it is out. "Signed-in visitor" ("having a good look" at an open screen) is also never opened.
The take now opens Visitor with a clipboard, Courier, then Colleague back from leave. Each of those cards has one verdict line
("Today's list" or "Staff list") that says whether the person is expected; those lines are the masks below.

## Timeline

| s | event |
|---|---|
| 0.00 | "Take the calls" panel, Open the queue button |
| 1.50 | click Open the queue, navy Brief screen up to about 2.8 |
| 2.81 | click Start, list of six visitors, right pane reads "Select a message to read it." (no spoiler) |
| 4.43 | card 1 up: Visitor with a clipboard ("Visitor in hi-vis, wants the comms room") |
| 7.16 | card 2 up: Courier ("Courier with a parcel") |
| 9.90 | card 3 up: Colleague back from leave ("Staff member back from leave, no badge") |
| 12.04 | mouse passes over the four buttons of card 3, hover only |
| 15.28 | end, nothing pressed |

First frame at which each card is up: card 1 at 4.43 s (click; fully drawn by the next frame), card 2 at 7.16 s, card 3 at 9.90 s.
Every card is readable from its click time to the next click. Mask windows start at the click and add 0.1 s either side.

## Masks (source pixels, x y w h)

| id | x | y | w | h | window | covers |
|---|---|---|---|---|---|---|
| m1 | 850 | 350 | 548 | 78 | 4.33 to 7.26 | card 1 "Today's list" line (3 text rows: "No fire-safety inspection booked today..."). Measured rect 853,352,531x72 |
| m2 | 850 | 374 | 548 | 54 | 7.06 to 10.00 | card 2 "Today's list" line (2 rows: "No parcels booked..."). Measured 853,376,531x48 |
| m3 | 850 | 350 | 548 | 30 | 9.80 to 15.28 | card 3 "Staff list" line (1 row: "Back from leave today. On the staff list."). Measured 853,352,531x24 |
| b1 | 832 | 454 | 570 | 182 | 4.33 to 10.00 | four action buttons on cards 1 and 2 (measured 835,457,563x175) |
| b2 | 832 | 406 | 570 | 182 | 9.80 to 15.28 | four action buttons on card 3, which sits 48 px higher (measured 835,409,563x175) |

The Today's list / Staff list line is the only verdict on screen: it gives the answer to "who is genuine" (expected, not booked,
on the list). The dialogue lines above it are the visitors' pretexts and are not a verdict, so they stay visible.

The button masks follow t08. They are optional here: the buttons show only their own labels and icons (tick, warning, cross,
question mark), which are the same on every card and say nothing about this visitor. Dropping b1 and b2 keeps the "four choices"
beat on screen and leaves no spoiler. Hover only brightens the button under the mouse.

Where the masks sit when stacked into the Remotion edit: mask rects use these source coordinates directly, so a shot that crops
or scales the take frame needs the same transform applied to them.

## Frames read (both runs, `frame:` marks and the end frame)

No verdict, reason panel, score, tell or answer to which visitor is genuine shows once m1 to m3 are in place. No tooltip appears on
hover. The left list shows orange unread dots only, and "0 of 6 sorted" and "Visitors reported or checked for the team: 0" stay at
zero (nothing is pressed). Left list names ("Unknown visitor", "Expected client", "Signed-in visitor") are visible in the list on
every card; they are plain role labels, not tells, though "Expected client" is mildly suggestive.

Dry-run caveat: the `frame:` screenshots are taken asynchronously, so the `frame:brief-screen` and `frame:list` images can show the
state one beat later than their mark (the first run's brief-screen image already showed the list). Mark times are right; judge
the exact first frame of each card from the click marks above.
