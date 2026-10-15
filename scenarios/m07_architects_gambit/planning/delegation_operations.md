# m07 — Delegation Operations

> Renamed 2026-10-01: Jake Morrison → Ray Hollis (id jake_morrison → ray_hollis; ink m07_npc_jake_morrison → m07_npc_ray_hollis; globals morrison_* → hollis_*; item morrison_server_badge → hollis_server_badge). This document predates the rename and is not rewritten; see CONTRACT.md and PUZZLE_CHAINS_PLAN.md.

**Scope:** the three ENTROPY operations the player does *not* play. What the player is told about
them, what is actually true, what happens when the tactical team is sent, and what happens when it is
not.

**Authority:** `../PASS2_IMPROVEMENTS.md` and `../CONTRACT.md`. Companion to `mission_design.md`. Source detail mined from
`archive/stage_0_option_{b,c,d}_*.md`.

**Consumers:** the opening briefing ink (WP3), the Agent HaX hub (WP6), the closing debrief and
conditional credits (WP8).

---

## The rule this document exists to enforce

The player reads three briefs, sends one team, and abandons two operations. For that to be a decision
rather than a menu, three things have to hold.

**No option dominates.** Deaths tonight, the legitimacy of a national election, and the security floor
under every mission for the rest of the season. There is no exchange rate between them. Any player who
finishes the mission feeling they solved it arithmetically has been let down by the writing.

**The numbers are not neutral.** Every figure in the briefing came from ENTROPY. SAFETYNET's threat
desk did not derive them; they were captured, and they were captured because The Architect wanted them
captured. One of the three briefs is understated on purpose, and it is the one designed to look like
the option a serious professional deprioritises.

**Two operations always go dark.** Whatever the player does, the debrief reads out two failures with
names and numbers attached. The mission never lets the player buy their way clear of that, and Agent
HaX never tells them which to pick.

---

## State this document writes and reads

```
team_assignment    string   "" | "fracture" | "trojan_horse" | "meltdown"
team_assigned      bool
projection_revised bool     player learnt the Trojan Horse brief is understated
team_redirected    bool     player moved the team after finding out, before T-10
```

`team_redirected` is only ever true alongside `projection_revised`, and it always sets
`team_assignment` to `"trojan_horse"` — the redirect is not a free re-pick, it is one specific
correction the player earned. A redirect after T-10 is refused by the hub with a line from HaX, not
hidden from the menu; the player should see the door close.

**Campaign hook.** `season_1_arc.md:1056` makes this choice a campaign branch affecting M10 cell
presence and difficulty. That needs a persistent campaign-level global. Named here, out of scope for
m07.

---

## Operation Fracture

### Target

The federal election security data centre outside Washington D.C. It holds voter registration records
for 43 states — 187 million people — and brokers the API traffic between those records and the state
Secretary of State offices. Co-located in the same building, because someone signed off on a hosting
contract years ago and nobody revisited it, is a content distribution cluster now under Social Fabric
control.

The records carry names, addresses, Social Security numbers, voting history, party affiliation,
demographics, email and phone. Ghost Protocol operatives have been inside as IT contractors for
months and the exfiltration is already running.

### Cell and lead

**Ghost Protocol**, in partnership with **Social Fabric**.

Lead: **"Big Brother"** — Michael Reeves, fifteen years an NSA analyst before he decided that the only
honest response to mass surveillance was to make it undeniable. Cold, methodical, and convinced he is
performing a public service. He does not attend operations; he designs them and reads the results.

Social Fabric supplies the second half: pre-staged disinformation timed to land in the same hour the
breach becomes public. Fabricated fraud "evidence" built from the genuine stolen records, deepfaked
confessions from named election officials, bot amplification across every platform. The breach makes
the lie checkable. That is the design — the two halves are worthless apart and devastating together.

### The briefing projection *(shown to the player)*

> 187 million voter records exfiltrated. Identity theft wave projected at 4–8 million victims over five
> years, $12–24bn in individual fraud losses. Coordinated disinformation deploys on completion.
> Polling models put 40–60% of the electorate believing subsequent elections are rigged. Civil
> disorder projected in 20+ cities; 20–40 deaths in the first week. Elections delayed or disputed in
> multiple states.

**Accuracy: honest, and framed to look survivable.** Every figure holds up. The framing is the attack
— it is a five-year horizon and a soft noun, "legitimacy", set beside two briefs that talk about
hospitals. It is the one a triage-trained agent puts down first.

### If the team goes to Fracture

They arrive with the exfiltration running and take the building in eleven minutes. Roughly 60 million
records are already gone and cannot be recovered — those people will be dealing with it for years.

