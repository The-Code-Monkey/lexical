import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

interface OnChangePluginProps {
  readonly onChange: (a: string) => void;
}

const OnChangePlugin = ({ onChange }: OnChangePluginProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerUpdateListener(() => {
        editor.update(() => {
          onChange($generateHtmlFromNodes(editor));
        });
      }),
    [editor, onChange],
  );

  return null;
};

export default OnChangePlugin;
