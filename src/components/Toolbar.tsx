import {
  Children,
  cloneElement,
  type JSX,
  type ReactElement,
  useRef,
} from "react";

interface ToolbarProps {
  children: ReactElement[];
  /** @internal */ floatingAnchorElem?: HTMLDivElement | null /** @internal */;
  /** @internal */ showModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
  ) => void /** @internal */;
}

const Toolbar = ({
  children,
  floatingAnchorElem: floatingAnchorElement,
  showModal,
}: ToolbarProps) => {
  const toolbarReference = useRef<HTMLDivElement>(null);

  return (
    <div className="toolbar" ref={toolbarReference}>
      {Children.map(children, (child: ReactElement) =>
        cloneElement(child, {
          floatingAnchorElem: floatingAnchorElement,
          showModal,
          toolbarRef: toolbarReference,
        }),
      )}
    </div>
  );
};

export default Toolbar;
