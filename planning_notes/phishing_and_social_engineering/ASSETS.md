# Asset list: phishing and social engineering plan

**Images are generated one at a time, with the user's sign-off between each.** Exception (user,
2026-10-21): batch 1, the new Slice rows, may be generated with PixelLab and Gemini without per-image
sign-off; later rounds are asked for first. Batch 1 status is in `SE_BUILD_LOG.md`. PixelLab is the default (flat subscription); Gemini (metered) is only for the non-pixel concept
portraits and POV room concepts, and its use is confirmed with the user before any run. Sprites are made at
their target size, never resized down (standing rule).

Compiled 2026-10-21 from `README.md` and `designs/00` to `06`, `10` and `11`, plus the settled structure in
`../eldritch_hacker/DIRECTION.md`. The builder rows (UI22, LOGO1, LOGO4 to LOGO6, OBJ8) were filled in from `designs/07`.

## How to read this

- **Paths.** The live asset root is `public/break_escape/assets/` (objects, characters, backgrounds, sounds,
  music, fonts, icons). The repo-root `assets/` folder holds only `images/`. The plan's phrase
  `assets/objects/<type>.png` means `public/break_escape/assets/objects/<type>.png`.
- **Status.** *New*: nothing close exists. *Adapt*: a similar file exists and is the style base, but the new
  asset still needs its own file (usually because the validator wants a sprite per object type). *Reuse*: an
  existing file or system serves as it stands. *Hold*: provisional, do not make yet.
- **Tier.** *Slice* is the first build slice: mail client (01), rules engine (04) and intel board (03) running
  the lab's Hampshire target. *Lab* is the rest of the student lab (10). *Later* is Eldritch Hacker, the
  awareness product (11), extension content and anything the plan only mentions.
- **First-slice minimum.** The Source Sans 3 font files, `mail_terminal`, the `case-file` board art, the mail
  chrome, attachment icons, tick and cross marks, the board's corkboard art, a Hampshire headshot and a
  new-mail notification icon. Sound and music come from files already in the repo. Ruth, rooms and the other
  cast can be placeholders (existing keys) while the slice is built.
- **Counts** are at the end.

## 1. Object sprites

Existing sizes are small (`pc.png` 36x24, `workstation.png` 24x18, `laptop1.png` 24x18, `phone1.png` 20x17,
`notice_board1.png` 42x31). New object sprites match these at orthogonal top-down, square to the walls
(standing rule). Each new object type also needs a `this.load.image` line in `core/game.js` `preload()` and a
`minigame-data-schemas.json` entry (code, not art). A scenario object can override its texture with an explicit
sprite key (`core/rooms.js`, `createSpriteFromMatch`), which is what makes the reuse rows below possible, but
the validator still wants one `assets/objects/<type>.png` per type.

