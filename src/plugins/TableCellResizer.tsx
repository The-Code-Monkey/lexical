import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import useLexicalEditable from "@lexical/react/useLexicalEditable";
import {
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $isTableCellNode,
  $isTableRowNode,
  getDOMCellFromTarget,
  type TableCellNode,
  type TableDOMCell,
} from "@lexical/table";
import { $getNearestNodeFromDOMNode, type LexicalEditor } from "lexical";
import {
  type MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import calculateZoomLevel from "../utils/calculateZoomLevel";

interface MousePosition {
  x: number;
  y: number;
}

type MouseDraggingDirection = "bottom" | "right";

const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 50;
const LAST_ELEMENT_INDEX = -1;

const isMouseDownOnEvent = (event: MouseEvent) => (event.buttons && 1) === 1;

const calculateAggregatedRowSpans = (rowCellsSpan: number[]) =>
  rowCellsSpan.reduce((rowSpans: number[], cellSpan) => {
    const previousCell = rowSpans.at(LAST_ELEMENT_INDEX) ?? 0;

    rowSpans.push(previousCell + cellSpan);

    return rowSpans;
  }, []);

interface TableCellResizerProps {
  editor: LexicalEditor;
}

const TableCellResizer = ({ editor }: TableCellResizerProps): JSX.Element => {
  const targetReference = useRef<HTMLElement | null>(null);
  const resizerReference = useRef<HTMLDivElement | null>(null);
  const tableRectReference = useRef<DOMRect | null>(null);

  const mouseStartPosReference = useRef<MousePosition | null>(null);
  const [mouseCurrentPos, setMouseCurrentPos] = useState<MousePosition | null>(
    null,
  );

  const [activeCell, setActiveCell] = useState<TableDOMCell | null>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const [draggingDirection, setDraggingDirection] =
    useState<MouseDraggingDirection | null>(null);

  const resetState = useCallback(() => {
    setActiveCell(null);
    targetReference.current = null;
    setDraggingDirection(null);
    mouseStartPosReference.current = null;
    tableRectReference.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      // eslint-disable-next-line sonarjs/cognitive-complexity
      setTimeout(() => {
        const { clientX, clientY, target } = event;

        if (draggingDirection) {
          setMouseCurrentPos({
            x: clientX,
            y: clientY,
          });

          return;
        }

        setIsMouseDown(isMouseDownOnEvent(event));

        if (target instanceof HTMLElement) {
          if (resizerReference.current?.contains(target) ?? false) {
            return;
          }

          if (targetReference.current !== target) {
            targetReference.current = target;

            const cell = getDOMCellFromTarget(target);

            if (cell && activeCell !== cell) {
              editor.update(() => {
                const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);

                if (!tableCellNode) {
                  throw new Error(
                    "TableCellResizer: Table cell node not found.",
                  );
                }

                const tableNode =
                  $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

                const tableElement = editor.getElementByKey(tableNode.getKey());

                if (!tableElement) {
                  throw new Error("TableCellResizer: Table element not found.");
                }

                targetReference.current = target;
                tableRectReference.current =
                  tableElement.getBoundingClientRect();
                setActiveCell(cell);
              });
              // eslint-disable-next-line sonarjs/elseif-without-else
            } else if (cell === null) {
              resetState();
            }
          }
        }
      }, 0);
    };

    const onMouseDown = () => {
      setTimeout(() => {
        setIsMouseDown(true);
      }, 0);
    };

    const onMouseUp = () => {
      setTimeout(() => {
        setIsMouseDown(false);
      }, 0);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [activeCell, draggingDirection, editor, resetState]);

  const isHeightChanging = (direction: MouseDraggingDirection) =>
    direction === "bottom";

  const updateRowHeight = useCallback(
    (newHeight: number) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);

          if (!$isTableCellNode(tableCellNode)) {
            throw new Error("TableCellResizer: Table cell node not found.");
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

          const tableRowIndex =
            $getTableRowIndexFromTableCellNode(tableCellNode);

          const tableRows = tableNode.getChildren();

          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
            throw new Error("Expected table cell to be inside of table row.");
          }

          const { [tableRowIndex]: tableRow } = tableRows;

          if (!$isTableRowNode(tableRow)) {
            throw new Error("Expected table row");
          }

          tableRow.setHeight(newHeight);
        },
        {
          tag: "skip-scroll-into-view",
        },
      );
    },
    [activeCell, editor],
  );

  const updateColumnWidth = useCallback(
    (newWidth: number) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }

      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode(activeCell.elem);

          if (!$isTableCellNode(tableCellNode)) {
            throw new Error("TableCellResizer: Table cell node not found.");
          }

          const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

          const tableColumnIndex =
            $getTableColumnIndexFromTableCellNode(tableCellNode);

          const tableRows = tableNode.getChildren();

          tableRows.forEach((tableRow) => {
            if (!$isTableRowNode(tableRow)) {
              throw new Error("Expected table row");
            }

            const rowCells = tableRow.getChildren<TableCellNode>();
            const rowCellsSpan = rowCells.map((cell) => cell.getColSpan());

            const aggregatedRowSpans =
              calculateAggregatedRowSpans(rowCellsSpan);

            const rowColumnIndexWithSpan = aggregatedRowSpans.findIndex(
              (cellSpan: number) => cellSpan > tableColumnIndex,
            );

            if (
              rowColumnIndexWithSpan >= rowCells.length ||
              rowColumnIndexWithSpan < 0
            ) {
              throw new Error("Expected table cell to be inside of table row.");
            }

            const { [rowColumnIndexWithSpan]: tableCell } = rowCells;

            if (!$isTableCellNode(tableCell)) {
              throw new Error("Expected table cell");
            }

            tableCell.setWidth(newWidth);
          });
        },
        {
          tag: "skip-scroll-into-view",
        },
      );
    },
    [activeCell, editor],
  );

  const mouseUpHandler = useCallback(
    (direction: MouseDraggingDirection) => {
      // eslint-disable-next-line sonarjs/cognitive-complexity
      const handler = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          throw new Error("TableCellResizer: Expected active cell.");
        }

        if (
          mouseStartPosReference.current &&
          event.target instanceof HTMLElement
        ) {
          const { current: currentMousePosition } = mouseStartPosReference;

          const { x, y } = currentMousePosition;

          const zoom = calculateZoomLevel(event.target);

          if (isHeightChanging(direction)) {
            const { height } = activeCell.elem.getBoundingClientRect();
            const heightChange = Math.abs(event.clientY - y) / zoom;

            const isShrinking = direction === "bottom" && y > event.clientY;

            updateRowHeight(
              Math.max(
                isShrinking ? height - heightChange : heightChange + height,
                MIN_ROW_HEIGHT,
              ),
            );
          } else {
            const computedStyle = getComputedStyle(activeCell.elem);

            const { elem: element } = activeCell;

            let { clientWidth: width } = element;

            // width with padding
            width -=
              Number.parseFloat(computedStyle.paddingLeft) +
              Number.parseFloat(computedStyle.paddingRight);

            const widthChange = Math.abs(event.clientX - x) / zoom;

            const isShrinking = direction === "right" && x > event.clientX;

            updateColumnWidth(
              Math.max(
                isShrinking ? width - widthChange : widthChange + width,
                MIN_COLUMN_WIDTH,
              ),
            );
          }

          resetState();
          document.removeEventListener("mouseup", handler);
        }
      };

      return handler;
    },
    [activeCell, resetState, updateColumnWidth, updateRowHeight],
  );

  const toggleResize = useCallback(
    (direction: MouseDraggingDirection): MouseEventHandler<HTMLDivElement> =>
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!activeCell) {
          throw new Error("TableCellResizer: Expected active cell.");
        }

        mouseStartPosReference.current = {
          x: event.clientX,
          y: event.clientY,
        };
        setMouseCurrentPos(mouseStartPosReference.current);
        setDraggingDirection(direction);

        document.addEventListener("mouseup", mouseUpHandler(direction));
      },
    [activeCell, mouseUpHandler],
  );

  const getResizers = useCallback(() => {
    if (activeCell) {
      const { height, left, top, width } =
        activeCell.elem.getBoundingClientRect();

      const zoom = calculateZoomLevel(activeCell.elem);

      const styles = {
        bottom: {
          backgroundColor: "none",
          cursor: "row-resize",
          height: "10px",
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height}px`,
          width: `${width}px`,
        },

        right: {
          backgroundColor: "none",
          cursor: "col-resize",
          height: `${height}px`,
          left: `${window.scrollX + left + width}px`,
          top: `${window.scrollY + top}px`,
          width: "10px",
        },
      };

      const { current: tableRect } = tableRectReference;

      if (draggingDirection && mouseCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection].left =
            `${window.scrollX + tableRect.left}px`;
          styles[draggingDirection].top =
            `${window.scrollY + mouseCurrentPos.y / zoom}px`;
          styles[draggingDirection].height = "3px";
          styles[draggingDirection].width = `${tableRect.width}px`;
        } else {
          styles[draggingDirection].top = `${window.scrollY + tableRect.top}px`;
          styles[draggingDirection].left =
            `${window.scrollX + mouseCurrentPos.x / zoom}px`;
          styles[draggingDirection].width = "3px";
          styles[draggingDirection].height = `${tableRect.height}px`;
        }

        styles[draggingDirection].backgroundColor = "#adf";
      }

      return styles;
    }

    return {
      bottom: null,
      left: null,
      right: null,
      top: null,
    };
  }, [activeCell, draggingDirection, mouseCurrentPos]);

  const resizerStyles = getResizers();

  return (
    <div ref={resizerReference}>
      {activeCell !== null && !isMouseDown && (
        <>
          {/* eslint-disable-next-line max-len */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="TableCellResizer__resizer TableCellResizer__ui"
            onMouseDown={toggleResize("right")}
            style={resizerStyles.right ?? undefined}
          />
          {/* eslint-disable-next-line max-len */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="TableCellResizer__resizer TableCellResizer__ui"
            onMouseDown={toggleResize("bottom")}
            style={resizerStyles.bottom ?? undefined}
          />
        </>
      )}
    </div>
  );
};

export default function TableCellResizerPlugin() {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();

  return useMemo(
    () =>
      isEditable
        ? createPortal(<TableCellResizer editor={editor} />, document.body)
        : null,
    [editor, isEditable],
  );
}
