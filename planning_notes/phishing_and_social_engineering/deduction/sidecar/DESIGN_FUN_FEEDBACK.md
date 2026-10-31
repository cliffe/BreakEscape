# Sidecar: feedback and the board (FUN track)

Read-only review of `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` as it stood on 2026-10-22: **3327
lines, §14 up to Round 4 outcomes** (the status line at the top still says "rounds 1 to 3"). Design
background: `designs/12_deduction_board.md`; accessibility rules: `designs/03_intel_board.md`
"Accessibility and small screens". Nothing here edits the plan. Section numbers below are the plan's.

The aim is a game that is fun and teaches something, without being hard. The plan already gets the
reasoning right: the evaluator, the counts, the nudge and the "why" lines. What it lacks is *feel*.
Clues arrive as a generic "Noted" toast, the board shows no change since the last look, eliminations
only get explained afterwards in the debrief, and the debrief reads like a marking sheet: cards, outcome
words, then "3 of 4 calls right". The changes below cost little. Most are CSS and model fields, and none
adds a runtime system or new art.

## Top recommendations (in order of value for cost)

1. **Show what changed since the last look.** Mark new cells "New" and put a progress line in the
   header ("14 of 20 clues found"). The board then rewards opening it. (§A)
2. **Turn the debrief into a reveal.** Each card shows the player's call first, and a "Reveal" button
   turns it over to the truth. Every hidden cell is then turned face up with where it was. The clues that
   decided the call get a frame. (§F)
3. **Let the player claim an elimination.** When a count is used up, the profile card says so, and
   the clear-reasons picker offers "All <label> clues found elsewhere" as a reason. The "that rules
   out…" moment then belongs to the player, not just the debrief. (§B)
4. **Group toasts.** A favour or recovery that grants several clues should show one toast
   ("Noted: 4 clues about Okafor"), not a burst of them released together when the chat closes. (§A.3)
5. **Name the tampered cell and point at a second source.** "Someone has been at the evidence:
   Ishikawa, where they were. There may be another copy." (§D)
6. **One sound per kind of moment**, using existing `ui-sounds.js` keys only, never the only cue. (§G)
7. **Two optional authored lines for the reveal** (`debrief.revealIntro`, per-suspect `revealLine`).
   Also document the existing music events on `global_variable_changed:deduction_closed` as the way to
   score the reveal. (§F.4)
8. **A decision for the user:** should the board check the player's own reasons and marks against
   public rules ("That rules out Courier. Keyholder and Devotee are still open")? It teaches the core
   skill, but it says which way a suspect falls, so it conflicts with §13.2. It would be offered only
   when `nudge` is on. (§B.3, §E.2)

---

## A. A new clue lands

### A.1 Today

`#grant_fact` → `runtime.grantFact` → "Noted: <fact label>" toast (`systems/apply-actions.js:57`,
title "Noted", 4 s). While a conversation is open the toast is held and released when it closes
(`systems/notifications.js:23-31`, `holdRecentNotifications`). The nudge toast follows, with the title
"Case file". On the board the cell simply reads as shown. Nothing marks it as new.

### A.2 Recommendations

