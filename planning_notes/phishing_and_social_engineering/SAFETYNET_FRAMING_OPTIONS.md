# SAFETYNET framing options for the phishing and social-engineering lab

Proposal only. Nothing here changes a scenario, an ink file, an asset or a lab sheet. It sets out four
to six ways to sit `scenarios/lab_social_engineering` ("Phishing and Social Engineering") inside the
SAFETYNET universe, with the cost of each, and ends with a recommendation that separates what could ship
at launch from a fuller reframe for later.

Author's note on scope: the lab launches in a few days, fully voiced (125 clips), and the phishing/SE
`README.md` already records it as a standalone product whose *systems* feed Eldritch Hacker but whose
*narrative* (Tarnside, Ledgerwell) is its own. So a SAFETYNET reframe is not required by canon today. The
value is consistency with its shelf-mate and a cleaner on-ramp to game 2, weighed against launch risk.

## What the lab is today

The player is a penetration tester at **Tarnside Assurance**, a consultancy. **Ledgerwell Ltd** has hired
them for a phishing and social-engineering engagement with one condition: nobody is named and shamed. The
arc is get the rules of engagement signed (**Ruth Adeyemi**, engagement lead), research Ledgerwell from
public sources, craft spear-phish, build a look-alike login page, make a pretext call to the service desk
(**Dev**), report to the client MD (**Gareth Fairbairn**), then switch to defence with **Tomasz** on the
Blue Team: inbox triage, sender authentication, fixes. Browser-only, no VM, aimed at university Cyber
Security students, in the `lab_games` collection.

Player sprite display name is "Consultant". Email-only targets are **Chris Hampshire** (careers inbox),
**Melanie Pierce** (Finance), **Sofia Lord** (new intern). Rooms: Engagement Office, Recon Room,
Operations Room, Blue Team Room.

## The canon the proposals rest on

- **SAFETYNET** is a covert counter-ENTROPY outfit that answers to no state and no law. Its operations are
  "authorised internally, by SAFETYNET's own command"; in the field an agent "has no authority anywhere"
  and a blown operation "is simply a crime"
  (`story_design/universe_bible/02_organisations/safetynet/overview.md`). This is the central tension for
  every framing below, and the reason some options are risky: SAFETYNET's whole premise is doing unlawful
  things under cover, and the lab's core lesson is that phishing people is a crime unless it is authorised
  in writing by someone entitled to authorise it.
- **Cover operations.** SAFETYNET runs "several legitimate security consultancy firms as fronts" that
  "conduct actual business", draw up "real contracts, NDAs, and statements of work", and employ both
  agents and unwitting civilians (`.../safetynet/cover_operations.md`, "Cyber Security Consultants",
  "Front Companies"). This is the hook that lets a genuinely contracted, signed engagement coexist with a
  SAFETYNET frame without breaking the authorisation lesson.
- **Agent HaX** is the player's handler across the games (styled "Agent HaX" in-world; full designation
  Agent 0x99 "Haxolottle", `.../04_characters/safetynet/agent_0x99_haxolottle.md`). The player is Agent
  0x00.
- **Social Fabric** is the m01 cell: information operations and disinformation, cover company **Viral
  Dynamics Media**, bot farms, deepfakes, fake-news networks, m01 antagonist **Derek Lawson**
  (`.../03_entropy_cells/social_fabric.md`). Important mismatch: Social Fabric works at *scale* against the
  public (bots, memes, fake news), not targeted spear-phish and service-desk pretexting against one small
  firm. Its listed educational focus is OSINT, attribution and media literacy, not sender authentication
  or landing-page cloning. Cells that fit targeted phishing/pretext/infiltration better are the **Insider
  Threat Initiative** (recruitment and infiltration) and **Zero Day Syndicate** (supplies the exploits and
  look-alike infrastructure). Any "learn the cell's playbook" framing should lean on those, or treat
  Social Fabric's reconnaissance habit rather than claim spear-phish is its signature.
