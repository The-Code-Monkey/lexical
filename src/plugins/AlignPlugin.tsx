import { $isLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isParentElementRTL } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
} from "@techstack/react-feather";
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import DropDown, { DropDownItem } from "../ui/Dropdown";
import getSelectedNode from "../utils/getSelectedNode";
import { LOW_PRIORITY } from "../utils/priorities";

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, "">]: {
    icon: ReactNode;
    iconRTL?: ReactNode;
    name: string;
  };
} = {
  center: {
    icon: <AlignCenter />,
    name: "Center Align",
  },

  end: {
    icon: <AlignRight />,
    iconRTL: <AlignLeft />,
    name: "End Align",
  },

  justify: {
    icon: <AlignJustify />,
    name: "Justify Align",
  },

  left: {
    icon: <AlignLeft />,
    name: "Left Align",
  },

  right: {
    icon: <AlignRight />,
    name: "Right Align",
  },

  start: {
    icon: <AlignLeft />,
    iconRTL: <AlignRight />,
    name: "Start Align",
  },
};

const AlignPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [isRTL, setIsRTL] = useState(false);

  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");

  const {
    center,
    [elementFormat || "left"]: formatOption,
    end,
    justify,
    left,
    right,
    start,
  } = ELEMENT_FORMAT_OPTIONS;

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const update = useCallback((): void => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();

      setIsRTL($isParentElementRTL(selection));

      if ($isLinkNode(parent)) {
        const matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );

        if ($isElementNode(matchingParent)) {
          setElementFormat(matchingParent.getFormatType());

          return;
        }
      }

      if ($isElementNode(node)) {
        setElementFormat(node.getFormatType());
      } else if (parent) {
        setElementFormat(parent.getFormatType() || "left");
      } else {
        setElementFormat("left");
      }
    } else {
      setIsRTL(false);
    }
  }, []);

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

  const handleAlign = useCallback(
    (type: ElementFormatType) => () => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, type);
    },
    [editor],
  );

  return (
    <DropDown
      buttonClassName="toolbar-item spaced"
      buttonIcon={formatOption.icon}
      buttonLabel={formatOption.name}
    >
      <DropDownItem onClick={handleAlign("left")} title={left.name}>
        <i className="icon">{left.icon}</i>
        <span className="text">{left.name}</span>
      </DropDownItem>
      <DropDownItem onClick={handleAlign("center")} title={center.name}>
        <i className="icon">{center.icon}</i>
        <span className="text">{center.name}</span>
      </DropDownItem>
      <DropDownItem onClick={handleAlign("right")} title={right.name}>
        <i className="icon">{right.icon}</i>
        <span className="text">{right.name}</span>
      </DropDownItem>
      <DropDownItem onClick={handleAlign("justify")} title={justify.name}>
        <i className="icon">{justify.icon}</i>
        <span className="text">Align Justify</span>
      </DropDownItem>
      <DropDownItem onClick={handleAlign("start")} title={start.name}>
        <i className="icon">{isRTL ? start.iconRTL : start.icon}</i>
        <span className="text">{start.name}</span>
      </DropDownItem>
      <DropDownItem onClick={handleAlign("end")} title={end.name}>
        <i className="icon">{isRTL ? end.iconRTL : end.icon}</i>
        <span className="text">{end.name}</span>
      </DropDownItem>
    </DropDown>
  );
};

export default AlignPlugin;
