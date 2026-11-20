# Deduction board: use-case stress test

Sidecar to `../DEDUCTION_IMPLEMENTATION_PLAN.md`. Read-only against the plan; nothing here edits it.

**Version read:** the plan at 3,327 lines, latest review round **Round 4** (§14 "Round 4 outcomes", R4E-1
to R4I-17; §13.5 "Round 4 settlements"). Its header line still says "rounds 1 to 3 folded in", which is
stale. Another workflow was editing it while this was written, so check section numbers before you act on
anything below.

**Method.** Six missions not in the plan, each written as fully as the §4 contract allows: `social.deduction`,
intel facts with `deduction`, `triggers`, verdicts, stakes and ink conventions. After each sketch comes a
list of gaps. Severity:

- **blocker**: the premise cannot be expressed at all;
- **major**: it can be expressed only with a workaround that misleads the player, breaks a lint, or teaches
  the wrong habit;
- **minor**: it works but is awkward or noisy;
- **defer**: a real gap, but fine to leave until a mission is scheduled.

The games are Incident Simulations (corporate, no combat) and SAFETYNET: Eldritch Hacker (browser-only
social engineering, pulp horror, combat allowed). All names are placeholders.

Engine facts checked for this pass (2026-10-22):

- OSINT pages and profiles are gated by `showIf`, which is the truthiness of one global
  (`minigames/osint-browser/osint-model.js:29-32`, `:60-65`). There is no negation.
- Lookup tools are gated by `unlockedBy: { visited | fact }` (`osint-model.js:124-131`).
- Timers have `startOnGlobal` and `cancelOnGlobal`, both truthiness tests (`ui/scenario-timer-dispatcher.js:67`,
  `:81-112`).
- NPCs can have `timedMessages` and a `timedConversation` with `waitForEvent` (`systems/npc-manager.js:176-177`,
  `:312-334`), which covers incoming calls.

The ranked recommendations are at the end.

---

## 1. The Lantern Lodge (Eldritch Hacker): profiles found mid-mission

**Premise.** The player is undercover at a lodge's initiation night. HaX knows some members are inner
circle but not how the lodge marks them. The lodge's own rules are evidence. A page of the *Rule of
Admission* in the library gives the first profile. A torn ledger in the warden's office gives the second.
Until the player finds them, the board can only collect clues. Combat is on. Reveal is `now` and the stakes
are `costly`.

**Data sketch (what the contract wants, with the proposed key marked).**

```jsonc
"deduction": {
  "title": "Initiation night",
  "verdictNoun": { "guilty": "Inner circle", "clear": "Not inner circle" },
  "suspects": ["ded_l_abara", "ded_l_whitlock", "ded_l_soto", "ded_l_kwan"],
  "slots": [ { "id": "seat",  "label": "Where they sat",  "perSuspect": "exactlyOne" },
             { "id": "carry", "label": "What they carry", "perSuspect": "oneOrMore" } ],
  "clues": { "east_chair": { "slot": "seat", "label": "sat in the east chair", "count": 1, "marked": true },
             "lantern_pin": { "slot": "carry", "label": "lantern pin", "count": 2, "marked": true }, "...": {} },
  "profiles": [
    { "id": "warden", "label": "Warden", "text": "Sits in the east chair and carries a lantern pin.",
      "rule": { "all": [ { "has": "east_chair" }, { "has": "lantern_pin" } ] },
      "hiddenUntil": "se_intel_l_rule_page" },                      // PROPOSED
    { "id": "sworn", "label": "Sworn", "text": "Carries two or more marked things.",
      "rule": { "markedAtLeast": 2 }, "hiddenUntil": "se_intel_l_ledger" }   // PROPOSED
  ],
  "brief": { "source": "ink", "file": "ink/l_handler.ink" },
  "verdicts": { "allowed": ["accuse", "ko"], "when": "anytime", "reveal": "now" },
  "stakes": { "rigidity": "costly", "...": "as fixture A" }
}
```

