# E10 fake downloads and "verify you are human" pages (implementation spec)

Status: draft for a Sonnet implementer. E10 is a new awareness episode at Quayholt Insurance that **extends the built E5**: same company, same host room, same look-alike-page builder for the attack half. The new work is a defend half of browser-screen triage (fake checks, fake updates, fake alarms, extension permissions, dangerous downloads, browser warnings), which needs **ENG-03a** (download and warning states, and a fake check page). The content is given in full here; ENG-03a owns the new browser surfaces.

Writer: opus48 agent. Never run a generator into the repo. Never `git stash`. No attribution lines in commits.

---

## 1. Goal and module(s)

Teach the three web habits that email training does not cover: start software and sites from a place you trust (the portal, bookmarks, a typed address, not adverts or search results); never let a web page make you do things to your computer (paste, run, install, update, call, allow); and believe browser warnings and report. Modules: **core_08** (safe web and downloads, the signature content) and **core_07** (malware, ransomware and updates, for what a bad download does and the "report and leave it" first step). E10 **extends E5**, which already taught reading an address and the padlock myth (core_08 LO2); do not redesign the E5 parts.

Learning outcomes (from `modules/core_08_safe_web_and_downloads/`): LO1 (start from a trusted place), LO2 (read the address, the padlock myth, reused from E5), LO3 (pages that drive your computer: fake checks, updates, alarms), LO5 (judging a permission request), LO6 (report, and report fast if you pasted/ran/called). Plus core_07's "report it and leave it; don't restart, don't run tools from the web".

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/implementation/WRITER_BRIEF.md`.
- Teaching source of truth: `modules/core_08_safe_web_and_downloads/concepts.md` (the whole file: the four tricks, reading the address, browser warnings, downloads, "if you pasted/downloaded/called"); `modules/core_07_malware_ransomware_and_updates/concepts.md` (how it gets in, the signs, "report and leave it", the device instruction); `modules/core_08_.../game_design.md` (the E10 "The Download" design, the decisions and the Practise bank) and `modules/core_08_.../assessment.md` for the scored behaviours and mirror pairs.
- The nearest built episode, end to end: **E5** `scenarios/awareness_e5_signin_pages/` (same company and room, the page-triage defend set with the `page` card kind, the look-alike-page builder for the attack half) and the fragments `planning_notes/phishing_and_social_engineering/awareness/e5/{attack,defend}.json`. E5 is the model for every `page` card and for the attack half.
- Shapes and ids: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (the shared channel-tell library: `lookalike_domain`, `padlock_myth`, `linkCredible`; the `page` card in a triageSet `truth`) and `designs/07_landing_page_builder.md` (the builder E5 and E10 share) and `designs/11_awareness_product_episodes.md`.
- Companies and cast: `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (Quayholt roster and the E5 `_brandAdditions`: real hosts, look-alikes, DocShare, Ashcombe Solicitors, MailGuard); `modules/.../03_WORLD_AND_CAST.md` (the E10 row: Niamh Doherty plus a Quayholt IT colleague).
- Runner: `public/break_escape/js/minigames/episode-runner/episode-model.js` (`STAGE_IDS`, `childLaunch`, `flipPage`).
- Engine packet: `implementation/02_ENGINE_WORK.md`, packet **ENG-03a** (and ENG-08 for new channel tells and any verdict-label change).

## 3. Depends on

