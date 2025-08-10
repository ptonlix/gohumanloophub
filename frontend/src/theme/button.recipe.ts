import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    colorPalette: "gray",
    borderRadius: "md",
    transition: "all 0.2s",
  },
  variants: {
    variant: {
      solid: {
        bg: "ui.main",
        color: "white",
        _hover: {
          bg: "ui.mainHover",
        },
      },
      outline: {
        bg: "transparent",
        border: "1px solid",
        borderColor: "ui.border",
        color: "ui.main",
        _hover: {
          bg: "ui.accent",
          borderColor: "ui.main",
        },
      },
      ghost: {
        bg: "transparent",
        color: "ui.main",
        _hover: {
          bg: "ui.muted",
        },
      },
      subtle: {
        bg: "ui.accent",
        color: "ui.main",
        _hover: {
          bg: "ui.muted",
        },
      },
    },
  },
})
