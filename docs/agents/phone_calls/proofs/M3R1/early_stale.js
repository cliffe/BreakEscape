const npc = window.npcManager.getNPC('agent_0x99');
window.npcManager.barkSystem.showBark({ npcId: npc.id, npcName: npc.displayName, message: 'First box is in. It came with a list.', avatar: npc.avatar,
  inkStoryPath: npc.storyPath, startKnot: 'flag1_read', phoneId: npc.phoneId });
await new Promise(r => setTimeout(r, 1200));
const t = [...document.querySelectorAll('body *')].filter(e => e.children.length < 6 && (e.textContent||'').includes('First box is in') && e.offsetParent !== null).sort((a,b) => a.textContent.length - b.textContent.length)[0];
if (!t) return 'no toast'; t.click(); return 'clicked: ' + t.className;
