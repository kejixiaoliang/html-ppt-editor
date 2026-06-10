export function applyCanvasState({ state, buttons, slideViewport, updateCanvasScale }) {
  buttons.canvasModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.canvasMode === state.canvasMode);
  });
  buttons.zoomModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.zoomMode === state.zoomMode);
  });

  slideViewport.classList.toggle("is-adaptive", state.canvasMode === "adaptive");
  updateCanvasScale();
}

export function updateCanvasScale({ state, previewStage, canvasShell, canvasInfo }) {
  if (!previewStage || !canvasShell) return;

  const stageWidth = Math.max(280, previewStage.clientWidth - 56);
  const stageHeight = Math.max(260, previewStage.clientHeight - 56);

  if (state.canvasMode === "adaptive") {
    canvasShell.style.width = `${stageWidth}px`;
    canvasShell.style.height = `${stageHeight}px`;
    canvasInfo.textContent = `${canvasLabel(state.canvasMode)} · ${zoomLabel(state.zoomMode, 1, 1)}`;
    return;
  }

  const base = getCanvasBaseSize(state.canvasMode);
  const fitScale = Math.min(1, stageWidth / base.width, stageHeight / base.height);
  const requestedScale = state.zoomMode === "fit" ? fitScale : Number(state.zoomMode);
  const scale = state.zoomMode === "fit" ? fitScale : requestedScale;
  const width = Math.max(240, base.width * scale);
  const height = Math.max(180, base.height * scale);

  canvasShell.style.width = `${width}px`;
  canvasShell.style.height = `${height}px`;
  canvasInfo.textContent = `${canvasLabel(state.canvasMode)} · ${zoomLabel(state.zoomMode, scale, fitScale)}`;
}

export function canvasLabel(mode) {
  if (mode === "adaptive") return "自适应";
  return mode;
}

export function zoomLabel(mode, scale, fitScale) {
  if (mode === "fit") return `Fit ${Math.round(scale * 100)}%`;
  const requested = Number(mode);
  if (requested > fitScale) return `${Math.round(requested * 100)}%`;
  return `${Math.round(scale * 100)}%`;
}

export function getCanvasBaseSize(mode) {
  if (mode === "4:3") {
    return { width: 960, height: 720 };
  }
  return { width: 1120, height: 630 };
}
