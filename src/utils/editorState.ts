import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes, type LexicalEditor } from "lexical";

const getEditorState = (value: string) => (editor: LexicalEditor) => {
  editor.update(() => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(value, "text/html");

    // Once you have the DOM instance it's easy to generate LexicalNodes.
    const nodes = $generateNodesFromDOM(editor, dom);

    // Select the root
    $getRoot().select();

    // Insert them at a selection.
    $insertNodes(nodes);
  });
};

export default getEditorState;
