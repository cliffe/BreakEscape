# m09 office life: questions for the user

## Q1. How much office life does m09 get?

The archive is closed at night and the director has sent staff home ("tonight she's sent me home twice", `ink/m09_noor_haddad.ink:49`; "We're closed. Nobody comes in for a deed at this hour", `:64`). Every person on the map is pinned by the plot, and there is no kitchen.

- **(a) Tier 0 for people, plus `roomTone: true`.** No new NPCs, nothing moves. The hum carries through open doors, crossfades, and ducks under the phone calls. One scenario key, no art, no voicing. **Recommended; the plan follows it.**
- **(b) Tier 0, nothing at all.** As the missions plan expected.
- **(c) Tier 2, a night cleaner pair** (two new ambient people, for example at the staff-passage cooler). Needs new characters or adapted awareness-cast ones (a UK cast in Montana), contradicts the lines above, puts witnesses in a covert entry, and needs art and voicing. Not recommended.

## Q2. Noor's own-room cooler trip

Noor could step to the front-desk water cooler and back. The rules rule it out twice: she holds her staff card, and her clone choice reads where she stands ("Lean in over her list", `:107`). Allowing it would mean waiving the holding rule and changing an existing line. **Recommended: no.** The plan does not move her.

## Q3. Four rooms and three late scenes get louder

Today a room with its own hum next to an earlier room with one plays the neighbour's bleed (0.125), not its own level. Room tone plays each room's own authored level, which no player has heard yet: server closet 0.4, restricted cage 0.5, tape room 0.35, salvage cage 0.6 (normalised levels; the player's SFX and master sliders scale them).

Three late scenes in the salvage cage play over that 0.6 hum, halved while the chat is open, so 0.3 against today's 0.125: the identity scene after flag 3, Tesseract's call after flag 4 (which the music deliberately leaves silent, so the hum is the only bed under it) and the hangar debrief. When the debrief closes, the hum may rise towards its full level for under a second, or not rise at all, before the ending visualiser silences it; the build measures it.

- **(a) Keep the authored levels and judge them in the build's listen check**, which records the numbers; come back with a change only if they sound wrong. **Recommended; the plan follows it.**
- **(b) Lower the four `ambientVolume` values now** (for example to 0.2 to 0.3). Changes existing scenario data.
