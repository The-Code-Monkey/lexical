import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin as LexicalListPlugin } from "@lexical/react/LexicalListPlugin";
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  mergeRegister,
} from "@lexical/utils";
import {
  CheckSquare,
  ChevronDown,
  ListOl,
  ListUl,
} from "@techstack/react-feather";
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  type LexicalCommand,
  type LexicalNode,
  type RangeSelection,
  SELECTION_CHANGE_COMMAND,
  type TextNode,
} from "lexical";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { LOW_PRIORITY } from "../utils/priorities";

type SupportedListTypes = "bullet" | "check" | "number";

const supportedListTypesIcons: Record<SupportedListTypes, ReactNode> = {
  bullet: <ListUl size={14} />,
  check: <CheckSquare size={14} />,
  number: <ListOl size={14} />,
};

const listTypeToListName: Record<SupportedListTypes, string> = {
  bullet: "Bullet List",
  check: "Check List",
  number: "Numbered List",
};

const ListPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const dropDownReference = useRef<HTMLDivElement>(null);

  const [showListOptionsDropdown, setShowListOptionsDropdown] = useState(false);
  const [listType, setListType] = useState<SupportedListTypes>("bullet");

  const dispatchCommand = useCallback(
    (command: LexicalCommand<unknown>, condition: string) => {
      if (listType === condition) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(command, undefined);
      }
    },
    [editor, listType],
  );

  const formatBulletList = useCallback(() => {
    dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, "bullet");
    setShowListOptionsDropdown(false);
  }, [dispatchCommand]);

  const formatNumberedList = useCallback(() => {
    dispatchCommand(INSERT_ORDERED_LIST_COMMAND, "number");
    setShowListOptionsDropdown(false);
  }, [dispatchCommand]);

  const formatCheckList = useCallback(() => {
    dispatchCommand(INSERT_CHECK_LIST_COMMAND, "check");
    setShowListOptionsDropdown(false);
  }, [dispatchCommand]);

  const getSelectionElement = useCallback((selection: RangeSelection) => {
    const anchorNode = selection.anchor.getNode();

    return anchorNode.getKey() === "root"
      ? anchorNode
      : $findMatchingParent(anchorNode, (node: LexicalNode) => {
          const parent = node.getParent();

          return parent !== null && $isRootOrShadowRoot(parent);
        });
  }, []);

  const updateListType = useCallback(
    (element: LexicalNode | TextNode, anchorNode: LexicalNode) => {
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null && $isListNode(element)) {
        const parentList = $getNearestNodeOfType<ListNode>(
          anchorNode,
          ListNode,
        );

        const type = parentList
          ? parentList.getListType()
          : element.getListType();

        setListType(type);
      }
    },
    [editor],
  );

  const update = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const element = getSelectionElement(selection);

      if (element) {
        updateListType(element, selection.anchor.getNode());
      }
    }
  }, [getSelectionElement, updateListType]);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            update();
          });
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            update();

            return false;
          },
          LOW_PRIORITY,
        ),
      ),
    [editor, update],
  );

  const toggleDropdown = useCallback(() => {
    setShowListOptionsDropdown((previousState) => !previousState);
  }, []);

  return (
    <>
      <LexicalListPlugin />
      <button
        aria-label="Formatting Options"
        className="toolbar-item block-controls"
        onClick={toggleDropdown}
        type="button"
      >
        <span className={`icon block-type ${listType}`}>
          {supportedListTypesIcons[listType]}
        </span>
        <span className="text">{listTypeToListName[listType]}</span>
        <i className="chevron-down">
          <ChevronDown />
        </i>
      </button>
      {showListOptionsDropdown && (
        <div className="toolbar-dropdown" ref={dropDownReference}>
          <button className="item" onClick={formatBulletList} type="button">
            <span className="icon bullet-list">
              <ListUl size={14} />
            </span>
            <span className="text">Bullet List</span>
            {listType === "bullet" && <span className="active" />}
          </button>
          <button className="item" onClick={formatNumberedList} type="button">
            <span className="icon numbered-list">
              <ListOl size={14} />
            </span>
            <span className="text">Numbered List</span>
            {listType === "number" && <span className="active" />}
          </button>
          <button className="item" onClick={formatCheckList} type="button">
            <span className="icon check-list">
              <CheckSquare size={14} />
            </span>
            <span className="text">Check List</span>
            {listType === "check" && <span className="active" />}
          </button>
        </div>
      )}
    </>
  );
};

export default ListPlugin;
