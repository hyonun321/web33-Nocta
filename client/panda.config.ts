import { defineConfig } from "@pandacss/dev";
import { radii } from "@styles/tokens/radii";
import { colors } from "@styles/tokens/color";
import { shadows } from "@styles/tokens/shadow";
import { spacing } from "@styles/tokens/spacing";
import { textStyles } from "@styles/typography";
import { globalStyles } from "@styles/global";
import { glassContainerRecipe } from "@styles/recipes/glassContainerRecipe";
import { iconRecipe } from "@styles/recipes/iconRecipe";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  globalCss: globalStyles,
  theme: {
    extend: {
      tokens: {
        colors,
        radii,
        shadows,
        spacing,
      },
      recipes: {
        glassContainer: glassContainerRecipe,
        icon: iconRecipe,
      },
      textStyles,
    },
  },
  outdir: "styled-system",
});
