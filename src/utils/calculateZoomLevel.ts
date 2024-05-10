const IS_FIREFOX = /^(?!.*seamonkey)(?=.*firefox).*/i.test(navigator.userAgent);

const calculateZoom = (element: Element | null, zoom = 1): number => {
  if (!element) {
    return zoom;
  }

  const newZoom =
    zoom * Number(window.getComputedStyle(element).getPropertyValue("zoom"));
  const { parentElement } = element;

  return calculateZoom(parentElement, newZoom);
};

const calculateZoomLevel = (element: Element | null): number => {
  if (IS_FIREFOX) {
    return 1;
  }

  return calculateZoom(element);
};

export default calculateZoomLevel;
