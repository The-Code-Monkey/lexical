import type { JSX, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const DialogActions = ({ children }: Props): JSX.Element => (
  <div className="DialogActions">{children}</div>
);

const DialogButtonsList = ({ children }: Props): JSX.Element => (
  <div className="DialogButtonsList">{children}</div>
);

export { DialogActions, DialogButtonsList };
