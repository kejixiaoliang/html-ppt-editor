export function ensureHtmlDocument(doc) {
  if (!doc.head) {
    doc.documentElement.prepend(doc.createElement("head"));
  }
  if (!doc.body) {
    doc.documentElement.append(doc.createElement("body"));
  }
}

export function injectEditorIds(doc) {
  doc.body.querySelectorAll("*").forEach((element, index) => {
    if (!element.dataset.editorId) {
      element.dataset.editorId = `el_${String(index + 1).padStart(4, "0")}`;
    }
  });
}

export function injectPreviewBridge(doc) {
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
      outline: 2px solid #c5944a !important;
      outline-offset: 2px !important;
    }

    .__html_editor_selected__ {
      outline: 3px solid #b66a58 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(182, 106, 88, 0.18) !important;
    }

    .__html_editor_editing__ {
      cursor: text !important;
      -webkit-user-modify: read-write-plaintext-only;
      user-select: text !important;
    }

    .__html_editor_editing__:focus {
      outline: 3px solid #b66a58 !important;
      outline-offset: 3px !important;
    }

    .__html_editor_badge__ {
      position: fixed;
      z-index: 2147483647;
      max-width: 300px;
      padding: 5px 8px;
      border-radius: 6px;
      color: #fff;
      background: #b66a58;
      box-shadow: 0 8px 24px rgba(43, 38, 30, 0.22);
      font: 700 12px/1.2 "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
      pointer-events: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .__html_editor_badge__.__hover__ {
      background: #c5944a;
    }
  `;

  const script = doc.createElement("script");
  script.dataset.editorRuntime = "true";
  script.textContent = `
    (() => {
      document.documentElement.classList.add("__html_editor_pick_mode__");
      let hovered = null;
      let selected = null;
      let focusDrag = null;
      let suppressClick = false;
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

      function disableInlineEditing(element) {
        if (!element) return;
        element.removeAttribute("contenteditable");
        element.removeAttribute("spellcheck");
        element.classList.remove("__html_editor_editing__");
      }

      function enableInlineEditing(element, focusAtEnd) {
        if (!element) return;
        element.setAttribute("contenteditable", "plaintext-only");
        element.setAttribute("spellcheck", "false");
        element.classList.add("__html_editor_editing__");
        if (!focusAtEnd) return;
        element.focus({ preventScroll: true });
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      function selectElement(element, focusAtEnd) {
        if (selected && selected !== element) {
          selected.classList.remove("__html_editor_selected__");
          disableInlineEditing(selected);
        }
        selected = element;
        selected.classList.remove("__html_editor_hover__");
        selected.classList.add("__html_editor_selected__");
        enableInlineEditing(selected, focusAtEnd);
        showBadge(selected, false);
      }

      function clearSelectedElement() {
        if (!selected) return;
        selected.classList.remove("__html_editor_selected__", "__html_editor_hover__");
        disableInlineEditing(selected);
        selected = null;
        hovered = null;
        badge.hidden = true;
      }

      function isImageFocusCandidate(element) {
        if (!element) return false;
        if (element.tagName?.toLowerCase() === "img") return true;
        if (element.getAttribute("data-image")) return true;
        const style = window.getComputedStyle(element);
        return Boolean(style.backgroundImage && style.backgroundImage !== "none");
      }

      function focusPointFromEvent(element, event) {
        const rect = element.getBoundingClientRect();
        const x = rect.width ? ((event.clientX - rect.left) / rect.width) * 100 : 50;
        const y = rect.height ? ((event.clientY - rect.top) / rect.height) * 100 : 50;
        return {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y))
        };
      }

      function postImageFocus(element, event, commit) {
        const point = focusPointFromEvent(element, event);
        window.parent.postMessage({
          type: "editor:image-focus",
          editorId: element.dataset.editorId,
          x: point.x,
          y: point.y,
          commit
        }, "*");
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
        if (suppressClick) {
          suppressClick = false;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (selected === element && selected.isContentEditable) {
          event.stopPropagation();
          showBadge(selected, false);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        selectElement(element, true);
        window.parent.postMessage({
          type: "editor:select",
          editorId: selected.dataset.editorId
        }, "*");
      }, true);

      document.addEventListener("input", (event) => {
        if (!selected || !selected.contains(event.target)) return;
        window.parent.postMessage({
          type: "editor:inline-text",
          editorId: selected.dataset.editorId,
          text: selected.textContent || ""
        }, "*");
        showBadge(selected, false);
      }, true);

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !selected) return;
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: "editor:dismiss-selection" }, "*");
      }, true);

      document.addEventListener("pointerdown", (event) => {
        const element = getEditable(event.target);
        if (event.button !== 0 || !element || element !== selected || !isImageFocusCandidate(element)) return;
        event.preventDefault();
        event.stopPropagation();
        focusDrag = {
          element,
          pointerId: event.pointerId,
          moved: false
        };
        element.setPointerCapture?.(event.pointerId);
      }, true);

      document.addEventListener("pointermove", (event) => {
        if (!focusDrag || focusDrag.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        focusDrag.moved = true;
        postImageFocus(focusDrag.element, event, false);
      }, true);

      document.addEventListener("pointerup", (event) => {
        if (!focusDrag || focusDrag.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        postImageFocus(focusDrag.element, event, true);
        suppressClick = focusDrag.moved;
        focusDrag.element.releasePointerCapture?.(event.pointerId);
        focusDrag = null;
      }, true);

      document.addEventListener("dragover", (event) => {
        const element = getEditable(event.target);
        if (!element || !event.dataTransfer?.types?.includes("Files")) return;
        event.preventDefault();
        if (hovered && hovered !== selected) hovered.classList.remove("__html_editor_hover__");
        hovered = element;
        if (hovered !== selected) hovered.classList.add("__html_editor_hover__");
        showBadge(hovered, true);
      }, true);

      document.addEventListener("drop", async (event) => {
        const element = getEditable(event.target);
        const file = event.dataTransfer?.files?.[0];
        if (!element || !file || !file.type.startsWith("image/")) return;
        event.preventDefault();
        event.stopPropagation();
        selectElement(element, false);
        const dataUrl = await readFileAsDataUrl(file);
        const bytes = await file.arrayBuffer();
        window.parent.postMessage({
          type: "editor:replace-image-drop",
          editorId: element.dataset.editorId,
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
          bytes
        }, "*");
      }, true);

      function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }

      window.__selectEditorElement = (editorId) => {
        const element = document.querySelector('[data-editor-id="' + editorId + '"]');
        if (!element) return;
        selectElement(element, false);
      };

      window.__clearEditorSelection = clearSelectedElement;
    })();
  `;

  doc.head.append(style);
  doc.body.append(script);
}
