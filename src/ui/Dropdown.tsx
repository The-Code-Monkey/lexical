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
import { createPortal } from "react-dom";

interface DropDownContextType {
  registerItem: (reference: RefObject<HTMLButtonElement | null>) => void;
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
  const reference = useRef<HTMLButtonElement | null>(null);

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
  dropDownRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

const DropDownItems = ({
  children,
  dropDownRef: dropDownReference,
  onClose,
}: PropsWithChildren<DropdownItemsProps>) => {
  const [items, setItems] = useState<RefObject<HTMLButtonElement | null>[]>();
  const [highlightedItem, setHighlightedItem] =
    useState<RefObject<HTMLButtonElement | null>>();

  const registerItem = useCallback(
    (itemReference: RefObject<HTMLButtonElement | null>) => {
      if (itemReference.current !== null) {
        setItems((previous) =>
          previous ? [...previous, itemReference] : [itemReference],
        );
      }
    },
    [setItems],
  );

  const LAST_INDEX = -1;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
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
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="toolbar-dropdown"
        onKeyDown={handleKeyDown}
        ref={dropDownReference}
        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
        style={{
          background: "white",
          position: "absolute",
          zIndex: 1000,
        }}
      >
        {children}
      </div>
    </DropDownContext.Provider>
  );
};

interface DropdownProps {
  buttonAriaLabel?: string;
  buttonClassName?: string;
  buttonIcon: ReactNode;
  buttonIconClassName?: string;
  buttonLabel?: string;
  disabled?: boolean;
}

const DropDown = ({
  buttonAriaLabel,
  buttonClassName = "toolbar-item spaced",
  buttonIcon,
  buttonIconClassName = "icon",
  buttonLabel,
  children,
  disabled = false,
}: PropsWithChildren<DropdownProps>): JSX.Element => {
  const dropDownReference = useRef<HTMLDivElement>(null);
  const buttonReference = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);

  const handleClose = useCallback(() => {
    setShowDropDown(false);

    if (buttonReference.current) {
      buttonReference.current.focus();
    }
  }, []);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleButtonPositionUpdate = useCallback(() => {
    if (showDropDown) {
      const { current: button } = buttonReference;
      const { current: dropDown } = dropDownReference;

      if (button !== null && dropDown !== null) {
        const { left, top } = button.getBoundingClientRect();
        const newPositionTop =
          top + button.offsetHeight + dropDownPadding + window.scrollY;
        const newPositionLeft = left;

        if (newPositionTop !== dropDown.getBoundingClientRect().top) {
          dropDown.style.top = `${newPositionTop}px`;
        }

        if (newPositionLeft !== dropDown.getBoundingClientRect().left) {
          dropDown.style.left = `${newPositionLeft}px`;
        }

        dropDown.style.display = "block";
      }
    } else {
      const { current: dropDown } = dropDownReference;

      if (dropDown) {
        dropDown.style.display = "none";
      }
    }
  }, [showDropDown]);

  useEffect(() => {
    const { current: button } = buttonReference;
    const { current: dropDown } = dropDownReference;

    const handle = ({ target }: MouseEvent) => {
      if (button !== null && showDropDown) {
        if (dropDown?.contains(target instanceof Node ? target : null)) {
          return;
        }

        if (!button.contains(target instanceof Node ? target : null)) {
          setShowDropDown(false);
        }
      }
    };

    document.addEventListener("click", handle);

    return () => {
      document.removeEventListener("click", handle);
    };
  }, [
    dropDownReference,
    buttonReference,
    showDropDown,
    handleButtonPositionUpdate,
  ]);

  const toggleDropDown = useCallback(() => {
    setShowDropDown((previous) => !previous);
  }, []);

  useEffect(() => {
    if (showDropDown) {
      handleButtonPositionUpdate();
    }
  }, [showDropDown, handleButtonPositionUpdate]);

  useEffect(() => {
    const { current: dropDown } = dropDownReference;

    if (dropDown) {
      dropDown.style.display = showDropDown ? "block" : "none";
    }
  }, [showDropDown]);

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
      {createPortal(
        <DropDownItems dropDownRef={dropDownReference} onClose={handleClose}>
          {children}
        </DropDownItems>,
        document.body,
      )}
    </>
  );
};

export default DropDown;

export { DropDownContext, DropDownItem };
