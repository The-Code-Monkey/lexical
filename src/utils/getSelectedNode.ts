import { $isAtNodeEnd } from "@lexical/selection";
import type { RangeSelection } from "lexical";

const getSelectedNode = (selection: RangeSelection) => {
  const { anchor, focus } = selection;

  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();

  if (anchorNode === focusNode) {
    return anchorNode;
  }

  const isBackward = selection.isBackward();

  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  }

  return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
};

export default getSelectedNode;
