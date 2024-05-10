const HEX_SHORT_LENGTH = 4;
const HEX_SHORT_ALPHA_LENGTH = 5;
const HEX_LENGTH = 7;
const HEX_ALPHA_LENGTH = 9;
const MAX_COLOR_VALUE = 255;
const HUE_OFFSET_RED = 6;
const HUE_OFFSET_GREEN = 2;
const HUE_OFFSET_BLUE = 4;
const HUE_MULTIPLIER = 60;
const PERCENTAGE_FACTOR = 100;
const DEFAULT_COLOR_VALUE = 0;
const ERROR_MESSAGE = "2d context not supported or canvas already initialized";

interface RGB {
  b: number;
  g: number;
  r: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

interface Color {
  hex: string;
  hsv: HSV;
  rgb: RGB;
}

const createCanvasContext = (
  value: string,
): CanvasRenderingContext2D | null => {
  const ctx = document.createElement("canvas").getContext("2d");

  if (!ctx) {
    throw new Error(ERROR_MESSAGE);
  }

  ctx.fillStyle = value;

  return ctx;
};

const handleShortHex = (value: string): string =>
  value
    .split("")
    .map((v, index) => (index ? v + v : "#"))
    .join("");

const toHex = (value: string): string => {
  if (!value.startsWith("#")) {
    const ctx = createCanvasContext(value);

    if (ctx !== null && typeof ctx.fillStyle === "string") {
      return ctx.fillStyle;
    }
  }

  if (
    value.length === HEX_SHORT_LENGTH ||
    value.length === HEX_SHORT_ALPHA_LENGTH
  ) {
    return handleShortHex(value);
  }

  if (value.length === HEX_LENGTH || value.length === HEX_ALPHA_LENGTH) {
    return value;
  }

  return "#000000";
};

const hex2rgb = (hex: string): RGB => {
  const rbgArray = (
    hex
      .replace(
        /^#?(?<temp1>[\da-f])(?<temp2>[\da-f])(?<temp3>[\da-f])$/i,
        (match, red, green, blue) =>
          `#${red}${red}${green}${green}${blue}${blue}`,
      )
      .slice(1)
      .match(/.{2}/gv) ?? []
  ).map((hexValue) => Number.parseInt(hexValue, 16));

  const RGB_INDEX_BLUE = 2;
  const RGB_INDEX_GREEN = 1;
  const RGB_INDEX_RED = 0;

  return {
    b: rbgArray[RGB_INDEX_BLUE] ?? 0,
    g: rbgArray[RGB_INDEX_GREEN] ?? 0,
    r: rbgArray[RGB_INDEX_RED] ?? 0,
  };
};

// Helper function to calculate hue
const calculateHueHelper = (
  r: number,
  g: number,
  b: number,
  max: number,
  d: number,
) => {
  if (max === r) {
    return (g - b) / d + (g < b ? HUE_OFFSET_RED : 0);
  }

  if (max === g) {
    return HUE_OFFSET_GREEN + (b - r) / d;
  }

  return HUE_OFFSET_BLUE + (r - g) / d;
};

const calculateHue = (
  r: number,
  g: number,
  b: number,
  max: number,
  d: number,
) => {
  if (d === 0) {
    return 0;
  }

  const hue = calculateHueHelper(r, g, b, max, d);

  return hue * HUE_MULTIPLIER;
};

// Helper function to calculate saturation
const calculateSaturation = (max: number, d: number) =>
  max ? (d / max) * PERCENTAGE_FACTOR : 0;

// Main function
const rgb2hsv = ({ b, g, r }: RGB): HSV => {
  r /= MAX_COLOR_VALUE;
  g /= MAX_COLOR_VALUE;
  b /= MAX_COLOR_VALUE;

  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);

  const h = calculateHue(r, g, b, max, d);
  const s = calculateSaturation(max, d);
  const v = max * PERCENTAGE_FACTOR;

  return {
    h,
    s,
    v,
  };
};

// Helper function to calculate color array
const calculateColorArray = (v: number, s: number, f: number) => {
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  return [v, q, p, p, t, v];
};

// Helper function to calculate RGB
const calculateRGB = (colorArray: number[]) => {
  const RGB_INDEX_RED = 0;
  const RGB_INDEX_GREEN = 1;
  const RGB_INDEX_BLUE = 2;

  const r = Math.round(
    (colorArray[RGB_INDEX_RED] ?? DEFAULT_COLOR_VALUE) * MAX_COLOR_VALUE,
  );
  const g = Math.round(
    (colorArray[RGB_INDEX_GREEN] ?? DEFAULT_COLOR_VALUE) * MAX_COLOR_VALUE,
  );
  const b = Math.round(
    (colorArray[RGB_INDEX_BLUE] ?? DEFAULT_COLOR_VALUE) * MAX_COLOR_VALUE,
  );

  return { b, g, r };
};

// Main function
const hsv2rgb = ({ h, s, v }: HSV): RGB => {
  const PERCENTAGE_DIVISOR = 100;
  const HUE_DIVISOR = 60;

  s /= PERCENTAGE_DIVISOR;
  v /= PERCENTAGE_DIVISOR;

  const index = Math.trunc(h / HUE_DIVISOR);
  const f = h / HUE_DIVISOR - index;

  const colorArray = calculateColorArray(v, s, f);

  return calculateRGB(colorArray);
};

const rgb2hex = ({ b, g, r }: RGB): string => {
  const HEX_BASE = 16;
  const HEX_LENGTH = 2;

  return `#${[r, g, b].map((x) => x.toString(HEX_BASE).padStart(HEX_LENGTH, "0")).join("")}`;
};

const clamp = (value: number, max: number, min: number) => {
  if (value > max) {
    return max;
  }

  if (value < min) {
    return min;
  }

  return value;
};

const transformColorHex = (color: Color["hex"]): Color => {
  const hex: Color["hex"] = toHex(color);
  const rgb: Color["rgb"] = hex2rgb(hex);
  const hsv: Color["hsv"] = rgb2hsv(rgb);

  return {
    hex,
    hsv,
    rgb,
  };
};

const transformColorRgb = (color: Color["rgb"]): Color => {
  const rgb: Color["rgb"] = color;
  const hex: Color["hex"] = rgb2hex(rgb);
  const hsv: Color["hsv"] = rgb2hsv(rgb);

  return {
    hex,
    hsv,
    rgb,
  };
};

const transformColorHsv = (color: Color["hsv"]): Color => {
  const hsv: Color["hsv"] = color;
  const rgb: Color["rgb"] = hsv2rgb(hsv);
  const hex: Color["hex"] = rgb2hex(rgb);

  return {
    hex,
    hsv,
    rgb,
  };
};

const isHex = (color: Color[keyof Color]): color is Color["hex"] =>
  typeof color === "string";
const isHsv = (color: Color[keyof Color]): color is Color["hsv"] =>
  typeof color === "object" && "h" in color && "s" in color && "v" in color;
const isRgb = (color: Color[keyof Color]): color is Color["rgb"] =>
  typeof color === "object" && "r" in color && "g" in color && "b" in color;

const transformColor = <Match extends keyof Color>(
  format: Match,
  color: Color[Match],
): Color => {
  if (isHex(color)) {
    return transformColorHex(color);
  }

  if (isHsv(color)) {
    return transformColorHsv(color);
  }

  if (isRgb(color)) {
    return transformColorRgb(color);
  }

  throw new Error("Invalid color format");
};

export { clamp, transformColor };
