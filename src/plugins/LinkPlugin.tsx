import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { Edit, Link } from "@techstack/react-feather";
import {
  $getSelection,
  $isRangeSelection,
  type BaseSelection,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import getSelectedNode from "../utils/getSelectedNode";
import positionEditorElement from "../utils/positionEditorElement";

const LowPriority = 1;

interface FloatingLinkEditorProps {
  editor: LexicalEditor;
}

const FloatingLinkEditor = ({ editor }: FloatingLinkEditorProps) => {
  const editorReference = useRef<HTMLDivElement>(null);
  const inputReference = useRef<HTMLInputElement>(null);
  const mouseDownReference = useRef(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [lastSelection, setLastSelection] = useState<BaseSelection | null>(
    null,
  );

  // eslint-disable-next-line complexity,sonarjs/cognitive-complexity
  const updateLinkEditor = useCallback((): boolean => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();

      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }

    const { current: editorElement } = editorReference;
    const nativeSelection = window.getSelection();
    const { activeElement } = document;

    if (editorElement === null) {
      return false;
    }

    const rootElement = editor.getRootElement();

    if (
      nativeSelection !== null &&
      selection !== null &&
      !nativeSelection.isCollapsed &&
      (rootElement?.contains(nativeSelection.anchorNode) ?? false)
    ) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const rect: DOMRect = {} as DOMRect;

      const inner: Element | HTMLElement | null =
        rootElement?.firstElementChild === undefined
          ? rootElement
          : rootElement.firstElementChild;

      if (!mouseDownReference.current) {
        positionEditorElement(
          editorElement,
          inner ? inner.getBoundingClientRect() : rect,
        );
      }

      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElement, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    } else {
      return true;
    }

    return true;
  }, [editor]);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            updateLinkEditor();
          });
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            updateLinkEditor();

            return true;
          },
          LowPriority,
        ),
      ),
    [editor, updateLinkEditor],
  );

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (editMode && inputReference.current) {
      inputReference.current.focus();
    }
  }, [editMode]);

  const handleLinkInputOnChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setLinkUrl(event.target.value);
    },
    [setLinkUrl],
  );

  const handleLinkInputOnKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();

        if (lastSelection !== null) {
          if (linkUrl !== "") {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
          }

          setEditMode(false);
        }
        // eslint-disable-next-line sonarjs/elseif-without-else
      } else if (event.key === "Escape") {
        event.preventDefault();
        setEditMode(false);
      }
    },
    [editor, lastSelection, linkUrl],
  );

  const toggleEditMode = useCallback(() => {
    setEditMode((previous) => !previous);
  }, []);

  const preventDefault = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="link-editor" ref={editorReference}>
      {editMode ? (
        <input
          className="link-input"
          onChange={handleLinkInputOnChange}
          onKeyDown={handleLinkInputOnKeyDown}
          ref={inputReference}
          value={linkUrl}
        />
      ) : (
        <div className="link-input">
          <a href={linkUrl} rel="noopener noreferrer" target="_blank">
            {linkUrl}
          </a>
          <button
            className="link-edit"
            onClick={toggleEditMode}
            onMouseDown={preventDefault}
            type="button"
          >
            <Edit size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

const LinkPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [isLink, setIsLink] = useState(false);

  const update = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();

      console.log(node, parent);

      if ($isLinkNode(parent) || $isLinkNode(node)) {
        console.log("HERE");

        setIsLink(true);
      } else {
        setIsLink(false);
      }
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
          LowPriority,
        ),
      ),
    [editor, update, isLink],
  );

  const insertLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    }
  }, [editor, isLink]);

  return (
    <>
      <button
        aria-label="Insert Link"
        className={`toolbar-item spaced ${isLink ? "active" : ""}`}
        onClick={insertLink}
        type="button"
      >
        <i className="format link">
          <Link size={14} />
        </i>
      </button>
      {isLink &&
        createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
    </>
  );
};

export default LinkPlugin;
