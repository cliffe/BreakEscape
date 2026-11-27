# VM integration review — Licence to Hack (m01–m10)

## 1. Purpose, scope and method

SAFETYNET: Licence to Hack is a ten-mission TV-spy-thriller campaign. Each mission ends on VM CTF
flags that are meant to be woven into the story rather than bolted on as an exercise. This review
asks one question per mission: does the VM work feel like part of the investigation — motivated,
oriented, rewarded, and never stranded — judged against the m01 reference and the eight criteria
(motivation, way in, orientation, payoff, pacing, teaching, recovery, consistency).

The review ran in three phases:

- **Phase 1 — game side.** Reviewers read each mission's scenario, ink, mission.json, CONTRACT.md
  and playtest reports, scored the first seven criteria, and parked every claim about VM contents
  as a question. They did not open SecGen, VM docs, lab sheets or the exploit field guides. Four of
  these reviews were started on Opus 5.5, stopped mid-run by the Cyber Safety classifier, and redone
  on opus48 (Opus 4.8); the m08/m09 pair was interrupted and m09 rewritten in a fresh pass.
- **Phase 2 — VM side.** A separate checker (opus48) read SecGen and the VM build docs and answered
  the game-side questions at concept level only — service and vulnerability classes, account and
  flag and story names, and what each document says in story terms. No commands or techniques. The
  game reviews fold those answers back into their scores, and criterion 8 (consistency) is scored
  from the VM side only.
- **Phase 3 — this merge.**

**Caveat that colours everything below.** No playtest has yet done real VM work. Every recorded run
typed supplied stand-in flags at the stations. So the judgements cover the game's *framing* of the
VM — the briefing, the signposting, the station, the payoff reaction, the clock — not the experience
of actually attacking a box. Difficulty, timing and the real per-build flag order are unverified. A
real end-to-end VM playtest is the outstanding gap for the whole campaign.

Policy context (user decision F20, `scenarios/FINALE_DEV_LOG.md:513`): no hard-VM-gating retrofit for
the shipped missions m01–m08. Game-side fixes are preferred; a VM change is raised only where the
experience is poor without it, and said so. m09 and m10 are unshipped and were built under the newer
gating rule (each VM step needs an in-game find; the VM holds story artefacts; never a flag you can't
yet submit). Their VM gaps are build-stage items for the user's pending SecGen build (F9), not shipped
defects, and are tagged as such.

## 2. Hard rules

The user has set two hard rules for every mission m01–m10:

- **H1 — the VM is on the critical path.** The mission cannot reach credits/debrief without its VM
  flags, reasoned from the dungeon graph and the conclude gate.
- **H2 — the VM is diegetic.** The terminal is a thing in the world, flags are story things submitted
  at in-world objects, a character cares before and reacts after, and out-of-fiction words are not
  shown to the player. m01 is the good-practice example.

A separate checker ran both rules against each mission's scenario, dungeon graph and the engine. The
headline: **H1 is a clean pass for all ten** — no reachable route completes a mission without its VM
flags — and **H2 passes for all ten** (m08 with a caveat), but every VM mission inherits the same
engine-level "terminal chrome" breaks.

| Mission | H1 | Critical-path flags | Bypasses | Graph shows VM | H2 | Biggest diegesis break |
|---|---|---|---|---|---|---|
| m01 First Contact | Pass (caveat) | flag_1/2/4 via `concludeRequires`; flag_3 via the finale launch aim | none | yes (4 vm + 4 flag) | Pass | Launcher object "VM Access Terminal" + panel copy ("a computer terminal in the game") + raw title "kali" |
| m02 Ransomed Trust | Pass | submit_ssh/proftpd/database/ghost_log | none | yes | Pass | "VM Access Terminal" launcher object + panel copy |
| m03 Ghost in the Machine | Pass | submit_network_scan/ftp/http/distcc | none | yes | Pass | "VM Access Terminal" launcher object + panel copy |
| m04 Critical Failure | Pass | submit_network_scan/ftp_intel/privesc/erlang_rce | none | yes | Pass | Shared panel copy + raw title "kali" (launcher object name is in-world) |
| m05 Insider Trading | Pass | submit_flag1..4 | none | yes | Pass | Shared panel copy + raw title "kali" |
| m06 Follow the Money | Pass | submit_flag1..4 | none | yes | Pass | Shared panel copy; debrief "build service" the box does not run |
| m07 Architect's Gambit | Pass | recover_coordination/intercept_c2/escalate/terminate_cascade; win object flag-locked | none | yes | Pass | "VM Access Terminal" launcher object + raw title "attack_vm" |
| m08 The Mole | Pass | recover_gitlist/stashed_creds/home/escalate_root | none | yes | Pass (caveat) | Launcher titled "GitList Repository Server" shows the Kali box's own IP (title "kali") |
| m09 Digital Archaeology | Pass | submit_catalogue/ledger/owner/control | none | yes (2 stations) | Pass | Shared panel copy + raw title/IP; no in-game target address |
| m10 Full Disclosure | Pass | submit_flag_1..4 (doors + Tesseract case gate on them) | none | yes (4 vm + 4 flag) | Pass | Reward popup reads "Event triggered" on every capture; shared panel copy |

**Conclude fail-open (shared H1 caveat).** `concludeMission()` fails open: if the `/conclude` request
errors (offline, a 5xx, a non-JSON 200) it returns `{concluded:true}` and rolls the normal MISSION
COMPLETE credits, while the server record stays `in_progress`
(`public/break_escape/js/music/scenario-music-events.js:273`–`300`; orchestrator verified). It is not a
player-reachable flag bypass — it needs a server/network fault and nothing is recorded as complete — but
the player sees the same credits as a genuine finish. m01 has a related wrinkle: `concludeRequires` lists
only three of its four flags (`scenario.json.erb:471`–`472`), with flag_3 kept load-bearing by the finale
launch aim, so a future edit to that aim could silently drop a flag from the critical path without the
conclude gate noticing. Raised as R14 (fail-open) and R29 (m01 flag_3 explicit).

