import { alpha, createTheme, darken, svgIconClasses } from '@mui/material'
import {
  common,
  indigo,
  lightBlue,
  lightGreen,
  pink,
  red,
} from '@mui/material/colors'

const textPrimary = lightBlue[50]
const backgroundDefault = darken(lightBlue[900], 0.5)

export const defaultTheme = createTheme({
  palette: {
    background: {
      default: backgroundDefault,
      paper: darken(lightBlue[900], 0.2),
    },
    text: {
      primary: textPrimary,
    },
    primary: {
      main: lightBlue[500],
      contrastText: common.white,
    },
    secondary: {
      main: pink[500],
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: common.white,
        },
      },
      variants: [
        {
          props: { color: 'success', disabled: true },
          style: {
            backgroundColor: `${lightGreen[500]} !important`,
            color: `${lightGreen[50]} !important`,
          },
        },
      ],
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: textPrimary,
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: textPrimary,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
            {
              WebkitBoxShadow: `0 0 0 100px ${backgroundDefault} inset`,
              WebkitTextFillColor: textPrimary,
            },
        },
        root: {
          '&:hover fieldset': {
            borderColor: `${lightBlue[500]} !important`,
          },
          '&.Mui-error fieldset': {
            borderColor: `${red[200]} !important`,
          },
        },
        notchedOutline: {
          borderColor: lightBlue[800],
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          '&.Mui-error': {
            color: `${red[200]} !important`,
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.Mui-error': {
            color: `${red[200]} !important`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {},
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          [`& .${svgIconClasses.root}`]: {
            fill: lightBlue[200],
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          [`& .${svgIconClasses.root}`]: {
            fill: lightBlue[200],
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          minWidth: 256,
          backgroundColor: backgroundDefault,
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          color: textPrimary,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: common.white,
          backgroundColor: alpha(indigo[300], 0.8),
          boxShadow: '0 2px 4px #0008',
        },
        arrow: {
          color: alpha(indigo[300], 0.8),
        },
      },
    },
    MuiMobileStepper: {
      styleOverrides: {
        positionStatic: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
})
