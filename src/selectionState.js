export function createSelectionState(initial = {}) {
  return {
    editorId: initial.editorId || null,
    range: initial.range || null,
  };
}

export function selectEditorElement(selection, editorId) {
  selection.editorId = editorId || null;
  if (!selection.editorId) {
    selection.range = null;
  }
  return selection;
}

export function updateSelectionRange(selection, range) {
  selection.range = range || null;
  return selection;
}

export function clearSelectionState(selection) {
  selection.editorId = null;
  selection.range = null;
  return selection;
}

