export const overlayAnimation = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

export const modalContainerAnimation = {
  initial: {
    scale: 0.7,
    opacity: 0,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  animate: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 0.7,
    opacity: 0,
  },
};
