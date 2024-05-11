import {
  $applyNodeReplacement,
  createEditor,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedEditor,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { lazy, Suspense } from "react";

// eslint-disable-next-line import/no-cycle
const ImageComponent = lazy(async () => await import("./ImageComponent"));

interface ImagePayload {
  altText: string;
  caption?: LexicalEditor;
  captionsEnabled?: boolean;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  width?: number;
}

const $convertImageElement = (domNode: Node): DOMConversionOutput | null => {
  const img = domNode;

  if (img instanceof HTMLImageElement) {
    if (img.src.startsWith("file:///")) {
      return null;
    }

    const { alt: altText, height, src: source, width } = img;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const node = $createImageNode({ altText, height, src: source, width });

    return { node };
  }

  return null;
};

// eslint-disable-next-line max-len
// eslint-disable-next-line react-prefer-function-component/react-prefer-function-component,functional/no-classes
class ImageNode extends DecoratorNode<JSX.Element> {
  public static getType(): string {
    return "image";
  }

  public static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__captionsEnabled,
      node.__key,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  public static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const {
      altText,
      caption,
      height,
      maxWidth,
      showCaption,
      src: source,
      width,
    } = serializedNode;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      showCaption,
      src: source,
      width,
    });
    const { __caption: nestedEditor } = node;
    const editorState = nestedEditor.parseEditorState(caption.editorState);

    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }

    return node;
  }

  public static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    source: string,
    altText: string,
    maxWidth: number,
    width?: number | "inherit",
    height?: number | "inherit",
    showCaption = false,
    caption?: LexicalEditor,
    captionsEnabled = false,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = source;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width ?? "inherit";
    this.__height = height ?? "inherit";
    this.__showCaption = showCaption;
    this.__caption = caption ?? createEditor();
    this.__captionsEnabled = captionsEnabled;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");

    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    element.setAttribute("width", this.__width.toString());
    element.setAttribute("height", this.__height.toString());

    return { element };
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === "inherit" ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: "image",
      version: 1,
      width: this.__width === "inherit" ? 0 : this.__width,
    };
  }

  setWidthAndHeight(
    width: number | "inherit",
    height: number | "inherit",
  ): void {
    const writable = this.getWritable();

    writable.__width = width;
    writable.__height = height;
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable();

    writable.__showCaption = showCaption;
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const { theme } = config;
    const { image: className } = theme;

    if (className !== undefined) {
      span.className = className;
    }

    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          altText={this.__altText}
          caption={this.__caption}
          captionsEnabled={this.__captionsEnabled}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          resizable
          showCaption={this.__showCaption}
          src={this.__src}
          width={this.__width}
        />
      </Suspense>
    );
  }

  __src: string;

  __altText: string;

  __width: number | "inherit";

  __height: number | "inherit";

  __maxWidth: number;

  __showCaption: boolean;

  __caption: LexicalEditor;

  // Captions cannot yet be used within editor cells
  __captionsEnabled: boolean;
}

const $createImageNode = ({
  altText,
  caption,
  captionsEnabled,
  height,
  key,
  maxWidth = 500,
  showCaption,
  src: source,
  width,
}: ImagePayload): ImageNode =>
  $applyNodeReplacement(
    new ImageNode(
      source,
      altText,
      maxWidth,
      width,
      height,
      showCaption,
      caption,
      captionsEnabled,
      key,
    ),
  );

type SerializedImageNode = Spread<
  {
    altText: string;
    caption: SerializedEditor;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

const $isImageNode = (
  node: LexicalNode | null | undefined,
): node is ImageNode => node instanceof ImageNode;

export {
  $createImageNode,
  $isImageNode,
  ImageNode,
  type ImagePayload,
  type SerializedImageNode,
};
