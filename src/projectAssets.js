import { normalizeImportPath } from "./folderImport.js";

const assetAttributes = ["data-image", "src", "poster", "href"];
const cssUrlPattern = /url\(\s*(["']?)([^"')]+)\1\s*\)/i;

export function findElementAssetPath(element, entryPath, assetUrls) {
  if (!element || !assetUrls?.size) return "";

  for (const attributeName of assetAttributes) {
    const rawValue = element.getAttribute?.(attributeName);
    const resolved = resolveProjectAssetPath(rawValue, entryPath, assetUrls);
    if (resolved) return resolved;
  }

  const inlineBackground = element.style?.backgroundImage || element.style?.background || "";
  const match = String(inlineBackground).match(cssUrlPattern);
  return resolveProjectAssetPath(match?.[2], entryPath, assetUrls);
}

export function resolveProjectAssetPath(rawUrl, entryPath, assetUrls) {
  const url = String(rawUrl || "").trim();
  if (!url || isExternalOrInlineUrl(url)) return "";

  const pathOnly = decodeUrlPath(url.split(/[?#]/)[0]);
  const entryDirectory = getDirectory(entryPath);
  const rootDirectory = getRootDirectory(entryPath);
  const candidates = [];

  if (url.startsWith("/")) {
    const rootRelative = normalizeImportPath(pathOnly);
    candidates.push(rootRelative);
    if (rootDirectory) candidates.push(normalizeImportPath(`${rootDirectory}/${rootRelative}`));
  } else {
    candidates.push(normalizeImportPath(`${entryDirectory ? `${entryDirectory}/` : ""}${pathOnly}`));
  }

  return candidates.find((candidate) => assetUrls.has(candidate)) || "";
}

export function replaceProjectAsset({ path, dataUrl, bytes, mimeType, assetUrls, projectFiles }) {
  if (!path || !dataUrl || !bytes || !assetUrls?.has(path)) return false;
  assetUrls.set(path, dataUrl);
  projectFiles?.set(path, {
    path,
    type: "binary",
    bytes,
    mimeType: mimeType || guessMimeType(dataUrl),
  });
  return true;
}

export function addProjectAssetReplacement({
  originalPath,
  fileName,
  dataUrl,
  bytes,
  mimeType,
  assetUrls,
  projectFiles,
}) {
  if (!originalPath || !fileName || !dataUrl || !bytes || !assetUrls?.has(originalPath)) return null;
  const directory = getDirectory(originalPath);
  const replacementPath = normalizeImportPath(`${directory ? `${directory}/` : ""}${sanitizeFileName(fileName)}`);
  assetUrls.set(replacementPath, dataUrl);
  projectFiles?.set(replacementPath, {
    path: replacementPath,
    type: "binary",
    bytes,
    mimeType: mimeType || guessMimeType(dataUrl),
  });
  return { path: replacementPath };
}

export function updateElementAssetReference(element, { oldPath, newPath, entryPath, assetUrls }) {
  if (!element || !oldPath || !newPath) return false;

  for (const attributeName of assetAttributes) {
    const rawValue = element.getAttribute?.(attributeName);
    if (resolveProjectAssetPath(rawValue, entryPath, assetUrls) !== oldPath) continue;
    element.setAttribute(attributeName, buildRelativeAssetUrl(newPath, entryPath, rawValue));
    return true;
  }

  const inlineBackground = element.style?.backgroundImage || element.style?.background || "";
  const match = String(inlineBackground).match(cssUrlPattern);
  if (resolveProjectAssetPath(match?.[2], entryPath, assetUrls) !== oldPath) return false;
  const quote = match[1] || '"';
  const nextUrl = buildRelativeAssetUrl(newPath, entryPath, match[2]);
  element.style.backgroundImage = String(inlineBackground).replace(cssUrlPattern, `url(${quote}${nextUrl}${quote})`);
  return true;
}

export function buildRelativeAssetUrl(assetPath, entryPath, previousRawUrl = "") {
  const entryDirectory = getDirectory(entryPath);
  const relative = relativePath(entryDirectory, assetPath);
  if (String(previousRawUrl).startsWith("./") && !relative.startsWith("../")) return `./${relative}`;
  if (String(previousRawUrl).startsWith("/")) return `/${stripRootDirectory(assetPath, getRootDirectory(entryPath))}`;
  return relative;
}

function getDirectory(path) {
  const normalized = normalizeImportPath(path);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

function relativePath(fromDirectory, toPath) {
  const fromParts = normalizeImportPath(fromDirectory).split("/").filter(Boolean);
  const toParts = normalizeImportPath(toPath).split("/").filter(Boolean);
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  return [...fromParts.map(() => ".."), ...toParts].join("/") || ".";
}

function stripRootDirectory(path, rootDirectory) {
  const normalized = normalizeImportPath(path);
  if (!rootDirectory || !normalized.startsWith(`${rootDirectory}/`)) return normalized;
  return normalized.slice(rootDirectory.length + 1);
}

function getRootDirectory(path) {
  return normalizeImportPath(path).split("/")[0] || "";
}

function decodeUrlPath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function isExternalOrInlineUrl(url) {
  return (
    url.startsWith("#") ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ||
    /^\/\//.test(url)
  );
}

function guessMimeType(dataUrl) {
  const match = String(dataUrl).match(/^data:([^;,]+)/);
  return match?.[1] || "application/octet-stream";
}

function sanitizeFileName(fileName) {
  return normalizeImportPath(fileName).split("/").filter(Boolean).pop() || "replacement-image";
}