- **Toast title for clue facts: "Case file", body "<Name>: <clue label>"** ("Okafor: carries a brass
  key"). Non-clue facts keep "Noted". The suspect's name ties the toast to a card on the board, and the
  shared title teaches the player that "Case file" toasts belong to the board. The runtime already
  knows the fact's suspect (`deduction.suspect` on the fact, §4.2), so this needs no new data. Add a
  marked clue suffix "(marked)" in words.
- **"New" on cells since the last look.** Mirror the recon mode's `seenReady` pattern
  (`minigames/intel-board/board-model.js:62-67`, `newlyReady` at `:297`). Add `seen: [factIds]` to
  `deduction_state` (ids only, fits the 2 KB budget) and a `isNew` flag on each model cell. Opening the
  board marks every shown cell as seen, but only when the board closes, so "New" stays on screen for the
  whole visit. The card heading gets a count ("Okafor · 2 new"). The live region reads "New since you
  last looked: 2 clues about Okafor, 1 about Venn." on open, as recon mode reads newly ready targets
  (`intel-board-minigame.js:148-150`).
- **Progress in the header.** "<found> of <total> clues found". Both numbers are public: the cells are
  public (§3.1). Per suspect: "3 of 5 clues" under the name. This gives a sense of progress and tells the
  player where to look next without saying what matters.
- **Order stays fixed.** Do not re-sort cards to put new ones first. A stable layout is easier to read,
  and §6.2 already fixes cell order.

### A.3 Bursts

`doFavour` grants every clue on a suspect "through `grantFact` (one note per fact)" (§5.5). With four
or five cells plus a nudge, the held queue releases five or six toasts at once when the chat closes.
Recommend:

- `grantFact(id, { source, quiet: true })` for batch grants, then one toast from the caller: "Case file:
  4 clues about Marsh" (favour), "Case file: recovered: <label>" (recovery).
- The nudge toast, when it fires in the same tick, folds into the same toast as a second line ("You
  have enough to decide about Marsh."), keeping one toast per moment.
- The same rule applies to a trigger that grants several facts at once.

## B. Eliminations: "that rules out…"

### B.1 Today

Counts are on the profile card ("Brass key: 1 in this case, 1 found"). The evaluator uses an
exhausted count and the pigeonhole step, but the player only hears about it in the debrief ("Both
<label> clues were found elsewhere, so <name> could not have one").

### B.2 Recommendations (public information only, so no conflict with the nudge rule)

- **When a count is used up, the count line changes.** "Brass key: 1 in this case, all found ✓". Add
  a live-region line once: "All brass key clues are found." Do not write anything on other suspects'
  cells. The inference is the player's to make, and making it is the fun.
- **Pigeonhole, when the evaluator applies it:** say nothing live. It is a harder step, and the
  debrief's "Only <name> had room left for the <label>" covers it. Saying it live would give away a
  verdict in a single-clause profile.
- **The clear-reasons picker offers derived reasons.** Today it lists the suspect's held clue labels
  (§6.4). Add one entry per used-up count for a clue type in a slot where this suspect still has a hidden
  cell: "All brass key clues found elsewhere". Store it in `because` as `count:<clueId>`, a fixed
  prefix that keeps `deduction_state` ids-only. The debrief's "Your note" then reads back the
  elimination in the player's own words. That is the moment worth giving them.

### B.3 Reason check (decision for the user)

When the player marks someone clear and picks reasons, the board could say what those reasons rule out,
using only the public profiles and the clues the player chose:

> That rules out Courier (ward charm). Keyholder and Devotee are still open.

It practises the habit the "rule misread" no-blame line tells players to learn ("Checking each profile
line against it…", §6.3). It never uses hidden facts. It does say which way a suspect falls once every
profile is ruled out, and a player could toggle marks to probe it. Proposal: show it only when `nudge`
is not false (the existing switch, so fixture C covers the off case and D can turn it off). Never show it
for a guilty mark beyond "Your note: Keyholder. Check the clause against what you hold." The user should
choose, because §13.2 settles "never which way".

## C. Visual language

The house style applies throughout: dark panel, square corners, `--ui-*` tokens, Source Sans 3 for
reading text, Press Start 2P for headings, no hard-coded green (`designs/03` "Visual style"). Every state
reads in words. Shape and border carry the meaning, and colour only backs them up.

| State | Text (screen reader reads the same) | Visual | Assets |
|---|---|---|---|
| Hidden | "Hidden" | face-down card: `board-slot-empty.png` tile, muted | existing |
| Shown | the clue label | face-up card, pinned (`board-pushpin.png`) | existing |
| Marked | "✦ marked" after the label | double border plus the ✦ glyph in the corner; skin colour secondary | none (glyph is text) |
| New | "New" tag before the label | small tag, Press Start 2P, outlined | none |
| Destroyed | "Evidence destroyed" | diagonal hatching (`repeating-linear-gradient`), ⨯ glyph, label struck through only when the cell was never seen | none |
| Recovered | label, then "recovered" | face-up card with a dashed "repaired" border | none |
| Used-up count | "all found ✓" | tick icon `mark-tick.png` beside the count | existing |
| Mark: guilty | "<guilty noun> (<profile label>)" | a CSS "stamp" on the card heading: bordered noun, rotated about −3°, static | none |
| Mark: clear | "<clear noun>" | the same stamp, different border style (single vs double) | none |
| Verdict given | "Verdict given: <kind word>" | stamp turns solid; mark buttons disabled with that label | none |
| Right / wrong (when revealed) | outcome words with ✓ / ✗ | `mark-tick.png` / `mark-cross.png` plus words | existing |

Pixel-art versions (stamp, hatching, seal) are art for a later pass. The plan keeps packets to existing
assets (§1, out of scope), and every row above works with CSS and text.

**Two skins, one set of words.** The engine strings stay neutral ("✦ marked"). Eldritch Hacker can theme
the ✦ as a sigil through CSS only. Incident Simulations keeps the plain ✦. No new strings.

## D. Tampering

The default toast is "Someone has been at the evidence." (§5.5, `tamperText`). The player cannot tell
what they lost, so the moment frustrates more than it surprises. Recommend:

- **Name the cell:** default body "Someone has been at the evidence: <Name>, <slot label>." The board
  shows that cell as destroyed anyway, so the toast reveals nothing new.
- **Point at the second route.** DL7 guarantees a second route for every fadable fact, so the default
  can add "There may be another copy." That fits "not hard" and tells the player the loss is a new
  task, not a dead end. An authored `tamperText` still replaces the whole line.
- **When recovered:** "Case file: recovered: <label> (<Name>)". The cell turns face up with the
  "recovered" border. The debrief already lists destroyed and recovered evidence (§6.7).
- **Toast type `warning`** (amber inset in `ui-themes.css:1203`) rather than `info`, plus a sound (§G).
  Do not flash or shake the screen.

## E. Nudge, marks and the final call

### E.1 Nudge

The plan is right to say "never which way" and to show it once. Small changes:

- On the board, put the nudge line on the card heading next to the progress, not under the mark
  controls, so it is seen before the player scrolls ("You have enough to decide about Venn.").
- Give it a distinct but quiet sound (§G) only on the toast, not each time the board opens.
- Once a decidable suspect is marked, hide the nudge line on that card. It has done its job, and
  leaving it up makes a decided card look unfinished.

### E.2 Final call as a line-up

§6.6's confirm panel lists each suspect's mark and profile, then "This closes the case." Make it read
like a line-up rather than a form:

- One row per suspect: name, stamp, the profile picked or the reasons given ("Not a cultist, because
  of the ward charm"). Undecided rows say what will happen: "Undecided: counts as Not named".
- Order: the player's guilty marks first, then clears, then undecided, so the "Confirm the call"
  button sits under the decisions that matter. Sorting by the player's own marks reveals nothing.
- **Consistency hint (decision for the user, same switch as §B.3):** when a guilty mark names a
  profile that a held clue already breaks, the row adds "Check this against what you hold." This is
  the commonest real mistake (R1D-7, "You already held what settled it"), and catching it before the
  call is kinder than explaining it after. Never under `nudge: false`.

### E.3 Verdicts with `reveal: "now"`

The toast "Right call: Okafor matched the Keyholder profile." / "Wrong call: Venn matched no profile."
(§5.5) is good. Add: the card's stamp turns solid and the outcome icon appears on the board, and the
outcome sound plays (§G). A wrong call should land as a story beat, not a buzzer. Use `ui_alert_1`, never
`ui_reject`.

## F. The debrief as a reveal scene

### F.1 Today

§6.7 shows every card face up at once with its truth, verdict, note, outcome, held clues, why, and the
settling line, then favours, destroyed evidence, the closing line, the no-blame line and the summary. It
is complete and correct, but the player gets the answer to all suspects at once. The "who was it?"
moment, which is the reason for the whole case, is lost in a wall of text.

### F.2 Staged, player-driven reveal

- Each card first shows **what the player said**: name, the player's stamp (mark plus kind word), and
  "Your note". Under it is a **"Reveal"** button. Pressing it turns the card over (a CSS flip of about
  300 ms; none under reduced motion) to the truth line, outcome words with icon, "Why" and the settling
  lines. The live region reads the truth and outcome.
- **"Reveal all"** at the top for players who want the lot. Nothing is timed or automatic, so it is
  safe for keyboard and screen-reader users and never moves on before the player is ready.
- Finish stays available at all times. Close or Escape still acts as Finish (§6.1). A player who
  finishes without revealing loses nothing: the cards are still there when the board is reopened
  (§3.10, reopenable).
- Store `revealed: [suspectIds]` only for the open view. It does not need saving: a reload shows the
  cards face down again, which is harmless.
- Test state (§6.8): `debrief.cards[].revealed`, and the bridge presses "Reveal all" first.

### F.3 Turn every cell face up

This is the board game's "turn over every clue" moment, and it carries most of the teaching. On each
revealed card, show the suspect's full slot grid:

- held cells as before;
- cells **not found**: face up, faded, with "Not found, from <place>" (the place is already computed for
  `settling` and `notRuledOut`, §6.2: first route not closed by a faded global);
- destroyed cells: "Evidence destroyed" or "recovered";
- the cells that **decided** the truth get a frame and the words "decided it": the clue labels behind
  `why` (the matched clause for a guilty suspect, the failing clause per profile for a clear one).

The model needs one more list per card: `cells: [{ label, slot, state: 'held'|'notFound'|'destroyed'|
'recovered', place, decisive, marked }]`. The other card fields already come from the same evaluator
call.

### F.4 Voice and music

- **Optional `debrief.revealIntro`** (plain text, one line, shown above the cards): the handler's voice
  ("HaX: Right. Let's see who was who."). It defaults to nothing. The heading "How the case stood"
  stays.
- **Optional per-suspect `revealLine`** (`debrief.revealLines: { "<suspect>": "..." }`), shown on the
  flipped card after the truth line: one authored sentence of story ("Okafor's key opened the reliquary
  at two in the morning."). This turns a grade into a scene. It is authored, so it fits the no-LLM rule,
  and DL15 should scan both new strings. It must not contradict the truth (a reviewer check; DL can't).
- **Music needs no engine work.** `music.events` already accepts
  `"trigger": "global_variable_changed:deduction_closed"` (`music/scenario-music-events.js:9-16`). Name
  this in §7.10 as the way to give the reveal its own track, and use it in one fixture (A suits it) to
  prove it works. The credits track takes over from the ending global, as now.

### F.5 Summary and order

- Put the no-blame line at the top, under `revealIntro`, as a headline ("You had worked it out. Naming
  them is the step that turns evidence into a result."). Move the summary count to the footer beside
  Finish, in smaller type. The count is useful, but it is not the point of the scene.
- Add a positive line to "Your note" when the player's stated reasons are enough on their own (the
  evaluator run with just the `because` facts and count reasons decides the suspect clear): "Your
  reasoning held up." This is the reward for a reasoned clear, which the summary already counts
  (`reasonedClears`). It is shown only after the case closes, so it raises none of §B.3's concerns.
- Keep cards in `suspects` order. Ordering by truth would give the answer before each reveal.

## G. Sound (existing keys only)

All through `window.playUISound` / `soundManager.play` (`systems/ui-sounds.js`), so the volume
categories and mute in `systems/sound-manager.js:18-24` apply. Every sound duplicates a text line or
live-region line, so a sound is never the only cue. One sound per moment; a grouped toast plays once.

| Moment | Sound | Note |
|---|---|---|
| Clue toast (clue facts only) | `page_turn` | sounds like paper, unlike the chat notification chime |
| Nudge | `playUISound('notification')` | once per suspect, on the toast only |
| Count used up (board open) | `ui_click_3` | quiet; the line says it |
| Tamper | `ui_alert_2` | distinct from other alerts |
| Recovered | `page_turn` | as a clue |
| Mark button | `playUISound('click')` | as other board buttons |
| Verdict given (accuse, report, act) | `lock_and_load` | weighty, final, not good or bad |
| Reveal now: right / wrong | `ui_confirm` / `ui_alert_1` | never `ui_reject` |
| First-punch warning | `ui_alert_1` | toast already exists |
| Confirm the call | `ui_confirm` | |
| Debrief "Reveal" (per card) | `page_turn` | |
| All calls right, after the last reveal | `ui_confirm` | nothing for a loss: the credits and the music carry it |

The board's own sounds must not play while the credits visualiser is open (`BondVisualiser.isOpen()`,
already checked by `openDebrief`).

## H. Animation

CSS only, in `css/intel-board-deduction.css`. The board's existing rule already removes every animation
and transition under `prefers-reduced-motion` (`css/intel-board-minigame.css:302-307`). The new file must
sit inside `.intel-board-game-container` so that rule covers it. Nothing loops or flashes, and nothing
moves faster than 3 Hz.

| What | Effect | Duration |
|---|---|---|
| New cell on open | fade in from the face-down tile | 200 ms, staggered 40 ms, at most 8 |
| Count used up | tick icon scales 0.8 → 1 | 150 ms |
| Mark stamp | scale 1.2 → 1 with a slight drop | 120 ms |
| Verdict given | stamp border fills | 200 ms |
| Destroyed (first view after tamper) | hatching slides in | 300 ms |
| Debrief Reveal | card flip (rotateY) or crossfade fallback | 300 ms |
| Decisive cells | frame draws in after the flip | 150 ms |

## I. Accessibility checklist (from `designs/03`, applied to the above)

- Every new control ("Reveal", "Reveal all", derived reasons) is a button, reachable by Tab, works with
  Enter and Space, and is at least 44 px.
- Every state in §C has words; the ✦, ✓, ✗ and ⨯ glyphs are `aria-hidden` and the words are read.
- Live region (`role="status"`, polite) carries: new clues on open, used-up counts, mark changes, reveal
  results. Keep each announcement to one sentence; do not read the whole card.
- The flip keeps focus on the card. After "Reveal", focus moves to the card's truth line (a heading,
  `tabindex="-1"`).
- One column below about 700 px; the debrief's cell grid wraps.
- No reveal is timed. No sound is required. No colour carries meaning on its own.

## J. What this asks of the plan (for whoever folds it in)

| Change | Where | Cost |
|---|---|---|
| Clue toast title "Case file" and "<Name>: <label>" | §5.5 grantFact, §6.3 | strings |
| `quiet` grants and one grouped toast for favours, recoveries, multi-fact triggers | §5.3, §5.5 favours | small |
| `seen` in `deduction_state`, `isNew` on cells, header and per-card progress | §4.5, §6.2, §6.4, §6.8 | small |
| Used-up count line and live line | §6.2 `counts[].exhausted`, §6.3 | small |
| `count:<clueId>` reasons in the clear picker; read back in "Your note" | §4.5, §6.2, §6.4, §6.7 | small |
| Tamper default text naming the cell, "There may be another copy.", toast type `warning`; recovered toast | §4.1 `tamperText`, §5.5, §6.3 | strings |
| Final-call line-up ordering and "counts as Not named" rows | §6.6, §6.3 | small |
| Staged reveal, "Reveal all", per-card `revealed` | §6.7, §6.8, §11.4 | medium (view only) |
| Debrief `cells` with `notFound`, `place`, `decisive` | §6.2 `buildDebriefModel` | small (existing evaluator outputs) |
| "Your reasoning held up." | §6.2, §6.3, §6.7 | small |
| Optional `debrief.revealIntro`, `debrief.revealLines` | §4.1, DL15, §8 | small |
| Music on `deduction_closed` documented; one fixture uses it | §7.10, §9.2 | none (data) |
| Sound map and animation table | §6.4, new CSS | small |
| No-blame line as headline, summary to footer | §6.7 | trivial |
| **User decision:** reason check (§B.3) and consistency hint (§E.2) under `nudge` | §3.7, §13 | small if yes |

Engine-owned strings added here, for the DL15 term grep in §11.8: "Case file", "New", "<n> of <m> clues
found", "all found", "All <label> clues are found.", "All <label> clues found elsewhere", "There may be
another copy.", "recovered", "Undecided: counts as Not named", "Check this against what you hold.",
"Reveal", "Reveal all", "Not found, from <place>", "decided it", "Your reasoning held up.", "That rules
out <profile>". None uses a banned word.

## K. Left out on purpose

- Live annotations of eliminations on other suspects' cells. They do the player's thinking for them.
- Screen shake, flashes or colour bursts on a wrong call. They feel like blame and break the
  accessibility rules.
- Ordering debrief cards by truth or outcome. It spoils the reveal.
- A HUD badge for unread clues. It is worth doing later, but it needs HUD work outside Phase 10's file
  owners (§10.3); the "Case file" toast title does most of the job.
- New pixel art (stamps, seals, torn-card frames). That is a later art pass; everything above works
  with CSS and existing icons.