**Terminal chrome (shared H2 break).** The diegesis weakness is identical in every VM mission and lives
in the engine: the launcher panel copy breaks fiction and leaks the delivery mechanism, the station badge
shows the raw SecGen system id, and event-reward flags pop "Event triggered". These are logged as R10,
R8 and R1 and marked as touching shipped missions, but the two engine files are unmodified from HEAD, so
the breaks are live — confirm the fixes actually land, because H2 rests on all three. A fourth, narrower
break is that four missions (m01/m02/m03/m07) name the launcher *object* "VM Access Terminal", an
out-of-fiction interaction label the other missions avoid (R11).

## 3. The m01 reference rubric

m01 First Contact is the benchmark, not a perfect build. Paths are relative to
`scenarios/m01_first_contact/` unless shown in full.

### The patterns worth copying

- **P1.** A story reason is spoken before the console appears — the attack server is a live weapon
  on a deadline (`ink/m01_opening_briefing.ink:131`, `:394`).
- **P2.** Access and the login's ingredients are both gated by earlier office puzzles, so the VM step
  cannot start until the story hands over the way in (`scenario.json.erb:1934`–`1945`, `:1283`–`1306`).
- **P3.** The brute-force wordlist is a real in-world object, and it is the villain's own: the VM's
  crackable account uses exactly that list (`scenario.json.erb:1298`–`1303`; VM `m01_first_contact.xml:83`–`114`).
- **P4.** One clue names the host, the account and the purpose, so orientation never depends on
  guesswork (`scenario.json.erb:1293`, `:1304`).
- **P5.** Flags go into in-world objects themed to what the flag is — the encrypted archive, the
  drop-site terminal, the launch device — not one abstract scoreboard (`:2087`–`2106`, `:2059`–`2086`, `:1383`–`1404`).
- **P6.** The VM holds story artefacts the game then consumes: a decryption key that opens the archive
  carrying the Architect reveal, and a launch code that arms the finale's choice (`:2107`–`2124`, `:1395`–`1404`).
- **P7.** Every submission gets a handler reaction and a next-step nudge (`:925`–`1010`).
- **P8.** Field guides arrive just-in-time at each VM step (`:612`–`636`, `:765`–`788`).
- **P9.** In-world stuck-help scales from nudge to recipe, only once the matching step is live
  (`ink/m01_phone_agent0x99.ink:120`–`215`).
- **P10/P11.** Wrong-flag feedback is specific and non-punishing, and a flag typed at the wrong object
  returns a hint without being consumed (`utils/flag-wording.js:9`, `:32`–`41`; drop-site `hintOnlyFlags`
  `scenario.json.erb:2068`–`2071`).
- **P12.** The ending genuinely requires the technical work (`:467`–`472`).
- **P13.** The debrief reflects the concepts (`ink/m01_closing_debrief.ink:543`).

### Where m01 itself falls short

- **S1 (criterion 2, the hard rule).** The launch code can be captured long before its only
  submission point — the launch device, taken from Derek at the finale — exists, so it can be held
  with nowhere to enter it; softened, not closed, by a drop-site hint (`scenario.json.erb:1382`–`1404`, `:2070`).
- **S2 (criterion 5).** VM capture is front-loaded: all four tasks go active together and every flag
  is earned in one server-room sitting (`:325`–`378`).
- **S3 (criterion 8, invisible to the player).** Objective task ids and station-local flag names don't
  line up with the VM flag numbers — a maintenance hazard, not a play bug (`:358`–`377`, `:2096`).
- **S4 (criterion 6).** The debrief credits "the technical evidence" generically and never names the
  player's own access→escalation→recover-and-use arc (`ink/m01_closing_debrief.ink:101`, `:543`).
- **S5 (criteria 3/7).** The way-in clue chain is deep (office note → decode → safe in another room);
  a player who reaches the server room early finds the terminal with only an indirect pointer
  (`scenario.json.erb:1934`–`1945`, `ink/m01_phone_agent0x99.ink:170`).

### Corrected hypotheses

