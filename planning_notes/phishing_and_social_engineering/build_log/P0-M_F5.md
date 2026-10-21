# P0-M: spike F5, return-to and the keyboard pause

Run 2026-10-21. Packet P0-M (plan items 0.9 and 0.10). Node test only; no browser run. The test
runs player.js's real `pauseKeyboardInput` and `resumeKeyboardInput` bodies and the real framework
files: `test/js/social-return-to.test.mjs`.

## The question

A child overlay launched from a parent that set `requiresKeyboardInput` must leave the world paused
when control returns to the parent, and unpause only when the parent closes.

## Answer

**Yes, with two framework changes. Without them the answer was no.**

How the pause works today. The world's movement and interaction keys are a single boolean,
`keyboardPaused` in `core/player.js:36`. `pauseKeyboardInput` (`:94`) sets it and
`resumeKeyboardInput` (`:99`) clears it. There is no count, so the last call wins. `startMinigame`
pauses only if the new minigame's own params say `requiresKeyboardInput`. `endMinigame` always
resumes, before it calls `onComplete`.

What happens on a parent-to-child hand-off:

1. The parent calls `startMinigame(child, ...)`. That ends the parent first, so `endMinigame`
   resumes the world. The child then pauses it again only if the child's params set
   `requiresKeyboardInput`. A child that does not set it (any existing minigame reused as a child)
   left the world awake, so Space jumped and `E` interacted behind it.
2. The child closes. `endMinigame` resumes, runs the child's `onComplete`, then (new) starts the
   parent from `returnTo`. All of this is one synchronous call, so no keydown can arrive between
   the resume and the parent's pause. The world is paused under the parent again **only if the
   reopened parent's params carry `requiresKeyboardInput: true`**. The designs pass
   `returnTo: { sceneType: 'mail-client', params: { accountId } }` (`01` "Attach a link that has no
   page"). Started from those params alone the mail client came back unpaused, with the
   framework's × and base Esc showing (no `disableClose`) and no `onComplete` from its starter.

What P0-M changed in `minigames/framework/minigame-manager.js`:

- When `startMinigame` displaces a minigame whose params have `suspended: true`, it keeps that
  parent's params on the child's `returnTo` (as `_parentParams`, on a copy of the child's params).
  The reopened parent gets `{ ...parentParams, ...returnTo.params, suspended: false }`, so its
  `requiresKeyboardInput`, `disableClose` and starter `onComplete` come back with it. Chains work the
  same way one level at a time (grandchild to child to parent).
- A child launched from a suspended parent that paused the world keeps it paused, unless the
  child sets `requiresKeyboardInput: false` itself.

Result, from the test: Space and `E` do nothing under the parent, under the child, and under the
reopened parent; the first Space after the parent's own close jumps.

## Limits found, not fixed here

- **Notes as a child does not return.** The S12 normal exit is `success === true` with no
  `aborted` result. The notes minigame closes with `complete(false)` (base × and Esc,
  `base-minigame.js:44`, `:77`), so "Add to Notepad" with `returnTo` (`01` N16) would never reopen
  the mail client. Damage and knockout closes also use `complete(false)`
  (`systems/player-damage-interrupt.js:66`, `:162`), which is why `false` cannot count as a normal
  exit. The mail-client packet needs either a notes close that reports `success: true`, or a
  notes-specific return (the existing `pendingPhoneReturn` style, `notes-minigame.js:811`).
- **The pause is not kept if `window.pauseKeyboardInput` is missing.** The fallback in
  `startMinigame` is a dynamic `import()`, which is asynchronous. In the game the window functions
  are always set, so this matters only in odd test harnesses.
- The reopened parent always gets an auto-created container (`returnTo` has no container field).
  None of the social overlays plans an external container.

## Item 0.10: overlay helper, built

`minigames/framework/social-overlay.js`: `SocialOverlayScene` (extends `MinigameScene`) and
`socialOverlayParams()`. Built because each of the seven overlays otherwise repeats the same
four pieces, and two of them are easy to get wrong: Esc must run in the capture phase, close the
topmost sub-layer, then blur a focused field, then close, and stand aside while a
`gameDisplay`/`gameConfirm` dialog is open (its own capture listener is registered later, so it
runs after ours); and a child launch must clear `suspended` again if the child fails to start, or
a later close silently skips the parent's `onComplete`. About 170 lines, no styling, no markup
beyond one Close button.
