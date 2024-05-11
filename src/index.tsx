import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { Plus } from "@techstack/react-feather";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Divider, Toolbar } from "./components";
import Editor from "./editor";
import {
  AlignPlugin,
  BgColorPlugin,
  FormatPlugin,
  ImagePlugin,
  LinkPlugin,
  ListPlugin,
  TableActionMenuPlugin,
  TablePlugin,
  TextColorPlugin,
} from "./plugins";
import OnChangePlugin from "./plugins/OnChangePlugin";
import TableCellResizer from "./plugins/TableCellResizer";
import Dropdown from "./ui/Dropdown";
import { defaultConfig } from "./utils/configs";

interface EditorInterface {
  config?: InitialConfigType;
  name: string;
  onChange: (a: string) => void;
  placeholder?: string;
  value: string;
}

const EditorContainer = ({
  config = defaultConfig,
  name,
  onChange,
  placeholder,
  value,
}: EditorInterface) => {
  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !Object.prototype.hasOwnProperty.call(window, "matchMedia")
    ) {
      return;
    }

    const updateViewPortWidth = () => {
      const { matches: isNextSmallWidthViewport } = window.matchMedia(
        "(max-width: 1025px)",
      );

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };

    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    // eslint-disable-next-line @typescript-eslint/consistent-return
    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  const onChangeFunction = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange],
  );

  const buttonIcon = useMemo(() => <Plus size={12} />, []);

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <Editor
      config={config}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    >
      {/* toolbar plugins */}
      {/* @ts-expect-error - disable internal type */}
      <Toolbar>
        <FormatPlugin />
        <TextColorPlugin />
        <BgColorPlugin />
        <Divider />
        <LinkPlugin />
        <ListPlugin />
        <AlignPlugin />
        <Dropdown buttonIcon={buttonIcon} buttonLabel="Insert">
          {/* @ts-expect-error - disable internal type */}
          <TablePlugin />
          {/* @ts-expect-error - disable internal type */}
          <ImagePlugin />
        </Dropdown>
      </Toolbar>
      {/* non toolbar plugins */}
      <OnChangePlugin onChange={onChangeFunction} />
      {/* Old Plugins */}
      <HistoryPlugin />
      <MarkdownShortcutPlugin />
      <TableCellResizer />
      <TableActionMenuPlugin />
    </Editor>
  );
};

export default EditorContainer;
