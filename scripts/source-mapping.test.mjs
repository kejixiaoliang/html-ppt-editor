import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildSourceMap,
  findElementSourceRange,
  findElementOuterSourceRange,
  getElementIndexPath,
} from "../src/sourceMapping.js";

function createElement(tagName, attrs = {}, children = []) {
  const element = {
    attributes: { ...attrs },
    children,
    dataset: {},
    parentElement: null,
    tagName: tagName.toUpperCase(),
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name);
    },
    matches(selector) {
      if (selector === "[data-editor-runtime]") return this.hasAttribute("data-editor-runtime");
      return false;
    },
    querySelectorAll(selector) {
      const results = [];
      const visit = (node) => {
        for (const child of node.children) {
        if (
          selector === "*" ||
          selector === child.tagName.toLowerCase() ||
          (selector === "[data-editor-id]" && child.dataset.editorId)
        ) {
            results.push(child);
          }
          visit(child);
        }
      };
      visit(this);
      return results;
    },
  };
  for (const child of children) {
    child.parentElement = element;
  }
  return element;
}

function createDocument(bodyChildren) {
  return {
    body: createElement("body", {}, bodyChildren),
    querySelectorAll(selector) {
      return this.body.querySelectorAll(selector);
    },
  };
}

function markEditorIds(root) {
  root.querySelectorAll("*").forEach((element, index) => {
    element.dataset.editorId = `el_${String(index + 1).padStart(4, "0")}`;
  });
}

const repeatedSource = `<!doctype html>
<html>
  <body>
    <section class="card" data-kind="first">
      <h2 class="title">Same heading</h2>
      <p>First body</p>
    </section>
    <section data-kind="second" class="card">
      <h2 class="title">Same heading</h2>
      <p>Second body</p>
    </section>
  </body>
</html>`;

const doc = createDocument([
  createElement("section", { class: "card", "data-kind": "first" }, [
    createElement("h2", { class: "title" }),
    createElement("p"),
  ]),
  createElement("section", { "data-kind": "second", class: "card" }, [
    createElement("h2", { class: "title" }),
    createElement("p"),
  ]),
]);
markEditorIds(doc);

const secondTitle = doc.querySelectorAll("h2")[1];
const sourceMap = buildSourceMap(repeatedSource, doc);
const range = findElementSourceRange(repeatedSource, doc, secondTitle, sourceMap);

assert.ok(range, "expected a source range for the second repeated title");
assert.equal(
  repeatedSource.slice(range.start, range.end),
  '<h2 class="title">',
  "range should point to the second heading, not the first duplicate",
);
assert.ok(
  range.start > repeatedSource.indexOf('data-kind="second"'),
  "range should be anchored inside the second section",
);
assert.deepEqual(getElementIndexPath(secondTitle), [1, 0]);

const secondSection = doc.querySelectorAll("section")[1];
const sectionRange = findElementOuterSourceRange(repeatedSource, doc, secondSection, sourceMap);
assert.ok(sectionRange, "expected a complete outer range for the second section");
assert.ok(
  repeatedSource.slice(sectionRange.start, sectionRange.end).includes("<p>Second body</p>"),
  "outer range should include the selected section content, not only the opening tag",
);
assert.ok(
  repeatedSource.slice(sectionRange.start, sectionRange.end).trim().endsWith("</section>"),
  "outer range should end after the matching closing tag",
);

const app = readFileSync("app.js", "utf8");
assert.match(app, /import\s+.+sourceMapping\.js/, "app.js should use the source mapping module");
assert.match(app, /import\s+.+previewBridge\.js/, "app.js should use the preview bridge module");
assert.match(app, /import\s+.+canvasLayout\.js/, "app.js should use the canvas layout module");
assert.match(app, /import\s+.+stateHistory\.js/, "app.js should use the state/history module");
assert.ok(app.includes('from "./src/inspectorControls.js"'), "app.js should use the inspector controls module");
