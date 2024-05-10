import type { ReactNode } from "react";

import ColorPicker from "./ColorPicker";
import DropDown from "./Dropdown";

interface Props {
  buttonAriaLabel: string;
  buttonClassName: string;
  buttonIcon: ReactNode;
  buttonIconClassName?: string;
  buttonLabel?: string;
  color: string;
  isDisabled?: boolean;
  onChange: (color: string) => void;
}

export default function DropdownColorPicker({
  buttonAriaLabel,
  buttonClassName,
  buttonIcon,
  buttonIconClassName,
  buttonLabel,
  color,
  isDisabled = false,
  onChange,
}: Props) {
  return (
    <DropDown
      buttonAriaLabel={buttonAriaLabel}
      buttonClassName={buttonClassName}
      buttonIcon={buttonIcon}
      buttonIconClassName={buttonIconClassName}
      buttonLabel={buttonLabel}
      disabled={isDisabled}
    >
      <ColorPicker color={color} onChange={onChange} />
    </DropDown>
  );
}
