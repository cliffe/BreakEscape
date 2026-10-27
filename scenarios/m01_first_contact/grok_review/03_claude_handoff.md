# m01 First Contact — Editor Work Order

This is a work order for a follow-on editor. It describes what is inconsistent and what the
intended outcome is, in terms of narrative, structure, and whether the mission connects to
its practical environment. It intentionally leaves out the specifics of the practical
challenge — commands, techniques, and the contents of any secret are not needed to make
these corrections.

The mission is in good shape. These are consistency and wiring corrections, not redesign.
Each item lists the problem, the file(s) to change, and the intended outcome.

## A. The mission does not connect to its practical environment (highest priority)

**Problem.** The mission records an identifier that is meant to point at its practical lab
environment, so that a player on the live platform is given the right environment. That
identifier is a leftover from a different, earlier mission this one was copied from. It does
not name this mission's environment, so on the live platform the mission would find no
environment to attach, and the practical half of the mission would be unavailable.

**Files.** `mission.json` (the environment identifier field); `scenario.json.erb` (the
place the practical workstation is set up, which names the environment by a label that is
also a leftover and never matches the real one).

**Intended outcome.** Both point at this mission's own environment. The workstation label
should match the machine the player actually sits at. Confirm the identifier string against
how the platform records this mission's environment; a sibling lab mission shows the
expected form (a path to the environment's definition file).

## B. The practical workstation's placeholder address is wrong

**Problem.** The workstation the player uses is given a placeholder network address that
belongs to an unrelated network. The real environment places that machine on the same local
network as the other machine in the mission. In the live platform the real address is
supplied automatically, so this only shows in local/offline runs — but it should still be
correct.

**File.** `scenario.json.erb` (the workstation definition's fallback address).

**Intended outcome.** The placeholder address matches the address the environment actually
assigns, on the same local network as the mission's other machine.

## C. A duplicate copy of the environment definition has a broken internal reference

**Problem.** There are two copies of the environment definition — the canonical one used to
build it, and a duplicate kept alongside the mission. The duplicate points one of its
internal components at a location that does not exist, so building from the duplicate would
fail. The canonical copy is correct. The two copies also disagree on one published-guide web
address.

**File.** `scenarios/m01_first_contact/secgen/m01_first_contact.xml` (the duplicate).

**Intended outcome.** The duplicate's internal reference matches the working one in the
canonical copy. The web-address difference is an author decision (which address scheme is
canonical) and should be confirmed, not guessed.

## D. A decoding-tool object points at a deleted dialogue file

**Problem.** One in-world object (a decoding workstation) still names a dialogue script that
was removed in an earlier clean-up. The object no longer uses dialogue — it opens a tool
panel directly — so the reference is dead. It is inert at runtime but will mislead anyone
reading the file and can trip validation or voice-line tooling.

**File.** `scenario.json.erb` (the decoding-workstation object: the dialogue-path and
starting-point keys).

**Intended outcome.** Remove the dead dialogue reference from that object.

## E. A character's length of service is stated two different ways

**Problem.** The opening briefing says the antagonist has worked at the company for a short
time; two other characters (and the former manager's written timeline) say he has been there
much longer. The longer figure is the established one and is load-bearing for the backstory
(the former manager's investigation, the slow infiltration).

**File.** `ink/m01_opening_briefing.ink` (the line stating the antagonist's tenure), then
recompile that script.

**Intended outcome.** The briefing matches the established longer tenure.

## F. A character's job title drifts

**Problem.** The informant is described in two lines (one in the briefing, one in the
debrief) with a profession she does not hold. Everywhere else — her office sign, her own
notes — she has a different role. The two stray lines should match the role she actually has.

**Files.** `ink/m01_opening_briefing.ink` and `ink/m01_closing_debrief.ink` (one line each),
then recompile both.

**Intended outcome.** The informant's role is stated consistently across all dialogue.

## G. Documentation and low-priority cosmetics (optional)

- **README.** The mission's README repeats the stale environment identifier from item A.
  Update it to match the corrected value. File: `README.md`.
- **A minor character's internal name.** One character was renamed in the fiction but keeps
  her earlier surname as her internal object name. Not visible to players and internally
  consistent, so safe to leave. Changing it would mean updating several linked references at
  once. Author decision.
- **Player's codename.** The mission data and the dialogue scripts give the player's codename
  in two slightly different forms; the mission data wins at runtime. Harmless. Author decision.

## Not to change

One structural item looks inconsistent but must be left alone: the three practical-stage
tasks record their completion targets in two different notations, and one of them is in a
notation the completion checker does not recognise. That task still completes by another
route, and the project's own code comments record that "correcting" it would change the
timing of the mission for players already part-way through. Leave it; it is an author
decision already documented in the code.
