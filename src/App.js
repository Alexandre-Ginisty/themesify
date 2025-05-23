import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954',
    },
    background: {
      default: '#121212',
      paper: '#181818',
    },
  },
});

function App() {
  const [token, setToken] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Handle the authentication response
    const handleAuth = () => {
      setIsAuthenticating(true);
      const hash = window.location.hash;
      if (!hash) {
        // Check if we have a stored token
        const storedToken = localStorage.getItem('spotify_token');
        if (storedToken) {
          setToken(storedToken);
        }
        setIsAuthenticating(false);
        return;
      }

      // Parse the hash string (remove the leading #)
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const error = params.get('error');

      console.log('Auth Response:', { 
        hasToken: !!accessToken,
        error,
        pathname: window.location.pathname 
      });

      if (error) {
        console.error('Authentication error:', error);
        return;
      }

      if (accessToken) {
        // Store the token
        localStorage.setItem('spotify_token', accessToken);
        setToken(accessToken);
        
        // Clear the hash from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setIsAuthenticating(false);
    };

    handleAuth();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('App State:', {
      hasToken: !!token,
      currentPath: window.location.pathname,
      search: window.location.search,
      isAuthenticating
    });
  }, [token, isAuthenticating]);

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/dashboard"
            element={
              token ? <Dashboard token={token} /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
