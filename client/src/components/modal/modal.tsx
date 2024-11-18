import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { TextButton } from "../button/textButton";
import { modalContainerAnimation, overlayAnimation } from "./modal.animation";
import {
  buttonContainer,
  container,
  modalContainer,
  modalContent,
  overlayBox,
} from "./modal.style";

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  primaryButtonLabel: string;
  primaryButtonOnClick: () => void;
  secondaryButtonLabel?: string;
  secondaryButtonOnClick?: () => void;
}

export const Modal = ({
  isOpen,
  children,
  primaryButtonLabel,
  primaryButtonOnClick,
  secondaryButtonLabel,
  secondaryButtonOnClick,
}: ModalProps) => {
  const portal = document.getElementById("modal") as HTMLElement;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={container}>
          <motion.div
            initial={overlayAnimation.initial}
            animate={overlayAnimation.animate}
            exit={overlayAnimation.exit}
            className={overlayBox}
          />

          <motion.div
            initial={modalContainerAnimation.initial}
            animate={modalContainerAnimation.animate}
            exit={modalContainerAnimation.exit}
            className={modalContainer}
          >
            <div className={modalContent}>{children}</div>
            <div className={buttonContainer}>
              {secondaryButtonLabel && (
                <TextButton onClick={secondaryButtonOnClick} variant="secondary">
                  {secondaryButtonLabel}
                </TextButton>
              )}
              <TextButton onClick={primaryButtonOnClick}>{primaryButtonLabel}</TextButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portal,
  );
};
