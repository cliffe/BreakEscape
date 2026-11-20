# Known-good SecGen scenarios adaptable for Break Escape (m02–m08)

These SecGen scenarios are live and known-good. A mission's VM **may be rebased on one of
these** if it enhances play (user, this pass). Treat a rebase as a design improvement, not a
mere consistency fix: it means adapting the chosen scenario's systems/modules into the
mission's canonical SecGen XML (`break_escape/safetynet/<mission>.xml`) and re-aligning every
game reference (flags, accounts, hosts, IPs, paths, field guides) to the new VM. Still never
build/boot a VM — reason statically, and you may use `review-secgen-scenario` /
`review-secgen-module` / `secgen-puppet`.

Only rebase when it clearly improves the mission's hands-on play or its fit with the story,
and record the rationale. If the current VM is already a good fit, keep it and just align.
A full rebase is a flagged design decision — note it and your reasoning in the review.

Paths are relative to `/home/cliffe/Files/Projects/Code/SecGen/scenarios/`.

| Catalogue title | Scenario XML | CyBOK (from the catalogue) |
|---|---|---|
| Feeling Blu | `labs/introducing_attacks/9_feeling_blu.xml` (also `ctf/feeling_blu.xml`, `ctf/feeling_blu_brute.xml`) | AAA, AB, AC, MAT, OSV, SOIM, SS, WAM |
| Agent Zero: Licence to Hack | `ctf/agent_zero.xml` (confirm the `<name>`) | — |
| SSH-it happens | `ctf/SSH_it_happens.xml` | MAT, SOIM, SS, WAM |
| Analyse This | `ctf/analyse_this.xml` | AC, F, NS, SOIM |
| Catching Sparks | `ctf/catching_sparks.xml` | AB, MAT, SOIM, SS, WAM |
| Containers Escape | `ctf/container_escape.xml` | AAA, MAT, NS, OSV, SOIM, WAM |
| Disastrous Development | `ctf/disastrous_development.xml` | AAA, MAT, OSV, SOIM, SS, WAM |
| Eventful Data | `ctf/eventful_data.xml` | AAA, MAT, OSV, SOIM, SS, WAM |
| Git dejavu | `ctf/git_dejavu.xml` (adv: `ctf/git_dejavu_adv.xml`) | AAA, AB, MAT, OSV, SOIM, SS |
| Off the Trail | `ctf/off_the_trail.xml` | AAA, AB, MAT, SOIM, WAM |
| Eyearesee | `ctf/eyearesee.xml` | AAA, AB, MAT, OSV, SOIM, SS |
| Nosferatu | `ctf/nosferatu.xml` | AAA, AB, MAT, NS, OSV, SOIM, SS, WAM |
| Putting it together | `ctf/putting_it_together.xml` | AAA, AB, F, MAT, NS, OSV, SOIM |
| Rooting for a win | `ctf/rooting_for_a_win.xml` | AC, F, MAT, NS, SOIM, SS |

Notes:
- **m02_ransomed_trust** currently names `rooting_for_a_win` as its `secgen_scenario` — its VM
  may have originated from `ctf/rooting_for_a_win.xml`. Check whether
  `break_escape/safetynet/m02_ransomed_trust.xml` is an adaptation of it; align the
  `secgen_scenario` to the safetynet path regardless (per the review brief), and separately
  judge whether rebasing improves play.
- Match a mission to a scenario by the skill it should teach and the mission's CyBOK mapping
  in `mission.json`, not by title flavour alone.
