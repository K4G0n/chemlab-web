import test from 'node:test';
import assert from 'node:assert/strict';
import { screenToWorld, supportedReaction } from '../chemistry.js';

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
