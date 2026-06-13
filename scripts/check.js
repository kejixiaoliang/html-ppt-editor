const fs = require("fs");

const requiredSnippets = {
  "index.html": [
    "HTML Studio",
    'id="workspace"',
    'id="folderInput"',
    'id="imageReplaceInput"',
    'id="downloadZipBtn"',
    "webkitdirectory",
    'id="sourceRailBtn"',
    'id="previewStage"',
    'data-canvas-mode="16:9"',
    'data-zoom-mode="fit"',
    'id="italicBtn"',
    'id="underlineBtn"',
    'id="strikeBtn"',
    'id="floatingToolbar"',
    'id="toolbarSelectionLabel"',
    'id="quickTextColorInput"',
    'id="quickBackgroundColorInput"',
    'id="quickFontSizeInput"',
    'id="quickTextPresetSelect"',
    'class="toolbar-group"',
    'class="toolbar-divider"',
    'data-quick-input="color"',
    'data-quick-input="font-size"',
    'data-quick-select="text-preset"',
    'data-quick-action="copy-style"',
    'data-quick-action="paste-style"',
    'data-quick-action="clear-style"',
    'id="draftBar"',
    "科技小亮AGI",
    "https://github.com/kejixiaoliang",
    "sandbox",
    "导出 HTML",
  ],
  "styles.css": [
    "--app-height",
    "--workspace-height",
    ".workspace.source-collapsed",
    ".source-rail-button",
    ".developer-strip",
    ".github-link",
    ".floating-toolbar",
    ".toolbar-chip",
    ".toolbar-group",
    ".toolbar-divider",
    ".quick-button.is-active",
    ".draft-bar",
    ".format-toolbar",
    ".preview-stage",
    "transform-origin: top left",
    "overflow: hidden",
    ".slide-viewport",
    "@media (max-width: 920px)",
  ],
  "app.js": [
    'from "./src/inspectorControls.js"',
    'import * as canvasLayout from "./src/canvasLayout.js"',
    'import * as previewBridge from "./src/previewBridge.js"',
    'import * as sourceMapping from "./src/sourceMapping.js"',
    'import * as stateHistory from "./src/stateHistory.js"',
    'import { createProjectPreviewHtml, importHtmlFolder } from "./src/folderImport.js"',
    'applyImageFocusStyle',
    'import { buildProjectZipEntries, createZipBlob } from "./src/projectArchive.js"',
    "function setAppViewportHeight",
    "function setWorkspaceHeight",
    "function stabilizeInitialLayout",
    "function syncElementToSource",
    "function applySelectedElementChange",
    "function positionFloatingToolbar",
    "function updateFloatingToolbarState",
    "function applyQuickInput",
    "function applyQuickTextPreset",
    "function applyInlineTextEdit",
    "function syncQuickToolbarControls",
    "function copySelectedInlineStyle",
    "function pasteSelectedInlineStyle",
    "function clearSelectedInlineStyle",
    "function scheduleAutosave",
    "function restoreDraft",
    "function handleFolderUpload",
    "function replaceSelectedProjectImage",
    "function applyPreviewImageFocus",
    "function openImageReplacementPicker",
    "function downloadProjectZip",
    "function downloadBlob",
    "sourceMap: null",
    "sourceMapping.findElementSourceRange",
    "sourceMapping.syncElementToSource",
    "sourceMapping.buildSourceMap",
    "const exportSource = createProjectPreviewHtml",
    "new Blob([exportSource]",
    "function observeLayoutChanges",
    "canvasLayout.updateCanvasScale",
    "function toggleSourcePanel()",
    "function capturePreviewScroll()",
    "function restorePreviewScroll",
    "function bindTextDecorationToggle",
    "function applyCanvasState()",
    "function updateCanvasScale()",
  ],
  "src/sourceMapping.js": [
    "export function buildSourceMap",
    "export function findElementSourceRange",
    "export function syncElementToSource",
    "export function findElementContentRange",
    "export function getElementIndexPath",
    "function rangeStillMatches",
  ],
  "src/previewBridge.js": ["export function injectPreviewBridge", "window.__selectEditorElement", "contenteditable", "editor:inline-text", "editor:replace-image-drop", "editor:image-focus"],
  "src/canvasLayout.js": [
    "export function applyCanvasState",
    "export function updateCanvasScale",
    "slideViewport.style.width",
    "slideViewport.style.transform = `scale(${scale})`",
    "--canvas-scale",
  ],
  "src/stateHistory.js": ["export function pushHistory", "export function readDraft"],
  "src/inspectorControls.js": ["export const styleControlMap", "export function updateElementOwnText"],
  "src/folderImport.js": ["export async function importHtmlFolder", "export function createProjectPreviewHtml", "export function rewriteHtmlAssetUrls", "export function rewriteCssAssetUrls", "export function rewriteScriptAssetUrls", "export function pickHtmlEntry"],
  "src/projectAssets.js": ["export function findElementAssetPath", "export function addProjectAssetReplacement", "export function updateElementAssetReference", "export function applyImageFocusStyle"],
  "src/projectArchive.js": ["export function buildProjectZipEntries", "export function createZipBlob", "export function createZipBytes"],
  "server/index.js": ["/health", "text/html;charset=utf-8"],
  "README.md": ["npm start", "http://localhost:5178", "导出 HTML"],
  "docs/deploy-baota.md": ["腾讯云轻量服务器", "宝塔面板", "子域名", "SSL", "/www/wwwroot"],
};

