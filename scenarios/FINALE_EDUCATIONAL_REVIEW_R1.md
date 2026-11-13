# Finale educational review, round 1: m09 Digital Archaeology and m10 Full Disclosure

Date: 2026-10-22. Reviewer: subagent (educational quality). Read-only on game files; nothing committed.

## Scope and method

Browser-side teaching only: puzzles, HaX's hints and status ladders, in-world documents, briefings and debriefs, field-guide items, moral choices, and the CyBOK blocks in each `mission.json`. Compared with m02 (`m02_phone_agent0x99.ink` encoding hints, lines 491-502 and 691-705) and m05 (the "for the training file" indicator recap, `m05_closing_debrief.ink:355-400`, and `CYBOK_MAPPING.md`), and with `README_scenario_design.md` (field guides §1347-1361, `concludeRequires` §1495-1515).

Both scenarios were rendered through `scripts/validate_scenario.rb`'s ERB loader so every document string could be read as the player sees it. Every puzzle answer the player has to work out in the browser was checked by hand (below). The CyBOK blocks were run through `CyBOK Mapper/scripts/check_hacktivity_cybok.py`, the checker m05's mapping used.

Not opened: VM_SHAPE.md, FINALE_VM_PLAN.md, SECGEN_MODULE_PLAN.md, STAGE_8_VM_ANSWERS.md, M09_PUZZLE_VM_ANSWERS.md, SecGen, the exploit-detail field guides. VM flags are treated as black boxes; only their framing is judged. The `mission.json` `secgen.vulnerabilities` lists were read only to see which concept each flag stands for.

Field-guide text: none exists yet. m09's four `lab-workstation` items point at placeholder `labUrl`s (`m09 scenario.json.erb:769-797`) and m10's four have no `labUrl` at all (`m10 scenario.json.erb:1544-1549`). That follows the "lab sheets last" rule, so it is not counted as a finding, but it matters for E-M2 and E-m6: until the guides exist, the in-ink lines are the only teaching a player gets.

## Summary

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 4 |
| Minor | 11 |
| Nit | 8 |

**Top five**

1. **E-M1. The definition of full disclosure is wrong as stated**, twice, in the season's title concept (`m09_phone_agent0x99.ink:574`, `m10_director_netherton.ink:138`). The D-02 design note said "usually after a vendor has stopped answering"; the shipped lines dropped "usually" and the "to everyone", so they now define full disclosure as an escalation step of coordinated disclosure. Restore two words.
2. **E-M2. Vigenère, the season's first keyed cipher, is taught as a CyberChef step.** Nothing links it to m02's "encoding isn't encryption" or m08's ROT13, and with the archive-code field guide unwritten a player off Gary's branch gets "It's Vigenère" and a tool name. Two hint lines and one text fix it.
3. **E-M4. Both missions turn on credentials nobody revoked** (Tesseract's account, seven years; the 1,206 stolen badge records; Malhotra's cloned card) but no line names the control: close leavers' accounts, revoke and reissue on compromise, and a door log proves a card, not a person. One text, one HaX line, one line in the Citadel incident file.
4. **E-M3. Insider-threat motives and recruitment signs are all over m09's paper and never named or gathered**, unlike m05's debrief. The legacy box's notes column is a ready-made lesson in why people get recruited. Two unvoiced texts.
5. **E-m11. Both CyBOK blocks fail the project's own checker: 9 errors in m09, 18 in m10** (m08 is clean). Invalid topics, Base64 filed under cryptography against m02's lesson, and m10 leaves out the AAA, audit-trail and physical-security work it teaches. A replacement block for each is given.

The ethics work is the strongest part of the finale. Every disclosure decision is costed before it is made, HaX refuses to choose for the player twice, the villain was right once (his 2017 memo) and the game lets the player say so, and each database outcome shows a price in the debrief. The findings in §5 are small.

## Puzzle answers checked by hand

