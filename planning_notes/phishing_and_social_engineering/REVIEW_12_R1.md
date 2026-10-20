# Review — 12 SAFETYNET integration, Round 1

Read-only design review of `designs/12_safetynet_integration.md` against `BRIEF.md`, `README.md`,
`designs/00_data_contract.md`, designs 01–04, `AGENTS.md`, and the live mission files. VM/SecGen
files were not opened (standing rule); the doc keeps to narrative/mechanic level and authors no VM
claims, so there was nothing to flag on that front.

Severity count: 0 blockers, 1 major, 6 minors.

Verdict: **majors remain** (one). The core judgement is sound — the m01 "Soft Entry" fold-in is
genuinely additive, respects the cached-audio constraint, sits beside the VM work without touching
it, and the spy framing and alternates are well chosen. One engine assumption behind the gating is
unverified for the specific case the stage needs, and a handful of cites/claims need tightening.

---

## What verified clean (load-bearing claims, all confirmed)

- **Cached-audio counts are real.** `find tts_cache/m01_first_contact -type f` = **1948**; m05 = **8**;
  m06 = **0**. Matches the fit table exactly.
- **m01 premise cites.** mission.json description = "cover as an IT contractor … uncover the Social
  Fabric cell" (mission.json:3); `scenario_brief` IT-contractor cover at scenario.json.erb:49;
  Derek Lawson "Operative … (Viral Dynamics Media)" + "Operation: SHATTER" at :2108; manifesto "We
  don't hack systems. We hack perception." at :1989; maintenance log "after the audit" at :1260;
  contingency plan "CONTINGENCY PLAN: IT AUDIT RESPONSE" at :1915 (a document inside Derek's office);
  door sign "Derek Lawson — Operations" at :1860; `derek_computer` `lockType:"password"`,
  `requires:"0419"`, `postitNote:"Anniversary"` at :1868-1874; password_hints "…Derek0419" at :32;
  Operation Shatter casualty figures at :1980.
- **Aim/task structure.** `build_the_case` order 2 (:203), `search_derek_office` order 3 (:256), both
  gated by `unlockCondition:{aimCompleted:…}` (:202, :255) — the existing pattern the doc cites.
  `collect_office_intel` = collect_items `["notes"]` ×4, `optional:true` (:178-187);
  `collect_investigation_docs` = `["notes2"]` ×6, `optional:true` (:228-237); `unlock_derek_computer`
  and `search_derek_computer` are tasks under `search_derek_office` (:267-279); `meet_kevin` task
  (targetNPC `kevin_park`) exists at :213. `flag_station_dropsite` (:2048) and
  `vm_launcher_intro_linux` (:2035) exist as cited; no existing contractor bench (confirmed new).
- **Engine actions.** `apply-actions.js`: `set_global` :33, `complete_task` :50 (calls
  `objectivesManager.completeTask`), `unlock_object` :61, `hint` :85, `give_item` :92 — all accurate.
  `unlockCondition.globalVariable` supported in `isUnlockConditionMet` (objectives-manager.js:697-700,
  within the :685-720 block cited).
- **Alternates.** m06 mission.json = "Infiltrate the exchange as a visiting FCA supervisor"; staff
  Irina Volkova (scenario.json.erb:1777), Dani Okonkwo (:1859), Priya Raghavan (:2174), Kemal Aydin
  (:2314), Checkpoint Guard (:1675) all present. m05 mission.json = "ENTROPY has recruited an
  employee"; "The Recruiter" (:1477), Lisa Park (:1623), Owen Gallagher (:1674), Dr Ruth Halloran
  (:1932), `confront_insider` (:515), `found_stand_down_email` (:701), `torres_journal_excerpt`
  ("debt relief … standing retainer", :87) all confirmed — so the m05 coercion/ethics caution is
  well-founded.
- **Coexistence with the VM rule.** §6.1 and §8 keep the flags in `flag-station`/`vm-launcher`,
  state the phish never calls the flag endpoint and yields only an in-game credential/pointer, and
  route any VM claim to the user. Fully consistent with AGENTS.md:25. The doc does not touch
  flag_station/vm-launcher behaviour.

---

## Findings

### Major

**M1 — The derek_computer remote-unlock gate is unverified for the one case the stage needs
(room not yet loaded).** §4.6's gates table states, as a working mechanism, that a landed phish
runs `unlock_object` to open `derek_computer` "remotely, from the contractor bench" (in `it_room`)
*before* the player enters Derek's office, citing `apply-actions.js:61` and "No change to the lock."
But `unlock_object` only emits `object_remotely_unlocked`, and its sole listener
(`interactions.js:33-55`) walks **loaded rooms only**: it sets `obj.scenarioData.locked=false` for an
object in a loaded room and otherwise just logs `"[RemoteUnlock] Object not found in loaded rooms"`.
The handler's own comment records this exact class as a past silent-failure bug. Derek's office is
almost certainly not loaded while the player is at the it_room bench, so the immediate client unlock
would no-op. Server persistence (`apiClient.unlock('object', …)`, apply-actions.js:63-68) *may*
restore it on later room entry, but that is unproven and is precisely the kind of path the doc says
needs a spike — yet C3 is scoped only to `complete_task`, not to this.
*Fix:* add to C3/C7 a validation spike that a remote `unlock_object` on `derek_computer` issued
before the office is entered yields an unlocked computer on entry. If it does not, either gate the
lock on the phish global (have the lock read `phish_derek_landed` on load) or simply `complete_task`
the computer tasks rather than unlock the object. State the chosen path in §4.6 instead of asserting
the unlock as given.

### Minor

**m1 — C3 cites the wrong line; the real gate is server-side.** §4.6 and C3 cite
`objectives-manager.js:97` as evidence the engine tolerates completing a task whose aim is locked.
Line 97 is inside `restoreState()` (a comment about `revealedEarly`), unrelated to completion. The
actual supporting code is `revealAimForTask` (~:715-725: a task completing in a locked, non-story-
gated aim reveals the aim) and `completeTask` (:544, which has no client-side aim-status guard) —
but completion is gated by `serverCompleteTaskWithRetry` (:554), which can reject. `search_derek_office`
is `aimCompleted`-gated, not story-gated, so it should reveal on early progress; even so the spike
must cover server rejection. The doc's stated fallback ("unlock the aim from the offer knot") already
covers refusal, so this is a cite+scope correction, not a new risk. *Fix:* recite to
`revealAimForTask` and note the server-side `completeTask` validation as part of the C3 spike.

**m2 — The two offered unlock mechanisms for `soft_entry` are not timing-equivalent.** §4.2 says the
aim is "unlocked by the existing `meet_kevin` task … so use a global set on the Kevin conversation
or a plain `unlockCondition:{aimCompleted:…}` as the existing aims do." But `meet_kevin` is a *task*
inside `build_the_case` (:213), not an aim; an `aimCompleted:"build_the_case"` condition would hold
Soft Entry back until the whole of build_the_case completes (after `find_derek_access`), not "once
the player has met Kevin" as §4.1 intends. *Fix:* keep only the global-on-Kevin-conversation path
(or a `meet_kevin` `onComplete.unlockAim`), and drop the `aimCompleted` alternative here.

**m3 — "order between 2 and 3" needs an integer plan.** §4.2 inserts `soft_entry` at an order
between `build_the_case` (2) and `search_derek_office` (3); existing orders are contiguous integers
0–8. *Fix:* state whether the engine sorts a fractional order (e.g. 2.5) or whether downstream aims
are renumbered. Renumbering is a non-voiced data edit, so it is cached-audio-safe — worth saying so,
since §6.2 freezes ids/voiced lines but not `order`.

**m4 — The anniversary post-it is inside Derek's office, so it cannot be a pre-entry OSINT fact.**
§4.5 lists "Derek's anniversary post-it on his computer (:1873-1874)" among the facts "the rooms
already hold" for readiness, then correctly excludes the contingency plan (:1915) because it is only
readable inside the office. The post-it sits on `derek_computer`, inside the same office — it has the
identical pre-entry unreachability. *Fix:* drop the post-it from the before-entry usable set, or
caveat it exactly as the contingency plan is caveated.

**m5 — Kevin's voicemail does not actually say "audit".** §4.2/§4.7 cite the voicemail (:1131) with
the maintenance log (:1260) as seeding the "audit" language the pretext borrows. The voicemail
(:1131) seeds the PIN change plus "unusual access patterns … before I escalate"; it contains no
"audit". Only the maintenance log (:1260, "after the audit") and Derek's in-office contingency plan
(:1915) carry the word. *Fix:* keep :1260 as the public audit seed and drop the :1131 audit claim
(or recite :1131 as the "suspicion/escalation" seed, which is what it is).

**m6 — With the login already shown at the lock, the stage has no unique mechanical payoff.** The
honest-weakness point (Q5) is handled fairly — the doc does not harden `derek_computer` and keeps the
credential as a convenience. But since the postit "Anniversary" + "Derek0419" hint are already shown
at the lock (:1874, :32) and the mailbox evidence counts only as optional extras toward
`collect_investigation_docs`, the whole stage is pure optional flavour: the player gains nothing they
could not already get. That is acceptable under "additive/optional", but it slightly undercuts the
"get invited in" fantasy. *Fix (design, optional):* have `derek_mailbox_view` yield one distinctive,
non-redundant clue (that still neither hardens the computer nor adds a VM claim), so the phish feels
earned rather than cosmetic.

---

## Checklist against the task

- **Soft Entry additive + cached-audio respected:** yes. Cache count real (1948). §6.2's allowed/
  not-allowed split is correct: new objects/aim, an `intel` data field on existing (unvoiced) notes,
  text-only content, one new ink file (new knots, HaX unvoiced until approved). No edits to existing
  voiced lines/ids/globals. (Note m3: renumbering `order` is a non-voiced edit and is fine.)
- **Coexists with the VM-flags rule:** yes, cleanly; flags/VM untouched, phish yields credential +
  pointer only, VM claims routed to the user.
- **Gating real:** the global→`unlock_object`/`complete_task` wiring exists (apply-actions.js:33/50/61),
  and the aim-reveal path tolerates early task completion — but see **M1** (remote unlock on an
  unloaded room) and **m1** (correct cite + server-side gate for C3).
- **Honest-weakness handled:** yes (see m6 for the one soft spot).
- **Spy framing + alternates:** HaX handler and ENTROPY-as-target framing correct; m06 (standing-
  pretext premise) and m05 (ENTROPY recruit, coerced insider) both justified from their verified
  premises.
- **All 9 BRIEF sections (integration-adapted):** present — purpose/audience (§1), player goal (§2),
  loop/steps (§4.7), rules/feedback (defers to 04 + names the SecGen "rejected, no reason" failure,
  §4.4/§4.7), authored data (§4.4), engine wiring (§8), reuse across audiences (§9.3), assets (§10),
  open questions (§11, mirrored to QUESTIONS_FOR_USER.md).
- **VM technical detail:** none present; doc stays at mechanic/id level and authors no VM claims.
