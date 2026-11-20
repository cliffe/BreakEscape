// A4: per contact, the saved call slot, the call rows in the thread, and the ringer's state. window.__psIds overrides the list.
const ids = (window.__psIds || ['caller_basic', 'caller_thread', 'caller_decline', 'caller_hold', 'caller_forced', 'timed_caller']);
const out = {};
for (const id of ids) {
  const o = window.npcManager.getNPC(id);
  const h = window.npcManager.getConversationHistory(id) || [];
  out[id] = {
    pendingCall: o && o.pendingCall ? JSON.parse(JSON.stringify(o.pendingCall)) : null,
    rows: h.filter(m => m.type === 'call').map(m => m.text + (m.read ? '' : ' [unread]')),
    thread: h.length,
    ringer: window.phoneRinger.stateOf(id),
  };
}
const c = window.phoneRinger.current();
out._current = c ? { npcId: c.npcId, state: c.state, opened: c.opened, answerSeconds: c.answerSeconds } : null;
out._missed_seen = window.gameState.globalVariables.missed_seen;
out._timed_ringing = window.gameState.globalVariables.timed_ringing;
const m = window.MinigameFramework.currentMinigame;
out._open = m ? { type: m._sceneType, npcId: m.params && m.params.npcId || null, ringerCall: !!(m.params && m.params.ringerCall) } : null;
return out;