The rule page and the ledger are ordinary intel facts with no `deduction` key. They are granted by
`triggerOnInteract` on the library lectern and by a trigger on the office safe's `item_unlocked`.

**Gaps.**

| # | Gap | Severity | Minimal extension |
|---|---|---|---|
| 1.1 | The contract cannot hide a profile. `profilesFrom` is reserved and rejected (§1, §4.2). The board shows every profile from the start (§3.7). DL10 requires each profile's text in the brief. | **blocker** for the premise as stated | `profiles[].hiddenUntil: "<global>"`. The board shows the label as "Rule not yet found" and no text until the global is true. The "Which profile?" picker lists only revealed profiles. DL10 then looks for the text in the revealing source (that fact's `text`, or the ink file of the NPC who grants it) instead of the brief. |
| 1.2 | **The nudge leaks.** The evaluator would call a suspect decidable from the clues alone, so "You have enough to decide about Abara" would appear before the player knows what to decide against. | major (goes with 1.1) | In the model and the runtime, not the pure evaluator: treat a hidden profile as the constant `U` when computing `decidable`. The truth, the grading and the debrief use every profile. A nudge suppressed while a profile is hidden fires when the reveal makes the suspect decidable, through the same `intel_collected` listener. |
| 1.3 | A workaround exists today: put a vague profile text in the brief ("The lodge's own admission rule. Find it.") and turn the nudge off. DL10 passes, but the board's profile card never shows the real rule. The player then has to keep the found page in their head, and the board stops being the place where the reasoning happens. | major (as a workaround) | Use 1.1. Until then, do not build this mission on the workaround. |
| 1.4 | DL8 becomes vacuous: with profiles hidden in the opening state, nobody is decided. DL6 does not check that the revealing facts are reachable. | minor | With 1.1: DL6 adds every `hiddenUntil` source to the facts that must be reachable, and DL8 judges the opening state as the opening facts plus the reveals. DL8 then asks whether the case collapses as soon as the rules are known, which is the useful question. |
| 1.5 | The player can accuse before any rule is found, which is a blind guess. | minor | Authoring rule (ink gates accusations on the reveal global), plus a DL12 warning when a `#verdict` choice in an `anytime` case with hidden profiles has no condition naming a `hiddenUntil` global. No engine work. |
| 1.6 | The debrief "Why" could also say where the rule came from ("Warden, from the Rule of Admission"). | defer | Optional `profiles[].sourceLabel`. |

Everything else (KO, the favour, reveal now, escalation) maps exactly onto fixture A's patterns.

---

## 2. Two cells in one case (Eldritch Hacker): the Cabal and the Choir

**Premise.** A charity gala in the Quantum Cabal's city. Some guests are Cabal agents, some belong to a
rival group (placeholder "the Ashen Choir"), and some are neither. Naming a Choir member as Cabal sends
SAFETYNET after the wrong network: the Choir is warned and the Cabal agent goes free. Each group has its own
mark (a Cabal sigil, a Choir hymn number). One witness is a Choir member who will happily give evidence on
the Cabal.

**What the contract can express today.**

```jsonc
"verdictNoun": { "guilty": "Cultist", "clear": "Not a cultist" },
"clues": { "cabal_sigil": { "slot": "carry", "label": "Cabal sigil", "marked": true, "count": 2 },
           "choir_hymn":  { "slot": "carry", "label": "hymn sheet, number 7", "marked": true, "count": 2 } },
"profiles": [
  { "id": "cabal_courier", "label": "Cabal courier", "text": "...", "rule": { "all": [ { "has": "cabal_sigil" }, { "has": "wants_codex" } ] } },
  { "id": "choir_singer",  "label": "Choir singer",  "text": "...", "rule": { "all": [ { "has": "choir_hymn" }, { "not": { "has": "cabal_sigil" } } ] } }
]
```

That gives correct guilty-or-clear grading with one noun. The group lives only in the profile label.

**Gaps.**

