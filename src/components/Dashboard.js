import React, { useState, useEffect, useCallback } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { 
  Container, 
  Typography, 
  Box, 
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { LibraryMusic, PlaylistAdd, Mood } from '@mui/icons-material';

const spotify = new SpotifyWebApi();

const MotionCard = motion(Card);

const moodCategories = {
  happy: { name: 'Happy', energy: 0.8, valence: 0.7 },
  chill: { name: 'Chill', energy: 0.4, valence: 0.5 },
  energetic: { name: 'Energetic', energy: 0.9, valence: 0.6 },
  melancholic: { name: 'Melancholic', energy: 0.3, valence: 0.3 },
  focused: { name: 'Focused', energy: 0.6, valence: 0.5 },
};

const Dashboard = ({ token }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [moodPlaylists, setMoodPlaylists] = useState({});

  const analyzeSongs = useCallback(async (songs) => {
    try {
      const trackIds = songs.map(song => song.track.id);
      const audioFeatures = await spotify.getAudioFeaturesForTracks(trackIds);
      
      const categorizedSongs = {};
      Object.keys(moodCategories).forEach(mood => {
        categorizedSongs[mood] = [];
      });

      audioFeatures.audio_features.forEach((features, index) => {
        if (!features) return;

        Object.entries(moodCategories).forEach(([mood, criteria]) => {
          const energyDiff = Math.abs(features.energy - criteria.energy);
          const valenceDiff = Math.abs(features.valence - criteria.valence);
          
          if (energyDiff < 0.2 && valenceDiff < 0.2) {
            categorizedSongs[mood].push(songs[index].track);
          }
        });
      });

      setMoodPlaylists(categorizedSongs);
    } catch (error) {
      console.error('Error analyzing songs:', error);
    }
  }, []);

  const loadLikedSongs = useCallback(async () => {
    try {
      let songs = [];
      let offset = 0;
      let total = 1;

      while (offset < total) {
        const response = await spotify.getMySavedTracks({ limit: 50, offset });
        total = response.total;
        songs = [...songs, ...response.items];
        offset += 50;
      }

      await analyzeSongs(songs);
    } catch (error) {
      console.error('Error loading liked songs:', error);
    } finally {
      setLoading(false);
    }
  }, [analyzeSongs]);

  useEffect(() => {
    spotify.setAccessToken(token);
    loadLikedSongs();
  }, [token, loadLikedSongs]);

  const createPlaylist = async (mood) => {
    try {
      const user = await spotify.getMe();
      const playlist = await spotify.createPlaylist(user.id, {
        name: `${moodCategories[mood].name} Playlist by Themesify`,
        description: `Auto-generated ${moodCategories[mood].name.toLowerCase()} playlist from your liked songs`
      });

      const trackUris = moodPlaylists[mood]
        .slice(0, 50)
        .map(track => track.uri);

      await spotify.addTracksToPlaylist(playlist.id, trackUris);
      alert('Playlist created successfully!');
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Error creating playlist. Please try again.');
    }
  };

  const renderLoadingState = () => (
    <Container>
      <Box 
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          Analyzing Your Music
        </Typography>
        <Box sx={{ width: '300px' }}>
          <LinearProgress 
            color="primary"
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5
              }
            }}
          />
        </Box>
        <Typography color="textSecondary">
          Creating your personalized mood playlists...
        </Typography>
      </Box>
    </Container>
  );

  const renderMoodPlaylists = () => (
    <Container>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        sx={{ 
          my: 4,
          p: 3,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, #4A90E2)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Mood sx={{ fontSize: 40 }} /> Your Mood Playlists
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(moodPlaylists).map(([mood, songs]) => (
            <Grid item xs={12} sm={6} md={4} key={mood}>
              <MotionCard
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.03 }}
                sx={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <LibraryMusic /> {moodCategories[mood].name}
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      mb: 2
                    }}
                  >
                    {songs.length} songs match this mood
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => createPlaylist(mood)}
                    disabled={songs.length === 0}
                    startIcon={<PlaylistAdd />}
                    sx={{ 
                      mt: 2,
                      borderRadius: '50px',
                      textTransform: 'none',
                      boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 20px rgba(29, 185, 84, 0.4)',
                      }
                    }}
                  >
                    Create Playlist
                  </Button>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );

  return loading ? renderLoadingState() : renderMoodPlaylists();
};

export default Dashboard;
