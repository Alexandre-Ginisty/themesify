import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E'
    },
    primary: {
      main: '#1DB954', // Spotify green
    },
    secondary: {
      main: '#191414', // Spotify black
    },
  },
});

function App() {
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const tokenType = params.get('token_type');

      if (token && tokenType === 'Bearer') {
        setToken(token);
        window.location.hash = '';
      } else {
        console.error('Invalid token type received');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            body: {
              background: 'linear-gradient(135deg, #1E1E1E 0%, #121212 100%)',
              minHeight: '100vh',
            }
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={token ? <Dashboard token={token} /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
