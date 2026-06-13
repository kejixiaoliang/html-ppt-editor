const MIN_SIZE = 16;

export function createMovePatch({ position, left, top, deltaX, deltaY }) {
  const nextPosition = position && position !== "static" ? position : "relative";
  return {
    position: nextPosition,
    left: `${Math.round(parsePx(left) + deltaX)}px`,
    top: `${Math.round(parsePx(top) + deltaY)}px`,
  };
}

export function createResizePatch({ width, height, deltaX, deltaY }) {
  return {
    width: `${Math.max(MIN_SIZE, Math.round(parsePx(width) + deltaX))}px`,
    height: `${Math.max(MIN_SIZE, Math.round(parsePx(height) + deltaY))}px`,
  };
}

export function createLayerPatch({ action, currentZIndex, siblingZIndexes = [] }) {
  const current = normalizeZIndex(currentZIndex);
  const siblingValues = siblingZIndexes.map(normalizeZIndex);
  const max = Math.max(0, ...siblingValues);
  const min = Math.min(0, ...siblingValues);

  if (action === "front") {
    return { position: "relative", zIndex: String(max + 1) };
  }
  if (action === "back") {
    return { position: "relative", zIndex: String(min - 1) };
  }
  if (action === "forward") {
    return { zIndex: String(current + 1) };
  }
  if (action === "backward") {
    return { zIndex: String(current - 1) };
  }
  return {};
}

export function applyStylePatch(element, patch) {
  if (!element || !patch) return;
  for (const [property, value] of Object.entries(patch)) {
    element.style[property] = value;
  }
}

function parsePx(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeZIndex(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
