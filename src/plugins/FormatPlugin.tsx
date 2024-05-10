import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { Quote, TextParagraph, TypeH1, TypeH2 } from "@techstack/react-feather";
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type LexicalNode,
  type RangeSelection,
  SELECTION_CHANGE_COMMAND,
  type TextNode,
} from "lexical";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import Dropdown, { DropDownItem } from "../ui/Dropdown";
import { LOW_PRIORITY } from "../utils/priorities";

type supportedBlockTypesType = "h1" | "h2" | "paragraph" | "quote";

const ELEMENT_FORMAT_OPTIONS: {
  [key in supportedBlockTypesType]: {
    icon: ReactNode;
    name: string;
  };
} = {
  h1: {
    icon: <TypeH1 />,
    name: "Heading 1",
  },

  h2: {
    icon: <TypeH2 />,
    name: "Heading 2",
  },

  paragraph: {
    icon: <TextParagraph />,
    name: "Paragraph",
  },

  quote: {
    icon: <Quote />,
    name: "Quote",
  },
};

const isSupportedBlockTypesType = (
  key: string,
): key is supportedBlockTypesType => key in ELEMENT_FORMAT_OPTIONS;

const getSelectionElement = (selection: RangeSelection) => {
  const anchorNode = selection.anchor.getNode();

  return anchorNode.getKey() === "root"
    ? anchorNode
    : $findMatchingParent(
        anchorNode,
        (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
      );
};

const getElementType = (element: LexicalNode | TextNode) =>
  $isHeadingNode(element) ? element.getTag() : element.getType();

const FormatPlugin = () => {
  const [editor] = useLexicalComposerContext();

  const [textFormat, setTextFormat] =
    useState<supportedBlockTypesType>("paragraph");

  const update = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const element = getSelectionElement(selection);

      if (element) {
        const type = getElementType(element);

        if (isSupportedBlockTypesType(type)) {
          setTextFormat(type);
        }
      }
    }
  }, []);

  const handleChangeFormat = (format: supportedBlockTypesType) => () => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        // eslint-disable-next-line default-case
        switch (format) {
          case "paragraph": {
            $setBlocksType(selection, $createParagraphNode);

            break;
          }
          case "h1":
          case "h2": {
            $setBlocksType(selection, () => $createHeadingNode(format));

            break;
          }
          case "quote": {
            $setBlocksType(selection, $createQuoteNode);

            break;
          }
        }
      }
    });
  };

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

  const { [textFormat]: currentFormat } = ELEMENT_FORMAT_OPTIONS;
  const { icon: currentIcon } = currentFormat;

  return (
    <Dropdown buttonClassName="toolbar-item spaced" buttonIcon={currentIcon}>
      {Object.keys(ELEMENT_FORMAT_OPTIONS).map((key) => {
        if (isSupportedBlockTypesType(key)) {
          const { [key]: element } = ELEMENT_FORMAT_OPTIONS;
          const { icon, name } = element;

          return (
            <DropDownItem
              key={key}
              onClick={handleChangeFormat(key)}
              title={name}
            >
              {icon}
              {name}
            </DropDownItem>
          );
        }

        return null;
      })}
    </Dropdown>
  );
};

export default FormatPlugin;
