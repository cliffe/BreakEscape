/**
 * Resolve runtime text variants from scenario global variables.
 *
 * Supports the same condition syntax used by scenario timers:
 * - globalVars.some_flag
 * - !globalVars.some_flag
 * - globalVars.some_value === 'x'
 * - globalVars.some_value !== 'x'
 * - globalVars.some_number > 3
 * - compound with &&
 */

function parseLiteral(token) {
    const t = String(token ?? '').trim();
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === 'null') return null;

    const num = Number(t);
    if (!Number.isNaN(num) && t !== '') return num;

    const strMatch = t.match(/^['"](.*)['"]$/);
    if (strMatch) return strMatch[1];
    return t;
}

function evaluateSingleCondition(expr, globalVars) {
    const trimmed = expr.trim();

    if (trimmed.startsWith('!')) {
        const varName = trimmed.replace('!globalVars.', '').trim();
        return !globalVars[varName];
    }

    if (trimmed.includes('===') || trimmed.includes('!==')) {
        const op = trimmed.includes('===') ? '===' : '!==';
        const parts = trimmed.split(op);
        if (parts.length !== 2) return false;

        const left = parts[0].trim();
        const right = parts[1].trim();
        const varName = left.replace('globalVars.', '').trim();
        const varValue = globalVars[varName];
        const rightValue = parseLiteral(right);
        return op === '===' ? varValue === rightValue : varValue !== rightValue;
    }

    const compMatch = trimmed.match(/globalVars\.(\w+)\s*(>=|<=|>|<)\s*(.+)/);
    if (compMatch) {
        const varName = compMatch[1];
        const op = compMatch[2];
        const rightValue = parseLiteral(compMatch[3]);
        const varValue = globalVars[varName];

        switch (op) {
            case '>=': return varValue >= rightValue;
            case '<=': return varValue <= rightValue;
            case '>': return varValue > rightValue;
            case '<': return varValue < rightValue;
            default: return false;
        }
    }

    const varMatch = trimmed.match(/globalVars\.(\w+)/);
    if (varMatch) {
        return !!globalVars[varMatch[1]];
    }

    return false;
}

export function evaluateGlobalCondition(condition, globalVars = {}) {
    if (!condition || typeof condition !== 'string') return false;

    if (condition.includes('&&')) {
        return condition.split('&&').every(part => evaluateSingleCondition(part, globalVars));
    }

    return evaluateSingleCondition(condition, globalVars);
}

export function resolveConditionalText(baseValue, variants, globalVars = {}) {
    if (!Array.isArray(variants) || variants.length === 0) {
        return baseValue;
    }

    for (const variant of variants) {
        if (!variant || typeof variant !== 'object') continue;
        if (typeof variant.value !== 'string') continue;

        if (!variant.condition) {
            return variant.value;
        }

        try {
            if (evaluateGlobalCondition(variant.condition, globalVars)) {
                return variant.value;
            }
        } catch (error) {
            console.warn('Failed to evaluate conditional text variant:', variant.condition, error);
        }
    }

    return baseValue;
}

export function resolveObjectField(data, fieldName, fallbackValue = null, globalVars = null) {
    const vars = globalVars || window.gameState?.globalVariables || {};
    const baseValue = data?.[fieldName] ?? fallbackValue;
    const variantsFieldName = fieldName === 'observations' ? 'observationVariants' : `${fieldName}Variants`;
    return resolveConditionalText(baseValue, data?.[variantsFieldName], vars);
}
