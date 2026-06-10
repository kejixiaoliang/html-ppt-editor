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

const styleControlMap = {
  color: "color",
  background: "backgroundColor",
  fontSize: "fontSize",
  fontWeight: "fontWeight",
  fontFamily: "fontFamily",
  lineHeight: "lineHeight",
  letterSpacing: "letterSpacing",
  textAlign: "textAlign",
  width: "width",
  height: "height",
  margin: "margin",
  padding: "padding",
  borderRadius: "borderRadius",
  opacity: "opacity",
  boxShadow: "boxShadow",
  transform: "transform",
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
        color: #111827;
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
        color: #2563eb;
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
  previewScroll: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,
  sourceCollapsed: true,
  canvasMode: "16:9",
  zoomMode: "fit",
};

function init() {
  sourceEditor.value = sampleHtml;
  pushHistory(sampleHtml, { replace: true });
  bindEvents();
  applyWorkspaceState();
  applyCanvasState();
  renderPreview();
}

function bindEvents() {
  sourceEditor.addEventListener("input", () => {
    setSourceStatus("源码编辑中");
    clearSelectionState();
    window.clearTimeout(appState.renderTimer);
    appState.renderTimer = window.setTimeout(() => {
      pushHistory(sourceEditor.value);
      renderPreview();
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
  document.addEventListener("keydown", handleShortcuts);
  window.addEventListener("resize", () => updateCanvasScale());

  canvasModeButtons.forEach((button) => {
    button.addEventListener("click", () => setCanvasMode(button.dataset.canvasMode));
  });

  zoomModeButtons.forEach((button) => {
    button.addEventListener("click", () => setZoomMode(button.dataset.zoomMode));
  });

  window.addEventListener("message", (event) => {
    if (event.source !== previewFrame.contentWindow) {
      return;
    }

    if (event.data?.type === "editor:select") {
      selectElement(event.data.editorId);
    }
  });

  bindInspectorControl(controls.text, (element, value) => updateElementOwnText(element, value));
  bindInspectorControl(controls.id, (element, value) => setOptionalAttribute(element, "id", value));
  bindInspectorControl(controls.className, (element, value) => setOptionalAttribute(element, "class", value));
  bindInspectorControl(controls.src, (element, value) => setOptionalAttribute(element, "src", value));
  bindInspectorControl(controls.href, (element, value) => setOptionalAttribute(element, "href", value));
  bindStyleToggle(controls.italic, "fontStyle", "italic");
  bindTextDecorationToggle(controls.underline, "underline");
  bindTextDecorationToggle(controls.strike, "line-through");

  for (const [controlName, styleName] of Object.entries(styleControlMap)) {
    bindInspectorControl(controls[controlName], (element, value) => {
      element.style[styleName] = value;
    });
  }
}

function bindInspectorControl(control, applyChange) {
  control.addEventListener("input", () => {
    if (appState.updatingInspector || !appState.selectedEditorId) {
      return;
    }

    const element = getSelectedSourceElement();
    if (!element) {
      return;
    }

    applyChange(element, control.value.trim());
    const previewElement = getSelectedPreviewElement();
    if (previewElement) {
      applyChange(previewElement, control.value.trim());
    }
    syncSourceFromDoc();
    pushHistory(sourceEditor.value);
    updateFormatButtonState(button, element.style[styleName], activeValue);
    refreshSelectedMetadata();
  });
}

function bindStyleToggle(button, styleName, activeValue) {
  button.addEventListener("click", () => {
    if (appState.updatingInspector || !appState.selectedEditorId) return;
    const element = getSelectedSourceElement();
    if (!element) return;

    const isActive = element.style[styleName] === activeValue || getComputedPreviewStyle(styleName) === activeValue;
    element.style[styleName] = isActive ? "" : activeValue;
    const previewElement = getSelectedPreviewElement();
    if (previewElement) {
      previewElement.style[styleName] = element.style[styleName];
    }
    syncSourceFromDoc();
    pushHistory(sourceEditor.value);
    refreshSelectedMetadata();
  });
}

function bindTextDecorationToggle(button, token) {
  button.addEventListener("click", () => {
    if (appState.updatingInspector || !appState.selectedEditorId) return;
    const element = getSelectedSourceElement();
    if (!element) return;

    const tokens = getTextDecorationTokens(element);
    if (tokens.has(token)) {
      tokens.delete(token);
    } else {
      tokens.add(token);
    }
    element.style.textDecoration = Array.from(tokens).join(" ");
    const previewElement = getSelectedPreviewElement();
    if (previewElement) {
      previewElement.style.textDecoration = element.style.textDecoration;
    }
    syncSourceFromDoc();
    pushHistory(sourceEditor.value);
    updateTextDecorationButtonStates(element);
    refreshSelectedMetadata();
  });
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

function renderPreview(options = {}) {
  const scrollToRestore = options.preserveScroll ? capturePreviewScroll() : null;
  const parser = new DOMParser();
  appState.sourceDoc = parser.parseFromString(sourceEditor.value, "text/html");
  ensureHtmlDocument(appState.sourceDoc);
  injectEditorIds(appState.sourceDoc);
  injectPreviewBridge(appState.sourceDoc);

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
      updateCanvasScale();
    },
    { once: true },
  );

  previewFrame.srcdoc = `<!doctype html>\n${appState.sourceDoc.documentElement.outerHTML}`;

  if (!options.keepSelection) {
    clearSelectionState();
  }

  setSourceStatus("已同步");
}

function ensureHtmlDocument(doc) {
  if (!doc.head) {
    doc.documentElement.prepend(doc.createElement("head"));
  }
  if (!doc.body) {
    doc.documentElement.append(doc.createElement("body"));
  }
}

function injectEditorIds(doc) {
  doc.body.querySelectorAll("*").forEach((element, index) => {
    if (!element.dataset.editorId) {
      element.dataset.editorId = `el_${String(index + 1).padStart(4, "0")}`;
    }
  });
}

function injectPreviewBridge(doc) {
  doc.querySelectorAll("[data-editor-runtime]").forEach((node) => node.remove());

  const style = doc.createElement("style");
  style.dataset.editorRuntime = "true";
  style.textContent = `
    html.__html_editor_pick_mode__ * {
      cursor: crosshair !important;
    }

    [data-editor-id] {
      min-height: 1px;
    }

    .__html_editor_hover__ {
      outline: 2px solid #f59e0b !important;
      outline-offset: 2px !important;
    }

    .__html_editor_selected__ {
      outline: 3px solid #2563eb !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.16) !important;
    }

    .__html_editor_badge__ {
      position: fixed;
      z-index: 2147483647;
      max-width: 300px;
      padding: 5px 8px;
      border-radius: 6px;
      color: #fff;
      background: #2563eb;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
      font: 700 12px/1.2 "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
      pointer-events: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .__html_editor_badge__.__hover__ {
      background: #d97706;
    }
  `;

  const script = doc.createElement("script");
  script.dataset.editorRuntime = "true";
  script.textContent = `
    (() => {
      document.documentElement.classList.add("__html_editor_pick_mode__");
      let hovered = null;
      let selected = null;
      const badge = document.createElement("div");
      badge.className = "__html_editor_badge__";
      badge.hidden = true;
      document.documentElement.appendChild(badge);

      function getEditable(target) {
        return target?.closest?.("[data-editor-id]");
      }

      function labelFor(element) {
        const tag = element.tagName.toLowerCase();
        const id = element.id ? "#" + element.id : "";
        const className = [...element.classList]
          .filter((name) => !name.startsWith("__html_editor_"))
          .slice(0, 2)
          .map((name) => "." + name)
          .join("");
        return tag + id + className;
      }

      function showBadge(element, hover) {
        const rect = element.getBoundingClientRect();
        badge.textContent = labelFor(element);
        badge.classList.toggle("__hover__", hover);
        badge.style.left = Math.max(8, rect.left) + "px";
        badge.style.top = Math.max(8, rect.top - 30) + "px";
        badge.hidden = false;
      }

      document.addEventListener("mouseover", (event) => {
        const element = getEditable(event.target);
        if (!element || element === hovered) return;
        if (hovered && hovered !== selected) hovered.classList.remove("__html_editor_hover__");
        hovered = element;
        if (hovered !== selected) hovered.classList.add("__html_editor_hover__");
        if (hovered !== selected) showBadge(hovered, true);
      }, true);

      document.addEventListener("mouseout", (event) => {
        const element = getEditable(event.target);
        if (!element || element !== hovered) return;
        if (hovered !== selected) hovered.classList.remove("__html_editor_hover__");
        hovered = null;
        if (!selected) badge.hidden = true;
      }, true);

      document.addEventListener("click", (event) => {
        const element = getEditable(event.target);
        if (!element) return;
        event.preventDefault();
        event.stopPropagation();
        if (selected) selected.classList.remove("__html_editor_selected__");
        selected = element;
        selected.classList.remove("__html_editor_hover__");
        selected.classList.add("__html_editor_selected__");
        showBadge(selected, false);
        window.parent.postMessage({
          type: "editor:select",
          editorId: selected.dataset.editorId
        }, "*");
      }, true);

      window.__selectEditorElement = (editorId) => {
        const element = document.querySelector('[data-editor-id="' + editorId + '"]');
        if (!element) return;
        if (selected) selected.classList.remove("__html_editor_selected__");
        selected = element;
        selected.classList.add("__html_editor_selected__");
        showBadge(selected, false);
      };
    })();
  `;

  doc.head.append(style);
  doc.body.append(script);
}

function selectElement(editorId) {
  appState.selectedEditorId = editorId;
  previewFrame.contentWindow?.__selectEditorElement?.(editorId);
  updateInspector();
  locateCurrentSourceRange(false);
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

  controls.color.value = normalizeColor(element.style.color || getComputedPreviewStyle("color") || "#111827");
  controls.background.value = normalizeColor(
    element.style.backgroundColor || getComputedPreviewStyle("backgroundColor") || "#ffffff",
  );

  for (const [controlName, styleName] of Object.entries(styleControlMap)) {
    if (controlName === "color" || controlName === "background") continue;
    controls[controlName].value = element.style[styleName] || "";
  }
  updateFormatButtonState(controls.italic, element.style.fontStyle || getComputedPreviewStyle("fontStyle") || "", "italic");
  updateTextDecorationButtonStates(element);

  selectionLabel.textContent = `已选中：${label}`;
  breadcrumbBar.textContent = path;
  sourceSelectionInfo.textContent = range ? `源码已定位：${label}` : `源码定位失败：${label}`;
  renderHierarchyControls(element);

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
  const source = sourceEditor.value;
  const cleanDoc = getCleanSourceDoc();
  const path = getElementIndexPath(element);
  const cleanElement = getElementByIndexPath(cleanDoc, path);

  if (!cleanElement) {
    return null;
  }

  const outer = cleanElement.outerHTML;
  let start = source.indexOf(outer);

  if (start === -1) {
    const openTag = getOpeningTag(cleanElement);
    start = source.indexOf(openTag);
    if (start === -1) {
      start = findOpeningTagByAttributes(source, cleanElement);
    }
    if (start === -1) return null;
    const end = source.indexOf(">", start);
    return { start, end: end === -1 ? start + openTag.length : end + 1 };
  }

  return { start, end: start + outer.length };
}

function findOpeningTagByAttributes(source, element) {
  const tagName = element.tagName.toLowerCase();
  const id = element.getAttribute("id");
  const className = element.getAttribute("class");
  const tagPattern = new RegExp(`<${tagName}(\\s|>|/)`, "gi");
  let match;

  while ((match = tagPattern.exec(source))) {
    const start = match.index;
    const end = source.indexOf(">", start);
    if (end === -1) continue;
    const openTag = source.slice(start, end + 1);
    if (id && !openTag.includes(`id="${id}"`) && !openTag.includes(`id='${id}'`)) continue;
    if (className && !openTag.includes(className)) continue;
    return start;
  }

  return -1;
}

function getCleanSourceDoc() {
  const cleanDoc = appState.sourceDoc.cloneNode(true);
  cleanEditorRuntime(cleanDoc);
  return cleanDoc;
}

function getElementIndexPath(element) {
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

function getElementByIndexPath(doc, path) {
  let current = doc.body;
  for (const index of path) {
    if (!current || !current.children[index]) {
      return null;
    }
    current = current.children[index];
  }
  return current;
}

function getOpeningTag(element) {
  const html = element.outerHTML;
  const end = html.indexOf(">");
  return end === -1 ? html : html.slice(0, end + 1);
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
}

function syncSourceFromDoc() {
  if (!appState.sourceDoc) return;
  const cleanDoc = getCleanSourceDoc();
  sourceEditor.value = formatHtmlForMvp(`<!doctype html>\n${cleanDoc.documentElement.outerHTML}`);
  setSourceStatus("已同步");
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

function updateFormatButtonState(button, value, activeValue) {
  const isActive = value === activeValue;
  button.classList.toggle("is-active", isActive);
  button.setAttribute("aria-pressed", String(isActive));
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
}

function setZoomMode(mode) {
  if (!mode || appState.zoomMode === mode) return;
  appState.zoomMode = mode;
  applyCanvasState();
}

function applyCanvasState() {
  canvasModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.canvasMode === appState.canvasMode);
  });
  zoomModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.zoomMode === appState.zoomMode);
  });

  slideViewport.classList.toggle("is-adaptive", appState.canvasMode === "adaptive");
  if (appState.canvasMode === "4:3") {
    slideViewport.style.aspectRatio = "4 / 3";
  } else if (appState.canvasMode === "16:9") {
    slideViewport.style.aspectRatio = "16 / 9";
  } else {
    slideViewport.style.aspectRatio = "";
  }

  updateCanvasScale();
}

