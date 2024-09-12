import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { BgColor } from "@techstack/react-feather";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";

import DropdownColorPicker from "../ui/DropdownColorPicker";
import applyStyleText from "../utils/applyStyleText";
import { LOW_PRIORITY } from "../utils/priorities";

const BgColorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [bgColor, setBgColor] = useState<string>("#fff0");

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText(editor)({ "background-color": value });
    },
    [editor],
  );

  const update = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "backgroundColor",
          "#fff",
        ),
      );
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

  const buttonIcon = useMemo(() => <BgColor size={14} />, []);

  return (
    <DropdownColorPicker
      buttonAriaLabel="Formatting background color"
      buttonClassName="toolbar-item color-picker"
      buttonIcon={buttonIcon}
      buttonIconClassName="format bg-color"
      color={bgColor}
      onChange={onBgColorSelect}
    />
  );
};

export default BgColorPlugin;
