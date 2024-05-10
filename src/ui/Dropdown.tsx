import { ChevronDown } from "@techstack/react-feather";
import {
  createContext,
  type JSX,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface DropDownContextType {
  registerItem: (reference: RefObject<HTMLButtonElement>) => void;
}

const DropDownContext = createContext<DropDownContextType | undefined>(
  undefined,
);

const dropDownPadding = 4;

interface DropDownItemProps {
  className?: string;
  onClick: () => void;
  title: string;
}

const DropDownItem = ({
  children,
  className = "item",
  onClick,
  title,
}: PropsWithChildren<DropDownItemProps>) => {
  const reference = useRef<HTMLButtonElement>(null);

  const dropDownContext = useContext(DropDownContext);

  if (dropDownContext === undefined) {
    throw new Error("DropDownItem must be used within a DropDown");
  }

  const { registerItem } = dropDownContext;

  useEffect(() => {
    if (reference.current) {
      registerItem(reference);
    }
  }, [reference, registerItem]);

  return (
    <button
      className={className}
      onClick={onClick}
      ref={reference}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
};

interface DropdownItemsProps {
  dropDownRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}

const DropDownItems = ({
  children,
  dropDownRef: dropDownReference,
  onClose,
}: PropsWithChildren<DropdownItemsProps>) => {
  const [items, setItems] = useState<RefObject<HTMLButtonElement>[]>();
  const [highlightedItem, setHighlightedItem] =
    useState<RefObject<HTMLButtonElement>>();

  const registerItem = useCallback(
    (itemReference: RefObject<HTMLButtonElement>) => {
      setItems((previous) =>
        previous ? [...previous, itemReference] : [itemReference],
      );
    },
    [setItems],
  );

  const LAST_INDEX = -1;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!items) {
        return;
      }

      const { key } = event;

      if (["ArrowDown", "ArrowUp", "Escape", "Tab"].includes(key)) {
        event.preventDefault();
      }

      switch (key) {
        case "Escape":
        case "Tab": {
          onClose();

          break;
        }
        case "ArrowUp": {
          setHighlightedItem((previous) => {
            if (!previous) {
              return items[0];
            }

            const index = items.indexOf(previous) - 1;

            return items[index === LAST_INDEX ? items.length - 1 : index];
          });

          break;
        }
        case "ArrowDown": {
          setHighlightedItem((previous) => {
            if (!previous) {
              return items[0];
            }

            return items[items.indexOf(previous) + 1];
          });

          break;
        }

        default: {
          break;
        }
      }
    },
    [LAST_INDEX, items, onClose],
  );

  const contextValue = useMemo(
    () => ({
      registerItem,
    }),
    [registerItem],
  );

  useEffect(() => {
    if (items && !highlightedItem) {
      setHighlightedItem(items[0]);
    }

    if (highlightedItem?.current) {
      highlightedItem.current.focus();
    }
  }, [items, highlightedItem]);

  return (
    <DropDownContext.Provider value={contextValue}>
      <button
        className="toolbar-dropdown"
        onKeyDown={handleKeyDown}
        ref={dropDownReference}
        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
        style={{
          background: "white",
          position: "absolute",
          zIndex: 1000,
        }}
        type="button"
      >
        {children}
      </button>
    </DropDownContext.Provider>
  );
};

interface DropdownProps {
  buttonAriaLabel?: string;
  buttonClassName: string;
  buttonIcon: ReactNode;
  buttonIconClassName?: string;
  buttonLabel?: string;
  disabled?: boolean;
  stopCloseOnClickSelf?: boolean;
}

const DropDown = ({
  buttonAriaLabel,
  buttonClassName,
  buttonIcon,
  buttonIconClassName = "icon",
  buttonLabel,
  children,
  disabled = false,
  stopCloseOnClickSelf,
}: PropsWithChildren<DropdownProps>): JSX.Element => {
  const dropDownReference = useRef<HTMLButtonElement>(null);
  const buttonReference = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);

  const handleClose = useCallback(() => {
    setShowDropDown(false);

    if (buttonReference.current) {
      buttonReference.current.focus();
    }
  }, []);

  useEffect(() => {
    const { current: button } = buttonReference;
    const { current: dropDown } = dropDownReference;

    if (showDropDown && button !== null && dropDown !== null) {
      dropDown.style.top = "40px";
      dropDown.style.left = "0px";
    }
  }, [dropDownReference, buttonReference, showDropDown]);

  // eslint-disable-next-line @typescript-eslint/consistent-return
  useEffect(() => {
    const { current: button } = buttonReference;

    if (button !== null && showDropDown) {
      const handle = ({ target }: MouseEvent) => {
        if (
          ((stopCloseOnClickSelf ?? false) &&
            dropDownReference.current?.contains(
              target instanceof Node ? target : null,
            )) ??
          false
        ) {
          return;
        }

        if (!button.contains(target instanceof Node ? target : null)) {
          setShowDropDown(false);
        }
      };

      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownReference, buttonReference, showDropDown, stopCloseOnClickSelf]);

  useEffect(() => {
    const handleButtonPositionUpdate = () => {
      if (showDropDown) {
        const { current: button } = buttonReference;
        const { current: dropDown } = dropDownReference;

        if (button !== null && dropDown !== null) {
          const { left, top } = button.getBoundingClientRect();
          const newPositionTop = top + button.offsetHeight + dropDownPadding;
          const newPositionLeft = left;

          if (newPositionTop !== dropDown.getBoundingClientRect().top) {
            dropDown.style.top = `${newPositionTop}px`;
          }

          if (newPositionLeft !== dropDown.getBoundingClientRect().left) {
            dropDown.style.left = `${newPositionLeft}px`;
          }
        }
      }
    };

    document.addEventListener("scroll", handleButtonPositionUpdate);

    return () => {
      document.removeEventListener("scroll", handleButtonPositionUpdate);
    };
  }, [buttonReference, dropDownReference, showDropDown]);

  const toggleDropDown = useCallback(() => {
    setShowDropDown((previous) => !previous);
  }, []);

  return (
    <>
      <button
        aria-label={buttonAriaLabel ?? buttonLabel}
        className={buttonClassName}
        disabled={disabled}
        onClick={toggleDropDown}
        ref={buttonReference}
        type="button"
      >
        <span className={buttonIconClassName}>{buttonIcon}</span>
        {Boolean(buttonLabel) && (
          <span className="text dropdown-button-text">{buttonLabel}</span>
        )}
        <i className="chevron-down">
          <ChevronDown />
        </i>
      </button>
      {Boolean(showDropDown) && (
        <DropDownItems dropDownRef={dropDownReference} onClose={handleClose}>
          {children}
        </DropDownItems>
      )}
    </>
  );
};

export default DropDown;

export { DropDownContext, DropDownItem };
