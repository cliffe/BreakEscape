#!/bin/bash
# Helpers for the A2b live proofs on test_phone_calls (source this file).
#   export PC_PORT=3024 OUT=docs/agents/phone_calls/proofs/A2b NODE_PATH=$PWD/node_modules
#   source tools/phone_calls/routes/a2b_lib.sh
#   a2b_open <label> [new-game.rb opts]   -> sets GID, writes $OUT/<label>_session.jsonl and _tts.jsonl
#   a2b_ev '<js body>'                    -> runs in the page, prints the result
#   a2b_status                            -> ringer state, banner text, open minigame
#   a2b_lever <object id>                 -> walk to the lever and interact
#   a2b_shot <name>                       -> $OUT/<label>_<name>.png
#   a2b_answer / a2b_decline              -> click the banner buttons
#   a2b_quit
cd "$(dirname "${BASH_SOURCE[0]}")/../../.."
S=tools/playtest/cmd.sh
a2b_open() {
  LABEL=$1; shift
  mkdir -p "$OUT"
  GID=$(tools/phone_calls/newgame.sh test_phone_calls "$@" | sed -n 's/^GAME_ID=//p')
  [ -n "$GID" ] || { echo "no game id" >&2; return 1; }
  echo "$GID" > "$OUT/${LABEL}_game_id.txt"
  tools/phone_calls/open.sh "$GID" "$OUT/${LABEL}_session.jsonl" "$OUT/${LABEL}_tts.jsonl" ${AUTOBRIEF:-true} >/dev/null
  echo "game $GID ($LABEL)"
}
a2b_ev() {
  local f=/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2dd9046d-5103-4a95-9363-70f3aa5c1f4a/scratchpad/ev-$GID.js
  printf '%s\n' "$1" > "$f"
  tools/phone_calls/ev.sh "$GID" "$f" | tail -n 1 | jq -c '.result // .'
}
a2b_status() {
  a2b_ev "const r = window.phoneRinger; const cur = r && r.current && r.current(); const b = document.querySelector('.incoming-call'); const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame; return {ringer: cur && {npcId: cur.npcId, state: cur.state, knot: cur.knot, opened: cur.opened}, queue: r && r.queueLength(), callActive: r && r.callActive(), closed: r && r.isClosed(), banner: b ? b.innerText.replace(/\n+/g,' | ') : null, bannerImg: b && b.querySelector('img') ? {src: b.querySelector('img').getAttribute('src'), ok: b.querySelector('img').complete && b.querySelector('img').naturalWidth > 0} : null, mg: mg ? (mg.constructor.name + ' ' + (mg.params && mg.params.npcId || '')) : null, globals: {debrief_go: window.gameState.globalVariables.debrief_go, declined_seen: window.gameState.globalVariables.declined_seen, missed_seen: window.gameState.globalVariables.missed_seen, timed_ringing: window.gameState.globalVariables.timed_ringing}};"
}
# a2b_lever <object id> [expected caller npc id]: the interaction menu sometimes picks a neighbouring lever
# or none, so with an expected caller it retries (up to 4 times) until the ringer holds or queues that caller.
a2b_lever() {
  local n
  for n in 1 2 3 4; do
    $S $GID "{\"cmd\":\"moveToNear\",\"id\":\"$1\"}" 30 >/dev/null
    $S $GID "{\"cmd\":\"interact\",\"id\":\"$1\"}" 30 >/dev/null
    [ -z "$2" ] && return 0
    sleep 1.5
    a2b_ev "const r=window.phoneRinger; const c=r.current(); return (c&&c.npcId==='$2')||(r.queueLength()>0)||r.callActive();" | grep -q true && return 0
  done
  echo "lever $1 did not ring $2" >&2; return 1
}
a2b_shot() { $S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/${LABEL}_$1.png\"}" 30 >/dev/null; echo "shot ${LABEL}_$1"; }
a2b_answer() { a2b_ev "const b = document.querySelector('.incoming-call-answer'); if (!b) return 'no answer button'; b.click(); return 'answered';"; }
a2b_decline() { a2b_ev "const b = document.querySelector('.incoming-call-decline'); if (!b) return 'no decline button'; b.click(); return 'declined';"; }
a2b_text() { $S $GID '{"cmd":"mg","action":"getState"}' 20 | jq -c '.result | {id,title,text}'; }
a2b_click() { $S $GID "{\"cmd\":\"mg\",\"action\":\"clickText\",\"args\":[\"$1\"]}" 20 | jq -c '.ok // .'; }
a2b_choose() { $S $GID "{\"cmd\":\"mg\",\"action\":\"choose\",\"args\":[$1]}" 30 | jq -c '.ok // .'; }
a2b_quit() { $S $GID '{"cmd":"quit"}' 20 >/dev/null; }
