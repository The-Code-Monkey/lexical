import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useCallback, useEffect, useState } from "react";

import type { EditorInterface } from "../dist/types/editor";
import { Divider, Toolbar } from "./components";
import Editor from "./editor";
import {
  AlignPlugin,
  BgColorPlugin,
  FormatPlugin,
  LinkPlugin,
  ListPlugin,
  TableActionMenuPlugin,
  TablePlugin,
  TextColorPlugin,
} from "./plugins";
import OnChangePlugin from "./plugins/OnChangePlugin";
import TableCellResizer from "./plugins/TableCellResizer";
import { defaultConfig } from "./utils/configs";

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
      <Toolbar>
        <FormatPlugin />
        <TextColorPlugin />
        <BgColorPlugin />
        <Divider />
        <LinkPlugin />
        <ListPlugin />
        <AlignPlugin />
        {/* @ts-expect-error - disable internal type */}
        <TablePlugin />
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
