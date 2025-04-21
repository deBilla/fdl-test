const express = require('express');
const linkController = require('../controllers/linkController');

const router = express.Router();

// === API Routes (for Dashboard) ===
// Base path /api/links (defined in server.js)
router.post('/', linkController.createLink);    // POST /api/links
router.get('/', linkController.getLinks);      // GET /api/links

// === Deferred Deep Link Check Route ===
// Base path /api defined in server.js
router.get('/deferred/:deviceId', linkController.checkDeferredLink); // GET /api/deferred/some-unique-id

// === Link Resolution Route ===
// IMPORTANT: This needs to be mounted at the ROOT level in server.js
// We define the logic here but mount it separately.
router.get('/:shortCode', linkController.resolveLink); // GET /:someShortCode

module.exports = router; // Exporting the router containing all definitions
