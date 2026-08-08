const mongoose = require('mongoose');

const researchRunSchema = new mongoose.Schema({
    runAt: { type: Date, default: Date.now },
    queries: [{ type: String }],
    articlesFound: { type: Number, default: 0 },
    prospectsCreated: { type: Number, default: 0 },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    error: { type: String, default: '' },
    trigger: { type: String, enum: ['manual', 'cron'], default: 'manual' }
}, { timestamps: true });

module.exports = mongoose.model('ResearchRun', researchRunSchema);
