import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  Children,
  cloneElement,
  type ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";

import useModal from "./hooks/useModal";
import OnChangePlugin from "./plugins/OnChangePlugin";
import { defaultConfig } from "./utils/configs";
import getEditorState from "./utils/editorState";

interface EditorInterface {
  children: ReactElement | ReactElement[];
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
}: EditorInterface) => {
  const [floatingAnchorElement, setFloatingAnchorElement] = useState<
    HTMLDivElement | undefined
  >(undefined);

  const [modal, showModal] = useModal();

  const onChangeFunction = useCallback(
    (v: string) => {
      onChange(v);
    },
    [onChange],
  );

  const onReference = useCallback((_floatingAnchorElement: HTMLDivElement) => {
    setFloatingAnchorElement(_floatingAnchorElement);
  }, []);

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
      <div className="editor" ref={onReference}>
        <ContentEditable className="editor-input" />
      </div>
    ),
    [onReference],
  );

  const _placeholder = useMemo(
    () => <Placeholder placeholder={placeholder} />,
    [placeholder],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        {Children.map(children, (child: ReactElement) =>
          cloneElement(child, {
            floatingAnchorElem: floatingAnchorElement,
            showModal,
          }),
        )}
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={contentEditable}
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={_placeholder}
          />
        </div>
      </div>
      <OnChangePlugin onChange={onChangeFunction} />
      {modal}
    </LexicalComposer>
  );
};

export default Editor;