| # | Gap | Severity | Minimal extension |
|---|---|---|---|
| 2.1 | **Wrong group is never graded.** An outcome is binary, so naming a Choir singer as a Cabal courier counts as `right_guilty`. The marks record a profile (§4.5), but verdicts do not, so the stakes and the debrief cannot react. | major for this premise | Cheap now, in every case: copy the suspect's mark `profile` onto the verdict record at verdict time (`verdicts[s].profile`). The debrief can then say "You named her as Cabal courier; she matched Choir singer" even in single-group cases such as fixture A, which has three profiles. Group grading itself is deferred (2.2). |
| 2.2 | One `verdictNoun`, and three mark buttons (Undecided / guilty / clear). There is no "Cabal" / "Choir" / "Neither". | defer (the plan already reserves `profiles[].group`, R1D-22) | When scheduled: `groups: [{ id, noun }]`, `profiles[].group`, the mark's guilty button becomes one button per group, an optional fourth tag segment `#verdict:report:<s>:<group>`, a written `deduction_group_right_<s>` flag, and an `onWrongGroup` stake list. Outcomes stay the four the plan has. |
| 2.3 | `marked` is a single flag, so `markedAtLeast` counts both groups' marks together. "Has two Choir marks" cannot be stated. | minor | Workaround: `any` over `all`-of-`has` combinations (sound under §4.3, just less tight than the per-slot forcing). Extension when 2.2 lands: `marked: true \| "<group>"` and `{ "markedAtLeast": { "n": 2, "group": "choir" } }`. This changes the evaluator, so the Ruby port and the conformance file change too. |
| 2.4 | **Every clue is true.** A Choir witness who frames an innocent Cabal-hater cannot be modelled: a cell is a fact and facts are true. For a social-engineering game, "sources lie" is a lesson worth teaching. | defer (design question for the user) | Model testimony as non-cell intel ("Choir member X says Y") that the player weighs, and keep cells as verified facts. That needs no engine work. A real "unverified clue" state would be a large change to §4.3. |
| 2.5 | Relational clues ("met the Cabal courier in the garden") need the other suspect's guilt, which the rule language cannot reference. | defer | Author them as per-suspect clues ("met someone in the garden after midnight"). |

---

## 3. Quiet Fox (Eldritch Hacker): an online-only case

**Premise.** A cult is recruiting through an occult forum. Four forum handles are suspects. The player
works from one desk (one room) through the OSINT browser (forum threads, profile pages, a lookup tool), DMs
(phone chat with personas) and mail highlights. Nothing is searched physically. Verdicts: `report` to the
forum's moderator (a phone NPC) and `act` ("Invite them to a fake meet-up"). There is no combat, even
though the game allows it.

**Data sketch.**

```jsonc
"suspects": ["ded_q_quietfox", "ded_q_mothlight", "ded_q_hollowbell", "ded_q_ninthgate"],
// each: a phone NPC in q_desk.npcs (DL1), and a social.people entry with name "@quietfox" and so on
"slots": [ { "id": "posts",  "label": "What they post",     "perSuspect": "exactlyOne" },
           { "id": "dms",    "label": "What they ask in DMs", "perSuspect": "exactlyOne" },
           { "id": "trail",  "label": "Where else they appear", "perSuspect": "oneOrMore" } ],
"profiles": [ { "id": "recruiter", "label": "Recruiter",
  "text": "Moves new members to a private channel and asks for a real-world detail before trusting them.",
  "rule": { "all": [ { "has": "private_channel" }, { "has": "asks_real_detail" } ] } } ],
// routes: { "via": "osint" } on posts and trail (forum.thread_12, the lookup tool);
//         { "via": "npc", "id": "ded_q_moderator" } (witness);
//         { "via": "mail" } (a highlight in a forwarded DM).
"verdicts": { "allowed": ["report", "act"], "when": "anytime", "reveal": "end" }
```

