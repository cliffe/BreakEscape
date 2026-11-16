# m03 office life plan: review R1 (design fit)

Plan reviewed: `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` at 5640d290b.

Counts: **B0 M4 m8**

Context for this round: the user has since chosen scope (b) (D52) and asked for the two staff to be cyber awareness course characters reused as extras (D53). The rewrite carries that cast change; the findings below are about design fit and apply to whichever pair is cast.

## Major

M1. Post fit. An office manager sitting in a waiting-area club chair with nothing to do does not read as staff; it reads as a visitor. Each staffer needs a diegetic reason to be in reception by day (plan section 2, people table). Outcome: fixed. With the new cast, the field engineer hot-desks on the sofa with her laptop between client jobs, and the senior consultant waits in the club chair for a client who is late. Both reasons are stated in the plan and in one line of each conversation.

M2. The Ffion knock-out response uses a bare `needs: "suspend"`, which freezes a staffer where it stands, possibly mid-walk in the reception to hallway doorway or in the hallway (section 2, "Ffion knocked out by day"). That looks like a bug and can block the doorway the player needs. Outcome: fixed. The mapping sends each staffer home with `patrolOverride.targetTile` to its post and holds it there; scripts suspend needs, so no separate suspend is needed.

M3. `ex_danny` (section 6): "His car's in the car park most nights" places Danny at night and pre-empts his night reveal, and its gate was written as an unverified bare string. Outcome: fixed. The line is replaced by one that matches the scenario's "out at client sites" text, and all three exchanges use the object form of `requireGlobal` (the form m02 uses) with the attack, witness and KO globals false. `reception_badge_cloned` exists (`scenario.json.erb:729`, default `false` at `:2046`).

M4. Laptop lore (section 4): "Victoria telling staff the back corridor is out of bounds after six" invents layout and points the player at night timing and a route. Outcome: fixed. The message becomes a plain client-data rule with no place or time in it; the after-hours question stays as colour.

## Minor

m1. Gloria says "love" in three pool lines and two exchange lines; a tic. Outcome: fixed by the cast change (all lines rewritten for the new speakers).

m2. "Hydrate or die-drate, innit." does not land. Outcome: fixed (rewritten).

m3. "Lovely day out there, mind." asserts weather the mission never shows. Outcome: fixed (removed).

m4. The plan never says whether the staff know what the firm is. The ending asks what happens to "the people who made that night"; innocent staff in the lobby should be stated as unaware so no ending text needs to change. Outcome: fixed (section 2).

m5. Both new sprites wear lanyards. A player may try to clone a staffer's badge. Outcome: fixed. Each conversation closes this in-world ("visitor passes are Ffion's job"); no clone choice, no card item.

m6. "Ms Sterling" against Ffion's "Ms. Sterling". Outcome: fixed (follow the scenario's form).

m7. An exchange draft ran to 42 characters with an unchecked claim that exchange lines are exempt from the 40-character limit. Outcome: fixed (all exchange lines kept to 40).

m8. HaX's witness text says "Two witnesses" even when one staffer is at the hallway cooler. Outcome: fixed (text no longer counts them).
