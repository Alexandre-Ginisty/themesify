import React from 'react';
import { Box, Button, Typography, Container, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'f1c38d61e89f480081a9498d5ed34d6c';
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || 'https://themesify-app.windsurf.build';

// Debug logs for development
if (process.env.NODE_ENV === 'development') {
  console.log('Auth Config:', {
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
    env: process.env
  });
}

// Define the authorization URL with required parameters
const LOGIN_URI = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  scope: 'user-library-read playlist-modify-public playlist-modify-private',
  response_type: 'token',
  show_dialog: true
}).toString();

function Login() {
  const theme = useTheme();

  return (
    <Container>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          padding: 4,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
        >
          <Typography 
            variant="h2" 
            component="h1"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, #4A90E2)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            Themesify
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '600px',
              margin: '0 auto'
            }}
          >
            Transform Your Liked Songs into Perfectly Curated Mood Playlists
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="contained"
            color="primary"
            href={LOGIN_URI}
            size="large"
            sx={{
              borderRadius: '50px',
              padding: '12px 36px',
              fontSize: '1.1rem',
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(29, 185, 84, 0.4)',
              }
            }}
          >
            Connect with Spotify
          </Button>
        </motion.div>
      </Box>
    </Container>
  );
}

export default Login;