The staging is all knowledge gates. Thread 12 has `showIf: "se_intel_q_handle_list"`. The lookup tool has
`unlockedBy: { "fact": "q_mothlight_email" }`. The private channel page has `showIf` on a DM fact.

**Gaps.**

| # | Gap | Severity | Minimal extension |
|---|---|---|---|
| 3.1 | **DL8 and DL6 do not see knowledge gates.** `osint` and `mail` routes are "room unknown; set `room`" warnings (§8 derived sets). Setting `room: "q_desk"` makes every cell an opening fact, so DL8 reports early collapse, although the OSINT pages are gated by `showIf` and `unlockedBy`. A clean fixture cannot pass with no warnings. | **major** | Give `osint` routes an `id` (`"<site>.<page>"` or a tool id), traced like the other routes. Treat a route as **not opening** when its page has a `showIf` or its tool has an `unlockedBy`, unless that global or fact is itself an opening fact. That fixpoint is small, over facts only. The same rule fixes 4.3 and 6.3 for ink. |
| 3.2 | DL1 requires each suspect to be an NPC in a room's `npcs`. A handle that only posts and never DMs still needs a dummy phone NPC, which then shows in the phone's contact list. | minor | Allow a suspect that is only a `social.people` entry when `allowed` has neither `accuse` nor `ko` and no `#verdict:<kind>` tag without a suspect names them. The runtime reads only the name. KO reconcile and the first-punch warning already skip non-NPCs. |
| 3.3 | Fading a forum post ("the thread was deleted") has no gate. `showIf` cannot negate, so a page cannot read `!deduction_faded_<f>`, and DL7(c) traces only trigger, npc and object routes. | minor | Either a `hideIf` on OSINT pages and blocks (one line beside `showIfHolds`), or the author pattern: a trigger on `global_variable_changed:deduction_faded_<f>` sets the page's `showIf` global false. Either way, DL7(c) learns to trace an `osint` route by its page's `showIf`/`hideIf`. |
| 3.4 | Handle versus real name: `social.people.name` is fixed, so the board says "@mothlight" for the whole case, even after the player learns who she is. | defer | `people[].nameWhen: [{ "global": "...", "name": "..." }]`, read by the board and the debrief. Until then, the `closingLine` can reveal names. |
| 3.5 | Two handles that are one person (sockpuppets) is a natural online twist with no data shape. | defer | Out of scope. The author can make "same writing style as @hollowbell" a clue. |

The rest fits. The moderator is a witness with influence and a `reports` threshold. The close is the
moderator's warned "Send the report?" with "Not yet". `reveal: "end"` and `light` stakes suit a story
ending in credits.

---

## 4. Three calls before lunch (Incident Simulations): vishing

**Premise.** A service desk analyst takes three calls in one morning: "Gareth from head office IT" wants an
MFA code read back, "Lloyds payments" wants to confirm a changed payee, and "Dev, a contractor" is locked
out and wants a reset. Any of them could be fake. The brief does not say how many, and saying "treat every
call as possibly fake" is better teaching anyway. Truth: Gareth is an impostor, the bank call is genuine,
and Dev is genuine but breaks policy. No combat, `completion` scoring, a success-screen ending.

**Data sketch.**

