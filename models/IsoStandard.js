const mongoose = require('mongoose');

const isoStandardSchema = new mongoose.Schema({
    icon: { type: String, default: 'verified' },
    code: { type: String, required: true },
    sublabel: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('IsoStandard', isoStandardSchema);
