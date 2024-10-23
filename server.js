const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql');
const session = require('express-session');
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        maxAge: 60000, // Session expiration time
    },
}));

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Multer setup for file uploads (if needed)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Modular route handling
const membersRoutes = require('./routes/members')(db);
const supplementsRoutes = require('./routes/supplements')(db);
app.use('/members', membersRoutes);
app.use('/supplements', supplementsRoutes);

// Middleware for authentication
const checkAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login.html');
};

// Serve the login page
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the welcome page
app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Basic auth check (should be connected to a user DB in production)
    if (username === 'admin' && password === 'admin') {
        req.session.user = username;
        return res.redirect('/members.html'); // Redirect to members page
    }
    return res.status(401).json({ message: 'Invalid credentials' });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.clearCookie('sid');
        return res.redirect('/login.html');
    });
});

// Serve members and supplements pages
app.get('/members.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'members.html'));
});
app.get('/supplements.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'supplements.html'));
});

// Serve the statistics page
app.get('/statistics.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'statistics.html'));
});

// API endpoint to fetch data for visualization
app.get('/api/statistics', checkAuth, (req, res) => {
    db.query('SELECT membership_type, COUNT(*) AS count FROM members GROUP BY membership_type', (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch statistics' });
        }
        res.json(results);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
