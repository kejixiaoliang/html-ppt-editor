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

export function updateCanvasScale({ state, previewStage, canvasShell, slideViewport, canvasInfo }) {
  if (!previewStage || !canvasShell || !slideViewport) return;

  const stageWidth = Math.max(280, previewStage.clientWidth - 56);
  const stageHeight = Math.max(260, previewStage.clientHeight - 56);
  const base = getCanvasBaseSize(state.canvasMode);
  const fitScale = Math.min(1, stageWidth / base.width, stageHeight / base.height);
  const scale = state.zoomMode === "fit" ? fitScale : Number(state.zoomMode);
  const scaledWidth = Math.max(1, Math.round(base.width * scale));
  const scaledHeight = Math.max(1, Math.round(base.height * scale));

  canvasShell.style.width = `${scaledWidth}px`;
  canvasShell.style.height = `${scaledHeight}px`;
  canvasShell.style.setProperty("--canvas-scale", String(scale));

  slideViewport.style.width = `${base.width}px`;
  slideViewport.style.height = `${base.height}px`;
  slideViewport.style.transform = `scale(${scale})`;

  canvasInfo.textContent = `${canvasLabel(state.canvasMode)} · ${zoomLabel(state.zoomMode, scale, fitScale)}`;
}

export function canvasLabel(mode) {
  if (mode === "adaptive") return "Fit";
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
