export function pushHistory(state, source, updateHistoryButtons, options = {}) {
  if (options.replace) {
    state.history = [source];
    state.historyIndex = 0;
    updateHistoryButtons();
    return;
  }
  if (state.history[state.historyIndex] === source) {
    updateHistoryButtons();
    return;
  }
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(source);
  if (state.history.length > 80) state.history.shift();
  state.historyIndex = state.history.length - 1;
  updateHistoryButtons();
}

export function readDraft(storage, key) {
  try {
    return JSON.parse(storage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

export function writeDraft(storage, key, draft) {
  storage.setItem(key, JSON.stringify(draft));
}

export function formatDraftTime(value) {
  if (!value) return "刚刚保存";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚保存";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
