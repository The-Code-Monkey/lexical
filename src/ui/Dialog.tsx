import type { JSX, ReactNode } from "react";

interface Props {
  children: ReactNode;
  "data-test-id"?: string;
}

const DialogActions = ({
  children,
  "data-test-id": dataTestId,
}: Props): JSX.Element => (
  <div className="DialogActions" data-test-id={dataTestId}>
    {children}
  </div>
);

export { DialogActions };