function updateCanvasScale() {
  if (!previewStage || !canvasShell) return;

  const fixedWidth = appState.canvasMode === "4:3" ? 960 : 1120;
  const stageWidth = Math.max(280, previewStage.clientWidth - 56);
  const stageHeight = Math.max(260, previewStage.clientHeight - 56);
  const baseHeight = appState.canvasMode === "4:3" ? fixedWidth * 0.75 : fixedWidth * 0.5625;
  const fitScale = appState.canvasMode === "adaptive" ? 1 : Math.min(1, stageWidth / fixedWidth, stageHeight / baseHeight);
  const scale = appState.zoomMode === "fit" ? fitScale : Number(appState.zoomMode);

  canvasShell.style.width = appState.canvasMode === "adaptive" ? "min(100%, 1180px)" : `${fixedWidth}px`;
  canvasShell.style.transform = `scale(${scale})`;
  canvasShell.style.margin = appState.canvasMode === "adaptive" || scale <= 1 ? "0" : `${(baseHeight * (scale - 1)) / 2}px 0`;
  canvasInfo.textContent = `${canvasLabel(appState.canvasMode)} · ${zoomLabel(appState.zoomMode, scale)}`;
}

function canvasLabel(mode) {
  if (mode === "adaptive") return "自适应";
  return mode;
}