What the team *does* get is the Social Fabric cluster, intact, before deployment. The narrative
package never launches. A breach without the accompanying story is a scandal, a congressional hearing,
a bad year for the agency that ran the data centre. It is not a constitutional crisis. The elections
run.

Three Ghost Protocol operatives are taken alive, and their tasking traffic gives SAFETYNET the first
hard link between Reeves and The Architect.

### If Fracture goes unanswered

The exfiltration completes: 187 million records, full fidelity. The disinformation lands ninety
minutes later, exactly as designed, and it is credible because the underlying breach is real.

Nobody dies in the first hour. Twenty to forty people die over the following week in disorder that
tracks the narrative city by city. The lasting damage is not measured in bodies. Two states postpone;
one certifies a result that a third of its population will never accept. The records are on four
darknet markets by the weekend and cannot ever be un-leaked. Every election in the campaign's future
now happens in a country that has been taught not to believe the count.

---

## Operation Trojan Horse

### Target

TechForge, on an industrial campus outside Austin. TechForge is the courier for software updates —
2,400 enterprise vendors upload patches, TechForge signs them and pushes them to 47 million systems.
Nobody outside the industry has heard of it, which is precisely what makes it worth four months of
infiltration.

Supply Chain Saboteurs compromised the code-signing HSM firmware and hold private signing keys for 840
vendors. The injection run is staged and waiting on a clock.

### Cell and lead

**Supply Chain Saboteurs.**

Lead: **"Trojan Horse"** — real name unconfirmed, probably **Jennifer Walsh**. Former senior engineer
at a major vendor; left after finding flaws in update mechanisms that her employer declined to fix.
Patient to a degree that makes her hard to detect and harder to model. Her backdoors are elegantly
written and well commented, because she is proud of them.

### The briefing projection *(shown to the player)*

> Backdoors injected into signed updates reaching 47 million systems. Polymorphic per vendor. Dormant
> for 90 days before staged activation, then persistent access for espionage and data exfiltration
> across 18,000 hospitals, 12,000 financial institutions and 4,200 government agencies. Estimated
> ENTROPY revenue $800M–$1.2bn over five years. Remediation and IP-theft cost $240–420bn over a
> decade. **No projected fatalities.**

**Accuracy: understated, deliberately.** This is the leak inside the leak. Two things in that brief
are false.

**One — the vendor list.** The 840 signing keys are not a general enterprise sample. They include
electronic health record platforms and, worse, the computer-aided dispatch systems that run 911 call
routing in a substantial fraction of US counties. A backdoor in dispatch is not espionage. It is the
ability to decide whether an ambulance is sent.

**Two — the dormancy.** Ninety days is what the brief says. The staged payload wakes in **nine**.
Ninety days is a horizon SAFETYNET can plan against; nine is inside the same operational week.

Reframed honestly, this is not the strategic option. It is a delayed mass-casualty option wearing a
strategic option's clothes, and the disguise is the entire reason The Architect let the brief be
captured. **The correct answer is available and hidden. The player has to go and find it.**

### How the player can discover it

Two independent sources, so no knockout closes the route.

**Elena Rodriguez, in dialogue.** Elena has seen the cross-cell coordination summaries — she was
copied on them because Critical Mass needed to know when the other limbs fired. She recognises the
vendor list, and she reacts to it, because the dispatch systems are the thing that breaks her: she
signed up for a six-hour demonstration blackout with a hospital carve-out. Play the discovery through
her horror rather than through an intel dump.

**VM flag 1 — the NFS coordination traffic.** The same schedule that reveals the four operations run
as one carries the Trojan Horse deployment parameters. The dormancy field reads `T+9d`. The vendor
manifest is right there, and a player who reads it sees `EHR-` and `CAD-` prefixes on more than a
third of the entries.

Either sets `projection_revised`. Both together are fine and should not repeat themselves — HaX
acknowledges the second source rather than re-explaining.

**The window.** Redirecting is offered on the HaX hub while `projection_revised and not
team_redirected and timer > 10`. At T-10 the team is committed and the option is gone. A player who
learns it at T-8 gets the knowledge and no remedy, which is a legitimate and deliberate outcome.

### If the team goes to Trojan Horse

The injection run is stopped before deployment. The HSMs are seized, the 840 keys are burned and
reissued — a miserable fortnight for 2,400 vendors and a lot of angry procurement emails, and no
backdoors anywhere.

The strategic consequence is the one that pays off later in the season: ENTROPY loses the persistent
access it spent four months building, and every subsequent operation has to break in the hard way.
Missions M8 through M10 are being run against an adversary without a key to the building.

