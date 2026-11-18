# m04 office life: questions for the user

**Cast picks (for clash checks): `ibrahim_diallo` (Ibrahim Diallo) and `joanne_pell` (Joanne Pell).**

## Q1. Tier

- (a) Tier 2 small: two night staff with needs, the reception cooler as a drink point and the ops-office kettle as the chat point, three exchanges, an evacuation exit. **Recommended**: it is the smallest version that talks.
- (b) Tier 1 as the missions plan says: presets on existing objects only. Vance cannot move (holding, pinned), so nobody would use them and there is no talk.
- (c) Tier 0: leave the night site as it is.

## Q2. Head count

The story says eleven on site in five places: credit `scenario.json.erb:242` (text) and four voiced lines, `ink/m04_opening_briefing.ink:315`, `ink/m04_npc_voltage.ink:239`, `ink/m04_npc_voltage.ink:436`, `ink/m04_closing_debrief.ink:433`. Two more people make the count false unless the story says they were never counted.

- (a) "Thirteen" in all five, and Voltage's list at `:239` adds "two in reception". Four re-voiced lines, each needing its own yes.
- (b) Reword to avoid a number ("Everyone on site walked out", "Everyone on site tonight..."): also four re-voices, and loses the precise count the scenes lean on.
- (c) No extras (Q1 c), no change.
- (d) The pair are off the roster (a desktop swap booked late, an early arrival), so HaX's intel and Voltage's recon stay as written: they are what each side believed. One exchange says they are not on the rota. The unvoiced blueprint note (scenario 2739) becomes "On site per tonight's rota: 11", and Ibrahim's talk line says his swap was booked late. It leans on Voltage trusting the rota over cameras the same note says cover all areas. Only the credit, the note and the debrief line change: "Thirteen people walked out of there tonight, two of them not on anyone's list." One re-voice. **Recommended.**

## Q3. Cast

- (a) Ibrahim Diallo (40s, Black, French-Senegalese, Leeds; office IT lead in overnight for a desktop swap, "the plant network isn't mine") and Joanne Pell (late 40s, white, Leicester; inductions coordinator in early for the six o'clock contractors). Both atlases have seated and pose frames; neither is in the Office Life Tour, m01, m03, m05, m06, m10 or the access tour. Both are in their forties, so every non-hostile person on site is 40 to 55; (b) and (c) add someone in their thirties. **Recommended.**
- (b) Joanne Pell with Nilesh Solanki (30s, Gujarati-British, IT analyst): younger, but a second South Asian man beside Vance and still IT.
- (c) Joanne Pell with Sofia Marchetti (30s, Italian-British, HR adviser for the induction day): no IT question, less variety.

## Q4. Optional work-permit tablet

A lore-only tablet left on the sofa while the pair are at the kettle, showing the six o'clock swap permit. No secret, no route.

- (a) No. **Recommended**: it would be m04's only security window, beside a story built on Vance's card.
- (b) Yes, lore only.

## Q5. Voicing spend

About 24 new clips (8 pool lines at the kettle, 4 talk lines, about 11 exchange lines, 1 bark) plus 1 re-voiced head-count line on Q2 (d) (4 on Q2 (a)). Q6 (b) adds 8 cooler pool lines.

- (a) Approve the sample first (`DIALOGUE_SAMPLE.md`), then the spend, with the head-count re-voice (one on Q2 (d), four on (a)) as a separate yes. **Recommended.**
- (b) As (a), and add one voiced debrief line scolding a KO of the night staff (as the guard has at `ink/m04_closing_debrief.ink:158`): one more clip.
- (c) Build unvoiced and hold the release until voiced.

## Q6. A pair at the reception cooler

The cooler's second standing cell is blocked by the coffee table and the planter, so the plan gives it one user: Joanne drinks alone and the pair only talk at the ops-office kettle, which opens once the player has Vance's card. Reception has no chatter before then.

- (a) Keep the cooler at one user. No dressing change. **Recommended**: reception stays quiet at four in the morning, and the talk waits for the kettle.
- (b) Move the planter one tile (a room-dressing change, checked through mission-room-dressing and the object position diff) so the cooler takes a pair (and Joanne no longer draws behind the fig), with a `cooler` pool of four lines each (8 more clips) and early chat in reception.

## Q7. A newcomer struck at the kettle

The chase leash is tied to the newcomer's spawn room (reception) and their last stop. Struck at the ops-office kettle, a newcomer stands there hostile and does not hit back while the player stays in the ops office; if the player then walks into reception close to them (within 160 px), they may follow into reception. They do not go back to the sofa until a reload, which brings them back standing at their sofa place, still hostile. On the plan's estimated cells the kettle is about 180 to 200 px from the doorway, so with the default 160 px the follow may only fire with the player right at the door.

- (a) Accept it and record what happens in the attack probe. It only happens after the player has attacked a bystander, the newcomer hits for 4, and the debrief already scolds the attack. **Recommended**.
- (b) Lower the pair's `behavior.hostile.aggroDistance` (px, default 160; 1 or more, because 0 falls back to 160; m04's own operative uses 96). Data only, no engine change. The follow then needs the player closer; in reception too, a struck newcomer only turns on the player within that radius. At 1 they never fight back anywhere (the m08 precedent).
- (c) Lower the pair's `behavior.hostile.chaseRange` (default 400, measured from their last stop) below the kettle-to-doorway distance. That stops the follow, but also shrinks the chase around the sofa and cooler.
