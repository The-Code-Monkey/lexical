import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, CAN_USE_DOM, mergeRegister } from "@lexical/utils";
import { Image as ImageIcon } from "@techstack/react-feather";
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  type LexicalCommand,
  type LexicalEditor,
} from "lexical";
import {
  type JSX,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  type ImagePayload,
} from "../nodes/ImageNode";
import Button from "../ui/Button";
import { DialogActions, DialogButtonsList } from "../ui/Dialog";
import { DropDownContext, DropDownItem } from "../ui/Dropdown";
import FileInput from "../ui/FileInput";
import TextInput from "../ui/TextInput";

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow ?? window).getSelection() : null;

const $getImageNodeInSelection = (): ImageNode | null => {
  const selection = $getSelection();

  if (!$isNodeSelection(selection)) {
    return null;
  }

  const nodes = selection.getNodes();
  const { 0: node } = nodes;

  return $isImageNode(node) ? node : null;
};

// eslint-disable-next-line @typescript-eslint/no-use-before-define
const getDragImageData = (event: DragEvent): InsertImagePayload | null => {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag");

  if (!dragData) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const {
    data,
    type,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    data: InsertImagePayload;
    type: string;
  } = JSON.parse(dragData);

  if (type !== "image") {
    return null;
  }

  return data;
};

const TRANSPARENT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const img = document.createElement("img");

img.src = TRANSPARENT_IMAGE;

const $onDragStart = (event: DragEvent): boolean => {
  const node = $getImageNodeInSelection();

  if (!node) {
    return false;
  }

  const { dataTransfer } = event;

  if (!dataTransfer) {
    return false;
  }

  dataTransfer.setData("text/plain", "_");
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
      },

      type: "image",
    }),
  );

  return true;
};

const canDropImage = (event: DragEvent): boolean => {
  const { target } = event;

  return Boolean(
    target instanceof HTMLElement &&
      !target.closest("code, span.editor-image") &&
      target.parentElement?.closest("div.ContentEditable__root"),
  );
};

const $onDragover = (event: DragEvent): boolean => {
  const node = $getImageNodeInSelection();

  if (!node) {
    return false;
  }

  if (!canDropImage(event)) {
    event.preventDefault();
  }

  return true;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const getDragSelection = (event: DragEvent): Range | null | undefined => {
  let range;

  const {
    clientX,
    clientY,
    currentTarget: target,
    rangeOffset,
    rangeParent,
  } = event;

  let targetWindow: Window | null;

  if (target instanceof Document) {
    const { defaultView } = target;

    targetWindow = defaultView;
  } else if (target instanceof Element) {
    targetWindow = target.ownerDocument.defaultView ?? null;
  } else {
    targetWindow = null;
  }

  if (targetWindow instanceof Window) {
    const domSelection = getDOMSelection(targetWindow);

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,etc/no-deprecated
    if (document.caretRangeFromPoint) {
      // eslint-disable-next-line etc/no-deprecated
      range = document.caretRangeFromPoint(clientX, clientY);
    } else if (rangeParent && domSelection !== null) {
      domSelection.collapse(rangeParent, rangeOffset ?? 0);
      range = domSelection.getRangeAt(0);
    } else {
      throw new Error("Cannot get the selection when dragging");
    }
  }

  return range;
};

const $onDrop = (event: DragEvent, editor: LexicalEditor): boolean => {
  const node = $getImageNodeInSelection();

  if (!node) {
    return false;
  }

  const data = getDragImageData(event);

  if (!data) {
    return false;
  }

  event.preventDefault();

  if (canDropImage(event)) {
    const range = getDragSelection(event);

    node.remove();

    const rangeSelection = $createRangeSelection();

    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }

    $setSelection(rangeSelection);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }

  return true;
};

type InsertImagePayload = Readonly<ImagePayload>;

const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand(
  "INSERT_IMAGE_COMMAND",
);

const InsertImageUriDialogBody = ({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) => {
  const [source, setSource] = useState("");
  const [altText, setAltText] = useState("");

  const isDisabled = source === "";

  const handleOnClick = useCallback(() => {
    onClick({ altText, src: source });
  }, [altText, onClick, source]);

  return (
    <>
      <TextInput
        data-test-id="image-modal-url-input"
        label="Image URL"
        onChange={setSource}
        placeholder="i.e. https://source.unsplash.com/random"
        value={source}
      />
      <TextInput
        data-test-id="image-modal-alt-text-input"
        label="Alt Text"
        onChange={setAltText}
        placeholder="Random unsplash image"
        value={altText}
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-confirm-btn"
          isDisabled={isDisabled}
          onClick={handleOnClick}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
};

const InsertImageUploadedDialogBody = ({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) => {
  const [source, setSource] = useState("");
  const [altText, setAltText] = useState("");

  const isDisabled = source === "";

  const loadImage = useCallback((files: FileList | null) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setSource(reader.result);
      }

      return "";
    });

    if (files?.[0] !== undefined) {
      reader.readAsDataURL(files[0]);
    }
  }, []);

  const handleOnClick = useCallback(() => {
    onClick({ altText, src: source });
  }, [altText, onClick, source]);

  return (
    <>
      <FileInput
        accept="image/*"
        data-test-id="image-modal-file-upload"
        label="Image Upload"
        onChange={loadImage}
      />
      <TextInput
        data-test-id="image-modal-alt-text-input"
        label="Alt Text"
        onChange={setAltText}
        placeholder="Descriptive alternative text"
        value={altText}
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-file-upload-btn"
          isDisabled={isDisabled}
          onClick={handleOnClick}
        >
          Confirm
        </Button>
      </DialogActions>
    </>
  );
};

const InsertImageDialog = ({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element => {
  const [mode, setMode] = useState<"file" | "url" | null>(null);
  const hasModifier = useRef<boolean>(false);

  useEffect(() => {
    hasModifier.current = false;

    const handler = (event: KeyboardEvent) => {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      hasModifier.current = event.altKey;
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [activeEditor]);

  const onClick = useCallback(
    (payload: InsertImagePayload) => {
      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
      onClose();
    },
    [activeEditor, onClose],
  );

  const handleSetMode = (mode: "file" | "url") => () => {
    setMode(mode);
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="image-modal-option-url"
            onClick={handleSetMode("url")}
          >
            URL
          </Button>
          <Button
            data-test-id="image-modal-option-file"
            onClick={handleSetMode("file")}
          >
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === "url" && <InsertImageUriDialogBody onClick={onClick} />}
      {mode === "file" && <InsertImageUploadedDialogBody onClick={onClick} />}
    </>
  );
};

interface ImagePluginProps {
  /** @internal */ showModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
  ) => void /** @internal */;
}

const ImagePlugin = ({ showModal }: ImagePluginProps) => {
  const [editor] = useLexicalComposerContext();
  const dropDownContext = useContext(DropDownContext);

  const handleShowModal = useCallback(() => {
    showModal("Insert Image", (onClose) => (
      <InsertImageDialog activeEditor={editor} onClose={onClose} />
    ));
  }, [editor, showModal]);

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);

          $insertNodes([imageNode]);

          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        $onDragStart,
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        $onDragover,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => $onDrop(event, editor),
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return dropDownContext === undefined ? (
    <Button
      className="toolbar-item spaced"
      onClick={handleShowModal}
      title="image"
    >
      <ImageIcon size={16} />
      Image
    </Button>
  ) : (
    <DropDownItem onClick={handleShowModal} title="image">
      <ImageIcon size={16} />
      Image
    </DropDownItem>
  );
};

export default ImagePlugin;
