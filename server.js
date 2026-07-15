const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8888;

// Serve static files
app.use(express.json());
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
                    cover: "/assets/cover.jpg", // Default cover
                    url: "#"
                };
            });

        res.json(songs);
    });
});

// Helper to get client IP Address
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || req.ip;
};

// GET /api/comments - get comments with pagination
app.get('/api/comments', (req, res) => {
    const commentsFile = path.join(__dirname, 'comments.json');
    let comments = [];
    if (fs.existsSync(commentsFile)) {
        try {
            comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
        } catch (e) {
            console.error('Error parsing comments.json:', e);
        }
    }

    // Sort comments by timestamp descending (newest first)
    comments.sort((a, b) => b.timestamp - a.timestamp);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const totalComments = comments.length;
    const totalPages = Math.ceil(totalComments / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedComments = comments.slice(startIndex, endIndex).map(c => ({
        id: c.id,
        name: c.name,
        text: c.text,
        timestamp: c.timestamp
    }));

    res.json({
        comments: paginatedComments,
        currentPage,
        totalPages,
        totalComments
    });
});

// POST /api/comments - post new comment with 6-hour rate limit per IP
app.post('/api/comments', (req, res) => {
    const { name, text } = req.body;

    if (!name || !text || typeof name !== 'string' || typeof text !== 'string') {
        return res.status(400).json({ error: 'Имя и текст комментария обязательны.' });
    }

    const trimmedName = name.trim();
    const trimmedText = text.trim();

    if (trimmedName.length === 0 || trimmedText.length === 0) {
        return res.status(400).json({ error: 'Имя и текст комментария не могут быть пустыми.' });
    }

    if (trimmedName.length > 30) {
        return res.status(400).json({ error: 'Имя слишком длинное (макс. 30 символов).' });
    }

    if (trimmedText.length > 400) {
        return res.status(400).json({ error: 'Комментарий слишком длинный (макс. 400 символов).' });
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    const commentsFile = path.join(__dirname, 'comments.json');
    let comments = [];
    if (fs.existsSync(commentsFile)) {
        try {
            comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
        } catch (e) {
            console.error('Error parsing comments.json:', e);
        }
    }

    // Check rate limit: 1 comment per IP in 6 hours
    const lastCommentFromIp = comments.find(c => c.ip === ip && (now - c.timestamp) < SIX_HOURS);

    if (lastCommentFromIp) {
        const timeLeftMs = SIX_HOURS - (now - lastCommentFromIp.timestamp);
        const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutesLeft = Math.ceil((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));

        let timeLeftString = '';
        if (hoursLeft > 0) {
            timeLeftString += `${hoursLeft} ч. `;
        }
        timeLeftString += `${minutesLeft} мин.`;

        return res.status(429).json({
            error: `С одного IP можно оставлять комментарий раз в 6 часов. Попробуйте снова через ${timeLeftString}.`
        });
    }

    // Create new comment
    const newComment = {
        id: Math.random().toString(36).substring(2, 9),
        name: trimmedName,
        text: trimmedText,
        timestamp: now,
        ip: ip
    };

    comments.push(newComment);

    // Save back to file
    try {
        fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing to comments.json:', e);
        return res.status(500).json({ error: 'Ошибка сервера при сохранении комментария.' });
    }

    res.status(201).json({
        message: 'Комментарий успешно добавлен!',
        comment: {
            id: newComment.id,
            name: newComment.name,
            text: newComment.text,
            timestamp: newComment.timestamp
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
