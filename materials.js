// Shared material ledger for sandbox samples. Amounts are abstract simulation units,
// not laboratory moles, until calibrated sample-volume mechanics are implemented.
export function materialStateAt(material, temperatureK) {
  const melting = Number(material.meltingPoint);
  const boiling = Number(material.boilingPoint);
  if (Number.isFinite(melting) && temperatureK < melting) return 'solid';
  if (Number.isFinite(boiling) && temperatureK >= boiling) return 'gas';
  return material.state || 'solid';
}

export function createMaterialSample(material, options = {}) {
  const amount = Number.isFinite(options.amount) ? Math.max(0, options.amount) : 1;
  const temperatureK = Number.isFinite(options.temperatureK) ? options.temperatureK : 293;
  return {
    kind: 'pure',
    materialId: material.id,
    state: materialStateAt(material, temperatureK),
    density: Number(material.density) || null,
    miscibleGroup: material.miscibleGroup || null,
    amount,
    temperatureK,
    components: { [material.id]: amount }
  };
}

export function canMix(left, right) {
  return left.state === 'liquid'
    && right.state === 'liquid'
    && Boolean(left.miscibleGroup)
    && left.miscibleGroup === right.miscibleGroup;
}

export function combineSamples(left, right) {
  if (!canMix(left, right)) return null;
  const components = { ...left.components };
  for (const [id, amount] of Object.entries(right.components)) components[id] = (components[id] || 0) + amount;
  const amount = left.amount + right.amount;
  return {
    kind: 'mixture',
    state: 'liquid',
    miscibleGroup: left.miscibleGroup,
    amount,
    temperatureK: (left.temperatureK * left.amount + right.temperatureK * right.amount) / Math.max(amount, 1),
    components
  };
}
