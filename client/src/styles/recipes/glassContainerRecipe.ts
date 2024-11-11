import { defineRecipe } from "@pandacss/dev";

export const glassContainerRecipe = defineRecipe({
  className: "glassContainer",
  base: {
    borderRadius: "md",
    background: "linear-gradient(180deg, token(colors.white/60), token(colors.white/0))",
    boxShadow: "lg",
    backdropFilter: "blur(20px)",
  },
  variants: {
    borderRadius: {
      top: {
        borderBottomRadius: "none",
      },
      bottom: {
        borderTopRadius: "none",
      },
      right: {
        borderLeftRadius: "none",
      },
      left: {
        borderRightRadius: "none",
      },
    },

    border: {
      md: {
        border: "1px solid token(colors.white/40)",
      },
      lg: {
        border: "2px solid token(colors.white/40)",
      },
    },
  },
});
