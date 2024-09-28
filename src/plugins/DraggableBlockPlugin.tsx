import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { eventFiles } from "@lexical/rich-text";
import { calculateZoomLevel, mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  type LexicalEditor,
} from "lexical";
import {
  type DragEvent as ReactDragEvent,
  type JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import isHTMLElement from "../utils/guard";
import { Point } from "../utils/point";
import { Rect } from "../utils/rect";

const SPACE = 4;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";
const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";
const TEXT_BOX_HORIZONTAL_PADDING = 28;

const Downward = 1;
const Upward = -1;
const Indeterminate = 0;

let { POSITIVE_INFINITY: previousIndex } = Number;

const LENGTH_DIVISOR = 2;

const getCurrentIndex = (keysLength: number): number => {
  if (keysLength === 0) {
    // eslint-disable-next-line unicorn/consistent-destructuring
    return Number.POSITIVE_INFINITY;
  }

  if (previousIndex >= 0 && previousIndex < keysLength) {
    return previousIndex;
  }

  return Math.floor(keysLength / LENGTH_DIVISOR);
};

const getTopLevelNodeKeys = (editor: LexicalEditor): string[] =>
  editor.getEditorState().read(() => $getRoot().getChildrenKeys());

const getCollapsedMargins = (
  element: HTMLElement,
): {
  marginBottom: number;
  marginTop: number;
} => {
  const getMargin = (
    element: Element | null,
    margin: "marginBottom" | "marginTop",
  ): number =>
    element ? Number.parseFloat(window.getComputedStyle(element)[margin]) : 0;

  const { marginBottom, marginTop } = window.getComputedStyle(element);
  const previousElementSiblingMarginBottom = getMargin(
    element.previousElementSibling,
    "marginBottom",
  );
  const nextElementSiblingMarginTop = getMargin(
    element.nextElementSibling,
    "marginTop",
  );
  const collapsedTopMargin = Math.max(
    Number.parseFloat(marginTop),
    previousElementSiblingMarginBottom,
  );
  const collapsedBottomMargin = Math.max(
    Number.parseFloat(marginBottom),
    nextElementSiblingMarginTop,
  );

  return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin };
};

const LAST_INDEX = -1;

const getBlockElement = (
  anchorElement: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false,
): HTMLElement | null => {
  const anchorElementRect = anchorElement.getBoundingClientRect();
  const topLevelNodeKeys = getTopLevelNodeKeys(editor);

  let blockElement: HTMLElement | null = null;

  // eslint-disable-next-line sonarjs/cognitive-complexity
  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(String(topLevelNodeKeys[0])),
        editor.getElementByKey(String(topLevelNodeKeys.at(LAST_INDEX))),
      ];

      const [firstNodeRect, lastNodeRect] = [
        firstNode?.getBoundingClientRect(),
        lastNode?.getBoundingClientRect(),
      ];

      if (firstNodeRect && lastNodeRect) {
        const firstNodeZoom = calculateZoomLevel(firstNode);
        const lastNodeZoom = calculateZoomLevel(lastNode);

        if (event.y / firstNodeZoom < firstNodeRect.top) {
          blockElement = firstNode;
          // eslint-disable-next-line sonarjs/elseif-without-else
        } else if (event.y / lastNodeZoom > lastNodeRect.bottom) {
          blockElement = lastNode;
        }

        if (blockElement) {
          return;
        }
      }
    }

    const index = getCurrentIndex(topLevelNodeKeys.length);
    const direction = Indeterminate;

    const searchElement = (index: number, direction: number) => {
      if (index < 0 || index >= topLevelNodeKeys.length) {
        return;
      }

      const { [index]: key } = topLevelNodeKeys;
      const element = editor.getElementByKey(String(key));

      if (element === null) {
        return;
      }

      const zoom = calculateZoomLevel(element);
      const point = new Point(event.x / zoom, event.y / zoom);
      const domRect = Rect.fromDOM(element);
      const { marginBottom, marginTop } = getCollapsedMargins(element);
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop,
      });

      const {
        reason: { isOnBottomSide, isOnTopSide },
        result,
      } = rect.contains(point);

      if (result) {
        blockElement = element;
        previousIndex = index;

        return;
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward;
        } else if (isOnBottomSide) {
          direction = Downward;
        } else {
          // eslint-disable-next-line  unicorn/consistent-destructuring,@typescript-eslint/prefer-destructuring
          direction = Number.POSITIVE_INFINITY;
        }
      }

      searchElement(index + direction, direction);
    };

    searchElement(index, direction);
  });

  return blockElement;
};

