import { updateElementOwnText } from "./inspectorControls.js";
import {
  addProjectAssetReplacement,
  applyImageFocusStyle,
  updateElementAssetReference,
} from "./projectAssets.js";

export function syncElementEdit({ element, previewElement, sourceRange, patch = "opening", mutate, syncElementToSource }) {
  if (!element || !sourceRange || typeof mutate !== "function" || typeof syncElementToSource !== "function") {
    return { ok: false };
  }

  mutate(element);
  if (previewElement) {
    mutate(previewElement);
  }

  const synced = syncElementToSource(element, sourceRange, patch);
  return { ok: Boolean(synced), synced };
}

export function syncInlineTextEdit({ element, text, sourceRange, syncElementToSource }) {
  if (!element || !sourceRange || typeof syncElementToSource !== "function") {
    return { ok: false };
  }

  updateElementOwnText(element, text);
  const synced = syncElementToSource(element, sourceRange, "text");
  return { ok: Boolean(synced), synced };
}

export function createImageReplacement({ assetPath, replacement, projectState }) {
  if (!assetPath || !replacement || !projectState) return null;

  const bytes = replacement.bytes instanceof Uint8Array ? replacement.bytes : new Uint8Array(replacement.bytes || []);
  return addProjectAssetReplacement({
    originalPath: assetPath,
    fileName: replacement.fileName,
    dataUrl: replacement.dataUrl,
    bytes,
    mimeType: replacement.mimeType,
    assetUrls: projectState.assetUrls,
    projectFiles: projectState.files,
  });
}

export function updateImageReference({ element, assetPath, replacementPath, projectState }) {
  return updateElementAssetReference(element, {
    oldPath: assetPath,
    newPath: replacementPath,
    entryPath: projectState.entryPath || projectState.sourceLabel,
    assetUrls: projectState.assetUrls,
  });
}

export function applyImageFocus(element, point) {
  return applyImageFocusStyle(element, point);
}

