# SpotiThemes

A web application that analyzes your Spotify liked songs and generates mood-based playlists.

## Prerequisites

1. Node.js and npm installed on your system
2. A Spotify Developer account and registered application
   - Go to https://developer.spotify.com/dashboard
   - Create a new application
   - Add http://localhost:8080/SpotiThemes as a redirect URI

## Setup

1. Install Node.js from https://nodejs.org/
2. Clone this repository
3. Run `npm install` to install dependencies
4. Create a `.env` file with your Spotify credentials:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_client_id_here
   ```
5. Run `npm start` to start the development server
