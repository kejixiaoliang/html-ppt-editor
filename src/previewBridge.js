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
    html.__html_editor_pick_mode__ * { cursor: crosshair !important; }
    [data-editor-id] { min-height: 1px; }
    .__html_editor_hover__ {
      outline: 2px solid #c5944a !important;
      outline-offset: 2px !important;
    }
    .__html_editor_selected__ {
      outline: 3px solid #b66a58 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 6px rgba(182, 106, 88, 0.18) !important;
    }
    .__html_editor_multi_selected__ {
      outline: 2px dashed #8d473c !important;
      outline-offset: 3px !important;
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
    .__html_editor_badge__,
    .__html_editor_handle__,
    .__html_editor_guide__ {
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
    }
    .__html_editor_badge__ {
      max-width: 300px;
      padding: 5px 8px;
      border-radius: 6px;
      color: #fff;
      background: #b66a58;
      box-shadow: 0 8px 24px rgba(43, 38, 30, 0.22);
      font: 700 12px/1.2 "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .__html_editor_badge__.__hover__ { background: #c5944a; }
    .__html_editor_handle__ {
      width: 13px;
      height: 13px;
      border: 2px solid #fff;
      border-radius: 4px;
      background: #b66a58;
      box-shadow: 0 5px 16px rgba(43, 38, 30, 0.24);
      cursor: nwse-resize !important;
      pointer-events: auto;
    }
    .__html_editor_guide__ {
      background: rgba(182, 106, 88, 0.8);
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
      let visualDrag = null;
      let suppressClick = false;
      const selectedIds = new Set();
      const badge = document.createElement("div");
      const resizeHandle = document.createElement("div");
      const guides = [document.createElement("div"), document.createElement("div")];
      badge.className = "__html_editor_badge__";
      badge.hidden = true;
      resizeHandle.className = "__html_editor_handle__";
      resizeHandle.hidden = true;
      guides.forEach((guide) => {
        guide.className = "__html_editor_guide__";
        guide.hidden = true;
        document.documentElement.appendChild(guide);
      });
      document.documentElement.append(badge, resizeHandle);

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
        badge.textContent = selectedIds.size > 1 && !hover ? selectedIds.size + " selected" : labelFor(element);
        badge.classList.toggle("__hover__", hover);
        badge.style.left = Math.max(8, rect.left) + "px";
        badge.style.top = Math.max(8, rect.top - 30) + "px";
        badge.hidden = false;
      }

      function syncHandle() {
        if (!selected) {
          resizeHandle.hidden = true;
          return;
        }
        const rect = selected.getBoundingClientRect();
        resizeHandle.style.left = rect.right - 6 + "px";
        resizeHandle.style.top = rect.bottom - 6 + "px";
        resizeHandle.hidden = false;
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

      function clearSelectedClasses() {
        document.querySelectorAll(".__html_editor_selected__, .__html_editor_multi_selected__").forEach((element) => {
          element.classList.remove("__html_editor_selected__", "__html_editor_multi_selected__");
          disableInlineEditing(element);
        });
      }

      function paintSelection() {
        clearSelectedClasses();
        selectedIds.forEach((editorId) => {
          const element = document.querySelector('[data-editor-id="' + editorId + '"]');
          if (!element) return;
          element.classList.add(editorId === selected?.dataset.editorId ? "__html_editor_selected__" : "__html_editor_multi_selected__");
        });
        if (selected) {
          enableInlineEditing(selected, false);
          showBadge(selected, false);
        }
        syncHandle();
      }

      function selectElement(element, options = {}) {
        if (!element) return;
        if (options.extend) {
          if (selectedIds.has(element.dataset.editorId) && selectedIds.size > 1) {
            selectedIds.delete(element.dataset.editorId);
          } else {
            selectedIds.add(element.dataset.editorId);
          }
        } else {
          selectedIds.clear();
          selectedIds.add(element.dataset.editorId);
        }
        selected = element;
        element.classList.remove("__html_editor_hover__");
        paintSelection();
      }

      function selectedElements() {
        return [...selectedIds]
          .map((editorId) => document.querySelector('[data-editor-id="' + editorId + '"]'))
          .filter(Boolean);
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
        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
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

      function parsePx(value) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      function movePatch(record, dx, dy) {
        const position = record.position && record.position !== "static" ? record.position : "relative";
        return {
          position,
          left: Math.round(record.left + dx) + "px",
          top: Math.round(record.top + dy) + "px"
        };
      }

      function resizePatch(record, dx, dy) {
        return {
          width: Math.max(16, Math.round(record.width + dx)) + "px",
          height: Math.max(16, Math.round(record.height + dy)) + "px"
        };
      }

      function applyPatch(element, patch) {
        Object.entries(patch).forEach(([property, value]) => {
          element.style[property] = value;
        });
      }

      function buildMoveRecords(elements) {
        return elements.map((element) => {
          const style = window.getComputedStyle(element);
          return {
            element,
            editorId: element.dataset.editorId,
            position: style.position,
            left: parsePx(element.style.left || style.left),
            top: parsePx(element.style.top || style.top),
            rect: element.getBoundingClientRect()
          };
        });
      }

      function buildResizeRecord(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          element,
          editorId: element.dataset.editorId,
          width: parsePx(element.style.width || style.width || rect.width),
          height: parsePx(element.style.height || style.height || rect.height),
          rect
        };
      }

      function nearestGuide(records, dx, dy) {
        const moving = records[0]?.rect;
        if (!moving) return { dx, dy, x: null, y: null };
        const movedX = [moving.left + dx, moving.left + dx + moving.width / 2, moving.right + dx];
        const movedY = [moving.top + dy, moving.top + dy + moving.height / 2, moving.bottom + dy];
        const others = [...document.querySelectorAll("[data-editor-id]")]
          .filter((element) => !selectedIds.has(element.dataset.editorId))
          .map((element) => element.getBoundingClientRect());
        let snapX = null;
        let snapY = null;
        for (const rect of others) {
          for (const target of [rect.left, rect.left + rect.width / 2, rect.right]) {
            for (const value of movedX) {
              if (Math.abs(value - target) <= 5) snapX = target - value;
            }
          }
          for (const target of [rect.top, rect.top + rect.height / 2, rect.bottom]) {
            for (const value of movedY) {
              if (Math.abs(value - target) <= 5) snapY = target - value;
            }
          }
        }
        return {
          dx: dx + (snapX || 0),
          dy: dy + (snapY || 0),
          x: snapX === null ? null : movedX[0] + (snapX || 0),
          y: snapY === null ? null : movedY[0] + (snapY || 0)
        };
      }

      function showGuides(snap) {
        const v = guides[0];
        const h = guides[1];
        if (snap.x === null) {
          v.hidden = true;
        } else {
          v.hidden = false;
          v.style.left = snap.x + "px";
          v.style.top = "0";
          v.style.width = "1px";
          v.style.height = window.innerHeight + "px";
        }
        if (snap.y === null) {
          h.hidden = true;
        } else {
          h.hidden = false;
          h.style.left = "0";
          h.style.top = snap.y + "px";
          h.style.width = window.innerWidth + "px";
          h.style.height = "1px";
        }
      }

      function hideGuides() {
        guides.forEach((guide) => {
          guide.hidden = true;
        });
      }

      function postVisualPatches(patches, commit) {
        window.parent.postMessage({ type: "editor:visual-edit", patches, commit }, "*");
      }

      document.addEventListener("mouseover", (event) => {
        const element = getEditable(event.target);
        if (!element || element === hovered) return;
        if (hovered && !selectedIds.has(hovered.dataset.editorId)) hovered.classList.remove("__html_editor_hover__");
        hovered = element;
        if (!selectedIds.has(hovered.dataset.editorId)) hovered.classList.add("__html_editor_hover__");
        if (!selectedIds.has(hovered.dataset.editorId)) showBadge(hovered, true);
      }, true);

      document.addEventListener("mouseout", (event) => {
        const element = getEditable(event.target);
        if (!element || element !== hovered) return;
        if (!selectedIds.has(hovered.dataset.editorId)) hovered.classList.remove("__html_editor_hover__");
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
        if (selected === element && selected.isContentEditable && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          event.stopPropagation();
          showBadge(selected, false);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        selectElement(element, { extend: event.shiftKey || event.ctrlKey || event.metaKey });
        window.parent.postMessage({
          type: "editor:select",
          editorId: selected.dataset.editorId,
          editorIds: [...selectedIds]
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
        syncHandle();
      }, true);

      document.addEventListener("pointerdown", (event) => {
        const element = getEditable(event.target);
        if (event.button !== 0 || !element) return;
        if (event.detail > 1 && element === selected && isImageFocusCandidate(element)) {
          event.preventDefault();
          event.stopPropagation();
          focusDrag = { element, pointerId: event.pointerId, moved: false };
          element.setPointerCapture?.(event.pointerId);
          return;
        }
        if (element !== selected && !selectedIds.has(element.dataset.editorId)) return;
        visualDrag = {
          mode: event.target === resizeHandle ? "resize" : "move",
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          moveRecords: buildMoveRecords(selectedElements()),
          resizeRecord: buildResizeRecord(selected || element)
        };
        element.setPointerCapture?.(event.pointerId);
      }, true);

      resizeHandle.addEventListener("pointerdown", (event) => {
        if (!selected) return;
        event.preventDefault();
        event.stopPropagation();
        visualDrag = {
          mode: "resize",
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          moveRecords: buildMoveRecords(selectedElements()),
          resizeRecord: buildResizeRecord(selected)
        };
        resizeHandle.setPointerCapture?.(event.pointerId);
      });

      document.addEventListener("pointermove", (event) => {
        if (focusDrag && focusDrag.pointerId === event.pointerId) {
          event.preventDefault();
          event.stopPropagation();
          focusDrag.moved = true;
          postImageFocus(focusDrag.element, event, false);
          return;
        }
        if (!visualDrag || visualDrag.pointerId !== event.pointerId) return;
        const rawDx = event.clientX - visualDrag.startX;
        const rawDy = event.clientY - visualDrag.startY;
        if (!visualDrag.moved && Math.hypot(rawDx, rawDy) < 4) return;
        visualDrag.moved = true;
        event.preventDefault();
        event.stopPropagation();
        const patches = [];
        if (visualDrag.mode === "resize") {
          const patch = resizePatch(visualDrag.resizeRecord, rawDx, rawDy);
          applyPatch(visualDrag.resizeRecord.element, patch);
          patches.push({ editorId: visualDrag.resizeRecord.editorId, styles: patch });
          hideGuides();
        } else {
          const snap = nearestGuide(visualDrag.moveRecords, rawDx, rawDy);
          showGuides(snap);
          for (const record of visualDrag.moveRecords) {
            const patch = movePatch(record, snap.dx, snap.dy);
            applyPatch(record.element, patch);
            patches.push({ editorId: record.editorId, styles: patch });
          }
        }
        syncHandle();
        showBadge(selected, false);
        postVisualPatches(patches, false);
      }, true);

      document.addEventListener("pointerup", (event) => {
        if (focusDrag && focusDrag.pointerId === event.pointerId) {
          event.preventDefault();
          event.stopPropagation();
          postImageFocus(focusDrag.element, event, true);
          suppressClick = focusDrag.moved;
          focusDrag.element.releasePointerCapture?.(event.pointerId);
          focusDrag = null;
          return;
        }
        if (!visualDrag || visualDrag.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        hideGuides();
        const dx = event.clientX - visualDrag.startX;
        const dy = event.clientY - visualDrag.startY;
        const patches = [];
        if (visualDrag.mode === "resize") {
          patches.push({ editorId: visualDrag.resizeRecord.editorId, styles: resizePatch(visualDrag.resizeRecord, dx, dy) });
        } else {
          const snap = nearestGuide(visualDrag.moveRecords, dx, dy);
          for (const record of visualDrag.moveRecords) {
            patches.push({ editorId: record.editorId, styles: movePatch(record, snap.dx, snap.dy) });
          }
        }
        suppressClick = visualDrag.moved;
        visualDrag = null;
        if (patches.length) postVisualPatches(patches, true);
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
        selectElement(element);
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

      window.__selectEditorElement = (editorId, editorIds = [editorId]) => {
        const element = document.querySelector('[data-editor-id="' + editorId + '"]');
        if (!element) return;
        selectedIds.clear();
        editorIds.filter(Boolean).forEach((id) => selectedIds.add(id));
        if (!selectedIds.size) selectedIds.add(editorId);
        selected = element;
        paintSelection();
      };

      window.__applyEditorStylePatches = (patches = []) => {
        for (const item of patches) {
          const element = document.querySelector('[data-editor-id="' + item.editorId + '"]');
          if (element) applyPatch(element, item.styles || {});
        }
        syncHandle();
      };

      window.addEventListener("scroll", syncHandle, { passive: true });
      window.addEventListener("resize", syncHandle);
    })();
  `;

  doc.head.append(style);
  doc.body.append(script);
}
