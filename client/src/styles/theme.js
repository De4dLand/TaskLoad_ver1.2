import { createTheme } from "@mui/material/styles"

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1a56db",
      light: "#4285f4",
      dark: "#0e3fa9",
    },
    secondary: {
      main: "#f50057",
      light: "#ff4081",
      dark: "#c51162",
    },
    error: {
      main: "#f44336",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#aaaaaa",
    },
  },
  typography: {
    fontFamily: ["Roboto", "Arial", "sans-serif"].join(","),
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
        containedPrimary: {
          backgroundColor: "#1a56db",
          "&:hover": {
            backgroundColor: "#1649c0",
          },
        },
        outlinedPrimary: {
          borderColor: "#444",
          color: "#e0e0e0",
          "&:hover": {
            borderColor: "#666",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#444",
            },
            "&:hover fieldset": {
              borderColor: "#666",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#1a56db",
            },
          },
          "& .MuiInputBase-input": {
            color: "#e0e0e0",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#888",
          "&.Mui-checked": {
            color: "#1a56db",
          },
        },
      },
    },
  },
})

export default theme
