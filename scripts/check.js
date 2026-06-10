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
    "sandbox",
    "导出 HTML",
  ],
  "styles.css": [
    ".workspace.source-collapsed",
    ".source-rail-button",
    ".format-toolbar",
    ".preview-stage",
    ".slide-viewport",
    "@media (max-width: 920px)",
  ],
  "app.js": [
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
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) {
  throw new Error(`Duplicate id values: ${[...new Set(duplicates)].join(", ")}`);
}

console.log("Static product checks passed.");
