// response-capture.js: record every JSON response the page receives from the
// Break Escape server, one line per response, for the access model's leak check
// (docs/achitechture/ACCESS_MODEL_PLAN.md, "How the slice is tested" and step 6).
//
// playtest-session.js turns it on with --capture-responses <file>. Each line is
//
//   { n, t, method, path, [query], status, cmdSeq, cmd, cmdActive, [npcId], [inv], [pc], [hash], body }
//
// where `body` is the parsed JSON (or `bodyText` when it does not parse, or
// `bodyError` when the browser no longer holds it), and cmdSeq is the session
// log's `seq` of the command that was running when the response arrived (the
// "in" line), so a finding can be tied to a beat. `cmd` is only the command's
// name: its arguments can hold typed secrets and stay out of this file.
// cmdActive is false for a response that arrived between commands (a timer's
// sync, a late load), which carries the last command sent; responses before the
// first command carry cmdSeq null. A /feed_post line also carries npcId, the
// `npc_id` its request asked for, so the leak scanner can credit an answer whose
// body was lost to the right NPC; it is left out when the request body is
// missing, not JSON or names no NPC, or when the URL's query names an `npc_id`
// too.
//
// Every POST /inventory line carries `inv`: { action, itemId, usedOn } read from
// the request body (the controller's action_type or actionType, item.id, and
// used_on or usedOn; a missing field is null), so the leak scanner can find the
// plant row (PHYSICAL_PENTEST_DEVICES_PLAN.md E0.3). `inv` is null when the
// body cannot be read (postData() is null, throws or is not a JSON object) or
// when the URL's query names a field the controller reads (action_type,
// actionType, item, used_on, usedOn): Rails lets the query beat the body, so
// the tagger declines. A null `inv` on a remove row tells the scanner the row
// may have been a plant it cannot read.
//
// Every POST whose path ends /login, /logout, /lock_session, /mfa/verify, /mfa/prompt or
// /mfa/approve carries `pc`: { pcId }, read from the request body's pc_id (and nothing else: no
// username, password, credential, code or facts). Every POST ending /crack carries `hash`:
// { hashId }, from hash_id. The key is present on every such row and is null when the id cannot be
// read: the body is missing, not a JSON object, has no non-empty string id of at most 200
// characters, a `pc` body names target_type or target_id (a subject that is not a PC), or the URL's
// query names a field the route reads (Rails lets the query beat the body). Other rows have neither
// key. The key is `pc`, not `login`, on purpose: the leak scanner honours a row key `login` but
// refuses any capture that holds one until it is taught to read recorder tags, so writing `login`
// would make every new capture unusable. The scanner does not read `pc` or `hash` yet.
//
// Only responses from the game's own origin, with a JSON content type, count;
// static files (/js/, /css/, /assets/, /stylesheets/) and redirects are skipped.
// Lines are written in the order the responses arrived, whatever order their
// bodies resolve in, and each is appended whole, so a file read mid-run holds
// only complete lines.
//
// Kept in its own module so test/js/playtest-session-capture.test.mjs can drive
// it with stub responses, without launching a browser.

const fs = require('fs');
const path = require('path');

const STATIC_PATH_RE = /\/(js|css|assets|stylesheets)\//;

/**
 * The `npc_id` a /feed_post request asked for, or null. Never throws. Null when the URL's query
 * names an `npc_id` too: Rails lets the query beat the body, so the body's id may not be the NPC
 * the server revealed for.
 */
function feedPostNpcId(request, url = null) {
  try {
    // Rack splits the query on `;` as well as `&`, so look at the whole decoded query;
    // over-matching only leaves the row untagged (the old rule)
    if (url && decodeURIComponent(url.search).includes('npc_id')) return null;
  } catch { return null; }
  let data;
  try { data = request.postData(); } catch { return null; }
  if (typeof data !== 'string' || !data) return null;
  let parsed;
  try { parsed = JSON.parse(data); } catch { return null; }
  const id = parsed && typeof parsed === 'object' ? parsed.npc_id : null;
  return typeof id === 'string' && id.trim() ? id : null;
}