- **ENG-03a** (triage `page` browser-screen states). The defend half's new browser screens (fake check with its clipboard reveal, download bar, extension-permission prompt, full-screen alarm, browser warning, relaunch bar) are new `page.state` values on the E5 `page` card, plus a `triageSet.verdictLabels` relabel. E10 cannot build its defend half without ENG-03a. §11 states the states and config needed. (ENG-03b, the fake-download build page, is optional and only if the attack half is changed, §9.)
- **The E5 look-alike-page builder** (built, `designs/07`) for the attack half. Reuse it unchanged; E10 adds no attack-side engine work.
- **ENG-09b** (debrief panel list). E10's debrief shows several short concept cards (§12), and the built `strings.conceptPanel` is a single panel; ENG-09b adds the array form.
- **ENG-08** for the new channel tells (§11). Per Round 2 ruling 2, every tell that only E10 uses today, and that no `10` check item scores, is **scenario-local**, so all five of E10's web tells (`fake_check_paste`, `fake_update_prompt`, `dangerous_download`, `fake_alarm_callback`, `browser_permission_grab`) are scenario-local to E10, not shared-library ids. (`10`'s `general_v2` web item scores `lookalike_domain`/`padlock_myth` on the built `page` shape, not these five, so none is a form-scored tell that would have to be shared; §14.) E10 lists all five in `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence; the validator accepts a scenario-local `channelTells` id that `flagChips` labels and that is not a factor (`triage.rb` `flag_universe`), so no ENG-08 library change is needed for the tells. Only promote one to the shared library when a second set uses it or a check item scores it (then it also needs a `SKILL_NAMES` entry, ENG-08). The three-way browser verdict is **not** an ENG-08 verdict change: ENG-03a decided it is a `verdictLabels` relabel of the existing ids (see §11).

## 4. Owner models

- Content and dialogue: `opus48`.
- ENG-03a engine surface and the shell wiring: general-purpose or Sonnet, after ENG-03a is built.

## 5. Company, room and host

- **Company:** Quayholt Insurance (`quayholt_insurance`). Brand block copied from E5: `{ "name": "Quayholt Insurance", "logoText": "QUAYHOLT", "accent": "#6b4c9a" }`.
- **Room:** reuse the built `room_aw_quayholt` exactly as E5 wires it (`"type": "room_aw_quayholt"`, `chatBackground": "assets/backgrounds/rooms/aw_quayholt_blended.png"`, same lighting, kiosk). No new room.
- **Host:** **Niamh Doherty** (E5's host; internal communications officer / the room's IT trainer, as her E5 ink describes her), `niamh.doherty@quayholt.example`. She frames the exercise, as in E5.
- **IT colleague (the explainer who teaches the three web habits):** **Leila Nassar**, Quayholt IT service desk agent, `leila.nassar@quayholt.example` (built Quayholt cast: the service desk agent in E3, the genuine sender of `ga_laptop_swap` in `e5/defend.json`). She is the "ask us first, we'd rather help than clean up" voice the core_08 design gives the IT explainer. Using Leila avoids reusing an episode host as a second NPC and avoids the clashing pool name "Owain Jenkins" the old game_design used (03_WORLD_AND_CAST flags Owain/Owen as a clash). See Open questions for the Darren Price alternative.
- **Role:** `general_staff` (as E5).

### Brands and names E10 uses (all from the E5 `_brandAdditions` or the Quayholt slots in concepts.md; the new vendor names need a pre-ship web search and a BRAND_SET note)

- The software portal: **Quayholt Apps** (the core_08 Quayholt slot). Security software: **Quayholt Protect** (core_07 slot). Approved converter: **DocShift** (core_08 slot). Report route: the browser Report button, the "Report an incident" form, or the security team on extension 4444 (core_08/core_07 slots).
- A PDF software vendor: **Pagewright** (`pagewright.co.uk` the real vendor; `pagewright-download.com` the advert look-alike). *Note:* these are `.com`/`.co.uk` in the module docs, but the awareness product rule is every domain ends `.example`. **Use `pagewright.example` and the look-alike `pagewright-download.example`.** Flag the swap.
- Suppliers: **Fernside Catering** (`fernside.example`), **Ashby Supplies** (`ashbysupplies.example`, look-alike `ashby-trade-login.example`). Hacked-site fake check sits on Fernside's real site.
- Reuse from E5 `_brandAdditions`: the real Quayholt hosts (`sso.`, `servicedesk.`, `intranet.`, `mail.quayholt.example`), the look-alike shapes, and `docshare-login.example`.
- The manager who sets the task (chat only) and the desk neighbour who recommends an extension: the core_08 design used the pool names Lena Fischer and Leo Brennan (03_WORLD_AND_CAST lists both as no-clash pool names). Reuse them only if the orchestrator wants named colleagues in cards; otherwise keep the chat unattributed. Flag.

