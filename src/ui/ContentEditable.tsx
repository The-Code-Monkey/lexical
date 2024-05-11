import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import type { JSX } from "react";

const LexicalContentEditable = ({
  className,
}: {
  className?: string;
}): JSX.Element => (
  <ContentEditable className={className ?? "ContentEditable__root"} />
);

export default LexicalContentEditable;
