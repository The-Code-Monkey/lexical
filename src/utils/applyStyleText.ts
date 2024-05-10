import { $patchStyleText } from "@lexical/selection";
import { $isTableSelection } from "@lexical/table";
import type { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";

const applyStyleText =
  (editor: LexicalEditor) => (styles: { [key: string]: string }) => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  };

export default applyStyleText;
