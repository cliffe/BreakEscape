# Awareness course voice cast (Cyber Aware)

Status: Phase 1, 2026-11-01. This is the voice casting for the security-awareness course — the 69
`scenarios/awareness_*` scenarios (the E1–E20 episodes and their defend-only shells, the pre/post
before-and-after checks, `ca00_first_play` and `ca_annual_2027_defend`).
The `sis0*` incident simulations are cast elsewhere and are not covered here.

This phase does **not** edit any scenario, ink or generator file. The `voice` blocks are wired in
Phase 2. This document is the source of truth for the voice name and style each speaking character
gets then.

## Who actually speaks (extractor findings)

Measured with `TtsLineExtractor` / `InkLineWalker` over every `awareness_*` scenario rendered from its
`scenario.json.erb`, with a placeholder voice injected into every character so the extractor would
surface them (read-only; no files changed). Script:
`<session scratchpad>/awareness-voice/analyze.rb`.

- **24 distinct speaking characters.** Every awareness scenario is hosted by one person-chat NPC (the
  trainer/host who frames the exercise and receives reports), except `ca12_visitor_tailgater`,
  which has two voiced speakers (the lobby receptionist **Delphine Arvanitis** and the training host
  **Lorna Easton**).
- **312 voiced lines in total** (unique by TTS cache key, counted per scenario — the figure the batch
  will generate, because identical host lines in different scenarios are cached per-folder). Longest
  casts: Anjali Rao 42, Gwen Pritchard 34, Nilesh Solanki 23, Niamh Doherty 19.
- **No voiced narrator anywhere.** No awareness ink has a `Narrator:` line; the narrator block is never
  reached. Nothing to cast for a narrator.
- **No separate "Red-team analyst" speaker.** "Red team" is the exercise role the *learner* plays in
  the attack half; the coaching is spoken by the episode's host. There is no distinct red-team-analyst
  NPC with voiced lines. (The person named in `e12` who "sets the red-team scope", Jo Fairweather, is
  referred to but never speaks.)
- **No phone/voiced-call hosts.** Every host is `npcType: "person"`. The pretext-call NPCs
  (`leila_servicedesk` in e3, the caller side) resolve to the player's own seat, so they are not voiced.
- **No co-speaker lines** under another host's story.

### Cost estimate

312 lines, ~26,600 characters of voiced text, ~32 minutes of audio. At the skill's rate
(~$9 / million audio tokens, 25 tokens/s) that is **≈ $0.43** to generate the whole course once
(≈ $0.86 from 1 Jan 2027 when the rate doubles). A one-off generation cost; production serves the
committed clips.

### Voiced lines with printed variables (rule 2)

**None.** No voiced NPC line in any awareness scenario prints `{player_name}`, a count or any other
variable. The only `{...}` interpolations in the awareness ink (`{pretext_recipient_name}`,
`{pretext_who_name}`, etc. in `e12/delphine_reception.ink` and `e3/leila_servicedesk.ink`) sit inside
**player choice labels** (`+ { cond } [ ... {var} ... ]`) — the learner's own pretext lines, which the
extractor does not voice. No rewrites are needed for Phase 2.

## Casting rules applied

- A character keeps the **same voice name** in every scenario they host.
- Within any one scenario, **no two speakers share a voice** (only `e12` has two: Despina vs Erinome).
- Styles are **calm and natural**: welcoming, clear, patient. No "urgent" wording (it makes 3.8 sound
  stressed). These are trainers framing a safe exercise, so the manner is unhurried throughout.
- Accents follow the character's background from the ink headers, `BRAND_SET.md` and each portrait
  prompt. Second-generation and long-settled characters get a **UK regional** accent with at most a
  light inflection, to avoid caricature. The accent lives in the `style` line; the Gemini voice name
  sets timbre and gender only (`en-GB` throughout).
- The narrator voices (Algenib, Schedar) and Agent HaX's signature **Aoede** are left unused, to keep
  the awareness product's voices distinct from SAFETYNET.
- Two deliberate voice reuses across characters who never appear in the same scenario, documented
  below: **Despina** (Delphine Arvanitis / Sofia Marchetti) and **Gacrux** (Adaeze Okafor / Lerato
  Dlamini). The female Gemini palette is 14 voices for 15 female speakers, so one reuse is forced;
  the second keeps Aoede free.

## The cast

Style format (house style, per `sis01_healthcare/scenario.json.erb`):
`"<who, age, role>, <manner>. Speak with a consistent <place> accent throughout — do not shift to any other accent."`, `language: "en-GB"`.

### Brightwell Foods

