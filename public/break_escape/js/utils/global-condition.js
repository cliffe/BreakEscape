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
