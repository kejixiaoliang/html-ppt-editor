export const styleControlMap = {
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

export function updateElementOwnText(element, value) {
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

export function setOptionalAttribute(element, attributeName, value) {
  if (value) element.setAttribute(attributeName, value);
  else element.removeAttribute(attributeName);
}

export function updateFormatButtonState(button, value, activeValue) {
  const isActive = value === activeValue;
  button.classList.toggle("is-active", isActive);
  button.setAttribute("aria-pressed", String(isActive));
}
