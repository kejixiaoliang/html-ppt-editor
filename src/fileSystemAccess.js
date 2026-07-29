export function supportsFilePicker(host = globalThis) {
  return typeof host?.showOpenFilePicker === "function";
}

export function supportsDirectoryPicker(host = globalThis) {
  return typeof host?.showDirectoryPicker === "function";
}

export function isFilePickerAbort(error) {
  return error?.name === "AbortError";
}

export async function readDirectoryProject(directoryHandle) {
  const files = [];
  const fileHandles = new Map();
  const rootName = directoryHandle?.name || "项目";

  await collectDirectoryFiles(directoryHandle, rootName, files, fileHandles);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "zh-CN"));

  return { files, fileHandles };
}

async function collectDirectoryFiles(directoryHandle, currentPath, files, fileHandles) {
  for await (const [name, handle] of directoryHandle.entries()) {
    const relativePath = `${currentPath}/${name}`;
    if (handle.kind === "directory") {
      await collectDirectoryFiles(handle, relativePath, files, fileHandles);
      continue;
    }

    if (handle.kind !== "file") continue;
    const file = await handle.getFile();
    files.push(withRelativePath(file, relativePath));
    fileHandles.set(relativePath, handle);
  }
}

function withRelativePath(file, relativePath) {
  try {
    Object.defineProperty(file, "relativePath", {
      configurable: true,
      value: relativePath,
    });
    return file;
  } catch {
    const clone = new File([file], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    });
    Object.defineProperty(clone, "relativePath", { value: relativePath });
    return clone;
  }
}
