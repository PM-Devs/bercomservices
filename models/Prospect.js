const mongoose = require('mongoose');

const sourceArticleSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    link: { type: String, default: '' },
    source: { type: String, default: '' },
    publishedAt: { type: Date }
}, { _id: false });

const prospectSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    country: { type: String, default: 'Equatorial Guinea' },
    summary: { type: String, default: '' },
    reasoning: { type: String, default: '' },
    matchedServices: [{ type: String }],
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    sourceArticles: [sourceArticleSchema],
    status: {
        type: String,
        enum: ['pending_review', 'approved', 'rejected', 'contacted'],
        default: 'pending_review'
    },
    researchRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchRun' }
}, { timestamps: true });

module.exports = mongoose.model('Prospect', prospectSchema);
