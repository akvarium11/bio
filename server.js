const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8888;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API endpoint to get list of local songs
app.get('/api/songs', (req, res) => {
    const songsDir = path.join(__dirname, 'assets', 'songs');
    if (!fs.existsSync(songsDir)) {
        return res.json([]);
    }

    fs.readdir(songsDir, (err, files) => {
        if (err) {
            console.error('Error reading songs directory:', err);
            return res.status(500).json({ error: 'Failed to read songs directory' });
        }

        const songs = files
            .filter(file => file.endsWith('.mp3'))
            .map(file => {
                const title = file.replace('.mp3', '');
                return {
                    title: title,
                    src: `/assets/songs/${file}`,
                    cover: "https://r2.fakecrime.bio/tracks/covers/b266f5e7-b578-42ee-a159-3e17a75a5250.jpg", // Default cover
                    url: "#"
                };
            });

        res.json(songs);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