All people and companies fictional; every domain `.example`; no homographs.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | Notes |
|---|---|---|
| brief | 1.0 | Niamh's welcome, scope note. |
| osint | 2.0 | Light: find the portal and the vendor staff reach for software. (As E5's OSINT.) |
| build (look-alike page, E5 builder) | 2.5 | Build one look-alike page (a fake software-download or sign-in page); reuse E5's builder. |
| write | 2.0 | Send one email carrying the link (as E5). |
| flip | 1.5 | The victim follows the link and meets the page; the clipboard reveal concept is previewed. |
| defend | 4.0 | About 6 to 7 browser screens (ENG-03a), immediate feedback. |
| debrief | 2.0 | Reasoning cards, the module line, the habit, the "On Monday" card, the report route, the no-blame line. |

Defend-only variant: brief, defend, debrief, about 8 minutes.

## 7. Stages (runner stage ids)

Full episode: `["brief", "osint", "build", "write", "flip", "defend", "debrief"]`. This is **identical to the built E5 stage list** (`awareness_e5_signin_pages`), which is what "extends E5" means: the attack half (osint, build, write, flip) is E5's, reused. The only new behaviour is in `defend`, where the triageSet carries ENG-03a's new browser-screen card states.

Defend-only: `["brief", "defend", "debrief"]`. **The defend-only variant needs ENG-03a** (the browser screens are the whole defend half), so it cannot ship before the packet, unlike E8's defend-only.

All ids from the frozen `STAGE_IDS`. E10 adds no new stage id.

## 8. Brief and scope note (host's draft lines)

- **Episode id:** `e10_downloads_and_fake_checks`. Defend-only shell id: `e10_downloads_and_fake_checks_defend`.
- **`strings.brief`:** "You're on an authorised exercise at Quayholt Insurance, a fictional company. First you're on the red team: build a fake page from ready-made parts and send one email carrying its link, the way E5 did. Then you swap seats and work through a morning of web pages, the kind that try to get you to download, paste or call. Only the pages are scored. Nothing is built for real and nothing is collected."
- **`scopeNote`:** "Authorised exercise at Quayholt Insurance, a fictional company. In scope: one practice page from ready-made parts, and the web pages you meet in a morning's work. No real site is touched and nothing runs on your computer."
- **Niamh's welcome (host ink):** "Welcome back to the Quayholt exercise. Last time it was sign-in pages; this time it's the whole web: fake downloads, 'verify you are human' boxes, pop-ups that want you to call. Leila from the service desk will show you the three habits, then the kiosk takes you through a morning of them."
- **Leila's three-habits lines (host ink or a concept panel, core_08 explainers):** "Rule one: software comes from Quayholt Apps, not from adverts or search results. If it isn't there, ask us, we're quick. Rule two: read the address, from the right-hand end. A padlock means nobody can listen in; it doesn't make a site honest. Rule three: no real web page ever needs you to paste anything into your computer, to prove you're human or to fix an error. Ever. If you slipped, tell us straight away, don't restart, don't clear anything."

## 9. Attack half (reused from E5)

Not scored. Reuse E5's attack half unchanged: OSINT finds the portal and the vendor; the look-alike-page builder (`designs/07`) builds one page; the mail client sends one email carrying the link. The only content difference is flavour: instead of a sign-in page, the learner builds a **fake software-download page** (or keeps the sign-in page; either works, because the builder judges the page by `linkCredible` and the look-alike domain the same way). To keep E10 truly "extends E5 with no attack-side engine work", **use the E5 sign-in-page build as-is** and let the defend half carry all the new material. If the orchestrator wants the attack half to build a fake-download page specifically, that is **ENG-03b** (a new `landingPages[].pageType: "download"`), noted as an optional choice.

Reuse the E5 facts (`quayholt_sso_portal`, `quayholt_it_desk`, `quayholt_sso_migration`, `quayholt_staff_claims`), templates, `landingPages` (`sso_login`) and the `sso_staff` phishTarget from `e5/attack.json`, with the target renamed if the orchestrator wants a fresh victim. The one consequential choice the flip quotes (aw2) is the same as E5: the look-alike domain, the one thing the attacker can never make perfect.

## 10. Flip

Reuse E5's `flipPage` flip: the victim follows the link and meets the built page, tells highlighted, with the scripted defender line. Add one E10 beat as a concept preview (not a new engine feature): the flip notes that a page like this can quietly copy a command to your clipboard, which the defend half's fake-check screen then shows in full. Author the flip strings in E5's voice (reuse E5's keys, adjust the victim/page wording). No new flip engine.

## 11. Defend set