// Request fields the controller's POST /inventory reads (games_controller.rb, inventory):
// a URL query naming any of them may override the body, so the tagger declines.
const INVENTORY_QUERY_RE = /(^|[?&;])(action_type|actionType|item|used_on|usedOn|hidden_in|hiddenIn)(\[|=|&|;|$)/;

/**
 * The `inv` tag of a POST /inventory row: { action, itemId, usedOn }, or null when the request
 * body cannot be read or the URL's query names a field the controller reads. Never throws.
 */
function inventoryTag(request, url = null) {
  try {
    if (url && INVENTORY_QUERY_RE.test(decodeURIComponent(url.search))) return null;
  } catch { return null; }
  let data;
  try { data = request.postData(); } catch { return null; }
  if (typeof data !== 'string' || !data) return null;
  let parsed;
  try { parsed = JSON.parse(data); } catch { return null; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const str = v => (typeof v === 'string' && v ? v : null);
  // Rails `a || b` keeps an empty string (it is truthy), so only null, undefined and false fall through
  const rails = (a, b) => (a === undefined || a === null || a === false ? b : a);
  const action = str(rails(parsed.action_type, parsed.actionType));
  const item = parsed.item && typeof parsed.item === 'object' ? parsed.item : null;
  const itemId = item ? (str(item.id) || null) : null;
  const usedOn = str(rails(parsed.used_on, parsed.usedOn));
  const hiddenIn = str(rails(parsed.hidden_in, parsed.hiddenIn));
  return hiddenIn ? { action, itemId, usedOn, hiddenIn } : { action, itemId, usedOn };
}

const PC_ROUTE_RE = /\/(login|logout|lock_session|mfa\/verify|mfa\/prompt|mfa\/approve)$/;
const CRACK_ROUTE_RE = /\/crack$/;
const PC_QUERY_RE = /(^|[?&;])(pc_id|target_type|target_id)(\[|=|&|;|$)/;
const HASH_QUERY_RE = /(^|[?&;])hash_id(\[|=|&|;|$)/;
const ID_LIMIT = 200;

// The body as a JSON object, or null. Never throws.
function jsonObjectBody(request) {
  let data;
  try { data = request.postData(); } catch { return null; }
  if (typeof data !== 'string' || !data) return null;
  let parsed;
  try { parsed = JSON.parse(data); } catch { return null; }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
}

const idString = v => (typeof v === 'string' && v && v.length <= ID_LIMIT ? v : null);

/** The `pc` tag of a PC sign-in, sign-out, lock or second-step POST: { pcId } or null. Never throws. */
function pcTag(request, url = null) {
  try {
    if (url && PC_QUERY_RE.test(decodeURIComponent(url.search))) return null;
  } catch { return null; }
  const body = jsonObjectBody(request);
  if (!body) return null;
  if ('target_type' in body || 'target_id' in body) return null;
  const pcId = idString(body.pc_id);
  return pcId ? { pcId } : null;
}

/** The `hash` tag of a POST /crack row: { hashId } or null. Never throws. */
function hashTag(request, url = null) {
  try {
    if (url && HASH_QUERY_RE.test(decodeURIComponent(url.search))) return null;
  } catch { return null; }
  const body = jsonObjectBody(request);
  const hashId = body ? idString(body.hash_id) : null;
  return hashId ? { hashId } : null;
}

function isJsonContentType(headers) {
  const type = headers && (headers['content-type'] || headers['Content-Type']);
  return typeof type === 'string' && /\bjson\b/i.test(type);
}

/**
 * @param {object} opts
 * @param {string} opts.file          where the lines go (appended; the folder is created)
 * @param {string} opts.origin        the game's origin, e.g. http://127.0.0.1:3001
 * @param {() => Date} [opts.now]     clock, for tests
 */
function createResponseCapture({ file, origin, now = () => new Date() }) {
  if (typeof file !== 'string' || !file) throw new Error('response capture needs a file');
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });

  let current = { seq: null, cmd: null, active: false };
  let chain = Promise.resolve();
  let count = 0;

  /** A command started: its session log seq (null with --no-log) and its name. */
  function startCommand(seq, cmd) {
    current = { seq: seq === undefined ? null : seq, cmd: cmd || null, active: true };
  }

  /** The command finished; later responses keep its seq with cmdActive false. */
  function endCommand() {
    current = { ...current, active: false };
  }

  /** Whether a response is one to record. Synchronous, so nothing is read for a skipped one. */
  function wanted(response) {
    let url;
    try { url = new URL(response.url()); } catch { return null; }
    if (origin && url.origin !== origin) return null;
    if (STATIC_PATH_RE.test(url.pathname)) return null;
    const status = response.status();
    if (status >= 300 && status < 400) return null;
    if (!isJsonContentType(response.headers())) return null;
    return { url, status };
  }

  /** The page's `response` listener. Never throws. */
  function onResponse(response) {
    let w;
    try { w = wanted(response); } catch { return; }
    if (!w) return;
    const snapshot = { t: now().toISOString(), cmdSeq: current.seq, cmd: current.cmd, cmdActive: current.active };
    let method = 'GET';
    try { method = response.request().method(); } catch { /* keep GET */ }
    let npcId = null;
    if (w.url.pathname.endsWith('/feed_post')) {
      try { npcId = feedPostNpcId(response.request(), w.url); } catch { /* left out */ }
    }
    let inv;
    if (method === 'POST' && w.url.pathname.endsWith('/inventory')) {
      try { inv = inventoryTag(response.request(), w.url); } catch { inv = null; }
    }
    let pc;
    if (method === 'POST' && PC_ROUTE_RE.test(w.url.pathname)) {
      try { pc = pcTag(response.request(), w.url); } catch { pc = null; }
    }
    let hash;
    if (method === 'POST' && CRACK_ROUTE_RE.test(w.url.pathname)) {
      try { hash = hashTag(response.request(), w.url); } catch { hash = null; }
    }
    // Start reading the body at once: a navigation can drop it later.
    const bodyP = Promise.resolve()
      .then(() => response.text())
      .then(text => ({ text }), err => ({ error: String((err && err.message) || err) }));
    chain = chain.then(async () => {
      const got = await bodyP;
      const line = { n: ++count, t: snapshot.t, method, path: w.url.pathname, status: w.status,
                     cmdSeq: snapshot.cmdSeq, cmd: snapshot.cmd, cmdActive: snapshot.cmdActive };
      if (w.url.search) line.query = w.url.search.slice(1);
      if (npcId) line.npcId = npcId;
      if (inv !== undefined) line.inv = inv;
      if (pc !== undefined) line.pc = pc;
      if (hash !== undefined) line.hash = hash;
      if (got.error !== undefined) {
        line.bodyError = got.error;
      } else {
        try { line.body = JSON.parse(got.text); }
        catch { line.bodyText = got.text; }
      }
      fs.appendFileSync(file, JSON.stringify(line) + '\n');
    }).catch(() => {});
  }

  /** Resolves once every response seen so far is on disk. */
  function flush() { return chain; }

  return { onResponse, startCommand, endCommand, flush, get count() { return count; }, file };
}

module.exports = { createResponseCapture, isJsonContentType, feedPostNpcId, inventoryTag, pcTag, hashTag };
