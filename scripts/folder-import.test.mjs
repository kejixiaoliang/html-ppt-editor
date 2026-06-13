import assert from "node:assert/strict";
import {
  importHtmlFolder,
  pickHtmlEntry,
  rewriteHtmlAssetUrls,
  normalizeImportPath,
  rewriteCssAssetUrls,
  rewriteScriptAssetUrls,
} from "../src/folderImport.js";

const files = [
  { name: "cover.png", webkitRelativePath: "deck/assets/cover.png", type: "image/png" },
  { name: "theme.css", webkitRelativePath: "deck/styles/theme.css", type: "text/css" },
  { name: "index.html", webkitRelativePath: "deck/index.html", type: "text/html" },
  { name: "about.html", webkitRelativePath: "deck/pages/about.html", type: "text/html" },
];

assert.equal(
  pickHtmlEntry(files).relativePath,
  "deck/index.html",
  "folder imports should prefer the root index.html file"
);

assert.equal(normalizeImportPath("deck/./assets/../assets/cover.png"), "deck/assets/cover.png");
assert.equal(normalizeImportPath("/deck/assets/cover.png"), "deck/assets/cover.png");

const html = `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="styles/theme.css">
    <style>
      .hero { background-image: url("./assets/cover.png"); }
      .cdn { background: url("https://example.com/remote.png"); }
    </style>
  </head>
  <body>
    <img src="assets/cover.png">
    <div class="image-slot" data-image="./assets/cover.png"></div>
    <a href="#slide-2">jump</a>
    <script src="/deck/scripts/app.js"></script>
  </body>
</html>`;

const rewritten = rewriteHtmlAssetUrls(html, "deck/index.html", new Map([
  ["deck/assets/cover.png", "data:image/png;base64,cover"],
  ["deck/styles/theme.css", "data:text/css;base64,theme"],
  ["deck/scripts/app.js", "data:text/javascript;base64,app"],
]));

assert.match(rewritten, /src="data:image\/png;base64,cover"/);
assert.match(rewritten, /data-image="data:image\/png;base64,cover"/);
assert.match(rewritten, /href="data:text\/css;base64,theme"/);
assert.match(rewritten, /url\("data:image\/png;base64,cover"\)/);
assert.match(rewritten, /src="data:text\/javascript;base64,app"/);
assert.match(rewritten, /href="#slide-2"/, "hash links should stay editable as links");
assert.match(rewritten, /https:\/\/example\.com\/remote\.png/, "remote URLs should not be inlined");

const encodedHtml = `<img src="assets/%E5%B0%81%E9%9D%A2%201.png?v=2">`;
const encodedRewritten = rewriteHtmlAssetUrls(encodedHtml, "deck/index.html", new Map([
  ["deck/assets/封面 1.png", "data:image/png;base64,encoded"],
]));
assert.equal(
  encodedRewritten,
  `<img src="data:image/png;base64,encoded">`,
  "encoded file names and query strings should resolve to usable data URLs"
);

const rewrittenCss = rewriteCssAssetUrls(
  `.hero { background: url("../images/bg 1.png?v=3") center/cover; }`,
  "deck/styles/theme.css",
  new Map([["deck/images/bg 1.png", "data:image/png;base64,bg"]])
);
assert.equal(
  rewrittenCss,
  `.hero { background: url("data:image/png;base64,bg") center/cover; }`,
  "CSS files should inline their own relative image references before being embedded"
);

const rewrittenScript = rewriteScriptAssetUrls(
  `const works = [{ cover: "./public/images/covers/card.png", url: "https://example.com/post" }];`,
  "deck/app.js",
  new Map([["deck/public/images/covers/card.png", "data:image/png;base64,card"]])
);
assert.equal(
  rewrittenScript,
  `const works = [{ cover: "data:image/png;base64,card", url: "https://example.com/post" }];`,
  "script string asset references should be inlined for runtime-generated images"
);

class MockFileReader {
  readAsText(file) {
    this.result = file.content;
    this.onload();
  }

  readAsDataURL(file) {
    this.result = file.dataUrl;
    this.onload();
  }

  readAsArrayBuffer(file) {
    this.result = file.bytes?.buffer || new Uint8Array().buffer;
    this.onload();
  }
}

globalThis.FileReader = MockFileReader;

const importedProject = await importHtmlFolder([
  {
    name: "index.html",
    webkitRelativePath: "site/index.html",
    content: '<link rel="stylesheet" href="./styles.css"><div data-image="./images/avatar.png"></div>',
  },
  {
    name: "styles.css",
    webkitRelativePath: "site/styles.css",
    content: '.avatar { background: url("./images/avatar.png"); }',
  },
  {
    name: "avatar.png",
    webkitRelativePath: "site/images/avatar.png",
    dataUrl: "data:image/png;base64,avatar",
    bytes: new Uint8Array([1, 2, 3]),
  },
]);

assert.equal(
  importedProject.html,
  '<link rel="stylesheet" href="./styles.css"><div data-image="./images/avatar.png"></div>',
  "folder import should keep the editable source as the original entry HTML"
);
assert.match(importedProject.previewHtml, /href="data:text\/css/);
assert.match(importedProject.previewHtml, /data-image="data:image\/png;base64,avatar"/);
assert.equal(importedProject.assetUrls.get("site/images/avatar.png"), "data:image/png;base64,avatar");
assert.equal(importedProject.projectFiles.get("site/index.html").content, importedProject.html);
assert.equal(importedProject.projectFiles.get("site/styles.css").content, '.avatar { background: url("./images/avatar.png"); }');
assert.deepEqual([...importedProject.projectFiles.get("site/images/avatar.png").bytes], [1, 2, 3]);

console.log("Folder import tests passed.");
