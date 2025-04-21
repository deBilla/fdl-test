require('dotenv').config(); // Load .env variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const linkRoutes = require('./routes/links'); // Contains all route definitions
const linkController = require('./controllers/linkController'); // Need controller for root route

const app = express();
const PORT = process.env.PORT || 5001;

// --- Database Connections ---
// MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Redis connection is handled within the controller for this example

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL })); // Allow requests from React app
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Routes ---
// API routes (for Dashboard)
app.use('/api/links', linkRoutes); // Mounts POST /api/links, GET /api/links

// Deferred deep linking check route
app.use('/api', linkRoutes); // Mounts GET /api/deferred/:deviceId


// Link Resolution Route (Root Level)
// We use the controller function directly here for the root path parameter
app.get('/:shortCode', linkController.resolveLink);


// --- Basic Root / Health Check ---
app.get('/', (req, res) => {
  res.send('Dynamic Link Server is running!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