```jsonc
"suspects": ["ded_v_gareth", "ded_v_bank", "ded_v_dev"],   // phone NPCs in v_desk.npcs, arriving by timedConversation
"verdictNoun": { "guilty": "Impostor", "clear": "Genuine" },
"slots": [ { "id": "number", "label": "The number they called from", "perSuspect": "exactlyOne" },
           { "id": "ask",    "label": "What they asked for",         "perSuspect": "exactlyOne" },
           { "id": "knew",   "label": "What they knew",              "perSuspect": "exactlyOne" } ],
"clues": { "number_not_listed": { "slot": "number", "label": "number not in the directory", "count": 1 },
           "number_listed":     { "slot": "number", "label": "number in the directory", "count": 2 },
           "asks_secret":       { "slot": "ask", "label": "asked for a code or password", "count": 1 },
           "asks_routine":      { "slot": "ask", "label": "asked for something routine", "count": 2 },
           "detail_wrong":      { "slot": "knew", "label": "got an internal detail wrong", "count": 1 },
           "detail_right":      { "slot": "knew", "label": "knew the internal details", "count": 2 } },
"profiles": [ { "id": "impostor", "label": "Impostor",
  "text": "Called from a number that is not in the directory, or asked for a code or password.",
  "rule": { "any": [ { "has": "number_not_listed" }, { "has": "asks_secret" } ] } } ],
// routes: the caller's own story (what they ask: observed, not an alibi); the directory terminal
// (triggerOnInteract); a call-back to the real Gareth (a witness phone NPC); a colleague (witness).
"verdicts": { "allowed": ["act", "report"], "when": "anytime", "reveal": "end" },
// act: "Hang up and log it" (#verdict:act in the caller's own story); report: to the security desk.
"favours": { "ded_v_gareth": { "unlockFact": "v_gareth_ask", "room": "v_desk", "item": null,
             "onBackfire": [ { "type": "set_global", "key": "v_mfa_given", "value": true } ] } }
```

**Gaps.**

