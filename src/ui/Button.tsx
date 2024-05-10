import type { JSX, ReactNode } from "react";

import joinClasses from "../utils/joinClasses";

const Button = ({
  children,
  className,
  isDisabled,
  isSmall,
  onClick,
  title,
}: {
  children: ReactNode;
  className?: string;
  isDisabled?: boolean;
  isSmall?: boolean;
  onClick: () => void;
  title?: string;
}): JSX.Element => (
  <button
    aria-label={title}
    className={joinClasses(
      "Button__root",
      (isDisabled ?? false) && "Button__disabled",
      (isSmall ?? false) && "Button__small",
      className,
    )}
    disabled={isDisabled}
    onClick={onClick}
    title={title}
    type="button"
  >
    {children}
  </button>
);

export default Button;
