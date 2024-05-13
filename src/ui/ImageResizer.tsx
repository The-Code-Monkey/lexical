import { calculateZoomLevel } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import {
  type JSX,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
} from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const Direction = {
  east: 1 << 0,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  north: 1 << 3,
  south: 1 << 1,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  west: 1 << 2,
};

const FALLBACK_WIDTH = 100;
const FALLBACK_HEIGHT = 100;
const SIZE_OFFSET = 20;

const ImageResizer = ({
  buttonRef: buttonReference,
  captionsEnabled,
  editor,
  imageRef: imageReference,
  maxWidth,
  onResizeEnd,
  onResizeStart,
  setShowCaption,
  showCaption,
}: {
  buttonRef: { current: HTMLButtonElement | null };
  captionsEnabled: boolean;
  editor: LexicalEditor;
  imageRef: { current: HTMLElement | null };
  maxWidth?: number;
  onResizeEnd: (width: number | "inherit", height: number | "inherit") => void;
  onResizeStart: () => void;
  setShowCaption: (show: boolean) => void;
  showCaption: boolean;
}): JSX.Element => {
  const controlWrapperReference = useRef<HTMLDivElement>(null);
  const userSelect = useRef({
    priority: "",
    value: "default",
  });
  const positioningReference = useRef<{
    currentHeight: number | "inherit";
    currentWidth: number | "inherit";
    direction: number;
    isResizing: boolean;
    ratio: number;
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
  }>({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });
  const editorRootElement = editor.getRootElement();

  // Find max width, accounting for editor padding.
  const maxWidthContainer =
    maxWidth ??
    (editorRootElement === null
      ? FALLBACK_WIDTH
      : editorRootElement.getBoundingClientRect().width - SIZE_OFFSET);
  const maxHeightContainer =
    editorRootElement === null
      ? FALLBACK_WIDTH
      : editorRootElement.getBoundingClientRect().height - SIZE_OFFSET;

  const minWidth = FALLBACK_WIDTH;
  const minHeight = FALLBACK_HEIGHT;

  const setStartCursor = useCallback(
    // eslint-disable-next-line complexity
    (direction: number) => {
      const ew = direction === Direction.east || direction === Direction.west;
      const ns = direction === Direction.north || direction === Direction.south;
      const nwse =
        (direction && Direction.north & direction && Direction.west) ||
        (direction && Direction.south & direction && Direction.east);

      let cursorDirection;

      if (ew) {
        cursorDirection = "ew";
      } else if (ns) {
        cursorDirection = "ns";
      } else if (nwse) {
        cursorDirection = "nwse";
      } else {
        cursorDirection = "nesw";
      }

      if (editorRootElement !== null) {
        editorRootElement.style.setProperty(
          "cursor",
          `${cursorDirection}-resize`,
          "important",
        );
      }

      document.body.style.setProperty(
        "cursor",
        `${cursorDirection}-resize`,
        "important",
      );
      userSelect.current.value = document.body.style.getPropertyValue(
        "-webkit-user-select",
      );
      userSelect.current.priority = document.body.style.getPropertyPriority(
        "-webkit-user-select",
      );
      document.body.style.setProperty(
        "-webkit-user-select",
        "none",
        "important",
      );
    },
    [editorRootElement],
  );

  const setEndCursor = useCallback(() => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty("cursor", "text");
    }

    document.body.style.setProperty("cursor", "default");
    document.body.style.setProperty(
      "-webkit-user-select",
      userSelect.current.value,
      userSelect.current.priority,
    );
  }, [editorRootElement]);

  const handlePointerMove = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    (event: PointerEvent) => {
      const { current: image } = imageReference;
      const { current: positioning } = positioningReference;

      const isHorizontal =
        positioning.direction & (Direction.east | Direction.west);
      const isVertical =
        positioning.direction & (Direction.south | Direction.north);

      if (image !== null && positioning.isResizing) {
        const zoom = calculateZoomLevel(image);

        // Corner cursor
        if (isHorizontal && isVertical) {
          let diff = Math.floor(positioning.startX - event.clientX / zoom);

          diff = positioning.direction & Direction.east ? -diff : diff;

          const width = clamp(
            positioning.startWidth + diff,
            minWidth,
            maxWidthContainer,
          );

          const height = width / positioning.ratio;

          image.style.width = `${width}px`;
          image.style.height = `${height}px`;
          positioning.currentHeight = height;
          positioning.currentWidth = width;
        } else if (isVertical) {
          let diff = Math.floor(positioning.startY - event.clientY / zoom);

          diff = positioning.direction & Direction.south ? -diff : diff;

          const height = clamp(
            positioning.startHeight + diff,
            minHeight,
            maxHeightContainer,
          );

          image.style.height = `${height}px`;
          positioning.currentHeight = height;
        } else {
          let diff = Math.floor(positioning.startX - event.clientX / zoom);

          diff = positioning.direction & Direction.east ? -diff : diff;

          const width = clamp(
            positioning.startWidth + diff,
            minWidth,
            maxWidthContainer,
          );

          image.style.width = `${width}px`;
          positioning.currentWidth = width;
        }
      }
    },
    [
      imageReference,
      maxHeightContainer,
      maxWidthContainer,
      minHeight,
      minWidth,
    ],
  );

  const handlePointerUp = useCallback(() => {
    const { current: image } = imageReference;
    const { current: positioning } = positioningReference;
    const { current: controlWrapper } = controlWrapperReference;

    if (image !== null && controlWrapper !== null && positioning.isResizing) {
      const { currentHeight: height, currentWidth: width } = positioning;

      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;

      controlWrapper.classList.remove("image-control-wrapper--resizing");

      setEndCursor();
      onResizeEnd(width, height);

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    }
  }, [handlePointerMove, imageReference, onResizeEnd, setEndCursor]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, direction: number) => {
      if (!editor.isEditable()) {
        return;
      }

      const { current: image } = imageReference;
      const { current: controlWrapper } = controlWrapperReference;

      if (image !== null && controlWrapper !== null) {
        event.preventDefault();

        const { height, width } = image.getBoundingClientRect();
        const zoom = calculateZoomLevel(image);
        const { current: positioning } = positioningReference;

        positioning.startWidth = width;
        positioning.startHeight = height;
        positioning.ratio = width / height;
        positioning.currentWidth = width;
        positioning.currentHeight = height;
        positioning.startX = event.clientX / zoom;
        positioning.startY = event.clientY / zoom;
        positioning.isResizing = true;
        positioning.direction = direction;

        setStartCursor(direction);
        onResizeStart();

        controlWrapper.classList.add("image-control-wrapper--resizing");
        image.style.height = `${height}px`;
        image.style.width = `${width}px`;

        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);
      }
    },
    [
      editor,
      handlePointerMove,
      handlePointerUp,
      imageReference,
      onResizeStart,
      setStartCursor,
    ],
  );

  const toggleShowCaption = useCallback(() => {
    setShowCaption(!showCaption);
  }, [setShowCaption, showCaption]);

  const onPointerDownNorth = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.north);
    },
    [handlePointerDown],
  );

  const onPointerDownNorthEast = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.north | Direction.east);
    },
    [handlePointerDown],
  );

  const onPointerDownEast = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.east);
    },
    [handlePointerDown],
  );

  const onPointerDownSouthEast = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.south | Direction.east);
    },
    [handlePointerDown],
  );

  const onPointerDownSouth = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.south);
    },
    [handlePointerDown],
  );

  const onPointerDownSouthWest = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.south | Direction.west);
    },
    [handlePointerDown],
  );

  const onPointerDownWest = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.west);
    },
    [handlePointerDown],
  );

  const onPointerDownNorthWest = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      handlePointerDown(event, Direction.north | Direction.west);
    },
    [handlePointerDown],
  );

  return (
    <div ref={controlWrapperReference}>
      {!showCaption && captionsEnabled && (
        <button
          className="image-caption-button"
          onClick={toggleShowCaption}
          ref={buttonReference}
          type="button"
        >
          Add Caption
        </button>
      )}
      <div
        className="image-resizer image-resizer-n"
        onPointerDown={onPointerDownNorth}
      />
      <div
        className="image-resizer image-resizer-ne"
        onPointerDown={onPointerDownNorthEast}
      />
      <div
        className="image-resizer image-resizer-e"
        onPointerDown={onPointerDownEast}
      />
      <div
        className="image-resizer image-resizer-se"
        onPointerDown={onPointerDownSouthEast}
      />
      <div
        className="image-resizer image-resizer-s"
        onPointerDown={onPointerDownSouth}
      />
      <div
        className="image-resizer image-resizer-sw"
        onPointerDown={onPointerDownSouthWest}
      />
      <div
        className="image-resizer image-resizer-w"
        onPointerDown={onPointerDownWest}
      />
      <div
        className="image-resizer image-resizer-nw"
        onPointerDown={onPointerDownNorthWest}
      />
    </div>
  );
};

export default ImageResizer;