- **H1.** "Kali is reachable early, the first useful step needs a password list found behind puzzles."
  The "behind puzzles" half holds; corrected on two points — the audit terminal is *not* early (it is
  behind the IT-room PIN and Kevin's keycard, opening mid-mission), and the wordlist is Derek's own,
  from a safe, not Kevin's.
- **H2.** "The VM holds a story artefact the game relies on." Held, and stronger: two consumed
  artefacts, the launch code and the archive decryption key.
- **H3.** "Flags are submitted at in-world stations and characters react." Held — three themed objects,
  a handler reaction on each.

## 4. Scorecard

S = strong, A = adequate, W = weak. `X→Y` means the VM check moved the score from X to Y. Criterion 8
(consistency) is VM-side; the m01 cell reflects its S3 internal-id hazard. m01 is the benchmark row.

H1/H2 are the hard rules from section 2 (Pass/Pass*, the * flagging a caveat).

| Mission | 1 Motiv | 2 Way in | 3 Orient | 4 Payoff | 5 Pacing | 6 Teach | 7 Recov | 8 Consist | Overall | H1 | H2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| m01 First Contact | S | A | S | S | W | A | S | A | Reference | Pass* | Pass |
| m02 Ransomed Trust | S | S | S | S | A | A | S | S | Strong | Pass | Pass |
| m03 Ghost in the Machine | S | S | S | A | W→A | S | S | S | Strong | Pass | Pass |
| m04 Critical Failure | S | S | S | S→A | W | A | S | A | Adequate | Pass | Pass |
| m05 Insider Trading | S | S | S | S | W | S | S | S | Strong | Pass | Pass |
| m06 Follow the Money | A | A | A | S | W/A | A | S | A | Adequate | Pass | Pass |
| m07 The Architect's Gambit | S | S | S/A | S | S | S | S/A | S | Strong | Pass | Pass |
| m08 The Mole | A | A | A | A | A | A | S | A | Adequate | Pass | Pass* |
| m09 Digital Archaeology | S | W | A | S→A | S | A | S | W | Adequate | Pass | Pass |
| m10 Full Disclosure | A | S→W | S | S→A | A | A | A | W | Adequate | Pass | Pass |

m09 and m10 scored against the newer gating rule as well as m01. Their weak criterion-2 and
criterion-8 cells are VM build gaps (F9), not shipped defects. The H1 and H2 asterisks are the
caveats in section 2: m01's flag_3 rides the finale aim rather than the conclude gate, and m08's
launcher title/address can mislead.

## 5. Per-mission notes (m02–m10)

Paths are relative to `scenarios/<mission>/`; "erb" = `scenario.json.erb`.

### m02 Ransomed Trust (shipped)

Feels like a real investigation with the server work as its spine. Two clocks (12h life support, 4h
board vote, `ink/m02_opening_briefing.ink:230`) make the player want in fast, and flags 3 and 4 pay
off in carried objects the finale needs — the Verified Restore Manifest and the staging-cache key
material both feed the Hospital Recovery Console (`erb:2311`–`2360`, `:2306`). The VM check confirms
every consistency claim (SSH credential, SC-4471 badge, ProFTPD backdoor, deployment log) and no
hard-rule breach.

- **Best moment:** flag 3's manifest turning the recovery console from locked to decidable — the VM
  output is the key to the moral finale.
- **Worst moment:** flags 1 and 2 land with only a phone line while flags 3/4 gave documents; the drop
  in tangibility is noticeable. Their rewards are `emit_event` only (`erb:2299`–`2305`).
- **Key evidence:** the one debrief line naming the technical arc — "the ProFTPD 1.3.3c backdoor,
  fourteen years unpatched" (`ink/m02_closing_debrief.ink:268`) — is gated off for the player who did
  all four flags (submitting the ghost log routes them to the manifesto lines instead). The
  completionist, who earned the reflection most, misses it (orchestrator confirmed the gate at ink:268;
  the backdoor line is suppressed when `flag_ghost_log_submitted`).
- **vs m01:** better on pacing (the four flags each open a different thread, fixing S2) and on the hard
  rule (no stranded flag, fixing S1); weaker on flag-1/2 payoff (emit-only where m01 themed every
  submission, P5) and the completionist debrief gate.

### m03 Ghost in the Machine (shipped)

A strong social-engineering first act — cloning Victoria's keycard — then a clean, well-oriented VM
block, let down by payoff. Flag 4's Transaction Log is a carried artefact that tips into the finale
(`erb:1572`–`1593`); flags 1–3 submit to write-only globals with no consumer, so three of four
captures change nothing the player can see beyond a HaX line (`erb:1568`–`1571`; `PASS5_PLAYTEST.md:62`).
The VM check confirms the decode is a real ROT13 step (teaching holds) and that flag 2 is literally
the same ProFTPD backdoor sold to Ghost.

- **Best moment:** flag 4 printing the invoice with Sable's sign-off and tipping into the revelation
  call and confrontation.
- **Worst moment:** submitting flags 1, 2 and 3 in a row and watching three toasts with no artefact
  and no room change.
- **Key evidence:** all VM work is one Act-2 night block (`erb:262`); the mission is social-then-
  technical rather than interleaved. The revelation call opens "the distcc logs you just submitted" as
  if read, while `find_operational_logs` is still open.
- **vs m01:** beats m01 on teaching (debrief names the arc unconditionally, fixing S4); below m01 on
  payoff (consumes one artefact where m01 consumed two and themed three stations, P5/P6) and the
  weakest of the set on pacing — all VM work deferred to one block.

### m04 Critical Failure (shipped)

Well-motivated and well-oriented, and the countdown makes the capture matter: the root flag reveals
the attack mechanism in-world and arms the ESD (`erb:1122`, `:1342`). But the VM gives back nothing
the game reads — the check confirms three of the four leaked files contain only the flag, not the
document their names promise; only flag 1's falsified rack-status page is a real artefact (payoff
S→A).

- **Best moment:** the root flag becoming the in-world "charge-ceiling override on every bank" reveal.
- **Worst moment:** a single undifferentiated four-flag sitting in a quiet workshop, compounded for a
  VM-playing student by a debrief that credits a compile service they never touched.
- **Key evidence:** `ink/m04_closing_debrief.ink:283` still credits "a legacy compile service …
  trusting whatever it was sent" (distcc), but flag 4 is now the Erlang/OTP SSH foothold
  (`erb:369`, `:1096`). The VM check confirms the box runs no distcc at all — this is a content
  mismatch that mis-teaches the flag-4 lesson, not just stale wording (orchestrator confirmed ink:283
  still credits the compile service).
- **vs m01:** avoids S1 (no deferred station) and has a shallower way-in than S5; inherits S2 (one
  sitting); the stale debrief line is worse than S4 because it names a vulnerability the VM no longer
  has. The non-sequential task→flag numbering is correct, not a mis-mapping (confirmed VM-side).

### m05 Insider Trading (shipped)

The most story-integrated VM of the shipped set — the flags are evidence in a case, not a scoreboard.
Flag 3's manifest shows badge #4471 and no name, forcing the player to combine it with the door log
to name Torres (`erb:1173`); flag 4 recovers the Architect authorisation that feeds a confrontation
argument. The VM check confirms the badge-only manifest, the casualty projection, and 1:1 flag
numbering.

