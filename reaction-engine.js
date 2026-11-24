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

function squaredDistance(left, right) {
  const dx = Number(left?.position?.x) - Number(right?.position?.x);
  const dy = Number(left?.position?.y) - Number(right?.position?.y);
  return Number.isFinite(dx) && Number.isFinite(dy) ? dx * dx + dy * dy : Infinity;
}

export function connectedBodyClusters(bodies, neighborDistance = 72) {
  const remaining = new Set(bodies);
  const clusters = [];
  const limitSquared = neighborDistance * neighborDistance;
  while (remaining.size) {
    const cluster = [];
    const queue = [remaining.values().next().value];
    remaining.delete(queue[0]);
    while (queue.length) {
      const body = queue.shift();
      cluster.push(body);
      for (const candidate of [...remaining]) {
        if (squaredDistance(body, candidate) <= limitSquared) {
          remaining.delete(candidate);
          queue.push(candidate);
        }
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function localPartnerCenter(bodies, materialId, reactants) {
  const partners = bodies.filter((body) => Object.keys(reactants).some((id) => id !== materialId && (Number(body?.plugin?.sample?.ledger?.components?.[id]) || 0) > 1e-9));
  if (!partners.length) return null;
  return { position: partners.reduce((total, body) => ({ x:total.x + body.position.x / partners.length, y:total.y + body.position.y / partners.length }), { x:0, y:0 }) };
}

function findReactionInCluster(bodies, conditions) {
  const available = {};
  for (const body of bodies) for (const [id, amount] of Object.entries(body?.plugin?.sample?.ledger?.components || {})) available[id] = (available[id] || 0) + (Number(amount) || 0);
  for (const rule of REACTION_RULES) {
    if (rule.reactants.length < 2 || !rule.condition(conditions)) continue;
    const plan = planReaction(rule, available);
    if (plan.extent <= 1e-9) continue;
    const allocations = new Map();
    let complete = true;
    for (const [id, coefficient] of Object.entries(rule.reactantStoichiometry)) {
      const center = localPartnerCenter(bodies, id, rule.reactantStoichiometry);
      const sources = bodies
        .filter((body) => (Number(body?.plugin?.sample?.ledger?.components?.[id]) || 0) > 1e-9)
        .sort((left, right) => squaredDistance(left, center) - squaredDistance(right, center));
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

export function findReactionParticipantBodies(bodies, conditions = {}, neighborDistance = 72) {
  for (const cluster of connectedBodyClusters(bodies, neighborDistance)) {
    const match = findReactionInCluster(cluster, conditions);
    if (match) return match;
  }
  return null;
}
