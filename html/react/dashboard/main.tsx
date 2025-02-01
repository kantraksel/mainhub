import { ThemeProvider, createTheme } from '@mui/material/styles';
import Page from './app/Page';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalTheme from '../shared/GlobalTheme';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../shared/index.css';

const theme = createTheme(GlobalTheme);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Page />
    </ThemeProvider>
  </React.StrictMode>
)