The defend half is a morning of browser screens: the E5 `page` card extended with ENG-03a's new states. Set id `e10_browser_morning`; episode prefix `episode_e10_downloads_and_fake_checks_defend_`. Config as E5's page set: `scoringProfile: "awareness"`, `verifyVerdict: false` (the web screens have no "ring someone" step; the action is Carry on / Close and report / Go the trusted way), `feedbackMode: "immediate"`, `headerPanel: "off"`, `glossary: "closed"`, `reportAlwaysVisible: true`.

**Verdicts (decided by ENG-03a: a label change, not a new verdict).** E5's page cards use Trust / Report / Delete. The core_08 design wants **Carry on / Close and report / Go the trusted way**. ENG-03a settles this as a `triageSet.verdictLabels` relabel of the existing ids, with the verdict ids (`trust`/`report`/`delete`) and the `awareness` scoring unchanged, so the measurement is identical to E5's page set. E10 sets on the set: `"verdictLabels": { "trust": "Carry on", "report": "Close and report", "delete": "Go the trusted way" }`. There is no new verdict id. (Verify stays off for this set, as `verifyVerdict: false` above; the web screens have no "ring back" step.)

**`channelTells`** array: `["lookalike_domain", "padlock_myth", "fake_check_paste", "fake_update_prompt", "fake_alarm_callback", "browser_permission_grab", "dangerous_download"]`. `lookalike_domain` and `padlock_myth` are shared-library tells (reused from E5). The five new ids are **all scenario-local to E10** (Round 2 ruling 2: a tell used by only one set today, and scored by no `10` check item, stays local). Declare each in `channelTells` with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence on every flagging message; the validator accepts a scenario-local id that `flagChips` labels and that is not a factor (`triage.rb` `flag_universe`), so no ENG-08 library change is needed. The library wording to reuse as each label:

  - `fake_check_paste`: "A page telling you to paste or run something to prove you are human or to fix an error"
  - `fake_update_prompt`: "A web page saying your browser or software is out of date and offering the update"
  - `dangerous_download`: "A download you did not ask for, or a program pretending to be a document"
  - `fake_alarm_callback`: "A full-screen alarm with a phone number to call"
  - `browser_permission_grab`: "A page or extension asking to read or change everything in your browser, or to send you notifications"

If a later `general_v2` item is balanced to score one of these web tells, that id (and only that id) then moves to the shared library with a `SKILL_NAMES` entry (ENG-08); until then they all stay local.

### Items (id, kind, screen, correct move, phish?, tells, reasoning; ENG-03a state in brackets)

About 6 to 7 screens, with two mirror pairs so "anything unusual is a trap" cannot win. The hardest item (the fake check on a familiar site) is taught in the brief before it appears (core_08 pitfall: no gotchas).

| # | id | screen (ENG-03a state) | correct move | phish? | tells | reasoning (perFlagNote / whyFine) |
|---|---|---|---|---|---|---|
| 1 | `e10_fake_check` | A "verify you are human" box over a faded copy of Fernside's real (hacked) site: "1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter." Shown as text with Follow / Close / Report buttons; a browser-side "What did this page copy?" reveal shows one line, "A hidden command that would run a program on your computer" (the command is never shown). (fake-check state) | Close and report | yes | `fake_check_paste` | A real check happens on the page: tick a box, pick pictures, type letters. No genuine check, error or download ever asks you to paste or run anything. The site is Fernside's own, but a familiar site is not a reason to do what it suddenly tells you; it has been hacked. (ENG-03a owns the clipboard reveal; the command is a harmless description, never real.) |
| 2 | `e10_genuine_captcha` | A real "I'm not a robot" tick box and a grid of pictures, on Fernside's real site. (ordinary page) | Carry on | no | (none) | A genuine CAPTCHA only asks you to tick or pick on the page. This is the mirror for row 1: the tell is the instruction to your computer, not the word "verify". |
| 3 | `e10_fake_update` | A banner on a news page (a genuine site the manager asked you to read): "Your browser is out of date. Download the update." with a download button. (fake-update state) | Close and report | yes | `fake_update_prompt` | Browsers update themselves and finish when you close and reopen them; at work IT manages that. A web page cannot know your browser needs updating, and no genuine update comes from a page. |
| 4 | `e10_browser_relaunch` | The browser's own menu bar: "An update is ready. Relaunch to finish." (ordinary browser UI) | Carry on (relaunch) | no | (none) | This one is the browser itself, not a web page, finishing an update it downloaded in the background. The mirror for row 3: a page offering an update is a trap; the browser's own bar is genuine. |
| 5 | `e10_fake_alarm` | A page takes the whole screen, an alarm (silent by default; "This page is trying to play a loud alarm"), "Your computer has been locked. Call support now." with an 0800 number; the close button reopens it. (full-screen-alarm state) | Close and report; do not call. Press Esc, close the tab or browser; if it will not close, ring the service desk on the number you already hold. | yes | `fake_alarm_callback` | Genuine error messages never include a phone number. Don't call: the "support agent" would ask you to install a remote access tool. Find the safe way out and report. (No siren, no flashing, always a way out, a hint after 30 seconds; core_08 pitfall.) |
| 6 | `e10_extension_permission` | An extension store page, 4.8 stars, "2 million users", for "Free PDF Tools"; Add brings up "It can: Read and change all your data on all websites. Read your browsing history." (permission-prompt state) | Cancel; use DocShift in Quayholt Apps, or ask IT | yes/decline | `browser_permission_grab` | An extension with that access can see and change everything you do in the browser, including the finance system and the intranet, and it can change when it updates. Add extensions only from Quayholt's approved list, or ask the service desk. |
| 7 | `e10_download_exe` | A download bar: "Fernside_pricelist.pdf.exe". (download-bar state) | Close and report | yes | `dangerous_download` | You asked for a price list; a price list is a PDF or a spreadsheet, not a program. A name like `pricelist.pdf.exe` is a program pretending to be a document. Don't open it; report it. |

