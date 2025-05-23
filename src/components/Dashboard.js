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
  LinearProgress,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { LibraryMusic, PlaylistAdd, Mood, Refresh } from '@mui/icons-material';

// Initialize Spotify API client
const spotify = new SpotifyWebApi();
const MotionCard = motion(Card);

// Debug logger
const debug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Themesify Debug] ${message}`, data || '');
  }
};

// Mood categories with detailed characteristics and images
const moodCategories = {
  happy: { 
    name: 'Happy',
    image: 'https://source.unsplash.com/featured/?happy,joy',
    characteristics: {
      energy: { min: 0.6, max: 1.0 },
      valence: { min: 0.7, max: 1.0 },
      danceability: { min: 0.5 },
      tempo: { min: 100, max: 140 }
    },
    color: '#FFD700'
  },
  chill: { 
    name: 'Chill',
    image: 'https://source.unsplash.com/featured/?relax,calm',
    characteristics: {
      energy: { max: 0.5 },
      valence: { min: 0.3, max: 0.7 },
      acousticness: { min: 0.5 },
      tempo: { max: 100 }
    },
    color: '#4BA6FF'
  },
  energetic: { 
    name: 'Energetic',
    image: 'https://source.unsplash.com/featured/?energy,dance',
    characteristics: {
      energy: { min: 0.8 },
      tempo: { min: 120 },
      danceability: { min: 0.6 }
    },
    color: '#FF4B4B'
  },
  melancholic: { 
    name: 'Melancholic',
    image: 'https://source.unsplash.com/featured/?rain,sad',
    characteristics: {
      energy: { max: 0.4 },
      valence: { max: 0.4 },
      mode: 0,
      acousticness: { min: 0.4 }
    },
    color: '#8A2BE2'
  },
  focus: { 
    name: 'Focus',
    image: 'https://source.unsplash.com/featured/?study,work',
    characteristics: {
      energy: { min: 0.4, max: 0.7 },
      speechiness: { max: 0.1 },
      instrumentalness: { min: 0.4 }
    },
    color: '#32CD32'
  },
  party: { 
    name: 'Party',
    image: 'https://source.unsplash.com/featured/?party,celebration',
    characteristics: {
      energy: { min: 0.7 },
      danceability: { min: 0.7 },
      valence: { min: 0.6 },
      tempo: { min: 115 }
    },
    color: '#FF69B4'
  },
  romantic: { 
    name: 'Romantic',
    image: 'https://source.unsplash.com/featured/?love,romance',
    characteristics: {
      energy: { max: 0.6 },
      valence: { min: 0.5 },
      acousticness: { min: 0.3 },
      instrumentalness: { max: 0.4 }
    },
    color: '#FF1493'
  },
  workout: { 
    name: 'Workout',
    image: 'https://source.unsplash.com/featured/?gym,fitness',
    characteristics: {
      energy: { min: 0.8 },
      tempo: { min: 130 },
      danceability: { min: 0.6 },
      valence: { min: 0.5 }
    },
    color: '#FF4500'
  }
};

const Dashboard = ({ token }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [moodPlaylists, setMoodPlaylists] = useState({});
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Check if a song matches a mood's characteristics
  const songMatchesMood = useCallback((features, characteristics) => {
    if (!features) return false;

    return Object.entries(characteristics).every(([feature, criteria]) => {
      if (feature === 'mode' && typeof criteria === 'number') {
        return features[feature] === criteria;
      }

      const value = features[feature];
      if (typeof value !== 'number') return true;

      if (criteria.min && value < criteria.min) return false;
      if (criteria.max && value > criteria.max) return false;
      return true;
    });
  }, []);

  // Analyze songs and categorize them by mood
  const analyzeSongs = useCallback(async (songs) => {
    debug('Starting song analysis', { totalSongs: songs.length });
    setAnalyzing(true);
    setError(null);

    try {
      const categorizedSongs = {};
      Object.keys(moodCategories).forEach(mood => {
        categorizedSongs[mood] = [];
      });

      // Process songs in batches to avoid rate limits
      const batchSize = 50;
      const totalBatches = Math.ceil(songs.length / batchSize);

      for (let i = 0; i < songs.length; i += batchSize) {
        const batch = songs.slice(i, i + batchSize);
        const trackIds = batch.map(song => song.track.id).filter(Boolean);

        if (trackIds.length === 0) continue;

        const audioFeatures = await spotify.getAudioFeaturesForTracks(trackIds);
        
        if (!audioFeatures?.audio_features) {
          throw new Error('Failed to get audio features');
        }

        audioFeatures.audio_features.forEach((features, index) => {
          if (!features) return;

          Object.entries(moodCategories).forEach(([mood, category]) => {
            if (songMatchesMood(features, category.characteristics)) {
              categorizedSongs[mood].push(batch[index].track);
            }
          });
        });

        // Update progress
        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress((currentBatch / totalBatches) * 100);
        debug('Analysis progress', { currentBatch, totalBatches, progress: `${((currentBatch / totalBatches) * 100).toFixed(1)}%` });
      }

      setMoodPlaylists(categorizedSongs);
      debug('Analysis complete', categorizedSongs);
    } catch (error) {
      const errorMessage = error?.response?.data?.error?.message || error.message;
      debug('Analysis error', errorMessage);
      setError(`Error analyzing songs: ${errorMessage}`);
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  }, [songMatchesMood]);

  // Load user's liked songs and analyze them
  const loadLikedSongs = useCallback(async () => {
    debug('Loading liked songs');
    setLoading(true);
    setError(null);

    try {
      let songs = [];
      let offset = 0;
      let total = 1;

      while (offset < total) {
        const response = await spotify.getMySavedTracks({ limit: 50, offset });
        if (!response?.items) {
          throw new Error('Failed to load liked songs');
        }

        total = response.total;
        songs = [...songs, ...response.items];
        offset += 50;

        debug('Loading progress', { loaded: songs.length, total });
      }

      debug('Liked songs loaded', { totalSongs: songs.length });
      await analyzeSongs(songs);
    } catch (error) {
      const errorMessage = error?.response?.data?.error?.message || error.message;
      debug('Loading error', errorMessage);
      setError(`Error loading songs: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [analyzeSongs]);

  // Initialize Spotify client and load songs
  useEffect(() => {
    if (!token) {
      setError('No access token available');
      return;
    }

    debug('Initializing with token', { tokenLength: token.length });
    spotify.setAccessToken(token);
    loadLikedSongs();
  }, [token, loadLikedSongs]);



  const createPlaylist = async (mood) => {
    try {
      debug('Creating playlist', { mood });
      setError(null);

      const user = await spotify.getMe();
      if (!user?.id) throw new Error('Failed to get user information');

      const playlist = await spotify.createPlaylist(user.id, {
        name: `${moodCategories[mood].name} Playlist by Themesify`,
        description: `Auto-generated ${moodCategories[mood].name.toLowerCase()} playlist from your liked songs. Created with Themesify.`
      });

      if (!playlist?.id) throw new Error('Failed to create playlist');

      const trackUris = moodPlaylists[mood]
        .slice(0, 100) // Limit to 100 songs
        .map(track => track.uri)
        .filter(Boolean);

      if (trackUris.length === 0) throw new Error('No valid tracks to add');

      await spotify.addTracksToPlaylist(playlist.id, trackUris);
      debug('Playlist created successfully', { playlistId: playlist.id, trackCount: trackUris.length });
      
      setError({ type: 'success', message: 'Playlist created successfully!' });
    } catch (error) {
      const errorMessage = error?.response?.data?.error?.message || error.message;
      debug('Playlist creation error', errorMessage);
      setError({ type: 'error', message: `Error creating playlist: ${errorMessage}` });
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
          {analyzing ? 'Analyzing Your Music' : 'Loading Your Library'}
        </Typography>
        <Box sx={{ width: '300px', position: 'relative' }}>
          <LinearProgress 
            variant={analyzing ? 'determinate' : 'indeterminate'}
            value={progress}
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
          {analyzing && (
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ mt: 1, textAlign: 'center' }}
            >
              {progress.toFixed(1)}%
            </Typography>
          )}
        </Box>
        <Typography color="textSecondary">
          {analyzing 
            ? 'Creating your personalized mood playlists...'
            : 'Loading your Spotify library...'}
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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
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
          <Button
            startIcon={<Refresh />}
            onClick={() => loadLikedSongs()}
            disabled={loading || analyzing}
            variant="outlined"
            color="primary"
            sx={{ borderRadius: '50px' }}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert 
            severity={error.type || 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error.message}
          </Alert>
        )}

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
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={moodCategories[mood].image}
                  alt={moodCategories[mood].name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      color: moodCategories[mood].color,
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
                      mb: 2,
                      flexGrow: 1
                    }}
                  >
                    {songs.length} songs match this mood
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => createPlaylist(mood)}
                    disabled={songs.length === 0 || loading || analyzing}
                    startIcon={<PlaylistAdd />}
                    sx={{ 
                      mt: 'auto',
                      borderRadius: '50px',
                      textTransform: 'none',
                      backgroundColor: moodCategories[mood].color,
                      '&:hover': {
                        backgroundColor: moodCategories[mood].color,
                        filter: 'brightness(1.1)'
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

  return loading || analyzing ? renderLoadingState() : renderMoodPlaylists();
};

export default Dashboard;
