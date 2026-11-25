export function heldDragPosition(drag, mouse) {
  return { x: mouse.x - drag.offset.x, y: mouse.y - drag.offset.y };
}

export function heldDragRotation(code, isDragging) {
  if (!isDragging) return 0;
  if (code === 'KeyD') return 1;
  if (code === 'KeyA') return -1;
  return 0;
}