| ID | Asset | Used in | Status | Generator | Tier |
|----|-------|---------|--------|-----------|------|
| OBJ1 | `mail_terminal.png` (fixed mail workstation). Style base `pc*.png` and `laptop*.png`. The existing `workstation` type is routed to a different flow in `interactions.js` and cannot stand in for it | 01 Assets; 10 §5 | Adapt | PixelLab object | Slice |
| OBJ2 | `case-file.png` (type sprite the validator requires; four instances). Can start as a copy of `notice_board1.png` and be replaced | 03; 10 §5 | Adapt | PixelLab object | Slice |
| OBJ3 | Case-file instance, `recon` mode (the case-file board): texture override `notice_board1`, `hq_evidence_wall1` or `qdc_suspects_board1` | 10 §3 | Reuse | existing | Slice |
| OBJ4 | Case-file instance, `scope` mode (Rules of Engagement sheet on the desk): override `notes_legalpad1` or `clipboard_chart1` | 10 stage 0 | Reuse | existing | Lab |
| OBJ5 | Case-file instance, `plan` mode (planning whiteboard): override `whiteboard1` or `whiteboard2` | 10 stage 1 | Reuse | existing | Lab |
| OBJ6 | Case-file instance, `defender` mode (SOC board): override `siem_dashboard` or `hq_alert_screen1` | 10 stage 7 | Reuse | existing | Lab |
| OBJ7 | `osint-workstation.png` (Recon Room). Must read differently from OBJ1 | 02; 10 §5 | Adapt | PixelLab object | Lab |
| OBJ8 | `assets/objects/page-builder.png`, the Operations Room workstation that opens the landing-page builder | 07 §6; README; 10 §5 | Adapt | PixelLab object | Lab |
| OBJ9 | `report-workstation.png` (Engagement Office) | 10 N1, §8 | Adapt | PixelLab object | Lab |
| OBJ10 | `triage-workstation.png` (Blue Team Room) | 05 Assets; 10 §8 | Adapt | PixelLab object | Lab |
| OBJ11 | Desk phone for the Dev call (engine type `phone`, no new sprite). Pick from `phone1` to `phone5` by eye | 10 §5; 06 | Reuse | existing | Lab |
| OBJ12 | Ruth's phone as a starting inventory item (`ruth_phone`). `phone.png` (11x22) | 10 §3 | Reuse | existing | Lab |
| OBJ13 | Rules of Engagement sheet as an item. `text_file.png` or `notes_legalpad1` | 10 §8 | Reuse | existing | Lab |
| OBJ14 | Three door keys (Recon, Operations, Blue Team). `key.png`; the `keyPins` tell them apart. Tinting optional | 10 §3, §8 | Reuse | existing | Lab |
| OBJ15 | Room props named in 10 §8: desk, whiteboard, SOC wall of screens. Existing `exec_desk1`, `marble_desk1`, `whiteboard1`, `siem_dashboard`, `smartscreen`, `cctv_monitors1`; the room-dressing skill decides gaps | 10 §8 | Reuse | existing | Lab |
| OBJ16 | Inventory icon for a takeable `mail_terminal` | 01 Assets; README O | New | PixelLab | Later |
| OBJ17 | Company logo signs for rooms (Tarnside, Ledgerwell), in the style of `hq_logo_sign1` and `pnw_logo_sign1`. Suggestion only, not in the plan | none | New | PixelLab | Later |

## 2. NPC cast

Pipeline per the `pixellab-character-pipeline` skill and the v2 sheet rule: Gemini non-pixel concept portrait
(`<key>_nonpixelart.png`, via `character-talk-animation`), then a PixelLab dialogue bust, a talk run and
visemes (`--from-talk`, so every NPC gets visemes), an 8-direction walk with the six standard animations,
facing checked, and a 32x32 `<key>_headshot.png` (existing headshots are cut from the walk sprite; talk sheets
are 256x256). Each new character needs its own sprite key. Vary ethnicity and age across the cast, and give
the recurring characters their own keys (standing rules). Hand edits go in `tools/pixellab_overrides/`.

Existing keys are all spoken for by other missions. The Keyholder Trials lab set the precedent of naming a
placeholder key per new character (`male_nerd_v2`, `male_office_worker_v2` and so on, each with talk, visemes
and headshot) and swapping later. Placeholder candidates with a full set: `female_office_worker_v2`,
`male_office_worker_v2`, `male_telecom_v2`, `female_telecom_v2`, `male_nerd_v2`, `female_scientist_v2`,
`male_security_guard_v2`, `female_security_guard_v2`, `junior_analyst`.