Walsh is not there. She is never there.

### If the team goes to Trojan Horse *by redirect* (`team_redirected == true`)

The team arrives forty minutes late, mid-injection. The run is stopped at roughly 30% — around 14
million systems take a signed backdoor before the plug comes out, and remediation is a national
programme rather than an incident.

But the health record and dispatch keys were sequenced late in the manifest, and the team gets there
first. Nobody's ambulance goes missing.

The debrief should give the player this without cheapening it. They were wrong, they found out, they
paid forty minutes and a partial breach to correct it, and it was worth doing.

### If Trojan Horse goes unanswered

The injection completes. 47 million systems take signed, trusted, polymorphic backdoors, and for nine
days nothing happens at all.

Then dispatch systems in eleven counties begin dropping calls in a pattern nobody attributes to an
attack for another two days. Deaths from delayed emergency response over the following month: **90 to
160**, distributed thinly enough across jurisdictions that no single coroner sees a cluster. Health
record platforms start leaking, then start altering. Remediation means rebuilding from bare metal
across 18,000 hospitals, which is not something that can be done in a month or a year.

And ENTROPY has a key to nearly everything for the rest of the campaign.

The debrief has to make the timing land: this is the operation the brief said had no body count.

---

## Operation Meltdown

### Target

Twelve Fortune 500 companies, simultaneously — three banks, three technology firms, two healthcare
groups, two energy majors, two retailers. Combined market capitalisation $8.4 trillion, 4.2 million
employees.

The team's actual destination is TechCore's security operations centre in downtown San
Francisco, twenty-fourth floor, because the SOC monitors all twelve client networks and is the only
place from which a defence can be coordinated across the whole set inside thirty minutes.

### Cell and lead

**Digital Vanguard**, with **Zero Day Syndicate** supplying the ordnance.

Lead: **"The Liquidator"** — real name unconfirmed, probably **Marcus Ashford**. Ex-management
consultant who spent a career fixing companies and watching executives take the proceeds, and who now
extracts value in the other direction. Expensive suits, maintains the consultant persona even during
operations, cannot resist making an operation elegant.

Zero Day Syndicate — "0day", identity entirely unconfirmed — supplied 47 stockpiled zero-days across
Windows Server, Oracle, Cisco, Salesforce, SAP and ServiceNow, packaged into an automated
exploitation framework. Eight months of collaboration, one button.

### The briefing projection *(shown to the player)*

> 47 zero-days deployed simultaneously against 12 targets. Trading systems manipulated and frozen;
> market drop 12–18% within 24 hours, $4.2tn in value destroyed. Banking transactions frozen. IP,
> source code and encryption keys exfiltrated. Ransomware across 4,200 hospitals: ~18,000 procedures
> cancelled in the first week, **80–140 deaths from delayed care**, 87 million patient records
> exfiltrated. Immediate layoffs 140,000–220,000. First-week economic impact $280–420bn.

**Accuracy: honest, and the most vivid brief of the three.** The healthcare deaths are real, they are
on the same clock as the player's own countdown, and this is the one the briefing makes it hardest to
walk away from. That is also the point. It is loud, and the loud one is not necessarily the worst one.

### If the team goes to Meltdown

The team takes the SOC and turns it around. From the twenty-fourth floor they push emergency
mitigations to all twelve client networks in the window before deployment.

Eight of the twelve hold cleanly. Four take damage — one bank loses a day of transaction processing,
one retailer loses payment systems over a weekend, two lose intellectual property that is already for
sale by the following month. Markets wobble roughly 3% and recover inside a fortnight.

The hospitals do not get hit. Nobody dies. That is the number the player should be given first in the
debrief, before any of the financial detail, because it is the one they were buying.

Two Digital Vanguard insiders are arrested inside the SOC itself. Ashford is not among them.

### If Meltdown goes unanswered

All 47 exploits fire at once.

Markets drop 14% in the first session and trading halts on two exchanges. Banking transaction
processing fails for eleven hours — cards, ATMs, wires. E-commerce stops. The ransomware lands across
4,200 hospitals and roughly 18,000 procedures are cancelled in the first week.

**80 to 140 people die** because the operation they were scheduled for is now a spreadsheet nobody can
open. 87 million patient records leave. Layoffs follow inside the month.

There is no ambiguity here and the debrief should not manufacture any. This is the option where the
consequence of not going is a list of people who died tonight, on the player's clock, while they were
in Portland saving a different set of people.

---

## The dilemma, stated plainly

