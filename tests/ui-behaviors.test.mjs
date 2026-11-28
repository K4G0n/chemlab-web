import test from 'node:test';
import assert from 'node:assert/strict';
import { labelLayout, normalSpawnCount, normalizedControlValue } from '../ui-behaviors.js';

test('normal-mode liquid spawning creates one physical sample', () => {
  assert.equal(normalSpawnCount('normal', 'compound', { representation:'liquid', dropletCount:5 }), 1);
  assert.equal(normalSpawnCount('quantum', 'compound', { representation:'liquid', dropletCount:5 }), 1);
  assert.equal(normalSpawnCount('normal', 'compound', { representation:'gas-cloud', dropletCount:4 }), 4);
});

test('an overlong formula moves outside the body in a high-contrast color', () => {
  assert.deepEqual(labelLayout(70, 74), { inside:false, color:'#e9f4ff' });
  assert.deepEqual(labelLayout(50, 74), { inside:true, color:'#08121c' });
});

test('typed condition values clamp to each control range and snap to its step', () => {
  assert.equal(normalizedControlValue('1601', { min:4, max:1500, step:1 }), 1500);
  assert.equal(normalizedControlValue('2.236', { min:.1, max:5, step:.01 }), 2.24);
  assert.equal(normalizedControlValue('not-a-number', { min:0, max:20, step:.1, fallback:1 }), 1);
});
