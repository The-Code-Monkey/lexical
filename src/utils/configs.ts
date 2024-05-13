import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { TextNode } from "lexical";

import ExtendedTextNode from "../nodes/ExtendedTextNode";
import { ImageNode } from "../nodes/ImageNode";
import { Default } from "../themes";

const defaultConfig: InitialConfigType = {
  namespace: "Editor",

  // Any custom nodes go here
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HorizontalRuleNode,
    ImageNode,
    HashtagNode,
    ExtendedTextNode,
    {
      replace: TextNode,

      with: (node: InstanceType<typeof TextNode>) =>
        new ExtendedTextNode(node.__text),
    },
  ],

  // Handling of errors during update
  onError(error: Error) {
    throw error;
  },

  // The editor theme
  theme: Default,
};

export { defaultConfig };
