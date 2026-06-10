const fs = require("fs");

const requiredSnippets = {
  "index.html": [
    "HTML Studio",
    'id="workspace"',
    'id="sourceRailBtn"',
    'id="previewStage"',
    'data-canvas-mode="16:9"',
    'data-zoom-mode="fit"',
    'id="italicBtn"',
    'id="underlineBtn"',
    'id="strikeBtn"',
    "公众号",
    "科技小亮AGI",
    "https://github.com/kejixiaoliang",
    "sandbox",
    "导出 HTML",
  ],
  "styles.css": [
    ".workspace.source-collapsed",
    ".source-rail-button",
    ".developer-strip",
    ".github-link",
    ".format-toolbar",
    ".preview-stage",
    "overflow: hidden",
    ".slide-viewport",
    "@media (max-width: 920px)",
  ],
  "app.js": [
    "function syncElementToSource",
    "function findElementContentRange",
    "new Blob([sourceEditor.value]",
    "function observeLayoutChanges",
    "function getCanvasBaseSize",
    "function toggleSourcePanel()",
    "function capturePreviewScroll()",
    "function restorePreviewScroll",
    "function bindTextDecorationToggle",
    "function applyCanvasState()",
    "function updateCanvasScale()",
  ],
  "server/index.js": ["/health", "text/html;charset=utf-8"],
  "README.md": ["npm start", "http://localhost:5178", "导出 HTML"],
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
if (html.includes("<span aria-hidden=\"true\">↑</span>")) {
  throw new Error("Upload button should not contain the old arrow icon.");
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  throw new Error(`Duplicate id values: ${[...new Set(duplicates)].join(", ")}`);
}

const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const forbiddenAppSnippets = [
  "function syncSourceFromDoc",
  "function formatHtmlForMvp",
  "formatHtmlForMvp(",
  "new Blob([`<!doctype html>\\n${doc.documentElement.outerHTML}`",
];
for (const snippet of forbiddenAppSnippets) {
  if (app.includes(snippet)) {
    throw new Error(`app.js contains forbidden source-rewriting snippet: ${snippet}`);
  }
}

const forbiddenClassicTechColors = [
  "#1456d9",
  "#0d3f9f",
  "#2563eb",
  "#1d4ed8",
  "20, 86, 217",
  "37, 99, 235",
];
for (const color of forbiddenClassicTechColors) {
  if (styles.includes(color) || app.includes(color)) {
    throw new Error(`Classic blue/purple tech color should not be used: ${color}`);
  }
}

console.log("Static product checks passed.");