const isOnMenu = (element: HTMLElement): boolean =>
  Boolean(element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`));

const setMenuPosition = (
  targetElement: HTMLElement | null,
  floatingElement: HTMLElement,
  anchorElement: HTMLElement,
) => {
  if (!targetElement) {
    floatingElement.style.opacity = "0";
    floatingElement.style.transform = "translate(-10000px, -10000px)";

    return;
  }

  const targetRect = targetElement.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElement);
  const floatingElementRect = floatingElement.getBoundingClientRect();
  const anchorElementRect = anchorElement.getBoundingClientRect();

  const top =
    targetRect.top +
    (Number.parseInt(targetStyle.lineHeight, 10) - floatingElementRect.height) /
      LENGTH_DIVISOR -
    anchorElementRect.top;

  const left = SPACE;

  floatingElement.style.opacity = "1";
  floatingElement.style.transform = `translate(${left}px, ${top}px)`;
};

const setDragImage = (
  dataTransfer: DataTransfer,
  draggableBlockElement: HTMLElement,
) => {
  const { style } = draggableBlockElement;
  const { transform } = style;

  // Remove dragImage borders
  // eslint-disable-next-line unicorn/consistent-destructuring
  draggableBlockElement.style.transform = "translateZ(0)";
  dataTransfer.setDragImage(draggableBlockElement, 0, 0);

  setTimeout(() => {
    // eslint-disable-next-line unicorn/consistent-destructuring
    draggableBlockElement.style.transform = transform;
  });
};

const setTargetLine = (
  targetLineElement: HTMLElement,
  targetBlockElement: HTMLElement,
  mouseY: number,
  anchorElement: HTMLElement,
) => {
  const { height: targetBlockElementHeight, top: targetBlockElementTop } =
    targetBlockElement.getBoundingClientRect();
  const { top: anchorTop, width: anchorWidth } =
    anchorElement.getBoundingClientRect();
  const { marginBottom, marginTop } = getCollapsedMargins(targetBlockElement);

  let lineTop = targetBlockElementTop;

  if (mouseY >= targetBlockElementTop) {
    lineTop += targetBlockElementHeight + marginBottom / LENGTH_DIVISOR;
  } else {
    lineTop -= marginTop / LENGTH_DIVISOR;
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT;
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;

  targetLineElement.style.transform = `translate(${left}px, ${top}px)`;
  targetLineElement.style.width = `${
    anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * LENGTH_DIVISOR
  }px`;
  targetLineElement.style.opacity = ".4";
};

const hideTargetLine = (targetLineElement: HTMLElement | null) => {
  if (targetLineElement) {
    targetLineElement.style.opacity = "0";
    targetLineElement.style.transform = "translate(-10000px, -10000px)";
  }
};

const useDraggableBlockMenu = (
  editor: LexicalEditor,
  anchorElement: HTMLElement,
  isEditable: boolean,
): JSX.Element => {
  const { parentElement: scrollerElement } = anchorElement;

  const menuReference = useRef<HTMLDivElement>(null);
  const targetLineReference = useRef<HTMLDivElement>(null);
  const isDraggingBlockReference = useRef<boolean>(false);
  const [draggableBlockElement, setDraggableBlockElement] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const { target } = event;

      if (!isHTMLElement(target)) {
        setDraggableBlockElement(null);

        return;
      }

      if (isOnMenu(target)) {
        return;
      }

      const _draggableBlockElement = getBlockElement(
        anchorElement,
        editor,
        event,
      );

      setDraggableBlockElement(_draggableBlockElement);
    };

    const onMouseLeave = () => {
      setDraggableBlockElement(null);
    };

    scrollerElement?.addEventListener("mousemove", onMouseMove);
    scrollerElement?.addEventListener("mouseleave", onMouseLeave);

    return () => {
      scrollerElement?.removeEventListener("mousemove", onMouseMove);
      scrollerElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [scrollerElement, anchorElement, editor]);

  useEffect(() => {
    if (menuReference.current) {
      setMenuPosition(
        draggableBlockElement,
        menuReference.current,
        anchorElement,
      );
    }
  }, [anchorElement, draggableBlockElement]);

  useEffect(() => {
    const onDragover = (event: DragEvent): boolean => {
      if (!isDraggingBlockReference.current) {
        return false;
      }

      const [isFileTransfer] = eventFiles(event);

      if (isFileTransfer) {
        return false;
      }

      const { pageY, target } = event;

      if (!isHTMLElement(target)) {
        return false;
      }

      const targetBlockElement = getBlockElement(
        anchorElement,
        editor,
        event,
        true,
      );
      const { current: targetLineElement } = targetLineReference;

      if (targetBlockElement === null || targetLineElement === null) {
        return false;
      }

      setTargetLine(
        targetLineElement,
        targetBlockElement,
        pageY / calculateZoomLevel(target),
        anchorElement,
      );

      // Prevent default event to be able to trigger onDrop events
      event.preventDefault();

      return true;
    };

    const $onDrop = (event: DragEvent): boolean => {
      if (!isDraggingBlockReference.current) {
        return false;
      }

      const [isFileTransfer] = eventFiles(event);

      if (isFileTransfer) {
        return false;
      }

      const { dataTransfer, pageY, target } = event;
      const dragData = dataTransfer?.getData(DRAG_DATA_FORMAT) ?? "";
      const draggedNode = $getNodeByKey(dragData);

      if (!draggedNode) {
        return false;
      }

      if (!isHTMLElement(target)) {
        return false;
      }

      const targetBlockElement = getBlockElement(
        anchorElement,
        editor,
        event,
        true,
      );

      if (!targetBlockElement) {
        return false;
      }

      const targetNode = $getNearestNodeFromDOMNode(targetBlockElement);

      if (!targetNode) {
        return false;
      }

      if (targetNode === draggedNode) {
        return true;
      }

      const { top: targetBlockElementTop } =
        targetBlockElement.getBoundingClientRect();

      if (pageY / calculateZoomLevel(target) >= targetBlockElementTop) {
        targetNode.insertAfter(draggedNode);
      } else {
        targetNode.insertBefore(draggedNode);
      }

      setDraggableBlockElement(null);

      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        onDragover,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(DROP_COMMAND, $onDrop, COMMAND_PRIORITY_HIGH),
    );
  }, [anchorElement, editor]);

  const onDragStart = useCallback(
    (event: ReactDragEvent<HTMLDivElement>): void => {
      const { dataTransfer } = event;

      if (!draggableBlockElement) {
        return;
      }

      setDragImage(dataTransfer, draggableBlockElement);

      let nodeKey = "";

      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(draggableBlockElement);

        if (node) {
          nodeKey = node.getKey();
        }
      });
      isDraggingBlockReference.current = true;
      dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
    },
    [draggableBlockElement, editor],
  );

  const onDragEnd = useCallback((): void => {
    isDraggingBlockReference.current = false;
    hideTargetLine(targetLineReference.current);
  }, []);

  return createPortal(
    <>
      <div
        className="icon draggable-block-menu"
        draggable
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        ref={menuReference}
      >
        <div className={isEditable ? "icon" : ""} />
      </div>
      <div className="draggable-block-target-line" ref={targetLineReference} />
    </>,
    anchorElement,
  );
};

export default function DraggableBlockPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  return useDraggableBlockMenu(editor, document.body, editor._editable);
}