function zoomLabel(mode, scale) {
  if (mode === "fit") return `Fit ${Math.round(scale * 100)}%`;
  return `${Math.round(Number(mode) * 100)}%`;
}

function cleanEditorRuntime(doc) {
  doc.querySelectorAll("[data-editor-runtime]").forEach((node) => node.remove());
  doc.querySelectorAll("[data-editor-id]").forEach((element) => {
    element.removeAttribute("data-editor-id");
    element.classList.remove("__html_editor_hover__", "__html_editor_selected__");
    if (!element.getAttribute("class")) element.removeAttribute("class");
  });
  doc.querySelectorAll(".__html_editor_badge__").forEach((node) => node.remove());
  doc.documentElement.classList.remove("__html_editor_pick_mode__");
  if (!doc.documentElement.getAttribute("class")) doc.documentElement.removeAttribute("class");
}

function setOptionalAttribute(element, attributeName, value) {
  if (value) element.setAttribute(attributeName, value);
  else element.removeAttribute(attributeName);
}

function updateElementOwnText(element, value) {
  const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.textContent = value;
    return;
  }
  if (element.firstChild) {
    element.insertBefore(element.ownerDocument.createTextNode(value), element.firstChild);
    return;
  }
  element.textContent = value;
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
    pushHistory(sourceEditor.value);
    renderPreview();
  };
  reader.readAsText(file);
}

