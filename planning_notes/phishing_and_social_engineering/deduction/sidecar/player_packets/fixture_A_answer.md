# Judge's sheet: fixture A, "Open evening"

For the judge only. Do not show it to the player. Pairs with `fixture_A.md`.

Source: `DEDUCTION_IMPLEMENTATION_PLAN.md` §9.2 (also §6.3, §7.3, §7.4, §7.8, §5.5), read on
2026-10-22, 3327 lines, latest review round §14 Round 4 (md5 d059847781e96ff19e8985fe163012d6).

## 1. The truth

| Suspect | Where they were | What they want | What they carry | Truth |
|---|---|---|---|---|
| Okafor | lecture hall | ✦ wants the Codex | ✦ brass key, notebook | **Cultist: Keyholder** |
| Venn | Archive | wants funding | ward charm | Not a cultist |
| Marsh | garden | ✦ wants a promotion | ✦ sigil ring, ✦ burner SIM | **Cultist: Devotee** (3 marked) |
| Ishikawa | Archive | ✦ wants the Codex | ward charm, notebook | Not a cultist (Courier fails: carries a ward charm) |
| Delacroix | lecture hall | ✦ wants the Codex | umbrella | Not a cultist (Courier fails: was in the lecture hall) |

Ideal result: accuse Okafor and Marsh (or have Okafor's key seized), leave the other three un-named or
clear, then go into the sanctum.

## 2. Reveal on action

| Player action | What the judge reveals |
|---|---|
| Hand Marsh her phone | All of Marsh's clues are shown at once: in the garden, wants a promotion, sigil ring, burner SIM [placeholder text for SIM: "Marsh slips a burner SIM out of the phone's case."]. The phone leaves the inventory. **Backfire:** a hostile lookout appears in the cloakroom. Later debrief line: "You fetched Marsh's phone before checking her: it was how she signalled the others." |
| Watch the security monitor | Grants Okafor's brass key. If Okafor has no verdict yet, HaX calls: "Only one of those keys exists, and Okafor has it. What do you want to do?" Options: "Confront her now" (accuse verdict, right call); "Leave her be and watch where she goes" (HaX: "Fine. Watching her doesn't stop her tonight. She still needs naming."; no verdict); "Have it taken off her at the door tonight. This can't be taken back." (HaX: "I'll have a team take it off her at the door."; acted-on verdict, right call). The credits differ by this choice. |
| Accuse Okafor or Marsh | Toast "Right call: <name> matched the <Keyholder/Devotee> profile." Okafor replies "How did you..." Sets the ritual-weakened state. |
| Accuse Venn, Ishikawa or Delacroix | Toast "Wrong call: <name> matched no profile." Reply e.g. "You're making a mistake." [placeholder for other suspects' lines]. **1st wrong call:** the lodge grows suspicious and the coats in the locker now give nothing. If it is Venn: "Venn won't help you now." She leaves, and her archive code is no longer offered (the cloakroom note still has it). **2nd wrong call:** a hostile doorman appears in the Hall. **3rd wrong call:** HaX rings: "You've burned the evening. Get out now?" with "Get out" (closes the case: debrief, then credits with "You were thrown out before the ritual.") or "Not yet". |
| First punch on a calm guest | "Knocking out a suspect counts as accusing them." |
| Knock out a guest | Recorded as a knockout verdict, judged as above (right or wrong call, same costs). KO of Okafor: she drops the brass Tesseract key; picking it up grants her key clue. HaX's key-choice call does not open after a KO. |
| Read the coats after any wrong call | Nothing. |
| All five guests have verdicts | Board: "Everyone here has been dealt with. Call HaX when you're ready for the sanctum." |
| HaX "Go in" | The debrief opens first (one card per suspect, as §3.10/§6.7). Then the sanctum opens. If Marsh or Okafor was never named: a hostile acolyte waits in the sanctum (after the debrief). Guests not named are ruled "Not named". |
| Altar, confirm | Ends the evening. Credits under "CASE CLOSED", with lines for the ritual weakened, each missed cultist, each wrongly named innocent ("Venn was thrown out of the lodge for nothing." for Venn), being thrown out, and the key choice. Never "MISSION COMPLETE". |

## 3. When the nudge appears

"You have enough to decide about <name>." shows (board line and a one-off toast) once the held clues
decide a suspect. From the plan's hand check (H = the Hall's six witness clues plus the glass; C = the
coats; F = Marsh's favour; A = the archive):

| Clues held | Decided (nudge shown) | Still open |
|---|---|---|
| H | nobody | all five |
| H+C | Venn, Ishikawa | Okafor, Marsh, Delacroix |
| H+C+F | Venn, Ishikawa, Marsh, Okafor (by count: hers are the only hidden carry spaces left for the key) | Delacroix |
| H+C+A | everyone (Marsh by count: her last hidden carry space is the only place left for the SIM) | none |
| H+C+F+A | everyone | none |
| H+A | Okafor (camera), Delacroix, Venn | Ishikawa, Marsh |
| H+F | Marsh | the other four |
| H+F+A | everyone (Ishikawa by count: the two ward charms can only be hers and Venn's) | none |

The nudge is shown for clear and cultist alike. It never says which way.

## 4. Debrief "Why" lines the player should end up with

- Okafor: "Keyholder: yes, carries the brass key".
- Marsh: "Devotee: 3 marked clues (sigil ring, burner SIM, wants a promotion)".
- Ishikawa: "Courier: no, carries a ward charm".
- Delacroix: "Courier: no, was in the lecture hall".
- Venn: Courier no (wants funding); Keyholder no; Devotee no. [placeholder exact wording]

Clue sources, for "The clue that would have settled it: <label>, from <place>": Marsh's SIM is only
from "Marsh's favour"; Okafor's key from the security monitor (or a KO drop); passes from the badge
log; coats from the locker; the ring from the wine glass.
