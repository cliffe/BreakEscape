/**
 * Evaluate a scenario condition string against global variables, in the syntax the
 * scenario timers use (ui/scenario-timer-dispatcher.js), plus `||`:
 *   "globalVars.x"                         truthy
 *   "!globalVars.x"                        falsy
 *   "globalVars.state === 'critical'"      equality (also !==)
 *   "globalVars.count >= 3"                comparison (>, <, >=, <=)
 *   "globalVars.a && !globalVars.b"        and
 *   "globalVars.a || globalVars.b"         or (binds looser than &&)
 * No parentheses. Unknown forms evaluate to false.
 */

function parseLiteral(token) {
  const t = token.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  const num = Number(t);
  if (!isNaN(num) && t !== '') return num;
  const strMatch = t.match(/^['"](.*)['"]$/);
  if (strMatch) return strMatch[1];
  return t;
}

function evaluateSingle(expr, globals) {
  expr = expr.trim();
  if (!expr) return false;

  if (expr.startsWith('!') && !expr.startsWith('!=')) {
    return !evaluateSingle(expr.slice(1), globals);
  }

  if (expr.includes('===') || expr.includes('!==')) {
    const op = expr.includes('===') ? '===' : '!==';
    const [left, right] = expr.split(op).map(s => s.trim());
    const value = globals[left.replace('globalVars.', '').trim()];
    const rhs = parseLiteral(right);
    return op === '===' ? value === rhs : value !== rhs;
  }

  const comp = expr.match(/globalVars\.(\w+)\s*(>=|<=|>|<)\s*(.+)/);
  if (comp) {
    const value = globals[comp[1]];
    const rhs = parseLiteral(comp[3]);
    switch (comp[2]) {
      case '>=': return value >= rhs;
      case '<=': return value <= rhs;
      case '>': return value > rhs;
      case '<': return value < rhs;
    }
  }

  const v = expr.match(/^globalVars\.(\w+)$/);
  if (v) return !!globals[v[1]];
  return false;
}

export function evaluateGlobalCondition(condition, globals = {}) {
  if (typeof condition !== 'string' || !condition.trim()) return false;
  return condition.split('||').some(alt =>
    alt.split('&&').every(part => evaluateSingle(part, globals || {}))
  );
}

/** The global names a condition reads. */
export function globalsInCondition(condition) {
  if (typeof condition !== 'string') return [];
  return Array.from(new Set(Array.from(condition.matchAll(/globalVars\.(\w+)/g), m => m[1])));
}

/**
 * The strict form, for a scenario action's `condition` (systems/apply-actions.js). The
 * same syntax as above, but nothing is guessed: every term must be exactly one of
 *   globalVars.name            !globalVars.name  (any number of !, spaces allowed)
 *   globalVars.name OP literal    OP: === !== >= <= > <
 *                                 literal: true, false, null, a number, 'text' or "text"
 * joined by && and ||, with no parentheses. scripts/validate_scenario.rb
 * (action_condition_problem) holds the same grammar, so what it passes is what runs.
 * parseActionCondition returns null for anything else: not a string, empty, a negated
 * comparison ("!globalVars.x === true"), a bare name, an unquoted word on the right.
 */
const ACTION_NAME = /^(!\s*)*globalVars\.(\w+)$/;
const ACTION_COMPARE = /^globalVars\.(\w+)\s*(===|!==|>=|<=|>|<)\s*(true|false|null|-?\d+(?:\.\d+)?|'[^'"]*'|"[^'"]*")$/;

function parseActionTerm(term) {
  const t = term.trim();
  const name = t.match(ACTION_NAME);
  if (name) {
    const negations = (t.match(/!/g) || []).length;
    return (g) => (negations % 2 === 1 ? !g[name[2]] : !!g[name[2]]);
  }
  const cmp = t.match(ACTION_COMPARE);
  if (!cmp) return null;
  const rhs = parseLiteral(cmp[3]);
  switch (cmp[2]) {
    case '===': return (g) => g[cmp[1]] === rhs;
    case '!==': return (g) => g[cmp[1]] !== rhs;
    case '>=': return (g) => g[cmp[1]] >= rhs;
    case '<=': return (g) => g[cmp[1]] <= rhs;
    case '>': return (g) => g[cmp[1]] > rhs;
    default: return (g) => g[cmp[1]] < rhs;
  }
}

/** A function of the globals, or null when the condition is not in the grammar. */
export function parseActionCondition(condition) {
  if (typeof condition !== 'string' || !condition.trim()) return null;
  const alternatives = [];
  for (const alt of condition.split('||')) {
    const terms = alt.split('&&').map(parseActionTerm);
    if (terms.some(t => !t)) return null;
    alternatives.push(terms);
  }
  return (g) => alternatives.some(terms => terms.every(t => t(g)));
}

/** True only for a well-formed condition that holds. Anything malformed is false. */
export function evaluateActionCondition(condition, globals = {}) {
  const holds = parseActionCondition(condition);
  return holds ? holds(globals || {}) === true : false;
}

// apply-actions.js reads the evaluator from here for an action's `condition`. It is not
// imported there: that file is copied by many node test harnesses that stub only its
// known imports (see the note at its top). main.js imports this file so it is always
// loaded where actions run.
if (typeof window !== 'undefined') window.evaluateActionCondition = evaluateActionCondition;
