export function createProjectState(initial = {}) {
  return {
    entryPath: initial.entryPath || "",
    assetUrls: initial.assetUrls || null,
    files: initial.files || null,
    sourceLabel: initial.sourceLabel || "示例",
  };
}

export function applyImportedProject(state, result, fallbackLabel = "上传文件夹") {
  state.sourceLabel = result.sourceLabel || fallbackLabel;
  state.entryPath = result.entryPath || "";
  state.assetUrls = result.assetUrls || null;
  state.files = result.projectFiles || null;
  return state;
}

export function clearProjectState(state, sourceLabel = "示例") {
  state.entryPath = "";
  state.assetUrls = null;
  state.files = null;
  state.sourceLabel = sourceLabel;
  return state;
}

export function getProjectEntryLabel(state) {
  return state.entryPath || state.sourceLabel;
}

