export const GROUPS = [
  ['Alkali metal', 'Alkali metals'], ['Alkaline earth metal', 'Alkaline earth metals'],
  ['Transition metal', 'Transition metals'], ['Post-transition metal', 'Post-transition metals'],
  ['Metalloid', 'Metalloids'], ['Nonmetal', 'Nonmetals'], ['Halogen', 'Halogens'],
  ['Noble gas', 'Noble gases'], ['Lanthanide', 'Lanthanides'], ['Actinide', 'Actinides']
];

export function buildCatalog(elements) {
  return GROUPS.map(([category, name]) => ({ name, items: elements.filter((element) => element.category === category) }))
    .filter((group) => group.items.length)
    .map((group) => ({ ...group, items: [...group.items].sort((a, b) => a.atomicNumber - b.atomicNumber) }));
}

const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export function phaseAt(element, temperatureK, pressureAtm = 1) {
  const melting = numeric(element.meltingPoint);
  const boiling = numeric(element.boilingPoint);
  if (melting === null || boiling === null) return element.standardState || 'unknown';
  // Educational pressure approximation: higher pressure raises the displayed
  // boiling threshold; this is intentionally not a laboratory-grade EOS.
  const pressureFactor = 1 + Math.log10(Math.max(.05, pressureAtm)) * .08;
  if (temperatureK < melting) return 'solid';
  if (temperatureK < boiling * pressureFactor) return 'liquid';
  return 'gas';
}

export function makeSpawnSpec(element, conditions, serial) {
  const density = numeric(element.density) || 1;
  const radius = Math.max(.2, Math.min(.68, .24 + Math.log10(density + 1) * .16));
  return {
    id: `element-${serial}`,
    element,
    phase: phaseAt(element, conditions.temperatureK, conditions.pressureAtm),
    temperatureK: conditions.temperatureK,
    pressureAtm: conditions.pressureAtm,
    radius,
    velocity: [0, 0, 0]
  };
}

export const formatValue = (value, suffix = '') => value === '' || value === null || value === undefined ? 'No reference value' : `${value}${suffix}`;
