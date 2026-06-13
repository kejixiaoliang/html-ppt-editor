import assert from "node:assert/strict";
import {
  buildProjectZipEntries,
  createZipBytes,
} from "../src/projectArchive.js";

const projectFiles = new Map([
  ["site/index.html", { path: "site/index.html", type: "text", content: "<h1>old</h1>" }],
  ["site/styles.css", { path: "site/styles.css", type: "text", content: "body { color: red; }" }],
  ["site/public/images/avatar.png", {
    path: "site/public/images/avatar.png",
    type: "binary",
    bytes: new Uint8Array([137, 80, 78, 71]),
  }],
]);

const entries = buildProjectZipEntries({
  source: "<h1>edited</h1>",
  entryPath: "site/index.html",
  projectFiles,
});

assert.equal(entries.length, 3);
assert.equal(entries.find((entry) => entry.path === "site/index.html").content, "<h1>edited</h1>");
assert.equal(entries.find((entry) => entry.path === "site/styles.css").content, "body { color: red; }");
assert.deepEqual(
  [...entries.find((entry) => entry.path === "site/public/images/avatar.png").content],
  [137, 80, 78, 71]
);

const zipBytes = createZipBytes(entries);
const zipText = new TextDecoder("latin1").decode(zipBytes);
assert.equal(zipBytes[0], 0x50);
assert.equal(zipBytes[1], 0x4b);
assert.match(zipText, /site\/index\.html/);
assert.match(zipText, /site\/styles\.css/);
assert.match(zipText, /site\/public\/images\/avatar\.png/);

console.log("Project archive tests passed.");
