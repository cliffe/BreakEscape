/**
 * vm-steps.js — the playtest session's VM commands.
 *
 * The playtester never runs a command on a VM. It names a step of the mission's
 * solve and Hacktivity's `vm_step.rb` runs it (see Hacktivity
 * docs/vm_playtest/RUNBOOK.md). This module only starts that runner, waits for
 * it, and turns the flag refs it returns into values at the moment the agent
 * submits them at a station.
 *
 *   {"cmd":"vm","step":"recon","args":{...}}  → {job, step}  at once
 *   {"cmd":"vm","list":true}                  → the solve's steps
 *   {"cmd":"vmwait","job":"vm-1"}             → the step's JSON line, when it ends
 *   "<vmflag:shatter_server:flag_1>"          → the flag's value, fetched on use
 *
 * Step args go to the runner on stdin (`--args-json -`), never on a command
 * line, and are redacted from the session log. Flag values are never logged.
 *
 * Test seam: `command` is the runner's argv prefix. The default is
 * `bin/rails runner script/dev/vm_step.rb` in the Hacktivity folder; the tests
 * pass a stub script.
 */
const { spawn } = require('child_process');
const fs = require('fs');

const DEFAULT_COMMAND = ['bin/rails', 'runner', 'script/dev/vm_step.rb'];
const STEP_NAME = /^[A-Za-z0-9_]+$/;
const FLAG_REF = /^[A-Za-z0-9_.:-]+$/;

function fail(error, hint) {
  const e = new Error(error);
  if (hint) e.hint = hint;
  return e;
}

/** The last line of the output that parses as a JSON object (Rails may print warnings first). */
function lastJsonLine(text) {
  const lines = String(text || '').split('\n').map(l => l.trim()).filter(l => l.startsWith('{'));
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return JSON.parse(lines[i]); } catch (_) { /* keep looking */ }
  }
  return null;
}

/**
 * @param {object} o
 * @param {string} o.hacktivityDir  Hacktivity checkout (cwd of the runner)
 * @param {string|number} o.gameId  the playtest game
 * @param {string[]} [o.command]    runner argv prefix
 * @param {object} [o.env]          environment for the runner (default process.env)
 * @param {(dir:string,obj:object)=>void} [o.log]  session log hook
 */
