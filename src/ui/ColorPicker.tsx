import {
  type JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { clamp, transformColor } from "../utils/colorFunctions";
import { ColorPickerWrapper } from "./styles";
import TextInput from "./TextInput";

const WIDTH = 214;
const HEIGHT = 150;

const basicColors = [
  "#d0021b",
  "#f5a623",
  "#f8e71c",
  "#8b572a",
  "#7ed321",
  "#417505",
  "#bd10e0",
  "#9013fe",
  "#4a90e2",
  "#50e3c2",
  "#b8e986",
  "#000000",
  "#4a4a4a",
  "#9b9b9b",
  "#ffffff",
];

interface Position {
  xPos: number;
  yPos: number;
}

interface MoveWrapperProps {
  children: JSX.Element;
  className?: string;
  onChange: (position: Position) => void;
  style?: React.CSSProperties;
}

const defaultStyle = {};

const MoveWrapper = ({
  children,
  className = "",
  onChange,
  style = defaultStyle,
}: MoveWrapperProps) => {
  const divReference = useRef<HTMLButtonElement>(null);

  const move = useCallback(
    (event: MouseEvent | React.MouseEvent): void => {
      if (divReference.current) {
        const { current: div } = divReference;
        const { height, left, top, width } = div.getBoundingClientRect();

        const xPos = clamp(event.clientX - left, width, 0);
        const yPos = clamp(event.clientY - top, height, 0);

        onChange({
          xPos,
          yPos,
        });
      }
    },
    [onChange],
  );

  const onMouseDown = useCallback(
    (event: React.MouseEvent): void => {
      if (event.button !== 0) {
        return;
      }

      move(event);

      const onMouseMove = (innerEvent: MouseEvent): void => {
        move(innerEvent);
      };

      const onMouseUp = (innerEvent: MouseEvent): void => {
        document.removeEventListener("mousemove", onMouseMove, false);
        document.removeEventListener("mouseup", onMouseUp, false);

        move(innerEvent);
      };

      document.addEventListener("mousemove", onMouseMove, false);
      document.addEventListener("mouseup", onMouseUp, false);
    },
    [move],
  );

  return (
    <button
      className={className}
      onMouseDown={onMouseDown}
      ref={divReference}
      style={style}
      type="button"
    >
      {children}
    </button>
  );
};

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker = ({ color, onChange }: ColorPickerProps): JSX.Element => {
  const [selfColor, setSelfColor] = useState(transformColor("hex", color));
  const [inputColor, setInputColor] = useState(color);
  const innerDivReference = useRef<HTMLDivElement>(null);

  const PERCENTAGE_DIVISOR = 100;

  const saturationPosition = useMemo(
    () => ({
      x: (selfColor.hsv.s / PERCENTAGE_DIVISOR) * WIDTH,

      y: ((PERCENTAGE_DIVISOR - selfColor.hsv.v) / PERCENTAGE_DIVISOR) * HEIGHT,
    }),
    [selfColor.hsv.s, selfColor.hsv.v],
  );

  const HUE_DIVISOR = 360;

  const huePosition = useMemo(
    () => ({
      x: (selfColor.hsv.h / HUE_DIVISOR) * WIDTH,
    }),
    [selfColor.hsv],
  );

  const onSetHex = useCallback((hex: string) => {
    setInputColor(hex);

    if (/^#[\da-f]{6}$/iv.test(hex)) {
      const newColor = transformColor("hex", hex);

      setSelfColor(newColor);
    }
  }, []);

  const onMoveSaturation = useCallback(
    ({ xPos, yPos }: Position) => {
      const newHsv = {
        ...selfColor.hsv,

        s: (xPos / WIDTH) * PERCENTAGE_DIVISOR,

        v: PERCENTAGE_DIVISOR - (yPos / HEIGHT) * PERCENTAGE_DIVISOR,
      };

      const newColor = transformColor("hsv", newHsv);

      setSelfColor(newColor);
      setInputColor(newColor.hex);
    },
    [selfColor.hsv],
  );

  const onMoveHue = useCallback(
    ({ xPos }: Position) => {
      const newHsv = {
        ...selfColor.hsv,

        h: (xPos / WIDTH) * HUE_DIVISOR,
      };
      const newColor = transformColor("hsv", newHsv);

      setSelfColor(newColor);
      setInputColor(newColor.hex);
    },
    [selfColor.hsv],
  );

  useEffect(() => {
    // Check if the dropdown is actually active
    if (innerDivReference.current !== null) {
      onChange(selfColor.hex);
      setInputColor(selfColor.hex);
    }
  }, [selfColor, onChange]);

  useEffect(() => {
    const newColor = transformColor("hex", color);

    setSelfColor(newColor);
    setInputColor(newColor.hex);
  }, [color]);

  const style = useMemo(
    () => ({
      width: WIDTH,
    }),
    [],
  );

  const _style = useMemo(
    () => ({
      backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
    }),
    [selfColor.hsv.h],
  );

  const handleButtonClick = (basicColor: string) => () => {
    setInputColor(basicColor);
    setSelfColor(transformColor("hex", basicColor));
  };

  return (
    <ColorPickerWrapper
      className="color-picker-wrapper"
      ref={innerDivReference}
      style={style}
    >
      <TextInput label="Hex" onChange={onSetHex} value={inputColor} />
      <div className="color-picker-basic-color">
        {basicColors.map((basicColor) => (
          <button
            className={basicColor === selfColor.hex ? " active" : ""}
            key={basicColor}
            onClick={handleButtonClick(basicColor)}
            // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
            style={{
              backgroundColor: basicColor,
            }}
            type="button"
          />
        ))}
      </div>
      <MoveWrapper
        className="color-picker-saturation"
        onChange={onMoveSaturation}
        style={_style}
      >
        <div
          className="color-picker-saturation_cursor"
          // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
          style={{
            backgroundColor: selfColor.hex,
            left: saturationPosition.x,
            top: saturationPosition.y,
          }}
        />
      </MoveWrapper>
      <MoveWrapper className="color-picker-hue" onChange={onMoveHue}>
        <div
          className="color-picker-hue_cursor"
          // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
          style={{
            backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
            left: huePosition.x,
          }}
        />
      </MoveWrapper>
      <div
        className="color-picker-color"
        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
        style={{
          backgroundColor: selfColor.hex,
        }}
      />
    </ColorPickerWrapper>
  );
};

export default ColorPicker;
