# Fun-and-learning changes: user decisions (2026-10-22)

Source reviews: `scenarios/lab_social_engineering/FUN_REVIEW.md` and `awareness/FUN_REVIEW.md`. Picked on the review page https://claude.ai/artifact/YWiYjdEbCHHV4AwR7zM7Eq.

## Lab

| Id | Change | Decision |
|---|---|---|
| lab1 | Wake up Dev's call: the stale 2019 org chart tempts a wrong-team opener the student must repair | Do it |
| lab2 | Report and SOC board are the same quiz twice | Thin the SOC board |
| lab3 | Make the attack-to-defence mirror unmissable (Tomasz's debrief, flag own sends in triage) | Do it |
| lab4 | Seed Report Q1's "no report button" fact as a visible results row | Do it |
| lab5 | One live wrong option in each email picker | Do it |
| lab6 | Hide the readiness board's explicit goal strings until the student looks stuck | Do it |
| lab7 | Lighten the slow opening (keep the CMA beat) | Do it |
| lab8 | One teal wall line in all four rooms (new PIL tileset, one game.js load line) | Do it |

## Awareness

| Id | Change | Decision |
|---|---|---|
| aw1 | Render the customer's reporting route in the debrief (slot:customer_report_route) | Do it |
| aw2 | One consequential choice in each template attack, quoted back in the flip | Do it |
| aw3 | Store a discrimination figure for organisers (never shown as blame) | Do it |
| aw4 | One shared rule of thumb in every debrief | Do it |
| aw5 | A mirror pair in every defend set (suspicious-looking genuine, normal-looking phish) | Do it |
| aw6 | Confirm the report sting fires, and add a non-competitive "team protected" tally | Do both |
| aw7 | E6 and E7 defend-only by default | Later |
| aw8 | Say to organisers that the pre/post checks are per role | Do it |
| aw9 | Learner sprite | **The player's chosen avatar always wins, and the portrait follows it. Break Escape will ask players to choose an avatar first.** |

## Order

These are new work, not polish fixes. Within each track they slot in after the current dialogue cycle, so they don't collide with the files the dialogue fixers are editing. Each change gets a review → fix → playtest pass of its own. Engine items (aw1, aw3, aw6, aw9, lab8's load line) go to an engine fixer with tests.

## Later decisions (2026-10-23, review page https://claude.ai/artifact/McvYsBc9GSzU6HSJKed5Hd)

| Id | Question | Decision |
|---|---|---|
| ops_pov | Finish the Operations POV background (Gemini edit left the waist stripe) | Paint the stripe out in PIL, then convert |
| namesake | Always show Pierce's `j.baker@` namesake decoy? | Leave it optional |
| xero | Always show Sofia's Xero decoy? | Leave it as is |
| dev_art | Dev's bust: bluish eye highlights and pocket mark | Fix the eyes only: whiten the blue eye pixels (whites of the eyes); leave the pocket mark |
| mouths | Weak lip-sync shapes (Ruth round/small_open, Dev round) | Accept as is |
| voices | Lab NPC voices | Choose voices now (audio generation still needs a go-ahead) |
| timing | Human timing runs, both tracks | Later |
| e3_length | E3 runs ~17 min against a 13 min target | Accept ~17 min |
| e5_logo | Missing Quayholt logo | Make one (PixelLab) — done, 574d9db4d |

## Decisions on the fun-engine questions (2026-10-23, https://claude.ai/artifact/SDjwPM12bgKW3zrk8oaRvj)

| Id | Question | Decision |
|---|---|---|
| route_config | Deployment-wide reporting route | Hacktivity setting (concrete Hacktivity change to be confirmed with the user before editing) |
| sting_sound | Sound when a learner reports a phish | Keep the generic confirm sound |
| disc_visible | Show learners how well they spotted genuine mail? | Discrimination figure stays organiser-only, but give learners detailed feedback on it: "they will benefit from it" |
| hood | Fallback for a player with no avatar | Leave it |
| brief_reload | Lab Mission Brief popup after a reload | Leave it |
| lab_audio | Generate the lab NPC audio | Not yet |
| e7_mirror | E7 mirror pair (aw5) | Keep E7's existing voicemail mirror; revisit with aw7 |

## Awareness resume decisions (2026-10-27, review page https://claude.ai/artifact/33qVP3ZuZpiXHxTVz3Pi9z)

| Id | Question | Decision |
|---|---|---|
| host_concepts | 19 awareness host concepts | All approved. PixelLab characters wait for the 3 Nov quota reset; rooms and objects may use PixelLab now |
| q_farah | The Brightwell Farah Qureshi (name shared with m10, look close to Fatima Begum) | Rename the Brightwell host and redo her concept with a different look |
| q_pov | Gemini concepts for the four awareness POV backgrounds | Approved: make all four once the rooms stage closes. Gemini via agy needs no check from now on |
| q_e3mfa | E3 MFA-fatigue demo has no learner decision (E3-11) | Add one decision: the learner picks how many pushes to send and when (e.g. late at night); the debrief explains why fatigue works |
| q_aw7 | aw7: E6 and E7 defend-only by default | No answer: give more context in the next review page |
| q_timing_runs | Human timing runs | Keep postponed; estimate times from the agent runs meanwhile |
| q_facil | Facilitator notes | One facilitator guide for the course in HacktivityLabSheets (last stage) |

## Awareness decisions, part two (2026-10-27, review page https://claude.ai/artifact/VeD7DYww5HqB1xZ8NiNoDU)

| Id | Question | Decision |
|---|---|---|
| q_aw7 | aw7: E6 and E7 defend-only by default | Keep both versions listed and add organiser guidance. Also seed two courses in Hacktivity: one with the defend-only episodes, and one with both versions (user's note; this is the go-ahead for that seed edit) |
| q_timing | Episode length against the 13-minute target | Say "about 15 minutes" (E6 and E7 "about 16") and recommend defend-only for sessions under 30 minutes; human timing runs later |
| q_e7mirror | E7 mirror pair | Keep E7's voicemail mirror as it is; item closed |
