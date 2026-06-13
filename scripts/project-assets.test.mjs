import assert from "node:assert/strict";
import {
  findElementAssetPath,
  addProjectAssetReplacement,
  updateElementAssetReference,
} from "../src/projectAssets.js";

const assetUrls = new Map([
  ["site/public/images/avatar.png", "data:image/png;base64,old"],
  ["site/images/bg.png", "data:image/png;base64,bg"],
]);
const projectFiles = new Map([
  ["site/public/images/avatar.png", {
    path: "site/public/images/avatar.png",
    type: "binary",
    bytes: new Uint8Array([1, 2, 3]),
  }],
]);

assert.equal(
  findElementAssetPath(
    {
      getAttribute: (name) => (name === "data-image" ? "./public/images/avatar.png" : ""),
      style: {},
    },
    "site/index.html",
    assetUrls,
  ),
  "site/public/images/avatar.png",
  "data-image should resolve to an imported project asset"
);

assert.equal(
  findElementAssetPath(
    {
      getAttribute: (name) => (name === "src" ? "../images/bg.png?v=1" : ""),
      style: {},
    },
    "site/pages/about.html",
    assetUrls,
  ),
  "site/images/bg.png",
  "relative src values should resolve from the entry path"
);

assert.equal(
  findElementAssetPath(
    {
      getAttribute: () => "",
      style: { backgroundImage: 'url("./images/bg.png")' },
    },
    "site/index.html",
    assetUrls,
  ),
  "site/images/bg.png",
  "inline background images should resolve to a project asset"
);

const replacement = addProjectAssetReplacement({
  originalPath: "site/public/images/avatar.png",
  fileName: "new-avatar.webp",
  dataUrl: "data:image/webp;base64,new",
  bytes: new Uint8Array([9, 8, 7]),
  mimeType: "image/webp",
  assetUrls,
  projectFiles,
});

assert.equal(replacement.path, "site/public/images/new-avatar.webp");
assert.equal(assetUrls.get("site/public/images/avatar.png"), "data:image/png;base64,old");
assert.equal(assetUrls.get("site/public/images/new-avatar.webp"), "data:image/webp;base64,new");
assert.deepEqual([...projectFiles.get("site/public/images/avatar.png").bytes], [1, 2, 3]);
assert.deepEqual([...projectFiles.get("site/public/images/new-avatar.webp").bytes], [9, 8, 7]);
assert.equal(projectFiles.get("site/public/images/new-avatar.webp").mimeType, "image/webp");

const imageElement = {
  attrs: { "data-image": "./public/images/avatar.png" },
  style: {},
  getAttribute(name) {
    return this.attrs[name] || "";
  },
  setAttribute(name, value) {
    this.attrs[name] = value;
  },
};
assert.equal(
  updateElementAssetReference(imageElement, {
    oldPath: "site/public/images/avatar.png",
    newPath: "site/public/images/new-avatar.webp",
    entryPath: "site/index.html",
    assetUrls,
  }),
  true
);
assert.equal(imageElement.attrs["data-image"], "./public/images/new-avatar.webp");

console.log("Project asset tests passed.");
