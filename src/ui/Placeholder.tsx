import type { JSX, ReactNode } from "react";

const Placeholder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element => (
  <div className={className ?? "Placeholder__root"}>{children}</div>
);

export default Placeholder;