| ID | Character | Role and channel | New or reused | Needs | Generator | Tier |
|----|-----------|------------------|---------------|-------|-----------|------|
| NPC1 | Ruth Adeyemi (`ruth`, `ruth_phone`) | Tarnside engagement lead; briefing and hint hub; person and phone | New (placeholder `female_office_worker_v2`) | Full set: concept, bust, talk, visemes, 8-direction walk, headshot | Gemini concept, PixelLab | Lab |
| NPC2 | Gareth Fairbairn (`fairbairn`) | Client MD; one short scene | New (placeholder `male_office_worker_v2`) | Full set | Gemini concept, PixelLab | Lab |
| NPC3 | Tomasz (`tomasz`) | Ledgerwell security lead; triage brief and closing debrief | New (placeholder `male_telecom_v2`) | Full set | Gemini concept, PixelLab | Lab |
| NPC4 | Dev (`dev`, `dev_service_desk`) | Service desk; the pretext-call target; phone only | New | Bust, talk, visemes, headshot; no walk sprite (10 §8) | Gemini concept, PixelLab | Lab |
| NPC5 | Chris Hampshire (`hampshire`) | Target 1; email only, no ink, no bar | New | 32x32 headshot only, made at that size; a headshot asset id, no sprite key (10 §8, 02 N6) | PixelLab | Slice |
| NPC6 | Melanie Pierce (`pierce`) | Target 2; email only; `pierce_mail` | New | 32x32 headshot only | PixelLab | Lab |
| NPC7 | Sofia Lord (`lord`) | Target 3; email only; `lord_mail` | New | 32x32 headshot only | PixelLab | Lab |
| NPC8 | Jed Baker (`baker`) | Not an NPC; the trusted sender; appears on the team page, profiles and sender cards | New | 32x32 headshot only | PixelLab | Lab |
| NPC9 | "IT Security" portrait for report replies in triage | 05 Assets | Reuse (Tomasz's headshot) | none | existing | Lab |
| NPC10 | Senders of the ~6 seeded benign inbox messages | 10 §5 data volume | Reuse (`assets/npc/avatars/npc_*.png`) | none | existing | Slice |
| NPC11 | Awareness cast, about 10 characters across the roles (supplier contact, finance manager, recruiter, helpdesk caller, executive, PA and others), recurring ones with their own keys | 11 §8 | New | Portraits and busts; walk only where a person sits in a room | Gemini concept, PixelLab | Later |
| NPC12 | Awareness shell host NPC, one visible NPC per check and episode shell | 11 N16 | New (one reusable character) | Full set | Gemini concept, PixelLab | Later |
| NPC13 | Eldritch Hacker cast | `../eldritch_hacker/DIRECTION.md` | Hold | The cast is provisional until the universe-bible pass. `the_recruiter`, `the_architect` and the Season 1 cast exist and may return | none | Later |

Notes.

- **Names.** The client MD is Gareth Fairbairn (`fairbairn`) and the consultancy is Tarnside Assurance, chosen so that
  the lab shares no surname with m02's `gary_whitlock` and avoids the "Northgate" name used by m02 and
  `backgrounds/northgate_hospital.png`. `ruth_halloran` (m05) shares only a first name with Ruth Adeyemi.
  Ledgerwell and CloudBoxy are the user's chosen names (README decision Z).
- **Headshot route (settled).** Hampshire, Pierce, Lord and Baker are headshot-only (`10` §8, `02` N6): a
  32x32 headshot made at that size, with a headshot asset id and no sprite key or walk sheet.
- **Stand-ins that need no art.** `leeds_baker` (the Leeds plumber) and `portal` (the payroll sender) are
  text-only in the plan. The portal's sender chip can use the Ledgerwell logo (LOGO1).

## 3. Backgrounds

Person-chat backgrounds are 400x400 through `tools/pixelate_background.py`. POV room backgrounds follow the
`room-pov-background` skill: a Gemini concept of the room seen from behind the player, then a 400x400
PixelLab conversion wired to the room's `chatBackground`. They are made after the room's dressing and
lighting are final, and use the strip plus inventory, never the full map. Existing office POV backgrounds
that could stand in while the lab's rooms are being dressed: `m01_main_office_area`, `m01_it_room`,
`m01_reception_area`, `m02_it_department`.

| ID | Asset | Used in | Status | Generator | Tier |
|----|-------|---------|--------|-----------|------|
| BG1 | Engagement Office POV, 400x400 (Ruth and Fairbairn talk here) | 10 §8 | New | Gemini concept, PixelLab | Lab |
| BG2 | Blue Team Room POV, 400x400 (Tomasz) | 10 §8 | New | Gemini concept, PixelLab | Lab |
| BG3 | Helpdesk office, 400x400, behind Dev's call. 06 allows a plain desk background instead, so `m01_it_room` is the fallback | 06 §8 | New | Gemini concept, PixelLab | Lab |
| BG4 | Operations Room POV. No person NPC works there (the call is on a phone object), so optional | 10 | New | Gemini concept, PixelLab | Later |
| BG5 | Reception desk, 400x400 | 06 §8 | New | Gemini concept, PixelLab | Later |
| BG6 | Awareness fictional-company set: finance floor, HR office, helpdesk, exec suite (3 to 4; the helpdesk overlaps BG3) | 11 §8 | New | Gemini concept, PixelLab | Later |
| BG7 | Four lab room maps (Engagement Office, Recon, Operations, Blue Team): new Tiled layouts, existing office tilesets and room images (`room_hce_office` and similar). Recon Room needs no POV background (no NPC) | 10 §3 | Adapt | Tiled, room-dressing skill | Lab |
| BG8 | Eldritch skins (Institute corporate layer, cult social layer). Existing `miskatonic_campus`, the `eldritch` UI theme and the Keyholder Trials rooms may seed it | DIRECTION.md | Hold | none now | Later |

## 4. In-overlay art

Overlay chrome uses the `--ui-*` tokens (`css/ui-themes.css`; the lab sets `ui_theme: secops`), so frames
partly come from CSS and the existing `ui/themes/*/frame.png` and `button.png`. Pixel art is drawn low-res and
scaled with `image-rendering: pixelated`. Anything the player reads or compares is text, not art.

### 4a. Mail client, rules engine, board (the slice)

| ID | Asset | Used in | Status | Generator | Tier |
|----|-------|---------|--------|-----------|------|
| UI1 | Mail window frame, folder icons, unread dot, attachment chip, account chip | 01 Assets | Adapt (theme frame as base) | PixelLab | Slice |
| UI2 | Attachment-kind icons, six: document, pdf, spreadsheet, archive, image, link. `icons/document.png` is a reuse candidate for the first (check size and style) | 01 Assets | Adapt | PixelLab | Slice |
| UI3 | New-mail notification icon and message-list marker for the delayed reply. Implied by "notification and message-list renderer" (README, mail row); not itemised in 01 | README engine table | New | PixelLab | Slice |
| UI4 | Checklist and tells marks, 16x16: tick, cross, question, exclamation. Always paired with words | 04, 06 §8, 10 §8 | New | PixelLab | Slice |
| UI5 | Template blank-slot and filled-chip sprites for the composer (may be CSS only) | 01, 04, 06 §8 | New | PixelLab or CSS | Slice |
| UI6 | Corkboard background, pinned card, string | 03 Assets | New | PixelLab | Slice |
| UI7 | Empty-slot and readiness markers | 03 Assets | New | PixelLab | Slice |

### 4b. Rest of the lab

| ID | Asset | Used in | Status | Generator | Tier |
|----|-------|---------|--------|-----------|------|
| UI8 | Threshold icons, 16x16: wary, refuses, reports, hostile, trusts (shared by the bar, 03 and the world pip) | 00 S4; 03; 06 §8 | New | PixelLab | Lab |
| UI9 | Influence bar, about 96x16, -100 to +100, calm/wary/refusing/reported bands | 06 §8; 00 S4 | New | PixelLab | Lab |
| UI10 | World influence pip above a character sprite, drawn only for characters with walk sprites (awareness, Eldritch Hacker). Not in the lab: there the influence bar shows in the phone-chat and person-chat header, and Dev is phone-only (settled 2026-10-21; moved from Lab) | 00 S13 | New | PixelLab | Later |
| UI11 | Tells-panel frame | 06 §8 | New | PixelLab | Lab |
| UI12 | Pretext card frame (pinned-note look from the board) | 06 §8 | Adapt (UI6 card) | PixelLab | Lab |
| UI13 | Portrait tint for wary and refusing bands (code tint of existing talk and viseme sheets, no new art) | 06 §8 | Reuse | code | Lab |
| UI14 | OSINT browser chrome, page layouts, profile template | 02 Assets | New | PixelLab | Lab |
| UI15 | Document properties-panel frame | 02 Assets | New | PixelLab | Lab |
| UI16 | Favicons for the OSINT sites: company site (also its careers and archive pages), friendface social site, PDF document, tools panel. Four small icons | 02 Assets | New | PixelLab | Lab |
| UI17 | Triage verdict icons, 16x16: tick (Trust), flag (Report), bin (Delete) | 05 Assets | New | PixelLab | Lab |
| UI18 | Chip-state icons, 12x12: caught tick, missed cross, false-flag dash | 05 Assets | New | PixelLab | Lab |
| UI19 | SPF / DKIM / DMARC header-panel frame and three status lamps, 16x16, each with a non-colour mark (tick, cross, dash) | 05 Assets | New | PixelLab | Lab |
| UI20 | Triage result badge, 64x64, three states (sharp, getting there, practising) | 05 Assets | New | PixelLab | Lab |
| UI21 | Engagement report panel: results table, finding cards, tick and cross. CSS plus UI4 marks | 10 §8 | Reuse | CSS | Lab |
| UI22 | Landing-page builder chrome, at native size: fake-browser window frame, address-bar frame, padlock open, closed and crossed, and a "Not secure" badge (about 8 sprites, scaled 3x in the renderer); five step-strip icons (Pretext, Build, Score, Send, Inspect); a tell-found stamp; a credibility meter frame. Address bar, page text and field labels are DOM text, not sprites. Page body layouts are LOGO4 and LOGO6 | 07 §3, §8; README; 10 stage 4 | New | PixelLab | Lab |
| UI23 | Padlock icon for the builder and the concept card. `public/break_escape/assets/icons/padlock_32.png` exists | 10 stage 4 | Reuse | existing | Lab |
| UI24 | Concept-card images (`social.conceptCards[].image?`, optional), ten cards: four tools, six page cards | 10 §5 | New | PixelLab | Later |

### 4c. NPC headshots on fake social pages and cards

No separate art. The fake social profiles (friendface), the company team page, the board's people cards,
sender cards and reply headers all use the 32x32 `<key>_headshot.png` of NPC5 to NPC8, shown at an integer
scale. Each headshot is checked after any art change, because headshots cut from a walk sprite can go stale
(02 Assets). The Ledgerwell Payroll Portal sender uses the logo instead of a face.

### 4d. Brand logos (invented, generic or parody)

Every brand name, domain and address is invented and ends `.example`. A `generic` look is a neutral sign-in
layout. A `parody` look is an exaggerated layout that is plainly the game's own. No look copies a real
product's name, layout, colours or logo, and no real logo is drawn (README S). Each brand has one crisp logo; the blurry and stretched variants are drawn by the renderer (LOGO1, `07` §8). Real names
such as Hunter, theHarvester and Recon-ng appear in text as concept-card labels only, never as logos.

| ID | Asset | Used in | Status | Generator | Tier |
|----|-------|---------|--------|-----------|------|
| LOGO1 | Ledgerwell logo: one crisp 32x32 source. The blurry and stretched builder variants are drawn in the renderer from that source, not made as separate art. Used on the company site, the payroll-page model, the portal sender chip and the favicon | 07 §8; 00 §1; 10 stage 4 | New | PixelLab | Lab |
| LOGO2 | Tarnside Assurance logo (RoE sheet, report, Ruth's signature block) | 10 §3 | New | PixelLab | Lab |
| LOGO3 | friendface, the invented social network: logo, favicon and a plainly parody layout | 02 (site `friendface.example`) | New | PixelLab | Lab |
| LOGO4 | Generic look (07 §8): neutral page layouts for the three page purposes (sign-in, password expired, payslip ready), pixel blocks with DOM text. Ledgerwell's look | 07 §5, §8 | New | PixelLab | Lab |
| LOGO5 | CloudBoxy logo: the decoy brand in the student lab's brand choice. One crisp 32x32 source; blurry and stretched variants drawn in the renderer, as LOGO1 | 07 §3 step 2, §5, §8 | New | PixelLab | Lab |
| LOGO6 | Parody look (07 §8): CloudBoxy's page layouts, an invented exaggeration of a generic layout (an oversized padlock, a slogan on the sign-in box). Plainly the game's own, never a real product's layout | 07 §5, §8 | New | PixelLab | Lab |
| LOGO7 | Awareness neutral-skin set: logo placeholder, generic badge, step strip | 11 §8 | New | PixelLab | Later |
| LOGO8 | Invented SSO brand and look for episode E5 | 11 E5 | New | PixelLab | Later |
| LOGO9 | Awareness icons: padlock with a "myth" overlay (adapt `padlock_32.png`), QR poster, SMS bubble, authenticator push card | 11 §8 | Adapt | PixelLab | Later |
| LOGO10 | Awareness surface art: mock authenticator and push stream (N11), voicemail player (N12), interactive page card (N13), QR and SMS card surfaces (N14), report-button animation | 11 N11 to N14, §8 | New | PixelLab | Later |
| LOGO11 | Eldritch skins: DM and feed variant chrome, cult sigils and flyers, Institute corporate skin. `01` names sigils and flyers; the rest is provisional | 01 Visual style; DIRECTION.md | Hold | none now | Later |

## 5. Fonts

The bundled readable face is **Source Sans 3** (Regular and Bold; SIL OFL 1.1; Latin and Cyrillic), self-hosted,
exposed as `--se-font-readable` in `css/fonts.css` and used for all social overlay text. It covers every Cyrillic
letter the confusable map uses (`00` §6). Today `public/break_escape/assets/fonts/` holds only `gnf.ttf`,
`gnf.woff2`, `PressStart2P-Regular.ttf`, `PressStart2P-Regular.woff2`, `press-start-2p.woff2`,
`PixelifySans-VF.woff2`, `pixl8.png` and `pixl8.xml`. The files are the per-subset WOFF2 builds as published
upstream, downloaded and used unmodified (the Reserved Font Name "Source" rules out a subset or edit of our own),
not generated.

| ID | Asset | Used in | Status | Generator | Tier |
|----|-------|---------|--------|-----------|------|
| FONT1 | Source Sans 3 Regular, Latin subset WOFF2. **Landed (P0-L):** the API serves one variable-weight file per subset, so FONT1 and FONT2 are one file, `fonts/SourceSans3/SourceSans3-latin.woff2`, and FONT4 and FONT5 are `SourceSans3-cyrillic.woff2` (100 Cyrillic code points, all 21 confusables in `00` §6); provenance in `build_log/P0-L_fonts.md` | 00 §6; README Fonts | New | upstream font file | Slice |
| FONT2 | Source Sans 3 Bold, Latin subset WOFF2 | 00 §6 | New | upstream font file | Slice |
| FONT3 | OFL 1.1 licence text beside the files | 00 §6 | New | font file | Slice |
| FONT4 | Source Sans 3 Regular, Cyrillic subset WOFF2, for the lab's one homograph example. Bundled in Phase 0 with the Latin files (settled 2026-10-21) | 00 §6; README X | New | upstream font file | Slice |
| FONT5 | Source Sans 3 Bold, Cyrillic subset WOFF2. Bundled in Phase 0 (settled 2026-10-21) | 00 §6 | New | upstream font file | Slice |
| FONT6 | `GNF` (body chrome), `Press Start 2P` (headings), `PixelifySans` already bundled | README Conventions | Reuse | existing | Slice |

## 6. Audio

### 6a. Voiced lines

Voiced lines are fixed strings, because the TTS cache is keyed on text; no printed variables (10 §8, 06 §8).
Generation is Gemini TTS through the `tts-audio` skill, metered, so scope is confirmed with the user before a
run. Voice names are unique within a mission. Line counts are my estimates, since none of this ink exists.

| ID | Speaker | Which lines | Estimated lines | Status | Generator | Tier |
|----|---------|-------------|-----------------|--------|-----------|------|
| VO1 | Ruth Adeyemi (person) | Briefing, key hand-overs, stage check-ins, report debrief (`ruth.ink`) | 50 to 70 | New | Gemini TTS | Lab |
| VO2 | Ruth Adeyemi (phone) | Hint hub, three rungs per stage over about 8 stages (`ruth_phone.ink`). 10 §8 says "voice for Ruth" without separating the two stories; confirm hints are voiced | 25 to 30 | New | Gemini TTS | Lab |
| VO3 | Tomasz | Triage briefing and closing debrief (`tomasz.ink`) | 20 to 25 | New | Gemini TTS | Lab |
| VO4 | Dev | The pretext call: opening, reactions per held value, grants, wary and refusal lines (`dev_service_desk.ink`) | 25 to 35 | New | Gemini TTS | Lab |
| VO5 | Gareth Fairbairn | One short authorisation scene. Not listed for voice in 10 §8, so text-only unless the user says otherwise | 0 (or 6 to 10) | New (optional) | Gemini TTS | Lab |
| VO6 | Awareness E3 helpdesk callers (impostors and genuine) | 4 calls | 12 to 24 | New | Gemini TTS | Later |
| VO7 | Awareness E4 voice note and call from the "executive" | Fixed clips | 2 to 4 | New | Gemini TTS | Later |
| VO8 | Awareness E7 three voicemails, one "cloned". The cloned clip is a style variant of an in-world voice, never a real person (11 N7, A1) | Fixed clips | 3 to 4 | New | Gemini TTS | Later |

Pierce, Lord and Hampshire are text-only (email). Estimated lab total: about 120 to 160 clips, or 95 to 130
without the hint hub. Awareness: about 20 to 35.

### 6b. Sound effects

The `sounds/` folder already holds a UI set (`GASP_UI_*`), `message_sent.mp3`, `message_received.mp3`,
`page_turn.mp3` and `phone_vibrate.mp3`. The plan names no generator for new effects; the practical sources are
the same GASP-style pack or CC0 files. Try the existing files first for the stings.

| ID | Sound | Used in | Status | Source | Tier |
|----|-------|---------|--------|--------|------|
| SFX1 | Message sent: `message_sent.mp3` | 01 | Reuse | existing | Slice |
| SFX2 | Reply or new mail arrives: `message_received.mp3` or `GASP_UI_Notification_*` | 01, 10 | Reuse | existing | Slice |
| SFX3 | Checklist tick and cross: `GASP_UI_Confirm`, `GASP_UI_Reject` | 04 | Reuse | existing | Slice |
| SFX4 | Button and chip clicks: `GASP_UI_Clicks_*` | all overlays | Reuse | existing | Slice |
| SFX5 | Triage verdict lock blip (05, optional): existing UI set | 05 Assets | Reuse | existing | Lab |
| SFX6 | Phone ring and click-off for the Dev call | 06 §8 | New | pack or CC0 | Lab |
| SFX7 | Soft tick for a small influence fall | 06 §8 | Reuse or New (try `GASP_UI_Clicks`) | existing, else pack | Lab |
| SFX8 | Low sting when the bar crosses a marker (try `GASP_UI_Alert_1`) | 06 §8 | Reuse or New | existing, else pack | Lab |
| SFX9 | Document open: `page_turn.mp3` | 02 | Reuse | existing | Lab |
| SFX10 | Report-button positive sting | 11 §8 | New | pack or CC0 | Later |
| SFX11 | SMS arrival: `phone_vibrate.mp3` | 11 E6 | Reuse | existing | Later |

## 7. Music

No music is authored for the lab's own mood in the plan beyond "reuse an existing office track" (10 §8).
`music/` has no track labelled office; its playlists are `Noir`, `CutScene`, `SpyAction`, `SpyAgro` and
`Vocals`. The Keyholder Trials lab, the nearest non-VM lab, uses `noir` for exploring, `cutscene` for the
briefing and debrief and `spy-action` ("Cold Bond Circuit") for tension, wired through `music.events` in the
scenario. The lab authors no credits music (10 §5).

| ID | Track | Used in | Status | Source | Tier |
|----|-------|---------|--------|--------|------|
| MUS1 | Exploration: `noir` playlist | 10 §8 | Reuse | existing | Slice |
| MUS2 | Briefing and debrief: `cutscene` playlist | 10 | Reuse | existing | Lab |
| MUS3 | Tension for the Dev call: `spy-action`, e.g. "Cold Bond Circuit" (optional) | 10, 06 | Reuse | existing | Lab |
| MUS4 | A lab theme song in the `Vocals` style. Missions m01 to m10 have one; the plan does not mention one for the lab. Question for the user, not assumed | none | New | not decided | Later |
| MUS5 | Awareness product music. The plan is silent; neutral corporate skin suggests none | 11 | Hold | none | Later |
| MUS6 | Eldritch Hacker music. Provisional | DIRECTION.md | Hold | none | Later |

## 8. Open points for the user

Settled (README decision Z): Ledgerwell and CloudBoxy are the names; Ruth's hints and the minor
characters, Fairbairn included, are voiced, with TTS deferred to a late stage; no lab theme song (MUS4 dropped).

1. Gemini TTS and Gemini concept portraits are metered; confirm scope before either runs.

## 9. Counts

Counted from the tables above. *Adapt* is reported separately because the new file still has to be made.
*Hold* rows are excluded from both totals. Characters in section 2 are counted as one row each.

| Tier | New | Adapt | Reuse | Total |
|------|-----|-------|-------|-------|
| First slice | 11 | 4 | 8 | 23 |
| Rest of the lab | 33 | 6 | 18 | 57 |
| Later | 17 | 1 | 1 | 19 |
| **All** | **61** | **11** | **27** | **99** |

The Lab "Reuse" figure includes two rows marked "Reuse or New" (SFX7, SFX8), counted as reuse because the
existing UI sounds are tried first. A further 5 rows are *Hold* (NPC13, BG8, LOGO11, MUS5, MUS6) and sit
outside the totals. The 99 rows are 17 object sprites, 12 NPC rows, 7 background rows, 24 in-overlay UI rows,
11 logo and brand rows, 6 font rows, 8 voice groups, 11 sound effects and 4 music rows. Characters to make
(section 2): 8 for the lab (Ruth, Fairbairn, Tomasz, Dev as full or voice-and-bust sets; Hampshire, Pierce,
Lord, Baker as headshots), about 11 for awareness, none yet for Eldritch Hacker.
