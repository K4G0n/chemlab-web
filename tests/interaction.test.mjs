import test from 'node:test';
import assert from 'node:assert/strict';
import { heldDragPosition, heldDragRotation, shouldReleaseHeldDrag } from '../interaction.js';

test('held drag keeps the grabbed offset beneath the current mouse position', () => {
  assert.deepEqual(
    heldDragPosition({ offset: { x: 12, y: -4 } }, { x: 300, y: 200 }),
    { x: 288, y: 204 }
  );
});

test('only the left pointer that started a drag can release it', () => {
  assert.equal(shouldReleaseHeldDrag({ pointerId: 4, button: 0 }, { pointerId: 4, button: 0 }), true);
  assert.equal(shouldReleaseHeldDrag({ pointerId: 4, button: 0 }, { pointerId: 9, button: 0 }), false);
  assert.equal(shouldReleaseHeldDrag({ pointerId: 4, button: 0 }, { pointerId: 4, button: 2 }), false);
});

test('A and D only rotate an object while it is actively held', () => {
  assert.equal(heldDragRotation('KeyA', true), -1);
  assert.equal(heldDragRotation('KeyD', true), 1);
  assert.equal(heldDragRotation('KeyD', false), 0);
  assert.equal(heldDragRotation('KeyR', true), 0);
});
