import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  type BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
  type NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  type JSX,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSharedHistoryContext } from "../context/SharedHistoryContext";
import ContentEditable from "../ui/ContentEditable";
import ImageResizer from "../ui/ImageResizer";
import Placeholder from "../ui/Placeholder";
import { $isImageNode } from "./ImageNode";

const imageCache = new Set();

const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  "RIGHT_CLICK_IMAGE_COMMAND",
);

const useSuspenseImage = (source: string) => {
  if (!imageCache.has(source)) {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-throw-literal,@typescript-eslint/only-throw-error,promise/avoid-new
    throw new Promise((resolve) => {
      const img = new Image();

      img.src = source;
      img.addEventListener("load", () => {
        imageCache.add(source);
        resolve(null);
      });
    });
  }
};

const LazyImage = ({
  altText,
  className,
  height,
  imageRef: imageReference,
  maxWidth,
  src: source,
  width,
}: {
  altText: string;
  className: string | null;
  height: number | "inherit";
  imageRef: { current: HTMLImageElement | null };
  maxWidth: number;
  src: string;
  width: number | "inherit";
}): JSX.Element => {
  useSuspenseImage(source);

  const style = useMemo(
    () => ({
      height,
      maxWidth,
      width,
    }),
    [height, maxWidth, width],
  );

  return (
    <img
      alt={altText}
      className={className ?? undefined}
      draggable="false"
      ref={imageReference}
      src={source}
      style={style}
    />
  );
};

const TIMEOUT = 200;

const ImageComponent = ({
  altText,
  caption,
  captionsEnabled,
  height,
  maxWidth,
  nodeKey,
  resizable,
  showCaption,
  src: source,
  width,
}: {
  altText: string;
  caption: LexicalEditor;
  captionsEnabled: boolean;
  height: number | "inherit";
  maxWidth: number;
  nodeKey: NodeKey;
  resizable: boolean;
  showCaption: boolean;
  src: string;
  width: number | "inherit";
}): JSX.Element => {
  const imageReference = useRef<HTMLImageElement | null>(null);
  const buttonReference = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorReference = useRef<LexicalEditor | null>(null);

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();

        const node = $getNodeByKey(nodeKey);

        if ($isImageNode(node)) {
          node.remove();

          return true;
        }
      }

      return false;
    },
    [isSelected, nodeKey],
  );

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      const { current: buttonElement } = buttonReference;

      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (showCaption) {
          // Move focus into nested editor
          $setSelection(null);
          event.preventDefault();
          caption.focus();

          return true;
        }

        if (
          buttonElement !== null &&
          buttonElement !== document.activeElement
        ) {
          event.preventDefault();
          buttonElement.focus();

          return true;
        }
      }

      return false;
    },
    [caption, isSelected, showCaption],
  );

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (
        activeEditorReference.current === caption ||
        buttonReference.current === event.target
      ) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);

          const parentRootElement = editor.getRootElement();

          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });

        return true;
      }

      return false;
    },
    [caption, editor, setSelected],
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }

      if (event.target === imageReference.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }

        return true;
      }

      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection],
  );

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();

        const { target } = event;

        if (
          target instanceof HTMLElement &&
          target.tagName === "IMG" &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
        }
      });
    },
    [editor],
  );

  useEffect(() => {
    let isMounted = true;

    const rootElement = editor.getRootElement();
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read($getSelection));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorReference.current = activeEditor;

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageReference.current) {
            // eslint-disable-next-line max-len,no-warning-comments
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();

            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    );

    rootElement?.addEventListener("contextmenu", onRightClick);

    return () => {
      isMounted = false;
      unregister();
      rootElement?.removeEventListener("contextmenu", onRightClick);
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    $onEnter,
    $onEscape,
    onClick,
    onRightClick,
    setSelected,
  ]);

  const setShowCaption = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);

      if ($isImageNode(node)) {
        node.setShowCaption(true);
      }
    });
  }, [editor, nodeKey]);

  const onResizeEnd = useCallback(
    (nextWidth: number | "inherit", nextHeight: number | "inherit") => {
      // Delay hiding the resize bars for click case
      setTimeout(() => {
        setIsResizing(false);
      }, TIMEOUT);

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);

        if ($isImageNode(node)) {
          node.setWidthAndHeight(nextWidth, nextHeight);
        }
      });
    },
    [editor, nodeKey],
  );

  const onResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const { historyState } = useSharedHistoryContext();

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = isSelected || isResizing;
  const contentEditable = useMemo(
    () => <ContentEditable className="ImageNode__contentEditable" />,
    [],
  );
  const placeholder = useMemo(
    () => (
      <Placeholder className="ImageNode__placeholder">
        Enter a caption...
      </Placeholder>
    ),
    [],
  );

  return (
    <Suspense fallback={null}>
      <>
        <div draggable={draggable}>
          <LazyImage
            altText={altText}
            className={
              isFocused
                ? `focused ${$isNodeSelection(selection) ? "draggable" : ""}`
                : null
            }
            height={height}
            imageRef={imageReference}
            maxWidth={maxWidth}
            src={source}
            width={width}
          />
        </div>
        {showCaption && (
          <div className="image-caption-container">
            <LexicalNestedComposer initialEditor={caption}>
              <AutoFocusPlugin />
              <HashtagPlugin />
              <HistoryPlugin externalHistoryState={historyState} />
              <RichTextPlugin
                contentEditable={contentEditable}
                ErrorBoundary={LexicalErrorBoundary}
                placeholder={placeholder}
              />
            </LexicalNestedComposer>
          </div>
        )}
        {resizable && $isNodeSelection(selection) && isFocused && (
          <ImageResizer
            buttonRef={buttonReference}
            captionsEnabled={captionsEnabled}
            editor={editor}
            imageRef={imageReference}
            maxWidth={maxWidth}
            onResizeEnd={onResizeEnd}
            onResizeStart={onResizeStart}
            setShowCaption={setShowCaption}
            showCaption={showCaption}
          />
        )}
      </>
    </Suspense>
  );
};

export { RIGHT_CLICK_IMAGE_COMMAND };

export default ImageComponent;
