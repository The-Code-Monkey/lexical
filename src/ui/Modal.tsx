import { type ReactNode, type ReactPortal, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PortalImplProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
  willCloseOnClickOutside: boolean;
}

const PortalImpl = ({
  children,
  onClose,
  title,
  willCloseOnClickOutside,
}: PortalImplProps) => {
  const modalReference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalReference.current !== null) {
      modalReference.current.focus();
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const clickOutsideHandler = ({ currentTarget }: MouseEvent) => {
      if (
        currentTarget instanceof HTMLElement &&
        modalReference.current !== null &&
        !modalReference.current.contains(currentTarget) &&
        willCloseOnClickOutside
      ) {
        onClose();
      }
    };

    const { current: modelElement } = modalReference;

    if (modelElement !== null) {
      const { parentElement: modalOverlayElement } = modelElement;

      if (modalOverlayElement !== null) {
        modalOverlayElement.addEventListener("click", clickOutsideHandler);
      }
    }

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);

      if (modelElement !== null) {
        const { parentElement: modalOverlayElement } = modelElement;

        if (modalOverlayElement) {
          modalOverlayElement.removeEventListener("click", clickOutsideHandler);
        }
      }
    };
  }, [willCloseOnClickOutside, onClose]);

  return (
    <dialog className="Modal__overlay">
      <div className="Modal__modal" ref={modalReference} tabIndex={-1}>
        <h2 className="Modal__title">{title}</h2>
        <button
          aria-label="Close modal"
          className="Modal__closeButton"
          onClick={onClose}
          type="button"
        >
          X
        </button>
        <div className="Modal__content">{children}</div>
      </div>
    </dialog>
  );
};

export default function Modal({
  children,
  onClose,
  title,
  willCloseOnClickOutside = false,
}: PortalImplProps): ReactPortal {
  return createPortal(
    <PortalImpl
      onClose={onClose}
      title={title}
      willCloseOnClickOutside={willCloseOnClickOutside}
    >
      {children}
    </PortalImpl>,
    document.body,
  );
}
