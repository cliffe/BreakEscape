// A3: where a contact's saved story is (npc.currentKnot and the knot its pending choices belong to), the open minigame, and the
// phone's rows. window.__psIds overrides the contact list.
const ids = (window.__psIds || ['caller_thread']);
const out = {};
for (const id of ids) {
  const o = window.npcManager.getNPC(id);
  const ss = o && typeof o.storyState === 'string' ? o.storyState : (o && o.storyState ? JSON.stringify(o.storyState) : null);
  let choiceTargets = null, flow = null;
  if (ss) {
    try {
      const j = JSON.parse(ss);
      const f = (j.flows && j.flows[j.currentFlowName || 'DEFAULT_FLOW']) || j;
      choiceTargets = (f.currentChoices || []).map(c => c.targetPath || c.pathStringOnChoice || c.sourcePath);
      flow = j.currentFlowName || null;
    } catch (_) {}
  }
  out[id] = { currentKnot: o && o.currentKnot, lastEnteredKnot: o && o.lastEnteredKnot, choiceTargets, flow, hasStoryState: !!ss };
}
const m = window.MinigameFramework.currentMinigame;
out._open = m ? { type: m._sceneType, npcId: m.params && m.params.npcId || null, currentNPCId: m.currentNPCId || null, ringerCall: !!(m.params && m.params.ringerCall), phoneId: m.phoneId || null } : null;
return out;
