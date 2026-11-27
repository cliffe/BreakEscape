# m03 pass 2 — blind playtest A3 ("do your best"), partial

Game 2191, headless, 2026-10-12, after the blind-run fixes (d8e17ab4). Saved by the orchestrator from the tester's final message: a refused tool call (an eval pasting text into CyberChef) stopped it at about 65%, in the executive office with the Hidden USB found but not decoded. Not reached: safe PIN, Victoria's computer, roster, call-in, confrontation, debrief, credits. No verify-run output. Session log `tools/playtest/m03-blind-a3-session.jsonl`.

## What the run confirmed
- Clone retry fix works: a dropped read offered "Drift back to the whiteboard" at once and finished after three more questions; the "Halfway" / "A few seconds more" lines helped.
- The night-turn wording works: HaX's toast said stepping into the hallway ends the day.
- Reload after Danny: state held, Danny not replayed; respawn in reception (known backlog item).
- Conversation backgrounds for Ffion (day), Victoria (day), Danny (night) all matched.
- No stuck moment longer than a minute or two; tasks, notes and toasts led the way.

## Decisions
Approach choice reads as flavour; Victoria's NHS question arguable ("Wanting both. Honest, at least. It won't make you rich."); pressing her on hospitals arguable; Danny's three options arguable, but his follow-up "Sterling goes down for her part…" is a single-option choice; the objectives "Decide Danny Foster's fate" and "Settle Victoria's fate" pre-announce the decisions.

## Best lines
Danny "Security-awareness training at a healthcare client. Her exact words. I even believed the invoice." · Narrator "A man is sitting in the dark with his coat on, as if he has been about to leave for hours and hasn't managed it." · Danny's notes "…if I do, I'm the man who drew the map." · Victoria "Everyone asks that in their first week. Nobody asks it in their second." · Victoria "Competent is cheap. That's not why you're here."

## Worst lines
Ffion names "Zero Day" aloud at the front desk · Victoria "Entropy, if you like." (non sequitur after "Neither") · Victoria "You keep looking at that board." when the player hadn't · Victoria's "Excuse me, I need to take this." twice on advancing · Danny's folder note editorialises ("…with Sterling's lie about the client sitting right underneath it").

## Scores (provisional, ~65%)
Fun 4 · Pacing 3 · Clarity 4 · Openness 3 · Teaching 4

## Severity (0 blockers, 0 majors, 10 minors)
| # | Finding |
|---|---|
| 1 | Reload respawns in reception (backlog). |
| 2 | Ffion and Victoria in the building at night (both by design: Ffion's charger scene; Victoria's confrontation). |
| 3 | "You keep looking at that board." plays when the player never looked. |
| 4 | Transaction log: the 15% affiliate discount is listed as applied, but TOTAL $55,000 is the plain sum; HaX says "twenty-five thousand on the invoice". |
| 5 | Decision objectives shown before the conversations. |
| 6 | Danny's follow-up is a single-option choice. |
| 7 | VM terminal panel ("Start your VM in VirtualBox… 192.168.100.3") clashes with "isolated network, only from this terminal". |
| 8 | Terry never reacted to the player walking in his cone (by design today; the user has just asked for night-time on-sight challenges). |
| 9 | The Training Lab Runbook (VM hints) sits in a cabinet found after the VM work. |
| 10 | Harness: `interact` reports no-effect for display dialogs that do open. |
