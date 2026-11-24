// Quantity planning is deliberately pure: Matter bodies are updated by game.js only
// after this routine has accepted a validated, data-driven registry entry.
import { REACTION_RULES } from './chemistry.js';

export function planReaction(rule, availableAmounts = {}) {
  const reactants = rule?.reactantStoichiometry || {};
  const preserved = rule?.preserveReactants || {};
  const extents = Object.entries(reactants).map(([id, coefficient]) => {
    const available = Number(availableAmounts[id]) || 0;
    return coefficient > 0 ? available / coefficient : 0;
  });
  const extent = extents.length ? Math.max(0, Math.min(...extents)) : 0;
  const remaining = {};
  for (const [id, coefficient] of Object.entries(reactants)) {
    const available = Number(availableAmounts[id]) || 0;
    const consumed = preserved[id] ? 0 : coefficient * extent;
    remaining[id] = Math.max(0, available - consumed);
  }
  const products = Object.fromEntries(Object.entries(rule?.productStoichiometry || {}).map(([id, coefficient]) => [id, coefficient * extent]));
  return { extent, remaining, products };
}

export function findReactionParticipantBodies(bodies, conditions = {}) {
  const available = {};
  for (const body of bodies) for (const [id, amount] of Object.entries(body?.plugin?.sample?.ledger?.components || {})) available[id] = (available[id] || 0) + (Number(amount) || 0);
  for (const rule of REACTION_RULES) {
    if (rule.reactants.length < 2 || !rule.condition(conditions)) continue;
    const plan = planReaction(rule, available);
    if (plan.extent <= 1e-9) continue;
    const allocations = new Map();
    let complete = true;
    for (const [id, coefficient] of Object.entries(rule.reactantStoichiometry)) {
      const sources = bodies.filter((body) => (Number(body?.plugin?.sample?.ledger?.components?.[id]) || 0) > 1e-9);
      if (!sources.length) { complete = false; break; }
      if (rule.preserveReactants?.[id]) {
        allocations.set(sources[0], { ...(allocations.get(sources[0]) || {}), [id]:0 });
        continue;
      }
      let required = coefficient * plan.extent;
      for (const body of sources) {
        const amount = Number(body.plugin.sample.ledger.components[id]) || 0;
        const consumed = Math.min(amount, required);
        if (consumed > 1e-9) allocations.set(body, { ...(allocations.get(body) || {}), [id]:consumed });
        required -= consumed;
        if (required <= 1e-9) break;
      }
      if (required > 1e-9) { complete = false; break; }
    }
    if (complete) return { rule, extent:plan.extent, plan, participants:[...allocations].map(([body, consumptions]) => ({ body, consumptions })) };
  }
  return null;
}
