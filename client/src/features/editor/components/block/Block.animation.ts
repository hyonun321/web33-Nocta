export const highlight = {
  initial: {
    background: `linear-gradient(to right, 
          #BFBFFF95 0%, 
          #BFBFFF95 0%, 
          transparent 0%, 
          transparent 100%
        )`,
  },
  animate: {
    background: `linear-gradient(to right, 
          #BFBFFF95 0%, 
          #BFBFFF95 100%, 
          transparent 100%, 
          transparent 100%
        )`,
    transition: {
      duration: 1,
      ease: "linear",
    },
  },
};
