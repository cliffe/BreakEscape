#!/bin/bash
# Argument handling for tools/playtest/session-start.sh, kept apart so a test can run it
# without starting a browser. Source it, then call:
#
#   session_args_parse "$@"
#
# It sets TAG (the game id at the end of the --url value, taken before anything else is
# changed), and SESSION_ARGS (the arguments to hand to the harness: --net-skin removed, and
# net_skin=<value> added to the URL, after "?" or "&" as the URL needs). The skin only
# changes the URL the browser opens; the server never reads it. With no --net-skin the URL
# gets net_skin=gui (the Panels view) unless it already carries a net_skin= value;
# --net-skin default adds nothing, so the page follows the stored pick and the scenario
# default. A value other than gui, cli or default is an error (return 2, message on stderr).

# _session_args_add URL VALUE EXPLICIT: URL with net_skin=VALUE added. Without an explicit
# option, a URL that already has a net_skin= value is left as it is.
_session_args_add() {
  local u=$1
  if [ "$3" != 1 ]; then
    case "$u" in *[?\&]net_skin=*) printf '%s' "$u"; return;; esac
  fi
  case "$u" in *\?*) printf '%s' "$u&net_skin=$2";; *) printf '%s' "$u?net_skin=$2";; esac
}

session_args_parse() {
  TAG=
  SESSION_ARGS=()
  local skin="" have_skin=0 prev="" a
  local args=("$@")
  local i

  # Tag from the game id in --url, exactly as before.
  for a in "${args[@]}"; do
    case "$prev" in --url) TAG=$(printf '%s' "$a" | grep -oE '[0-9]+/?$' | tr -d /);; esac
    case "$a" in --url=*) TAG=$(printf '%s' "${a#--url=}" | grep -oE '[0-9]+/?$' | tr -d /);; esac
    prev=$a
  done

  # Take --net-skin out of the arguments.
  local rest=()
  i=0
  while [ "$i" -lt "${#args[@]}" ]; do
    a=${args[$i]}
    case "$a" in
      --net-skin=*) skin=${a#--net-skin=}; have_skin=1;;
      --net-skin)
        i=$((i + 1))
        if [ "$i" -ge "${#args[@]}" ]; then echo "--net-skin needs a value: gui or cli" >&2; return 2; fi
        skin=${args[$i]}; have_skin=1;;
      *) rest+=("$a");;
    esac
    i=$((i + 1))
  done

  if [ "$have_skin" = 1 ]; then
    case "$skin" in
      gui|cli|default) ;;
      *) echo "bad --net-skin value '$skin': use gui, cli or default" >&2; return 2;;
    esac
  else
    skin=gui
  fi
  # The value to add to the URL; empty means leave the URL alone.
  local add=$skin
  [ "$skin" = default ] && add=

  # Add net_skin=<value> to the URL handed on.
  prev=
  for a in "${rest[@]+"${rest[@]}"}"; do
    if [ -n "$add" ] && [ "$prev" = --url ]; then
      a=$(_session_args_add "$a" "$add" "$have_skin")
    elif [ -n "$add" ]; then
      case "$a" in --url=*) a="--url=$(_session_args_add "${a#--url=}" "$add" "$have_skin")";; esac
    fi
    SESSION_ARGS+=("$a")
    prev=$a
  done
  return 0
}
