import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { modalContainer, optionButton, optionModal } from "./TextOptionModal.style";

interface SelectionModalProps {
  isOpen: boolean;
  onBoldSelect: () => void;
  onItalicSelect: () => void;
  onUnderlineSelect: () => void;
  onStrikeSelect: () => void;
  onClose: () => void;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};

export const TextOptionModal = ({
  isOpen,
  onBoldSelect,
  onItalicSelect,
  onUnderlineSelect,
  onStrikeSelect,
  onClose,
}: SelectionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [TextModalPosition, setTextModalPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateModalPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        onClose();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setTextModalPosition({
        top: rect.top - 40,
        left: rect.left + rect.width / 2,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    updateModalPosition();
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return;

  return (
    <ModalPortal>
      {isOpen && (
        <motion.div
          ref={modalRef}
          className={optionModal}
          style={{
            left: `${TextModalPosition.left}px`,
            top: `${TextModalPosition.top}px`,
          }}
        >
          <div className={modalContainer}>
            <button className={optionButton} onClick={onBoldSelect}>
              B
            </button>
            <button className={optionButton} onClick={onItalicSelect}>
              I
            </button>
            <button className={optionButton} onClick={onUnderlineSelect}>
              U
            </button>
            <button className={optionButton} onClick={onStrikeSelect}>
              S
            </button>
          </div>
        </motion.div>
      )}
    </ModalPortal>
  );
};