| Puzzle | Check | Result |
|---|---|---|
| m09 salvage keypad | Vigenère decode of `MSJMQAEGDZNVI` with key `BONEYARD` (bay 12 on the Shelf Marks chart, `erb:2227`) | `LEWISANDCLARK`, matches `salvage_code` (`erb:53`) |
| m09 Alpha annotations (optional) | Decode of `Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.` with "Key: the series" = `ALPHA`, case kept, punctuation skipped | "Carry it yourself. Let it hurt afterwards." Matches what CyberChef's Vigenère Decode does with mixed case |
| m09 Initiative ledger print copy | Tried every chart word and ALPHA on the rows | Decorative, not decodable; the observation already says the live copy has the key, so no player is sent hunting |
| m09 floor safe | `060216` against the rent ledger's "Lease start: 06/02/16" (US date) and the lease abstract's June 2, 2016 | Consistent (MMDDYY) |
| m09 H&L boxes | `HL2015-0477` from HaX's ledger call | Consistent |
| m10 margin strip | Base64 decode | "For whoever checks his sums. Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. Abena Asante". Matches the terminal password and the corrected model |
| m10 casualty logic | "Recovery counted twice" means deaths understated; corrected range is higher | Consistent (1,100-2,600 to 2,100-3,600) |
| m10 outer lock | Dusted keys 0, 3, 6, 8 against `6083` | Consistent; 24 possible orders |
| m10 sleeper | Bench log 01:58 clone of Malhotra's badge; case 2 opened 01:52 by Kowalczyk and Arakawa; Arakawa at the gate with the player; Malhotra on the line with HaX; door at 02:10 | Deduction closes on Kowalczyk; every wrong name gets a reason back ("Read the sheet") |
| m10 Citadel stores | 160 units, one supplier, four batches; bench log G-14 to G-17, 40 each, to Gallatin Instrument Supply | Consistent, and a good hidden supply-chain thread (E-m8) |

## 1. What each mission teaches

### m09 Digital Archaeology

| Concept | Where the player meets it | How |
|---|---|---|
| Vigenère cipher (new) | Catalogue line at flag 1 (`erb:799-808`), Shelf Marks chart (`erb:2220-2231`), salvage keypad (`erb:2283`) | Done: decode in CyberChef with a key found on the wall. Optional second decode (Alpha annotations) |
| RFID cloning | Noor's card at the front desk (`m09_noor_haddad.ink:107-117`); Sorensen's card across the hatch (`m09_sorensen_hatch.ink:132-143`) | Done, by standing close in conversation |
| Fingerprint lifting and spoofing a reader | Plan cabinet (`erb:1885`), print from her rubber stamp | Done |
| Lockpicking, PIN cracking | Office door / front desk; floor safe | Done (reinforced) |
| A meaningful date as a PIN | Rent ledger and lease abstract give 060216 | Optional; the PIN cracker skips it (E-m9) |
| Insider threat: recruitment and placement | Noor's bonus and her father (`m09_noor_haddad.ink:118-128`), the legacy box (`erb:1856`), the H&L placement record, Derek's asset file, the 2011 candidate assessment | Shown in documents and dialogue; never named (E-M3) |
| Social engineering (pretext) | Cover stories to Noor and the guard (`m09_noor_haddad.ink:68-83`, `m09_old_coyote.ink:36-59`) | Done (reinforced) |
| Evidence and corroboration | Handwriting match (`m09_phone_agent0x99.ink:880-896`): "I want it from two directions before anyone says a word" | Done, with a fair "I can't tell" answer |
| Asset and account lifecycle | Tomb Beta's property label (`erb:2304`), "Never revoked" credential (`m09_phone_agent0x99.ink:384-385`) | Shown; the control is never named (E-M4) |
| Coordinated vs full disclosure; a service keeping a flaw | Albion notice (`m09_phone_agent0x99.ink:498-528`, `841-851`), hour read (`573-575`), debrief memo and notice (`m09_closing_debrief.ink:99-155`) | Choice with costs; definitions partly wrong (E-M1, E-m1, E-m2) |
| Data destruction (cross-cut shredding, degaussing) | Shredder, wipe console | Scenery; accurate |
| VM: recon, vulnerable service foothold, misconfigured privilege, credential analysis | Four flags (§3.2) | Framed well (§3.2) |

### m10 Full Disclosure

