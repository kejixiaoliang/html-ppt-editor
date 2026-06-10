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