- **Best moment:** flag 3's nameless manifest crossing with the door log to name Torres.
- **Worst moment:** the "who" is largely given away before the VM (`PASS5_BLIND_A.md:112`), blunting the
  deduction the VM is meant to complete; plus the one-sitting capture.
- **Key evidence:** debrief names the portal's exact weaknesses (`ink/m05_closing_debrief.ink:351`), the
  clearest reflection of the set. A stray global `owen_refused_password` is set although Owen never
  refused (`PASS5_BLIND_A.md:118`).
- **vs m01:** stronger on payoff (a flag woven into a whodunnit) and debrief (fixing S4); fixes S3
  (1:1 numbering); inherits S2.

### m06 Follow the Money (shipped)

A confident financial-infiltration mission where the VM earns two story-load-bearing rewards: flag 3
gives the data-centre PIN that opens the physical path, flag 4 the recovery keys that make the freeze
choice possible in the Satoshi climax (`erb:2033`–`2056`, `m06_satoshi_confrontation.ink:322`). Flags
1–2 are bare stepping stones. The VM check confirms the foothold is an Apache Druid unauthenticated
RCE — an analytics service.

- **Best moment:** flag 4 arming the freeze-or-watch choice — the recovery keys are the difference
  between the two endings.
- **Worst moment:** flags 1→3 run back-to-back in one server-room sitting with no story beat between.
- **Key evidence:** the debrief and the FCA letter credit a **"build service"** (`m06_closing_debrief.ink:409`,
  `:454`), while every live line calls it an analytics/Druid service (`erb:1122`). The VM check confirms
  there is no build service on the box — this is a factual error, not a style slip (orchestrator confirmed
  the build-service wording still present at ink:409/:454). The only briefing VM line sits on an optional
  branch, so an "I'm ready" player meets the backend cold.
- **vs m01:** matches/beats P6 (two consumed artefacts); weaker on P2/P3 (nothing found in game is needed
  on the VM — the bond m01 prized is deliberately severed); cleaner ids than S3; same front-loaded shape
  as S2.

### m07 The Architect's Gambit (shipped)

The campaign's best VM-into-story weave. The host *is* the mission: each VM step's input is produced by
the previous one, the work threads through the building rather than bunching, flag 3 arms the visible
15-minute clock, and flag 4's root is literally the win condition (`erb:1012`, `:2089`). The VM check
confirms the four flags map 1:1 and resolves the apparent "two passwords" seam as intended design (the
listener leaks the per-build operator password; `CascadeWindow19` is a separate game-authored door
secret, bundled deliberately).

- **Best moment:** flag 1's decode exposing the cooked brief and letting the player redirect the tactical
  team — the hands-on NFS step arms the central moral choice.
- **Worst moment:** the "the moment you log in" wording. The redirect window and clock fire on flag-3
  *submission* (`erb:1012`), but the text repeatedly says it happens at login, so a careful player is
  pushed to decide before the evidence lands. The mission's one real integration flaw, and still live:
  the lines sit at `ink/m07_phone_agent_0x99.ink:367` and `:845` (R4, R5).
- **vs m01:** improves on S1 and S2 (no stranded flag, work threaded); the login-vs-submission wording is
  a consistency slip m01 doesn't have.

### m08 The Mole (shipped)

The VM is half the case in an internal investigation, which is the right weight. "The box gives you the
account and the time, the doors give you the man" is a good idea, said clearly and often, and flag 4
agrees with or chases the door-audit naming so the VM and the deduction need each other (`erb:799`–`835`).
In play, though, the box is a sealed room you clear before the story moves on. The VM check confirms a
clean login path (unlike m09/m10, the box leaks a real credential onto a real account) and no hard-rule
breach.

- **Best moment:** flag 4 after naming Nightshade on the door audit — "Logs agree with your door audit …
  It's Nightshade. You had him first." (`erb:803`).
- **Worst moment:** the first click on the launcher, titled "GitList Repository Server", showing the
  attack box's own address (172.16.0.3), with no story reason yet given for why the leak would be on a
  code server unless the player asked the Director an optional question or met Phantom.
- **Key evidence:** the VM produces no object the player holds — the terminal, time and 47 minutes are
  already on the printed excerpt by the rack (`erb:1872`), so flag 4 only confirms. The rooted account is
  never shown (random per build), yet Nightshade says "My account". The VM check finds the account
  identity is not unified on the box (login account, mail sender `deep_state_drop`, and log user
  `svc-planning` are three different strings), and the log file name differs from the in-game excerpt —
  reconcile at build before any line claims flag 3 and flag 4 name one account.
- **vs m01:** finer stuck-help (P9) and a deeper ending check (P12 — VM plus a game-side deduction); weaker
  on P2/P3/P4/P6 (nothing found feeds the VM, no clue names the host, the box produces flags not
  artefacts); repeats S2.

### m09 Digital Archaeology (not shipped; newer gating rule)

The most story-integrated VM of the set *as written*: the hacking is the spine of the finale — break into
the catalogue to learn what is burning, pull the ledger to see who is on ENTROPY's books, take Tomb Beta's
box to put the name Tesseract to the Architect and read the Publication's body count. The gap between that
writing and the drafted box is wide, and it is VM-side.

- **Best moment:** flag 3 plus the Nightshade-file hand-match triggering the voiced identity scene — the
  season's withheld name lands on a VM capture crossed with a physical deduction (`ink/m09_phone_agent0x99.ink:402`–`411`).
- **Worst moment:** capturing flags 3–4 off a box reachable from Act 1, then carrying them through the
  office, safe, tape room and a Vigenère keypad before any station will take them.