| # | Gap | Severity | Minimal extension |
|---|---|---|---|
| 4.1 | **There is no active "trust" verdict.** The decision on each call is binary: verify and help, or refuse. "Help them" is a `clear` verdict, but the `:clear` tag form and its action were cut (R1D-23, "no use case needs them"). Helping a genuine caller can then only be the absence of a verdict, so it is graded as "Not named", and helping the impostor is not a verdict at all. | **major** | Bring back a clear verdict with a kind of its own: `#verdict:trust[:<s>]` (a kind whose value is always `clear`), and `verdict` action `{ "value": "clear" }`. The runtime API already takes `value` (§5.5 `recordVerdict(suspectId, value, kind)`). Grading needs nothing new: clear on an innocent is `right_clear`, and clear on a guilty suspect is `missed_guilty`. DL12 adds the delivery route. The mark locks as with any verdict. |
| 4.2 | **A favour reveals everything.** Complying with a request is the natural "favour", with a backfire when the caller is the impostor. But `doFavour` grants every clue on the suspect (§5.5), so reading out the MFA code would fill Gareth's card. That rewards compliance with information, which is the wrong lesson. | **major** | `favours.<s>.grants: "all"` (the default, as now), `"none"`, or a list of facts. With `"none"` the favour is only the backfire plus `deduction_favour_<s>`. DL6 and DL8 add the implicit favour route only for the granted facts. |
| 4.3 | **DL8 sees one room.** All three calls ring at one desk, so every `npc` route is an opening fact and DL8 reports collapse. The real staging is time (calls arrive one after another through `timedConversation` with `waitForEvent`) and knowledge (the directory needs the caller's number first). A workaround exists: set `earlyCollapse: { "maxGuilty": 1, "minOpen": 0 }` with a `_why`, which switches the lint off. | major (workaround exists) | Apply the §8 "freely" rule to fact routes, not only to doors: a `#grant_fact` line inside a choice condition or conditional block is not an opening fact. Treat an NPC whose only contact is a `timedConversation` with `waitForEvent` as not opening. Same fix family as 3.1. |
| 4.4 | Pressure on the call: a caller who hangs up when pushed. This works today. Give the suspect `06` thresholds, and `refuses` ends the call. Their "what they knew" cell then has to come from the call-back witness, which DL6 should see as the second route. | fine | None. Worth a line in §7.2: thresholds on a suspect are allowed and model a caller who hangs up. |
| 4.5 | "Say you'll call back on the directory number" is the best play: it gives no verdict and defers. That is supported, because deferring is a plain ink branch. | fine | Teach it in the brief. The debrief's "The clue that would have settled it: the call-back to Gareth Reid" carries the lesson. |
| 4.6 | DL10 forbids "one of these calls is fake". | fine (a feature) | None. Phrase it as "Check every caller." |
| 4.7 | The success screen's fixed text means the episode always ends "Case closed". The debrief carries the outcome (§7.10). | fine | None. |

---

## 5. The Harlow Print invoice (Incident Simulations): supplier fraud insider

**Premise.** A supplier's bank details were changed three days before a large invoice run. Suspects: the AP
clerk, the AP supervisor, the procurement officer and the finance systems admin. The possibilities are that
someone inside helped, or that it was a pure email compromise with nobody guilty. Truth: the supervisor
approved her own change and is linked to the new account. A payment-run timer at 16:00 is ordinary mission
pressure. `report` goes to the finance director, with `final` at the case review. Stakes are `light`.

**Data sketch.**

```jsonc
"slots": [ { "id": "change",  "label": "The bank-detail change", "perSuspect": "exactlyOne" },
           { "id": "check",   "label": "The call-back check",    "perSuspect": "exactlyOne" },
           { "id": "link",    "label": "Links to the new account", "perSuspect": "exactlyOne" } ],
"clues": { "raised_and_approved": { "slot": "change", "label": "raised and approved the same change", "count": 1 },
           "raised_only": {}, "approved_only": {}, "no_part": {},
           "skipped_callback": { "slot": "check", "...": "..." }, "did_callback": {},
           "linked_account": { "slot": "link", "...": "..." }, "no_link": {} },
"profiles": [ { "id": "insider", "label": "Insider",
  "text": "Raised and approved the same change, or skipped the call-back and is linked to the new account.",
  "rule": { "any": [ { "has": "raised_and_approved" },
                     { "all": [ { "has": "skipped_callback" }, { "has": "linked_account" } ] } ] } } ],
// routes: vendor-master audit log (log_filter global), the change-request email (mail highlight:
// lookalike domain), the call-back log (text-file object), the companies register (OSINT lookup),
// the conflict-of-interest register (HR cabinet), a colleague witness.
"verdicts": { "allowed": ["report", "final"], "when": "final", "reveal": "end" }
```

**Gaps.**

| # | Gap | Severity | Minimal extension |
|---|---|---|---|
| 5.1 | **A no-insider variant always warns.** DL5 warns at zero guilty, with no way to say it is intended. Yet "it was outside fraud and nobody here did it" is a valuable training ending, and the clean-fixture rule (no warnings) blocks it. | minor | `"_noGuiltyWhy": "..."` (or `allowNoGuilty` with a `_why`) on the deduction block silences DL5's warning. DL6 and DL8 already cope with zero guilty. |
| 5.2 | Collusion ("approved a change raised by the guilty clerk") needs another suspect's guilt. | defer | Write it as a per-suspect clue, "approved a change without a call-back", as above. Truly relational rules are a large evaluator change. |
| 5.3 | The supplier contact ("Mark at Harlow Print") is a natural fifth suspect who is never in the building. | minor | Same as 3.2: people-only suspects. Until then, a phone NPC. |
| 5.4 | Linking the payment run to the case: "if nobody is named by 16:00 the money goes". A timer with `cancelOnGlobal: "deduction_closed"` works, but `cancelOnGlobal` tests truthiness. Cancelling only when the *right* person is named needs a stake (`onRightGuilty` with `"at": "verdict"` sets `h_run_stopped`), and under `when: "final"` the stakes run only at close. | minor | Author pattern: the run is stopped by a separate operational task (freeze the payee), not by the verdict. That keeps "stop the money" and "find the person" apart, which is the right lesson anyway. Document it in §7. |
| 5.5 | The comparison puzzles (invoice against the vendor master) use existing minigames: log filter, text file, mail highlights. | fine | None. |

---

## 6. Speak up (Incident Simulations): the wrongly suspected whistleblower

**Premise.** Patient records reached a journalist. Samira Haddad looks guilty at first: she opened the
records outside her role, copied them, and contacted someone outside. But she raised it through the
speak-up channel and the regulator. Ngozi Okoro sold the data. Haddad also holds the export log that proves
Okoro did it, and will hand it over only once she knows she is protected. If the player does nothing, Okoro
reports Haddad to HR at a set time and Haddad is suspended. Protecting her is the point.

**Data sketch.**

```jsonc
"verdictNoun": { "guilty": "Data seller", "clear": "Not a data seller" },
"profiles": [ { "id": "seller", "label": "Data seller",
  "text": "Copied the records, sent them outside, and did not raise it through the speak-up channel.",
  "rule": { "all": [ { "has": "copied_records" }, { "has": "sent_outside" }, { "not": { "has": "spoke_up" } } ] } } ],
"verdicts": { "allowed": ["report", "trust"], "when": "anytime", "reveal": "now" },   // "trust" is PROPOSED (4.1)
"stakes": {
  "rigidity": "costly",
  "suspects": { "ded_s_haddad": {
      "onWrongGuilty": [ { "type": "lose_ally", "npc": "ded_s_haddad", "global": "s_haddad_suspended", "text": "HR has suspended Haddad." },
                         { "type": "deduction_tamper", "facts": ["s_okoro_export"], "at": "verdict" } ],
      "onRightClear":  [ { "type": "set_global", "key": "s_haddad_protected", "value": true, "at": "verdict" } ] } } },
// timer t_s_frame: startOnGlobal s_okoro_alerted, delayMs 180000, cancelOnGlobal s_haddad_protected,
//   actions: lose_ally Haddad + deduction_tamper s_okoro_export (her copy goes with her).
// Haddad's ink: the export log (#give_item) only on a choice gated on s_haddad_protected.
// s_okoro_export has a second route (the backup recovery) for DL7.
```

**Gaps.**

| # | Gap | Severity | Minimal extension |
|---|---|---|---|
| 6.1 | **Protecting someone is not a verdict.** With no clear verdict (4.1), "Tell HR she is protected" cannot be recorded, graded or staked. `onRightClear` runs only at close for kind `none`, which is too late to beat the framing timer. | **blocker** for this premise | The same `trust` kind as 4.1. Here it reads "vouch for her". With it, `onRightClear` + `"at": "verdict"` sets the global the timer's `cancelOnGlobal` reads. No timer change is needed, because `cancelOnGlobal` only tests truthiness and the stake writes a boolean. |
| 6.2 | A suspect who is also a witness: Haddad's ink grants a cell on Okoro. Nothing forbids this, and DL12's witness check covers non-suspects only. Her grant is gated on a verdict global, though. | fine (to the contract), see 6.3 | State in §7 that a suspect may testify about others, never about themselves. |
| 6.3 | **DL8 and DL6 ignore ink gates on fact routes.** Haddad is in an opening room, so her `npc` route for `s_okoro_export` counts as an opening fact although it is gated on `s_haddad_protected`. DL8 then over-reports collapse. DL6 "after a wrong call" also misses that wrongly naming Haddad closes her route: `lose_ally` sets a global, but no `cost: true` is involved. | major | (a) The "freely" rule for `#grant_fact` lines, as in 4.3. (b) DL6 "after a wrong call" also applies every `lose_ally` in a wrong-guilty list: the NPC's routes close and the `global` is set. That is one extra line beside the existing `remove_item` handling. |
| 6.4 | The debrief's fixed lines undersell the lesson. "Rightly cleared" says nothing about *why* a whistleblower differs from a leaker, and the only authored hook is the case-wide `closingLine`. | minor | An optional per-suspect, per-outcome note: `debrief.notes: { "<s>": { "right_clear": "...", "wrong_guilty": "..." } }`, run through DL15 and DL10. Fixed lines stay engine-owned. |
| 6.5 | The framing timer is "someone else's verdict", but it must not use the `verdict` action, because that records a player verdict. The plan's `lose_ally` + `deduction_tamper` express it correctly. | fine | Add a §7 note: an NPC acting against a suspect is a stake-like action list, never a `verdict`. |
| 6.6 | DL9(c) and the "wrong calls must cost" rule are satisfied naturally, because wrongly naming Haddad costs the main evidence. This case shows the stakes design working as intended. | fine | None. |

---

## Cross-cutting findings

1. **Active clear verdict (4.1, 6.1, and 5's "trust the clerk").** R1D-23 cut it because "no use case needs
   it". Two of these six cannot work without it, and a third reads better with it. It costs little: one tag
   kind, one `value` field on the `verdict` action, and one DL12 route. The runtime and the grader already
   handle `clear`.
2. **DL8/DL6 do not model gates on fact routes (3.1, 4.3, 6.3).** Doors get the careful "freely" and
   "open from the start" rules, but a `#grant_fact` behind a choice condition, an OSINT page behind
   `showIf`, or a call that arrives after another all count as opening. Any one-room case (online, phone,
   desk-based Incident Simulations) will fail DL8 or need `earlyCollapse` switched off. That is most of
   Incident Simulations.
3. **The favour bundles "reveal everything" with "backfire" (4.2).** The board-game favour is right for
   Eldritch Hacker. "Comply with a request" in a corporate case needs the backfire without the reveal.
   `grants: "none" | [facts]`.
4. **Hidden profiles (1.1, 1.2).** This is the only blocker that is not about verdicts. The key is
   reserved. The cheapest safe version is `hiddenUntil` plus masking hidden profiles as `U` for the nudge
   only. The evaluator, the Ruby port and the conformance file stay unchanged.
5. **People-only suspects (3.2, 5.3).** DL1's NPC requirement exists for KO and own-story accusations, and
   cases with neither do not need it.
6. **Record the profile on the verdict (2.1).** A zero-risk data addition that improves fixture A's
   debrief today and leaves the path open for groups.
7. **Small authoring notes for §7:** a suspect may testify about others (6.2); thresholds on a suspect
   model a caller hanging up (4.4); an NPC acting against a suspect is never a `verdict` (6.5); keep
   operational stops separate from naming people (5.4).
8. **Deferred, as the plan already says or reasonably could:** groups (2.2, 2.3), lying sources (2.4),
   relational rules (2.5, 5.2), changing display names and sockpuppets (3.4, 3.5), profile source labels
   (1.6).

## Ranked recommendations

| Rank | Change | Unblocks | Size | When |
|---|---|---|---|---|
| 1 | `trust` (clear) verdict kind: tag `#verdict:trust[:<s>]`, `verdict` action `value: "clear"`, DL12 route | 4, 6 (blocker), 5 | small (S19, S20, DL12; the runtime already takes `value`) | this stage: reverse R1D-23 |
| 2 | Gated fact routes in DL8 and DL6: the "freely" rule on `#grant_fact`, OSINT `showIf`/`unlockedBy` with traced `osint` route ids, `lose_ally` in "after a wrong call" | 3, 4, 6, and most one-room Incident Simulations cases | medium (P10-C2b) | this stage, or before the first real Incident Simulations case |
| 3 | `favours.<s>.grants: "all" \| "none" \| [facts]` | 4 (comply with a request) | small (runtime, DL6/DL8 favour route) | this stage |
| 4 | Verdict records the mark's `profile`; the debrief names a mis-chosen profile | 2, and better debriefs in A and D | tiny | this stage |
| 5 | `profiles[].hiddenUntil`, a hidden profile as `U` for the nudge, DL10 reading the revealing source | 1 | medium (model, runtime nudge, DL6/DL8/DL10) | reserve the key now; build with the first mission that needs it |
| 6 | People-only suspects when there is no KO or own-story verdict | 3, 5 | small (DL1, a runtime guard) | before the first online case |
| 7 | `_noGuiltyWhy` for DL5; `debrief.notes` per suspect and outcome; OSINT `hideIf` | 5, 6, 3 | small each | with the first mission that needs each |
| — | Groups, lying sources, relational rules, display-name changes | 2, 3, 5 | large | defer (R1D-22 stands) |
