import {
  $isTextNode,
  type DOMConversion,
  type DOMConversionMap,
  type DOMConversionOutput,
  type NodeKey,
  type SerializedTextNode,
  TextNode,
} from "lexical";

interface NodeStyle {
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textDecoration?: string;
}

const applyStyleToTextNode = (result: TextNode, style: string) => {
  if (style.length > 0) {
    return result.setStyle(style);
  }

  return result;
};

const generateStyle = (nodeStyle: NodeStyle) => {
  const {
    backgroundColor,
    color,
    fontFamily,
    fontSize,
    fontWeight,
    textDecoration,
  } = nodeStyle;

  return [
    backgroundColor === undefined
      ? null
      : `background-color: ${backgroundColor}`,
    color === undefined ? null : `color: ${color}`,
    fontFamily === undefined ? null : `font-family: ${fontFamily}`,
    fontWeight === undefined ? null : `font-weight: ${fontWeight}`,
    fontSize === undefined ? null : `font-size: ${fontSize}`,
    textDecoration === undefined ? null : `text-decoration: ${textDecoration}`,
  ]
    .filter((value) => value !== null)
    .join("; ");
};

const patchStyleConversion =
  (
    originalDOMConverter?: (node: HTMLElement) => DOMConversion | null,
  ): ((node: HTMLElement) => DOMConversionOutput | null) =>
  (node) => {
    if (originalDOMConverter) {
      const original = originalDOMConverter(node);

      if (!original) {
        return null;
      }

      const originalOutput = original.conversion(node);

      if (!originalOutput) {
        return originalOutput;
      }

      return {
        ...originalOutput,

        forChild: (lexicalNode, parent) => {
          const originalForChild = originalOutput.forChild ?? ((node) => node);
          const result = originalForChild(lexicalNode, parent);

          if ($isTextNode(result)) {
            const style = generateStyle(node.style);

            return applyStyleToTextNode(result, style);
          }

          return result;
        },
      };
    }

    return null;
  };

// eslint-disable-next-line functional/no-classes
class ExtendedTextNode extends TextNode {
  public static getType(): string {
    return "extended-text";
  }

  public static clone(node: ExtendedTextNode): ExtendedTextNode {
    return new ExtendedTextNode(node.__text, node.__key);
  }

  public static importDOM(): DOMConversionMap | null {
    const importers = TextNode.importDOM();

    return {
      ...importers,

      code: () => ({
        conversion: patchStyleConversion(importers?.code),
        priority: 1,
      }),

      em: () => ({
        conversion: patchStyleConversion(importers?.em),
        priority: 1,
      }),

      span: () => ({
        conversion: patchStyleConversion(importers?.span),
        priority: 1,
      }),

      strong: () => ({
        conversion: patchStyleConversion(importers?.strong),
        priority: 1,
      }),

      sub: () => ({
        conversion: patchStyleConversion(importers?.sub),
        priority: 1,
      }),

      sup: () => ({
        conversion: patchStyleConversion(importers?.sup),
        priority: 1,
      }),
    };
  }

  public static importJSON(serializedNode: SerializedTextNode): TextNode {
    return TextNode.importJSON(serializedNode);
  }

  public constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  public isSimpleText() {
    return (
      (this.__type === "text" || this.__type === "extended-text") &&
      this.__mode === 0
    );
  }

  public exportJSON(): SerializedTextNode {
    return {
      ...super.exportJSON(),
      type: "extended-text",
      version: 1,
    };
  }
}

export default ExtendedTextNode;
