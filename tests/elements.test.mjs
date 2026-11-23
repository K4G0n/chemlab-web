import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const elementFile = new URL('../data/elements.json', import.meta.url);
const elements = JSON.parse(await readFile(elementFile, 'utf8'));

test('contains exactly H through Pu in atomic-number order', () => {
  assert.equal(elements.length, 94);
  assert.deepEqual(elements.map((e) => e.atomicNumber), Array.from({ length: 94 }, (_, i) => i + 1));
  assert.equal(elements[0].symbol, 'H');
  assert.equal(elements.at(-1).symbol, 'Pu');
});

test('every spawnable element includes advanced inspector fields', () => {
  for (const element of elements) {
    for (const field of ['symbol', 'name', 'atomicMass', 'electronicConfiguration', 'density', 'meltingPoint', 'boilingPoint', 'category', 'standardState']) {
      assert.ok(Object.hasOwn(element, field), `${element.symbol} is missing ${field}`);
    }
  }
});

test('radioactive elements retain unknown values instead of inventing them', () => {
  const plutonium = elements.find((element) => element.symbol === 'Pu');
  assert.equal(plutonium.atomicNumber, 94);
  assert.equal(plutonium.category, 'Actinide');
  assert.ok(plutonium.atomicMass);
});
