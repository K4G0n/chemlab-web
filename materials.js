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
  if (left.kind === 'pure' && right.kind === 'pure' && left.materialId === right.materialId) {
    return { ...left, amount, temperatureK: (left.temperatureK * left.amount + right.temperatureK * right.amount) / Math.max(amount, 1), components: { [left.materialId]: amount } };
  }
  return {
    kind: 'mixture',
    state: 'liquid',
    miscibleGroup: left.miscibleGroup,
    amount,
    temperatureK: (left.temperatureK * left.amount + right.temperatureK * right.amount) / Math.max(amount, 1),
    components
  };
}

function formatAmount(amount) {
  return Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(3)));
}

export function compositionText(components) {
  return Object.entries(components)
    .filter(([, amount]) => amount > 1e-9)
    .map(([id, amount]) => `${Math.abs(amount - 1) < 1e-9 ? '' : formatAmount(amount)}${id}`)
    .join(', ');
}

export function visibleCompositionLabel(components, maxLength = 6) {
  const text = compositionText(components);
  return text.length <= maxLength ? text : '';
}

export function combineSelectedSamples(samples) {
  if (!Array.isArray(samples) || samples.length < 2) return null;
  const components = {};
  let amount = 0;
  let temperatureTotal = 0;
  const states = new Set();
  for (const sample of samples) {
    if (!sample?.components || !Number.isFinite(sample.amount)) return null;
    amount += sample.amount;
    temperatureTotal += sample.temperatureK * sample.amount;
    states.add(sample.state);
    for (const [id, part] of Object.entries(sample.components)) components[id] = (components[id] || 0) + part;
  }
  const state = states.size === 1 ? [...states][0] : states.has('gas') && states.size === 1 ? 'gas' : 'solid';
  return { kind:'composition', state, amount, temperatureK:temperatureTotal / Math.max(amount, 1), components };
}

export function consumeSample(sample, consumedAmount) {
  const amount = Math.max(0, sample.amount - Math.max(0, consumedAmount));
  const ratio = sample.amount > 0 ? amount / sample.amount : 0;
  return {
    ...sample,
    amount,
    components: Object.fromEntries(Object.entries(sample.components).map(([id, value]) => [id, value * ratio]))
  };
}

export function consumeComponent(sample, materialId, consumedAmount) {
  const available = Number(sample.components[materialId]) || 0;
  const consumed = Math.min(available, Math.max(0, consumedAmount));
  const components = { ...sample.components, [materialId]: available - consumed };
  if (components[materialId] <= 1e-9) delete components[materialId];
  return { ...sample, amount: Math.max(0, sample.amount - consumed), components };
}

export function limitingExtent(availableAmounts, coefficients) {
  const extents = Object.entries(coefficients).map(([id, coefficient]) => {
    const amount = Number(availableAmounts[id]) || 0;
    return coefficient > 0 ? amount / coefficient : Infinity;
  });
  return extents.length ? Math.max(0, Math.min(...extents)) : 0;
}