| Concept | Where | How |
|---|---|---|
| Base64 (reinforced) | Margin strip, bench terminal (`m10 erb:3104-3140`) | Done, optional; no recognition hint (E-m5) |
| Audit-trail reasoning, means and opportunity | Door log, bench log, sign-out sheet, alibis (`m10_phone_agent0x99.ink:235-278`) | Done, optional, with costs for a wrong name |
| Cloned badges; a stolen badge table | Bench log 01:58, alarm log "1,206 SAFETYNET badges" (`erb:304-322`) | Shown; lesson not drawn (E-M4) |
| Supply-chain compromise | Kowalczyk's cracker, the cracker rack, Citadel stores (`erb:193`, `347-350`) | Shown and used in the interrogation (`m10_kowalczyk.ink:236`); never named (E-m8) |
| Default or unchanged master codes | Vector: "Nobody ever changed the master" (`m10_vector.ink:44-60`) | Told, clearly |
| Keypad wear as a side channel | Keypad face plate (`erb:3907-3921`) | Optional; cracker skips it (E-m7, E-n2) |
| Social engineering: pretexts, reading a rota for leverage | Tunnel guards, Fonoti (`m10_guards.ink`, `m10_fonoti.ink:28-72`) | Done; a pretext used twice fails, which is a nice touch |
| Cyber-physical: local isolation of a remote-controlled shutter | Power room (`m10_phone_agent0x99.ink:690-740`) | Talked through step by step (E-m10) |
| Risk acceptance and its cost | Citadel incident file item 3, "Risk accepted, on my signature" | Shown |
| Checking a risk model | Asante's corrected casualty model | Done, and used as the winning rebuttal in exchange 1 |
| Disclosure ethics: hoard, coordinate, destroy | Database choice (`m10_tesseract.ink:1026-1129`) and its debrief (`m10_six_oclock.ink:380-455`) | Choice with costs shown before and after |
| Argument: attack the premise, not the restated harm | Three exchanges with Tesseract (`m10_tesseract.ink:474-784`) | Done; always one landable rebuttal per exchange without any carry-over |
| Use of force: imminent threat vs execution | `m10_tesseract.ink:1136-1210` | Signposted, consequences shown |
| VM: injection foothold on a monitoring host, data store, container escape, jail escape | Four flags (§3.2) | Why is clear; concept links thin for flags 1 and 4 (E-m6) |

## 2. Accuracy

Verified correct, beyond the table above: RFID cloning at "a hand's width" fits low-frequency proximity cards; degaussing tape reels; cross-cut shredding; a lifted latent print defeating a cheap reader; HaX's vendor timeline ("ninety days for a fix ... a year" to fit, `m09_phone_agent0x99.ink:846`) and the debrief's "Patch windows, ninety days. It'll be a year" (`m10_six_oclock.ink:390`) are realistic for industrial kit; Netherton's "Half of these cannot be patched this year, and the oldest water controllers never" (`m10_tesseract.ink:1034`) is the right answer to Tesseract's "every vendor patches at once"; HaX's coordinated-disclosure line at `m10_tesseract.ink:1044` is correct apart from E-m1; the debrief's water utilities going to manual is a fair picture of unpatchable OT.

Inaccurate or misleading: E-M1 (full disclosure), E-m1 (coordinated disclosure stops before the public step), E-m10 (Elena and Vance's "isolates the feed"), E-n4 (the PIN cracker's feedback), and E-m11 (Base64 under Symmetric Cryptography; ENCODING on m09, which has no encoding puzzle).

## 3. How well it is taught

### 3.1 The loop

| Concept | Encounter | Hunt | Apply | Hints | Verdict |
|---|---|---|---|---|---|
| m09 Vigenère | Coded line at flag 1, in the reading room | Chart beside the keypad, two rooms on | CyberChef, then the keypad | Three tiers on HaX's hub (`707-728`): place, then rule, then tool. Gary's call on the m02 branch. Status row names the wall | The best-built loop in the finale. What it lacks is the concept (E-M2) |
| m09 fingerprint | Cabinet in the cage | Stamp on the hatch shelf | Kit, then reader | Text on cage entry; status row; Victoria branch | Good |
| m09 RFID | Card reels at two hips | n/a | Lean in during conversation | Status rows; HaX "You've done this before" | Good reinforcement |
| m09 safe | Safe in office | Rent ledger, same room | PIN | Cracker makes it trivial | The deduction is optional and goes unremarked (E-m9) |
| m10 Base64 | Strip beside the sheet | None, same room | CyberChef, then the terminal | Two texts, neither names the encoding (`erb:1806-1807`) | Short loop, fine for reinforcement; add a recognition rung (E-m5) |
| m10 sleeper | Door log | Bench log, sign-out sheet, alibis | Name on the phone or face to face | HaX's Socratic alibi question (`266`), "three things that point somewhere" text | Strong. Optional by design |
| m10 outer lock | Lock panel | Worn keys, rota, code cards, Vos, Victoria | Code | HaX jammed here | Several good routes, all optional while the cracker works (E-m7) |
| m10 shutter | Power room | None | Click through HaX's three steps | Full instructions | Told, not done (E-m10) |

### 3.2 VM flag framing

