import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaterialSample, combineSamples, combineSelectedSamples, compositionText, visibleCompositionLabel, materialStateAt, canMix, consumeSample, consumeComponent, limitingExtent } from '../materials.js';

test('material sample preserves identity, amount, temperature, and component ledger', () => {
  const water = createMaterialSample({ id: 'H2O', state: 'liquid', density: 1, miscibleGroup: 'polar' }, { amount: 2, temperatureK: 293 });
  assert.deepEqual(water.components, { H2O: 2 });
  assert.equal(water.temperatureK, 293);
  assert.equal(water.amount, 2);
});

test('miscible liquid samples form a component-preserving mixture', () => {
  const water = createMaterialSample({ id: 'H2O', state: 'liquid', density: 1, miscibleGroup: 'polar' });
  const ethanol = createMaterialSample({ id: 'C2H5OH', state: 'liquid', density: .789, miscibleGroup: 'polar' });
  assert.equal(canMix(water, ethanol), true);
  const mixture = combineSamples(water, ethanol);
  assert.equal(mixture.kind, 'mixture');
  assert.deepEqual(mixture.components, { H2O: 1, C2H5OH: 1 });
});

test('combining portions of the same pure liquid preserves its material identity', () => {
  const first = createMaterialSample({ id: 'H2O', state: 'liquid', miscibleGroup: 'polar' }, { amount: 2 });
  const second = createMaterialSample({ id: 'H2O', state: 'liquid', miscibleGroup: 'polar' }, { amount: 3 });
  const combined = combineSamples(first, second);
  assert.equal(combined.kind, 'pure');
  assert.equal(combined.materialId, 'H2O');
  assert.equal(combined.amount, 5);
});

test('element symbols are stable ledger identities and combined quantities use chemical notation', () => {
  const sodium = createMaterialSample({ symbol: 'Na', state: 'solid' });
  const combined = combineSelectedSamples([sodium, sodium]);
  assert.equal(sodium.materialId, 'Na');
  assert.equal(combined.kind, 'composition');
  assert.equal(combined.state, 'solid');
  assert.deepEqual(combined.components, { Na: 2 });
  assert.equal(compositionText(combined.components), '2Na');
  assert.equal(visibleCompositionLabel(combined.components), '2Na');
});

test('long combined composition is retained in full but suppressed on the body label', () => {
  const acid = createMaterialSample({ id: 'HCl', state: 'liquid' });
  const nitrate = createMaterialSample({ id: 'NaNO3', state: 'solid' });
  const combined = combineSelectedSamples([acid, nitrate]);
  assert.equal(compositionText(combined.components), 'HCl, NaNO3');
  assert.equal(visibleCompositionLabel(combined.components), '');
});

test('unrelated or non-liquid samples never fabricate a homogeneous mixture', () => {
  const water = createMaterialSample({ id: 'H2O', state: 'liquid', miscibleGroup: 'polar' });
  const salt = createMaterialSample({ id: 'NaCl', state: 'solid' });
  assert.equal(canMix(water, salt), false);
  assert.equal(combineSamples(water, salt), null);
});

test('phase state uses supplied material transition data and preserves unavailable values', () => {
  assert.equal(materialStateAt({ state:'liquid', meltingPoint:273.15, boilingPoint:373.15 }, 250), 'solid');
  assert.equal(materialStateAt({ state:'liquid', meltingPoint:273.15, boilingPoint:373.15 }, 300), 'liquid');
  assert.equal(materialStateAt({ state:'liquid', meltingPoint:273.15, boilingPoint:373.15 }, 390), 'gas');
  assert.equal(materialStateAt({ state:'solid' }, 900), 'solid');
});

test('consuming a sample reduces both its amount and component ledger proportionally', () => {
  const water = createMaterialSample({ id:'H2O', state:'liquid' }, { amount:4 });
  const remaining = consumeSample(water, 1.5);
  assert.equal(remaining.amount, 2.5);
  assert.equal(remaining.components.H2O, 2.5);
});

test('limiting extent honors reaction coefficients rather than deleting whole samples', () => {
  assert.equal(limitingExtent({ Na:3, H2O:10 }, { Na:2, H2O:2 }), 1.5);
  assert.equal(limitingExtent({ Na:3, H2O:1 }, { Na:2, H2O:2 }), .5);
});

test('a reaction can consume one component of a mixture without deleting its solvent', () => {
  const water = createMaterialSample({ id: 'H2O', state: 'liquid', miscibleGroup: 'polar' }, { amount: 4 });
  const ethanol = createMaterialSample({ id: 'C2H5OH', state: 'liquid', miscibleGroup: 'polar' }, { amount: 2 });
  const mixture = combineSamples(water, ethanol);
  const remaining = consumeComponent(mixture, 'H2O', 1.5);
  assert.equal(remaining.amount, 4.5);
  assert.deepEqual(remaining.components, { H2O: 2.5, C2H5OH: 2 });
});
