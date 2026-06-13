import assert from "node:assert/strict";

import {
  createLayerPatch,
  createMovePatch,
  createResizePatch,
} from "../src/visualEditing.js";

assert.deepEqual(
  createMovePatch({
    position: "static",
    left: "auto",
    top: "auto",
    deltaX: 18.4,
    deltaY: -7.6,
  }),
  {
    position: "relative",
    left: "18px",
    top: "-8px",
  },
  "static elements should become relatively movable with rounded offsets",
);

assert.deepEqual(
  createMovePatch({
    position: "absolute",
    left: "42px",
    top: "11px",
    deltaX: -12,
    deltaY: 20,
  }),
  {
    position: "absolute",
    left: "30px",
    top: "31px",
  },
  "positioned elements should preserve their positioning mode while moving",
);

assert.deepEqual(
  createResizePatch({
    width: "84px",
    height: "32px",
    deltaX: -90,
    deltaY: 21,
  }),
  {
    width: "16px",
    height: "53px",
  },
  "resizing should clamp tiny elements to a usable handle target",
);

assert.deepEqual(
  createLayerPatch({
    action: "front",
    currentZIndex: "auto",
    siblingZIndexes: ["auto", "3", "12"],
  }),
  {
    position: "relative",
    zIndex: "13",
  },
  "bring-to-front should move above sibling z-index values and ensure stacking applies",
);

assert.deepEqual(
  createLayerPatch({
    action: "backward",
    currentZIndex: "5",
    siblingZIndexes: ["1", "5", "9"],
  }),
  {
    zIndex: "4",
  },
  "send-backward should lower the current z-index by one step",
);