| Flag | Why it matters, in story | Concept link | Verdict |
|---|---|---|---|
| m09 1 | Puts Series R behind the cage; opens the stacks | "The catalogue's the index. Find the part that isn't public." (`798`) | Good |
| m09 2 | The live ledger: WREN, the twenty-three, H&L's number | "The live ledger sits where only the machine's keeper can reach." (`770`) points at privilege | Good |
| m09 3 | Whose box it is; the name | "Somebody set it up and never handed it back" (`702`); guide hint "old accounts nobody closed" (`1016`) | Good; E-M4 would make the account-lifecycle point explicit |
| m09 4 | The mirror job and the Publication | "Take the whole box" (`699`) | Fine |
| m10 1 | HaX owns their monitoring: reads the door log, opens the inner door | No hub steer; "Their monitoring" only. Nothing says why an attacker goes for the defender's tools | Add a steer and the concept (E-m6) |
| m10 2 | The staging schedule: shares, buyers, the console's one action | Clear from the console topics | Good |
| m10 3 | The disarm | "The release service runs in a container on the host under it. Get out of the container onto that host" (`516-517`) | Good, the clearest concept line in m10 |
| m10 4 | His box, the feed, the open vault line | No concept line; "Get on his box" | Missed link to his own "build your own way out first" (E-m6) |

## 4. Building on m01-m08, and assessability

**Progression.** The arcs build well. Disclosure runs m02 (publishing the board's cover-up) and m04 (telling Albion's public) into m09's vendor notice and m10's database, and Tesseract reads the player's m04 choice back to them (`m10_tesseract.ink:282-323`). Insider threat runs m05 (indicators) and m08 (a door audit against a timestamp) into m09's recruiting ledger and m10's sleeper, and HaX ties m08 in directly: "Last time you named one of ours on a hunch. Do this one on paper." (`m09_phone_agent0x99.ink:254`). The VM work moves from footholds and sudo (m05-m09) to isolation escapes (m10), which is a sensible last step. The gaps are the crypto line (m02 encoding, m08 ROT13, m09 Vigenère: never connected, E-M2) and incident disclosure versus vulnerability disclosure (E-m3).

**Assessability.** `concludeRequires` holds the four VM flags in each mission, so the technical core is server-checked. In m09 the browser concepts are on the critical path: the salvage keypad gates flags 3 and 4, the cabinet print gates Nightshade's file, which gates the identity scene, which `take_tomb_beta` needs. In m10 almost none of the browser reasoning is required: the deduction and the Base64 are optional, and the PIN cracker or a guided call opens every remaining lock (E-m7). The three Tesseract exchanges are the finale's best assessment of reasoning, because a player with no carry-over can still land all three with evidence found that night; the player is never told afterwards which points landed or why (E-n5).

## 5. Ethics

What works, and should be kept:

- Costs said before the choice, every time. The notice: "Our watch sits on that kit. Send it, the vendor starts a fix, and the watch comes down." The database: each of three options is priced by Netherton and HaX before the menu (`m10_tesseract.ink:1033-1059`).
- HaX declines to decide, twice: "It isn't my call. It isn't yours either." (`m09:524`) and "No. This one's yours. If I choose, I'll choose for the wrong reasons." (`m10:1084`). Netherton: "I would have said yes. I would have taken a week to say it." (`m09_closing_debrief.ink:200`).
- The villain was right once. His 2017 memo argued for warning the vendor; the board kept the flaw. The player can say "About Albion, yes. About tonight, no." and he calls it "the first honest thing your service has said to me in seven years".
- Outcomes land in the debrief either way: forty vendors and a year of fitting, three water utilities on manual valves, "Two maps now", a suspension.
- The Join ending takes three confirmations and says plainly what it is. Lethal force and execution are separated by a signposted line and by who signs afterwards.

