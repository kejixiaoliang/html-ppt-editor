const htmlFilePattern = /\.html?$/i;
const urlAttributePattern = /\b(src|href|poster|data-image)\s*=\s*(["'])([^"']+)\2/gi;
const srcsetPattern = /\bsrcset\s*=\s*(["'])([^"']+)\1/gi;
const cssUrlPattern = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
const scriptStringPattern = /(["'`])((?:\.{1,2}\/|\/)[^"'`\s]+?\.(?:png|jpe?g|gif|webp|svg|avif|ico|css|js|mjs|woff2?|ttf|otf)(?:[?#][^"'`\s]*)?)\1/gi;

export function normalizeImportPath(path) {
  if (!path) return "";
  const normalized = String(path).replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = [];
  for (const part of normalized.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return parts.join("/");
}

export function getImportFilePath(file) {
  return normalizeImportPath(file?.webkitRelativePath || file?.relativePath || file?.name || "");
}

export function pickHtmlEntry(files) {
  const htmlFiles = Array.from(files || [])
    .map((file) => ({ file, relativePath: getImportFilePath(file) }))
    .filter((entry) => htmlFilePattern.test(entry.relativePath || entry.file?.name || ""));

  if (!htmlFiles.length) return null;

  const rootIndexes = htmlFiles.filter((entry) => /(^|\/)index\.html?$/i.test(entry.relativePath));
  return rootIndexes.sort((a, b) => pathDepth(a.relativePath) - pathDepth(b.relativePath))[0] || htmlFiles[0];
}

export function rewriteHtmlAssetUrls(html, entryPath, assetUrls) {
  const entryDirectory = getDirectory(entryPath);
  const rootDirectory = getRootDirectory(entryPath);

  return String(html || "")
    .replace(urlAttributePattern, (match, attributeName, quote, rawUrl) => {
      const replacement = resolveAssetUrl(rawUrl, entryDirectory, rootDirectory, assetUrls);
      return replacement ? `${attributeName}=${quote}${replacement}${quote}` : match;
    })
    .replace(srcsetPattern, (match, quote, value) => {
      const replacement = rewriteSrcset(value, entryDirectory, rootDirectory, assetUrls);
      return replacement === value ? match : `srcset=${quote}${replacement}${quote}`;
    })
    .replace(cssUrlPattern, (match, quote, rawUrl) => {
      const replacement = resolveAssetUrl(rawUrl, entryDirectory, rootDirectory, assetUrls);
      return replacement ? `url(${quote}${replacement}${quote})` : match;
    });
}

export function rewriteCssAssetUrls(css, cssPath, assetUrls) {
  const cssDirectory = getDirectory(cssPath);
  const rootDirectory = getRootDirectory(cssPath);

  return String(css || "").replace(cssUrlPattern, (match, quote, rawUrl) => {
    const replacement = resolveAssetUrl(rawUrl, cssDirectory, rootDirectory, assetUrls);
    return replacement ? `url(${quote || '"'}${replacement}${quote || '"'})` : match;
  });
}

export function rewriteScriptAssetUrls(script, scriptPath, assetUrls) {
  const scriptDirectory = getDirectory(scriptPath);
  const rootDirectory = getRootDirectory(scriptPath);

  return String(script || "").replace(scriptStringPattern, (match, quote, rawUrl) => {
    const replacement = resolveAssetUrl(rawUrl, scriptDirectory, rootDirectory, assetUrls);
    return replacement ? `${quote}${replacement}${quote}` : match;
  });
}

export async function importHtmlFolder(files) {
  const fileList = Array.from(files || []);
  const entry = pickHtmlEntry(fileList);
  if (!entry) {
    throw new Error("请选择包含 .html 或 .htm 文件的文件夹。");
  }

  const assetUrls = new Map();
  const cssFiles = [];
  const scriptFiles = [];
  await Promise.all(
    fileList.map(async (file) => {
      const relativePath = getImportFilePath(file);
      if (!relativePath || file === entry.file) return;
      if (isCssPath(relativePath)) {
        cssFiles.push({ file, relativePath });
        return;
      }
      if (isScriptPath(relativePath)) {
        scriptFiles.push({ file, relativePath });
        return;
      }
      assetUrls.set(relativePath, await readAsDataUrl(file));
    })
  );
  await Promise.all(
    cssFiles.map(async ({ file, relativePath }) => {
      const css = await readAsText(file);
      const rewrittenCss = rewriteCssAssetUrls(css, relativePath, assetUrls);
      assetUrls.set(relativePath, textToDataUrl(rewrittenCss, "text/css"));
    })
  );
  await Promise.all(
    scriptFiles.map(async ({ file, relativePath }) => {
      const script = await readAsText(file);
      const rewrittenScript = rewriteScriptAssetUrls(script, relativePath, assetUrls);
      assetUrls.set(relativePath, textToDataUrl(rewrittenScript, "text/javascript"));
    })
  );

  const source = await readAsText(entry.file);
  return {
    html: rewriteHtmlAssetUrls(source, entry.relativePath, assetUrls),
    sourceLabel: entry.relativePath,
    entryPath: entry.relativePath,
    assetCount: assetUrls.size,
  };
}

function rewriteSrcset(value, entryDirectory, rootDirectory, assetUrls) {
  return String(value)
    .split(",")
    .map((candidate) => {
      const trimmed = candidate.trim();
      const [url, ...descriptors] = trimmed.split(/\s+/);
      const replacement = resolveAssetUrl(url, entryDirectory, rootDirectory, assetUrls);
      return [replacement || url, ...descriptors].join(" ");
    })
    .join(", ");
}

function resolveAssetUrl(rawUrl, entryDirectory, rootDirectory, assetUrls) {
  const url = String(rawUrl || "").trim();
  if (!url || isExternalOrInlineUrl(url)) return "";

  const noQuery = url.split(/[?#]/)[0];
  const decodedPath = decodeUrlPath(noQuery);
  const normalized = normalizeImportPath(
    url.startsWith("/")
      ? joinRootPath(rootDirectory, decodedPath)
      : `${entryDirectory ? `${entryDirectory}/` : ""}${decodedPath}`
  );
  const replacement = assetUrls.get(normalized);
  return replacement || "";
}

function joinRootPath(rootDirectory, url) {
  const stripped = normalizeImportPath(url);
  if (!rootDirectory || stripped.startsWith(`${rootDirectory}/`)) return stripped;
  return `${rootDirectory}/${stripped}`;
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

function getDirectory(path) {
  const normalized = normalizeImportPath(path);
  const index = normalized.lastIndexOf("/");
  return index === -1 ? "" : normalized.slice(0, index);
}

function getRootDirectory(path) {
  return normalizeImportPath(path).split("/")[0] || "";
}

function pathDepth(path) {
  return normalizeImportPath(path).split("/").length;
}

function isCssPath(path) {
  return /\.css$/i.test(path);
}

function isScriptPath(path) {
  return /\.m?js$/i.test(path);
}

function decodeUrlPath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function textToDataUrl(text, mimeType) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(text)}`;
}

function readAsText(file) {
  return readFile(file, "readAsText");
}

function readAsDataUrl(file) {
  return readFile(file, "readAsDataURL");
}

function readFile(file, method) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("文件读取失败。"));
    reader[method](file);
  });
}
