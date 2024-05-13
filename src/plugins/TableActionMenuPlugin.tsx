import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $deleteTableColumn,
  $getElementForTableNode,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn,
  $insertTableRow,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $removeTableRowAtIndex,
  getTableObserverFromTableElement,
  type HTMLTableElementWithWithTableSelectionState,
  TableCellHeaderStates,
  TableCellNode,
} from "@lexical/table";
import { ChevronDown } from "@techstack/react-feather";
import { $getSelection, $isRangeSelection, $setSelection } from "lexical";
import {
  type JSX,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const isHTMLTableElementWithWithTableSelectionState = (
  element: HTMLElement,
): element is HTMLTableElementWithWithTableSelectionState =>
  element instanceof HTMLTableElement;

interface TableCellActionMenuProps {
  contextRef: {
    current: HTMLElement | null;
  };
  onClose: (a?: ReactMouseEvent<HTMLButtonElement>) => void;
  setIsMenuOpen: (isOpen: boolean) => void;
  tableCellNode: TableCellNode;
}

const MARGIN = 5;

const TableActionMenu = ({
  contextRef: contextReference,
  onClose,
  setIsMenuOpen,
  tableCellNode: _tableCellNode,
}: TableCellActionMenuProps) => {
  const [editor] = useLexicalComposerContext();
  const dropDownReference = useRef<HTMLDivElement | null>(null);
  const [tableCellNode, setTableCellNode] = useState(_tableCellNode);

  const [selectionCounts, setSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  });

  useEffect(
    () =>
      editor.registerMutationListener(TableCellNode, (nodeMutations) => {
        const nodeUpdated =
          nodeMutations.get(tableCellNode.getKey()) === "updated";

        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            setTableCellNode(tableCellNode.getLatest());
          });
        }
      }),
    [editor, tableCellNode],
  );

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isTableSelection(selection)) {
        const selectionShape = selection.getShape();

        setSelectionCounts({
          columns: selectionShape.toX - selectionShape.fromX + 1,
          rows: selectionShape.toY - selectionShape.fromY + 1,
        });
      }
    });
  }, [editor]);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const { current: menuButtonElement } = contextReference;
    const { current: dropDownElement } = dropDownReference;
    const rootElement = editor.getRootElement();

    if (
      menuButtonElement !== null &&
      dropDownElement !== null &&
      rootElement !== null
    ) {
      const rootEleRect = rootElement.getBoundingClientRect();
      const menuButtonRect = menuButtonElement.getBoundingClientRect();

      dropDownElement.style.opacity = "1";

      const dropDownElementRect = dropDownElement.getBoundingClientRect();

      let leftPosition = menuButtonRect.right + MARGIN;

      if (
        window.innerWidth < leftPosition + dropDownElementRect.width ||
        rootEleRect.right < leftPosition + dropDownElementRect.width
      ) {
        const position =
          menuButtonRect.left - dropDownElementRect.width - MARGIN;

        leftPosition = (position < 0 ? MARGIN : position) + window.scrollX;
      }

      dropDownElement.style.left = `${leftPosition + window.scrollX}px`;

      let { top: topPosition } = menuButtonRect;

      const { bottom } = menuButtonRect;

      if (window.innerHeight < topPosition + dropDownElementRect.height) {
        const position = bottom - dropDownElementRect.height;

        topPosition = (position < 0 ? MARGIN : position) + window.scrollY;
      }

      dropDownElement.style.top = `${topPosition + Number(window.scrollY)}px`;
    }
  }, [contextReference, dropDownReference, editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropDownReference.current !== null &&
        contextReference.current !== null &&
        event.target instanceof Node &&
        !dropDownReference.current.contains(event.target) &&
        !contextReference.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [setIsMenuOpen, contextReference]);

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = editor.getElementByKey(tableNode.getKey());

        if (!tableElement) {
          throw new Error("Expected to find tableElement in DOM");
        }

        if (!isHTMLTableElementWithWithTableSelectionState(tableElement)) {
          throw new Error(
            "Expected tableElement to be an instance of HTMLTableElementWithWithTableSelectionState",
          );
        }

        const tableSelection = getTableObserverFromTableElement(tableElement);

        if (tableSelection !== null) {
          tableSelection.clearHighlight();
        }

        tableNode.markDirty();
        setTableCellNode(tableCellNode.getLatest());
      }

      $setSelection(null);
    });
  }, [editor, tableCellNode]);
  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => () => {
      editor.update(() => {
        const selection = $getSelection();

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        let tableRowIndex;

        if ($isTableSelection(selection)) {
          const selectionShape = selection.getShape();

          tableRowIndex = shouldInsertAfter
            ? selectionShape.toY
            : selectionShape.fromY;
        } else {
          tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
        }

        const grid = $getElementForTableNode(editor, tableNode);

        $insertTableRow(
          tableNode,
          tableRowIndex,
          shouldInsertAfter,
          selectionCounts.rows,
          grid,
        );

        clearTableSelection();

        onClose();
      });
    },
    [editor, tableCellNode, selectionCounts.rows, clearTableSelection, onClose],
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => () => {
      editor.update(() => {
        const selection = $getSelection();

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

        let tableColumnIndex;

        if ($isTableSelection(selection)) {
          const selectionShape = selection.getShape();

          tableColumnIndex = shouldInsertAfter
            ? selectionShape.toX
            : selectionShape.fromX;
        } else {
          tableColumnIndex =
            $getTableColumnIndexFromTableCellNode(tableCellNode);
        }

        const grid = $getElementForTableNode(editor, tableNode);

        $insertTableColumn(
          tableNode,
          tableColumnIndex,
          shouldInsertAfter,
          selectionCounts.columns,
          grid,
        );

        clearTableSelection();

        onClose();
      });
    },
    [
      editor,
      tableCellNode,
      selectionCounts.columns,
      clearTableSelection,
      onClose,
    ],
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

      $removeTableRowAtIndex(tableNode, tableRowIndex);

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      tableNode.remove();

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode);

      $deleteTableColumn(tableNode, tableColumnIndex);

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

      const tableRows = tableNode.getChildren();

      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        throw new Error("Expected table cell to be inside of table row.");
      }

      const { [tableRowIndex]: tableRow } = tableRows;

      if (!$isTableRowNode(tableRow)) {
        throw new Error("Expected table row");
      }

      tableRow.getChildren().forEach((tableCell) => {
        if (!$isTableCellNode(tableCell)) {
          throw new Error("Expected table cell");
        }

        tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
      });

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode);

      const tableRows = tableNode.getChildren();

      tableRows.forEach((tableRow) => {
        if (!$isTableRowNode(tableRow)) {
          throw new Error("Expected table row");
        }

        const tableCells = tableRow.getChildren();

        if (tableColumnIndex >= tableCells.length || tableColumnIndex < 0) {
          throw new Error("Expected table cell to be inside of table row.");
        }

        const { [tableColumnIndex]: tableCell } = tableCells;

        if (!$isTableCellNode(tableCell)) {
          throw new Error("Expected table cell");
        }

        tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN);
      });

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  return (
    <>
      {createPortal(
        <div className="editor_dropdown" ref={dropDownReference}>
          <button
            className="item"
            onClick={insertTableRowAtSelection(false)}
            type="button"
          >
            <span className="text">
              Insert{" "}
              {selectionCounts.rows === 1
                ? "row"
                : `${selectionCounts.rows} rows`}{" "}
              above
            </span>
          </button>
          <button
            className="item"
            onClick={insertTableRowAtSelection(true)}
            type="button"
          >
            <span className="text">
              Insert{" "}
              {selectionCounts.rows === 1
                ? "row"
                : `${selectionCounts.rows} rows`}{" "}
              below
            </span>
          </button>
          <hr />
          <button
            className="item"
            onClick={insertTableColumnAtSelection(false)}
            type="button"
          >
            <span className="text">
              Insert{" "}
              {selectionCounts.columns === 1
                ? "column"
                : `${selectionCounts.columns} columns`}{" "}
              left
            </span>
          </button>
          <button
            className="item"
            onClick={insertTableColumnAtSelection(true)}
            type="button"
          >
            <span className="text">
              Insert{" "}
              {selectionCounts.columns === 1
                ? "column"
                : `${selectionCounts.columns} columns`}{" "}
              right
            </span>
          </button>
          <hr />
          <button
            className="item"
            onClick={deleteTableColumnAtSelection}
            type="button"
          >
            <span className="text">Delete Column</span>
          </button>
          <button
            className="item"
            onClick={deleteTableRowAtSelection}
            type="button"
          >
            <span className="text">Delete row</span>
          </button>
          <button
            className="item"
            onClick={deleteTableAtSelection}
            type="button"
          >
            <span className="text">Delete table</span>
          </button>
          <hr />
          <button
            className="item"
            onClick={toggleTableRowIsHeader}
            type="button"
          >
            <span className="text">
              {TableCellHeaderStates.ROW ===
              (tableCellNode.__headerState && TableCellHeaderStates.ROW)
                ? "Remove"
                : "Add"}{" "}
              row header
            </span>
          </button>
          <button
            className="item"
            onClick={toggleTableColumnIsHeader}
            type="button"
          >
            <span className="text">
              {TableCellHeaderStates.COLUMN ===
              (tableCellNode.__headerState && TableCellHeaderStates.COLUMN)
                ? "Remove"
                : "Add"}{" "}
              column header
            </span>
          </button>
        </div>,
        document.body,
      )}
    </>
  );
};

