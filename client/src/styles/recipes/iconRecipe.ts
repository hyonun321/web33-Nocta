import { defineRecipe } from "@pandacss/dev";

export const iconRecipe = defineRecipe({
  className: "icon",
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  variants: {
    size: {
      sm: {
        fontSize: "24px",
      },
      md: {
        fontSize: "30px",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});
