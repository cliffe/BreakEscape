/**
 * NPC records in a scenario: room NPCs plus headless records (social build item 0.5,
 * data contract 00 S8). The client twin of Game.scenario_npc_records in
 * app/models/break_escape/game.rb; keep the two in step.
 *
 * A headless record comes from a social.characters entry with an emailRecord, or from an
 * ink-email contact (contactNpcRecords). A character's id is its channels.email (an entry
 * without one has no record). It has no
 * room and no sprite, and phoneId "mail_only", a phone no scenario lists, so it never
 * shows as a phone contact. A scenario with no `social` key has no headless records.
 *
 * No imports, so node tests can load it directly.
 */

export const HEADLESS_PHONE_ID = 'mail_only';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * @param {object} scenario
 * @returns {object[]} fresh record objects, one per character with an emailRecord
 */
export function headlessNpcRecords(scenario) {
  const characters = isObject(scenario) && isObject(scenario.social) && isObject(scenario.social.characters)
    ? scenario.social.characters : {};

  const records = [];
  for (const character of Object.values(characters)) {
    if (!isObject(character)) continue;
    const record = character.emailRecord;
    const id = isObject(character.channels) ? character.channels.email : null;
    if (!isObject(record) || typeof id !== 'string' || id === '') continue;

    records.push({
      ...record,
      id,
      displayName: record.displayName || character.displayName || id,
      npcType: 'phone',
      phoneId: HEADLESS_PHONE_ID,
      itemsHeld: Array.isArray(record.itemsHeld) ? record.itemsHeld : []
    });
  }
  return records.concat(contactNpcRecords(scenario, new Set(records.map((r) => r.id))));
}

/**
 * Ink-email correspondents: a social.mailClient.contacts entry with an `npc` id and an
 * `emailRecord` is a headless record under that id, with no social.characters entry
 * (the ink-driven plain email, README_scenario_design.md "Ink-driven email"). A
 * character's record with the same id wins. Twin of Game.headless_contact_records.
 * @param {object} scenario
 * @param {Set<string>} [taken] ids already claimed
 */
export function contactNpcRecords(scenario, taken = new Set()) {
  const mail = isObject(scenario) && isObject(scenario.social) ? scenario.social.mailClient : null;
  const contacts = isObject(mail) && Array.isArray(mail.contacts) ? mail.contacts : [];
  const records = [];
  for (const contact of contacts) {
    if (!isObject(contact)) continue;
    const record = contact.emailRecord;
    const id = contact.npc;
    if (!isObject(record) || typeof id !== 'string' || id === '' || taken.has(id)) continue;
    taken.add(id);
    records.push({
      ...record,
      id,
      displayName: record.displayName || contact.name || id,
      npcType: 'phone',
      phoneId: HEADLESS_PHONE_ID,
      itemsHeld: Array.isArray(record.itemsHeld) ? record.itemsHeld : []
    });
  }
  return records;
}

/**
 * Room NPCs (in room order) then headless records; a headless record that reuses a
 * room NPC's id is dropped, so the room NPC wins. On the client the bootstrap
 * scenario has its rooms' npcs stripped, so before any room loads this is the
 * headless records alone.
 * @param {object} scenario
 * @returns {object[]}
 */
export function scenarioNpcRecords(scenario) {
  const roomNpcs = [];
  const rooms = isObject(scenario) ? scenario.rooms : null;
  if (isObject(rooms)) {
    for (const room of Object.values(rooms)) {
      if (!isObject(room) || !Array.isArray(room.npcs)) continue;
      for (const npc of room.npcs) if (isObject(npc)) roomNpcs.push(npc);
    }
  }
  const roomIds = new Set(roomNpcs.map((npc) => npc.id));
  return roomNpcs.concat(headlessNpcRecords(scenario).filter((rec) => !roomIds.has(rec.id)));
}