| Character (id) | Scenarios (host) | Voice | Style | Why |
|---|---|---|---|---|
| **Adaeze Okafor** (`adaeze_okafor`) | e1_invoice_fraud (+defend) | **Gacrux** | Brightwell's finance manager, in her 40s, who came up through accounts payable, warm and direct. Speak with a consistent British accent with a light Nigerian inflection throughout — do not shift to any other accent. | Mature, grounded female timbre for a senior finance voice; Nigerian-British per BRAND_SET/portrait, kept light. Reused (never co-occurs with Lerato). |
| **Gwen Pritchard** (`gwen_pritchard`) | e13_ai_assistant (+defend) | **Sulafat** | Brightwell's IT service desk lead, in her late 30s, friendly and practical. Speak with a consistent South Wales accent throughout — do not shift to any other accent. | Warm timbre for a helpful service-desk lead; Welsh per the ink header. |
| **Agnieszka Duda** (`agnieszka_duda`) | e7_voice_ceo (+defend) | **Callirrhoe** | Brightwell's part-time payroll officer, in her 30s, calm and matter-of-fact. Speak with a consistent, lightly Polish-accented English throughout — do not shift to any other accent. | Easy-going female timbre; Polish, kept light and natural. |
| **Graham Whitfield** (`graham_whitfield`) | core_17_annual_2027_defend; pre/post_finance_ab | **Umbriel** | Brightwell's finance training lead, in his early 60s, unhurried and kind; a neutral proctor for the year-end edition. Speak with a consistent West Yorkshire accent from Halifax throughout — do not shift to any other accent. | Easy-going older male timbre for an unhurried proctor; Halifax per the ink header. |
| **Joanne Pell** (`joanne_pell`) | pre/post_finance_ba | **Zephyr** | Brightwell's learning and development coordinator, in her late 40s, brisk and friendly. Speak with a consistent East Midlands accent from Leicester throughout — do not shift to any other accent. | Bright, clear female timbre for a brisk L&D host; Leicester per the ink header. |

### Tarrowby Logistics

| Character (id) | Scenarios (host) | Voice | Style | Why |
|---|---|---|---|---|
| **Nilesh Solanki** (`nilesh_solanki`) | e15_shadow_it (+defend); e17_acceptable_use_defend; e9_passwords (+defend) | **Iapetus** | Tarrowby's IT service desk analyst, in his 30s, patient and helpful with an "ask first" manner. Speak with a consistent East Midlands accent from Leicester throughout — do not shift to any other accent. | Clear, even male timbre for a helpful analyst; grew up in Leicester (Gujarati-British, shown in name not accent). |
| **Fatima Begum** (`fatima_begum`) | e2_cv_lures (+defend) | **Vindemiatrix** | Tarrowby's recruitment lead and owner of the recruitment inbox, in her 30s, friendly and organised. Speak with a consistent Yorkshire accent throughout — do not shift to any other accent. | Gentle female timbre; British Bangladeshi, UK regional (West Yorkshire) accent. |
| **Chidi Okeke** (`chidi_okeke`) | e6_texts_and_qr (+defend) | **Zubenelgenubi** | Tarrowby's fleet coordinator at the Shipley depot, in his 40s, easy-going and knows every driver. Speak with a consistent West Yorkshire accent with a light Nigerian inflection throughout — do not shift to any other accent. | Casual male timbre for an easy-going depot voice; Nigerian-British, Shipley. |
| **Zainab Hussain** (`zainab_hussain`) | e20_remote_and_mobile_working (+defend) | **Achernar** | Tarrowby's field service engineer, in her 30s, steady and down-to-earth; eight years working from vans and trains. Speak with a consistent northern English accent throughout — do not shift to any other accent. | Soft, measured female timbre for the on-the-road explainer; British Bangladeshi, UK regional. |
| **Jun Watanabe** (`jun_watanabe`) | pre/post_hr_ab; pre/post_mobile_ba | **Puck** | Tarrowby's HR assistant, in his early 20s, in his first job, eager and polite. Speak with a consistent southern English accent throughout — do not shift to any other accent. | Upbeat, youthful male timbre for an eager first-jobber; Japanese-British, grew up in the UK. |
| **Lerato Dlamini** (`lerato_dlamini`) | pre/post_mobile_ab | **Gacrux** | Tarrowby's health and safety adviser, in her 30s, confident and direct; runs the depot toolbox talks. Speak with a consistent South African accent from Durban throughout — do not shift to any other accent. | Mature, grounded female timbre for a confident safety adviser; South African. Reused (never co-occurs with Adaeze). |
| **Ibrahim Diallo** (`ibrahim_diallo`) | pre/post_hr_ba | **Sadaltager** | Tarrowby's IT support lead, in his 40s, patient and unhurried; fifteen years in Leeds. Speak with a consistent English accent with a light French-West African inflection, now settled in Leeds, throughout — do not shift to any other accent. | Knowledgeable male timbre for a patient IT lead; French-Senegalese, long-settled, kept light. |

### Quayholt Insurance

