#!/usr/bin/env node

/**
 * Minimal server test to isolate the issue
 */

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
});