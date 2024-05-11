import { type PropsWithChildren, useRef } from "react";

const Toolbar = ({ children }: PropsWithChildren) => {
  const toolbarReference = useRef<HTMLDivElement>(null);

  return (
    <div className="toolbar" ref={toolbarReference}>
      {children}
    </div>
  );
};

export default Toolbar;
