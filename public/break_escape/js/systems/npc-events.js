// Minimal event dispatcher for NPC events
// Exports default class NPCEventDispatcher with .on(pattern, cb), .once(pattern, cb) and .emit(type, data)
export default class NPCEventDispatcher {
  constructor(opts = {}) {
    this.debug = !!opts.debug;
    this.listeners = new Map(); // map eventType -> [callbacks]
  }

  on(eventType, cb) {
    if (!eventType || typeof cb !== 'function') return;
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, []);
    this.listeners.get(eventType).push(cb);
  }

  /**
   * Listen once, then unsubscribe.
   *
   * main.js has always called this to replay the conclusion screen when a
   * finished mission is reloaded, but the method did not exist -- so opening
   * any concluded game threw "window.eventDispatcher.once is not a function"
   * during init. That aborted the rest of setup, including the dynamic import
   * of the window.__test bridge a few lines later, which made every playtest
   * against a concluded game fail with "window.__test never appeared" and look
   * like a harness or environment fault.
   *
   * Unsubscribes before invoking, so a callback that re-emits the same event
   * cannot re-enter it.
   */
  once(eventType, cb) {
    if (!eventType || typeof cb !== 'function') return;
    const wrapped = (data) => {
      this.off(eventType, wrapped);
      cb(data);
    };
    this.on(eventType, wrapped);
  }

  off(eventType, cb) {
    if (!this.listeners.has(eventType)) return;
    if (!cb) { this.listeners.delete(eventType); return; }
    const arr = this.listeners.get(eventType).filter(f => f !== cb);
    this.listeners.set(eventType, arr);
  }

  emit(eventType, data) {
    if (this.debug) console.log('[NPCEventDispatcher] emit', eventType, data);
    // exact-match listeners
    const exact = this.listeners.get(eventType) || [];
    for (const fn of exact) try { fn(data); } catch (e) { console.error(e); }

    // wildcard-style listeners where eventType is a prefix (e.g. 'npc:')
    for (const [key, arr] of this.listeners.entries()) {
      if (key.endsWith('*')) {
        const prefix = key.slice(0, -1);
        if (eventType.startsWith(prefix)) for (const fn of arr) try { fn(data); } catch (e) { console.error(e); }
      }
    }
  }
}
