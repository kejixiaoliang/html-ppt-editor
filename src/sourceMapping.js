export function buildSourceMap(source, doc) {
  const ranges = new Map();
  const cleanDoc = cloneCleanDocument(doc);
  let searchCursor = 0;

  doc.body?.querySelectorAll("[data-editor-id]").forEach((element) => {
    const editorId = element.dataset.editorId;
    const path = getElementIndexPath(element);
    const cleanElement = getElementByIndexPath(cleanDoc, path);
    if (!editorId || !cleanElement) return;

    const range = locateOpeningRange(source, cleanElement, searchCursor);
    if (!range) return;

    searchCursor = range.end;
    ranges.set(editorId, {
      ...range,
      editorId,
      path,
      tagName: cleanElement.tagName.toLowerCase(),
      openingTag: getOpeningTag(cleanElement),
    });
  });

  return { ranges };
}

export function findElementSourceRange(source, doc, element, sourceMap) {
  if (!element) return null;
  const editorId = element.dataset?.editorId;
  const cached = editorId ? sourceMap?.ranges?.get(editorId) : null;
  if (cached && rangeStillMatches(source, cached)) {
    return { start: cached.start, end: cached.end, kind: cached.kind };
  }

  const cleanDoc = cloneCleanDocument(doc);
  const cleanElement = getElementByIndexPath(cleanDoc, getElementIndexPath(element));
  if (!cleanElement) return null;

  return locateElementRange(source, cleanElement, []);
}

export function findElementOuterSourceRange(source, doc, element, sourceMap) {
  const openingRange = findElementSourceRange(source, doc, element, sourceMap);
  if (!openingRange) return null;

  const tagName = element.tagName.toLowerCase();
  const openingEnd = source.indexOf(">", openingRange.start);
  if (openingEnd === -1) return null;
  if (isVoidElement(tagName) || source[openingEnd - 1] === "/") {
    return { start: openingRange.start, end: openingEnd + 1, kind: "outer" };
  }

  const tagPattern = new RegExp(`<\\/?${escapeRegExp(tagName)}(\\s|>|/)`, "gi");
  tagPattern.lastIndex = openingEnd + 1;
  let depth = 1;
  let match;

  while ((match = tagPattern.exec(source))) {
    const start = match.index;
    const end = source.indexOf(">", start);
    if (end === -1) return null;
    const token = source.slice(start, end + 1);
    if (token.startsWith(`</`)) {
      depth -= 1;
      if (depth === 0) {
        return { start: openingRange.start, end: end + 1, kind: "outer" };
      }
    } else if (!token.endsWith("/>")) {
      depth += 1;
    }
    tagPattern.lastIndex = end + 1;
  }

  return null;
}

export function syncElementToSource({ source, element, previousRange, patchMode }) {
  if (!previousRange) return { ok: false, source, range: null };

  const cleanHtml = getCleanElementHtml(element);
  let start = previousRange.start;
  let end = previousRange.end;
  let replacement = cleanHtml;

  if (patchMode === "opening") {
    const openingEnd = source.indexOf(">", previousRange.start);
    if (openingEnd === -1 || openingEnd > previousRange.end) {
      return { ok: false, source, range: null };
    }
    start = previousRange.start;
    end = openingEnd + 1;
    replacement = getOpeningTagFromHtml(cleanHtml);
  } else if (patchMode === "text" && previousRange.kind !== "outer") {
    const contentRange = findElementContentRange(source, previousRange.start, element.tagName.toLowerCase());
    if (!contentRange) return { ok: false, source, range: null };
    start = contentRange.start;
    end = contentRange.end;
    replacement = getCleanElementInnerHtml(element);
  } else if (previousRange.kind !== "outer") {
    return { ok: false, source, range: null };
  }

  return {
    ok: true,
    source: source.slice(0, start) + replacement + source.slice(end),
    range: {
      start,
      end: start + replacement.length,
      kind: patchMode === "opening" ? "opening" : "outer",
    },
  };
}

export function cleanEditorRuntime(doc) {
  doc.querySelectorAll("[data-editor-runtime]").forEach((node) => node.remove());
  doc.querySelectorAll("[data-editor-id]").forEach((element) => {
    element.removeAttribute("data-editor-id");
    element.classList?.remove("__html_editor_hover__", "__html_editor_selected__");
    if (!element.getAttribute("class")) element.removeAttribute("class");
  });
  doc.querySelectorAll(".__html_editor_badge__").forEach((node) => node.remove());
  doc.documentElement?.classList?.remove("__html_editor_pick_mode__");
  if (doc.documentElement && !doc.documentElement.getAttribute("class")) {
    doc.documentElement.removeAttribute("class");
  }
}

export function cleanRuntimeFromElement(element) {
  [element, ...element.querySelectorAll("*")].forEach((node) => {
    node.removeAttribute("data-editor-id");
    node.removeAttribute("data-editor-runtime");
    node.classList?.remove("__html_editor_hover__", "__html_editor_selected__");
    if (!node.getAttribute("class")) node.removeAttribute("class");
  });
}