| Character (id) | Scenarios (host) | Voice | Style | Why |
|---|---|---|---|---|
| **Anjali Rao** (`anjali_rao`) | core_00_first_play; e8_after_the_click (+defend); e16_insider_risk (+defend); e19_malware_and_updates (+defend); pre/post_general_v2_ab; pre/post_helpdesk_ab | **Kore** | Quayholt's information security analyst, about 35, who moved to the UK from Bengaluru; calm and attentive. Speak with a consistent educated Indian English accent, softened by years in the UK, throughout — do not shift to any other accent. | Firm, clear female timbre for the course's most-used host; Indian English per BRAND_SET/portrait. |
| **Niamh Doherty** (`niamh_doherty`) | e10_downloads_and_fake_checks (+defend); e5_signin_pages (+defend) | **Leda** | Quayholt's internal communications officer and IT trainer, in her mid 20s, bright, quick and a little wry. Speak with a consistent Northern Irish accent from Belfast throughout — do not shift to any other accent. | Youthful female timbre for a quick, friendly trainer; Northern Irish per the portrait and e10 header. *(Note: e5's header says "30s, Irish"; resolved to the e10/portrait "mid 20s, Northern Irish" so one voice serves both.)* |
| **Darren Price** (`darren_price`) | e3_helpdesk_reset (+defend); pre/post_general_v2_ba | **Orus** | Quayholt's security awareness lead, in his 50s, measured and dry. Speak with a consistent Bristol and West Country accent throughout — do not shift to any other accent. | Firm male timbre for a measured, dry awareness lead; Bristol per BRAND_SET/ink. |
| **Sofia Marchetti** (`sofia_marchetti`) | pre/post_helpdesk_ba | **Despina** | Quayholt's HR adviser, in her 30s, warm and approachable; second-generation Italian-British. Speak with a consistent southern English accent with a light Italian-British lilt throughout — do not shift to any other accent. | Smooth female timbre; Italian-British, UK accent with a light lilt. Reused (never co-occurs with Delphine). |

### Merrin & Sallow Architects

| Character (id) | Scenarios (host) | Voice | Style | Why |
|---|---|---|---|---|
| **Julian Sallow** (`julian_sallow`) | e14_social_media (+defend); pre/post_executive_ba | **Rasalgethi** | Merrin & Sallow's co-founding partner, in his mid 60s, calm, measured and a little wry; sits on planning panels. Speak with a consistent southern English accent throughout — do not shift to any other accent. | Informative, senior male timbre for a founding partner; Black British of Jamaican heritage, UK accent (no patois caricature). |
| **Yasmin Chaudhry** (`yasmin_chaudhry`) | pre/post_executive_ab | **Laomedeia** | Merrin & Sallow's finance controller, in her 40s, measured and precise; the person a PA should ring about money. Speak with a consistent southern English accent throughout — do not shift to any other accent. | Clear female timbre for a finance controller; British Pakistani, UK accent. |
| **Thandiwe Moyo** (`thandiwe_moyo`) | e4_exec_whaling (+defend) | **Pulcherrima** | Merrin & Sallow's studio manager, in her 30s, calm and capable. Speak with a consistent southern English accent with a light Zimbabwean inflection throughout — do not shift to any other accent. | Forward, warm female timbre for a capable studio manager; Zimbabwean-British, kept light. |
| **Delphine Arvanitis** (`delphine_reception`) | e12_visitor_tailgater (lobby, attack half) | **Despina** | Merrin & Sallow's front-of-house coordinator, in her 30s, poised and polite under a little pressure at the desk. Speak with a consistent southern English accent with a light Mediterranean lilt throughout — do not shift to any other accent. | Smooth female timbre for a composed receptionist resisting a pretext; Greek/French heritage name, UK front desk. (In e12 must differ from Lorna/Erinome — it does.) |
| **Lorna Easton** (`lorna_easton`) | e12_visitor_tailgater (+defend) | **Erinome** | Merrin & Sallow's reception and facilities lead, in her 40s, warm and reassuring. Speak with a consistent north-west England accent from Lancashire throughout — do not shift to any other accent. | Clear female timbre for the training host; north-west England per the ink header. |
| **Ama Owusu** (`ama_owusu`) | e18_credential_attacks_at_scale (+defend) | **Autonoe** | Security lead on Merrin & Sallow's outsourced IT provider (Fenlow Managed IT), in her 40s, warm and practical. Speak with a consistent London and southern English accent throughout — do not shift to any other accent. | Bright, warm female timbre for a practical security lead; Black British of Ghanaian heritage, UK accent. |

### Carrholme Services

| Character (id) | Scenarios (host) | Voice | Style | Why |
|---|---|---|---|---|
| **Tomasz Wiśniewski** (`tomasz_wisniewski`) | e11_misdirected_data (+defend); pre/post_data_conduct_ab | **Algieba** | Carrholme's Data Protection Officer, in his 50s, careful and reassuring; in the UK 25 years. Speak with a consistent, lightly Polish-accented English, softened by long years in the UK, throughout — do not shift to any other accent. | Smooth, steady male timbre for a careful DPO; Polish, long-settled, kept light. |
| **Yusuf Demir** (`yusuf_demir`) | pre/post_data_conduct_ba | **Alnilam** | Carrholme's information security lead, in his 40s, steady and practical. Speak with a consistent British accent throughout — do not shift to any other accent. | Firm male timbre for a steady security lead; British Turkish, UK accent. |

## Within-scenario uniqueness check

Only `ca12_visitor_tailgater` has two voiced speakers: **Delphine Arvanitis (Despina)** and
**Lorna Easton (Erinome)** — distinct. Every other scenario has a single host. The two reuses
(Despina: Delphine / Sofia; Gacrux: Adaeze / Lerato) are across scenarios that a learner never meets
together.