const TOP_OFFSET = 1;
const LEFT_OFFSET = 10;
const TOP_DIVIDER_OFFSET = 2;

interface TableCellActionMenuContainerProps {
  anchorElement: HTMLElement;
}

const TableCellActionMenuContainer = ({
  anchorElement,
}: TableCellActionMenuContainerProps): JSX.Element => {
  const [editor] = useLexicalComposerContext();

  const menuButtonReference = useRef<HTMLDivElement>(null);
  const menuRootReference = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(
    null,
  );

  const moveMenu = useCallback(() => {
    const { current: menu } = menuButtonReference;
    const selection = $getSelection();
    const nativeSelection = window.getSelection();
    const { activeElement } = document;

    if (selection === null || menu === null) {
      setTableCellNode(null);

      return;
    }

    const rootElement = editor.getRootElement();

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );

      if (tableCellNodeFromSelection === null) {
        setTableCellNode(null);

        return;
      }

      const tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey(),
      );

      if (tableCellParentNodeDOM === null) {
        setTableCellNode(null);

        return;
      }

      setTableCellNode(tableCellNodeFromSelection);
      // eslint-disable-next-line sonarjs/elseif-without-else
    } else if (!activeElement) {
      setTableCellNode(null);
    }
  }, [editor]);

  useEffect(() =>
    editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        moveMenu();
      });
    }),
  );

  useEffect(() => {
    const { current: menuButtonDOM } = menuButtonReference;

    if (menuButtonDOM !== null && tableCellNode !== null) {
      const tableCellNodeDOM = editor.getElementByKey(tableCellNode.getKey());

      if (tableCellNodeDOM === null) {
        menuButtonDOM.style.opacity = "0";
        menuButtonDOM.style.transform = "translate(-10000px, -10000px)";
      } else {
        const tableCellRect = tableCellNodeDOM.getBoundingClientRect();
        const menuRect = menuButtonDOM.getBoundingClientRect();

        const top =
          tableCellRect.top -
          (tableCellRect.top - tableCellRect.bottom) / TOP_DIVIDER_OFFSET -
          menuRect.height / TOP_DIVIDER_OFFSET +
          TOP_OFFSET;
        const left = tableCellRect.right - menuRect.width - LEFT_OFFSET;

        menuButtonDOM.style.opacity = "1";
        menuButtonDOM.style.transform = `translate(${left}px, ${top}px)`;
      }
    }
  }, [menuButtonReference, tableCellNode, editor, anchorElement]);

  const previousTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (previousTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }

    previousTableCellDOM.current = tableCellNode;
  }, [previousTableCellDOM, tableCellNode]);

  const toggleMenuOpen = useCallback(
    (event?: ReactMouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      setIsMenuOpen((previous) => !previous);
    },
    [],
  );

  return (
    <div
      className="table-cell-action-button-container"
      ref={menuButtonReference}
    >
      {tableCellNode !== null && (
        <>
          <button
            className="table-cell-action-button chevron-down"
            onClick={toggleMenuOpen}
            ref={menuRootReference}
            type="button"
          >
            <i className="chevron-down">
              <ChevronDown size={12} />
            </i>
          </button>
          {Boolean(isMenuOpen) && (
            <TableActionMenu
              contextRef={menuRootReference}
              onClose={toggleMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              tableCellNode={tableCellNode}
            />
          )}
        </>
      )}
    </div>
  );
};

interface TableActionMenuPluginProps {
  anchorElement?: HTMLElement;
}

const TableActionMenuPlugin = ({
  anchorElement = document.body,
}: TableActionMenuPluginProps) => (
  <>
    {createPortal(
      <TableCellActionMenuContainer anchorElement={anchorElement} />,
      anchorElement,
    )}
  </>
);

export default TableActionMenuPlugin;
