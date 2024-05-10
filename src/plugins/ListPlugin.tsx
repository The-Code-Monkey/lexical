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
import { CheckSquare, ListOl, ListUl } from "@techstack/react-feather";
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
import { type ReactNode, useCallback, useEffect, useState } from "react";

import Dropdown, { DropDownItem } from "../ui/Dropdown";
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
  }, [dispatchCommand]);

  const formatNumberedList = useCallback(() => {
    dispatchCommand(INSERT_ORDERED_LIST_COMMAND, "number");
  }, [dispatchCommand]);

  const formatCheckList = useCallback(() => {
    dispatchCommand(INSERT_CHECK_LIST_COMMAND, "check");
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

  return (
    <>
      <LexicalListPlugin />
      <Dropdown
        buttonClassName="toolbar-item spaced"
        buttonIcon={supportedListTypesIcons[listType]}
        buttonLabel={listTypeToListName[listType]}
      >
        <DropDownItem onClick={formatNumberedList} title="number">
          <ListOl size={14} />
          Numbered List
        </DropDownItem>
        <DropDownItem onClick={formatBulletList} title="bullet">
          <ListUl size={14} />
          Bullet List
        </DropDownItem>
        <DropDownItem onClick={formatCheckList} title="check">
          <CheckSquare size={14} />
          Check List
        </DropDownItem>
      </Dropdown>
    </>
  );
};

export default ListPlugin;