export function getCleanElementHtml(element) {
  const clone = element.cloneNode(true);
  cleanRuntimeFromElement(clone);
  return clone.outerHTML;
}

export function getCleanElementInnerHtml(element) {
  const clone = element.cloneNode(true);
  cleanRuntimeFromElement(clone);
  return clone.innerHTML;
}

export function getElementIndexPath(element) {
  const path = [];
  let current = element;

  while (current && current.parentElement && current.tagName.toLowerCase() !== "body") {
    const siblings = Array.from(current.parentElement.children).filter(
      (sibling) => !sibling.matches("[data-editor-runtime]"),
    );
    path.unshift(siblings.indexOf(current));
    current = current.parentElement;
  }

  return path;
}

export function getElementByIndexPath(doc, path) {
  let current = doc.body;
  for (const index of path) {
    if (!current || !current.children[index]) {
      return null;
    }
    current = current.children[index];
  }
  return current;
}

export function findOpeningTagByAttributes(source, element, usedRanges = [], fromIndex = 0) {
  const tagName = element.tagName.toLowerCase();
  const id = element.getAttribute("id");
  const className = element.getAttribute("class");
  const tagPattern = new RegExp(`<${escapeRegExp(tagName)}(\\s|>|/)`, "gi");
  tagPattern.lastIndex = fromIndex;
  let match;

  while ((match = tagPattern.exec(source))) {
    const start = match.index;
    if (isRangeUsed(start, start + 1, usedRanges)) continue;
    const end = source.indexOf(">", start);
    if (end === -1) continue;
    const openTag = source.slice(start, end + 1);
    if (id && !openTag.includes(`id="${id}"`) && !openTag.includes(`id='${id}'`)) continue;
    if (className && !openTag.includes(className)) continue;
    return start;
  }

  return -1;
}

export function findElementContentRange(source, openingStart, tagName) {
  const openingEnd = source.indexOf(">", openingStart);
  if (openingEnd === -1) return null;

  const closePattern = new RegExp(`</${escapeRegExp(tagName)}\\s*>`, "i");
  const closeMatch = closePattern.exec(source.slice(openingEnd + 1));
  if (!closeMatch) return null;

  return {
    start: openingEnd + 1,
    end: openingEnd + 1 + closeMatch.index,
  };
}

export function getOpeningTag(element) {
  const html = element.outerHTML || buildOpeningTag(element);
  const end = html.indexOf(">");
  return end === -1 ? html : html.slice(0, end + 1);
}

export function getOpeningTagFromHtml(html) {
  const end = html.indexOf(">");
  return end === -1 ? html : html.slice(0, end + 1);
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cloneCleanDocument(doc) {
  if (typeof doc.cloneNode === "function") {
    const cleanDoc = doc.cloneNode(true);
    cleanEditorRuntime(cleanDoc);
    return cleanDoc;
  }
  return doc;
}

function locateElementRange(source, cleanElement, usedRanges) {
  const outer = cleanElement.outerHTML;
  let start = outer ? findUnusedIndex(source, outer, usedRanges) : -1;

  if (start !== -1) {
    return { start, end: start + outer.length, kind: "outer" };
  }

  const openTag = getOpeningTag(cleanElement);
  start = findUnusedIndex(source, openTag, usedRanges);
  if (start === -1) {
    start = findOpeningTagByAttributes(source, cleanElement, usedRanges);
  }
  if (start === -1) return null;

  const end = source.indexOf(">", start);
  return { start, end: end === -1 ? start + openTag.length : end + 1, kind: "opening" };
}

function locateOpeningRange(source, cleanElement, fromIndex = 0) {
  const openTag = getOpeningTag(cleanElement);
  let start = source.indexOf(openTag, fromIndex);
  if (start === -1) {
    start = findOpeningTagByAttributes(source, cleanElement, [], fromIndex);
  }
  if (start === -1) return null;

  const end = source.indexOf(">", start);
  return { start, end: end === -1 ? start + openTag.length : end + 1, kind: "opening" };
}

function findUnusedIndex(source, needle, usedRanges) {
  if (!needle) return -1;
  let start = source.indexOf(needle);
  while (start !== -1) {
    const end = start + needle.length;
    if (!isRangeUsed(start, end, usedRanges)) return start;
    start = source.indexOf(needle, end);
  }
  return -1;
}

function isRangeUsed(start, end, usedRanges) {
  return usedRanges.some((range) => start < range.end && end > range.start);
}

function rangeStillMatches(source, range) {
  if (range.start < 0 || range.end > source.length || range.start >= range.end) return false;
  if (range.kind === "opening") {
    return source.slice(range.start, range.end).startsWith(`<${range.tagName}`);
  }
  return source.slice(range.start, range.start + range.openingTag.length) === range.openingTag;
}

function isVoidElement(tagName) {
  return new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]).has(tagName);
}

function buildOpeningTag(element) {
  const tagName = element.tagName.toLowerCase();
  const attrs = Object.entries(element.attributes || {})
    .filter(([name]) => !name.startsWith("data-editor-"))
    .map(([name, value]) => ` ${name}="${String(value).replaceAll('"', "&quot;")}"`)
    .join("");
  return `<${tagName}${attrs}>`;
}
