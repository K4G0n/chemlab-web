import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, phaseAt, makeSpawnSpec } from '../sandbox.js';

const sodium = { atomicNumber: 11, symbol: 'Na', name: 'Sodium', category: 'Alkali metal', standardState: 'solid', meltingPoint: 371, boilingPoint: 1156, density: 0.97 };
const hydrogen = { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', category: 'Nonmetal', standardState: 'gas', meltingPoint: 14, boilingPoint: 20, density: 0.0000899 };

test('catalog groups are deterministic and include all requested categories', () => {
  const catalog = buildCatalog([sodium, hydrogen]);
  assert.deepEqual(catalog.map((group) => group.name), ['Alkali metals', 'Nonmetals']);
  assert.equal(catalog[0].items[0].symbol, 'Na');
});

test('catalog preserves every element through plutonium', async () => {
  const { readFile } = await import('node:fs/promises');
  const all = JSON.parse(await readFile(new URL('../data/elements.json', import.meta.url), 'utf8'));
  assert.equal(buildCatalog(all).flatMap((group) => group.items).length, 94);
});

test('phaseAt chooses solid, liquid, and gas from temperature', () => {
  assert.equal(phaseAt(sodium, 293), 'solid');
  assert.equal(phaseAt(sodium, 600), 'liquid');
  assert.equal(phaseAt(sodium, 1300), 'gas');
  assert.equal(phaseAt(sodium, 1200, 50), 'liquid');
});

test('makeSpawnSpec creates a bounded, data-backed entity payload', () => {
  const spec = makeSpawnSpec(sodium, { temperatureK: 293, pressureAtm: 1 }, 12);
  assert.deepEqual(spec.id, 'element-12');
  assert.equal(spec.phase, 'solid');
  assert.equal(spec.temperatureK, 293);
  assert.ok(spec.radius > 0 && spec.radius <= 0.68);
});
