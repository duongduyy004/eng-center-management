const express = require('express');
const path = require('path');

// Serve static files from uploads directory
const serveUploads = express.static(
    path.join(__dirname, '../../uploads'),
    {
        maxAge: '1d', // Cache for 1 day
        etag: true,
        lastModified: true
    }
);

module.exports = {
    serveUploads
};