const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    icon: { type: String, default: 'business' },
    name: { type: String, required: true },
    logo: { type: String, default: '' },
    tagline: { type: String, default: '' },
    dateBadge: { type: String, default: '' },
    engagementPeriod: { type: String, default: '' },
    scopeOfWork: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