- **Eldritch Hacker (game 2)** is where these SE systems become the core, under the **Quantum Cabal** cell
  and its corporate front the **Tesseract Research Institute** (the Institute layer is literally "staff
  email, sender authentication, payloads, sign-in pages"). It is browser-only and VM-free, like this lab.
  But it is **provisional pending a universe-bible pass**, and the direction doc explicitly says the SE
  systems are **not** retrofitted into Licence to Hack m01–m08, and that the student lab's own narrative is
  separate from Eldritch Hacker (`planning_notes/eldritch_hacker/DIRECTION.md`;
  `planning_notes/phishing_and_social_engineering/README.md` build order). So any framing that leans on
  Eldritch Hacker specifics risks committing to provisional canon.
- **Shelf-mate precedent.** The other `lab_games` title, `lab_tesseract_trials` ("The Keyholder Trials"),
  is already SAFETYNET-framed and VM-free: the player is **Agent 0x00** undercover at Miskatonic University
  UK, reporting to **Agent HaX**, against a Ransomware Incorporated front, with "SAFETYNET field note"
  props (`scenarios/lab_tesseract_trials/scenario.json.erb`, `mission.json`). So the phishing lab is the
  odd one out in its own collection: a light SAFETYNET frame would bring it into line. The VM labs
  (`lab_scanning`, `lab_malware_metasploit`, and the rest) sit in a different collection, `vm_labs`, and are
  instructor-led and un-framed, so they set no expectation either way.

## How change cost works here

The TTS cache is content-hashed on the exact text plus voice (250 files in
`tts_cache/lab_social_engineering/`: 125 `.mp3` and 125 `.json` sidecars). A clip is regenerated only when
a voiced line's **wording** changes. So:

- Changing only the unvoiced `mission.json` `display_name`/`description`, the scenario `scenario_brief`,
  or room-sign and UI strings costs **zero clips**.
- Re-voicing cost tracks exactly how many *spoken* lines you reword. Brand- and role-bearing words appear
  in roughly these many voiced lines per speaker (grep proxy on the ink): **Ruth** 21 + **Ruth (phone)**
  13 = ~34, **Gareth Fairbairn** 19, **Tomasz** 10, **Dev** just 1. The email targets' replies (Pierce,
  Lord) carry none of these nouns. So a rename of "Tarnside"/"Ledgerwell"/"Gareth", or a re-role of Ruth
  and Tomasz, lands in the region of 55–65 of the 125 clips; keeping the cast and their words but adding a
  frame around them costs far less.

Every framing below is costed against that.

---

## Framing 1: SAFETYNET recruit training sim (assessment day)

**Premise.** The whole engagement is a sanctioned SAFETYNET training simulation. The recruit (Agent 0x00,
day one) is dropped into a sealed sandbox that models a small finance firm, to prove they can run a lawful
engagement end to end before they are let near a real one. Ledgerwell and its staff are sim constructs;
the "client" is the exercise itself. HaX runs the assessment and signs off at the end.

**Cast.** Ruth becomes the recruit's training officer (same warmth, same hint role, now in-house). Gareth
Fairbairn becomes the simulated client the exercise puts in front of you, or is folded into a scripted
"client" node. Dev and Tomasz stay as sim role-players. **HaX appears**, lightly, as the assessor who
tops and tails the day. Email targets unchanged.

**Timeline and canon.** Sits before m01 (recruit intake); SAFETYNET "find you" and test CTF/pentest talent
(`overview.md`, Recruitment). Leans on no provisional Eldritch Hacker canon. Lowest contradiction risk,
because a declared simulation sidesteps the "SAFETYNET acts outside the law" problem entirely: nothing
real is attacked.

**Teaching.** Strongest of all options for the authorisation message, counter-intuitively. The sim can
teach the rules of engagement, the Computer Misuse Act 1990 and no naming and shaming as the *doctrine the
recruit must master to be allowed out*, with HaX stating plainly that in the field there is no legal cover
and the paperwork is the only thing between a test and a crime. The signed-RoE beat survives intact and
gains a reason. No risk of making unauthorised phishing look acceptable, since the frame is explicitly a
closed exercise.

