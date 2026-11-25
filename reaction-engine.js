// Quantity planning is deliberately pure: Matter bodies are updated by game.js only
// after this routine has accepted a validated, data-driven registry entry.
import { REACTION_RULES } from './chemistry.js';

const MULTI_BODY_RULES = REACTION_RULES.filter((rule) => rule.reactants.length >= 2);
const RULES_BY_REACTANT = new Map();
for (const rule of MULTI_BODY_RULES) for (const id of rule.reactants) {
  if (!RULES_BY_REACTANT.has(id)) RULES_BY_REACTANT.set(id, []);
  RULES_BY_REACTANT.get(id).push(rule);
}

export function candidateRulesForComponents(componentIds) {
  const available = new Set(componentIds);
  const candidates = new Set();
  for (const id of available) for (const rule of RULES_BY_REACTANT.get(id) || []) candidates.add(rule);
  return [...candidates].filter((rule) => rule.reactants.every((id) => available.has(id)));
}

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

export function collisionClusterForBodies(bodies, collisionBodies, neighborDistance = 72) {
  const seeds = new Set(collisionBodies || []);
  if (!seeds.size || [...seeds].some(body => !bodies.includes(body))) return [];
  return connectedBodyClusters(bodies, neighborDistance).find(cluster => [...seeds].every(body => cluster.includes(body))) || [];
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

export function rankComponentSourcesByAnchor(anchor, sourcesByComponent, cache = null, componentIds = null) {
  const ids = componentIds ? [...new Set(componentIds)].filter(id => sourcesByComponent.has(id)) : [...sourcesByComponent.keys()];
  const cacheKey = ids.join('\u0000');
  let anchorCache = cache?.get(anchor);
  if (!anchorCache) {
    anchorCache = { rankings:new Map(), results:new Map() };
    cache?.set(anchor, anchorCache);
  }
  if (anchorCache.results.has(cacheKey)) return anchorCache.results.get(cacheKey);
  const ranked = new Map(ids.map((id) => {
    if (!anchorCache.rankings.has(id)) {
      anchorCache.rankings.set(id, [...sourcesByComponent.get(id)]
        .sort((left, right) => squaredDistance(left, anchor) - squaredDistance(right, anchor)));
    }
    return [id, anchorCache.rankings.get(id)];
  }));
  anchorCache.results.set(cacheKey, ranked);
  return ranked;
}

export function allocateCompactParticipants(bodies, reactants, extent, preserveReactants = {}, sourcesByComponent = indexBodiesByComponent(bodies), rankedSourcesByAnchor = null, reservedConsumptions = null) {
  if (!(extent > 1e-9)) return null;
  let best = null;
  for (const anchor of bodies) {
    const rankedSources = rankComponentSourcesByAnchor(anchor, sourcesByComponent, rankedSourcesByAnchor, Object.keys(reactants));
    const allocations = new Map();
    let cost = 0;
    let complete = true;
    for (const [id, coefficient] of Object.entries(reactants)) {
      const sources = rankedSources.get(id) || [];
      if (!sources.length) { complete = false; break; }
      if (preserveReactants[id]) {
        const source = sources[0];
        allocations.set(source, { ...(allocations.get(source) || {}), [id]:0 });
        cost += squaredDistance(source, anchor);
        continue;
      }
      let required = coefficient * extent;
      for (const body of sources) {
        const available = Number(body.plugin.sample.ledger.components[id]) || 0;
        const reserved = reservedConsumptions?.get(body)?.get(id) || 0;
        const amount = Math.max(0, available - reserved);
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

// Selection is data-driven and deterministic: curator priority wins, then the
// more specific complete reactant set, then the stable registry id.
export function compareReactionMatches(left, right) {
  const priorityDifference = (Number(right.rule.selectionPriority) || 0) - (Number(left.rule.selectionPriority) || 0);
  if (priorityDifference) return priorityDifference;
  const specificityDifference = right.rule.reactants.length - left.rule.reactants.length;
  if (specificityDifference) return specificityDifference;
  return left.rule.id.localeCompare(right.rule.id);
}

function findReactionMatchesInCluster(bodies, conditions) {
  const available = {};
  for (const body of bodies) for (const [id, amount] of Object.entries(body?.plugin?.sample?.ledger?.components || {})) available[id] = (available[id] || 0) + (Number(amount) || 0);
  const sourcesByComponent = indexBodiesByComponent(bodies);
  const rankedSourcesByAnchor = new Map();
  const matches = [];
  for (const rule of candidateRulesForComponents(sourcesByComponent.keys())) {
    if (!rule.condition(conditions)) continue;
    const plan = planReaction(rule, available);
    if (plan.extent <= 1e-9) continue;
    const participants = allocateCompactParticipants(bodies, rule.reactantStoichiometry, plan.extent, rule.preserveReactants, sourcesByComponent, rankedSourcesByAnchor);
    if (participants) matches.push({ rule, extent:plan.extent, plan, participants });
  }
  return matches.sort(compareReactionMatches);
}

function availableAmountsAfterReservations(bodies, reservedConsumptions) {
  const available = {};
  for (const body of bodies) for (const [id, amount] of Object.entries(body?.plugin?.sample?.ledger?.components || {})) {
    const reserved = reservedConsumptions.get(body)?.get(id) || 0;
    available[id] = (available[id] || 0) + Math.max(0, (Number(amount) || 0) - reserved);
  }
  return available;
}

export function findReactionParticipantBatch(bodies, conditionsForCluster, neighborDistance = 72) {
  const resolveConditions = typeof conditionsForCluster === 'function' ? conditionsForCluster : () => conditionsForCluster || {};
  const candidates = connectedBodyClusters(bodies, neighborDistance)
    .flatMap((cluster, clusterIndex) => findReactionMatchesInCluster(cluster, resolveConditions(cluster))
      .map((match, matchIndex) => ({ ...match, bodies:cluster, clusterIndex, matchIndex })));
  candidates.sort((left, right) => compareReactionMatches(left, right) || left.clusterIndex - right.clusterIndex || left.matchIndex - right.matchIndex);
  const reservedConsumptions = new Map();
  const accepted = [];
  for (const match of candidates) {
    const plan = planReaction(match.rule, availableAmountsAfterReservations(match.bodies, reservedConsumptions));
    if (plan.extent <= 1e-9) continue;
    const participants = allocateCompactParticipants(
      match.bodies,
      match.rule.reactantStoichiometry,
      plan.extent,
      match.rule.preserveReactants,
      indexBodiesByComponent(match.bodies),
      new Map(),
      reservedConsumptions
    );
    if (!participants) continue;
    for (const { body, consumptions } of participants) for (const [id, consumed] of Object.entries(consumptions)) {
      if (!(consumed > 1e-9)) continue;
      if (!reservedConsumptions.has(body)) reservedConsumptions.set(body, new Map());
      const reservations = reservedConsumptions.get(body);
      reservations.set(id, (reservations.get(id) || 0) + consumed);
    }
    accepted.push({ ...match, extent:plan.extent, plan, participants });
  }
  return accepted;
}

export function findBestReactionParticipantBodies(bodies, conditionsForCluster, neighborDistance = 72) {
  return findReactionParticipantBatch(bodies, conditionsForCluster, neighborDistance)[0] || null;
}

export function findReactionParticipantBodies(bodies, conditions = {}, neighborDistance = 72) {
  return findBestReactionParticipantBodies(bodies, conditions, neighborDistance);
}
