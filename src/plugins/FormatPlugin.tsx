import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  Bold,
  Italic,
  Quote,
  Strikethrough,
  TextParagraph,
  Underline,
} from "@techstack/react-feather";
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type LexicalNode,
  type RangeSelection,
  SELECTION_CHANGE_COMMAND,
  type TextNode,
} from "lexical";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import Dropdown, { DropDownItem } from "../ui/Dropdown";
import { LOW_PRIORITY } from "../utils/priorities";

type supportedBlockTypesType = "h1" | "h2" | "h3" | "paragraph" | "quote";

const ELEMENT_FORMAT_OPTIONS: {
  [key in supportedBlockTypesType]: {
    icon: ReactNode;
    name: string;
  };
} = {
  h1: {
    icon: <>H1</>,
    name: "Heading 1",
  },

  h2: {
    icon: <>H2</>,
    name: "Heading 2",
  },

  h3: {
    icon: <>H3</>,
    name: "Heading 3",
  },

  paragraph: {
    icon: <TextParagraph size={16} />,
    name: "Paragraph",
  },

  quote: {
    icon: <Quote size={16} />,
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
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const [textFormat, setTextFormat] =
    useState<supportedBlockTypesType>("paragraph");

  const update = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const element = getSelectionElement(selection);

      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

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
          case "h2":
          case "h3": {
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

  const toggleBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  }, [editor]);

  const toggleStrikethrough = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
  }, [editor]);

  const { [textFormat]: currentFormat } = ELEMENT_FORMAT_OPTIONS;
  const { icon: currentIcon } = currentFormat;

  return (
    <>
      <Dropdown buttonClassName="toolbar-item spaced" buttonIcon={currentIcon}>
        {Object.keys(ELEMENT_FORMAT_OPTIONS)
          .filter(isSupportedBlockTypesType)
          .map((key) => {
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
          })}
      </Dropdown>
      <button
        aria-label="Format Bold"
        className={`toolbar-item spaced ${isBold ? "active" : ""}`}
        onClick={toggleBold}
        type="button"
      >
        <Bold size={16} />
      </button>
      <button
        aria-label="Format Italic"
        className={`toolbar-item spaced ${isItalic ? "active" : ""}`}
        onClick={toggleItalic}
        type="button"
      >
        <Italic size={16} />
      </button>
      <button
        aria-label="Format Underline"
        className={`toolbar-item spaced ${isUnderline ? "active" : ""}`}
        onClick={toggleUnderline}
        type="button"
      >
        <Underline size={16} />
      </button>
      <button
        aria-label="Format Strikethrough"
        className={`toolbar-item spaced ${isStrikethrough ? "active" : ""}`}
        onClick={toggleStrikethrough}
        type="button"
      >
        <Strikethrough size={16} />
      </button>
    </>
  );
};

export default FormatPlugin;
