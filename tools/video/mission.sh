#!/usr/bin/env bash
# Sourced by run-take.sh. be_mission_key <mission>   -> folder key used under takes/ and video_out/ (m01_first_contact -> m01, sis01_x -> sis01, lab_foo -> lab_foo)
#                        be_mission_id  <mission>   -> scenario id (scenarios/<id>): exact folder, or the single scenarios/<key>_* folder
be_mission_key() { printf '%s' "$1" | sed -E 's/^((m|sis)[0-9]+)(_.*)?$/\1/'; }
be_mission_id() {
  local root="${BE_ROOT:-/home/user/BreakEscape}" arg="$1" key m
  [ -d "$root/scenarios/$arg" ] && { printf '%s' "$arg"; return 0; }
  key=$(be_mission_key "$arg")
  m=$(for d in "$root"/scenarios/"$key"_*/; do [ -d "$d" ] && basename "$d"; done)
  [ -n "$m" ] && [ "$(printf '%s\n' "$m" | wc -l)" -eq 1 ] && { printf '%s' "$m"; return 0; }
  echo "mission '$arg': no unique scenario folder in scenarios/ (found: ${m:-none})" >&2; return 1
}