function loadSample() {
  sourceEditor.value = sampleHtml;
  pushHistory(sourceEditor.value);
  renderPreview();
}

function clearSelection() {
  clearSelectionState();
  renderPreview();
}

function clearSelectionState() {
  appState.selectedEditorId = null;
  appState.selectedRange = null;
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
}

function pushHistory(source, options = {}) {
  if (options.replace) {
    appState.history = [source];
    appState.historyIndex = 0;
    updateHistoryButtons();
    return;
  }
  if (appState.history[appState.historyIndex] === source) {
    updateHistoryButtons();
    return;
  }
  appState.history = appState.history.slice(0, appState.historyIndex + 1);
  appState.history.push(source);
  if (appState.history.length > 80) appState.history.shift();
  appState.historyIndex = appState.history.length - 1;
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = appState.historyIndex <= 0;
  redoBtn.disabled = appState.historyIndex >= appState.history.length - 1;
}

function downloadHtml() {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sourceEditor.value, "text/html");
  cleanEditorRuntime(doc);
  const blob = new Blob([`<!doctype html>\n${doc.documentElement.outerHTML}`], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "edited-html-ppt.html";
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatHtmlForMvp(html) {
  return html
    .replace(/></g, ">\n<")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function setSourceStatus(text) {
  sourceStatus.textContent = text;
}

init();
