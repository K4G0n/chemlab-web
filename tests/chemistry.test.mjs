import test from 'node:test';
import assert from 'node:assert/strict';
import { screenToWorld, supportedReaction, REACTION_RULES, materialProfile } from '../chemistry.js';

test('screenToWorld maps cursor position through pan and zoom', () => {
  assert.deepEqual(screenToWorld({ x: 500, y: 300 }, { x: 100, y: 50, zoom: 2 }), { x: 200, y: 125 });
});

test('sodium plus water is a documented supported rule at ordinary conditions', () => {
  const result = supportedReaction(['Na', 'H2O'], { temperatureK: 293, pressureAtm: 1 });
  assert.equal(result?.id, 'sodium-water');
  assert.equal(result?.equation, '2Na + 2H₂O → 2NaOH + H₂↑');
});

test('unsupported contact never fabricates a reaction', () => {
  assert.equal(supportedReaction(['Au', 'H2O'], { temperatureK: 293, pressureAtm: 1 }), null);
});

test('reaction catalog has a balanced curated spread across education-safe categories', () => {
  assert.ok(REACTION_RULES.length >= 35);
  const categories = new Set(REACTION_RULES.map((rule) => rule.category));
  for (const category of ['water reaction', 'neutralization', 'gas formation', 'precipitation', 'displacement', 'dissolution', 'combustion', 'decomposition', 'addition', 'synthesis']) {
    assert.ok(categories.has(category), `Missing ${category}`);
  }
  for (const rule of REACTION_RULES) {
    assert.ok(rule.equation.includes('→'));
    assert.ok(rule.explanation.length > 30);
    assert.ok(rule.reactants.length >= 1);
    assert.ok(rule.products.length >= 1);
  }
});

test('reaction lookup is order-independent and respects rule conditions', () => {
  assert.equal(supportedReaction(['NaOH', 'HCl'], { temperatureK: 293, pressureAtm: 1 })?.id, 'hcl-naoh');
  assert.equal(supportedReaction(['NaHCO3', 'HCl'], { temperatureK: 293, pressureAtm: 1 })?.id, 'hcl-sodium-bicarbonate');
  assert.equal(supportedReaction(['Na', 'H2O'], { temperatureK: 700, pressureAtm: 1 }), null);
});

test('material profiles distinguish solid, liquid, and gas simulation behavior', () => {
  assert.equal(materialProfile({ id: 'H2O', state: 'liquid', density: 1 }).representation, 'liquid');
  assert.ok(materialProfile({ id: 'C2H5OH', state: 'liquid', density: .789 }).viscosity > materialProfile({ id: 'H2O', state: 'liquid', density: 1 }).viscosity);
  assert.equal(materialProfile({ id: 'CO2', state: 'gas', density: .001977 }).representation, 'gas-cloud');
  assert.equal(materialProfile({ id: 'NaCl', state: 'solid', density: 2.16 }).representation, 'crystal');
});