**Change cost.** Medium. `mission.json` and `scenario_brief` rewritten (0 clips). Ruth's re-role touches
her ~34 brand/role lines; Gareth's client lines (~19) change if he becomes "the simulated client"; Tomasz
~10. Add maybe 2–6 new HaX bookend clips. Realistic re-voice: ~45–65 clips, plus one HaX portrait/sprite
if he appears on screen (HaX art already exists elsewhere in the project). No puzzle, no minigame, no lab
sheet structural change; the lab sheet's story paragraph and one or two screenshots' captions update.

**Audience fit.** Good. Works standalone (a self-contained exercise reads fine with no prior game) and as a
SAFETYNET on-ramp. Matches the tesseract sibling's "undercover recruit" register.

---

## Framing 2: Tarnside as a SAFETYNET cover firm (the low-touch frame)

**Premise.** Keep everything. Add one fact: Tarnside Assurance is one of SAFETYNET's cover consultancies.
The Ledgerwell job is a genuine, contracted, signed engagement (cover firms do real work), and that is all
the player needs to know today; a single handler line hints that SAFETYNET took the contract because
Ledgerwell sits in a supply chain ENTROPY has sniffed around.

**Cast.** Everyone keeps their name, role and words. Ruth is still the engagement lead (now also, quietly,
the player's SAFETYNET contact). Gareth is still the real client MD. Dev and Tomasz unchanged. **HaX need
not appear**; if wanted, one optional phone line.

**Timeline and canon.** Deliberately un-pinned, so it contradicts nothing. Rests only on the solid canon
that SAFETYNET runs contracted front consultancies (`cover_operations.md`). Because the contract is real
and signed, the authorisation lesson is untouched.

**Teaching.** Safest. The lawful, signed, scoped engagement is exactly what the lab already teaches, and
the cover-firm fact adds flavour without implying the player is doing anything unauthorised. No risk to the
no-naming-and-shaming or CMA messages.

**Change cost.** Lowest. One or two lines of unvoiced `scenario_brief`/`mission.json`, and optionally one
new voiced Ruth line. Realistically **0–3 clips**. Lab sheet: one sentence. Could ship at launch.

**Audience fit.** Good both ways. Standalone players simply read a consultancy thriller; SAFETYNET players
get a wink. Lowest ambition, lowest payoff.

---

## Framing 3: Authorised red-team against a suspected ENTROPY front

**Premise.** SAFETYNET, through its Tarnside cover, is contracted to red-team Ledgerwell, a small finance
firm it suspects of being a laundering or logistics node for an ENTROPY cell. The engagement the player
runs is the genuine, signed, scoped test; the covert second objective (does the phishing surface leak any
sign of ENTROPY contact?) belongs to HaX and sits under the cover, the way SAFETYNET red-teams always do.

**Cast.** Ruth as engagement lead and SAFETYNET contact. Gareth as the client MD who does not know the
second objective (he is a real, worried MD, as now). Dev and Tomasz unchanged. **HaX appears** on the
phone to set the covert objective and debrief it. The email targets stay.

**Timeline and canon.** Any point in the m01–m10 run; references ENTROPY generally rather than a named
cell, so it dodges the Social Fabric mismatch. The one canon care point: keep the *authorised* test and the
*covert* objective clearly separate, so the player never conflates "SAFETYNET sanctioned it" with "it is
lawful". The signed contract with Ledgerwell is what makes it lawful; SAFETYNET's interest is extra.

**Teaching.** Works if handled carefully, and it is the richest "proper SAFETYNET mission" option. The RoE
beat stays, and the covert objective can be written to *reinforce* the stop-rule: if the player finds
evidence of a real ENTROPY compromise mid-test, they escalate to HaX rather than acting, which is the
stop-rule lesson in SAFETYNET clothing. Risk: if written loosely it could suggest the ends (catching
ENTROPY) justify unauthorised means. Mitigation is explicit handler dialogue that the contract is real and
the scope still binds.

**Change cost.** Medium-high. Brief and mission.json rewritten. Ruth (~34) and Tomasz (~10) touched;
Gareth (~19) keeps most lines but may gain a few. New HaX material: objective-set plus debrief, perhaps
6–12 clips, and a HaX portrait on screen. Realistic re-voice: ~55–70 clips. One new optional objective
thread (the covert find) if you want it mechanised, which is more than a reskin. Lab sheet: story
paragraph plus a note that the covert objective is narrative only. Too much for launch; a post-launch pass.

**Audience fit.** Strong as a SAFETYNET mission, fine standalone. Closest to the universe's "cover as
constraint" design guidance.

---

## Framing 4: Learn the cell's playbook (ENTROPY targets this client)

**Premise.** Ledgerwell has been flagged as a likely ENTROPY target. SAFETYNET sends the player, under the
Tarnside cover and a signed engagement, to run the same campaign ENTROPY would, so Ledgerwell learns where
it is exposed before the real attack lands. The teaching conceit: to defend the client you first walk
ENTROPY's own route in, then turn it into fixes.

**Cast.** As Framing 3. Ruth leads; HaX supplies the threat intelligence that says *why* this client and
*which* techniques to model. Dev and Tomasz unchanged.

**Timeline and canon.** Here the cell choice matters. The task suggested Social Fabric, but Social Fabric's
canon is disinformation at scale, not targeted spear-phish and vishing, so naming it as the author of a
LedgerPay payslip phish would contradict `social_fabric.md`. Two honest routes: (a) name the **Insider
Threat Initiative** or **Zero Day Syndicate**, whose playbooks genuinely include targeted access and
infrastructure; or (b) keep it cell-agnostic ("an ENTROPY recruiter's playbook") and only gesture at a
cell. Either avoids a canon snag.

**Teaching.** Good, with one guardrail. Framing the player as *modelling the adversary's method under
authorisation* is exactly the lab's existing "learn the attack to learn the defence" pillar, so it fits.
The guardrail: the brief must keep saying this is a sanctioned simulation of ENTROPY's method, not a licence
to use it, or the "model, don't weaponise" line blurs. The defender half (triage, fixes) lands harder when
the player has just been told these are a real cell's moves.

**Change cost.** Medium-high, like Framing 3: ~55–70 clips, HaX material and portrait, brief and lab-sheet
rewrites. If a cell is named, a couple of OSINT/intel-board flavour strings could nod to it (unvoiced, low
cost). Not a launch item.

**Audience fit.** Strong for the universe; the "here is how they get in" hook is good for Steam-facing
players. Standalone still reads.

---

## Framing 5: Post-incident re-creation of a real ENTROPY campaign

**Premise.** ENTROPY already phished a firm (Ledgerwell, or an un-named firm now anonymised). SAFETYNET has
the artefacts, and the player re-creates the campaign step by step in a controlled, authorised reconstruction
to understand how it worked and to harden the next target. The engagement is a forensic re-enactment, not a
live attack, so authorisation is intrinsic.

**Cast.** Ruth becomes the lead running the reconstruction. HaX supplies the recovered campaign (the real
emails, the real pretext call transcript) as the material the player rebuilds. Gareth becomes the firm's MD
being briefed on what happened to them, which keeps his "scared it gets through next time" register almost
unchanged. Tomasz still owns the defender half, now explicitly "so the next one fails". Dev becomes the
service-desk operator whose recorded call the player reconstructs.

**Timeline and canon.** Fits naturally *after* an incident, so it can sit late (post m05/m06) or be
un-pinned. No reliance on provisional Eldritch Hacker canon. Clean on authorisation: reconstructing a past
attack in a sandbox is self-evidently lawful, and it lets the stop-rule be taught from the other end (this
is what happens when nobody escalated in time).

**Teaching.** Very good, and arguably the most natural fit for a lab that already explains every outcome
after the fact. The "re-create to understand" frame is honest about why the player is performing attacker
steps: to learn, not to harm. One subtlety: the live pretext call and the "will Dev bite?" tension read
slightly less live when framed as reconstruction, so the writing must keep the call feeling in-the-moment
(it can: the player is re-running it, Dev reacts).

**Change cost.** Medium. Ruth (~34) and Tomasz (~10) re-roled; Gareth (~19) lightly touched (victim MD
rather than commissioning client); Dev's 1 brand line trivial. New HaX framing clips (~4–8). Realistic
re-voice: ~50–65 clips, plus HaX art. Lab sheet: story paragraph and the "authorised inside the story"
note reworded toward reconstruction. Not a launch item, but a strong later pass.

**Audience fit.** Good. Works standalone as a case study; works in-universe as a SAFETYNET debrief mission.

---

## Framing 6: Eldritch Hacker prequel / Institute teaser (flag: provisional canon)

**Premise.** The lab is explicitly the recruit's first brush with the social-engineering craft they will
use against the Quantum Cabal's corporate front, the Tesseract Research Institute, in game 2. Ledgerwell is
a warm-up target; HaX notes the technique set is "exactly what you will need when we go after the
Institute".

**Cast.** As Framing 1 (recruit training) with a forward nod. HaX appears and names the Institute layer.

**Timeline and canon.** Sits as a bridge toward Eldritch Hacker. This is the only framing that **leans on
provisional canon**: the direction doc marks the Quantum Cabal / Tesseract Institute, the cast and the
Eldritch narrative as not-yet-settled, pending a universe-bible pass, and warns against writing final
material from it (`eldritch_hacker/DIRECTION.md`). It also says the lab's narrative is kept separate from
Eldritch Hacker. So this framing risks committing the launch product to specifics the team has deliberately
left open, and could need rework after the bible pass.

**Teaching.** Same strengths as Framing 1 on authorisation (a sandbox exercise). The teaser does not harm
the message. The risk is narrative, not pedagogical.

**Change cost.** Medium on clips (~45–65, as Framing 1), but with an added *maintenance* cost: if the
bible pass changes the Institute or Cabal naming, the voiced HaX teaser lines re-voice again. Given the
launch window, paying twice is the concern. Not recommended for launch for that reason.

**Audience fit.** Best bridge to game 2, weakest on standalone durability (a teaser for an unshipped,
unsettled game can date).

---

## Recommendation

**Two-speed plan.**

**At launch (low cost, low risk): Framing 2, the Tarnside-as-cover-firm line.** Add one or two unvoiced
sentences, and at most one new Ruth line, that establish Tarnside as a SAFETYNET cover consultancy running
a genuine, signed contract, with a single hint that SAFETYNET took the job because Ledgerwell sits near
something ENTROPY cares about. Cost is ~0–3 clips and one lab-sheet sentence. It brings the lab into line
with its `lab_games` shelf-mate (the SAFETYNET-framed Keyholder Trials), harms none of the teaching, and
keeps the authorisation lesson exactly as it is because the contract stays real and signed. It also leaves
every richer framing open later, since it pins nothing.

**Later (fuller reframe): Framing 5 (post-incident re-creation) or Framing 1 (recruit training sim).** Both
are the safest rich options for the authorisation message, because a reconstruction and a sandbox exercise
are self-evidently lawful, so neither can be read as endorsing unauthorised phishing. Framing 5 fits the
lab's "explain every outcome" character best and gives the defender half a sharp motive; Framing 1 gives the
cleanest recruit on-ramp and matches the tesseract sibling's register. Pick between them when there is time
to re-voice ~50–65 clips and add HaX. Treat Framing 3/4 as variants of the same later pass if a true
"mission" feel is wanted, with the guardrail that the signed scope, not SAFETYNET's sanction, is what makes
the test lawful.

**Avoid for launch: Framing 6**, because it commits voiced lines to Eldritch Hacker specifics the team has
deliberately left provisional, and would likely re-voice twice.

**Caveat to carry into any rich reframe.** SAFETYNET's defining trait is operating outside the law under
cover. The lab's defining lesson is that phishing people is a crime without written authorisation from
someone entitled to give it. These can coexist only if the frame keeps the engagement genuinely
contracted and signed (cover-firm canon supports this) or genuinely a closed exercise. Any wording that
lets "SAFETYNET sent me" stand in for "it is authorised" would undercut the single most important thing the
lab teaches, so the brief and the handler lines must keep the two apart.
