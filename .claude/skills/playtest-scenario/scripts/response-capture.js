// response-capture.js: record every JSON response the page receives from the
// Break Escape server, one line per response, for the access model's leak check
// (docs/achitechture/ACCESS_MODEL_PLAN.md, "How the slice is tested" and step 6).
//
// playtest-session.js turns it on with --capture-responses <file>. Each line is
//
//   { n, t, method, path, [query], status, cmdSeq, cmd, cmdActive, [npcId], body }
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
// missing, not JSON or names no NPC.
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
    if (url && [...url.searchParams.keys()].some(k => k.startsWith('npc_id'))) return null;
  } catch { return null; }
  let data;
  try { data = request.postData(); } catch { return null; }
  if (typeof data !== 'string' || !data) return null;
  let parsed;
  try { parsed = JSON.parse(data); } catch { return null; }
  const id = parsed && typeof parsed === 'object' ? parsed.npc_id : null;
  return typeof id === 'string' && id.trim() ? id : null;
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

module.exports = { createResponseCapture, isJsonContentType, feedPostNpcId };
