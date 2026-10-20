# 12 — SAFETYNET integration (folding the phishing/social-engineering systems into m01–m08)

> **SUPERSEDED 2026-10-20 (kept for reference, not deleted).** The user decided not to retrofit the
> SE systems into Licence to Hack m01-m08, so the optional m01 "Soft Entry" fold-in below is
> shelved; m01 stays frozen. The systems now serve SAFETYNET: Eldritch Hacker (browser-only, a
> separate game; see `planning_notes/eldritch_hacker/DIRECTION.md`). At most one optional
> phishing/pretext teaser stage may go into m09 or m10. The "VM requirement" coexistence in
> section 6 applies only to Licence to Hack; Eldritch Hacker has no VM flags. The Q12-A/B/C
> decisions are superseded accordingly.

Status: plan only, 2026-10-20. Nothing here is implemented. Components 06 (pretext dialogue) and 07
(landing-page builder) had no design doc when this was written; where this plan leans on them it
works from their one-line scope in `README.md` and flags the dependency.

R1 fixes applied (2026-10-20): remote `unlock_object` on `derek_computer` dropped (loaded-rooms-only listener, `interactions.js:33-55`) in favour of `complete_task` plus a mailbox-delivered clue; unlock mechanism fixed to the Kevin global; integer renumber plan; post-it and voicemail corrections; C3 recited; a unique mechanical payoff added (section 4.6).

## 1. Purpose & audience

Audience: the **SAFETYNET campaign** (`AGENTS.md:23-26`: spy thriller, Agent HaX the handler, ENTROPY
the enemy, VM flags required and woven in, kit cumulative). This doc is the campaign half of the
strand: it says which mission hosts a phish or pretext stage, what that stage is in-world, and how
it sits beside the VM work without replacing it.

What it teaches (book chapter in brackets): scoping and authorisation (Ch. 2–3), business and
people OSINT (Ch. 4–6), pretext and the phish itself (Ch. 1, 7), and by implication why the target
fell for it (Ch. 10). Students meet this in the campaign as a short, optional, self-contained
stage; the full lab (`10`) is where depth lives. The campaign stage must be playable by someone who
has never seen the lab.

## 2. Player goal in their own words

"Derek keeps his secrets behind his own password. I can't force it, so I'll send him something he
will want to open, and let him hand it to me."

## 3. Where the strand fits: evidence from the campaign

### 3.1 Fit table

| Mission | Premise (mission.json description) | Fit for spear-phish | Fit for pretext | Audio cache (`tts_cache/<id>` files) |
|---|---|---|---|---|
| m01 First Contact | Undercover **IT contractor** at Viral Dynamics Media; the **Social Fabric** disinformation cell (`m01/mission.json`; `scenario.json.erb:49` scenario_brief) | **Strong.** Target is a named ENTROPY operative, Derek Lawson (`scenario.json.erb:2108-2112`, "Operative: Derek Lawson"). The cover (brief, `:49`) gives the player a believable internal sender; the contractor mail account itself is new content. The cell's own manifesto is about hacking perception (`:1989`), so turning the craft on them reads as poetic. | Moderate (reception, Sarah) | **1948 files, cached** |
| m02 Ransomed Trust | Hospital, no access control, "talk, borrow or pick your way" in; find who inside held the door open | Moderate | **Strong.** A paper badge and nothing else is a pretext setup; the "insider held the door" thread is a vishing target | 2118, cached |
| m03 Ghost in the Machine | Joins Zero Day Syndicate as a "security researcher recruit" | Weak (technical, RFID cloning is its signature) | Moderate | 1218, cached |
| m04 Critical Failure | Grid battery site, OT network, man holding the remote | Weak | Weak (physical and OT) | 0, uncached |
| m05 Insider Trading | ENTROPY has recruited an employee at Quantum Dynamics; "The Recruiter" (`scenario.json.erb:1477`) works by phone | **Good.** Spear-phish or pretext the *Recruiter's* contact, or phish the suspects to read their mail | **Strong.** Suspects (Lisa Park, Owen Gallagher, Dr Ruth Halloran, `:1623/:1674/:1932`) can be pretexted | 8, effectively uncached |
| m06 Follow the Money | Infiltrate the exchange **as a visiting FCA supervisor**; map ENTROPY's funding | Good | **Strongest pretext fit.** The whole mission is a standing pretext; exchange staff (Irina Volkova, Dani Okonkwo, Priya Raghavan, Kemal Aydin, `:1777-2314`) are named targets | 0, uncached |
| m07 Architect's Gambit | Four crises in sixty seconds, one team, a hard choice | Weak (time pressure fights the slow OSINT loop) | Weak | 0 |
| m08 The Mole | Find the traitor inside SAFETYNET | Interesting as a *defender* beat (05), not an attack | Weak | 4 |

