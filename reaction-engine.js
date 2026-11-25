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

export function spatialNeighborPairs(bodies, neighborDistance = 72) {
  const cellSize = Number(neighborDistance);
  if (!(cellSize > 0)) return [];
  const buckets = new Map();
  const indexedBodies = bodies.map((body, index) => ({ body, index })).filter(({ body }) => {
    const { x, y } = body?.position || {};
    return Number.isFinite(Number(x)) && Number.isFinite(Number(y));
  });
  const cellFor = (body) => ({ x:Math.floor(Number(body.position.x) / cellSize), y:Math.floor(Number(body.position.y) / cellSize) });
  const keyFor = ({ x, y }) => `${x},${y}`;
  for (const entry of indexedBodies) {
    const key = keyFor(cellFor(entry.body));
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(entry);
  }
  const pairs = [];
  const limitSquared = cellSize * cellSize;
  for (const entry of indexedBodies) {
    const cell = cellFor(entry.body);
    for (let y = cell.y - 1; y <= cell.y + 1; y++) for (let x = cell.x - 1; x <= cell.x + 1; x++) {
      for (const candidate of buckets.get(keyFor({ x, y })) || []) {
        if (candidate.index <= entry.index || squaredDistance(entry.body, candidate.body) > limitSquared) continue;
        pairs.push([entry.body, candidate.body]);
      }
    }
  }
  return pairs;
}

export function connectedBodyClusters(bodies, neighborDistance = 72) {
  const neighbors = new Map(bodies.map(body => [body, []]));
  for (const [left, right] of spatialNeighborPairs(bodies, neighborDistance)) {
    neighbors.get(left).push(right);
    neighbors.get(right).push(left);
  }
  const remaining = new Set(bodies);
  const clusters = [];
  while (remaining.size) {
    const cluster = [];
    const queue = [remaining.values().next().value];
    remaining.delete(queue[0]);
    while (queue.length) {
      const body = queue.shift();
      cluster.push(body);
      for (const candidate of neighbors.get(body) || []) {
        if (remaining.delete(candidate)) queue.push(candidate);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

export function indexBodiesByComponent(bodies) {
  const sourcesByComponent = new Map();
  for (const body of bodies) {
    for (const [id, amount] of Object.entries(body?.plugin?.sample?.ledger?.components || {})) {
      if ((Number(amount) || 0) <= 1e-9) continue;
      if (!sourcesByComponent.has(id)) sourcesByComponent.set(id, []);
      sourcesByComponent.get(id).push(body);
    }
  }
  return sourcesByComponent;
}

export function allocateCompactParticipants(bodies, reactants, extent, preserveReactants = {}, sourcesByComponent = indexBodiesByComponent(bodies)) {
  if (!(extent > 1e-9)) return null;
  let best = null;
  for (const anchor of bodies) {
    const allocations = new Map();
    let cost = 0;
    let complete = true;
    for (const [id, coefficient] of Object.entries(reactants)) {
      const sources = [...(sourcesByComponent.get(id) || [])]
        .sort((left, right) => squaredDistance(left, anchor) - squaredDistance(right, anchor));
      if (!sources.length) { complete = false; break; }
      if (preserveReactants[id]) {
        const source = sources[0];
        allocations.set(source, { ...(allocations.get(source) || {}), [id]:0 });
        cost += squaredDistance(source, anchor);
        continue;
      }
      let required = coefficient * extent;
      for (const body of sources) {
        const amount = Number(body.plugin.sample.ledger.components[id]) || 0;
        const consumed = Math.min(amount, required);
        if (consumed > 1e-9) {
          allocations.set(body, { ...(allocations.get(body) || {}), [id]:consumed });
          cost += consumed * squaredDistance(body, anchor);
        }
        required -= consumed;
        if (required <= 1e-9) break;
      }
      if (required > 1e-9) { complete = false; break; }
    }
    if (!complete) continue;
    const candidate = { cost, participants:[...allocations].map(([body, consumptions]) => ({ body, consumptions })) };
    if (!best || candidate.cost < best.cost) best = candidate;
  }
  return best?.participants || null;
}

function findReactionInCluster(bodies, conditions) {
  const available = {};
  for (const body of bodies) for (const [id, amount] of Object.entries(body?.plugin?.sample?.ledger?.components || {})) available[id] = (available[id] || 0) + (Number(amount) || 0);
  const sourcesByComponent = indexBodiesByComponent(bodies);
  for (const rule of REACTION_RULES) {
    if (rule.reactants.length < 2 || !rule.condition(conditions)) continue;
    const plan = planReaction(rule, available);
    if (plan.extent <= 1e-9) continue;
    const participants = allocateCompactParticipants(bodies, rule.reactantStoichiometry, plan.extent, rule.preserveReactants, sourcesByComponent);
    if (participants) return { rule, extent:plan.extent, plan, participants };
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
