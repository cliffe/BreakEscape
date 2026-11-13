# Writer log: M3 (m09 ink) and M9 (small wording)

## M3: scenarios/m09_digital_archaeology/ink/m09_phone_agent0x99.ink, knot `start`

Both lines are silent texts (the `start` knot is unvoiced). No audio keys move: the m09 key dump with and without this edit is identical.

| Line | Before | After | Voiced? |
|---|---|---|---|
| guard 1, a HaX scene pending (about :126) | Pick up. I'm ringing you. | One moment. Something's come in. | silent |
| guard 2, Recruiter's call pending (about :130) | Her call first. Take it when it rings. | Hear her out first. I'll be here after. | silent |

The comment above the guards was updated to say they never promise a ring. Read knots (`flag1_read`, `ledger_read`, `afterwards`, `hour_read`, `hour_read_resume`) were checked and need no change: nothing in them says the phone was forced open.

Lab sheet `HacktivityLabSheets/_labs/safetynet/m09_digital_archaeology.md:63`:
- Before: Agent HaX rings the dock a couple of seconds later.
- After: Agent HaX opens your phone with her first text a couple of seconds later.

The VM companion (`m09-digital-archaeology-vm-technical-steps.md`) was not opened.

## M9

| File | Before | After | Voiced? |
|---|---|---|---|
| scenarios/lab_physical_pentest/ink/ruth.ink:72 | Ruth Adeyemi: Call me on the phone if you get stuck. I'll be waiting inside. | Ruth Adeyemi: Message me on the phone if you get stuck. I'll be waiting inside. | voiced (person-chat), 1 re-key |

sis02 (`npc_marcus_webb.ink`, `npc_tom_hadley.ink`): no change. Every "ring" is a text about a call happening elsewhere (Marcus or Tom ringing a third party, Tom ringing Marcus). Nothing reads as a call inside the thread.

sis03 (`npc_james_whitworth.ink`, `npc_simon_hartley.ink`, `npc_robert_ngata.ink`): no change. The `call_initial` prose and the rest read as statements in a thread, with no meeting or call framing. Remaining "call" uses are idioms ("that's your call") or a renewal meeting in the past.
