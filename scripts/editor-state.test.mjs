import assert from "node:assert/strict";

import {
  applyImageFocus,
  createImageReplacement,
  syncElementEdit,
  syncInlineTextEdit,
  updateImageReference,
} from "../src/editorActions.js";
import {
  applyImportedProject,
  clearProjectState,
  createProjectState,
  getProjectEntryLabel,
} from "../src/projectState.js";
import {
  getPreviewMessageType,
  isPreviewMessage,
  previewMessageTypes,
} from "../src/previewProtocol.js";
import {
  clearSelectionState,
  createSelectionState,
  selectEditorElement,
  updateSelectionRange,
} from "../src/selectionState.js";

globalThis.Node = { TEXT_NODE: 3 };

const project = createProjectState({ sourceLabel: "示例" });
assert.equal(getProjectEntryLabel(project), "示例");

applyImportedProject(project, {
  sourceLabel: "site/index.html",
  entryPath: "site/index.html",
  assetUrls: new Map([["site/images/a.png", "data:image/png;base64,a"]]),
  projectFiles: new Map(),
});
assert.equal(getProjectEntryLabel(project), "site/index.html");
assert.equal(project.assetUrls.get("site/images/a.png"), "data:image/png;base64,a");

clearProjectState(project, "上传文件");
assert.equal(project.sourceLabel, "上传文件");
assert.equal(project.entryPath, "");
assert.equal(project.assetUrls, null);

const selection = createSelectionState();
selectEditorElement(selection, "el_0001");
updateSelectionRange(selection, { start: 10, end: 20 });
assert.deepEqual(selection, { editorId: "el_0001", range: { start: 10, end: 20 } });
clearSelectionState(selection);
assert.deepEqual(selection, { editorId: null, range: null });

const previewWindow = {};
const event = { source: previewWindow, data: { type: previewMessageTypes.select } };
assert.equal(isPreviewMessage(event, previewWindow), true);
assert.equal(getPreviewMessageType(event), "editor:select");
assert.equal(isPreviewMessage({ source: {}, data: { type: previewMessageTypes.select } }, previewWindow), false);

const sourceElement = { style: {}, textContent: "Old" };
const previewElement = { style: {} };
const editResult = syncElementEdit({
  element: sourceElement,
  previewElement,
  sourceRange: { start: 0, end: 4 },
  mutate: (element) => {
    element.style.color = "#b66a58";
  },
  syncElementToSource: () => true,
});
assert.equal(editResult.ok, true);
assert.equal(sourceElement.style.color, "#b66a58");
assert.equal(previewElement.style.color, "#b66a58");

const textElement = {
  childNodes: [{ nodeType: 3, textContent: "Old" }],
  textContent: "Old",
};
const textResult = syncInlineTextEdit({
  element: textElement,
  text: "New",
  sourceRange: { start: 0, end: 3 },
  syncElementToSource: () => true,
});
assert.equal(textResult.ok, true);
assert.equal(textElement.childNodes[0].textContent, "New");

const assetUrls = new Map([["site/images/a.png", "data:image/png;base64,a"]]);
const projectFiles = new Map();
const replacement = createImageReplacement({
  assetPath: "site/images/a.png",
  replacement: {
    fileName: "b.png",
    dataUrl: "data:image/png;base64,b",
    bytes: new Uint8Array([1, 2]),
    mimeType: "image/png",
  },
  projectState: { entryPath: "site/index.html", sourceLabel: "site/index.html", assetUrls, files: projectFiles },
});
assert.equal(replacement.path, "site/images/b.png");
assert.equal(projectFiles.get("site/images/b.png").mimeType, "image/png");

const imageElement = {
  attrs: { src: "./images/a.png" },
  style: {},
  getAttribute(name) {
    return this.attrs[name] || "";
  },
  setAttribute(name, value) {
    this.attrs[name] = value;
  },
};
assert.equal(
  updateImageReference({
    element: imageElement,
    assetPath: "site/images/a.png",
    replacementPath: "site/images/b.png",
    projectState: { entryPath: "site/index.html", sourceLabel: "site/index.html", assetUrls },
  }),
  true,
);
assert.equal(imageElement.attrs.src, "./images/b.png");

const focusElement = { tagName: "IMG", style: {} };
assert.equal(applyImageFocus(focusElement, { x: 44, y: 55 }), true);
assert.equal(focusElement.style.objectPosition, "44% 55%");

console.log("Editor state tests passed.");
