# CA pilot mechanics: dialogue review of the new lines (ca12, ca15)

Reviewer: npc-dialog-review standards (SKILL.md, README_ink_best_practices.md). Scope: the
new spoken and shown lines proposed in `CA_PILOT_MECHANICS_PLAN.md` §1.7, §1.8, §2.6, §2.7,
reviewed as proposals *before* they are written into ink and voiced. Nothing is edited in the
plan or the ink here. The plan is being edited concurrently by another agent, so line numbers
are the plan section, not a byte offset.

Verdict: clean enough to write. 0 blockers, 0 majors, a short list of minors, almost all in
ca15 and all small. The strongest single fix is the semicolon in Nilesh's second answer line,
because TTS strips it and the line then runs together.

## Voices checked against existing records

- **Delphine Arvanitis** (`ca12_visitor_tailgater/ink/delphine_reception.ink`): warm, brisk
  front-of-house — "Morning. Can I help you?", "Right you are", "Go on then".
- **Yusuf Demir** (`_office_kit/ink/yusuf_demir_ambient.ink`): polite, professional security —
  "Morning. I'm Yusuf, I keep an eye on security here."
- **Niamh Doherty** (`_office_kit/ink/niamh_doherty_ambient.ink`): Irish, breezy — "Hiya",
  "Give us a shout".
- **Nilesh Solanki** (`ca15_shadow_it/ink/nilesh_solanki.ink`): quick, kind, funny; Gujarati-British.
- **Jun Watanabe**, **Joanne Pell**, **Jo** (off-screen tester): new to these shells, no
  established voice; judged for internal fit and register only.

All proposed lines match these voices. No line reads out of character.

## Counts

- Voiced NPC lines reviewed: ~30 (ca12: 13 Yusuf/Jun/Jo/Delphine; ca15: ~17 Nilesh/Joanne/chatter).
- Player choice lines (shown as player bubbles, not TTS): 2 (ca15 `red_stick`).
- Shown-not-voiced reviewed: ca12 six flip lines + two Jo toasts; ca15 none new beyond panel/note.
- No `{variables}` in any voiced line. No inline `*...*` stage directions. No em dashes. No
  "Cyber Security" usage (N/A). All barks/chatter within the stated 40-char caps; longest
  voiced line ~18 words (well under the 30-word face-to-face cap).

## Findings

| id | sev | section | line | issue | suggested rewrite |
|---|---|---|---|---|---|
| D1 | m | §2.7 | Nilesh answer line 2: "No label is deliberate. A labelled stick gets opened out of nosiness; a blank one, out of kindness." | Semicolon in a voiced line (P13). TTS strips punctuation, so this delivers as one run-on clause ("...out of nosiness a blank one out of kindness"). Also ~18 words and re-explains the "kindness" of answer line 1 (P7). | "No label is deliberate. A labelled stick gets opened out of nosiness. A blank one gets picked up out of kindness." |
| D2 | m | §2.7 | "kindness" appears in answer line 1 ("Kindness does the attacker's work"), answer line 2 ("out of kindness") and the after-find hub line ("She was being kind, and that's what a drop relies on"). | Up to three "kindness" beats in one sitting if the player asks why and then watches the find (P2). The point is the lesson, so keep two, not three. Weakest is the tail of answer line 2. | Fold D1 (drop the kindness clause from answer line 2), keeping "Kindness does the attacker's work" (answer 1) and the hub payoff. Or trim the hub line's tail: "Nobody was careless. She was being kind, and that's what a drop relies on." |
| D3 | m | §1.7 / §1.8 | Yusuf opens "Sorry, can I help you there?" in three places: the hi-vis bark (§1.8 r4, "...Deliveries go via the desk."), the `challenge` opening (§1.8 r5), and the `start` register is adjacent. | A deliberate guard mannerism and a single playthrough hears at most one route, so this is characterisation, not a repeat. Noted only so it is a conscious choice; keep the wording identical across the two if kept (refrain discipline). | No change required. If variety is wanted, the bark could be "Can I help you? Deliveries go via the desk." leaving "Sorry, can I help you there?" to the face-to-face `challenge`. |
| D4 | m | §1.8 | New ink knots must carry exact `displayName:` prefixes. | Highest-value attribution check. The new `ca12_yusuf_demir.ink` (`start`, `challenge`) must prefix every line `Yusuf Demir:` and the ca15 `red_stick` knot `Nilesh Solanki:`, exactly. Barks (Jo, Joanne, Jun chatter) are JSON bark/chatter fields and carry no prefix, so this applies only to the two ink knots. | When writing the ink, use the full displayName, not "Yusuf:" or "Nilesh:". |
| D5 | m | §1.7 | ca12 flip line 5 (shown): "Yusuf stopped you at the door. The desk is one layer; he was the second, and he held." | Shown text (not voiced), so the semicolon renders and reads fine. Two small nits: it says "one layer" where the door toast says "the first layer" (minor wording drift), and the semicolon could be a full stop for house style. Low priority. | Optional: "Yusuf stopped you at the door. The desk is the first layer. He was the second, and he held." |

## OK / no action

- **ca15 `red_stick` choice is not flat.** "Why would anyone plug in a stranger's stick?" yields
  two answer lines; "On it." skips them. Both then give the stick. Valid info/curiosity choice
  (§2d.1), rewards engagement, no soft-lock (give fires either way). First-person player words,
  not a menu label — correct per §2b.
- **Joanne's two barks teach by showing the mistake** ("I'll just plug it in and see whose it
  is.") — exactly the move the lesson is about; breezy, in register. Good.
- **Yusuf's `got_it` vs tailgate pass barks** ("Morning. Mind the step." / "Delivery? Studio's
  straight through.") correctly dramatise the guard being waved past by a uniform. Intentional.
- **Jo's tailgate bark** ("Nobody checked. A uniform and a held door beat both.") gives the
  attacker's read without restating the door toast's layer count. Good split (§2i same-fact).
- **Delphine** "I'll get the door for you." sits squarely in her existing voice.
- **Chatter pools** (Jun lobby; Joanne/Niamh kettle) are all under 40 chars, UK idiom
  ("nicked the big mug", "Hiya"-adjacent), and read as ambient. Fine.
- **Delivery handled by tags, not inline cues** (§1.8 `#delivery: polite, firm, unhurried`;
  §2.6 `#delivery: stepping into the red-team host role, conspiratorial but light`). Correct
  placement; no stage directions inside spoken text.

## Action list

**Should fix (small)**
- D1: drop the semicolon in Nilesh's answer line 2 (voiced; TTS run-on). One edit also resolves D2.
- D4: when the two new ink knots are written, use exact `Yusuf Demir:` / `Nilesh Solanki:` prefixes.

**Worth considering (polish)**
- D2: keep "kindness" to two beats, not three (covered by the D1 rewrite).
- D3: conscious call on Yusuf's repeated "Sorry, can I help you there?" opener.
- D5: ca12 flip line 5 wording drift ("one layer" vs "the first layer") and shown-text semicolon.

Nothing here blocks writing the ink or voicing. Re-run this check on the actual ink once the
knots exist, since attribution prefixes and the `#delivery` tag placement can only be confirmed
against the written file.