- **Key evidence (VM check):** both target hosts are live from Act 1 and both footholds are unauthenticated,
  so the login slips (`catalogsvc`/`Catalog!Helena2016`, `nostromousr`/`TombBeta!Enrol16`) gate nothing and
  those accounts/passwords don't exist on the drafted boxes (hard rule breaks for flags 3–4, criterion 2
  weak). The catalogue box's flag-1/2 files carry only the flag string — the Series R index and ledger body
  live only on the game drop screen (payoff S→A). Tomb Beta is richly seeded (Tesseract credential, Albion
  memo, mirror-job schedule). Account name mismatch (`catalogsvc` vs module default `druid`) and divergent
  Albion documents make criterion 8 weak.
- **vs m01 (second reference):** deeper payoff and far better pacing (fixes S2, four surfaces consumed, the
  finale's biggest reveal behind a flag); but breaks the hard rule harder than S1 (two stranded flags, no
  `hintOnlyFlags` redirect), the finds are fictional relative to the box (unlike P3), and no in-game object
  gives the target host address (P4 missing).
- **What the newer rule does better/worse:** it produced the strongest payoff wiring and a named find before
  each step — but game-side only. The VM doesn't implement the gating the text promises, so the *story* of
  gating is excellent and the *mechanism* is left to a build that doesn't yet exist.

### m10 Full Disclosure (not shipped; newer gating rule)

On the game side this is the cleanest VM weaving in the season and a better structural model than m01:
each host is a physical place in the bunker, each flag opens a door or a decision, ids are tidy and
table-driven, and finds sit beside their stations at room depth 0/5/5/7 (fixing S1, S2, S3, S5). The cost
is that the finds have become pick-ups rather than puzzles — a card on the desk next to the console it
unlocks is good gating and weak play.

- **Best moment:** flag 2. The staging copy lands and HaX reads "Infusion pumps, a hospital group. Dispatch
  software, a whole county…" with SAFETYNET's own "RETAIN. Operational value." against the pumps — the VM
  result turns the player's own side into part of the problem, then hands them a choice about it.
- **Worst moment:** the core. After nine missions the player faces the Architect and the next instruction is
  "Get on his box. He'll keep." — a VM step of unknown length while he sits there, and the reason to do it
  arrives only once it is done (`ink/m10_tesseract.ink:142`, `:201`).
