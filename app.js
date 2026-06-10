import * as canvasLayout from "./src/canvasLayout.js";
import {
  setOptionalAttribute,
  styleControlMap,
  updateElementOwnText,
  updateFormatButtonState,
} from "./src/inspectorControls.js";
import * as previewBridge from "./src/previewBridge.js";
import * as sourceMapping from "./src/sourceMapping.js";
import * as stateHistory from "./src/stateHistory.js";

const sourceEditor = document.querySelector("#sourceEditor");
const previewFrame = document.querySelector("#previewFrame");
const fileInput = document.querySelector("#fileInput");
const loadSampleBtn = document.querySelector("#loadSampleBtn");
const refreshBtn = document.querySelector("#refreshBtn");
const downloadBtn = document.querySelector("#downloadBtn");
const undoBtn = document.querySelector("#undoBtn");
const redoBtn = document.querySelector("#redoBtn");
const locateSourceBtn = document.querySelector("#locateSourceBtn");
const sourceStatus = document.querySelector("#sourceStatus");
const sourceSelectionInfo = document.querySelector("#sourceSelectionInfo");
const selectionLabel = document.querySelector("#selectionLabel");
const breadcrumbBar = document.querySelector("#breadcrumbBar");
const selectParentBtn = document.querySelector("#selectParentBtn");
const clearSelectionBtn = document.querySelector("#clearSelectionBtn");
const emptyInspector = document.querySelector("#emptyInspector");
const inspectorForm = document.querySelector("#inspectorForm");
const inspectorHint = document.querySelector("#inspectorHint");
const ancestorList = document.querySelector("#ancestorList");
const childrenList = document.querySelector("#childrenList");
const workspace = document.querySelector("#workspace");
const sourceToggleBtn = document.querySelector("#sourceToggleBtn");
const sourceRailBtn = document.querySelector("#sourceRailBtn");
const previewStage = document.querySelector("#previewStage");
const canvasShell = document.querySelector("#canvasShell");
const slideViewport = document.querySelector("#slideViewport");
const canvasInfo = document.querySelector("#canvasInfo");
const canvasModeButtons = document.querySelectorAll("[data-canvas-mode]");
const zoomModeButtons = document.querySelectorAll("[data-zoom-mode]");
const floatingToolbar = document.querySelector("#floatingToolbar");
const toolbarSelectionLabel = document.querySelector("#toolbarSelectionLabel");
const quickActionButtons = document.querySelectorAll("[data-quick-action]");
const quickInputControls = document.querySelectorAll("[data-quick-input]");
const quickSelectControls = document.querySelectorAll("[data-quick-select]");
const quickTextColorInput = document.querySelector("#quickTextColorInput");
const quickBackgroundColorInput = document.querySelector("#quickBackgroundColorInput");
const quickFontSizeInput = document.querySelector("#quickFontSizeInput");
const quickTextPresetSelect = document.querySelector("#quickTextPresetSelect");
const draftBar = document.querySelector("#draftBar");
const draftInfo = document.querySelector("#draftInfo");
const restoreDraftBtn = document.querySelector("#restoreDraftBtn");
const discardDraftBtn = document.querySelector("#discardDraftBtn");

const draftStorageKey = "html-studio:draft:v1";

const controls = {
  selectedSummary: document.querySelector("#selectedSummary"),
  elementPath: document.querySelector("#elementPathInput"),
  elementSize: document.querySelector("#elementSizeInput"),
  sourceRange: document.querySelector("#sourceRangeInput"),
  tagName: document.querySelector("#tagNameInput"),
  text: document.querySelector("#textInput"),
  id: document.querySelector("#idInput"),
  className: document.querySelector("#classInput"),
  src: document.querySelector("#srcInput"),
  href: document.querySelector("#hrefInput"),
  srcField: document.querySelector("#srcField"),
  hrefField: document.querySelector("#hrefField"),
  color: document.querySelector("#colorInput"),
  background: document.querySelector("#backgroundInput"),
  fontSize: document.querySelector("#fontSizeInput"),
  fontWeight: document.querySelector("#fontWeightInput"),
  fontFamily: document.querySelector("#fontFamilyInput"),
  lineHeight: document.querySelector("#lineHeightInput"),
  letterSpacing: document.querySelector("#letterSpacingInput"),
  textAlign: document.querySelector("#textAlignInput"),
  italic: document.querySelector("#italicBtn"),
  underline: document.querySelector("#underlineBtn"),
  strike: document.querySelector("#strikeBtn"),
  width: document.querySelector("#widthInput"),
  height: document.querySelector("#heightInput"),
  margin: document.querySelector("#marginInput"),
  padding: document.querySelector("#paddingInput"),
  borderRadius: document.querySelector("#borderRadiusInput"),
  opacity: document.querySelector("#opacityInput"),
  boxShadow: document.querySelector("#boxShadowInput"),
  transform: document.querySelector("#transformInput"),
};

const sampleHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HTML PPT 示例</title>
    <style>
      body {
        margin: 0;
        font-family: "Microsoft YaHei", sans-serif;
        background: #f4f6f8;
        color: #20231f;
      }

      .slide {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 72px;
      }

      .content {
        width: min(980px, 100%);
      }

      .eyebrow {
        color: #b66a58;
        font-size: 18px;
        font-weight: 800;
      }

      h1 {
        margin: 18px 0;
        max-width: 900px;
        font-size: 76px;
        line-height: 1.02;
        letter-spacing: 0;
      }

      p {
        max-width: 680px;
        color: #4b5563;
        font-size: 22px;
        line-height: 1.7;
      }

      .card-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
        margin-top: 42px;
      }

      .card {
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <section class="slide">
      <div class="content">
        <div class="eyebrow">HTML PPT 编辑器</div>
        <h1>点击渲染元素，直接定位源码并编辑</h1>
        <p>这个示例用于验证三栏式编辑流程：左侧源码、中间 HTML 渲染、右侧属性编辑。点击标题、文字、背景容器或卡片都可以选中。</p>
        <div class="card-row">
          <div class="card">源码定位</div>
          <div class="card">可视化编辑</div>
          <div class="card">干净导出</div>
        </div>
      </div>
    </section>
  </body>
</html>`;

const appState = {
  sourceDoc: null,
  selectedEditorId: null,
  selectedRange: null,
  updatingInspector: false,
  renderTimer: null,
  autosaveTimer: null,
  previewScroll: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,
  sourceCollapsed: true,
  canvasMode: "16:9",
  zoomMode: "fit",
  resizeObserver: null,
  sourceMap: null,
  sourceLabel: "示例",
  copiedInlineStyle: "",
};

function init() {
  setAppViewportHeight();
  sourceEditor.value = sampleHtml;
  pushHistory(sampleHtml, { replace: true });
  bindEvents();
  observeLayoutChanges();
  applyWorkspaceState();
  applyCanvasState();
  renderPreview();
  showDraftPromptIfAvailable();
  stabilizeInitialLayout();
}

function bindEvents() {
  sourceEditor.addEventListener("input", () => {
    setSourceStatus("源码编辑中");
    clearSelectionState();
    window.clearTimeout(appState.renderTimer);
    appState.renderTimer = window.setTimeout(() => {
      pushHistory(sourceEditor.value);
      renderPreview();
      scheduleAutosave();
    }, 450);
  });

  fileInput.addEventListener("change", handleFileUpload);
  loadSampleBtn.addEventListener("click", loadSample);
  refreshBtn.addEventListener("click", () => renderPreview());
  downloadBtn.addEventListener("click", downloadHtml);
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  locateSourceBtn.addEventListener("click", () => locateCurrentSourceRange(true));
  sourceToggleBtn.addEventListener("click", toggleSourcePanel);
  sourceRailBtn.addEventListener("click", toggleSourcePanel);
  selectParentBtn.addEventListener("click", selectParentElement);
  clearSelectionBtn.addEventListener("click", clearSelection);
  restoreDraftBtn.addEventListener("click", restoreDraft);
  discardDraftBtn.addEventListener("click", discardDraft);
  document.addEventListener("keydown", handleShortcuts);
  window.addEventListener("resize", () => {
    setAppViewportHeight();
    updateCanvasScale();
    positionFloatingToolbar();
  });

  window.visualViewport?.addEventListener("resize", () => {
    setAppViewportHeight();
    updateCanvasScale();
    positionFloatingToolbar();
  });

  canvasModeButtons.forEach((button) => {
    button.addEventListener("click", () => setCanvasMode(button.dataset.canvasMode));
  });

  zoomModeButtons.forEach((button) => {
    button.addEventListener("click", () => setZoomMode(button.dataset.zoomMode));
  });

  quickActionButtons.forEach((button) => {
    button.addEventListener("click", () => applyQuickAction(button.dataset.quickAction));
  });

  quickInputControls.forEach((control) => {
    control.addEventListener("input", () => applyQuickInput(control));
    control.addEventListener("change", () => applyQuickInput(control));
  });

  quickSelectControls.forEach((control) => {
    control.addEventListener("change", () => applyQuickTextPreset(control.value));
  });

  window.addEventListener("message", (event) => {
    if (event.source !== previewFrame.contentWindow) {
      return;
    }

    if (event.data?.type === "editor:select") {
      selectElement(event.data.editorId);
    }

    if (event.data?.type === "editor:inline-text") {
      applyInlineTextEdit(event.data.editorId, event.data.text || "");
    }
  });

  bindInspectorControl(controls.text, (element, value) => updateElementOwnText(element, value), { patch: "text" });
  bindInspectorControl(controls.id, (element, value) => setOptionalAttribute(element, "id", value), { patch: "opening" });
  bindInspectorControl(controls.className, (element, value) => setOptionalAttribute(element, "class", value), {
    patch: "opening",
  });
  bindInspectorControl(controls.src, (element, value) => setOptionalAttribute(element, "src", value), { patch: "opening" });
  bindInspectorControl(controls.href, (element, value) => setOptionalAttribute(element, "href", value), { patch: "opening" });
  bindStyleToggle(controls.italic, "fontStyle", "italic");
  bindTextDecorationToggle(controls.underline, "underline");
  bindTextDecorationToggle(controls.strike, "line-through");

  for (const [controlName, styleName] of Object.entries(styleControlMap)) {
    bindInspectorControl(
      controls[controlName],
      (element, value) => {
        element.style[styleName] = value;
      },
      { patch: "opening" },
    );
  }
}

function bindInspectorControl(control, applyChange, options = {}) {
  control.addEventListener("input", () => {
    if (appState.updatingInspector) return;
    applySelectedElementChange({
      patch: options.patch || "outer",
      mutate: (element) => applyChange(element, control.value.trim()),
    });
  });
}

function bindStyleToggle(button, styleName, activeValue) {
  button.addEventListener("click", () => {
    applySelectedElementChange({
      patch: "opening",
      mutate: (element) => {
        const isActive = element.style[styleName] === activeValue || getComputedPreviewStyle(styleName) === activeValue;
        element.style[styleName] = isActive ? "" : activeValue;
      },
      after: (element) => updateFormatButtonState(button, element.style[styleName], activeValue),
    });
  });
}

function bindTextDecorationToggle(button, token) {
  button.addEventListener("click", () => {
    applySelectedElementChange({
      patch: "opening",
      mutate: (element) => {
        const tokens = getTextDecorationTokens(element);
        if (tokens.has(token)) {
          tokens.delete(token);
        } else {
          tokens.add(token);
        }
        element.style.textDecoration = Array.from(tokens).join(" ");
      },
      after: updateTextDecorationButtonStates,
    });
  });
}

function applySelectedElementChange({ patch = "opening", mutate, after }) {
  if (!appState.selectedEditorId) return false;
  const element = getSelectedSourceElement();
  if (!element) return false;

  const sourceRange = findSourceRangeForElement(element);
  mutate(element);

  const previewElement = getSelectedPreviewElement();
  if (previewElement) {
    mutate(previewElement);
  }

  const synced = syncElementToSource(element, sourceRange, patch);
  if (!synced) return false;

  pushHistory(sourceEditor.value);
  if (after) after(element);
  refreshSelectedMetadata();
  positionFloatingToolbar();
  scheduleAutosave();
  return true;
}

function applyQuickAction(action) {
  if (action === "copy-style") {
    copySelectedInlineStyle();
    return;
  }

  if (action === "paste-style") {
    pasteSelectedInlineStyle();
    return;
  }

  if (action === "clear-style") {
    clearSelectedInlineStyle();
    return;
  }

  const actionMap = {
    bold: (element) => {
      const current = element.style.fontWeight || getComputedPreviewStyle("fontWeight");
      element.style.fontWeight = Number(current) >= 700 || current === "bold" ? "" : "700";
    },
    italic: (element) => {
      element.style.fontStyle = element.style.fontStyle === "italic" ? "" : "italic";
    },
    underline: (element) => toggleDecorationToken(element, "underline"),
    strike: (element) => toggleDecorationToken(element, "line-through"),
    "font-down": (element) => nudgeFontSize(element, -2),
    "font-up": (element) => nudgeFontSize(element, 2),
    "align-left": (element) => {
      element.style.textAlign = "left";
    },
    "align-center": (element) => {
      element.style.textAlign = "center";
    },
    "align-right": (element) => {
      element.style.textAlign = "right";
    },
    "accent-color": (element) => {
      element.style.color = "#b66a58";
    },
    "soft-background": (element) => {
      element.style.backgroundColor = "#f8e8e4";
    },
  };

  const mutate = actionMap[action];
  if (!mutate) return;
  applySelectedElementChange({
    patch: "opening",
    mutate,
    after: (element) => {
      updateInspectorControlValues(element);
      updateFormatButtonState(controls.italic, element.style.fontStyle || getComputedPreviewStyle("fontStyle") || "", "italic");
      updateTextDecorationButtonStates(element);
      updateFloatingToolbarState(element);
    },
  });
}

function applyQuickInput(control) {
  if (!control || !appState.selectedEditorId) return;

  const inputType = control.dataset.quickInput;
  const styleProp = control.dataset.styleProp;
  applySelectedElementChange({
    patch: "opening",
    mutate: (element) => {
      if (inputType === "font-size") {
        const size = Number.parseInt(control.value, 10);
        if (Number.isFinite(size)) {
          element.style.fontSize = `${Math.max(8, Math.min(240, size))}px`;
        }
        return;
      }

      if (inputType === "color" && styleProp) {
        element.style[styleProp] = control.value;
      }
    },
    after: (element) => {
      updateInspectorControlValues(element);
      updateFloatingToolbarState(element);
    },
  });
}

function applyInlineTextEdit(editorId, text) {
  if (!editorId) return false;
  if (appState.selectedEditorId !== editorId) {
    appState.selectedEditorId = editorId;
  }

  const element = getSelectedSourceElement();
  if (!element) return false;

  const sourceRange = findSourceRangeForElement(element);
  updateElementOwnText(element, text);

  const synced = syncElementToSource(element, sourceRange, "text");
  if (!synced) return false;

  controls.text.value = getOwnText(element);
  pushHistory(sourceEditor.value);
  refreshSelectedMetadata();
  updateFloatingToolbarState(element);
  scheduleAutosave();
  return true;
}

function applyQuickTextPreset(preset) {
  if (!preset) return;

  const presetMap = {
    title: { fontSize: "72px", fontWeight: "800", lineHeight: "1.04" },
    subtitle: { fontSize: "34px", fontWeight: "700", lineHeight: "1.18" },
    body: { fontSize: "20px", fontWeight: "400", lineHeight: "1.68" },
    caption: { fontSize: "14px", fontWeight: "700", lineHeight: "1.42", letterSpacing: "0.04em" },
  };
  const styles = presetMap[preset];
  if (!styles) return;

  applySelectedElementChange({
    patch: "opening",
    mutate: (element) => {
      Object.assign(element.style, styles);
    },
    after: (element) => {
      updateInspectorControlValues(element);
      updateFloatingToolbarState(element);
    },
  });
}

function copySelectedInlineStyle() {
  const element = getSelectedSourceElement();
  if (!element) return;

  appState.copiedInlineStyle = element.getAttribute("style") || "";
  setSourceStatus(appState.copiedInlineStyle ? "已复制当前元素样式" : "当前元素没有可复制的行内样式");
  updateFloatingToolbarState(element);
}

function pasteSelectedInlineStyle() {
  if (!appState.copiedInlineStyle) {
    setSourceStatus("还没有复制样式");
    updateFloatingToolbarState();
    return;
  }

  applySelectedElementChange({
    patch: "opening",
    mutate: (element) => {
      element.setAttribute("style", appState.copiedInlineStyle);
    },
    after: (element) => {
      updateInspectorControlValues(element);
      updateFloatingToolbarState(element);
    },
  });
}

function clearSelectedInlineStyle() {
  applySelectedElementChange({
    patch: "opening",
    mutate: (element) => {
      element.removeAttribute("style");
    },
    after: (element) => {
      updateInspectorControlValues(element);
      updateFormatButtonState(controls.italic, "", "italic");
      updateTextDecorationButtonStates(element);
      updateFloatingToolbarState(element);
    },
  });
}

function updateFloatingToolbarState(element = getSelectedSourceElement()) {
  if (!floatingToolbar) return;

  const label = element ? getElementLabel(element) : "body";
  if (toolbarSelectionLabel) {
    toolbarSelectionLabel.textContent = label;
  }

  const previewElement = getSelectedPreviewElement();
  const previewStyle = previewElement ? previewFrame.contentWindow?.getComputedStyle(previewElement) : null;
  const inlineStyle = element?.style;
  const decorationTokens = element ? getTextDecorationTokens(element) : new Set();

  setQuickActionActive("bold", Boolean(previewStyle && (Number(previewStyle.fontWeight) >= 700 || previewStyle.fontWeight === "bold")));
  setQuickActionActive("italic", inlineStyle?.fontStyle === "italic" || previewStyle?.fontStyle === "italic");
  setQuickActionActive("underline", decorationTokens.has("underline"));
  setQuickActionActive("strike", decorationTokens.has("line-through"));
  setQuickActionActive("align-left", inlineStyle?.textAlign === "left" || previewStyle?.textAlign === "left");
  setQuickActionActive("align-center", inlineStyle?.textAlign === "center" || previewStyle?.textAlign === "center");
  setQuickActionActive("align-right", inlineStyle?.textAlign === "right" || previewStyle?.textAlign === "right");
  syncQuickToolbarControls(element, previewStyle);

  const pasteButton = floatingToolbar.querySelector('[data-quick-action="paste-style"]');
  if (pasteButton) {
    pasteButton.disabled = !appState.copiedInlineStyle;
  }
}

function syncQuickToolbarControls(element, previewStyle) {
  if (!element) return;

  if (quickTextColorInput) {
    quickTextColorInput.value = normalizeColor(element.style.color || previewStyle?.color || "#20231f");
  }

  if (quickBackgroundColorInput) {
    quickBackgroundColorInput.value = normalizeColor(
      element.style.backgroundColor || previewStyle?.backgroundColor || "#ffffff",
    );
  }

  if (quickFontSizeInput) {
    const fontSize = Number.parseFloat(element.style.fontSize || previewStyle?.fontSize || "");
    quickFontSizeInput.value = Number.isFinite(fontSize) ? String(Math.round(fontSize)) : "";
  }

  if (quickTextPresetSelect) {
    quickTextPresetSelect.value = "";
  }
}

function setQuickActionActive(action, isActive) {
  const button = floatingToolbar?.querySelector(`[data-quick-action="${action}"]`);
  if (!button) return;
  button.classList.toggle("is-active", Boolean(isActive));
  button.setAttribute("aria-pressed", String(Boolean(isActive)));
}

function toggleDecorationToken(element, token) {
  const tokens = getTextDecorationTokens(element);
  if (tokens.has(token)) {
    tokens.delete(token);
  } else {
    tokens.add(token);
  }
  element.style.textDecoration = Array.from(tokens).join(" ");
}

function nudgeFontSize(element, delta) {
  const raw = element.style.fontSize || getComputedPreviewStyle("fontSize") || "16px";
  const current = Number.parseFloat(raw) || 16;
  element.style.fontSize = `${Math.max(8, Math.round(current + delta))}px`;
}

function handleShortcuts(event) {
  const key = event.key.toLowerCase();
  const cmd = event.ctrlKey || event.metaKey;

  if (cmd && key === "z" && !event.shiftKey) {
    event.preventDefault();
    undo();
  }

  if ((cmd && key === "y") || (cmd && event.shiftKey && key === "z")) {
    event.preventDefault();
    redo();
  }

  if (key === "escape" && appState.selectedEditorId) {
    event.preventDefault();
    clearSelection();
  }

  if (cmd && key === "b") {
    event.preventDefault();
    toggleSourcePanel();
  }
}

function observeLayoutChanges() {
  if (!window.ResizeObserver) return;
  appState.resizeObserver = new ResizeObserver(() => {
    window.requestAnimationFrame(() => {
      setAppViewportHeight();
      updateCanvasScale();
      positionFloatingToolbar();
    });
  });
  const topbar = document.querySelector(".topbar");
  if (topbar) appState.resizeObserver.observe(topbar);
  if (draftBar) appState.resizeObserver.observe(draftBar);
  if (workspace) appState.resizeObserver.observe(workspace);
  appState.resizeObserver.observe(previewStage);
}

function setAppViewportHeight() {
  const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight);
  document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
  setWorkspaceHeight(viewportHeight);
}

function setWorkspaceHeight(viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight)) {
  if (!workspace) return;
  const topbar = document.querySelector(".topbar");
  const topbarHeight = topbar?.getBoundingClientRect().height || 66;
  const draftHeight = draftBar && !draftBar.classList.contains("hidden") ? draftBar.getBoundingClientRect().height : 0;
  const availableHeight = Math.max(420, Math.floor(viewportHeight - topbarHeight - draftHeight));
  document.documentElement.style.setProperty("--workspace-height", `${availableHeight}px`);
}

function stabilizeInitialLayout() {
  const frames = [0, 80, 220, 520];
  frames.forEach((delay) => {
    window.setTimeout(() => {
      setAppViewportHeight();
      updateCanvasScale();
      positionFloatingToolbar();
    }, delay);
  });
}

function renderPreview(options = {}) {
  const scrollToRestore = options.preserveScroll ? capturePreviewScroll() : null;
  const parser = new DOMParser();
  appState.sourceDoc = parser.parseFromString(sourceEditor.value, "text/html");
  previewBridge.ensureHtmlDocument(appState.sourceDoc);
  previewBridge.injectEditorIds(appState.sourceDoc);
  appState.sourceMap = sourceMapping.buildSourceMap(sourceEditor.value, appState.sourceDoc);
  previewBridge.injectPreviewBridge(appState.sourceDoc);

  previewFrame.addEventListener(
    "load",
    () => {
      if (options.keepSelection && appState.selectedEditorId) {
        previewFrame.contentWindow?.__selectEditorElement?.(appState.selectedEditorId);
        updateInspector();
      }
      if (scrollToRestore) {
        restorePreviewScroll(scrollToRestore);
      }
      previewFrame.contentWindow?.addEventListener("scroll", positionFloatingToolbar, { passive: true });
      previewFrame.contentWindow?.addEventListener("resize", positionFloatingToolbar);
      updateCanvasScale();
      positionFloatingToolbar();
    },
    { once: true },
  );

  previewFrame.srcdoc = `<!doctype html>\n${appState.sourceDoc.documentElement.outerHTML}`;

  if (!options.keepSelection) {
    clearSelectionState();
  }

  setSourceStatus("已同步");
}

function selectElement(editorId) {
  appState.selectedEditorId = editorId;
  previewFrame.contentWindow?.__selectEditorElement?.(editorId);
  updateInspector();
  locateCurrentSourceRange(false);
  positionFloatingToolbar();
}

function updateInspector() {
  const element = getSelectedSourceElement();
  if (!element) {
    clearSelection();
    return;
  }

  appState.updatingInspector = true;

  emptyInspector.classList.add("hidden");
  inspectorForm.classList.remove("hidden");
  clearSelectionBtn.disabled = false;
  locateSourceBtn.disabled = false;
  selectParentBtn.disabled = !element.parentElement?.closest?.("[data-editor-id]");
  inspectorHint.textContent = "正在编辑选中元素";

  const label = getElementLabel(element);
  const path = getElementPath(element);
  const range = findSourceRangeForElement(element);
  appState.selectedRange = range;

  controls.selectedSummary.textContent = label;
  controls.elementPath.value = path;
  controls.elementSize.value = getSelectionSize();
  controls.sourceRange.value = range ? `${range.start} - ${range.end}` : "未找到对应源码";
  controls.tagName.value = element.tagName.toLowerCase();
  controls.text.value = element.children.length ? getOwnText(element) : element.textContent.trim();
  controls.id.value = element.getAttribute("id") || "";
  controls.className.value = element.getAttribute("class") || "";
  controls.src.value = element.getAttribute("src") || "";
  controls.href.value = element.getAttribute("href") || "";

  controls.srcField.classList.toggle("hidden", !supportsAttribute(element, "src"));
  controls.hrefField.classList.toggle("hidden", !supportsAttribute(element, "href"));

  controls.color.value = normalizeColor(element.style.color || getComputedPreviewStyle("color") || "#20231f");
  controls.background.value = normalizeColor(
    element.style.backgroundColor || getComputedPreviewStyle("backgroundColor") || "#ffffff",
  );

  updateInspectorControlValues(element);
  updateFormatButtonState(controls.italic, element.style.fontStyle || getComputedPreviewStyle("fontStyle") || "", "italic");
  updateTextDecorationButtonStates(element);

  selectionLabel.textContent = `已选中：${label}`;
  breadcrumbBar.textContent = path;
  sourceSelectionInfo.textContent = range ? `源码已定位：${label}` : `源码定位失败：${label}`;
  renderHierarchyControls(element);

  appState.updatingInspector = false;
}

function updateInspectorControlValues(element) {
  if (!element) return;
  appState.updatingInspector = true;
  controls.color.value = normalizeColor(element.style.color || getComputedPreviewStyle("color") || "#20231f");
  controls.background.value = normalizeColor(
    element.style.backgroundColor || getComputedPreviewStyle("backgroundColor") || "#ffffff",
  );
  for (const [controlName, styleName] of Object.entries(styleControlMap)) {
    if (controlName === "color" || controlName === "background") continue;
    controls[controlName].value = element.style[styleName] || "";
  }
  appState.updatingInspector = false;
}

function renderHierarchyControls(element) {
  ancestorList.innerHTML = "";
  childrenList.innerHTML = "";

  const ancestors = [];
  let parent = element.parentElement?.closest?.("[data-editor-id]");
  while (parent) {
    ancestors.unshift(parent);
    parent = parent.parentElement?.closest?.("[data-editor-id]");
  }

  if (ancestors.length) {
    ancestorList.append(createTextChip("父级：", true));
    ancestors.forEach((ancestor) => {
      ancestorList.append(createElementChip(ancestor));
    });
  }

  const children = Array.from(element.children).filter((child) => child.dataset.editorId).slice(0, 12);
  if (children.length) {
    childrenList.append(createTextChip("子级：", true));
    children.forEach((child) => {
      childrenList.append(createElementChip(child));
    });
  }
}

function createTextChip(text, muted = false) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = text;
  if (muted) chip.style.cursor = "default";
  return chip;
}

function createElementChip(element) {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.type = "button";
  chip.textContent = getElementLabel(element);
  chip.addEventListener("click", () => selectElement(element.dataset.editorId));
  return chip;
}

function findSourceRangeForElement(element) {
  return sourceMapping.findElementSourceRange(sourceEditor.value, appState.sourceDoc, element, appState.sourceMap);
}

function getElementIndexPath(element) {
  return sourceMapping.getElementIndexPath(element);
}

function getElementByIndexPath(doc, path) {
  return sourceMapping.getElementByIndexPath(doc, path);
}

function locateCurrentSourceRange(focusSource) {
  const element = getSelectedSourceElement();
  if (!element) {
    return;
  }

  const range = appState.selectedRange || findSourceRangeForElement(element);
  if (!range) {
    return;
  }

  appState.selectedRange = range;
  sourceEditor.setSelectionRange(range.start, range.end);
  scrollSourceToOffset(range.start);
  if (focusSource) {
    sourceEditor.focus({ preventScroll: true });
  }
}

function scrollSourceToOffset(offset) {
  const before = sourceEditor.value.slice(0, offset);
  const line = before.split("\n").length - 1;
  const lineHeight = Number.parseFloat(getComputedStyle(sourceEditor).lineHeight) || 19;
  sourceEditor.scrollTop = Math.max(0, line * lineHeight - sourceEditor.clientHeight / 3);
}

function selectParentElement() {
  const element = getSelectedSourceElement();
  const parent = element?.parentElement?.closest?.("[data-editor-id]");
  if (!parent) return;
  selectElement(parent.dataset.editorId);
}

function getSelectionSize() {
  const element = previewFrame.contentDocument?.querySelector(`[data-editor-id="${appState.selectedEditorId}"]`);
  if (!element) return "";
  const rect = element.getBoundingClientRect();
  return `${Math.round(rect.width)} x ${Math.round(rect.height)}`;
}

function getSelectedSourceElement() {
  if (!appState.sourceDoc || !appState.selectedEditorId) return null;
  return appState.sourceDoc.querySelector(`[data-editor-id="${appState.selectedEditorId}"]`);
}

function getSelectedPreviewElement() {
  return previewFrame.contentDocument?.querySelector(`[data-editor-id="${appState.selectedEditorId}"]`) || null;
}

function refreshSelectedMetadata() {
  const element = getSelectedSourceElement();
  if (!element) return;

  const label = getElementLabel(element);
  const path = getElementPath(element);
  const range = findSourceRangeForElement(element);
  appState.selectedRange = range;

  controls.selectedSummary.textContent = label;
  controls.elementPath.value = path;
  controls.elementSize.value = getSelectionSize();
  controls.sourceRange.value = range ? `${range.start} - ${range.end}` : "未找到对应源码";
  selectionLabel.textContent = `已选中：${label}`;
  breadcrumbBar.textContent = path;
  sourceSelectionInfo.textContent = range ? `源码已定位：${label}` : `源码定位失败：${label}`;
  positionFloatingToolbar();
}

function positionFloatingToolbar() {
  if (!floatingToolbar || !appState.selectedEditorId) {
    floatingToolbar?.classList.add("hidden");
    return;
  }

  const element = getSelectedPreviewElement();
  if (!element) {
    floatingToolbar.classList.add("hidden");
    return;
  }

  updateFloatingToolbarState();
  floatingToolbar.classList.remove("hidden");
  const frameRect = previewFrame.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const toolbarRect = floatingToolbar.getBoundingClientRect();
  const preferredLeft = frameRect.left + elementRect.left + elementRect.width / 2 - toolbarRect.width / 2;
  const preferredTop = frameRect.top + elementRect.top - toolbarRect.height - 10;
  const fallbackTop = frameRect.top + elementRect.bottom + 10;
  const left = clamp(preferredLeft, 12, window.innerWidth - toolbarRect.width - 12);
  const top = preferredTop > 12 ? preferredTop : clamp(fallbackTop, 12, window.innerHeight - toolbarRect.height - 12);

  floatingToolbar.style.left = `${left}px`;
  floatingToolbar.style.top = `${top}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function syncElementToSource(element, previousRange, patchMode) {
  const result = sourceMapping.syncElementToSource({
    source: sourceEditor.value,
    element,
    previousRange,
    patchMode,
  });

  if (!result.ok) {
    setSourceStatus("源码定位失败，未写入源码");
    return false;
  }

  sourceEditor.value = result.source;
  appState.selectedRange = result.range;
  appState.sourceMap = sourceMapping.buildSourceMap(sourceEditor.value, appState.sourceDoc);
  setSourceStatus("已同步");
  return true;
}

function toggleSourcePanel() {
  appState.sourceCollapsed = !appState.sourceCollapsed;
  applyWorkspaceState();
  window.setTimeout(updateCanvasScale, 220);
}

function applyWorkspaceState() {
  workspace.classList.toggle("source-collapsed", appState.sourceCollapsed);
  sourceToggleBtn.title = appState.sourceCollapsed ? "展开源码" : "收起源码";
  sourceToggleBtn.setAttribute("aria-label", sourceToggleBtn.title);
  sourceRailBtn.title = sourceToggleBtn.title;
  sourceRailBtn.setAttribute("aria-label", sourceToggleBtn.title);
}

function capturePreviewScroll() {
  const win = previewFrame.contentWindow;
  const doc = previewFrame.contentDocument;
  if (!win || !doc) return structuredCloneSafe(appState.previewScroll);

  const scrollingElement = doc.scrollingElement || doc.documentElement;
  const scrolledElements = Array.from(doc.body?.querySelectorAll("*") || [])
    .filter((element) => element.scrollTop || element.scrollLeft)
    .slice(0, 40)
    .map((element) => ({
      editorId: element.dataset.editorId || "",
      path: getElementIndexPath(element),
      x: element.scrollLeft,
      y: element.scrollTop,
    }));

  appState.previewScroll = {
    stage: {
      x: previewStage.scrollLeft,
      y: previewStage.scrollTop,
    },
    frame: {
      x: win.scrollX || scrollingElement.scrollLeft || 0,
      y: win.scrollY || scrollingElement.scrollTop || 0,
      scrollingX: scrollingElement.scrollLeft || 0,
      scrollingY: scrollingElement.scrollTop || 0,
    },
    elements: scrolledElements,
  };
  return structuredCloneSafe(appState.previewScroll);
}

function restorePreviewScroll(scroll) {
  const win = previewFrame.contentWindow;
  const doc = previewFrame.contentDocument;
  if (!win || !doc) return;

  const restore = () => {
    if (scroll.stage) {
      previewStage.scrollLeft = scroll.stage.x || 0;
      previewStage.scrollTop = scroll.stage.y || 0;
    }

    const scrollingElement = doc.scrollingElement || doc.documentElement;
    if (scroll.frame) {
      win.scrollTo(scroll.frame.x || 0, scroll.frame.y || 0);
      scrollingElement.scrollLeft = scroll.frame.scrollingX || scroll.frame.x || 0;
      scrollingElement.scrollTop = scroll.frame.scrollingY || scroll.frame.y || 0;
    }

    for (const item of scroll.elements || []) {
      const element =
        (item.editorId && doc.querySelector(`[data-editor-id="${item.editorId}"]`)) ||
        getElementByIndexPath(doc, item.path);
      if (!element) continue;
      element.scrollLeft = item.x || 0;
      element.scrollTop = item.y || 0;
    }
  };

  restore();
  window.requestAnimationFrame(restore);
  window.setTimeout(restore, 80);
  window.setTimeout(restore, 220);
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function updateTextDecorationButtonStates(element) {
  const tokens = getTextDecorationTokens(element);
  updateFormatButtonState(controls.underline, tokens.has("underline") ? "underline" : "", "underline");
  updateFormatButtonState(controls.strike, tokens.has("line-through") ? "line-through" : "", "line-through");
}

function getTextDecorationTokens(element) {
  const explicit = element.style.textDecoration || "";
  const computed = getComputedPreviewStyle("textDecorationLine") || getComputedPreviewStyle("textDecoration") || "";
  return new Set(`${explicit} ${computed}`.split(/\s+/).filter((token) => token && token !== "none"));
}

function setCanvasMode(mode) {
  if (!mode || appState.canvasMode === mode) return;
  appState.canvasMode = mode;
  applyCanvasState();
  scheduleAutosave();
}

function setZoomMode(mode) {
  if (!mode || appState.zoomMode === mode) return;
  appState.zoomMode = mode;
  applyCanvasState();
  scheduleAutosave();
}

function applyCanvasState() {
  canvasLayout.applyCanvasState({
    state: appState,
    buttons: { canvasModeButtons, zoomModeButtons },
    slideViewport,
    updateCanvasScale,
  });
}

function updateCanvasScale() {
  canvasLayout.updateCanvasScale({
    state: appState,
    previewStage,
    canvasShell,
    slideViewport,
    canvasInfo,
  });
}

function getElementLabel(element) {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const className = Array.from(element.classList)
    .filter((name) => !name.startsWith("__html_editor_"))
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join("");
  return `${tag}${id}${className}`;
}

function getElementPath(element) {
  const parts = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== "html") {
    parts.unshift(getElementLabel(current));
    current = current.parentElement;
  }
  return parts.join(" > ");
}

function getOwnText(element) {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
    .join("")
    .trim();
}

function supportsAttribute(element, attributeName) {
  const tagName = element.tagName.toLowerCase();
  if (attributeName === "src") return ["img", "video", "audio", "source", "iframe", "script"].includes(tagName);
  if (attributeName === "href") return ["a", "link"].includes(tagName);
  return false;
}

function getComputedPreviewStyle(styleName) {
  const previewElement = previewFrame.contentDocument?.querySelector(`[data-editor-id="${appState.selectedEditorId}"]`);
  if (!previewElement) return "";
  return previewFrame.contentWindow.getComputedStyle(previewElement)[styleName];
}

function normalizeColor(value) {
  if (!value) return "#000000";
  if (value.startsWith("#")) {
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value.slice(0, 7);
  }
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return "#000000";
  return [match[1], match[2], match[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")
    .padStart(6, "0")
    .replace(/^/, "#");
}

function handleFileUpload() {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    sourceEditor.value = String(reader.result || "");
    appState.sourceLabel = file.name || "上传文件";
    pushHistory(sourceEditor.value);
    renderPreview();
    scheduleAutosave();
  };
  reader.readAsText(file);
}

function loadSample() {
  sourceEditor.value = sampleHtml;
  appState.sourceLabel = "示例";
  pushHistory(sourceEditor.value);
  renderPreview();
  scheduleAutosave();
}

function clearSelection() {
  clearSelectionState();
  renderPreview();
}

function clearSelectionState() {
  appState.selectedEditorId = null;
  appState.selectedRange = null;
  floatingToolbar.classList.add("hidden");
  emptyInspector.classList.remove("hidden");
  inspectorForm.classList.add("hidden");
  clearSelectionBtn.disabled = true;
  selectParentBtn.disabled = true;
  locateSourceBtn.disabled = true;
  selectionLabel.textContent = "点击页面元素进行编辑";
  breadcrumbBar.textContent = "body";
  sourceSelectionInfo.textContent = "未选中元素";
  inspectorHint.textContent = "先在渲染区选择元素";
}

function undo() {
  if (appState.historyIndex <= 0) return;
  appState.historyIndex -= 1;
  restoreHistory();
}

function redo() {
  if (appState.historyIndex >= appState.history.length - 1) return;
  appState.historyIndex += 1;
  restoreHistory();
}

function restoreHistory() {
  sourceEditor.value = appState.history[appState.historyIndex];
  renderPreview();
  updateHistoryButtons();
  scheduleAutosave();
}

function pushHistory(source, options = {}) {
  stateHistory.pushHistory(appState, source, updateHistoryButtons, options);
}

function updateHistoryButtons() {
  undoBtn.disabled = appState.historyIndex <= 0;
  redoBtn.disabled = appState.historyIndex >= appState.history.length - 1;
}

function scheduleAutosave() {
  window.clearTimeout(appState.autosaveTimer);
  sourceStatus.textContent = "保存中";
  appState.autosaveTimer = window.setTimeout(saveDraft, 500);
}

function saveDraft() {
  const selectedElement = getSelectedSourceElement();
  const draft = {
    source: sourceEditor.value,
    sourceLabel: appState.sourceLabel,
    savedAt: new Date().toISOString(),
    canvasMode: appState.canvasMode,
    zoomMode: appState.zoomMode,
    selectedPath: selectedElement ? getElementIndexPath(selectedElement) : [],
  };

  try {
    stateHistory.writeDraft(localStorage, draftStorageKey, draft);
    sourceStatus.textContent = "已自动保存";
  } catch (error) {
    sourceStatus.textContent = "草稿过大，请导出";
  }
}

function showDraftPromptIfAvailable() {
  const draft = readDraft();
  if (!draft || !draft.source || draft.source === sourceEditor.value) return;
  draftInfo.textContent = `${draft.sourceLabel || "未命名文件"} · ${formatDraftTime(draft.savedAt)}`;
  draftBar.classList.remove("hidden");
  setAppViewportHeight();
  updateCanvasScale();
}

function restoreDraft() {
  const draft = readDraft();
  if (!draft?.source) return;

  sourceEditor.value = draft.source;
  appState.sourceLabel = draft.sourceLabel || "本地草稿";
  appState.canvasMode = draft.canvasMode || "16:9";
  appState.zoomMode = draft.zoomMode || "fit";
  pushHistory(sourceEditor.value, { replace: true });
  applyCanvasState();
  renderPreview();
  draftBar.classList.add("hidden");
  setAppViewportHeight();
  setSourceStatus("草稿已恢复");
}

function discardDraft() {
  localStorage.removeItem(draftStorageKey);
  draftBar.classList.add("hidden");
  setAppViewportHeight();
  updateCanvasScale();
  setSourceStatus("草稿已放弃");
}

function readDraft() {
  return stateHistory.readDraft(localStorage, draftStorageKey);
}

function formatDraftTime(value) {
  return stateHistory.formatDraftTime(value);
}

function downloadHtml() {
  const blob = new Blob([sourceEditor.value], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "edited-html-ppt.html";
  anchor.click();
  URL.revokeObjectURL(url);
}

function setSourceStatus(text) {
  sourceStatus.textContent = text;
}

init();
