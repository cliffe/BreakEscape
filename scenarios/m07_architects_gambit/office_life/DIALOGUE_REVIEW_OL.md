# m07 office life: dialogue review of the new lines

Scope: the 28 new lines for `adaeze_okafor` and `gwen_pritchard` only (conversations, `ex_last_two`, `ex_going_now`, eight cooler pool lines). No existing line was reviewed or changed. Voice rule D113: both speak General American; the docs stay UK English.

Findings: B0 M0 m4. All four fixed.

## Checks

- Compile: 0 failed. Dialogue lint: no findings. loopcheck on both files: no runtime errors, hubs loop as a hub should.
- Validator: 0 errors (31 existing warnings, none from these NPCs). It did flag one exchange line over the 40-character bubble limit, a rewrite of my own fix; see m4.
- Attribution: every prefix is the exact displayName, matching m05 exchange convention. No `#speaker:` tags, no `You:` echo, no third-person choice labels, no tags needed (no influence, no globals set).
- Hub shape: `start` then `hub`, skip-once `hub_quiet` guard, one sticky exit choice, every chat closes on the goodbye or upset line. Exits are one line.
- Offering nothing: no key, clue, PIN, password, hint or route. They do not know the player (taken for a utility visitor). Coffee machine broken, consistent with the handover sheet; they drink water only.
- Story consistency (PLAN 1.1): no line says the building is empty; "like everybody else" is Adaeze describing the evacuation, not Park's vault claim. Nothing about Hollis, Elena, Mercer or Park.
- Pool lines: all 40 characters or fewer, no speaker prefix, openers distinct within each pool and against the hub openers.
- No em or en dashes. Rhythm varies (short flat answers after longer lines).

## Findings

| # | Sev | Line | Problem | Outcome |
|---|---|---|---|---|
| 1 | m | Adaeze pool 4 "Nearly done. Nearly." | Echoes her repeat line "I'm nearly done" and reads as the same beat | Fixed: "Almost there. Almost." |
| 2 | m | Gwen pool 2 "Tidy up and out, that's the plan." | Restates her opener "tidying up before I go" | Fixed: "Plan's simple: finish up, then out." |
| 3 | m | Gwen `ex_going_now` 3 "The fire marshal won't thank us for it." | "it" had no clear referent | Fixed: "The marshal won't thank us for staying." (39; "The fire marshal ... for staying" was 44 and failed the 40-character bubble check) |
| 4 | m | Same line, length | Intermediate rewrite exceeded the exchange limit | Fixed with finding 3 |

## Left as is, for the user

- The "leaving in a minute" intent lines (repeat lines, going-now exchange) stay true for an unbounded night only because the pair leave on the first server-room entry. A player who lingers on the ops floor hears them say it indefinitely. This is by design in PLAN 2; noted, not acted on.
- `ex_last_two` line 1 ("The muster board still has us missing.") stands alone; the pronoun is clear on the ops floor with the board in the checkpoint behind them.

Voicing: 28 clips still need voicing (10 conversation, 10 exchange, 8 pool). Three have changed text since SPOKEN_LINES.md was first drafted, all still unvoiced, so no audio is stale.

## Follow-up (build review R1, m1)

Gwen opener 1: "if something's playing up" changed to "if something's acting up" (American wording per D113). Ink recompiled; SPOKEN_LINES.md updated. Not yet voiced.
