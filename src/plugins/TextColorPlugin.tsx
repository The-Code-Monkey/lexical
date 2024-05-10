import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { FontColor } from "@techstack/react-feather";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";

import DropdownColorPicker from "../ui/DropdownColorPicker";
import applyStyleText from "../utils/applyStyleText";
import { LOW_PRIORITY } from "../utils/priorities";

const TextColorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [fontColor, setFontColor] = useState<string>("#000");

  const onFontColorSelect = useCallback(
    (color: string) => {
      applyStyleText(editor)({
        color,
      });
    },
    [editor],
  );

  const update = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000"),
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

  const buttonIcon = useMemo(() => <FontColor size={14} />, []);

  return (
    <DropdownColorPicker
      buttonAriaLabel="Formatting text color"
      buttonClassName="toolbar-item color-picker"
      buttonIcon={buttonIcon}
      buttonIconClassName="format font-color"
      color={fontColor}
      onChange={onFontColorSelect}
    />
  );
};

export default TextColorPlugin;