Optional eighth screen if the set needs a plain "believe the warning" item: `e10_browser_warning`, a red "Deceptive site ahead" page, correct move "Go back" (a genuine browser warning; believe it, and if you need the site for work ask IT). Cut rows 4 or 8 to reach six; keep rows 1 and 2 (the fake-check/genuine-CAPTCHA pair) and rows 3 and 4 (the fake-update/genuine-relaunch pair).

Each phish screen carries `truth.ifTrusted` and `truth.reportReply` in the E5 voice (e.g. for row 1: "The command would have downloaded a program and run it, with nothing appearing on screen" / "Thanks. We've blocked that page, warned Fernside their site was hacked, and reported it to the NCSC"). Each genuine screen carries `truth.whyFine` with a `default` and per-factor keys.

### Mirror pairs (aw5)

- Rows 1 and 2: the **fake check** ("verify you are human: paste this") against the **genuine CAPTCHA** (tick a box). The tell is the instruction to your computer, not the word "verify".
- Rows 3 and 4: the **fake update** (a page offering a browser update) against the **genuine browser relaunch bar** (the browser's own update). The tell is whether it comes from a web page or from the browser itself.

### The clipboard reveal and core_07 crossover

The fake-check screen (row 1) shows, through the browser's own interface (not the scam page), a one-line description of what the page copied. The learner can still choose "Follow the instructions": the game then says in words what would have happened and, if they haven't reported within the set's feedback window, shows Leila's "report it and leave it" line (core_07: don't restart, don't clear history, don't run tools from the web; if asked, unplug the network cable and leave it on). No working command, no real clipboard write (core_08 pitfall).

## 12. Debrief cards

Built debrief view, core_08 order:

1. A reasoning card per screen (a thumbnail, the giveaway, what the learner did, the trusted route).
2. Genuine-item feedback (rows 2 and 4).
3. The team-protected tally (aw6): what each report blocked, and how fast (Leila's board, on-screen text).
4. **The habit to keep** (shared, word for word, copied from the built shell, not rewritten): "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."
5. **The module line** (core_08): "Start from a place you trust. Never let a web page drive your computer. If in doubt, close it and report it."
6. **The "On Monday" card** (`debrief.mondayCard: "slot:customer_report_route"`). Draft: "On Monday: get software from Quayholt Apps, not from adverts or search results; read the address before you sign in; and if a page ever tells you to paste, run, install, update, call or allow, close it. If you did any of those, report it straight away using the route in the box below, and don't restart or clear anything."
7. The customer report route (slot).
8. **The no-blame line** (`debrief.noBlameLine: true`). Draft: "These pages are built to look ordinary, and a familiar site that has been hacked is the hardest of all. A miss here just shows what to look for; reporting fast, even after you have clicked or pasted, is what limits the damage, and nobody is in trouble for it."

Concept cards (short, core_08): where software comes from; read the address; the four tricks (fake check, fake update, fake alarm, fake permission); if you slipped. Author as entries in **ENG-09b**'s array form of `strings.conceptPanel` (the built `conceptPanel` is a single panel, so more than one card needs ENG-09b).

## 13. Defend-only variant

Shell id `e10_downloads_and_fake_checks_defend`, stages `["brief", "defend", "debrief"]`, same defend set `e10_browser_morning`, prefix `episode_e10_downloads_and_fake_checks_defend_defend_`. Put defend-only `brief` and `scopeNote` under `awarenessEpisode._defendOnly`. Draft defend-only brief: "You're on an authorised exercise at Quayholt Insurance, a fictional company. You've a morning of ordinary work to get through, and the web keeps getting in the way: downloads, 'verify you are human' boxes, pop-ups that want you to call. For each page, decide whether to carry on, close and report, or go the trusted way. Nothing here touches a real site or runs on your computer." Both variants join both seeded Hacktivity courses (follow `01_PIPELINE.md` P12 for seeding; do not use `awareness_deploy.py`, Round 1 ruling 8). **Both variants need ENG-03a.**

## 14. Check-form items it feeds (see 10_CHECK_FORMS.md)

E10's topic (core_08/core_07) feeds the new **`general_v2`** check-form pair at Quayholt, built by `10_CHECK_FORMS.md` (Round 1 ruling 1 adopts `10`'s two-pair scheme and drops the per-topic forms). Do not edit the six built role forms, including the built `general` form: `general_v2` is a separate new pair. `general_v2`'s web item (item 2) uses the **built `page` shape** (a look-alike page), not E10's new `page.state` surfaces, so the check form needs no ENG-03a states (ENG-03a states this). `10`'s current item 2 scores `lookalike_domain` / `padlock_myth` on the built page shape, which are shared-library tells; it scores **none** of E10's five web tells. So under Round 2 ruling 2 all five (`fake_check_paste`, `fake_update_prompt`, `dangerous_download`, `fake_alarm_callback`, `browser_permission_grab`) stay **scenario-local** to E10 and are not scored in any check form. If `10`'s author later balances `general_v2` to score one of them, that single id moves to the shared library with a `SKILL_NAMES` entry (ENG-08); E10 does not require it. There is no form-building engine packet (the stale `ENG-09` reference is dropped, Round 1 R1_content M5). Keep `passPercent` 0 and the `triage_{stage}_` prefix.

## 15. Files to create or change

- `planning_notes/phishing_and_social_engineering/awareness/e10/attack.json` (new): the attack fragment, reusing E5's facts, templates, `landingPages` and phishTarget (with the vendor/portal flavour). If the attack half is left identical to E5, this can be a thin copy that points at E5's shapes.
- `planning_notes/phishing_and_social_engineering/awareness/e10/defend.json` (new): the triageSet `e10_browser_morning` (the browser screens, with ENG-03a states), the `awarenessEpisode` block (`strings`, `_defendOnly`, `debrief`), and a `_brandAdditions` note for Pagewright, Fernside Catering, Ashby Supplies, and the Lena Fischer / Leo Brennan pool names if used.
- `scenarios/awareness_e10_downloads_and_fake_checks/scenario.json.erb`, `mission.json`, `ink/niamh_doherty.ink` (and Leila's lines, either in Niamh's ink or a second NPC ink `ink/leila_nassar.ink`) (new): the full-episode shell wired like E5. Globals to declare: `episode_e10_downloads_and_fake_checks_state: {}`, `se_awareness_records: []`, `episode_e10_downloads_and_fake_checks_defend_{percent,reportRate,done,pass}`, `se_osint_state: {}`, the reused E5 `se_intel_*` facts, `se_landing_pages: {}`, `landing_*_built`, `landing_*_domain`, `phish_*_landed`, `phish_*_attempts`, plus any ENG-03a state globals the browser screens need. The host ink completes the attack task on the phish-attempts global and the conclusion task on `episode_e10_downloads_and_fake_checks_defend_done === true`.
- `scenarios/awareness_e10_downloads_and_fake_checks_defend/` (new): the defend-only shell.
- The two seeded Hacktivity courses: add E10 (full) and E10 (defend-only) following
  **`01_PIPELINE.md` P12** (Round 1 ruling 8), which holds the one seeding procedure at feature level.
  Do not use `awareness_deploy.py` for course seeding: it holds only the shared rule of thumb, not
  course logic. Describe at feature level only.
- ENG-03a engine work (page states and `verdictLabels`): owned by the ENG-03a packet; ENG-03b (download build page) only if the attack half is changed (§9).

## 16. Bridge script outline

`tools/playtest/se/bridge-e10-full.jsonl` (and defend-only), modelled on `bridge-e5-full.jsonl` for the attack half and on whatever test hooks ENG-03a exposes for the browser screens. Steps: brief; OSINT; build the look-alike page (reuse E5's build steps); write and send; flip; defend works each screen on the critical path (Close and report the five phish screens, Carry on the genuine CAPTCHA and the genuine relaunch bar); conclude on `episode_e10_downloads_and_fake_checks_defend_done`. Run through `check-bridge.mjs` and `run-suite.sh`. Depends on ENG-03a's test bridge for the new states.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e10_downloads_and_fake_checks/scenario.json.erb` passes (and the defend-only shell).
- The social validators pass, including the five new channel tells being accepted and the browser-screen verdicts being valid.
- `node --test test/js/social-awareness-fragment-erb-parity.test.mjs` passes.
- The shared rule-of-thumb test passes (habit string byte-identical).
- The bridge suite passes including `bridge-e10-full.jsonl`.
- Manual: no screen asks the learner to press real system shortcuts, and nothing writes to the real clipboard; the clipboard reveal is a harmless description and no working command is ever shown; the full-screen alarm is calm, always has a way out, and shows a hint after 30 seconds; every browser warning in the set is a true warning; the fake check on a familiar site is taught before it appears; the episode runs in about 15 minutes.

## 18. Do not

- Never ask the learner to press real system shortcuts, and never write to the real clipboard; the fake-check instructions are text with in-game buttons.
- Never show a working command; the clipboard reveal is a one-line description only.
- Don't teach the padlock as a safety sign, or "the store is official so it's safe".
- Don't make the alarm frightening (no sirens or flashing, always a way out), and don't teach people to ignore warnings (every warning in the set is true; "occasionally wrong" is made in words with "ask IT" as the action).
- Don't redesign the built E5 attack half or its page-triage set; E10 extends it.
- Don't edit the six built role check forms, the generators, or the shared rule-of-thumb string.
- Don't run a generator into the repo, `git stash`, or add attribution lines.
- No real brands, people or non-`.example` domains (swap the module docs' `.com`/`.co.uk` vendor domains to `.example`); no homographs; no Hacktivity internals.

## 19. Stop and ask if

- ENG-03a is not available (both the full and defend-only variants need it).
- ENG-03a cannot carry out the `verdictLabels` relabel on the browser set (the decision is a label change, not a new verdict; if even the relabel is not possible, ship the set with the built Trust/Report/Delete labels and note it degraded).
- The validator rejects any of the five scenario-local web tells declared in `channelTells` with a `flagChips` label (it should not; ruling 2 keeps them all local, so no ENG-08 append is needed for E10's tells).
- The orchestrator wants the attack half to build a fake-download page specifically (ENG-03b) rather than reusing E5's sign-in-page build.

## 20. Open questions

1. **The IT colleague.** This spec names Leila Nassar (built Quayholt IT service desk agent) as the explainer, to avoid reusing a host and the clashing pool name Owain Jenkins. Darren Price (service desk team lead, E3's host) is the alternative the old game_design implies. Confirm one.
2. **Vendor domains.** The module docs use `pagewright.co.uk` / `pagewright-download.com`; the awareness rule forces `.example`, so this spec uses `pagewright.example` / `pagewright-download.example`. Confirm, and run the pre-ship web search on Pagewright, Fernside Catering and Ashby Supplies.
3. **Named colleagues in cards.** Whether to attribute the manager's task chat and the extension recommendation to Lena Fischer and Leo Brennan (pool names) or leave them unattributed.
4. **Attack half.** Left identical to E5 (a sign-in-page build) to keep E10 free of attack-side engine work; confirm, or ask for ENG-03b (a fake-download build page).
5. **ENG-03a card shapes.** The browser-screen states and the clipboard reveal are this spec's content proposals; ENG-03a owns the final engine shapes. (Resolved in Round 1: the three-way browser verdict is a `verdictLabels` relabel, not a new verdict, §11.)
6. **Item count.** Seven screens drafted (eight with the browser-warning item); the floor of six keeps both mirror pairs.
