import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { type PropsWithChildren, useCallback, useMemo } from "react";

import OnChangePlugin from "./plugins/OnChangePlugin";
import { defaultConfig } from "./utils/configs";
import getEditorState from "./utils/editorState";

interface EditorInterface {
  config?: InitialConfigType;
  name: string;
  onChange: (a: string) => void;
  placeholder?: string;
  value: string;
}

interface PlaceholderProps {
  placeholder?: string;
}

const Placeholder = ({ placeholder }: PlaceholderProps) => (
  <div className="editor-placeholder">
    {placeholder ?? "Enter some rich text..."}
  </div>
);

const Editor = ({
  children,
  config = defaultConfig,
  name,
  onChange,
  placeholder,
  value,
}: PropsWithChildren<EditorInterface>) => {
  const onChangeFunction = useCallback(
    (v: string) => {
      onChange(v);
    },
    [onChange],
  );

  const initialConfig = useMemo(
    () => ({
      ...config,
      editorState: getEditorState(value),
      namespace: `Editor-${name}`,
    }),
    [config, name, value],
  );

  const contentEditable = useMemo(
    () => (
      <div className="editor">
        <ContentEditable className="editor-input" />
      </div>
    ),
    [],
  );

  const _placeholder = useMemo(
    () => <Placeholder placeholder={placeholder} />,
    [placeholder],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        {children}
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={contentEditable}
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={_placeholder}
          />
        </div>
      </div>
      <OnChangePlugin onChange={onChangeFunction} />
    </LexicalComposer>
  );
};

export default Editor;
