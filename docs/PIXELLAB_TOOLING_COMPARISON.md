# PixelLab tooling options for Break Escape

Researched 26 September 2026. All three third-party projects are weeks or months old and ship several releases a week, so check the version numbers and feature notes here against each repo before relying on them.

## The pipeline being automated

What happens today, mostly by hand in the pixellab.ai web UI:

1. **Concept art.** Gemini (nanobanana MCP) draws a smooth, non-pixel illustration. The `character-talk-animation` skill already automates this step, plus magenta keying, reframing and flipping.
2. **Pixel-art bust.** Web UI "Image to pixel art" at ÷8 scale with init strength around 500 produces a 128×128 bust (`<name>_talk_init.png`).
3. **Talk animation.** Mouth frames come from that bust. `build_talk_sheet.py` composites them into the 256×256 2×2 `<name>_talk.png`.
4. **8-direction walk character.** A south-facing sprite is created and rotated into 8 directions.
5. **Standard animation set.** Six stock templates in 8 directions, 48 generations per character. The `pixellab-character-animations` skill already does this through MCP.
6. **Export.** The character ZIP is downloaded and turned into a Phaser atlas by `tools/convert_pixellab_to_spritesheet.py`.
7. **Map sprites.** Props and objects for `assets/objects/`, and occasionally tiles.

The steps that hurt are 2 and 3, because they start from a **local image file**, and 4, when it starts from a concept.

## Summary table

✅ supported · ⚠️ partial or with caveats · ❌ not supported

|                                         | **PixelLab MCP** (current)                                                                           | **Direct REST API v2** (own scripts)                     | **pixelkiln** (gfargo)                                                | **PixelLab Pip** (Shilo)                                       | **pixellab-cli** (protonspy)                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| What it is                              | Official MCP server, ~90 tools                                                                       | Official HTTP API, 95 paths                              | Manifest + lockfile build tool (TypeScript, npm)                      | Agent skill (Markdown + two small Python helpers)              | Python CLI plus an agent skill (uv/PyPI)             |
| Age / maturity                          | Official                                                                                             | Official                                                 | 2 months, v0.74, 109 commits, 2★                                      | 3 months, v1.9, 51 commits, 31★                                | 12 days, v0.7, 127 commits, 7★                       |
| Maintainer                              | PixelLab                                                                                             | PixelLab                                                 | 1 person                                                              | 1 person                                                       | 1 person                                             |
| Endpoint coverage                       | Subset (PixelLab calls it "deliberately partial")                                                    | Everything                                               | Most of it; no lip-sync/vocal                                         | Everything, routed through MCP or REST                         | Most of it; no lip-sync/vocal                        |
| **2. Concept → pixel-art bust**         | ⚠️ `image_to_pixelart` now exists, but a local file has to go inline as base64 or be hosted at https | ✅ `image-to-pixelart` / `-pro`                           | ⚠️ no direct converter; the nearest are pro `concept` and `unzoom`    | ✅                                                              | ⚠️ only inside the fal recipe; no standalone command |
| **3. Talk / lip-sync frames**           | ⚠️ `create_vocal_animation`, `get_lip_sync`; same upload problem                                     | ✅ `/vocal-animation`, `/lip-sync`, `/talking-gif`        | ❌ out of scope (per its own docs)                                     | ✅ documented workflow                                          | ❌                                                    |
| **4. 8-dir character from a reference** | ⚠️ v3 `reference_image_base64/url`                                                                   | ✅                                                        | ✅ `reference`, or `concept` (pro)                                     | ✅                                                              | ✅ `character new --reference`                        |
| **5. Six templates × 8 dirs**           | ✅ (existing skill; 8 job slots)                                                                      | ✅ (you handle slots and retries)                         | ✅ loops per direction, free `mirror`                                  | ✅                                                              | ✅ `character animate`                                |
| **6. Export for Phaser**                | ⚠️ download ZIP by hand                                                                              | ✅ `GET /characters/{id}/zip` feeds the current converter | ⚠️ Aseprite/Godot sheets; the converter would need a new input format | ⚠️ PNG + spritesheet                                           | ⚠️ own `export atlas` format                         |
| **7. Map objects / tiles**              | ✅                                                                                                    | ✅                                                        | ✅ `map` generator (1 gen), Tiled export                               | ✅                                                              | ✅ `prop`, `tiles`                                    |
| Cost control                            | Per-call; the agent decides                                                                          | Whatever you write                                       | Offline `plan`, hard `--budget`, lockfile                             | Asks before spending; shows a batch estimate                   | Estimate first, `--yes` per paid call, ledger        |
| Provenance / reruns                     | None                                                                                                 | Whatever you write                                       | Strong: hashes, stale detection, `restore` without re-paying          | Job record per generation; "blueprints" replay (and pay again) | Manifest per output, `inspect`, resumable recipes    |
| Images stay out of Claude's context     | ❌ (uploads go through tool arguments)                                                                | ✅ if scripted                                            | ✅                                                                     | ⚠️ depends on route                                            | ✅                                                    |
| Token cost per session                  | Medium; large on uploads and big `get_character` replies                                             | High to write, low once a script exists                  | Low (short commands, JSON output)                                     | ~9k tokens of skill context, then agent-driven calls           | Low (skill ~9 KB, short commands)                    |
| Extra dependencies                      | None (already set up)                                                                                | Python + `requests`/`httpx`                              | Node 22+                                                              | Python 3.10+, agent plugin                                     | uv, Python 3.12+; optional fal.ai account            |
| Licence                                 | Service ToS                                                                                          | Service ToS                                              | MIT                                                                   | MIT                                                            | MIT                                                  |

