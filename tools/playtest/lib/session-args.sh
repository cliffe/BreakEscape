#!/bin/bash
# Argument handling for tools/playtest/session-start.sh, kept apart so a test can run it
# without starting a browser. Source it, then call:
#
#   session_args_parse "$@"
#
# It sets TAG (the game id at the end of the --url value, taken before anything else is
# changed), and SESSION_ARGS (the arguments to hand to the harness: --net-skin removed, and
# net_skin=<value> added to the URL, after "?" or "&" as the URL needs). The skin only
# changes the URL the browser opens; the server never reads it. A value other than gui or
# cli is an error (return 2, message on stderr).

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
      gui|cli) ;;
      *) echo "bad --net-skin value '$skin': use gui or cli" >&2; return 2;;
    esac
  fi

  # Add net_skin=<value> to the URL handed on.
  prev=
  for a in "${rest[@]+"${rest[@]}"}"; do
    if [ "$have_skin" = 1 ] && [ "$prev" = --url ]; then
      case "$a" in *\?*) a="$a&net_skin=$skin";; *) a="$a?net_skin=$skin";; esac
    elif [ "$have_skin" = 1 ]; then
      case "$a" in --url=*)
        case "$a" in *\?*) a="$a&net_skin=$skin";; *) a="$a?net_skin=$skin";; esac;;
      esac
    fi
    SESSION_ARGS+=("$a")
    prev=$a
  done
  return 0
}
