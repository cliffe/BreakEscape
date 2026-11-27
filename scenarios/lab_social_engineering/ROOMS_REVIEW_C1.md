# Lab rooms review, cycle 1: dressing, lighting, backgrounds (`lab_social_engineering`)

Written 2026-10-22. Read-only review: no repo files changed apart from this one, no images generated, nothing committed. Kind of game: a lab game (education first, browser-only, a working day at a small consultancy, fictional companies). The aim for the rooms: each one reads at a glance as the stage of the engagement it holds, and the student can find the workstation or person they need without hunting.

## Evidence

Screenshots (scratchpad `se-rooms-c1/`, full path `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-rooms-c1/`):

- Lab, game 3204 (`tools/playtest/lighting-tour.sh lab_social_engineering … --close-intro --check`): `lab/engagement_office-a.png`, `lab/recon_room-a.png`, `lab/operations_room-a.png`, `lab/blue_team_room-a.png`; zooms `eo_zoom.png`, `ops_zoom.png`. The tour reported "lighting is not active (scenario not opted in)".
- Shipped comparisons: m01 `main_office_area` (game 3205, `m01/main_office_area-b.png`), which uses the **same `room_office` map** as all four lab rooms; m08 `operations_floor` and `intel_analysis` (game 3206, `m08/*.png`), purpose-built rooms.
- Candidate maps: `prev/contact_sheet.png` (`render_room_preview.py`; it also draws conditional slots the game hides). Candidate props: `props.png`. Candidate backgrounds: `bgs.png`.
- `python3 scripts/room_gen/slot_audit.py --verbose scenarios/lab_social_engineering/scenario.json.erb`: 9 problems, every lab object type except the phone has no map slot and lands by explicit position only.
- The harness needed Node 24 on PATH (`/home/cliffe/.cache/ms-playwright-go/1.57.0`) and `PLAYWRIGHT_BROWSERS_PATH=…/se-P4-T0/browsers`, as R5 did. The tour script stopped its own sessions; no browser was left running.

## What is there now