- **Key evidence (VM check, folded in):** flag 2's hard rule breaks — the separate `staging` account the
  design requires (B7) is not in the XML, so flag 2 sits behind flag 1's foothold on the same host and can be
  pulled at the forward post and carried five rooms (criterion 2 S→W). Flags 3–4 are also reachable from Act 1
  (not strictly gated). The maintenance tag's `secmon`, the duty card's `relops` and the staging card's
  `staging` logins have no matching accounts on the drafted boxes (the modules create `maltrail` and random
  names, mostly password-less); the envelope code gates nothing. The release host's kill config and the core
  host's unsent notice and file index — all promised by HaX and Tesseract — are not seeded; flags 1, 3 and 4
  carry only the flag string (payoff S→A). The staging schedule is a partial match (no "Ransomware
  Incorporated", entry numbers or "two shares"; five early-access cells, not two). Criterion 8 weak. The
  reward popup reading "Event triggered" undersells every payoff (engine).
- **vs m01 (second reference):** better on P2/P5/P11/P12 and on all of S1/S2/S3/S5; weaker on P3 (finds are
  found, not won) and P6 (nothing is carried from the VM into a game object as drafted); flags 1 and 4 are
  thin on motivation where m01's single live-weapon frame covered the whole mission.

## 6. Engine and shared UI

Every item here is engine code (`public/break_escape/js/`), so each needs user approval. Where a fix
could instead be done per-mission in scenario data, that is called out. The playtest harness item
("--submit-flag skips station events") is left out: it was not confirmed — the harness drives the real
station UI, so submission fires all events; a reviewer who saw no reaction was meeting items 1–3 below.

1. **Reward popup says "Event triggered".** `showRewards()` renders a fixed `<span>Event triggered</span>`
   for `emit_event` rewards and the raw room id for `unlock_door`, reading nothing player-facing
   (`flag-station-minigame.js:762`–`775`; orchestrator confirmed). Affects m02, m03, m04, m08, m10 — every
   event-reward flag. A hard-won, correct submission reads as debug output. Smallest fix: let a reward carry
   an optional `label`/`description` and render it, falling back to the current text. Scenario-side alone
   can't fix it (the field is ignored today). Effort S. Approval: yes.
2. **A wrong-station/`hintOnlyFlags` hint shows with a success tick and confirm sound.** The server returns
   `success:true` for a hint, so the client plays the confirm chime and the green "✓ Flag recognised" box,
   then renders the "used elsewhere" line underneath — mixed signals (`games_controller.rb:1205`–`1223`;
   `flag-station-minigame.js:661`–`664`, `:776`–`782`). Affects m01 and m10. Smallest fix: neutral/info
   styling and a softer sound when `data.hint` is set. Effort S. Approval: yes.
3. **No failed-flag event.** The failure branch plays `reject` and writes the red line but emits nothing, so
   no scenario can script a bark, nudge or character reaction to a wrong or wrong-station flag
   (`flag-station-minigame.js:731`–`734`; orchestrator confirmed it emits nothing on a wrong flag). Affects
   all missions; m10 had to cut a Tesseract failed-flag line for this reason. Smallest fix: emit
   `flag_rejected` with `{reason, stationId}`, purely additive. Effort S–M. Approval: yes.
4. **Station badges show raw VM names** ("Accepts flags from: bunker_monitor") (`flag-station-minigame.js:295`–`299`;
   orchestrator confirmed raw VM ids as badges). Related raw-id leaks: the `unlock_door` reward (item 1) and
   the Hacktivity console button ("Open VM Console: kali"). Affects every VM mission. Smallest fix: an
   optional `acceptsVmsLabel`/display-name map, falling back to the raw name (must stay additive — the raw
   value is also the server matching key). Effort S (engine) plus per-mission label text. Approval: yes.
5. **Wrong-station refusals don't name the right station.** The server knows the owning station (`owning_id`)
   but only puts it in a debug field; the client shows a fixed "a different machine" line with no pointer
   (`games_controller.rb:1234`–`1238`; `flag-wording.js:37`–`39`). Affects multi-station missions: m01, m09,
   m10. Smallest fix: send the owner's display name and render it, gated on discovered rooms so an unmet
   station isn't leaked. Effort S–M. Approval: yes. (Pairs with item 3.)
6. **Out-of-fiction launcher/station text.** "You've discovered a computer terminal in the game … launch the
   virtual machine on your local system" breaks fiction and leaks the delivery mechanism
   (`vm-launcher-minigame.js:373`, `:384`, `:392`); the station blurb and "🎁 Rewards Unlocked!" header read
   as arcade/CTF. Mission-specific "OPERATION SHATTER / LAUNCH WINDOW" strings are engine-baked
   (`flag-station-minigame.js:379`, `:534`, `:574`). Affects every VM mission (standalone); the launch-abort
   copy affects m01. Smallest fix: in-world defaults with a scenario override field; move the SHATTER strings
   into m01's existing `onLaunch`/`onAbort` params. Effort S–M. Approval: yes.
7. **The game keeps running while the VM is open in another tab or a panel is up.** Opening a minigame pauses
   keyboard input only; the Phaser scene, physics and NPC AI keep running (`minigame-manager.js:105`–`118`),
   and the Hacktivity console opens in a new tab. Hostile guards keep moving and attacking while the player is
   on the VM and cannot even defend. Affects any VM step in a room with hostile NPCs — m01 server room, m07,
   m10 server hall. Smallest fix: pause NPC AI/hostility ticks (or suspend hostility timers) while the
   launcher or a full-screen panel is open. Effort M. Approval: yes.
8. **Launcher card IP asymmetry (standalone only).** The card shows an IP only when the launcher's `vm` has
   `ip`; Kali launchers set it, target launchers often don't, so in standalone the attack box shows an address
   and the target doesn't (`vm-launcher-minigame.js:402`–`407`). In Hacktivity the card isn't rendered, so this
   bites standalone only. Lowest-risk fix is scenario-side (add `ip` where missing); no engine change needed.
   Effort S. Approval: only if done in engine.
9. **Flag order "by position" on multi-flag hosts depends on the per-build emission order.** A `<vm>:flag_N`
   reference resolves positionally (`games_controller.rb:2473`–`2476`), so if a rebuild reorders the flags,
   flag_1 maps to a different real value and a reward/task fires for the wrong capture. The real risk is
   VM-side (declare a stable emission order); an engine change to match by value is larger. Affects every
   multi-flag host — confirm per build. Effort S (VM-side) / L (engine). Approval: engine option only.

Minor tone items: the "🎁 Rewards Unlocked!" header and trophy framing read as arcade (item 6 covers it);
native `confirm()` dialogs for abort/launch break the in-game modal styling (`gameConfirm` exists)
(`flag-station-minigame.js:563`, `:571`). Effort S each.

## 7. Ranked recommended changes

Ranked by player impact per unit of effort. Duplicates across reviewers are merged. "Side" is
game / VM / engine; "Shipped" means it touches a shipped mission (m01–m08). VM-side rows say why the
experience is poor without the change (F20). m09/m10 rows are build-stage items for the pending SecGen
build (F9), grouped at the end and tagged **[build]**.

| id | Mission | Problem as the player meets it | Smallest fix | Side | Effort | Shipped |
|---|---|---|---|---|---|---|
| R1 | all (m02/03/04/08/10) | Every event-reward flag's success reads "⚡ Event triggered" — a correct, hard-won capture looks like debug output | Render an optional reward `label`/`description`, fall back to current text | engine | S | yes |
| R2 | m06 | Debrief and FCA letter credit a "build service" the player never met; the VM has no build service (analytics/Druid RCE) — the player is credited for the wrong lesson | Reword `m06_closing_debrief.ink:409`/`:454` and the FCA option to "an analytics service nobody had locked down" | game | S | yes |
| R3 | m04 | Debrief credits "a legacy compile service … trusting whatever it was sent"; flag 4 is the Erlang/OTP SSH foothold and the box runs no distcc | Reword `m04_closing_debrief.ink:283` to the SSH-daemon foothold (concept level) | game | S | yes |
| R4 | m07 | The text says the host notices "the moment you log in", but the clock and team-redirect window fire on flag-3 *submission*, so a careful player is pushed to decide before the evidence lands (lines still live) | Reword the pre-login HaX line and `vm_hint_3` (`ink/m07_phone_agent_0x99.ink:367`, `:845`; `erb:961`) to "the moment you put that login flag through the relay" so the fiction matches the mechanic | game | S | yes |
| R5 | m07 | The redirect window closes with no clear on-screen cue, so an early flag-1 submitter can lose the chance to move the tactical team | Strengthen the existing flag-2 pre-login warning (`erb:961`) to a can't-miss HaX line the instant `scada_password_found` is set while the window is still open | game | S | yes |
| R6 | m02 | A player who did all four flags never hears the ProFTPD/unpatched technical recap — it is gated off for the completionist | Widen the `ink/m02_closing_debrief.ink:267` gate so the backdoor line also fires when `flag_ghost_log_submitted`, or add an always-on one-line recap | game | S | yes |
| R7 | m01, m10 | A wrong-station hint arrives with a green tick and confirm chime, reading as "accepted here" | Neutral/info styling and softer sound when `data.hint` is set | engine | S | yes |
| R8 | all | Station badges read "Accepts flags from: bunker_monitor" — a raw backend id, not the device the story named | Optional per-VM display-name label, falling back to the raw id | engine | S | yes |
| R9 | all | A wrong flag gets a static red line, no character reacts, and a wrong-station refusal won't say which station is right | Emit `flag_rejected{reason,stationId}`; send the owning station's display name and render it, gated on discovered rooms | engine | S–M | yes |
| R10 | all VM | Launcher/station copy breaks fiction ("in the game", "launch the virtual machine on your local system") and leaks the delivery mechanism | In-world default blurbs with a scenario override; move m01's SHATTER strings into its scenario params | engine | S–M | yes |
| R11 | m01, m02, m03, m07 | The launcher object the player opens is named "VM Access Terminal", an out-of-fiction interaction label, where m04/m06/m08/m09/m10 give theirs an in-world device name | Rename each launcher object's `name` to a diegetic device matching the room (an audit station, field console, maintenance terminal); distinct from R10, which covers the panel blurb | game | S | yes |
| R12 | m06 | "I'm ready" players meet the backend cold; flags 1–2 have no story reason; a player may not know the flags span several boxes | Add one backend line to the mandatory briefing path, one clause tying flags 1–2 to Irina's floor, one HaX "four accounts across their estate" line | game | S | yes |
| R13 | m01, m07, m10 | While the player works on the VM in another tab, hostile guards keep moving and attacking and input is paused — they come back cornered | Pause NPC AI/hostility ticks while the launcher or a full-screen panel is open | engine | M | yes |
| R14 | all VM | `concludeMission()` fails open: on a `/conclude` request error it rolls the normal MISSION COMPLETE credits while the server record stays `in_progress`, so an un-concluded mission can look finished (H1 integrity gap, not a flag bypass) | On the fail-open path show an offline / record-will-sync ending (or retry/queue the conclude) rather than the same server-confirmed MISSION COMPLETE | engine | S | yes |
| R15 | m08 | A badge-printer-route player reaches the code server with no story reason to look there | One Director or HaX line on the required path ("the plan was opened from inside; our code server's where the access logs live") | game | S | yes |
| R16 | m08 | The launcher titled "GitList Repository Server" shows the attack box's own address, so a student may scan the wrong machine | Rename it "Field Console (Kali)" or add an observation that the console address is the player's own box | game | S | yes |
| R17 | m03 | Submitting flags 1–3 changes nothing visible; only flag 4 gives an item | Give flags 1–3 a small carried artefact each (service list, FTP rehearsal note, decoded price-list page); flag 2's text already exists on the VM | game | M | yes |
| R18 | m02 | Flags 1 and 2 land with only a toast after flags 3/4 gave documents | Print a small carried artefact for flags 1/2 (the VM already holds gary's procedures and the deployment log) | game | M | yes |
| R19 | m05 | HaX names Torres before the player deduces him, blunting the flag-3 deduction the VM completes | Hold the name out of HaX's flag-4 line until the player has named Torres | game | S–M | yes |
| R20 | m08 | Nightshade says "My account" and the box produces no object the player holds; the terminal and time are already printed in the room | Add a Relay Printout notes object echoing the mail header and root log line (reconcile the VM account identity/file name at build first — R21, R22) | game (+VM reconcile) | S–M | yes |
| R21 | m08 | The planning file is named differently on the two surfaces: the in-game rack excerpt reads `pnw_contingency.enc`, the box's root log reads `mission_planning/m07_operations.enc` | Reconcile the file name across the rack excerpt and the VM log at build | VM | S | yes |
| R22 | m08 | The mole appears on the box under three unlinked identities — the login account, the mail sender `deep_state_drop`, and the log user `svc-planning` — so "my account, my terminal, my mail" is only loosely backed | Unify the three identifiers to one account on the box at build (also unblocks R20's printout) | VM | S | yes |
| R23 | m03 | The revelation call opens "the distcc logs you just submitted" while `find_operational_logs` is still open | Reword the call's opening, or let it fire on `transaction_log_read` | game | S | yes |
| R24 | m05 | Global `owen_refused_password` is set although Owen never refused | Set it only on the actual refusal branch | game | S | yes |
| R25 | m07 | Wrong control-room-password feedback doesn't warn that the keypad is case-sensitive | Add a case-sensitivity hint to the keypad's wrong-entry reply | game | S | yes |
| R26 | m07 | The NFS/netcat field-guide item's read point is unclear in standalone | Have HaX's offer line say it's in the inventory and to open it to read | game | S | yes |
| R27 | m04 | A student who exploits the box is rewarded with no document — three leaked files hold only the flag | VM-side: add a heading-plus-flag line of in-fiction text to the three leaked files. Poor without it: exploitation pays off nothing to read, unlike m02/m03/m05; the game can't read what isn't there | VM | S | yes |
| R28 | m01 | The launch code can be held long before the launch device exists to accept it (S1) | None beyond the existing drop-site hint; accept under F20 (no hard-gating retrofit). Logged, not actioned | game | — | yes |
| R29 | m01 | `concludeRequires` lists only three of four flags; flag_3 (launch authorisation) is load-bearing only through the finale launch aim, so a future edit could silently drop it from the critical path | Make flag_3's necessity explicit in a conclude-level gate, or add a validator assertion that every mission flag is load-bearing for the ending; distinct from R28, which accepts the hold-before-submit timing | game / tooling | S | yes |
| R30 | m10 **[build]** | Flag 2 can be pulled at the forward post and carried five rooms — no separate `staging` account exists on the box | Build the separate `staging` account (B7) with its own store, not readable by the monitoring account | VM | M | no |
| R31 | m09 **[build]** | A VM player captures flags 3–4 off a box reachable from Act 1, holding them until the salvage-cage station unlocks | Restrict `tomb_beta_server` on the network until the story sends the player there; game fallback `hintOnlyFlags` on the catalogue drop terminal | VM (preferred) / game | M / S | no |
| R32 | m10 **[build]** | HaX and Tesseract promise a kill config, an unsent notice and a file index on the boxes; flags 1/3/4 carry only the flag string | Seed the release and core host files with the promised artefacts | VM | M | no |
| R33 | m09 **[build]** | Flags 1–2 yield only a flag string; the catalogue index and ledger body the player expects live only on the game screen | Seed the catalogue box's flag-1/2 files with the Series R index and the ledger body (incl. HL2015-0477) | VM | M | no |
| R34 | m09, m10 **[build]** | Login slips/cards/binder promise sign-ins the boxes don't use; account names and passwords don't match | Set the service account names/passwords to match the finds, or reword the finds as host-and-service rather than a credential | VM / game | S | no |
| R35 | m09, m10 **[build]** | No in-game object gives the target host address; a blind tester saw only the Kali IP | Confirm the shipped binding supplies real target IPs to the finds; if any mode lacks it, print the host from a fixed fallback, not the placeholder string | VM check + game | S | no |
| R36 | m01, m04, m09, m10 | The debrief never names the player's own hacking arc (S4) | Add one debrief beat naming the access→escalation→recover chain the player ran | game | S | mixed |
| R37 | m09, m10 **[build]** | Albion documents diverge (m09); the staging schedule is a partial match (m10) | Align the VM text to the game's specifics so the box reads as the source | VM | S | no |
| R38 | m10 **[build]** | At the core the player is sent to hack the Architect's box with the reason given only afterwards; flag 1's "why" is behind an optional briefing choice | Give HaX's core arrival line the reason first; add one mandatory flag-1 motivation line | game | S | no |
| R39 | m10 **[build]** | The flag-3 kill config is only reported by HaX, never read by the player | Give the hatch (or a HaX-screen in the hall) a text variant with a short kill-config excerpt (pairs with R32) | game | S | no |

## 8. Open questions and what needs a live check

- **A real end-to-end VM playtest.** No recorded run has done the VM work; every run typed supplied
  flags. Difficulty, timing, whether the finds read as useful, and whether a step stalls a player are
  all unverified across the campaign. This is the single biggest gap.
- **Per-build flag order on multi-flag hosts.** Flags resolve by position, so the order a build emits
  them decides which real value is flag_1. Confirm off a built box for every multi-flag host (m01, m04,
  m06, m09, m10) — static document order is only presumptive. Tie to engine item 9.
- **m09/m10 build-stage items (F9).** Whether the planned `tomb_beta_server` network restriction and the
  m10 `staging` account are actually built; whether the promised story artefacts get seeded; whether the
  account names/passwords are reconciled to the finds; whether root login is refused on the m10 climax
  hosts. All decided by the build, which does not yet exist.
- **Target host addresses in m09/m10.** Whether the shipped binding hands real target IPs to the finds in
  both Hacktivity and standalone modes. The dev build showed only the Kali address and a placeholder
  string; a blind tester judged they would be stuck at every flag.
- **m08 account identity.** Whether the build unifies flag 3's login account, the mail sender and flag 4's
  log user to one name, and reconciles the log file name with the in-game rack excerpt — needed before any
  line claims "my account, my terminal, my mail".
- **Stale review docs (housekeeping, not play bugs).** m04's `secgen_review/02_consistency_matrix.md` and
  m06's Oct-18 review prose still describe distcc footholds the VMs no longer run; flag for the user.

## 9. Status after the fix pass (2026-10-23)

**Rules corrected by the user (2026-10-23).** The hard rules are that VM work is diegetic and that the VM challenges are required to complete the mission. More generally the work should be fun, and the player should see its practical impact. In-game finds that feed VM steps and story artefacts on the VM are good practice, not mandates. Holding a flag before it can be submitted is fine: m01's launch code does it on purpose. Read criterion 2's "never hold a flag you can't yet submit" in sections 3–4 and the m09/m10 hard-rule-break findings in that light; they are no longer defects in themselves.

**Done** (all except R10, which the user dropped because it only affects the standalone deployment; Hacktivity integrates the VM):
- Engine R1, R7, R8, R9, R13, R14 and the R29 validator check: 74810fe06. In Hacktivity the binding supplies real target IPs (R35).
- m01 711851e39 (R11, R29, R36), m02 e5dac40ea (R6, R11, R18), m03 49ca8dcd3 (R11, R17, R23), m04 3caa47eae (R3, R36), m05 e794996a1 (R19, R24), m06 84f8ec099 (R2, R12), m07 1f292b5f2 (R4, R5, R11, R26; R25 already covered by the engine and scenario), m08 364c44673 (R15, R16, R20). Every mission also got reward labels (R1) and in-world host names (R8). All browser-checked on the keyless server.
- SecGen: m04 and m08 7c2532511 (R27, R21, R22); m09 and m10 2b0e1b4bc (R30–R34, R37). User picks: m09's catalogue is opened by the duty-desk slip's login; Tomb Beta keeps its web-server foothold; m10 keeps a separate staging account for flag 2. Finds that promised logins the boxes don't use were reworded as host pointers.
- m09/m10 game side (R31 hint at the catalogue terminal, R36, R38, R39, find rewording): see the m09/m10 commit.
- R28: no change (accepted under F20, and no longer a defect under the corrected rules).

**Still needs the user's SecGen build:** m04's three files and flag order; m08's `svc-planning` login; m09's catalogue login and Tomb Beta files; m10's staging account, account names and seeded files. No run has yet done the VM work for real.