for (const [file, snippets] of Object.entries(requiredSnippets)) {
  const content = fs.readFileSync(file, "utf8");
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(`${file} is missing required snippet: ${snippet}`);
    }
  }
}

const html = fs.readFileSync("index.html", "utf8");
if (html.includes('<span aria-hidden="true">→</span>')) {
  throw new Error("Upload button should not contain the old arrow icon.");
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  throw new Error(`Duplicate id values: ${[...new Set(duplicates)].join(", ")}`);
}

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const readme = fs.readFileSync("README.md", "utf8");

const forbiddenSourceRewriteSnippets = [
  "function syncSourceFromDoc",
  "function formatHtmlForMvp",
  "formatHtmlForMvp(",
  "new Blob([`<!doctype html>\\n${doc.documentElement.outerHTML}`",
];
for (const snippet of forbiddenSourceRewriteSnippets) {
  if (app.includes(snippet)) {
    throw new Error(`app.js contains forbidden source-rewriting snippet: ${snippet}`);
  }
}

const forbiddenQuickStyleSnippets = [
  "快速样式",
  "data-preset",
  "presetButtons",
  "applyStylePreset",
  "preset-card",
  "preset-grid",
  "preset-button",
];
for (const snippet of forbiddenQuickStyleSnippets) {
  if (html.includes(snippet) || app.includes(snippet) || styles.includes(snippet) || readme.includes(snippet)) {
    throw new Error(`Quick style preset feature should be removed: ${snippet}`);
  }
}

const forbiddenClassicTechColors = [
  "#1456d9",
  "#0d3f9f",
  "#2563eb",
  "#1d4ed8",
  "#6f7f3f",
  "#4e5f2d",
  "20, 86, 217",
  "37, 99, 235",
  "111, 127, 63",
];
for (const color of forbiddenClassicTechColors) {
  if (styles.includes(color) || app.includes(color)) {
    throw new Error(`Classic blue/purple/dead-green tech color should not be used: ${color}`);
  }
}

const requiredPaletteSnippets = ["--accent: #b66a58", "--select: #c5944a", "--bg: #eef0ee"];
for (const snippet of requiredPaletteSnippets) {
  if (!styles.includes(snippet)) {
    throw new Error(`Expected refined palette snippet missing: ${snippet}`);
  }
}

console.log("Static product checks passed.");
