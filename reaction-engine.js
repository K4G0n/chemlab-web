// Quantity planning is deliberately pure: Matter bodies are updated by game.js only
// after this routine has accepted a validated, data-driven registry entry.
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
