// Quantity planning is deliberately pure: Matter bodies are updated by game.js only
// after this routine has accepted a validated, data-driven registry entry.
import { supportedReaction } from './chemistry.js';

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
  for (let first = 0; first < bodies.length; first++) for (let second = first + 1; second < bodies.length; second++) for (let third = second + 1; third < bodies.length; third++) {
    const group = [bodies[first], bodies[second], bodies[third]];
    const identities = group.map((body) => Object.keys(body?.plugin?.sample?.ledger?.components || {}));
    for (const firstId of identities[0]) for (const secondId of identities[1]) for (const thirdId of identities[2]) {
      const rule = supportedReaction([firstId, secondId, thirdId], conditions);
      if (rule?.reactants.length === 3) return { rule, participants:[
        { body:group[0], materialId:firstId }, { body:group[1], materialId:secondId }, { body:group[2], materialId:thirdId }
      ] };
    }
  }
  return null;
}
