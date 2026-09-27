# Single HTML Open And Overwrite Save Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Add writable single-HTML and single-entry-folder opening, then save edited source back to the original HTML file.

**Architecture:** Keep the editor's existing single-entry project model. Add a small File System Access adapter for directory traversal and writable handles, while `app.js` owns the active entry handle, UI state, and fallback to the current read-only file inputs.

**Tech Stack:** Browser File System Access API, vanilla JavaScript ES modules, existing HTML/CSS UI and Node verification scripts.

---

### Task 1: Add File System Access Adapter

**Files:**
- Create: `src/fileSystemAccess.js`

1. Add capability checks for `showOpenFilePicker` and `showDirectoryPicker`.
2. Add a recursive directory reader that returns files with stable relative paths plus a path-to-file-handle map.
3. Keep cancellation and permission errors available to the UI layer without changing editor state.

### Task 2: Add Open And Save Controls

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

1. Replace label-driven upload controls with explicit “打开 HTML” and “打开文件夹” buttons while retaining hidden fallback inputs.
2. Add a disabled “覆盖保存” button beside export actions.
3. Store only the current entry HTML file handle in application state.
4. Open a single HTML with a writable picker when supported; otherwise trigger the existing file input.
5. Open a folder with a directory picker, reuse `importHtmlFolder`, and map its selected entry path back to the writable file handle; otherwise trigger the existing folder input.
6. Write `sourceEditor.value` directly through `createWritable()`, update project entry content, and report success or failure through the existing status pill.
7. Clear the writable target when loading a sample, restoring a draft, or using a read-only fallback.

### Task 3: Update Product Checks And Documentation

**Files:**
- Modify: `scripts/check.js`
- Modify: `README.md`

1. Require the new control IDs and file-system adapter exports in static checks.
2. Document writable browser support, fallback behavior, and the fact that the editor still edits only one entry HTML.

### Task 4: Post-Implementation Verification

**Files:**
- Verify all modified files.

1. Run `npm test` and confirm all static and existing behavior checks pass.
2. Run `git diff --check`.
3. Use the browser to confirm the page loads, new controls render without overlap, fallback controls remain hidden, and save is disabled before a writable file is opened.
4. Exercise cancellation/fallback paths where browser automation permits; record any native picker limitation explicitly.
