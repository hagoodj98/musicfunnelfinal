import { createTheme } from '@mui/material/styles';

// Match these to your Tailwind colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#ffffff', // tailwind 'primary'
    },
    secondary: {
      main: '#EF4C12', // tailwind 'secondary'
    },
  },
  // Optionally customize text, background, etc.
  // typography: { ... },
  // components: { ... },
});

export default theme;