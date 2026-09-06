---
name: pixellab-character-animations
description: Brings one or more existing PixelLab characters up to the project's standard animation set — six stock template animations in all 8 directions — via the PixelLab MCP. Handles the 8-slot concurrency cap, backfills directions that fail under load, and verifies the result. Trigger when the user asks to "add animations to these characters", "give X the standard animations", "animate these characters", "make sure these have all 8 directions", or pastes pixellab.ai character URLs and asks for animations.
---

# PixelLab — standard character animation set

Adds the project's six stock animations, in all 8 directions, to characters that **already exist** in the PixelLab account. This does not create characters; it only animates existing ones.

## The standard set

Six PixelLab **stock template** animations, matching the house set used by the m01–m08 NPC sprites:

| Template ID          | Frames |
| -------------------- | ------ |
| `breathing-idle`     | 4f     |
| `walk`               | 6f     |
| `cross-punch`        | 6f     |
| `lead-jab`           | 3f     |
| `taking-punch`       | 6f     |
| `falling-back-death` | 7f     |

All 8 directions: `south, south-east, east, north-east, north, north-west, west, south-west`.

A fully animated character reports **48 anim** (6 groups × 8 directions) in `list_characters`.

Always pass `template_animation_id`. Never pass `action_description` — that switches the call to v3 custom generation, which costs more and produces off-model results that will not match the existing sprites.

## Cost

1 generation per direction, so **48 generations per character**, plus a few for retries. Check `get_balance` before starting and tell the user the total if it is a large batch.

## The hard constraint: 8 concurrent job slots

The account has **8 job slots**. A full 8-direction call consumes all of them, and a second call while they are busy fails outright:

```
error: need 8 job slots but only 0 available (8/8 used)
```

So the work **cannot be parallelised** across animations or characters. Everything runs strictly one batch at a time. Budget roughly **5 minutes per batch**, so ~30 min per character and ~2 hours for four.

### The rolling 7+1 pattern

Because failures need re-queuing anyway, run each batch as **1 backfill + 7 new directions**. This keeps all 8 slots busy and never leaves a slot idle:

1. Queue animation A on 7 directions (omit `west`).
2. Wait for the batch.
3. Queue A's `west` **appended to A's group** (1 job) + animation B on its 7 directions (7 jobs).
4. Repeat.

Appending is what keeps a group unified — pass the group id from the first call as `animation_group_id`, along with the same `template_animation_id`:

```
animate_character(
  character_id="<uuid>",
  template_animation_id="walk",
  animation_group_id="<group id from the first call>",
  directions=["west"],
)
```

Omitting `animation_group_id` on the follow-up mints a *second* group, leaving the animation split across two fragments.

## Failures under load

Individual directions fail sporadically:

```
lead-jab(west): Generation failed due to heavy load. Please try again in a moment.
```

The batch does not report this — it just silently comes back short. **After every batch, check for failures** and re-queue the missing directions into the same group. Expect roughly 1 failure per 100 jobs.

## Waiting and checking

`list_jobs` is the source of truth. Do not rely on sleep timers alone — overlapping background timers fire late and out of order, so always confirm against the job list.

- `list_jobs` — empty means the batch is done.
- `list_jobs(include_recent=true)` — shows `completed` / `failed` for the last 30 min. This is how you spot dropped directions.

Avoid calling `get_character` mid-run on a character with several groups: the response lists every frame URL and overflows the tool output limit. Use it only at the start (to see existing animations) and at the end (to verify).

## Procedure

1. **Resolve the targets.** Character URLs look like `https://www.pixellab.ai/create-character/<uuid>` — the uuid is the `character_id`.
2. **Check each target** with `get_character`: confirm `status: completed` (a character still generating cannot be animated), note its size and directions, and list any animation groups it already has.
3. **Skip what is already done.** A character at 48 anim with all six groups at 8 dir needs nothing — say so rather than regenerating. Report partial groups and fill only the gaps.
4. **Check `get_balance`** and report the total cost before a large batch.
5. **Run the rolling 7+1 loop** until all six groups exist for every character.
6. **Verify** with `list_characters(search=...)` — cheaper than `get_character` and shows the anim count directly. Every target should read **48anim**. If one is short, `get_character` it to find which group and direction is missing, then backfill.
7. **Report** per character: groups completed, generations spent, and any direction that needed a retry.

## Notes

- The PixelLab web UI may describe API-created animations as "custom animation" in its notifications. Verified stock templates still record correctly — `get_character` shows them under their template name with the expected frame count. The `animation_name` parameter is *not* the cause; it only sets a display label.
- `pro` mode costs 20–40 generations *per direction* and needs `confirm_cost`. Never use it for this set.
- If the user is also working in the PixelLab web UI at the same time, their jobs compete for the same 8 slots and will stall this queue.
