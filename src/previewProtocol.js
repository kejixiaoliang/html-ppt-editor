export const previewMessageTypes = {
  select: "editor:select",
  inlineText: "editor:inline-text",
  replaceImageDrop: "editor:replace-image-drop",
  imageFocus: "editor:image-focus",
};

export function isPreviewMessage(event, previewWindow) {
  return Boolean(event && event.source === previewWindow && event.data?.type);
}

export function getPreviewMessageType(event) {
  return event?.data?.type || "";
}

