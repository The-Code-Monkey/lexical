import { type JSX, useCallback, useMemo, useState } from "react";

import Modal from "../ui/Modal";

const useModal = (): [
  JSX.Element | null,
  (title: string, showModal: (onClose: () => void) => JSX.Element) => void,
] => {
  const [modalContent, setModalContent] = useState<{
    closeOnClickOutside: boolean;
    content: JSX.Element;
    title: string;
  } | null>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) {
      return null;
    }

    const { closeOnClickOutside, content, title } = modalContent;

    return (
      <Modal
        onClose={onClose}
        title={title}
        willCloseOnClickOutside={closeOnClickOutside}
      >
        {content}
      </Modal>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (
      title: string,
      getContent: (onClose: () => void) => JSX.Element,
      closeOnClickOutside = false,
    ) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        title,
      });
    },
    [onClose],
  );

  return useMemo(() => [modal, showModal], [modal, showModal]);
};

export default useModal;