function createVmSteps(o) {
  const command = o.command && o.command.length ? o.command : DEFAULT_COMMAND;
  const env = o.env || process.env;
  const log = o.log || (() => {});
  const jobs = new Map();
  const flagCache = new Map();
  let nextJob = 0;

  function need() {
    if (!o.hacktivityDir) throw fail('vm-not-configured', 'start the session with --hacktivity-dir PATH (or env HACKTIVITY_DIR)');
    if (!o.gameId) throw fail('vm-not-configured', 'start the session with --game-id ID');
    if (!fs.existsSync(o.hacktivityDir)) throw fail('vm-not-configured', `no such folder: ${o.hacktivityDir}`);
  }

  function run(extra, stdin) {
    const [bin, ...rest] = command;
    const child = spawn(bin, [...rest, '--game', String(o.gameId), ...extra], {
      cwd: o.hacktivityDir, env, stdio: ['pipe', 'pipe', 'pipe']
    });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.stdin.on('error', () => {});
    child.stdin.end(stdin === undefined ? '' : stdin);
    const done = new Promise(resolve => {
      child.on('error', e => resolve({ code: null, out, err: String(e.message), spawnError: true }));
      child.on('close', code => resolve({ code, out, err }));
    });
    return { child, done };
  }

  function summarise(r) {
    const json = lastJsonLine(r.out);
    return { exit: r.code, json, stderrTail: json ? undefined : r.err.trim().split('\n').slice(-5).join('\n').slice(0, 500) };
  }

  /** {"cmd":"vm", ...}: start a step, or list the steps. */
  async function vm(c) {
    need();
    if (c.list) {
      const s = summarise(await run(['--list']).done);
      if (!s.json) throw fail('vm-list-failed', s.stderrTail || `runner exited ${s.exit} with no JSON`);
      return { exit: s.exit, ...s.json };
    }
    if (typeof c.step !== 'string' || !STEP_NAME.test(c.step)) {
      throw fail('vm-bad-step', 'give "step": a solve step name (letters, digits, underscore), or "list": true');
    }
    if (c.args !== undefined && (c.args === null || typeof c.args !== 'object' || Array.isArray(c.args))) {
      throw fail('vm-bad-args', '"args" must be an object');
    }
    const hasArgs = c.args && Object.keys(c.args).length > 0;
    const { child, done } = run(['--step', c.step, ...(hasArgs ? ['--args-json', '-'] : [])], hasArgs ? JSON.stringify(c.args) : '');
    const id = `vm-${++nextJob}`;
    const job = { id, step: c.step, startedAt: Date.now(), pid: child.pid, finished: false, result: null };
    job.done = done.then(r => {
      job.finished = true;
      job.seconds = Math.round((Date.now() - job.startedAt) / 100) / 10;
      job.result = summarise(r);
      return job.result;
    });
    jobs.set(id, job);
    log('vm', { job: id, step: c.step, argNames: hasArgs ? Object.keys(c.args) : [] });
    return { job: id, step: c.step };
  }

  /** {"cmd":"vmwait","job":"vm-1"}: block until the step ends; return its JSON line. */
  async function vmwait(c) {
    const job = jobs.get(c.job);
    if (!job) throw fail('vm-unknown-job', `no job ${JSON.stringify(c.job)}; started: ${[...jobs.keys()].join(', ') || 'none'}`);
    let timer;
    if (c.timeoutMs) {
      const t = new Promise(r => { timer = setTimeout(() => r('timeout'), Number(c.timeoutMs)); });
      if (await Promise.race([job.done, t]) === 'timeout') {
        return { job: job.id, step: job.step, pending: true, waitedMs: Number(c.timeoutMs) };
      }
      clearTimeout(timer);
    } else {
      await job.done;
    }
    const r = job.result;
    log('vm-result', { job: job.id, step: job.step, exit: r.exit, ok: r.json ? r.json.ok : false });
    return { job: job.id, step: job.step, seconds: job.seconds, exit: r.exit, result: r.json, ...(r.stderrTail ? { stderrTail: r.stderrTail } : {}) };
  }

  /** The value for a flag ref, from `--flag-value`. Cached for the session; never logged. */
  async function flagValue(ref) {
    need();
    if (!FLAG_REF.test(ref)) throw fail('vm-bad-flag-ref', `not a flag ref: ${ref}`);
    if (flagCache.has(ref)) return flagCache.get(ref);
    const s = summarise(await run(['--flag-value', ref]).done);
    if (!s.json || s.exit !== 0 || s.json.ok === false || typeof s.json.value !== 'string') {
      const why = s.json && (s.json.refused || s.json.error || s.json.message) || s.stderrTail || `exit ${s.exit}`;
      throw fail('vm-flag-unavailable', `flag ${ref}: ${String(why).slice(0, 200)}`);
    }
    flagCache.set(ref, s.json.value);
    return s.json.value;
  }

  /** Replace "<vmflag:REF>" anywhere in a command; logs the token and source, never the value. */
  async function substituteVmFlags(node, at) {
    if (typeof node === 'string') {
      const re = /<vmflag:([^<>\s]+)>/g;
      const found = [...node.matchAll(re)];
      if (!found.length) return node;
      const values = new Map();
      for (const m of found) {
        if (!values.has(m[1])) values.set(m[1], await flagValue(m[1]));
        log('flag', { token: m[0], ref: m[1], at, source: 'vm-step', earnedInGame: true });
      }
      return node.replace(re, (whole, ref) => values.get(ref));
    }
    if (Array.isArray(node)) {
      const out = [];
      for (const v of node) out.push(await substituteVmFlags(v, at));
      return out;
    }
    if (node && typeof node === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(node)) out[k] = await substituteVmFlags(v, at);
      return out;
    }
    return node;
  }

  /** A copy of a command that is safe to write to the session log (step args hidden). */
  function redact(cmd) {
    if (cmd && cmd.cmd === 'vm' && cmd.args && typeof cmd.args === 'object') {
      return { ...cmd, args: Object.fromEntries(Object.keys(cmd.args).map(k => [k, '<redacted>'])) };
    }
    return cmd;
  }

  /** Kill any step still running (session quit). */
  function shutdown() {
    for (const j of jobs.values()) if (!j.finished && j.pid) { try { process.kill(j.pid); } catch (_) { /* gone */ } }
  }

  return { vm, vmwait, substituteVmFlags, redact, shutdown, _jobs: jobs };
}

module.exports = { createVmSteps, lastJsonLine, DEFAULT_COMMAND };
