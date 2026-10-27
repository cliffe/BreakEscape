// A choice's reply is shown ~1.5 s after the click (or on the next click in
// click-through mode), and its tags used to run only then. handleChoice has
// already saved the story past the reply by that point, so a close or reload in
// the gap lost the tags while the saved position said they had run (R8 m3: the
// m09 hatch bin choice). The person-chat minigame now flushes the reply's STATE
// tags when it closes or the page hides; this module says which tags those are.
//
// Only presentation tags are listed (a denylist), so a new state tag is flushed
// by default. Everything else here is what processGameActionTags acts on.
const PRESENTATION_OR_NAVIGATION = new Set([
    'exit_conversation',          // the display path owns the close
    'portrait', 'lighting_dip',   // shown with the line
    'transition_to_person_chat',  // opens another chat; pointless on a closing one
    'trigger_minigame',           // a notification only
    'give_npc_inventory_items',   // open minigames: never mid-teardown
    'clone_keycard',
    'speaker', 'player', 'npc'    // who is talking
]);

export function tagAction(tag) {
    return String(tag).split(':')[0].trim().toLowerCase();
}

/** Split a reply's tags into those that change game state and those that are only shown. */
export function splitReplyTags(tags) {
    const state = [];
    const presentation = [];
    for (const tag of tags || []) {
        (PRESENTATION_OR_NAVIGATION.has(tagAction(tag)) ? presentation : state).push(tag);
    }
    return { state, presentation };
}

// Tags processGameActionTags awaits a server call on (chat-helpers.js: give_item,
// remove_npc); everything after one in the same call is delayed by it.
const SLOW_TAGS = new Set(['give_item', 'remove_npc']);

/** Split tags into those that finish synchronously and those that wait on the server. */
export function partitionSlowTags(tags) {
    const slow = [];
    const fast = [];
    for (const tag of tags || []) (SLOW_TAGS.has(tagAction(tag)) ? slow : fast).push(tag);
    return { slow, fast };
}
