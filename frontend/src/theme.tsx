import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
      bg: "gray.50",
      color: "gray.800",
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
      _hover: {
        color: "ui.mainHover",
      },
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#4A5568" },
          mainHover: { value: "#2D3748" },
          secondary: { value: "#718096" },
          accent: { value: "#E2E8F0" },
          border: { value: "#CBD5E0" },
          background: { value: "#F7FAFC" },
          surface: { value: "#FFFFFF" },
          muted: { value: "#EDF2F7" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