Cached-audio counts are from `find tts_cache/<mission> -type f`. m01–m03 are done and paid for;
m04–m08 are uncached, so edits there cost nothing in TTS (`AGENTS.md:63`, audio comes last, after
the words stop changing).

### 3.2 Recommendation

- **Primary: m01, as a light, additive, optional stage ("Soft Entry")** targeting Derek Lawson.
  Best premise fit by a distance: the IT-contractor cover (`:49`) gives the player a plausible sender, the
  audit story is already in the mission (Kevin's maintenance log mentions "after the audit",
  `scenario.json.erb:1260`; Derek's contingency plan is literally "IT AUDIT RESPONSE", `:1915`), and
  m01 is the first mission, so students meet the idea at the start of the campaign. Kept light so the
  audio constraint (section 6) is respected: text-only UI, no edits to any existing voiced line.
- **Alternate A: m06, for the heavy pretext stage.** Uncached, and the cover story is already a
  pretext. If the user wants a full vishing set-piece (person-chat suspicion meter, `06`) it belongs
  here, not in m01.
- **Alternate B: m05, for a full spear-phish.** Uncached; the insider is an ENTROPY *recruit*, so
  a spear-phish to read a suspect's mail, or a pretext call to the Recruiter's cut-out, is on-premise.
- **Rule of thumb:** anything needing new voiced NPC dialogue in quantity, a new room, or a
  multi-stage OSINT chain goes to m05/m06. m01 takes only what is text-UI-driven.

## 4. The primary fold-in: m01 "Soft Entry" (optional aim)

### 4.1 Shape in one paragraph

Mid-mission, once the player has met Kevin in the IT room, HaX offers a quieter route to Derek's
secrets: do not break in, get invited in. The player reads what the office already shows about Derek
(rooms and notes they would search anyway), checks Derek's public footprint on an OSINT browser at
the contractor bench, then sends Derek one authorised, scoped "IT audit" mail from the contractor
account. If it lands, Derek's mailbox opens remotely (a new evidence stream) and his computer login
is read early, so the computer tasks can complete from the bench, and Derek's own reminder mail points at the storage-closet safe before the player has entered his office. The `derek_computer` lock itself is not touched. The existing key/lockpick route
to Derek's office, the VM, and every flag are unchanged. Skipping the stage costs the player nothing
but a shortcut and a lesson.

### 4.2 Where it sits

- **Aim**: new optional aim `soft_entry`, unlocked as soon as the player has met Kevin. Mechanism
  (one only): the Kevin conversation (or the `meet_kevin` task's `onComplete`, `scenario.json.erb:213`)
  sets a global `kevin_met`, and `soft_entry` carries `unlockCondition: { globalVariable: "kevin_met" }`
  (`objectives-manager.js:695-702`). An `aimCompleted: "build_the_case"` condition is deliberately not
  used: it would hold the offer back until `find_derek_access` is done, after the point where the
  stage is useful. A global-gated aim is story-gated (`isStoryGated`, `:704-714`), so it stays hidden
  until the global is set.
- **Order**: existing aims use contiguous integer `order` 0-9 (`:151` to `:465`). Insert `soft_entry`
  as order 3 and renumber `search_derek_office` and every later aim up by one (3-9 become 4-10).
  This is a non-voiced data edit, so it is cached-audio-safe (section 6.2 freezes ids and voiced lines,
  not `order`). Check nothing in ink or the validator keys on a numeric order before doing it.
- Mark every `soft_entry` task `optional: true` so the critical path (`dungeon_graph.md`: 9 hops)
  does not change.
- **Room**: `it_room` (`scenario.json.erb:1508`), PIN 2468, Kevin's room. One new object, a
  **contractor workstation** ("your borrowed bench"), added to the object list. Putting it here keeps
  the stage in a room the player has already unlocked and avoids a new room, new art for a map, a new
  POV background or new lighting pass.
- **Why after Kevin**: the maintenance log already seeds the "audit" language (`scenario.json.erb:1260`,
  "after the audit"), and Kevin's reception voicemail (`:1131`) seeds the unease ("unusual access
  patterns ... before I escalate"), so the pretext is something the player has *read and heard*, not
  invented. This is the book's rule that a pretext borrows what the target already expects.

### 4.3 Components used

| Component | Use in m01 | Depth setting |
|---|---|---|
| 01 mail client | Compose a single message to Derek; inbox shows his reply or bounce | One target, no attachment kit; link-only option |
| 02 OSINT browser | Three pages: Viral Dynamics public site (staff and "About"), a professional-network profile for Derek, one press PDF with a document-properties panel | `easy`: facts are visible on the page; the metadata panel is the one "extra" |
| 03 intel board | Four-slot target card for Derek; fills from both the browser and the rooms | Readiness gate (see 4.5) |
| 04 rules engine | Judges the message against Derek's factors; returns the factor list and the layered hints | Authored in scenario JSON; three required factors |
| 06 pretext dialogue | Not used in m01. Reserved for the m06 alternate | |
| 07 landing page | Not used in m01. The mail carries an in-world "audit acknowledgement" link that resolves to a static result card, not a built page | Keeps the m01 build to 01-04 only |

Dependency note: because m01 uses only 01-04, the fold-in can ship before 06 and 07 exist.

### 4.4 Authored target (shape only; strings are for the scenario author)

```
target: derek_lawson
role: "Operations Director"
authorisation: SAFETYNET warrant 'FIRST-CONTACT-01'; scope = Derek Lawson's work mailbox only
factors (3 required, 1 bonus):
  - knows_him:        uses his name / title            (from site + profile)
  - plausible_sender: sent from the contractor account  (cover is IT; sender role matches)
  - anticipated_topic: IT audit / password hygiene      (heard at Kevin's log; Derek fears the audit)
  - bonus: lowers suspicion by a small-ask (acknowledge, do not log in)
red flags the game will name if present: urgency threat, external look-alike domain,
  generic greeting, asks for password in the body
```

The game's feedback for each factor follows `04`'s two-string pattern (pass string, fail string),
so a failed send says which factor missed, never "try again".

### 4.5 How OSINT connects to the existing rooms and searching

m01 already has a loop of searching rooms and collecting notes: `collect_office_intel` (`notes`
x4, optional, `scenario.json.erb:178`) and `collect_investigation_docs` (`notes2` x6,
`:228`). The fold-in reuses that rather than adding a second search game.

- Tag a handful of existing notes with an `intel` fact id (data-only change, no text change, no voiced
  line). Examples of facts reachable **before** Derek's office is open: his title on the door sign
  (`derek_office` "Derek Lawson — Operations", `:1860`), the audit wording in the maintenance log
  (`:1260`), and any `notes` / `notes2` pickups in the open rooms. The anniversary post-it on his
  computer (`:1873-1874`), the "Derek0419" password hint (`:32`) and the contingency plan (`:1915`)
  are inside or behind his office, so they are *not* usable as readiness facts; they stay for the
  existing route.
- Picking up a tagged note emits the intel event `02` already defines and sets a
  `knows_<fact>` global (`apply-actions.js:33`). The intel board fills from both sources, so the
  player sees that the physical office and the web page are two views of one person. That is the
  book's Ch. 6 point.
- Facts needed for readiness come from **public** sources (site, profile, PDF) plus **one** from the
  rooms the player is already in (Derek's title and the audit chatter). Nothing requires the player to
  have already entered Derek's office, because the stage must be reachable before that door opens.
- Readiness: the board sets `soft_entry_ready` when the three required factors have a supporting
  fact. It does not block the composer; it only changes HaX's line ("you are flying blind" vs "you have
  enough").

### 4.6 Outcome and gating

Mail client result (`01`): `minigame_completed { success, result: { targetId, outcome, pretextScore,
redFlags } }` (documented in `01`'s engine wiring; emitted by `base-minigame.js` per that doc). The
scenario bridges it with the existing actions in `apply-actions.js`:

```
on outcome in [opened, clicked, replied]:
  set_global     phish_derek_landed = true
  complete_task  soft_entry_send
  unlock_object  derek_mailbox_view         (new readable object, see below)
  hint           "Derek's mailbox is open. Read what he keeps from his own team."
on outcome = bounced | ignored:
  nothing is locked. Feedback screen lists the failed factors. Retry is free.
```

What the landed phish gates. Engine constraint first: `unlock_object` emits
`object_remotely_unlocked`, whose only client listener (`interactions.js:33-55`) acts on **loaded
rooms only** and otherwise logs "not found in loaded rooms". Derek's office is not loaded while the
player is at the bench in `it_room`, so this design does **not** use `unlock_object` on
`derek_computer` and does not touch that lock. (`unlock_object` on `derek_mailbox_view` is fine: that
object is new and sits in `it_room`, which is loaded.)

| Gate | Effect | Mechanism |
|---|---|---|
| Tasks `unlock_derek_computer`, `search_derek_computer` (`scenario.json.erb:267-274`) | Complete early, from the bench, by reading Derek's mailbox | `complete_task` (`apply-actions.js:50`) driven by `phish_derek_landed`. Spike C3 below. |
| `derek_computer` lock (`:1868-1874`) | **Unchanged.** The player still unlocks the real machine when they reach it; the tasks are already marked done, so that visit is only for the files | None |
| **Unique payoff: a pointer to the storage safe** | The phish yields Derek's own reminder mail naming the storage-closet safe and saying it holds the "server access details" (the safe and item already carry these names, `:1280-1290`, `:1928`). The PIN is **not** given; it stays the Base64 puzzle in Derek's office (`:1929`). The player learns the safe matters, and where it is, before they enter his office | New text document in `derek_mailbox_view`; no VM claim, no new lock |
| Optional evidence | 2-3 further text documents (the "audit" thread; an ENTROPY dead-drop scheduling note), counted toward `collect_investigation_docs` only as optional extras | New content, text only |

Why the safe pointer: the login is already shown at the lock (post-it plus password hint), so a
credential alone would add nothing. A clue the mission otherwise hides until the office is open is
the stage's own reward, and it leaves the encoding puzzle (the m01 teaching point) intact.

The player never needs the landed phish to finish m01. This respects the standing rule that the
critical path is lock, key and VM, and leaves difficulty for the existing route untouched.

### 4.7 The loop, screen by screen

1. **Offer.** After meeting Kevin, a new HaX phone knot (new file, see section 6.2) offers the stage
   (draft voice below). The objective tracker shows the optional aim "Soft Entry" with three tasks:
   *Learn who Derek is*, *Write the audit mail*, *Read what he keeps*.
2. **Recon.** The player uses the contractor bench (an object) to open the OSINT browser and, in the
   building, picks up tagged notes. The intel board (`03`) shows Derek's card filling in. Each fact
   shows where it came from (site, profile, PDF, "found in the main office").
3. **Compose.** The mail client opens with the contractor account as sender. The player picks
   greeting, topic and ask from authored options (or free text if `04`'s Q2 default allows; this doc
   assumes the structured option). A short "scope" strip reminds them of the authorisation.
4. **Judge.** Feedback is the `04` factor list: each factor ticks or crosses with its own sentence.
   Nothing is silent. The SecGen lab's "your email was rejected" with no reason cannot happen.
5. **Reply or bounce.** Derek's reply arrives in the inbox in-game, in character (a clipped
   corporate acknowledgement that quietly gives himself away: he asks whether "the audit covers the
   operations share").
6. **Debrief beat.** One HaX line names the technique and the defence ("he saw the topic he was
   dreading and stopped checking the sender"). This is the defender mirror in one sentence, with a
   pointer to `05` for the full version.

No time limit, no lives, no dead end. A fourth failed send makes HaX hand over the missing factor
outright, matching the standing rule (fun, not hard).

## 5. In-world framing (spy-thriller voice)

Authorisation and ethics beat (book Ch. 2) are spoken by HaX, so they cost a voiced line or two,
and they are not skipped. Draft wording is for the dialogue pass, not final:

> **HaX (phone):** "You're in. Kevin likes you, which is useful. Here's a quieter option. Derek
> Lawson is the one we can name on the board, and Social Fabric's whole creed is that people believe
> what they were already afraid of. So let's use that. Warrant's signed: one mailbox, Derek's, and
> nobody else's. You do not touch Kevin, you do not touch Sarah, and you do not send anything that
> would hurt a real person if it were read aloud in court. Find out what he's dreading. Then give it
> to him."

Failure line: *"He didn't bite. Look at the card, which of those three did you skip?"* (points at
the checklist, not at the answer.)

Success line: *"That's him. Read his mail, not his private life. The only things we want are ENTROPY's."*

Design notes:
- **ENTROPY is the target, not the lesson.** The player is told this attack is aimed at an operative
  whose cell hurts people (`scenario.json.erb:1980`, Operation Shatter casualty estimates). It is not
  a licence to phish staff. Kevin, Sarah and Maya are explicitly off-limits and the composer offers
  only Derek.
- **The irony is deliberate.** Social Fabric's manifesto (`:1989`) says "we hack perception". The
  stage lets the player do exactly that to them, then HaX names the technique.
- **Fiction only.** Names are the existing fictional ones. No real-staff OSINT, no real domain.

## 6. Coexistence with the VM requirement, and the cached-audio constraint

### 6.1 Additive, never a replacement

The standing rule (`AGENTS.md:25`): m01-m08 need their VM flags, woven into the story. This strand
is no-VM by user decision (2026-10-20, BRIEF.md). They coexist as follows:

- The phish stage is **optional and does not touch the VM path**. m01's flags stay in
  `flag_station_dropsite` and `vm_launcher_intro_linux` (`scenario.json.erb:2034-2058`) with
  `shatter_server` as the only flags source. Submitting those flags remains a precondition of the
  mission's later aims.
- The phish yields an **in-game credential and a pointer**, never a flag. The mailbox documents can
  point the player at the same server room the VM terminal sits in. They must not add VM claims. Any
  statement about what is on the VM goes through the user per the standing rule (VM claims are not
  authored by agents that have not read SecGen); this plan authors none.
- **Net effect on difficulty:** the lesson time is spent on a different skill, then the player rejoins
  the VM work with Derek's mail context already read. It is the "social engineering gets you in the
  door, technical skill gets you the data" loop that real engagements follow.
- **Standalone tracks keep their own rules.** The pure phishing episodes (`10`, `11`) have no VM, so
  the no-VM decision holds there. Only the campaign fold-in has to sit next to a VM.

### 6.2 Cached audio, and what that rules out in m01

m01's voice cache holds 1948 files (`tts_cache/m01_first_contact`). The TTS key is text, voice,
style wording, language and model (`AGENTS.md:147`), so any change to an existing voiced line
re-spends money, and m01's ids and names are frozen (`AGENTS.md:145`: "m01 is left alone because its
audio is cached").

What is therefore **allowed** in m01 for the light fold-in:
- New objects and a new aim in `scenario.json.erb`, new data on existing notes (an `intel` field).
- New text-only content: browser pages, mail text, the target card, Derek's mailbox documents. None of
  these are voiced.
- **One new ink file** for HaX's offer and debrief beats (new knots only). New lines are the only
  cost, and only if the user agrees to voice them (`AGENTS.md:63`, audio last, with consent). Unvoiced
  they still work (text and portrait).
- No printed variables in any voiced line (`AGENTS.md:148`).

What is **not** allowed in m01:
- Editing, reordering or renaming any existing line, knot, id, global or NPC.
- Adding a whole new voiced NPC, a new room, or a person-chat pretext (`06`).

### 6.3 Where heavy additions go

Heavy additions (a voiced pretext call, a long OSINT chain, a landing page build, a defender beat)
go to **m06 first, m05 second**, both uncached (0 and 8 files). If the user would rather not touch
m01 at all, the whole of section 4 transplants to m05 with Lisa Park or Owen Gallagher as the target
and the "Recruiter" as the ENTROPY link; m01 then stays frozen and loses only the chronological
"first" placement. A third option is a new prequel mission; this plan does not recommend it, because
it would break the m01-as-first-contact numbering and every canon reference that depends on it.

## 7. Alternates in one page each

### 7.1 Alternate A — m06 "visiting FCA supervisor" pretext stage

- **Slot:** after the player is inside the exchange (existing checkpoint with the Checkpoint Guard,
  `scenario.json.erb:1675`) and before the finance-records aim.
- **Target:** exchange staff the existing scenario already names (Irina Volkova, Dani Okonkwo, Priya
  Raghavan, Kemal Aydin). The pretext is the cover itself: "a supervisor who needs one signature".
- **Components:** 06 (suspicion meter on top of person-chat), 04 rules, 03 intel board, 02 browser for
  the regulator's public register. 01/07 optional.
- **Gate:** a successful pretext opens a locked records cabinet or returns a badge/PIN through an
  `unlock_object`/`give_item` action, exactly as in section 4.6.
- **Why it is the strongest pretext fit:** the mission's core premise is a pretext the player is
  already living. A stage where the player *manages* it, rather than inheriting it, makes the premise
  playable.

### 7.2 Alternate B — m05 recruiter trace

- **Slot:** inside the "find the insider" arc, before `confront_insider` (`:515`).
- **Target:** a suspect's mailbox (spear-phish) or the Recruiter's cut-out (pretext).
- **Gate:** a landed phish or successful pretext sets a global that adds a piece of the
  motive/proof evidence the dialogue already treats as missing (`found_stand_down_email`-style
  globals, `:701`).
- **Caution:** the insider is a coerced, indebted person (`torres_journal_excerpt`, `:87`). The
  ethics beat has more work to do: the player must be told that targeting suspects is authorised and
  that the person on the other end may be a victim.

## 8. Engine wiring and new work

Everything relies on actions that already exist in `apply-actions.js`: `set_global` (`:33`),
`complete_task` (`:50`), `unlock_object` (`:61`), `give_item` (`:92`), `hint` (`:85`). Aims gate on
`unlockCondition` (`objectives-manager.js:685-720`). Flags and VMs stay with `flag-station` and
`vm-launcher`; the phishing stage never calls the flag endpoint.

| # | Item | Notes |
|---|------|-------|
| C1 | Campaign skin for the mail client and OSINT browser (below) | Theme object in scenario JSON, not a fork |
| C2 | A scenario-side adapter: `minigame_completed` result -> action list | Declarative `onOutcome: { landed: [...], failed: [...] }` on the starter object, so authors do not hand-wire each mission |
| C3 | Spike: `complete_task` for `unlock_derek_computer` / `search_derek_computer` while `search_derek_office` is still locked | `completeTask` has no client-side aim-status guard (`objectives-manager.js:544`) and `revealAimForTask` (~`:715`) reveals a locked, non-story-gated aim on early progress (`search_derek_office` is `aimCompleted`-gated, so it qualifies). The server-side check (`serverCompleteTaskWithRetry`, ~`:554`) can still reject, so the spike must cover it. Fallback: show the clue and leave the tasks to complete on the player's visit |
| C4 | Intel tag on an existing note (`intel: "derek_title"`) emitting the `02` event on pickup | Same pickup hook the `collect_items` counters use |
| C5 | HaX phone knot for the stage | One new ink file, new knots only, no edit to `m01_phone_agent0x99.ink` |
| C6 | Hint-ladder tie-in (below) | Uses `04`'s hint-stage tracking (N4 in `04`) |
| C7 | Validator coverage: every `intel` fact id referenced by a target exists; every `onOutcome` task id exists | Extends the scenario validator, shared-engine tooling, so ask first |

## 9. Reuse notes: what the campaign needs beyond the shared components

### 9.1 Spy-themed skins

The shared components are neutral by default (README Q4). The campaign wants a reskin, as data:

- **Mail client:** a SAFETYNET "field mail" frame (HaX avatar corner, "AUTHORISED" stamp, dossier
  corner marks), and per-company in-fiction chrome for the *target's* inbox view (Viral Dynamics
  branding for Derek's mailbox). Same layout and same controls; only palette and chrome change.
- **OSINT browser:** a "SAFETYNET field browser" skin with the green-phosphor accent already in house
  style, plus clearly fictional web chrome (fake addresses on a reserved test domain, never a real
  one). Search results carry a "this site is fictional" tag in the corner.
- **Intel board:** a case-board look (string and pins in pixel art) suits a thriller. In the lab it
  stays plain.

### 9.2 HaX hint integration

m01's HaX hub is progress-gated (`AGENTS.md:49`, the alignment stage). Hooking in:
- The stage's hint ladder is `04`'s per-target hint stages (nudge, then named factor, then handed
  over), surfaced through the existing HaX phone rather than a second hint UI. HaX says what the
  checklist already says, in voice.
- A hub option appears once the aim is unlocked and disappears when it completes, using the same
  global-condition pattern the other hub options use. No change to existing options.
- The closing debrief (`m01_closing_debrief`) is not edited. If the stage should be acknowledged, an unvoiced end-screen or summary line does it; any new voiced debrief line is Q3 below.

### 9.3 Audiences

- **Student labs** reuse the same `onOutcome` adapter and the same target JSON; only the wrapper
  (no spy chrome, ethics beat as a form rather than HaX) differs.
- **Awareness episodes** do not use this doc.

### 9.4 Cast and diversity

New speaking NPCs are not added to m01. In m05/m06 any new voiced pretext target follows the
standing cast-diversity rule and gets its own sprite key if recurring.

## 10. Art / audio assets needed (not to be generated now)

All PixelLab-first, 128x128 default, no downscaling.

- Contractor workstation object (orthogonal top-down, `props-orthogonal-topdown` rule), one sprite.
- Optional: "AUTHORISED" stamp and dossier-corner UI assets, small.
- Intel-board pins and string, if the case-board skin is wanted (per `03`'s assets).
- Audio: only the new HaX knots, if the user agrees (cost). Count of new voiced lines expected:
  roughly 6-10 (offer, ethics beat, failure x2, success, debrief). Check `tts-audio` before any
  generation, and list every spoken line first (`AGENTS.md:147`).
- No new room, no new POV background, no new character.

## 11. Open questions (also in `QUESTIONS_FOR_USER.md`)

1. (Q12-A) **Which mission hosts the first fold-in?** Default: m01 "Soft Entry" (light, optional, additive).
   Alternates: m06 (pretext), m05 (spear-phish). Nothing is edited until you pick.
2. (Q12-B) **Is any change to m01 acceptable given its cached audio (1948 files)?** Default: additive-only,
   with no edit to existing voiced lines or ids; new HaX lines unvoiced until you approve the cost.
   If not, the same stage moves to m05 (uncached).
3. (Q12-C) **Voice the new HaX lines?** Default: not now; list lines, ask later (`AGENTS.md:63`).
4. **Does a heavier stage (full pretext call, `06`) go in m06?** Default: yes, as a second item once
   `06` has a design.
5. **Is the safe pointer (no PIN) the right unique payoff?** Derek's login is already shown at the lock
   (`scenario.json.erb:32`, `:1874`), so a credential alone would be hollow. Default: the phish yields
   a pointer to the storage safe, not its PIN, so the Base64 puzzle (`:1929`) survives. Not hardening
   `derek_computer`, because that edits the cached-audio mission's puzzle chain.
6. **Does a defender beat belong in m08?** Default: out of scope here; revisit with `05`.