What needs work is small: E-m1 (the coordinated kind ends in publication), E-m2 (name the real-world decision a service makes when it keeps a flaw), E-m3 (one line separating "tell the public what happened" from "tell the vendor about the hole"), E-m4 (Asante's "every vendor patches in a week" goes unanswered where she says it), and E-n6 (HaX states the verdict on Tesseract before the player has argued).

## 6. What a learner at this point should get and doesn't

- That Vigenère is encryption with a key, and why that differs from the Base64 and ROT13 they decoded earlier (E-M2).
- Credential lifecycle: leavers, compromise, reissue, and what a door log does and doesn't prove (E-M4).
- A name for the insider-threat levers they have now seen across three missions (E-M3).
- That a service keeping a flaw for its own use is a real, named decision governments make, not only fiction (E-m2).
- Supply-chain trust: kit that skipped procurement came off the enemy's bench (E-m8).
- That security tools are software with their own holes, which is why the monitoring host is the first target (E-m6).

## Findings

Line numbers are for the working tree on 2026-10-22. "Voiced" means the line has or will have a TTS clip, so changing it costs a regeneration; unvoiced fixes are preferred where both would work.

### Major

**E-M1. Full disclosure is defined wrongly, twice.**
`m09_digital_archaeology/ink/m09_phone_agent0x99.ink:574-575` (unvoiced), `m10_full_disclosure/ink/m10_director_netherton.ink:138` (voiced), and the fixed string in `m09_digital_archaeology/CONTRACT.md:89`.
Both say full disclosure is publishing "after the vendor stops answering". Full disclosure means publishing a flaw's details to everyone at once; researchers often do it because a vendor stopped answering, but publishing after a vendor goes quiet is also the last step of coordinated disclosure, so the line as written blurs the two terms the missions most need to keep apart. The D-02 note (`planning_notes/.../finale/FINALE_ARC.md:26`) had "usually after a vendor has stopped answering"; "usually" and "to everyone" were lost on the way to script.
Fix, m09 (two bubbles, under the 25-word cap):
> Full disclosure is one researcher publishing one flaw, in full, to everyone. Usually because the vendor stopped answering.
> His notice was the coordinated kind: vendor first, time to fix it, then the public. This is every weapon we hold, handed out at once.

Fix, m10 (one new clip):
> Director Magnus Netherton: Full disclosure is one researcher, one flaw, published to everyone, usually after the vendor stops answering. This is every weapon we hold, handed out at once.

Update CONTRACT.md:89 in the same edit, since it marks the string fixed.

**E-M2. Vigenère is taught as a tool step, not as the first keyed cipher.**
`m09_phone_agent0x99.ink:723-728` (hub, unvoiced), `m09_phone_gary.ink:29-31`, `m09 scenario.json.erb:2227` (chart), `m09_digital_archaeology/mission.json:47-49`.
m02 taught "Encoding isn't encryption ... No secret key. Reversible by anyone with the right tool" (`m02_phone_agent0x99.ink:695-697`), and m08 used ROT13. Vigenère is where that lesson pays off: the first thing in the season CyberChef can't undo without a key. Tier 2 says only "It's Vigenère." Tier 3 gives the tool. Gary's call says "Vigenère, and the bay's word is the key". The archive-code field guide doesn't exist yet. Nobody says what kind of thing this is, or how it relates to the shifts the player already knows. The chart's house rule ("Never write a code down. M.S.") hanging beside the keypad that it keys is a Kerckhoffs lesson nobody draws.
Fix, tier 2 (`724-725`):
> It's Vigenère. A cipher this time, not an encoding. Without the key, nobody reads it.
> The key is the salvage bay's word, on the chart by the keypad.

Fix, tier 3 (`727`), one line before the existing one:
> ROT13 moved every letter thirteen places. This moves each letter by the next letter of the key.

Fix, a new unvoiced HaX text on `global_variable_changed:salvage_opened` (`value === true`, once, `delayMs: 2000`), in the `hax_maps` block near `erb:273-278`:
> She never wrote a code down. She hung the key beside the lock. A cipher is only as safe as its key.

Gary (`m09_phone_gary.ink:30`), optional: "Read it like a shelf mark, not a number. Vigenère: every letter shifted by the next letter of the bay's word." When the archive-code guide is written, it should open on the encoding/encryption distinction and the ROT13 link. For the CyBOK change see E-m11.

**E-M3. Insider-threat motives and recruitment signs are shown everywhere and named nowhere.**
`m09 scenario.json.erb:1856` (The Last Box), `erb:350-356` (the legacy-box texts), `m09_noor_haddad.ink:118-142`, `m09_closing_debrief.ink:205-251`.
The legacy box's notes column is a lesson in itself: "Wants out. Remind her of her son.", "Drinks. Watch.", "Lonely.", "Enjoys it.", "Never asked for anything yet. Will be." Noor's five-hundred-dollar bonus and her father on dialysis show how a recruiter spots and assesses. Derek: "Motive: belief." The 2011 assessment: "No payment. Belief is the payment." H&L: both candidates' next of kin in nursing homes. None of it is named, and nothing echoes m05's debrief, which ends "For the training file: money ... hours ... an approach ... a boss who told Security to stop asking" (`m05_closing_debrief.ink:363-395`). A learner sees the pieces and never gets the frame.
Fix, a second unvoiced HaX text on the same triggers as A3-27a (`erb:350-356`), 5 s after it:
> Read the notes column. Money, a son, a drink, a lonely night. That's how she chose them, and how she kept them.

Fix, Noor (`m09_noor_haddad.ink:140`, inside `reach`, before "She's a witness now"):
> Agent HaX: That's how they start. A kindness, then a need they already knew about.

Optional, debrief `the_archive` (voiced): when `said < 2` and the legacy box was read, Netherton: "Eleven people, eleven reasons. Money for most. Something they loved for the rest." In m10, Kowalczyk's motive ("Eleven years she paid my mum's care home", `m10_six_oclock.ink:181`) plays only on the `taken` branch; let the `bench` line fall back to it on the other branches too.

**E-M4. Credential lifecycle is the plot of both missions and is never stated.**
m09: `m09_phone_agent0x99.ink:384-385`, `488-491`; `erb:2304` (property label), `erb:368`.
m10: `m10 scenario.json.erb:183-195` (Citadel Incident File V-47 text), `erb:304-322` (alarm log), `m10_phone_agent0x99.ink:235-244` (door_log, unvoiced).
Tesseract's staff credential ran seven years after he left; his server was signed out and never returned. In m10 the vault's personnel index (1,206 badge records) was stolen and loaded into his reader table, and WREN cloned Malhotra's unattended badge. The door log says Malhotra; Malhotra was on the line with HaX. The game asks the player to reason from that, and never says the two lessons out loud: leavers' access goes when they do, and after a compromise every affected credential is revoked and reissued, because a log entry authenticates a card and not the person holding it.
Fix, m09, an unvoiced HaX text on `identity_scene_done` (once, `delayMs: 4000`):
> When someone leaves, their accounts and their kit come back the same day. His never did.

Fix, m10 door_log (`m10_phone_agent0x99.ink:242-244`), replace the reply to "[So somebody has a copy.]":
> That's how I read it. A door log proves a card was there. Not who held it.

Fix, m10 Citadel Incident File V-47 (document text, no audio), add an item 5:
> 5. Badges. The 1,206 badge records taken with the catalogue are void from day 13. Reissue in hand. Until then, a badge read proves a card, not a person.

### Minor

**E-m1. Coordinated disclosure is described without its last step.**
`m09_phone_agent0x99.ink:575`; `m10_tesseract.ink:1044` (voiced).
"Vendors first, quietly, with time to fix" stops before publication, which is what separates coordinated disclosure from keeping a secret. The m09 half is in E-M1's fix. For m10, if the clip is regenerated anyway: "That's coordinated disclosure. Vendors first, with time to fix, then the public. The ones nobody can patch go to the operators, with workarounds." If not, the database button (`m10_tesseract.ink:1073`) can carry it at no audio cost: "[Coordinated disclosure. Wipe theirs, send ours to the vendors, publish once they've fixed.]"

**E-m2. The decision to keep a flaw is never named as a real practice.**
`m09_phone_agent0x99.ink:504` ("We marked this hole 'retain'"), the hub notice topic (`841-851`).
Learners should know governments make this call for real (vulnerability equities). One unvoiced line in `notice_ask`'s "[Not yet.]" branch or as a first line of the hub topic:
> Every service that finds a hole makes this call. Keep it to use, or tell the vendor so everyone's safe. We kept this one nine years.

**E-m3. Incident disclosure and vulnerability disclosure are run together.**
`m09_phone_agent0x99.ink:502-514`; `m10_tesseract.ink:289-298`.
m04's choice was what to tell the public about an attack; m09's is whether to tell a vendor about a flaw. Tesseract treats them as one ("That was my lesson, delivered by you"), which is fine for him, but nobody on the player's side ever separates them. Add one unvoiced HaX line in `afterwards`-style text or in the notice topic: "Albion's inquiry was about what happened. This is about the hole itself, and who else has it."

**E-m4. Asante's "every vendor patches in a week" goes unanswered where she says it.**
`m10_full_disclosure/ink/m10_asante.ink:36-39`.
Netherton answers it later, but a learner who talks to her first hears a wrong claim from a credible engineer with no reply. Add a follow-up choice after her line, once:
> [Some of those controllers will never get a patch.]
> Dr Abena Asante: Then they should never have been on a network. *pause* That isn't the hospitals' fault, I know.

**E-m5. The Base64 hint has no recognition rung.**
`m10 scenario.json.erb:1806-1807`.
The two texts are "Not plain English" and "Copy just the code." m02 taught the cue ("A long run of letters, digits and the odd equals sign at the end is Base64", `m02_phone_agent0x99.ink:499`). Reinforcement is the place to have the player recognise it rather than be told. Add a third text, `skipIfGlobal: margin_note_read`, at about 30 s:
> Upper and lower case, digits, no spaces. You've seen that shape before.

**E-m6. m10's flags 1 and 4 have no hub steer and no concept link.**
`m10_phone_agent0x99.ink:74-105` (hub), `m10_tesseract.ink:189-202`.
m09 gave a one-line steer per flag on the hub; m10 has one only for flag 3 (`hatch_topic`), the clearest concept line in the mission. Concept-level wording only, with no VM detail; please have the opus48 agent or the user confirm it against the built VM before it goes in.
Flag 1, a hub topic gated `door_scene_done and not flag1_submitted`:
> [Their monitoring. Where do I start?]
> It's their eyes, and it's software like anything else. Get a foothold on it and their own desk works for us.

Flag 4, a hub topic gated `outer_lock_open and not flag4_submitted`:
> [His box.]
> He boxed it in, like the container upstairs. He always builds his own way out first. Find his.

**E-m7. The PIN cracker skips every reasoning route in m10, even after the story shows it came off his bench.**
`m10 scenario.json.erb:1330-1337`, `3907-3921`; `m10_kowalczyk.ink:236`.
The worn keys, the rota and Fonoti, Vos's card and Victoria are all good routes to `6083`, and none is needed. Once the player has seen the cracker rack or named Kowalczyk, the story itself gives a reason to put it away. Small fix: an unvoiced HaX text on `sleeper_caught` (or on `workshop_entered` once the rack is read):
> Her cracker came off his bench. I wouldn't trust it at his door. The keys' wear and the rota will get you in.

A firmer option, with precedent in m09's office (`m09 erb:1937-1949`, made a password lock "so the PIN cracker can't skip it"): make the outer lock a password-type keypad. That makes the code card, the dusted keys or a pretext required, so run it past the puzzle-chain plan before changing it.

**E-m8. Supply-chain compromise is dramatised and never named.**
`m10 scenario.json.erb:193`, `347-350`; `m10_six_oclock.ink:182`.
160 units, four batches of 40, a cracker "never through stores" from the same matte casings. The interrogation uses it well. A one-line close in the debrief would name the lesson; in `kow_reply`'s `bench` branch, after "The paperwork. It's always the paperwork.":
> Agent HaX: Everything we carry comes through stores for a reason. Hers came off his bench.

**E-m9. The safe's date-as-PIN deduction goes unremarked, and the text credits the cracker either way.**
`m09 scenario.json.erb:262`.
"Safe's open. Kowalczyk will want to hear about her toy." fires however the safe opened. Split it: keep the line under `!globalVars.rent_ledger_read`, and add one under `globalVars.rent_ledger_read`:
> Lease date. People pick numbers they'll never forget. So can we.

**E-m10. The shutter is told, not done, and two callers describe the key switch wrongly.**
`m10_phone_agent0x99.ink:705-740`; `m10_elena_phone.ink:57`, `m10_vance_phone.ink:52` (voiced); `m10 scenario.json.erb:3310` (Shutter Isolator).
HaX has it right: "Turn the key a quarter. That takes the row off their board" (taking it out of remote control). Elena and Vance say the key "isolates the feed. Nothing moves yet", which reads as cutting the power and makes the breaker step look redundant. Align them with HaX ("That takes it off their board. It's ours now, not theirs.") when those clips are next regenerated. To let the player do it, give the isolator a readable label row (`text`: "GALLERY SHUTTER. 1 HALL LIGHTS. 2 HALL RACKS. 3 SHUTTER DRIVE. 4 GALLERY CCTV.") and change `cut_step_2`'s first line to "Find the shutter's breaker on the row. Pull that one, nothing else", keeping "third from the left" for the "Give me a minute" return.

**E-m11. Both CyBOK blocks fail the checker: m09 9 errors, m10 18; m08 is clean.**
`m09_digital_archaeology/mission.json:35-86`; `m10_full_disclosure/mission.json:35-76`. Checker: `python3 -I "CyBOK Mapper/scripts/check_hacktivity_cybok.py" --hacktivity Hacktivity/app/models/cybok.rb <mission.json>`.
Main problems: topics that don't exist ("Vulnerability Disclosure" under SSL in m09 and under LR in m10, so the two missions file the same concept differently; CPS "Physical Security"; HF "Human Factors"; NS "Network Security"), which m05's rebuild already ruled out; `VIGENERE CIPHER`, `SERVICE FINGERPRINTING`, `ATTACKS AGAINST SUDO` not index terms; `BASE64` and `ENCODING` under Symmetric Cryptography, which contradicts m02's in-game lesson; m09 lists ENCODING with no encoding puzzle. m10 also leaves out the AAA (badges, prints, PINs), audit-trail and supply-chain work it teaches.
Suggested replacements, each built only from tree lines or index terms the reference lists (run the checker after pasting; "customers don’t apply patches" uses a curly apostrophe in the reference):

m09:
- AAA / Authentication: user authentication, BIOMETRICS, SMART CARDS, PERSONAL IDENTIFICATION NUMBER AND MEMORABLE INFORMATION (unchanged)
- AB / Characterisation of Adversaries: THE INSIDER THREAT, SOCIAL ENGINEERING
- C / Symmetric Cryptography: CIPHER(S) - POLYALPHABETIC
- LR / Ethics: vulnerability testing, VULNERABILITY DISCLOSURE, PUBLIC DISCLOSURE
- SSL / Motivations for Secure Software Lifecycle: customers don’t apply patches, VULNERABILITY RESPONSE AND DISCLOSURE
- OSV / Primitives for Isolation and Mediation: physical access and secure deletion, authentication and identification, PRIVILEGE ESCALATION
- NS / Networking Applications: NMAP, PORT SCANNING
- WAM, SS, SOIM: as now

m10:
- OSV / Role of Operating Systems: isolation, virtual machines, CONTAINERS, CHROOT
- OSV / Primitives for Isolation and Mediation: physical access and secure deletion, authentication and identification, PRIVILEGE ESCALATION
- NS / Network Security Tools: network security monitoring
- NS / Networking Applications: NMAP, PORT SCANNING
- WAM / Server-Side Vulnerabilities and Mitigations: injection vulnerabilities, server-side misconfiguration and vulnerable components
- AAA / Authentication: user authentication, BIOMETRICS, SMART CARDS, PERSONAL IDENTIFICATION NUMBER AND MEMORABLE INFORMATION
- AB / Characterisation of Adversaries: THE INSIDER THREAT, SOCIAL ENGINEERING
- AB / Elements of a Malicious Operation: SUPPLY CHAIN ATTACK
- F / Definitions and Conceptual Models: AUDIT TRAIL
- LR / Ethics: vulnerability testing, VULNERABILITY DISCLOSURE, RESPONSIBLE DISCLOSURE
- SSL / Motivations for Secure Software Lifecycle: customers don’t apply patches
- F / Artifact Analysis (or drop): ENCODING, for the Base64 strip

Check the AB/F/SUPPLY CHAIN topic placements with the checker; the index lists SUPPLY CHAIN ATTACK under ADV and AUDIT TRAIL under FOR, but I have not run these exact blocks. The VM-facing entries rest on `mission.json`'s own vulnerability list and should be confirmed against the built VMs.

### Nits

**E-n1. The guard's log has no payoff.** `m09 scenario.json.erb:1065-1070`. "FRI. SAME. NOBODY READS THIS." is a clean lesson in logging without review. An unvoiced HaX text on reading it: "Five nights of warnings, and nobody read them. A log nobody reads is a diary."

**E-n2. Say the keyspace on the dusted keypad.** `m10 erb:3917`. Append to the dusted variant: "Four digits, each used once: twenty-four possible orders."

**E-n3. Malhotra's unattended badge is the root of the clone and nobody remarks on it.** `m10 erb:2139`, `2526`; `m10_six_oclock.ink:203`. If Malhotra was wrongly sent back, his line could own it: "I left my badge on the step for ten minutes. That's all it took."

**E-n4. The PIN cracker's feedback is fiction presented as kit.** `m09 erb:619`, `m10 erb:1334`. Real keypads don't report "right digit, wrong place". It is a season-long mechanic, so leave the mechanic; when the lab sheet covers it, say it stands in for real attacks (wear, thermal residue, default codes).

**E-n5. The player never learns which of their three answers landed.** `m10_tesseract.ink:1137-1150`. "You've beaten me" plays only at the key. A single Narrator line after exchange 3, or a credits clause ("Landed: the sums, the notice"), would close the loop.

**E-n6. HaX gives the verdict on Tesseract before the player has argued.** `m10_tesseract.ink:425`, "Wrong about the answer. So is he." It plays before exchange 1 on the m02 branch. Cut "So is he." and let the exchanges decide it.

**E-n7. The chart's house rule could send a player to the wrong word.** `m09 erb:2227`. "cage and keypad codes use the bay word": the restricted cage is bay 10 (WATCHTOWER). HaX's hint names the salvage bay, so this only costs a wrong try. "Each keypad takes its own bay's word." removes the doubt.

**E-n8. No season-end summary of skills.** The finale's debriefs recap choices, not skills. That belongs in the lab sheet, written last; note it there rather than in game.

## For the user

- E-m6's two lines and E-M4's "Never revoked" wording sit next to VM content. They are concept-level only, but route a check against the built VM through opus48 before they ship.
- Voiced lines touched if all fixes go in: m10 Netherton (E-M1), m10 Tesseract (E-m1, optional), Elena and Vance (E-m10, optional), m09 debrief (E-M3, optional). Everything else is unvoiced text, hub ink or document text.
- Ideas beyond the mission, for `docs/IDEAS_BACKLOG.md`: an ink tag to take an item away (the cracker after the reveal, E-m7); a short "concept card" in the field-guide pattern that the hub could show in game while lab sheets are pending.
