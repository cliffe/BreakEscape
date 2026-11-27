# Project conventions for Aider

Loaded read-only on every `aider` run (`--read CONVENTIONS.md`). Keep it short: every line costs context on every task. Edit the TODO placeholders to match the codebase.

## Project context

- Break Escape: browser-based Cyber Security teaching game (escape-room scenarios), mounted as a Rails engine inside Hacktivity.
- TODO: one line each for the main layers (game client JS, Rails engine, scenario JSON/ERB, tools in `tools/`).
- TODO: where tests live and how they are run (command).

## Style rules

- UK English in all prose, comments and strings ("Cyber Security" with a space).
- Write plainly. No inflated phrasing ("delve", "pivotal", "crucial", "robust", "foster"), no "It's not X, it's Y", no closing summaries.
- Match the style of the surrounding file: indentation, quote style, naming, module pattern. Do not reformat code you are not changing.
- Comment only code that needs clarification.
- TODO: language-specific rules (Ruby: RuboCop config in `.rubocop.yml`; JS: module style, no new dependencies without being told).

## Bounds

- Edit only the files named in the task. If another file must change, say which and why in your reply instead of editing it.
- Do not commit, push, branch, or touch git config. Leave changes in the working tree.
- Do not edit files outside this repository.
- Do not edit generated or vendored paths: `node_modules/`, `vendor/`, `tts_cache/`, `public/` build output.
- Do not delete files. Do not rename or move files unless the task says so.
- Do not open or change secrets, `.env*`, or credentials files.
- Do not read the SecGen scenario XML. List VM-side claims you cannot check as "needs checking against SecGen by the user".

## Reply format

End every reply with: what you did, which files you changed, and what you were unsure about or left undone.
