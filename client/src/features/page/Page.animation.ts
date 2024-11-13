export const pageAnimation = {
  initial: {
    x: -300,
    y: 0,
    opacity: 0,
    scale: 0.8,
  },
  animate: ({ x, y, isActive }: { x: number; y: number; isActive: boolean }) => ({
    x,
    y,
    opacity: 1,
    scale: 1,
    boxShadow: isActive ? "0 8px 30px rgba(0,0,0,0.15)" : "0 2px 10px rgba(0,0,0,0.1)",
    transition: {
      boxShadow: { duration: 0.2 },
    },
  }),
};

export const resizeHandleAnimation = {
  whileHover: {
    scale: 1.1,
    boxShadow: "0 8px 16px #00000030",
  },
};
