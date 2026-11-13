// storyState (ink JSON string), currentKnot and sha256 for the named NPCs (window.__psIds overrides the list).
// storySeed is the ink random seed and differs on every run, so sha256_noseed hashes the state with
// storySeed removed: that is the value to compare between runs.
const ids = (window.__psIds || ['dev_service_desk', 'ruth_phone']);
const hex = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');
const out = {};
for (const id of ids) {
  const o = window.npcManager.getNPC(id);
  const ss = o && typeof o.storyState === 'string' ? o.storyState : (o && o.storyState ? JSON.stringify(o.storyState) : null);
  let sha = null, noseed = null, noseedText = null;
  if (ss) {
    sha = await hex(ss);
    try { const j = JSON.parse(ss); delete j.storySeed; noseedText = JSON.stringify(j); noseed = await hex(noseedText); } catch (_) {}
  }
  out[id] = { currentKnot: o && o.currentKnot, lastEnteredKnot: o && o.lastEnteredKnot, sha256: sha, sha256_noseed: noseed, storyState: noseedText || ss };
}
return out;