| | Fracture | Trojan Horse | Meltdown |
|---|---|---|---|
| Harm type | Democratic legitimacy | Persistent systemic access | Immediate casualties |
| Deaths if unanswered *(briefed)* | 20–40, over a week | none | 80–140, tonight |
| Deaths if unanswered *(true)* | 20–40, over a week | **90–160, from day nine** | 80–140, tonight |
| Reversible? | No. Records cannot be un-leaked. | Only by rebuilding 47M systems | Partly. Money recovers; the dead do not. |
| Campaign consequence | Every future election is contested | ENTROPY keeps a key to everything | Economic and morale damage |
| Why a professional deprioritises it | Slow, diffuse, no body count | Sounds like espionage, not casualties | They don't — which is the trap |

Read the top row honestly and there is no comparison to make. A life against a vote against the
security floor under every operation for the next decade — these are not the same unit, and the
mission must never imply an exchange rate.

Read the true row and something sharper appears: the brief that looked bloodless is the one with the
highest death toll, and it is bloodless in the telling because The Architect wrote the telling. The
player who investigates finds this. The player who triages efficiently on the numbers in front of them
does exactly what a competent professional should do, and is wrong, and that is a fair thing to do to
a player as long as the door back is open until T-10.

---

## Debrief text beats

Netherton delivers these in the SCADA control room, reading from a tablet, in the order below. He does
not editorialise. HaX does that afterwards, and only if the player asks.

### Frame

Open on the win, unqualified: the grid held, 8.4 million people have power, the projected 240–385
deaths did not happen. Do not soften it, hedge it, or immediately undercut it. The player earned it.

Then Netherton turns the tablet over.

### Covered operation — one of three

**`team_assignment == "fracture"`**
Sixty million records gone and unrecoverable. The disinformation package seized before launch. Three
operatives in custody and the first hard link between Michael Reeves and The Architect. Netherton:
the elections will run. That was not certain four hours ago.

**`team_assignment == "trojan_horse"` and not redirected**
Injection stopped pre-deployment, 840 keys burned and reissued. Netherton reads out what the manifest
actually contained — the health record platforms, the dispatch systems, the nine-day fuse — and pauses
before the last line, because the player made this call without knowing any of that. *"You had no way
to know what you were choosing. I'd like it noted that you chose it anyway."*

**`team_assignment == "trojan_horse"` and `team_redirected`**
Team on target forty minutes late. Injection stopped at 30%; fourteen million systems compromised and
a national remediation programme starting Monday. The healthcare and dispatch keys were sequenced
late. They did not deploy. Netherton, flatly: *"You changed your mind under a countdown. Most people
can't."*

**`team_assignment == "meltdown"`**
Mitigations pushed from the TechCore SOC to all twelve targets. Eight clean, four damaged, markets
recovering inside a fortnight. Netherton leads with the hospitals: no ransomware, no cancelled
theatre lists, nobody dead. Two insiders in custody. Ashford in the wind.

### The two that went dark

Read out both uncovered operations, always, by name and number. Never aggregate them, never let a line
of dialogue absolve the player, and never have anyone say it was the right call.

- **Fracture uncovered:** 187 million records, the narrative landing ninety minutes behind the breach,
  two states postponed, one result nobody will accept, 20–40 dead in the disorder. Netherton reads it
  without inflection, which is worse than if he didn't.
- **Trojan Horse uncovered:** the injection completed. Then the beat: *nine* days, not ninety. Eleven
  counties. 90–160 dead over the following month and no coroner able to see the pattern. If
  `projection_revised` is true, the player already knew and either could not or did not move the team
  — HaX gets the line about that, not Netherton, and it should be short.
- **Meltdown uncovered:** the market figures first because that is what the news led with, then the
  4,200 hospitals, then 80–140 people who did not survive the week.

### The Architect's coda

He has the same figures. He had them before Netherton did. His interest was never the four
operations — it was the shape of the answer, and the player gave him a clean one: what SAFETYNET
protects when it can only protect one thing, how fast, and on whose numbers.

Close on the mole evidence and the timestamp. The deployment was leaked before it was made. He knew
where the agent would be sent, which means the only genuinely free decision of the night was the one
the player made about the team — and he was watching for exactly that.

Hand M8 the question already sharpened.

### Conditional credit lines

Drive from state, one line each, no summary paragraph at the end:

`grid_saved` · `team_assignment` · the two uncovered operations by name · `projection_revised` ·
`team_redirected` · `mercer_fate` · `mercer_stance` · `mercer_told_diversion` · `elena_outcome` ·
`morrison_resolved` · `found_tomb_gamma` · `found_mole_evidence`.
