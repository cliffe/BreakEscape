#!/usr/bin/env bash
# Generate or edit one image with Gemini through the Antigravity CLI (agy),
# which draws on the Google AI plan's allowance instead of the metered
# nanobanana MCP. Use this first; fall back to the MCP only on exit 3 or 4.
#
#   tools/agy_image.sh --out path/to/image.png [--aspect 1:1] [--ref img ...] \
#                      (--prompt "text" | --prompt-file file.txt)
#
# --ref passes an image to edit, combine or use as a reference (repeatable,
# absolute or relative paths). Aspect ratios: 1:1 (default), 2:3, 3:2, 3:4,
# 4:3, 9:16, 16:9. There is no model choice. Each call is a fresh
# conversation: to edit a result, pass it back with --ref.
#
# Exit codes: 0 saved to --out; 2 usage or no image produced; 3 quota or rate
# limit (use the MCP); 4 agy not signed in (ask the user to run `agy` once).
set -uo pipefail

out="" aspect="1:1" prompt="" refs=()
while [ $# -gt 0 ]; do
  case "$1" in
    --out) out="$2"; shift 2 ;;
    --aspect) aspect="$2"; shift 2 ;;
    --ref) refs+=("$(realpath "$2")"); shift 2 ;;
    --prompt) prompt="$2"; shift 2 ;;
    --prompt-file) prompt="$(cat "$2")"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$out" ] && [ -n "$prompt" ] || { sed -n '6,8p' "$0" >&2; exit 2; }
for r in "${refs[@]}"; do [ -f "$r" ] || { echo "no such reference: $r" >&2; exit 2; }; done

name="$(basename "${out%.*}")_agy_$$"
paths_json="[]"
if [ ${#refs[@]} -gt 0 ]; then
  paths_json="[$(printf '"%s",' "${refs[@]}" | sed 's/,$//')]"
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
start="$(date +%s)"
reply="$(cd "$work" && timeout 600 agy --print-timeout 9m -p "Call the generate_image tool exactly once with ImageName \"$name\", AspectRatio \"$aspect\", ImagePaths $paths_json, and as Prompt the text between the two ---- lines, verbatim, character for character (no rewriting, no additions):

----
$prompt
----

Reply with only the saved file path, or the exact error message if the tool fails." </dev/null 2>&1)"

# agy can return before its image subagent has saved the file; wait up to 2 min.
for _ in $(seq 24); do
  img="$(find "$HOME/.gemini/antigravity-cli/brain" -name "${name}*" -newermt "@$start" -type f 2>/dev/null | head -1)"
  [ -n "$img" ] && break
  grep -qiE 'not logged in|authentication required|quota|exhaust|rate.?limit|resource_exhausted|usage limit|limit reached' <<<"$reply" && break
  sleep 5
done
if [ -z "$img" ]; then
  if grep -qiE 'not logged in|authentication required' <<<"$reply"; then
    echo "agy is not signed in: run \`agy\` once in a terminal and sign in" >&2; exit 4
  fi
  if grep -qiE 'quota|exhaust|rate.?limit|resource_exhausted|\b429\b|usage limit|limit reached' <<<"$reply"; then
    echo "agy quota or rate limit reached; use the nanobanana MCP. Its reply:" >&2; echo "$reply" | tail -5 >&2; exit 3
  fi
  echo "agy produced no image. Its reply:" >&2; echo "$reply" | tail -15 >&2; exit 2
fi

mkdir -p "$(dirname "$out")"
case "${out,,}" in
  *.png) python3 -c 'import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], "PNG")' "$img" "$out" ;;
  *) cp "$img" "$out" ;;
esac
echo "$out"
