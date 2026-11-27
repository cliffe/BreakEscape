// A4: each contact's thread as types and texts (call rows show up as type "call"). window.__psIds overrides the list.
const ids = (window.__psIds || ['dev_service_desk', 'ruth_phone']);
const out = {};
for (const id of ids) {
  const h = (window.npcManager.getConversationHistory(id) || []);
  out[id] = { count: h.length, types: [...new Set(h.map(m => m.type))], callRows: h.filter(m => m.type === 'call').length, texts: h.map(m => m.type + ': ' + String(m.text).slice(0, 40)) };
}
return out;
