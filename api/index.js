require('dotenv').config();

// Vercel serverless entry point. No app.listen(), no node-cron (needs a
// persistent process — the research schedule runs via Vercel Cron hitting
// /admin/research/run-cron instead, see vercel.json + routes/admin/research.js).
// Express apps are callable as (req, res) => {}, which is exactly what
// @vercel/node expects from a function's default export.
module.exports = require('../app');