## The options in detail

### 1. PixelLab MCP (the current approach)

**What changed since the skills were written.** `character-talk-animation/SKILL.md` says image-to-pixel-art is "not exposed through any MCP tool". That is no longer true. The MCP now has `image_to_pixelart` (with `faithful` and `init_image_strength`), `create_vocal_animation`, `get_lip_sync`, `create_talking_gif`, `set_character_portrait` and `unzoom_image`. On paper, every step of the pipeline is now reachable through MCP.

**What hasn't changed** is how images get in. Each tool takes an image as a `*_base64` string or an `*_url`. The tool descriptions now warn that "MCP clients routinely truncate large inline base64" and recommend the URL. A URL only helps if the file is already on the public internet, and our concept art and busts are local files. So the choice is:

- **Inline base64.** Claude has to output the whole file as tool-call text. A 20–30 KB PNG is tens of thousands of output tokens: slow, costly, and the source of the silent-corruption failures the talk skill records.
- **Host the file first.** You'd need somewhere to put it (a bucket, a temporary public URL), which is one more moving part.

Pros

- Already configured and authenticated. No new code.
- Good for conversational one-offs ("make me a filing cabinet prop").
- `pixellab-character-animations` shows it works for the one step that needs no upload (templates on an existing character).

Cons

- Uploads of local images are the weak point, and steps 2–4 all depend on them.
- Replies can be huge. `get_character` on a character with many animations overflows the tool output limit.
- No budget ceiling, no record of what was paid for, no idempotence. A crash mid-batch leaves you to work out the state from `list_jobs`.
- It's a subset of the API, so some parameters (for example exact output scale) may be missing even where a tool exists.

### 2. Direct REST API v2

`https://api.pixellab.ai/v2`, one bearer token (the same one the MCP uses), 95 paths, OpenAPI spec at `/v2/openapi.json` and an LLM index at `/v2/llms.txt`. Most generation calls are async jobs you poll.

**The official Python SDK is not an option for this.** `pixellab` on PyPI (1.0.5; repo last touched November 2025) still targets `https://api.pixellab.ai/v1` and only wraps pixflux, bitforge, skeleton/text animation, inpaint and rotate. It has no v2 characters, vocal animation or map objects. There's also an official JS SDK, which I didn't evaluate.

"Using the API" therefore means writing our own thin client, probably a few hundred lines of Python in `tools/`, next to the existing converter.

Pros

