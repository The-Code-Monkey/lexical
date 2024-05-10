const OFFSET_TOP = 10;
const HALF = 2;

const positionEditorElement = (
  editor: HTMLDivElement,
  rect: DOMRect | null | undefined,
) => {
  if (rect === null || rect === undefined) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.scrollY + OFFSET_TOP}px`;
    editor.style.left = `${rect.left + window.scrollX - editor.offsetWidth / HALF + rect.width / HALF}px`;
  }
};

export default positionEditorElement;