| Room | Map | Lighting | chatBackground | Lab objects as drawn |
|------|-----|----------|----------------|----------------------|
| Engagement Office | `room_office` | none (no scenario `lighting` block) | none | RoE sheet, planning whiteboard and recon board are three identical corkboards (`case-file.png`) standing on the floor below the back wall; the report workstation is a fourth copy of the same corkboard, overlapping the right-hand desk's plant |
| Recon Room | `room_office` | none | none (no person NPC, so none needed) | OSINT workstation: a 24px laptop with a hood icon (placeholder, same file as page-builder and triage) on the floor at (4,3) beside a loose chair |
| Operations Room | `room_office` | none | none (Dev is phone-only) | mail terminal: blue monitor with an envelope (reads well); page builder: the same hood laptop on the floor; desk phone claims `phone5` from the top-left desk and is moved to (7,3), where it is not visible in the screenshot (it looks to sit behind the right desk's tower PC) |
| Blue Team Room | `room_office` | none | none, though Tomasz talks here | triage workstation: the hood laptop again; SOC board: the corkboard again |

`md5sum` confirms the placeholders: `osint-workstation`, `page-builder` and `triage-workstation` are one file; `case-file` and `report-workstation` are another.

## Judgement per room

**All four rooms are the same room.** Each is m01's `room_office` unchanged: purple carpet, four desks of decor PCs, a TV, a bookcase and a school chalkboard on an easel (the dressing skill lists easel chalkboards as a theme misfit). The only differences between rooms are the loose lab objects dropped on the floor. A student walking from the hub into Recon, Operations or Blue Team sees the same room each time, so the rooms carry none of the stage's meaning. m08's operations and intel rooms show the bar: a named wall sign, a status board that fits the job, and screens that glow.

**Engagement Office (hub).** It does not read as a place where a client signs rules of engagement. The three boards are the right idea but are drawn as floor-standing corkboards in a row. **Ruth (3,3) and Fairbairn (5,3) stand directly in front of the RoE board (2,2) and the planning board (4,2).** An NPC's tap area is its whole 80x80 frame, so taps on those boards are likely to raise a pick-one menu or open the conversation instead (dressing skill, "Interactables need room"). The report workstation, drawn as a corkboard, does not look like somewhere you write a report. Major.

**Recon Room.** It has no sense of research: no screens on the wall, no pinned printouts, no org chart. The one thing the student must use is the smallest, least computer-like object in the room, while six decor PCs on desks look more usable. Major for findability.

**Operations Room.** The mail terminal reads well. The page builder is the same hood laptop as the OSINT one, and the desk phone that stage 5 depends on cannot be seen. A room where the student sends phishing email, builds a landing page and makes a pretext call should look like a working floor of desks with phones. Major (phone visibility needs checking in game).

**Blue Team Room.** It does not read as a defender's room: no SOC screens, no alert board. Tomasz uses the `male_telecom_v2` placeholder in a hi-vis vest, which reads as a site guard, close to the "security guy" stereotype PLAN §3 warns against (character pipeline, not this stage). No chat background, so his debrief plays on the plain frame. Major.

**Lighting.** None. Every shipped mission from m01 to m08 opts in (`"lighting": { "enabled": true, … }`) and lights each room; the lab has no mood at all, and none of the stage-to-stage changes in feel that motion rooms give (dark through the door, the tubes strike as you walk in).

**Backgrounds.** No room has a `chatBackground`, so every Ruth, Fairbairn and Tomasz conversation opens on the plain frame (`person-chat-background.js` precedence step 5). Recon and Operations need none, because nobody stands in them.

## (a) Proposals with no new art

### A1. Give each room its own map, seeded from a shipped room that already fits (major)

Editing `room_office` itself would change m01, so the lab needs its own map types. Copy four shipped maps into lab-owned types (the dressing skill's "One map type, several rooms" recipe), then trim and dress them with `scripts/room_gen/room_edit.py` using existing props only. Each seed comes with a matching shipped POV background, which serves as a stop-gap until (b).

| Lab room | New type | Seed map (used by) | Why it fits | Remove | Add (existing catalog props) | Stop-gap chatBackground |
|----------|----------|--------------------|-------------|--------|------------------------------|-------------------------|
| Engagement Office | `room_se_engagement` | `room_zds_conference` (m03) | A meeting table for the RoE signing with the client, a whiteboard, a wall screen, a flip chart | `bar_cart1` (drinks trolley, wrong tone for 08:00) | `qdc_suspects_board1` (photos and red string: the Ledgerwell target board), `year_planner1` (the engagement timeline), `wall_clock1` | `m03_conference_room_01_blended.png` |
| Recon Room | `room_se_recon` | `room_zds_office` (m03) | A quiet single-desk research room with an org chart on the whiteboard and a small rack | `camp_bed1`, `pizza_boxes1`, `energy_cans1`, `cable_tangle1`, `uni_certificate1` ×2 (Danny's story props) | a second desk with `pc6` facing the first, `notice_board1` (pinned printouts), `threat_map1` or `info_screen1` on the wall | not needed (no person NPC) |
| Operations Room | `room_se_ops` | `room_qdc_open` (m05) | A working floor: three desks of PCs, a phone on a desk, a photocopier | `qdc_it_sign1` ("IT SUPPORT"), `qdc_whiteboard_net1` (QDC network) | `whiteboard1` or `hq_poster_postit1` in their place, `coffee_station1` | not needed (Dev is phone-only); `m05_open_office_area_blended.png` exists if a person is ever added |
| Blue Team Room | `room_se_blueteam` | `room_aes_security` (m04) | A wall of CCTV screens and a monitoring desk: closest to a small SOC | `aes_hivis_hook1`, `aes_radio_charger1`, `key_cabinet1` (site-guard props) | `siem_dashboard` (the SOC board), `threat_map1` | `m04_security_office_blended.png` (shows the hi-vis jacket, so this is the weakest stop-gap) |

Registration touches shared files: `core/game.js` (`tilemapTiledJSON`), `scripts/scenario-schema.json` (room-type enum), the room table in `README_scenario_design.md`, and the hand-maintained list in `scripts/generate_rooms.py`. That needs the orchestrator's sign-off under the build brief's scope rule.

**Doors to check on each copy** (the seeds had different connections): the hub needs W, E and N doors, but `room_zds_conference` only had E in m03, and its `credenza1` (x 32, feet y 112) sits near the west side-door rows (y 64–100). Recon needs E, where `room_zds_office` has `servers4` (x 262, feet y 146) and `coat_stand1`. Blue Team needs S, but `room_aes_security` only had N in m04, with `photocopier1` and `filing_cabinet_steel1` on the bottom row. Run `scripts/generate_rooms.py --check`, `scripts/room_gen/check_room_walls.py` and `scripts/check_door_alignment.py` after each copy, and move props off door rows rather than moving doors.

**A cheaper interim (A1-lite):** point the rooms straight at the four shipped types without copying. That gives the right look today at no cost, but every later m03, m04 or m05 map edit would reach the lab, and the off-tone props (camp bed, hi-vis hooks, IT SUPPORT sign) stay. Use it only if registering new types has to wait.

### A2. Put the lab objects on real fixtures with `as-type:` (major)

Today every lab object has no slot and floats at an explicit tile. Claim real map sprites instead, so the workstations are the obvious desks and screens, and so they glow under the stock `EMITTERS` (which match `pc*`, `laptop*`, `security_monitor`, `conference_screen` and `screens` by texture key). Drop the explicit `position` once an object claims a slot.

| Object | Claim | Room |
|--------|-------|------|
| `roe_sheet` (case-file, scope) | `as-type:notes`: the `notes1` slot on the conference table, "waiting for Gareth's signature" | Engagement |
| `planning_whiteboard` (case-file, plan) | `as-type:whiteboard`: the seed's `whiteboard1` | Engagement |
| `recon_board` (case-file, recon) | `as-type:qdc_suspects_board` (added in A1) | Engagement |
| `report_workstation` | `as-type:exec_laptop`: the seed's table laptop, or a `pc8` on a side desk if the table gets crowded | Engagement |
| `osint_workstation` | `as-type:pc`: the main desk PC | Recon |
| `mail_workstation` | keep its own envelope sprite (it reads well), on a desk via a `pc` slot's position, or `as-type:pc` | Operations |
| `page_builder` | `as-type:pc` on the second desk; its screen shows a page, and `conference_screen1` (a blue login form with a green button) is the right wall-screen sprite if a wall position is wanted | Operations |
| `desk_phone` | no override: it claims `phone3` on the seed's desk, which a player can see and reach | Operations |
| `triage_workstation` | `as-type:security_monitor` on the monitoring desk | Blue Team |
| `soc_board` (case-file, defender) | `as-type:siem_dashboard` (added in A1) | Blue Team |

Probe first, because nothing in the lab has used this yet: confirm on one object that `as-type:` keeps the object's own `type` (so `case-file`, `osint-workstation`, `page-builder`, `triage-workstation` and `report-workstation` still open their minigames) and that the texture is the claimed fixture's. If it doesn't, fall back to `"sprite"` overrides of the same size as the slot (dressing skill, "`sprite` … drawn from the slot's top-left"). Re-run `slot_audit.py --notes` until it shows 0 problems.

### A3. Clear the NPCs off the boards (major, no map change needed)

Wherever the boards end up, keep each NPC's 80x80 tap frame off every interactable's face. In the hub, put Ruth at the head of the meeting table and Fairbairn seated or standing to one side, away from the RoE sheet. Following the placement rule, put Tomasz about two-thirds across and a third of the way down, clear of the CCTV desk. Ruth must stay in the start room (PLAN §2; her record is the single listener). Check each spot with `tools/playtest/lighting-tour.sh lab_social_engineering <out> <room>` and a tap on each board.

**If A1 waits, do this on the current map now:** move the three case-file objects off y=2 or move Ruth and Fairbairn down to y=4–5, so the NPCs and boards no longer overlap.

### A4. Lighting (major)

Scenario level, day office (`gameClock` Mon 08:00): `"lighting": { "enabled": true, "defaultMode": "on" }` with the engine's default ambient, the "day office" row of the lighting skill's table. Per room, reusing the seed rooms' shipped blocks (lighting skill reuse rule) without their story variants:

```json
"engagement_office": { "lighting": {
  "emitters": {
    "power_panel": { "color": "#7dffa0", "radius": 14, "intensity": 0.4, "effect": null },
    "fire_alarm_point": [ { "intensity": 0 } ],
    "exec_laptop": { "color": "#9fd4ff", "radius": 28, "intensity": 0.45, "effect": "screen" } } } }

"recon_room": { "lighting": {
  "mode": "motion", "darkAmbient": "#1e2740",
  "emitters": { "fire_alarm_point": [ { "intensity": 0 } ] } } }

"operations_room": { "lighting": {
  "mode": "motion",
  "emitters": {
    "fire_alarm_point": [ { "intensity": 0 } ],
    "mail_terminal": { "color": "#9fd4ff", "radius": 44, "intensity": 0.65, "offsetY": 6, "effect": "screen" } } } }

"blue_team_room": { "lighting": {
  "ambient": "#b2b8c8",
  "emitters": {
    "aes_dvr": { "color": "#7dffa0", "radius": 10, "intensity": 0.5, "above": true },
    "fire_alarm_point": [ { "intensity": 0 } ],
    "siem_dashboard": { "color": "#7dffb0", "radius": 40, "intensity": 0.5, "offsetY": 16, "effect": "screen" } } } }
```

How the mood should run: a plain daylit hub where the client meeting happens; Recon and Operations dark through the door, with the tubes striking as the student walks in and the screens glowing first (the "back room" of the engagement); Blue Team a shade cooler and screen-lit (`#b2b8c8` is m08's operations-floor ambient), with Tomasz keeping it lit. No flicker anywhere, because the student spends long stretches in every room. No `offAfter`, so a room the student returns to stays lit. Any lab object that keeps its own sprite type (`mail_terminal`, and `osint-workstation` etc. if A2's probe fails) needs a room emitter, because the stock `EMITTERS` regex only matches at the start of the key and won't glow `osint-workstation`. Render dark and lit with the tour and review per the lighting skill.

If A1 waits: give all four `room_office` rooms m01's `main_office_area` block (`"ambient": "#e4e8ee"` plus the two lamp emitters), with Recon and Operations set to `"mode": "motion"`.

### A5. Stop-gap chat backgrounds (minor; replaced in (b))

- With A1: use the seeds' backgrounds listed in the A1 table for the Engagement Office and Blue Team.
- Without A1: `assets/backgrounds/rooms/m01_main_office_area_blended.png` is a POV of this exact `room_office` map, so it matches the current layout. Set it as `chatBackground` on the Engagement Office and Blue Team today.

### A6. Small things

- Replace the `room_office` easel chalkboard and the bookcase wherever they survive with `whiteboard1`/`notice_board1`; it's an office, not a classroom.
- Keep the Operations desk phone on a desk top, never on the floor: PLAN §2 requires it on an open, reachable tile.
- `observations` for the claimed fixtures should describe what the student sees, e.g. the recon board: "Photos of Ledgerwell staff, string between the ones you can reach."

## (b) Proposals that need new art

Order: dressing (A1–A3 and B3–B4) first, then lighting (A4), then the POV backgrounds (B1–B2) last, because they copy the final layout and mood. One image at a time, with sign-off between. PixelLab first (flat subscription). Gemini is used only for the background concepts, as the `room-pov-background` skill requires. Check `python3 tools/pixellab_pipeline.py balance` before and after.

### Core: 7 assets

| # | Asset | Size | Tool | Prompt sketch | Reason |
|---|-------|------|------|---------------|--------|
| B1 | Engagement Office POV background `lab_se_engagement_office_blended.png` | 400x400 (concept 1024x1024 `_nonpixelart.png`) | Gemini concept → PixelLab pixflux via `tools/pixelate_background.py` (`room-pov-background` skill) | Eye level from behind the player, looking at the back wall of a small consultancy meeting room on a Monday morning: whiteboard with an org chart, a wall screen, a corkboard of staff photos joined by red string, a year planner, blinds, a meeting table with papers in the foreground, plain cool daylight. Send the back-wall strip and a written inventory, never the full map | Ruth and Fairbairn have the most conversations in the lab and play on a blank frame; the m03 stop-gap shows a different company's room |
| B2 | Blue Team POV background `lab_se_blue_team_blended.png` | 400x400 (concept 1024x1024) | Gemini → PixelLab pixflux (same skill) | Eye level at the back wall of a small in-house security office: a row of monitors showing dashboards and an alert list, a SIEM screen with green panels, a desk with two monitors and a headset, a mug, no hi-vis, cool screen light | Tomasz's teaching and closing debrief happen here; the m04 stop-gap shows a power-site guard room |
| B3 | Tarnside Assurance logo sign | about 80x19 (like `hq_logo_sign1` 82x21) | PIL by hand (free) using the palette of neighbouring signs; PixelLab only if a logo mark is wanted | Navy plate, white "TARNSIDE ASSURANCE" in pixel caps with a small shield-and-tick mark | The hub has nothing saying whose office it is; every shipped mission puts its organisation on the back wall (m08 "SAFETYNET CITADEL") |
| B4 | Room name wall signs ×4: ENGAGEMENT, RECON, OPERATIONS, BLUE TEAM | about 47–64x11 (like `hq_ops_sign1` 47x11, `hq_intel_sign1` 55x11) | PIL by hand (free), the `hq_*_sign1` style | Dark plate with a thin light border and white pixel capitals | `door_sign` is used only in prompts and lock titles and is never drawn, so nothing on the map names a room. m08's "OPERATIONS" and "INTELLIGENCE" plates are the model |

B4 counts as four assets, so the core total is 7: two backgrounds (about 2 Gemini calls plus 2 PixelLab pixflux) and five signs (free if drawn by hand).

### Optional: up to 5 more

| # | Asset | Size | Tool | Prompt sketch | Reason, and when to skip it |
|---|-------|------|------|---------------|-----------------------------|
| B5 | Engagement Office left view `lab_se_engagement_office_left_blended.png` | 400x400 | a crop or second view from B1's concept (skill: wide rooms use views by NPC x) | as B1, framed on the left half | Only if Ruth and Fairbairn end up at opposite ends of the room and a single view mismatches one of them |
| B6–B9 | Distinct desk-monitor faces for `osint-workstation`, `page-builder`, `triage-workstation` and `report-workstation` | each the size of the slot it replaces (`pc8` 34x22 or `pc6` 32x30); never resized | PixelLab `pixellab_props.py` batch on one canvas, "straight-on flat front view, square to the wall" | A monitor and keyboard on a desk, screens showing a web browser with a search bar, a login form with a green button, an inbox list with flags, a document with a bar chart | Needed only if A2's `as-type` probe fails, or if playtests show students can't tell the Ops PCs apart. They also replace the shared hood-icon placeholder that PLAN §8 always meant to replace. Add a room emitter for each, because the stock regex won't match these keys |

Not counted here: Tomasz, Ruth and Fairbairn's own sprites (`tomasz`, `ruth_adeyemi`, `gareth_fairbairn`, PLAN §3) belong to the character pipeline. Replacing Tomasz's hi-vis placeholder will matter as much to how the Blue Team room reads as anything above.

## Severity summary

| Finding | Severity | Fix |
|---------|----------|-----|
| All four rooms are the same m01 map; none reads as its stage | major | A1, B3, B4 |
| Lab objects have no slots; placeholders are tiny or look like the wrong thing (corkboard as report workstation, hood laptop ×3) | major | A2 (B6–B9 if needed) |
| Ruth and Fairbairn stand in front of the RoE and planning boards (tap-menu risk) | major | A3 |
| Desk phone not visible in Operations | major (check in game) | A2 (phone on `phone3` desk slot) |
| No lighting anywhere | major | A4 |
| No chat backgrounds for Ruth, Fairbairn, Tomasz | major | A5 now, B1–B2 last |
| Easel chalkboard and classroom bookcase in a consultancy | minor | A1/A6 |
| Tomasz's hi-vis placeholder reads as a site guard | minor here (character pipeline) | out of scope |

## Open questions for the orchestrator

- A1 needs four new map types registered in shared files (`game.js`, schema, README, `generate_rooms.py`). Is that in scope for the P6-S art pass, or should the lab run A1-lite (point at the shipped maps) until it is?
- Should the lab ever use a shipped mission's background in production, or only as a stop-gap until B1–B2? This review assumes stop-gap only.