- Full coverage, including the exact web-UI features (image-to-pixelart output size and init strength, vocal animation with a chosen `viseme_count`, character ZIP export).
- Files go from disk to HTTP inside a Python process, so images never pass through Claude's context. That removes the base64 corruption problem at its source.
- `GET /characters/{id}/zip` is the same export the web UI gives you, so `convert_pixellab_to_spritesheet.py` keeps working unchanged.
- Fits the project's existing pattern (Python scripts in `tools/` and skill `scripts/`), with no Node or third-party dependency.
- Once written, each run is one short command. Low token cost.

Cons

- You're right that this burns tokens up front. Claude has to read the spec for each endpoint used and write, debug and test the client, and a first wrong parameter on a paid call costs generations.
- We have to build what the third-party tools already provide: polling, the 8-job-slot limit (an account limit, so the API doesn't lift it), retries for "heavy load" failures, cost estimates, and some record of job IDs so a crash doesn't mean paying twice.
- We carry the maintenance when PixelLab changes the API.

### 3. pixelkiln (gfargo/pixelkiln)

A build tool that treats generated art like compiled output. You declare assets in a committed `pixelkiln.manifest.json`; a committed `pixelkiln.lock.json` records the provider job, cost and output hashes for each one. `plan` shows missing, stale and recoverable assets and what they'd cost, offline. `gen --budget N` generates only what's needed, `pick` opens a local contact sheet to choose between candidates, and `restore` re-downloads paid work without paying again. No LLM chooses what to run or which image wins.

The docs repay reading even if we don't adopt it. `docs/ENDPOINTS.md` has measured costs and gotchas: `resize` regenerates rather than resamples; `image-to-pixelart` destroys alpha on pixel-art input; `remove-background` is the one utility that's safe on palette-locked art.

Pros

- Best fit for **cast batches**. One manifest per mission cast would declare each NPC base, its six template loops and 8 directions, then plan, price and generate them in waves. That's the repeatable version of `pixellab-character-animations`.
- `mirror` produces a direction by flipping another locally, for free. Mirroring west, north-west and south-west from their eastern counterparts would cut the standard set from 48 to about 30 generations. Watch for asymmetric details (badges, lanyards, a holster on one hip) that would end up on the wrong side.
- A character base can start from `reference` (our own south sprite) or, in pro mode, from `concept`: a painting such as the Gemini output, up to 1024px.
- Strongest provenance of any option. It also has a gallery, an in-browser Pixelorama editor for touch-ups, and a `map` generator at one generation per prop.
- Low token use: an agent runs short commands and reads JSON.

Cons

- **No lip-sync or vocal animation**, which its own PixelLab doc says is out of scope. That's step 3, so the talk pipeline would still need something else.
- No direct image-to-pixelart converter for the step 2 bust.
- One maintainer, two months old, v0.74. That's fast iteration, and it could also mean churn. Pin the version.
- Needs Node 22+. Its exports target Aseprite, Godot and Tiled, so we'd either adapt the converter or keep downloading the ZIP.
- A new concept to learn (manifest, lockfile, styles), which is heavy for the occasional single prop.

### 4. PixelLab Pip (Shilo/pixellab-pip)

An agent skill (Claude Code plugin) rather than a tool. It's a large set of routing instructions (a 52 KB `SKILL.md` plus about 35 reference files, averaging around 9k tokens of context by its own benchmark) that teaches the agent which PixelLab route to use. It picks between MCP and REST v2 per task. Its two Python helpers make no network calls, so the agent itself drives the API.

Pros

- **The only third-party option that covers the whole pipeline**, including a documented talking-portrait workflow: set portrait → `vocal-animation` (paid, choose 3/5/7/12 visemes) → free `lip-sync` plan or `talking-gif`.
- Asks before spending and lists every planned call with an estimate in one message. Refuses destructive remote changes without approval.
- Careful about credentials (never reads `.env*`, never prints the token).
- The reference files are a good, current summary of PixelLab routes and quirks.
- The most users of the three (31★), with a security-scanning CI setup.

Cons

- It's still agent-driven. Each run pays the skill's context cost, and actual calls go through MCP (the same upload problem) or through REST requests Claude writes on the spot. Nothing is deterministic or repeatable in the way a script or manifest is. "Blueprints" replay a workflow but pay again and don't reproduce the pixels.
- It would sit alongside our own skills and could overlap or conflict with them (it would also want to handle talk animations).
- One maintainer; the output folder and conventions are its own and need mapping onto `public/break_escape/assets/`.

### 5. pixellab-cli (protonspy/pixellab-cli)

A Python CLI over REST v2, plus fal.ai (GPT Image 2.5) for concept art. Every paid call prints an estimate and does nothing without `--yes`. Every call is logged to `pixellab-out/ledger.jsonl` with a manifest per output. `inspect` shows which ID is which. Recipes run one paid step at a time and stop, so you can fix the art before the next step multiplies it. It installs its own skill for Claude Code.

Pros

- Clean fit for an agent: short commands, a per-command `--yes`, `--dry-run`, `--json`, and `--max-generations`.
- Covers characters (`new --reference`, `state`, `animate`, `enrich`), props, tiles, UI, fonts, portraits (`--to-portrait`), cleanup (`unzoom`, `colors`, `correct`) and local image utilities (`flip`, `trim`, `sheet`, `split`).
- Checks a reference before sending it and refuses soft alpha edges, missing transparency, or a subject lost in a large canvas. Its `concept-to-sprite` wiki page matches our experience that references should be 256×256, facing south, and at rest.
- Written in Python, like our own tooling.

Cons

- **No lip-sync or vocal animation**, so step 3 isn't covered.
- The concept-to-pixel-art step is tied to its fal recipe (GPT Image 2.5). There's no standalone command to convert our own Gemini image, and a fal account would be one more subscription.
- Twelve days old (v0.7). The youngest option, with the most risk of change.
- Its output layout and atlas format are its own.

## Things that apply whichever option we pick

- **The 8 concurrent job slots are an account limit.** The API doesn't lift it. Whatever runs batches has to queue around it, and web-UI use at the same time competes for the same slots.
- **"South" means straight-on.** v3 reference rotation treats whatever the image faces as south. Our Gemini portraits are deliberately three-quarter turned for dialogue, so they must not be used as walk-sprite references. Step 4 needs its own front-facing, full-body concept.
- **Talk sheet fit.** Our sheet is four frames (closed plus three open). Vocal animation gives 3, 5, 7 or 12 visemes. Generating 5 and letting `build_talk_sheet.py` pick the three most distinct would reuse the existing compositor. It already keeps the body pixel-identical, which matters because vocal output may redraw more than the mouth.
- **"Heavy load" failures come back silently short.** Any batch runner needs a verify-and-backfill pass, as the existing animation skill does.

## Recommendation

No single third-party tool covers the whole Break Escape pipeline without the MCP upload problem. The two deterministic tools (pixelkiln, pixellab-cli) both lack talk animation, and Pip covers everything but stays agent-driven.

1. **Write a thin project-local REST client for the image-in steps (2, 3, 4 and the ZIP export).** For example, `tools/pixellab_pipeline.py` with subcommands `bust`, `visemes`, `rotate` and `export`, which read files from disk, poll, save results into `public/break_escape/assets/characters/`, and append job IDs to a small JSON log. This removes the manual web-UI step and the base64 problem, and plugs straight into `build_talk_sheet.py` and `convert_pixellab_to_spritesheet.py`. The upfront token cost is real but paid once, and pixelkiln's `ENDPOINTS.md` and Pip's `vocal-animation.md` shorten the research a lot. Then extend `character-talk-animation` to call it instead of handing off to you.
2. **Keep the MCP** for conversational one-offs and for the template animation batch, which already works and needs no upload.
3. **Trial pixelkiln on one mission's cast** if cast batches (steps 4, 5 and 7) become the bottleneck. Its manifest, budget, free mirrors and restore are the features we'd otherwise end up reinventing. Pin the version, and keep talk animations in our own script.
4. **Skip Pip and pixellab-cli as tools,** but read their docs. Pip's references and pixellab-cli's `concept-to-sprite` page record costly mistakes we don't need to repeat.

Before any build, first run a single paid call through the MCP `image_to_pixelart` (with `faithful=true`, `init_image_strength` around 200) on an existing `_nonpixelart.png` to compare it with the web-UI output. If it matches, the same parameters carry over to the REST script.
